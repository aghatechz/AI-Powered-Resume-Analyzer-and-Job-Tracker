// Central backend config. Auto-switches between local dev and the deployed backend.
const API_ORIGIN =
  window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000'
    : 'https://server-xi-six-60.vercel.app';

const CONFIG = {
  API_BASE_URL: API_ORIGIN + '/api',
};

// Helper to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Authorization': token ? `Bearer ${token}` : '',
    'Content-Type': 'application/json',
  };
};
