package com.capstone.deepterview.api;

import com.capstone.deepterview.domain.answer.repository.SpeechAnalysisRepository;
import com.capstone.deepterview.domain.interview.domain.JobCategory;
import com.capstone.deepterview.domain.interview.repository.InterviewSessionRepository;
import com.capstone.deepterview.domain.interview.repository.JobCategoryRepository;
import com.capstone.deepterview.domain.report.domain.FeedbackReport;
import com.capstone.deepterview.domain.report.domain.Grade;
import com.capstone.deepterview.domain.report.repository.FeedbackReportRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.nio.charset.StandardCharsets;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.closeTo;
import static org.hamcrest.Matchers.nullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * 비동기 분석(@Async)은 요청 트랜잭션 커밋 이후 DB에서 답변을 읽어야 하므로
 * 클래스 단위 @Transactional을 사용하지 않습니다.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles({"test", "local"})
class AnswerReportApiIntegrationTest {

	@Autowired
	private MockMvc mockMvc;

	@Autowired
	private ObjectMapper objectMapper;

	@Autowired
	private JobCategoryRepository jobCategoryRepository;

	@Autowired
	private SpeechAnalysisRepository speechAnalysisRepository;

	@Autowired
	private InterviewSessionRepository interviewSessionRepository;

	@Autowired
	private FeedbackReportRepository feedbackReportRepository;

	@Test
	@DisplayName("Answer: 동일 questionId로 중복 제출 시 CONFLICT")
	void duplicateAnswerReturnsConflict() throws Exception {
		String email = "answer-dup-" + UUID.randomUUID() + "@example.com";
		String accessToken = loginAndGetAccessToken(email);

		JobCategory category = jobCategoryRepository.save(JobCategory.of("중복테스트 직군", "desc"));
		Long sessionId = createSession(accessToken, category.getId(), 1);
		Long questionId = getFirstQuestionId(accessToken, sessionId);

		String answerBody = """
				{
				  "questionId": %d,
				  "transcript": "첫 번째 답변입니다.",
				  "durationSec": 10,
				  "completionStatus": "COMPLETED"
				}
				""".formatted(questionId);

		mockMvc.perform(post("/api/v1/answers")
						.header("Authorization", "Bearer " + accessToken)
						.contentType(MediaType.APPLICATION_JSON)
						.content(answerBody))
				.andExpect(status().isOk());

		mockMvc.perform(post("/api/v1/answers")
						.header("Authorization", "Bearer " + accessToken)
						.contentType(MediaType.APPLICATION_JSON)
						.content(answerBody))
				.andExpect(status().isConflict())
				.andExpect(jsonPath("$.success").value(false))
				.andExpect(jsonPath("$.code").value("CONFLICT"));
	}

	@Test
	@DisplayName("Report: COMPLETED + 리포트 저장 후 조회 성공")
	void sessionReportWhenCompletedAndExists() throws Exception {
		String email = "report-ok-" + UUID.randomUUID() + "@example.com";
		String accessToken = loginAndGetAccessToken(email);

		JobCategory category = jobCategoryRepository.save(JobCategory.of("리포트테스트 직군", "desc"));
		Long sessionId = createSession(accessToken, category.getId(), 1);

		mockMvc.perform(patch("/api/v1/sessions/{sessionId}/start", sessionId)
						.header("Authorization", "Bearer " + accessToken))
				.andExpect(status().isOk());

		mockMvc.perform(patch("/api/v1/sessions/{sessionId}/end", sessionId)
						.header("Authorization", "Bearer " + accessToken))
				.andExpect(status().isOk());

		var session = interviewSessionRepository.findById(sessionId).orElseThrow();
		feedbackReportRepository.save(FeedbackReport.create(
				session,
				81.5f,
				76.0f,
				75.0f,
				77.5f,
				Grade.B,
				"말하기 속도가 안정적입니다.",
				"결과 수치 부재.",
				"STAR Result 보강.",
				"전반적으로 안정적입니다."
		));

		mockMvc.perform(get("/api/v1/sessions/{sessionId}/report", sessionId)
						.header("Authorization", "Bearer " + accessToken))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.success").value(true))
				.andExpect(jsonPath("$.data.sessionId").value(sessionId))
				.andExpect(jsonPath("$.data.grade").value("B"))
				.andExpect(jsonPath("$.data.overallScore").value(77.5));
	}

