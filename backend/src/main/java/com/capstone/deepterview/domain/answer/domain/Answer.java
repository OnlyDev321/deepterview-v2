package com.capstone.deepterview.domain.answer.domain;

import com.capstone.deepterview.domain.interview.domain.Question;
import com.capstone.deepterview.global.common.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.Getter;
import org.hibernate.annotations.SQLRestriction;

import java.time.LocalDateTime;

@Getter
@Entity
@Table(name = "answer")
@SQLRestriction("deleted_at is null")
public class Answer extends BaseTimeEntity {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@OneToOne(optional = false)
	@JoinColumn(name = "question_id", unique = true)
	private Question question;

	@Column(name = "audio_file_path", length = 500)
	private String audioFilePath;

	@Lob
	@Column(name = "submitted_text")
	private String submittedText;

	@Lob
	private String transcript;

	@Column(name = "duration_sec")
	private Integer durationSec;

	@Enumerated(EnumType.STRING)
	@Column(name = "completion_status", nullable = false, length = 20)
	private CompletionStatus completionStatus;

	@Column(name = "deleted_at")
	private LocalDateTime deletedAt;

	@OneToOne(mappedBy = "answer")
	private SpeechAnalysis speechAnalysis;

	@OneToOne(mappedBy = "answer")
	private StarAnalysis starAnalysis;

	@OneToOne(mappedBy = "answer")
	private NonverbalAnalysis nonverbalAnalysis;

	@OneToOne(mappedBy = "answer")
	private LlmFeedback llmFeedback;

	protected Answer() {
	}

	public static Answer create(
			Question question,
			String audioFilePath,
			String submittedText,
			String transcript,
			Integer durationSec,
			CompletionStatus completionStatus
	) {
		Answer answer = new Answer();
		answer.question = question;
		answer.audioFilePath = audioFilePath;
		answer.submittedText = submittedText;
		answer.transcript = transcript;
		answer.durationSec = durationSec;
		answer.completionStatus = completionStatus;
		return answer;
	}

	public void updateAudio(String audioFilePath, Integer durationSec) {
		this.audioFilePath = audioFilePath;
		this.durationSec = durationSec;
	}

	public void updateTranscript(String transcript) {
		this.transcript = transcript;
	}

	public void softDelete(LocalDateTime deletedAt) {
		this.deletedAt = deletedAt;
	}
}

