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
    
    console.log(`Geocoding: ${locationQuery}`);
    
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
      
      // Check if we have valid country information
      const hasValidCountry = station.country && station.country !== 'Unknown' && station.country.trim() !== '';
      
      // Try to geocode if coordinates are placeholders and we have a valid country
      if (isPlaceholderCoord && hasValidCountry) {
        stationsToGeocode++;
        
        // Create a cache key using country (and city if available)
        const cacheKey = `${station.city || ''}|${station.country}`;
        
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
          const coords = await geocodeLocation(station.city, station.country);
          geocodedCache.set(cacheKey, coords);
          
          if (coords) {
            station.geo_lat = coords.latitude;
            station.geo_long = coords.longitude;
            geocodedStations++;
            console.log(`Geocoded ${station.city || 'Unknown City'}, ${station.country}: ${coords.latitude}, ${coords.longitude}`);
          } else {
            // If we failed to geocode with city+country, try just the country
            if (station.country && station.country !== 'Unknown') {
              const countryCoords = await geocodeLocation(null, station.country);
              if (countryCoords) {
                station.geo_lat = countryCoords.latitude;
                station.geo_long = countryCoords.longitude;
                geocodedStations++;
                console.log(`Geocoded country ${station.country}: ${countryCoords.latitude}, ${countryCoords.longitude}`);
              } else {
                console.log(`Failed to geocode ${station.city || 'Unknown City'}, ${station.country}`);
              }
            } else {
              console.log(`Failed to geocode ${station.city || 'Unknown City'}, ${station.country}`);
            }
          }
          
          // Add a small delay to respect API rate limits
          await new Promise(resolve => setTimeout(resolve, 500));
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
      
      // Check if we have valid location information
      const hasValidLocation = 
        (station.country && station.country !== 'Unknown' && station.country.trim() !== '') ||
        (station.state && station.state !== 'Unknown' && station.state.trim() !== '') ||
        (station.city && station.city !== 'Unknown' && station.city.trim() !== '');
      
      // Try to geocode if coordinates are placeholders and we have valid location info
      if (isPlaceholderCoord && hasValidLocation) {
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
          // Try different combinations of location information
          let coords = null;
          
          // Try city + country first
          if (station.city && station.city !== 'Unknown' && station.country && station.country !== 'Unknown') {
            coords = await geocodeLocation(station.city, station.country);
          }
          
          // Try state + country if that failed
          if (!coords && station.state && station.state !== 'Unknown' && station.country && station.country !== 'Unknown') {
            coords = await geocodeLocation(station.state, station.country);
          }
          
          // Try just city if that failed
          if (!coords && station.city && station.city !== 'Unknown') {
            coords = await geocodeLocation(station.city, null);
          }
          
          // Try just state if that failed
          if (!coords && station.state && station.state !== 'Unknown') {
            coords = await geocodeLocation(station.state, null);
          }
          
          // Try just country if that failed
          if (!coords && station.country && station.country !== 'Unknown') {
            coords = await geocodeLocation(null, station.country);
          }
          
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
          await new Promise(resolve => setTimeout(resolve, 500));
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