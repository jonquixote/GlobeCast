import TVService from './src/services/tvService.js';

async function debugTVService() {
  console.log('Debugging TV Service...');
  
  try {
    // Test getting local stations
    console.log('Testing getLocalStations...');
    const localStations = await TVService.getLocalStations(100);
    console.log(`Got ${localStations.length} local stations`);
    
    if (localStations.length > 0) {
      console.log('First 5 local stations:');
      localStations.slice(0, 5).forEach((station, index) => {
        console.log(`${index + 1}. ${station.name} - ${station.url} (${station.latitude}, ${station.longitude})`);
      });
    }
    
    // Test getting sample stations
    console.log('\nTesting getSampleStations...');
    const sampleStations = await TVService.getSampleStations(100);
    console.log(`Got ${sampleStations.length} sample stations`);
    
    if (sampleStations.length > 0) {
      console.log('First 5 sample stations:');
      sampleStations.slice(0, 5).forEach((station, index) => {
        console.log(`${index + 1}. ${station.name} - ${station.url} (${station.latitude}, ${station.longitude})`);
      });
    }
  } catch (error) {
    console.error('Error in TV service debug:', error);
  }
}

debugTVService();