package org.bulkby.order.service;

import org.bulkby.order.dto.InterestDTO;
import org.bulkby.order.dto.InterestRequest;

import java.util.List;

public interface InterestService {
    InterestDTO createInterest(InterestRequest request);
    List<InterestDTO> getUserInterests();
    InterestDTO getInterestById(Long id);
    InterestDTO extendInterest(Long id, Integer periodDays);
    InterestDTO withdrawInterest(Long id);
    InterestDTO getInterestByIdForPayment(Long id);
    org.bulkby.order.dto.UpdateInterestResponse updateInterest(Long id, org.bulkby.order.dto.UpdateInterestRequest request);
}
