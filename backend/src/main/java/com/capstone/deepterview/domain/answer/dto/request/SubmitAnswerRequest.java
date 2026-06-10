package com.capstone.deepterview.domain.answer.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record SubmitAnswerRequest(
        @NotNull Long questionId,
        @NotBlank String transcript,
        @Min(1) int durationSec,
        @NotBlank String completionStatus
) {}
