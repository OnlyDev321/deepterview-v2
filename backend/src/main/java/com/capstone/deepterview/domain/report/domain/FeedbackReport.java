package com.capstone.deepterview.domain.report.domain;

import com.capstone.deepterview.domain.interview.domain.InterviewSession;
import com.capstone.deepterview.global.common.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.Getter;
import org.hibernate.annotations.SQLRestriction;

import java.time.LocalDateTime;

@Getter
@Entity
@Table(name = "feedback_report")
@SQLRestriction("deleted_at is null")
public class FeedbackReport extends BaseTimeEntity {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@OneToOne(optional = false)
	@JoinColumn(name = "session_id", unique = true)
	private InterviewSession session;

	@Column(name = "speech_score")
	private Float speechScore;

	@Column(name = "nonverbal_score")
	private Float nonverbalScore;

	@Column(name = "content_score")
	private Float contentScore;

	@Column(name = "overall_score")
	private Float overallScore;

	@Enumerated(EnumType.STRING)
	@Column(name = "grade", length = 2)
	private Grade grade;

	@Column(name = "strength_summary", columnDefinition = "LONGTEXT")
	private String strengthSummary;

	@Column(name = "weakness_summary", columnDefinition = "LONGTEXT")
	private String weaknessSummary;

	@Column(name = "improvement_priority", columnDefinition = "LONGTEXT")
	private String improvementPriority;

	@Column(name = "ai_summary", columnDefinition = "LONGTEXT")
	private String aiSummary;

	@Column(name = "deleted_at")
	private LocalDateTime deletedAt;

	protected FeedbackReport() {
	}

	public static FeedbackReport create(
			InterviewSession session,
			Float speechScore,
			Float nonverbalScore,
			Float contentScore,
			Float overallScore,
			Grade grade,
			String strengthSummary,
			String weaknessSummary,
			String improvementPriority,
			String aiSummary
	) {
		FeedbackReport report = new FeedbackReport();
		report.session = session;
		report.speechScore = speechScore;
		report.nonverbalScore = nonverbalScore;
		report.contentScore = contentScore;
		report.overallScore = overallScore;
		report.grade = grade;
		report.strengthSummary = strengthSummary;
		report.weaknessSummary = weaknessSummary;
		report.improvementPriority = improvementPriority;
		report.aiSummary = aiSummary;
		return report;
	}

	public void softDelete(LocalDateTime deletedAt) {
		this.deletedAt = deletedAt;
	}
}

