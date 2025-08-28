import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to fetch and validate TV stations from multiple sources
async function fetchWorkingTVStations() {
  console.log('Fetching working TV stations from multiple sources...');
  
  try {
    // Multiple IPTV sources for better coverage
    const sources = [
      {
        name: 'General',
        url: 'https://iptv-org.github.io/iptv/categories/general.m3u'
      },
      {
        name: 'News',
        url: 'https://iptv-org.github.io/iptv/categories/news.m3u'
      },
      {
        name: 'Sports',
        url: 'https://iptv-org.github.io/iptv/categories/sports.m3u'
      },
      {
        name: 'Music',
        url: 'https://iptv-org.github.io/iptv/categories/music.m3u'
      },
      {
        name: 'Kids',
        url: 'https://iptv-org.github.io/iptv/categories/kids.m3u'
      },
      {
        name: 'Entertainment',
        url: 'https://iptv-org.github.io/iptv/categories/entertainment.m3u'
      }
    ];
    
    let allStations = [];
    
    // Fetch from each source
    for (const source of sources) {
      try {
        console.log(`Fetching from ${source.name} category...`);
        const response = await axios.get(source.url);
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
        console.warn(`Failed to fetch from ${source.name}:`, error.message);
      }
    }
    
    console.log(`Found ${allStations.length} TV stations from all sources`);
    
    // Remove duplicates by URL
    const uniqueStations = [];
    const seenUrls = new Set();
    
    for (const station of allStations) {
      if (station.url && !seenUrls.has(station.url)) {
        seenUrls.add(station.url);
        uniqueStations.push(station);
      }
    }
    
    console.log(`Found ${uniqueStations.length} unique TV stations`);
    
    // Test and filter valid streams
    const validStations = [];
    const locationCache = new Map();
    
    console.log('Testing stream availability...');
    
    for (let i = 0; i < Math.min(uniqueStations.length, 500); i++) {
      const station = uniqueStations[i];
      
      // Skip stations without URLs
      if (!station.url) continue;
      
      // Test the stream
      const isValid = await testStream(station.url);
      
      if (isValid) {
        // Extract location info
        let city = 'Unknown';
        if (station.name.includes(',')) {
          const parts = station.name.split(',');
          city = parts[0].trim();
        } else if (station.name.includes('-')) {
          const parts = station.name.split('-');
          city = parts[0].trim();
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
        
        // Clean up city name
        city = city.replace(/[^\w\s]/g, '').trim();
        if (city.length > 30) {
          city = city.substring(0, 30);
        }
        
        if (city === 'Unknown' || city.length < 2) {
          city = station.country;
        }
        
        // Get coordinates (use cache if available)
        const cacheKey = `${city}|${station.country}`;
        let coords = locationCache.get(cacheKey);
        if (!coords) {
          coords = await geocodeCity(city, station.country);
          locationCache.set(cacheKey, coords);
          
          // Add a small delay to be respectful to the geocoding API
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        // Use fallback coordinates if geocoding failed
        if (!coords) {
          const fallbackLat = 40.0 + (validStations.length % 10) * 2.0;
          const fallbackLon = -100.0 + Math.floor(validStations.length / 10) * 2.0;
          
          coords = {
            lat: fallbackLat,
            lon: fallbackLon
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
      
      // Log progress
      if ((i + 1) % 50 === 0) {
        console.log(`Tested ${i + 1}/${Math.min(uniqueStations.length, 500)} stations...`);
      }
      
      // Add a small delay between tests
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log(`\nResults:`);
    console.log(`✓ Valid streams: ${validStations.length}`);
    console.log(`✗ Invalid streams: ${Math.min(uniqueStations.length, 500) - validStations.length}`);
    
    // Write to file
    const outputPath = path.join(__dirname, '..', 'src', 'data', 'tvStations.json');
    fs.writeFileSync(outputPath, JSON.stringify(validStations, null, 2));
    
    // Also update the tvStationsWithUrls.json file
    const tvWithUrlsPath = path.join(__dirname, '..', 'src', 'data', 'tvStationsWithUrls.json');
    fs.writeFileSync(tvWithUrlsPath, JSON.stringify(validStations, null, 2));
    
    console.log(`\nSaved ${validStations.length} working TV stations to data files.`);
    
    return validStations;
  } catch (error) {
    console.error('Error fetching TV stations:', error);
    return [];
  }
}

// Simple stream testing function
async function testStream(url, timeout = 3000) {
  try {
    // Try a HEAD request first
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
async function geocodeCity(city, country) {
  try {
    // Try with city and country first
    let response = await axios.get('https://nominatim.openstreetmap.org/search', {
      params: {
        q: `${city}, ${country}`,
        format: 'json',
        limit: 1
      },
      headers: {
        'User-Agent': 'GlobeMediaStreamer/1.0 (TV Station Fetcher)'
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
          'User-Agent': 'GlobeMediaStreamer/1.0 (TV Station Fetcher)'
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

// Run the function
fetchWorkingTVStations().catch(console.error);