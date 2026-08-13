package org.bulkby.order.service.impl;

import org.bulkby.catalog.dto.ProductDTO;
import org.bulkby.order.dto.AccountBalanceDTO;
import org.bulkby.order.dto.FinancialSummaryDTO;
import org.bulkby.order.model.Interest;
import org.bulkby.order.model.OrderGroup;
import org.bulkby.order.model.SellerOrder;
import org.bulkby.order.repository.InterestRepository;
import org.bulkby.order.repository.OrderGroupRepository;
import org.bulkby.order.repository.SellerOrderRepository;
import org.bulkby.order.service.FinancialCalculationService;
import org.bulkby.order.service.PaymentQueryService;
import org.bulkby.order.service.ResilientProductService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Implementation of FinancialCalculationService.
 * 
 * All calculations use BigDecimal with precision 10, scale 2, rounding HALF_UP.
 * Provides complete financial breakdown with calculation formulas.
 */
@Service
public class FinancialCalculationServiceImpl implements FinancialCalculationService {
    
    private static final Logger logger = LoggerFactory.getLogger(FinancialCalculationServiceImpl.class);
    
    @Autowired
    private OrderGroupRepository orderGroupRepository;
    
    @Autowired
    private InterestRepository interestRepository;
    
    @Autowired
    private SellerOrderRepository sellerOrderRepository;
    
    @Autowired
    private PaymentQueryService paymentQueryService;
    
    @Autowired
    private ResilientProductService resilientProductService;
    
    private static final BigDecimal HUNDRED = new BigDecimal("100");
    private static final int SCALE = 2;
    private static final RoundingMode ROUNDING_MODE = RoundingMode.HALF_UP;
    
