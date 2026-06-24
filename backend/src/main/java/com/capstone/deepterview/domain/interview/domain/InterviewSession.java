package com.capstone.deepterview.domain.interview.domain;

import com.capstone.deepterview.domain.member.domain.User;
import com.capstone.deepterview.domain.report.domain.FeedbackReport;
import com.capstone.deepterview.global.common.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.Getter;
import org.hibernate.annotations.SQLRestriction;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Getter
@Entity
@Table(name = "interview_session")
@SQLRestriction("deleted_at is null")
public class InterviewSession extends BaseTimeEntity {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(optional = false)
	@JoinColumn(name = "user_id")
	private User user;

	@ManyToOne(optional = false)
	@JoinColumn(name = "job_category_id")
	private JobCategory jobCategory;

	@Column(name = "job_title", nullable = false, length = 100)
	private String jobTitle;

	@Column(name = "career_years", nullable = false)
	private int careerYears;

	@Enumerated(EnumType.STRING)
	@Column(name = "session_type", nullable = false, length = 30)
	private SessionType sessionType;

	@Enumerated(EnumType.STRING)
	@Column(name = "status", nullable = false, length = 20)
	private SessionStatus status;

	@Column(name = "total_questions", nullable = false)
	private int totalQuestions;

	@Column(name = "started_at")
	private LocalDateTime startedAt;

	@Column(name = "ended_at")
	private LocalDateTime endedAt;

	@Column(name = "full_video_path", length = 500)
	private String fullVideoPath;

	@Lob
	@Column(name = "resume_content", columnDefinition = "LONGTEXT")
	private String resumeContent;

	@Column(name = "deleted_at")
	private LocalDateTime deletedAt;

	@OneToMany(mappedBy = "session")
	private List<Question> questions = new ArrayList<>();

	@OneToOne(mappedBy = "session")
	private FeedbackReport feedbackReport;

	protected InterviewSession() {
	}

	public static InterviewSession create(
			User user,
			JobCategory jobCategory,
			String jobTitle,
			int careerYears,
			SessionType sessionType,
			int totalQuestions) {
		InterviewSession session = new InterviewSession();
		session.user = user;
		session.jobCategory = jobCategory;
		session.jobTitle = jobTitle;
		session.careerYears = careerYears;
		session.sessionType = sessionType;
		session.totalQuestions = totalQuestions;
		session.status = SessionStatus.READY;
		return session;
	}

	public void start(LocalDateTime startedAt) {
		this.status = SessionStatus.IN_PROGRESS;
		this.startedAt = startedAt;
	}

	public void complete(LocalDateTime endedAt) {
		this.status = SessionStatus.COMPLETED;
		this.endedAt = endedAt;
	}

	public void abort(LocalDateTime endedAt) {
		this.status = SessionStatus.ABORTED;
		this.endedAt = endedAt;
	}

	public void softDelete(LocalDateTime deletedAt) {
		this.deletedAt = deletedAt;
	}

	public void updateFullVideoPath(String fullVideoPath) {
		this.fullVideoPath = fullVideoPath;
	}

	public void updateResumeContent(String resumeContent) {
		this.resumeContent = resumeContent;
	}
}
