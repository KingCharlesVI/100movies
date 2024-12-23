const express = require('express');
const sqlite3 = require('sqlite3');
const cors = require('cors');
const axios = require('axios');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const moviesList = require('./movies-list.json');
require('dotenv').config();

const app = express();
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Setup SQLite database
const db = new sqlite3.Database('movies.db');

// Create tables
db.serialize(() => {
  // Drop existing tables if they exist
  db.run(`DROP TABLE IF EXISTS watched_movies`);
  db.run(`DROP TABLE IF EXISTS users`);

  // Enable foreign key support
  db.run(`PRAGMA foreign_keys = ON`);

  // Users table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Watched movies table (updated with user_id)
  db.run(`
    CREATE TABLE IF NOT EXISTS watched_movies (
      id INTEGER PRIMARY KEY,
      user_id INTEGER NOT NULL,
      movie_id INTEGER NOT NULL,
      watched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, movie_id),
      FOREIGN KEY(user_id) REFERENCES users(id)
    )
  `);
});

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ error: 'No token provided' });
  
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

// Auth endpoints
app.post('/api/auth/register', async (req, res) => {
  const { username, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    db.run('INSERT INTO users (username, password) VALUES (?, ?)', 
      [username, hashedPassword], 
      function(err) {
        if (err) {
          if (err.code === 'SQLITE_CONSTRAINT') {
            return res.status(400).json({ error: 'Username already taken' });
          }
          return res.status(500).json({ error: 'Error creating user' });
        }
        
        const token = jwt.sign({ userId: this.lastID }, process.env.JWT_SECRET);
        res.json({ token, username });
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  
  db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
    if (err) return res.status(500).json({ error: 'Server error' });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(401).json({ error: 'Invalid credentials' });
    
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET);
    res.json({ token, username: user.username });
  });
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

// Get all movies (protected route)
app.get('/api/movies', authenticateToken, async (req, res) => {
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

    formattedMovies.sort((a, b) => a.rank - b.rank);

    // Get user's watched movies
    db.all('SELECT movie_id FROM watched_movies WHERE user_id = ?',
      [req.user.userId],
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

// Mark movie as watched (protected route)
app.post('/api/movies/:id/watch', authenticateToken, (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId;
  
  db.run('INSERT INTO watched_movies (user_id, movie_id) VALUES (?, ?)',
    [userId, id],
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

// Unmark movie as watched (protected route)
app.delete('/api/movies/:id/watch', authenticateToken, (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId;
  
  db.run('DELETE FROM watched_movies WHERE user_id = ? AND movie_id = ?',
    [userId, id],
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