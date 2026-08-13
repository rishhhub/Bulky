package org.bulkby.order.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PincodeDTO {
    private Long id;
    private String code;
    private Long cityId;
    private String cityName;
    private Long stateId;
    private String stateName;
    private String stateCode;
    private Boolean serviceable;
    private Boolean active;
}
