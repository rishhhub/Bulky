import React from 'react';
import { formatDateTime } from '../../utils/formatters.js';
import { TRACKING_STATUS } from '../../utils/constants.js';

/**
 * Enhanced tracking display component with detailed tracking information
 * @param {Object} props
 * @param {Array} props.trackingData - Array of tracking records (with enhanced fields)
 * @param {boolean} props.isExpanded - Whether tracking is expanded
 * @param {Function} props.onToggle - Toggle expand handler
 * @param {boolean} props.loading - Loading state
 */
export const TrackingDisplay = ({
  trackingData = [],
  isExpanded,
  onToggle,
  loading = false
}) => {
  const getStatusColor = (status) => {
    switch (status) {
      case TRACKING_STATUS.DELIVERED:
      case TRACKING_STATUS.PICKED_UP:
        return 'green';
      case TRACKING_STATUS.OUT_FOR_DELIVERY:
      case TRACKING_STATUS.READY_FOR_PICKUP:
        return 'blue';
      case TRACKING_STATUS.ARRIVED_AT_WAREHOUSE:
      case TRACKING_STATUS.AT_DISTRIBUTION_CENTER:
        return 'orange';
      case TRACKING_STATUS.ORDER_CONFIRMED:
      case TRACKING_STATUS.PAYMENT_RECEIVED_BY_SELLER:
        return '#17a2b8';
      case TRACKING_STATUS.PROCESSING:
      case TRACKING_STATUS.PACKED:
        return '#007bff';
      case TRACKING_STATUS.IN_TRANSIT:
        return '#6f42c1';
      case TRACKING_STATUS.DELIVERY_ATTEMPTED:
      case TRACKING_STATUS.DELIVERY_RESCHEDULED:
        return '#fd7e14';
      default:
        return '#007bff';
    }
  };

  return (
    <div style={{ marginTop: '15px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h4 style={{ margin: 0 }}>Order Tracking</h4>
        <button
          onClick={onToggle}
          className="btn btn-sm btn-info"
        >
          {isExpanded ? 'Hide' : 'Show'} Tracking
        </button>
      </div>
      {isExpanded && (
        <div style={{ marginTop: '15px' }}>
          {loading ? (
            <p>Loading tracking information...</p>
          ) : trackingData.length === 0 ? (
            <p>No tracking information available yet.</p>
          ) : (
            <div>
              {trackingData.map((track) => (
                <div
                  key={track.id}
                  style={{
                    padding: '10px',
                    margin: '5px 0',
                    backgroundColor: 'white',
                    borderRadius: '4px',
                    borderLeft: `4px solid ${getStatusColor(track.status)}`
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: 'bold', margin: 0, fontSize: '15px' }}>
                        {track.status.replace(/_/g, ' ')}
                      </p>
                      
                      {/* Location information */}
                      {track.currentLocation && (
                        <p style={{ margin: '5px 0', fontSize: '14px', color: '#666', fontWeight: '500' }}>
                          📍 {track.currentLocation}
                        </p>
                      )}
                      {track.location && !track.currentLocation && (
                        <p style={{ margin: '5px 0', fontSize: '14px', color: '#666' }}>
                          📍 {track.location}
                        </p>
                      )}
                      
                      {/* Carrier information */}
                      {(track.carrierName || track.carrierTrackingNumber) && (
                        <div style={{ margin: '8px 0', padding: '8px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                          {track.carrierName && (
                            <p style={{ margin: '2px 0', fontSize: '13px', color: '#495057' }}>
                              <strong>Carrier:</strong> {track.carrierName}
                            </p>
                          )}
                          {track.carrierTrackingNumber && (
                            <p style={{ margin: '2px 0', fontSize: '13px', color: '#495057' }}>
                              <strong>Tracking #:</strong> {track.carrierTrackingNumber}
                            </p>
                          )}
                          {track.trackingUrl && (
                            <p style={{ margin: '2px 0', fontSize: '13px' }}>
                              <a href={track.trackingUrl} target="_blank" rel="noopener noreferrer" 
                                 style={{ color: '#007bff', textDecoration: 'none' }}>
                                Track Package →
                              </a>
                            </p>
                          )}
                        </div>
                      )}
                      
                      {/* Estimated dates */}
                      {track.estimatedDeliveryDate && (
                        <p style={{ margin: '5px 0', fontSize: '12px', color: '#6c757d' }}>
                          📅 <strong>Est. Delivery:</strong> {formatDateTime(track.estimatedDeliveryDate)}
                        </p>
                      )}
                      {track.estimatedPickupDate && (
                        <p style={{ margin: '5px 0', fontSize: '12px', color: '#6c757d' }}>
                          📅 <strong>Est. Pickup:</strong> {formatDateTime(track.estimatedPickupDate)}
                        </p>
                      )}
                      
                      {/* Package details */}
                      {(track.weight || track.dimensions) && (
                        <div style={{ margin: '8px 0', fontSize: '12px', color: '#6c757d' }}>
                          {track.weight && <span><strong>Weight:</strong> {track.weight} kg </span>}
                          {track.dimensions && <span><strong>Dimensions:</strong> {track.dimensions}</span>}
                        </div>
                      )}
                      
                      {/* Delivery details */}
                      {track.signatureRequired && (
                        <p style={{ margin: '5px 0', fontSize: '12px', color: '#dc3545' }}>
                          ✍️ Signature Required
                        </p>
                      )}
                      {track.deliveryAttempts > 0 && (
                        <p style={{ margin: '5px 0', fontSize: '12px', color: '#fd7e14' }}>
                          ⚠️ Delivery Attempts: {track.deliveryAttempts}
                        </p>
                      )}
                      {track.deliveryInstructions && (
                        <p style={{ margin: '5px 0', fontSize: '12px', color: '#6c757d', fontStyle: 'italic' }}>
                          📝 {track.deliveryInstructions}
                        </p>
                      )}
                      
                      {/* Notes */}
                      {track.notes && (
                        <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#666' }}>
                          {track.notes}
                        </p>
                      )}
                      
                      {/* Legacy delivery tracking ID */}
                      {track.deliveryTrackingId && !track.carrierTrackingNumber && (
                        <p style={{ margin: '5px 0', fontSize: '12px' }}>
                          <strong>Delivery Tracking:</strong> {track.deliveryTrackingId}
                        </p>
                      )}
                      
                      {/* Next milestone */}
                      {track.nextMilestone && (
                        <p style={{ margin: '8px 0 0 0', fontSize: '11px', color: '#6c757d', fontStyle: 'italic' }}>
                          Next: {track.nextMilestone.replace(/_/g, ' ')}
                        </p>
                      )}
                    </div>
                    <div style={{ textAlign: 'right', marginLeft: '16px', minWidth: '120px' }}>
                      <p style={{ margin: 0, fontSize: '12px', color: '#666', fontWeight: '500' }}>
                        {formatDateTime(track.statusDate)}
                      </p>
                      {track.pickedUpAt && (
                        <p style={{ margin: '5px 0', fontSize: '12px', color: 'green' }}>
                          ✅ Picked up: {formatDateTime(track.pickedUpAt)}
                        </p>
                      )}
                      {track.deliveredAt && (
                        <p style={{ margin: '5px 0', fontSize: '12px', color: 'green' }}>
                          ✅ Delivered: {formatDateTime(track.deliveredAt)}
                        </p>
                      )}
                      {track.lastUpdateSource && (
                        <p style={{ margin: '5px 0', fontSize: '10px', color: '#adb5bd' }}>
                          via {track.lastUpdateSource}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TrackingDisplay;
