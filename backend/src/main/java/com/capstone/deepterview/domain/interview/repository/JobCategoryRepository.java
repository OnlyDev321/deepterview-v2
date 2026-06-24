package com.capstone.deepterview.domain.interview.repository;

import com.capstone.deepterview.domain.interview.domain.JobCategory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface JobCategoryRepository extends JpaRepository<JobCategory, Long> {
	List<JobCategory> findByActiveTrueAndParentIsNullOrderByIdAsc();

	List<JobCategory> findByActiveTrueAndParentIdOrderByIdAsc(Long parentId);
}

