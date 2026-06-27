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

    private static final Map<AnswerLanguage, String> SYSTEM_PROMPTS = Map.of(
            AnswerLanguage.KOREAN, "당신은 IT 기술 면접 전문가입니다. 모든 응답은 반드시 한국어로 작성해야 합니다. 질문은 한국어로, 피드백은 한국어로 작성하세요.",
            AnswerLanguage.ENGLISH, "You are an IT technical interview expert. You must ALWAYS respond in English. All questions, feedback, and analysis must be written in English regardless of the input language.",
            AnswerLanguage.VIETNAMESE, "Bạn là chuyên gia phỏng vấn kỹ thuật IT. Bạn PHẢI LUÔN trả lời bằng tiếng Việt. Tất cả câu hỏi, phản hồi và phân tích phải được viết bằng tiếng Việt bất kể ngôn ngữ đầu vào là gì."
    );

    private static final Map<AnswerLanguage, String> ANALYSIS_PROMPTS = Map.of(
            AnswerLanguage.KOREAN, """
                    다음은 면접 질문과 지원자의 답변입니다.

                    [질문]
                    %s

                    [답변]
                    %s

                    답변이 짧거나 불완전하더라도 주어진 내용으로 반드시 피드백을 제공하세요.
                    반드시 아래 JSON 형식으로만 응답하세요. 다른 텍스트는 절대 포함하지 마세요.
                    STAR 각 항목 점수는 0.0~10.0 사이의 소수로 작성하세요. (각 항목 최대 10점, 합산 총점 최대 40점)

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
                    Below is an interview question and the candidate's answer.

                    [Question]
                    %s

                    [Answer]
                    %s

                    Even if the answer is short or incomplete, you must provide feedback based on the given content.
                    Respond ONLY in the JSON format below. Do not include any other text.
                    Each STAR item score must be between 0.0 and 10.0 (max 10 per item, total max 40).

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
                    Dưới đây là câu hỏi phỏng vấn và câu trả lời của ứng viên.

                    [Câu hỏi]
                    %s

                    [Câu trả lời]
                    %s

                    Ngay cả khi câu trả lời ngắn hoặc không đầy đủ, bạn vẫn phải cung cấp phản hồi dựa trên nội dung đã cho.
                    Chỉ phản hồi bằng định dạng JSON bên dưới. KHÔNG được bao gồm bất kỳ văn bản nào khác.
                    Mỗi điểm STAR phải từ 0.0 đến 10.0 (tối đa 10 mỗi mục, tổng tối đa 40).

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

    private static final Map<AnswerLanguage, String> REPORT_PROMPTS = Map.of(
            AnswerLanguage.KOREAN, """
                    다음은 면접 세션 전체 내용입니다.

                    [직무] %s
                    [면접 유형] %s
                    [총 문항 수] %d

                    %s

                    위 내용을 종합하여 반드시 아래 JSON 형식으로만 응답하세요. 다른 텍스트는 절대 포함하지 마세요.

                    {
                      "strengthSummary": "면접 전반에 걸친 지원자의 강점 (2~3문장)",
                      "weaknessSummary": "면접 전반에 걸친 지원자의 약점 (2~3문장)",
                      "improvementPriority": "가장 우선적으로 개선해야 할 사항 (1~2문장)",
                      "aiSummary": "면접 전체에 대한 종합 평가 한 줄 요약"
                    }""",
            AnswerLanguage.ENGLISH, """
                    Below is the full interview session content.

                    [Job Title] %s
                    [Interview Type] %s
                    [Total Questions] %d

                    %s

                    Based on the above, respond ONLY in the JSON format below. Do not include any other text.

                    {
                      "strengthSummary": "Candidate's overall strengths across the interview (2-3 sentences)",
                      "weaknessSummary": "Candidate's overall weaknesses across the interview (2-3 sentences)",
                      "improvementPriority": "Top priority improvement area (1-2 sentences)",
                      "aiSummary": "One-line comprehensive evaluation of the entire interview"
                    }""",
            AnswerLanguage.VIETNAMESE, """
                    Dưới đây là toàn bộ nội dung của buổi phỏng vấn.

                    [Vị trí] %s
                    [Loại phỏng vấn] %s
                    [Tổng số câu hỏi] %d

                    %s

                    Dựa trên nội dung trên, chỉ phản hồi bằng định dạng JSON bên dưới. KHÔNG bao gồm bất kỳ văn bản nào khác.

                    {
                      "strengthSummary": "Điểm mạnh tổng thể của ứng viên trong suốt buổi phỏng vấn (2-3 câu)",
                      "weaknessSummary": "Điểm yếu tổng thể của ứng viên trong suốt buổi phỏng vấn (2-3 câu)",
                      "improvementPriority": "Ưu tiên cải thiện hàng đầu (1-2 câu)",
                      "aiSummary": "Đánh giá tổng quan toàn bộ buổi phỏng vấn trong một câu"
                    }"""
    );

    private static final Map<AnswerLanguage, String> INITIAL_QUESTION_PROMPTS = Map.of(
            AnswerLanguage.KOREAN, """
                    당신은 IT 전문 면접관입니다. 다음 정보를 기반으로 지원자에게 물어볼 첫 번째 기술 면접 질문(TECHNICAL question)을 1개만 생성해 주세요.

                    [직군 카테고리]
                    %s

                    [상세 직무명]
                    %s

                    [경력 연차]
                    %s
                    %s
                    %s
                    - 질문 외에 다른 설명, 대괄호나 문맥 소개 등 불필요한 텍스트는 절대 포함하지 말고 오직 질문 한 문장만 반환해 주세요.""",
            AnswerLanguage.ENGLISH, """
                    You are an IT interview expert. Based on the following information, generate exactly 1 first technical interview question (TECHNICAL question) to ask the candidate.

                    [Job Category]
                    %s

                    [Job Title]
                    %s

                    [Career Level]
                    %s
                    %s
                    %s
                    - Do not include any explanations, brackets, or context. Return ONLY the question as a single sentence.""",
            AnswerLanguage.VIETNAMESE, """
                    Bạn là chuyên gia phỏng vấn IT. Dựa trên thông tin sau, hãy tạo chính xác 1 câu hỏi phỏng vấn kỹ thuật đầu tiên (TECHNICAL question) để hỏi ứng viên.

                    [Danh mục công việc]
                    %s

                    [Chức danh]
                    %s

                    [Cấp độ kinh nghiệm]
                    %s
                    %s
                    %s
                    - Không bao gồm bất kỳ giải thích, dấu ngoặc hoặc giới thiệu nào. Chỉ trả về câu hỏi dưới dạng một câu duy nhất."""
    );

    private static final Map<AnswerLanguage, String> INITIAL_QUESTION_RESUME_PROMPTS = Map.of(
            AnswerLanguage.KOREAN, """
                    당신은 IT 전문 면접관입니다. 다음 직무 정보와 지원자의 이력서(포트폴리오) 내용을 기반으로 지원자에게 물어볼 첫 번째 기술 면접 질문(TECHNICAL question)을 1개만 생성해 주세요.

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
                    - 질문 외에 다른 설명, 대괄호나 문맥 소개 등 불필요한 텍스트는 절대 포함하지 말고 오직 질문 한 문장만 반환해 주세요.""",
            AnswerLanguage.ENGLISH, """
                    You are an IT interview expert. Based on the following job information and the candidate's resume/portfolio, generate exactly 1 first technical interview question (TECHNICAL question) to ask the candidate.

                    [Job Category]
                    %s

                    [Job Title]
                    %s

                    [Career Level]
                    %s

                    [Candidate Resume/Portfolio]
                    %s
                    %s
                    %s
                    - Do not include any explanations, brackets, or context. Return ONLY the question as a single sentence.""",
            AnswerLanguage.VIETNAMESE, """
                    Bạn là chuyên gia phỏng vấn IT. Dựa trên thông tin công việc và sơ yếu lý lịch/portfolio của ứng viên, hãy tạo chính xác 1 câu hỏi phỏng vấn kỹ thuật đầu tiên (TECHNICAL question) để hỏi ứng viên.

                    [Danh mục công việc]
                    %s

                    [Chức danh]
                    %s

                    [Cấp độ kinh nghiệm]
                    %s

                    [Sơ yếu lý lịch/Portfolio]
                    %s
                    %s
                    %s
                    - Không bao gồm bất kỳ giải thích, dấu ngoặc hoặc giới thiệu nào. Chỉ trả về câu hỏi dưới dạng một câu duy nhất."""
    );

    private static final Map<AnswerLanguage, String> FOLLOW_UP_PROMPTS = Map.of(
            AnswerLanguage.KOREAN, """
                    당신은 IT 전문 면접관입니다. 지원자가 이전 질문에 대해 답변한 내용을 바탕으로 지원자에게 물어볼 자연스러운 꼬리 질문(follow-up question)을 1개만 생성해 주세요.

                    [이전 질문]
                    %s

                    [지원자 답변]
                    %s

                    조건:
                    - 지원자의 답변에 모순이 있거나 구체적인 기술적 디테일(사용 라이브러리, 해결 방법, 아키텍처적 선택의 이유 등)이 부족한 부분을 짚어내어 깊이 있게 질문해 주세요.
                    - 1인칭 면접관 입장에서 정중하고 친근하게 질문해 주세요 (예: "답변 잘 들었습니다. ~라고 말씀해 주셨는데, 구체적으로 ~한 상황에서는 어떻게 대처하시나요?").
                    - 질문 외에 다른 설명이나 소개 등 불필요한 텍스트는 절대 포함하지 말고 오직 질문 한 문장만 반환해 주세요.""",
            AnswerLanguage.ENGLISH, """
                    You are an IT interview expert. Based on the candidate's previous answer, generate exactly 1 natural follow-up question to ask the candidate.

                    [Previous Question]
                    %s

                    [Candidate Answer]
                    %s

                    Conditions:
                    - Identify contradictions or lack of technical detail (libraries used, solutions, architectural choices, etc.) in the answer and ask deeper questions about them.
                    - Ask from a first-person interviewer perspective, politely and warmly (e.g., "Thank you for your answer. You mentioned ~, could you tell me more about how you handled ~?").
                    - Do not include any explanations, brackets, or context. Return ONLY the question as a single sentence.""",
            AnswerLanguage.VIETNAMESE, """
                    Bạn là chuyên gia phỏng vấn IT. Dựa trên câu trả lời trước đó của ứng viên, hãy tạo chính xác 1 câu hỏi phụ (follow-up question) tự nhiên để hỏi ứng viên.

                    [Câu hỏi trước]
                    %s

                    [Câu trả lời của ứng viên]
                    %s

                    Điều kiện:
                    - Xác định những mâu thuẫn hoặc thiếu chi tiết kỹ thuật (thư viện sử dụng, giải pháp, lựa chọn kiến trúc, v.v.) trong câu trả lời và đặt câu hỏi sâu hơn về chúng.
                    - Hỏi từ góc nhìn của người phỏng vấn ngôi thứ nhất, lịch sự và thân thiện (ví dụ: "Cảm ơn câu trả lời của bạn. Bạn đã đề cập đến ~, bạn có thể cho tôi biết thêm về cách bạn xử lý ~ không?").
                    - Không bao gồm bất kỳ giải thích, dấu ngoặc hoặc giới thiệu nào. Chỉ trả về câu hỏi dưới dạng một câu duy nhất."""
    );

    private static final Map<AnswerLanguage, String> FOLLOW_UP_RESUME_PROMPTS = Map.of(
            AnswerLanguage.KOREAN, """
                    당신은 IT 전문 면접관입니다. 지원자가 이전 질문에 대해 답변한 내용과 지원자의 이력서(포트폴리오) 내용을 바탕으로 지원자에게 물어볼 자연스러운 꼬리 질문(follow-up question)을 1개만 생성해 주세요.

                    [지원자 이력서/포트폴리오]
                    %s

                    [이전 질문]
                    %s

                    [지원자 답변]
                    %s

                    조건:
                    - 지원자의 이력서/포트폴리오 내용과 이전 답변 내용을 유기적으로 연결하여, 모순되는 부분이나 더 상세한 기술적 디테일(사용 라이브러리, 트레이드오프, 아키텍처 선택 이유 등)에 대해 짚어내며 깊이 있게 질문해 주세요.
                    - 1인칭 면접관 입장에서 정중하고 친근하게 질문해 주세요 (예: "답변 잘 들었습니다. 이력서의 ~ 프로젝트와 관련하여, ~한 상황에서는 어떻게 대처하시나요?").
                    - 질문 외에 다른 설명이나 소개 등 불필요한 텍스트는 절대 포함하지 말고 오직 질문 한 문장만 반환해 주세요.""",
            AnswerLanguage.ENGLISH, """
                    You are an IT interview expert. Based on the candidate's previous answer and their resume/portfolio, generate exactly 1 natural follow-up question to ask the candidate.

                    [Candidate Resume/Portfolio]
                    %s

                    [Previous Question]
                    %s

                    [Candidate Answer]
                    %s

                    Conditions:
                    - Organically connect the candidate's resume/portfolio content with their previous answer. Identify contradictions or areas needing more technical detail (libraries used, trade-offs, architectural choices, etc.).
                    - Ask from a first-person interviewer perspective, politely and warmly (e.g., "Thank you for your answer. Regarding the ~ project on your resume, how did you handle ~?").
                    - Do not include any explanations, brackets, or context. Return ONLY the question as a single sentence.""",
            AnswerLanguage.VIETNAMESE, """
                    Bạn là chuyên gia phỏng vấn IT. Dựa trên câu trả lời trước đó của ứng viên và sơ yếu lý lịch/portfolio của họ, hãy tạo chính xác 1 câu hỏi phụ (follow-up question) tự nhiên để hỏi ứng viên.

                    [Sơ yếu lý lịch/Portfolio]
                    %s

                    [Câu hỏi trước]
                    %s

                    [Câu trả lời của ứng viên]
                    %s

                    Điều kiện:
                    - Kết nối hữu cơ nội dung sơ yếu lý lịch/portfolio với câu trả lời trước đó của ứng viên. Xác định những mâu thuẫn hoặc lĩnh vực cần chi tiết kỹ thuật hơn (thư viện sử dụng, đánh đổi, lựa chọn kiến trúc, v.v.).
                    - Hỏi từ góc nhìn của người phỏng vấn ngôi thứ nhất, lịch sự và thân thiện (ví dụ: "Cảm ơn câu trả lời của bạn. Về dự án ~ trong sơ yếu lý lịch của bạn, bạn đã xử lý ~ như thế nào?").
                    - Không bao gồm bất kỳ giải thích, dấu ngoặc hoặc giới thiệu nào. Chỉ trả về câu hỏi dưới dạng một câu duy nhất."""
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

    private static final Map<AnswerLanguage, String> LABEL_ANSWER = Map.of(
            AnswerLanguage.KOREAN, "답변: ",
            AnswerLanguage.ENGLISH, "Answer: ",
            AnswerLanguage.VIETNAMESE, "Trả lời: "
    );

    private static final Map<AnswerLanguage, String> LABEL_STRENGTH = Map.of(
            AnswerLanguage.KOREAN, "강점: ",
            AnswerLanguage.ENGLISH, "Strength: ",
            AnswerLanguage.VIETNAMESE, "Điểm mạnh: "
    );

    private static final Map<AnswerLanguage, String> LABEL_WEAKNESS = Map.of(
            AnswerLanguage.KOREAN, "약점: ",
            AnswerLanguage.ENGLISH, "Weakness: ",
            AnswerLanguage.VIETNAMESE, "Điểm yếu: "
    );

    private static final Map<AnswerLanguage, String> LABEL_IMPROVEMENT = Map.of(
            AnswerLanguage.KOREAN, "개선: ",
            AnswerLanguage.ENGLISH, "Improvement: ",
            AnswerLanguage.VIETNAMESE, "Cải thiện: "
    );

    private static final Map<AnswerLanguage, String> LABEL_STAR_SCORE = Map.of(
            AnswerLanguage.KOREAN, "STAR 점수: %.1f/10\n",
            AnswerLanguage.ENGLISH, "STAR Score: %.1f/10\n",
            AnswerLanguage.VIETNAMESE, "Điểm STAR: %.1f/10\n"
    );

    private static final Map<AnswerLanguage, String> PAST_QUESTIONS_HEADER = Map.of(
            AnswerLanguage.KOREAN, "\n[지금까지 이 지원자에게 했던 질문들]\n",
            AnswerLanguage.ENGLISH, "\n[Questions previously asked to this candidate]\n",
            AnswerLanguage.VIETNAMESE, "\n[Các câu hỏi đã hỏi ứng viên này trước đây]\n"
    );

    private static final Map<AnswerLanguage, String> PAST_QUESTIONS_DUPLICATE = Map.of(
            AnswerLanguage.KOREAN, "- 위의 \"지금까지 이 지원자에게 했던 질문들\"에 있는 질문과 중복되거나 같은 주제의 질문은 절대 생성하지 마세요.\n",
            AnswerLanguage.ENGLISH, "- Never generate a question that duplicates or is on the same topic as any question in the \"Questions previously asked to this candidate\" list above.\n",
            AnswerLanguage.VIETNAMESE, "- Không bao giờ tạo câu hỏi trùng lặp hoặc cùng chủ đề với bất kỳ câu hỏi nào trong danh sách \"Các câu hỏi đã hỏi ứng viên này trước đây\" ở trên.\n"
    );

    private static final Map<AnswerLanguage, String> NO_EXTRA_TEXT = Map.of(
            AnswerLanguage.KOREAN, "- 질문 외에 다른 설명, 대괄호나 문맥 소개 등 불필요한 텍스트는 절대 포함하지 말고 오직 질문 한 문장만 반환해 주세요.\n",
            AnswerLanguage.ENGLISH, "- Do not include any explanations, brackets, or context. Return ONLY the question as a single sentence.\n",
            AnswerLanguage.VIETNAMESE, "- Không bao gồm bất kỳ giải thích, dấu ngoặc hoặc giới thiệu nào. Chỉ trả về câu hỏi dưới dạng một câu duy nhất.\n"
    );

    private static final Map<AnswerLanguage, String> CAREER_LABEL = Map.of(
            AnswerLanguage.KOREAN, "신입",
            AnswerLanguage.ENGLISH, "Entry-level",
            AnswerLanguage.VIETNAMESE, "Mới vào nghề"
    );

    private static final Map<AnswerLanguage, String> CAREER_YEARS = Map.of(
            AnswerLanguage.KOREAN, "년차",
            AnswerLanguage.ENGLISH, " years",
            AnswerLanguage.VIETNAMESE, " năm"
    );

    public LlmAnalysisResult generateAnalysis(String transcript, String questionText, AnswerLanguage lang) {
        String promptTemplate = ANALYSIS_PROMPTS.getOrDefault(lang, ANALYSIS_PROMPTS.get(AnswerLanguage.KOREAN));
        String prompt = promptTemplate.formatted(questionText, transcript);

        String response = chatClient.prompt()
                .system(SYSTEM_PROMPTS.getOrDefault(lang, SYSTEM_PROMPTS.get(AnswerLanguage.KOREAN)))
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
            qaSection.append(label(lang, LABEL_ANSWER))
                    .append(answer.getTranscript() != null ? answer.getTranscript() : "(none)").append("\n");

            if (answer.getLlmFeedback() != null) {
                var f = answer.getLlmFeedback();
                qaSection.append(label(lang, LABEL_STRENGTH)).append(f.getStrength()).append("\n");
                qaSection.append(label(lang, LABEL_WEAKNESS)).append(f.getWeakness()).append("\n");
                qaSection.append(label(lang, LABEL_IMPROVEMENT)).append(f.getImprovement()).append("\n");
            }
            if (answer.getStarAnalysis() != null) {
                var s = answer.getStarAnalysis();
                qaSection.append(String.format(
                        label(lang, LABEL_STAR_SCORE),
                        s.getTotalScore() != null ? s.getTotalScore() : 0f));
            }
            qaSection.append("\n");
        });

        String promptTemplate = REPORT_PROMPTS.getOrDefault(lang, REPORT_PROMPTS.get(AnswerLanguage.KOREAN));
        String prompt = promptTemplate.formatted(
                session.getJobTitle(),
                session.getSessionType(),
                answers.size(),
                qaSection
        );

        String response = chatClient.prompt()
                .system(SYSTEM_PROMPTS.getOrDefault(lang, SYSTEM_PROMPTS.get(AnswerLanguage.KOREAN)))
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
        String careerLabel = careerYears == 0
                ? CAREER_LABEL.getOrDefault(lang, CAREER_LABEL.get(AnswerLanguage.KOREAN))
                : careerYears + CAREER_YEARS.getOrDefault(lang, CAREER_YEARS.get(AnswerLanguage.KOREAN));
        String conditions = buildConditions(pastQuestions, lang,
                mainCondition(lang, false));

        String promptTemplate = INITIAL_QUESTION_PROMPTS.getOrDefault(lang, INITIAL_QUESTION_PROMPTS.get(AnswerLanguage.KOREAN));
        String prompt = promptTemplate.formatted(
                jobCategory, jobTitle, careerLabel,
                formatPastQuestionsSection(pastQuestions, lang),
                conditions
        );

        try {
            String response = chatClient.prompt()
                    .system(SYSTEM_PROMPTS.getOrDefault(lang, SYSTEM_PROMPTS.get(AnswerLanguage.KOREAN)))
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

        String careerLabel = careerYears == 0
                ? CAREER_LABEL.getOrDefault(lang, CAREER_LABEL.get(AnswerLanguage.KOREAN))
                : careerYears + CAREER_YEARS.getOrDefault(lang, CAREER_YEARS.get(AnswerLanguage.KOREAN));
        String conditions = buildConditions(pastQuestions, lang,
                mainCondition(lang, true));

        String promptTemplate = INITIAL_QUESTION_RESUME_PROMPTS.getOrDefault(lang, INITIAL_QUESTION_RESUME_PROMPTS.get(AnswerLanguage.KOREAN));
        String prompt = promptTemplate.formatted(
                jobCategory, jobTitle, careerLabel, resumeContent,
                formatPastQuestionsSection(pastQuestions, lang),
                conditions
        );

        try {
            String response = chatClient.prompt()
                    .system(SYSTEM_PROMPTS.getOrDefault(lang, SYSTEM_PROMPTS.get(AnswerLanguage.KOREAN)))
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

    private String mainCondition(AnswerLanguage lang, boolean hasResume) {
        if (hasResume) {
            return switch (lang) {
                case KOREAN -> "- 지원자의 이력서/포트폴리오에 기재된 주요 프로젝트, 기술 스택, 경험을 분석하여 해당 직무(상세 직무명 및 경력)에 가장 중요하고 검증이 필요한 핵심 기술 질문 1개만 정중하고 자연스러운 구어체 말투로 생성해 주세요.";
                case ENGLISH -> "- Analyze the candidate's resume/portfolio (key projects, tech stack, experience) and generate 1 core technical question that is most important and needs verification for the given job and career level. Write in a polite, natural conversational tone.";
                case VIETNAMESE -> "- Phân tích sơ yếu lý lịch/portfolio của ứng viên (dự án chính, công nghệ, kinh nghiệm) và tạo 1 câu hỏi kỹ thuật cốt lõi quan trọng nhất cần xác minh cho công việc và cấp độ kinh nghiệm đã cho. Viết bằng giọng điệu lịch sự, tự nhiên.";
            };
        }
        return switch (lang) {
            case KOREAN -> "- 지원자의 이력서가 없으므로 해당 직무와 경력 연차에 맞는 핵심적이고 실제 면접에서 자주 나오는 핵심 기술 질문 1개만 정중하고 자연스러운 구어체 말투로 생성해 주세요.";
            case ENGLISH -> "- Since there is no resume, generate 1 core technical question that is appropriate for the job and career level and commonly asked in real interviews. Write in a polite, natural conversational tone.";
            case VIETNAMESE -> "- Vì không có sơ yếu lý lịch, hãy tạo 1 câu hỏi kỹ thuật cốt lõi phù hợp với công việc và cấp độ kinh nghiệm, thường được hỏi trong các buổi phỏng vấn thực tế. Viết bằng giọng điệu lịch sự, tự nhiên.";
        };
    }

    private String formatPastQuestionsSection(List<String> pastQuestions, AnswerLanguage lang) {
        if (pastQuestions == null || pastQuestions.isEmpty()) return "";
        StringBuilder sb = new StringBuilder(PAST_QUESTIONS_HEADER.getOrDefault(lang, PAST_QUESTIONS_HEADER.get(AnswerLanguage.KOREAN)));
        for (int i = 0; i < pastQuestions.size(); i++) {
            sb.append(i + 1).append(". ").append(pastQuestions.get(i)).append("\n");
        }
        return sb.toString();
    }

    private String buildConditions(List<String> pastQuestions, AnswerLanguage lang, String mainCondition) {
        StringBuilder sb = new StringBuilder();
        if (!pastQuestions.isEmpty()) {
            sb.append(PAST_QUESTIONS_DUPLICATE.getOrDefault(lang, PAST_QUESTIONS_DUPLICATE.get(AnswerLanguage.KOREAN)));
        }
        sb.append(mainCondition).append("\n");
        sb.append(NO_EXTRA_TEXT.getOrDefault(lang, NO_EXTRA_TEXT.get(AnswerLanguage.KOREAN)));
        return sb.toString();
    }

    private static String label(AnswerLanguage lang, Map<AnswerLanguage, String> map) {
        return map.getOrDefault(lang, map.get(AnswerLanguage.KOREAN));
    }

    public String generateFollowUpQuestion(String previousQuestion, String userResponse, AnswerLanguage lang) {
        if (userResponse == null || userResponse.trim().isEmpty() || userResponse.contains("(시간 초과")) {
            return FALLBACK_TIMEOUT.getOrDefault(lang, FALLBACK_TIMEOUT.get(AnswerLanguage.KOREAN));
        }

        String promptTemplate = FOLLOW_UP_PROMPTS.getOrDefault(lang, FOLLOW_UP_PROMPTS.get(AnswerLanguage.KOREAN));
        String prompt = promptTemplate.formatted(previousQuestion, userResponse);

        try {
            String response = chatClient.prompt()
                    .system(SYSTEM_PROMPTS.getOrDefault(lang, SYSTEM_PROMPTS.get(AnswerLanguage.KOREAN)))
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

        String promptTemplate = FOLLOW_UP_RESUME_PROMPTS.getOrDefault(lang, FOLLOW_UP_RESUME_PROMPTS.get(AnswerLanguage.KOREAN));
        String prompt = promptTemplate.formatted(resumeContent, previousQuestion, userResponse);

        try {
            String response = chatClient.prompt()
                    .system(SYSTEM_PROMPTS.getOrDefault(lang, SYSTEM_PROMPTS.get(AnswerLanguage.KOREAN)))
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
