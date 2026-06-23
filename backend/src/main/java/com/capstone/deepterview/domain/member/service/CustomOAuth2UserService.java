package com.capstone.deepterview.domain.member.service;

import com.capstone.deepterview.domain.member.domain.OAuthProvider;
import com.capstone.deepterview.domain.member.domain.User;
import com.capstone.deepterview.domain.member.domain.UserOauth;
import com.capstone.deepterview.domain.member.repository.UserOauthRepository;
import com.capstone.deepterview.domain.member.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;
import java.util.Set;

@Slf4j
@Service
@RequiredArgsConstructor
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

	private final UserRepository userRepository;
	private final UserOauthRepository userOauthRepository;

	@Override
	@Transactional(propagation = Propagation.REQUIRES_NEW)
	public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
		try {
			log.error("OAuth2 loadUser 진입 - provider: {}",
					userRequest.getClientRegistration().getRegistrationId());

			OAuth2User oAuth2User = super.loadUser(userRequest);
			log.error("OAuth2 super.loadUser 완료");

			String registrationId = userRequest.getClientRegistration().getRegistrationId();

			OAuthUserInfo userInfo = extractUserInfo(registrationId, oAuth2User.getAttributes());
			log.error("OAuth2 userInfo 추출 완료 - email: {}", userInfo.email());

			OAuthProvider provider = OAuthProvider.valueOf(registrationId.toUpperCase());

			User user = userRepository.findByEmail(userInfo.email())
					.map(existingUser -> {
						String currentImage = existingUser.getProfileImageUrl();
						String nextImage = (currentImage == null || currentImage.isEmpty())
								? userInfo.profileImageUrl()
								: currentImage;
						existingUser.updateProfile(userInfo.name(), nextImage);
						return existingUser;
					})
					.orElseGet(() -> userRepository.save(User.of(userInfo.email(), userInfo.name(), userInfo.profileImageUrl())));
			log.error("OAuth2 user 저장 완료 - userId: {}", user.getId());


			userOauthRepository.findByProviderAndProviderId(provider, userInfo.providerId())
					.orElseGet(() -> userOauthRepository.save(
							UserOauth.of(user, provider, userInfo.providerId(), null, null, null))
					);
			log.error("OAuth2 userOauth 저장 완료");

			Map<String, Object> attributes = new HashMap<>();
			attributes.put("userId", user.getId());
			attributes.put("email", user.getEmail());
			attributes.put("name", user.getName());
			attributes.put("profileImageUrl", user.getProfileImageUrl());
			attributes.put("provider", provider.name());
			attributes.put("providerId", userInfo.providerId());

			return new DefaultOAuth2User(
					Set.of(() -> "ROLE_USER"),
					attributes,
					"email"
			);
		} catch (Exception e) {
			log.error("OAuth2 loadUser 중 에러 발생", e);
			throw e;
		}
	}

	@SuppressWarnings("unchecked")
	private OAuthUserInfo extractUserInfo(String registrationId, Map<String, Object> attributes) {
		if ("google".equals(registrationId)) {
			String email = (String) attributes.get("email");
			String name = (String) attributes.get("name");
			String picture = (String) attributes.get("picture");
			String sub = (String) attributes.get("sub");
			return new OAuthUserInfo(email, name, picture, sub);
		}

		if ("kakao".equals(registrationId)) {
			Map<String, Object> kakaoAccount = (Map<String, Object>) attributes.get("kakao_account");
			Map<String, Object> profile = kakaoAccount == null ? null : (Map<String, Object>) kakaoAccount.get("profile");
			String email = kakaoAccount == null ? null : (String) kakaoAccount.get("email");
			String name = profile == null ? "kakao-user" : (String) profile.get("nickname");
			String image = profile == null ? null : (String) profile.get("profile_image_url");
			Object id = attributes.get("id");
			return new OAuthUserInfo(email, name, image, String.valueOf(id));
		}

		throw new OAuth2AuthenticationException("지원하지 않는 OAuth provider 입니다.");
	}

	private record OAuthUserInfo(
			String email,
			String name,
			String profileImageUrl,
			String providerId
	) {
	}
}

