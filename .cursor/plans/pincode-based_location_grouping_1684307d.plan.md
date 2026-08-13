---
name: Pincode-Based Location Grouping
overview: ""
todos: []
---

# Pincode-Based Location Grouping

## Problem Statement

Currently, OrderGroups are created by grouping all PENDING interests for a product by **productId only**, regardless of location. This causes issues:

1. **High Delivery Costs**: Orders from distant cities (e.g., Chennai and Varanasi) are grouped together, requiring expensive long-distance shipping that negates profits
2. **Inefficient Logistics**: Multiple delivery addresses in different regions increase logistics complexity and cost
3. **Profit Loss**: Delivery costs can exceed profit margins when orders are grouped without considering location

## Solution Overview

**Key Changes:**

1. **Pincode-Based Address Management**: Users/admins enter pincode, system auto-fetches city and state
2. **Serviceable Pincodes**: System maintains a list of serviceable pincodes
3. **City + Product Grouping**: OrderGroups are formed by **city + productId** (not just productId)
4. **Database-Driven**: States, cities, and pincodes stored in database with relationships

## Implementation Plan

### 1. Database Schema for Location Data

**New Entities:**

**State Entity:**

```java
@Entity
@Table(name = "states")
public class State {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(unique = true, nullable = false)
    private String code; // e.g., "TN", "UP", "MH"
    
    @Column(nullable = false)
    private String name; // e.g., "Tamil Nadu", "Uttar Pradesh"
    
    @OneToMany(mappedBy = "state")
    private List<City> cities;
}
```

**City Entity:**

```java
@Entity
@Table(name = "cities")
public class City {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String name; // e.g., "Chennai", "Varanasi"
    
    @ManyToOne
    @JoinColumn(name = "state_id", nullable = false)
    private State state;
    
    @OneToMany(mappedBy = "city")
    private List<Pincode> pincodes;
}
```

**Pincode Entity:**

```java
@Entity
@Table(name = "pincodes")
public class Pincode {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(unique = true, nullable = false, length = 6)
    private String code; // 6-digit pincode
    
    @ManyToOne
    @JoinColumn(name = "city_id", nullable = false)
    private City city;
    
    @Column(nullable = false)
    private Boolean serviceable; // Whether we deliver to this pincode
    
    @Column(name = "delivery_cost_multiplier", precision = 5, scale = 2)
    private BigDecimal deliveryCostMultiplier; // Optional: cost adjustment per pincode
}
```

**Relationships:**

- State (1) → (N) City
- City (1) → (N) Pincode
- Pincode lookup: `pincode → city → state`

### 2. Update Interest Entity

**Add Fields:**

- `pincode` (String, 6 digits) - User enters this
- `cityId` (Long) - Auto-fetched from pincode
- `stateId` (Long) - Auto-fetched from pincode (via city)
- `deliveryAddress` (String) - Full address (street, building, etc.) - still needed for delivery

**Remove:**

- No need to parse address to extract city/state (handled via pincode)

### 3. Update Warehouse Entity

**Add Fields:**

- `pincode` (String, 6 digits) - Admin enters this
- `cityId` (Long) - Auto-fetched from pincode
- `stateId` (Long) - Auto-fetched from pincode

**Keep:**

- `address` (String) - Full warehouse address
- `city`, `state` (String) - Can be kept for display, but cityId/stateId are source of truth

### 4. Pincode Lookup Service

**New Service: `PincodeLookupService`**

**Methods:**

```java
// Lookup city and state by pincode
PincodeInfo lookupPincode(String pincode);

// Check if pincode is serviceable
boolean isServiceable(String pincode);

// Get all serviceable pincodes for a city
List<Pincode> getServiceablePincodesByCity(Long cityId);

// Validate pincode format (6 digits)
boolean isValidPincodeFormat(String pincode);
```

**DTO:**

```java
public class PincodeInfo {
    private String pincode;
    private Long cityId;
    private String cityName;
    private Long stateId;
    private String stateName;
    private String stateCode;
    private Boolean serviceable;
}
```

### 5. Update OrderGroup Entity

**Add Fields:**

- `cityId` (Long) - City this group is for
- `groupingKey` (String) - Composite key: `{productId}_{cityId}`
- `primaryCity` (String) - City name (for display, denormalized)
- `primaryState` (String) - State name (for display, denormalized)

**Grouping Logic:**

