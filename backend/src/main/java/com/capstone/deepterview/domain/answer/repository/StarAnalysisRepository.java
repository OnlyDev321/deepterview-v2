package com.capstone.deepterview.domain.answer.repository;

import com.capstone.deepterview.domain.answer.domain.StarAnalysis;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface StarAnalysisRepository extends JpaRepository<StarAnalysis, Long> {
	Optional<StarAnalysis> findByAnswer_Id(Long answerId);
}
