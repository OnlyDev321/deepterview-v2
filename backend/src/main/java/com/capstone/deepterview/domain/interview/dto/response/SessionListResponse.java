package com.capstone.deepterview.domain.interview.dto.response;

import org.springframework.data.domain.Page;

import java.util.List;

public record SessionListResponse(
		List<SessionListItemResponse> content,
		long totalElements,
		int totalPages,
		int currentPage
) {
	public static SessionListResponse from(Page<SessionListItemResponse> page) {
		return new SessionListResponse(
				page.getContent(),
				page.getTotalElements(),
				page.getTotalPages(),
				page.getNumber()
		);
	}
}

