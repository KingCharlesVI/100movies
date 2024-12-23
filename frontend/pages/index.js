import { useState, useEffect } from 'react';
import Head from 'next/head';
import MovieGrid from '../components/MovieGrid';
import LoginPage from '../components/LoginPage';

export default function Home() {
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    setToken(storedToken);
    setLoading(false);
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <Head>
        <title>100 Movies</title>
        <meta name="description" content="Track your movie watching progress" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      {token ? (
        <MovieGrid token={token} />
      ) : (
        <LoginPage onLogin={setToken} />
      )}
    </>
  );
}