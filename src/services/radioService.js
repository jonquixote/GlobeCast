import axios from 'axios';
import radioStations from '../data/radioStations.json' with { type: 'json' };

const RADIO_BROWSER_BASE_URL = 'https://de1.api.radio-browser.info';

class RadioService {
  constructor() {
    this.api = axios.create({
      baseURL: RADIO_BROWSER_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    // Use local data instead of API calls for better performance with large dataset
    this.localStations = radioStations;
  }

  /**
   * Get radio stations from local data
   * @param {number} limit - Number of stations to fetch
   * @returns {Promise<Array>} Array of radio station objects
   */
  async getLocalStations(limit = 100) {
    try {
      // Shuffle array to get random stations
      const shuffled = this.localStations.sort(() => 0.5 - Math.random());
      return shuffled.slice(0, limit).map(station => ({
        id: station.stationuuid,
        name: station.name,
        url: station.url_resolved || station.url,
        homepage: station.homepage,
        favicon: station.favicon,
        country: station.country,
        countrycode: station.countrycode,
        state: station.state,
        language: station.language,
        tags: station.tags,
        codec: station.codec,
        bitrate: station.bitrate,
        latitude: parseFloat(station.geo_lat),
        longitude: parseFloat(station.geo_long),
        votes: station.votes,
        clickcount: station.clickcount,
        lastcheckok: station.lastcheckok,
        type: 'radio',
      }));
    } catch (error) {
      console.error('Error fetching radio stations:', error);
      return [];
    }
  }

  /**
   * Fetch popular radio stations with geographic coordinates
   * @param {number} limit - Number of stations to fetch
   * @returns {Promise<Array>} Array of radio station objects
   */
  async getPopularStations(limit = 100) {
    try {
      // Use local data for better performance
      return await this.getLocalStations(limit);
    } catch (error) {
      console.error('Error fetching radio stations:', error);
      return [];
    }
  }

  /**
   * Search radio stations by country
   * @param {string} countryCode - ISO country code (e.g., 'US', 'DE')
   * @param {number} limit - Number of stations to fetch
   * @returns {Promise<Array>} Array of radio station objects
   */
  async getStationsByCountry(countryCode, limit = 50) {
    try {
      // Filter local stations by country
      const countryStations = this.localStations.filter(station => 
        station.countrycode === countryCode
      );
      
      // Shuffle and limit results
      const shuffled = countryStations.sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, limit);
      
      return selected.map(station => ({
        id: station.stationuuid,
        name: station.name,
        url: station.url_resolved || station.url,
        homepage: station.homepage,
        favicon: station.favicon,
        country: station.country,
        countrycode: station.countrycode,
        state: station.state,
        language: station.language,
        tags: station.tags,
        codec: station.codec,
        bitrate: station.bitrate,
        latitude: parseFloat(station.geo_lat),
        longitude: parseFloat(station.geo_long),
        votes: station.votes,
        clickcount: station.clickcount,
        lastcheckok: station.lastcheckok,
        type: 'radio',
      }));
    } catch (error) {
      console.error('Error fetching radio stations by country:', error);
      return [];
    }
  }

  /**
   * Get a diverse set of radio stations from different countries
   * @returns {Promise<Array>} Array of radio station objects
   */
  async getDiverseStations() {
    try {
      // Use local data for better performance with large dataset
      return await this.getLocalStations(1000);
    } catch (error) {
      console.error('Error fetching diverse radio stations:', error);
      return [];
    }
  }
}

export default new RadioService();
