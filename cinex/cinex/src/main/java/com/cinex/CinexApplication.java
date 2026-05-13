package com.cinex;

import java.util.TimeZone;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class CinexApplication {

	public static void main(String[] args) {
		SpringApplication.run(CinexApplication.class, args);
		System.out.println(TimeZone.getDefault().getID());
	}

}
