package com.cinex;

import java.util.TimeZone;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class CinexApplication {

	public static void main(String[] args) {
		TimeZone.setDefault(TimeZone.getTimeZone("UTC"));
		SpringApplication.run(CinexApplication.class, args);
	}

}
