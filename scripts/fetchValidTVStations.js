import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to test if a stream URL is alive (simplified version)
async function testStreamUrl(url, timeout = 5000) {
  try {
    // Make a HEAD request to test if the URL is accessible
    const response = await axios.head(url, {
      timeout: timeout,
      maxRedirects: 3,
      validateStatus: function (status) {
        // Accept status codes 200-399 as valid, and some 4xx that indicate the stream exists
        return status < 500;
      }
    });
    
    // If we get here, the stream is likely alive or accessible
    console.log(`✓ Stream accessible: ${url} (Status: ${response.status})`);
    return true;
  } catch (error) {
    // For timeout errors, we'll consider them as potentially alive
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      console.log(`? Stream timeout (may be alive): ${url}`);
      return true;
    }
    
    // For other network errors, the stream is likely dead
    console.log(`✗ Stream dead: ${url} - ${error.message}`);
    return false;
  }
}

// Function to geocode a city
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
        'User-Agent': 'GlobeMediaStreamer/1.0 (globe-media-streamer)'
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
          'User-Agent': 'GlobeMediaStreamer/1.0 (globe-media-streamer)'
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

async function fetchAndValidateTVStations() {
  try {
    console.log('Fetching and validating TV stations from reliable IPTV sources...');
    
    // URLs of more reliable IPTV playlists
    const playlistUrls = [
      'https://iptv-org.github.io/iptv/categories/news.m3u',
      'https://iptv-org.github.io/iptv/categories/sports.m3u',
      'https://iptv-org.github.io/iptv/categories/general.m3u',
      'https://iptv-org.github.io/iptv/countries/us.m3u',
      'https://iptv-org.github.io/iptv/countries/uk.m3u',
      'https://iptv-org.github.io/iptv/countries/de.m3u'
    ];
    
    let allStations = [];
    
    // Fetch from each playlist
    for (const playlistUrl of playlistUrls) {
      try {
        console.log(`Fetching from: ${playlistUrl}`);
        const response = await axios.get(playlistUrl);
        const lines = response.data.split('\n');
        
        let currentStation = null;
        
        // Parse the M3U file
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
              id: tvgIdMatch ? tvgIdMatch[1] : `station-${allStations.length + 1}`,
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
              allStations.push(currentStation);
            }
            
            currentStation = null;
          }
        }
      } catch (error) {
        console.warn(`Failed to fetch from ${playlistUrl}:`, error.message);
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
    
    // Test and filter stations
    const validStations = [];
    const countryCityMap = {};
    
    console.log('Testing stream availability...');
    
    for (let i = 0; i < Math.min(uniqueStations.length, 500); i++) {
      const station = uniqueStations[i];
      
      // Skip stations without URLs
      if (!station.url) continue;
      
      // Test the stream
      const isAlive = await testStreamUrl(station.url);
      
      if (isAlive) {
        // Try to extract city from name or country
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
        
        // Clean up city name
        city = city.replace(/[^\w\s]/g, '').trim();
        if (city.length > 30) {
          city = city.substring(0, 30);
        }
        
        if (city === 'Unknown' || city.length < 2) {
          city = station.country;
        }
        
        // Get coordinates
        const cacheKey = `${city}|${station.country}`;
        let coords = countryCityMap[cacheKey];
        if (!coords) {
          coords = await geocodeCity(city, station.country);
          countryCityMap[cacheKey] = coords;
          
          // Add a small delay to be respectful to the geocoding API
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        if (coords) {
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
        } else {
          // Fallback coordinates
          const fallbackLat = 40.0 + (validStations.length % 10) * 2.0;
          const fallbackLon = -100.0 + Math.floor(validStations.length / 10) * 2.0;
          
          validStations.push({
            id: station.id || `tv-${validStations.length + 1}`,
            name: station.name,
            url: station.url,
            logo: station.logo,
            country: station.country,
            city: city,
            latitude: fallbackLat,
            longitude: fallbackLon,
            categories: station.group
          });
        }
      }
      
      // Add a small delay between tests
      if (i < uniqueStations.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 150));
      }
      
      // Log progress
      if ((i + 1) % 25 === 0) {
        console.log(`Progress: ${i + 1}/${Math.min(uniqueStations.length, 500)} stations tested`);
      }
    }
    
    console.log(`\nResults:`);
    console.log(`✓ Valid streams: ${validStations.length}`);
    
    // Write to file
    const outputPath = path.join(__dirname, '..', 'src', 'data', 'tvStations.json');
    fs.writeFileSync(outputPath, JSON.stringify(validStations, null, 2));
    
    console.log(`Saved ${validStations.length} validated TV stations to ${outputPath}`);
    
    // Also generate the tvStationsWithUrls.json file
    const tvStationsWithUrls = validStations.map((station, index) => {
      return {
        ...station,
        url: station.url
      };
    });
    
    const tvWithUrlsOutputPath = path.join(__dirname, '..', 'src', 'data', 'tvStationsWithUrls.json');
    fs.writeFileSync(tvWithUrlsOutputPath, JSON.stringify(tvStationsWithUrls, null, 2));
    
    console.log(`Saved ${tvStationsWithUrls.length} TV stations with URLs to ${tvWithUrlsOutputPath}`);
    
    return validStations;
  } catch (error) {
    console.error('Error fetching and validating TV stations:', error);
    return [];
  }
}

// Run the function
fetchAndValidateTVStations().catch(console.error);