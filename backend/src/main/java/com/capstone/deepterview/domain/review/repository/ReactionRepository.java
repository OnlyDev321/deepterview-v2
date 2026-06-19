package com.capstone.deepterview.domain.review.repository;

import com.capstone.deepterview.domain.review.domain.Emoji;
import com.capstone.deepterview.domain.review.domain.Reaction;
import com.capstone.deepterview.domain.review.domain.ReactionTargetType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ReactionRepository extends JpaRepository<Reaction, Long> {

    Optional<Reaction> findByUserIdAndTargetTypeAndTargetId(Long userId, ReactionTargetType targetType, Long targetId);

    List<Reaction> findByTargetTypeAndTargetId(ReactionTargetType targetType, Long targetId);

    List<Reaction> findByTargetTypeAndTargetIdIn(ReactionTargetType targetType, List<Long> targetIds);
}
