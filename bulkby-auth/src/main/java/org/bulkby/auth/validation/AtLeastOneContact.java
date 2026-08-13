package org.bulkby.auth.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;
import java.lang.annotation.*;

@Target({ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = AtLeastOneContactValidator.class)
@Documented
public @interface AtLeastOneContact {
    String message() default "Either email or phone must be provided";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}
