package com.capstone.deepterview.domain.interview.service;

import com.capstone.deepterview.domain.answer.domain.Answer;
import com.capstone.deepterview.domain.answer.repository.AnswerRepository;
import com.capstone.deepterview.domain.answer.service.AnswerAsyncAnalysisRunner;
import com.capstone.deepterview.global.util.DocumentParser;
import com.capstone.deepterview.domain.interview.domain.*;
import com.capstone.deepterview.domain.interview.dto.request.CreateSessionRequest;
import com.capstone.deepterview.domain.interview.dto.response.CreateSessionResponse;
import com.capstone.deepterview.domain.interview.dto.response.JobCategoryResponse;
import com.capstone.deepterview.domain.interview.dto.response.QuestionResponse;
import com.capstone.deepterview.domain.interview.dto.response.SessionDetailResponse;
import com.capstone.deepterview.domain.interview.dto.response.SessionListResponse;
import com.capstone.deepterview.domain.interview.dto.response.SessionListItemResponse;
import com.capstone.deepterview.domain.interview.dto.response.AnalysisProgressResponse;
import com.capstone.deepterview.domain.interview.dto.response.SessionStatusResponse;
import com.capstone.deepterview.domain.interview.repository.InterviewSessionRepository;
import com.capstone.deepterview.domain.report.repository.FeedbackReportRepository;
import com.capstone.deepterview.domain.interview.repository.JobCategoryRepository;
import com.capstone.deepterview.domain.interview.repository.QuestionRepository;
import com.capstone.deepterview.domain.member.domain.User;
import com.capstone.deepterview.domain.member.repository.UserRepository;
import com.capstone.deepterview.global.ai.LlmFeedbackService;
import com.capstone.deepterview.global.exception.CustomException;
import com.capstone.deepterview.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class InterviewService {

	private final InterviewSessionRepository interviewSessionRepository;
	private final QuestionRepository questionRepository;
	private final JobCategoryRepository jobCategoryRepository;
	private final UserRepository userRepository;
	private final AnswerRepository answerRepository;
	private final AnswerAsyncAnalysisRunner answerAsyncAnalysisRunner;
	private final FeedbackReportRepository feedbackReportRepository;
	private final LlmFeedbackService llmFeedbackService;

	@Value("${app.file.session-storage-dir}")
	private String sessionStorageDir;

	@Transactional
	public CreateSessionResponse createSession(Long userId, CreateSessionRequest request) {
		return createSession(userId, request, null);
	}

	@Transactional
	public CreateSessionResponse createSession(Long userId, CreateSessionRequest request, MultipartFile resume) {
		User user = userRepository.findById(userId)
				.orElseThrow(() -> new CustomException(ErrorCode.NOT_FOUND, "사용자를 찾을 수 없습니다."));

		JobCategory jobCategory = jobCategoryRepository.findById(request.jobCategoryId())
				.orElseThrow(() -> new CustomException(ErrorCode.NOT_FOUND, "유효하지 않은 직군 카테고리입니다."));

		// careerYears가 0이면 신입으로 취급합니다.
		int normalizedCareerYears = Math.max(request.careerYears(), 0);

		SessionType normalizedSessionType = request.sessionType() != null
				? request.sessionType()
				: SessionType.TECHNICAL;

		AnswerLanguage normalizedLanguage = request.answerLanguage() != null
				? request.answerLanguage()
				: AnswerLanguage.KOREAN;

		String resumeText = null;
		if (resume != null && !resume.isEmpty()) {
			try {
				resumeText = DocumentParser.extractText(resume);
			} catch (IOException e) {
				throw new CustomException(ErrorCode.VALIDATION_ERROR, "이력서 파일 파싱에 실패했습니다: " + e.getMessage());
			}
		}

		InterviewSession session = InterviewSession.create(
				user,
				jobCategory,
				request.jobTitle(),
				normalizedCareerYears,
				normalizedSessionType,
				request.totalQuestions(),
				normalizedLanguage);

		if (resumeText != null) {
			session.updateResumeContent(resumeText);
		}

		interviewSessionRepository.save(session);

		List<String> pastQuestions = questionRepository
				.findPastQuestionContentsByUserAndJobCategory(userId, jobCategory.getId(),
						PageRequest.of(0, 20));

		String initialContent = llmFeedbackService.generateInitialQuestion(
				jobCategory.getName(),
				request.jobTitle(),
				normalizedCareerYears,
				resumeText,
				pastQuestions,
				normalizedLanguage
		);

		Question initialQuestion = Question.create(
				session,
				initialContent,
				QuestionType.TECHNICAL,
				1,
				120
		);
		questionRepository.save(initialQuestion);

		List<QuestionResponse> questionResponses = List.of(QuestionResponse.from(initialQuestion));

		return CreateSessionResponse.of(session, questionResponses);
	}

	@Transactional(readOnly = true)
	public SessionListResponse getSessions(Long userId, SessionStatus status, Long jobCategoryId, Integer days, Pageable pageable) {
		LocalDateTime cutoff = null;
		if (days != null) {
			cutoff = days == 0
					? LocalDateTime.now().toLocalDate().atStartOfDay()
					: LocalDateTime.now().minusDays(days);
		}
		Page<InterviewSession> page = interviewSessionRepository.findByUserIdWithFilters(userId, status, jobCategoryId, cutoff, pageable);

		Page<SessionListItemResponse> mappedPage = page.map(SessionListItemResponse::from);
		return SessionListResponse.from(mappedPage);
	}

	@Transactional(readOnly = true)
	public SessionDetailResponse getSessionDetail(Long userId, Long sessionId) {
		InterviewSession session = getOwnedSession(userId, sessionId);
		List<QuestionResponse> questions = questionRepository.findBySessionIdWithAnswerOrderByOrderNumAsc(sessionId)
				.stream()
				.map(QuestionResponse::from)
				.toList();
		return SessionDetailResponse.of(session, questions);
	}

	@Transactional
	public SessionStatusResponse startSession(Long userId, Long sessionId) {
		InterviewSession session = getOwnedSession(userId, sessionId);
		if (session.getStatus() != SessionStatus.READY) {
			throw new CustomException(ErrorCode.VALIDATION_ERROR, "READY 상태의 세션만 시작할 수 있습니다.");
		}
		session.start(LocalDateTime.now());
		return SessionStatusResponse.started(session.getId(), session.getStatus(), session.getStartedAt(), session.getEndedAt());
	}

	@Transactional
	public SessionStatusResponse endSession(Long userId, Long sessionId) {
		InterviewSession session = getOwnedSession(userId, sessionId);
		if (session.getStatus() != SessionStatus.IN_PROGRESS) {
			throw new CustomException(ErrorCode.VALIDATION_ERROR, "IN_PROGRESS 상태의 세션만 종료할 수 있습니다.");
		}
		session.complete(LocalDateTime.now());
		return SessionStatusResponse.ended(session.getId(), session.getStatus(),session.getStartedAt(), session.getEndedAt());
	}

	@Transactional
	public void deleteSession(Long userId, Long sessionId) {
		InterviewSession session = getOwnedSession(userId, sessionId);
		LocalDateTime now = LocalDateTime.now();
		session.softDelete(now);
		questionRepository.findBySessionIdOrderByOrderNumAsc(sessionId).forEach(question -> question.softDelete(now));
	}

	@Transactional(readOnly = true)
	public List<JobCategoryResponse> getJobCategories() {
		List<JobCategory> departments = jobCategoryRepository.findByActiveTrueAndParentIsNullOrderByIdAsc();
		return departments.stream()
				.map(department -> {
					List<JobCategory> children = jobCategoryRepository.findByActiveTrueAndParentIdOrderByIdAsc(department.getId());
					List<JobCategoryResponse> childResponses = children.stream()
							.map(JobCategoryResponse::from)
							.toList();
					return JobCategoryResponse.withChildren(department, childResponses);
				})
				.toList();
	}

	@Transactional(readOnly = true)
	public AnalysisProgressResponse getAnalysisProgress(Long userId, Long sessionId) {
		getOwnedSession(userId, sessionId);

		int totalAnswers = (int) answerRepository.countBySessionId(sessionId);
		int answersWithVideo = (int) answerRepository.countBySessionIdWithVideoPath(sessionId);
		int speechAnalyzed = (int) answerRepository.countSpeechAnalyzedBySessionId(sessionId);
		int nonverbalAnalyzed = (int) answerRepository.countNonverbalAnalyzedBySessionId(sessionId);
		int starAnalyzed = (int) answerRepository.countStarAnalyzedBySessionId(sessionId);
		int llmFeedbackDone = (int) answerRepository.countLlmFeedbackDoneBySessionId(sessionId);
		boolean reportReady = feedbackReportRepository.findBySession_Id(sessionId).isPresent();

		return new AnalysisProgressResponse(
				sessionId,
				totalAnswers,
				answersWithVideo,
				speechAnalyzed,
				nonverbalAnalyzed,
				starAnalyzed,
				llmFeedbackDone,
				reportReady);
	}

	@Transactional
	public void uploadSessionVideo(Long userId, Long sessionId, MultipartFile video) {
		InterviewSession session = getOwnedSession(userId, sessionId);

		if (video == null || video.isEmpty()) {
			throw new CustomException(ErrorCode.VALIDATION_ERROR, "영상 파일은 필수입니다.");
		}

		String storedPath = storeSessionVideoFile(video);
		session.updateFullVideoPath(storedPath);
	}

	public void generateReport(Long userId, Long sessionId) {
		InterviewSession session = getOwnedSession(userId, sessionId);
		if (session.getStatus() != SessionStatus.COMPLETED) {
			throw new CustomException(ErrorCode.VALIDATION_ERROR, "완료된 세션만 리포트를 생성할 수 있습니다.");
		}

		List<Answer> answersWithVideo = answerRepository.findBySessionIdWithVideoPath(sessionId);

		if (answersWithVideo.isEmpty()) {
			throw new CustomException(ErrorCode.VALIDATION_ERROR, "업로드된 영상이 없어 정밀 분석을 시작할 수 없습니다.");
		}

		answersWithVideo.forEach(answer -> {
			String absolutePath = Paths.get(System.getProperty("user.dir"))
					.resolve(answer.getAudioFilePath())
					.toAbsolutePath().normalize().toString().replace('\\', '/');
			answerAsyncAnalysisRunner.runVideoAnalysis(answer.getId(), absolutePath);
		});
	}

	private String storeSessionVideoFile(MultipartFile file) {
		try {
			Path projectRoot = Paths.get(System.getProperty("user.dir")).normalize();
			Path dir = Paths.get(sessionStorageDir);
			if (!dir.isAbsolute()) {
				dir = projectRoot.resolve(dir);
			}
			dir = dir.normalize();
			Files.createDirectories(dir);

			String original = Optional.ofNullable(file.getOriginalFilename()).orElse("video");
			String ext = extractExtension(original);
			String filename = "full_" + UUID.randomUUID() + ext;

			Path target = dir.resolve(filename);
			file.transferTo(target);

			Path absoluteFile = target.toAbsolutePath().normalize();
			try {
				return projectRoot.relativize(absoluteFile).toString().replace('\\', '/');
			} catch (IllegalArgumentException ex) {
				return absoluteFile.toString().replace('\\', '/');
			}
		} catch (IOException e) {
			throw new CustomException(ErrorCode.INTERNAL_SERVER_ERROR, "세션 영상 파일 저장에 실패했습니다.");
		}
	}

	private static String extractExtension(String filename) {
		int dot = filename.lastIndexOf('.');
		if (dot < 0 || dot == filename.length() - 1) {
			return ".webm";
		}
		return filename.substring(dot);
	}

	private InterviewSession getOwnedSession(Long userId, Long sessionId) {
		return interviewSessionRepository.findByIdAndUserId(sessionId, userId)
				.orElseThrow(() -> new CustomException(ErrorCode.NOT_FOUND, "세션을 찾을 수 없습니다."));
	}

	private List<Question> createMockQuestions(InterviewSession session, int totalQuestions, SessionType sessionType,
			int careerYears) {
		return java.util.stream.IntStream.rangeClosed(1, totalQuestions)
				.mapToObj(order -> {
					QuestionType questionType = switch (sessionType) {
						case TECHNICAL, GLOBAL_TRADE, KOREAN_STUDIES, BUSINESS, MARKETING,
							ECONOMICS, ACCOUNTING_TAX, MEDIA_COMM, DESIGN -> QuestionType.TECHNICAL;
					};
					String careerLabel = careerYears == 0 ? "신입" : careerYears + "년차";
					String content = String.format("[%s %s] 모의 질문 %d번입니다. 본인의 경험을 기반으로 답변해주세요.", sessionType,
							careerLabel, order);
					// TODO: LLM 연동 후 직무/경력 기반 질문 생성으로 대체
					return Question.create(session, content, questionType, order, 120);
				})
				.toList();
	}
}
