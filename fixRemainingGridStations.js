import fs from 'fs/promises';
import axios from 'axios';

// Function to check if coordinates are valid and not part of a grid pattern
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
    (Math.abs(lat) < 1 && Math.abs(lon) < 1) || // Very close to (0,0)
    // Check for grid pattern coordinates (commonly used as placeholders)
    // These are often at regular intervals like 40, 42, 44, etc. for latitude
    // and -100, -98, -96, etc. for longitude
    (Math.abs(lat - Math.round(lat)) < 0.1 && Math.abs(lon - Math.round(lon)) < 0.1) &&
    (lat >= 20 && lat <= 70) && 
    (lon >= -130 && lon <= -60) ||
    // Check for Atlantic Ocean coordinates (near 0,0)
    (Math.abs(lat) < 10 && Math.abs(lon) < 10);
  
  return validLat && validLon && !isPlaceholder;
}

// Function to geocode a location using OpenStreetMap Nominatim
async function geocodeLocation(query) {
  try {
    if (!query || query === 'Unknown') {
      return null;
    }
    
    console.log(`Geocoding location: ${query}`);
    
    // Use OpenStreetMap Nominatim API for geocoding
    const response = await axios.get('https://nominatim.openstreetmap.org/search', {
      params: {
        q: query,
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
    console.warn(`Geocoding failed for ${query}:`, error.message);
    return null;
  }
}

// Manual mapping for specific stations that failed to geocode
const manualStationMapping = {
  '23 ABC Bakersfield CA (KERO) (720p)': { lat: 35.3733, lon: -119.0187 },
  'ABC 3 Lafayette LA (KATC) (720p)': { lat: 30.2241, lon: -92.0198 },
  'ABC 7 Denver CO (KMGH) (720p)': { lat: 39.7392, lon: -104.9903 },
  'ABC 13 Las Vegas NV (KTNV) (720p)': { lat: 36.1699, lon: -115.1398 },
  'ABC 15 Phoenix AZ (KNXV-TV) (720p)': { lat: 33.4484, lon: -112.0740 },
  'ABC 25 News Central Texas': { lat: 31.9686, lon: -99.9018 },
  'ABC Australia Vietnam (1080p)': { lat: 14.0583, lon: 108.2772 },
  'Abu Dhabi Aloula (1080p)': { lat: 24.4539, lon: 54.3773 },
  'Abu Dhabi Emirates (1080p)': { lat: 24.4539, lon: 54.3773 },
  'Access Humboldt (1080p)': { lat: 40.7459, lon: -123.8665 },
  'Access Media Productions Channel (720p)': { lat: 36.7783, lon: -119.4179 },
  'Access Media Productions Monterey Channel (720p)': { lat: 36.6002, lon: -121.8947 },
  'Access Sacramento Channel 17': { lat: 38.5816, lon: -121.4944 },
  'Access Sacramento Channel 18': { lat: 38.5816, lon: -121.4944 },
  'Access Tuolumne (Tuolumne County CA) (720p)': { lat: 37.9643, lon: -120.4036 },
  'AccessVision Channel 16': { lat: 34.0522, lon: -118.2437 },
  'Afghan Nobel TV (720p)': { lat: 34.5553, lon: 69.2075 },
  'Akaku 53 (Hawaii) (1080p)': { lat: 21.3069, lon: -157.8583 },
  'Akaku 54 (Hawaii) (1080p)': { lat: 21.3069, lon: -157.8583 },
  'Akaku 55 (Hawaii) (1080p)': { lat: 21.3069, lon: -157.8583 },
  'Al Aoula Inter (480p)': { lat: 31.7917, lon: -7.0926 },
  'Al Aoula Laâyoune (480p)': { lat: 27.1536, lon: -13.2036 },
  'Al Aqsa Channel (416p) [Not 24/7]': { lat: 31.5017, lon: 34.4668 },
  'Al Jadeed (1080p)': { lat: 33.8938, lon: 35.5018 },
  'Al Maghribia (480p)': { lat: 31.7917, lon: -7.0926 },
  'AlbDreams TV (720p)': { lat: 41.1533, lon: 20.1683 },
  'AlShoub (720p)': { lat: 35.8617, lon: 104.1954 },
  'Altyn Asyr (406p) [Not 24/7]': { lat: 37.9605, lon: 58.3283 },
  'Alvin Channel TV (360p) [Not 24/7]': { lat: 29.4241, lon: -95.2702 },
  'Ame 47 (576p)': { lat: 34.6937, lon: 135.5023 },
  'América TeVé (1080p)': { lat: 25.7617, lon: -80.1918 },
  'Amouzesh TV': { lat: 35.6892, lon: 51.3890 },
  'Antena 3 Internacional (480p)': { lat: 40.4168, lon: -3.7038 },
  'Aqjaiyq (576p)': { lat: 44.5217, lon: 65.2275 },
  'Aqtóbe (576p)': { lat: 50.2707, lon: 57.2182 },
  'ARTN TV (1080p) [Not 24/7]': { lat: 36.2048, lon: 138.2529 },
  'Aşgabat (406p) [Not 24/7]': { lat: 37.9601, lon: 58.3261 },
  'AssyriaSat (720p) [Not 24/7]': { lat: 35.4850, lon: 44.2150 },
  'Astro Vaanavil': { lat: 4.2105, lon: 101.9758 },
  'Atyraý (720p)': { lat: 47.1072, lon: 51.9153 },
  'Badakhshon (576p)': { lat: 37.9116, lon: 70.5058 },
  'Capital TV (1080p)': { lat: -1.9403, lon: 29.8739 }
};

// Function to fix remaining grid pattern stations
async function fixRemainingGridStations() {
  try {
    // Read the current TV stations file
    const tvStationsData = await fs.readFile('./src/data/tvStationsWithUrls.json', 'utf8');
    let tvStations = JSON.parse(tvStationsData);
    
    // Read the current radio stations file
    const radioStationsData = await fs.readFile('./src/data/radioStations.json', 'utf8');
    let radioStations = JSON.parse(radioStationsData);
    
    console.log(`Processing ${tvStations.length} TV stations...`);
    console.log(`Processing ${radioStations.length} radio stations...`);
    
    let tvFixed = 0;
    let radioFixed = 0;
    
    // Fix TV stations with grid pattern coordinates
    for (let i = 0; i < tvStations.length; i++) {
      const station = tvStations[i];
      const hasValidCoords = isValidCoordinate(parseFloat(station.geo_lat), parseFloat(station.geo_long));
      
      if (!hasValidCoords) {
        // Check if we have a manual mapping for this station
        if (manualStationMapping[station.name]) {
          const coords = manualStationMapping[station.name];
          station.geo_lat = coords.lat;
          station.geo_long = coords.lon;
          tvFixed++;
          console.log(`Manually fixed ${station.name}: ${coords.lat}, ${coords.lon}`);
        } else {
          // Try to geocode using the station name
          const coords = await geocodeLocation(station.name);
          if (coords) {
            station.geo_lat = coords.latitude;
            station.geo_long = coords.longitude;
            tvFixed++;
            console.log(`Geocoded ${station.name}: ${coords.latitude}, ${coords.longitude}`);
          } else {
            console.log(`Failed to fix ${station.name}`);
          }
        }
      }
    }
    
    // Fix radio stations with grid pattern coordinates
    for (let i = 0; i < radioStations.length; i++) {
      const station = radioStations[i];
      const hasValidCoords = isValidCoordinate(parseFloat(station.geo_lat), parseFloat(station.geo_long));
      
      if (!hasValidCoords) {
        // For radio stations, we'll try to geocode using available information
        let locationQuery = '';
        if (station.city && station.city !== 'Unknown' && station.city !== 'undefined') {
          locationQuery = station.city;
        }
        if (station.state && station.state !== 'Unknown' && station.state !== 'undefined') {
          locationQuery += (locationQuery ? ', ' : '') + station.state;
        }
        if (station.country && station.country !== 'Unknown' && station.country !== 'undefined') {
          locationQuery += (locationQuery ? ', ' : '') + station.country;
        }
        
        if (locationQuery) {
          const coords = await geocodeLocation(locationQuery);
          if (coords) {
            station.geo_lat = coords.latitude;
            station.geo_long = coords.longitude;
            radioFixed++;
            console.log(`Geocoded ${station.name}: ${coords.latitude}, ${coords.longitude}`);
          } else {
            console.log(`Failed to fix ${station.name}`);
          }
        } else {
          console.log(`No location information for ${station.name}`);
        }
      }
    }
    
    console.log(`Fixed ${tvFixed} TV stations and ${radioFixed} radio stations`);
    
    // Write the fixed data back to the files
    await fs.writeFile('./src/data/tvStationsWithUrls.json', JSON.stringify(tvStations, null, 2));
    await fs.writeFile('./src/data/radioStations.json', JSON.stringify(radioStations, null, 2));
    
    console.log('Fixed station data saved to files');
  } catch (error) {
    console.error('Error fixing remaining grid stations:', error);
  }
}

// Run the function
fixRemainingGridStations();