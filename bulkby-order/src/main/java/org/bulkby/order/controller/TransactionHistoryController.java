package org.bulkby.order.controller;

import org.bulkby.order.dto.TransactionHistoryDTO;
import org.bulkby.order.service.TransactionHistoryService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controller for transaction history endpoints.
 * 
 * Provides audit trail of all Interest changes.
 */
@RestController
@RequestMapping("/admin/transactions")
@CrossOrigin(origins = "*")
public class TransactionHistoryController {
    
    private static final Logger logger = LoggerFactory.getLogger(TransactionHistoryController.class);
    
    @Autowired
    private TransactionHistoryService transactionHistoryService;
    
    /**
     * Get all transactions for an Interest
     */
    @GetMapping("/interest/{interestId}")
    public ResponseEntity<List<TransactionHistoryDTO>> getTransactionsByInterestId(@PathVariable Long interestId) {
        try {
            List<TransactionHistoryDTO> transactions = transactionHistoryService.getTransactionsByInterestId(interestId);
            return ResponseEntity.ok(transactions);
        } catch (Exception e) {
            logger.error("Error fetching transactions for Interest {}: {}", interestId, e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    /**
     * Get all transactions for an OrderGroup
     */
    @GetMapping("/order-group/{orderGroupId}")
    public ResponseEntity<List<TransactionHistoryDTO>> getTransactionsByOrderGroupId(@PathVariable Long orderGroupId) {
        try {
            List<TransactionHistoryDTO> transactions = transactionHistoryService.getTransactionsByOrderGroupId(orderGroupId);
            return ResponseEntity.ok(transactions);
        } catch (Exception e) {
            logger.error("Error fetching transactions for OrderGroup {}: {}", orderGroupId, e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }
}
