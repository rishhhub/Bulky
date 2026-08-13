package org.bulkby.order.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

/**
 * Account balance DTO showing overall financial status.
 * 
 * Contains:
 * - Current balance (profit/loss)
 * - Total revenue, costs, refunds
 * - Per-order-group breakdown
 * - Overall calculation formula
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AccountBalanceDTO {
    
    // Overall balance
    private BigDecimal currentBalance; // Profit/Loss (Revenue - Costs - Refunds)
    private BigDecimal totalRevenue; // All revenue collected
    private BigDecimal totalSellerPayments; // All payments to sellers
    private BigDecimal totalDeliveryCosts; // All payments to delivery partners
    private BigDecimal totalCosts; // Seller Payments + Delivery Costs
    private BigDecimal totalRefunds; // All refunds issued
    private BigDecimal overallProfitMargin; // (Current Balance / Total Revenue) × 100
    
    // Statistics
    private Integer totalOrderGroups; // Total number of order groups
    private Integer totalInterests; // Total number of interests
    private Integer totalPayments; // Total number of payments
    
    // Per-order-group breakdown
    private List<FinancialSummaryDTO> orderGroupFinancials;
    
    // Calculation formula
    private String calculationFormula; // Shows how balance was calculated
}
