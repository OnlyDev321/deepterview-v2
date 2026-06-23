package com.capstone.deepterview.domain.member.domain;

import com.capstone.deepterview.global.common.BaseTimeEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.Getter;
import org.hibernate.annotations.SQLRestriction;

import java.util.ArrayList;
import java.util.List;

@Getter
@Entity
@Table(name = "user")
@SQLRestriction("deleted_at is null")
public class User extends BaseTimeEntity {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false, unique = true, length = 255)
	private String email;

	@Column(nullable = false, length = 100)
	private String name;

	@Column(name = "profile_image_url", length = 500)
	private String profileImageUrl;

	private String bio;

	@Column(name = "deleted_at")
	private java.time.LocalDateTime deletedAt;

	@OneToMany(mappedBy = "user")
	private List<UserOauth> oauthList = new ArrayList<>();

	protected User() {
	}

	public static User of(String email, String name, String profileImageUrl) {
		User user = new User();
		user.email = email;
		user.name = name;
		user.profileImageUrl = profileImageUrl;
		return user;
	}

	public void softDelete(java.time.LocalDateTime deletedAt) {
		this.deletedAt = deletedAt;
	}

	public void updateProfile(String name, String profileImageUrl) {
		this.name = name;
		this.profileImageUrl = profileImageUrl;
	}

	public void updateMyInfo(String name, String bio, String profileImageUrl) {
		this.name = name;
		this.bio = bio;
		this.profileImageUrl = profileImageUrl;
	}
}

