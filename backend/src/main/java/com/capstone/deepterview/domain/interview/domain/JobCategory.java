package com.capstone.deepterview.domain.interview.domain;

import com.capstone.deepterview.global.common.BaseTimeEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import org.hibernate.annotations.SQLRestriction;

import java.time.LocalDateTime;

@Getter
@Entity
@Table(name = "job_category")
@SQLRestriction("deleted_at is null")
public class JobCategory extends BaseTimeEntity {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false, unique = true, length = 100)
	private String name;

	@Column(length = 500)
	private String description;

	@Column(name = "is_active", nullable = false)
	private boolean active;

	@Column(name = "deleted_at")
	private LocalDateTime deletedAt;

	protected JobCategory() {
	}

	public static JobCategory of(String name, String description) {
		JobCategory category = new JobCategory();
		category.name = name;
		category.description = description;
		category.active = true;
		return category;
	}

	public void deactivate() {
		this.active = false;
	}

	public void softDelete(LocalDateTime deletedAt) {
		this.deletedAt = deletedAt;
	}
}

