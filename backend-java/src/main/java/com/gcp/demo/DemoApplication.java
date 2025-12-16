package com.gcp.demo;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.Collections;
import java.util.Map;

@SpringBootApplication
@RestController
// IMPORTANT: Matches the Ingress Path
@RequestMapping("/api/java")
public class DemoApplication {

    public static void main(String[] args) {
        SpringApplication.run(DemoApplication.class, args);
    }

    @GetMapping("/hello")
    public Map<String, String> sayHello() {
        return Collections.singletonMap("message", "Hello from Spring Boot!");
    }

    @GetMapping("/health")
    public String health() {
        return "OK";
    }
}