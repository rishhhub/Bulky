package org.bulkby.payment.controller;

import org.bulkby.payment.dto.PaymentDTO;
import org.bulkby.payment.service.PaymentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/payments")
@CrossOrigin(origins = "*")
public class PaymentController {
    
    @Autowired
    private PaymentService paymentService;
    
    @PostMapping("/deposit")
    public ResponseEntity<PaymentDTO> payDeposit(@RequestParam("interestId") Long interestId) {
        try {
            PaymentDTO payment = paymentService.processDepositPayment(interestId);
            return ResponseEntity.ok(payment);
        } catch (RuntimeException e) {
            throw e; // Let GlobalExceptionHandler handle it
        } catch (Exception e) {
            throw new RuntimeException("Failed to process deposit payment: " + e.getMessage(), e);
        }
    }
    
    @PostMapping("/remaining")
    public ResponseEntity<PaymentDTO> payRemainingBalance(@RequestParam("interestId") Long interestId) {
        try {
            PaymentDTO payment = paymentService.processRemainingBalancePayment(interestId);
            return ResponseEntity.ok(payment);
        } catch (RuntimeException e) {
            throw e; // Let GlobalExceptionHandler handle it
        } catch (Exception e) {
            throw new RuntimeException("Failed to process remaining balance payment: " + e.getMessage(), e);
        }
    }
    
    @PostMapping("/full-payment")
    public ResponseEntity<PaymentDTO> payFullAmountForDirectOrder(@RequestParam("interestId") Long interestId) {
        try {
            PaymentDTO payment = paymentService.processFullPaymentForDirectOrder(interestId);
            return ResponseEntity.ok(payment);
        } catch (RuntimeException e) {
            throw e; // Let GlobalExceptionHandler handle it
        } catch (Exception e) {
            throw new RuntimeException("Failed to process full payment: " + e.getMessage(), e);
        }
    }
    
    @GetMapping("/my")
    public ResponseEntity<List<PaymentDTO>> getMyPayments() {
        try {
            List<PaymentDTO> payments = paymentService.getUserPayments();
            return ResponseEntity.ok(payments);
        } catch (RuntimeException e) {
            throw e; // Let GlobalExceptionHandler handle it
        } catch (Exception e) {
            throw new RuntimeException("Failed to retrieve payments: " + e.getMessage(), e);
        }
    }
    
    @PostMapping("/refund")
    public ResponseEntity<PaymentDTO> processRefund(@RequestParam("interestId") Long interestId) {
        try {
            PaymentDTO refund = paymentService.processRefund(interestId);
            return ResponseEntity.ok(refund);
        } catch (RuntimeException e) {
            throw e; // Let GlobalExceptionHandler handle it
        } catch (Exception e) {
            throw new RuntimeException("Failed to process refund: " + e.getMessage(), e);
        }
    }
    
    @PostMapping("/additional-deposit")
    public ResponseEntity<PaymentDTO> processAdditionalDeposit(@RequestParam("interestId") Long interestId, @RequestParam("amount") java.math.BigDecimal amount) {
        try {
            PaymentDTO payment = paymentService.processAdditionalDepositPayment(interestId, amount);
            return ResponseEntity.ok(payment);
        } catch (RuntimeException e) {
            throw e; // Let GlobalExceptionHandler handle it
        } catch (Exception e) {
            throw new RuntimeException("Failed to process additional deposit payment: " + e.getMessage(), e);
        }
    }
}
