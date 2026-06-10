package com.capstone.deepterview.global.common;

import com.capstone.deepterview.global.exception.ErrorCode;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public class ApiResponse<T> {

	private final boolean success;

	@JsonInclude(JsonInclude.Include.NON_NULL)
	private final T data;

	@JsonInclude(JsonInclude.Include.NON_NULL)
	private final String message;

	@JsonInclude(JsonInclude.Include.NON_NULL)
	private final String code;

	public static <T> ApiResponse<T> success(T data) {
		return new ApiResponse<>(true, data, null, null);
	}

	public static ApiResponse<Void> success() {
		return new ApiResponse<>(true, null, "요청이 성공적으로 처리되었습니다.", null);
	}

	public static ApiResponse<Void> successMessage(String message) {
		return new ApiResponse<>(true, null, message, null);
	}

	public static ApiResponse<Void> failure(ErrorCode errorCode, String message) {
		return new ApiResponse<>(false, null, message, errorCode.name());
	}
}

