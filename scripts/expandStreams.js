import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Enhanced stream validation for better coverage
async function validateStreamEnhanced(url, timeout = 3000) {
  try {
    // Try multiple approaches to validate the stream
    const methods = [
      // Method 1: HEAD request
      () => axios.head(url, {
        timeout: timeout,
        maxRedirects: 3,
        validateStatus: (status) => status < 500
      }),
      // Method 2: GET request with range
      () => axios.get(url, {
        timeout: timeout,
        maxRedirects: 3,
        responseType: 'stream',
        headers: {
          'Range': 'bytes=0-1023'
        },
        validateStatus: (status) => status < 500
      })
    ];
    
    for (let i = 0; i < methods.length; i++) {
      try {
        const response = await methods[i]();
        
        // Accept 2xx and some 4xx status codes as valid
        if (response.status < 400 || response.status === 403 || response.status === 401) {
          // For GET requests, listen for data to confirm stream is working
          if (response.data && typeof response.data.on === 'function') {
            return new Promise((resolve) => {
              let resolved = false;
              
              response.data.on('data', () => {
                if (!resolved) {
                  resolved = true;
                  console.log(`✓ Valid stream: ${url} (Status: ${response.status})`);
                  response.data.destroy();
                  resolve(true);
                }
              });
              
              response.data.on('end', () => {
                if (!resolved) {
                  resolved = true;
                  console.log(`? Stream exists but no data: ${url} (Status: ${response.status})`);
                  resolve(true);
                }
              });
              
              response.data.on('error', (error) => {
                if (!resolved) {
                  resolved = true;
                  console.log(`✗ Stream error: ${url} - ${error.message}`);
                  resolve(false);
                }
              });
              
              // Timeout if no data received
              setTimeout(() => {
                if (!resolved) {
                  resolved = true;
                  console.log(`? Stream timeout but connected: ${url} (Status: ${response.status})`);
                  response.data.destroy();
                  resolve(true);
                }
              }, 2000);
            });
          } else {
            // For HEAD requests
            console.log(`✓ Valid stream: ${url} (Status: ${response.status})`);
            return true;
          }
        }
      } catch (methodError) {
        // Continue to next method
        if (i === methods.length - 1) {
          // Last method failed
          if (methodError.code === 'ECONNABORTED' || methodError.code === 'ETIMEDOUT') {
            console.log(`? Stream timeout (possibly valid): ${url}`);
            return true;
          }
          console.log(`✗ Invalid stream: ${url} - ${methodError.message}`);
          return false;
        }
      }
    }
    
    return false;
  } catch (error) {
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      console.log(`? Stream timeout (possibly valid): ${url}`);
      return true;
    }
    console.log(`✗ Invalid stream: ${url} - ${error.message}`);
    return false;
  }
}

// Enhanced geocoding with fallback
async function geocodeEnhanced(city, country) {
  try {
    // Try with city and country first
    let response = await axios.get('https://nominatim.openstreetmap.org/search', {
      params: {
        q: `${city}, ${country}`,
        format: 'json',
        limit: 1
      },
      headers: {
        'User-Agent': 'GlobeMediaStreamer/1.0 (Enhanced Validation)'
      }
    });

    // If that fails, try with just the city
    if (!response.data || response.data.length === 0) {
      response = await axios.get('https://nominatim.openstreetmap.org/search', {
        params: {
          q: city,
          format: 'json',
          limit: 1
        },
        headers: {
          'User-Agent': 'GlobeMediaStreamer/1.0 (Enhanced Validation)'
        }
      });
    }

    if (response.data && response.data.length > 0) {
      return {
        lat: parseFloat(response.data[0].lat),
        lon: parseFloat(response.data[0].lon)
      };
    }
  } catch (error) {
    console.warn(`Geocoding failed for ${city}, ${country}:`, error.message);
  }
  return null;
}

