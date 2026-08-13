---
name: Pincode-Based Location Grouping with City/State Management
overview: Implement pincode-based address management with city/state auto-fetch and location-based order grouping to prevent distant city grouping and optimize delivery costs
todos:
  - id: pincode-1
    content: Create State, City, and Pincode entities with proper relationships and indexes
    status: completed
  - id: pincode-2
    content: Create repositories for State, City, and Pincode with query methods
    status: completed
  - id: pincode-3
    content: Create PincodeService interface and implementation with lookup and serviceability validation
    status: completed
  - id: pincode-4
    content: Create PincodeInfo DTO for pincode lookup responses
    status: completed
  - id: pincode-5
    content: Add pincode, cityId, stateId fields to Interest entity (nullable initially)
    status: completed
  - id: pincode-6
    content: Add pincode, cityId, stateId fields to Warehouse entity (nullable initially)
    status: completed
  - id: pincode-7
    content: Add cityId, groupingKey, cityName fields to OrderGroup entity (nullable initially)
    status: completed
  - id: pincode-8
    content: Update InterestServiceImpl to use pincode lookup and validate serviceability during interest creation
    status: completed
  - id: pincode-9
    content: Create LocationGroupingService interface and implementation to group interests by city
    status: completed
  - id: pincode-10
    content: Update OrderGroupServiceImpl to group interests by city before checking threshold
    status: completed
  - id: pincode-11
    content: Create PincodeController with public lookup and admin management endpoints
    status: completed
  - id: pincode-12
    content: Create StateController and CityController for admin location management
    status: completed
  - id: pincode-13
    content: Update InterestRequest DTO to include pincode field
    status: completed
  - id: pincode-14
    content: Create frontend PincodeInput component with auto-fetch city/state functionality
    status: completed
  - id: pincode-15
    content: Update Interest creation form to use pincode input with validation
    status: completed
  - id: pincode-16
    content: Update Warehouse creation form to use pincode input
    status: completed
  - id: pincode-17
    content: Create admin LocationManagement page for managing states/cities/pincodes
    status: completed
  - id: pincode-18
    content: Update OrderDetail and OrderOverview components to display city information
    status: completed
  - id: pincode-19
    content: Update FinancialCalculationService to show city-specific financials in summaries
    status: completed
  - id: pincode-20
    content: Create database migration script for new tables (states, cities, pincodes) and new fields
    status: completed
  - id: pincode-21
    content: Create data seeding script for initial Indian states, cities, and pincodes
    status: completed
  - id: pincode-22
    content: Create frontend service methods for pincode lookup API calls
    status: completed
---

# Pincode-Based Location Grouping with City/State Management

## Problem Statement

Currently, OrderGroups are created by grouping all PENDING interests for a product by **productId only**, regardless of location. This causes issues:

1. **High Delivery Costs**: Orders from distant cities (e.g., Chennai and Varanasi) are grouped together, requiring expensive long-distance shipping that negates profits
2. **Inefficient Logistics**: Multiple delivery addresses in different regions increase logistics complexity and cost
3. **Profit Loss**: Delivery costs can exceed profit margins when orders are grouped without considering location
4. **Address Inconsistency**: Manual address entry leads to inconsistent city/state data

## Solution Overview

**Pincode-Based Address Management:**

- Maintain States, Cities, and Pincodes in database
- Users/Admins enter **pincode** → System auto-fetches city and state
- System maintains list of **serviceable pincodes** (only these can be used)
- City and state are standardized and validated

**Location-Based Order Grouping:**

- Group orders by **Product + City** (city derived from pincode)
- PICKUP orders: Group by warehouse (warehouse has pincode → city)
- DELIVERY orders: Group by city (from pincode)
- Ensures orders from same city are grouped together, preventing distant city grouping

## Implementation Plan

### 1. Database Schema - Location Master Data

**Create new entities:**

#### `State` Entity

