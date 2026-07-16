// API origin: local backend in dev, deployed backend in production.
var API_ORIGIN = (window.API_ORIGIN = window.API_ORIGIN || ((location.hostname === 'localhost' || location.hostname === '127.0.0.1') ? 'http://localhost:5000' : 'https://ai-resume-job-tracker-backend.vercel.app'));
const token = localStorage.getItem("token");

// Redirect if not logged in
if (!token) {
  window.location.href = "home.html";
}

const api = axios.create({
  baseURL: `${API_ORIGIN}/api/profile`,
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
});

// DOM Elements
const settingsForm = document.getElementById("settingsForm");
const defaultTargetRoleInput = document.getElementById("defaultTargetRole");
const aiModelSelect = document.getElementById("aiModel");
const aiTemperatureInput = document.getElementById("aiTemperature");
const atsScoreGoalInput = document.getElementById("atsScoreGoal");
const emailNotificationsCheckbox = document.getElementById("emailNotifications");
const deadlineAlertsCheckbox = document.getElementById("deadlineAlerts");

const currentPasswordInput = document.getElementById("currentPassword");
const newPasswordInput = document.getElementById("newPassword");
const confirmPasswordInput = document.getElementById("confirmPassword");

const githubLinkInput = document.getElementById("githubLink");
const linkedinLinkInput = document.getElementById("linkedinLink");
const websiteLinkInput = document.getElementById("websiteLink");

const tempValueSpan = document.getElementById("tempValue");
const scoreValueSpan = document.getElementById("scoreValue");

// Toast Notification
function showNotification(message, type = "success") {
  const toast = document.getElementById("notification-toast");
  toast.innerText = message;
  toast.className = `show ${type}`;
  setTimeout(() => {
    toast.className = "";
  }, 4000);
}

// Update User UI (Name, Avatar)
function updateUserUI() {
  const userAvatar = document.getElementById("userAvatar");
  const userName = document.querySelector(".user-name");
  const userRole = document.querySelector(".user-role");

  const user = JSON.parse(localStorage.getItem("user")) || { name: 'Guest', avatar: '', role: 'User' };
  const name = user.name || "Guest";

  if (user.avatar) {
    userAvatar.src = user.avatar.includes('http') ? user.avatar : `${API_ORIGIN}${user.avatar}`;
  } else {
    userAvatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0d6efd&color=fff`;
  }

  if (userName) userName.textContent = name;
  if (userRole) userRole.textContent = user.role || "User";
}

// Fetch User Settings from Backend
async function loadUserSettings() {
  try {
    const { data } = await api.get("/settings");
    if (data.success) {
      const settings = data.settings || {};
      const socials = data.socials || {};

      // AI Settings
      defaultTargetRoleInput.value = settings.defaultTargetRole || "Software Engineer";
      aiModelSelect.value = settings.aiModel || "gemini-2.5-flash";
      aiTemperatureInput.value = settings.aiTemperature ?? 0.2;
      tempValueSpan.innerText = settings.aiTemperature ?? 0.2;
      
      atsScoreGoalInput.value = settings.atsScoreGoal ?? 85;
      scoreValueSpan.innerText = (settings.atsScoreGoal ?? 85) + "%";

      // Notifications
      emailNotificationsCheckbox.checked = settings.emailNotifications ?? true;
      deadlineAlertsCheckbox.checked = settings.deadlineAlerts ?? true;

      // Social / Links
      githubLinkInput.value = socials.github || "";
      linkedinLinkInput.value = socials.linkedin || "";
      websiteLinkInput.value = socials.website || "";
    }
  } catch (err) {
    console.error("Failed to load settings:", err);
    showNotification("Failed to fetch settings from server", "error");
  }
}

// Save User Settings
async function saveUserSettings(event) {
  event.preventDefault();

  const currentPassword = currentPasswordInput.value;
  const newPassword = newPasswordInput.value;
  const confirmPassword = confirmPasswordInput.value;

  // Validation: Password change matching
  if (newPassword || confirmPassword) {
    if (!currentPassword) {
      return showNotification("Please enter your current password to change it", "error");
    }
    if (newPassword !== confirmPassword) {
      return showNotification("New passwords do not match!", "error");
    }
    if (newPassword.length < 6) {
      return showNotification("Password must be at least 6 characters long", "error");
    }
  }

  const payload = {
    settings: {
      defaultTargetRole: defaultTargetRoleInput.value.trim(),
      aiModel: aiModelSelect.value,
      aiTemperature: parseFloat(aiTemperatureInput.value),
      atsScoreGoal: parseInt(atsScoreGoalInput.value),
      emailNotifications: emailNotificationsCheckbox.checked,
      deadlineAlerts: deadlineAlertsCheckbox.checked,
    },
    socials: {
      github: githubLinkInput.value.trim(),
      linkedin: linkedinLinkInput.value.trim(),
      website: websiteLinkInput.value.trim(),
    }
  };

  if (newPassword) {
    payload.currentPassword = currentPassword;
    payload.newPassword = newPassword;
  }

  try {
    const { data } = await api.put("/settings", payload);
    if (data.success) {
      showNotification("Settings updated successfully!", "success");
      
      // Clear password fields
      currentPasswordInput.value = "";
      newPasswordInput.value = "";
      confirmPasswordInput.value = "";

      // Sync local storage user socials/settings
      const user = JSON.parse(localStorage.getItem("user")) || {};
      user.github = payload.socials.github;
      user.linkedin = payload.socials.linkedin;
      user.website = payload.socials.website;
      localStorage.setItem("user", JSON.stringify(user));
    }
  } catch (err) {
    console.error("Save settings failed:", err);
    const errMsg = err.response?.data?.msg || "Failed to save settings";
    showNotification(errMsg, "error");
  }
}

// Reset / Cancel Form
function resetForm() {
  settingsForm.reset();
  // Reload saved values from backend after reset
  loadUserSettings();
}

// Initialize — combined into a single DOMContentLoaded listener
document.addEventListener('DOMContentLoaded', () => {
  updateUserUI();
  loadUserSettings();
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
