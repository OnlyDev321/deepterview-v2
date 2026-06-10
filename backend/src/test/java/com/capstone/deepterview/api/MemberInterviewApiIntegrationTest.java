package com.capstone.deepterview.api;

import com.capstone.deepterview.domain.interview.domain.JobCategory;
import com.capstone.deepterview.domain.interview.repository.JobCategoryRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles({"test", "local"})
@Transactional
class MemberInterviewApiIntegrationTest {

	@Autowired
	private MockMvc mockMvc;

	@Autowired
	private ObjectMapper objectMapper;

	@Autowired
	private JobCategoryRepository jobCategoryRepository;

	@Test
	@DisplayName("Member API 통합 검증: test-login -> me -> reissue -> logout")
	void memberApiFlow() throws Exception {
		MvcResult loginResult = mockMvc.perform(post("/api/v1/auth/test-login")
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{
								  "email": "integration-member@example.com"
								}
								"""))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.success").value(true))
				.andExpect(jsonPath("$.data.accessToken").exists())
				.andExpect(jsonPath("$.data.refreshToken").exists())
				.andReturn();

		JsonNode loginJson = objectMapper.readTree(loginResult.getResponse().getContentAsString());
		String accessToken = loginJson.path("data").path("accessToken").asText();
		String refreshToken = loginJson.path("data").path("refreshToken").asText();

		mockMvc.perform(get("/api/v1/users/me")
						.header("Authorization", "Bearer " + accessToken))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.success").value(true))
				.andExpect(jsonPath("$.data.email").value("integration-member@example.com"));

		MvcResult reissueResult = mockMvc.perform(post("/api/v1/auth/reissue")
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{
								  "refreshToken": "%s"
								}
								""".formatted(refreshToken)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.success").value(true))
				.andExpect(jsonPath("$.data.accessToken").exists())
				.andExpect(jsonPath("$.data.refreshToken").exists())
				.andReturn();

		JsonNode reissueJson = objectMapper.readTree(reissueResult.getResponse().getContentAsString());
		String newRefreshToken = reissueJson.path("data").path("refreshToken").asText();
		assertThat(newRefreshToken).isNotBlank();

		mockMvc.perform(post("/api/v1/auth/logout")
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{
								  "refreshToken": "%s"
								}
								""".formatted(newRefreshToken)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.success").value(true))
				.andExpect(jsonPath("$.message").value("로그아웃 되었습니다."));

		mockMvc.perform(post("/api/v1/auth/reissue")
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{
								  "refreshToken": "%s"
								}
								""".formatted(newRefreshToken)))
				.andExpect(status().isUnauthorized())
				.andExpect(jsonPath("$.success").value(false));
	}

	@Test
	@DisplayName("Interview API 통합 검증: 세션 생성 -> 목록/상세 -> 시작 -> 종료 -> 삭제")
	void interviewApiFlow() throws Exception {
		JobCategory category = jobCategoryRepository.save(JobCategory.of("테스트 직군", "통합 테스트용 직군"));

		MvcResult loginResult = mockMvc.perform(post("/api/v1/auth/test-login")
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{
								  "email": "integration-interview@example.com"
								}
								"""))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.success").value(true))
				.andReturn();

		JsonNode loginJson = objectMapper.readTree(loginResult.getResponse().getContentAsString());
		String accessToken = loginJson.path("data").path("accessToken").asText();

		MvcResult createSessionResult = mockMvc.perform(post("/api/v1/sessions")
						.header("Authorization", "Bearer " + accessToken)
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{
								  "jobCategoryId": %d,
								  "jobTitle": "백엔드 개발자",
								  "careerYears": 0,
								  "sessionType": "TECHNICAL",
								  "totalQuestions": 3
								}
								""".formatted(category.getId())))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.success").value(true))
				.andExpect(jsonPath("$.data.status").value("READY"))
				.andExpect(jsonPath("$.data.questions.length()").value(3))
				.andExpect(jsonPath("$.data.questions[0].orderNum").value(1))
				.andReturn();

		JsonNode createJson = objectMapper.readTree(createSessionResult.getResponse().getContentAsString());
		Long sessionId = createJson.path("data").path("sessionId").asLong();

		mockMvc.perform(get("/api/v1/sessions")
						.header("Authorization", "Bearer " + accessToken)
						.param("status", "READY")
						.param("page", "0")
						.param("size", "10"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.success").value(true))
				.andExpect(jsonPath("$.data.totalElements").value(1))
				.andExpect(jsonPath("$.data.content[0].sessionId").value(sessionId));

		mockMvc.perform(get("/api/v1/sessions/{sessionId}", sessionId)
						.header("Authorization", "Bearer " + accessToken))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.success").value(true))
				.andExpect(jsonPath("$.data.sessionId").value(sessionId))
				.andExpect(jsonPath("$.data.questions.length()").value(3));

		mockMvc.perform(patch("/api/v1/sessions/{sessionId}/start", sessionId)
						.header("Authorization", "Bearer " + accessToken))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.success").value(true))
				.andExpect(jsonPath("$.data.status").value("IN_PROGRESS"));

		mockMvc.perform(patch("/api/v1/sessions/{sessionId}/end", sessionId)
						.header("Authorization", "Bearer " + accessToken))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.success").value(true))
				.andExpect(jsonPath("$.data.status").value("COMPLETED"));

		mockMvc.perform(delete("/api/v1/sessions/{sessionId}", sessionId)
						.header("Authorization", "Bearer " + accessToken))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.success").value(true))
				.andExpect(jsonPath("$.message").value("세션이 삭제되었습니다."));

		mockMvc.perform(get("/api/v1/sessions/{sessionId}", sessionId)
						.header("Authorization", "Bearer " + accessToken))
				.andExpect(status().isNotFound())
				.andExpect(jsonPath("$.success").value(false))
				.andExpect(jsonPath("$.code").value("NOT_FOUND"));
	}
}

