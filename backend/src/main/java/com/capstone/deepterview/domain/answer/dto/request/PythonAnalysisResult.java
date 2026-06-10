package com.capstone.deepterview.domain.answer.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;
import java.util.Map;

public record PythonAnalysisResult(
        PythonAudioResult audio,
        PythonTranscriptionResult transcription,
        @JsonProperty("frame_count") Integer frameCount,
        @JsonProperty("gaze_frames") List<Map<String, Object>> gazeFrames,
        @JsonProperty("nonverbal_summary") NonverbalSummary nonverbalSummary
) {}

