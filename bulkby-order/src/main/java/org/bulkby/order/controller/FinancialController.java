package org.bulkby.order.controller;

import org.bulkby.order.dto.AccountBalanceDTO;
import org.bulkby.order.dto.FinancialSummaryDTO;
import org.bulkby.order.service.FinancialCalculationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controller for financial data endpoints.
 * 
 * Provides:
 * - Per OrderGroup financial summaries
 * - Overall account balance
 * - All financial calculations with formulas
 */
@RestController
@RequestMapping("/admin/financial")
@CrossOrigin(origins = "*")
public class FinancialController {
    
    private static final Logger logger = LoggerFactory.getLogger(FinancialController.class);
    
    @Autowired
    private FinancialCalculationService financialCalculationService;
    
    /**
     * Get financial summary for a specific OrderGroup.
     * Returns 404 when the OrderGroup does not exist (handled by GlobalExceptionHandler).
     */
    @GetMapping("/order-group/{orderGroupId}")
    public ResponseEntity<FinancialSummaryDTO> getOrderGroupFinancials(@PathVariable Long orderGroupId) {
        FinancialSummaryDTO summary = financialCalculationService.calculateOrderGroupFinancials(orderGroupId);
        return ResponseEntity.ok(summary);
    }
    
    /**
     * Get overall account balance
     */
    @GetMapping("/account-balance")
    public ResponseEntity<AccountBalanceDTO> getAccountBalance() {
        try {
            AccountBalanceDTO balance = financialCalculationService.calculateAccountBalance();
            return ResponseEntity.ok(balance);
        } catch (Exception e) {
            logger.error("Error calculating account balance: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    /**
     * Get financial summaries for all OrderGroups
     */
    @GetMapping("/order-groups")
    public ResponseEntity<List<FinancialSummaryDTO>> getAllOrderGroupFinancials() {
        try {
            List<FinancialSummaryDTO> summaries = financialCalculationService.calculateAllOrderGroupFinancials();
            return ResponseEntity.ok(summaries);
        } catch (Exception e) {
            logger.error("Error calculating all order group financials: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }
}
