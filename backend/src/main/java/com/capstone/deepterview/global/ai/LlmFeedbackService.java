package com.capstone.deepterview.global.ai;

import com.capstone.deepterview.domain.answer.domain.Answer;
import com.capstone.deepterview.domain.interview.domain.AnswerLanguage;
import com.capstone.deepterview.domain.interview.domain.InterviewSession;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;

@Service
@RequiredArgsConstructor
public class LlmFeedbackService {

    private final ChatClient chatClient;
    private final InterviewTools interviewTools;
    private final ObjectMapper objectMapper;

    private static final Map<AnswerLanguage, String> LANGUAGE_INSTRUCTIONS = Map.of(
            AnswerLanguage.KOREAN, "- 반드시 한국어로 작성해 주세요.\n",
            AnswerLanguage.ENGLISH, "- Must be written in English.\n",
            AnswerLanguage.VIETNAMESE, "- Phải được viết bằng tiếng Việt.\n"
    );

    private static final Map<AnswerLanguage, String> ANALYSIS_JSON_EXAMPLES = Map.of(
            AnswerLanguage.KOREAN, """
                    {
                      "feedback": {
                        "strength": "잘한 점",
                        "weakness": "부족한 점",
                        "improvement": "개선 방향",
                        "followupQuestions": ["꼬리질문1", "꼬리질문2", "꼬리질문3"]
                      },
                      "star": {
                        "situationScore": 0.0,
                        "taskScore": 0.0,
                        "actionScore": 0.0,
                        "resultScore": 0.0,
                        "situationFeedback": "상황 설명에 대한 피드백",
                        "taskFeedback": "과제/목표 설명에 대한 피드백",
                        "actionFeedback": "구체적 행동에 대한 피드백",
                        "resultFeedback": "결과 및 배운 점에 대한 피드백"
                      }
                    }""",
            AnswerLanguage.ENGLISH, """
                    {
                      "feedback": {
                        "strength": "Well-done points",
                        "weakness": "Points to improve",
                        "improvement": "Direction for improvement",
                        "followupQuestions": ["follow-up question 1", "follow-up question 2", "follow-up question 3"]
                      },
                      "star": {
                        "situationScore": 0.0,
                        "taskScore": 0.0,
                        "actionScore": 0.0,
                        "resultScore": 0.0,
                        "situationFeedback": "Feedback on situation description",
                        "taskFeedback": "Feedback on task/goal description",
                        "actionFeedback": "Feedback on specific actions",
                        "resultFeedback": "Feedback on results and lessons learned"
                      }
                    }""",
            AnswerLanguage.VIETNAMESE, """
                    {
                      "feedback": {
                        "strength": "Điểm mạnh",
                        "weakness": "Điểm yếu",
                        "improvement": "Hướng cải thiện",
                        "followupQuestions": ["câu hỏi phụ 1", "câu hỏi phụ 2", "câu hỏi phụ 3"]
                      },
                      "star": {
                        "situationScore": 0.0,
                        "taskScore": 0.0,
                        "actionScore": 0.0,
                        "resultScore": 0.0,
                        "situationFeedback": "Phản hồi về mô tả tình huống",
                        "taskFeedback": "Phản hồi về mô tả nhiệm vụ/mục tiêu",
                        "actionFeedback": "Phản hồi về hành động cụ thể",
                        "resultFeedback": "Phản hồi về kết quả và bài học"
                      }
                    }"""
    );

    private static final Map<AnswerLanguage, String> REPORT_JSON_EXAMPLES = Map.of(
            AnswerLanguage.KOREAN, """
                    {
                      "strengthSummary": "면접 전반에 걸친 지원자의 강점 (2~3문장)",
                      "weaknessSummary": "면접 전반에 걸친 지원자의 약점 (2~3문장)",
                      "improvementPriority": "가장 우선적으로 개선해야 할 사항 (1~2문장)",
                      "aiSummary": "면접 전체에 대한 종합 평가 한 줄 요약"
                    }""",
            AnswerLanguage.ENGLISH, """
                    {
                      "strengthSummary": "Candidate's overall strengths across the interview (2-3 sentences)",
                      "weaknessSummary": "Candidate's overall weaknesses across the interview (2-3 sentences)",
                      "improvementPriority": "Top priority improvement area (1-2 sentences)",
                      "aiSummary": "One-line comprehensive evaluation of the entire interview"
                    }""",
            AnswerLanguage.VIETNAMESE, """
                    {
                      "strengthSummary": "Điểm mạnh tổng thể của ứng viên trong suốt buổi phỏng vấn (2-3 câu)",
                      "weaknessSummary": "Điểm yếu tổng thể của ứng viên trong suốt buổi phỏng vấn (2-3 câu)",
                      "improvementPriority": "Ưu tiên cải thiện hàng đầu (1-2 câu)",
                      "aiSummary": "Đánh giá tổng quan toàn bộ buổi phỏng vấn trong một câu"
                    }"""
    );

