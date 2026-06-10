package com.capstone.deepterview.domain.interview.repository;

import com.capstone.deepterview.domain.interview.domain.InterviewSession;
import com.capstone.deepterview.domain.interview.domain.SessionStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface InterviewSessionRepository extends JpaRepository<InterviewSession, Long> {

	@EntityGraph(attributePaths = {"jobCategory", "feedbackReport"})
	Page<InterviewSession> findByUserId(Long userId, Pageable pageable);

	@EntityGraph(attributePaths = {"jobCategory", "feedbackReport"})
	Page<InterviewSession> findByUserIdAndStatus(Long userId, SessionStatus status, Pageable pageable);

	@EntityGraph(attributePaths = {"jobCategory", "questions"})
	Optional<InterviewSession> findByIdAndUserId(Long id, Long userId);
}

