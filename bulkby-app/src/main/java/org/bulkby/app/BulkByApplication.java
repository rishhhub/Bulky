 package org.bulkby.app;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication(
    scanBasePackages = "org.bulkby",
    exclude = {
        org.springframework.boot.autoconfigure.data.redis.RedisAutoConfiguration.class,
        org.springframework.boot.autoconfigure.data.redis.RedisRepositoriesAutoConfiguration.class
    }
)
@EntityScan(basePackages = "org.bulkby")
@EnableAsync 
@EnableJpaRepositories(basePackages = "org.bulkby")
@EnableScheduling
public class BulkByApplication {
    public static void main(String[] args) {
        SpringApplication.run(BulkByApplication.class, args);
    }
}
