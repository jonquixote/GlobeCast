import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { promises as fs } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json());

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Serve static files from the React app build directory
app.use(express.static(path.join(__dirname, 'dist')));

// Also serve static files from public directory (for development)
app.use(express.static(path.join(__dirname, 'public')));

// Helper function to read and parse JSON files
async function readJsonFile(filePath) {
  try {
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error);
    return [];
  }
}

// API Routes

// Get all stations (radio and TV)
app.get('/api/stations', async (req, res) => {
  try {
    // Read both radio and TV station files from src/data instead of public
    const tvStations = await readJsonFile(path.join(__dirname, 'src', 'data', 'tvStationsWithUrls.json'));
    const radioStations = await readJsonFile(path.join(__dirname, 'src', 'data', 'radioStations.json'));
    
    // Combine and add type property
    const allStations = [
      ...tvStations.map(station => ({ ...station, type: 'tv' })),
      ...radioStations.map(station => ({ ...station, type: 'radio' }))
    ];
    
    // Validate station URLs and coordinates before sending
    const validatedStations = allStations.map(station => ({
      ...station,
      url: station.url || '', // Ensure URL is always a string
      geo_lat: parseFloat(station.geo_lat) || 0,
      geo_long: parseFloat(station.geo_long) || 0
    })).filter(station => 
      station.geo_lat !== 0 && 
      station.geo_long !== 0 &&
      station.url && 
      station.url.length > 0 && 
      !station.url.includes('radio-') // Filter out test URLs
    );
    
    // Filter by query parameters if provided
    let filteredStations = validatedStations;
    
    if (req.query.type) {
      filteredStations = filteredStations.filter(station => station.type === req.query.type);
    }
    
    if (req.query.country) {
      filteredStations = filteredStations.filter(station => 
        station.country && station.country.toLowerCase().includes(req.query.country.toLowerCase())
      );
    }
    
    if (req.query.limit) {
      const limit = parseInt(req.query.limit);
      filteredStations = filteredStations.slice(0, limit);
    }
    
    res.json({
      success: true,
      count: filteredStations.length,
      total: allStations.length,
      data: filteredStations
    });
  } catch (error) {
    console.error('Error fetching stations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch stations'
    });
  }
});

// Get TV stations only
app.get('/api/stations/tv', async (req, res) => {
  try {
    const tvStations = await readJsonFile(path.join(__dirname, 'src', 'data', 'tvStationsWithUrls.json'));
    
    // Add type property and validate stations
    const stationsWithType = tvStations.map(station => ({ ...station, type: 'tv' }))
      .map(station => ({
        ...station,
        url: station.url || '', // Ensure URL is always a string
        geo_lat: parseFloat(station.geo_lat) || 0,
        geo_long: parseFloat(station.geo_long) || 0
      }))
      .filter(station => 
        station.geo_lat !== 0 && 
        station.geo_long !== 0 &&
        station.url && 
        station.url.length > 0 && 
        !station.url.includes('radio-') // Filter out test URLs
      );
    
    // Apply limit if provided
    let resultStations = stationsWithType;
    if (req.query.limit) {
      const limit = parseInt(req.query.limit);
      resultStations = stationsWithType.slice(0, limit);
    }
    
    res.json({
      success: true,
      count: resultStations.length,
      data: resultStations
    });
  } catch (error) {
    console.error('Error fetching TV stations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch TV stations'
    });
  }
});

// Get radio stations only
app.get('/api/stations/radio', async (req, res) => {
  try {
    const radioStations = await readJsonFile(path.join(__dirname, 'src', 'data', 'radioStations.json'));
    
    // Add type property and validate stations
    const stationsWithType = radioStations.map(station => ({ ...station, type: 'radio' }))
      .map(station => ({
        ...station,
        url: station.url || '', // Ensure URL is always a string
        geo_lat: parseFloat(station.geo_lat) || 0,
        geo_long: parseFloat(station.geo_long) || 0
      }))
      .filter(station => 
        station.geo_lat !== 0 && 
        station.geo_long !== 0 &&
        station.url && 
        station.url.length > 0 && 
        !station.url.includes('radio-') // Filter out test URLs
      );
    
    // Apply limit if provided
    let resultStations = stationsWithType;
    if (req.query.limit) {
      const limit = parseInt(req.query.limit);
      resultStations = stationsWithType.slice(0, limit);
    }
    
    res.json({
      success: true,
      count: resultStations.length,
      data: resultStations
    });
  } catch (error) {
    console.error('Error fetching radio stations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch radio stations'
    });
  }
});

// Get station by ID
app.get('/api/stations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Read both radio and TV station files from src/data instead of public
    const tvStations = await readJsonFile(path.join(__dirname, 'src', 'data', 'tvStationsWithUrls.json'));
    const radioStations = await readJsonFile(path.join(__dirname, 'src', 'data', 'radioStations.json'));
    
    // Combine and add type property
    const allStations = [
      ...tvStations.map(station => ({ ...station, type: 'tv' })),
      ...radioStations.map(station => ({ ...station, type: 'radio' }))
    ];
    
    // Validate stations
    const validatedStations = allStations.map(station => ({
      ...station,
      url: station.url || '', // Ensure URL is always a string
      geo_lat: parseFloat(station.geo_lat) || 0,
      geo_long: parseFloat(station.geo_long) || 0
    })).filter(station => 
      station.geo_lat !== 0 && 
      station.geo_long !== 0 &&
      station.url && 
      station.url.length > 0 && 
      !station.url.includes('radio-') // Filter out test URLs
    );
    
    // Find station by ID
    const station = validatedStations.find(s => s.id === id);
    
    if (!station) {
      return res.status(404).json({
        success: false,
        error: 'Station not found'
      });
    }
    
    res.json({
      success: true,
      data: station
    });
  } catch (error) {
    console.error('Error fetching station:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch station'
    });
  }
});

// Get statistics
app.get('/api/stats', async (req, res) => {
  try {
    // Read both radio and TV station files from src/data instead of public
    const tvStations = await readJsonFile(path.join(__dirname, 'src', 'data', 'tvStationsWithUrls.json'));
    const radioStations = await readJsonFile(path.join(__dirname, 'src', 'data', 'radioStations.json'));
    
    // Calculate statistics
    const stats = {
      totalStations: tvStations.length + radioStations.length,
      tvStations: tvStations.length,
      radioStations: radioStations.length,
      countries: [...new Set([
        ...tvStations.map(s => s.country).filter(Boolean),
        ...radioStations.map(s => s.country).filter(Boolean)
      ])].length,
      cities: [...new Set([
        ...tvStations.map(s => s.city).filter(Boolean),
        ...radioStations.map(s => s.city).filter(Boolean)
      ])].length
    };
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics'
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Globe Media Streamer API is running',
    timestamp: new Date().toISOString()
  });
});

// Serve the React app for all other routes (for SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Globe Media Streamer API server running on port ${PORT}`);
  console.log(`Access the API at http://localhost:${PORT}/api`);
});

export default app;
