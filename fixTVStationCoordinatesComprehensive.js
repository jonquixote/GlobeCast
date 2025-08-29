// Comprehensive script to fix all station coordinates
import fs from 'fs/promises';
import axios from 'axios';

// Function to check if coordinates are placeholder values
function isPlaceholderCoordinate(lat, lon) {
  // Common placeholder coordinates we need to fix
  const placeholderCoords = [
    [0, 0],
    [40, -100],
    [42, -100],
    [12.4989994, 124.6746741],
    [40, -98],
    [42, -98],
    [44, -98],
    [46, -98],
    [48, -98],
    [50, -98],
    [52, -98],
    [54, -98],
    [56, -98],
    [58, -98],
    [42, -96],
    [44, -96],
    [48, -96],
    [52, -96],
    [56, -96],
    [65, -120], // Russia placeholder
    [25.029422, -77.361956], // Bahamas placeholder
    [11.6165284, 125.4292222], // Philippines placeholder
    [28.0613438, 81.610291], // Florida placeholder
    [56, -96],
    [58, -96],
    [40, -94],
    [42, -94],
    [44, -94],
    [52, -94]
  ];
  
  // Check if the coordinates match any placeholder
  return placeholderCoords.some(coord => 
    Math.abs(coord[0] - lat) < 0.0001 && Math.abs(coord[1] - lon) < 0.0001
  );
}

// Function to geocode a location using OpenStreetMap Nominatim
async function geocodeLocation(city, state, country) {
  try {
    // Handle special cases or unknown locations
    if ((!city || city === 'Unknown' || city.trim() === '') && 
        (!state || state === 'Unknown' || state.trim() === '') && 
        (!country || country === 'Unknown' || country.trim() === '')) {
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
    
    console.log(`  Geocoding: ${locationQuery}`);
    
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
    console.warn(`  Geocoding failed for ${city}, ${state}, ${country}:`, error.message);
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
    let alreadyValid = 0;
    
    // Process each station
    for (let i = 0; i < tvStations.length; i++) {
      const station = tvStations[i];
      
      // Show progress every 25 stations
      if (i % 25 === 0) {
        console.log(`Processing TV station ${i+1}/${tvStations.length}...`);
      }
      
      // Check if coordinates are placeholder values
      const isPlaceholder = isPlaceholderCoordinate(station.geo_lat, station.geo_long);
      
      // Check if coordinates are within valid ranges
      const isValidRange = station.geo_lat >= -90 && station.geo_lat <= 90 && 
                          station.geo_long >= -180 && station.geo_long <= 180;
      
      // If coordinates are placeholders or invalid, try to geocode
      if (isPlaceholder || !isValidRange) {
        // Only try to geocode if we have location info
        const hasLocationInfo = 
          (station.city && station.city !== 'Unknown' && station.city.trim() !== '') ||
          (station.country && station.country !== 'Unknown' && station.country.trim() !== '');
        
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
              if (i % 25 === 0) {
                console.log(`  Using cached coordinates for ${station.name}: ${coords.latitude}, ${coords.longitude}`);
              }
            } else {
              skippedStations++;
              if (i % 25 === 0) {
                console.log(`  Skipping ${station.name}: No cached coordinates`);
              }
            }
          } else {
            // Try to geocode this location
            if (i % 25 === 0) {
              console.log(`  Geocoding ${station.name}...`);
            }
            const coords = await geocodeLocation(station.city, station.state, station.country);
            geocodedCache.set(cacheKey, coords);
            
            if (coords) {
              station.geo_lat = coords.latitude;
              station.geo_long = coords.longitude;
              geocodedStations++;
              if (i % 25 === 0) {
                console.log(`  Geocoded ${station.name}: ${coords.latitude}, ${coords.longitude}`);
              }
            } else {
              skippedStations++;
              if (i % 25 === 0) {
                console.log(`  Failed to geocode ${station.name}`);
              }
            }
            
            // Add a small delay to respect API rate limits
            await new Promise(resolve => setTimeout(resolve, 300));
          }
        } else {
          skippedStations++;
          if (i % 25 === 0) {
            console.log(`  Skipping ${station.name}: No location information`);
          }
        }
      } else {
        alreadyValid++;
      }
    }
    
    console.log(`\nTV stations summary:`);
    console.log(`  Already valid: ${alreadyValid}`);
    console.log(`  Needed geocoding: ${stationsToGeocode}`);
    console.log(`  Successfully geocoded: ${geocodedStations}`);
    console.log(`  Skipped: ${skippedStations}`);
    
    // Write the fixed data back to the file
    await fs.writeFile('./src/data/tvStationsWithUrlsFixed.json', JSON.stringify(tvStations, null, 2));
    
    console.log('\nFixed TV stations data saved to tvStationsWithUrlsFixed.json');
    return tvStations;
  } catch (error) {
    console.error('Error fixing TV station coordinates:', error);
    throw error;
  }
}

// Run the TV stations fix function
async function fixAllStationCoordinates() {
  try {
    console.log('Starting to fix all station coordinates...\n');
    await fixTVStations();
    console.log('\nAll station coordinates fixed successfully!');
  } catch (error) {
    console.error('Error fixing station coordinates:', error);
  }
}

// If this script is run directly, execute the fix function
if (import.meta.url === `file://${process.argv[1]}`) {
  fixAllStationCoordinates();
}

export { fixTVStations, fixAllStationCoordinates };