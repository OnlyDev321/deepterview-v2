package com.capstone.deepterview.domain.interview.dto.response;

import com.capstone.deepterview.domain.interview.domain.JobCategory;
import com.capstone.deepterview.domain.interview.domain.SessionType;

import java.util.List;

public record JobCategoryResponse(
		Long id,
		String name,
		SessionType type,
		String description,
		List<JobCategoryResponse> children
) {
	public static JobCategoryResponse from(JobCategory department) {
		return new JobCategoryResponse(
				department.getId(),
				department.getName(),
				department.getType(),
				department.getDescription(),
				List.of()
		);
	}

	public static JobCategoryResponse withChildren(JobCategory department, List<JobCategoryResponse> children) {
		return new JobCategoryResponse(
				department.getId(),
				department.getName(),
				department.getType(),
				department.getDescription(),
				children
		);
	}
}

