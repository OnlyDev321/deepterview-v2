package com.capstone.deepterview.api;

import com.capstone.deepterview.domain.interview.domain.JobCategory;
import com.capstone.deepterview.domain.interview.repository.JobCategoryRepository;
import com.capstone.deepterview.global.ai.LlmAnalysisResult;
import com.capstone.deepterview.global.ai.LlmFeedbackService;
import com.capstone.deepterview.global.ai.LlmReportSummary;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.closeTo;
import static org.hamcrest.Matchers.notNullValue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * 피드백 리포트 생성·조회 통합 테스트
 *
 * LlmFeedbackService를 Mock으로 대체하여 실제 Claude API 호출 없이 검증합니다.
 * - POST /api/v1/sessions/{sessionId}/report : 리포트 생성
 * - GET  /api/v1/sessions/{sessionId}/report : 리포트 조회
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles({"test", "local"})
class ReportGenerationApiTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private JobCategoryRepository jobCategoryRepository;

    @MockitoBean
    private LlmFeedbackService llmFeedbackService;

    // ── stub 설정 ──────────────────────────────────────────────────────────────

    @BeforeEach
    void stubLlm() {
        // getAnalysis 호출 시: LlmFeedback + StarAnalysis 생성용
        // totalScore = (7.0 + 8.0 + 7.5 + 8.5) / 4 = 7.75 → contentScore = 77.5
        var feedbackPart = new LlmAnalysisResult.FeedbackPart(
                "구조화된 STAR 방식으로 답변했습니다.",
                "결과에 구체적 수치가 부족합니다.",
                "STAR 기법의 Result 항목을 보강하세요.",
                List.of("가장 어려웠던 점은?", "팀원과의 협업 방식은?")
        );
        var starPart = new LlmAnalysisResult.StarPart(
                7.0f, 8.0f, 7.5f, 8.5f,
                "상황 설명이 명확합니다.",
                "목표가 구체적으로 제시되었습니다.",
                "행동 단계가 잘 서술되었습니다.",
                "결과 수치가 부족합니다."
        );
        when(llmFeedbackService.generateAnalysis(any(), any()))
                .thenReturn(new LlmAnalysisResult(feedbackPart, starPart));

        when(llmFeedbackService.generateReportSummary(any(), any()))
                .thenReturn(new LlmReportSummary(
                        "전반적으로 구조화된 답변을 제공했습니다.",
                        "구체적 수치 제시가 부족합니다.",
                        "STAR 기법의 Result 항목 보강이 필요합니다.",
                        "전반적으로 안정적인 면접이었습니다."
                ));
    }

    // ── 테스트 1: 정상 생성 ────────────────────────────────────────────────────

    @Test
    @DisplayName("POST /report: getAnalysis 호출 후 COMPLETED 세션 → contentScore·grade·텍스트 정상 반환")
    void generateReport_withStarAnalysis_returnsComputedScoresAndSummary() throws Exception {
        String token = loginAndGetToken("report-gen-" + UUID.randomUUID() + "@test.com");
        JobCategory category = jobCategoryRepository.save(JobCategory.of("백엔드-" + UUID.randomUUID(), "백엔드 개발"));
        Long sessionId = createSession(token, category.getId());
        Long questionId = getFirstQuestionId(token, sessionId);
        long answerId = submitAnswer(token, questionId);

        // getAnalysis 호출 → LlmFeedback + StarAnalysis DB 저장
        mockMvc.perform(get("/api/v1/answers/{id}/analysis", answerId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());

        completeSession(token, sessionId);

        mockMvc.perform(post("/api/v1/sessions/{sessionId}/report", sessionId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.sessionId").value(sessionId))
                .andExpect(jsonPath("$.data.grade").value("B"))           // 77.5점 → B
                .andExpect(jsonPath("$.data.overallScore").value(closeTo(77.5, 0.5)))
                .andExpect(jsonPath("$.data.contentScore").value(closeTo(77.5, 0.5)))
                .andExpect(jsonPath("$.data.speechScore").isEmpty())       // Python 콜백 없음
                .andExpect(jsonPath("$.data.nonverbalScore").isEmpty())
                .andExpect(jsonPath("$.data.strengthSummary").value("전반적으로 구조화된 답변을 제공했습니다."))
                .andExpect(jsonPath("$.data.weaknessSummary").value("구체적 수치 제시가 부족합니다."))
                .andExpect(jsonPath("$.data.improvementPriority").value("STAR 기법의 Result 항목 보강이 필요합니다."))
                .andExpect(jsonPath("$.data.aiSummary").value("전반적으로 안정적인 면접이었습니다."));
    }

    // ── 테스트 2: 분석 없이 생성 (Python 미호출) ───────────────────────────────

    @Test
    @DisplayName("POST /report: 분석 데이터 없이도 리포트 생성 → 점수 null, 텍스트 요약은 정상 반환")
    void generateReport_noAnalysisData_returnsNullScoresWithSummary() throws Exception {
        String token = loginAndGetToken("report-nodata-" + UUID.randomUUID() + "@test.com");
        JobCategory category = jobCategoryRepository.save(JobCategory.of("PM-" + UUID.randomUUID(), "프로덕트"));
        Long sessionId = createSession(token, category.getId());
        Long questionId = getFirstQuestionId(token, sessionId);
        submitAnswer(token, questionId);
        completeSession(token, sessionId);

        mockMvc.perform(post("/api/v1/sessions/{sessionId}/report", sessionId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.grade").value("D"))
                .andExpect(jsonPath("$.data.overallScore").isEmpty())
                .andExpect(jsonPath("$.data.contentScore").isEmpty())
                .andExpect(jsonPath("$.data.strengthSummary").value(notNullValue()));
    }

    // ── 테스트 3: 멱등성 ────────────────────────────────────────────────────────

    @Test
    @DisplayName("POST /report: 이미 리포트 존재 시 LLM 재호출 없이 기존 리포트 반환")
    void generateReport_calledTwice_doesNotCallLlmAgain() throws Exception {
        String token = loginAndGetToken("report-idem-" + UUID.randomUUID() + "@test.com");
        JobCategory category = jobCategoryRepository.save(JobCategory.of("프론트-" + UUID.randomUUID(), "프론트엔드"));
        Long sessionId = createSession(token, category.getId());
        Long questionId = getFirstQuestionId(token, sessionId);
        submitAnswer(token, questionId);
        completeSession(token, sessionId);

        MvcResult first = mockMvc.perform(post("/api/v1/sessions/{sessionId}/report", sessionId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn();

        MvcResult second = mockMvc.perform(post("/api/v1/sessions/{sessionId}/report", sessionId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn();

        String firstSummary = objectMapper.readTree(first.getResponse().getContentAsString())
                .path("data").path("aiSummary").asText();
        String secondSummary = objectMapper.readTree(second.getResponse().getContentAsString())
                .path("data").path("aiSummary").asText();

        assertThat(firstSummary).isEqualTo(secondSummary);
        verify(llmFeedbackService, times(1)).generateReportSummary(any(), any());
    }

    // ── 테스트 4: READY 상태에서 생성 시도 ────────────────────────────────────

    @Test
    @DisplayName("POST /report: READY 세션이면 400 VALIDATION_ERROR")
    void generateReport_sessionReady_returns400() throws Exception {
        String token = loginAndGetToken("report-ready-" + UUID.randomUUID() + "@test.com");
        JobCategory category = jobCategoryRepository.save(JobCategory.of("DevOps-" + UUID.randomUUID(), "DevOps"));
        Long sessionId = createSession(token, category.getId());

        mockMvc.perform(post("/api/v1/sessions/{sessionId}/report", sessionId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
    }

    // ── 테스트 5: IN_PROGRESS 상태에서 생성 시도 ──────────────────────────────

    @Test
    @DisplayName("POST /report: IN_PROGRESS 세션이면 400 VALIDATION_ERROR")
    void generateReport_sessionInProgress_returns400() throws Exception {
        String token = loginAndGetToken("report-inprog-" + UUID.randomUUID() + "@test.com");
        JobCategory category = jobCategoryRepository.save(JobCategory.of("QA-" + UUID.randomUUID(), "QA"));
        Long sessionId = createSession(token, category.getId());

        mockMvc.perform(patch("/api/v1/sessions/{sessionId}/start", sessionId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/v1/sessions/{sessionId}/report", sessionId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
    }

    // ── 테스트 6: GET - 생성 후 동일 데이터 조회 ─────────────────────────────

    @Test
    @DisplayName("GET /report: POST로 생성 후 GET으로 동일 데이터 조회")
    void getReport_afterPostGeneration_returnsSameData() throws Exception {
        String token = loginAndGetToken("report-get-" + UUID.randomUUID() + "@test.com");
        JobCategory category = jobCategoryRepository.save(JobCategory.of("데이터-" + UUID.randomUUID(), "데이터"));
        Long sessionId = createSession(token, category.getId());
        Long questionId = getFirstQuestionId(token, sessionId);
        submitAnswer(token, questionId);
        completeSession(token, sessionId);

        MvcResult postResult = mockMvc.perform(post("/api/v1/sessions/{sessionId}/report", sessionId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn();

        mockMvc.perform(get("/api/v1/sessions/{sessionId}/report", sessionId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.sessionId").value(sessionId))
                .andExpect(jsonPath("$.data.grade").value(
                        objectMapper.readTree(postResult.getResponse().getContentAsString())
                                .path("data").path("grade").asText()))
                .andExpect(jsonPath("$.data.strengthSummary").value(
                        objectMapper.readTree(postResult.getResponse().getContentAsString())
                                .path("data").path("strengthSummary").asText()))
                .andExpect(jsonPath("$.data.aiSummary").value(
                        objectMapper.readTree(postResult.getResponse().getContentAsString())
                                .path("data").path("aiSummary").asText()));
    }

    // ── 테스트 7: GET - 리포트 없으면 404 ────────────────────────────────────

    @Test
    @DisplayName("GET /report: 리포트 미생성 상태에서 조회 시 404 NOT_FOUND")
    void getReport_reportNotGenerated_returns404() throws Exception {
        String token = loginAndGetToken("report-404-" + UUID.randomUUID() + "@test.com");
        JobCategory category = jobCategoryRepository.save(JobCategory.of("보안-" + UUID.randomUUID(), "보안"));
        Long sessionId = createSession(token, category.getId());
        completeSession(token, sessionId);

        mockMvc.perform(get("/api/v1/sessions/{sessionId}/report", sessionId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("NOT_FOUND"));
    }

    // ── 헬퍼 ───────────────────────────────────────────────────────────────────

    private String loginAndGetToken(String email) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/v1/auth/test-login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\": \"%s\"}".formatted(email)))
                .andExpect(status().isOk())
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString())
                .path("data").path("accessToken").asText();
    }

    private Long createSession(String token, long categoryId) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/v1/sessions")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "jobCategoryId": %d,
                                  "jobTitle": "백엔드 개발자",
                                  "careerYears": 0,
                                  "sessionType": "TECHNICAL",
                                  "totalQuestions": 1
                                }
                                """.formatted(categoryId)))
                .andExpect(status().isOk())
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString())
                .path("data").path("sessionId").asLong();
    }

    private Long getFirstQuestionId(String token, Long sessionId) throws Exception {
        MvcResult result = mockMvc.perform(get("/api/v1/sessions/{id}", sessionId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString())
                .path("data").path("questions").path(0).path("id").asLong();
    }

    private long submitAnswer(String token, Long questionId) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/v1/answers")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "questionId": %d,
                                  "transcript": "Spring Boot와 JPA를 활용하여 결제 API 응답 속도를 개선한 경험이 있습니다.",
                                  "durationSec": 60,
                                  "completionStatus": "COMPLETED"
                                }
                                """.formatted(questionId)))
                .andExpect(status().isOk())
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString())
                .path("data").path("answerId").asLong();
    }

    private void completeSession(String token, Long sessionId) throws Exception {
        mockMvc.perform(patch("/api/v1/sessions/{sessionId}/start", sessionId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());
        mockMvc.perform(patch("/api/v1/sessions/{sessionId}/end", sessionId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());
    }
}
