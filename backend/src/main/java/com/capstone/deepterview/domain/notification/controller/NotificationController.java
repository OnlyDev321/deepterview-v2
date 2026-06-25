package com.capstone.deepterview.domain.notification.controller;

import com.capstone.deepterview.domain.member.dto.response.UserPrincipal;
import com.capstone.deepterview.domain.notification.dto.response.NotificationResponse;
import com.capstone.deepterview.domain.notification.service.NotificationService;
import com.capstone.deepterview.global.common.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@Tag(name = "알림 컨트롤러")
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    @Operation(summary = "알림 목록 조회 API")
    public ApiResponse<List<NotificationResponse>> getNotifications(
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        return ApiResponse.success(notificationService.getNotifications(principal.getId()));
    }

    @GetMapping("/unread-count")
    @Operation(summary = "읽지 않은 알림 개수 조회 API")
    public ApiResponse<Map<String, Long>> getUnreadCount(
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        long count = notificationService.getUnreadCount(principal.getId());
        return ApiResponse.success(Map.of("count", count));
    }

    @PatchMapping("/{id}/read")
    @Operation(summary = "알림 읽음 처리 API")
    public ApiResponse<Void> markAsRead(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id
    ) {
        notificationService.markAsRead(principal.getId(), id);
        return ApiResponse.successMessage("알림이 읽음 처리되었습니다.");
    }

    @PatchMapping("/read-all")
    @Operation(summary = "모든 알림 읽음 처리 API")
    public ApiResponse<Void> markAllAsRead(
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        notificationService.markAllAsRead(principal.getId());
        return ApiResponse.successMessage("모든 알림이 읽음 처리되었습니다.");
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "알림 삭제 API")
    public ApiResponse<Void> deleteNotification(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id
    ) {
        notificationService.deleteNotification(principal.getId(), id);
        return ApiResponse.successMessage("알림이 삭제되었습니다.");
    }
}
