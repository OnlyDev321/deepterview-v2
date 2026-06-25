package com.capstone.deepterview.domain.interview.repository;

import com.capstone.deepterview.domain.interview.domain.InterviewSession;
import com.capstone.deepterview.domain.interview.domain.SessionStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Optional;

public interface InterviewSessionRepository extends JpaRepository<InterviewSession, Long> {

	@EntityGraph(attributePaths = {"jobCategory", "feedbackReport"})
	Page<InterviewSession> findByUserId(Long userId, Pageable pageable);

	@EntityGraph(attributePaths = {"jobCategory", "feedbackReport"})
	Page<InterviewSession> findByUserIdAndStatus(Long userId, SessionStatus status, Pageable pageable);

	@EntityGraph(attributePaths = {"jobCategory", "feedbackReport"})
	@Query("SELECT s FROM InterviewSession s WHERE s.user.id = :userId "
			+ "AND (:status IS NULL OR s.status = :status) "
			+ "AND (:jobCategoryId IS NULL OR s.jobCategory.id = :jobCategoryId) "
			+ "AND (:cutoff IS NULL OR s.createdAt >= :cutoff)")
	Page<InterviewSession> findByUserIdWithFilters(@Param("userId") Long userId,
			@Param("status") SessionStatus status,
			@Param("jobCategoryId") Long jobCategoryId,
			@Param("cutoff") LocalDateTime cutoff,
			Pageable pageable);

	@EntityGraph(attributePaths = {"jobCategory", "questions"})
	Optional<InterviewSession> findByIdAndUserId(Long id, Long userId);
}

