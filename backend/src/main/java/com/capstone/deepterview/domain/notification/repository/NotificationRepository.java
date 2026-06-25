package com.capstone.deepterview.domain.notification.repository;

import com.capstone.deepterview.domain.notification.domain.Notification;
import com.capstone.deepterview.domain.notification.domain.NotificationType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findByRecipientIdAndDeletedAtIsNullOrderByCreatedAtDesc(Long recipientId);

    long countByRecipientIdAndIsReadFalseAndDeletedAtIsNull(Long recipientId);

    Optional<Notification> findByRecipientIdAndTypeAndReferenceTypeAndReferenceIdAndDeletedAtIsNull(
            Long recipientId, NotificationType type, String referenceType, Long referenceId
    );
}
