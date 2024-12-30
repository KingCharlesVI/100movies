# Movies Tracker

A web application for tracking movies you've watched from a curated list. Built with Node.js/Express backend and SQLite for persistent storage.

## Features

- View a curated list of movies with details from TMDB API
- Mark/unmark movies as watched
- Persistent storage of watched movies in user's local app data
- Cross-platform compatibility (Windows, macOS, Linux) - ONLY TESTED ON WINDOWS
- Automatic data persistence between app restarts

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- TMDB API key

## Installation

1. Clone the repository:
```bash
git clone https://github.com/kingcharlesvi/100movies.git
cd 100movies
```

2. Install dependencies:
```bash
npm run install-all
```

3. Create a `.env` file in the root directory:
```
PORT=3001
NEXT_PUBLIC_API_URL=http://localhost:3001
```

4. Create a `.env` file in the /backend directory:
```
TMDB_API_KEY=your_key_here
PORT=3001
```

## Usage

1. Start the server:
```bash
npm run dev
```

The server will run on port 3001 by default (configurable via PORT environment variable).

2. The SQLite database will be automatically created in:
   - Windows: `%APPDATA%\movies-tracker\movies.db`
   - macOS: `~/Library/Application Support/movies-tracker/movies.db`
   - Linux: `~/.local/share/movies-tracker/movies.db`

## API Endpoints

### GET /api/movies
Returns the list of movies with their details and watched status.

### POST /api/movies/:id/watch
Marks a movie as watched.

### DELETE /api/movies/:id/watch
Unmarks a movie as watched.

## Database Schema

### watched_movies
```sql
CREATE TABLE watched_movies (
  id INTEGER PRIMARY KEY,
  movie_id INTEGER NOT NULL,
  watched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Server port number | 3001 |
| TMDB_API_KEY | TMDB API key | Required |

## Error Handling

- The application includes comprehensive error handling for:
  - Database operations
  - API requests
  - File system operations
  - Server shutdowns

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.