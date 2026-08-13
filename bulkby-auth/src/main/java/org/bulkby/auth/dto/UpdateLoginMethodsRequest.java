package org.bulkby.auth.dto;

import lombok.Data;
import org.bulkby.auth.model.LoginMethod;

import java.util.Set;

@Data
public class UpdateLoginMethodsRequest {
    private Set<LoginMethod> loginMethods;
}
