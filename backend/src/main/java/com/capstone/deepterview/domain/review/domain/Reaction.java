package com.capstone.deepterview.domain.review.domain;

import com.capstone.deepterview.domain.member.domain.User;
import com.capstone.deepterview.global.common.BaseTimeEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Getter;

@Getter
@Entity
@Table(name = "reaction", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"user_id", "target_type", "target_id"})
})
public class Reaction extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id")
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "target_type", nullable = false, length = 20)
    private ReactionTargetType targetType;

    @Column(name = "target_id", nullable = false)
    private Long targetId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Emoji emoji;

    protected Reaction() {
    }

    public static Reaction of(User user, ReactionTargetType targetType, Long targetId, Emoji emoji) {
        Reaction reaction = new Reaction();
        reaction.user = user;
        reaction.targetType = targetType;
        reaction.targetId = targetId;
        reaction.emoji = emoji;
        return reaction;
    }

    public void changeEmoji(Emoji emoji) {
        this.emoji = emoji;
    }
}
