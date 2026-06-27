package com.capstone.deepterview.domain.answer.service;

import com.capstone.deepterview.domain.answer.domain.*;
import com.capstone.deepterview.domain.answer.dto.request.SubmitAnswerRequest;
import com.capstone.deepterview.domain.answer.dto.response.*;
import com.capstone.deepterview.domain.answer.repository.*;
import com.capstone.deepterview.domain.interview.domain.Question;
import com.capstone.deepterview.domain.interview.domain.InterviewSession;
import com.capstone.deepterview.domain.interview.repository.QuestionRepository;
import com.capstone.deepterview.global.ai.LlmAnalysisResult;
import com.capstone.deepterview.global.ai.LlmFeedbackService;
import com.capstone.deepterview.global.exception.BusinessException;
import com.capstone.deepterview.global.exception.CustomException;
import com.capstone.deepterview.global.exception.ErrorCode;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.*;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
public class AnswerService {

	private final QuestionRepository questionRepository;
	private final AnswerRepository answerRepository;
	private final SpeechAnalysisRepository speechAnalysisRepository;
	private final StarAnalysisRepository starAnalysisRepository;
	private final NonverbalAnalysisRepository nonverbalAnalysisRepository;
	private final LlmFeedbackRepository llmFeedbackRepository;
	private final ObjectMapper objectMapper;
	private final LlmFeedbackService llmFeedbackService;

	@Value("${app.file.answer-storage-dir}")
	private String answerStorageDir;

	@Transactional
	public SubmitAnswerResponse submitAnswer(Long userId, SubmitAnswerRequest request) {
		var question = questionRepository.findByIdWithSessionUser(request.questionId())
				.orElseThrow(() -> new CustomException(ErrorCode.NOT_FOUND, "질문을 찾을 수 없습니다."));

		if (!question.getSession().getUser().getId().equals(userId)) {
			throw new CustomException(ErrorCode.FORBIDDEN, "해당 질문에 답변할 권한이 없습니다.");
		}

		if (answerRepository.existsByQuestion_Id(request.questionId())) {
			throw new BusinessException(ErrorCode.CONFLICT, "이미 해당 질문에 대한 답변이 존재합니다.");
		}

		CompletionStatus status;
		try {
			status = CompletionStatus.valueOf(request.completionStatus());
		} catch (IllegalArgumentException e) {
			throw new CustomException(ErrorCode.VALIDATION_ERROR, "유효하지 않은 completionStatus 입니다.");
		}

		Answer answer = Answer.create(question, null, request.transcript(), request.transcript(), request.durationSec(), status);
		answerRepository.save(answer);

		// Generate next question if needed
		InterviewSession session = question.getSession();
		int currentQuestionCount = questionRepository.countBySessionId(session.getId());
		if (currentQuestionCount < session.getTotalQuestions()) {
			// Generate follow-up question quickly using the candidate's answer and resumeContent
			String followUpContent = llmFeedbackService.generateFollowUpQuestion(
					question.getContent(),
					request.transcript(),
					session.getResumeContent(),
					session.getAnswerLanguage()
			);

			Question nextQuestion = Question.create(
					session,
					followUpContent,
					question.getQuestionType(),
					question.getOrderNum() + 1,
					120
			);
			questionRepository.save(nextQuestion);
		}

		return SubmitAnswerResponse.of(answer);
	}

	@Transactional
	public void uploadVideo(Long userId, Long answerId, MultipartFile video) {
		Answer answer = answerRepository.findByIdWithQuestionSessionUser(answerId)
				.orElseThrow(() -> new CustomException(ErrorCode.NOT_FOUND, "답변을 찾을 수 없습니다."));

		if (!answer.getQuestion().getSession().getUser().getId().equals(userId)) {
			throw new CustomException(ErrorCode.FORBIDDEN, "해당 답변에 영상을 업로드할 권한이 없습니다.");
		}

		if (video == null || video.isEmpty()) {
			throw new CustomException(ErrorCode.VALIDATION_ERROR, "영상 파일은 필수입니다.");
		}

		String storedPath = storeVideoFile(video);
		answer.updateAudio(storedPath, answer.getDurationSec());
	}

