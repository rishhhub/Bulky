package org.bulkby.order.repository;

import org.bulkby.order.model.InterestTransaction;
import org.bulkby.order.model.InterestTransaction.TransactionType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface InterestTransactionRepository extends JpaRepository<InterestTransaction, Long> {
    
    /**
     * Find all transactions for an Interest (chronological order)
     */
    List<InterestTransaction> findByInterestIdOrderByCreatedAtAsc(Long interestId);
    
    /**
     * Find all transactions for an OrderGroup
     */
    List<InterestTransaction> findByOrderGroupIdOrderByCreatedAtAsc(Long orderGroupId);
    
    /**
     * Find transactions by type for an Interest
     */
    List<InterestTransaction> findByInterestIdAndTransactionTypeOrderByCreatedAtAsc(
        Long interestId, TransactionType transactionType);
    
    /**
     * Find all payment transactions for an Interest
     */
    @Query("SELECT t FROM InterestTransaction t WHERE t.interestId = :interestId " +
           "AND t.transactionType = 'PAYMENT_RECEIVED' ORDER BY t.createdAt ASC")
    List<InterestTransaction> findPaymentTransactionsByInterestId(@Param("interestId") Long interestId);
    
    /**
     * Find all refund transactions for an Interest
     */
    @Query("SELECT t FROM InterestTransaction t WHERE t.interestId = :interestId " +
           "AND t.transactionType = 'REFUND_ISSUED' ORDER BY t.createdAt ASC")
    List<InterestTransaction> findRefundTransactionsByInterestId(@Param("interestId") Long interestId);
    
    /**
     * Find all quantity change transactions for an Interest
     */
    @Query("SELECT t FROM InterestTransaction t WHERE t.interestId = :interestId " +
           "AND t.transactionType = 'QUANTITY_CHANGED' ORDER BY t.createdAt ASC")
    List<InterestTransaction> findQuantityChangeTransactionsByInterestId(@Param("interestId") Long interestId);
    
    /**
     * Find transactions within date range
     */
    List<InterestTransaction> findByCreatedAtBetweenOrderByCreatedAtAsc(
        LocalDateTime startDate, LocalDateTime endDate);
    
    /**
     * Find transactions for OrderGroup within date range
     */
    List<InterestTransaction> findByOrderGroupIdAndCreatedAtBetweenOrderByCreatedAtAsc(
        Long orderGroupId, LocalDateTime startDate, LocalDateTime endDate);
}
