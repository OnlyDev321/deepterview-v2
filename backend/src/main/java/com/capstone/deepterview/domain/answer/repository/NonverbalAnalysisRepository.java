package com.capstone.deepterview.domain.answer.repository;

import com.capstone.deepterview.domain.answer.domain.NonverbalAnalysis;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface NonverbalAnalysisRepository extends JpaRepository<NonverbalAnalysis, Long> {
	Optional<NonverbalAnalysis> findByAnswer_Id(Long answerId);
}
