package org.bulkby.order.service;

import org.bulkby.order.dto.AccountBalanceDTO;
import org.bulkby.order.dto.FinancialSummaryDTO;

/**
 * Service for financial calculations with robust BigDecimal math.
 * 
 * Provides:
 * - Per OrderGroup financial summaries
 * - Overall account balance
 * - Profit/loss calculations
 * - All calculations use BigDecimal with proper rounding
 */
public interface FinancialCalculationService {
    
    /**
     * Calculate financial summary for an OrderGroup.
     * 
     * Includes:
     * - Revenue breakdown (deposits, remaining, logistics)
     * - Cost breakdown (seller payment, delivery costs)
     * - Refunds issued
     * - Profit calculation with formulas
     * 
     * @param orderGroupId OrderGroup ID
     * @return FinancialSummaryDTO with all calculations
     */
    FinancialSummaryDTO calculateOrderGroupFinancials(Long orderGroupId);
    
    /**
     * Calculate overall account balance.
     * 
     * Includes:
     * - Total revenue (all time)
     * - Total costs (seller payments + delivery costs)
     * - Total refunds
     * - Current balance (profit/loss)
     * - Per-order-group breakdown
     * 
     * @return AccountBalanceDTO with account status
     */
    AccountBalanceDTO calculateAccountBalance();
    
    /**
     * Calculate financial summary for all OrderGroups.
     * 
     * @return List of FinancialSummaryDTO for all OrderGroups
     */
    java.util.List<FinancialSummaryDTO> calculateAllOrderGroupFinancials();
}
