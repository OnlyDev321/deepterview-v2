package com.capstone.deepterview.domain.interview.dto.response;

public record AnalysisProgressResponse(
		Long sessionId,
		int totalAnswers,
		int answersWithVideo,
		int speechAnalyzed,
		int nonverbalAnalyzed,
		int starAnalyzed,
		int llmFeedbackDone,
		boolean reportReady
) {
	public int progressPercent() {
		if (totalAnswers == 0) return 0;
		int denom = Math.max(answersWithVideo, 1);
		double speech = (double) speechAnalyzed / denom * 20;
		double nonverbal = (double) nonverbalAnalyzed / denom * 20;
		double star = (double) starAnalyzed / totalAnswers * 20;
		double llm = (double) llmFeedbackDone / totalAnswers * 20;
		double report = reportReady ? 20 : 0;
		return Math.min(100, (int) Math.round(speech + nonverbal + star + llm + report));
	}
}
