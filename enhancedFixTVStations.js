import fs from 'fs/promises';
import axios from 'axios';

// Function to check if coordinates are valid
function isValidCoordinate(lat, lon) {
  // Check if coordinates are numbers
  if (typeof lat !== 'number' || typeof lon !== 'number') {
    return false;
  }
  
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
    (lat === 58 && lon === -98) ||
    // Additional placeholder patterns
    (Math.abs(lat) < 1 && Math.abs(lon) < 1); // Very close to (0,0)
  
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
    if (country && country !== 'Unknown' && country.trim() !== '') {
      locationParts.push(country.trim());
    }
    if (state && state !== 'Unknown' && state.trim() !== '') {
      locationParts.push(state.trim());
    }
    if (city && city !== 'Unknown' && city.trim() !== '') {
      locationParts.push(city.trim());
    }
    
    if (locationParts.length === 0) {
      return null;
    }
    
    const locationQuery = locationParts.join(', ');
    
    console.log(`Geocoding location: ${locationQuery}`);
    
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

// Function to find stations with invalid coordinates
async function findInvalidStations(data, dataType) {
  console.log(`\nChecking ${data.length} ${dataType} stations for invalid coordinates...`);
  
  const invalidStations = [];
  
  for (let i = 0; i < data.length; i++) {
    const station = data[i];
    const hasValidCoords = isValidCoordinate(station.geo_lat, station.geo_long);
    
    if (!hasValidCoords) {
      invalidStations.push({
        index: i,
        station: station
      });
    }
  }
  
  console.log(`Found ${invalidStations.length} ${dataType} stations with invalid coordinates.`);
  return invalidStations;
}

// Function to fix station coordinates
async function fixStationCoordinates(station, geocodedCache) {
  // Create a cache key
  const cacheKey = `${station.city || ''}|${station.state || ''}|${station.country || ''}`;
  
  // Check if we already have this location geocoded
  if (geocodedCache.has(cacheKey)) {
    const coords = geocodedCache.get(cacheKey);
    if (coords) {
      return {
        success: true,
        coordinates: coords,
        usedCache: true
      };
    } else {
      return {
        success: false,
        usedCache: true
      };
    }
  }
  
  // Try to geocode this location
  console.log(`Geocoding ${station.name} (${station.city}, ${station.state}, ${station.country})...`);
  const coords = await geocodeLocation(station.city, station.state, station.country);
  geocodedCache.set(cacheKey, coords);
  
  if (coords) {
    return {
      success: true,
      coordinates: coords,
      usedCache: false
    };
  } else {
    // Try with just the country if we have one
    if (station.country && station.country !== 'Unknown') {
      console.log(`Trying with just country: ${station.country}`);
      const countryCoords = await geocodeLocation(null, null, station.country);
      if (countryCoords) {
        geocodedCache.set(cacheKey, countryCoords);
        return {
          success: true,
          coordinates: countryCoords,
          usedCache: false
        };
      }
    }
    
    return {
      success: false,
      usedCache: false
    };
  }
}

// Function to process and fix station data
async function processStationData(filePath, dataType) {
  try {
    console.log(`\n=== Processing ${dataType} stations from ${filePath} ===`);
    
    // Read the current stations file
    const stationsData = await fs.readFile(filePath, 'utf8');
    let stations = JSON.parse(stationsData);
    
    console.log(`Loaded ${stations.length} ${dataType} stations.`);
    
    // Find invalid stations
    const invalidStations = await findInvalidStations(stations, dataType);
    
    if (invalidStations.length === 0) {
      console.log(`All ${dataType} stations have valid coordinates. No fixes needed.`);
      return stations;
    }
    
    // Keep track of geocoded locations to avoid repeated API calls
    const geocodedCache = new Map();
    
    // Counter for stations that need geocoding
    let geocodedStations = 0;
    let skippedStations = 0;
    
    // Process each invalid station
    for (let i = 0; i < invalidStations.length; i++) {
      const { index, station } = invalidStations[i];
      
      console.log(`\nProcessing station ${i + 1}/${invalidStations.length}: ${station.name}`);
      
      const result = await fixStationCoordinates(station, geocodedCache);
      
      if (result.success) {
        stations[index].geo_lat = result.coordinates.latitude;
        stations[index].geo_long = result.coordinates.longitude;
        geocodedStations++;
        
        if (result.usedCache) {
          console.log(`Using cached coordinates for ${station.name}: ${result.coordinates.latitude}, ${result.coordinates.longitude}`);
        } else {
          console.log(`Geocoded ${station.name}: ${result.coordinates.latitude}, ${result.coordinates.longitude}`);
          
          // Add a small delay to respect API rate limits
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } else {
        skippedStations++;
        console.log(`Failed to geocode ${station.name}`);
      }
    }
    
    console.log(`\n${dataType.toUpperCase()} STATIONS FIX SUMMARY:`);
    console.log(`Successfully geocoded: ${geocodedStations}`);
    console.log(`Skipped stations: ${skippedStations}`);
    
    // Write the fixed data back to the file
    await fs.writeFile(filePath, JSON.stringify(stations, null, 2));
    console.log(`Fixed ${dataType} stations data saved to ${filePath}`);
    
    return stations;
  } catch (error) {
    console.error(`Error processing ${dataType} station coordinates:`, error);
    throw error;
  }
}

// Main function to fix all station coordinates
async function fixAllStationCoordinates() {
  try {
    console.log('=== STARTING COMPREHENSIVE STATION COORDINATE FIX ===');
    
    // Process TV stations
    await processStationData('./src/data/tvStationsWithUrls.json', 'TV');
    
    // Process radio stations
    await processStationData('./src/data/radioStations.json', 'radio');
    
    console.log('\n=== ALL STATION COORDINATES FIXED SUCCESSFULLY ===');
  } catch (error) {
    console.error('Error fixing station coordinates:', error);
  }
}

// Function to verify all station coordinates
async function verifyAllStationCoordinates() {
  try {
    console.log('=== VERIFYING ALL STATION COORDINATES ===');
    
    // Read and verify TV stations
    const tvStationsData = await fs.readFile('./src/data/tvStationsWithUrls.json', 'utf8');
    const tvStations = JSON.parse(tvStationsData);
    const invalidTVStations = await findInvalidStations(tvStations, 'TV');
    
    // Read and verify radio stations
    const radioStationsData = await fs.readFile('./src/data/radioStations.json', 'utf8');
    const radioStations = JSON.parse(radioStationsData);
    const invalidRadioStations = await findInvalidStations(radioStations, 'radio');
    
    console.log('\n=== VERIFICATION RESULTS ===');
    console.log(`Invalid TV stations: ${invalidTVStations.length}`);
    console.log(`Invalid radio stations: ${invalidRadioStations.length}`);
    
    if (invalidTVStations.length === 0 && invalidRadioStations.length === 0) {
      console.log('✅ All station coordinates are valid!');
    } else {
      console.log('❌ Some stations still have invalid coordinates.');
      
      if (invalidTVStations.length > 0) {
        console.log('\nInvalid TV stations:');
        invalidTVStations.slice(0, 5).forEach(({ index, station }) => {
          console.log(`  - Index ${index}: ${station.name} (${station.geo_lat}, ${station.geo_long})`);
        });
        if (invalidTVStations.length > 5) {
          console.log(`  ... and ${invalidTVStations.length - 5} more`);
        }
      }
      
      if (invalidRadioStations.length > 0) {
        console.log('\nInvalid radio stations:');
        invalidRadioStations.slice(0, 5).forEach(({ index, station }) => {
          console.log(`  - Index ${index}: ${station.name} (${station.geo_lat}, ${station.geo_long})`);
        });
        if (invalidRadioStations.length > 5) {
          console.log(`  ... and ${invalidRadioStations.length - 5} more`);
        }
      }
    }
  } catch (error) {
    console.error('Error verifying station coordinates:', error);
  }
}

// Export functions for use in other scripts
export { 
  isValidCoordinate, 
  geocodeLocation, 
  fixAllStationCoordinates, 
  verifyAllStationCoordinates,
  processStationData
};

// If this script is run directly, execute the fix function
if (process.argv[1] && process.argv[1].endsWith('enhancedFixTVStations.js')) {
  if (process.argv.includes('--verify')) {
    verifyAllStationCoordinates();
  } else {
    fixAllStationCoordinates();
  }
}