```java
@Entity
@Table(name = "states")
public class State {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(unique = true, nullable = false)
    private String code; // e.g., "TN", "UP", "MH"
    
    @Column(unique = true, nullable = false)
    private String name; // e.g., "Tamil Nadu", "Uttar Pradesh"
    
    @Column(nullable = false)
    private Boolean active = true;
}
```

#### `City` Entity

```java
@Entity
@Table(name = "cities")
public class City {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String name; // e.g., "Chennai", "Varanasi"
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "state_id", nullable = false)
    private State state;
    
    @Column(nullable = false)
    private Boolean active = true;
    
    // Composite unique constraint: (name, state_id)
}
```

#### `Pincode` Entity

```java
@Entity
@Table(name = "pincodes")
public class Pincode {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(unique = true, nullable = false, length = 6)
    private String code; // 6-digit pincode, e.g., "600001"
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "city_id", nullable = false)
    private City city;
    
    @Column(nullable = false)
    private Boolean serviceable = true; // Only serviceable pincodes can be used
    
    @Column(nullable = false)
    private Boolean active = true;
}
```

**Relationships:**

- State (1) → (N) City
- City (1) → (N) Pincode
- Pincode → City → State (for quick lookups)

### 2. Pincode Lookup Service

**Create `PincodeService`:**

```java
public interface PincodeService {
    // Lookup city and state by pincode
    PincodeInfo lookupByPincode(String pincode);
    
    // Validate if pincode is serviceable
    boolean isServiceable(String pincode);
    
    // Get all serviceable pincodes for a city
    List<Pincode> getServiceablePincodesByCity(Long cityId);
    
    // Get all cities in a state
    List<City> getCitiesByState(Long stateId);
}
```

**PincodeInfo DTO:**

```java
public class PincodeInfo {
    private String pincode;
    private String cityName;
    private Long cityId;
    private String stateName;
    private String stateCode;
    private Long stateId;
    private Boolean serviceable;
}
```

**Key Features:**

- Fast lookup by pincode (indexed)
- Validates serviceability
- Returns complete location hierarchy

### 3. Update Interest Entity

**Add fields to `Interest`:**

- `pincode` (String, 6 digits) - User enters this
- `cityId` (Long) - Auto-fetched from pincode
- `stateId` (Long) - Auto-fetched from pincode
- `deliveryAddress` (String) - Full address (street, area, etc.) - still needed for delivery

**For PICKUP:**

- `warehouseId` already exists
- Warehouse has pincode → can derive city

**For DELIVERY:**

- User enters: `pincode` + `deliveryAddress` (street address)
- System auto-fetches: `cityId`, `stateId` from pincode
- Validates pincode is serviceable

### 4. Update Warehouse Entity

**Add field to `Warehouse`:**

- `pincode` (String, 6 digits) - Admin enters this
- `cityId` (Long) - Auto-fetched from pincode
- `stateId` (Long) - Auto-fetched from pincode

**When admin creates/updates warehouse:**

- Enter pincode → System fetches city/state
- Validate pincode is serviceable

### 5. Update OrderGroup Entity

**Add location grouping fields:**

- `cityId` (Long) - City for this order group (for grouping)
- `groupingKey` (String) - Composite key: `{productId}_CITY_{cityId}`
- `cityName` (String) - Denormalized for quick display

**Grouping Logic:**

- **DELIVERY**: Group by `productId + cityId` → Key: `{productId}_CITY_{cityId}`
- **PICKUP**: Group by `productId + warehouseId` → Key: `{productId}_WAREHOUSE_{warehouseId}`
    - Warehouse's city is used for display/logistics planning

### 6. Update Interest Creation/Update Flow

**When user creates interest:**

**DELIVERY:**

1. User enters: `pincode` + `deliveryAddress` (street address)
2. System calls `PincodeService.lookupByPincode(pincode)`
3. Validate pincode is serviceable
4. Auto-populate: `cityId`, `stateId` from pincode lookup
5. Save interest with pincode, cityId, stateId, deliveryAddress

**PICKUP:**

