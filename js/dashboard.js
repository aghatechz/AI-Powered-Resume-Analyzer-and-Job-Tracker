// API origin: local backend in dev, deployed backend in production.
var API_ORIGIN = (window.API_ORIGIN = window.API_ORIGIN || ((location.hostname === 'localhost' || location.hostname === '127.0.0.1') ? 'http://localhost:5000' : 'https://server-xi-six-60.vercel.app'));
if (!localStorage.getItem("user")) {
  localStorage.setItem("user", JSON.stringify({
    name: 'Guest',
    title: '',
    about: '',
    email: '',
    phone: '',
    skills: [],
    experience: [],
    education: [],
    avatar: ''
  }));
}


const token = localStorage.getItem("token");

const api = axios.create({
  baseURL: `${API_ORIGIN}/api/dashboard`,
  headers: {
    "Content-Type": "application/json",
    Authorization: token ? `Bearer ${token}` : "",
  },
});

const totalResumesElem = document.getElementById("totalResumes");
const jobsAppliedElem = document.getElementById("jobsApplied");
const profileCompletenessElem = document.getElementById("profileCompleteness");
let profileProgressFill = document.getElementById('profileProgressFill');
const analyticsChartEl = document.getElementById("analyticsChart");
let analyticsChart = null;

function destroyChart(chart) {
  if (chart) chart.destroy();
  return null;
}

