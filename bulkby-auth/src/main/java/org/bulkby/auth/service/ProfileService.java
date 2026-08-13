package org.bulkby.auth.service;

import org.bulkby.auth.dto.*;
import org.bulkby.auth.model.User;

import java.util.List;

public interface ProfileService {
    
    ProfileDTO getProfile();
    
    ProfileDTO updateProfile(ProfileDTO profileDTO);
    
    List<UserContactDTO> getContacts();
    
    UserContactDTO addContact(UserContactDTO contactDTO);
    
    UserContactDTO updateContact(Long contactId, UserContactDTO contactDTO);
    
    void deleteContact(Long contactId);
    
    String sendContactOtp(String contactValue, org.bulkby.auth.model.ContactType contactType);
    
    boolean verifyContactOtp(String contactValue, String otp);
    
    List<UserAddressDTO> getAddresses();
    
    UserAddressDTO addAddress(UserAddressDTO addressDTO);
    
    UserAddressDTO updateAddress(Long addressId, UserAddressDTO addressDTO);
    
    void deleteAddress(Long addressId);
    
    List<PaymentMethodDTO> getPaymentMethods();
    
    PaymentMethodDTO addPaymentMethod(PaymentMethodDTO paymentMethodDTO);
    
    PaymentMethodDTO updatePaymentMethod(Long paymentMethodId, PaymentMethodDTO paymentMethodDTO);
    
    void deletePaymentMethod(Long paymentMethodId);
    
    void updateLoginMethods(UpdateLoginMethodsRequest request);
    
    void setPassword(org.bulkby.auth.dto.SetPasswordRequest request);
    
    User getCurrentUser();
}
