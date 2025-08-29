import fs from 'fs/promises';

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
    (lat === 58 && lon === -98);
  
  return validLat && validLon && !isPlaceholder;
}

// Function to verify TV stations
async function verifyTVStations() {
  try {
    // Read the current TV stations file
    const tvStationsData = await fs.readFile('./src/data/tvStationsWithUrls.json', 'utf8');
    let tvStations = JSON.parse(tvStationsData);

    console.log(`Verifying ${tvStations.length} TV stations...`);
    
    let validStations = 0;
    let invalidStations = 0;
    let placeholderStations = 0;
    let missingLocationInfo = 0;
    
    // Process each station
    for (let i = 0; i < tvStations.length; i++) {
      const station = tvStations[i];
      
      // Check if coordinates are valid
      const hasValidCoords = isValidCoordinate(station.geo_lat, station.geo_long);
      
      if (hasValidCoords) {
        validStations++;
      } else {
        // Check if it's a placeholder coordinate
        const isPlaceholder = 
          (station.geo_lat === 0 && station.geo_long === 0) ||
          (station.geo_lat === 40 && station.geo_long === -100) ||
          (station.geo_lat === 42 && station.geo_long === -100) ||
          (station.geo_lat === 12.4989994 && station.geo_long === 124.6746741) ||
          (station.geo_lat === 40 && station.geo_long === -98) ||
          (station.geo_lat === 42 && station.geo_long === -98) ||
          (station.geo_lat === 44 && station.geo_long === -98) ||
          (station.geo_lat === 46 && station.geo_long === -98) ||
          (station.geo_lat === 48 && station.geo_long === -98) ||
          (station.geo_lat === 50 && station.geo_long === -98) ||
          (station.geo_lat === 52 && station.geo_long === -98) ||
          (station.geo_lat === 54 && station.geo_long === -98) ||
          (station.geo_lat === 56 && station.geo_long === -98) ||
          (station.geo_lat === 58 && station.geo_long === -98);
        
        if (isPlaceholder) {
          placeholderStations++;
          console.log(`Placeholder coordinates found for ${station.name} (${station.city}, ${station.country}): ${station.geo_lat}, ${station.geo_long}`);
        } else if (station.geo_lat === undefined || station.geo_long === undefined) {
          missingLocationInfo++;
          console.log(`Missing coordinates for ${station.name} (${station.city}, ${station.country})`);
        } else {
          invalidStations++;
          console.log(`Invalid coordinates for ${station.name} (${station.city}, ${station.country}): ${station.geo_lat}, ${station.geo_long}`);
        }
      }
    }
    
    console.log(`TV Stations Summary:`);
    console.log(`- Valid coordinates: ${validStations}`);
    console.log(`- Placeholder coordinates: ${placeholderStations}`);
    console.log(`- Invalid coordinates: ${invalidStations}`);
    console.log(`- Missing coordinates: ${missingLocationInfo}`);
    
    return {
      valid: validStations,
      placeholder: placeholderStations,
      invalid: invalidStations,
      missing: missingLocationInfo
    };
  } catch (error) {
    console.error('Error verifying TV station coordinates:', error);
    throw error;
  }
}

// Function to verify radio stations
async function verifyRadioStations() {
  try {
    // Read the current radio stations file
    const radioStationsData = await fs.readFile('./src/data/radioStations.json', 'utf8');
    let radioStations = JSON.parse(radioStationsData);

    console.log(`\nVerifying ${radioStations.length} radio stations...`);
    
    let validStations = 0;
    let invalidStations = 0;
    let placeholderStations = 0;
    let missingLocationInfo = 0;
    
    // Process each station
    for (let i = 0; i < radioStations.length; i++) {
      const station = radioStations[i];
      
      // Check if coordinates are valid
      const hasValidCoords = isValidCoordinate(station.geo_lat, station.geo_long);
      
      if (hasValidCoords) {
        validStations++;
      } else {
        // Check if it's a placeholder coordinate
        const isPlaceholder = 
          (station.geo_lat === 0 && station.geo_long === 0) ||
          (station.geo_lat === 40 && station.geo_long === -100) ||
          (station.geo_lat === 42 && station.geo_long === -100) ||
          (station.geo_lat === 12.4989994 && station.geo_long === 124.6746741) ||
          (station.geo_lat === 40 && station.geo_long === -98) ||
          (station.geo_lat === 42 && station.geo_long === -98) ||
          (station.geo_lat === 44 && station.geo_long === -98) ||
          (station.geo_lat === 46 && station.geo_long === -98) ||
          (station.geo_lat === 48 && station.geo_long === -98) ||
          (station.geo_lat === 50 && station.geo_long === -98) ||
          (station.geo_lat === 52 && station.geo_long === -98) ||
          (station.geo_lat === 54 && station.geo_long === -98) ||
          (station.geo_lat === 56 && station.geo_long === -98) ||
          (station.geo_lat === 58 && station.geo_long === -98);
        
        if (isPlaceholder) {
          placeholderStations++;
          console.log(`Placeholder coordinates found for ${station.name} (${station.city}, ${station.state}, ${station.country}): ${station.geo_lat}, ${station.geo_long}`);
        } else if (station.geo_lat === undefined || station.geo_long === undefined) {
          missingLocationInfo++;
          console.log(`Missing coordinates for ${station.name} (${station.city}, ${station.state}, ${station.country})`);
        } else {
          invalidStations++;
          console.log(`Invalid coordinates for ${station.name} (${station.city}, ${station.state}, ${station.country}): ${station.geo_lat}, ${station.geo_long}`);
        }
      }
    }
    
    console.log(`Radio Stations Summary:`);
    console.log(`- Valid coordinates: ${validStations}`);
    console.log(`- Placeholder coordinates: ${placeholderStations}`);
    console.log(`- Invalid coordinates: ${invalidStations}`);
    console.log(`- Missing coordinates: ${missingLocationInfo}`);
    
    return {
      valid: validStations,
      placeholder: placeholderStations,
      invalid: invalidStations,
      missing: missingLocationInfo
    };
  } catch (error) {
    console.error('Error verifying radio station coordinates:', error);
    throw error;
  }
}

// Run verification functions
async function verifyAllStationCoordinates() {
  try {
    console.log('Starting to verify station coordinates...');
    const tvResults = await verifyTVStations();
    const radioResults = await verifyRadioStations();
    
    console.log('\nOverall Summary:');
    console.log(`Total valid coordinates: ${tvResults.valid + radioResults.valid}`);
    console.log(`Total placeholder coordinates: ${tvResults.placeholder + radioResults.placeholder}`);
    console.log(`Total invalid coordinates: ${tvResults.invalid + radioResults.invalid}`);
    console.log(`Total missing coordinates: ${tvResults.missing + radioResults.missing}`);
    
    // Check if there are significant issues
    const totalPlaceholder = tvResults.placeholder + radioResults.placeholder;
    const totalInvalid = tvResults.invalid + radioResults.invalid;
    const totalMissing = tvResults.missing + radioResults.missing;
    
    if (totalPlaceholder > 0 || totalInvalid > 0 || totalMissing > 0) {
      console.log('\n⚠️  Issues detected! You may want to run the coordinate fixing script again.');
    } else {
      console.log('\n✅ All station coordinates appear to be valid!');
    }
  } catch (error) {
    console.error('Error verifying station coordinates:', error);
  }
}

// If this script is run directly, execute the verification function
if (import.meta.url === `file://${process.argv[1]}`) {
  verifyAllStationCoordinates();
}

export { verifyTVStations, verifyRadioStations, verifyAllStationCoordinates };