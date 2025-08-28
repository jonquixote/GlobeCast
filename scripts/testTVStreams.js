import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to test if a stream URL is alive
async function testStreamUrl(url, timeout = 5000) {
  try {
    // For testing purposes, we'll check if we can make a HEAD request or get a small amount of data
    const response = await axios.head(url, {
      timeout: timeout,
      maxRedirects: 3,
      validateStatus: function (status) {
        // Accept status codes 200-399 as valid
        return status < 400;
      }
    });
    
    // If we get here, the stream is likely alive
    console.log(`✓ Stream alive: ${url}`);
    return true;
  } catch (error) {
    // Check if it's a timeout or connection error
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      console.log(`? Stream timeout (may be alive): ${url}`);
      return true; // Timeout might mean the stream is alive but slow to respond
    }
    
    // Check for redirect errors or other network issues
    if (error.response) {
      const status = error.response.status;
      // Some status codes might indicate the stream exists but has issues
      if (status === 403 || status === 401 || status === 429) {
        console.log(`? Stream exists but restricted: ${url} (Status: ${status})`);
        return true; // Stream exists but has access restrictions
      }
    }
    
    console.log(`✗ Stream dead: ${url} - ${error.message}`);
    return false;
  }
}

// Function to validate TV stations
async function validateTVStations() {
  try {
    // Read the current TV stations file
    const tvStationsPath = path.join(__dirname, '..', 'src', 'data', 'tvStations.json');
    const tvStations = JSON.parse(fs.readFileSync(tvStationsPath, 'utf8'));
    
    console.log(`Testing ${tvStations.length} TV stations...`);
    
    const validStations = [];
    const deadStations = [];
    
    // Test each station with a delay to avoid overwhelming servers
    for (let i = 0; i < tvStations.length; i++) {
      const station = tvStations[i];
      
      // Skip stations without URLs
      if (!station.url) {
        console.log(`Skipping station without URL: ${station.name}`);
        continue;
      }
      
      // Test the stream
      const isAlive = await testStreamUrl(station.url);
      
      if (isAlive) {
        validStations.push(station);
      } else {
        deadStations.push(station);
      }
      
      // Add a small delay to be respectful to servers
      if (i < tvStations.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      // Log progress every 50 stations
      if ((i + 1) % 50 === 0) {
        console.log(`Progress: ${i + 1}/${tvStations.length} stations tested`);
      }
    }
    
    console.log(`\nResults:`);
    console.log(`✓ Valid streams: ${validStations.length}`);
    console.log(`✗ Dead streams: ${deadStations.length}`);
    console.log(`Success rate: ${((validStations.length / tvStations.length) * 100).toFixed(1)}%`);
    
    // Save valid stations
    const validStationsPath = path.join(__dirname, '..', 'src', 'data', 'tvStationsValid.json');
    fs.writeFileSync(validStationsPath, JSON.stringify(validStations, null, 2));
    console.log(`\nValid stations saved to: ${validStationsPath}`);
    
    // Save dead stations for reference
    const deadStationsPath = path.join(__dirname, '..', 'src', 'data', 'tvStationsDead.json');
    fs.writeFileSync(deadStationsPath, JSON.stringify(deadStations, null, 2));
    console.log(`Dead stations saved to: ${deadStationsPath}`);
    
    // Update the main tvStations.json file with valid stations
    fs.writeFileSync(tvStationsPath, JSON.stringify(validStations, null, 2));
    console.log(`Main TV stations file updated with valid streams`);
    
    // Also update tvStationsWithUrls.json
    const tvStationsWithUrlsPath = path.join(__dirname, '..', 'src', 'data', 'tvStationsWithUrls.json');
    fs.writeFileSync(tvStationsWithUrlsPath, JSON.stringify(validStations, null, 2));
    console.log(`TV stations with URLs file updated with valid streams`);
    
    return validStations;
  } catch (error) {
    console.error('Error validating TV stations:', error);
    return [];
  }
}

// Function to create a simple test using GET request for more accurate results
async function testStreamUrlAdvanced(url, timeout = 8000) {
  try {
    // Try HEAD request first
    try {
      const headResponse = await axios.head(url, {
        timeout: Math.floor(timeout / 2),
        maxRedirects: 3,
        validateStatus: function (status) {
          return status < 500; // Accept most status codes except server errors
        }
      });
      
      // If we get a good response, the stream is likely alive
      if (headResponse.status < 400 || headResponse.status === 403 || headResponse.status === 401) {
        console.log(`✓ Stream accessible: ${url} (Status: ${headResponse.status})`);
        return true;
      }
    } catch (headError) {
      // Ignore head error and try GET request
    }
    
    // If HEAD fails, try a GET request with range header to get just a small amount of data
    const getResponse = await axios.get(url, {
      timeout: timeout,
      maxRedirects: 3,
      responseType: 'stream',
      headers: {
        'Range': 'bytes=0-1023' // Request only first 1KB
      },
      validateStatus: function (status) {
        return status < 500; // Accept most status codes except server errors
      }
    });
    
    // If we get here and receive data, the stream is likely alive
    if (getResponse.status < 400 || getResponse.status === 403 || getResponse.status === 401) {
      // Listen for data to confirm stream is working
      return new Promise((resolve) => {
        let dataReceived = false;
        
        getResponse.data.on('data', () => {
          if (!dataReceived) {
            dataReceived = true;
            console.log(`✓ Stream active: ${url} (Status: ${getResponse.status})`);
            getResponse.data.destroy(); // Stop downloading
            resolve(true);
          }
        });
        
        getResponse.data.on('end', () => {
          if (!dataReceived) {
            console.log(`? Stream exists but no data: ${url} (Status: ${getResponse.status})`);
            resolve(true); // Still consider it valid if we get a successful response
          }
        });
        
        getResponse.data.on('error', () => {
          if (!dataReceived) {
            console.log(`✗ Stream error: ${url}`);
            resolve(false);
          }
        });
        
        // Timeout if no data received
        setTimeout(() => {
          if (!dataReceived) {
            console.log(`? Stream timeout but connected: ${url} (Status: ${getResponse.status})`);
            getResponse.data.destroy();
            resolve(true); // Consider timeout as valid (stream exists but slow)
          }
        }, 3000);
      });
    } else {
      console.log(`✗ Stream dead: ${url} (Status: ${getResponse.status})`);
      return false;
    }
  } catch (error) {
    console.log(`✗ Stream dead: ${url} - ${error.message}`);
    return false;
  }
}

// Run the validation
validateTVStations().catch(console.error);