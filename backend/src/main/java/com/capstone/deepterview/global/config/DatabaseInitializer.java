package com.capstone.deepterview.global.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class DatabaseInitializer implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) {
        log.info("Starting database schema migration checks...");
        
        try {
            jdbcTemplate.execute("ALTER TABLE answer MODIFY COLUMN submitted_text LONGTEXT");
            log.info("Database schema check: Successfully altered column submitted_text to LONGTEXT");
        } catch (Exception e) {
            log.info("Database schema check: submitted_text column check completed (already LONGTEXT or not required): {}", e.getMessage());
        }

        try {
            jdbcTemplate.execute("ALTER TABLE answer MODIFY COLUMN transcript LONGTEXT");
            log.info("Database schema check: Successfully altered column transcript to LONGTEXT");
        } catch (Exception e) {
            log.info("Database schema check: transcript column check completed (already LONGTEXT or not required): {}", e.getMessage());
        }
    }
}
