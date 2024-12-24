import Head from 'next/head';
import MovieGrid from '../components/MovieGrid';

export default function Home() {
  return (
    <>
      <Head>
        <title>100 Movies</title>
        <meta name="description" content="Track your movie watching progress" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <MovieGrid />
    </>
  );
}