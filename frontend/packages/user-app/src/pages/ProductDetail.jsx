import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { productService, reviewService, authService, warehouseService, paymentService, orderService, profileService, pincodeService, wishlistService, directOrderService } from '@shared/services';
import { Card, Button, LoadingSpinner, Badge, Modal } from '@shared/components/ui';
import { FormField, FormSelect, FormTextarea } from '@shared/components/forms';
import { formatCurrency } from '@shared/utils/formatters';

function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [periodDays, setPeriodDays] = useState(7);
  const [logisticsPreference, setLogisticsPreference] = useState('DELIVERY');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [pincode, setPincode] = useState('');
  const [pincodeInfo, setPincodeInfo] = useState(null);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [addresses, setAddresses] = useState([]);
  const [warehouseId, setWarehouseId] = useState('');
  const [warehouses, setWarehouses] = useState([]);
  const [deliveryCost, setDeliveryCost] = useState(0);
  const [error, setError] = useState('');
  const [orderType, setOrderType] = useState('interest'); // 'interest' or 'direct'
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [editingReview, setEditingReview] = useState(null);
  const [existingInterest, setExistingInterest] = useState(null);
  const [showExistingInterestModal, setShowExistingInterestModal] = useState(false);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [selectedCityMatchesOrderGroup, setSelectedCityMatchesOrderGroup] = useState(true); // Track if selected address/warehouse matches order group city

  useEffect(() => {
    loadProduct();
    loadWarehouses();
    loadReviews();
    if (authService.isAuthenticated()) {
      loadAddresses();
      checkWishlistStatus();
      // Check for existing interest after addresses are loaded
      const checkInterest = async () => {
        try {
          const interests = await orderService.getMyInterests();
          const existing = interests.find(
            interest => 
              interest.productId === parseInt(id) && 
              interest.status !== 'WITHDRAWN' && 
              interest.status !== 'REFUNDED' &&
              interest.status !== 'COMPLETE' &&  // COMPLETE interests are orders, not active interests
              interest.status !== 'DIRECT_ORDER_PLACED'  // DIRECT_ORDER_PLACED interests are orders
          );
          if (existing) {
            setExistingInterest(existing);
          }
        } catch (err) {
          console.error('Failed to check existing interest:', err);
        }
      };
      checkInterest();
    }
  }, [id]);
  
  const checkWishlistStatus = async () => {
    if (!authService.isAuthenticated()) {
      return;
    }
    try {
      const inWishlist = await wishlistService.isInWishlist(parseInt(id));
      setIsInWishlist(inWishlist);
    } catch (err) {
      console.error('Failed to check wishlist status:', err);
    }
  };
  
  const handleWishlistToggle = async () => {
    if (!authService.isAuthenticated()) {
      navigate('/login');
      return;
    }
    
    setWishlistLoading(true);
    try {
      if (isInWishlist) {
        await wishlistService.removeFromWishlist(parseInt(id));
        setIsInWishlist(false);
      } else {
        await wishlistService.addToWishlist(parseInt(id));
        setIsInWishlist(true);
      }
    } catch (err) {
      console.error('Failed to update wishlist:', err);
      setError(err.response?.data?.message || 'Failed to update wishlist');
    } finally {
      setWishlistLoading(false);
    }
  };

  // Check if returning from profile page after adding address
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const returnFromProfile = urlParams.get('returnFromProfile');
    if (returnFromProfile === 'true') {
      // Remove the query parameter
      window.history.replaceState({}, '', window.location.pathname);
      loadAddresses();
    }
  }, []);

  useEffect(() => {
    if (product && logisticsPreference === 'DELIVERY') {
      calculateDeliveryCost();
    } else {
      setDeliveryCost(0);
    }
  }, [product, quantity, logisticsPreference, deliveryAddress]);

  useEffect(() => {
    // Reset quantity if switching to direct buy and current quantity is less than minimum
    if (product && orderType === 'direct' && quantity < product.minOrderQuantity) {
      setQuantity(product.minOrderQuantity);
    }
  }, [orderType, product]);

  // Check city match whenever product, selected address/warehouse, or logistics preference changes
  // This ensures the direct order form shows/hides correctly when switching addresses/warehouses
  // Note: onChange handlers also update this state, but this useEffect ensures consistency
  useEffect(() => {
    const checkCityMatch = async () => {
      if (!product?.directOrderAvailable || !product?.directOrderCityId) {
        setSelectedCityMatchesOrderGroup(true);
        return;
      }

      if (logisticsPreference === 'DELIVERY' && selectedAddressId && addresses.length > 0) {
        const selectedAddress = addresses.find(addr => addr.id.toString() === selectedAddressId);
        if (selectedAddress) {
          const addressPincode = selectedAddress.pincode || selectedAddress.postalCode;
          if (addressPincode && addressPincode.length === 6) {
            try {
              const info = await pincodeService.lookup(addressPincode);
              const matches = info?.cityId === product.directOrderCityId;
              setSelectedCityMatchesOrderGroup(matches);
            } catch (err) {
              console.error('Failed to lookup pincode for city match check:', err);
              setSelectedCityMatchesOrderGroup(false);
            }
          } else {
            setSelectedCityMatchesOrderGroup(false);
          }
        } else {
          setSelectedCityMatchesOrderGroup(false);
        }
      } else if (logisticsPreference === 'PICKUP' && warehouseId && warehouses.length > 0) {
        const selectedWarehouse = warehouses.find(w => w.id.toString() === warehouseId);
        if (selectedWarehouse) {
          const matches = selectedWarehouse.cityId === product.directOrderCityId;
          setSelectedCityMatchesOrderGroup(matches);
        } else {
          setSelectedCityMatchesOrderGroup(false);
        }
      } else {
        // No address/warehouse selected yet, default to false if direct order is available
        setSelectedCityMatchesOrderGroup(false);
      }
    };

    // Only check if we have the necessary data
    // Use a small timeout to avoid race conditions with onChange handlers
    // This ensures onChange handlers have priority in updating the state
    const timeoutId = setTimeout(() => {
      if (product && (addresses.length > 0 || warehouses.length > 0)) {
        checkCityMatch();
      }
    }, 200);

    return () => clearTimeout(timeoutId);
  }, [product, selectedAddressId, warehouseId, logisticsPreference, addresses, warehouses]);

  const loadProduct = async () => {
    try {
      const data = await productService.getById(id);
      setProduct(data);
      // Set initial quantity to 1, not restricted by minOrderQuantity
      setQuantity(1);
      // Reset image index when product changes
      setSelectedImageIndex(0);
    } catch (err) {
      console.error('Failed to load product:', err);
      setError(err.response?.data?.message || 'Product not found');
    } finally {
      setLoading(false);
    }
  };

  const loadReviews = async () => {
    try {
      const data = await reviewService.getByProductId(id);
      setReviews(data);
    } catch (err) {
      console.error('Failed to load reviews:', err);
    }
  };

  const loadWarehouses = async () => {
    try {
      const data = await warehouseService.getAllActive();
      setWarehouses(data || []);
      if (data && data.length > 0) {
        setWarehouseId(data[0].id);
      }
    } catch (err) {
      console.error('Failed to load warehouses:', err);
    }
  };

  const loadAddresses = async () => {
    try {
      const data = await profileService.getAddresses();
      setAddresses(data);
      // Select default address if available
      if (data.length > 0) {
        const defaultAddress = data.find(addr => addr.isDefault) || data[0];
        const addressToUse = defaultAddress;
        
        // Check if default address matches order group city for direct orders
        if (product?.directOrderAvailable && product?.directOrderCityId && addressToUse) {
          const addressPincode = addressToUse.pincode || addressToUse.postalCode;
          if (addressPincode && addressPincode.length === 6) {
            try {
              const info = await pincodeService.lookup(addressPincode);
              setSelectedCityMatchesOrderGroup(info?.cityId === product.directOrderCityId);
            } catch (err) {
              console.error('Failed to lookup pincode for default address:', err);
            }
          }
        }
        
        if (addressToUse) {
          setSelectedAddressId(addressToUse.id.toString());
          setDeliveryAddress(formatAddressString(addressToUse));
          // Auto-fill pincode from selected address
          const addressPincode = addressToUse.pincode || addressToUse.postalCode;
          if (addressPincode && addressPincode.length === 6) {
            setPincode(addressPincode);
            // Trigger pincode lookup automatically
            try {
              const info = await pincodeService.lookup(addressPincode);
              setPincodeInfo(info);
            } catch (err) {
              console.error('Failed to lookup pincode:', err);
              setPincodeInfo(null);
            }
          }
        }
      }
    } catch (err) {
      console.error('Failed to load addresses:', err);
    }
  };

  const formatAddressString = (address) => {
    const parts = [
      address.street,
      address.city,
      address.state,
      address.postalCode,
      address.country
    ].filter(Boolean);
    
    let addressString = parts.join(', ');
    
    if (address.recipientName) {
      addressString += ` (Recipient: ${address.recipientName}, ${address.recipientPhone})`;
    }
    
    return addressString;
  };

  const checkExistingInterest = async () => {
    try {
      const interests = await orderService.getMyInterests();
      const existing = interests.find(
        interest => 
          interest.productId === parseInt(id) && 
          interest.status !== 'WITHDRAWN' && 
          interest.status !== 'REFUNDED' &&
          interest.status !== 'COMPLETE' &&  // COMPLETE interests are orders, not active interests
          interest.status !== 'DIRECT_ORDER_PLACED'  // DIRECT_ORDER_PLACED interests are orders
      );
      if (existing) {
        setExistingInterest(existing);
      }
    } catch (err) {
      console.error('Failed to check existing interest:', err);
    }
  };

  const calculateDeliveryCost = async () => {
    if (!product || logisticsPreference !== 'DELIVERY') return;
    
    try {
      const response = await warehouseService.calculateDeliveryCost({
        productId: product.id,
        quantity: quantity,
        deliveryAddress: deliveryAddress,
      });
      setDeliveryCost(response.deliveryCost || 0);
    } catch (err) {
      console.error('Failed to calculate delivery cost:', err);
      setDeliveryCost(0);
    }
  };

  const handlePlaceDirectOrder = async (e) => {
    e.preventDefault();
    
    if (!authService.isAuthenticated()) {
      navigate('/login');
      return;
    }

    if (!product?.directOrderAvailable || !product?.directOrderOrderGroupId) {
      setError('Direct order is not available for this product');
      return;
    }

    if (logisticsPreference === 'DELIVERY') {
      if (!selectedAddressId && !deliveryAddress.trim()) {
        setError('Please select a delivery address');
        return;
      }
      if (!pincode || pincode.length !== 6) {
        setError('Please select a delivery address with a valid pincode');
        return;
      }
      if (!pincodeInfo || !pincodeInfo.serviceable) {
        setError('The selected address has a non-serviceable pincode. Please select a different address or add a new address with a serviceable pincode.');
        return;
      }
    }

    if (logisticsPreference === 'PICKUP' && !warehouseId) {
      setError('Please select a warehouse');
      return;
    }

    if (quantity < 1) {
      setError('Quantity must be at least 1');
      return;
    }

    try {
      const response = await directOrderService.placeDirectOrder({
        orderGroupId: product?.directOrderOrderGroupId,
        quantity: quantity,
        logisticsPreference: logisticsPreference,
        deliveryAddress: logisticsPreference === 'DELIVERY' ? deliveryAddress : null,
        pincode: logisticsPreference === 'DELIVERY' ? pincode : null,
        warehouseId: logisticsPreference === 'PICKUP' ? warehouseId : null,
        addressId: logisticsPreference === 'DELIVERY' && selectedAddressId ? parseInt(selectedAddressId) : null,
      });

      // Process payment
      if (response && response.id) {
        await paymentService.processDeposit(response.id);
      }

      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to place direct order');
    }
  };

  const handleExpressInterest = async (e) => {
    e.preventDefault();
    
    if (!authService.isAuthenticated()) {
      navigate('/login');
      return;
    }

    // Check if user already has an active interest (not an order) for this product
    if (existingInterest && 
        existingInterest.status !== 'COMPLETE' && 
        existingInterest.status !== 'DIRECT_ORDER_PLACED') {
      setShowExistingInterestModal(true);
      return;
    }

    if (logisticsPreference === 'DELIVERY') {
      if (!selectedAddressId && !deliveryAddress.trim()) {
        setError('Please select a delivery address');
        return;
      }
      // Pincode should come from selected address - validate it exists and is serviceable
      if (!pincode || pincode.length !== 6) {
        setError('Please select a delivery address with a valid pincode');
        return;
      }
      if (!pincodeInfo || !pincodeInfo.serviceable) {
        setError('The selected address has a non-serviceable pincode. Please select a different address or add a new address with a serviceable pincode.');
        return;
      }
    }

    if (logisticsPreference === 'PICKUP' && !warehouseId) {
      setError('Please select a warehouse');
      return;
    }

    // Validate direct buy quantity
    if (orderType === 'direct' && quantity < product.minOrderQuantity) {
      setError(`Direct buy requires at least ${product.minOrderQuantity} units (seller's minimum order quantity)`);
      return;
    }

    try {
      const response = await orderService.createInterest({
        productId: product.id,
        quantity: quantity,
        periodDays: orderType === 'direct' ? 0 : periodDays, // Direct buy doesn't need period
        logisticsPreference: logisticsPreference,
        deliveryAddress: logisticsPreference === 'DELIVERY' ? deliveryAddress : null,
        pincode: logisticsPreference === 'DELIVERY' ? pincode : null,
        warehouseId: logisticsPreference === 'PICKUP' ? warehouseId : null,
        payLogisticsUpfront: true,
        directBuy: orderType === 'direct',
      });

      // Process deposit payment
      if (response && response.id) {
        await paymentService.processDeposit(response.id);
      }

      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to express interest');
    }
  };

  const handleViewExistingInterest = () => {
    setShowExistingInterestModal(false);
    navigate('/dashboard');
  };

  const handleWithdrawAndCreateNew = async () => {
    try {
      await orderService.withdrawInterest(existingInterest.id);
      setExistingInterest(null);
      setShowExistingInterestModal(false);
      // Reload interests to update the check
      try {
        const interests = await orderService.getMyInterests();
        const existing = interests.find(
          interest => 
            interest.productId === parseInt(id) && 
            interest.status !== 'WITHDRAWN' && 
            interest.status !== 'REFUNDED'
        );
        if (existing) {
          setExistingInterest(existing);
        }
      } catch (err) {
        console.error('Failed to check existing interest:', err);
      }
      // Now allow the user to proceed with creating new interest
      // The form submission will work normally now
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to withdraw existing interest');
      setShowExistingInterestModal(false);
    }
  };

  if (loading) {
    return <div className="container" style={{ marginTop: '30px' }}>Loading...</div>;
  }

  if (!product) {
    return (
      <div className="container" style={{ marginTop: '30px' }}>
        <div className="card">
          <h2>Product Not Found</h2>
          {error && <p style={{ color: 'red' }}>{error}</p>}
          <p>The product you're looking for doesn't exist or is no longer available.</p>
          <button onClick={() => navigate('/products')} className="btn btn-primary">
            Back to Products
          </button>
        </div>
      </div>
    );
  }

  // Calculate deposit and total upfront (only after product is loaded)
  // For direct orders, calculate full amount (100%), otherwise 10% deposit
  const isDirectOrder = product?.directOrderAvailable && selectedCityMatchesOrderGroup;
  const depositAmount = isDirectOrder 
    ? (product.price * quantity).toFixed(2) // Full amount for direct orders
    : (product.price * quantity * 0.1).toFixed(2); // 10% deposit for regular orders
  const totalUpfront = (parseFloat(depositAmount) + parseFloat(deliveryCost)).toFixed(2);

  const images = (product.imageUrls && product.imageUrls.length > 0) 
    ? product.imageUrls 
    : (product.imageUrl ? [product.imageUrl] : []);

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!authService.isAuthenticated()) {
      navigate('/login');
      return;
    }

    try {
      if (editingReview) {
        await reviewService.update(editingReview.id, {
          productId: product.id,
          rating: reviewRating,
          comment: reviewComment,
        });
      } else {
        await reviewService.create({
          productId: product.id,
          rating: reviewRating,
          comment: reviewComment,
        });
      }
      await loadReviews();
      await loadProduct(); // Reload to update rating
      setShowReviewForm(false);
      setEditingReview(null);
      setReviewRating(5);
      setReviewComment('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit review');
    }
  };

  const handleEditReview = (review) => {
    setEditingReview(review);
    setReviewRating(review.rating);
    setReviewComment(review.comment || '');
    setShowReviewForm(true);
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Are you sure you want to delete this review?')) return;
    try {
      await reviewService.delete(reviewId);
      await loadReviews();
      await loadProduct(); // Reload to update rating
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete review');
    }
  };

  const renderStars = (rating, interactive = false, onRatingChange = null) => {
    // For interactive rating (whole stars only)
    if (interactive) {
      return (
        <div style={{ display: 'flex', gap: '2px' }}>
          {[1, 2, 3, 4, 5].map((star) => (
            <span
              key={star}
              onClick={() => interactive && onRatingChange && onRatingChange(star)}
              style={{
                fontSize: '24px',
                color: star <= rating ? '#ffc107' : '#ddd',
                cursor: interactive ? 'pointer' : 'default',
              }}
            >
              ★
            </span>
          ))}
        </div>
      );
    }
    
    // For displaying average ratings (with half stars)
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    return (
      <div style={{ display: 'flex', gap: '2px', alignItems: 'center', fontSize: '24px', color: 'inherit' }}>
        {/* Full stars */}
        {Array.from({ length: fullStars }).map((_, i) => (
          <span key={`full-${i}`} style={{ color: '#ffc107', display: 'inline-block' }}>★</span>
        ))}
        {/* Half star */}
        {hasHalfStar && (
          <span style={{ 
            position: 'relative',
            display: 'inline-block',
            width: '24px',
            height: '24px',
            lineHeight: '24px',
            fontSize: '24px',
            verticalAlign: 'middle'
          }}>
            {/* Background empty star */}
            <span style={{ color: '#ddd', position: 'absolute', left: 0, top: 0 }}>★</span>
            {/* Foreground filled half - clip to left 50% */}
            <span style={{ 
              color: '#ffc107', 
              position: 'absolute', 
              left: 0,
              top: 0,
              width: '12px',
              overflow: 'hidden',
              whiteSpace: 'nowrap'
            }}>★</span>
          </span>
        )}
        {/* Empty stars */}
        {Array.from({ length: emptyStars }).map((_, i) => (
          <span key={`empty-${i}`} style={{ color: '#ddd', display: 'inline-block' }}>☆</span>
        ))}
      </div>
    );
  };

  return (
    <div className="container" style={{ marginTop: '30px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '40px' }}>
        <div>
          {/* Image Gallery */}
          {images.length > 0 ? (
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'relative', width: '100%', marginBottom: '15px' }}>
                <img
                  src={images[selectedImageIndex]}
                  alt={product.name}
                  style={{ width: '100%', borderRadius: '8px', maxHeight: '500px', objectFit: 'contain' }}
                />
                {images.length > 1 && (
                  <>
                    {/* Previous Button */}
                    <button
                      onClick={() => setSelectedImageIndex((selectedImageIndex - 1 + images.length) % images.length)}
                      style={{
                        position: 'absolute',
                        left: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        backgroundColor: 'rgba(0, 0, 0, 0.6)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '50%',
                        width: '50px',
                        height: '50px',
                        cursor: 'pointer',
                        fontSize: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'background-color 0.3s ease'
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(0, 0, 0, 0.8)'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = 'rgba(0, 0, 0, 0.6)'}
                    >
                      ‹
                    </button>
                    {/* Next Button */}
                    <button
                      onClick={() => setSelectedImageIndex((selectedImageIndex + 1) % images.length)}
                      style={{
                        position: 'absolute',
                        right: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        backgroundColor: 'rgba(0, 0, 0, 0.6)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '50%',
                        width: '50px',
                        height: '50px',
                        cursor: 'pointer',
                        fontSize: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'background-color 0.3s ease'
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(0, 0, 0, 0.8)'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = 'rgba(0, 0, 0, 0.6)'}
                    >
                      ›
                    </button>
                    {/* Image Counter */}
                    <div style={{
                      position: 'absolute',
                      bottom: '10px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      backgroundColor: 'rgba(0, 0, 0, 0.6)',
                      color: 'white',
                      padding: '5px 15px',
                      borderRadius: '20px',
                      fontSize: '14px'
                    }}>
                      {selectedImageIndex + 1} / {images.length}
                    </div>
                  </>
                )}
              </div>
              {images.length > 1 && (
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
                  {images.map((img, index) => (
                    <img
                      key={index}
                      src={img}
                      alt={`${product.name} ${index + 1}`}
                      onClick={() => setSelectedImageIndex(index)}
                      style={{
                        width: '80px',
                        height: '80px',
                        objectFit: 'cover',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        border: selectedImageIndex === index ? '3px solid #007bff' : '1px solid #ddd',
                        opacity: selectedImageIndex === index ? 1 : 0.7,
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        if (selectedImageIndex !== index) {
                          e.target.style.opacity = '1';
                          e.target.style.transform = 'scale(1.05)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedImageIndex !== index) {
                          e.target.style.opacity = '0.7';
                          e.target.style.transform = 'scale(1)';
                        }
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div style={{ width: '100%', height: '400px', backgroundColor: '#f0f0f0', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              No Image Available
            </div>
          )}

          {/* Product Info */}
          {product.categoryPath && (
            <div style={{ marginBottom: '10px' }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                flexWrap: 'wrap'
              }}>
                <span style={{ color: '#666', fontSize: '14px' }}>Category:</span>
                {product.categoryBreadcrumbs && product.categoryBreadcrumbs.length > 0 ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap' }}>
                    {product.categoryBreadcrumbs.map((crumb, index) => (
                      <React.Fragment key={index}>
                        <span
                          onClick={() => {
                            // Find category ID and navigate to product list with filter
                            const findCategoryByName = (cats, name) => {
                              for (const cat of cats) {
                                if (cat.name === name) return cat.id.toString();
                                if (cat.children) {
                                  const found = findCategoryByName(cat.children, name);
                                  if (found) return found;
                                }
                              }
                              return null;
                            };
                            // We'd need categories loaded here - for now just show the path
                          }}
                          style={{ 
                            color: '#007bff',
                            cursor: 'pointer',
                            fontSize: '14px',
                            textDecoration: 'underline'
                          }}
                        >
                          {crumb}
                        </span>
                        {index < product.categoryBreadcrumbs.length - 1 && (
                          <span style={{ color: '#999' }}>›</span>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                ) : (
                  <span style={{ 
                    display: 'inline-block',
                    padding: '5px 12px',
                    backgroundColor: '#007bff',
                    color: 'white',
                    borderRadius: '4px',
                    fontSize: '14px',
                    fontWeight: 'bold'
                  }}>
                    {product.categoryName || product.categoryPath}
                  </span>
                )}
              </div>
            </div>
          )}
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h1 style={{ margin: 0 }}>{product.name}</h1>
            {authService.isAuthenticated() && (
              <button
                onClick={handleWishlistToggle}
                disabled={wishlistLoading}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: wishlistLoading ? 'wait' : 'pointer',
                  fontSize: '28px',
                  color: isInWishlist ? '#e91e63' : '#ccc',
                  padding: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'transform 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (!wishlistLoading) {
                    e.target.style.transform = 'scale(1.2)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'scale(1)';
                }}
                title={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
              >
                {isInWishlist ? '❤️' : '🤍'}
              </button>
            )}
          </div>
          
          {/* Direct Order Available Banner */}
          {product?.directOrderAvailable && selectedCityMatchesOrderGroup && (
            <div style={{
              padding: '15px',
              backgroundColor: '#d1fae5',
              border: '2px solid #10b981',
              borderRadius: '8px',
              marginBottom: '20px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <span style={{ fontSize: '20px' }}>🎉</span>
                <strong style={{ color: '#065f46', fontSize: '16px' }}>Direct Order Available!</strong>
              </div>
              <p style={{ margin: 0, color: '#047857', fontSize: '14px' }}>
                A bulk order for this product has reached the minimum threshold in {product.directOrderCityName || 'your city'}. 
                You can place a direct order now with any quantity! Limited time offer.
              </p>
            </div>
          )}
          
          {/* Warning if direct order available but selected address/warehouse is in different city */}
          {product?.directOrderAvailable && !selectedCityMatchesOrderGroup && (
            <div style={{
              padding: '15px',
              backgroundColor: '#fef3c7',
              border: '2px solid #fbbf24',
              borderRadius: '8px',
              marginBottom: '20px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <span style={{ fontSize: '20px' }}>⚠️</span>
                <strong style={{ color: '#92400e', fontSize: '16px' }}>Direct Order Not Available</strong>
              </div>
              <p style={{ margin: 0, color: '#92400e', fontSize: '14px' }}>
                Direct order is only available for {product.directOrderCityName || 'the order group city'}. 
                The selected {logisticsPreference === 'DELIVERY' ? 'address' : 'warehouse'} is in a different city. 
                Please select an {logisticsPreference === 'DELIVERY' ? 'address' : 'warehouse'} in {product.directOrderCityName || 'the order group city'} to use direct order, or use the regular order form below.
              </p>
            </div>
          )}
          
          {/* Rating */}
          <div style={{ marginBottom: '15px' }}>
            {product.averageRating > 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {renderStars(product.averageRating)}
                <span style={{ fontSize: '18px', fontWeight: 'bold' }}>
                  {product.averageRating.toFixed(1)}
                </span>
                {product.reviewCount > 0 && (
                  <span style={{ color: '#666' }}>
                    ({product.reviewCount} review{product.reviewCount !== 1 ? 's' : ''})
                  </span>
                )}
              </div>
            ) : (
              <span style={{ color: '#999' }}>No ratings yet</span>
            )}
          </div>
          
          <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#007bff', margin: '15px 0' }}>
            ₹{product.price.toFixed(2)}
          </p>
          <p style={{ marginBottom: '15px' }}>{product.description}</p>
          <p style={{ color: '#666' }}>
            <strong>Seller's Minimum Order:</strong> {product.minOrderQuantity} units
            <br />
            <small>(You can express interest for any quantity)</small>
          </p>
        </div>

        <div className="card">
          <h2>{product?.directOrderAvailable ? 'Place Direct Order' : 'Place Order'}</h2>
          {error && <div style={{ color: 'red', marginBottom: '15px' }}>{error}</div>}
          {product?.directOrderAvailable && selectedCityMatchesOrderGroup ? (
            <form onSubmit={handlePlaceDirectOrder}>
              <div style={{ marginBottom: '15px', padding: '12px', backgroundColor: '#eff6ff', borderRadius: '6px' }}>
                <p style={{ margin: 0, fontSize: '14px', color: '#1e40af' }}>
                  <strong>Direct Order:</strong> This order will be added to an existing order group in {product?.directOrderCityName || 'your city'}. 
                  You can order any quantity (no minimum required).
                </p>
              </div>
              
              <div className="form-group">
                <label>Quantity *</label>
                <input
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  required
                />
                <small style={{ color: '#666', display: 'block', marginTop: '5px' }}>
                  You can order any quantity (no minimum required)
                </small>
              </div>

              <div className="form-group">
                <label>Logistics Preference</label>
                <select
                  value={logisticsPreference}
                  onChange={(e) => setLogisticsPreference(e.target.value)}
                >
                  <option value="DELIVERY">Delivery</option>
                  <option value="PICKUP">Pickup from Warehouse</option>
                </select>
              </div>

              {logisticsPreference === 'DELIVERY' && (
                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <label>Delivery Address</label>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        navigate(`/profile?section=addresses&returnUrl=${encodeURIComponent(`/products/${id}?returnFromProfile=true`)}`);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '14px'
                      }}
                    >
                      <span>➕</span>
                      <span>Add New Address</span>
                    </Button>
                  </div>
                  {addresses.length === 0 ? (
                    <div style={{ 
                      padding: '16px', 
                      backgroundColor: '#fef3c7', 
                      borderRadius: '8px',
                      border: '1px solid #fbbf24',
                      marginBottom: '12px'
                    }}>
                      <p style={{ margin: 0, fontSize: '14px', color: '#92400e' }}>
                        No addresses found. Please add an address to continue.
                      </p>
                    </div>
                  ) : (
                    <select
                      value={selectedAddressId}
                      onChange={async (e) => {
                        const addressId = e.target.value;
                        setSelectedAddressId(addressId);
                        const selectedAddress = addresses.find(addr => addr.id.toString() === addressId);
                        if (selectedAddress) {
                          setDeliveryAddress(formatAddressString(selectedAddress));
                          const addressPincode = selectedAddress.pincode || selectedAddress.postalCode;
                          if (addressPincode && addressPincode.length === 6) {
                            setPincode(addressPincode);
                            try {
                              const info = await pincodeService.lookup(addressPincode);
                              setPincodeInfo(info);
                              
                              // Check if address city matches order group city for direct orders
                              if (product?.directOrderAvailable && product?.directOrderCityId) {
                                const matches = info?.cityId === product.directOrderCityId;
                                setSelectedCityMatchesOrderGroup(matches);
                                if (!matches) {
                                  setError(`Direct order is only available for ${product.directOrderCityName}. The selected address is in a different city. Please select an address in ${product.directOrderCityName} or use the regular order form.`);
                                } else {
                                  setError(''); // Clear error if city matches
                                }
                              } else {
                                // If no direct order available, reset to true (doesn't matter)
                                setSelectedCityMatchesOrderGroup(true);
                              }
                            } catch (err) {
                              console.error('Failed to lookup pincode:', err);
                              setPincodeInfo(null);
                              // If lookup fails and direct order is available, assume no match
                              if (product?.directOrderAvailable && product?.directOrderCityId) {
                                setSelectedCityMatchesOrderGroup(false);
                              }
                            }
                          } else {
                            // No valid pincode - if direct order is available, assume no match
                            if (product?.directOrderAvailable && product?.directOrderCityId) {
                              setSelectedCityMatchesOrderGroup(false);
                            }
                          }
                        }
                      }}
                      required
                      style={{
                        width: '100%',
                        padding: '10px',
                        fontSize: '14px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        backgroundColor: 'white'
                      }}
                    >
                      {addresses.map((address) => (
                        <option key={address.id} value={address.id.toString()}>
                          {address.label} {address.isDefault && '(Default)'} - {address.street}, {address.city}, {address.state}
                          {address.recipientName && ` (${address.recipientName})`}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              {logisticsPreference === 'PICKUP' && (
                <div className="form-group">
                  <label>Select Warehouse</label>
                  <select
                    value={warehouseId}
                    onChange={async (e) => {
                      const newWarehouseId = e.target.value;
                      setWarehouseId(newWarehouseId);
                      
                      // Check if warehouse city matches order group city for direct orders
                      if (product?.directOrderAvailable && product?.directOrderCityId) {
                        const selectedWarehouse = warehouses.find(w => w.id.toString() === newWarehouseId);
                        if (selectedWarehouse) {
                          const matches = selectedWarehouse.cityId === product.directOrderCityId;
                          setSelectedCityMatchesOrderGroup(matches);
                          if (!matches) {
                            setError(`Direct order is only available for ${product.directOrderCityName}. The selected warehouse is in a different city. Please select a warehouse in ${product.directOrderCityName} or use the regular order form.`);
                          } else {
                            setError(''); // Clear error if city matches
                          }
                        }
                      }
                    }}
                    required
                  >
                    {warehouses.map((warehouse) => (
                      <option key={warehouse.id} value={warehouse.id}>
                        {warehouse.name} - {warehouse.street || 'N/A'}{warehouse.city ? `, ${warehouse.city}` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div style={{ marginBottom: '15px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                <p><strong>Product Cost (Full Amount):</strong> ₹{depositAmount}</p>
                {logisticsPreference === 'DELIVERY' && deliveryCost > 0 && (
                  <p><strong>Delivery Cost:</strong> ₹{deliveryCost.toFixed(2)}</p>
                )}
                <p style={{ fontWeight: 'bold', marginTop: '10px', fontSize: '18px' }}>
                  Total Amount: ₹{totalUpfront}
                </p>
                <p style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
                  For direct orders, the full amount is collected upfront.
                </p>
              </div>

              <Button type="submit" variant="primary" size="lg" style={{ width: '100%' }}>
                Place Direct Order & Pay Full Amount
              </Button>
            </form>
          ) : (
            <form onSubmit={handleExpressInterest}>
            <div className="form-group">
              <label>Order Type *</label>
              <div style={{ display: 'flex', gap: '20px', marginTop: '10px' }}>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="orderType"
                    value="interest"
                    checked={orderType === 'interest'}
                    onChange={(e) => setOrderType(e.target.value)}
                    style={{ marginRight: '8px' }}
                  />
                  <div>
                    <strong>Show Interest</strong>
                    <br />
                    <small style={{ color: '#666' }}>
                      For quantities less than {product.minOrderQuantity} units. Wait for others to join.
                    </small>
                  </div>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="orderType"
                    value="direct"
                    checked={orderType === 'direct'}
                    onChange={(e) => setOrderType(e.target.value)}
                    style={{ marginRight: '8px' }}
                  />
                  <div>
                    <strong>Direct Buy</strong>
                    <br />
                    <small style={{ color: '#666' }}>
                      For {product.minOrderQuantity}+ units. Pay full amount and place order immediately.
                    </small>
                  </div>
                </label>
              </div>
            </div>

            <div className="form-group">
              <label>Quantity *</label>
              <input
                type="number"
                min={orderType === 'direct' ? product.minOrderQuantity : 1}
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value))}
                required
              />
              <small style={{ color: '#666', display: 'block', marginTop: '5px' }}>
                {orderType === 'direct' 
                  ? `Minimum ${product.minOrderQuantity} units required for direct buy`
                  : `You can express interest for any quantity (minimum 1). Seller's minimum: ${product.minOrderQuantity} units`}
              </small>
            </div>

            {orderType === 'interest' && (
              <div className="form-group">
                <label>Period (days)</label>
                <select value={periodDays} onChange={(e) => setPeriodDays(parseInt(e.target.value))}>
                  <option value={7}>7 days</option>
                  <option value={14}>14 days</option>
                  <option value={30}>30 days</option>
                </select>
                <small style={{ color: '#666', display: 'block', marginTop: '5px' }}>
                  How long to wait for other buyers to join
                </small>
              </div>
            )}

            <div className="form-group">
              <label>Logistics Preference</label>
              <select
                value={logisticsPreference}
                onChange={(e) => setLogisticsPreference(e.target.value)}
              >
                <option value="DELIVERY">Delivery</option>
                <option value="PICKUP">Pickup from Warehouse</option>
              </select>
            </div>

            {logisticsPreference === 'DELIVERY' && (
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label>Delivery Address</label>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      // Navigate to profile with addresses section and return URL
                      navigate(`/profile?section=addresses&returnUrl=${encodeURIComponent(`/products/${id}?returnFromProfile=true`)}`);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '14px'
                    }}
                  >
                    <span>➕</span>
                    <span>Add New Address</span>
                  </Button>
                </div>
                {addresses.length === 0 ? (
                  <div style={{ 
                    padding: '16px', 
                    backgroundColor: '#fef3c7', 
                    borderRadius: '8px',
                    border: '1px solid #fbbf24',
                    marginBottom: '12px'
                  }}>
                    <p style={{ margin: 0, fontSize: '14px', color: '#92400e' }}>
                      No addresses found. Please add an address to continue.
                    </p>
                  </div>
                ) : (
                  <select
                    value={selectedAddressId}
                    onChange={async (e) => {
                      const addressId = e.target.value;
                      setSelectedAddressId(addressId);
                      const selectedAddress = addresses.find(addr => addr.id.toString() === addressId);
                      if (selectedAddress) {
                        setDeliveryAddress(formatAddressString(selectedAddress));
                        // Auto-fill pincode from selected address
                        const addressPincode = selectedAddress.pincode || selectedAddress.postalCode;
                        if (addressPincode && addressPincode.length === 6) {
                          setPincode(addressPincode);
                          // Trigger pincode lookup automatically
                          try {
                            const info = await pincodeService.lookup(addressPincode);
                            setPincodeInfo(info);
                            
                            // Check if address city matches order group city for direct orders
                            if (product?.directOrderAvailable && product?.directOrderCityId) {
                              const matches = info?.cityId === product.directOrderCityId;
                              setSelectedCityMatchesOrderGroup(matches);
                              if (!matches) {
                                setError(`Direct order is only available for ${product.directOrderCityName}. The selected address is in a different city. Please select an address in ${product.directOrderCityName} or use the regular order form.`);
                              } else {
                                setError(''); // Clear error if city matches
                              }
                            } else {
                              // If no direct order available, reset to true (doesn't matter)
                              setSelectedCityMatchesOrderGroup(true);
                            }
                          } catch (err) {
                            console.error('Failed to lookup pincode:', err);
                            setPincodeInfo(null);
                            // If lookup fails and direct order is available, assume no match
                            if (product?.directOrderAvailable && product?.directOrderCityId) {
                              setSelectedCityMatchesOrderGroup(false);
                            }
                          }
                        } else {
                          // No valid pincode - if direct order is available, assume no match
                          if (product?.directOrderAvailable && product?.directOrderCityId) {
                            setSelectedCityMatchesOrderGroup(false);
                          }
                        }
                      }
                    }}
                    required
                    style={{
                      width: '100%',
                      padding: '10px',
                      fontSize: '14px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      backgroundColor: 'white'
                    }}
                  >
                    {addresses.map((address) => (
                      <option key={address.id} value={address.id.toString()}>
                        {address.label} {address.isDefault && '(Default)'} - {address.street}, {address.city}, {address.state}
                        {address.recipientName && ` (${address.recipientName})`}
                      </option>
                    ))}
                  </select>
                )}
                {logisticsPreference === 'DELIVERY' && pincode && (
                  // Show pincode info (read-only) when available from selected address
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                      Pincode (from selected address)
                    </label>
                    <input
                      type="text"
                      value={pincode}
                      readOnly
                      disabled
                      style={{
                        width: '100%',
                        padding: '10px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '14px',
                        backgroundColor: '#f5f5f5',
                        cursor: 'not-allowed'
                      }}
                    />
                    {pincodeInfo && (
                      <div style={{
                        marginTop: '8px',
                        padding: '10px',
                        backgroundColor: '#f0f9ff',
                        border: '1px solid #bae6fd',
                        borderRadius: '4px',
                        fontSize: '14px'
                      }}>
                        <div style={{ fontWeight: '500', color: '#0369a1' }}>
                          {pincodeInfo.cityName || 'Unknown'}, {pincodeInfo.stateName || 'Unknown'} {pincodeInfo.stateCode ? `(${pincodeInfo.stateCode})` : ''}
                        </div>
                        {!pincodeInfo.serviceable && (
                          <div style={{ color: '#dc2626', marginTop: '4px', fontSize: '12px' }}>
                            ⚠️ This pincode is not serviceable
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
                {selectedAddressId && addresses.length > 0 && (
                  <div style={{ 
                    marginTop: '12px', 
                    padding: '12px', 
                    backgroundColor: '#f9fafb', 
                    borderRadius: '6px',
                    fontSize: '13px',
                    color: '#6b7280',
                    lineHeight: '1.5'
                  }}>
                    <strong>Full Address:</strong>
                    <div style={{ marginTop: '4px' }}>
                      {(() => {
                        const selectedAddress = addresses.find(addr => addr.id.toString() === selectedAddressId);
                        if (selectedAddress) {
                          return (
                            <>
                              <div>{selectedAddress.street}</div>
                              <div>{selectedAddress.city}, {selectedAddress.state} {selectedAddress.postalCode}</div>
                              <div>{selectedAddress.country}</div>
                              {selectedAddress.recipientName && (
                                <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #e5e7eb' }}>
                                  <strong>Recipient:</strong> {selectedAddress.recipientName} ({selectedAddress.recipientPhone})
                                </div>
                              )}
                            </>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  </div>
                )}
              </div>
            )}

            {logisticsPreference === 'PICKUP' && (
              <div className="form-group">
                <label>Select Warehouse</label>
                <select
                  value={warehouseId}
                  onChange={(e) => setWarehouseId(e.target.value)}
                  required
                >
                  {warehouses.map((warehouse) => (
                    <option key={warehouse.id} value={warehouse.id}>
                      {warehouse.name} - {warehouse.street || 'N/A'}{warehouse.city ? `, ${warehouse.city}` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {logisticsPreference === 'DELIVERY' && deliveryCost > 0 && (
              <div style={{ marginBottom: '15px' }}>
                <p>Delivery Cost: ₹{deliveryCost.toFixed(2)}</p>
              </div>
            )}

            <div style={{ marginBottom: '15px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
              <p><strong>Deposit (10%):</strong> ₹{depositAmount}</p>
              {logisticsPreference === 'DELIVERY' && deliveryCost > 0 && (
                <p><strong>Delivery Cost:</strong> ₹{deliveryCost.toFixed(2)}</p>
              )}
              <p style={{ fontWeight: 'bold', marginTop: '10px', fontSize: '18px' }}>
                Total Upfront: ₹{totalUpfront}
              </p>
              {orderType === 'direct' && (
                <p style={{ color: '#007bff', marginTop: '10px', fontSize: '14px' }}>
                  After deposit, you'll be able to pay the remaining 90% and place the order immediately.
                </p>
              )}
              {orderType === 'interest' && (
                <p style={{ color: '#666', marginTop: '10px', fontSize: '14px' }}>
                  If enough buyers join within your selected period, you'll be notified to pay the remaining 90%.
                </p>
              )}
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
              {orderType === 'direct' ? 'Pay Deposit & Place Direct Order' : 'Express Interest & Pay Deposit'}
            </button>
          </form>
          )}
        </div>
      </div>

      {/* Reviews Section */}
      <div style={{ marginTop: '40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2>Reviews{reviews.length > 0 ? ` (${reviews.length})` : ''}</h2>
          {authService.isAuthenticated() && (
            <button
              onClick={() => {
                setShowReviewForm(!showReviewForm);
                setEditingReview(null);
                setReviewRating(5);
                setReviewComment('');
              }}
              className="btn btn-primary"
            >
              {showReviewForm ? 'Cancel' : 'Write a Review'}
            </button>
          )}
        </div>

        {/* Review Form */}
        {showReviewForm && (
          <div className="card" style={{ marginBottom: '30px', padding: '20px' }}>
            <h3>{editingReview ? 'Edit Review' : 'Write a Review'}</h3>
            <form onSubmit={handleSubmitReview}>
              <div className="form-group">
                <label>Rating *</label>
                {renderStars(reviewRating, true, setReviewRating)}
              </div>
              <div className="form-group">
                <label>Comment</label>
                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  rows="4"
                  placeholder="Share your experience with this product..."
                />
              </div>
              <button type="submit" className="btn btn-primary">
                {editingReview ? 'Update Review' : 'Submit Review'}
              </button>
            </form>
          </div>
        )}

        {/* Reviews List */}
        {reviews.length === 0 ? (
          <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
            <p>No reviews yet. Be the first to review this product!</p>
          </div>
        ) : (
          <div>
            {reviews.map((review) => (
              <div key={review.id} className="card" style={{ marginBottom: '20px', padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '10px' }}>
                  <div>
                    <strong>{review.userName}</strong>
                    <div style={{ marginTop: '5px' }}>
                      {renderStars(review.rating)}
                    </div>
                  </div>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    {new Date(review.createdAt).toLocaleDateString()}
                    {review.updatedAt !== review.createdAt && (
                      <span style={{ marginLeft: '5px' }}>(edited)</span>
                    )}
                  </div>
                </div>
                {review.comment && (
                  <p style={{ marginTop: '10px', color: '#333' }}>{review.comment}</p>
                )}
                {authService.isAuthenticated() && (
                  <div style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
                    {(() => {
                      const currentUser = authService.getCurrentUser();
                      return currentUser && review.userId === currentUser.id && (
                        <>
                          <button
                            onClick={() => handleEditReview(review)}
                            style={{
                              padding: '5px 10px',
                              fontSize: '12px',
                              backgroundColor: '#6c757d',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer'
                            }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteReview(review.id)}
                            style={{
                              padding: '5px 10px',
                              fontSize: '12px',
                              backgroundColor: '#dc3545',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer'
                            }}
                          >
                            Delete
                          </button>
                        </>
                      );
                    })()}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Existing Interest Modal */}
      <Modal
        isOpen={showExistingInterestModal}
        onClose={() => setShowExistingInterestModal(false)}
        title="Existing Interest Found"
      >
        <div style={{ padding: '20px' }}>
          <p style={{ marginBottom: '20px', fontSize: '16px', color: '#374151' }}>
            You already have an active interest for this product:
          </p>
          {existingInterest && (
            <div style={{ 
              padding: '16px', 
              backgroundColor: '#f9fafb', 
              borderRadius: '8px',
              marginBottom: '20px'
            }}>
              <p style={{ margin: '0 0 8px 0', fontWeight: '600' }}>
                Quantity: {existingInterest.quantity} units
              </p>
              <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#6b7280' }}>
                Status: {existingInterest.status}
              </p>
              {existingInterest.periodDays && (
                <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>
                  Period: {existingInterest.periodDays} days
                </p>
              )}
            </div>
          )}
          <p style={{ marginBottom: '20px', fontSize: '14px', color: '#6b7280' }}>
            Would you like to view and manage your existing interest, or withdraw it and create a new one?
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <Button
              variant="secondary"
              onClick={() => setShowExistingInterestModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleWithdrawAndCreateNew}
            >
              Withdraw & Create New
            </Button>
            <Button
              variant="primary"
              onClick={handleViewExistingInterest}
            >
              View Existing Interest
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default ProductDetail;
