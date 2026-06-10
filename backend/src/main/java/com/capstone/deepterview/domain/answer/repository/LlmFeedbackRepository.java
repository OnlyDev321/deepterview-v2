package com.capstone.deepterview.domain.answer.repository;

import com.capstone.deepterview.domain.answer.domain.LlmFeedback;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface LlmFeedbackRepository extends JpaRepository<LlmFeedback, Long> {
	Optional<LlmFeedback> findByAnswer_Id(Long answerId);
}
