package com.capstone.deepterview.domain.answer.domain;

import com.capstone.deepterview.global.common.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.Getter;

@Getter
@Entity
@Table(name = "speech_analysis")
public class SpeechAnalysis extends BaseTimeEntity {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@OneToOne(optional = false)
	@JoinColumn(name = "answer_id", unique = true)
	private Answer answer;

	private Float wpm;

	@Column(name = "filler_count")
	private Integer fillerCount;

	@Column(name = "filler_words_json", columnDefinition = "json")
	private String fillerWordsJson;

	@Column(name = "silence_ratio")
	private Float silenceRatio;

	@Column(name = "pace_score")
	private Float paceScore;

	@Column(name = "clarity_score")
	private Float clarityScore;

	@Lob
	private String feedback;

	protected SpeechAnalysis() {
	}

	public static SpeechAnalysis create(
			Answer answer,
			Float wpm,
			Integer fillerCount,
			String fillerWordsJson,
			Float silenceRatio,
			Float paceScore,
			Float clarityScore,
			String feedback
	) {
		SpeechAnalysis analysis = new SpeechAnalysis();
		analysis.answer = answer;
		analysis.wpm = wpm;
		analysis.fillerCount = fillerCount;
		analysis.fillerWordsJson = fillerWordsJson;
		analysis.silenceRatio = silenceRatio;
		analysis.paceScore = paceScore;
		analysis.clarityScore = clarityScore;
		analysis.feedback = feedback;
		return analysis;
	}
}

