package org.bulkby.order.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

/**
 * Financial summary DTO for an OrderGroup.
 * 
 * Contains complete financial breakdown with calculation formulas.
 * All amounts use BigDecimal with precision 10, scale 2.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class FinancialSummaryDTO {
    
    // OrderGroup info
    private Long orderGroupId;
    private Long productId;
    private String productName;
    private Integer totalQuantity;
    private String cityName; // City for this order group (location-based grouping)
    
    // Revenue breakdown
    private BigDecimal totalRevenue; // Deposits + Remaining + Logistics
    private BigDecimal totalDeposits;
    private BigDecimal totalRemaining;
    private BigDecimal totalLogistics;
    
    // Cost breakdown
    private BigDecimal sellerPayment; // Amount paid to seller
    private BigDecimal totalDeliveryCosts; // Amount paid to delivery partners
    private BigDecimal totalCosts; // Seller Payment + Delivery Costs
    
    // Adjustments
    private BigDecimal totalRefunds; // Total refunds issued
    
    // Profit calculation
    private BigDecimal grossProfit; // Revenue - Costs
    private BigDecimal netProfit; // Revenue - Costs - Refunds
    private BigDecimal profitMargin; // (Net Profit / Revenue) × 100
    
    // Statistics
    private Integer paymentCount; // Number of payments received
    private Integer refundCount; // Number of refunds issued
    
    // Calculation formulas (for display)
    private String revenueFormula; // Shows how revenue was calculated
    private String costFormula; // Shows how costs were calculated
    private String profitFormula; // Shows how profit was calculated
    
    // Detailed breakdowns
    private List<String> revenueBreakdown; // Per-interest revenue breakdown
    private List<String> refundBreakdown; // Per-interest refund breakdown
}
