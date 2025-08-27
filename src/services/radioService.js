import axios from 'axios';

const RADIO_BROWSER_BASE_URL = 'https://de1.api.radio-browser.info';

class RadioService {
  constructor() {
    this.api = axios.create({
      baseURL: RADIO_BROWSER_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Fetch popular radio stations with geographic coordinates
   * @param {number} limit - Number of stations to fetch
   * @returns {Promise<Array>} Array of radio station objects
   */
  async getPopularStations(limit = 100) {
    try {
      const response = await this.api.get('/json/stations/search', {
        params: {
          limit,
          order: 'clickcount',
          reverse: 'true',
          hidebroken: 'true',
          has_geo_info: 'true', // Only stations with geographic coordinates
        },
      });

      return response.data.map(station => ({
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
        geo_lat: station.geo_lat,
        geo_long: station.geo_long,
        votes: station.votes,
        clickcount: station.clickcount,
        lastcheckok: station.lastcheckok,
        type: 'radio',
      }));
    } catch (error) {
      console.error('Error fetching radio stations:', error);
      throw error;
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
      const response = await this.api.get('/json/stations/bycountrycodeexact/' + countryCode, {
        params: {
          limit,
          order: 'clickcount',
          reverse: 'true',
          hidebroken: 'true',
          has_geo_info: 'true',
        },
      });

      return response.data.map(station => ({
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
        geo_lat: station.geo_lat,
        geo_long: station.geo_long,
        votes: station.votes,
        clickcount: station.clickcount,
        lastcheckok: station.lastcheckok,
        type: 'radio',
      }));
    } catch (error) {
      console.error('Error fetching radio stations by country:', error);
      throw error;
    }
  }

  /**
   * Get a diverse set of radio stations from different countries
   * @returns {Promise<Array>} Array of radio station objects
   */
  async getDiverseStations() {
    try {
      const countries = ['US', 'GB', 'DE', 'FR', 'IT', 'ES', 'CA', 'AU', 'JP', 'BR'];
      const stationsPerCountry = 10;
      
      const promises = countries.map(country => 
        this.getStationsByCountry(country, stationsPerCountry)
          .catch(error => {
            console.warn(`Failed to fetch stations for ${country}:`, error);
            return [];
          })
      );

      const results = await Promise.all(promises);
      return results.flat();
    } catch (error) {
      console.error('Error fetching diverse radio stations:', error);
      throw error;
    }
  }
}

export default new RadioService();

