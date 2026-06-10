package com.capstone.deepterview.global.exception;

/**
 * 비즈니스 규칙 위반 시 사용하는 예외입니다. (GlobalExceptionHandler에서 CustomException과 동일하게 처리됩니다.)
 */
public class BusinessException extends CustomException {

	public BusinessException(ErrorCode errorCode, String message) {
		super(errorCode, message);
	}
}
