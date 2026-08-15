 package org.bulkby.app;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication(scanBasePackages = "org.bulkby")
@EntityScan(basePackages = "org.bulkby")
@EnableJpaRepositories(basePackages = "org.bulkby")
@EnableScheduling
public class BulkByApplication {
    public static void main(String[] args) {
        SpringApplication.run(BulkByApplication.class, args);
    }
}
