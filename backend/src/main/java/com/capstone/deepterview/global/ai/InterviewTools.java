package com.capstone.deepterview.global.ai;

import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;

@Component
@Slf4j
public class InterviewTools {

    private final String tavilyApiKey;
    private final RestClient restClient;

    public InterviewTools(@Value("${tavily.api-key}") String tavilyApiKey) {
        this.tavilyApiKey = tavilyApiKey;
        this.restClient = RestClient.create();
    }

    @Tool(description = "면접 답변에서 언급된 기술 키워드를 검색해서 관련 개념과 모범 답변 기준을 반환합니다.")
    public String searchTechDocs(String keyword) {
        log.info("Tool 호출됨! keyword: {}", keyword);

        Map<String, Object> requestBody = Map.of(
            "api_key", tavilyApiKey,
            "query", keyword + " 기술 면접 개념",
            "search_depth", "basic",
            "max_results", 3,
            "include_answer", true
        );

        log.info("Tavily API 호출 시도");
        TavilyResponse response = restClient.post()
            .uri("https://api.tavily.com/search")
            .contentType(MediaType.APPLICATION_JSON)
            .body(requestBody)
            .retrieve()
            .body(TavilyResponse.class);
        log.info("Tavily API 응답 받기 성공!");

        if (response == null) return "검색 결과를 가져오지 못했습니다.";

        StringBuilder result = new StringBuilder();

        if (response.answer() != null) {
            result.append("[요약]\n").append(response.answer()).append("\n\n");
        }

        if (response.results() != null) {
            result.append("[관련 문서]\n");
            for (TavilyResult item : response.results()) {
                result.append("- ").append(item.title()).append("\n");
                result.append("  ").append(item.content()).append("\n");
            }
        }

        return result.toString();
    }

    @Tool(description = "면접 답변을 분석해서 면접관이 할 법한 꼬리 질문 3개를 생성합니다.")
    public String getFollowUpQuestions(String answerSummary) {
        log.info("꼬리 질문 생성 Tool 호출됨!");
        return "꼬리 질문은 Claude가 직접 생성합니다.";
    }

    private record TavilyResponse(String answer, List<TavilyResult> results) {}
    private record TavilyResult(String title, String url, String content, Double score) {}
}