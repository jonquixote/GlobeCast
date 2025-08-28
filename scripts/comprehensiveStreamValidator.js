import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const CONFIG = {
  MAX_RADIO_STATIONS: 1000,
  MAX_TV_STATIONS: 1000,
  VALIDATION_TIMEOUT: 5000,
  REQUEST_DELAY: 100,
  GEOCODING_DELAY: 100,
  BATCH_SIZE: 50
};

// Comprehensive stream validation
async function validateStream(url, timeout = CONFIG.VALIDATION_TIMEOUT) {
  try {
    // Try a HEAD request first (faster)
    const headResponse = await axios.head(url, {
      timeout: Math.floor(timeout / 2),
      maxRedirects: 3,
      validateStatus: (status) => status < 500
    });
    
    // Accept 2xx and some 4xx status codes as valid
    if (headResponse.status < 400 || headResponse.status === 403 || headResponse.status === 401) {
      console.log(`✓ Valid stream: ${url} (Status: ${headResponse.status})`);
      return true;
    }
    
    // For some status codes, try a GET request with range to test if stream is accessible
    if (headResponse.status === 405 || headResponse.status === 400) {
      try {
        const getResponse = await axios.get(url, {
          timeout: timeout,
          maxRedirects: 3,
          responseType: 'stream',
          headers: {
            'Range': 'bytes=0-1023' // Request only first 1KB
          },
          validateStatus: (status) => status < 500
        });
        
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
          console.log(`✗ Invalid stream: ${url} (Status: ${getResponse.status})`);
          return false;
        }
      } catch (getError) {
        console.log(`✗ Stream invalid: ${url} - ${getError.message}`);
        return false;
      }
    }
    
    console.log(`✗ Invalid stream: ${url} (Status: ${headResponse.status})`);
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

// Geocoding function
async function geocodeLocation(city, country) {
  try {
    // Try with city and country first
    let response = await axios.get('https://nominatim.openstreetmap.org/search', {
      params: {
        q: `${city}, ${country}`,
        format: 'json',
        limit: 1
      },
      headers: {
        'User-Agent': 'GlobeMediaStreamer/1.0 (Stream Validator)'
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
          'User-Agent': 'GlobeMediaStreamer/1.0 (Stream Validator)'
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

// Country code to country name mapping
const countryNames = {
  'AL': 'Albania',
  'AD': 'Andorra',
  'AT': 'Austria',
  'BY': 'Belarus',
  'BE': 'Belgium',
  'BA': 'Bosnia and Herzegovina',
  'BG': 'Bulgaria',
  'HR': 'Croatia',
  'CY': 'Cyprus',
  'CZ': 'Czech Republic',
  'DK': 'Denmark',
  'EE': 'Estonia',
  'FO': 'Faroe Islands',
  'FI': 'Finland',
  'FR': 'France',
  'DE': 'Germany',
  'GI': 'Gibraltar',
  'GR': 'Greece',
  'GG': 'Guernsey',
  'VA': 'Vatican City',
  'HU': 'Hungary',
  'IS': 'Iceland',
  'IE': 'Ireland',
  'IM': 'Isle of Man',
  'IT': 'Italy',
  'JE': 'Jersey',
  'LV': 'Latvia',
  'LI': 'Liechtenstein',
  'LT': 'Lithuania',
  'LU': 'Luxembourg',
  'MK': 'North Macedonia',
  'MT': 'Malta',
  'MD': 'Moldova',
  'MC': 'Monaco',
  'ME': 'Montenegro',
  'NL': 'Netherlands',
  'NO': 'Norway',
  'PL': 'Poland',
  'PT': 'Portugal',
  'RO': 'Romania',
  'RU': 'Russia',
  'SM': 'San Marino',
  'RS': 'Serbia',
  'SK': 'Slovakia',
  'SI': 'Slovenia',
  'ES': 'Spain',
  'SJ': 'Svalbard and Jan Mayen',
  'SE': 'Sweden',
  'CH': 'Switzerland',
  'UA': 'Ukraine',
  'GB': 'United Kingdom',
  'US': 'United States',
  'CA': 'Canada',
  'MX': 'Mexico',
  'BR': 'Brazil',
  'AR': 'Argentina',
  'CL': 'Chile',
  'CO': 'Colombia',
  'PE': 'Peru',
  'VE': 'Venezuela',
  'AU': 'Australia',
  'NZ': 'New Zealand',
  'JP': 'Japan',
  'CN': 'China',
  'IN': 'India',
  'KR': 'South Korea',
  'TR': 'Turkey',
  'IL': 'Israel',
  'SA': 'Saudi Arabia',
  'ZA': 'South Africa'
};

// Unified stream processor for both radio and TV
async function processStreams(streams, type, maxStations) {
  console.log(`Processing ${streams.length} ${type} streams...`);
  
  // Test and filter valid streams
  const validStreams = [];
  const locationCache = new Map();
  
  console.log(`Testing ${type} stream validity...`);
  
  for (let i = 0; i < Math.min(streams.length, maxStations); i++) {
    const stream = streams[i];
    
    // Skip streams without URLs
    if (!stream.url) continue;
    
    // Validate stream
    const isValid = await validateStream(stream.url);
    
    if (isValid) {
      // Extract location info
      let city = 'Unknown';
      let country = 'Unknown';
      
      if (type === 'radio') {
        city = stream.state || stream.city || 'Unknown';
        country = stream.country || 'Unknown';
        
        // Try to extract city from name if not available
        if (city === 'Unknown' && stream.name) {
          if (stream.name.includes(',')) {
            city = stream.name.split(',')[0].trim();
          } else if (stream.name.includes('-')) {
            city = stream.name.split('-')[0].trim();
          } else {
            city = stream.name.trim();
          }
        }
      } else {
        // TV stream
        city = stream.city || 'Unknown';
        country = stream.country || 'Unknown';
        
        // Try to extract city from name if not available
        if (city === 'Unknown' && stream.name) {
          if (stream.name.includes(',')) {
            city = stream.name.split(',')[0].trim();
          } else if (stream.name.includes('-')) {
            city = stream.name.split('-')[0].trim();
          } else {
            city = stream.name.trim();
          }
        }
      }
      
      // Clean city name
      city = city.replace(/[^\w\s]/g, '').trim().substring(0, 30);
      if (city.length < 2) {
        city = country;
      }
      
      // Get coordinates
      const cacheKey = `${city}|${country}`;
      let coords = locationCache.get(cacheKey);
      
      if (!coords) {
        coords = await geocodeLocation(city, country);
        locationCache.set(cacheKey, coords);
        
        // Add a small delay to be respectful to the geocoding API
        await new Promise(resolve => setTimeout(resolve, CONFIG.GEOCODING_DELAY));
      }
      
      // Use fallback if geocoding failed
      if (!coords) {
        coords = {
          lat: 20 + (validStreams.length % 15) * 5,
          lon: -120 + Math.floor(validStreams.length / 15) * 10
        };
      }
      
      // Add processed stream to valid streams
      if (type === 'radio') {
        validStreams.push({
          id: stream.stationuuid || stream.id || `radio-${validStreams.length + 1}`,
          name: stream.name,
          url: stream.url,
          homepage: stream.homepage,
          favicon: stream.favicon,
          country: stream.country,
          countrycode: stream.countrycode,
          state: stream.state,
          language: stream.language,
          tags: stream.tags,
          codec: stream.codec,
          bitrate: stream.bitrate,
          latitude: coords.lat,
          longitude: coords.lon,
          votes: stream.votes,
          clickcount: stream.clickcount,
          lastcheckok: stream.lastcheckok,
          type: 'radio'
        });
      } else {
        validStreams.push({
          id: stream.id || `tv-${validStreams.length + 1}`,
          name: stream.name,
          url: stream.url,
          logo: stream.logo,
          country: stream.country,
          city: city,
          latitude: coords.lat,
          longitude: coords.lon,
          categories: stream.categories || stream.group || 'General',
          type: 'tv'
        });
      }
    }
    
    // Progress update
    if ((i + 1) % CONFIG.BATCH_SIZE === 0) {
      console.log(`Processed ${i + 1}/${Math.min(streams.length, maxStations)} ${type} streams...`);
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, CONFIG.REQUEST_DELAY));
  }
  
  console.log(`\n${type.charAt(0).toUpperCase() + type.slice(1)} validation complete:`);
  console.log(`✓ Valid streams: ${validStreams.length}`);
  console.log(`✗ Invalid streams: ${Math.min(streams.length, maxStations) - validStreams.length}`);
  
  return validStreams;
}

// Main function to validate and update all streams
async function validateAndUpdateAllStreams() {
  console.log('=== Starting Comprehensive Stream Validation ===');
  const startTime = Date.now();
  
  try {
    // Fetch radio stations from radio-browser.info
    console.log('Fetching radio stations from Radio-Browser.info...');
    const radioResponse = await axios.get('https://de1.api.radio-browser.info/json/stations/search', {
      params: {
        order: 'clickcount',
        reverse: true,
        limit: CONFIG.MAX_RADIO_STATIONS * 2, // Fetch more to account for filtering
        hidebroken: true
      },
      headers: {
        'User-Agent': 'GlobeMediaStreamer/1.0 (globe-media-streamer)'
      }
    });
    
    const radioStations = radioResponse.data;
    console.log(`Found ${radioStations.length} radio stations from Radio-Browser.info`);
    
    // Fetch TV stations from iptv-org
    console.log('Fetching TV stations from IPTV-Org...');
    const tvPlaylists = [
      'https://iptv-org.github.io/iptv/categories/general.m3u',
      'https://iptv-org.github.io/iptv/categories/news.m3u',
      'https://iptv-org.github.io/iptv/categories/sports.m3u'
    ];
    
    let allTvStations = [];
    
    for (const playlistUrl of tvPlaylists) {
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
            
            // Get country name from code if needed
            let country = 'Unknown';
            if (tvgCountryMatch) {
              const countryCode = tvgCountryMatch[1];
              country = countryNames[countryCode] || countryCode;
            }
            
            currentStation = {
              id: tvgIdMatch ? tvgIdMatch[1] : `station-${allTvStations.length + 1}`,
              name: name,
              country: country,
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
              allTvStations.push(currentStation);
            }
            
            currentStation = null;
          }
        }
      } catch (error) {
        console.warn(`Failed to fetch from ${playlistUrl}:`, error.message);
      }
    }
    
    console.log(`Found ${allTvStations.length} TV stations from IPTV sources`);
    
    // Remove duplicates by URL
    const uniqueTvStations = [];
    const seenUrls = new Set();
    
    for (const station of allTvStations) {
      if (station.url && !seenUrls.has(station.url)) {
        seenUrls.add(station.url);
        uniqueTvStations.push(station);
      }
    }
    
    console.log(`Found ${uniqueTvStations.length} unique TV stations`);
    
    // Process radio stations
    const validRadioStations = await processStreams(radioStations, 'radio', CONFIG.MAX_RADIO_STATIONS);
    
    // Process TV stations
    const validTvStations = await processStreams(uniqueTvStations, 'tv', CONFIG.MAX_TV_STATIONS);
    
    // Save results
    const radioOutputPath = path.join(__dirname, '..', 'src', 'data', 'radioStations.json');
    fs.writeFileSync(radioOutputPath, JSON.stringify(validRadioStations, null, 2));
    
    const tvOutputPath = path.join(__dirname, '..', 'src', 'data', 'tvStations.json');
    fs.writeFileSync(tvOutputPath, JSON.stringify(validTvStations, null, 2));
    
    const tvWithUrlsOutputPath = path.join(__dirname, '..', 'src', 'data', 'tvStationsWithUrls.json');
    fs.writeFileSync(tvWithUrlsOutputPath, JSON.stringify(validTvStations, null, 2));
    
    console.log(`\n=== Stream Validation Complete ===`);
    console.log(`Saved ${validRadioStations.length} radio stations to ${radioOutputPath}`);
    console.log(`Saved ${validTvStations.length} TV stations to ${tvOutputPath}`);
    console.log(`Saved ${validTvStations.length} TV stations to ${tvWithUrlsOutputPath}`);
    
    const endTime = Date.now();
    const duration = Math.round((endTime - startTime) / 1000);
    
    console.log(`\nTotal duration: ${duration} seconds`);
    console.log(`Timestamp: ${new Date().toISOString()}`);
    
    return {
      radioStations: validRadioStations,
      tvStations: validTvStations
    };
  } catch (error) {
    console.error('Error validating streams:', error);
    process.exit(1);
  }
}

// Run the validation if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  validateAndUpdateAllStreams()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export default validateAndUpdateAllStreams;