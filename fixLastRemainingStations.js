import fs from 'fs/promises';

// Manual coordinates for the last remaining stations
const finalManualMapping = {
  'ABC 25 News Central Texas': { lat: 31.9686, lon: -99.9018 },
  'AWE (720p)': { lat: 40.7128, lon: -74.0060 }, // New York City as a default
  'AWE Encore (720p) [Geo-blocked]': { lat: 40.7128, lon: -74.0060 }, // New York City as a default
  'Canal 2 International': { lat: 29.9511, lon: -90.0715 }, // New Orleans
  'Adom TV': { lat: 5.5556, lon: -0.1961 }, // Accra, Ghana
  '# RdMix Classic Rock 70s 80s 90s': { lat: 51.2538, lon: -85.3232 } // Ontario, Canada
};

async function fixLastRemainingStations() {
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
    
    // Fix TV stations
    for (let i = 0; i < tvStations.length; i++) {
      const station = tvStations[i];
      if (finalManualMapping[station.name]) {
        const coords = finalManualMapping[station.name];
        station.geo_lat = coords.lat;
        station.geo_long = coords.lon;
        tvFixed++;
        console.log(`Fixed ${station.name}: ${coords.lat}, ${coords.lon}`);
      }
    }
    
    // Fix radio stations
    for (let i = 0; i < radioStations.length; i++) {
      const station = radioStations[i];
      if (finalManualMapping[station.name]) {
        const coords = finalManualMapping[station.name];
        station.geo_lat = coords.lat;
        station.geo_long = coords.lon;
        radioFixed++;
        console.log(`Fixed ${station.name}: ${coords.lat}, ${coords.lon}`);
      }
    }
    
    console.log(`Fixed ${tvFixed} TV stations and ${radioFixed} radio stations`);
    
    // Write the fixed data back to the files
    await fs.writeFile('./src/data/tvStationsWithUrls.json', JSON.stringify(tvStations, null, 2));
    await fs.writeFile('./src/data/radioStations.json', JSON.stringify(radioStations, null, 2));
    
    console.log('Final fixed station data saved to files');
  } catch (error) {
    console.error('Error fixing last remaining stations:', error);
  }
}

// Run the function
fixLastRemainingStations();