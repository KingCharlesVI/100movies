import React, { useState } from 'react';
import styles from '../styles/LoginPage.module.css';

const LoginPage = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const endpoint = isLogin ? 'login' : 'register';
      const response = await fetch(`${API_URL}/api/auth/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      localStorage.setItem('token', data.token);
      onLogin(data.token);
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.formContainer}>
        <h1 className={styles.title}>100 Movies</h1>
        <h2 className={styles.subtitle}>
          {isLogin ? 'Login to your account' : 'Create a new account'}
        </h2>

        {error && <div className={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={styles.input}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={styles.input}
            required
          />
          <button type="submit" className={styles.button}>
            {isLogin ? 'Login' : 'Sign Up'}
          </button>
        </form>

        <button
          onClick={() => setIsLogin(!isLogin)}
          className={styles.switchButton}
        >
          {isLogin
            ? "Don't have an account? Sign up"
            : 'Already have an account? Login'}
        </button>
      </div>
    </div>
  );
};

export default LoginPage;