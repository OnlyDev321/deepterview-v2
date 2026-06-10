package com.capstone.deepterview.api;

import com.capstone.deepterview.domain.answer.repository.SpeechAnalysisRepository;
import com.capstone.deepterview.domain.interview.domain.JobCategory;
import com.capstone.deepterview.domain.interview.repository.JobCategoryRepository;
import com.capstone.deepterview.global.ai.LlmAnalysisResult;
import com.capstone.deepterview.global.ai.LlmFeedbackService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.closeTo;
import static org.hamcrest.Matchers.nullValue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * 핵심 기능 통합 테스트: 면접 답변 제출 → Python 분석 콜백 수신 → 분석 결과 조회
 *
 * Python 서버 없이도 검증할 수 있도록 /api/v1/internal/analysis/callback 을 직접 호출합니다.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles({"test", "local"})
class CoreAnalysisPipelineTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private JobCategoryRepository jobCategoryRepository;
    @Autowired private SpeechAnalysisRepository speechAnalysisRepository;

    @MockitoBean
    private LlmFeedbackService llmFeedbackService;

    @BeforeEach
    void stubLlmFeedback() {
        var feedbackPart = new LlmAnalysisResult.FeedbackPart(
                "답변 구조가 명확합니다.",
                "결과 수치가 부족합니다.",
                "STAR 기법의 Result를 보강하세요.",
                List.of("가장 어려웠던 점은?", "팀 갈등을 어떻게 해결했나요?")
        );
        when(llmFeedbackService.generateAnalysis(any(), any()))
                .thenReturn(new LlmAnalysisResult(feedbackPart, null));
    }

    // ── 테스트 1: 전체 파이프라인 ──────────────────────────────────────────

    @Test
    @DisplayName("전체 파이프라인: 답변 제출 → Python 콜백 수신 → speech·nonverbal·llm 조회")
    void fullPipeline_submitAnswerThenPythonCallback_returnsCompleteAnalysis() throws Exception {
        String token = loginAndGetToken("pipeline-" + UUID.randomUUID() + "@test.com");
        JobCategory category = jobCategoryRepository.save(JobCategory.of("백엔드", "백엔드 개발"));
        Long questionId = getFirstQuestionId(token, createSession(token, category.getId()));

        long answerId = submitAnswer(token, questionId);

        // Python 서버 콜백 시뮬레이션
        // WPM 계산: 단어 5개 / (2초 ÷ 60) = 150.0
        // paceScore: (120 - 60) / 120 * 100 = 50.0
        // clarityScore: (190 - 80) / 220 * 100 = 50.0
        // eyeContactScore: 60프레임 / 100총프레임 * 100 = 60.0
        mockMvc.perform(post("/api/v1/internal/analysis/callback")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(buildSuccessCallback(answerId,
                                120.0, 190.0,
                                "저는 백엔드 개발 경험이 있습니다.",
                                new double[][]{{0.0, 1.0}, {1.0, 2.0}},
                                new String[]{"a b c", "d e"},
                                60, 100)))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/answers/{id}/analysis", answerId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.answerId").value((int) answerId))
                .andExpect(jsonPath("$.data.transcript").value("저는 백엔드 개발 경험이 있습니다."))
                // 음성 분석
                .andExpect(jsonPath("$.data.speechAnalysis.wpm").value(closeTo(150.0, 0.1)))
                .andExpect(jsonPath("$.data.speechAnalysis.paceScore").value(closeTo(50.0, 0.1)))
                .andExpect(jsonPath("$.data.speechAnalysis.clarityScore").value(closeTo(50.0, 0.1)))
                // 비언어 분석
                .andExpect(jsonPath("$.data.nonverbalAnalysis.eyeContactScore").value(closeTo(60.0, 0.1)))
                // STAR 분석은 Python 콜백에 포함되지 않으므로 null
                .andExpect(jsonPath("$.data.starAnalysis").value(nullValue()))
                // LLM 피드백 (모의 객체)
                .andExpect(jsonPath("$.data.llmFeedback.strength").value("답변 구조가 명확합니다."))
                .andExpect(jsonPath("$.data.llmFeedback.followupQuestions.length()").value(2));
    }

    // ── 테스트 2: Python 분석 실패 콜백 ───────────────────────────────────

    @Test
    @DisplayName("Python 에러 콜백: status=error 이면 speech·nonverbal 저장되지 않음")
    void pythonCallback_errorStatus_speechAndNonverbalAreNull() throws Exception {
        String token = loginAndGetToken("error-cb-" + UUID.randomUUID() + "@test.com");
        JobCategory category = jobCategoryRepository.save(JobCategory.of("에러테스트", "desc"));
        Long questionId = getFirstQuestionId(token, createSession(token, category.getId()));

        long answerId = submitAnswer(token, questionId);

        mockMvc.perform(post("/api/v1/internal/analysis/callback")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "job_id": "fail-job",
                                  "interview_id": "%d",
                                  "status": "error",
                                  "error": "GPU 메모리 부족으로 분석 실패"
                                }
                                """.formatted(answerId)))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/answers/{id}/analysis", answerId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.speechAnalysis").value(nullValue()))
                .andExpect(jsonPath("$.data.nonverbalAnalysis").value(nullValue()))
                .andExpect(jsonPath("$.data.starAnalysis").value(nullValue()))
                .andExpect(jsonPath("$.data.llmFeedback.strength").exists());
    }

    // ── 테스트 3: 중복 콜백 방지 ──────────────────────────────────────────

    @Test
    @DisplayName("중복 콜백: 동일 answerId로 두 번 수신해도 SpeechAnalysis는 1건만 저장됨")
    void pythonCallback_calledTwice_doesNotDuplicateSpeechAnalysis() throws Exception {
        String token = loginAndGetToken("dup-cb-" + UUID.randomUUID() + "@test.com");
        JobCategory category = jobCategoryRepository.save(JobCategory.of("중복테스트", "desc"));
        Long questionId = getFirstQuestionId(token, createSession(token, category.getId()));

        long answerId = submitAnswer(token, questionId);

        String callbackBody = buildSuccessCallback(answerId,
                100.0, 150.0,
                "답변입니다.",
                new double[][]{{0.0, 2.0}},
                new String[]{"답변 입니다"},
                30, 50);

        mockMvc.perform(post("/api/v1/internal/analysis/callback")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(callbackBody))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/v1/internal/analysis/callback")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(callbackBody))
                .andExpect(status().isOk());

        assertThat(speechAnalysisRepository.findByAnswer_Id(answerId)).isPresent();
    }

    // ── 테스트 4: transcript 보존 및 Python STT 덮어쓰기 ──────────────────

    @Test
    @DisplayName("transcript 보존: 제출한 transcript가 그대로 조회되고, Python 콜백으로 덮어쓸 수 있음")
    void pythonCallback_transcriptUpdatedFromStt() throws Exception {
        String token = loginAndGetToken("stt-" + UUID.randomUUID() + "@test.com");
        JobCategory category = jobCategoryRepository.save(JobCategory.of("STT테스트", "desc"));
        Long questionId = getFirstQuestionId(token, createSession(token, category.getId()));

        long answerId = submitAnswer(token, questionId);

        // 제출 직후: 프론트에서 보낸 transcript 그대로
        mockMvc.perform(get("/api/v1/answers/{id}/analysis", answerId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(jsonPath("$.data.transcript").value("Spring Boot와 JPA를 활용한 REST API 설계 경험이 있습니다."));

        // Python STT 결과 콜백
        mockMvc.perform(post("/api/v1/internal/analysis/callback")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "job_id": "stt-job",
                                  "interview_id": "%d",
                                  "status": "success",
                                  "result": {
                                    "transcription": {
                                      "text": "Spring Boot와 JPA로 REST API를 설계한 경험이 있습니다.",
                                      "language": "ko",
                                      "segments": [
                                        {"start": 0.0, "end": 4.0, "text": "Spring Boot와 JPA로 REST API를 설계한 경험이 있습니다."}
                                      ]
                                    },
                                    "frame_count": 0,
                                    "gaze_frames": []
                                  }
                                }
                                """.formatted(answerId)))
                .andExpect(status().isOk());

        // 콜백 이후: Python 정밀 STT 결과로 덮어씀
        mockMvc.perform(get("/api/v1/answers/{id}/analysis", answerId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(jsonPath("$.data.transcript")
                        .value("Spring Boot와 JPA로 REST API를 설계한 경험이 있습니다."));
    }

    // ── 헬퍼 ──────────────────────────────────────────────────────────────

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
        JsonNode json = objectMapper.readTree(result.getResponse().getContentAsString());
        return json.path("data").path("questions").path(0).path("id").asLong();
    }

    private long submitAnswer(String token, Long questionId) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/v1/answers")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "questionId": %d,
                                  "transcript": "Spring Boot와 JPA를 활용한 REST API 설계 경험이 있습니다.",
                                  "durationSec": 60,
                                  "completionStatus": "COMPLETED"
                                }
                                """.formatted(questionId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.analysisStatus").value("PROCESSING"))
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString())
                .path("data").path("answerId").asLong();
    }

    private void uploadVideo(String token, long answerId) throws Exception {
        MockMultipartFile video = new MockMultipartFile(
                "video", "answer.webm", "video/webm",
                "fake-webm-content".getBytes(StandardCharsets.UTF_8));

        mockMvc.perform(multipart("/api/v1/answers/{answerId}/video", answerId)
                        .file(video)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());
    }

    private String buildSuccessCallback(
            long answerId,
            double tempoBpm,
            double pitchMeanHz,
            String sttText,
            double[][] segments,
            String[] texts,
            int gazeCount,
            int frameCount
    ) {
        StringBuilder segJson = new StringBuilder();
        for (int i = 0; i < segments.length; i++) {
            if (i > 0) segJson.append(",");
            segJson.append("""
                    {"start": %s, "end": %s, "text": "%s"}
                    """.formatted(segments[i][0], segments[i][1], texts[i]));
        }

        StringBuilder gazeJson = new StringBuilder();
        for (int i = 0; i < gazeCount; i++) {
            if (i > 0) gazeJson.append(",");
            gazeJson.append("{\"frame\": ").append(i).append(", \"x\": 0.5, \"y\": 0.5}");
        }

        return """
                {
                  "job_id": "test-job",
                  "interview_id": "%d",
                  "status": "success",
                  "result": {
                    "audio": {
                      "tempo_bpm": %s,
                      "pitch_mean_hz": %s,
                      "pitch_std_hz": 20.0
                    },
                    "transcription": {
                      "text": "%s",
                      "language": "ko",
                      "segments": [%s]
                    },
                    "frame_count": %d,
                    "gaze_frames": [%s]
                  }
                }
                """.formatted(answerId, tempoBpm, pitchMeanHz, sttText, segJson, frameCount, gazeJson);
    }
}
