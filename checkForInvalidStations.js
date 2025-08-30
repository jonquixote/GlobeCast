import fs from 'fs/promises';
import { isValidCoordinate } from './enhancedFixTVStations.js';

// Function to check for new stations with invalid coordinates
async function checkForNewInvalidStations() {
  try {
    console.log('=== CHECKING FOR NEW STATIONS WITH INVALID COORDINATES ===');
    
    // Check TV stations
    const tvStationsData = await fs.readFile('./src/data/tvStationsWithUrls.json', 'utf8');
    const tvStations = JSON.parse(tvStationsData);
    
    console.log(`Checking ${tvStations.length} TV stations...`);
    let invalidTVCount = 0;
    
    for (let i = 0; i < tvStations.length; i++) {
      const station = tvStations[i];
      if (!isValidCoordinate(station.geo_lat, station.geo_long)) {
        console.log(`INVALID TV STATION: ${station.name} (${station.geo_lat}, ${station.geo_long})`);
        invalidTVCount++;
      }
    }
    
    // Check radio stations
    const radioStationsData = await fs.readFile('./src/data/radioStations.json', 'utf8');
    const radioStations = JSON.parse(radioStationsData);
    
    console.log(`Checking ${radioStations.length} radio stations...`);
    let invalidRadioCount = 0;
    
    for (let i = 0; i < radioStations.length; i++) {
      const station = radioStations[i];
      if (!isValidCoordinate(station.geo_lat, station.geo_long)) {
        console.log(`INVALID RADIO STATION: ${station.name} (${station.geo_lat}, ${station.geo_long})`);
        invalidRadioCount++;
      }
    }
    
    console.log('\n=== SUMMARY ===');
    console.log(`Invalid TV stations: ${invalidTVCount}`);
    console.log(`Invalid radio stations: ${invalidRadioCount}`);
    console.log(`Total invalid stations: ${invalidTVCount + invalidRadioCount}`);
    
    if (invalidTVCount + invalidRadioCount === 0) {
      console.log('✅ All stations have valid coordinates!');
    } else {
      console.log('❌ Found stations with invalid coordinates. Please run the fix script.');
    }
    
  } catch (error) {
    console.error('Error checking for invalid stations:', error);
  }
}

// Run the check
checkForNewInvalidStations();