package com.capstone.deepterview.domain.answer.service;

import com.capstone.deepterview.domain.answer.domain.NonverbalAnalysis;
import com.capstone.deepterview.domain.answer.dto.request.NonverbalAnalysisCallbackRequest;
import com.capstone.deepterview.domain.answer.dto.response.NonverbalAnalysisCallbackResponse;
import com.capstone.deepterview.domain.answer.repository.AnswerRepository;
import com.capstone.deepterview.domain.answer.repository.NonverbalAnalysisRepository;
import com.capstone.deepterview.global.exception.CustomException;
import com.capstone.deepterview.global.exception.ErrorCode;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class NonverbalAnalysisCallbackService {

	private final AnswerRepository answerRepository;
	private final NonverbalAnalysisRepository nonverbalAnalysisRepository;
	private final ObjectMapper objectMapper;

	@Transactional
	public NonverbalAnalysisCallbackResponse upsert(NonverbalAnalysisCallbackRequest request) {
		var answer = answerRepository.findById(request.answerId())
				.orElseThrow(() -> new CustomException(ErrorCode.NOT_FOUND, "답변을 찾을 수 없습니다."));

		final String emotionJson;
		if (request.emotionDistribution() == null || request.emotionDistribution().isEmpty()) {
			emotionJson = null;
		} else {
			try {
				emotionJson = objectMapper.writeValueAsString(request.emotionDistribution());
			} catch (JsonProcessingException e) {
				throw new CustomException(ErrorCode.VALIDATION_ERROR, "emotionDistribution 직렬화에 실패했습니다.");
			}
		}

		return nonverbalAnalysisRepository.findByAnswer_Id(request.answerId())
				.map(existing -> {
					existing.updateNonverbal(
							toFloat(request.eyeContactScore()),
							toFloat(request.confidenceScore()),
							toFloat(request.anxietyScore()),
							toFloat(request.smileRatio()),
							toFloat(request.headStabilityScore()),
							request.dominantEmotion(),
							emotionJson,
							request.feedback()
					);
					return new NonverbalAnalysisCallbackResponse(existing.getId());
				})
				.orElseGet(() -> {
					NonverbalAnalysis created = NonverbalAnalysis.create(
							answer,
							toFloat(request.eyeContactScore()),
							toFloat(request.confidenceScore()),
							toFloat(request.anxietyScore()),
							toFloat(request.smileRatio()),
							toFloat(request.headStabilityScore()),
							request.dominantEmotion(),
							emotionJson,
							request.feedback()
					);
					nonverbalAnalysisRepository.save(created);
					return new NonverbalAnalysisCallbackResponse(created.getId());
				});
	}

	private static Float toFloat(Double value) {
		return value == null ? null : value.floatValue();
	}
}
