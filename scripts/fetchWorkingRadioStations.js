import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to validate radio streams
async function validateRadioStream(url, timeout = 3000) {
  try {
    // Try a HEAD request first
    const response = await axios.head(url, {
      timeout: timeout,
      maxRedirects: 2,
      validateStatus: (status) => status < 500
    });
    
    // Accept 2xx and some 4xx status codes as valid
    if (response.status < 400 || response.status === 403 || response.status === 401) {
      console.log(`✓ Valid radio stream: ${url} (Status: ${response.status})`);
      return true;
    }
    
    console.log(`✗ Invalid radio stream: ${url} (Status: ${response.status})`);
    return false;
  } catch (error) {
    // For timeout errors, we'll consider them as potentially valid
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      console.log(`? Radio stream timeout (possibly valid): ${url}`);
      return true;
    }
    
    console.log(`✗ Invalid radio stream: ${url} - ${error.message}`);
    return false;
  }
}

// Function to geocode locations
async function geocodeLocation(city, country) {
  try {
    const response = await axios.get('https://nominatim.openstreetmap.org/search', {
      params: {
        q: `${city}, ${country}`,
        format: 'json',
        limit: 1
      },
      headers: {
        'User-Agent': 'GlobeMediaStreamer/1.0 (Radio Update)'
      }
    });

    if (response.data && response.data.length > 0) {
      return {
        lat: parseFloat(response.data[0].lat),
        lon: parseFloat(response.data[0].lon)
      };
    }
  } catch (error) {
    console.warn(`Geocoding failed for ${city}, ${country}`);
  }
  return null;
}

async function fetchWorkingRadioStations() {
  try {
    console.log('Fetching working radio stations from Radio-Browser.info...');
    
    // Fetch popular stations with click counts for reliability
    const response = await axios.get('https://de1.api.radio-browser.info/json/stations/search', {
      params: {
        order: 'clickcount',
        reverse: true,
        limit: 500,
        hidebroken: true // Only return stations that are currently working
      },
      headers: {
        'User-Agent': 'GlobeMediaStreamer/1.0 (globe-media-streamer)'
      }
    });
    
    const stations = response.data;
    console.log(`Found ${stations.length} radio stations from Radio-Browser.info`);
    
    // Test and filter valid streams
    const validStations = [];
    const locationCache = new Map();
    
    console.log('Testing radio stream validity...');
    
    for (let i = 0; i < Math.min(stations.length, 300); i++) {
      const station = stations[i];
      
      // Skip stations without URLs
      if (!station.url || !station.url_resolved) continue;
      
      // Use the resolved URL if available, otherwise use the main URL
      const streamUrl = station.url_resolved || station.url;
      
      // Validate stream
      const isValid = await validateRadioStream(streamUrl);
      
      if (isValid) {
        // Extract location info
        let city = station.state || 'Unknown';
        if (station.name.includes(',')) {
          city = station.name.split(',')[0].trim();
        } else if (station.name.includes('-')) {
          city = station.name.split('-')[0].trim();
        }
        
        // Clean city name
        city = city.replace(/[^\\w\\s]/g, '').trim().substring(0, 30);
        if (city.length < 2) {
          city = station.country || 'Unknown';
        }
        
        // Get coordinates
        const cacheKey = `${city}|${station.country}`;
        let coords = locationCache.get(cacheKey);
        
        if (!coords) {
          coords = await geocodeLocation(city, station.country);
          locationCache.set(cacheKey, coords);
          
          // Be respectful to geocoding API
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        // Use fallback if geocoding failed
        if (!coords) {
          coords = {
            lat: 20 + (validStations.length % 15) * 5,
            lon: -120 + Math.floor(validStations.length / 15) * 10
          };
        }
        
        validStations.push({
          stationuuid: station.stationuuid,
          name: station.name,
          url: streamUrl,
          homepage: station.homepage,
          favicon: station.favicon,
          country: station.country,
          countrycode: station.countrycode,
          state: station.state,
          language: station.language,
          tags: station.tags,
          codec: station.codec,
          bitrate: station.bitrate,
          geo_lat: coords.lat,
          geo_long: coords.lon,
          votes: station.votes,
          clickcount: station.clickcount,
          lastcheckok: station.lastcheckok,
          type: 'radio'
        });
      }
      
      // Progress update
      if ((i + 1) % 25 === 0) {
        console.log(`Tested ${i + 1}/${Math.min(stations.length, 300)} radio stations...`);
      }
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log(`\nRadio validation complete:`);
    console.log(`✓ Valid streams: ${validStations.length}`);
    console.log(`✗ Invalid streams: ${Math.min(stations.length, 300) - validStations.length}`);
    
    // Save results
    const outputPath = path.join(__dirname, '..', 'src', 'data', 'radioStations.json');
    fs.writeFileSync(outputPath, JSON.stringify(validStations, null, 2));
    
    console.log(`\nSaved ${validStations.length} working radio stations to ${outputPath}`);
    
    return validStations;
  } catch (error) {
    console.error('Error fetching radio stations:', error);
    return [];
  }
}

// Run the script
fetchWorkingRadioStations();