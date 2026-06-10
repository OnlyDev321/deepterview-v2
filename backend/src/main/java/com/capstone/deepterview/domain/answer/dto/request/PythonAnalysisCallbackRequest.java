package com.capstone.deepterview.domain.answer.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;

public record PythonAnalysisCallbackRequest(
        @JsonProperty("job_id") String jobId,
        @JsonProperty("interview_id") String interviewId,
        String status,
        PythonAnalysisResult result,
        String error
) {}
