package org.bulkby.auth.validation;

import org.bulkby.auth.model.User;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

public class AtLeastOneContactValidator implements ConstraintValidator<AtLeastOneContact, User> {
    
    @Override
    public void initialize(AtLeastOneContact constraintAnnotation) {
    }
    
    @Override
    public boolean isValid(User user, ConstraintValidatorContext context) {
        if (user == null) {
            return true; // Let @NotNull handle null checks
        }
        
        boolean hasEmail = user.getEmail() != null && !user.getEmail().trim().isEmpty();
        boolean hasPhone = user.getPhone() != null && !user.getPhone().trim().isEmpty();
        
        return hasEmail || hasPhone;
    }
}