	@Transactional
	public AnswerAnalysisResponse getAnalysis(Long userId, Long answerId) {
		Answer answer = answerRepository.findByIdWithQuestionSessionUser(answerId)
				.orElseThrow(() -> new CustomException(ErrorCode.NOT_FOUND, "답변을 찾을 수 없습니다."));

		if (!answer.getQuestion().getSession().getUser().getId().equals(userId)) {
			throw new CustomException(ErrorCode.FORBIDDEN, "해당 답변을 조회할 권한이 없습니다.");
		}

		SpeechAnalysisView speech = speechAnalysisRepository.findByAnswer_Id(answerId)
				.map(this::toSpeechView)
				.orElse(null);

		NonverbalAnalysisView nonverbal = nonverbalAnalysisRepository.findByAnswer_Id(answerId)
				.map(this::toNonverbalView)
				.orElse(null);

		Optional<LlmFeedback> existingLlm = llmFeedbackRepository.findByAnswer_Id(answerId);
		Optional<StarAnalysis> existingStar = starAnalysisRepository.findByAnswer_Id(answerId);

		LlmFeedbackView llm;
		StarAnalysisView star;

		if (existingLlm.isPresent()) {
			llm = toLlmView(existingLlm.get());
			star = existingStar.map(this::toStarView).orElse(null);
		} else {
			String analyzeText = answer.getSubmittedText() != null ? answer.getSubmittedText() : answer.getTranscript();
			LlmAnalysisResult result = llmFeedbackService.generateAnalysis(
					analyzeText,
					answer.getQuestion().getContent(),
					answer.getQuestion().getSession().getAnswerLanguage()
			);

			LlmAnalysisResult.FeedbackPart fp = result.feedback();
			List<String> followups = (fp != null && fp.followupQuestions() != null) ? fp.followupQuestions() : List.of();
			LlmFeedback savedLlm = llmFeedbackRepository.save(LlmFeedback.create(
					answer,
					fp != null ? fp.strength() : null,
					fp != null ? fp.weakness() : null,
					fp != null ? fp.improvement() : null,
					followups.size() > 0 ? followups.get(0) : null,
					followups.size() > 1 ? followups.get(1) : null,
					followups.size() > 2 ? followups.get(2) : null,
					null, null, null, null, null
			));
			llm = toLlmView(savedLlm);

			if (result.star() != null) {
				LlmAnalysisResult.StarPart sp = result.star();
				StarAnalysis savedStar = starAnalysisRepository.save(StarAnalysis.create(
						answer,
						sp.situationScore(),
						sp.taskScore(),
						sp.actionScore(),
						sp.resultScore(),
						calculateStarTotalScore(sp),
						sp.situationFeedback(),
						sp.taskFeedback(),
						sp.actionFeedback(),
						sp.resultFeedback()
				));
				star = toStarView(savedStar);
			} else {
				star = null;
			}
		}

		return new AnswerAnalysisResponse(
				answer.getId(),
				answer.getSubmittedText() != null ? answer.getSubmittedText() : answer.getTranscript(),
				answer.getTranscript(),
				answer.getDurationSec(),
				speech,
				star,
				nonverbal,
				llm
		);
	}

	private float calculateStarTotalScore(LlmAnalysisResult.StarPart sp) {
		float sum = 0;
		if (sp.situationScore() != null) { sum += sp.situationScore(); }
		if (sp.taskScore() != null) { sum += sp.taskScore(); }
		if (sp.actionScore() != null) { sum += sp.actionScore(); }
		if (sp.resultScore() != null) { sum += sp.resultScore(); }
		return sum; // 최대 40점 (각 항목 최대 10점)
	}

