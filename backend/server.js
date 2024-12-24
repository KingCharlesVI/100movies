const express = require('express');
const sqlite3 = require('sqlite3');
const cors = require('cors');
const axios = require('axios');
const moviesList = require('./movies-list.json');
require('dotenv').config();

const app = express();
app.use(cors({
  origin: [
    'http://localhost:3000',         // Development
    'http://localhost:3001',         // Development
    'https://yourdomain.com',        // Production
    'https://www.yourdomain.com'     // Production with www
  ],
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
}));
app.use(express.json());

// Setup SQLite database
const db = new sqlite3.Database('movies.db');

// Create watched_movies table
db.serialize(() => {
  // Drop existing tables if they exist
  db.run(`DROP TABLE IF EXISTS watched_movies`);

  // Create watched movies table
  db.run(`
    CREATE TABLE IF NOT EXISTS watched_movies (
      id INTEGER PRIMARY KEY,
      movie_id INTEGER NOT NULL,
      watched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
});

// Fetch specific movie details from TMDB
const fetchMovieDetails = async (movieEntry) => {
    const url = `https://api.themoviedb.org/3/movie/${movieEntry.id}`;
    const config = {
      params: {
        api_key: process.env.TMDB_API_KEY
      }
    };
  
    try {
      const response = await axios.get(url, config);
      return {
        ...response.data,
        rank: movieEntry.rank
      };
    } catch (error) {
      console.error(`Error fetching movie ${movieEntry.id}:`);
      console.error('Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });
      return null;
    }
};

// Get all movies
app.get('/api/movies', async (req, res) => {
  try {
    const moviePromises = moviesList.movies.map(movieEntry => fetchMovieDetails(movieEntry));
    const movies = await Promise.all(moviePromises);
    
    const validMovies = movies.filter(movie => movie !== null);
    
    const formattedMovies = validMovies.map(movie => ({
      id: movie.id,
      rank: movie.rank,
      title: movie.title,
      release_date: movie.release_date,
      poster_path: movie.poster_path,
      overview: movie.overview,
      vote_average: movie.vote_average,
      runtime: movie.runtime,
      genres: movie.genres
    }));

    // Sort by rank
    formattedMovies.sort((a, b) => a.rank - b.rank);

    // Get watched movies
    db.all('SELECT movie_id FROM watched_movies',
      (err, watchedMovies) => {
        if (err) {
          console.error('Database error:', err);
          res.status(500).json({ error: 'Failed to fetch watched movies' });
        } else {
          const watchedMovieIds = new Set(watchedMovies.map(m => m.movie_id));
          res.json({
            movies: formattedMovies,
            watchedMovies: Array.from(watchedMovieIds)
          });
        }
      }
    );
  } catch (error) {
    console.error('Error fetching movies:', error);
    res.status(500).json({ error: 'Failed to fetch movies' });
  }
});

// Mark movie as watched
app.post('/api/movies/:id/watch', (req, res) => {
  const { id } = req.params;
  
  db.run('INSERT INTO watched_movies (movie_id) VALUES (?)',
    [id],
    (err) => {
      if (err) {
        console.error('Database error:', err);
        res.status(500).json({ error: 'Failed to mark movie as watched' });
      } else {
        res.json({ success: true });
      }
    }
  );
});

// Unmark movie as watched
app.delete('/api/movies/:id/watch', (req, res) => {
  const { id } = req.params;
  
  db.run('DELETE FROM watched_movies WHERE movie_id = ?',
    [id],
    (err) => {
      if (err) {
        console.error('Database error:', err);
        res.status(500).json({ error: 'Failed to unmark movie as watched' });
      } else {
        res.json({ success: true });
      }
    }
  );
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`API running on port ${PORT}`);
});