    private static final Map<AnswerLanguage, String> FALLBACK_FOLLOW_UPS = Map.of(
            AnswerLanguage.KOREAN, "말씀해 주신 내용에 대해 조금 더 구체적으로 설명해 주시겠습니까?",
            AnswerLanguage.ENGLISH, "Could you please elaborate on what you've just mentioned?",
            AnswerLanguage.VIETNAMESE, "Bạn có thể giải thích chi tiết hơn về những gì bạn vừa đề cập không?"
    );

    private static final Map<AnswerLanguage, String> FALLBACK_TIMEOUT = Map.of(
            AnswerLanguage.KOREAN, "이전 답변이 제출되지 않았거나 제한 시간이 초과되었습니다. 다음 질문을 진행하기 위해 본인의 관련 프로젝트나 기술 스택에 대한 경험을 간단히 소개해 주시겠습니까?",
            AnswerLanguage.ENGLISH, "The previous answer was not submitted or time ran out. To proceed, could you briefly introduce your experience with relevant projects or tech stack?",
            AnswerLanguage.VIETNAMESE, "Câu trả lời trước chưa được gửi hoặc đã hết thời gian. Để tiếp tục, bạn có thể giới thiệu ngắn gọn về kinh nghiệm với các dự án hoặc công nghệ liên quan không?"
    );

    private static final Map<AnswerLanguage, String> FALLBACK_INITIAL = Map.of(
            AnswerLanguage.KOREAN, "[%s %s] 기술 면접 질문입니다. 본인의 경험을 기반으로 답변해 주세요.",
            AnswerLanguage.ENGLISH, "[%s %s] Technical interview question. Please answer based on your experience.",
            AnswerLanguage.VIETNAMESE, "[%s %s] Câu hỏi phỏng vấn kỹ thuật. Hãy trả lời dựa trên kinh nghiệm của bạn."
    );

    private String langInstruction(AnswerLanguage lang) {
        return LANGUAGE_INSTRUCTIONS.getOrDefault(lang, LANGUAGE_INSTRUCTIONS.get(AnswerLanguage.KOREAN));
    }

    public LlmAnalysisResult generateAnalysis(String transcript, String questionText, AnswerLanguage lang) {
        String jsonExample = ANALYSIS_JSON_EXAMPLES.getOrDefault(lang, ANALYSIS_JSON_EXAMPLES.get(AnswerLanguage.KOREAN));

        String prompt = """
                다음은 면접 질문과 지원자의 답변입니다.

                [질문]
                %s

                [답변]
                %s

                답변이 짧거나 불완전하더라도 주어진 내용으로 반드시 피드백을 제공하세요.
                반드시 아래 JSON 형식으로만 응답하세요. 다른 텍스트는 절대 포함하지 마세요.
                STAR 각 항목 점수는 0.0~10.0 사이의 소수로 작성하세요. (각 항목 최대 10점, 합산 총점 최대 40점)
                %s
                %s
                """.formatted(questionText, transcript, langInstruction(lang), jsonExample);

        String response = chatClient.prompt()
                .user(prompt)
                .tools(interviewTools)
                .call()
                .content();

        String cleaned = response
                .replaceAll("```json\\s*", "")
                .replaceAll("```\\s*", "")
                .trim();

        try {
            return objectMapper.readValue(cleaned, LlmAnalysisResult.class);
        } catch (Exception e) {
            var feedbackPart = new LlmAnalysisResult.FeedbackPart(cleaned, null, null, List.of());
            return new LlmAnalysisResult(feedbackPart, null);
        }
    }