async function fetchUserProfileForDashboard() {
  if (!token) return;

  try {
    const res = await axios.get(`${API_ORIGIN}/api/profile/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const data = res.data;

    const userData = {
      name: data.name || 'Guest',
      title: data.title || '',
      about: data.about || '',
      email: data.email || '',
      phone: data.phone || '',
      skills: data.skills || [],
      experience: data.experience || [],
      education: data.education || [],
      avatar: data.avatar
        ? (data.avatar.startsWith('http')
          ? data.avatar
          : `${API_ORIGIN}${data.avatar}`)
        : ''
    };

    localStorage.setItem('user', JSON.stringify(userData));

    updateUserUI();
    updateProfileCompleteness();

  } catch (err) {
    console.error('Dashboard profile fetch failed:', err);
  }
}

async function fetchDashboardData() {
  try {
    const { data } = await api.get("/");

    if (totalResumesElem) totalResumesElem.innerText = data.totalResumes || 0;
    if (jobsAppliedElem) jobsAppliedElem.innerText = data.jobsApplied || 0;

    // Only re-render chart if real analytics data came from API
    if (data.analytics && data.analytics.applications && data.analytics.applications.some(v => v > 0)) {
      renderAnalyticsChart(data.analytics);
    }

  } catch (err) {
    console.error("Dashboard fetch error:", err);
    // Static chart already rendered on DOMContentLoaded, no action needed
  }
}

function renderAnalyticsChart(analytics) {
  const labels = analytics?.labels || ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  // Use API data if available, otherwise use realistic static sample data
  const hasRealData = analytics?.applications && analytics.applications.some(v => v > 0);
  const chartData = hasRealData
    ? analytics.applications
    : [2, 5, 3, 8, 6, 4, 7];

  analyticsChart = destroyChart(analyticsChart);

  if (analyticsChartEl) {
    analyticsChart = new Chart(analyticsChartEl, {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: "Applications",
            data: chartData,
            borderColor: "#0d6efd",
            backgroundColor: "rgba(13, 110, 253, 0.12)",
            tension: 0.45,
            fill: true,
            pointBackgroundColor: "#0d6efd",
            pointBorderColor: "#ffffff",
            pointBorderWidth: 2,
            pointRadius: 5,
            pointHoverRadius: 7,
          },
          {
            label: "ATS Score",
            data: hasRealData
              ? (analytics?.atsScores || [60, 65, 70, 75, 72, 78, 82])
              : [60, 65, 70, 75, 72, 78, 82],
            borderColor: "#f59e0b",
            backgroundColor: "rgba(245, 158, 11, 0.08)",
            tension: 0.45,
            fill: false,
            borderDash: [5, 4],
            pointBackgroundColor: "#f59e0b",
            pointBorderColor: "#ffffff",
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6,
          }
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: "index",
          intersect: false,
        },
        plugins: {
          legend: {
            display: true,
            position: "top",
            align: "end",
            labels: {
              usePointStyle: true,
              pointStyle: "circle",
              padding: 20,
              font: { size: 12, family: "Poppins" },
              color: "#64748b",
            },
          },
          tooltip: {
            backgroundColor: "rgba(255,255,255,0.95)",
            titleColor: "#0f172a",
            bodyColor: "#475569",
            borderColor: "rgba(13, 110, 253, 0.2)",
            borderWidth: 1,
            padding: 12,
            cornerRadius: 10,
            titleFont: { weight: "600", family: "Poppins" },
            bodyFont: { family: "Poppins" },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: "rgba(0,0,0,0.05)", drawBorder: false },
            ticks: {
              color: "#94a3b8",
              font: { size: 11, family: "Poppins" },
              stepSize: 2,
            },
            border: { display: false },
          },
          x: {
            grid: { display: false },
            ticks: {
              color: "#94a3b8",
              font: { size: 11, family: "Poppins" },
            },
            border: { display: false },
          },
        },
      },
    });
  }
}

function updateUserUI() {
  const userAvatar = document.getElementById("userAvatar");
  const userName = document.querySelector(".user-name");
  const userRole = document.querySelector(".user-role");

  const user = JSON.parse(localStorage.getItem("user")) || { name: 'Guest', avatar: '' };

  const name = user.name || "Guest";

  if (user.avatar) {
    userAvatar.src = user.avatar.includes('http') ? user.avatar : `${API_ORIGIN}${user.avatar}`;
  } else {
    userAvatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0d6efd&color=fff`;
  }

  userName.textContent = name;
  if (userRole) {
    if (user.role) {
      userRole.textContent = user.role; 
    } else {
      userRole.textContent = ""; 
    }
  }

}

function calculateProfileCompleteness() {
  const userData = JSON.parse(localStorage.getItem("user") || "{}");

  userData.skills = Array.isArray(userData.skills) ? userData.skills.filter(s => s && s.trim() !== '') : [];
  userData.experience = Array.isArray(userData.experience) ? userData.experience.filter(e => e.title && e.title.trim() !== '') : [];
  userData.education = Array.isArray(userData.education) ? userData.education.filter(ed => ed.degree && ed.degree.trim() !== '') : [];

  let score = 0;
  let total = 0;

  const sections = [
    { field: 'name', weight: 10 },
    { field: 'title', weight: 10 },
    { field: 'about', weight: 15 },
    { field: 'email', weight: 10 },
    { field: 'phone', weight: 10 },
    { field: 'skills', weight: 20 },
    { field: 'experience', weight: 15 },
    { field: 'education', weight: 10 }
  ];

  sections.forEach(section => {
    total += section.weight;
    const value = userData[section.field];

    if (['skills', 'experience', 'education'].includes(section.field)) {
      if (Array.isArray(value) && value.length > 0) score += section.weight;
    } else if (typeof value === 'string' && value.trim() !== '') {
      score += section.weight;
    }
  });

  return Math.min(100, total === 0 ? 0 : Math.round((score / total) * 100));
}


function updateProfileCompleteness() {
  const completeness = calculateProfileCompleteness();

  if (profileCompletenessElem) {
    profileCompletenessElem.innerText = completeness + '%';
  }

  if (profileProgressFill) {
    profileProgressFill.style.width = completeness + '%';
  }
}


document.addEventListener("DOMContentLoaded", () => {
  fetchUserProfileForDashboard();
  updateUserUI();
  updateProfileCompleteness();

  // Pehle static chart render karo immediately
  renderAnalyticsChart(null);

  // Phir API se data fetch karo - agar data aya to chart update hoga
  fetchDashboardData();

  // Fallback: agar API 3 seconds mein chart nahi banata to static chart lagao
  setTimeout(() => {
    if (analyticsChartEl && !analyticsChart) {
      renderAnalyticsChart(null);
    }
  }, 3000);

  window.addEventListener('profileUpdated', () => {
    updateUserUI();
    updateProfileCompleteness();
  });

  window.addEventListener('profileAvatarUpdated', () => {
    updateUserUI();
  });

  window.addEventListener('storage', (e) => {
    if (e.key === 'user') {
      updateUserUI();
      updateProfileCompleteness();
    }

   const completeness = calculateProfileCompleteness(); // <-- yahan add karo
    if (completeness < 50) {
      showNotification("Your profile is incomplete. Please update your details.", "info");
    }
  });
});



function showNotification(message, type = 'success') {
  const colors = {
    success: 'linear-gradient(135deg, #00c853 0%, #00e676 100%)',
    error: 'linear-gradient(135deg, #f44336 0%, #e57373 100%)',
    info: 'linear-gradient(135deg, #2196F3 0%, #64B5F6 100%)'
  };

  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${colors[type] || colors.success};
    color: white;
    padding: 15px 25px;
    border-radius: 10px;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
    z-index: 1000;
    font-weight: 500;
    animation: slideIn 0.3s ease;
  `;
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Animation styles
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from { transform: translateX(400px); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  @keyframes slideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(400px); opacity: 0; }
  }
`;
document.head.appendChild(style);

// Mobile sidebar toggle
document.addEventListener('DOMContentLoaded', () => {
  const mobileMenuToggle = document.getElementById('mobileMenuToggle');
  const sidebar = document.getElementById('sidebar');
  const sidebarOverlay = document.getElementById('sidebarOverlay');
  const mainContent = document.getElementById('mainContent');

  if (mobileMenuToggle && sidebar && sidebarOverlay) {
    mobileMenuToggle.addEventListener('click', () => {
      const isOpen = mobileMenuToggle.classList.toggle('active');
      sidebar.classList.toggle('open');
      sidebarOverlay.classList.toggle('active');
      mobileMenuToggle.setAttribute('aria-expanded', isOpen);
      sidebarOverlay.setAttribute('aria-hidden', !isOpen);
    });

    // Close sidebar when clicking overlay
    sidebarOverlay.addEventListener('click', () => {
      mobileMenuToggle.classList.remove('active');
      sidebar.classList.remove('open');
      sidebarOverlay.classList.remove('active');
      mobileMenuToggle.setAttribute('aria-expanded', 'false');
      sidebarOverlay.setAttribute('aria-hidden', 'true');
    });

    // Close sidebar when clicking a menu link on mobile
    sidebar.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        if (window.innerWidth < 992) {
          mobileMenuToggle.classList.remove('active');
          sidebar.classList.remove('open');
          sidebarOverlay.classList.remove('active');
          mobileMenuToggle.setAttribute('aria-expanded', 'false');
          sidebarOverlay.setAttribute('aria-hidden', 'true');
        }
      });
    });
  }
});



