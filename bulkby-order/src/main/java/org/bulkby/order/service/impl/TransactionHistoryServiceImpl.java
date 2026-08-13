package org.bulkby.order.service.impl;

import org.bulkby.order.dto.TransactionHistoryDTO;
import org.bulkby.order.model.InterestTransaction;
import org.bulkby.order.repository.InterestTransactionRepository;
import org.bulkby.order.service.TransactionHistoryService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Implementation of TransactionHistoryService.
 * Records all transactions for audit trail and provides transaction history.
 */
@Service
public class TransactionHistoryServiceImpl implements TransactionHistoryService {
    
    private static final Logger logger = LoggerFactory.getLogger(TransactionHistoryServiceImpl.class);
    
    @Autowired
    private InterestTransactionRepository transactionRepository;
    
    @Override
    public List<TransactionHistoryDTO> getTransactionsByInterestId(Long interestId) {
        List<InterestTransaction> transactions = transactionRepository.findByInterestIdOrderByCreatedAtAsc(interestId);
        return transactions.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    @Override
    public List<TransactionHistoryDTO> getTransactionsByOrderGroupId(Long orderGroupId) {
        List<InterestTransaction> transactions = transactionRepository.findByOrderGroupIdOrderByCreatedAtAsc(orderGroupId);
        return transactions.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional
    public void recordTransaction(Long interestId, Long orderGroupId,
                                 InterestTransaction.TransactionType type,
                                 String oldValue, String newValue,
                                 java.math.BigDecimal amount, String calculation,
                                 Long relatedPaymentId, Long userId, Long adminId,
                                 String description) {
        InterestTransaction transaction = new InterestTransaction();
        transaction.setInterestId(interestId);
        transaction.setOrderGroupId(orderGroupId);
        transaction.setTransactionType(type);
        transaction.setOldValue(oldValue);
        transaction.setNewValue(newValue);
        transaction.setAmount(amount);
        transaction.setCalculation(calculation);
        transaction.setRelatedPaymentId(relatedPaymentId);
        transaction.setUserId(userId);
        transaction.setAdminId(adminId);
        transaction.setDescription(description);
        
        transactionRepository.save(transaction);
        logger.debug("Transaction recorded: interestId={}, type={}, amount={}", 
            interestId, type, amount);
    }
    
    private TransactionHistoryDTO convertToDTO(InterestTransaction transaction) {
        TransactionHistoryDTO dto = new TransactionHistoryDTO();
        dto.setId(transaction.getId());
        dto.setInterestId(transaction.getInterestId());
        dto.setOrderGroupId(transaction.getOrderGroupId());
        dto.setTransactionType(transaction.getTransactionType().name());
        dto.setOldValue(transaction.getOldValue());
        dto.setNewValue(transaction.getNewValue());
        dto.setAmount(transaction.getAmount());
        dto.setCalculation(transaction.getCalculation());
        dto.setRelatedPaymentId(transaction.getRelatedPaymentId());
        dto.setUserId(transaction.getUserId());
        dto.setAdminId(transaction.getAdminId());
        dto.setDescription(transaction.getDescription());
        dto.setCreatedAt(transaction.getCreatedAt());
        return dto;
    }
}
