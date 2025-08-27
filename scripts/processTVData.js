import axios from 'axios';
import fs from 'fs';

const IPTV_ORG_DATABASE_URL = 'https://raw.githubusercontent.com/iptv-org/database/master/data';
const OUTPUT_FILE = 'tv_stations_with_coords.json';

class TVDataProcessor {
  constructor() {
    this.api = axios.create();
    // Cache for geocoded cities to avoid repeated API calls
    this.geocodeCache = new Map();
  }

  /**
   * Fetch the channels CSV data
   * @returns {Promise<string>} CSV content
   */
  async getChannelsCSV() {
    try {
      const response = await this.api.get(`${IPTV_ORG_DATABASE_URL}/channels.csv`);
      return response.data;
    } catch (error) {
      console.error('Error fetching channels CSV:', error);
      throw error;
    }
  }

  /**
   * Geocode a city to get its coordinates
   * @param {string} city - City name
   * @param {string} country - Country code
   * @returns {Promise<object|null>} Object with lat and long properties, or null if not found
   */
  async geocodeCity(city, country) {
    // Check cache first
    const cacheKey = `${city}|${country}`;
    if (this.geocodeCache.has(cacheKey)) {
      return this.geocodeCache.get(cacheKey);
    }

    try {
      // Try to get coordinates from a free geocoding API
      // Using Nominatim (OpenStreetMap) - be respectful of usage limits
      const response = await this.api.get('https://nominatim.openstreetmap.org/search', {
        params: {
          q: `${city}, ${country}`,
          format: 'json',
          limit: 1
        },
        headers: {
          'User-Agent': 'GlobeMediaStreamer/1.0 (globe-media-streamer)'
        }
      });

      if (response.data && response.data.length > 0) {
        const result = {
          lat: parseFloat(response.data[0].lat),
          long: parseFloat(response.data[0].lon)
        };
        // Cache the result
        this.geocodeCache.set(cacheKey, result);
        return result;
      }
    } catch (error) {
      console.warn(`Geocoding failed for ${city}, ${country}:`, error.message);
    }

    // Cache null results to avoid repeated failed requests
    this.geocodeCache.set(cacheKey, null);
    return null;
  }

  /**
   * Parse CSV content into an array of objects
   * @param {string} csvContent - Raw CSV content
   * @returns {Array} Array of parsed channel objects
   */
  parseCSV(csvContent) {
    const lines = csvContent.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    const data = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',');
      const row = {};
      headers.forEach((header, index) => {
        row[header] = values[index] ? values[index].trim() : '';
      });
      data.push(row);
    }

    return data;
  }

  /**
   * Process channels and add coordinates
   * @returns {Promise<Array>} Array of channels with coordinates
   */
  async processChannels() {
    try {
      // Fetch channels data
      const channelsCsv = await this.getChannelsCSV();
      const allChannels = this.parseCSV(channelsCsv);
      console.log(`Found ${allChannels.length} total channels in database`);

      // Filter for channels with city
      const channelsWithCity = allChannels.filter(c => c.city);
      console.log(`Found ${channelsWithCity.length} channels with city data`);

      // Process channels with coordinates
      const channelsWithCoords = [];
      let processedCount = 0;

      for (const channel of channelsWithCity) {
        try {
          const coords = await this.geocodeCity(channel.city, channel.country);
          if (coords) {
            channelsWithCoords.push({
              ...channel,
              latitude: coords.lat,
              longitude: coords.long
            });
            console.log(`Geocoded ${channel.city}, ${channel.country}: ${coords.lat}, ${coords.long}`);
          } else {
            console.log(`Failed to geocode ${channel.city}, ${channel.country}`);
          }
          
          processedCount++;
          console.log(`Processed ${processedCount}/${channelsWithCity.length} channels`);
          
          // Add a small delay to be respectful to the geocoding API
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          console.warn(`Error processing ${channel.city}, ${channel.country}:`, error.message);
        }
      }
      
      console.log(`Geocoded coordinates for ${channelsWithCoords.length} channels`);
      return channelsWithCoords;
    } catch (error) {
      console.error('Error processing channels:', error);
      return [];
    }
  }

  /**
   * Save channels to a JSON file
   * @param {Array} channels - Array of channels
   */
  async saveChannels(channels) {
    try {
      fs.writeFileSync(OUTPUT_FILE, JSON.stringify(channels, null, 2));
      console.log(`Saved ${channels.length} channels to ${OUTPUT_FILE}`);
    } catch (error) {
      console.error('Error saving channels:', error);
    }
  }

  /**
   * Run the processor
   */
  async run() {
    console.log('Starting TV data processor...');
    const channels = await this.processChannels();
    await this.saveChannels(channels);
    console.log('TV data processor finished.');
  }
}

// Run the processor if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const processor = new TVDataProcessor();
  processor.run().catch(console.error);
}

export default TVDataProcessor;