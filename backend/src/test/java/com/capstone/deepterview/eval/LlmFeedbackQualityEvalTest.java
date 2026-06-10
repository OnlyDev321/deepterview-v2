package com.capstone.deepterview.eval;

import com.capstone.deepterview.domain.answer.dto.response.LlmFeedbackView;
import com.capstone.deepterview.global.ai.LlmAnalysisResult;
import com.capstone.deepterview.global.ai.LlmFeedbackService;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.util.List;
import java.util.stream.Stream;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * LLM-as-a-Judge 피드백 품질 평가 테스트
 *
 * 실제 Claude API를 호출하므로 일반 빌드에서는 제외됩니다.
 * 실행: ./gradlew test -Dgroups=eval
 *
 * 평가 기준 (각 0~5점, 합산 25점 만점)
 *   - 관련성: 피드백이 질문·답변 내용과 관련 있는가
 *   - 정확성: 강점·약점 분석이 실제 답변에 근거하는가
 *   - 구체성: 추상적이지 않고 구체적인 내용을 담고 있는가
 *   - 건설성: 개선 방향이 실용적이고 실행 가능한가
 *   - 꼬리질문 적절성: 답변에서 자연스럽게 파생된 질문인가
 */
@Tag("eval")
@SpringBootTest
@ActiveProfiles({"test", "local"})
class LlmFeedbackQualityEvalTest {

    @Autowired private LlmFeedbackService llmFeedbackService;
    @Autowired private ChatClient chatClient;
    @Autowired private ObjectMapper objectMapper;

    // ── 시나리오 정의 ──────────────────────────────────────────────────────

    static Stream<Arguments> scenarios() {
        return Stream.of(

            Arguments.of("good-star",
                "어려운 기술적 문제를 해결한 경험을 말씀해주세요.",
                """
                이전 직장에서 결제 API 응답 시간이 3초를 넘는 문제가 있었습니다.
                원인을 분석하니 외부 PG사 호출 시 타임아웃 설정이 없어 대기가 쌓이는 것이었습니다.
                저는 비동기 처리와 Circuit Breaker 패턴을 도입하고 타임아웃을 500ms로 설정했습니다.
                배포 후 응답 시간이 평균 0.4초로 개선되었고, 결제 실패율도 12%에서 1% 미만으로 줄었습니다.
                """,
                18,  // 기대 최소 점수 (25점 만점)
                "STAR 구조가 명확하고 수치 기반의 좋은 답변"
            ),

            Arguments.of("vague-answer",
                "본인의 강점과 약점에 대해 말씀해주세요.",
                "저는 성실하고 책임감이 강합니다. 약점은 가끔 너무 완벽을 추구한다는 점입니다.",
                5,   // 두루뭉술해서 낮은 점수 예상
                "구체적 근거 없는 클리셰 답변"
            ),

            Arguments.of("off-topic",
                "팀에서 갈등이 발생했을 때 어떻게 해결했는지 경험을 말씀해주세요.",
                "저는 Java와 Spring Boot를 주력으로 사용하며 백엔드 개발을 하고 있습니다.",
                3,   // 질문과 무관하므로 매우 낮은 점수 예상
                "질문과 무관한 답변 — 피드백이 이를 명확히 지적해야 함"
            ),

            Arguments.of("incomplete-answer",
                "객체지향의 4가지 특성을 설명하고 실무에서 활용한 사례를 말씀해주세요.",
                "캡슐화, 상속, 다형성, 추상화가 있습니다.",
                8,   // 개념 나열만 하고 실무 사례 없음
                "개념만 나열, 실무 적용 경험 없는 불완전한 답변"
            ),

            Arguments.of("excellent-technical",
                "동시성 문제를 경험한 적이 있나요? 어떻게 해결했나요?",
                """
                재고 차감 로직에서 여러 스레드가 동시에 접근해 재고가 음수가 되는 문제를 경험했습니다.
                처음에는 synchronized를 사용했지만 분산 서버 환경에서는 효과가 없었습니다.
                Redis의 SETNX 명령어로 분산 락을 구현하고, 락 획득 실패 시 재시도 로직을 추가했습니다.
                TTL을 설정해 데드락도 방지했고, 이후 재고 오류가 완전히 사라졌습니다.
                """,
                20,
                "기술적 깊이가 있고 문제 해결 과정이 체계적인 답변"
            )
        );
    }

    // ── 평가 테스트 ────────────────────────────────────────────────────────

