import fs from 'fs/promises';
import axios from 'axios';

// Function to extract country from station ID
function getCountryFromId(stationId) {
  const parts = stationId.split('.');
  if (parts.length > 1) {
    const countryCode = parts[parts.length - 1].split('@')[0];
    // Simple mapping for some common codes
    const countryMap = {
      'uk': 'United Kingdom',
      'cr': 'Costa Rica',
      'do': 'Dominican Republic',
      'be': 'Belgium',
      'pr': 'Puerto Rico',
      'gt': 'Guatemala',
    };
    return countryMap[countryCode.toLowerCase()] || null;
  }
  return null;
}

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
        (station.geo_lat > 20 && station.geo_lat < 60 && station.geo_long > -80 && station.geo_long < -20) ||
        (station.geo_lat >= -90 && station.geo_lat <= 90 && station.geo_long >= -180 && station.geo_long <= 180) === false;
      
      // Try to geocode if coordinates are placeholders
      if (isPlaceholderCoord) {
        stationsToGeocode++;
        
        let country = station.country;
        if (country === 'Unknown') {
          country = getCountryFromId(station.id);
        }

        // Create a cache key using country (and city if available)
        const cacheKey = `${station.city || ''}|${country}`;
        
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
          const coords = await geocodeLocation(station.city, country);
          geocodedCache.set(cacheKey, coords);
          
          if (coords) {
            station.geo_lat = coords.latitude;
            station.geo_long = coords.longitude;
            geocodedStations++;
            console.log(`Geocoded ${station.city || 'Unknown City'}, ${country}: ${coords.latitude}, ${coords.longitude}`);
          } else {
            // If we failed to geocode with city+country, try just the country
            if (country && country !== 'Unknown') {
              const countryCoords = await geocodeLocation(null, country);
              if (countryCoords) {
                station.geo_lat = countryCoords.latitude;
                station.geo_long = countryCoords.longitude;
                geocodedStations++;
                console.log(`Geocoded country ${country}: ${countryCoords.latitude}, ${countryCoords.longitude}`);
              } else {
                console.log(`Failed to geocode ${station.city || 'Unknown City'}, ${country}`);
              }
            } else {
              console.log(`Failed to geocode ${station.city || 'Unknown City'}, ${country}`);
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
    await fs.writeFile('./src/data/tvStationsWithUrls.json', JSON.stringify(tvStations, null, 2));
    
    console.log('Fixed TV stations data saved to tvStationsWithUrls.json');
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
      
      // Check if coordinates are placeholder values (0,0)
      const isPlaceholderCoord = station.geo_lat == 0 && station.geo_long == 0;
      
      // If we have city/country info and coordinates are placeholders, try to geocode
      if ((station.city || station.state || station.country) && isPlaceholderCoord) {
        stationsToGeocode++;
        
        // Create a cache key
        const locationParts = [];
        if (station.city) locationParts.push(station.city);
        if (station.state) locationParts.push(station.state);
        if (station.country) locationParts.push(station.country);
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
          const coords = await geocodeLocation(station.city || station.state, station.country);
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
    await fs.writeFile('./src/data/radioStations.json', JSON.stringify(radioStations, null, 2));
    
    console.log('Fixed radio stations data saved to radioStations.json');
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
