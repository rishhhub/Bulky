import React, { useState } from 'react';
import { Card } from '../ui/Card.jsx';
import { Button } from '../ui/Button.jsx';

/**
 * Component to display calculation formulas in an expandable format
 * 
 * @param {Object} props
 * @param {string} props.title - Title of the calculation section
 * @param {string} props.formula - The calculation formula (multi-line string)
 * @param {Array} props.breakdown - Optional detailed breakdown list
 */
export const CalculationBreakdown = ({ title, formula, breakdown = [] }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!formula && (!breakdown || breakdown.length === 0)) {
    return null;
  }

  return (
    <Card style={{ padding: '16px', marginBottom: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>{title}</h4>
        {(breakdown && breakdown.length > 0) && (
          <Button
            variant="info"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? 'Hide' : 'Show'} Details
          </Button>
        )}
      </div>

      {formula && (
        <div style={{ 
          marginTop: '12px', 
          padding: '12px', 
          backgroundColor: '#f8f9fa', 
          borderRadius: '6px',
          fontSize: '13px',
          fontFamily: 'monospace',
          whiteSpace: 'pre-line',
          overflowX: 'auto'
        }}>
          {formula}
        </div>
      )}

      {isExpanded && breakdown && breakdown.length > 0 && (
        <div style={{ 
          marginTop: '12px', 
          padding: '12px', 
          backgroundColor: '#e3f2fd', 
          borderRadius: '6px',
          fontSize: '13px'
        }}>
          <div style={{ fontWeight: '600', marginBottom: '8px' }}>Detailed Breakdown:</div>
          <ul style={{ margin: 0, paddingLeft: '20px' }}>
            {breakdown.map((item, index) => (
              <li key={index} style={{ marginBottom: '4px' }}>{item}</li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
};

export default CalculationBreakdown;
