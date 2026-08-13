package org.bulkby.logistics.service;

import org.bulkby.logistics.dto.LogisticsCostRequest;
import org.bulkby.logistics.dto.LogisticsCostResponse;

public interface LogisticsService {
    LogisticsCostResponse calculateDeliveryCost(LogisticsCostRequest request);
}
