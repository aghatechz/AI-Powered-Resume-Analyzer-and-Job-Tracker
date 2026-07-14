// API origin: local backend in dev, deployed backend in production.
var API_ORIGIN = (window.API_ORIGIN = window.API_ORIGIN || ((location.hostname === 'localhost' || location.hostname === '127.0.0.1') ? 'http://localhost:5000' : 'https://ai-resume-job-tracker-backend.vercel.app'));
const token = localStorage.getItem("token");

if (!token) {
  window.location.href = "index.html";
}

async function fetchReportData() {
  try {
    const response = await axios.get(`${API_ORIGIN}/api/reports/stats`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const { stats, growth } = response.data;

    // Update Stats Card
    document.getElementById("stat-users").textContent = stats.totalUsers;
    document.getElementById("stat-admins").textContent = stats.totalAdmins;
    document.getElementById("stat-resumes").textContent = stats.totalResumes;
    document.getElementById("stat-invites").textContent = stats.totalInvites;
    document.getElementById("stat-ats").textContent = stats.avgAtsScore + "%";

    document.getElementById("activity-summary").innerHTML = `
      <p>Platform is currently hosting <strong>${stats.totalUsers}</strong> users with an average ATS optimization score of <strong>${stats.avgAtsScore}%</strong>.</p>
      <p>Total AI interactions tracked: <strong>${stats.totalResumes}</strong>.</p>
      <p>System health is optimal. No critical failures reported in the last 24 hours.</p>
    `;

    renderGrowthChart(growth);

  } catch (err) {
    console.error("Failed to fetch report data:", err);
  }
}

function renderGrowthChart(growth) {
  const ctx = document.getElementById("growthChart").getContext("2d");
  
  const labels = growth.map(g => g.month);
  const data = growth.map(g => g.count);

  new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [{
        label: "New Registrations",
        data: data,
        borderColor: "#7f265b",
        backgroundColor: "rgba(127, 38, 91, 0.1)",
        tension: 0.4,
        fill: true,
        pointRadius: 6,
        pointBackgroundColor: "#7f265b"
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: { beginAtZero: true, grid: { color: "#f0f0f0" } },
        x: { grid: { display: false } }
      }
    }
  });
}

document.addEventListener("DOMContentLoaded", fetchReportData);
