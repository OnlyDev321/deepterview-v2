package com.capstone.deepterview.domain.member.service;

import com.capstone.deepterview.domain.member.domain.OAuthProvider;
import com.capstone.deepterview.domain.member.domain.User;
import com.capstone.deepterview.domain.member.dto.request.UpdateProfileRequest;
import com.capstone.deepterview.domain.member.dto.response.MeResponse;
import com.capstone.deepterview.domain.member.repository.UserRepository;
import com.capstone.deepterview.global.exception.CustomException;
import com.capstone.deepterview.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Optional;
import java.util.UUID;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class MemberService {

	private final UserRepository userRepository;

	@Transactional
	public String uploadAvatar(Long userId, MultipartFile file) {
		if (file == null || file.isEmpty()) {
			throw new CustomException(ErrorCode.VALIDATION_ERROR, "파일이 비어있습니다.");
		}

		try {
			Path projectRoot = Paths.get(System.getProperty("user.dir")).normalize();
			Path dir = projectRoot.resolve("storage/uploads").normalize();
			Files.createDirectories(dir);

			String original = Optional.ofNullable(file.getOriginalFilename()).orElse("avatar.png");
			String ext = "";
			int dot = original.lastIndexOf('.');
			if (dot >= 0) {
				ext = original.substring(dot);
			}
			String filename = "avatar_" + UUID.randomUUID() + ext;

			Path target = dir.resolve(filename);
			file.transferTo(target);

			return "/api/v1/uploads/" + filename;
		} catch (IOException e) {
			throw new CustomException(ErrorCode.INTERNAL_SERVER_ERROR, "프로필 이미지 저장에 실패했습니다.");
		}
	}

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

		String newName = request.name();
		if (newName == null || newName.trim().isEmpty()) {
			throw new CustomException(ErrorCode.VALIDATION_ERROR, "이름은 필수 입력 항목입니다.");
		}

		user.updateMyInfo(newName, request.bio(), request.profileImageUrl());
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

