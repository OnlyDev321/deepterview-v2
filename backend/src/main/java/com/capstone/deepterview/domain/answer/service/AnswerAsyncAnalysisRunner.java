package com.capstone.deepterview.domain.answer.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class AnswerAsyncAnalysisRunner {

    private final RestTemplate restTemplate;

    @Value("${app.python.base-url}")
    private String pythonBaseUrl;

    @Value("${app.python.callback-base-url}")
    private String callbackBaseUrl;

    @Async
    public void runVideoAnalysis(Long answerId, String filePath, String language) {
        try {
            Map<String, String> body = Map.of(
                    "interview_id", String.valueOf(answerId),
                    "video_path", filePath,
                    "language", language,
                    "callback_url", callbackBaseUrl + "/api/v1/internal/analysis/callback"
            );
            restTemplate.postForObject(pythonBaseUrl + "/api/v1/analyze", body, Map.class);
        } catch (Exception e) {
            log.error("Python 영상 분석 요청 실패 answerId={}", answerId, e);
        }
    }
}