    public LlmReportSummary generateReportSummary(InterviewSession session, List<Answer> answers, AnswerLanguage lang) {
        StringBuilder qaSection = new StringBuilder();
        AtomicInteger index = new AtomicInteger(1);

        answers.forEach(answer -> {
            int i = index.getAndIncrement();
            qaSection.append("### Q").append(i).append(". ")
                    .append(answer.getQuestion().getContent()).append("\n");
            qaSection.append(lang == AnswerLanguage.KOREAN ? "답변: " :
                    lang == AnswerLanguage.ENGLISH ? "Answer: " : "Trả lời: ")
                    .append(answer.getTranscript() != null ? answer.getTranscript() : "(없음)").append("\n");

            if (answer.getLlmFeedback() != null) {
                var f = answer.getLlmFeedback();
                qaSection.append(lang == AnswerLanguage.KOREAN ? "강점: " :
                        lang == AnswerLanguage.ENGLISH ? "Strength: " : "Điểm mạnh: ")
                        .append(f.getStrength()).append("\n");
                qaSection.append(lang == AnswerLanguage.KOREAN ? "약점: " :
                        lang == AnswerLanguage.ENGLISH ? "Weakness: " : "Điểm yếu: ")
                        .append(f.getWeakness()).append("\n");
                qaSection.append(lang == AnswerLanguage.KOREAN ? "개선: " :
                        lang == AnswerLanguage.ENGLISH ? "Improvement: " : "Cải thiện: ")
                        .append(f.getImprovement()).append("\n");
            }
            if (answer.getStarAnalysis() != null) {
                var s = answer.getStarAnalysis();
                qaSection.append(String.format(
                        lang == AnswerLanguage.KOREAN ? "STAR 점수: %.1f/10\n" :
                                lang == AnswerLanguage.ENGLISH ? "STAR Score: %.1f/10\n" : "Điểm STAR: %.1f/10\n",
                        s.getTotalScore() != null ? s.getTotalScore() : 0f));
            }
            qaSection.append("\n");
        });

        String jsonExample = REPORT_JSON_EXAMPLES.getOrDefault(lang, REPORT_JSON_EXAMPLES.get(AnswerLanguage.KOREAN));

        String prompt = """
                다음은 면접 세션 전체 내용입니다.

                [직무] %s
                [면접 유형] %s
                [총 문항 수] %d

                %s

                위 내용을 종합하여 반드시 아래 JSON 형식으로만 응답하세요. 다른 텍스트는 절대 포함하지 마세요.
                %s
                %s
                """.formatted(
                session.getJobTitle(),
                session.getSessionType(),
                answers.size(),
                qaSection,
                langInstruction(lang),
                jsonExample
        );

        String response = chatClient.prompt()
                .user(prompt)
                .call()
                .content();

        String cleaned = response
                .replaceAll("```json\\s*", "")
                .replaceAll("```\\s*", "")
                .trim();

        try {
            return objectMapper.readValue(cleaned, LlmReportSummary.class);
        } catch (Exception e) {
            return new LlmReportSummary(cleaned, null, null, null);
        }
    }

    public String generateInitialQuestion(String jobCategory, String jobTitle, int careerYears, List<String> pastQuestions, AnswerLanguage lang) {
        String careerLabel = careerYears == 0 ? "신입" : careerYears + "년차";
        String conditions = buildConditions(pastQuestions, lang,
                "- 지원자의 이력서가 없으므로 해당 직무와 경력 연차에 맞는 핵심적이고 실제 면접에서 자주 나오는 핵심 기술 질문 1개만 정중하고 자연스러운 구어체 말투로 생성해 주세요.");
        String systemRole = lang == AnswerLanguage.KOREAN ? "IT 전문 면접관" :
                lang == AnswerLanguage.ENGLISH ? "IT interview expert" : "chuyên gia phỏng vấn IT";
        String promptHeader = lang == AnswerLanguage.KOREAN ? "다음 정보를 기반으로 지원자에게 물어볼 첫 번째 기술 면접 질문(TECHNICAL question)을 1개만 생성해 주세요." :
                lang == AnswerLanguage.ENGLISH ? "Based on the following information, generate exactly 1 first technical interview question (TECHNICAL question) to ask the candidate." :
                "Dựa trên thông tin sau, hãy tạo chính xác 1 câu hỏi phỏng vấn kỹ thuật đầu tiên (TECHNICAL question) để hỏi ứng viên.";
        String prompt = """
                당신은 %s입니다. %s
                
                [직군 카테고리]
                %s
                
                [상세 직무명]
                %s
                
                [경력 연차]
                %s
                %s
                %s
                - 질문 외에 다른 설명, 대괄호나 문맥 소개 등 불필요한 텍스트는 절대 포함하지 말고 오직 질문 한 문장만 반환해 주세요.
                """.formatted(systemRole, promptHeader, jobCategory, jobTitle, careerLabel, formatPastQuestionsSection(pastQuestions), conditions);

        try {
            String response = chatClient.prompt()
                    .user(prompt)
                    .call()
                    .content();
            if (response != null && !response.trim().isEmpty()) {
                return response.trim();
            }
        } catch (Exception e) {
            // Fallback in case of AI service errors
        }
        String fallback = FALLBACK_INITIAL.getOrDefault(lang, FALLBACK_INITIAL.get(AnswerLanguage.KOREAN));
        return String.format(fallback, jobCategory, careerLabel);
    }

