package com.capstone.deepterview.domain.interview.domain;

import jakarta.persistence.*;
import lombok.Getter;

@Getter
@Entity
@Table(name = "job_category_translation",
       uniqueConstraints = @UniqueConstraint(columnNames = {"job_category_id", "language"}))
public class JobCategoryTranslation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "job_category_id")
    private JobCategory jobCategory;

    @Column(name = "language", nullable = false, length = 10)
    private String language;

    @Column(name = "name", length = 100)
    private String name;

    @Column(name = "description", length = 500)
    private String description;

    protected JobCategoryTranslation() {
    }

    public static JobCategoryTranslation create(JobCategory jobCategory, String language, String name, String description) {
        JobCategoryTranslation t = new JobCategoryTranslation();
        t.jobCategory = jobCategory;
        t.language = language;
        t.name = name;
        t.description = description;
        return t;
    }
}
