package com.capstone.deepterview.domain.report.repository;

import com.capstone.deepterview.domain.report.domain.FeedbackReport;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface FeedbackReportRepository extends JpaRepository<FeedbackReport, Long> {
	Optional<FeedbackReport> findBySession_Id(Long sessionId);
}
