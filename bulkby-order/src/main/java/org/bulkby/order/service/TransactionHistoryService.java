package org.bulkby.order.service;

import org.bulkby.order.dto.TransactionHistoryDTO;
import org.bulkby.order.model.InterestTransaction;

import java.util.List;

/**
 * Service for managing transaction history.
 * Provides audit trail for all Interest changes.
 */
public interface TransactionHistoryService {
    
    /**
     * Get all transactions for an Interest
     */
    List<TransactionHistoryDTO> getTransactionsByInterestId(Long interestId);
    
    /**
     * Get all transactions for an OrderGroup
     */
    List<TransactionHistoryDTO> getTransactionsByOrderGroupId(Long orderGroupId);
    
    /**
     * Record a transaction (used internally by services)
     * 
     * @param amount Can be null if transaction doesn't involve an amount
     */
    void recordTransaction(Long interestId, Long orderGroupId, 
                          InterestTransaction.TransactionType type,
                          String oldValue, String newValue,
                          java.math.BigDecimal amount, String calculation,
                          Long relatedPaymentId, Long userId, Long adminId,
                          String description);
}
