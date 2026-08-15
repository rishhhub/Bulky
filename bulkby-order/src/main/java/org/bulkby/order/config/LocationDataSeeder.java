package org.bulkby.order.config;

import org.bulkby.order.model.City;
import org.bulkby.order.model.Pincode;
import org.bulkby.order.model.State;
import org.bulkby.order.repository.CityRepository;
import org.bulkby.order.repository.PincodeRepository;
import org.bulkby.order.repository.StateRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

/**
 * Seeds initial location data (States, Cities, Pincodes) if not already present.
 * This runs after the main DataInitializer.
 */
@Component
@Async 
// @Order(2) // Run after main DataInitializer
public class LocationDataSeeder implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(LocationDataSeeder.class);

    @Autowired
    private StateRepository stateRepository;

    @Autowired
    private CityRepository cityRepository;

    @Autowired
    private PincodeRepository pincodeRepository;

    @Override
    @Transactional
    public void run(String... args) {
        logger.info("Starting location data seeding...");

        // Seed states if not already present
        if (stateRepository.count() == 0) {
            seedStates();
        } else {
            logger.info("States already exist, skipping state seeding");
        }

        // Always seed cities (will skip existing ones)
        seedCities();

        // Always seed pincodes (will skip existing ones)
        seedPincodes();

        logger.info("Location data seeding completed");
    }

    private void seedStates() {
        logger.info("Seeding states...");
        
        String[][] states = {
            {"AP", "Andhra Pradesh"}, {"AR", "Arunachal Pradesh"}, {"AS", "Assam"},
            {"BR", "Bihar"}, {"CT", "Chhattisgarh"}, {"GA", "Goa"},
            {"GJ", "Gujarat"}, {"HR", "Haryana"}, {"HP", "Himachal Pradesh"},
            {"JK", "Jammu and Kashmir"}, {"JH", "Jharkhand"}, {"KA", "Karnataka"},
            {"KL", "Kerala"}, {"MP", "Madhya Pradesh"}, {"MH", "Maharashtra"},
            {"MN", "Manipur"}, {"ML", "Meghalaya"}, {"MZ", "Mizoram"},
            {"NL", "Nagaland"}, {"OR", "Odisha"}, {"PB", "Punjab"},
            {"RJ", "Rajasthan"}, {"SK", "Sikkim"}, {"TN", "Tamil Nadu"},
            {"TG", "Telangana"}, {"TR", "Tripura"}, {"UP", "Uttar Pradesh"},
            {"UK", "Uttarakhand"}, {"WB", "West Bengal"},
            {"AN", "Andaman and Nicobar Islands"}, {"CH", "Chandigarh"},
            {"DH", "Dadra and Nagar Haveli and Daman and Diu"}, {"DL", "Delhi"},
            {"LA", "Ladakh"}, {"LD", "Lakshadweep"}, {"PY", "Puducherry"}
        };

        for (String[] stateData : states) {
            State state = new State();
            state.setCode(stateData[0]);
            state.setName(stateData[1]);
            state.setActive(true);
            stateRepository.save(state);
        }
        
        logger.info("Seeded {} states", states.length);
    }

    private void seedCities() {
        logger.info("Seeding cities (will skip existing ones)...");
        
        // Major cities with their state codes
        String[][] cities = {
            {"Chennai", "TN"}, {"Coimbatore", "TN"}, {"Madurai", "TN"}, {"Trichy", "TN"},
            {"Varanasi", "UP"}, {"Lucknow", "UP"}, {"Kanpur", "UP"}, {"Agra", "UP"}, {"Allahabad", "UP"},
            {"Mumbai", "MH"}, {"Pune", "MH"}, {"Nagpur", "MH"}, {"Nashik", "MH"}, {"Aurangabad", "MH"},
            {"Bangalore", "KA"}, {"Mysore", "KA"}, {"Mangalore", "KA"}, {"Hubli", "KA"},
            {"New Delhi", "DL"},
            {"Kolkata", "WB"}, {"Durgapur", "WB"},
            {"Ahmedabad", "GJ"}, {"Surat", "GJ"}, {"Vadodara", "GJ"},
            {"Jaipur", "RJ"}, {"Jodhpur", "RJ"}, {"Udaipur", "RJ"},
            {"Chandigarh", "PB"},
            {"Kochi", "KL"}, {"Thiruvananthapuram", "KL"},
            {"Hyderabad", "TG"}, {"Warangal", "TG"},
            {"Bhopal", "MP"}, {"Indore", "MP"},
            {"Visakhapatnam", "AP"}, {"Vijayawada", "AP"},
            {"Bhubaneswar", "OR"},
            {"Dehradun", "UK"},
            {"Patna", "BR"},
            {"Raipur", "CT"}
        };

        int seeded = 0;
        for (String[] cityData : cities) {
            Optional<State> stateOpt = stateRepository.findByCode(cityData[1]);
            if (stateOpt.isPresent()) {
                // Check if city already exists
                Optional<City> existingCity = cityRepository.findByNameAndStateId(cityData[0], stateOpt.get().getId());
                if (existingCity.isEmpty()) {
                    City city = new City();
                    city.setName(cityData[0]);
                    city.setState(stateOpt.get());
                    city.setActive(true);
                    cityRepository.save(city);
                    seeded++;
                }
            }
        }
        
        logger.info("Seeded {} cities", seeded);
    }

    private void seedPincodes() {
        logger.info("Seeding sample pincodes (will skip existing ones)...");
        
        // Sample pincodes for major cities (including warehouse pincodes)
        String[][] pincodes = {
            // Chennai pincodes (including warehouse pincode 600032)
            {"600001", "Chennai", "TN"}, {"600002", "Chennai", "TN"}, {"600003", "Chennai", "TN"},
            {"600032", "Chennai", "TN"}, {"600004", "Chennai", "TN"}, {"600005", "Chennai", "TN"},
            {"641001", "Coimbatore", "TN"}, {"625001", "Madurai", "TN"},
            
            // Mumbai pincodes (including warehouse pincode 400053)
            {"400001", "Mumbai", "MH"}, {"400002", "Mumbai", "MH"}, {"400053", "Mumbai", "MH"},
            {"400004", "Mumbai", "MH"}, {"400005", "Mumbai", "MH"}, {"400006", "Mumbai", "MH"},
            {"400007", "Mumbai", "MH"}, {"400008", "Mumbai", "MH"}, {"400009", "Mumbai", "MH"},
            
            // Bangalore pincodes (including warehouse pincode 560100)
            {"560001", "Bangalore", "KA"}, {"560002", "Bangalore", "KA"}, {"560100", "Bangalore", "KA"},
            {"560003", "Bangalore", "KA"}, {"560004", "Bangalore", "KA"}, {"560005", "Bangalore", "KA"},
            {"570001", "Mysore", "KA"}, {"575001", "Mangalore", "KA"},
            
            // Delhi pincodes (including warehouse pincode 110001)
            {"110001", "New Delhi", "DL"}, {"110002", "New Delhi", "DL"}, {"110003", "New Delhi", "DL"},
            {"110004", "New Delhi", "DL"}, {"110005", "New Delhi", "DL"}, {"110006", "New Delhi", "DL"},
            
            // Pune pincodes
            {"411001", "Pune", "MH"}, {"411002", "Pune", "MH"}, {"411003", "Pune", "MH"},
            {"411004", "Pune", "MH"}, {"411005", "Pune", "MH"},
            
            // Hyderabad pincodes
            {"500001", "Hyderabad", "TG"}, {"500002", "Hyderabad", "TG"}, {"500003", "Hyderabad", "TG"},
            {"500004", "Hyderabad", "TG"}, {"500005", "Hyderabad", "TG"},
            
            // Kolkata pincodes
            {"700001", "Kolkata", "WB"}, {"700002", "Kolkata", "WB"}, {"700003", "Kolkata", "WB"},
            {"700004", "Kolkata", "WB"}, {"700005", "Kolkata", "WB"},
            
            // Ahmedabad pincodes
            {"380001", "Ahmedabad", "GJ"}, {"380002", "Ahmedabad", "GJ"}, {"380003", "Ahmedabad", "GJ"},
            {"395001", "Surat", "GJ"}, {"390001", "Vadodara", "GJ"},
            
            // Jaipur pincodes
            {"302001", "Jaipur", "RJ"}, {"302002", "Jaipur", "RJ"}, {"302003", "Jaipur", "RJ"},
            {"342001", "Jodhpur", "RJ"}, {"313001", "Udaipur", "RJ"},
            
            // Other major cities
            {"221001", "Varanasi", "UP"}, {"221002", "Varanasi", "UP"}, {"226001", "Lucknow", "UP"},
            {"208001", "Kanpur", "UP"}, {"282001", "Agra", "UP"},
            {"110017", "Chandigarh", "PB"},
            {"682001", "Kochi", "KL"}, {"695001", "Thiruvananthapuram", "KL"},
            {"462001", "Bhopal", "MP"}, {"452001", "Indore", "MP"},
            {"530001", "Visakhapatnam", "AP"}, {"520001", "Vijayawada", "AP"},
            {"751001", "Bhubaneswar", "OR"},
            {"248001", "Dehradun", "UK"},
            {"800001", "Patna", "BR"},
            {"492001", "Raipur", "CT"}
        };

        int seeded = 0;
        for (String[] pincodeData : pincodes) {
            Optional<State> stateOpt = stateRepository.findByCode(pincodeData[2]);
            if (stateOpt.isPresent()) {
                Optional<City> cityOpt = cityRepository.findByNameAndStateId(pincodeData[1], stateOpt.get().getId());
                if (cityOpt.isPresent()) {
                    // Check if pincode already exists
                    Optional<Pincode> existingPincode = pincodeRepository.findByCode(pincodeData[0]);
                    if (existingPincode.isEmpty()) {
                        Pincode pincode = new Pincode();
                        pincode.setCode(pincodeData[0]);
                        pincode.setCity(cityOpt.get());
                        pincode.setServiceable(true);
                        pincode.setActive(true);
                        pincodeRepository.save(pincode);
                        seeded++;
                    }
                }
            }
        }
        
        logger.info("Seeded {} sample pincodes", seeded);
        logger.info("Note: For production, import complete pincode database from India Post");
    }
}
