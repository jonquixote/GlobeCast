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

// Function to extract country from station name or other fields
function extractCountryFromStation(station) {
  // Try to extract country from the station name or ID
  const name = station.name || '';
  const id = station.id || '';
  
  // Common country indicators in station names
  const countryPatterns = {
    'ru': 'Russia',
    'ar': 'Argentina',
    'mx': 'Mexico',
    'br': 'Brazil',
    'cl': 'Chile',
    'co': 'Colombia',
    'pe': 'Peru',
    've': 'Venezuela',
    'ec': 'Ecuador',
    'uy': 'Uruguay',
    'py': 'Paraguay',
    'bo': 'Bolivia',
    'gt': 'Guatemala',
    'hn': 'Honduras',
    'sv': 'El Salvador',
    'ni': 'Nicaragua',
    'cr': 'Costa Rica',
    'pa': 'Panama',
    'do': 'Dominican Republic',
    'cu': 'Cuba',
    'jm': 'Jamaica',
    'ht': 'Haiti',
    'bs': 'Bahamas',
    'bb': 'Barbados',
    'gd': 'Grenada',
    'tt': 'Trinidad and Tobago',
    'kn': 'Saint Kitts and Nevis',
    'lc': 'Saint Lucia',
    'vc': 'Saint Vincent and the Grenadines',
    'ag': 'Antigua and Barbuda',
    'bz': 'Belize',
    'sr': 'Suriname',
    'gy': 'Guyana',
    'fr': 'France',
    'de': 'Germany',
    'uk': 'United Kingdom',
    'it': 'Italy',
    'es': 'Spain',
    'pt': 'Portugal',
    'nl': 'Netherlands',
    'be': 'Belgium',
    'ch': 'Switzerland',
    'at': 'Austria',
    'se': 'Sweden',
    'no': 'Norway',
    'dk': 'Denmark',
    'fi': 'Finland',
    'pl': 'Poland',
    'cz': 'Czech Republic',
    'sk': 'Slovakia',
    'hu': 'Hungary',
    'ro': 'Romania',
    'bg': 'Bulgaria',
    'gr': 'Greece',
    'tr': 'Turkey',
    'il': 'Israel',
    'sa': 'Saudi Arabia',
    'ae': 'United Arab Emirates',
    'qa': 'Qatar',
    'kw': 'Kuwait',
    'bh': 'Bahrain',
    'om': 'Oman',
    'ye': 'Yemen',
    'jo': 'Jordan',
    'lb': 'Lebanon',
    'sy': 'Syria',
    'iq': 'Iraq',
    'ir': 'Iran',
    'af': 'Afghanistan',
    'pk': 'Pakistan',
    'in': 'India',
    'bd': 'Bangladesh',
    'lk': 'Sri Lanka',
    'np': 'Nepal',
    'bt': 'Bhutan',
    'mm': 'Myanmar',
    'th': 'Thailand',
    'vn': 'Vietnam',
    'kh': 'Cambodia',
    'la': 'Laos',
    'my': 'Malaysia',
    'sg': 'Singapore',
    'id': 'Indonesia',
    'ph': 'Philippines',
    'jp': 'Japan',
    'kr': 'South Korea',
    'cn': 'China',
    'tw': 'Taiwan',
    'au': 'Australia',
    'nz': 'New Zealand',
    'za': 'South Africa',
    'eg': 'Egypt',
    'ma': 'Morocco',
    'dz': 'Algeria',
    'tn': 'Tunisia',
    'ly': 'Libya',
    'ng': 'Nigeria',
    'gh': 'Ghana',
    'ke': 'Kenya',
    'ug': 'Uganda',
    'tz': 'Tanzania',
    'zm': 'Zambia',
    'zw': 'Zimbabwe',
    'mw': 'Malawi',
    'mg': 'Madagascar',
    'ao': 'Angola',
    'mz': 'Mozambique',
    'bw': 'Botswana',
    'na': 'Namibia'
  };
  
  // Check if the ID contains a country code
  const idParts = id.split('.');
  if (idParts.length > 1) {
    const countryCode = idParts[idParts.length - 1].toLowerCase();
    if (countryPatterns[countryCode]) {
      return countryPatterns[countryCode];
    }
  }
  
  return null;
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
      
      // Check if coordinates are valid
      const hasValidCoords = isValidCoordinate(parseFloat(station.geo_lat), parseFloat(station.geo_long));
      
      if (hasValidCoords) {
        alreadyValid++;
        continue;
      }
      
      // If coordinates are not valid, try to geocode
      stationsToGeocode++;
      
      // Try to improve location information if it's missing or invalid
      let city = station.city;
      let state = station.state;
      let country = station.country;
      
      // If country is unknown, try to extract it from the station ID
      if (!country || country === 'Unknown') {
        const extractedCountry = extractCountryFromStation(station);
        if (extractedCountry) {
          country = extractedCountry;
          console.log(`Extracted country for ${station.name}: ${country}`);
        }
      }
      
      // Create a cache key
      const cacheKey = `${city || ''}|${state || ''}|${country || ''}`;
      
      // Check if we already have this location geocoded
      if (geocodedCache.has(cacheKey)) {
        const coords = geocodedCache.get(cacheKey);
        if (coords) {
          station.geo_lat = coords.latitude;
          station.geo_long = coords.longitude;
          geocodedStations++;
          console.log(`Using cached coordinates for ${station.name} (${city}, ${country}): ${coords.latitude}, ${coords.longitude}`);
        } else {
          skippedStations++;
          console.log(`Skipping ${station.name} (${city}, ${country}): No cached coordinates`);
        }
      } else {
        // Try to geocode this location
        console.log(`Geocoding ${station.name} (${city}, ${state}, ${country})...`);
        const coords = await geocodeLocation(city, state, country);
        geocodedCache.set(cacheKey, coords);
        
        if (coords) {
          station.geo_lat = coords.latitude;
          station.geo_long = coords.longitude;
          geocodedStations++;
          console.log(`Geocoded ${station.name} (${city}, ${country}): ${coords.latitude}, ${coords.longitude}`);
        } else {
          skippedStations++;
          console.log(`Failed to geocode ${station.name} (${city}, ${country})`);
          
          // Try with just the country if we have one
          let countryCoords = null;
          if (country && country !== 'Unknown') {
            console.log(`Trying with just country: ${country}`);
            countryCoords = await geocodeLocation(null, null, country);
            if (countryCoords) {
              station.geo_lat = countryCoords.latitude;
              station.geo_long = countryCoords.longitude;
              geocodedStations++;
              console.log(`Geocoded ${station.name} using country ${country}: ${countryCoords.latitude}, ${countryCoords.longitude}`);
            }
          }
          
          // If still no coordinates, try to get them from the station name
          if (!coords && !countryCoords) {
            // Try to geocode using just the station name
            const nameCoords = await geocodeLocation(station.name, null, null);
            if (nameCoords) {
              station.geo_lat = nameCoords.latitude;
              station.geo_long = nameCoords.longitude;
              geocodedStations++;
              console.log(`Geocoded ${station.name} using station name: ${nameCoords.latitude}, ${nameCoords.longitude}`);
            }
          }
        }
        
        // Add a small delay to respect API rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    console.log(`TV stations with already valid coordinates: ${alreadyValid}`);
    console.log(`TV stations that needed geocoding: ${stationsToGeocode}`);
    console.log(`Successfully geocoded: ${geocodedStations}`);
    console.log(`Skipped stations: ${skippedStations}`);
    
    // Write the fixed data back to the file
    await fs.writeFile('./src/data/tvStationsWithUrls.json', JSON.stringify(tvStations, null, 2));
    
    console.log('Fixed TV stations data saved to tvStationsWithUrls.json');
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
    let alreadyValid = 0;
    
    // Process each station
    for (let i = 0; i < radioStations.length; i++) {
      const station = radioStations[i];
      
      // Check if coordinates are valid
      const hasValidCoords = isValidCoordinate(parseFloat(station.geo_lat), parseFloat(station.geo_long));
      
      if (hasValidCoords) {
        alreadyValid++;
        continue;
      }
      
      // If coordinates are not valid, try to geocode
      stationsToGeocode++;
      
      // Try to improve location information if it's missing or invalid
      let city = station.city;
      let state = station.state;
      let country = station.country;
      
      // If country is unknown, try to extract it from the station ID
      if (!country || country === 'Unknown') {
        const extractedCountry = extractCountryFromStation(station);
        if (extractedCountry) {
          country = extractedCountry;
          console.log(`Extracted country for ${station.name}: ${country}`);
        }
      }
      
      // Create a cache key using available location information
      const locationParts = [];
      if (city && city !== 'Unknown') {
        locationParts.push(city);
      }
      if (state && state !== 'Unknown') {
        locationParts.push(state);
      }
      if (country && country !== 'Unknown') {
        locationParts.push(country);
      }
      
      const cacheKey = locationParts.join('|');
      
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
          
          // Try with just the country if we have one
          let countryCoords = null;
          if (country && country !== 'Unknown') {
            console.log(`Trying with just country: ${country}`);
            countryCoords = await geocodeLocation(null, null, country);
            if (countryCoords) {
              station.geo_lat = countryCoords.latitude;
              station.geo_long = countryCoords.longitude;
              geocodedStations++;
              console.log(`Geocoded ${station.name} using country ${country}: ${countryCoords.latitude}, ${countryCoords.longitude}`);
            }
          }
          
          // If still no coordinates, try to get them from the station name
          if (!coords && !countryCoords) {
            // Try to geocode using just the station name
            const nameCoords = await geocodeLocation(station.name, null, null);
            if (nameCoords) {
              station.geo_lat = nameCoords.latitude;
              station.geo_long = nameCoords.longitude;
              geocodedStations++;
              console.log(`Geocoded ${station.name} using station name: ${nameCoords.latitude}, ${nameCoords.longitude}`);
            }
          }
        }
        
        // Add a small delay to respect API rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    console.log(`Radio stations with already valid coordinates: ${alreadyValid}`);
    console.log(`Radio stations that needed geocoding: ${stationsToGeocode}`);
    console.log(`Successfully geocoded: ${geocodedStations}`);
    console.log(`Skipped stations: ${skippedStations}`);
    
    // Write the fixed data back to the file
    await fs.writeFile('./src/data/radioStations.json', JSON.stringify(radioStations, null, 2));
    
    console.log('Fixed radio stations data saved to radioStations.json');
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

// Also run if called directly
fixAllStationCoordinates();

export { fixTVStations, fixRadioStations, fixAllStationCoordinates };