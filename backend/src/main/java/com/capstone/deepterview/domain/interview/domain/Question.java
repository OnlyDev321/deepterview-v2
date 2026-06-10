package com.capstone.deepterview.domain.interview.domain;

import com.capstone.deepterview.domain.answer.domain.Answer;
import com.capstone.deepterview.global.common.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.Getter;
import org.hibernate.annotations.SQLRestriction;

import java.time.LocalDateTime;

@Getter
@Entity
@Table(name = "question")
@SQLRestriction("deleted_at is null")
public class Question extends BaseTimeEntity {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(optional = false)
	@JoinColumn(name = "session_id")
	private InterviewSession session;

	@Lob
	@Column(nullable = false, columnDefinition = "TEXT")
	private String content;

	@Enumerated(EnumType.STRING)
	@Column(name = "question_type", nullable = false, length = 20)
	private QuestionType questionType;

	@Column(name = "order_num", nullable = false)
	private int orderNum;

	@Column(name = "time_limit_sec", nullable = false)
	private int timeLimitSec;

	@Column(name = "deleted_at")
	private LocalDateTime deletedAt;

	@OneToOne(mappedBy = "question")
	private Answer answer;

	protected Question() {
	}

	public static Question create(
			InterviewSession session,
			String content,
			QuestionType questionType,
			int orderNum,
			int timeLimitSec
	) {
		Question question = new Question();
		question.session = session;
		question.content = content;
		question.questionType = questionType;
		question.orderNum = orderNum;
		question.timeLimitSec = timeLimitSec;
		return question;
	}

	public void softDelete(LocalDateTime deletedAt) {
		this.deletedAt = deletedAt;
	}
}

