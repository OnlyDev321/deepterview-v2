package com.capstone.deepterview.domain.answer.domain;

import com.capstone.deepterview.global.common.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.Getter;

@Getter
@Entity
@Table(name = "nonverbal_analysis")
public class NonverbalAnalysis extends BaseTimeEntity {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@OneToOne(optional = false)
	@JoinColumn(name = "answer_id", unique = true)
	private Answer answer;

	@Column(name = "eye_contact_score")
	private Float eyeContactScore;

	@Column(name = "confidence_score")
	private Float confidenceScore;

	@Column(name = "anxiety_score")
	private Float anxietyScore;

	@Column(name = "smile_ratio")
	private Float smileRatio;

	@Column(name = "head_stability_score")
	private Float headStabilityScore;

	@Enumerated(EnumType.STRING)
	@Column(name = "dominant_emotion", length = 20)
	private Emotion dominantEmotion;

	@Column(name = "emotion_distribution_json", columnDefinition = "json")
	private String emotionDistributionJson;

	@Lob
	private String feedback;

	protected NonverbalAnalysis() {
	}

	public static NonverbalAnalysis create(
			Answer answer,
			Float eyeContactScore,
			Float confidenceScore,
			Float anxietyScore,
			Float smileRatio,
			Float headStabilityScore,
			Emotion dominantEmotion,
			String emotionDistributionJson,
			String feedback
	) {
		NonverbalAnalysis analysis = new NonverbalAnalysis();
		analysis.answer = answer;
		analysis.eyeContactScore = eyeContactScore;
		analysis.confidenceScore = confidenceScore;
		analysis.anxietyScore = anxietyScore;
		analysis.smileRatio = smileRatio;
		analysis.headStabilityScore = headStabilityScore;
		analysis.dominantEmotion = dominantEmotion;
		analysis.emotionDistributionJson = emotionDistributionJson;
		analysis.feedback = feedback;
		return analysis;
	}

	/** 외부 비언어 분석 서버에서 재전송 시 기존 행을 갱신합니다. */
	public void updateNonverbal(
			Float eyeContactScore,
			Float confidenceScore,
			Float anxietyScore,
			Float smileRatio,
			Float headStabilityScore,
			Emotion dominantEmotion,
			String emotionDistributionJson,
			String feedback
	) {
		this.eyeContactScore = eyeContactScore;
		this.confidenceScore = confidenceScore;
		this.anxietyScore = anxietyScore;
		this.smileRatio = smileRatio;
		this.headStabilityScore = headStabilityScore;
		this.dominantEmotion = dominantEmotion;
		this.emotionDistributionJson = emotionDistributionJson;
		this.feedback = feedback;
	}
}