    @Override
    @Transactional(readOnly = true)
    public FinancialSummaryDTO calculateOrderGroupFinancials(Long orderGroupId) {
        OrderGroup orderGroup = orderGroupRepository.findByIdWithInterests(orderGroupId)
                .orElseThrow(() -> new RuntimeException("OrderGroup not found: " + orderGroupId));
        
        FinancialSummaryDTO summary = new FinancialSummaryDTO();
        summary.setOrderGroupId(orderGroupId);
        
        // Get product info
        ProductDTO product = resilientProductService.getProductById(orderGroup.getProductId());
        summary.setProductId(product.getId());
        summary.setProductName(product.getName());
        summary.setTotalQuantity(orderGroup.getTotalQuantity());
        summary.setCityName(orderGroup.getCityName());
        
        // Get all interests in this order group
        List<Interest> interests = new ArrayList<>(orderGroup.getInterests());
        if (interests.isEmpty()) {
            interests = interestRepository.findByOrderGroupId(orderGroupId);
        }
        
        // Calculate revenue from all payments
        BigDecimal totalDeposits = BigDecimal.ZERO;
        BigDecimal totalRemaining = BigDecimal.ZERO;
        BigDecimal totalLogistics = BigDecimal.ZERO;
        BigDecimal totalRefunds = BigDecimal.ZERO;
        int paymentCount = 0;
        int refundCount = 0;
        
        List<String> revenueCalculations = new ArrayList<>();
        List<String> refundCalculations = new ArrayList<>();
        
        for (Interest interest : interests) {
            List<PaymentQueryService.PaymentInfo> payments = paymentQueryService.getPaymentsByInterestId(interest.getId());
            
            for (PaymentQueryService.PaymentInfo payment : payments) {
                if (!"COMPLETED".equals(payment.getStatus())) {
                    continue; // Only count completed payments
                }
                
                BigDecimal amount = payment.getAmount().setScale(SCALE, ROUNDING_MODE);
                
                switch (payment.getPaymentType()) {
                    case "DEPOSIT":
                        totalDeposits = totalDeposits.add(amount);
                        paymentCount++;
                        revenueCalculations.add(String.format("Interest #%d Deposit: %s", interest.getId(), amount));
                        break;
                    case "REMAINING":
                        totalRemaining = totalRemaining.add(amount);
                        paymentCount++;
                        revenueCalculations.add(String.format("Interest #%d Remaining: %s", interest.getId(), amount));
                        break;
                    case "LOGISTICS":
                        totalLogistics = totalLogistics.add(amount);
                        paymentCount++;
                        revenueCalculations.add(String.format("Interest #%d Logistics: %s", interest.getId(), amount));
                        break;
                    case "REFUND":
                        totalRefunds = totalRefunds.add(amount);
                        refundCount++;
                        refundCalculations.add(String.format("Interest #%d Refund: %s", interest.getId(), amount));
                        break;
                }
            }
        }
        
        // Round all totals
        totalDeposits = totalDeposits.setScale(SCALE, ROUNDING_MODE);
        totalRemaining = totalRemaining.setScale(SCALE, ROUNDING_MODE);
        totalLogistics = totalLogistics.setScale(SCALE, ROUNDING_MODE);
        totalRefunds = totalRefunds.setScale(SCALE, ROUNDING_MODE);
        
        // Calculate total revenue
        BigDecimal totalRevenue = totalDeposits.add(totalRemaining).add(totalLogistics);
        totalRevenue = totalRevenue.setScale(SCALE, ROUNDING_MODE);
        
        // Calculate costs
        BigDecimal sellerPayment = BigDecimal.ZERO;
        BigDecimal totalDeliveryCosts = BigDecimal.ZERO;
        
        // Get seller order payment
        Optional<SellerOrder> sellerOrderOpt = sellerOrderRepository.findByOrderGroupId(orderGroupId);
        if (sellerOrderOpt.isPresent()) {
            SellerOrder sellerOrder = sellerOrderOpt.get();
            sellerPayment = (sellerOrder.getOrderAmount() != null ? sellerOrder.getOrderAmount() : BigDecimal.ZERO)
                    .setScale(SCALE, ROUNDING_MODE);
        }
        
        // Calculate total delivery costs (from all interests)
        for (Interest interest : interests) {
            if (interest.getDeliveryCost() != null && interest.getDeliveryCost().compareTo(BigDecimal.ZERO) > 0) {
                totalDeliveryCosts = totalDeliveryCosts.add(interest.getDeliveryCost());
            }
        }
        totalDeliveryCosts = totalDeliveryCosts.setScale(SCALE, ROUNDING_MODE);
        
        // Calculate profit
        BigDecimal totalCosts = sellerPayment.add(totalDeliveryCosts);
        totalCosts = totalCosts.setScale(SCALE, ROUNDING_MODE);
        
        BigDecimal grossProfit = totalRevenue.subtract(totalCosts);
        grossProfit = grossProfit.setScale(SCALE, ROUNDING_MODE);
        
        BigDecimal netProfit = grossProfit.subtract(totalRefunds);
        netProfit = netProfit.setScale(SCALE, ROUNDING_MODE);
        
        // Calculate profit margin
        BigDecimal profitMargin = BigDecimal.ZERO;
        if (totalRevenue.compareTo(BigDecimal.ZERO) > 0) {
            profitMargin = netProfit.divide(totalRevenue, 4, ROUNDING_MODE)
                    .multiply(HUNDRED)
                    .setScale(2, ROUNDING_MODE);
        }
        
        // Build calculation formulas
        StringBuilder revenueFormula = new StringBuilder();
        revenueFormula.append("Total Revenue = Deposits + Remaining + Logistics\n");
        revenueFormula.append(String.format("  = %s + %s + %s\n", totalDeposits, totalRemaining, totalLogistics));
        revenueFormula.append(String.format("  = %s", totalRevenue));
        
        StringBuilder costFormula = new StringBuilder();
        costFormula.append("Total Costs = Seller Payment + Delivery Costs\n");
        costFormula.append(String.format("  = %s + %s\n", sellerPayment, totalDeliveryCosts));
        costFormula.append(String.format("  = %s", totalCosts));
        
        StringBuilder profitFormula = new StringBuilder();
        profitFormula.append("Net Profit = Revenue - Costs - Refunds\n");
        profitFormula.append(String.format("  = %s - %s - %s\n", totalRevenue, totalCosts, totalRefunds));
        profitFormula.append(String.format("  = %s", netProfit));
        
        // Set summary fields
        summary.setTotalRevenue(totalRevenue);
        summary.setTotalDeposits(totalDeposits);
        summary.setTotalRemaining(totalRemaining);
        summary.setTotalLogistics(totalLogistics);
        summary.setSellerPayment(sellerPayment);
        summary.setTotalDeliveryCosts(totalDeliveryCosts);
        summary.setTotalCosts(totalCosts);
        summary.setTotalRefunds(totalRefunds);
        summary.setGrossProfit(grossProfit);
        summary.setNetProfit(netProfit);
        summary.setProfitMargin(profitMargin);
        summary.setPaymentCount(paymentCount);
        summary.setRefundCount(refundCount);
        summary.setRevenueFormula(revenueFormula.toString());
        summary.setCostFormula(costFormula.toString());
        summary.setProfitFormula(profitFormula.toString());
        summary.setRevenueBreakdown(revenueCalculations);
        summary.setRefundBreakdown(refundCalculations);
        
        logger.debug("Financial summary calculated for OrderGroup {}: Revenue={}, Costs={}, Profit={}", 
            orderGroupId, totalRevenue, totalCosts, netProfit);
        
        return summary;
    }
    
