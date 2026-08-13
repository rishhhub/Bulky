package org.bulkby.app.config;

import org.bulkby.auth.model.LoginMethod;
import org.bulkby.auth.model.PrimaryContactType;
import org.bulkby.auth.model.SellerProfile;
import org.bulkby.auth.model.User;
import org.bulkby.auth.repository.SellerProfileRepository;
import org.bulkby.auth.repository.UserRepository;
import org.bulkby.catalog.model.Category;
import org.bulkby.catalog.model.Product;
import org.bulkby.catalog.model.Review;
import org.bulkby.catalog.repository.CategoryRepository;
import org.bulkby.catalog.repository.ProductRepository;
import org.bulkby.catalog.repository.ReviewRepository;
import org.bulkby.logistics.model.Address;
import org.bulkby.logistics.model.Warehouse;
import org.bulkby.logistics.repository.WarehouseRepository;
import org.bulkby.common.service.PincodeService;
import org.bulkby.common.dto.PincodeInfo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Component
public class DataInitializer implements CommandLineRunner {
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private SellerProfileRepository sellerProfileRepository;
    
    @Autowired
    private PasswordEncoder passwordEncoder;
    
    @Autowired
    private WarehouseRepository warehouseRepository;
    
    @Autowired
    private ProductRepository productRepository;
    
    @Autowired
    private CategoryRepository categoryRepository;
    
    @Autowired
    private ReviewRepository reviewRepository;
    
    @Autowired(required = false)
    private PincodeService pincodeService;
    
    @Override
    public void run(String... args) throws Exception {
        // Create admin user
        User admin = createAdminUser();
        
        // Create test user for reviews
        User testUser = createTestUser();
        
        // Create default seller (so products can be listed by this seller)
        User defaultSeller = createDefaultSeller();
        
        // Create default categories
        List<Category> categories = createDefaultCategories();
        
        // Create default warehouses
        createDefaultWarehouses();
        
        // Create default products with categories and multiple images (listed by default seller, approved)
        List<Product> products = createDefaultProducts(categories, defaultSeller);
        
        // Create sample reviews
        if (testUser != null && products.size() > 0) {
            createSampleReviews(testUser, products);
        }
    }
    
    private User createAdminUser() {
        if (!userRepository.existsByEmail("admin@rish.com")) {
            User admin = new User();
            admin.setEmail("admin@rish.com");
            admin.setPasswordHash(passwordEncoder.encode("password"));
            admin.setFirstName("Administrator");
            admin.setMiddleName(null);
            admin.setLastName("User");
            admin.setPrimaryContactType(PrimaryContactType.EMAIL);
            
            // Set login methods
            Set<LoginMethod> loginMethods = new HashSet<>();
            loginMethods.add(LoginMethod.PASSWORD);
            admin.setLoginMethods(loginMethods);
            
            admin.setRole(User.Role.ADMIN);
            admin.setEnabled(true);
            
            userRepository.save(admin);
            System.out.println("Admin user created successfully!");
            System.out.println("Email: admin@rish.com");
            System.out.println("Password: password");
            return admin;
        } else {
            System.out.println("Admin user already exists.");
            return userRepository.findByEmail("admin@rish.com").orElse(null);
        }
    }
    
    private User createTestUser() {
        if (!userRepository.existsByEmail("user@test.com")) {
            User user = new User();
            user.setEmail("user@test.com");
            user.setPasswordHash(passwordEncoder.encode("password"));
            user.setFirstName("Test");
            user.setMiddleName(null);
            user.setLastName("User");
            user.setPrimaryContactType(PrimaryContactType.EMAIL);
            
            // Set login methods
            Set<LoginMethod> loginMethods = new HashSet<>();
            loginMethods.add(LoginMethod.PASSWORD);
            user.setLoginMethods(loginMethods);
            
            user.setRole(User.Role.USER);
            user.setEnabled(true);
            
            userRepository.save(user);
            System.out.println("Test user created successfully!");
            System.out.println("Email: user@test.com");
            System.out.println("Password: password");
            return user;
        } else {
            System.out.println("Test user already exists.");
            return userRepository.findByEmail("user@test.com").orElse(null);
        }
    }
    