    public String generateInitialQuestion(String jobCategory, String jobTitle, int careerYears, String resumeContent, List<String> pastQuestions, AnswerLanguage lang) {
        if (resumeContent == null || resumeContent.trim().isEmpty()) {
            return generateInitialQuestion(jobCategory, jobTitle, careerYears, pastQuestions, lang);
        }

        String careerLabel = careerYears == 0 ? "신입" : careerYears + "년차";
        String conditions = buildConditions(pastQuestions, lang,
                "- 지원자의 이력서/포트폴리오에 기재된 주요 프로젝트, 기술 스택, 경험을 분석하여 해당 직무(상세 직무명 및 경력)에 가장 중요하고 검증이 필요한 핵심 기술 질문 1개만 정중하고 자연스러운 구어체 말투로 생성해 주세요.");
        String systemRole = lang == AnswerLanguage.KOREAN ? "IT 전문 면접관" :
                lang == AnswerLanguage.ENGLISH ? "IT interview expert" : "chuyên gia phỏng vấn IT";
        String promptHeader = lang == AnswerLanguage.KOREAN ? "다음 직무 정보와 지원자의 이력서(포트폴리오) 내용을 기반으로 지원자에게 물어볼 첫 번째 기술 면접 질문(TECHNICAL question)을 1개만 생성해 주세요." :
                lang == AnswerLanguage.ENGLISH ? "Based on the following job information and the candidate's resume/portfolio, generate exactly 1 first technical interview question (TECHNICAL question) to ask the candidate." :
                "Dựa trên thông tin công việc và sơ yếu lý lịch/portfolio của ứng viên, hãy tạo chính xác 1 câu hỏi phỏng vấn kỹ thuật đầu tiên (TECHNICAL question) để hỏi ứng viên.";
        String prompt = """
                당신은 %s입니다. %s
                
                [직군 카테고리]
                %s
                
                [상세 직무명]
                %s
                
                [경력 연차]
                %s
                
                [지원자 이력서/포트폴리오]
                %s
                %s
                %s
                - 질문 외에 다른 설명, 대괄호나 문맥 소개 등 불필요한 텍스트는 절대 포함하지 말고 오직 질문 한 문장만 반환해 주세요.
                """.formatted(systemRole, promptHeader, jobCategory, jobTitle, careerLabel, resumeContent, formatPastQuestionsSection(pastQuestions), conditions);

        try {
            String response = chatClient.prompt()
                    .user(prompt)
                    .call()
                    .content();
            if (response != null && !response.trim().isEmpty()) {
                return response.trim();
            }
        } catch (Exception e) {
            // Fallback in case of AI service errors
        }
        return generateInitialQuestion(jobCategory, jobTitle, careerYears, pastQuestions, lang);
    }

    private String formatPastQuestionsSection(List<String> pastQuestions) {
        if (pastQuestions == null || pastQuestions.isEmpty()) return "";
        StringBuilder sb = new StringBuilder("\n[지금까지 이 지원자에게 했던 질문들]\n");
        for (int i = 0; i < pastQuestions.size(); i++) {
            sb.append(i + 1).append(". ").append(pastQuestions.get(i)).append("\n");
        }
        return sb.toString();
    }

