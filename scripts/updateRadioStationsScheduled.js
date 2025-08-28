#!/usr/bin/env node

/**
 * Scheduled Task: Update Working Radio Stations
 * 
 * This script should be run periodically (e.g., weekly) to:
 * 1. Fetch new radio streams from radio-browser.info
 * 2. Validate that streams are working
 * 3. Update the local database with fresh working streams
 * 4. Remove dead streams
 */

import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const CONFIG = {
  MAX_STATIONS: 300,
  VALIDATION_TIMEOUT: 5000,
  REQUEST_DELAY: 100,
  GEOCODING_DELAY: 100
};

// Simple stream validation
async function validateRadioStream(url, timeout = CONFIG.VALIDATION_TIMEOUT) {
  try {
    const response = await axios.head(url, {
      timeout: timeout,
      maxRedirects: 2,
      validateStatus: (status) => status < 500
    });
    
    // Accept 2xx and some 4xx status codes as valid
    if (response.status < 400 || response.status === 403 || response.status === 401) {
      return true;
    }
    return false;
  } catch (error) {
    // For timeout errors, we'll consider them as potentially valid
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      return true;
    }
    return false;
  }
}

// Geocoding function
async function geocodeLocation(city, country) {
  try {
    const response = await axios.get('https://nominatim.openstreetmap.org/search', {
      params: {
        q: `${city}, ${country}`,
        format: 'json',
        limit: 1
      },
      headers: {
        'User-Agent': 'GlobeMediaStreamer/1.0 (Scheduled Radio Update)'
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

async function updateWorkingRadioStations() {
  console.log('=== Starting Radio Station Update ===');
  const startTime = Date.now();
  
  try {
    // Fetch popular stations with click counts for reliability from radio-browser.info
    console.log('Fetching radio stations from Radio-Browser.info...');
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
    
    for (let i = 0; i < Math.min(stations.length, CONFIG.MAX_STATIONS); i++) {
      const station = stations[i];
      
      // Skip stations without URLs
      if (!station.url && !station.url_resolved) continue;
      
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
        } else if (station.name.includes('Radio') || station.name.includes('FM')) {
          const parts = station.name.split(' ');
          city = parts[0].trim();
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
          
          // Delay to be respectful to geocoding API
          await new Promise(resolve => setTimeout(resolve, CONFIG.GEOCODING_DELAY));
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
        console.log(`Tested ${i + 1}/${Math.min(stations.length, CONFIG.MAX_STATIONS)} radio stations...`);
      }
      
      // Delay between requests to avoid overwhelming servers
      await new Promise(resolve => setTimeout(resolve, CONFIG.REQUEST_DELAY));
    }
    
    console.log(`\nRadio validation complete:`);
    console.log(`✓ Valid streams: ${validStations.length}`);
    console.log(`✗ Invalid streams: ${Math.min(stations.length, CONFIG.MAX_STATIONS) - validStations.length}`);
    
    // Save results
    const outputPath = path.join(__dirname, '..', 'src', 'data', 'radioStations.json');
    fs.writeFileSync(outputPath, JSON.stringify(validStations, null, 2));
    
    console.log(`\nSaved ${validStations.length} working radio stations to ${outputPath}`);
    
    const endTime = Date.now();
    const duration = Math.round((endTime - startTime) / 1000);
    
    console.log(`\n=== Radio Update Complete ===`);
    console.log(`Duration: ${duration} seconds`);
    console.log(`Timestamp: ${new Date().toISOString()}`);
    
    // Log summary statistics
    const countries = [...new Set(validStations.map(s => s.country))];
    const languages = [...new Set(validStations.map(s => s.language))];
    
    console.log(`\nSummary:`);
    console.log(`- Countries: ${countries.length}`);
    console.log(`- Languages: ${languages.length}`);
    console.log(`- Average streams per country: ${Math.round(validStations.length / countries.length)}`);
    
    return validStations;
  } catch (error) {
    console.error('Error updating radio stations:', error);
    process.exit(1);
  }
}

// Run the update if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  updateWorkingRadioStations()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export default updateWorkingRadioStations;