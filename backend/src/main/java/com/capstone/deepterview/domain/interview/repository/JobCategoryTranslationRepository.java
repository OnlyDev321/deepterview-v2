package com.capstone.deepterview.domain.interview.repository;

import com.capstone.deepterview.domain.interview.domain.JobCategoryTranslation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface JobCategoryTranslationRepository extends JpaRepository<JobCategoryTranslation, Long> {
    List<JobCategoryTranslation> findByJobCategory_IdInAndLanguage(List<Long> jobCategoryIds, String language);
}
