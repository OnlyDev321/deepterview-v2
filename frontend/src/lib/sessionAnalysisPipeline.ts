import { answerService } from "../services/answerService";
import { reportService } from "../services/reportService";
import { sessionService } from "../services/sessionService";
import type {
  AnswerAnalysis,
  SessionAnalysisStatus,
  SessionReport,
} from "../types";

const POLL_INTERVAL_MS = 3000;
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

function analysisTargetCount(
  answersWithVideo: number,
  answeredCount: number,
): number {
  if (answersWithVideo > 0) {
    return answersWithVideo;
  }
  return answeredCount;
}

function isStatusReady(
  analysesReadyCount: number,
  answersWithVideoCount: number,
  answeredCount: number,
): boolean {
  const target = analysisTargetCount(answersWithVideoCount, answeredCount);
  if (target === 0) {
    return true;
  }
  return analysesReadyCount >= target;
}

async function fetchAnalysisStatusSafe(
  sessionId: number,
): Promise<SessionAnalysisStatus | null> {
  try {
    return await sessionService.getAnalysisStatus(sessionId);
  } catch (err) {
    console.warn(
      "analysis-status API unavailable, using fallback polling:",
      err,
    );
    return null;
  }
}

async function countReadyAnalyses(answerIds: number[]): Promise<number> {
  if (answerIds.length === 0) {
    return 0;
  }

  const batchSize = 3;
  let ready = 0;
  for (let i = 0; i < answerIds.length; i += batchSize) {
    const batch = answerIds.slice(i, i + batchSize);
    const results = await Promise.all(
      batch.map((id) => answerService.getAnalysis(id).catch(() => null)),
    );
    ready += results.filter((r) => r && isPythonAnalysisReady(r)).length;
  }
  return ready;
}

async function pollUntilAnalysesReady(
  sessionId: number,
  onProgress?: (progress: PipelineProgress) => void,
): Promise<{ timedOut: boolean; existingReport: SessionReport | null }> {
  let timedOut = false;
  const useStatusApi = (await fetchAnalysisStatusSafe(sessionId)) !== null;

  for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
    if (useStatusApi) {
      const status = await fetchAnalysisStatusSafe(sessionId);
      if (!status) {
        break;
      }

      const target = analysisTargetCount(
        status.answersWithVideoCount,
        status.answeredCount,
      );

      onProgress?.({
        phase: "polling",
        message: "AI가 답변 영상을 분석하고 있습니다...",
        completedAnswers: status.analysesReadyCount,
        totalAnswers: target,
      });

      if (status.feedbackReportExists) {
        try {
          const report = await reportService.getSessionReport(sessionId);
          return { timedOut: false, existingReport: report };
        } catch {
          /* continue */
        }
      }

      if (
        isStatusReady(
          status.analysesReadyCount,
          status.answersWithVideoCount,
          status.answeredCount,
        )
      ) {
        return { timedOut: false, existingReport: null };
      }
    } else {
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

      const ready = await countReadyAnalyses(answerIds);

      onProgress?.({
        phase: "polling",
        message: "AI가 답변 영상을 분석하고 있습니다...",
        completedAnswers: ready,
        totalAnswers: answerIds.length,
      });

      if (answerIds.length === 0 || ready >= answerIds.length) {
        return { timedOut: false, existingReport: null };
      }
    }

    if (attempt === MAX_POLL_ATTEMPTS - 1) {
      timedOut = true;
      break;
    }

    await sleep(POLL_INTERVAL_MS);
  }

  return { timedOut, existingReport: null };
}

export async function runSessionAnalysisPipeline(
  sessionId: number,
  options?: {
    onProgress?: (progress: PipelineProgress) => void;
    skipPythonTrigger?: boolean;
  },
): Promise<PipelineResult> {
  const onProgress = options?.onProgress;

  try {
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

    onProgress?.({
      phase: "polling",
      message: "AI가 답변 영상을 분석하고 있습니다...",
      completedAnswers: 0,
      totalAnswers: 0,
    });

    const pollResult = await pollUntilAnalysesReady(sessionId, onProgress);

    if (pollResult.existingReport) {
      onProgress?.({
        phase: "done",
        message: "피드백 리포트가 준비되었습니다.",
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

    if (answerIds.length > 0) {
      onProgress?.({
        phase: "polling",
        message: "답변별 상세 피드백을 생성하고 있습니다...",
        completedAnswers: 0,
        totalAnswers: answerIds.length,
      });

      let llmReady = 0;
      const batchSize = 3;
      for (let i = 0; i < answerIds.length; i += batchSize) {
        const batch = answerIds.slice(i, i + batchSize);
        const results = await Promise.all(
          batch.map((id) => answerService.getAnalysis(id).catch(() => null)),
        );
        llmReady += results.filter(
          (r) => r && (r.llmFeedback || isPythonAnalysisReady(r)),
        ).length;
        onProgress?.({
          phase: "polling",
          message: "답변별 상세 피드백을 생성하고 있습니다...",
          completedAnswers: llmReady,
          totalAnswers: answerIds.length,
        });
      }
    }

    onProgress?.({
      phase: "creating-report",
      message: "종합 피드백 리포트를 생성하고 있습니다...",
      completedAnswers: 0,
      totalAnswers: 0,
    });

    const report = await reportService.createSessionReport(sessionId);

    onProgress?.({
      phase: "done",
      message: pollResult.timedOut
        ? "일부 분석이 아직 진행 중일 수 있으나 리포트가 생성되었습니다."
        : "피드백 리포트가 준비되었습니다.",
      completedAnswers: report ? 1 : 0,
      totalAnswers: 1,
    });

    return { success: true, report, timedOut: pollResult.timedOut };
  } catch (err) {
    console.error("Session analysis pipeline failed:", err);
    onProgress?.({
      phase: "error",
      message:
        "리포트 생성 중 오류가 발생했습니다. 히스토리에서 다시 시도할 수 있습니다.",
      completedAnswers: 0,
      totalAnswers: 0,
    });
    return { success: false, report: null, timedOut: false };
  }
}
