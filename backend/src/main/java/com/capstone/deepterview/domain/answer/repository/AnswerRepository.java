package com.capstone.deepterview.domain.answer.repository;

import com.capstone.deepterview.domain.answer.domain.Answer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface AnswerRepository extends JpaRepository<Answer, Long> {

	boolean existsByQuestion_Id(Long questionId);

	@Query("SELECT a FROM Answer a JOIN FETCH a.question q JOIN FETCH q.session s JOIN FETCH s.user WHERE a.id = :id")
	Optional<Answer> findByIdWithQuestionSessionUser(@Param("id") Long id);

	@Query("SELECT a FROM Answer a JOIN a.question q WHERE q.session.id = :sessionId AND a.audioFilePath IS NOT NULL")
	List<Answer> findBySessionIdWithVideoPath(@Param("sessionId") Long sessionId);

	@Query("SELECT COUNT(a) FROM Answer a JOIN a.question q WHERE q.session.id = :sessionId")
	long countBySessionId(@Param("sessionId") Long sessionId);

	@Query("""
			SELECT COUNT(DISTINCT a.id) FROM Answer a
			JOIN a.question q
			LEFT JOIN a.speechAnalysis s
			LEFT JOIN a.nonverbalAnalysis n
			WHERE q.session.id = :sessionId
			AND (s IS NOT NULL OR n IS NOT NULL)
			""")
	long countPythonAnalysesReadyBySessionId(@Param("sessionId") Long sessionId);

	@Query("""
			SELECT a FROM Answer a
			JOIN FETCH a.question q
			WHERE q.session.id = :sessionId
			ORDER BY q.orderNum ASC
			""")
	List<Answer> findBySessionIdWithQuestionOrderByOrderNum(@Param("sessionId") Long sessionId);

	/**
	 * @deprecated 여러 컬렉션 JOIN FETCH 시 Hibernate 오류 가능 —
	 *             {@link #findBySessionIdWithQuestionOrderByOrderNum} 사용
	 */
	@Deprecated
	@Query("SELECT a FROM Answer a " +
			"JOIN FETCH a.question q " +
			"LEFT JOIN FETCH a.speechAnalysis " +
			"LEFT JOIN FETCH a.nonverbalAnalysis " +
			"LEFT JOIN FETCH a.starAnalysis " +
			"LEFT JOIN FETCH a.llmFeedback " +
			"WHERE q.session.id = :sessionId " +
			"ORDER BY q.orderNum ASC")
	List<Answer> findBySessionIdWithAnalyses(@Param("sessionId") Long sessionId);
}