	private String storeVideoFile(MultipartFile file) {
		try {
			Path projectRoot = Paths.get(System.getProperty("user.dir")).normalize();
			Path dir = Paths.get(answerStorageDir);
			if (!dir.isAbsolute()) {
				dir = projectRoot.resolve(dir);
			}
			dir = dir.normalize();
			Files.createDirectories(dir);

			String original = Optional.ofNullable(file.getOriginalFilename()).orElse("video");
			String ext = extractExtension(original);
			String filename = UUID.randomUUID() + ext;

			Path target = dir.resolve(filename);
			file.transferTo(target);

			Path absoluteFile = target.toAbsolutePath().normalize();
			try {
				return projectRoot.relativize(absoluteFile).toString().replace('\\', '/');
			} catch (IllegalArgumentException ex) {
				return absoluteFile.toString().replace('\\', '/');
			}
		} catch (IOException e) {
			throw new CustomException(ErrorCode.INTERNAL_SERVER_ERROR, "영상 파일 저장에 실패했습니다.");
		}
	}

	private static String extractExtension(String filename) {
		int dot = filename.lastIndexOf('.');
		if (dot < 0 || dot == filename.length() - 1) {
			return "";
		}
		return filename.substring(dot);
	}

	private SpeechAnalysisView toSpeechView(SpeechAnalysis entity) {
		return new SpeechAnalysisView(
				entity.getWpm() == null ? null : entity.getWpm().doubleValue(),
				entity.getFillerCount(),
				parseFillerWords(entity.getFillerWordsJson()),
				entity.getSilenceRatio() == null ? null : entity.getSilenceRatio().doubleValue(),
				entity.getPaceScore() == null ? null : entity.getPaceScore().doubleValue(),
				entity.getClarityScore() == null ? null : entity.getClarityScore().doubleValue(),
				entity.getFeedback()
		);
	}

	private StarAnalysisView toStarView(StarAnalysis entity) {
		return new StarAnalysisView(
				toDouble(entity.getSituationScore()),
				toDouble(entity.getTaskScore()),
				toDouble(entity.getActionScore()),
				toDouble(entity.getResultScore()),
				toDouble(entity.getTotalScore()),
				entity.getSituationFeedback(),
				entity.getTaskFeedback(),
				entity.getActionFeedback(),
				entity.getResultFeedback()
		);
	}

	private NonverbalAnalysisView toNonverbalView(NonverbalAnalysis entity) {
		return new NonverbalAnalysisView(
				toDouble(entity.getEyeContactScore()),
				toDouble(entity.getConfidenceScore()),
				toDouble(entity.getAnxietyScore()),
				toDouble(entity.getSmileRatio()),
				toDouble(entity.getHeadStabilityScore()),
				entity.getDominantEmotion(),
				parseEmotionDistribution(entity.getEmotionDistributionJson()),
				entity.getFeedback()
		);
	}

	private LlmFeedbackView toLlmView(LlmFeedback entity) {
		List<String> followups = Stream.of(
						entity.getFollowupQuestion1(),
						entity.getFollowupQuestion2(),
						entity.getFollowupQuestion3()
				)
				.filter(Objects::nonNull)
				.filter(s -> !s.isBlank())
				.toList();

		return new LlmFeedbackView(
				entity.getStrength(),
				entity.getWeakness(),
				entity.getImprovement(),
				followups.isEmpty() ? List.of() : followups
		);
	}

	private static Double toDouble(Float value) {
		return value == null ? null : value.doubleValue();
	}

	private Map<String, Integer> parseFillerWords(String json) {
		if (json == null || json.isBlank()) {
			return Map.of();
		}
		try {
			return objectMapper.readValue(json, new TypeReference<>() {
			});
		} catch (Exception e) {
			return Map.of();
		}
	}

	private Map<String, Double> parseEmotionDistribution(String json) {
		if (json == null || json.isBlank()) {
			return Map.of();
		}
		try {
			return objectMapper.readValue(json, new TypeReference<>() {
			});
		} catch (Exception e) {
			return Map.of();
		}
	}
}
