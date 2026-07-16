// API origin: local backend in dev, deployed backend in production.
var API_ORIGIN = (window.API_ORIGIN = window.API_ORIGIN || ((location.hostname === 'localhost' || location.hostname === '127.0.0.1') ? 'http://localhost:5000' : 'https://ai-resume-job-tracker-backend.vercel.app'));
let jobs = [];
let isLoading = false;

document.addEventListener('DOMContentLoaded', async () => {
  await fetchJobs();
  updateStats();
  
  document.getElementById('jobForm').addEventListener('submit', handleAddJob);
  document.getElementById('searchInput').addEventListener('input', handleSearch);
  document.getElementById('statusFilter').addEventListener('change', handleFilter);
  document.getElementById('sortBy').addEventListener('change', handleSort);
  document.getElementById('exportBtn').addEventListener('click', exportToCSV);
  
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('applicationDate').value = today;
});

async function fetchJobs() {
  isLoading = true;
  try {
    const token = localStorage.getItem("token");
    const res = await axios.get(`${API_ORIGIN}/api/jobs`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (res.data && res.data.jobs) {
      jobs = res.data.jobs.map(job => ({
        id: job._id,
        company: job.company,
        position: job.position,
        description: job.jobDescription || '',
        status: job.status,
        notes: job.notes || '',
        applicationDate: job.applicationDate || new Date().toISOString().split('T')[0],
        createdAt: job.createdAt || new Date().toISOString()
      }));
      updateStats();
      renderJobs();
    }
  } catch (error) {
    console.error("Failed to fetch jobs:", error);
    showNotification('Failed to load jobs. Please login again.', 'error');
  }
  isLoading = false;
}

async function handleAddJob(e) {
  e.preventDefault();
  
  if (isLoading) {
    showNotification('Please wait...', 'info');
    return;
  }
  
  const newJob = {
    company: document.getElementById('company').value,
    position: document.getElementById('position').value,
    jobDescription: document.getElementById('jobDescription').value,
    status: document.getElementById('status').value,
    notes: document.getElementById('notes').value,
    applicationDate: document.getElementById('applicationDate').value || new Date().toISOString().split('T')[0]
  };
  
  try {
    const token = localStorage.getItem("token");
    const res = await axios.post(`${API_ORIGIN}/api/jobs`, newJob, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (res.status === 201 && res.data.job) {

      const addedJob = {
        id: res.data.job._id,
        company: res.data.job.company,
        position: res.data.job.position,
        description: res.data.job.jobDescription || '',
        status: res.data.job.status,
        notes: res.data.job.notes || '',
        applicationDate: res.data.job.applicationDate || new Date().toISOString().split('T')[0],
        createdAt: res.data.job.createdAt || new Date().toISOString()
      };
      
      jobs.unshift(addedJob);
      updateStats();
      renderJobs();
      
      e.target.reset();
      const today = new Date().toISOString().split('T')[0];
      document.getElementById('applicationDate').value = today;
      
      showNotification('Job application added successfully!', 'success');
    }
  } catch (error) {
    console.error("Failed to add job:", error);
    showNotification('Failed to add job. Please try again.', 'error');
  }
}

function updateStats() {
  const totalApps = jobs.length;
  const interviewCount = jobs.filter(j => j.status === 'Interviewing').length;
  const offerCount = jobs.filter(j => j.status === 'Offered').length;
  const successRate = totalApps > 0 ? Math.round((offerCount / totalApps) * 100) : 0;
  const rejectedCount = jobs.filter(j => j.status === 'Rejected').length; 
  
  document.getElementById('totalApps').textContent = totalApps;
  document.getElementById('interviewCount').textContent = interviewCount;
  document.getElementById('offerCount').textContent = offerCount;
  document.getElementById('rejectedCount').textContent = rejectedCount; 
  document.getElementById('successRate').textContent = successRate + '%';
}

function renderJobs(jobsToRender = jobs) {
  const jobList = document.getElementById('jobList');
  const emptyState = document.getElementById('emptyState');
  
  if (jobsToRender.length === 0) {
    jobList.innerHTML = '';
    emptyState.classList.remove('hidden');
    return;
  }
  
  emptyState.classList.add('hidden');
  
  jobList.innerHTML = jobsToRender.map(job => `
    <div class="job-card status-${job.status.toLowerCase()}" data-id="${job.id}">
      <div class="job-info">
        <div class="job-header">
          <h4>${job.position}</h4>
          <span class="status-badge ${job.status.toLowerCase()}">
            ${getStatusIcon(job.status)} ${job.status}
          </span>
        </div>
        <p class="job-company">
          <i class="fas fa-building"></i>
          ${job.company}
        </p>
        ${job.description ? `<p class="job-description">${truncateText(job.description, 100)}</p>` : ''}
        ${job.notes ? `<p class="job-description"><i class="fas fa-sticky-note"></i> ${truncateText(job.notes, 80)}</p>` : ''}
        <p class="job-date">
          <i class="fas fa-calendar-alt"></i>
          Applied: ${formatDate(job.applicationDate)}
        </p>
      </div>
      <div class="job-actions">
        <button class="btn-edit" onclick="editJob('${job.id}')">
          <i class="fas fa-edit"></i> Edit
        </button>
        <button class="btn-delete" onclick="deleteJob('${job.id}')">
          <i class="fas fa-trash-alt"></i> Delete
        </button>
      </div>
    </div>
  `).join('');
}

function getStatusIcon(status) {
  const icons = {
    'Applied': '<i class="fas fa-paper-plane"></i>',
    'Interviewing': '<i class="fas fa-phone-alt"></i>',
    'Offered': '<i class="fas fa-check-circle"></i>',
    'Rejected': '<i class="fas fa-times-circle"></i>'
  };
  return icons[status] || '';
}

function formatDate(dateString) {
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return new Date(dateString).toLocaleDateString('en-US', options);
}

function truncateText(text) {
  return text; 
}

function editJob(id) {
  const job = jobs.find(j => j.id === id);
  if (!job) return;
  
  const card = document.querySelector(`[data-id="${id}"]`);
  const jobInfo = card.querySelector('.job-info');
  
  jobInfo.innerHTML = `
    <div class="edit-form">
      <input type="text" class="edit-input edit-position" value="${job.position}" placeholder="Position">
      <input type="text" class="edit-input edit-company" value="${job.company}" placeholder="Company">
      <textarea class="edit-input edit-desc" placeholder="Job Description">${job.description}</textarea>
      <select class="edit-input edit-status">
        <option value="Applied" ${job.status === "Applied" ? "selected" : ""}>Applied</option>
        <option value="Interviewing" ${job.status === "Interviewing" ? "selected" : ""}>Interviewing</option>
        <option value="Offered" ${job.status === "Offered" ? "selected" : ""}>Offered</option>
        <option value="Rejected" ${job.status === "Rejected" ? "selected" : ""}>Rejected</option>
      </select>
      <textarea class="edit-input edit-notes" placeholder="Notes">${job.notes}</textarea>
      <input type="date" class="edit-input edit-date" value="${job.applicationDate}">
      <div class="edit-actions">
        <button class="btn-save" onclick="saveJob('${id}')">
          <i class="fas fa-check"></i> Save
        </button>
        <button class="btn-cancel" onclick="cancelEdit('${id}')">
          <i class="fas fa-times"></i> Cancel
        </button>
      </div>
    </div>
  `;
}

async function saveJob(id) {
  const card = document.querySelector(`[data-id="${id}"]`);
  const updatedJob = {
    company: card.querySelector('.edit-company').value,
    position: card.querySelector('.edit-position').value,
    jobDescription: card.querySelector('.edit-desc').value,
    status: card.querySelector('.edit-status').value,
    notes: card.querySelector('.edit-notes').value,
    applicationDate: card.querySelector('.edit-date').value
  };

  try {
    const token = localStorage.getItem("token");
    const res = await axios.put(`${API_ORIGIN}/api/jobs/${id}`, updatedJob, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (res.status === 200) {
      const index = jobs.findIndex(j => j.id === id);
      if (index !== -1) {
        jobs[index] = {
          ...jobs[index],
          company: res.data.job.company,
          position: res.data.job.position,
          description: res.data.job.jobDescription || '',
          status: res.data.job.status,
          notes: res.data.job.notes || '',
          applicationDate: res.data.job.applicationDate || jobs[index].applicationDate
        };
      }
      
      updateStats();
      renderJobs();
      showNotification('Job updated successfully!', 'success');
    }
  } catch (error) {
    console.error("Failed to update job:", error);
    showNotification('Failed to update job. Please try again.', 'error');
    cancelEdit(id);
  }
}

function cancelEdit(id) {
  renderJobs();
}

async function deleteJob(id) {
  if (!confirm('Are you sure you want to delete this job application?')) {
    return;
  }

  try {
    const token = localStorage.getItem("token");
    const res = await axios.delete(`${API_ORIGIN}/api/jobs/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (res.status === 200) {
      jobs = jobs.filter(j => j.id !== id);
      updateStats();
      renderJobs();
      showNotification('Job application deleted!', 'success');
    }
  } catch (error) {
    console.error("Failed to delete job:", error);
    showNotification('Failed to delete job. Please try again.', 'error');
  }
}

function handleSearch(e) {
  const searchTerm = e.target.value.toLowerCase();
  const filtered = jobs.filter(job => 
    job.company.toLowerCase().includes(searchTerm) ||
    job.position.toLowerCase().includes(searchTerm) ||
    job.description.toLowerCase().includes(searchTerm)
  );
  renderJobs(filtered);
}

function handleFilter(e) {
  const status = e.target.value;
  if (status === 'all') {
    renderJobs(jobs);
  } else {
    const filtered = jobs.filter(job => job.status === status);
    renderJobs(filtered);
  }
}

function handleSort(e) {
  const sortBy = e.target.value;
  let sorted = [...jobs];
  
  switch(sortBy) {
    case 'date-desc':
      sorted.sort((a, b) => new Date(b.applicationDate) - new Date(a.applicationDate));
      break;
    case 'date-asc':
      sorted.sort((a, b) => new Date(a.applicationDate) - new Date(b.applicationDate));
      break;
    case 'company-asc':
      sorted.sort((a, b) => 
        a.company.toLowerCase().localeCompare(b.company.toLowerCase(), 'en', { sensitivity: 'base' })
      );
      break;
    case 'company-desc':
      sorted.sort((a, b) => 
        b.company.toLowerCase().localeCompare(a.company.toLowerCase(), 'en', { sensitivity: 'base' })
      );
      break;
  }
  
  renderJobs(sorted);
}

function exportToCSV() {
  if (jobs.length === 0) {
    alert('No jobs to export!');
    return;
  }
  
  const headers = ['Company', 'Position', 'Status', 'Application Date', 'Description', 'Notes'];
  const rows = jobs.map(job => [
    job.company,
    job.position,
    job.status,
    job.applicationDate,
    job.description || '',
    job.notes || ''
  ]);
  
  let csv = headers.join(',') + '\n';
  rows.forEach(row => {
    csv += row.map(cell => `"${cell}"`).join(',') + '\n';
  });
  
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `job-applications-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  window.URL.revokeObjectURL(url);
  
  showNotification('Jobs exported successfully!', 'success');
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

 const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(400px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(400px);
      opacity: 0;
    }
  }
  
  .edit-form {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  
  .edit-input {
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 8px;
    font-size: 14px;
    font-family: inherit;
  }
  
  .edit-input:focus {
    outline: none;
    border-color: #6366f1;
  }
  
  .edit-actions {
    display: flex;
    gap: 10px;
    margin-top: 10px;
  }
  
  .btn-save, .btn-cancel {
    padding: 8px 16px;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 500;
    transition: all 0.3s ease;
  }
  
  .btn-save {
    background: linear-gradient(135deg, #00c853 0%, #00e676 100%);
    color: white;
  }
  
  .btn-cancel {
    background: linear-gradient(135deg, #9e9e9e 0%, #757575 100%);
    color: white;
  }
  
  .btn-save:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 200, 83, 0.4);
  }
  
  .btn-cancel:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }
  
  .btn-edit {
    background: linear-gradient(135deg, #2196F3 0%, #64B5F6 100%);
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 500;
    transition: all 0.3s ease;
    margin-right: 8px;
  }
  
  .btn-edit:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(33, 150, 243, 0.4);
  }
`;
document.head.appendChild(style);

function updateUserUI() {
    const userAvatar = document.getElementById("userAvatar");
    const userName = document.querySelector(".user-name");
    const userRole = document.querySelector(".user-role");

    const user = JSON.parse(localStorage.getItem("user")) || {};
    
    if (user.avatar) {
        userAvatar.src = user.avatar;
    } else {
         const name = user.name || "John Doe";
        userAvatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0d6efd&color=fff`;
    }

    userName.textContent = user.name || "John Doe";
    userRole.textContent = user.role || "Premium User";
}

 document.addEventListener('DOMContentLoaded', () => {
    updateUserUI();
});

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




