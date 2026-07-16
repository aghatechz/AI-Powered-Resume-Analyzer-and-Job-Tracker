// API origin: local backend in dev, deployed backend in production.
var API_ORIGIN = (window.API_ORIGIN = window.API_ORIGIN || ((location.hostname === 'localhost' || location.hostname === '127.0.0.1') ? 'http://localhost:5000' : 'https://server-xi-six-60.vercel.app'));
const totalUsersEl = document.getElementById("totalUsers");
const totalAdminsEl = document.getElementById("totalAdmins");
const pendingInvitesEl = document.getElementById("pendingInvites");
const activeSessionsEl = document.getElementById("activeSessions");
const userGrowthChartEl = document.getElementById("userGrowthChart").getContext("2d");
const activityListEl = document.getElementById("activityList");
const timeFilterEl = document.getElementById("timeFilter");

const inviteModal = document.getElementById("inviteModal");
const inviteForm = document.getElementById("inviteForm");

 let usersData = [];
let adminsData = [];
let invitesData = [];
let chartInstance;

 async function fetchDashboardData() {
  const token = localStorage.getItem("token");
  if (!token) return console.error("No token found");

  try {
     const usersRes = await axios.get(`${API_ORIGIN}/api/superadmin-dashboard/users`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    usersData = usersRes.data.users;

     const adminsRes = await axios.get(`${API_ORIGIN}/api/superadmin-dashboard/admins`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    adminsData = adminsRes.data.admins;

     const invitesRes = await axios.get(`${API_ORIGIN}/api/superadmin-dashboard/pending-invites`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    invitesData = invitesRes.data.invites;

    updateCards();
   } catch (err) {
    console.error("Error fetching dashboard data:", err.response?.data || err.message);
  }
}

 function updateCards() {
  totalUsersEl.textContent = usersData.length;
  totalAdminsEl.textContent = adminsData.length;
  pendingInvitesEl.textContent = invitesData.length;

  const activeUsers = usersData.filter(u => u.status === true).length;
  const activeAdmins = adminsData.filter(a => a.status === true).length;
  activeSessionsEl.textContent = activeUsers + activeAdmins;
}

 let userGrowthChart = null;

function renderUserGrowthChart(labels, data) {
  if (userGrowthChart) userGrowthChart.destroy();

  const ctx = document.getElementById("userGrowthChart").getContext("2d");

  userGrowthChart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [{
        label: "New Users",
        data,
        borderColor: "#7f265b",
        backgroundColor: "rgba(127,38,91,0.15)",
        tension: 0.4,
        fill: true,
        pointRadius: 5
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true },
        x: { grid: { display: false } }
      }
    }
  });
}


function loadUserGrowth(days = 30) {
  let labels = [], data = [];

  if (days == 7) {
    labels = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
    data = [5,8,6,10,12,9,14];
  } else if (days == 30) {
    labels = ["Week 1","Week 2","Week 3","Week 4"];
    data = [40,65,80,110];
  } else {
    labels = ["Jan","Feb","Mar"];
    data = [120,180,240];
  }

  renderUserGrowthChart(labels, data);
}

timeFilterEl.addEventListener("change", e => {
  loadUserGrowth(e.target.value);
});

document.addEventListener("DOMContentLoaded", () => {
  loadUserGrowth(30);
});

function showInviteModal() {
  inviteModal.classList.add("show");
}

function closeInviteModal() {
  inviteModal.classList.remove("show");
}

 inviteForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const token = localStorage.getItem("token");
  const email = document.getElementById("inviteEmail").value;
  const role = document.getElementById("inviteRole").value;
  const message = document.getElementById("inviteMessage").value;

  try {
    await axios.post(`${API_ORIGIN}/api/superadmin-dashboard/invite-admin`, {
      email, role, message
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    alert("Invite sent successfully!");
    closeInviteModal();
    fetchDashboardData();
  } catch (err) {
    alert("Failed to send invite: " + (err.response?.data?.message || err.message));
  }
});

async function handleLogout() {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  
  if (token && user._id) {
    try {
      await axios.post(`${API_ORIGIN}/api/auth/logout`, { userId: user._id });
    } catch (err) {
      console.error("Logout error:", err);
    }
  }

  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "home.html";
}

fetchDashboardData();

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

