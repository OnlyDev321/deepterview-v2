package com.capstone.deepterview.domain.interview.dto.response;

import com.capstone.deepterview.domain.interview.domain.JobCategory;
import com.capstone.deepterview.domain.interview.domain.JobCategoryTranslation;
import com.capstone.deepterview.domain.interview.domain.SessionType;

import java.util.List;
import java.util.Map;

public record JobCategoryResponse(
		Long id,
		String name,
		SessionType type,
		String description,
		List<JobCategoryResponse> children
) {
	private static String translatedName(JobCategory dept, Map<Long, JobCategoryTranslation> map) {
		if (map == null) return dept.getName();
		JobCategoryTranslation t = map.get(dept.getId());
		return t != null && t.getName() != null ? t.getName() : dept.getName();
	}

	private static String translatedDesc(JobCategory dept, Map<Long, JobCategoryTranslation> map) {
		if (map == null) return dept.getDescription();
		JobCategoryTranslation t = map.get(dept.getId());
		return t != null && t.getDescription() != null ? t.getDescription() : dept.getDescription();
	}

	public static JobCategoryResponse from(JobCategory department) {
		return from(department, null);
	}

	public static JobCategoryResponse from(JobCategory department, Map<Long, JobCategoryTranslation> translationMap) {
		return new JobCategoryResponse(
				department.getId(),
				translatedName(department, translationMap),
				department.getType(),
				translatedDesc(department, translationMap),
				List.of()
		);
	}

	public static JobCategoryResponse withChildren(JobCategory department, List<JobCategoryResponse> children) {
		return withChildren(department, children, null);
	}

	public static JobCategoryResponse withChildren(JobCategory department, List<JobCategoryResponse> children, Map<Long, JobCategoryTranslation> translationMap) {
		return new JobCategoryResponse(
				department.getId(),
				translatedName(department, translationMap),
				department.getType(),
				translatedDesc(department, translationMap),
				children
		);
	}
}