// Expand radio stations with more sources
async function expandRadioStations() {
  console.log('Expanding radio stations with additional sources...');
  
  try {
    // Fetch from multiple endpoints to get more diverse stations
    const endpoints = [
      {
        url: 'https://de1.api.radio-browser.info/json/stations/search',
        params: { order: 'clickcount', reverse: true, limit: 300, hidebroken: true }
      },
      {
        url: 'https://de1.api.radio-browser.info/json/stations/search',
        params: { order: 'votes', reverse: true, limit: 200, hidebroken: true }
      },
      {
        url: 'https://de1.api.radio-browser.info/json/stations/search',
        params: { tag: 'pop', limit: 150, hidebroken: true }
      },
      {
        url: 'https://de1.api.radio-browser.info/json/stations/search',
        params: { tag: 'rock', limit: 150, hidebroken: true }
      },
      {
        url: 'https://de1.api.radio-browser.info/json/stations/search',
        params: { tag: 'jazz', limit: 100, hidebroken: true }
      },
      {
        url: 'https://de1.api.radio-browser.info/json/stations/search',
        params: { tag: 'classical', limit: 100, hidebroken: true }
      }
    ];
    
    let allStations = [];
    
    // Fetch from each endpoint
    for (const endpoint of endpoints) {
      try {
        console.log(`Fetching from: ${endpoint.url}`);
        const response = await axios.get(endpoint.url, {
          params: endpoint.params,
          headers: {
            'User-Agent': 'GlobeMediaStreamer/1.0 (globe-media-streamer)'
          }
        });
        
        if (response.data && response.data.length > 0) {
          allStations = [...allStations, ...response.data];
        }
      } catch (error) {
        console.warn(`Failed to fetch from ${endpoint.url}:`, error.message);
      }
    }
    
    console.log(`Total stations collected: ${allStations.length}`);
    
    // Remove duplicates by stationuuid
    const uniqueStations = [];
    const seenIds = new Set();
    
    for (const station of allStations) {
      if (station.stationuuid && !seenIds.has(station.stationuuid)) {
        seenIds.add(station.stationuuid);
        uniqueStations.push(station);
      }
    }
    
    console.log(`Unique stations after deduplication: ${uniqueStations.length}`);
    
    // Validate and filter stations
    const validStations = [];
    const locationCache = new Map();
    
    console.log('Validating radio streams...');
    
    for (let i = 0; i < Math.min(uniqueStations.length, 800); i++) {
      const station = uniqueStations[i];
      
      // Skip stations without URLs
      if (!station.url && !station.url_resolved) continue;
      
      // Use the resolved URL if available, otherwise use the main URL
      const streamUrl = station.url_resolved || station.url;
      
      // Validate stream
      const isValid = await validateStreamEnhanced(streamUrl);
      
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
          coords = await geocodeEnhanced(city, station.country);
          locationCache.set(cacheKey, coords);
          
          // Delay to be respectful to geocoding API
          await new Promise(resolve => setTimeout(resolve, 50));
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
      if ((i + 1) % 50 === 0) {
        console.log(`Validated ${i + 1}/${Math.min(uniqueStations.length, 800)} radio stations...`);
      }
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    console.log(`\nRadio validation complete:`);
    console.log(`✓ Valid streams: ${validStations.length}`);
    console.log(`✗ Invalid streams: ${Math.min(uniqueStations.length, 800) - validStations.length}`);
    
    // Save results
    const outputPath = path.join(__dirname, '..', 'src', 'data', 'radioStations.json');
    fs.writeFileSync(outputPath, JSON.stringify(validStations, null, 2));
    
    console.log(`\nSaved ${validStations.length} working radio stations to ${outputPath}`);
    
    return validStations;
  } catch (error) {
    console.error('Error expanding radio stations:', error);
    return [];
  }
}

// Expand TV stations with more sources
async function expandTVStations() {
  console.log('Expanding TV stations with additional sources...');
  
  try {
    // Fetch from multiple IPTV playlists
    const playlists = [
      'https://iptv-org.github.io/iptv/categories/general.m3u',
      'https://iptv-org.github.io/iptv/categories/news.m3u',
      'https://iptv-org.github.io/iptv/categories/sports.m3u',
      'https://iptv-org.github.io/iptv/categories/music.m3u',
      'https://iptv-org.github.io/iptv/categories/kids.m3u',
      'https://iptv-org.github.io/iptv/categories/entertainment.m3u'
    ];
    
    let allStations = [];
    
    // Fetch from each playlist
    for (const playlistUrl of playlists) {
      try {
        console.log(`Fetching from: ${playlistUrl}`);
        const response = await axios.get(playlistUrl);
        const lines = response.data.split('\n');
        
        let currentStation = null;
        
        // Parse M3U file
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();
          
          // Check for EXTINF line (contains station info)
          if (line.startsWith('#EXTINF:')) {
            // Extract information from the EXTINF line
            const info = line.substring(8); // Remove #EXTINF:
            const parts = info.split(',');
            
            // Extract name (last part after comma)
            const name = parts.length > 1 ? parts[parts.length - 1].trim() : 'Unknown Station';
            
            // Extract tvg information
            const tvgIdMatch = info.match(/tvg-id="([^"]*)"/);
            const tvgCountryMatch = info.match(/tvg-country="([^"]*)"/);
            const tvgLanguageMatch = info.match(/tvg-language="([^"]*)"/);
            const tvgLogoMatch = info.match(/tvg-logo="([^"]*)"/);
            const groupTitleMatch = info.match(/group-title="([^"]*)"/);
            
            currentStation = {
              id: tvgIdMatch ? tvgIdMatch[1] : `station-${allStations.length + 1}`,
              name: name,
              country: tvgCountryMatch ? tvgCountryMatch[1] : 'Unknown',
              language: tvgLanguageMatch ? tvgLanguageMatch[1] : 'Unknown',
              logo: tvgLogoMatch ? tvgLogoMatch[1] : '',
              group: groupTitleMatch ? groupTitleMatch[1] : 'General',
              url: '' // Will be filled in the next iteration
            };
          } 
          // Check for URL line
          else if (line.startsWith('http') && currentStation) {
            currentStation.url = line;
            
            // Only add stations with URLs
            if (currentStation.url) {
              allStations.push(currentStation);
            }
            
            currentStation = null;
          }
        }
      } catch (error) {
        console.warn(`Failed to fetch from ${playlistUrl}:`, error.message);
      }
    }
    
    console.log(`Total TV stations collected: ${allStations.length}`);
    
    // Remove duplicates by URL
    const uniqueStations = [];
    const seenUrls = new Set();
    
    for (const station of allStations) {
      if (station.url && !seenUrls.has(station.url)) {
        seenUrls.add(station.url);
        uniqueStations.push(station);
      }
    }
    
    console.log(`Unique TV stations after deduplication: ${uniqueStations.length}`);
    
    // Validate and filter stations
    const validStations = [];
    const locationCache = new Map();
    
    console.log('Validating TV streams...');
    
    for (let i = 0; i < Math.min(uniqueStations.length, 800); i++) {
      const station = uniqueStations[i];
      
      // Skip stations without URLs
      if (!station.url) continue;
      
      // Validate stream
      const isValid = await validateStreamEnhanced(station.url);
      
      if (isValid) {
        // Extract location info
        let city = 'Unknown';
        if (station.name.includes(',')) {
          city = station.name.split(',')[0].trim();
        } else if (station.name.includes('-')) {
          city = station.name.split('-')[0].trim();
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
          coords = await geocodeEnhanced(city, station.country);
          locationCache.set(cacheKey, coords);
          
          // Delay to be respectful to geocoding API
          await new Promise(resolve => setTimeout(resolve, 50));
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
          categories: station.group,
          type: 'tv'
        });
      }
      
      // Progress update
      if ((i + 1) % 50 === 0) {
        console.log(`Validated ${i + 1}/${Math.min(uniqueStations.length, 800)} TV stations...`);
      }
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    console.log(`\nTV validation complete:`);
    console.log(`✓ Valid streams: ${validStations.length}`);
    console.log(`✗ Invalid streams: ${Math.min(uniqueStations.length, 800) - validStations.length}`);
    
    // Save results
    const outputPath = path.join(__dirname, '..', 'src', 'data', 'tvStations.json');
    fs.writeFileSync(outputPath, JSON.stringify(validStations, null, 2));
    
    const tvWithUrlsPath = path.join(__dirname, '..', 'src', 'data', 'tvStationsWithUrls.json');
    fs.writeFileSync(tvWithUrlsPath, JSON.stringify(validStations, null, 2));
    
    console.log(`\nSaved ${validStations.length} working TV stations to data files`);
    
    return validStations;
  } catch (error) {
    console.error('Error expanding TV stations:', error);
    return [];
  }
}

// Main function to expand all streams
async function expandAllStreams() {
  console.log('=== Starting Stream Expansion ===');
  const startTime = Date.now();
  
  try {
    // Expand radio stations
    const radioStations = await expandRadioStations();
    
    // Expand TV stations
    const tvStations = await expandTVStations();
    
    const endTime = Date.now();
    const duration = Math.round((endTime - startTime) / 1000);
    
    console.log(`\n=== Stream Expansion Complete ===`);
    console.log(`Total radio stations: ${radioStations.length}`);
    console.log(`Total TV stations: ${tvStations.length}`);
    console.log(`Duration: ${duration} seconds`);
    console.log(`Timestamp: ${new Date().toISOString()}`);
    
    return {
      radioStations,
      tvStations
    };
  } catch (error) {
    console.error('Error expanding streams:', error);
    process.exit(1);
  }
}

// Run the expansion if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  expandAllStreams()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export default expandAllStreams;