    @Override
    @Transactional(readOnly = true)
    public AccountBalanceDTO calculateAccountBalance() {
        AccountBalanceDTO accountBalance = new AccountBalanceDTO();
        
        // Get all order groups
        List<OrderGroup> allOrderGroups = orderGroupRepository.findAll();
        
        BigDecimal totalRevenue = BigDecimal.ZERO;
        BigDecimal totalSellerPayments = BigDecimal.ZERO;
        BigDecimal totalDeliveryCosts = BigDecimal.ZERO;
        BigDecimal totalRefunds = BigDecimal.ZERO;
        int totalOrderGroups = 0;
        int totalInterests = 0;
        int totalPayments = 0;
        
        List<FinancialSummaryDTO> orderGroupFinancials = new ArrayList<>();
        
        for (OrderGroup orderGroup : allOrderGroups) {
            FinancialSummaryDTO financials = calculateOrderGroupFinancials(orderGroup.getId());
            orderGroupFinancials.add(financials);
            
            totalRevenue = totalRevenue.add(financials.getTotalRevenue());
            totalSellerPayments = totalSellerPayments.add(financials.getSellerPayment());
            totalDeliveryCosts = totalDeliveryCosts.add(financials.getTotalDeliveryCosts());
            totalRefunds = totalRefunds.add(financials.getTotalRefunds());
            totalOrderGroups++;
            totalInterests += orderGroup.getInterests().size();
            totalPayments += financials.getPaymentCount();
        }
        
        // Round totals
        totalRevenue = totalRevenue.setScale(SCALE, ROUNDING_MODE);
        totalSellerPayments = totalSellerPayments.setScale(SCALE, ROUNDING_MODE);
        totalDeliveryCosts = totalDeliveryCosts.setScale(SCALE, ROUNDING_MODE);
        totalRefunds = totalRefunds.setScale(SCALE, ROUNDING_MODE);
        
        // Calculate overall profit/loss
        BigDecimal totalCosts = totalSellerPayments.add(totalDeliveryCosts);
        totalCosts = totalCosts.setScale(SCALE, ROUNDING_MODE);
        
        BigDecimal currentBalance = totalRevenue.subtract(totalCosts).subtract(totalRefunds);
        currentBalance = currentBalance.setScale(SCALE, ROUNDING_MODE);
        
        // Calculate overall profit margin
        BigDecimal overallProfitMargin = BigDecimal.ZERO;
        if (totalRevenue.compareTo(BigDecimal.ZERO) > 0) {
            overallProfitMargin = currentBalance.divide(totalRevenue, 4, ROUNDING_MODE)
                    .multiply(HUNDRED)
                    .setScale(2, ROUNDING_MODE);
        }
        
        // Build overall calculation formula
        StringBuilder overallFormula = new StringBuilder();
        overallFormula.append("Current Balance = Total Revenue - Total Costs - Total Refunds\n");
        overallFormula.append(String.format("  = %s - %s - %s\n", totalRevenue, totalCosts, totalRefunds));
        overallFormula.append(String.format("  = %s", currentBalance));
        
        accountBalance.setCurrentBalance(currentBalance);
        accountBalance.setTotalRevenue(totalRevenue);
        accountBalance.setTotalSellerPayments(totalSellerPayments);
        accountBalance.setTotalDeliveryCosts(totalDeliveryCosts);
        accountBalance.setTotalCosts(totalCosts);
        accountBalance.setTotalRefunds(totalRefunds);
        accountBalance.setOverallProfitMargin(overallProfitMargin);
        accountBalance.setTotalOrderGroups(totalOrderGroups);
        accountBalance.setTotalInterests(totalInterests);
        accountBalance.setTotalPayments(totalPayments);
        accountBalance.setOrderGroupFinancials(orderGroupFinancials);
        accountBalance.setCalculationFormula(overallFormula.toString());
        
        logger.info("Account balance calculated: Balance={}, Revenue={}, Costs={}, Refunds={}", 
            currentBalance, totalRevenue, totalCosts, totalRefunds);
        
        return accountBalance;
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<FinancialSummaryDTO> calculateAllOrderGroupFinancials() {
        List<OrderGroup> allOrderGroups = orderGroupRepository.findAll();
        return allOrderGroups.stream()
                .map(og -> calculateOrderGroupFinancials(og.getId()))
                .collect(Collectors.toList());
    }
}
