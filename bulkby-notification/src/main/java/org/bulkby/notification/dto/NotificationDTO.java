package org.bulkby.notification.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class NotificationDTO {
    private Long id;
    private String message;
    private String type;
    private Boolean read;
    private Long relatedInterestId;
    private Long relatedOrderGroupId;
    private LocalDateTime createdAt;
}
