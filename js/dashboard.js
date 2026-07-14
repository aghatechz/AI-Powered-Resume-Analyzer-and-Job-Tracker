// API origin: local backend in dev, deployed backend in production.
var API_ORIGIN = (window.API_ORIGIN = window.API_ORIGIN || ((location.hostname === 'localhost' || location.hostname === '127.0.0.1') ? 'http://localhost:5000' : 'https://ai-resume-job-tracker-backend.vercel.app'));
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
let profileProgressBar = document.querySelector('.card-orange .progress-fill');
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

    renderAnalyticsChart(data.analytics);

  } catch (err) {
    console.error("Dashboard fetch error:", err);
    showNotification("Failed to load profile data", "error"); // <- ye add karna

  }
}

function renderAnalyticsChart(analytics) {
  const labels = analytics?.labels || ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const chartData = analytics?.applications || [0, 0, 0, 0, 0, 0, 0];

  analyticsChart = destroyChart(analyticsChart);

  if (analyticsChartEl) {
    analyticsChart = new Chart(analyticsChartEl, {
      type: "line",
      data: {
        labels,
        datasets: [{
          label: "Applications",
          data: chartData,
          borderColor: "#7f265b",
          backgroundColor: "rgba(127, 38, 91, 0.1)",
          tension: 0.4,
          fill: true,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, grid: { color: "rgba(0,0,0,0.05)" } },
          x: { grid: { display: false } },
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
    userAvatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=7f265b&color=fff`;
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

  if (profileProgressBar) {
    profileProgressBar.style.width = completeness + '%';
  }
}


document.addEventListener("DOMContentLoaded", () => {
  fetchUserProfileForDashboard();
  updateUserUI();
  updateProfileCompleteness();
  fetchDashboardData();

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

updateUserUI();
updateProfileCompleteness();

document.addEventListener("DOMContentLoaded", () => {
  const showWelcome = localStorage.getItem("showWelcome");
  const user = JSON.parse(localStorage.getItem("user"));

  if (showWelcome && user) {
    const popup = document.getElementById("welcomePopup");
    const userName = document.getElementById("userName");

    userName.innerText = user.name;
    popup.classList.add("show");

    launchConfetti();

    setTimeout(() => {
      popup.style.transition = "opacity 0.5s ease";
      popup.style.opacity = "0";
      localStorage.removeItem("showWelcome");
    }, 3500);
  }
});

function launchConfetti() {
  const canvas = document.getElementById("confettiCanvas");
  const ctx = canvas.getContext("2d");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const confettiCount = 120;
  const confettis = [];

  for (let i = 0; i < confettiCount; i++) {
    confettis.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height - canvas.height,
      r: Math.random() * 6 + 4,
      color: `hsl(${Math.random() * 360}, 100%, 50%)`,
      tilt: Math.random() * 10 - 10,
      tiltAngle: 0,
      tiltAngleIncrement: Math.random() * 0.07 + 0.05,
      speed: 2 + Math.random() * 3,
      opacity: 1
    });
  }

  let slowDown = false;
  let animationId;

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    confettis.forEach(c => {
      ctx.globalAlpha = c.opacity;
      ctx.beginPath();
      ctx.lineWidth = c.r;
      ctx.strokeStyle = c.color;
      ctx.moveTo(c.x + c.tilt + c.r / 2, c.y);
      ctx.lineTo(c.x + c.tilt, c.y + c.tilt + c.r / 2);
      ctx.stroke();

      c.tiltAngle += c.tiltAngleIncrement;

      if (slowDown) {
        c.speed *= 0.96;
        c.opacity -= 0.02;
        if (c.opacity < 0) c.opacity = 0;
      }

      c.y += c.speed;
      c.tilt = Math.sin(c.tiltAngle) * 15;

      if (c.y > canvas.height) {
        c.y = -10;
        c.x = Math.random() * canvas.width;
      }
    });

    animationId = requestAnimationFrame(draw);
  }

  draw();

  setTimeout(() => {
    slowDown = true;
    setTimeout(() => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }, 2000);
  }, 7000);
}

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



