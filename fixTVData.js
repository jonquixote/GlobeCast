import fs from 'fs/promises';
import axios from 'axios';

// Function to geocode a location using OpenStreetMap Nominatim
async function geocodeLocation(city, country) {
  try {
    // Handle special cases or unknown locations
    if ((!city || city === 'Unknown') && (!country || country === 'Unknown')) {
      return null;
    }
    
    // Build query based on available information
    let locationQuery = '';
    if (city && city !== 'Unknown' && country && country !== 'Unknown') {
      locationQuery = `${city}, ${country}`;
    } else if (city && city !== 'Unknown') {
      locationQuery = city;
    } else if (country && country !== 'Unknown') {
      locationQuery = country;
    } else {
      return null;
    }
    
    console.log(`  Geocoding: ${locationQuery}`);
    
    // Use OpenStreetMap Nominatim API for geocoding
    const response = await axios.get('https://nominatim.openstreetmap.org/search', {
      params: {
        q: locationQuery,
        format: 'json',
        limit: 1
      },
      headers: {
        'User-Agent': 'GlobeMediaStreamer/1.0'
      }
    });
    
    if (response.data && response.data.length > 0) {
      const result = response.data[0];
      return {
        latitude: parseFloat(result.lat),
        longitude: parseFloat(result.lon)
      };
    }
    
    return null;
  } catch (error) {
    console.warn(`  Geocoding failed for ${city}, ${country}:`, error.message);
    return null;
  }
}

// Read and process TV stations
async function fixTVStations() {
  try {
    // Read the current TV stations file
    const tvStationsData = await fs.readFile('./src/data/tvStationsWithUrls.json', 'utf8');
    let tvStations = JSON.parse(tvStationsData);

    console.log(`Processing ${tvStations.length} TV stations...`);
    
    // Keep track of geocoded locations to avoid repeated API calls
    const geocodedCache = new Map();
    
    // Counter for stations that need geocoding
    let stationsToGeocode = 0;
    let geocodedStations = 0;
    
    // Process each station
    for (let i = 0; i < tvStations.length; i++) {
      const station = tvStations[i];
      
      // Check if coordinates are placeholder values
      const isPlaceholderCoord = 
        (station.geo_lat === 40 && station.geo_long === -98) ||
        (station.geo_lat === 40 && station.geo_long === -100) ||
        (station.geo_lat === 42 && station.geo_long === -100) ||
        (station.geo_lat === 42 && station.geo_long === -98) ||
        (station.geo_lat === 44 && station.geo_long === -98) ||
        (station.geo_lat === 46 && station.geo_long === -98) ||
        (station.geo_lat === 48 && station.geo_long === -98) ||
        (station.geo_lat === 50 && station.geo_long === -98) ||
        (station.geo_lat === 52 && station.geo_long === -98) ||
        (station.geo_lat === 54 && station.geo_long === -98) ||
        (station.geo_lat === 56 && station.geo_long === -98) ||
        (station.geo_lat === 58 && station.geo_long === -98) ||
        (station.geo_lat === 12.4989994 && station.geo_long === 124.6746741) ||
        (station.geo_lat === 0 && station.geo_long === 0);
      
      // Check if we have a valid country (not "Unknown")
      const hasValidCountry = station.country && station.country !== 'Unknown' && station.country.trim() !== '';
      
      // Try to geocode if coordinates are placeholders and we have a valid country
      if (isPlaceholderCoord && hasValidCountry) {
        stationsToGeocode++;
        console.log(`\nStation ${stationsToGeocode}: ${station.name}`);
        console.log(`  Current coords: ${station.geo_lat}, ${station.geo_long}`);
        console.log(`  Country: ${station.country}`);
        
        // Create a cache key using the country
        const cacheKey = station.country;
        
        // Check if we already have this location geocoded
        if (geocodedCache.has(cacheKey)) {
          const coords = geocodedCache.get(cacheKey);
          if (coords) {
            station.geo_lat = coords.latitude;
            station.geo_long = coords.longitude;
            geocodedStations++;
            console.log(`  Using cached coordinates for ${station.country}: ${coords.latitude}, ${coords.longitude}`);
          }
        } else {
          // Try to geocode the country
          const coords = await geocodeLocation(null, station.country);
          geocodedCache.set(cacheKey, coords);
          
          if (coords) {
            station.geo_lat = coords.latitude;
            station.geo_long = coords.longitude;
            geocodedStations++;
            console.log(`  New coordinates for ${station.country}: ${coords.latitude}, ${coords.longitude}`);
          } else {
            console.log(`  Failed to geocode country: ${station.country}`);
          }
          
          // Add a small delay to respect API rate limits
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
    }
    
    console.log(`\nTV stations that needed geocoding: ${stationsToGeocode}`);
    console.log(`Successfully geocoded: ${geocodedStations}`);
    
    // Write the fixed data back to the file
    await fs.writeFile('./src/data/tvStationsWithUrlsFixed.json', JSON.stringify(tvStations, null, 2));
    
    console.log('Fixed TV stations data saved to tvStationsWithUrlsFixed.json');
  } catch (error) {
    console.error('Error fixing TV station coordinates:', error);
  }
}

// Run the function
fixTVStations();