package com.capstone.deepterview.domain.review.dto.response;

import com.capstone.deepterview.domain.review.domain.Reaction;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

public record ReactionSummary(
        Map<String, Long> counts,
        String myReaction
) {
    public static ReactionSummary of(List<Reaction> reactions, Long currentUserId) {
        Map<String, Long> counts = reactions.stream()
                .collect(Collectors.groupingBy(
                        r -> r.getEmoji().name(),
                        Collectors.counting()
                ));
        String myReaction = null;
        if (currentUserId != null) {
            myReaction = reactions.stream()
                    .filter(r -> r.getUser().getId().equals(currentUserId))
                    .findFirst()
                    .map(r -> r.getEmoji().name())
                    .orElse(null);
        }
        return new ReactionSummary(counts, myReaction);
    }
}
