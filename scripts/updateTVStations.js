import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

async function updateTVStations() {
  try {
    console.log('Updating TV stations from Free-TV/IPTV...');
    
    // Fetch the M3U playlist
    const response = await axios.get('https://raw.githubusercontent.com/Free-TV/IPTV/master/playlist.m3u8');
    const lines = response.data.split('\n');
    
    const stations = [];
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
          id: tvgIdMatch ? tvgIdMatch[1] : `station-${stations.length + 1}`,
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
          stations.push(currentStation);
        }
        
        currentStation = null;
      }
    }
    
    console.log(`Found ${stations.length} TV stations in playlist`);
    
    // Limit to 2000 stations and add geographic coordinates
    const limitedStations = [];
    const countryCityMap = {}; // Cache for country-city combinations
    
    for (let i = 0; i < Math.min(stations.length, 2000); i++) {
      const station = stations[i];
      
      // Skip stations without URLs
      if (!station.url) continue;
      
      // Try to extract city from name or country
      let city = 'Unknown';
      // Try to get city from the name (assume it's after the last comma or dash)
      if (station.name.includes(',')) {
        const parts = station.name.split(',');
        city = parts[parts.length - 1].trim();
      } else if (station.name.includes('-')) {
        const parts = station.name.split('-');
        city = parts[parts.length - 1].trim();
      } else if (station.name.includes('TV')) {
        // Try to extract before "TV"
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
      city = city.replace(/[^\w\s]/g, '').trim(); // Remove special characters
      if (city.length > 30) {
        city = city.substring(0, 30); // Limit length
      }
      
      // Skip if city is still unknown or too short
      if (city === 'Unknown' || city.length < 2) {
        // Use country as fallback
        city = station.country;
      }
      
      // Create a unique key for caching
      const cacheKey = `${city}|${station.country}`;
      
      // Get coordinates (use cache if available)
      let coords = countryCityMap[cacheKey];
      if (!coords) {
        coords = await geocodeCity(city, station.country);
        countryCityMap[cacheKey] = coords;
        
        // Add a small delay to be respectful to the geocoding API
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      
      // Only add stations with valid coordinates
      if (coords) {
        limitedStations.push({
          id: station.id || `tv-${limitedStations.length + 1}`,
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
        // Fallback: use approximate coordinates for the country
        console.log(`Could not geocode ${city}, ${station.country}. Adding with approximate coordinates.`);
        // We'll add a simple fallback that puts stations in a grid pattern
        const fallbackLat = 40.0 + (limitedStations.length % 20) * 1.0;
        const fallbackLon = -100.0 + Math.floor(limitedStations.length / 20) * 1.0;
        
        limitedStations.push({
          id: station.id || `tv-${limitedStations.length + 1}`,
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
    
    // Write to file
    const outputPath = path.join(__dirname, '..', 'src', 'data', 'tvStations.json');
    fs.writeFileSync(outputPath, JSON.stringify(limitedStations, null, 2));
    
    console.log(`Saved ${limitedStations.length} TV stations with coordinates to ${outputPath}`);
    
    // Also generate the tvStationsWithUrls.json file
    const tvStationsWithUrls = limitedStations.map((station, index) => {
      return {
        ...station,
        url: station.url // Keep the original URL
      };
    });
    
    const tvWithUrlsOutputPath = path.join(__dirname, '..', 'src', 'data', 'tvStationsWithUrls.json');
    fs.writeFileSync(tvWithUrlsOutputPath, JSON.stringify(tvStationsWithUrls, null, 2));
    
    console.log(`Saved ${tvStationsWithUrls.length} TV stations with URLs to ${tvWithUrlsOutputPath}`);
  } catch (error) {
    console.error('Error updating TV stations:', error);
  }
}

// Run the function
updateTVStations();