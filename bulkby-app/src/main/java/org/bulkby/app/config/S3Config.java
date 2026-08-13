package org.bulkby.app.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.AwsCredentialsProvider;
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3ClientBuilder;

import java.net.URI;

/**
 * S3 client for file storage when file.storage-type=s3.
 * Supports AWS S3 and S3-compatible endpoints (e.g. MinIO) via file.s3.endpoint-override.
 */
@Configuration
@ConditionalOnProperty(name = "file.storage-type", havingValue = "s3")
public class S3Config {

    @Bean
    public S3Client s3Client(
            @Value("${file.s3.region:us-east-1}") String region,
            @Value("${file.s3.endpoint-override:}") String endpointOverride,
            @Value("${file.s3.access-key:}") String accessKey,
            @Value("${file.s3.secret-key:}") String secretKey) {
        S3ClientBuilder builder = S3Client.builder().region(Region.of(region));
        if (endpointOverride != null && !endpointOverride.isBlank()) {
            builder.endpointOverride(URI.create(endpointOverride));
        }
        AwsCredentialsProvider credentials = (accessKey != null && !accessKey.isBlank() && secretKey != null && !secretKey.isBlank())
                ? StaticCredentialsProvider.create(AwsBasicCredentials.create(accessKey, secretKey))
                : DefaultCredentialsProvider.create();
        builder.credentialsProvider(credentials);
        return builder.build();
    }
}
