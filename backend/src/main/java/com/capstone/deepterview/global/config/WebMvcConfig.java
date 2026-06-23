package com.capstone.deepterview.global.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Path;
import java.nio.file.Paths;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

	@Override
	public void addResourceHandlers(ResourceHandlerRegistry registry) {
		Path projectRoot = Paths.get(System.getProperty("user.dir")).normalize();
		Path uploadPath = projectRoot.resolve("storage/uploads").toAbsolutePath().normalize();

		registry.addResourceHandler("/api/v1/uploads/**")
				.addResourceLocations("file:" + uploadPath.toString() + "/");
	}
}
