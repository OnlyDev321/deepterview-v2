package com.capstone.deepterview.domain.notification.domain;

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
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Entity
@Table(name = "notification")
public class Notification extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "recipient_id")
    private User recipient;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "actor_id")
    private User actor;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private NotificationType type;

    @Column(length = 20)
    private String referenceType;

    private Long referenceId;

    @Column(length = 300)
    private String content;

    @Column(name = "is_read", nullable = false)
    private boolean isRead;

    @Column(name = "read_at")
    private LocalDateTime readAt;

    @Column(name = "actor_count", nullable = false)
    private int actorCount;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    protected Notification() {
    }

    public static Notification of(User recipient, User actor, NotificationType type,
                                   String referenceType, Long referenceId, int actorCount, String content) {
        Notification notification = new Notification();
        notification.recipient = recipient;
        notification.actor = actor;
        notification.type = type;
        notification.referenceType = referenceType;
        notification.referenceId = referenceId;
        notification.actorCount = actorCount;
        notification.content = content;
        return notification;
    }

    public void markAsRead() {
        this.isRead = true;
        this.readAt = LocalDateTime.now();
    }

    public void softDelete() {
        this.deletedAt = LocalDateTime.now();
    }

    public void updateForGroupedReaction(User newActor, String newContent) {
        if (!this.actor.getId().equals(newActor.getId())) {
            this.actorCount++;
        }
        this.actor = newActor;
        this.content = newContent;
        this.isRead = false;
        this.readAt = null;
    }
}
