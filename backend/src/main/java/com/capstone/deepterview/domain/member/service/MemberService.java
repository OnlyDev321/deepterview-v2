package com.capstone.deepterview.domain.member.service;

import com.capstone.deepterview.domain.member.domain.User;
import com.capstone.deepterview.domain.member.dto.request.UpdateProfileRequest;
import com.capstone.deepterview.domain.member.dto.response.MeResponse;
import com.capstone.deepterview.domain.member.repository.UserRepository;
import com.capstone.deepterview.global.exception.CustomException;
import com.capstone.deepterview.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class MemberService {

	private final UserRepository userRepository;

	@Transactional(readOnly = true)
	public MeResponse getMe(Long userId) {
		User user = userRepository.findById(userId)
				.orElseThrow(() -> new CustomException(ErrorCode.NOT_FOUND, "사용자를 찾을 수 없습니다."));
		return MeResponse.from(user);
	}

	@Transactional
	public MeResponse updateProfile(Long userId, UpdateProfileRequest request) {
		User user = userRepository.findById(userId)
				.orElseThrow(() -> new CustomException(ErrorCode.NOT_FOUND, "사용자를 찾을 수 없습니다."));
		user.updateMyInfo(request.bio(), request.profileImageUrl());
		return MeResponse.from(user);
	}

	@Transactional
	public void withdraw(Long userId) {
		User user = userRepository.findById(userId)
				.orElseThrow(() -> new CustomException(ErrorCode.NOT_FOUND, "사용자를 찾을 수 없습니다."));

		LocalDateTime now = LocalDateTime.now();
		user.softDelete(now);
		user.getOauthList().forEach(oauth -> oauth.softDelete(now));
	}
}

