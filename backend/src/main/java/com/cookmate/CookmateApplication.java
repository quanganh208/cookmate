package com.cookmate;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class CookmateApplication {
    public static void main(String[] args) {
        SpringApplication.run(CookmateApplication.class, args);
    }
}
