package org.bulkby.catalog.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.bulkby.catalog.model.CategoryRequest;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CategoryRequestDTO {
    private Long id;
    private Long sellerId;
    private String sellerName;
    private String categoryName;
    private String description;
    private CategoryRequest.RequestStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime reviewedAt;
    private Long reviewedBy;
    private String reviewedByName;
    private String rejectionReason;
}