    private User createDefaultSeller() {
        String sellerEmail = "seller@bulkby.com";
        User seller = userRepository.findByEmail(sellerEmail).orElse(null);
        if (seller != null) {
            if (sellerProfileRepository.findByUserId(seller.getId()).isPresent()) {
                System.out.println("Default seller already exists.");
                return seller;
            }
            // User exists but no profile – create approved profile
            seller.setRole(User.Role.SELLER);
            seller = userRepository.save(seller);
            SellerProfile profile = new SellerProfile();
            profile.setUser(seller);
            profile.setCompanyName("BulkBy Demo Supplies Pvt Ltd");
            profile.setCompanyAddress("123 Industrial Area, Andheri East, Mumbai 400053");
            profile.setPanNumber("ABCDE1234F");
            profile.setGstin("27ABCDE1234F1Z5");
            profile.setProfileStatus(SellerProfile.ProfileStatus.APPROVED);
            profile.setApprovedAt(LocalDateTime.now());
            sellerProfileRepository.save(profile);
            System.out.println("Default seller profile created for existing user.");
            return seller;
        }
        seller = new User();
        seller.setEmail(sellerEmail);
        seller.setPasswordHash(passwordEncoder.encode("password"));
        seller.setFirstName("BulkBy");
        seller.setMiddleName(null);
        seller.setLastName("Default Seller");
        seller.setPrimaryContactType(PrimaryContactType.EMAIL);
        seller.setPhone("+91-9876543210");
        Set<LoginMethod> loginMethods = new HashSet<>();
        loginMethods.add(LoginMethod.PASSWORD);
        seller.setLoginMethods(loginMethods);
        seller.setRole(User.Role.SELLER);
        seller.setEnabled(true);
        seller = userRepository.save(seller);
        SellerProfile profile = new SellerProfile();
        profile.setUser(seller);
        profile.setCompanyName("BulkBy Demo Supplies Pvt Ltd");
        profile.setCompanyAddress("123 Industrial Area, Andheri East, Mumbai 400053");
        profile.setPanNumber("ABCDE1234F");
        profile.setGstin("27ABCDE1234F1Z5");
        profile.setProfileStatus(SellerProfile.ProfileStatus.APPROVED);
        profile.setApprovedAt(LocalDateTime.now());
        sellerProfileRepository.save(profile);
        System.out.println("Default seller created successfully!");
        System.out.println("Email: seller@bulkby.com");
        System.out.println("Password: password");
        return seller;
    }
    
    private List<Category> createDefaultCategories() {
        List<Category> categories = new ArrayList<>();
        
        if (categoryRepository.count() == 0) {
            // Main categories
            Category foodCategory = new Category();
            foodCategory.setName("Food & Beverages");
            foodCategory.setDescription("Food and beverage products");
            foodCategory.setParent(null);
            foodCategory = categoryRepository.save(foodCategory);
            categories.add(foodCategory);
            
            Category officeCategory = new Category();
            officeCategory.setName("Office Supplies");
            officeCategory.setDescription("Office and stationery supplies");
            officeCategory.setParent(null);
            officeCategory = categoryRepository.save(officeCategory);
            categories.add(officeCategory);
            
            Category homeCategory = new Category();
            homeCategory.setName("Home & Living");
            homeCategory.setDescription("Home and living products");
            homeCategory.setParent(null);
            homeCategory = categoryRepository.save(homeCategory);
            categories.add(homeCategory);
            
            // Subcategories under Food & Beverages
            Category beveragesCategory = new Category();
            beveragesCategory.setName("Beverages");
            beveragesCategory.setDescription("Drinks and beverages");
            beveragesCategory.setParent(foodCategory);
            beveragesCategory = categoryRepository.save(beveragesCategory);
            categories.add(beveragesCategory);
            
            Category snacksCategory = new Category();
            snacksCategory.setName("Snacks");
            snacksCategory.setDescription("Snacks and treats");
            snacksCategory.setParent(foodCategory);
            snacksCategory = categoryRepository.save(snacksCategory);
            categories.add(snacksCategory);
            
            // Subcategories under Office Supplies
            Category writingCategory = new Category();
            writingCategory.setName("Writing Supplies");
            writingCategory.setDescription("Pens, pencils, and writing materials");
            writingCategory.setParent(officeCategory);
            writingCategory = categoryRepository.save(writingCategory);
            categories.add(writingCategory);
            
            Category paperCategory = new Category();
            paperCategory.setName("Paper Products");
            paperCategory.setDescription("Paper and paper products");
            paperCategory.setParent(officeCategory);
            paperCategory = categoryRepository.save(paperCategory);
            categories.add(paperCategory);
            
            // Subcategories under Home & Living
            Category lightingCategory = new Category();
            lightingCategory.setName("Lighting");
            lightingCategory.setDescription("Lighting products");
            lightingCategory.setParent(homeCategory);
            lightingCategory = categoryRepository.save(lightingCategory);
            categories.add(lightingCategory);
            
            Category exerciseCategory = new Category();
            exerciseCategory.setName("Exercise Equipment");
            exerciseCategory.setDescription("Fitness and exercise equipment");
            exerciseCategory.setParent(homeCategory);
            exerciseCategory = categoryRepository.save(exerciseCategory);
            categories.add(exerciseCategory);
            
            System.out.println("Created default categories");
        } else {
            System.out.println("Categories already exist. Skipping default category creation.");
            categories = categoryRepository.findAll();
        }
        
        return categories;
    }
    
