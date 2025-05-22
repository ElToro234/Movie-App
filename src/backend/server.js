const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize SQLite database
const dbPath = path.join(__dirname, 'movies.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database');
    // Create favorites table if it doesn't exist
    createFavoritesTable();
  }
});

// Create favorites table
function createFavoritesTable() {
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS favorites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      movie_id INTEGER UNIQUE NOT NULL,
      title TEXT NOT NULL,
      poster_path TEXT,
      release_date TEXT,
      overview TEXT,
      vote_average REAL,
      vote_count INTEGER,
      genre_ids TEXT,
      original_language TEXT,
      popularity REAL,
      backdrop_path TEXT,
      adult BOOLEAN,
      video BOOLEAN,
      original_title TEXT,
      added_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `;
  
  db.run(createTableSQL, (err) => {
    if (err) {
      console.error('Error creating favorites table:', err.message);
    } else {
      console.log('Favorites table ready');
    }
  });
}

// API Routes

// Get all favorites
app.get('/api/favorites', (req, res) => {
  const sql = `SELECT * FROM favorites ORDER BY added_at DESC`;
  
  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error('Error fetching favorites:', err.message);
      res.status(500).json({ error: 'Failed to fetch favorites' });
    } else {
      // Convert SQLite rows back to movie objects
      const movies = rows.map(row => ({
        id: row.movie_id,
        title: row.title,
        poster_path: row.poster_path,
        release_date: row.release_date,
        overview: row.overview,
        vote_average: row.vote_average,
        vote_count: row.vote_count,
        genre_ids: row.genre_ids ? JSON.parse(row.genre_ids) : [],
        original_language: row.original_language,
        popularity: row.popularity,
        backdrop_path: row.backdrop_path,
        adult: row.adult,
        video: row.video,
        original_title: row.original_title,
        added_at: row.added_at
      }));
      res.json(movies);
    }
  });
});

// Add movie to favorites
app.post('/api/favorites', (req, res) => {
  const movie = req.body;
  
  if (!movie || !movie.id) {
    return res.status(400).json({ error: 'Invalid movie data' });
  }

  const sql = `
    INSERT INTO favorites (
      movie_id, title, poster_path, release_date, overview, 
      vote_average, vote_count, genre_ids, original_language, 
      popularity, backdrop_path, adult, video, original_title
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  const params = [
    movie.id,
    movie.title,
    movie.poster_path,
    movie.release_date,
    movie.overview,
    movie.vote_average,
    movie.vote_count,
    JSON.stringify(movie.genre_ids || []),
    movie.original_language,
    movie.popularity,
    movie.backdrop_path,
    movie.adult,
    movie.video,
    movie.original_title
  ];

  db.run(sql, params, function(err) {
    if (err) {
      if (err.message.includes('UNIQUE constraint failed')) {
        res.status(409).json({ error: 'Movie already in favorites' });
      } else {
        console.error('Error adding to favorites:', err.message);
        res.status(500).json({ error: 'Failed to add to favorites' });
      }
    } else {
      res.status(201).json({ 
        message: 'Movie added to favorites', 
        id: this.lastID,
        movie_id: movie.id 
      });
    }
  });
});

// Remove movie from favorites
app.delete('/api/favorites/:movieId', (req, res) => {
  const movieId = parseInt(req.params.movieId);
  
  if (!movieId) {
    return res.status(400).json({ error: 'Invalid movie ID' });
  }

  const sql = `DELETE FROM favorites WHERE movie_id = ?`;
  
  db.run(sql, [movieId], function(err) {
    if (err) {
      console.error('Error removing from favorites:', err.message);
      res.status(500).json({ error: 'Failed to remove from favorites' });
    } else if (this.changes === 0) {
      res.status(404).json({ error: 'Movie not found in favorites' });
    } else {
      res.json({ 
        message: 'Movie removed from favorites', 
        movie_id: movieId 
      });
    }
  });
});

// Check if movie is favorite
app.get('/api/favorites/:movieId', (req, res) => {
  const movieId = parseInt(req.params.movieId);
  
  if (!movieId) {
    return res.status(400).json({ error: 'Invalid movie ID' });
  }

  const sql = `SELECT COUNT(*) as count FROM favorites WHERE movie_id = ?`;
  
  db.get(sql, [movieId], (err, row) => {
    if (err) {
      console.error('Error checking favorite status:', err.message);
      res.status(500).json({ error: 'Failed to check favorite status' });
    } else {
      res.json({ isFavorite: row.count > 0 });
    }
  });
});

// Get favorites count
app.get('/api/favorites/stats/count', (req, res) => {
  const sql = `SELECT COUNT(*) as count FROM favorites`;
  
  db.get(sql, [], (err, row) => {
    if (err) {
      console.error('Error getting favorites count:', err.message);
      res.status(500).json({ error: 'Failed to get favorites count' });
    } else {
      res.json({ count: row.count });
    }
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down server...');
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err.message);
    } else {
      console.log('Database connection closed');
    }
    process.exit(0);
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Database located at: ${dbPath}`);
});