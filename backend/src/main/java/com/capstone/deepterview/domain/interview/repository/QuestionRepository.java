package com.capstone.deepterview.domain.interview.repository;

import com.capstone.deepterview.domain.interview.domain.Question;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface QuestionRepository extends JpaRepository<Question, Long> {
	List<Question> findBySessionIdOrderByOrderNumAsc(Long sessionId);

	@Query("SELECT q FROM Question q LEFT JOIN FETCH q.answer WHERE q.session.id = :sessionId ORDER BY q.orderNum ASC")
	List<Question> findBySessionIdWithAnswerOrderByOrderNumAsc(@Param("sessionId") Long sessionId);

	@Query("SELECT q FROM Question q JOIN FETCH q.session s JOIN FETCH s.user WHERE q.id = :id")
	Optional<Question> findByIdWithSessionUser(@Param("id") Long id);

	int countBySessionId(Long sessionId);

	@Query("""
			SELECT q.content FROM Question q
			JOIN q.session s
			WHERE s.user.id = :userId
			  AND s.jobCategory.id = :jobCategoryId
			  AND s.deletedAt IS NULL
			  AND q.deletedAt IS NULL
			ORDER BY q.createdAt DESC""")
	List<String> findPastQuestionContentsByUserAndJobCategory(@Param("userId") Long userId,
			@Param("jobCategoryId") Long jobCategoryId, Pageable pageable);
}