    private void createDefaultWarehouses() {
        if (warehouseRepository.count() == 0) {
            // Warehouse 1: Mumbai Distribution Center
            Warehouse warehouse1 = new Warehouse();
            warehouse1.setName("Mumbai Distribution Center");
            warehouse1.setPhone("+91-22-1234-5678");
            warehouse1.setHoursOfOperation("Mon-Fri 9AM-6PM, Sat 10AM-2PM");
            warehouse1.setActive(true);
            
            Address address1 = new Address();
            address1.setStreet("123 Industrial Area, Andheri East");
            address1.setPincode("400053");
            
            // Lookup cityId and stateId from pincode
            if (pincodeService != null) {
                PincodeInfo pincodeInfo = pincodeService.lookupByPincode("400053");
                if (pincodeInfo != null) {
                    address1.setCityId(pincodeInfo.getCityId());
                    address1.setStateId(pincodeInfo.getStateId());
                }
            }
            
            warehouse1.setAddress(address1);
            warehouseRepository.save(warehouse1);
            System.out.println("Created default warehouse: Mumbai Distribution Center");
            
            // Warehouse 2: Delhi Hub
            Warehouse warehouse2 = new Warehouse();
            warehouse2.setName("Delhi Hub");
            warehouse2.setPhone("+91-11-2345-6789");
            warehouse2.setHoursOfOperation("Mon-Fri 8AM-6PM");
            warehouse2.setActive(true);
            
            Address address2 = new Address();
            address2.setStreet("456 Commercial Complex, Connaught Place");
            address2.setPincode("110001");
            
            // Lookup cityId and stateId from pincode
            if (pincodeService != null) {
                PincodeInfo pincodeInfo = pincodeService.lookupByPincode("110001");
                if (pincodeInfo != null) {
                    address2.setCityId(pincodeInfo.getCityId());
                    address2.setStateId(pincodeInfo.getStateId());
                }
            }
            
            warehouse2.setAddress(address2);
            warehouseRepository.save(warehouse2);
            System.out.println("Created default warehouse: Delhi Hub");
            
            // Warehouse 3: Bangalore Hub
            Warehouse warehouse3 = new Warehouse();
            warehouse3.setName("Bangalore Hub");
            warehouse3.setPhone("+91-80-3456-7890");
            warehouse3.setHoursOfOperation("Mon-Fri 9AM-5PM");
            warehouse3.setActive(true);
            
            Address address3 = new Address();
            address3.setStreet("789 Electronics City Phase 1");
            address3.setPincode("560100");
            
            // Lookup cityId and stateId from pincode
            if (pincodeService != null) {
                PincodeInfo pincodeInfo = pincodeService.lookupByPincode("560100");
                if (pincodeInfo != null) {
                    address3.setCityId(pincodeInfo.getCityId());
                    address3.setStateId(pincodeInfo.getStateId());
                }
            }
            
            warehouse3.setAddress(address3);
            warehouseRepository.save(warehouse3);
            System.out.println("Created default warehouse: Bangalore Hub");
            
            // Warehouse 4: Chennai Distribution Center
            Warehouse warehouse4 = new Warehouse();
            warehouse4.setName("Chennai Distribution Center");
            warehouse4.setPhone("+91-44-4567-8901");
            warehouse4.setHoursOfOperation("Mon-Fri 9AM-6PM");
            warehouse4.setActive(true);
            
            Address address4 = new Address();
            address4.setStreet("321 Industrial Estate, Guindy");
            address4.setPincode("600032");
            
            // Lookup cityId and stateId from pincode
            if (pincodeService != null) {
                PincodeInfo pincodeInfo = pincodeService.lookupByPincode("600032");
                if (pincodeInfo != null) {
                    address4.setCityId(pincodeInfo.getCityId());
                    address4.setStateId(pincodeInfo.getStateId());
                }
            }
            
            warehouse4.setAddress(address4);
            warehouseRepository.save(warehouse4);
            System.out.println("Created default warehouse: Chennai Distribution Center");
        } else {
            System.out.println("Warehouses already exist. Skipping default warehouse creation.");
        }
    }
    
