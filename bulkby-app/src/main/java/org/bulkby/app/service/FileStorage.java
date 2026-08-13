package org.bulkby.app.service;

import org.springframework.web.multipart.MultipartFile;

/**
 * Abstraction for storing and deleting uploaded files (local filesystem or S3-compatible storage).
 */
public interface FileStorage {

    /**
     * Store a file and return the URL path used to access it (e.g. /api/uploads/uuid.ext or S3 key).
     */
    String storeFile(MultipartFile file);

    /**
     * Delete a file by its stored URL/path.
     */
    void deleteFile(String fileUrl);
}
