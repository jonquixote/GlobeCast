import fs from 'fs/promises';
import axios from 'axios';

// Function to check if coordinates are valid
function isValidCoordinate(lat, lon) {
  // Check if coordinates are within valid ranges
  const validLat = lat >= -90 && lat <= 90;
  const validLon = lon >= -180 && lon <= 180;
  
  // Check if coordinates are not placeholder values
  const isPlaceholder = 
    (lat === 0 && lon === 0) ||
    (lat === 40 && lon === -100) ||
    (lat === 42 && lon === -100) ||
    (lat === 12.4989994 && lon === 124.6746741) ||
    (lat === 40 && lon === -98) ||
    (lat === 42 && lon === -98) ||
    (lat === 44 && lon === -98) ||
    (lat === 46 && lon === -98) ||
    (lat === 48 && lon === -98) ||
    (lat === 50 && lon === -98) ||
    (lat === 52 && lon === -98) ||
    (lat === 54 && lon === -98) ||
    (lat === 56 && lon === -98) ||
    (lat === 58 && lon === -98);
  
  return validLat && validLon && !isPlaceholder;
}

// Function to geocode a location using OpenStreetMap Nominatim
async function geocodeLocation(city, state, country) {
  try {
    // Handle special cases or unknown locations
    if ((!city || city === 'Unknown') && (!state || state === 'Unknown') && (!country || country === 'Unknown')) {
      return null;
    }
    
    // Build location query with available information
    const locationParts = [];
    if (city && city !== 'Unknown' && city.trim() !== '') {
      locationParts.push(city.trim());
    }
    if (state && state !== 'Unknown' && state.trim() !== '') {
      locationParts.push(state.trim());
    }
    if (country && country !== 'Unknown' && country.trim() !== '') {
      locationParts.push(country.trim());
    }
    
    if (locationParts.length === 0) {
      return null;
    }
    
    const locationQuery = locationParts.join(', ');
    
    // Use OpenStreetMap Nominatim API for geocoding
    const response = await axios.get('https://nominatim.openstreetmap.org/search', {
      params: {
        q: locationQuery,
        format: 'json',
        limit: 1
      },
      headers: {
        'User-Agent': 'GlobeMediaStreamer/1.0 (contact@example.com)'
      },
      timeout: 5000
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
    console.warn(`Geocoding failed for ${city}, ${state}, ${country}:`, error.message);
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
    let skippedStations = 0;
    
    // Process each station
    for (let i = 0; i < tvStations.length; i++) {
      const station = tvStations[i];
      
      // Check if coordinates are valid
      const hasValidCoords = isValidCoordinate(station.geo_lat, station.geo_long);
      
      // If coordinates are not valid, try to geocode
      if (!hasValidCoords) {
        // Only try to geocode if we have location info
        const hasLocationInfo = 
          (station.city && station.city !== 'Unknown') ||
          (station.country && station.country !== 'Unknown');
        
        if (hasLocationInfo) {
          stationsToGeocode++;
          
          // Create a cache key
          const cacheKey = `${station.city || ''}|${station.state || ''}|${station.country || ''}`;
          
          // Check if we already have this location geocoded
          if (geocodedCache.has(cacheKey)) {
            const coords = geocodedCache.get(cacheKey);
            if (coords) {
              station.geo_lat = coords.latitude;
              station.geo_long = coords.longitude;
              geocodedStations++;
              console.log(`Using cached coordinates for ${station.name} (${station.city}, ${station.country}): ${coords.latitude}, ${coords.longitude}`);
            } else {
              skippedStations++;
              console.log(`Skipping ${station.name} (${station.city}, ${station.country}): No cached coordinates`);
            }
          } else {
            // Try to geocode this location
            console.log(`Geocoding ${station.name} (${station.city}, ${station.country})...`);
            const coords = await geocodeLocation(station.city, station.state, station.country);
            geocodedCache.set(cacheKey, coords);
            
            if (coords) {
              station.geo_lat = coords.latitude;
              station.geo_long = coords.longitude;
              geocodedStations++;
              console.log(`Geocoded ${station.name} (${station.city}, ${station.country}): ${coords.latitude}, ${coords.longitude}`);
            } else {
              skippedStations++;
              console.log(`Failed to geocode ${station.name} (${station.city}, ${station.country})`);
            }
            
            // Add a small delay to respect API rate limits
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        } else {
          skippedStations++;
          console.log(`Skipping ${station.name}: No location information available`);
        }
      }
    }
    
    console.log(`TV stations that needed geocoding: ${stationsToGeocode}`);
    console.log(`Successfully geocoded: ${geocodedStations}`);
    console.log(`Skipped stations: ${skippedStations}`);
    
    // Write the fixed data back to the file
    await fs.writeFile('./src/data/tvStationsWithUrlsFixed.json', JSON.stringify(tvStations, null, 2));
    
    console.log('Fixed TV stations data saved to tvStationsWithUrlsFixed.json');
    return tvStations;
  } catch (error) {
    console.error('Error fixing TV station coordinates:', error);
    throw error;
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
    let skippedStations = 0;
    
    // Process each station
    for (let i = 0; i < radioStations.length; i++) {
      const station = radioStations[i];
      
      // Check if coordinates are valid
      const hasValidCoords = isValidCoordinate(station.geo_lat, station.geo_long);
      
      // If coordinates are not valid, try to geocode
      if (!hasValidCoords) {
        // Only try to geocode if we have location info
        const hasLocationInfo = 
          (station.city && station.city !== 'Unknown') ||
          (station.state && station.state !== 'Unknown') ||
          (station.country && station.country !== 'Unknown');
        
        if (hasLocationInfo) {
          stationsToGeocode++;
          
          // Create a cache key using available location information
          const locationParts = [];
          if (station.city && station.city !== 'Unknown') {
            locationParts.push(station.city);
          }
          if (station.state && station.state !== 'Unknown') {
            locationParts.push(station.state);
          }
          if (station.country && station.country !== 'Unknown') {
            locationParts.push(station.country);
          }
          
          const cacheKey = locationParts.join('|');
          
          // Skip if we don't have enough information
          if (locationParts.length === 0) {
            skippedStations++;
            console.log(`Skipping ${station.name}: No location information`);
            continue;
          }
          
          // Check if we already have this location geocoded
          if (geocodedCache.has(cacheKey)) {
            const coords = geocodedCache.get(cacheKey);
            if (coords) {
              station.geo_lat = coords.latitude;
              station.geo_long = coords.longitude;
              geocodedStations++;
              console.log(`Using cached coordinates for ${station.name} (${cacheKey}): ${coords.latitude}, ${coords.longitude}`);
            } else {
              skippedStations++;
              console.log(`Skipping ${station.name} (${cacheKey}): No cached coordinates`);
            }
          } else {
            // Try to geocode this location
            console.log(`Geocoding ${station.name} (${cacheKey})...`);
            
            // Use available location information
            const city = station.city && station.city !== 'Unknown' ? station.city : null;
            const state = station.state && station.state !== 'Unknown' ? station.state : null;
            const country = station.country && station.country !== 'Unknown' ? station.country : null;
            
            const coords = await geocodeLocation(city, state, country);
            geocodedCache.set(cacheKey, coords);
            
            if (coords) {
              station.geo_lat = coords.latitude;
              station.geo_long = coords.longitude;
              geocodedStations++;
              console.log(`Geocoded ${station.name} (${cacheKey}): ${coords.latitude}, ${coords.longitude}`);
            } else {
              skippedStations++;
              console.log(`Failed to geocode ${station.name} (${cacheKey})`);
            }
            
            // Add a small delay to respect API rate limits
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        } else {
          skippedStations++;
          console.log(`Skipping ${station.name}: No location information available`);
        }
      }
    }
    
    console.log(`Radio stations that needed geocoding: ${stationsToGeocode}`);
    console.log(`Successfully geocoded: ${geocodedStations}`);
    console.log(`Skipped stations: ${skippedStations}`);
    
    // Write the fixed data back to the file
    await fs.writeFile('./src/data/radioStationsFixed.json', JSON.stringify(radioStations, null, 2));
    
    console.log('Fixed radio stations data saved to radioStationsFixed.json');
    return radioStations;
  } catch (error) {
    console.error('Error fixing radio station coordinates:', error);
    throw error;
  }
}

// Run both functions
async function fixAllStationCoordinates() {
  try {
    console.log('Starting to fix station coordinates...');
    await fixTVStations();
    await fixRadioStations();
    console.log('All station coordinates fixed successfully!');
  } catch (error) {
    console.error('Error fixing station coordinates:', error);
  }
}

// If this script is run directly, execute the fix function
if (import.meta.url === `file://${process.argv[1]}`) {
  fixAllStationCoordinates();
}

export { fixTVStations, fixRadioStations, fixAllStationCoordinates };