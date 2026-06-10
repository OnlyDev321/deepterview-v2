package com.capstone.deepterview.domain.answer.domain;

import com.capstone.deepterview.global.common.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.Getter;

@Getter
@Entity
@Table(name = "llm_feedback")
public class LlmFeedback extends BaseTimeEntity {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@OneToOne(optional = false)
	@JoinColumn(name = "answer_id", unique = true)
	private Answer answer;

	@Column(columnDefinition = "LONGTEXT")
	private String strength;

	@Column(columnDefinition = "LONGTEXT")
	private String weakness;

	@Column(columnDefinition = "LONGTEXT")
	private String improvement;

	@Column(name = "followup_question_1", length = 500)
	private String followupQuestion1;

	@Column(name = "followup_question_2", length = 500)
	private String followupQuestion2;

	@Column(name = "followup_question_3", length = 500)
	private String followupQuestion3;

	@Column(name = "model_name", length = 100)
	private String modelName;

	@Column(name = "prompt_tokens")
	private Integer promptTokens;

	@Column(name = "completion_tokens")
	private Integer completionTokens;

	@Column(name = "raw_prompt", columnDefinition = "LONGTEXT")
	private String rawPrompt;

	@Column(name = "raw_response", columnDefinition = "LONGTEXT")
	private String rawResponse;

	protected LlmFeedback() {
	}

	public static LlmFeedback create(
			Answer answer,
			String strength,
			String weakness,
			String improvement,
			String followupQuestion1,
			String followupQuestion2,
			String followupQuestion3,
			String modelName,
			Integer promptTokens,
			Integer completionTokens,
			String rawPrompt,
			String rawResponse
	) {
		LlmFeedback feedback = new LlmFeedback();
		feedback.answer = answer;
		feedback.strength = strength;
		feedback.weakness = weakness;
		feedback.improvement = improvement;
		feedback.followupQuestion1 = followupQuestion1;
		feedback.followupQuestion2 = followupQuestion2;
		feedback.followupQuestion3 = followupQuestion3;
		feedback.modelName = modelName;
		feedback.promptTokens = promptTokens;
		feedback.completionTokens = completionTokens;
		feedback.rawPrompt = rawPrompt;
		feedback.rawResponse = rawResponse;
		return feedback;
	}
}

