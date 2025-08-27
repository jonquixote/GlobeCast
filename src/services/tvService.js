import axios from 'axios';
import tvStations from '../data/tvStations.json';

const IPTV_ORG_PLAYLIST_URL = 'https://iptv-org.github.io/iptv/index.m3u';

class TVService {
  constructor() {
    this.api = axios.create();
    this.channelsWithCoords = tvStations;
  }

  /**
   * Fetch the main playlist M3U data
   * @returns {Promise<string>} M3U content
   */
  async getMainPlaylist() {
    try {
      const response = await this.api.get(IPTV_ORG_PLAYLIST_URL);
      return response.data;
    } catch (error) {
      console.error('Error fetching main playlist:', error);
      throw error;
    }
  }

  /**
   * Parse M3U content into an array of stream objects
   * @param {string} m3uContent - Raw M3U content
   * @returns {Array} Array of parsed stream objects
   */
  parseM3U(m3uContent) {
    const lines = m3uContent.trim().split('\n');
    const streams = [];
    let currentEntry = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Skip the M3U header
      if (line.startsWith('#EXTM3U')) {
        continue;
      }
      
      // Process EXTINF lines (metadata)
      if (line.startsWith('#EXTINF:')) {
        currentEntry = {
          duration: 0,
          title: '',
          tags: {},
          url: ''
        };
        
        // Extract duration and title
        const match = line.match(/#EXTINF:(-?\d+)(?:\s*,(.*))?/);
        if (match) {
          currentEntry.duration = parseInt(match[1]) || 0;
          currentEntry.title = match[2] ? match[2].trim() : '';
        }
        
        // Extract tags
        const tagMatches = line.match(/([a-zA-Z0-9-]+)="([^"]*)"/g);
        if (tagMatches) {
          tagMatches.forEach(tag => {
            const [key, value] = tag.split('=');
            currentEntry.tags[key] = value.replace(/"/g, '');
          });
        }
      }
      
      // Process URL lines
      else if (line.startsWith('http') && currentEntry) {
        currentEntry.url = line;
        // Use the tvg-name or tvg-id as title if available
        if (!currentEntry.title && currentEntry.tags['tvg-name']) {
          currentEntry.title = currentEntry.tags['tvg-name'];
        }
        if (!currentEntry.title && currentEntry.tags['tvg-id']) {
          currentEntry.title = currentEntry.tags['tvg-id'];
        }
        streams.push(currentEntry);
        currentEntry = null;
      }
    }

    return streams;
  }

  /**
   * Get a sample of TV stations with geographic coordinates and stream URLs
   * @param {number} limit - Maximum number of stations to return
   * @returns {Promise<Array>} Array of TV station objects
   */
  async getSampleStations(limit = 100) {
    try {
      // Fetch main playlist
      const playlistM3U = await this.getMainPlaylist();
      const allStreams = this.parseM3U(playlistM3U);
      console.log(`Found ${allStreams.length} streams in main playlist`);

      // Create a map of channel names to stream URLs
      const streamsMap = new Map();
      allStreams.forEach(stream => {
        // Get the title from tvg-name or tvg-id if the title is empty
        let title = stream.title;
        if (!title && stream.tags['tvg-name']) {
          title = stream.tags['tvg-name'];
        }
        if (!title && stream.tags['tvg-id']) {
          title = stream.tags['tvg-id'];
        }
        
        if (title && stream.url) {
          // Use a more robust matching by normalizing the title
          const normalizedTitle = title.toLowerCase().replace(/[^a-z0-9]/g, '');
          streamsMap.set(normalizedTitle, stream.url);
          
          // Also add the original title for better matching
          streamsMap.set(title.toLowerCase(), stream.url);
        }
      });
      console.log(`Created streams map with ${streamsMap.size} entries`);

      // Match channels with streams using a more flexible approach
      const channelsWithCoordsAndUrl = this.channelsWithCoords.map(channel => {
        // Try multiple matching strategies
        const strategies = [
          // Exact match with normalized name
          () => {
            const key = channel.name.toLowerCase().replace(/[^a-z0-9]/g, '');
            return streamsMap.get(key);
          },
          // Exact match with original name
          () => {
            const key = channel.name.toLowerCase();
            return streamsMap.get(key);
          },
          // Space-removed match
          () => {
            const key = channel.name.toLowerCase().replace(/\s+/g, '');
            return streamsMap.get(key);
          },
          // Partial match with normalized name
          () => {
            const normalizedChannelName = channel.name.toLowerCase().replace(/[^a-z0-9]/g, '');
            for (const [streamName, url] of streamsMap.entries()) {
              if (streamName.includes(normalizedChannelName) || normalizedChannelName.includes(streamName)) {
                return url;
              }
            }
            return null;
          },
          // Partial match with original name
          () => {
            const channelName = channel.name.toLowerCase();
            for (const [streamName, url] of streamsMap.entries()) {
              if (streamName.includes(channelName) || channelName.includes(streamName)) {
                return url;
              }
            }
            return null;
          },
          // Match with channel ID
          () => {
            const key = channel.id.toLowerCase().replace(/[^a-z0-9]/g, '');
            return streamsMap.get(key);
          }
        ];

        for (const strategy of strategies) {
          const url = strategy();
          if (url) {
            return {
              ...channel,
              url
            };
          }
        }
        console.log(`No match found for channel: "${channel.name}" (ID: ${channel.id})`);
        return null;
      }).filter(channel => channel !== null);

      console.log(`Found ${channelsWithCoordsAndUrl.length} channels with matching streams`);

      // Get a random sample
      const shuffled = channelsWithCoordsAndUrl.sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, limit);

      console.log(`Returning ${selected.length} TV stations`);

      return selected.map(channel => ({
        id: channel.id,
        name: channel.name,
        url: channel.url,
        logo: channel.logo,
        group: channel.categories ? channel.categories.split(';')[0] : 'General',
        country: channel.country,
        city: channel.city,
        geo_lat: parseFloat(channel.latitude),
        geo_long: parseFloat(channel.longitude),
        type: 'tv',
      }));
    } catch (error) {
      console.error('Error getting sample TV stations:', error);
      return [];
    }
  }
}

export default new TVService();