1. User selects: `warehouseId`
2. System fetches warehouse → gets warehouse's pincode
3. System looks up city/state from warehouse's pincode
4. Save interest with warehouseId, cityId (from warehouse), stateId (from warehouse)

**Validation:**

- Pincode must be 6 digits
- Pincode must exist in database
- Pincode must be serviceable (`serviceable = true`)
- If validation fails → Show error: "Pincode not serviceable" or "Invalid pincode"

### 7. Update OrderGroup Creation Logic

**Modify `OrderGroupServiceImpl.checkThresholdForProduct()`:**

**New Flow:**

1. Get all PENDING interests for product
2. **Group interests by city** (using `cityId`):

      - **DELIVERY interests**: Group by `cityId` (from interest's pincode)
      - **PICKUP interests**: Group by warehouse's `cityId` (from warehouse's pincode)

3. **For each city group:**

      - Sum quantities within that city
      - If threshold met → Create OrderGroup for that city
      - If threshold not met → Keep interests as PENDING (wait for more in same city)

**Grouping Key:**

- `{productId}_CITY_{cityId}`

**Example:**

- Product 123, Chennai (cityId=5) → Key: `123_CITY_5`
- Product 123, Varanasi (cityId=12) → Key: `123_CITY_12`
- These are **separate** OrderGroups

### 8. Admin: Manage Location Master Data

**New Admin Features:**

**States Management:**

- View all states
- Add new state (code, name)
- Activate/deactivate state

**Cities Management:**

- View cities by state
- Add new city (name, state)
- Activate/deactivate city

**Pincodes Management:**

- View pincodes by city
- Bulk import pincodes (CSV)
- Mark pincode as serviceable/non-serviceable
- Search pincode

**Pincode Import:**

- CSV format: `pincode,city_name,state_code`
- System validates and creates/updates pincodes
- Sets serviceable flag

### 9. Update Frontend Forms

**Interest Creation Form (User):**

**DELIVERY:**

- **Pincode field** (required, 6 digits, with validation)
- **Auto-fetch city/state** on pincode entry (show loading, then display city/state)
- **Delivery Address field** (street address, area, etc.)
- Show error if pincode not serviceable

**PICKUP:**

