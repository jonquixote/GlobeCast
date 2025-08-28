import axios from 'axios';
import fs from 'fs';
import { parse } from 'csv-parse/sync';

const RADIO_BROWSER_URL = 'https://de1.api.radio-browser.info/json/stations/search';
const OUTPUT_FILE = 'radio_stations_with_coords.json';

class RadioDataProcessor {
  constructor() {
    this.api = axios.create();
    // Cache for geocoded cities to avoid repeated API calls
    this.geocodeCache = new Map();
  }

  /**
   * Fetch radio stations data
   * @returns {Promise<Array>} Array of radio stations
   */
  async getRadioStations() {
    try {
      console.log('Fetching radio stations...');
      // Fetch stations with geo coordinates already included
      const response = await this.api.get(RADIO_BROWSER_URL, {
        params: {
          limit: 1000, // Limit to 1000 stations for testing
          hidebroken: true,
          has_geo_info: true // Only stations with geo info
        }
      });
      console.log('Successfully fetched radio stations');
      return response.data;
    } catch (error) {
      console.error('Error fetching radio stations:', error.message);
      throw error;
    }
  }

  /**
   * Process radio stations and format them
   * @returns {Promise<Array>} Array of formatted radio stations
   */
  async processStations() {
    try {
      console.log('Starting radio station processing...');
      // Fetch radio stations data
      const allStations = await this.getRadioStations();
      console.log(`Found ${allStations.length} radio stations with geo info`);

      // Process stations
      const processedStations = [];
      let processedCount = 0;

      for (const station of allStations) {
        try {
          // Only include stations with valid geo coordinates
          if (station.geo_lat && station.geo_long) {
            processedStations.push({
              id: station.stationuuid,
              name: station.name,
              country: station.country,
              countrycode: station.countrycode,
              city: station.city,
              geo_lat: parseFloat(station.geo_lat),
              geo_long: parseFloat(station.geo_long),
              type: 'radio',
              url: station.url,
              url_resolved: station.url_resolved,
              homepage: station.homepage,
              favicon: station.favicon,
              tags: station.tags ? station.tags.split(',') : [],
              codec: station.codec,
              bitrate: station.bitrate,
              hls: station.hls,
              lastcheckok: station.lastcheckok,
              clickcount: station.clickcount
            });
            
            console.log(`Processed station: ${station.name} in ${station.city}, ${station.countrycode}`);
          }
          
          processedCount++;
          console.log(`Processed ${processedCount}/${allStations.length} stations`);
          
          // Add a small delay to be respectful to the API
          if (processedCount % 10 === 0) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        } catch (error) {
          console.warn(`Error processing station ${station.name}:`, error.message);
        }
      }
      
      console.log(`Processed ${processedStations.length} radio stations`);
      return processedStations;
    } catch (error) {
      console.error('Error processing stations:', error);
      return [];
    }
  }

  /**
   * Save stations to a JSON file
   * @param {Array} stations - Array of stations
   */
  async saveStations(stations) {
    try {
      fs.writeFileSync(OUTPUT_FILE, JSON.stringify(stations, null, 2));
      console.log(`Saved ${stations.length} stations to ${OUTPUT_FILE}`);
    } catch (error) {
      console.error('Error saving stations:', error);
    }
  }

  /**
   * Run the processor
   */
  async run() {
    console.log('Starting Radio data processor...');
    const stations = await this.processStations();
    await this.saveStations(stations);
    console.log('Radio data processor finished.');
  }
}

// Run the processor if this file is executed directly
const processor = new RadioDataProcessor();
processor.run().catch(console.error);

export default RadioDataProcessor;