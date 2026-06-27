import i18n from "../i18n/i18n";
import { answerService } from "../services/answerService";
import { reportService } from "../services/reportService";
import { sessionService } from "../services/sessionService";
import { markAnalyzing, unmarkAnalyzing } from "./analysisTracker";
import { addNotification } from "./notificationTracker";
import type {
  AnswerAnalysis,
  SessionReport,
} from "../types";

const POLL_INTERVAL_MS = 1000;
const MAX_POLL_ATTEMPTS = 60;

export type PipelinePhase = "polling" | "creating-report" | "done" | "error";

export interface PipelineProgress {
  phase: PipelinePhase;
  message: string;
  completedAnswers: number;
  totalAnswers: number;
}

export interface PipelineResult {
  success: boolean;
  report: SessionReport | null;
  timedOut: boolean;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isPythonAnalysisReady(analysis: AnswerAnalysis): boolean {
  return Boolean(analysis.speechAnalysis || analysis.nonverbalAnalysis);
}

async function pollUntilAnalysesReady(
  sessionId: number,
  onProgress?: (progress: PipelineProgress) => void,
  shouldCancel?: () => boolean,
): Promise<{ timedOut: boolean; existingReport: SessionReport | null }> {
  for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
    if (shouldCancel?.()) return { timedOut: false, existingReport: null };

    try {
      const progress = await sessionService.getAnalysisProgress(sessionId);
      const videoTarget = Math.max(progress.answersWithVideo, progress.totalAnswers);

      onProgress?.({
        phase: "polling",
        message: videoTarget > 0
          ? i18n.t("pipeline.analyzing_video")
          : i18n.t("pipeline.processing_data"),
        completedAnswers: progress.speechAnalyzed,
        totalAnswers: videoTarget || 1,
      });

      if (progress.reportReady) {
        try {
          const report = await reportService.getSessionReport(sessionId);
          return { timedOut: false, existingReport: report };
        } catch {
          /* continue */
        }
      }

      const allSpeechDone = videoTarget === 0 || progress.speechAnalyzed >= videoTarget;
      const allNonverbalDone = videoTarget === 0 || progress.nonverbalAnalyzed >= videoTarget;
      const allStarDone = progress.totalAnswers === 0 || progress.starAnalyzed >= progress.totalAnswers;
      if (allSpeechDone && allNonverbalDone && allStarDone) {
        return { timedOut: false, existingReport: null };
      }
    } catch {
      try {
        const report = await reportService.getSessionReport(sessionId);
        return { timedOut: false, existingReport: report };
      } catch {
        /* not created yet */
      }

      const detail = await sessionService.getSessionDetail(sessionId);
      const answerIds = detail.questions
        .map((q) => q.answerId)
        .filter((id): id is number => id != null);

      if (answerIds.length > 0) {
        const batchSize = 3;
        let ready = 0;
        for (let i = 0; i < answerIds.length; i += batchSize) {
          const batch = answerIds.slice(i, i + batchSize);
          const results = await Promise.all(
            batch.map((id) => answerService.getAnalysis(id).catch(() => null)),
          );
          ready += results.filter((r) => r && isPythonAnalysisReady(r)).length;
        }
        onProgress?.({
          phase: "polling",
          message: i18n.t("pipeline.analyzing_video"),
          completedAnswers: ready,
          totalAnswers: answerIds.length,
        });
        if (ready >= answerIds.length) {
          return { timedOut: false, existingReport: null };
        }
      } else {
        return { timedOut: false, existingReport: null };
      }
    }

    if (attempt === MAX_POLL_ATTEMPTS - 1) {
      return { timedOut: true, existingReport: null };
    }

    await sleep(POLL_INTERVAL_MS);
    if (shouldCancel?.()) return { timedOut: false, existingReport: null };
  }

  return { timedOut: false, existingReport: null };
}

export async function runSessionAnalysisPipeline(
  sessionId: number,
  options?: {
    onProgress?: (progress: PipelineProgress) => void;
    skipPythonTrigger?: boolean;
    cancelledRef?: { current: boolean };
  },
): Promise<PipelineResult> {
  markAnalyzing(sessionId);
  const onProgress = options?.onProgress;
  const shouldCancel = () => options?.cancelledRef?.current === true;

  try {
    if (shouldCancel()) return { success: false, report: null, timedOut: false };

    if (!options?.skipPythonTrigger) {
      try {
        await sessionService.generatePythonReport(sessionId);
      } catch (err) {
        console.warn(
          "Python report trigger failed (may already be running):",
          err,
        );
      }
    }

    if (shouldCancel()) return { success: false, report: null, timedOut: false };

    onProgress?.({
      phase: "polling",
      message: i18n.t("pipeline.analyzing_video"),
      completedAnswers: 0,
      totalAnswers: 0,
    });

    const pollResult = await pollUntilAnalysesReady(sessionId, onProgress, shouldCancel);
    if (shouldCancel()) return { success: false, report: null, timedOut: false };

    if (pollResult.existingReport) {
      addNotification(sessionId);
      onProgress?.({
        phase: "done",
        message: i18n.t("pipeline.report_ready"),
        completedAnswers: 1,
        totalAnswers: 1,
      });
      return {
        success: true,
        report: pollResult.existingReport,
        timedOut: false,
      };
    }

    const detail = await sessionService.getSessionDetail(sessionId);
    const answerIds = detail.questions
      .map((q) => q.answerId)
      .filter((id): id is number => id != null);

    if (shouldCancel()) return { success: false, report: null, timedOut: false };

    if (answerIds.length > 0) {
      onProgress?.({
        phase: "polling",
        message: i18n.t("pipeline.generating_detail"),
        completedAnswers: 0,
        totalAnswers: answerIds.length,
      });

      let llmReady = 0;
      const batchSize = 3;
      for (let i = 0; i < answerIds.length; i += batchSize) {
        if (shouldCancel()) return { success: false, report: null, timedOut: false };

        const batch = answerIds.slice(i, i + batchSize);
        const results = await Promise.all(
          batch.map((id) => answerService.getAnalysis(id).catch(() => null)),
        );
        llmReady += results.filter(
          (r) => r && (r.llmFeedback || isPythonAnalysisReady(r)),
        ).length;
        onProgress?.({
          phase: "polling",
          message: i18n.t("pipeline.generating_detail"),
          completedAnswers: llmReady,
          totalAnswers: answerIds.length,
        });
      }
    }

    if (shouldCancel()) return { success: false, report: null, timedOut: false };

    onProgress?.({
      phase: "creating-report",
      message: i18n.t("pipeline.generating_report"),
      completedAnswers: 0,
      totalAnswers: 0,
    });

    const report = await reportService.createSessionReport(sessionId);

    if (report) addNotification(sessionId);

    onProgress?.({
      phase: "done",
      message: pollResult.timedOut
        ? i18n.t("pipeline.report_partial")
        : i18n.t("pipeline.report_ready"),
      completedAnswers: report ? 1 : 0,
      totalAnswers: 1,
    });

    return { success: true, report, timedOut: pollResult.timedOut };
  } catch (err) {
    console.error("Session analysis pipeline failed:", err);
    onProgress?.({
      phase: "error",
      message:
        i18n.t("pipeline.report_error"),
      completedAnswers: 0,
      totalAnswers: 0,
    });
    return { success: false, report: null, timedOut: false };
  } finally {
    unmarkAnalyzing(sessionId);
  }
}
