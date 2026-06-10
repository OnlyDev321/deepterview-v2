package com.capstone.deepterview.domain.answer.dto.request;

public record PythonTranscriptionSegment(
        Double start,
        Double end,
        String text
) {}
