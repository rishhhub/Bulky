package org.bulkby.common.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PincodeInfo {
    private String pincode;
    private String cityName;
    private Long cityId;
    private String stateName;
    private String stateCode;
    private Long stateId;
    private Boolean serviceable;
}
