package com.capstone.deepterview.domain.answer.dto.response;

import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.List;

public record LlmFeedbackView(
		String strength,
		String weakness,
		String improvement,
		List<String> followupQuestions
) {
	public static LlmFeedbackView of(String jsonResponse) {
		try {
			ObjectMapper mapper = new ObjectMapper();
			return mapper.readValue(jsonResponse, LlmFeedbackView.class);
		} catch (Exception e) {
			// 파싱 실패시 전체 응답을 strength에 담아서 반환
			return new LlmFeedbackView(jsonResponse, null, null, List.of());
		}
	}
}
