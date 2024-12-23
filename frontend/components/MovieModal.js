import React from 'react';
import styles from '../styles/MovieModal.module.css';

const MovieModal = ({ movie, onClose }) => {
  if (!movie) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose}>×</button>
        
        <div className={styles.content}>
          <div className={styles.posterContainer}>
            <img 
              src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
              alt={movie.title}
              className={styles.poster}
            />
          </div>
          
          <div className={styles.info}>
            <h2 className={styles.title}>{movie.title}</h2>
            <div className={styles.metadata}>
              <span className={styles.year}>{new Date(movie.release_date).getFullYear()}</span>
              <span className={styles.runtime}>{movie.runtime} min</span>
              <span className={styles.rating}><span className={styles.imdb}>IMDb</span> {movie.vote_average.toFixed(1)}/10</span>
            </div>
            
            <div className={styles.genres}>
              {movie.genres.map(genre => (
                <span key={genre.id} className={styles.genre}>
                  {genre.name}
                </span>
              ))}
            </div>
            
            <p className={styles.overview}>{movie.overview}</p>

            {movie.tagline && (
              <p className={styles.tagline}>"{movie.tagline}"</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovieModal;