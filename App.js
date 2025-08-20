import React, { useState, useEffect, useCallback } from 'react';
import { Star, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

// CSS is now embedded in a <style> tag to avoid import errors.
const AppStyles = () => (
  <style>{`
    :root {
      --bg: #0b0f19;
      --panel: #121829;
      --muted: #8a94a7;
      --text: #e6e9ef;
      --accent: #4f8cff;
      --accent-2: #22d3ee;
      --card: #0f1424;
      --danger: #ff6b6b;
      --ring: rgba(79, 140, 255, .35);
    }
    * { box-sizing: border-box; }
    body {
      margin: 0; font-family: system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, "Helvetica Neue", Arial;
      background: radial-gradient(1200px 800px at 20% -10%, #141d35 0%, var(--bg) 60%);
      color: var(--text);
      min-height: 100vh;
    }
    .container { max-width: 1200px; margin: 0 auto; padding: 24px; }
    header { display:flex; align-items:center; gap:16px; flex-wrap: wrap; }
    h1 { font-weight: 800; letter-spacing: .3px; margin: 0; font-size: clamp(22px, 3vw, 28px);}
    .badge { font-size: 12px; padding: 4px 8px; border-radius: 999px; background: linear-gradient(90deg, var(--accent), var(--accent-2)); color: #001018; font-weight: 700; }

    .toolbar {
      margin-top: 16px; display:grid; grid-template-columns: 1fr; gap:12px;
    }
    @media (min-width: 720px) {
      .toolbar { grid-template-columns: 220px 1fr 140px 160px; }
    }

    input, select, button {
      background: var(--panel); border: 1px solid #1f2942; color: var(--text); border-radius: 12px; padding: 10px 12px; font-size: 14px; outline: none;
      transition: border-color .2s, box-shadow .2s, background .2s;
      height: 42px;
    }
    input:focus, select:focus { border-color: var(--accent); box-shadow: 0 0 0 4px var(--ring); }
    button { cursor: pointer; border: none; font-weight: 700; }
    button:disabled { cursor: not-allowed; opacity: 0.5; }
    .btn-primary { background: linear-gradient(90deg, var(--accent), var(--accent-2)); color: #001018; }
    .btn-ghost { background: transparent; border: 1px solid #1f2942; }

    .panel { background: rgba(255,255,255,0.03); border: 1px solid #1b2340; border-radius: 16px; padding: 16px; }

    .grid { display:grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 16px; }

    .card { background: var(--card); border: 1px solid #182041; border-radius: 16px; overflow: hidden; display:flex; flex-direction: column; }
    .poster { width: 100%; aspect-ratio: 2/3; object-fit: cover; background: #0b1022; }
    .card-body { padding: 12px; display:flex; flex-direction: column; gap: 8px; flex-grow: 1; }
    .title { font-size: 14px; font-weight: 700; line-height: 1.25; }
    .meta { font-size: 12px; color: var(--muted); display:flex; align-items:center; gap:8px; flex-wrap: wrap; }
    .chip { font-size: 11px; padding: 2px 8px; border-radius: 999px; background: #111a33; border: 1px solid #1e2a51; display: flex; align-items: center; gap: 4px; }

    .status { margin: 14px 0 6px; min-height: 22px; font-size: 14px; color: var(--muted); }

    .pagination { display:flex; align-items:center; justify-content: center; gap: 10px; margin: 18px 0 6px; }
    .page-btn { padding: 10px 14px; border-radius: 10px; display:flex; align-items:center; justify-content:center; }
    .page-info { font-size: 13px; color: var(--muted); }

    .footer { margin-top: 28px; color: var(--muted); font-size: 12px; text-align: center; }
    .danger { color: var(--danger); }

    @keyframes pulse {
      50% { opacity: .5; }
    }
    .animate-pulse {
      animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }
  `}</style>
);

const API_BASE = 'http://localhost:5000/api';
const IMG_BASE = "https://image.tmdb.org/t/p/w300";

// Placeholder SVG for missing posters
const PLACEHOLDER = `data:image/svg+xml;utf8,${encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 450">
    <defs>
      <linearGradient id="g" x1="0" x2="1">
        <stop offset="0" stop-color="#0b1022"/>
        <stop offset="1" stop-color="#121a33"/>
      </linearGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#g)"/>
    <g fill="#2b3a68" font-family="Arial,Helvetica,sans-serif" font-size="22">
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle">No Poster</text>
    </g>
  </svg>
`)}`;

const MovieCard = ({ movie }) => {
  const poster = movie.poster_path ? `${IMG_BASE}${movie.poster_path}` : PLACEHOLDER;
  const year = (movie.release_date || '').slice(0, 4) || '—';
  const rating = movie.vote_average ? movie.vote_average.toFixed(1) : '—';
  const title = movie.title || movie.name || 'Untitled';

  return (
    <div className="card">
      <img
        className="poster"
        loading="lazy"
        src={poster}
        alt={`Poster: ${title}`}
        onError={(e) => { e.target.src = PLACEHOLDER; }}
      />
      <div className="card-body">
        <div className="title" title={title}>{title}</div>
        <div className="meta">
          <span className="chip">
            <Star size={12} style={{ display: 'inline', marginRight: '4px' }} />
            {rating}
          </span>
          <span className="chip">
            <Calendar size={12} style={{ display: 'inline', marginRight: '4px' }} />
            {year}
          </span>
        </div>
      </div>
    </div>
  );
};

const LoadingCard = () => (
  <div className="card animate-pulse">
    <div className="poster"></div>
    <div className="card-body">
      <div style={{ height: '16px', background: 'var(--panel)', borderRadius: '4px' }}></div>
      <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
        <div style={{ height: '22px', width: '50px', background: 'var(--panel)', borderRadius: '999px' }}></div>
        <div style={{ height: '22px', width: '60px', background: 'var(--panel)', borderRadius: '999px' }}></div>
      </div>
    </div>
  </div>
);

export default function MovieBrowser() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [mode, setMode] = useState('category'); // 'category' | 'search'
  const [category, setCategory] = useState('popular');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const fetchMovies = useCallback(async (endpoint, params = {}) => {
    setLoading(true);
    setError('');
    try {
      const queryString = new URLSearchParams(params).toString();
      const url = `${API_BASE}${endpoint}${queryString ? `?${queryString}` : ''}`;
      
      const response = await fetch(url);
      
      // If the response is not OK, try to parse the JSON error message from the server
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP ${response.status} - ${response.statusText}`);
      }
      
      const data = await response.json();
      setMovies(data.results || []);
      setTotalPages(data.total_pages || 1);
      setCurrentPage(data.page || 1);
    } catch (err) {
      setError(err.message);
      setMovies([]);
      setTotalPages(1);
      setCurrentPage(1);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadCategory = useCallback((cat = 'popular', page = 1) => {
    setMode('category');
    setCategory(cat);
    fetchMovies(`/movies/${cat}`, { page });
  }, [fetchMovies]);

  const searchMovies = (query = searchQuery, page = 1) => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      return loadCategory(category, 1);
    }
    setMode('search');
    setSearchQuery(trimmedQuery);
    fetchMovies('/search/movies', { query: trimmedQuery, page });
  };

  const handleSearch = () => {
    searchMovies(searchInput, 1);
  };

  const handleReset = () => {
    setSearchInput('');
    setSearchQuery('');
    loadCategory('popular', 1);
  };

  const handlePrevPage = () => {
    const newPage = Math.max(1, currentPage - 1);
    if (mode === 'search') {
      searchMovies(searchQuery, newPage);
    } else {
      loadCategory(category, newPage);
    }
  };

  const handleNextPage = () => {
    const newPage = Math.min(totalPages, currentPage + 1);
    if (mode === 'search') {
      searchMovies(searchQuery, newPage);
    } else {
      loadCategory(category, newPage);
    }
  };

  useEffect(() => {
    loadCategory('popular', 1);
  }, [loadCategory]);

  return (
    <>
      <AppStyles />
      <div className="container">
        <header>
          <h1>Movie Browser</h1>
          <div className="badge">React + Node.js</div>
        </header>

        <div className="panel" style={{ marginTop: '24px' }}>
          <div className="toolbar">
            <select
              value={category}
              onChange={(e) => loadCategory(e.target.value, 1)}
            >
              <option value="popular">Popular</option>
              <option value="top_rated">Top Rated</option>
              <option value="now_playing">Now Playing</option>
              <option value="upcoming">Upcoming</option>
            </select>

            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search movies..."
            />

            <button onClick={handleSearch} className="btn-primary">
              Search
            </button>

            <button onClick={handleReset} className="btn-ghost">
              Reset
            </button>
          </div>

          <div className="status">
            {loading && <span>Loading...</span>}
            {error && <span className="danger">{error}</span>}
            {!loading && !error && mode === 'search' && movies.length > 0 && (
              <span>Found results for "{searchQuery}"</span>
            )}
          </div>
        </div>

        <div className="grid" style={{ marginTop: '24px' }}>
          {loading
            ? Array(12).fill(0).map((_, i) => <LoadingCard key={i} />)
            : movies.map((movie) => <MovieCard key={movie.id} movie={movie} />)
          }
        </div>

        {!loading && movies.length > 0 && (
          <div className="pagination">
            <button
              onClick={handlePrevPage}
              disabled={currentPage <= 1}
              className="page-btn"
            >
              <ChevronLeft size={16} />
            </button>
            
            <span className="page-info">
              Page {currentPage} of {totalPages}
            </span>
            
            <button
              onClick={handleNextPage}
              disabled={currentPage >= totalPages}
              className="page-btn"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}

        <footer className="footer">
          Built with React + Node.js • Data from TMDb
        </footer>
      </div>
    </>
  );
}