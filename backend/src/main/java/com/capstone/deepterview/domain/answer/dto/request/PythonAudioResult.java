package com.capstone.deepterview.domain.answer.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;

public record PythonAudioResult(
        @JsonProperty("tempo_bpm") Double tempoBpm,
        @JsonProperty("pitch_mean_hz") Double pitchMeanHz,
        @JsonProperty("pitch_std_hz") Double pitchStdHz
) {}