    private String buildConditions(List<String> pastQuestions, AnswerLanguage lang, String mainCondition) {
        StringBuilder sb = new StringBuilder();
        sb.append(langInstruction(lang));
        if (!pastQuestions.isEmpty()) {
            sb.append("- 위의 \"지금까지 이 지원자에게 했던 질문들\"에 있는 질문과 중복되거나 같은 주제의 질문은 절대 생성하지 마세요.\n");
        }
        sb.append(mainCondition).append("\n");
        return sb.toString();
    }

    public String generateFollowUpQuestion(String previousQuestion, String userResponse, AnswerLanguage lang) {
        if (userResponse == null || userResponse.trim().isEmpty() || userResponse.contains("(시간 초과")) {
            return FALLBACK_TIMEOUT.getOrDefault(lang, FALLBACK_TIMEOUT.get(AnswerLanguage.KOREAN));
        }

        String prompt = """
                당신은 IT 전문 면접관입니다. 지원자가 이전 질문에 대해 답변한 내용을 바탕으로 지원자에게 물어볼 자연스러운 꼬리 질문(follow-up question)을 1개만 생성해 주세요.
                
                [이전 질문]
                %s
                
                [지원자 답변]
                %s
                
                조건:
                %s
                - 지원자의 답변에 모순이 있거나 구체적인 기술적 디테일(사용 라이브러리, 해결 방법, 아키텍처적 선택의 이유 등)이 부족한 부분을 짚어내어 깊이 있게 질문해 주세요.
                - 1인칭 면접관 입장에서 정중하고 친근하게 질문해 주세요 (예: "답변 잘 들었습니다. ~라고 말씀해 주셨는데, 구체적으로 ~한 상황에서는 어떻게 대처하시나요?").
                - 질문 외에 다른 설명이나 소개 등 불필요한 텍스트는 절대 포함하지 말고 오직 질문 한 문장만 반환해 주세요.
                """.formatted(previousQuestion, userResponse, langInstruction(lang));

        try {
            String response = chatClient.prompt()
                    .user(prompt)
                    .call()
                    .content();
            if (response != null && !response.trim().isEmpty()) {
                return response.trim();
            }
        } catch (Exception e) {
            // Fallback in case of AI service errors
        }
        return FALLBACK_FOLLOW_UPS.getOrDefault(lang, FALLBACK_FOLLOW_UPS.get(AnswerLanguage.KOREAN));
    }

    public String generateFollowUpQuestion(String previousQuestion, String userResponse, String resumeContent, AnswerLanguage lang) {
        if (resumeContent == null || resumeContent.trim().isEmpty()) {
            return generateFollowUpQuestion(previousQuestion, userResponse, lang);
        }

        if (userResponse == null || userResponse.trim().isEmpty() || userResponse.contains("(시간 초과")) {
            return FALLBACK_TIMEOUT.getOrDefault(lang, FALLBACK_TIMEOUT.get(AnswerLanguage.KOREAN));
        }

        String prompt = """
                당신은 IT 전문 면접관입니다. 지원자가 이전 질문에 대해 답변한 내용과 지원자의 이력서(포트폴리오) 내용을 바탕으로 지원자에게 물어볼 자연스러운 꼬리 질문(follow-up question)을 1개만 생성해 주세요.
                
                [지원자 이력서/포트폴리오]
                %s
                
                [이전 질문]
                %s
                
                [지원자 답변]
                %s
                
                조건:
                %s
                - 지원자의 이력서/포트폴리오 내용과 이전 답변 내용을 유기적으로 연결하여, 모순되는 부분이나 더 상세한 기술적 디테일(사용 라이브러리, 트레이드오프, 아키텍처 선택 이유 등)에 대해 짚어내며 깊이 있게 질문해 주세요.
                - 1인칭 면접관 입장에서 정중하고 친근하게 질문해 주세요 (예: "답변 잘 들었습니다. 이력서의 ~ 프로젝트와 관련하여, ~한 상황에서는 어떻게 대처하시나요?").
                - 질문 외에 다른 설명이나 소개 등 불필요한 텍스트는 절대 포함하지 말고 오직 질문 한 문장만 반환해 주세요.
                """.formatted(resumeContent, previousQuestion, userResponse, langInstruction(lang));

        try {
            String response = chatClient.prompt()
                    .user(prompt)
                    .call()
                    .content();
            if (response != null && !response.trim().isEmpty()) {
                return response.trim();
            }
        } catch (Exception e) {
            // Fallback in case of AI service errors
        }
        return generateFollowUpQuestion(previousQuestion, userResponse, lang);
    }
}