    private List<Product> createDefaultProducts(List<Category> categories, User defaultSeller) {
        List<Product> products = new ArrayList<>();
        
        if (productRepository.count() == 0 && defaultSeller != null) {
            // Find categories (including subcategories)
            Category beveragesCategory = categories.stream()
                    .filter(c -> c.getName().equals("Beverages") && c.getParent() != null)
                    .findFirst()
                    .orElse(null);
            Category snacksCategory = categories.stream()
                    .filter(c -> c.getName().equals("Snacks") && c.getParent() != null)
                    .findFirst()
                    .orElse(null);
            Category writingCategory = categories.stream()
                    .filter(c -> c.getName().equals("Writing Supplies") && c.getParent() != null)
                    .findFirst()
                    .orElse(null);
            Category paperCategory = categories.stream()
                    .filter(c -> c.getName().equals("Paper Products") && c.getParent() != null)
                    .findFirst()
                    .orElse(null);
            Category lightingCategory = categories.stream()
                    .filter(c -> c.getName().equals("Lighting") && c.getParent() != null)
                    .findFirst()
                    .orElse(null);
            Category exerciseCategory = categories.stream()
                    .filter(c -> c.getName().equals("Exercise Equipment") && c.getParent() != null)
                    .findFirst()
                    .orElse(null);
            
            // Product 1: Bulk Coffee Beans
            Product product1 = new Product();
            product1.setName("Premium Coffee Beans - Bulk Pack");
            product1.setDescription("High-quality arabica coffee beans, perfect for cafes and restaurants. Packaged in 5kg bags.");
            product1.setPrice(new BigDecimal("45.99"));
            product1.setMinOrderQuantity(10);
            product1.setCategory(beveragesCategory);
            product1.setImageUrl("https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=500");
            product1.setImageUrls(new ArrayList<>(List.of(
                    "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=500",
                    "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500"
            )));
            product1.setWeightPerUnit(new BigDecimal("5.0"));
            product1.setBaseDeliveryCost(new BigDecimal("10.00"));
            product1.setActive(true);
            setSellerAndPaymentFields(product1, defaultSeller, new BigDecimal("39.09"), new BigDecimal("10.00"));
            product1 = productRepository.save(product1);
            products.add(product1);
            
            // Product 2: Bulk Snacks
            Product product2 = new Product();
            product2.setName("Assorted Snacks Variety Pack");
            product2.setDescription("Mixed variety pack of premium snacks including chips, nuts, and cookies. Perfect for offices and events.");
            product2.setPrice(new BigDecimal("25.50"));
            product2.setMinOrderQuantity(20);
            product2.setCategory(snacksCategory);
            product2.setImageUrl("https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=500");
            product2.setImageUrls(new ArrayList<>(List.of("https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=500")));
            product2.setWeightPerUnit(new BigDecimal("2.5"));
            product2.setBaseDeliveryCost(new BigDecimal("8.00"));
            product2.setActive(true);
            setSellerAndPaymentFields(product2, defaultSeller, new BigDecimal("21.68"), new BigDecimal("8.00"));
            product2 = productRepository.save(product2);
            products.add(product2);
            
            // Product 3: Office Pens
            Product product3 = new Product();
            product3.setName("Premium Ballpoint Pens - Bulk Set");
            product3.setDescription("Smooth-writing ballpoint pens in assorted colors. Pack of 100 pens.");
            product3.setPrice(new BigDecimal("15.99"));
            product3.setMinOrderQuantity(50);
            product3.setCategory(writingCategory);
            product3.setImageUrl("https://images.unsplash.com/photo-1583484963886-cce23f04cdb3?w=500");
            product3.setImageUrls(new ArrayList<>(List.of("https://images.unsplash.com/photo-1583484963886-cce23f04cdb3?w=500")));
            product3.setWeightPerUnit(new BigDecimal("0.1"));
            product3.setBaseDeliveryCost(new BigDecimal("5.00"));
            product3.setActive(true);
            setSellerAndPaymentFields(product3, defaultSeller, new BigDecimal("13.59"), new BigDecimal("5.00"));
            product3 = productRepository.save(product3);
            products.add(product3);
            
            // Product 4: Copy Paper
            Product product4 = new Product();
            product4.setName("A4 Copy Paper - Ream Pack");
            product4.setDescription("High-quality A4 copy paper, 80gsm. Pack of 10 reams (5000 sheets).");
            product4.setPrice(new BigDecimal("35.00"));
            product4.setMinOrderQuantity(10);
            product4.setCategory(paperCategory);
            product4.setImageUrl("https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=500");
            product4.setImageUrls(new ArrayList<>(List.of("https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=500")));
            product4.setWeightPerUnit(new BigDecimal("2.3"));
            product4.setBaseDeliveryCost(new BigDecimal("7.00"));
            product4.setActive(true);
            setSellerAndPaymentFields(product4, defaultSeller, new BigDecimal("29.75"), new BigDecimal("7.00"));
            product4 = productRepository.save(product4);
            products.add(product4);
            
            // Product 5: LED Bulbs
            Product product5 = new Product();
            product5.setName("Energy-Efficient LED Bulbs - Bulk Pack");
            product5.setDescription("Long-lasting LED bulbs, 9W equivalent to 60W. Pack of 50 bulbs.");
            product5.setPrice(new BigDecimal("120.00"));
            product5.setMinOrderQuantity(20);
            product5.setCategory(lightingCategory);
            product5.setImageUrl("https://images.unsplash.com/photo-1513151233558-d860c5398176?w=500");
            product5.setImageUrls(new ArrayList<>(List.of("https://images.unsplash.com/photo-1513151233558-d860c5398176?w=500")));
            product5.setWeightPerUnit(new BigDecimal("0.15"));
            product5.setBaseDeliveryCost(new BigDecimal("12.00"));
            product5.setActive(true);
            setSellerAndPaymentFields(product5, defaultSeller, new BigDecimal("102.00"), new BigDecimal("12.00"));
            product5 = productRepository.save(product5);
            products.add(product5);
            
            // Product 6: Yoga Mats
            Product product6 = new Product();
            product6.setName("Premium Yoga Mats - Bulk Order");
            product6.setDescription("Non-slip, eco-friendly yoga mats. Perfect for gyms and fitness centers. Pack of 25.");
            product6.setPrice(new BigDecimal("350.00"));
            product6.setMinOrderQuantity(10);
            product6.setCategory(exerciseCategory);
            product6.setImageUrl("https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=500");
            product6.setImageUrls(new ArrayList<>(List.of("https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=500")));
            product6.setWeightPerUnit(new BigDecimal("1.2"));
            product6.setBaseDeliveryCost(new BigDecimal("15.00"));
            product6.setActive(true);
            setSellerAndPaymentFields(product6, defaultSeller, new BigDecimal("297.50"), new BigDecimal("15.00"));
            product6 = productRepository.save(product6);
            products.add(product6);
            
            System.out.println("Created " + products.size() + " default products");
        } else {
            System.out.println("Products already exist. Skipping default product creation.");
            products = productRepository.findAll();
        }
        
        return products;
    }
    
