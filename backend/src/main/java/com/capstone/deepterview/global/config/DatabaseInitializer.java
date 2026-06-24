package com.capstone.deepterview.global.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.capstone.deepterview.domain.interview.domain.JobCategory;
import com.capstone.deepterview.domain.interview.domain.SessionType;
import com.capstone.deepterview.domain.interview.repository.JobCategoryRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Component
@RequiredArgsConstructor
@Slf4j
public class DatabaseInitializer implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;
    private final JobCategoryRepository jobCategoryRepository;

    @Override
    @Transactional
    public void run(String... args) {
        log.info("Starting database schema migration checks...");

        try {
            jdbcTemplate.execute("ALTER TABLE answer MODIFY COLUMN submitted_text LONGTEXT");
            log.info("Database schema check: Successfully altered column submitted_text to LONGTEXT");
        } catch (Exception e) {
            log.info(
                    "Database schema check: submitted_text column check completed (already LONGTEXT or not required): {}",
                    e.getMessage());
        }

        try {
            jdbcTemplate.execute("ALTER TABLE answer MODIFY COLUMN transcript LONGTEXT");
            log.info("Database schema check: Successfully altered column transcript to LONGTEXT");
        } catch (Exception e) {
            log.info("Database schema check: transcript column check completed (already LONGTEXT or not required): {}",
                    e.getMessage());
        }

        seedJobCategories();
    }

    private void seedJobCategories() {
        log.info("Clearing job categories and re-seeding...");
        jdbcTemplate.execute("SET FOREIGN_KEY_CHECKS = 0");
        jdbcTemplate.execute("TRUNCATE TABLE job_category");
        jdbcTemplate.execute("SET FOREIGN_KEY_CHECKS = 1");

        log.info("Seeding job categories...");

        // IT학과 (khối IT)
        JobCategory it = jobCategoryRepository.save(
                JobCategory.department("IT학과", SessionType.TECHNICAL, "IT 개발 및 기술 학과"));

        // IT학과 sub-fields
        jobCategoryRepository.save(JobCategory.subField("프론트", it, "Frontend Development"));
        jobCategoryRepository.save(JobCategory.subField("백앤드", it, "Backend Development"));
        jobCategoryRepository.save(JobCategory.subField("풀스택", it, "Full Stack Development"));
        jobCategoryRepository.save(JobCategory.subField("인공지능·머신러닝", it, "AI/ML Engineering"));
        jobCategoryRepository.save(JobCategory.subField("클라우드·DevOps", it, "Cloud & DevOps"));
        jobCategoryRepository.save(JobCategory.subField("브릿지 엔지니어", it, "Bridge Engineering"));
        jobCategoryRepository.save(JobCategory.subField("프로젝트 매니저", it, "Project Management"));
        jobCategoryRepository.save(JobCategory.subField("QA 및 테스트 자동화", it, "QA & Test Automation"));

        // 글로벌통상학과
        JobCategory globalTrade = jobCategoryRepository.save(
                JobCategory.department("글로벌통상학과", SessionType.GLOBAL_TRADE, "국제 무역 및 통상 학과"));
        jobCategoryRepository.save(JobCategory.subField("국제무역", globalTrade, "International Trade"));
        jobCategoryRepository.save(JobCategory.subField("국제물류", globalTrade, "International Logistics"));
        jobCategoryRepository.save(JobCategory.subField("무역실무", globalTrade, "Trade Practice"));
        jobCategoryRepository.save(JobCategory.subField("글로벌비즈니스", globalTrade, "Global Business"));

        // 한국학과
        JobCategory koreanStudies = jobCategoryRepository.save(
                JobCategory.department("한국학과", SessionType.KOREAN_STUDIES, "한국어, 문화, 역사, 문학 학과"));
        jobCategoryRepository.save(JobCategory.subField("한국어학", koreanStudies, "Korean Language"));
        jobCategoryRepository.save(JobCategory.subField("한국문화", koreanStudies, "Korean Culture"));
        jobCategoryRepository.save(JobCategory.subField("한국사", koreanStudies, "Korean History"));
        jobCategoryRepository.save(JobCategory.subField("한국문학", koreanStudies, "Korean Literature"));

        // 경영학과
        JobCategory business = jobCategoryRepository.save(
                JobCategory.department("경영학과", SessionType.BUSINESS, "경영 및 마케팅 학과"));
        jobCategoryRepository.save(JobCategory.subField("마케팅", business, "Marketing"));
        jobCategoryRepository.save(JobCategory.subField("인사관리", business, "Human Resources Management"));
        jobCategoryRepository.save(JobCategory.subField("재무관리", business, "Financial Management"));
        jobCategoryRepository.save(JobCategory.subField("회계", business, "Accounting"));

        // 마케팅학과
        JobCategory marketing = jobCategoryRepository.save(
                JobCategory.department("마케팅학과", SessionType.MARKETING, "마케팅 전문 학과"));
        jobCategoryRepository.save(JobCategory.subField("디지털마케팅", marketing, "Digital Marketing"));
        jobCategoryRepository.save(JobCategory.subField("브랜드관리", marketing, "Brand Management"));
        jobCategoryRepository.save(JobCategory.subField("소비자행동", marketing, "Consumer Behavior"));
        jobCategoryRepository.save(JobCategory.subField("시장조사", marketing, "Market Research"));

        // 경제학과
        JobCategory economics = jobCategoryRepository.save(
                JobCategory.department("경제학과", SessionType.ECONOMICS, "경제 학과"));
        jobCategoryRepository.save(JobCategory.subField("미시경제학", economics, "Microeconomics"));
        jobCategoryRepository.save(JobCategory.subField("거시경제학", economics, "Macroeconomics"));
        jobCategoryRepository.save(JobCategory.subField("금융경제학", economics, "Financial Economics"));
        jobCategoryRepository.save(JobCategory.subField("국제경제학", economics, "International Economics"));

        // 회계·세무학과
        JobCategory accountingTax = jobCategoryRepository.save(
                JobCategory.department("회계·세무학과", SessionType.ACCOUNTING_TAX, "회계 및 세무 학과"));
        jobCategoryRepository.save(JobCategory.subField("재무회계", accountingTax, "Financial Accounting"));
        jobCategoryRepository.save(JobCategory.subField("관리회계", accountingTax, "Management Accounting"));
        jobCategoryRepository.save(JobCategory.subField("세무", accountingTax, "Taxation"));
        jobCategoryRepository.save(JobCategory.subField("회계감사", accountingTax, "Auditing"));

        // 미디어·커뮤니케이션학과
        JobCategory mediaComm = jobCategoryRepository.save(
                JobCategory.department("미디어·커뮤니케이션학과", SessionType.MEDIA_COMM, "미디어 및 커뮤니케이션 학과"));
        jobCategoryRepository.save(JobCategory.subField("광고홍보", mediaComm, "Advertising & PR"));
        jobCategoryRepository.save(JobCategory.subField("디지털미디어", mediaComm, "Digital Media"));
        jobCategoryRepository.save(JobCategory.subField("방송·영상", mediaComm, "Broadcasting & Video"));
        jobCategoryRepository.save(JobCategory.subField("콘텐츠기획", mediaComm, "Content Planning"));

        // 디자인학과
        JobCategory design = jobCategoryRepository.save(
                JobCategory.department("디자인학과", SessionType.DESIGN, "디자인 학과"));
        jobCategoryRepository.save(JobCategory.subField("UI/UX 디자인", design, "UI/UX Design"));
        jobCategoryRepository.save(JobCategory.subField("시각디자인", design, "Visual Design"));
        jobCategoryRepository.save(JobCategory.subField("웹디자인", design, "Web Design"));
        jobCategoryRepository.save(JobCategory.subField("산업디자인", design, "Industrial Design"));

        log.info("Seeded {} job categories successfully.", jobCategoryRepository.count());
    }
}
