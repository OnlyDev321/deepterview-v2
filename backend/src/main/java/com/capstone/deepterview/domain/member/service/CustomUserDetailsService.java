package com.capstone.deepterview.domain.member.service;

import com.capstone.deepterview.domain.member.dto.response.UserPrincipal;
import com.capstone.deepterview.domain.member.repository.UserRepository;
import com.capstone.deepterview.global.exception.CustomException;
import com.capstone.deepterview.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

	private final UserRepository userRepository;

	@Override
	public UserDetails loadUserByUsername(String userIdText) throws UsernameNotFoundException {
		Long userId = Long.valueOf(userIdText);
		return userRepository.findById(userId)
				.map(UserPrincipal::from)
				.orElseThrow(() -> new CustomException(ErrorCode.UNAUTHORIZED, "유효하지 않은 사용자입니다."));
	}
}

