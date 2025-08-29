// Test script to verify fixed station coordinates
import axios from 'axios';

async function testFixedStations() {
  try {
    console.log('Testing fixed station coordinates...\n');
    
    // Test TV stations
    console.log('Fetching TV stations...');
    const tvResponse = await axios.get('http://localhost:3001/api/stations/tv?limit=10');
    const tvStations = tvResponse.data.data;
    
    console.log(`Found ${tvStations.length} TV stations:`);
    tvStations.forEach((station, index) => {
      console.log(`${index + 1}. ${station.name} - ${station.country}`);
      console.log(`   Coordinates: ${station.geo_lat}, ${station.geo_long}`);
      console.log(`   Valid: ${isValidCoordinate(station.geo_lat, station.geo_long) ? 'Yes' : 'No'}\n`);
    });
    
    // Test radio stations
    console.log('Fetching radio stations...');
    const radioResponse = await axios.get('http://localhost:3001/api/stations/radio?limit=10');
    const radioStations = radioResponse.data.data;
    
    console.log(`Found ${radioStations.length} radio stations:`);
    radioStations.forEach((station, index) => {
      console.log(`${index + 1}. ${station.name} - ${station.country}`);
      console.log(`   Coordinates: ${station.geo_lat}, ${station.geo_long}`);
      console.log(`   Valid: ${isValidCoordinate(station.geo_lat, station.geo_long) ? 'Yes' : 'No'}\n`);
    });
    
    console.log('Test completed successfully!');
  } catch (error) {
    console.error('Error testing fixed stations:', error.message);
  }
}

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

testFixedStations();