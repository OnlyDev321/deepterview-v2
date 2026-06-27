package com.capstone.deepterview.global.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.capstone.deepterview.domain.interview.domain.JobCategory;
import com.capstone.deepterview.domain.interview.domain.JobCategoryTranslation;
import com.capstone.deepterview.domain.interview.domain.SessionType;
import com.capstone.deepterview.domain.interview.repository.JobCategoryRepository;
import com.capstone.deepterview.domain.interview.repository.JobCategoryTranslationRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Component
@RequiredArgsConstructor
@Slf4j
public class DatabaseInitializer implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;
    private final JobCategoryRepository jobCategoryRepository;
    private final JobCategoryTranslationRepository jobCategoryTranslationRepository;

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
        jdbcTemplate.execute("TRUNCATE TABLE job_category_translation");
        jdbcTemplate.execute("SET FOREIGN_KEY_CHECKS = 1");

        log.info("Seeding job categories...");

        // IT/CS department
        JobCategory it = jobCategoryRepository.save(
                JobCategory.department("IT학과", SessionType.TECHNICAL, "IT 개발 및 기술 학과"));
        JobCategory frontend = jobCategoryRepository.save(JobCategory.subField("프론트", it, "Frontend Development"));
        JobCategory backend = jobCategoryRepository.save(JobCategory.subField("백앤드", it, "Backend Development"));
        JobCategory fullstack = jobCategoryRepository.save(JobCategory.subField("풀스택", it, "Full Stack Development"));
        JobCategory aiMl = jobCategoryRepository.save(JobCategory.subField("인공지능·머신러닝", it, "AI/ML Engineering"));
        JobCategory cloudDevops = jobCategoryRepository.save(JobCategory.subField("클라우드·DevOps", it, "Cloud & DevOps"));
        JobCategory bridgeEng = jobCategoryRepository.save(JobCategory.subField("브릿지 엔지니어", it, "Bridge Engineering"));
        JobCategory pm = jobCategoryRepository.save(JobCategory.subField("프로젝트 매니저", it, "Project Management"));
        JobCategory qa = jobCategoryRepository.save(JobCategory.subField("QA 및 테스트 자동화", it, "QA & Test Automation"));

        // Global Trade department
        JobCategory globalTrade = jobCategoryRepository.save(
                JobCategory.department("글로벌통상학과", SessionType.GLOBAL_TRADE, "국제 무역 및 통상 학과"));
        JobCategory intTrade = jobCategoryRepository.save(JobCategory.subField("국제무역", globalTrade, "International Trade"));
        JobCategory intLogistics = jobCategoryRepository.save(JobCategory.subField("국제물류", globalTrade, "International Logistics"));
        JobCategory tradePractice = jobCategoryRepository.save(JobCategory.subField("무역실무", globalTrade, "Trade Practice"));
        JobCategory globalBiz = jobCategoryRepository.save(JobCategory.subField("글로벌비즈니스", globalTrade, "Global Business"));

        // Korean Studies department
        JobCategory koreanStudies = jobCategoryRepository.save(
                JobCategory.department("한국학과", SessionType.KOREAN_STUDIES, "한국어, 문화, 역사, 문학 학과"));
        JobCategory korLang = jobCategoryRepository.save(JobCategory.subField("한국어학", koreanStudies, "Korean Language"));
        JobCategory korCulture = jobCategoryRepository.save(JobCategory.subField("한국문화", koreanStudies, "Korean Culture"));
        JobCategory korHistory = jobCategoryRepository.save(JobCategory.subField("한국사", koreanStudies, "Korean History"));
        JobCategory korLit = jobCategoryRepository.save(JobCategory.subField("한국문학", koreanStudies, "Korean Literature"));

        // Business department
        JobCategory business = jobCategoryRepository.save(
                JobCategory.department("경영학과", SessionType.BUSINESS, "경영 및 마케팅 학과"));
        JobCategory marketing = jobCategoryRepository.save(JobCategory.subField("마케팅", business, "Marketing"));
        JobCategory hr = jobCategoryRepository.save(JobCategory.subField("인사관리", business, "Human Resources Management"));
        JobCategory finance = jobCategoryRepository.save(JobCategory.subField("재무관리", business, "Financial Management"));
        JobCategory accounting = jobCategoryRepository.save(JobCategory.subField("회계", business, "Accounting"));

        // Marketing department
        JobCategory marketingDept = jobCategoryRepository.save(
                JobCategory.department("마케팅학과", SessionType.MARKETING, "마케팅 전문 학과"));
        JobCategory digitalMkt = jobCategoryRepository.save(JobCategory.subField("디지털마케팅", marketingDept, "Digital Marketing"));
        JobCategory brandMgt = jobCategoryRepository.save(JobCategory.subField("브랜드관리", marketingDept, "Brand Management"));
        JobCategory consumerBeh = jobCategoryRepository.save(JobCategory.subField("소비자행동", marketingDept, "Consumer Behavior"));
        JobCategory marketRes = jobCategoryRepository.save(JobCategory.subField("시장조사", marketingDept, "Market Research"));

        // Economics department
        JobCategory economics = jobCategoryRepository.save(
                JobCategory.department("경제학과", SessionType.ECONOMICS, "경제 학과"));
        JobCategory microEcon = jobCategoryRepository.save(JobCategory.subField("미시경제학", economics, "Microeconomics"));
        JobCategory macroEcon = jobCategoryRepository.save(JobCategory.subField("거시경제학", economics, "Macroeconomics"));
        JobCategory finEcon = jobCategoryRepository.save(JobCategory.subField("금융경제학", economics, "Financial Economics"));
        JobCategory intEcon = jobCategoryRepository.save(JobCategory.subField("국제경제학", economics, "International Economics"));

        // Accounting & Tax department
        JobCategory accountingTax = jobCategoryRepository.save(
                JobCategory.department("회계·세무학과", SessionType.ACCOUNTING_TAX, "회계 및 세무 학과"));
        JobCategory finAcct = jobCategoryRepository.save(JobCategory.subField("재무회계", accountingTax, "Financial Accounting"));
        JobCategory mgmtAcct = jobCategoryRepository.save(JobCategory.subField("관리회계", accountingTax, "Management Accounting"));
        JobCategory taxation = jobCategoryRepository.save(JobCategory.subField("세무", accountingTax, "Taxation"));
        JobCategory auditing = jobCategoryRepository.save(JobCategory.subField("회계감사", accountingTax, "Auditing"));

        // Media & Communication department
        JobCategory mediaComm = jobCategoryRepository.save(
                JobCategory.department("미디어·커뮤니케이션학과", SessionType.MEDIA_COMM, "미디어 및 커뮤니케이션 학과"));
        JobCategory adPr = jobCategoryRepository.save(JobCategory.subField("광고홍보", mediaComm, "Advertising & PR"));
        JobCategory digitalMedia = jobCategoryRepository.save(JobCategory.subField("디지털미디어", mediaComm, "Digital Media"));
        JobCategory broadcast = jobCategoryRepository.save(JobCategory.subField("방송·영상", mediaComm, "Broadcasting & Video"));
        JobCategory contentPlan = jobCategoryRepository.save(JobCategory.subField("콘텐츠기획", mediaComm, "Content Planning"));

        // Design department
        JobCategory design = jobCategoryRepository.save(
                JobCategory.department("디자인학과", SessionType.DESIGN, "디자인 학과"));
        JobCategory uiUx = jobCategoryRepository.save(JobCategory.subField("UI/UX 디자인", design, "UI/UX Design"));
        JobCategory visualDesign = jobCategoryRepository.save(JobCategory.subField("시각디자인", design, "Visual Design"));
        JobCategory webDesign = jobCategoryRepository.save(JobCategory.subField("웹디자인", design, "Web Design"));
        JobCategory industrialDesign = jobCategoryRepository.save(JobCategory.subField("산업디자인", design, "Industrial Design"));

        log.info("Seeded {} job categories successfully.", jobCategoryRepository.count());

        seedTranslations(new Object[]{ it, frontend, backend, fullstack, aiMl, cloudDevops, bridgeEng, pm, qa,
                globalTrade, intTrade, intLogistics, tradePractice, globalBiz,
                koreanStudies, korLang, korCulture, korHistory, korLit,
                business, marketing, hr, finance, accounting,
                marketingDept, digitalMkt, brandMgt, consumerBeh, marketRes,
                economics, microEcon, macroEcon, finEcon, intEcon,
                accountingTax, finAcct, mgmtAcct, taxation, auditing,
                mediaComm, adPr, digitalMedia, broadcast, contentPlan,
                design, uiUx, visualDesign, webDesign, industrialDesign
        });
    }

    private void seedTranslations(Object[] categories) {
        log.info("Seeding English and Vietnamese translations...");

        String[][] enData = {
            {"IT Department", "IT Development & Technology Department"},
            {"Frontend", "Frontend Development"},
            {"Backend", "Backend Development"},
            {"Full Stack", "Full Stack Development"},
            {"AI/Machine Learning", "AI/ML Engineering"},
            {"Cloud & DevOps", "Cloud & DevOps"},
            {"Bridge Engineer", "Bridge Engineering"},
            {"Project Manager", "Project Management"},
            {"QA & Test Automation", "QA & Test Automation"},
            {"Global Trade Department", "International Trade & Commerce Department"},
            {"International Trade", "International Trade"},
            {"International Logistics", "International Logistics"},
            {"Trade Practice", "Trade Practice"},
            {"Global Business", "Global Business"},
            {"Korean Studies Department", "Korean Language, Culture, History & Literature Department"},
            {"Korean Language", "Korean Language"},
            {"Korean Culture", "Korean Culture"},
            {"Korean History", "Korean History"},
            {"Korean Literature", "Korean Literature"},
            {"Business Administration Department", "Business & Marketing Department"},
            {"Marketing", "Marketing"},
            {"Human Resources", "Human Resources Management"},
            {"Financial Management", "Financial Management"},
            {"Accounting", "Accounting"},
            {"Marketing Department", "Marketing Department"},
            {"Digital Marketing", "Digital Marketing"},
            {"Brand Management", "Brand Management"},
            {"Consumer Behavior", "Consumer Behavior"},
            {"Market Research", "Market Research"},
            {"Economics Department", "Economics Department"},
            {"Microeconomics", "Microeconomics"},
            {"Macroeconomics", "Macroeconomics"},
            {"Financial Economics", "Financial Economics"},
            {"International Economics", "International Economics"},
            {"Accounting & Tax Department", "Accounting & Tax Department"},
            {"Financial Accounting", "Financial Accounting"},
            {"Management Accounting", "Management Accounting"},
            {"Taxation", "Taxation"},
            {"Auditing", "Auditing"},
            {"Media & Communication Department", "Media & Communication Department"},
            {"Advertising & PR", "Advertising & PR"},
            {"Digital Media", "Digital Media"},
            {"Broadcasting & Video", "Broadcasting & Video"},
            {"Content Planning", "Content Planning"},
            {"Design Department", "Design Department"},
            {"UI/UX Design", "UI/UX Design"},
            {"Visual Design", "Visual Design"},
            {"Web Design", "Web Design"},
            {"Industrial Design", "Industrial Design"}
        };

        String[][] viData = {
            {"Khoa IT", "Khoa Phát triển & Công nghệ IT"},
            {"Frontend", "Phát triển Frontend"},
            {"Backend", "Phát triển Backend"},
            {"Full Stack", "Phát triển Full Stack"},
            {"AI/Machine Learning", "Kỹ thuật AI/ML"},
            {"Cloud & DevOps", "Cloud & DevOps"},
            {"Kỹ sư cầu nối", "Kỹ thuật cầu nối"},
            {"Quản lý dự án", "Quản lý dự án"},
            {"QA & Tự động hóa kiểm thử", "QA & Tự động hóa kiểm thử"},
            {"Khoa Thương mại Toàn cầu", "Khoa Thương mại & Giao dịch Quốc tế"},
            {"Thương mại quốc tế", "Thương mại quốc tế"},
            {"Logistics quốc tế", "Logistics quốc tế"},
            {"Thực hành thương mại", "Thực hành thương mại"},
            {"Kinh doanh toàn cầu", "Kinh doanh toàn cầu"},
            {"Khoa Hàn Quốc học", "Khoa Ngôn ngữ, Văn hóa, Lịch sử & Văn học Hàn Quốc"},
            {"Ngôn ngữ Hàn", "Ngôn ngữ Hàn Quốc"},
            {"Văn hóa Hàn", "Văn hóa Hàn Quốc"},
            {"Lịch sử Hàn", "Lịch sử Hàn Quốc"},
            {"Văn học Hàn", "Văn học Hàn Quốc"},
            {"Khoa Quản trị Kinh doanh", "Khoa Quản trị & Tiếp thị"},
            {"Tiếp thị", "Tiếp thị"},
            {"Quản trị nhân sự", "Quản trị nhân sự"},
            {"Quản trị tài chính", "Quản trị tài chính"},
            {"Kế toán", "Kế toán"},
            {"Khoa Tiếp thị", "Khoa Tiếp thị"},
            {"Tiếp thị số", "Tiếp thị số"},
            {"Quản lý thương hiệu", "Quản lý thương hiệu"},
            {"Hành vi người tiêu dùng", "Hành vi người tiêu dùng"},
            {"Nghiên cứu thị trường", "Nghiên cứu thị trường"},
            {"Khoa Kinh tế", "Khoa Kinh tế"},
            {"Kinh tế vi mô", "Kinh tế vi mô"},
            {"Kinh tế vĩ mô", "Kinh tế vĩ mô"},
            {"Kinh tế tài chính", "Kinh tế tài chính"},
            {"Kinh tế quốc tế", "Kinh tế quốc tế"},
            {"Khoa Kế toán & Thuế", "Khoa Kế toán & Thuế"},
            {"Kế toán tài chính", "Kế toán tài chính"},
            {"Kế toán quản trị", "Kế toán quản trị"},
            {"Thuế", "Thuế"},
            {"Kiểm toán", "Kiểm toán"},
            {"Khoa Truyền thông", "Khoa Truyền thông & Báo chí"},
            {"Quảng cáo & PR", "Quảng cáo & Quan hệ công chúng"},
            {"Truyền thông số", "Truyền thông số"},
            {"Phát thanh & Video", "Phát thanh & Video"},
            {"Lập kế hoạch nội dung", "Lập kế hoạch nội dung"},
            {"Khoa Thiết kế", "Khoa Thiết kế"},
            {"Thiết kế UI/UX", "Thiết kế UI/UX"},
            {"Thiết kế đồ họa", "Thiết kế đồ họa"},
            {"Thiết kế web", "Thiết kế web"},
            {"Thiết kế công nghiệp", "Thiết kế công nghiệp"}
        };

        for (int i = 0; i < categories.length; i++) {
            JobCategory cat = (JobCategory) categories[i];
            jobCategoryTranslationRepository.save(
                    JobCategoryTranslation.create(cat, "en", enData[i][0], enData[i][1]));
            jobCategoryTranslationRepository.save(
                    JobCategoryTranslation.create(cat, "vi", viData[i][0], viData[i][1]));
        }

        log.info("Seeded {} translations successfully.", jobCategoryTranslationRepository.count());
    }
}
