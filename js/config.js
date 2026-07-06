const CONFIG = {
    // Backend URL based on environment
    API_BASE_URL: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
        ? 'http://localhost:5000/api' 
        : 'https://your-vercel-backend-url.vercel.app/api' // Replace this after deployment
};

// Also export helper function to get token
const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json'
    };
};
