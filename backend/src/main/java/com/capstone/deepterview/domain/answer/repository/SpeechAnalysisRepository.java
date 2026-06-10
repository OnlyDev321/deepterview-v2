package com.capstone.deepterview.domain.answer.repository;

import com.capstone.deepterview.domain.answer.domain.SpeechAnalysis;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface SpeechAnalysisRepository extends JpaRepository<SpeechAnalysis, Long> {
	Optional<SpeechAnalysis> findByAnswer_Id(Long answerId);
}