- **PICKUP orders**: Group by `warehouseId` → Key: `{productId}_WAREHOUSE_{warehouseId}`
- **DELIVERY orders**: Group by `cityId` → Key: `{productId}_CITY_{cityId}`

### 6. Update Interest Creation/Update

**When User Creates Interest:**

**For DELIVERY:**

1. User enters: `deliveryAddress` (full address) + `pincode`
2. System looks up pincode → gets `cityId` and `stateId`
3. System validates pincode is serviceable
4. If not serviceable → Show error: "We don't deliver to this pincode"
5. If serviceable → Save interest with `pincode`, `cityId`, `stateId`

**For PICKUP:**

1. User selects warehouse
2. System gets warehouse's `pincode`, `cityId`, `stateId`
3. Save interest with warehouse's location info

**Validation:**

- Pincode must be 6 digits
- Pincode must exist in database
- Pincode must be serviceable (for DELIVERY)

### 7. Update Warehouse Creation/Update

**When Admin Creates Warehouse:**

1. Admin enters: `name`, `address`, `pincode`, `phone`, `hoursOfOperation`
2. System looks up pincode → gets `cityId` and `stateId`
3. System validates pincode exists
4. Save warehouse with `pincode`, `cityId`, `stateId`

**Auto-populate:**

- `city` and `state` fields can be auto-populated from pincode lookup (for display)

### 8. Update OrderGroup Creation Logic

**Modify `OrderGroupServiceImpl.checkThresholdForProduct()`:**

**New Flow:**

1. Get all PENDING interests for product
2. **Group interests by location:**

   - **PICKUP**: Group by `warehouseId`
   - **DELIVERY**: Group by `cityId`

3. **For each location group:**

   - Sum quantities within that location group
   - If threshold met → Create OrderGroup for that location group
   - If threshold not met → Keep interests as PENDING (wait for more in same city/warehouse)

**Key Method:**

```java
Map<String, List<Interest>> groupInterestsByLocation(List<Interest> interests) {
    Map<String, List<Interest>> groups = new HashMap<>();
    
    for (Interest interest : interests) {
        String groupingKey;
        if (interest.getLogisticsPreference() == PICKUP) {
            groupingKey = interest.getProductId() + "_WAREHOUSE_" + interest.getWarehouseId();
        } else { // DELIVERY
            groupingKey = interest.getProductId() + "_CITY_" + interest.getCityId();
        }
        
        groups.computeIfAbsent(groupingKey, k -> new ArrayList<>()).add(interest);
    }
    
    return groups;
}
```

### 9. Pincode Data Management

**Initial Data Load:**

- Create script/service to load Indian pincode data
- Source: India Post pincode database or similar
- Load: States → Cities → Pincodes

**Admin Interface:**

- View all pincodes
- Mark pincodes as serviceable/non-serviceable
- Bulk update serviceability by city/state
- Search pincodes by city/state

**Serviceability Rules:**

- Default: All pincodes non-serviceable
- Admin marks pincodes as serviceable
- Can mark entire city/state as serviceable (bulk operation)

### 10. Update Frontend Forms

**Interest Creation Form:**

- Add pincode input field (6 digits, numeric only)
- On pincode entry → Auto-fetch and display city/state
- Show error if pincode not serviceable
- Keep delivery address field (for full address)

**Warehouse Creation Form:**

- Add pincode input field
- Auto-fetch city/state on pincode entry
- Display fetched city/state (read-only)

**Address Display:**

- Show: "City, State (Pincode)" format
- Example: "Chennai, Tamil Nadu (600001)"

### 11. Update Financial Calculations

**Location-Aware Financials:**

- Each OrderGroup has a city/warehouse
- Delivery costs calculated per city group
- Profit calculations show location-specific margins
- Financial dashboard shows breakdown by city

### 12. API Endpoints

**New Endpoints:**

- `GET /api/pincodes/{pincode}` - Lookup pincode info
- `GET /api/pincodes/serviceable` - Get all serviceable pincodes
- `GET /api/cities` - Get all cities (with state info)
- `GET /api/states` - Get all states
- `GET /api/cities/{cityId}/pincodes` - Get pincodes for a city
- `POST /api/admin/pincodes/{pincode}/serviceable` - Mark pincode as serviceable
- `POST /api/admin/cities/{cityId}/serviceable` - Mark all pincodes in city as serviceable

## Data Flow

```

User enters pincode → PincodeLookupService → Returns cityId, stateId

↓

Validate serviceable

↓

Save Interest with location

↓

Group interests by cityId + productId

↓