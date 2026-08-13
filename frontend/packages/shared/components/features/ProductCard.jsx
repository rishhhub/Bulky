import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../ui/Card.jsx';
import { Badge } from '../ui/Badge.jsx';
import { formatCurrency } from '../../utils/formatters.js';

/**
 * Product card component
 * @param {Object} props
 * @param {Object} props.product - Product object
 * @param {Function} props.onImageChange - Optional callback for image changes
 */
export const ProductCard = ({ product, onImageChange }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageInterval, setImageInterval] = useState(null);

  const images = (product.imageUrls && product.imageUrls.length > 0)
    ? product.imageUrls
    : (product.imageUrl ? [product.imageUrl] : []);

  useEffect(() => {
    return () => {
      if (imageInterval) {
        clearInterval(imageInterval);
      }
    };
  }, [imageInterval]);

  const handleMouseEnter = () => {
    if (images.length > 1) {
      const interval = setInterval(() => {
        setCurrentImageIndex((prev) => (prev + 1) % images.length);
      }, 1500);
      setImageInterval(interval);
      if (onImageChange) {
        onImageChange(product.id, 0);
      }
    }
  };

  const handleMouseLeave = () => {
    if (imageInterval) {
      clearInterval(imageInterval);
      setImageInterval(null);
    }
    setCurrentImageIndex(0);
  };

  const currentImage = images[currentImageIndex] || images[0];

  return (
    <Link to={`/products/${product.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
      <Card
          style={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            cursor: 'pointer',
            transition: 'transform 0.2s, box-shadow 0.2s'
          }}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
        {currentImage && (
          <img
            src={currentImage}
            alt={product.name}
            style={{
              width: '100%',
              height: '200px',
              objectFit: 'cover',
              borderRadius: '4px',
              marginBottom: '15px'
            }}
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
          <h3 style={{ margin: 0, fontSize: '18px', flex: 1 }}>{product.name}</h3>
          {product.directOrderAvailable && (
            <Badge 
              status="Direct Order Available" 
              variant="success" 
              style={{ 
                marginLeft: '10px',
                backgroundColor: '#10b981',
                color: 'white',
                fontSize: '11px',
                padding: '4px 8px',
                whiteSpace: 'nowrap'
              }}
            >
              🎉 Direct Order
            </Badge>
          )}
        </div>
        {product.category && (
          <Badge status={product.category.name} variant="outline" style={{ marginBottom: '10px' }}>
            {product.category.name}
          </Badge>
        )}
        {product.directOrderAvailable && product.directOrderCityName && (
          <div style={{ 
            fontSize: '12px', 
            color: '#059669', 
            marginBottom: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <span>📍</span>
            <span>Available in {product.directOrderCityName}</span>
          </div>
        )}
        <p style={{ color: '#666', fontSize: '14px', margin: '10px 0', flex: 1 }}>
          {product.description && product.description.length > 100
            ? `${product.description.substring(0, 100)}...`
            : product.description}
        </p>
        <div style={{ marginTop: 'auto', paddingTop: '15px', borderTop: '1px solid #eee' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#007bff' }}>
              {formatCurrency(product.price)}
            </span>
            {product.minOrderQuantity && (
              <span style={{ fontSize: '12px', color: '#666' }}>
                Min: {product.minOrderQuantity} units
              </span>
            )}
          </div>
          {product.averageRating > 0 && product.reviewCount > 0 && (
            <div style={{ marginTop: '5px', fontSize: '14px' }}>
              {'★'.repeat(Math.floor(product.averageRating))}
              {'☆'.repeat(5 - Math.floor(product.averageRating))}
              <span style={{ marginLeft: '5px', color: '#666' }}>
                ({product.averageRating.toFixed(1)})
              </span>
            </div>
          )}
        </div>
      </Card>
    </Link>
  );
};

export default ProductCard;
