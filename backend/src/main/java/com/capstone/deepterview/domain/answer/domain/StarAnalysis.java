package com.capstone.deepterview.domain.answer.domain;

import com.capstone.deepterview.global.common.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.Getter;

@Getter
@Entity
@Table(name = "star_analysis")
public class StarAnalysis extends BaseTimeEntity {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@OneToOne(optional = false)
	@JoinColumn(name = "answer_id", unique = true)
	private Answer answer;

	@Column(name = "situation_score")
	private Float situationScore;

	@Column(name = "task_score")
	private Float taskScore;

	@Column(name = "action_score")
	private Float actionScore;

	@Column(name = "result_score")
	private Float resultScore;

	@Column(name = "total_score")
	private Float totalScore;

	@Column(name = "situation_feedback", columnDefinition = "LONGTEXT")
	private String situationFeedback;

	@Column(name = "task_feedback", columnDefinition = "LONGTEXT")
	private String taskFeedback;

	@Column(name = "action_feedback", columnDefinition = "LONGTEXT")
	private String actionFeedback;

	@Column(name = "result_feedback", columnDefinition = "LONGTEXT")
	private String resultFeedback;

	protected StarAnalysis() {
	}

	public static StarAnalysis create(
			Answer answer,
			Float situationScore,
			Float taskScore,
			Float actionScore,
			Float resultScore,
			Float totalScore,
			String situationFeedback,
			String taskFeedback,
			String actionFeedback,
			String resultFeedback
	) {
		StarAnalysis analysis = new StarAnalysis();
		analysis.answer = answer;
		analysis.situationScore = situationScore;
		analysis.taskScore = taskScore;
		analysis.actionScore = actionScore;
		analysis.resultScore = resultScore;
		analysis.totalScore = totalScore;
		analysis.situationFeedback = situationFeedback;
		analysis.taskFeedback = taskFeedback;
		analysis.actionFeedback = actionFeedback;
		analysis.resultFeedback = resultFeedback;
		return analysis;
	}
}

