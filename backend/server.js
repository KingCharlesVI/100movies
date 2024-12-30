const express = require('express');
const sqlite3 = require('sqlite3');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const os = require('os');
const moviesList = require('./movies-list.json');
require('dotenv').config();

const app = express();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
}));
app.use(express.json());

// Define the application name for the data directory
const APP_NAME = '100movies';

// Get the appropriate local app data directory based on the OS
function getAppDataPath() {
  switch (process.platform) {
    case 'win32':
      return path.join(process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming'), APP_NAME);
    case 'darwin':
      return path.join(os.homedir(), 'Library', 'Application Support', APP_NAME);
    case 'linux':
      return path.join(os.homedir(), '.local', 'share', APP_NAME);
    default:
      return path.join(os.homedir(), '.'+APP_NAME);
  }
}

// Setup database directory and file paths
const dbDir = getAppDataPath();
const dbPath = path.join(dbDir, 'movies.db');

// Ensure the app data directory exists
try {
  fs.mkdirSync(dbDir, { recursive: true });
  console.log('Database directory created/verified at:', dbDir);
} catch (err) {
  console.error('Error creating database directory:', err);
  process.exit(1);
}

// Setup SQLite database with persistent storage
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err);
    process.exit(1);
  } else {
    console.log('Connected to database at:', dbPath);
  }
});

// Initialize database tables if they don't exist
db.serialize(() => {
  // Create watched movies table only if it doesn't exist
  db.run(`
    CREATE TABLE IF NOT EXISTS watched_movies (
      id INTEGER PRIMARY KEY,
      movie_id INTEGER NOT NULL,
      watched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  // Add any indexes if needed
  db.run(`
    CREATE INDEX IF NOT EXISTS idx_movie_id 
    ON watched_movies(movie_id)
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

// Gracefully close the database connection when the server stops
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err);
    } else {
      console.log('Database connection closed');
    }
    process.exit();
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`API running on port ${PORT}`);
});