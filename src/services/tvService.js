import axios from 'axios';
import tvStations from '../data/tvStationsWithUrls.json' with { type: 'json' };

class TVService {
  constructor() {
    this.api = axios.create();
    this.localStations = tvStations;
  }

  /**
   * Fetch the main playlist M3U data
   * @returns {Promise<string>} M3U content
   */
  async getMainPlaylist() {
    try {
      // Not used anymore since we're using local data
      return '';
    } catch (error) {
      console.error('Error fetching main playlist:', error);
      return '';
    }
  }

  /**
   * Parse M3U content into an array of stream objects
   * @param {string} m3uContent - Raw M3U content
   * @returns {Array} Array of parsed stream objects
   */
  parseM3U(m3uContent) {
    // Not used anymore since we're using local data
    return [];
  }

  /**
   * Validate a stream URL to check if it's likely to work
   * @param {string} url - Stream URL to validate
   * @returns {boolean} - Whether the stream is likely to work
   */
  validateStreamUrl(url) {
    if (!url) return false;
    
    // Convert to lowercase for easier matching
    const lowerUrl = url.toLowerCase();
    
    // Known problematic patterns
    const problematicPatterns = [
      'githubusercontent',
      'paradise-91',
      'broken',
      'test',
      // Domains known to have CORS issues
      'akamaized.net',
      'canlitvapp.com'
    ];
    
    // Check for problematic patterns
    if (problematicPatterns.some(pattern => lowerUrl.includes(pattern))) {
      return false;
    }
    
    // Check for valid stream extensions
    const validExtensions = [
      '.m3u8', '.mpd', '.mp4', '.webm'
    ];
    
    // If it doesn't have a valid extension, it might still be valid
    // but we'll be more cautious
    const hasValidExtension = validExtensions.some(ext => lowerUrl.includes(ext));
    
    // For URLs without valid extensions, we'll accept them if they're from
    // known streaming services
    const knownServices = [
      'youtube.com', 'twitch.tv', 'vimeo.com'
    ];
    
    if (!hasValidExtension && 
        !knownServices.some(service => lowerUrl.includes(service))) {
      return false;
    }
    
    return true;
  }

  /**
   * Get TV stations from local data
   * @param {number} limit - Maximum number of stations to return
   * @returns {Promise<Array>} Array of TV station objects
   */
  async getLocalStations(limit = 100) {
    try {
      // Shuffle array to get random stations
      const shuffled = this.localStations.sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, limit);
      
      return selected.map(channel => ({
        id: channel.id,
        name: channel.name,
        url: channel.url,
        logo: channel.logo,
        group: channel.categories ? channel.categories.split(';')[0] : 'General',
        country: channel.country,
        city: channel.city,
        latitude: parseFloat(channel.latitude),
        longitude: parseFloat(channel.longitude),
        type: 'tv',
      })).filter(channel => {
        // Validate the stream URL
        return this.validateStreamUrl(channel.url);
      });
    } catch (error) {
      console.error('Error getting local TV stations:', error);
      return [];
    }
  }

  /**
   * Get a sample of TV stations with geographic coordinates and stream URLs
   * @param {number} limit - Maximum number of stations to return
   * @returns {Promise<Array>} Array of TV station objects
   */
  async getSampleStations(limit = 100) {
    try {
      // Use local data for better performance with large dataset
      return await this.getLocalStations(limit);
    } catch (error) {
      console.error('Error getting sample TV stations:', error);
      return [];
    }
  }
}

export default new TVService();
