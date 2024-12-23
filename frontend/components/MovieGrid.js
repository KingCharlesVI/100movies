import React, { useState, useEffect, useRef } from 'react';
import styles from '../styles/MovieGrid.module.css';

const MovieGrid = () => {
  const [movies, setMovies] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [watchedMovies, setWatchedMovies] = useState(new Set());
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const [filters, setFilters] = useState({
    watched: false,
    unwatched: false
  });
  
  const filterMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterMenuRef.current && !filterMenuRef.current.contains(event.target)) {
        setIsFilterMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        const response = await fetch(`${API_URL}/api/movies`);
        const data = await response.json();
        const formattedMovies = data.map(movie => ({
          id: movie.id,
          title: movie.title,
          year: new Date(movie.release_date).getFullYear(),
          posterUrl: `https://image.tmdb.org/t/p/w500${movie.poster_path}`,
          rating: movie.vote_average
        }));
        setMovies(formattedMovies);
      } catch (error) {
        console.error('Failed to fetch movies:', error);
      }
    };
    fetchMovies();
  }, []);

  const toggleWatched = async (movieId) => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const isWatched = watchedMovies.has(movieId);
      const method = isWatched ? 'DELETE' : 'POST';
      const response = await fetch(`${API_URL}/api/movies/${movieId}/watch`, {
        method,
      });
      
      if (response.ok) {
        setWatchedMovies(prev => {
          const newSet = new Set(prev);
          if (isWatched) {
            newSet.delete(movieId);
          } else {
            newSet.add(movieId);
          }
          return newSet;
        });
      }
    } catch (error) {
      console.error('Failed to toggle watched status:', error);
    }
  };

  const toggleFilter = (filterName) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: !prev[filterName]
    }));
  };

  const filteredMovies = movies.filter(movie => {
    const matchesSearch = movie.title.toLowerCase().includes(searchQuery.toLowerCase());
    const isWatched = watchedMovies.has(movie.id);
    
    if (filters.watched && filters.unwatched) return matchesSearch;
    if (filters.watched) return matchesSearch && isWatched;
    if (filters.unwatched) return matchesSearch && !isWatched;
    return matchesSearch;
  });

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>100 Movies</h1>
        <div className={styles.userInfo}>
          <span className={styles.username}>{localStorage.getItem('username')}</span>
          <div className={styles.counter}>
            {watchedMovies.size} / 100 movies watched
          </div>
        </div>
        <button onClick={() => {
          localStorage.removeItem('token');
          localStorage.removeItem('username');
          window.location.reload();
        }} className={styles.logoutButton}>
          Logout
        </button>
      </header>

      <div className={styles.controls}>
        <div className={styles['search-container']}>
          <input
            type="text"
            placeholder="Search movies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles['search-input']}
          />
        </div>

        <div className={styles['filters-container']} ref={filterMenuRef}>
          <button 
            className={styles['filter-button']}
            onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
            </svg>
            {(filters.watched || filters.unwatched) && (
              <div className={styles['filter-indicator']} />
            )}
          </button>

          {isFilterMenuOpen && (
            <div className={styles['filter-menu']}>
              <div 
                className={styles['filter-option']}
                onClick={() => toggleFilter('watched')}
              >
                <div className={`${styles.checkbox} ${filters.watched ? styles.checked : ''}`}>
                  {filters.watched && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  )}
                </div>
                <span>Watched</span>
              </div>

              <div 
                className={styles['filter-option']}
                onClick={() => toggleFilter('unwatched')}
              >
                <div className={`${styles.checkbox} ${filters.unwatched ? styles.checked : ''}`}>
                  {filters.unwatched && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  )}
                </div>
                <span>Unwatched</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className={styles['movie-grid']}>
        {filteredMovies.map((movie, index) => (
          <div key={movie.id} className={styles['movie-card']}>
            <div className={styles.ranking}>#{index + 1}</div>
            <div className={styles['movie-info']}>
              <h3 className={styles['movie-title']}>{movie.title}</h3>
              <p className={styles['movie-year']}>{movie.year}</p>
            </div>
            <button
              onClick={() => toggleWatched(movie.id)}
              className={`${styles['watch-button']} ${
                watchedMovies.has(movie.id) ? styles.watched : ''
              }`}
            >
              ✓
            </button>
            <div className={styles['poster-container']}>
              <img
                src={movie.posterUrl}
                alt={movie.title}
                className={styles['movie-poster']}
              />
            </div>
            <div className={styles.rating}>
              <span className={styles['imdb-tag']}>IMDb</span>
              <span className={styles['rating-value']}>{movie.rating.toFixed(1)}/10</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MovieGrid;