import fs from 'fs/promises';
import axios from 'axios';

// Function to geocode a location using OpenStreetMap Nominatim
async function geocodeLocation(city, country) {
  try {
    // Handle special cases or unknown locations
    if (!city || city === 'Unknown' || !country || country === 'Unknown') {
      return null;
    }
    
    // Skip if city or country is empty
    if (!city.trim() || !country.trim()) {
      return null;
    }
    
    // Special handling for common cases
    const locationQuery = `${city}, ${country}`;
    
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
    console.warn(`Geocoding failed for ${city}, ${country}:`, error.message);
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
      
      // Check if coordinates are placeholder values or invalid
      const isPlaceholderCoord = 
        (station.geo_lat === 40 && station.geo_long === -100) ||
        (station.geo_lat === 42 && station.geo_long === -100) ||
        (station.geo_lat === 12.4989994 && station.geo_long === 124.6746741) ||
        (station.geo_lat === 0 && station.geo_long === 0) ||
        (station.geo_lat >= -90 && station.geo_lat <= 90 && station.geo_long >= -180 && station.geo_long <= 180) === false;
      
      // Only try to geocode if we have valid city/country info and coordinates are placeholders
      const hasValidLocationInfo = 
        station.city && 
        station.city !== 'Unknown' && 
        station.city.trim() !== '' &&
        station.country && 
        station.country !== 'Unknown' && 
        station.country.trim() !== '';
      
      if (hasValidLocationInfo && isPlaceholderCoord) {
        stationsToGeocode++;
        
        // Create a cache key
        const cacheKey = `${station.city}|${station.country}`;
        
        // Check if we already have this location geocoded
        if (geocodedCache.has(cacheKey)) {
          const coords = geocodedCache.get(cacheKey);
          if (coords) {
            station.geo_lat = coords.latitude;
            station.geo_long = coords.longitude;
            geocodedStations++;
            console.log(`Using cached coordinates for ${station.city}, ${station.country}: ${coords.latitude}, ${coords.longitude}`);
          }
        } else {
          // Try to geocode this location
          const coords = await geocodeLocation(station.city, station.country);
          geocodedCache.set(cacheKey, coords);
          
          if (coords) {
            station.geo_lat = coords.latitude;
            station.geo_long = coords.longitude;
            geocodedStations++;
            console.log(`Geocoded ${station.city}, ${station.country}: ${coords.latitude}, ${coords.longitude}`);
          } else {
            console.log(`Failed to geocode ${station.city}, ${station.country}`);
          }
          
          // Add a small delay to respect API rate limits
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }
    
    console.log(`TV stations that needed geocoding: ${stationsToGeocode}`);
    console.log(`Successfully geocoded: ${geocodedStations}`);
    
    // Write the fixed data back to the file
    await fs.writeFile('./src/data/tvStationsWithUrlsFixed.json', JSON.stringify(tvStations, null, 2));
    
    console.log('Fixed TV stations data saved to tvStationsWithUrlsFixed.json');
  } catch (error) {
    console.error('Error fixing TV station coordinates:', error);
  }
}

// Read and process radio stations
async function fixRadioStations() {
  try {
    // Read the current radio stations file
    const radioStationsData = await fs.readFile('./src/data/radioStations.json', 'utf8');
    let radioStations = JSON.parse(radioStationsData);

    console.log(`Processing ${radioStations.length} radio stations...`);
    
    // Keep track of geocoded locations to avoid repeated API calls
    const geocodedCache = new Map();
    
    // Counter for stations that need geocoding
    let stationsToGeocode = 0;
    let geocodedStations = 0;
    
    // Process each station
    for (let i = 0; i < radioStations.length; i++) {
      const station = radioStations[i];
      
      // Check if coordinates are placeholder values (0,0) or other common placeholders
      const isPlaceholderCoord = 
        (station.geo_lat == 0 && station.geo_long == 0) ||
        (station.geo_lat === 40 && station.geo_long === -100) ||
        (station.geo_lat === 42 && station.geo_long === -100) ||
        (station.geo_lat === 12.4989994 && station.geo_long === 124.6746741) ||
        (station.geo_lat >= -90 && station.geo_lat <= 90 && station.geo_long >= -180 && station.geo_long <= 180) === false;
      
      // Only try to geocode if we have valid location info and coordinates are placeholders
      const hasValidLocationInfo = 
        (station.city && station.city !== 'Unknown' && station.city.trim() !== '') ||
        (station.state && station.state !== 'Unknown' && station.state.trim() !== '') ||
        (station.country && station.country !== 'Unknown' && station.country.trim() !== '');
      
      if (hasValidLocationInfo && isPlaceholderCoord) {
        stationsToGeocode++;
        
        // Create a cache key using available location information
        const locationParts = [];
        if (station.city && station.city !== 'Unknown' && station.city.trim() !== '') {
          locationParts.push(station.city);
        }
        if (station.state && station.state !== 'Unknown' && station.state.trim() !== '') {
          locationParts.push(station.state);
        }
        if (station.country && station.country !== 'Unknown' && station.country.trim() !== '') {
          locationParts.push(station.country);
        }
        const cacheKey = locationParts.join('|');
        
        // Skip if we don't have enough information
        if (locationParts.length === 0) {
          continue;
        }
        
        // Check if we already have this location geocoded
        if (geocodedCache.has(cacheKey)) {
          const coords = geocodedCache.get(cacheKey);
          if (coords) {
            station.geo_lat = coords.latitude;
            station.geo_long = coords.longitude;
            geocodedStations++;
            console.log(`Using cached coordinates for ${cacheKey}: ${coords.latitude}, ${coords.longitude}`);
          }
        } else {
          // Try to geocode this location
          // Use city if available, otherwise state, otherwise country
          let locationToGeocode = station.city || station.state || station.country;
          let country = station.country;
          
          // Skip if both are unknown
          if ((locationToGeocode === 'Unknown' || !locationToGeocode) && 
              (country === 'Unknown' || !country)) {
            continue;
          }
          
          // If locationToGeocode is unknown but we have a country, use the country
          if (locationToGeocode === 'Unknown' || !locationToGeocode) {
            locationToGeocode = country;
            country = '';
          }
          
          // If country is unknown, clear it
          if (country === 'Unknown') {
            country = '';
          }
          
          const coords = await geocodeLocation(locationToGeocode, country);
          geocodedCache.set(cacheKey, coords);
          
          if (coords) {
            station.geo_lat = coords.latitude;
            station.geo_long = coords.longitude;
            geocodedStations++;
            console.log(`Geocoded ${cacheKey}: ${coords.latitude}, ${coords.longitude}`);
          } else {
            console.log(`Failed to geocode ${cacheKey}`);
          }
          
          // Add a small delay to respect API rate limits
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }
    
    console.log(`Radio stations that needed geocoding: ${stationsToGeocode}`);
    console.log(`Successfully geocoded: ${geocodedStations}`);
    
    // Write the fixed data back to the file
    await fs.writeFile('./src/data/radioStationsFixed.json', JSON.stringify(radioStations, null, 2));
    
    console.log('Fixed radio stations data saved to radioStationsFixed.json');
  } catch (error) {
    console.error('Error fixing radio station coordinates:', error);
  }
}

// Run both functions
async function fixAllStationCoordinates() {
  await fixTVStations();
  await fixRadioStations();
}

fixAllStationCoordinates();