	@Test
	@DisplayName("Report: 세션 미완료 시 리포트 조회 불가")
	void sessionReportWhenNotCompleted() throws Exception {
		String email = "report-bad-" + UUID.randomUUID() + "@example.com";
		String accessToken = loginAndGetAccessToken(email);

		JobCategory category = jobCategoryRepository.save(JobCategory.of("리포트실패 직군", "desc"));
		Long sessionId = createSession(accessToken, category.getId(), 1);

		mockMvc.perform(get("/api/v1/sessions/{sessionId}/report", sessionId)
						.header("Authorization", "Bearer " + accessToken))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.success").value(false))
				.andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
	}

	@Test
	@DisplayName("Report: COMPLETED 이지만 리포트 엔티티 없으면 NOT_FOUND")
	void sessionReportWhenCompletedButMissingEntity() throws Exception {
		String email = "report-missing-" + UUID.randomUUID() + "@example.com";
		String accessToken = loginAndGetAccessToken(email);

		JobCategory category = jobCategoryRepository.save(JobCategory.of("리포트없음 직군", "desc"));
		Long sessionId = createSession(accessToken, category.getId(), 1);

		mockMvc.perform(patch("/api/v1/sessions/{sessionId}/start", sessionId)
						.header("Authorization", "Bearer " + accessToken))
				.andExpect(status().isOk());

		mockMvc.perform(patch("/api/v1/sessions/{sessionId}/end", sessionId)
						.header("Authorization", "Bearer " + accessToken))
				.andExpect(status().isOk());

		mockMvc.perform(get("/api/v1/sessions/{sessionId}/report", sessionId)
						.header("Authorization", "Bearer " + accessToken))
				.andExpect(status().isNotFound())
				.andExpect(jsonPath("$.success").value(false))
				.andExpect(jsonPath("$.code").value("NOT_FOUND"));
	}

	private String loginAndGetAccessToken(String email) throws Exception {
		MvcResult loginResult = mockMvc.perform(post("/api/v1/auth/test-login")
						.contentType(MediaType.APPLICATION_JSON)
						.content("{\"email\": \"%s\"}".formatted(email)))
				.andExpect(status().isOk())
				.andReturn();
		JsonNode loginJson = objectMapper.readTree(loginResult.getResponse().getContentAsString());
		return loginJson.path("data").path("accessToken").asText();
	}

	private Long createSession(String accessToken, long jobCategoryId, int totalQuestions) throws Exception {
		MvcResult result = mockMvc.perform(post("/api/v1/sessions")
						.header("Authorization", "Bearer " + accessToken)
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{
								  "jobCategoryId": %d,
								  "jobTitle": "백엔드 개발자",
								  "careerYears": 0,
								  "sessionType": "TECHNICAL",
								  "totalQuestions": %d
								}
								""".formatted(jobCategoryId, totalQuestions)))
				.andExpect(status().isOk())
				.andReturn();
		JsonNode json = objectMapper.readTree(result.getResponse().getContentAsString());
		return json.path("data").path("sessionId").asLong();
	}

	private Long getFirstQuestionId(String accessToken, Long sessionId) throws Exception {
		MvcResult result = mockMvc.perform(get("/api/v1/sessions/{sessionId}", sessionId)
						.header("Authorization", "Bearer " + accessToken))
				.andExpect(status().isOk())
				.andReturn();
		JsonNode json = objectMapper.readTree(result.getResponse().getContentAsString());
		return json.path("data").path("questions").path(0).path("id").asLong();
	}

	private void waitUntilSpeechAnalysisExists(long answerId) throws InterruptedException {
		for (int i = 0; i < 100; i++) {
			if (speechAnalysisRepository.findByAnswer_Id(answerId).isPresent()) {
				return;
			}
			Thread.sleep(50);
		}
		assertThat(speechAnalysisRepository.findByAnswer_Id(answerId))
				.as("비동기 SpeechAnalysis 저장이 제한 시간 내에 완료되어야 합니다.")
				.isPresent();
	}
}
