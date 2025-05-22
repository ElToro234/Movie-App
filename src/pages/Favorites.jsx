import "../css/Favorites.css";
import { useMovieContext } from "../contexts/MovieContext";
import MovieCard from "../components/MovieCard";
import { useEffect } from "react";

function Favorites() {
  const { favorites, loading, error, fetchFavorites, clearError } = useMovieContext();

  useEffect(() => {
    // Fetch favorites when component mounts
    if (favorites.length === 0) {
      fetchFavorites();
    }
  }, []);

  const handleRetry = () => {
    clearError();
    fetchFavorites();
  };

  if (loading) {
    return (
      <div className="favorites">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading your favorites...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="favorites">
        <div className="error-container">
          <h2>Oops! Something went wrong</h2>
          <p>{error}</p>
          <button onClick={handleRetry} className="retry-button">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (favorites.length === 0) {
    return (
      <div className="favorites">
        <div className="favorites-empty">
          <h2>No Favorite Movies Yet</h2>
          <p>Start adding movies to your favorites and they will appear here!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="favorites">
      <h2>Your Favorites ({favorites.length})</h2>
      {error && (
        <div className="error-banner">
          <p>{error}</p>
          <button onClick={() => clearError()} className="close-error">×</button>
        </div>
      )}
      <div className="movies-grid">
        {favorites.map((movie) => (
          <MovieCard movie={movie} key={movie.id} />
        ))}
      </div>
    </div>
  );
}

export default Favorites;