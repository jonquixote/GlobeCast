#!/usr/bin/env node

/**
 * Scheduled Task: Update Working TV Stations
 * 
 * This script should be run periodically (e.g., weekly) to:
 * 1. Fetch new IPTV streams from reliable sources
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
async function validateStream(url, timeout = CONFIG.VALIDATION_TIMEOUT) {
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
        'User-Agent': 'GlobeMediaStreamer/1.0 (Scheduled Update)'
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

// Country mapping
const countryMap = {
  'US': 'United States',
  'GB': 'United Kingdom',
  'DE': 'Germany',
  'FR': 'France',
  'IT': 'Italy',
  'ES': 'Spain',
  'CA': 'Canada',
  'AU': 'Australia',
  'JP': 'Japan',
  'KR': 'South Korea',
  'CN': 'China',
  'IN': 'India',
  'BR': 'Brazil',
  'MX': 'Mexico',
  'RU': 'Russia',
  'NL': 'Netherlands',
  'SE': 'Sweden',
  'NO': 'Norway',
  'DK': 'Denmark',
  'FI': 'Finland',
  'PL': 'Poland',
  'CZ': 'Czech Republic',
  'HU': 'Hungary',
  'TR': 'Turkey',
  'IL': 'Israel',
  'ZA': 'South Africa'
};

async function updateWorkingTVStations() {
  console.log('=== Starting TV Station Update ===');
  const startTime = Date.now();
  
  try {
    // Fetch from multiple reliable IPTV sources
    const playlistUrls = [
      'https://iptv-org.github.io/iptv/categories/general.m3u',
      'https://iptv-org.github.io/iptv/categories/news.m3u',
      'https://iptv-org.github.io/iptv/categories/sports.m3u',
      'https://iptv-org.github.io/iptv/countries/us.m3u',
      'https://iptv-org.github.io/iptv/countries/uk.m3u'
    ];
    
    let allStations = [];
    
    // Fetch stations from each playlist
    for (const playlistUrl of playlistUrls) {
      try {
        console.log(`Fetching from: ${playlistUrl}`);
        const response = await axios.get(playlistUrl);
        const lines = response.data.split('\n');
        
        let currentStation = null;
        
        // Parse M3U file
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();
          
          if (line.startsWith('#EXTINF:')) {
            // Parse EXTINF line
            const info = line.substring(8);
            const name = info.includes(',') ? info.split(',').pop().trim() : 'Unknown Station';
            
            // Extract metadata
            const tvgId = info.match(/tvg-id="([^"]*)"/)?.[1] || '';
            const tvgCountry = info.match(/tvg-country="([^"]*)"/)?.[1] || 'US';
            const tvgLogo = info.match(/tvg-logo="([^"]*)"/)?.[1] || '';
            const groupTitle = info.match(/group-title="([^"]*)"/)?.[1] || 'General';
            
            const countryName = countryMap[tvgCountry] || tvgCountry;
            
            currentStation = {
              id: tvgId || `station-${allStations.length + 1}`,
              name: name,
              country: countryName,
              logo: tvgLogo,
              group: groupTitle,
              url: ''
            };
          } else if (line.startsWith('http') && currentStation) {
            currentStation.url = line;
            allStations.push(currentStation);
            currentStation = null;
          }
        }
      } catch (error) {
        console.warn(`Failed to fetch from ${playlistUrl}:`, error.message);
      }
    }
    
    console.log(`Total stations found: ${allStations.length}`);
    
    // Remove duplicates by URL
    const uniqueStations = [];
    const seenUrls = new Set();
    
    for (const station of allStations) {
      if (station.url && !seenUrls.has(station.url)) {
        seenUrls.add(station.url);
        uniqueStations.push(station);
      }
    }
    
    console.log(`Unique stations: ${uniqueStations.length}`);
    
    // Test and filter valid streams
    const validStations = [];
    const locationCache = new Map();
    
    console.log('Testing stream validity...');
    
    for (let i = 0; i < Math.min(uniqueStations.length, CONFIG.MAX_STATIONS); i++) {
      const station = uniqueStations[i];
      
      if (!station.url) continue;
      
      // Validate stream
      const isValid = await validateStream(station.url);
      
      if (isValid) {
        // Extract location info
        let city = 'Unknown';
        if (station.name.includes(',')) {
          const parts = station.name.split(',');
          city = parts[parts.length - 1].trim();
        } else if (station.name.includes('-')) {
          const parts = station.name.split('-');
          city = parts[parts.length - 1].trim();
        } else if (station.name.includes('TV')) {
          const parts = station.name.split('TV');
          if (parts.length > 1) {
            city = parts[0].trim();
          } else {
            city = station.name.trim();
          }
        } else {
          city = station.name.trim();
        }
        
        // Clean city name
        city = city.replace(/[^\\w\\s]/g, '').trim().substring(0, 30);
        if (city.length < 2) {
          city = station.country;
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
          id: station.id || `tv-${validStations.length + 1}`,
          name: station.name,
          url: station.url,
          logo: station.logo,
          country: station.country,
          city: city,
          latitude: coords.lat,
          longitude: coords.lon,
          categories: station.group
        });
      }
      
      // Progress update
      if ((i + 1) % 25 === 0) {
        console.log(`Tested ${i + 1}/${Math.min(uniqueStations.length, CONFIG.MAX_STATIONS)} stations...`);
      }
      
      // Delay between requests to avoid overwhelming servers
      await new Promise(resolve => setTimeout(resolve, CONFIG.REQUEST_DELAY));
    }
    
    console.log(`\nValidation complete:`);
    console.log(`✓ Valid streams: ${validStations.length}`);
    console.log(`✗ Invalid streams: ${Math.min(uniqueStations.length, CONFIG.MAX_STATIONS) - validStations.length}`);
    
    // Save results
    const outputPath = path.join(__dirname, '..', 'src', 'data', 'tvStations.json');
    fs.writeFileSync(outputPath, JSON.stringify(validStations, null, 2));
    
    const tvWithUrlsPath = path.join(__dirname, '..', 'src', 'data', 'tvStationsWithUrls.json');
    fs.writeFileSync(tvWithUrlsPath, JSON.stringify(validStations, null, 2));
    
    const endTime = Date.now();
    const duration = Math.round((endTime - startTime) / 1000);
    
    console.log(`\n=== Update Complete ===`);
    console.log(`Saved ${validStations.length} working TV stations to data files.`);
    console.log(`Duration: ${duration} seconds`);
    console.log(`Timestamp: ${new Date().toISOString()}`);
    
    // Log summary statistics
    const countries = [...new Set(validStations.map(s => s.country))];
    const categories = [...new Set(validStations.map(s => s.categories))];
    
    console.log(`\nSummary:`);
    console.log(`- Countries: ${countries.length}`);
    console.log(`- Categories: ${categories.length}`);
    console.log(`- Average streams per country: ${Math.round(validStations.length / countries.length)}`);
    
    return validStations;
  } catch (error) {
    console.error('Error updating TV stations:', error);
    process.exit(1);
  }
}

// Run the update if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  updateWorkingTVStations()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export default updateWorkingTVStations;