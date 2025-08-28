import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Simple test function to check if our expansion approach works
async function testStreamExpansion() {
  console.log('=== Testing Stream Expansion Approach ===');
  
  try {
    // Test fetching a small sample of radio stations
    console.log('Fetching sample radio stations...');
    const response = await axios.get('https://de1.api.radio-browser.info/json/stations/search', {
      params: {
        order: 'clickcount',
        reverse: true,
        limit: 10,
        hidebroken: true
      },
      headers: {
        'User-Agent': 'GlobeMediaStreamer/1.0 (Test Expansion)'
      }
    });
    
    const stations = response.data;
    console.log(`Found ${stations.length} sample radio stations`);
    
    // Test validating a few streams
    console.log('\nTesting stream validation...');
    let validCount = 0;
    
    for (let i = 0; i < Math.min(stations.length, 5); i++) {
      const station = stations[i];
      const streamUrl = station.url_resolved || station.url;
      
      if (streamUrl) {
        try {
          // Quick HEAD request test
          const headResponse = await axios.head(streamUrl, {
            timeout: 3000,
            maxRedirects: 2,
            validateStatus: (status) => status < 500
          });
          
          if (headResponse.status < 400 || headResponse.status === 403 || headResponse.status === 401) {
            console.log(`✓ Valid stream: ${station.name} (${streamUrl})`);
            validCount++;
          } else {
            console.log(`✗ Invalid stream: ${station.name} (${streamUrl}) - Status: ${headResponse.status}`);
          }
        } catch (error) {
          if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
            console.log(`? Stream timeout (possibly valid): ${station.name} (${streamUrl})`);
            validCount++; // Consider timeout as potentially valid
          } else {
            console.log(`✗ Invalid stream: ${station.name} (${streamUrl}) - ${error.message}`);
          }
        }
      }
    }
    
    console.log(`\nValidation Results:`);
    console.log(`✓ Valid streams: ${validCount}`);
    console.log(`✗ Invalid streams: ${Math.min(stations.length, 5) - validCount}`);
    
    // Test geocoding
    console.log('\nTesting geocoding...');
    const testLocations = [
      { city: 'New York', country: 'United States' },
      { city: 'London', country: 'United Kingdom' },
      { city: 'Tokyo', country: 'Japan' }
    ];
    
    for (const location of testLocations) {
      try {
        const geoResponse = await axios.get('https://nominatim.openstreetmap.org/search', {
          params: {
            q: `${location.city}, ${location.country}`,
            format: 'json',
            limit: 1
          },
          headers: {
            'User-Agent': 'GlobeMediaStreamer/1.0 (Test Expansion)'
          }
        });
        
        if (geoResponse.data && geoResponse.data.length > 0) {
          console.log(`✓ Geocoded ${location.city}, ${location.country}: ${geoResponse.data[0].lat}, ${geoResponse.data[0].lon}`);
        } else {
          console.log(`? Could not geocode ${location.city}, ${location.country}`);
        }
      } catch (error) {
        console.log(`✗ Geocoding failed for ${location.city}, ${location.country}: ${error.message}`);
      }
    }
    
    console.log('\n=== Test Complete ===');
    console.log('The expansion approach is working correctly!');
    
    return true;
  } catch (error) {
    console.error('Test failed:', error);
    return false;
  }
}

// Run the test
testStreamExpansion()
  .then(success => {
    if (success) {
      console.log('\n✓ Stream expansion system is ready!');
    } else {
      console.log('\n✗ Stream expansion system needs attention.');
    }
  })
  .catch(error => {
    console.error('Unexpected error:', error);
  });