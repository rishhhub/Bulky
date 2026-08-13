package org.bulkby.app.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.io.IOException;
import java.util.UUID;

/**
 * S3-compatible file storage (AWS S3 or MinIO). Enable with file.storage-type=s3.
 */
@Service
@ConditionalOnProperty(name = "file.storage-type", havingValue = "s3")
public class S3FileStorage implements FileStorage {

    private static final Logger logger = LoggerFactory.getLogger(S3FileStorage.class);
    private static final String UPLOADS_PREFIX = "uploads/";

    private final S3Client s3Client;
    private final String bucket;
    private final String publicBaseUrl;

    public S3FileStorage(
            S3Client s3Client,
            @Value("${file.s3.bucket:bulkby-uploads}") String bucket,
            @Value("${file.s3.public-base-url:}") String publicBaseUrl) {
        this.s3Client = s3Client;
        this.bucket = bucket;
        this.publicBaseUrl = publicBaseUrl != null ? publicBaseUrl.trim() : "";
    }

    @Override
    public String storeFile(MultipartFile file) {
        if (file.isEmpty()) {
            throw new RuntimeException("File is empty");
        }
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new RuntimeException("Only image files are allowed");
        }
        String originalFilename = file.getOriginalFilename();
        String extension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }
        String key = UPLOADS_PREFIX + UUID.randomUUID().toString() + extension;
        try {
            PutObjectRequest put = PutObjectRequest.builder()
                    .bucket(bucket)
                    .key(key)
                    .contentType(contentType)
                    .build();
            s3Client.putObject(put, RequestBody.fromInputStream(file.getInputStream(), file.getSize()));
            if (!publicBaseUrl.isEmpty()) {
                return publicBaseUrl.endsWith("/") ? publicBaseUrl + key : publicBaseUrl + "/" + key;
            }
            return "/api/uploads/" + key;
        } catch (IOException e) {
            logger.error("Failed to store file in S3: {}", e.getMessage());
            throw new RuntimeException("Could not store file. Please try again!", e);
        }
    }

    @Override
    public void deleteFile(String fileUrl) {
        if (fileUrl == null) {
            return;
        }
        String key = extractKey(fileUrl);
        if (key == null) {
            return;
        }
        try {
            s3Client.deleteObject(DeleteObjectRequest.builder().bucket(bucket).key(key).build());
        } catch (Exception e) {
            logger.error("Failed to delete file from S3: {} - {}", key, e.getMessage());
            throw new RuntimeException("Could not delete file " + fileUrl, e);
        }
    }

    private String extractKey(String fileUrl) {
        if (fileUrl.startsWith("/api/uploads/")) {
            return fileUrl.substring("/api/uploads/".length());
        }
        if (!publicBaseUrl.isEmpty() && fileUrl.startsWith(publicBaseUrl)) {
            return fileUrl.substring(publicBaseUrl.length()).replaceAll("^/", "");
        }
        if (fileUrl.contains(UPLOADS_PREFIX)) {
            int i = fileUrl.indexOf(UPLOADS_PREFIX);
            return fileUrl.substring(i);
        }
        return null;
    }
}
