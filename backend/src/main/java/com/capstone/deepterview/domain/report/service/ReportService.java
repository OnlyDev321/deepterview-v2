package com.capstone.deepterview.domain.report.service;

import com.capstone.deepterview.domain.answer.domain.Answer;
import com.capstone.deepterview.domain.answer.domain.NonverbalAnalysis;
import com.capstone.deepterview.domain.answer.domain.SpeechAnalysis;
import com.capstone.deepterview.domain.answer.domain.StarAnalysis;
import com.capstone.deepterview.domain.answer.repository.AnswerRepository;
import com.capstone.deepterview.domain.interview.domain.InterviewSession;
import com.capstone.deepterview.domain.interview.domain.SessionStatus;
import com.capstone.deepterview.domain.interview.dto.response.SessionReportResponse;
import com.capstone.deepterview.domain.interview.repository.InterviewSessionRepository;
import com.capstone.deepterview.domain.report.domain.FeedbackReport;
import com.capstone.deepterview.domain.report.domain.Grade;
import com.capstone.deepterview.domain.report.repository.FeedbackReportRepository;
import com.capstone.deepterview.global.ai.LlmFeedbackService;
import com.capstone.deepterview.global.ai.LlmReportSummary;
import com.capstone.deepterview.global.exception.CustomException;
import com.capstone.deepterview.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ReportService {

    private final InterviewSessionRepository interviewSessionRepository;
    private final FeedbackReportRepository feedbackReportRepository;
    private final AnswerRepository answerRepository;
    private final LlmFeedbackService llmFeedbackService;

    public SessionReportResponse getReport(Long userId, Long sessionId) {
        InterviewSession session = getOwnedSession(userId, sessionId);
        if (session.getStatus() != SessionStatus.COMPLETED) {
            throw new CustomException(ErrorCode.VALIDATION_ERROR, "세션이 완료되지 않아 리포트를 조회할 수 없습니다.");
        }
        return feedbackReportRepository.findBySession_Id(sessionId)
                .map(SessionReportResponse::of)
                .orElseThrow(() -> new CustomException(ErrorCode.NOT_FOUND, "종합 리포트가 아직 생성되지 않았습니다."));
    }

    @Transactional
    public SessionReportResponse generateOrGetReport(Long userId, Long sessionId) {
        InterviewSession session = getOwnedSession(userId, sessionId);

        Optional<FeedbackReport> existing = feedbackReportRepository.findBySession_Id(sessionId);
        if (existing.isPresent()) {
            return SessionReportResponse.of(existing.get());
        }

        if (session.getStatus() != SessionStatus.COMPLETED) {
            throw new CustomException(ErrorCode.VALIDATION_ERROR, "완료된 세션만 리포트를 생성할 수 있습니다.");
        }

        List<Answer> answers = answerRepository.findBySessionIdWithQuestionOrderByOrderNum(sessionId);

        if (answers.isEmpty()) {
            throw new CustomException(ErrorCode.VALIDATION_ERROR, "리포트를 생성하려면 최소 1개 이상의 답변이 필요합니다.");
        }

        Float speechScore = computeSpeechScore(answers);
        Float nonverbalScore = computeNonverbalScore(answers);
        Float contentScore = computeContentScore(answers);
        Float overallScore = computeOverallScore(speechScore, nonverbalScore, contentScore);
        Grade grade = computeGrade(overallScore);

        LlmReportSummary summary = generateReportSummarySafely(session, answers);

        FeedbackReport report = feedbackReportRepository.save(FeedbackReport.create(
                session,
                speechScore,
                nonverbalScore,
                contentScore,
                overallScore,
                grade,
                summary.strengthSummary(),
                summary.weaknessSummary(),
                summary.improvementPriority(),
                summary.aiSummary()));

        return SessionReportResponse.of(report);
    }

    private Float computeSpeechScore(List<Answer> answers) {
        List<Float> scores = answers.stream()
                .map(Answer::getSpeechAnalysis)
                .filter(Objects::nonNull)
                .map(s -> {
                    float sum = 0;
                    int count = 0;
                    if (s.getPaceScore() != null) {
                        sum += s.getPaceScore();
                        count++;
                    }
                    if (s.getClarityScore() != null) {
                        sum += s.getClarityScore();
                        count++;
                    }
                    return count > 0 ? sum / count : null;
                })
                .filter(Objects::nonNull)
                .toList();
        return scores.isEmpty() ? null
                : (float) scores.stream().mapToDouble(Float::doubleValue).average().orElse(0);
    }

    private Float computeNonverbalScore(List<Answer> answers) {
        List<Float> scores = answers.stream()
                .map(Answer::getNonverbalAnalysis)
                .filter(Objects::nonNull)
                .map(NonverbalAnalysis::getEyeContactScore)
                .filter(Objects::nonNull)
                .toList();
        return scores.isEmpty() ? null
                : (float) scores.stream().mapToDouble(Float::doubleValue).average().orElse(0);
    }

    private Float computeContentScore(List<Answer> answers) {
        List<Float> scores = answers.stream()
                .map(Answer::getStarAnalysis)
                .filter(Objects::nonNull)
                .map(StarAnalysis::getTotalScore)
                .filter(Objects::nonNull)
                .map(s -> s / 40f * 100f) // totalScore 최대 40점 → 0~100 정규화
                .toList();
        return scores.isEmpty() ? null
                : (float) scores.stream().mapToDouble(Float::doubleValue).average().orElse(0);
    }

    private Float computeOverallScore(Float speech, Float nonverbal, Float content) {
        float weightedSum = 0;
        float totalWeight = 0;
        if (speech != null) {
            weightedSum += speech * 0.3f;
            totalWeight += 0.3f;
        }
        if (nonverbal != null) {
            weightedSum += nonverbal * 0.3f;
            totalWeight += 0.3f;
        }
        if (content != null) {
            weightedSum += content * 0.4f;
            totalWeight += 0.4f;
        }
        return totalWeight == 0 ? null : weightedSum / totalWeight;
    }

    private Grade computeGrade(Float score) {
        if (score == null)
            return Grade.D;
        if (score >= 95)
            return Grade.S;
        if (score >= 85)
            return Grade.A;
        if (score >= 75)
            return Grade.B;
        if (score >= 65)
            return Grade.C;
        return Grade.D;
    }

    private LlmReportSummary generateReportSummarySafely(InterviewSession session, List<Answer> answers) {
        try {
            return llmFeedbackService.generateReportSummary(session, answers);
        } catch (Exception e) {
            log.error("LLM 종합 리포트 요약 생성 실패 sessionId={}", session.getId(), e);
            return new LlmReportSummary(
                    "답변 데이터가 저장되었습니다. AI 요약은 일시적으로 생성할 수 없습니다.",
                    "LLM API 연결 또는 API 키 설정을 확인해 주세요.",
                    "Anthropic API 설정 후 리포트를 다시 생성해 주세요.",
                    "면접 세션 기록 완료 (AI 요약 보류)");
        }
    }

    private InterviewSession getOwnedSession(Long userId, Long sessionId) {
        return interviewSessionRepository.findByIdAndUserId(sessionId, userId)
                .orElseThrow(() -> new CustomException(ErrorCode.NOT_FOUND, "세션을 찾을 수 없습니다."));
    }
}