    /**
     * Sets seller attribution and payment fields used for "amount to pay seller" on admin seller order screen:
     * totalQuantity × (costPerUnit + deliveryCostPerMinOrder / minOrderQuantity)
     */
    private void setSellerAndPaymentFields(Product product, User seller, BigDecimal costPerUnit, BigDecimal deliveryCostPerMinOrder) {
        product.setSeller(seller);
        product.setCreatedBy(Product.CreatedBy.SELLER);
        product.setRequiresApproval(true);
        product.setApprovalStatus(Product.ApprovalStatus.APPROVED);
        product.setApprovedAt(LocalDateTime.now());
        product.setCostPerUnit(costPerUnit);
        product.setDeliveryCostPerMinOrder(deliveryCostPerMinOrder);
    }
    
    private void createSampleReviews(User user, List<Product> products) {
        if (reviewRepository.count() == 0 && products.size() >= 3) {
            // Review for Product 1
            Review review1 = new Review();
            review1.setProduct(products.get(0));
            review1.setUserId(user.getId());
            review1.setRating(5);
            review1.setComment("Excellent quality coffee beans! Great value for bulk orders.");
            reviewRepository.save(review1);
            
            // Review for Product 2
            Review review2 = new Review();
            review2.setProduct(products.get(1));
            review2.setUserId(user.getId());
            review2.setRating(4);
            review2.setComment("Good variety pack, perfect for office snacks.");
            reviewRepository.save(review2);
            
            // Review for Product 3
            Review review3 = new Review();
            review3.setProduct(products.get(2));
            review3.setUserId(user.getId());
            review3.setRating(5);
            review3.setComment("Smooth writing pens, great for bulk office supplies.");
            reviewRepository.save(review3);
            
            System.out.println("Created sample reviews");
        } else {
            System.out.println("Reviews already exist. Skipping sample review creation.");
        }
    }
}
