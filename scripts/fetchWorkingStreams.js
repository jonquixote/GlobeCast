import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Simple stream validation function
async function validateStream(url, timeout = 3000) {
  try {
    // Try a HEAD request first
    const response = await axios.head(url, {
      timeout: timeout,
      maxRedirects: 2,
      validateStatus: (status) => status < 500
    });
    
    // Accept 2xx and some 4xx status codes as valid
    if (response.status < 400 || response.status === 403 || response.status === 401) {
      console.log(`✓ Valid stream: ${url} (Status: ${response.status})`);
      return true;
    }
    
    console.log(`✗ Invalid stream: ${url} (Status: ${response.status})`);
    return false;
  } catch (error) {
    // For timeout errors, we'll consider them as potentially valid
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      console.log(`? Stream timeout (possibly valid): ${url}`);
      return true;
    }
    
    console.log(`✗ Invalid stream: ${url} - ${error.message}`);
    return false;
  }
}

// Function to geocode locations
async function geocodeLocation(city, country) {
  try {
    // Simple geocoding with a free service
    const response = await axios.get('https://nominatim.openstreetmap.org/search', {
      params: {
        q: `${city}, ${country}`,
        format: 'json',
        limit: 1
      },
      headers: {
        'User-Agent': 'GlobeMediaStreamer/1.0'
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

async function fetchWorkingTVStations() {
  try {
    console.log('Fetching working TV stations...');
    
    // Use a reliable IPTV playlist source - let's try a known good one
    const playlistUrls = [
      'https://iptv-org.github.io/iptv/categories/general.m3u',
      'https://iptv-org.github.io/iptv/categories/news.m3u',
      'https://iptv-org.github.io/iptv/categories/sports.m3u',
      'https://iptv-org.github.io/iptv/countries/us.m3u',
      'https://iptv-org.github.io/iptv/countries/uk.m3u'
    ];
    
    let allStations = [];
    
    // Try each playlist until we find one that works
    for (const playlistUrl of playlistUrls) {
      try {
        console.log(`Trying playlist: ${playlistUrl}`);
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
        
        if (allStations.length > 0) {
          console.log(`Found ${allStations.length} stations from ${playlistUrl}`);
          break;
        }
      } catch (error) {
        console.log(`Failed to fetch from ${playlistUrl}: ${error.message}`);
        continue;
      }
    }
    
    if (allStations.length === 0) {
      console.log('No stations found from any playlist. Using fallback data...');
      // Fallback to some known working streams
      allStations = [
        {
          id: 'bbc-news',
          name: 'BBC News',
          country: 'United Kingdom',
          logo: '',
          group: 'News',
          url: 'https://vs-cmaf-pushb-ww-live.akamaized.net/x=4/i=urn:bbc:pips:service:bbc_news_channel_hd/t=3840/v=pv14/b=5070016/main.mpd'
        },
        {
          id: 'cnn',
          name: 'CNN',
          country: 'United States',
          logo: '',
          group: 'News',
          url: 'https://cnn-cnninternational-1-eu.rakuten.tv/live/playlist.m3u8'
        },
        {
          id: 'euronews',
          name: 'Euronews',
          country: 'France',
          logo: '',
          group: 'News',
          url: 'https://euronews-al.akta.io/euronews.m3u8'
        }
      ];
    }
    
    console.log(`Found ${allStations.length} stations. Testing streams...`);
    
    // Test and filter valid streams
    const validStations = [];
    const locationCache = new Map();
    
    for (let i = 0; i < Math.min(allStations.length, 200); i++) {
      const station = allStations[i];
      
      if (!station.url) continue;
      
      // Validate stream
      const isValid = await validateStream(station.url);
      
      if (isValid) {
        // Extract location info
        let city = 'Unknown';
        if (station.name.includes(',')) {
          city = station.name.split(',').pop().trim();
        } else if (station.name.includes('-')) {
          city = station.name.split('-').pop().trim();
        } else if (station.name.includes('TV')) {
          const parts = station.name.split('TV');
          city = parts[0].trim();
        } else {
          city = station.name.trim();
        }
        
        // Clean city name
        city = city.replace(/[^\\w\\s]/g, '').trim().substring(0, 30);
        if (city.length < 2) city = station.country;
        
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
          id: station.id,
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
      if ((i + 1) % 20 === 0) {
        console.log(`Tested ${i + 1}/${Math.min(allStations.length, 200)} stations...`);
      }
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log(`\nValidation complete:`);
    console.log(`✓ Valid streams: ${validStations.length}`);
    console.log(`✗ Invalid streams: ${Math.min(allStations.length, 200) - validStations.length}`);
    
    // Save results
    const outputPath = path.join(__dirname, '..', 'src', 'data', 'tvStations.json');
    fs.writeFileSync(outputPath, JSON.stringify(validStations, null, 2));
    
    const tvWithUrlsPath = path.join(__dirname, '..', 'src', 'data', 'tvStationsWithUrls.json');
    fs.writeFileSync(tvWithUrlsPath, JSON.stringify(validStations, null, 2));
    
    console.log(`\nSaved ${validStations.length} working TV stations to data files.`);
    
    return validStations;
  } catch (error) {
    console.error('Error fetching TV stations:', error);
    return [];
  }
}

// Run the script
fetchWorkingTVStations();