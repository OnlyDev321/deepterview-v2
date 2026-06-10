package com.capstone.deepterview.domain.answer.dto.request;

import java.util.List;

public record PythonTranscriptionResult(
        String text,
        String language,
        List<PythonTranscriptionSegment> segments
) {}
