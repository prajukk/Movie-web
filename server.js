const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// TMDb configuration
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
// It's highly recommended to use your own API key stored in a .env file
const TMDB_API_KEY = process.env.TMDB_API_KEY || '1aa0c1a75f28aa19c9d4eb840523869f';

// Helper function to make TMDb API calls
const fetchFromTMDb = async (endpoint, params = {}) => {
  try {
    const response = await axios.get(`${TMDB_BASE_URL}${endpoint}`, {
      params: {
        api_key: TMDB_API_KEY,
        language: 'en-US',
        ...params
      }
    });
    return response.data;
  } catch (error) {
    // This creates a more informative error to be logged later
    const errorMessage = error.response?.data?.status_message || error.message;
    console.error(`TMDb API request failed for endpoint "${endpoint}": ${errorMessage}`);
    throw new Error(`TMDb API Error: ${errorMessage}`);
  }
};

// --- Routes ---

// Get movies by category (e.g., popular, top_rated)
app.get('/api/movies/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const { page = 1 } = req.query;
    
    const validCategories = ['popular', 'top_rated', 'now_playing', 'upcoming'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({ message: 'Invalid category specified' });
    }

    const data = await fetchFromTMDb(`/movie/${category}`, { page });
    
    // TMDb API caps results at page 500
    data.total_pages = Math.min(data.total_pages || 1, 500);
    
    res.json(data);
  } catch (error) {
    // Log the detailed error to the server console for debugging
    console.error(`[SERVER ERROR] /api/movies/${req.params.category}:`, error);
    res.status(500).json({ message: error.message });
  }
});

// Search for movies by a query string
app.get('/api/search/movies', async (req, res) => {
  try {
    const { query, page = 1 } = req.query;
    
    if (!query || query.trim() === '') {
      return res.status(400).json({ message: 'Search query is required' });
    }

    const data = await fetchFromTMDb('/search/movie', {
      query: query.trim(),
      page,
      include_adult: false
    });
    
    data.total_pages = Math.min(data.total_pages || 1, 500);
    
    res.json(data);
  } catch (error) {
    // Log the detailed error to the server console
    console.error(`[SERVER ERROR] /api/search/movies:`, error);
    res.status(500).json({ message: error.message });
  }
});

// Get detailed information for a single movie
app.get('/api/movie/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = await fetchFromTMDb(`/movie/${id}`);
    res.json(data);
  } catch (error) {
    console.error(`[SERVER ERROR] /api/movie/${req.params.id}:`, error);
    res.status(500).json({ message: error.message });
  }
});

// Get the cast and crew for a movie
app.get('/api/movie/:id/credits', async (req, res) => {
  try {
    const { id } = req.params;
    const data = await fetchFromTMDb(`/movie/${id}/credits`);
    res.json(data);
  } catch (error) {
    console.error(`[SERVER ERROR] /api/movie/${req.params.id}/credits:`, error);
    res.status(500).json({ message: error.message });
  }
});

// Get TMDb configuration details (e.g., for constructing image URLs)
app.get('/api/configuration', async (req, res) => {
  try {
    const data = await fetchFromTMDb('/configuration');
    res.json(data);
  } catch (error) {
    console.error(`[SERVER ERROR] /api/configuration:`, error);
    res.status(500).json({ message: error.message });
  }
});

// A simple health check endpoint to verify the server is running
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Generic error handling middleware (for unhandled errors)
app.use((err, req, res, next) => {
  console.error('An unhandled error occurred:', err.stack);
  res.status(500).json({ message: 'Something went wrong on the server!' });
});

// Start the server
app.listen(PORT, () => {
  console.log(`TMDb API Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
  if (!process.env.TMDB_API_KEY) {
    console.warn('Using a default API key. For reliable use, please set the TMDB_API_KEY environment variable.');
  }
});

module.exports = app;
