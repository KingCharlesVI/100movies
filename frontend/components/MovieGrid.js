import React, { useState, useEffect, useRef } from 'react';
import styles from '../styles/MovieGrid.module.css';
import MovieModal from './MovieModal';
import Banner from './Banner';
import ReactSlider from 'react-slider';

const MovieGrid = () => {
  const [movies, setMovies] = useState([]);
  const [watchedMovies, setWatchedMovies] = useState(new Set());
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    watched: false,
    unwatched: false,
    rating: [0, 10],
    year: { min: 1900, max: 2024 }
  });
  const [selectedMovie, setSelectedMovie] = useState(null);
  
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
        const formattedMovies = data.movies.map(movie => ({
          ...movie,
          year: new Date(movie.release_date).getFullYear(),
          posterUrl: `https://image.tmdb.org/t/p/w500${movie.poster_path}`
        }));
        setMovies(formattedMovies);
        setWatchedMovies(new Set(data.watchedMovies));
      } catch (error) {
        console.error('Failed to fetch movies:', error);
      }
    };
    fetchMovies();
  }, []);

  const toggleWatched = async (movieId, e) => {
    e.stopPropagation();
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const isWatched = watchedMovies.has(movieId);
      const method = isWatched ? 'DELETE' : 'POST';
      const response = await fetch(`${API_URL}/api/movies/${movieId}/watch`, {
        method
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

  const filteredMovies = movies
    .filter(movie => {
      const isWatched = watchedMovies.has(movie.id);
      const meetsWatchedFilter = 
        (!filters.watched && !filters.unwatched) ||
        (filters.watched && isWatched) ||
        (filters.unwatched && !isWatched) ||
        (filters.watched && filters.unwatched);
      
      const meetsRatingFilter = 
        movie.vote_average >= filters.rating[0] && 
        movie.vote_average <= filters.rating[1];
      
      const meetsYearFilter = 
        movie.year >= filters.year.min && 
        movie.year <= filters.year.max;

      const meetsSearchFilter = 
        searchQuery === '' ||
        movie.title.toLowerCase().includes(searchQuery.toLowerCase());

      return meetsWatchedFilter && meetsRatingFilter && meetsYearFilter && meetsSearchFilter;
    })
    .sort((a, b) => a.rank - b.rank);

  return (
    <>
      <Banner />
      <div className={styles.container}>
        <header className={styles.header}>
          <h1 className={styles.title}>100 Movies</h1>
          <div className={styles.counter}>
            <span className={styles.watchedCount}>{watchedMovies.size}</span>
            <span> / 100 movies watched</span>
          </div>
        </header>

        <div className={styles.searchContainer}>
          <input
            type="text"
            placeholder="Search movies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <div className={styles.controls}>
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

                <div className={styles['filter-section']}>
                  <h4>IMDb Rating</h4>
                  <div className={styles['range-inputs']}>
                    <ReactSlider
                      className={styles.slider}
                      thumbClassName={styles.thumb}
                      trackClassName={styles.track}
                      value={filters.rating}
                      min={0}
                      max={10}
                      step={0.1}
                      pearling
                      minDistance={0.5}
                      onChange={(value) => setFilters(prev => ({
                        ...prev,
                        rating: value
                      }))}
                    />
                    <div className={styles['range-values']}>
                      {filters.rating[0].toFixed(1)} - {filters.rating[1].toFixed(1)}
                    </div>
                  </div>
                </div>

                <div className={styles['filter-section']}>
                  <h4>Release Year</h4>
                  <div className={styles['range-inputs']}>
                    <input
                      type="number"
                      min="1900"
                      max="2024"
                      value={filters.year.min}
                      onChange={(e) => setFilters(prev => ({
                        ...prev,
                        year: { ...prev.year, min: parseInt(e.target.value) }
                      }))}
                      className={styles.yearInput}
                    />
                    <span>-</span>
                    <input
                      type="number"
                      min="1900"
                      max="2024"
                      value={filters.year.max}
                      onChange={(e) => setFilters(prev => ({
                        ...prev,
                        year: { ...prev.year, max: parseInt(e.target.value) }
                      }))}
                      className={styles.yearInput}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className={styles['movie-grid']}>
          {filteredMovies.map((movie) => (
            <div 
              key={movie.id} 
              className={styles['movie-card']}
              onClick={() => setSelectedMovie(movie)}
            >
              <div className={styles.ranking}>#{movie.rank}</div>
              <div className={styles['movie-info']}>
                <h3 className={styles['movie-title']}>{movie.title}</h3>
                <p className={styles['movie-year']}>{movie.year}</p>
              </div>
              <button
                onClick={(e) => toggleWatched(movie.id, e)}
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
                <span className={styles['rating-value']}>{movie.vote_average.toFixed(1)}/10</span>
              </div>
            </div>
          ))}
        </div>

        {selectedMovie && (
          <MovieModal 
            movie={selectedMovie} 
            onClose={() => setSelectedMovie(null)} 
          />
        )}
      </div>
    </>
  );
};

export default MovieGrid;