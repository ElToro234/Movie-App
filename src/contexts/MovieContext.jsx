import { createContext, useState, useContext, useEffect } from "react";

const MovieContext = createContext();

export const useMovieContext = () => useContext(MovieContext);

const API_BASE_URL = 'http://localhost:5000/api';

export const MovieProvider = ({ children }) => {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch favorites from database on component mount
  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/favorites`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setFavorites(data);
    } catch (err) {
      console.error('Error fetching favorites:', err);
      setError('Failed to load favorites');
      // Fallback to localStorage if API fails
      const storedFavs = localStorage.getItem("favorites");
      if (storedFavs) {
        setFavorites(JSON.parse(storedFavs));
      }
    } finally {
      setLoading(false);
    }
  };

  const addToFavorites = async (movie) => {
    try {
      const response = await fetch(`${API_BASE_URL}/favorites`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(movie),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 409) {
          // Movie already in favorites
          return;
        }
        throw new Error(errorData.error || 'Failed to add to favorites');
      }

      // Update local state
      setFavorites(prev => [...prev, { ...movie, added_at: new Date().toISOString() }]);
      
      // Also update localStorage as backup
      const updatedFavorites = [...favorites, movie];
      localStorage.setItem('favorites', JSON.stringify(updatedFavorites));
      
    } catch (err) {
      console.error('Error adding to favorites:', err);
      setError('Failed to add to favorites');
      
      // Fallback to localStorage
      const updatedFavorites = [...favorites, movie];
      setFavorites(updatedFavorites);
      localStorage.setItem('favorites', JSON.stringify(updatedFavorites));
    }
  };

  const removeFromFavorites = async (movieId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/favorites/${movieId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to remove from favorites');
      }

      // Update local state
      setFavorites(prev => prev.filter(movie => movie.id !== movieId));
      
      // Also update localStorage as backup
      const updatedFavorites = favorites.filter(movie => movie.id !== movieId);
      localStorage.setItem('favorites', JSON.stringify(updatedFavorites));
      
    } catch (err) {
      console.error('Error removing from favorites:', err);
      setError('Failed to remove from favorites');
      
      // Fallback to localStorage
      const updatedFavorites = favorites.filter(movie => movie.id !== movieId);
      setFavorites(updatedFavorites);
      localStorage.setItem('favorites', JSON.stringify(updatedFavorites));
    }
  };

  const isFavorite = (movieId) => {
    return favorites.some(movie => movie.id === movieId);
  };

  const checkIsFavorite = async (movieId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/favorites/${movieId}`);
      if (!response.ok) {
        throw new Error('Failed to check favorite status');
      }
      const data = await response.json();
      return data.isFavorite;
    } catch (err) {
      console.error('Error checking favorite status:', err);
      // Fallback to local state
      return isFavorite(movieId);
    }
  };

  const getFavoritesCount = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/favorites/stats/count`);
      if (!response.ok) {
        throw new Error('Failed to get favorites count');
      }
      const data = await response.json();
      return data.count;
    } catch (err) {
      console.error('Error getting favorites count:', err);
      // Fallback to local state
      return favorites.length;
    }
  };

  const clearError = () => setError(null);

  const value = {
    favorites,
    loading,
    error,
    addToFavorites,
    removeFromFavorites,
    isFavorite,
    checkIsFavorite,
    getFavoritesCount,
    fetchFavorites,
    clearError,
  };

  return (
    <MovieContext.Provider value={value}>
      {children}
    </MovieContext.Provider>
  );
};