    @ParameterizedTest(name = "[{index}] {4}")
    @MethodSource("scenarios")
    void evaluateFeedbackQuality(
            String scenarioId,
            String question,
            String answer,
            int minExpectedScore,
            String description
    ) {
        // 1. 실제 LLM 피드백 생성
        LlmAnalysisResult analysisResult = llmFeedbackService.generateAnalysis(answer, question);
        LlmAnalysisResult.FeedbackPart fp = analysisResult.feedback();
        LlmFeedbackView feedback = new LlmFeedbackView(
                fp != null ? fp.strength() : null,
                fp != null ? fp.weakness() : null,
                fp != null ? fp.improvement() : null,
                fp != null && fp.followupQuestions() != null ? fp.followupQuestions() : List.of()
        );

        assertThat(feedback.strength())
                .as("피드백 파싱 실패 — strength가 null")
                .isNotNull();

        // 2. Judge LLM으로 피드백 품질 평가
        EvalResult result = judgeWithLlm(question, answer, feedback);

        System.out.printf("""
                %n══ [%s] %s ══
                생성된 피드백:
                  strength   : %s
                  weakness   : %s
                  improvement: %s
                  followups  : %s
                판관 평가:
                  관련성    %d/5 — %s
                  정확성    %d/5 — %s
                  구체성    %d/5 — %s
                  건설성    %d/5 — %s
                  꼬리질문  %d/5 — %s
                  합계: %d/25 (기준: %d 이상)
                %n""",
                scenarioId, description,
                feedback.strength(), feedback.weakness(),
                feedback.improvement(), feedback.followupQuestions(),
                result.relevance(), result.relevanceReason(),
                result.accuracy(), result.accuracyReason(),
                result.specificity(), result.specificityReason(),
                result.constructiveness(), result.constructivenessReason(),
                result.followupQuality(), result.followupQualityReason(),
                result.totalScore(), minExpectedScore
        );

        assertThat(result.totalScore())
                .as("""
                        [%s] 피드백 품질 기준 미달 (점수 %d/25, 기준 %d 이상)
                        가장 낮은 항목: 관련성=%d 정확성=%d 구체성=%d 건설성=%d 꼬리질문=%d
                        """,
                        description, result.totalScore(), minExpectedScore,
                        result.relevance(), result.accuracy(),
                        result.specificity(), result.constructiveness(), result.followupQuality())
                .isGreaterThanOrEqualTo(minExpectedScore);
    }

    // ── Judge 호출 ─────────────────────────────────────────────────────────

    private EvalResult judgeWithLlm(String question, String answer, LlmFeedbackView feedback) {
        String prompt = """
                당신은 면접 코칭 피드백의 품질을 평가하는 전문가입니다.

                [면접 질문]
                %s

                [지원자 답변]
                %s

                [생성된 피드백]
                - 잘한 점(strength): %s
                - 부족한 점(weakness): %s
                - 개선 방향(improvement): %s
                - 꼬리 질문: %s

                위 피드백을 다음 5가지 기준으로 각각 0~5점으로 평가하세요.

                1. 관련성(relevance): 피드백이 질문과 답변 내용에 실제로 관련 있는가
                2. 정확성(accuracy): 강점·약점 분석이 실제 답변에 근거하는가 (지어내지 않았는가)
                3. 구체성(specificity): 추상적·클리셰가 아닌 구체적 내용을 담고 있는가
                4. 건설성(constructiveness): 개선 방향이 실용적이고 실행 가능한가
                5. 꼬리질문 적절성(followupQuality): 답변에서 자연스럽게 파생된 질문인가

                반드시 아래 JSON 형식으로만 응답하세요.
                {
                  "relevance": 점수,
                  "relevanceReason": "한 줄 근거",
                  "accuracy": 점수,
                  "accuracyReason": "한 줄 근거",
                  "specificity": 점수,
                  "specificityReason": "한 줄 근거",
                  "constructiveness": 점수,
                  "constructivenessReason": "한 줄 근거",
                  "followupQuality": 점수,
                  "followupQualityReason": "한 줄 근거"
                }
                """.formatted(
                question, answer,
                feedback.strength(), feedback.weakness(),
                feedback.improvement(),
                feedback.followupQuestions() != null ? String.join(", ", feedback.followupQuestions()) : "없음"
        );

        String raw = chatClient.prompt()
                .user(prompt)
                .call()
                .content();

        int start = raw.indexOf('{');
        int end = raw.lastIndexOf('}');
        if (start < 0 || end < 0) {
            throw new RuntimeException("Judge 응답에서 JSON을 찾을 수 없습니다: " + raw);
        }
        String cleaned = raw.substring(start, end + 1);

        try {
            return objectMapper.readValue(cleaned, EvalResult.class);
        } catch (Exception e) {
            throw new RuntimeException("Judge 응답 파싱 실패: " + cleaned, e);
        }
    }

    // ── 판관 응답 모델 ─────────────────────────────────────────────────────

    @JsonIgnoreProperties(ignoreUnknown = true)
    record EvalResult(
            int relevance,       String relevanceReason,
            int accuracy,        String accuracyReason,
            int specificity,     String specificityReason,
            int constructiveness,String constructivenessReason,
            int followupQuality, String followupQualityReason
    ) {
        int totalScore() {
            return relevance + accuracy + specificity + constructiveness + followupQuality;
        }
    }
}
