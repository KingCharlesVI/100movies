import React from 'react';
import styles from '../styles/Banner.module.css';

const Banner = () => {
  return (
    <div className={styles.banner}>
      <div className={styles.content}>
        <span>Made with ❤️ by KCVI</span>
        <div className={styles.links}>
          <a href="https://github.com/KingCharlesVI/100movies" target="_blank" rel="noopener noreferrer">GitHub</a>
          <a href="https://www.themoviedb.org/" target="_blank" rel="noopener noreferrer">TMDB</a>
        </div>
      </div>
    </div>
  );
};

export default Banner;