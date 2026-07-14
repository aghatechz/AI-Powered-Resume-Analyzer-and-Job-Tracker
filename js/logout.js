// API origin: local backend in dev, deployed backend in production.
var API_ORIGIN = (window.API_ORIGIN = window.API_ORIGIN || ((location.hostname === 'localhost' || location.hostname === '127.0.0.1') ? 'http://localhost:5000' : 'https://ai-resume-job-tracker-backend.vercel.app'));
async function handleLogout() {
  const token = localStorage.getItem("token");
  const userStr = localStorage.getItem("user");
  
  if (token && userStr) {
    try {
      const user = JSON.parse(userStr);
      if (user._id) {
        await axios.post(`${API_ORIGIN}/api/auth/logout`, { userId: user._id });
      }
    } catch (err) {
      console.error("Logout error:", err);
    }
  }

  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "index.html";
}

// Global window assignment to ensure it's available for onclick
window.handleLogout = handleLogout;
