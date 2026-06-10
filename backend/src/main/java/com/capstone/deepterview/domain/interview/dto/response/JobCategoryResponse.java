package com.capstone.deepterview.domain.interview.dto.response;

import com.capstone.deepterview.domain.interview.domain.JobCategory;

public record JobCategoryResponse(
		Long id,
		String name,
		String description
) {
	public static JobCategoryResponse from(JobCategory jobCategory) {
		return new JobCategoryResponse(
				jobCategory.getId(),
				jobCategory.getName(),
				jobCategory.getDescription()
		);
	}
}

