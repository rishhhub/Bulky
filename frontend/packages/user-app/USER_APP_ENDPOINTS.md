# User App – API endpoints used by normal (logged-in) users

All requests use base URL `/api` (see `packages/shared/services/api.js`).

## Auth (public – no token)

| Service        | Method | Path                    | Used in   |
|----------------|--------|-------------------------|-----------|
| authService    | POST   | /auth/otp/send          | Register  |
| authService    | POST   | /auth/register/otp      | Register  |
| authService    | POST   | /auth/login/otp/send    | Login     |
| authService    | POST   | /auth/login/otp         | Login     |
| authService    | POST   | /auth/register          | Login     |
| authService    | POST   | /auth/login             | Login     |

## Profile (authenticated)

| Service        | Method | Path                              | Used in   |
|----------------|--------|-----------------------------------|-----------|
| profileService | GET    | /profile                          | Profile   |
| profileService | PUT    | /profile                          | Profile   |
| profileService | POST   | /profile/password                 | Profile   |
| profileService | GET    | /profile/contacts                | Profile   |
| profileService | POST   | /profile/contacts/otp/send       | Profile   |
| profileService | POST   | /profile/contacts/otp/verify     | Profile   |
| profileService | GET    | /profile/addresses               | Profile, ProductDetail |
| profileService | POST   | /profile/addresses               | Profile   |
| profileService | PUT    | /profile/addresses/{id}          | Profile   |
| profileService | DELETE | /profile/addresses/{id}          | Profile   |
| profileService | GET    | /profile/payment-methods         | Profile   |
| profileService | POST   | /profile/payment-methods         | Profile   |
| profileService | PUT    | /profile/payment-methods/{id}    | Profile   |
| profileService | DELETE | /profile/payment-methods/{id}    | Profile   |
| profileService | PUT    | /profile/login-methods            | Profile   |

## Warehouses & logistics (authenticated)

| Service          | Method | Path                  | Used in      |
|------------------|--------|------------------------|--------------|
| warehouseService | GET    | /warehouses            | ProductDetail |
| warehouseService | GET    | /warehouses/{id}        | ProductDetail |
| warehouseService | POST   | /logistics/calculate    | ProductDetail |

## Interests & orders (authenticated)

| Service      | Method | Path                    | Used in      |
|--------------|--------|-------------------------|--------------|
| orderService | GET   | /interests/my            | Dashboard, ProductDetail |
| orderService | POST  | /interests               | ProductDetail |
| orderService | POST  | /interests/{id}/extend   | Dashboard    |
| orderService | POST  | /interests/{id}/withdraw | Dashboard, ProductDetail |
| orderService | PUT   | /interests/{id}          | ProductDetail |
| orderService | GET   | /interests/{id}          | ProductDetail |
| orderService | GET   | /orders/my               | Dashboard    |

## Payments (authenticated)

| Service         | Method | Path                    | Used in      |
|-----------------|--------|-------------------------|--------------|
| paymentService  | GET   | /payments/my              | Dashboard    |
| paymentService  | POST  | /payments/deposit         | ProductDetail |
| paymentService  | POST  | /payments/remaining       | Dashboard    |
| paymentService  | POST  | /payments/full-payment    | ProductDetail, Dashboard |

## Products & categories (public)

| Service         | Method | Path                    | Used in      |
|-----------------|--------|-------------------------|--------------|
| productService  | GET   | /products                | ProductList  |
| productService  | GET   | /products/{id}          | ProductDetail |
| productService  | POST  | /api/products/enrich     | ProductList (optional auth) |
| productService  | POST  | /api/products/enrich-single | ProductDetail (optional auth) |
| categoryService | GET   | /categories              | ProductList  |

## Reviews (authenticated for write; GET may be public)

| Service       | Method | Path                    | Used in      |
|---------------|--------|-------------------------|--------------|
| reviewService | GET   | /reviews/product/{productId} | ProductDetail |
| reviewService | POST  | /reviews                 | ProductDetail |
| reviewService | PUT   | /reviews/{id}            | ProductDetail |
| reviewService | DELETE| /reviews/{id}            | ProductDetail |

## Wishlist (authenticated)

| Service        | Method | Path              | Used in      |
|----------------|--------|-------------------|--------------|
| wishlistService| GET   | /wishlist          | ProductDetail |
| wishlistService| GET   | /wishlist/{productId} | ProductDetail |
| wishlistService| POST  | /wishlist          | ProductDetail |
| wishlistService| DELETE| /wishlist/{productId} | ProductDetail |

## Direct order (authenticated)

| Service            | Method | Path          | Used in      |
|--------------------|--------|---------------|--------------|
| directOrderService | POST  | /direct-order  | ProductDetail |

## Pincodes (authenticated for user lookup)

| Service        | Method | Path                    | Used in      |
|----------------|--------|-------------------------|--------------|
| pincodeService | GET   | /pincodes/{pincode}      | Profile, ProductDetail |
| pincodeService | GET   | /pincodes/serviceable    | (optional)   |
| pincodeService | GET   | /pincodes/states         | (optional)   |
| pincodeService | GET   | /pincodes/cities         | (optional)   |

## Notifications (authenticated)

| Service             | Method | Path                      | Used in   |
|---------------------|--------|---------------------------|-----------|
| notificationService | GET   | /notifications             | Dashboard |
| notificationService | GET   | /notifications/unread-count | Dashboard |
| notificationService | POST  | /notifications/{id}/read   | Dashboard |
| notificationService | POST  | /notifications/mark-all-read | Dashboard |

## Seller (authenticated – USER can check status)

| Service      | Method | Path            | Used in   |
|--------------|--------|-----------------|-----------|
| sellerService| GET   | /seller/status   | Profile   |
| sellerService| POST  | /seller/register | Profile   |
| sellerService| GET   | /seller/profile  | Profile   |
| sellerService| PUT   | /seller/profile  | Profile   |

---

Backend security must allow **authenticated** (any logged-in user, including USER role) for all of the above except Auth and Products/Categories. Backend logs every request/response (see `RequestResponseLoggingFilter`).
