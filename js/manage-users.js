// API origin: local backend in dev, deployed backend in production.
var API_ORIGIN = (window.API_ORIGIN = window.API_ORIGIN || ((location.hostname === 'localhost' || location.hostname === '127.0.0.1') ? 'http://localhost:5000' : 'https://ai-resume-job-tracker-backend.vercel.app'));
const usersTableBody = document.getElementById("usersTableBody");
const totalUsersEl = document.getElementById("totalUsers");
const activeUsersEl = document.getElementById("activeUsers");
const inactiveUsersEl = document.getElementById("inactiveUsers");
const newUsersEl = document.getElementById("newUsers");

const searchInput = document.getElementById("searchInput");
const roleFilter = document.getElementById("roleFilter");
const statusFilter = document.getElementById("statusFilter");

const editModal = document.getElementById("editModal");
const editForm = document.getElementById("editForm");
const editUserId = document.getElementById("editUserId");
const editName = document.getElementById("editName");
const editEmail = document.getElementById("editEmail");
const editRole = document.getElementById("editRole");
const editStatus = document.getElementById("editStatus");

const deleteModal = document.getElementById("deleteModal");
const deleteUserInfo = document.getElementById("deleteUserInfo");


let usersData = [];  

async function fetchUsers() {
    const token = localStorage.getItem("token");

    if (!token) {
        console.error("No token found in localStorage!");
        usersTableBody.innerHTML = `<tr><td colspan="8">No token found</td></tr>`;
        return;
    }

    try {
        const response = await axios.get(`${API_ORIGIN}/api/manage-users`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

         usersData = response.data.users || response.data;
 
        renderTable(usersData);
        updateStats(usersData);
    } catch (error) {
        console.error("Error fetching users:", error.response?.data || error.message);
        usersTableBody.innerHTML = `<tr><td colspan="8">Failed to load users</td></tr>`;
    }
}

function renderTable(data) {
    if (data.length === 0) {
        usersTableBody.innerHTML = `<tr><td colspan="8" class="empty-state">
            <i class="fas fa-users"></i>
            <h3>No users found</h3>
        </td></tr>`;
        return;
    }

    usersTableBody.innerHTML = data.map(user => `
        <tr>
            <td><input type="checkbox" data-id="${user._id}"></td>
            <td>${user.name}</td>
            <td>${user.email}</td>
            <td><span class="status-badge ${user.role}">${user.role}</span></td>
            <td><span class="status-badge ${user.status ? 'active' : 'inactive'}">
                ${user.status ? 'Active' : 'Inactive'}
            </span></td>
            <td>${new Date(user.createdAt).toLocaleDateString()}</td>
            <td>${user.lastActive ? new Date(user.lastActive).toLocaleDateString() : '-'}</td>
            <td class="action-btns">
                <button class="action-btn edit" onclick="openEditModal('${user._id}')"><i class="fas fa-edit"></i> Edit</button>
                <button class="action-btn delete" onclick="openDeleteModal('${user._id}', '${user.name}')"><i class="fas fa-trash"></i> Delete</button>
            </td>
        </tr>
    `).join("");
}

function updateStats(data) {
    const total = data.length;
    const active = data.filter(u => u.status).length;
    const inactive = total - active;
    const currentMonth = new Date().getMonth();
    const newUsers = data.filter(u => new Date(u.createdAt).getMonth() === currentMonth).length;

    totalUsersEl.textContent = total;
    activeUsersEl.textContent = active;
    inactiveUsersEl.textContent = inactive;
    newUsersEl.textContent = newUsers;
}

searchInput.addEventListener("input", applyFilters);
roleFilter.addEventListener("change", applyFilters);
statusFilter.addEventListener("change", applyFilters);

function applyFilters() {
    const searchTerm = searchInput.value.toLowerCase();
    const role = roleFilter.value;
    const status = statusFilter.value;

    const filtered = usersData.filter(user => {
        const matchesSearch = user.name.toLowerCase().includes(searchTerm) || user.email.toLowerCase().includes(searchTerm);
        const matchesRole = role ? user.role === role : true;
        const matchesStatus = status ? (status === 'active' ? user.status : !user.status) : true;
        return matchesSearch && matchesRole && matchesStatus;
    });

    renderTable(filtered);
    updateStats(filtered);
}

function openEditModal(userId) {
    const user = usersData.find(u => u._id === userId);
    editUserId.value = user._id;
    editName.value = user.name;
    editEmail.value = user.email;
    editRole.value = user.role;
    editStatus.value = user.status;
    editModal.classList.add("show");
}

function closeEditModal() {
    editModal.classList.remove("show");
}

 editForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = editUserId.value;
    try {
        await axios.put(`${API_ORIGIN}/api/manage-users/${id}`, {
            name: editName.value,
            email: editEmail.value,
            role: editRole.value,
            status: editStatus.value
        }, {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        });
        await fetchUsers();
        closeEditModal();
    } catch (err) {
        console.error("Failed to update user:", err);
    }
});

let deleteUserId = null;

function openDeleteModal(userId, userName) {
    deleteUserId = userId;
    deleteUserInfo.textContent = userName;
    deleteModal.classList.add("show");
}

function closeDeleteModal() {
    deleteModal.classList.remove("show");
}

async function confirmDelete() {
    try {
        await axios.delete(`${API_ORIGIN}/api/manage-users/${deleteUserId}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        });
        await fetchUsers();
        closeDeleteModal();
    } catch (err) {
        console.error("Failed to delete user:", err);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    fetchUsers();
});

function refreshData() {
  fetchUsers();  
}

function exportUsers() {
  if (!usersData || usersData.length === 0) {
    alert("No users to export");
    return;
  }

   let csvContent = "data:text/csv;charset=utf-8,";
  csvContent += "Name,Email,Role,Status,Joined Date,Last Active\n";

   usersData.forEach(user => {
    const row = [
      `"${user.name}"`,
      `"${user.email}"`,
      user.role === 'admin' ? 'VIP User' : 'User',
      user.status ? 'Active' : 'Inactive',
      new Date(user.createdAt).toLocaleDateString(),
      user.lastActive ? new Date(user.lastActive).toLocaleDateString() : '-'
    ].join(",");

    csvContent += row + "\n";
  });

   const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "users_export.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
