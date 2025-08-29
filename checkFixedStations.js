import fs from 'fs/promises';

async function checkSpecificStations() {
  try {
    // Read the TV stations file
    const tvStationsData = await fs.readFile('./src/data/tvStationsWithUrls.json', 'utf8');
    const tvStations = JSON.parse(tvStationsData);
    
    // Read the radio stations file
    const radioStationsData = await fs.readFile('./src/data/radioStations.json', 'utf8');
    const radioStations = JSON.parse(radioStationsData);
    
    console.log('=== Checking Specific Stations ===\n');
    
    // Check some TV stations that were previously in the Atlantic Ocean
    const tvStationsToCheck = [
      '1TV.af@SD',  // Afghanistan
      '7TVSenegal.sn@SD',  // Senegal
      'ATV2HD.at'   // Austria
    ];
    
    console.log('TV Stations:');
    tvStationsToCheck.forEach(stationId => {
      const station = tvStations.find(s => s.id === stationId);
      if (station) {
        console.log(`- ${station.name}: ${station.geo_lat}, ${station.geo_long} (${station.city}, ${station.country})`);
      } else {
        console.log(`- ${stationId}: Not found`);
      }
    });
    
    console.log('\nRadio Stations:');
    // Check first 5 radio stations as examples
    for (let i = 0; i < Math.min(5, radioStations.length); i++) {
      const station = radioStations[i];
      console.log(`- ${station.name}: ${station.geo_lat}, ${station.geo_long} (${station.city}, ${station.country})`);
    }
    
    // Count total stations
    console.log(`\n=== Summary ===`);
    console.log(`Total TV stations: ${tvStations.length}`);
    console.log(`Total radio stations: ${radioStations.length}`);
    
    // Count stations with valid coordinates
    const validTVStations = tvStations.filter(station => {
      return station.geo_lat >= -90 && station.geo_lat <= 90 && 
             station.geo_long >= -180 && station.geo_long <= 180 &&
             !(station.geo_lat === 0 && station.geo_long === 0);
    });
    
    const validRadioStations = radioStations.filter(station => {
      return station.geo_lat >= -90 && station.geo_lat <= 90 && 
             station.geo_long >= -180 && station.geo_long <= 180 &&
             !(station.geo_lat === 0 && station.geo_long === 0);
    });
    
    console.log(`TV stations with valid coordinates: ${validTVStations.length}/${tvStations.length}`);
    console.log(`Radio stations with valid coordinates: ${validRadioStations.length}/${radioStations.length}`);
    
  } catch (error) {
    console.error('Error checking stations:', error);
  }
}

// Run the check
checkSpecificStations();