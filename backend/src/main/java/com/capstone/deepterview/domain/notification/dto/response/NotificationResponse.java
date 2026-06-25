package com.capstone.deepterview.domain.notification.dto.response;

import com.capstone.deepterview.domain.notification.domain.Notification;

import java.time.LocalDateTime;

public record NotificationResponse(
        Long id,
        Long actorId,
        String actorName,
        String actorProfileImageUrl,
        String type,
        String referenceType,
        Long referenceId,
        String content,
        boolean isRead,
        int actorCount,
        LocalDateTime createdAt
) {
    public static NotificationResponse from(Notification notification) {
        return new NotificationResponse(
                notification.getId(),
                notification.getActor() != null ? notification.getActor().getId() : null,
                notification.getActor() != null ? notification.getActor().getName() : null,
                notification.getActor() != null ? notification.getActor().getProfileImageUrl() : null,
                notification.getType().name(),
                notification.getReferenceType(),
                notification.getReferenceId(),
                notification.getContent(),
                notification.isRead(),
                notification.getActorCount(),
                notification.getCreatedAt()
        );
    }
}
