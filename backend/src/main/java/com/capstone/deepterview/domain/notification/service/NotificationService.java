package com.capstone.deepterview.domain.notification.service;

import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.capstone.deepterview.domain.member.domain.User;
import com.capstone.deepterview.domain.member.repository.UserRepository;
import com.capstone.deepterview.domain.notification.domain.Notification;
import com.capstone.deepterview.domain.notification.domain.NotificationType;
import com.capstone.deepterview.domain.notification.dto.response.NotificationResponse;
import com.capstone.deepterview.domain.notification.repository.NotificationRepository;
import com.capstone.deepterview.domain.review.domain.Comment;
import com.capstone.deepterview.global.exception.CustomException;
import com.capstone.deepterview.global.exception.ErrorCode;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    private static final Pattern MENTION_PATTERN = Pattern.compile("@(\\w+)");

    @Transactional
    public void notifyCommentCreated(Comment comment) {
        User recipient = comment.getReview().getAuthor();
        if (recipient.getId().equals(comment.getAuthor().getId()))
            return;

        Notification notification = Notification.of(
                recipient, comment.getAuthor(), NotificationType.REVIEW_COMMENT,
                "REVIEW", comment.getReview().getId(), 1,
                comment.getAuthor().getName() + "님이 회원님의 게시글에 댓글을 남겼습니다");
        notificationRepository.save(notification);
    }

    @Transactional
    public void notifyReplyCreated(Comment reply) {
        User recipient = reply.getParent().getAuthor();
        if (recipient.getId().equals(reply.getAuthor().getId()))
            return;

        Notification notification = Notification.of(
                recipient, reply.getAuthor(), NotificationType.REVIEW_REPLY,
                "REVIEW", reply.getReview().getId(), 1,
                reply.getAuthor().getName() + "님이 회원님의 댓글에 답글을 남겼습니다");
        notificationRepository.save(notification);
    }

    @Transactional
    public void notifyReactionToggled(User actor, Long contentOwnerId, String referenceName,
            NotificationType type, Long reviewId) {
        if (contentOwnerId.equals(actor.getId()))
            return;

        var existing = notificationRepository.findByRecipientIdAndTypeAndReferenceTypeAndReferenceIdAndDeletedAtIsNull(
                contentOwnerId, type, "REVIEW", reviewId);

        if (existing.isPresent()) {
            Notification notification = existing.get();
            String newContent = buildReactionContent(actor, notification.getActorCount() + 1, referenceName);
            notification.updateForGroupedReaction(actor, newContent);
        } else {
            User recipient = userRepository.findById(contentOwnerId)
                    .orElseThrow(() -> new CustomException(ErrorCode.NOT_FOUND, "사용자를 찾을 수 없습니다."));
            Notification notification = Notification.of(
                    recipient, actor, type, "REVIEW", reviewId, 1,
                    actor.getName() + "님이 회원님의 " + referenceName + "을(를) 좋아합니다");
            notificationRepository.save(notification);
        }
    }

    @Transactional
    public void notifyMentions(String content, User actor, String referenceType, Long referenceId) {
        Matcher matcher = MENTION_PATTERN.matcher(content);
        while (matcher.find()) {
            String mentionedLoginId = matcher.group(1);
            userRepository.findByLoginId(mentionedLoginId).ifPresent(mentionedUser -> {
                if (!mentionedUser.getId().equals(actor.getId())) {
                    Notification notification = Notification.of(
                            mentionedUser, actor, NotificationType.MENTION,
                            referenceType, referenceId, 1,
                            actor.getName() + "님이 댓글에서 회원님을 언급했습니다");
                    notificationRepository.save(notification);
                }
            });
        }
    }

    @Transactional(readOnly = true)
    public List<NotificationResponse> getNotifications(Long userId) {
        return notificationRepository
                .findByRecipientIdAndDeletedAtIsNullOrderByCreatedAtDesc(userId)
                .stream()
                .map(NotificationResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public long getUnreadCount(Long userId) {
        return notificationRepository.countByRecipientIdAndIsReadFalseAndDeletedAtIsNull(userId);
    }

    @Transactional
    public void markAsRead(Long userId, Long notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new CustomException(ErrorCode.NOT_FOUND, "알림을 찾을 수 없습니다."));
        if (!notification.getRecipient().getId().equals(userId)) {
            throw new CustomException(ErrorCode.FORBIDDEN, "자신의 알림만 읽음 처리할 수 있습니다.");
        }
        notification.markAsRead();
    }

    @Transactional
    public void markAllAsRead(Long userId) {
        notificationRepository
                .findByRecipientIdAndDeletedAtIsNullOrderByCreatedAtDesc(userId)
                .stream()
                .filter(n -> !n.isRead())
                .forEach(Notification::markAsRead);
    }

    @Transactional
    public void deleteNotification(Long userId, Long notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new CustomException(ErrorCode.NOT_FOUND, "알림을 찾을 수 없습니다."));
        if (!notification.getRecipient().getId().equals(userId)) {
            throw new CustomException(ErrorCode.FORBIDDEN, "자신의 알림만 삭제할 수 있습니다.");
        }
        notification.softDelete();
    }

    private String buildReactionContent(User actor, int count, String referenceName) {
        if (count <= 1) {
            return actor.getName() + "님이 회원님의 " + referenceName + "을(를) 좋아합니다";
        }
        return actor.getName() + "님 외 " + (count - 1) + "명이 회원님의 " + referenceName + "을(를) 좋아합니다";
    }
}
