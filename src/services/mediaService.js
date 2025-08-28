// src/services/mediaService.js
import axios from 'axios';

// Create axios instance with base URL
const api = axios.create({
  baseURL: import.meta.env.VITE_REACT_APP_API_URL || 'http://localhost:3001/api',
  timeout: 30000,
});

// Add request interceptor to handle CORS
api.interceptors.request.use(
  config => {
    // Add timestamp to prevent caching
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle errors
api.interceptors.response.use(
  response => response,
  error => {
    console.error('API Error:', error.response || error.message);
    return Promise.reject(error);
  }
);

// Media Service
class MediaService {
  /**
   * Get all stations with optional filters
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Response with stations data
   */
  async getAllStations(params = {}) {
    try {
      const response = await api.get('/stations', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching all stations:', error);
      throw error;
    }
  }

  /**
   * Get TV stations only
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Response with TV stations data
   */
  async getTVStations(params = {}) {
    try {
      const response = await api.get('/stations/tv', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching TV stations:', error);
      throw error;
    }
  }

  /**
   * Get radio stations only
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Response with radio stations data
   */
  async getRadioStations(params = {}) {
    try {
      const response = await api.get('/stations/radio', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching radio stations:', error);
      throw error;
    }
  }

  /**
   * Get station by ID
   * @param {string} id - Station ID
   * @returns {Promise<Object>} Response with station data
   */
  async getStationById(id) {
    try {
      const response = await api.get(`/stations/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching station ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get statistics
   * @returns {Promise<Object>} Response with statistics data
   */
  async getStats() {
    try {
      const response = await api.get('/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching statistics:', error);
      throw error;
    }
  }

  /**
   * Check API health
   * @returns {Promise<Object>} Response with health status
   */
  async checkHealth() {
    try {
      const response = await api.get('/health');
      return response.data;
    } catch (error) {
      console.error('Error checking API health:', error);
      throw error;
    }
  }
}

export default new MediaService();
