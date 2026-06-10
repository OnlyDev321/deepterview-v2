package com.capstone.deepterview.domain.interview.dto.request;

import com.capstone.deepterview.domain.interview.domain.SessionType;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateSessionRequest(
		@NotNull(message = "jobCategoryId는 필수입니다.")
		Long jobCategoryId,

		@NotBlank(message = "jobTitle은 필수입니다.")
		String jobTitle,

		@Min(value = 0, message = "careerYears는 0 이상이어야 합니다.")
		int careerYears,

		SessionType sessionType,

		@Min(value = 1, message = "totalQuestions는 1 이상이어야 합니다.")
		@Max(value = 10, message = "totalQuestions는 10 이하여야 합니다.")
		int totalQuestions
) {
}

