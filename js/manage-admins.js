// API origin: local backend in dev, deployed backend in production.
var API_ORIGIN = (window.API_ORIGIN = window.API_ORIGIN || ((location.hostname === 'localhost' || location.hostname === '127.0.0.1') ? 'http://localhost:5000' : 'https://server-xi-six-60.vercel.app'));
const API_BASE_URL = `${API_ORIGIN}/api`;  
const token = localStorage.getItem("token");

if (!token) {
  alert("Unauthorized! Please login again.");
  window.location.href = "login.html";
}

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

 const adminsTableBody = document.getElementById("adminsTableBody");
const totalAdminsEl = document.getElementById("totalAdmins");
const activeAdminsEl = document.getElementById("activeAdmins");
const moderatorsEl = document.getElementById("moderators");
const pendingInvitesEl = document.getElementById("pendingInvites");

const searchInput = document.getElementById("searchInput");
const roleFilter = document.getElementById("roleFilter");
const statusFilter = document.getElementById("statusFilter");

let currentPage = 1;
const perPage = 10;
let adminsData = [];

 async function fetchAdmins() {
  try {
    adminsTableBody.innerHTML = `
      <tr class="loading-row">
        <td colspan="8">
          <div class="loader"></div>
          <p>Loading admins...</p>
        </td>
      </tr>
    `;
    const response = await axiosInstance.get("");
    adminsData = response.data.admins; 
    renderTable();
    updateStats();
  } catch (error) {
    console.error(error);
    adminsTableBody.innerHTML = `
      <tr class="loading-row">
        <td colspan="8">Failed to load admins.</td>
      </tr>
    `;
  }
}

function renderTable() {
  const searchTerm = searchInput.value.toLowerCase();
  const role = roleFilter.value;
  const status = statusFilter.value;

  let filteredAdmins = adminsData.filter(admin => {
    const matchesSearch = admin.name.toLowerCase().includes(searchTerm) || admin.email.toLowerCase().includes(searchTerm);
    const matchesRole = role ? admin.role === role : true;
    const matchesStatus = status ? (admin.isActive ? "active" : "inactive") === status : true;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const total = filteredAdmins.length;
  const start = (currentPage - 1) * perPage;
  const end = start + perPage;
  const paginatedAdmins = filteredAdmins.slice(start, end);

  adminsTableBody.innerHTML = paginatedAdmins.length
    ? paginatedAdmins.map(admin => `
        <tr>
          <td><input type="checkbox" data-id="${admin._id}"></td>
          <td>${admin.name}</td>
          <td>${admin.email}</td>
          <td><span class="status-badge ${admin.role}">${admin.role}</span></td>
          <td><span class="status-badge ${admin.isActive ? "active" : "inactive"}">${admin.isActive ? "Active" : "Inactive"}</span></td>
          <td>${new Date(admin.lastActive).toLocaleString()}</td>
          <td>${new Date(admin.createdAt).toLocaleDateString()}</td>
          <td class="action-btns">
            <button class="action-btn edit" onclick="openEditModal('${admin._id}')"><i class="fas fa-edit"></i></button>
            <button class="action-btn delete" onclick="openDeleteModal('${admin._id}', '${admin.name}')"><i class="fas fa-trash"></i></button>
          </td>
        </tr>
      `).join('')
    : `<tr><td colspan="8" class="empty-state"><p>No admins found</p></td></tr>`;

  renderPagination(filteredAdmins.length);
}

function updateStats() {
  totalAdminsEl.textContent = adminsData.length;
  activeAdminsEl.textContent = adminsData.filter(a => a.isActive).length;
  moderatorsEl.textContent = adminsData.filter(a => a.role === "moderator").length;
  pendingInvitesEl.textContent = adminsData.filter(a => !a.isActive).length;
}

searchInput.addEventListener("input", () => {
  currentPage = 1;
  renderTable();
});

roleFilter.addEventListener("change", () => {
  currentPage = 1;
  renderTable();
});

statusFilter.addEventListener("change", () => {
  currentPage = 1;
  renderTable();
});

function renderPagination(totalItems) {
  const pageNumbersContainer = document.getElementById("pageNumbers");
  const totalPages = Math.ceil(totalItems / perPage);
  pageNumbersContainer.innerHTML = "";

  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement("button");
    btn.textContent = i;
    btn.classList.add("page-number");
    if (i === currentPage) btn.classList.add("active");
    btn.addEventListener("click", () => {
      currentPage = i;
      renderTable();
    });
    pageNumbersContainer.appendChild(btn);
  }

  document.getElementById("prevBtn").disabled = currentPage === 1;
  document.getElementById("nextBtn").disabled = currentPage === totalPages || totalPages === 0;
}

function changePage(direction) {
  if (direction === "prev" && currentPage > 1) currentPage--;
  if (direction === "next" && currentPage * perPage < adminsData.length) currentPage++;
  renderTable();
}

const editModal = document.getElementById("editModal");

function openEditModal(id) {
  const admin = adminsData.find(a => a._id === id);
  document.getElementById("editAdminId").value = admin._id;
  document.getElementById("editName").value = admin.name;
  document.getElementById("editEmail").value = admin.email;
  document.getElementById("editRole").value = admin.role;
  document.getElementById("editStatus").value = admin.isActive;
  editModal.classList.add("show");
}

function closeEditModal() {
  editModal.classList.remove("show");
}

function openDeleteModal(id, name) {
  window.deleteAdminId = id;
  document.getElementById("deleteAdminInfo").textContent = name;
  document.getElementById("deleteModal").classList.add("show");
}

function closeDeleteModal() {
  document.getElementById("deleteModal").classList.remove("show");
}

async function confirmDelete() {
  try {
    await axiosInstance.delete(`/admins/${window.deleteAdminId}`);
    adminsData = adminsData.filter(a => a._id !== window.deleteAdminId);
    renderTable();
    updateStats();
    closeDeleteModal();
  } catch (error) {
    console.error(error);
    alert("Failed to delete admin.");
  }
}
async function saveEditAdmin() {
  const id = document.getElementById("editAdminId").value;
  const updates = {
    name: document.getElementById("editName").value,
    email: document.getElementById("editEmail").value,
    role: document.getElementById("editRole").value,
    isActive: document.getElementById("editStatus").value === "true"
  };
  try {
    const response = await axiosInstance.put(`/admins/${id}`, updates);
    const index = adminsData.findIndex(a => a._id === id);
    adminsData[index] = response.data;
    renderTable();
    updateStats();
    closeEditModal();
  } catch (err) {
    console.error(err);
    alert("Failed to update admin.");
  }
}


function showInviteModal() {
  document.getElementById("inviteModal").classList.add("show");
}

function closeInviteModal() {
  document.getElementById("inviteModal").classList.remove("show");
}

document.getElementById("inviteForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("inviteEmail").value;
  const role = document.getElementById("inviteRole").value;
  const message = document.getElementById("inviteMessage").value;

  try {
    const response = await axios.post(`${API_ORIGIN}/api/superadmin-dashboard/invite-admin`, {
      email, role, message
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    alert("Invitation sent successfully!");
    closeInviteModal();
    document.getElementById("inviteForm").reset();
  } catch (err) {
    console.error(err);
    alert("Failed to send invitation: " + (err.response?.data?.message || err.message));
  }
});

fetchAdmins();

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