- **Warehouse selection** (dropdown)
- System shows warehouse city (from warehouse's pincode)

**Warehouse Creation Form (Admin):**

- **Pincode field** (required, 6 digits)
- **Auto-fetch city/state** on pincode entry
- **Address field** (street address)
- Other warehouse fields (name, phone, hours, etc.)

### 10. Update Location Grouping Service

**Create `LocationGroupingService`:**

```java
public interface LocationGroupingService {
    // Generate grouping key for an interest
    String generateGroupingKey(Interest interest);
    
    // Group interests by location (city)
    Map<String, List<Interest>> groupInterestsByCity(List<Interest> interests);
    
    // Get city for an interest (from pincode or warehouse)
    Long getCityIdForInterest(Interest interest);
}
```

**Implementation:**

- For DELIVERY: Use `interest.getCityId()`
- For PICKUP: Fetch warehouse → get warehouse's `cityId`
- Generate key: `{productId}_CITY_{cityId}`

### 11. Update Financial Calculations

**Modify `FinancialCalculationService`:**

- Show city name in financial summaries
- Delivery costs are city-specific
- Profit calculations per city group

**Financial Summary should show:**

- City name (e.g., "Chennai", "Varanasi")
- Number of orders in that city
- Delivery costs for that city
- Profit margin for that city group

### 12. Data Migration and Seeding

**Initial Data Setup:**

1. **Seed States:**

      - All Indian states with codes
      - Can use enum or import from CSV

2. **Seed Cities:**

      - Major cities with state mapping
      - Can import from CSV

3. **Seed Pincodes:**

      - Import pincode database (India Post pincode data)
      - Format: pincode, city, state
      - Mark all as serviceable initially
      - Admin can later mark specific pincodes as non-serviceable

**Migration Script:**

- Create tables: states, cities, pincodes
- Import initial data
- Add foreign key constraints
- Create indexes on pincode.code, city.name, etc.

## Technical Details

### Pincode Lookup Flow

```
User enters pincode "600001"
    ↓
PincodeService.lookupByPincode("600001")
    ↓
Query: SELECT p.*, c.name as city_name, s.name as state_name, s.code as state_code
       FROM pincodes p
       JOIN cities c ON p.city_id = c.id
       JOIN states s ON c.state_id = s.id
       WHERE p.code = '600001' AND p.serviceable = true
    ↓
Returns: PincodeInfo {
    pincode: "600001",
    cityName: "Chennai",
    cityId: 5,
    stateName: "Tamil Nadu",
    stateCode: "TN",
    stateId: 1,
    serviceable: true
}
    ↓
Auto-populate cityId and stateId in Interest
```

### Grouping Key Format

**DELIVERY:**

```
{productId}_CITY_{cityId}
Example: 123_CITY_5 (Product 123, Chennai)
```

**PICKUP:**

```
{productId}_WAREHOUSE_{warehouseId}
Example: 123_WAREHOUSE_3 (Product 123, Warehouse 3)
Note: Warehouse's city is used for logistics planning
```

### Database Indexes

**Performance Optimizations:**

- Index on `pincodes.code` (unique, for fast lookup)
- Index on `pincodes.serviceable` (for filtering)
- Index on `cities.name` and `cities.state_id` (for queries)
- Index on `interests.city_id` (for grouping queries)
- Index on `order_groups.city_id` and `order_groups.grouping_key` (for queries)

## Files to Create/Modify

### New Backend Files:

1. `State.java` - State entity
2. `City.java` - City entity
3. `Pincode.java` - Pincode entity
4. `StateRepository.java` - State repository
5. `CityRepository.java` - City repository
6. `PincodeRepository.java` - Pincode repository
7. `PincodeService.java` - Pincode lookup service
8. `PincodeServiceImpl.java` - Implementation
9. `PincodeInfo.java` - DTO for pincode lookup
10. `LocationGroupingService.java` - Location grouping logic
11. `LocationGroupingServiceImpl.java` - Implementation
12. `StateController.java` - Admin API for states
13. `CityController.java` - Admin API for cities
14. `PincodeController.java` - Admin API for pincodes

### Modified Backend Files:

1. `OrderGroup.java` - Add cityId, groupingKey, cityName fields
2. `Interest.java` - Add pincode, cityId, stateId fields
3. `Warehouse.java` (logistics module) - Add pincode, cityId, stateId fields
4. `InterestServiceImpl.java` - Update to use pincode lookup
5. `OrderGroupServiceImpl.java` - Update grouping logic to use cityId
6. `InterestRequest.java` - Add pincode field, remove manual city/state
7. `WarehouseDTO.java` - Add pincode, cityId, stateId fields

### New Frontend Files:

1. `PincodeInput.jsx` - Pincode input component with auto-fetch
2. `LocationManagement.jsx` - Admin page for managing states, cities, pincodes
3. `PincodeLookup.jsx` - Component for pincode lookup with city/state display
4. `CitySelector.jsx` - City selection component (if needed)

### Modified Frontend Files:

1. `InterestRequest.jsx` / Interest creation form - Add pincode input, auto-fetch city/state
2. `WarehouseForm.jsx` - Add pincode input, auto-fetch city/state
3. `OrderDetail.jsx` - Show city information in order group
4. `OrderOverview.jsx` - Display city name in order group header
5. `FinancialDashboard.jsx` - Show financial breakdown by city
6. `AdminDashboard.jsx` - Add location management tab

## API Endpoints

### Public Endpoints:

- `GET /api/pincodes/{pincode}` - Lookup pincode info (returns city, state, serviceable status)
- `GET /api/states` - Get all active states
- `GET /api/cities?stateId={stateId}` - Get cities by state
- `GET /api/cities/{cityId}/pincodes` - Get serviceable pincodes for a city

### Admin Endpoints:

- `GET /api/admin/states` - Get all states (including inactive)
- `POST /api/admin/states` - Create new state
- `PUT /api/admin/states/{id}` - Update state
- `GET /api/admin/cities` - Get all cities
- `POST /api/admin/cities` - Create new city
- `PUT /api/admin/cities/{id}` - Update city
- `GET /api/admin/pincodes` - Get all pincodes (with filters)
- `POST /api/admin/pincodes` - Create/import pincodes
- `PUT /api/admin/pincodes/{id}` - Update pincode (mark serviceable/non-serviceable)
- `POST /api/admin/pincodes/bulk-import` - Bulk import pincodes from CSV
- `POST /api/admin/cities/{cityId}/mark-serviceable` - Mark all pincodes in city as serviceable
- `POST /api/admin/states/{stateId}/mark-serviceable` - Mark all pincodes in state as serviceable

## Data Flow Diagrams

### Interest Creation Flow (DELIVERY):

```
User enters pincode "600001"
    ↓
Frontend: Validate format (6 digits)
    ↓
API Call: GET /api/pincodes/600001
    ↓
Backend: PincodeService.lookupByPincode("600001")
    ↓
Database: SELECT p.*, c.id as city_id, c.name as city_name, 
          s.id as state_id, s.name as state_name, s.code as state_code
          FROM pincodes p
          JOIN cities c ON p.city_id = c.id
          JOIN states s ON c.state_id = s.id
          WHERE p.code = '600001' AND p.serviceable = true
    ↓
Response: { pincode: "600001", cityId: 5, cityName: "Chennai", 
            stateId: 1, stateName: "Tamil Nadu", serviceable: true }
    ↓
Frontend: Auto-populate city/state fields (read-only)
    ↓
User enters delivery address (street, area)
    ↓
Submit: POST /api/interests
    ↓
Backend: Save Interest with pincode, cityId, stateId, deliveryAddress
```

### Order Group Creation Flow:

```
Scheduled Job: checkThresholdForProduct(productId)
    ↓
Get all PENDING interests for productId
    ↓
Group by cityId:
 - DELIVERY: Use interest.cityId
 - PICKUP: Fetch warehouse → get warehouse.cityId
    ↓
For each city group:
 - Calculate totalQuantity
 - If totalQuantity >= minOrderQuantity:
      Create OrderGroup with:
    - productId
    - cityId
    - groupingKey: "{productId}_CITY_{cityId}"
    - cityName (denormalized)
    ↓
Add interests to OrderGroup
    ↓
Update interest status to THRESHOLD_MET
```

## Validation Rules

### Pincode Validation:

1. **Format**: Must be exactly 6 digits (numeric only)
2. **Existence**: Must exist in `pincodes` table
3. **Serviceability**: `pincodes.serviceable = true`
4. **Active**: `pincodes.active = true` and `cities.active = true` and `states.active = true`

### Interest Validation:

- **DELIVERY**: 
    - Pincode required
    - Pincode must be serviceable
    - Delivery address required (street address)
- **PICKUP**:
    - Warehouse required
    - Warehouse must be active
    - Warehouse's pincode must be serviceable

### OrderGroup Validation:

- Cannot add interest from different city to existing OrderGroup
- Grouping key must be unique per product+city combination
- All interests in group must have same cityId (for DELIVERY) or warehouse (for PICKUP)

## Migration Strategy

### Phase 1: Database Setup

1. Create new tables: `states`, `cities`, `pincodes`
2. Seed initial data (Indian states, major cities, pincodes)
3. Add indexes for performance

### Phase 2: Entity Updates

1. Add `pincode`, `cityId`, `stateId` to `Interest` (nullable initially)
2. Add `pincode`, `cityId`, `stateId` to `Warehouse` (nullable initially)
3. Add `cityId`, `groupingKey`, `cityName` to `OrderGroup` (nullable initially)

### Phase 3: Service Implementation

1. Implement `PincodeService` with lookup functionality
2. Implement `LocationGroupingService` with city-based grouping
3. Update `InterestService` to use pincode lookup
4. Update `OrderGroupService` to group by city

### Phase 4: Frontend Updates

1. Add pincode input component
2. Update interest creation form
3. Update warehouse creation form
4. Add location management admin page

### Phase 5: Data Migration

1. For existing interests:

      - Extract pincode from deliveryAddress (if possible)
      - Or mark for manual update
      - Backfill cityId/stateId from pincode

2. For existing warehouses:

      - Extract pincode from address
      - Backfill cityId/stateId

3. For existing OrderGroups:

      - Extract city from interests in group
      - Set cityId and groupingKey

### Phase 6: Validation & Testing

1. Test pincode lookup with various pincodes
2. Test interest creation with serviceable/non-serviceable pincodes
3. Test order grouping by city
4. Test financial calculations with city-based groups

## Edge Cases & Error Handling

### Pincode Not Found:

- Error: "Pincode {pincode} not found"
- Action: User must enter valid pincode

### Pincode Not Serviceable:

- Error: "We don't deliver to pincode {pincode}. Please select a different location."
- Action: Show list of nearby serviceable pincodes (optional)

### Invalid Pincode Format:

- Error: "Pincode must be 6 digits"
- Action: Validate on frontend before API call

### City Not Found for Pincode:

- Error: "Unable to determine city for pincode {pincode}"
- Action: Admin must fix pincode data

### Multiple Interests Same City, Threshold Not Met:

- Action: Keep interests as PENDING
- Wait for more interests in same city
- Show progress: "X more needed in {city} to meet threshold"

### Warehouse Pincode Not Serviceable:

- Error: "Warehouse pincode is not serviceable"
- Action: Admin must mark warehouse pincode as serviceable or update warehouse

## Benefits

1. **Standardized Location Data**: All locations use pincode → city → state hierarchy
2. **Automatic City/State**: No manual entry errors, consistent data
3. **Serviceability Control**: Admin controls which areas are serviceable
4. **Efficient Grouping**: Orders grouped by city, preventing distant city grouping
5. **Better Logistics**: City-based grouping simplifies fulfillment
6. **Profit Protection**: Delivery costs remain reasonable per city group
7. **Scalability**: Easy to add new cities/pincodes as business expands

## Testing Scenarios

1. **Pincode Lookup**:

      - Valid serviceable pincode → Returns city/state
      - Valid non-serviceable pincode → Returns error
      - Invalid pincode → Returns error
      - Non-existent pincode → Returns error

2. **Interest Creation**:

      - DELIVERY with serviceable pincode → Success
      - DELIVERY with non-serviceable pincode → Error
      - PICKUP with warehouse → Success (uses warehouse's city)

3. **Order Grouping**:

      - 5 interests in Chennai, 3 in Varanasi (same product, threshold=5)

→ Creates 1 group for Chennai (5 interests), 0 groups for Varanasi (waiting)

      - 10 interests in Chennai, 8 in Varanasi (threshold=5)

→ Creates 2 separate groups (one per city)

4. **Financial Calculations**:

      - Chennai group: Shows Chennai-specific costs and profit
      - Varanasi group: Shows Varanasi-specific costs and profit
      - Separate financial summaries per city

## Performance Considerations

1. **Pincode Lookup**: Index on `pincodes.code` for fast lookups
2. **Grouping Queries**: Index on `interests.city_id` and `interests.product_id`
3. **OrderGroup Queries**: Index on `order_groups.grouping_key` and `order_groups.city_id`
4. **Caching**: Consider caching pincode lookups (pincode → city/state rarely changes)

## Future Enhancements

1. **Region-Based Grouping**: Group nearby cities in same state (e.g., within 100km)
2. **Pincode-Level Delivery Cost**: Different delivery costs per pincode
3. **Serviceability Rules**: Rules-based serviceability (e.g., only urban pincodes)
4. **International Support**: Extend to support international addresses
5. **Address Autocomplete**: Suggest addresses based on pincode
6. **Delivery Time Estimates**: City-based delivery time estimates