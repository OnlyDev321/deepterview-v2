package com.capstone.deepterview.domain.answer.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.capstone.deepterview.domain.answer.domain.Emotion;
import com.capstone.deepterview.domain.answer.domain.NonverbalAnalysis;
import com.capstone.deepterview.domain.answer.domain.SpeechAnalysis;
import com.capstone.deepterview.domain.answer.dto.request.NonverbalSummary;
import com.capstone.deepterview.domain.answer.dto.request.PythonAnalysisCallbackRequest;
import com.capstone.deepterview.domain.answer.dto.request.PythonAnalysisResult;
import com.capstone.deepterview.domain.answer.dto.request.PythonTranscriptionResult;
import com.capstone.deepterview.domain.answer.repository.AnswerRepository;
import com.capstone.deepterview.domain.answer.repository.NonverbalAnalysisRepository;
import com.capstone.deepterview.domain.answer.repository.SpeechAnalysisRepository;
import com.capstone.deepterview.global.exception.CustomException;
import com.capstone.deepterview.global.exception.ErrorCode;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class PythonAnalysisCallbackService {

    private final AnswerRepository answerRepository;
    private final SpeechAnalysisRepository speechAnalysisRepository;
    private final NonverbalAnalysisRepository nonverbalAnalysisRepository;
    private final ObjectMapper objectMapper;

    @Transactional
    public void process(PythonAnalysisCallbackRequest request) {
        if ("error".equals(request.status())) {
            log.error("Python 분석 실패 answerId={} error={}", request.interviewId(), request.error());
            return;
        }

        Long answerId = Long.parseLong(request.interviewId());
        var answer = answerRepository.findById(answerId)
                .orElseThrow(() -> new CustomException(ErrorCode.NOT_FOUND, "답변을 찾을 수 없습니다."));

        PythonAnalysisResult result = request.result();
        log.info("Python 콜백 수신 answerId={} audio={} transcription={}",
                answerId,
                result.audio(),
                result.transcription() != null ? result.transcription().text() : null);

        if (result.transcription() != null
                && result.transcription().text() != null
                && !result.transcription().text().trim().isEmpty()) {
            answer.updateTranscript(result.transcription().text());
        }

        if (speechAnalysisRepository.findByAnswer_Id(answerId).isEmpty()) {
            Float wpm = calculateWpm(result.transcription());
            Float paceScore = normalizeTempo(result.audio() != null ? result.audio().tempoBpm() : null);
            Float clarityScore = normalizePitch(result.audio() != null ? result.audio().pitchMeanHz() : null);

            // Tính toán filler words tiếng Hàn
            String transcript = result.transcription() != null ? result.transcription().text() : null;
            int fillerCount = 0;
            String fillerWordsJson = null;
            if (transcript != null && !transcript.isBlank()) {
                Map<String, Integer> fillerMap = new HashMap<>();
                String[] words = transcript.split("\\s+");
                Set<String> targetFillers = Set.of("음", "어", "아", "그", "저", "막", "있잖아", "진짜", "되게", "약간");
                for (String w : words) {
                    String cleanWord = w.replaceAll("[.,?\\s]", "");
                    if (targetFillers.contains(cleanWord)) {
                        fillerMap.put(cleanWord, fillerMap.getOrDefault(cleanWord, 0) + 1);
                        fillerCount++;
                    }
                }
                if (!fillerMap.isEmpty()) {
                    try {
                        fillerWordsJson = objectMapper.writeValueAsString(fillerMap);
                    } catch (Exception e) {
                        log.error("Failed to serialize filler words", e);
                    }
                }
            }

            // Tính toán silence ratio
            Float silenceRatio = null;
            if (result.transcription() != null && result.transcription().segments() != null && !result.transcription().segments().isEmpty()) {
                double totalSpeechDuration = 0;
                for (var segment : result.transcription().segments()) {
                    if (segment.start() != null && segment.end() != null) {
                        totalSpeechDuration += (segment.end() - segment.start());
                    }
                }
                Integer durationSec = answer.getDurationSec();
                if (durationSec != null && durationSec > 0) {
                    double silenceSec = durationSec - totalSpeechDuration;
                    if (silenceSec < 0) silenceSec = 0;
                    silenceRatio = (float) (silenceSec / durationSec);
                } else {
                    silenceRatio = 0.0f;
                }
            }

            // Tự động tạo speech feedback
            String speechFeedback = generateSpeechFeedback(wpm, silenceRatio, fillerCount);

            speechAnalysisRepository.save(SpeechAnalysis.create(
                    answer, wpm, fillerCount, fillerWordsJson, silenceRatio, paceScore, clarityScore, speechFeedback));
        }

        NonverbalSummary summary = result.nonverbalSummary();
        if (summary != null) {
            if (nonverbalAnalysisRepository.findByAnswer_Id(answerId).isEmpty()) {
                Emotion dominantEmotion = null;
                try {
                    if (summary.dominantEmotion() != null) {
                        dominantEmotion = Emotion.valueOf(summary.dominantEmotion().toUpperCase());
                    }
                } catch (IllegalArgumentException e) {
                    log.warn("알 수 없는 감정값: {}", summary.dominantEmotion());
                }

                // Sinh feedback phi ngôn ngữ dựa trên các điểm số sẵn có
                String nonverbalFeedback = generateNonverbalFeedback(
                        summary.eyeContactScore(),
                        summary.anxietyScore(),
                        summary.headStabilityScore()
                );

                nonverbalAnalysisRepository.save(NonverbalAnalysis.create(
                        answer,
                        summary.eyeContactScore(),
                        summary.confidenceScore(),
                        summary.anxietyScore(),
                        summary.smileRatio(),
                        summary.headStabilityScore(),
                        dominantEmotion,
                        summary.emotionDistributionJson(),
                        nonverbalFeedback
                ));
            }
        } else {
            // Nếu summary là null, nhưng có gaze_frames, tiến hành tự tính toán
            List<Map<String, Object>> gazeFrames = result.gazeFrames();
            if (gazeFrames != null && !gazeFrames.isEmpty() && nonverbalAnalysisRepository.findByAnswer_Id(answerId).isEmpty()) {
                int total = gazeFrames.size();

                // 1. Eye contact (gaze_direction == "center")
                long centerCount = gazeFrames.stream()
                        .filter(f -> "center".equalsIgnoreCase(String.valueOf(f.get("gaze_direction"))))
                        .count();
                float eyeContactScore = ((float) centerCount / total) * 100f;

                // 2. Emotion distribution & Smile Ratio
                Map<String, Integer> emotionCounts = new HashMap<>();
                long happyCount = 0;
                for (var frame : gazeFrames) {
                    String emotionStr = String.valueOf(frame.get("dominant_emotion")).toUpperCase();
                    emotionCounts.put(emotionStr, emotionCounts.getOrDefault(emotionStr, 0) + 1);
                    if ("HAPPY".equals(emotionStr)) {
                        happyCount++;
                    }
                }

                float smileRatio = ((float) happyCount / total) * 100f;

                // Tìm dominant emotion
                String dominantStr = "NEUTRAL";
                int maxCount = 0;
                for (var entry : emotionCounts.entrySet()) {
                    if (entry.getValue() > maxCount) {
                        maxCount = entry.getValue();
                        dominantStr = entry.getKey();
                    }
                }

                Emotion dominantEmotion = Emotion.NEUTRAL;
                try {
                    dominantEmotion = Emotion.valueOf(dominantStr);
                } catch (Exception e) {
                    log.warn("알 수 없는 감정값: {}", dominantStr);
                }

                // Emotion distribution JSON
                Map<String, Double> emotionDistribution = new HashMap<>();
                for (var entry : emotionCounts.entrySet()) {
                    emotionDistribution.put(entry.getKey(), ((double) entry.getValue() / total) * 100.0);
                }

                String emotionDistributionJson = null;
                try {
                    emotionDistributionJson = objectMapper.writeValueAsString(emotionDistribution);
                } catch (Exception e) {
                    log.error("Failed to serialize emotion distribution", e);
                }

                // 3. Anxiety Score
                long negativeCount = 0;
                for (var entry : emotionCounts.entrySet()) {
                    String k = entry.getKey();
                    if ("FEAR".equals(k) || "SAD".equals(k) || "ANGRY".equals(k) || "DISGUST".equals(k)) {
                        negativeCount += entry.getValue();
                    }
                }
                float negativeRatio = ((float) negativeCount / total) * 100f;
                float lackOfEyeContact = 100f - eyeContactScore;
                float anxietyScore = (negativeRatio * 0.4f) + (lackOfEyeContact * 0.6f);
                anxietyScore = Math.max(0f, Math.min(100f, anxietyScore));

                // 4. Confidence Score
                float confidenceScore = (eyeContactScore * 0.6f) + ((100f - negativeRatio) * 0.4f);
                confidenceScore = Math.max(0f, Math.min(100f, confidenceScore));

                // 5. Head Stability Score
                int gazeChanges = 0;
                String prevGaze = null;
                for (var frame : gazeFrames) {
                    String currentGaze = String.valueOf(frame.get("gaze_direction"));
                    if (prevGaze != null && !prevGaze.equals(currentGaze)) {
                        gazeChanges++;
                    }
                    prevGaze = currentGaze;
                }
                float changeRatio = total > 1 ? (float) gazeChanges / (total - 1) : 0f;
                float headStabilityScore = 100f - (changeRatio * 50f);
                headStabilityScore = Math.max(50f, Math.min(100f, headStabilityScore));

                // 6. Feedback phi ngôn ngữ
                String nonverbalFeedback = generateNonverbalFeedback(eyeContactScore, anxietyScore, headStabilityScore);

                nonverbalAnalysisRepository.save(NonverbalAnalysis.create(
                        answer,
                        eyeContactScore,
                        confidenceScore,
                        anxietyScore,
                        smileRatio,
                        headStabilityScore,
                        dominantEmotion,
                        emotionDistributionJson,
                        nonverbalFeedback
                ));
            }
        }
    }

    private Float calculateWpm(PythonTranscriptionResult transcription) {
        if (transcription == null || transcription.segments() == null || transcription.segments().isEmpty()) {
            return null;
        }
        var segments = transcription.segments();
        double durationMin = (segments.get(segments.size() - 1).end() - segments.get(0).start()) / 60.0;
        if (durationMin <= 0)
            return null;
        long wordCount = segments.stream()
                .mapToLong(s -> s.text().trim().split("\\s+").length)
                .sum();
        return (float) (wordCount / durationMin);
    }

    private Float normalizeTempo(Double bpm) {
        if (bpm == null)
            return null;
        // 60~180 BPM 범위를 0~100점으로 정규화
        return (float) Math.max(0, Math.min(100, (bpm - 60) / 120.0 * 100));
    }

    private Float normalizePitch(Double hz) {
        if (hz == null)
            return null;
        // 80~300 Hz 범위를 0~100점으로 정규화
        return (float) Math.max(0, Math.min(100, (hz - 80) / 220.0 * 100));
    }

    private String generateSpeechFeedback(Float wpm, Float silenceRatio, int fillerCount) {
        StringBuilder sb = new StringBuilder();
        
        if (wpm != null) {
            if (wpm < 80) {
                sb.append("말하기 속도가 다소 느린 편입니다. 답변의 설득력을 높이기 위해 조금 더 자신감 있고 탄력 있는 템포로 말씀해 보세요. ");
            } else if (wpm > 160) {
                sb.append("말하기 속도가 다소 빠른 편입니다. 중요한 논점이 면접관에게 잘 전달될 수 있도록 조금 더 여유를 가지고 천천히 발음해 보세요. ");
            } else {
                sb.append("말하기 속도가 아주 적절하여 답변의 안정감을 줍니다. ");
            }
        }
        
        if (silenceRatio != null) {
            if (silenceRatio > 0.35) {
                sb.append("말씀하시는 중간에 침묵하거나 주저하는 시간이 다소 깁니다. 자연스러운 흐름을 이어가기 위해 생각을 신속히 정리하는 연습을 해보세요. ");
            } else {
                sb.append("적절한 타이밍에 단락을 나누고 자연스럽게 말을 이어나갔습니다. ");
            }
        }
        
        if (fillerCount > 5) {
            sb.append(String.format("답변 중 불필요한 습관적 표현(예: '어', '음' 등)이 %d회 감지되었습니다. 말끝을 흐리거나 추임새를 넣는 습관을 의식적으로 줄여나간다면 더욱 전문적이고 정돈된 느낌을 줄 수 있습니다. ", fillerCount));
        } else if (fillerCount > 0) {
            sb.append("불필요한 추임새의 사용이 적어 전반적으로 메시지 전달력이 우수합니다. ");
        }
        
        return sb.toString().trim();
    }

    private String generateNonverbalFeedback(Float eyeContactScore, Float anxietyScore, Float headStabilityScore) {
        StringBuilder sb = new StringBuilder();
        
        if (eyeContactScore != null) {
            if (eyeContactScore < 50) {
                sb.append("카메라(면접관)를 바라보는 비율이 낮아 시선이 다소 불안정해 보일 수 있습니다. 답변 시 정면을 응시하는 연습을 해보세요. ");
            } else if (eyeContactScore < 80) {
                sb.append("시선 처리가 대체로 양호하지만, 가끔 시선이 분산되는 경향이 있습니다. 조금 더 집중력 있게 정면을 응시하는 것이 좋습니다. ");
            } else {
                sb.append("아이컨택 유지율이 매우 우수하여 면접관에게 신뢰감과 진정성을 줍니다. ");
            }
        }
        
        if (anxietyScore != null) {
            if (anxietyScore > 45) {
                sb.append("얼굴 표정이나 움직임에서 다소 긴장한 모습이 관찰됩니다. 답변 시작 전에 깊게 호흡을 하시고 자연스러운 미소를 지어보세요. ");
            } else {
                sb.append("차분하고 안정감 있는 태도로 대답하셨습니다. ");
            }
        }
        
        if (headStabilityScore != null) {
            if (headStabilityScore < 75) {
                sb.append("대답할 때 머리나 시선의 잦은 흔들림이 감지됩니다. 몸의 긴장을 풀고 머리를 고정한 채 차분히 말하는 연습이 필요합니다. ");
            } else {
                sb.append("움직임이 흔들림 없이 안정적이어서 신뢰도를 더욱 높여줍니다. ");
            }
        }
        
        return sb.toString().trim();
    }
}

