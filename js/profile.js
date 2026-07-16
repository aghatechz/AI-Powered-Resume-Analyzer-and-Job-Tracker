// API origin: local backend in dev, deployed backend in production.
var API_ORIGIN = (window.API_ORIGIN = window.API_ORIGIN || ((location.hostname === 'localhost' || location.hostname === '127.0.0.1') ? 'http://localhost:5000' : 'https://server-xi-six-60.vercel.app'));
 const API_BASE_URL = `${API_ORIGIN}/api`;
const token = localStorage.getItem("token");

 let USER_ID = null;
if (token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    USER_ID = payload.id;
  } catch (error) {
    console.error('Failed to decode token:', error);
  }
}

 if (!USER_ID || !token) {
  console.error('User not logged in!');
  alert('Please login first');
  window.location.href = 'index.html';
}
 let profileData = {};
let currentEditSection = null;

 const elements = {
  loadingOverlay: document.getElementById('loadingOverlay'),
  notificationToast: document.getElementById('notificationToast'),
  toastMessage: document.getElementById('toastMessage'),headerUserName: document.querySelector('.user-name'),
   headerAvatar: document.getElementById('userAvatar'),

   coverPhoto: document.getElementById('coverPhoto'),
  coverPhotoInput: document.getElementById('coverPhotoInput'),
  btnUploadCover: document.getElementById('btnUploadCover'),
  profileAvatar: document.getElementById('profileAvatar'),
  avatarInput: document.getElementById('avatarInput'),
  btnChangeAvatar: document.getElementById('btnChangeAvatar'),

   profileName: document.getElementById('profileName'),
  profileTitle: document.getElementById('profileTitle'),
  profileLocation: document.getElementById('profileLocation'),
  aboutText: document.getElementById('aboutText'),

   contactEmail: document.getElementById('contactEmail'),
  contactPhone: document.getElementById('contactPhone'),
  contactWebsite: document.getElementById('contactWebsite'),
  contactLinkedin: document.getElementById('contactLinkedin'),
  contactGithub: document.getElementById('contactGithub'),

   skillsGrid: document.getElementById('skillsGrid'),
  experienceTimeline: document.getElementById('experienceTimeline'),
  educationTimeline: document.getElementById('educationTimeline'),

   btnEditProfile: document.getElementById('btnEditProfile'),
  btnShareProfile: document.getElementById('btnShareProfile'),

   editModal: document.getElementById('editModal'),
  modalTitle: document.getElementById('modalTitle'),
  modalBody: document.getElementById('modalBody'),
  btnCloseModal: document.getElementById('btnCloseModal'),
  btnCancelModal: document.getElementById('btnCancelModal'),
  btnSaveModal: document.getElementById('btnSaveModal')
};

 document.addEventListener('DOMContentLoaded', () => {
  loadProfileData();
  setupEventListeners();
});

 function setupEventListeners() {
   elements.btnChangeAvatar.addEventListener('click', () => {
    elements.avatarInput.click();
  });

  elements.avatarInput.addEventListener('change', (e) => {
    handleImageUpload(e.target.files[0], 'avatar');
  });

   elements.btnUploadCover.addEventListener('click', () => {
    elements.coverPhotoInput.click();
  });

  elements.coverPhotoInput.addEventListener('change', (e) => {
    handleImageUpload(e.target.files[0], 'cover');
  });

   document.querySelectorAll('.btn-edit').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const section = e.currentTarget.dataset.section;
      openEditModal(section);
    });
  });

   elements.btnCloseModal.addEventListener('click', closeModal);
  elements.btnCancelModal.addEventListener('click', closeModal);
  elements.btnSaveModal.addEventListener('click', saveModalChanges);

   elements.editModal.addEventListener('click', (e) => {
    if (e.target === elements.editModal) {
      closeModal();
    }
  });

   elements.btnEditProfile.addEventListener('click', () => {
    openEditModal('basic');
  });

  elements.btnShareProfile.addEventListener('click', shareProfile);
}

 
async function loadProfileData() {
  showLoading(true);

  try {
    const response = await axios.get(`${API_BASE_URL}/profile/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    profileData = response.data;
    const userData = JSON.parse(localStorage.getItem("user")) || {};
    const avatar = profileData.avatar || '';
    userData.avatar = avatar && avatar.startsWith('http') ? avatar : (avatar ? `${API_ORIGIN}${avatar}` : '');
    const cover = profileData.coverPhoto || '';
    userData.coverPhoto = cover && cover.startsWith('http') ? cover : (cover ? `${API_ORIGIN}${cover}` : '');
    localStorage.setItem('user', JSON.stringify(userData));

    renderProfile();
  } catch (error) {
    console.error('Error loading profile:', error);

    profileData = getDefaultProfileData();
    renderProfile();
    showNotification('Failed to load profile. Using default data.', 'error');
  } finally {
    showLoading(false);
  }
}

 function getDefaultProfileData() {
  return {
    name: 'John Doe',
    title: 'Senior Software Engineer',
    location: 'San Francisco, CA',
    about: 'Passionate software engineer with 8+ years of experience building scalable web applications. Specialized in React, Node.js, and cloud technologies.',
    email: 'john.doe@example.com',
    phone: '+1 (555) 123-4567',
    website: 'www.johndoe.com',
    linkedin: 'linkedin.com/in/johndoe',
    github: 'github.com/johndoe',
    avatar: 'https://ui-avatars.com/api/?name=John+Doe&background=0d6efd&color=fff&size=150',
    coverPhoto: 'https://images.unsplash.com/photo-1557683316-973673baf926?w=1200&h=300&fit=crop',
    skills: [
      'JavaScript', 'React', 'Node.js', 'Python', 'TypeScript',
      'AWS', 'Docker', 'MongoDB', 'PostgreSQL', 'GraphQL',
      'Git', 'REST APIs', 'Microservices', 'CI/CD', 'Agile'
    ],
    experience: [
      {
        id: 1,
        title: 'Senior Software Engineer',
        company: 'Tech Corp Inc.',
        location: 'San Francisco, CA',
        startDate: '2020-01',
        endDate: 'Present',
        description: 'Led development of cloud-native applications serving 1M+ users. Implemented microservices architecture and mentored junior developers.'
      },
      {
        id: 2,
        title: 'Software Engineer',
        company: 'StartUp Labs',
        location: 'San Francisco, CA',
        startDate: '2017-06',
        endDate: '2019-12',
        description: 'Built full-stack web applications using React and Node.js. Improved application performance by 40% through optimization.'
      },
      {
        id: 3,
        title: 'Junior Developer',
        company: 'Web Solutions Co.',
        location: 'San Francisco, CA',
        startDate: '2015-03',
        endDate: '2017-05',
        description: 'Developed responsive websites and maintained legacy systems. Collaborated with designers to implement pixel-perfect UIs.'
      }
    ],
    education: [
      {
        id: 1,
        degree: 'Master of Science in Computer Science',
        school: 'Stanford University',
        location: 'Stanford, CA',
        startDate: '2013-09',
        endDate: '2015-05',
        description: 'Specialized in Machine Learning and Distributed Systems. GPA: 3.9/4.0'
      },
      {
        id: 2,
        degree: 'Bachelor of Science in Computer Engineering',
        school: 'UC Berkeley',
        location: 'Berkeley, CA',
        startDate: '2009-09',
        endDate: '2013-05',
        description: 'Dean\'s List all semesters. President of Computer Science Club.'
      }
    ]
  };
}

function renderProfile() {
  const name = profileData.name || 'User';
  const avatarBase = profileData.avatar || '';
  const coverBase = profileData.coverPhoto || '';

  elements.headerUserName.textContent = name;

  const avatarUrl = avatarBase && avatarBase.startsWith('http')
    ? avatarBase + '?t=' + Date.now()
    : avatarBase
    ? `${API_ORIGIN}${avatarBase}?t=${Date.now()}`
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0d6efd&color=fff`;

  if (elements.headerAvatar) elements.headerAvatar.src = avatarUrl;
  if (elements.profileAvatar) elements.profileAvatar.src = avatarUrl;

  const coverUrl = coverBase && coverBase.startsWith('http')
    ? coverBase + '?t=' + Date.now()
    : coverBase
    ? `${API_ORIGIN}${coverBase}?t=${Date.now()}`
    : `https://images.unsplash.com/photo-1557683316-973673baf926?w=1200&h=300&fit=crop`;

  if (elements.coverPhoto) elements.coverPhoto.src = coverUrl;

  if (elements.profileName) elements.profileName.textContent = name;
  if (elements.profileTitle) elements.profileTitle.textContent = profileData.title || '';
  if (elements.profileLocation) elements.profileLocation.innerHTML = `<i class="fas fa-map-marker-alt"></i> ${profileData.location || ''}`;

  if (elements.aboutText) elements.aboutText.textContent = profileData.about || '';

  if (elements.contactEmail) elements.contactEmail.textContent = profileData.email || '';
  if (elements.contactPhone) elements.contactPhone.textContent = profileData.phone || '';
  if (elements.contactWebsite) elements.contactWebsite.textContent = profileData.website || '';
  if (elements.contactLinkedin) elements.contactLinkedin.textContent = profileData.linkedin || '';
  if (elements.contactGithub) elements.contactGithub.textContent = profileData.github || '';

  renderSkills();
  renderExperience();
  renderEducation();
}



 function renderSkills() {
  const skills = profileData.skills || [];
  elements.skillsGrid.innerHTML = skills
    .map(skill => `<div class="skill-tag">${skill}</div>`)
    .join('');
}

 function renderExperience() {
  elements.experienceTimeline.innerHTML = profileData.experience
    .map(exp => `
      <div class="timeline-item">
        <div class="timeline-header">
          <div>
            <div class="timeline-title">${exp.title}</div>
            <div class="timeline-subtitle">${exp.company} • ${exp.location}</div>
          </div>
          <div class="timeline-date">${formatDateRange(exp.startDate, exp.endDate)}</div>
        </div>
        <div class="timeline-description">${exp.description}</div>
      </div>
    `)
    .join('');
}

 function renderEducation() {
  elements.educationTimeline.innerHTML = profileData.education
    .map(edu => `
      <div class="timeline-item">
        <div class="timeline-header">
          <div>
            <div class="timeline-title">${edu.degree}</div>
            <div class="timeline-subtitle">${edu.school} • ${edu.location}</div>
          </div>
          <div class="timeline-date">${formatDateRange(edu.startDate, edu.endDate)}</div>
        </div>
        <div class="timeline-description">${edu.description}</div>
      </div>
    `)
    .join('');
}

 function formatDateRange(start, end) {
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr + '-01');
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  const startFormatted = formatDate(start);
  const endFormatted = end === 'Present' ? 'Present' : formatDate(end);

  return `${startFormatted} - ${endFormatted}`;
}

 function openEditModal(section) {
  currentEditSection = section;
  elements.editModal.classList.add('active');

  const modalConfig = {
    basic: {
      title: 'Edit Basic Information',
      content: getBasicInfoForm()
    },
    about: {
      title: 'Edit About',
      content: getAboutForm()
    },
    contact: {
      title: 'Edit Contact Information',
      content: getContactForm()
    },
    skills: {
      title: 'Edit Skills',
      content: getSkillsForm()
    },
    experience: {
      title: 'Edit Work Experience',
      content: getExperienceForm()
    },
    education: {
      title: 'Edit Education',
      content: getEducationForm()
    }
  };

  const config = modalConfig[section];
  elements.modalTitle.textContent = config.title;
  elements.modalBody.innerHTML = config.content;

   if (section === 'skills') {
    setupSkillsFormListeners();
  } else if (section === 'experience') {
    setupExperienceFormListeners();
  } else if (section === 'education') {
    setupEducationFormListeners();
  }
}

 function closeModal() {
  elements.editModal.classList.remove('active');
  currentEditSection = null;
}

 function getBasicInfoForm() {
  return `
    <div class="form-group">
      <label>Full Name</label>
      <input type="text" id="editName" value="${profileData.name}">
    </div>
    <div class="form-group">
      <label>Professional Title</label>
      <input type="text" id="editTitle" value="${profileData.title}">
    </div>
    <div class="form-group">
      <label>Location</label>
      <input type="text" id="editLocation" value="${profileData.location}">
    </div>
  `;
}

function getAboutForm() {
  return `
    <div class="form-group">
      <label>About</label>
      <textarea id="editAbout">${profileData.about}</textarea>
    </div>
  `;
}

function getContactForm() {
  return `
    <div class="form-group">
      <label>Email</label>
      <input type="email" id="editEmail" value="${profileData.email}">
    </div>
    <div class="form-group">
      <label>Phone</label>
      <input type="tel" id="editPhone" value="${profileData.phone}">
    </div>
    <div class="form-group">
      <label>Website</label>
      <input type="text" id="editWebsite" value="${profileData.website}">
    </div>
    <div class="form-group">
      <label>LinkedIn</label>
      <input type="text" id="editLinkedin" value="${profileData.linkedin}">
    </div>
    <div class="form-group">
      <label>GitHub</label>
      <input type="text" id="editGithub" value="${profileData.github}">
    </div>
  `;
}

function getSkillsForm() {
  return `
    <div class="form-group">
      <label>Skills (one per line)</label>
      <textarea id="editSkills" rows="10">${profileData.skills.join('\n')}</textarea>
      <small style="color: #666; display: block; margin-top: 8px;">Enter each skill on a new line</small>
    </div>
  `;
}

function getExperienceForm() {
  let html = '<div id="experienceList">';

  profileData.experience.forEach((exp, index) => {
    html += `
      <div class="list-item" data-index="${index}">
        <button type="button" class="btn-remove-item" onclick="removeExperience(${index})">
          <i class="fas fa-times"></i>
        </button>
        <div class="form-group">
          <label>Job Title</label>
          <input type="text" class="exp-title" value="${exp.title}">
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Company</label>
            <input type="text" class="exp-company" value="${exp.company}">
          </div>
          <div class="form-group">
            <label>Location</label>
            <input type="text" class="exp-location" value="${exp.location}">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Start Date</label>
            <input type="month" class="exp-start" value="${exp.startDate}">
          </div>
          <div class="form-group">
            <label>End Date</label>
            <input type="month" class="exp-end" value="${exp.endDate === 'Present' ? '' : exp.endDate}">
            <label style="display: flex; align-items: center; gap: 8px; margin-top: 8px; font-weight: 400;">
              <input type="checkbox" class="exp-present" ${exp.endDate === 'Present' ? 'checked' : ''}>
              Currently working here
            </label>
          </div>
        </div>
        <div class="form-group">
          <label>Description</label>
          <textarea class="exp-description" rows="3">${exp.description}</textarea>
        </div>
      </div>
    `;
  });

  html += `
    </div>
    <button type="button" class="btn-add-item" onclick="addExperience()">
      <i class="fas fa-plus"></i>
      Add Experience
    </button>
  `;

  return html;
}

function getEducationForm() {
  let html = '<div id="educationList">';

  profileData.education.forEach((edu, index) => {
    html += `
      <div class="list-item" data-index="${index}">
        <button type="button" class="btn-remove-item" onclick="removeEducation(${index})">
          <i class="fas fa-times"></i>
        </button>
        <div class="form-group">
          <label>Degree</label>
          <input type="text" class="edu-degree" value="${edu.degree}">
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>School</label>
            <input type="text" class="edu-school" value="${edu.school}">
          </div>
          <div class="form-group">
            <label>Location</label>
            <input type="text" class="edu-location" value="${edu.location}">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Start Date</label>
            <input type="month" class="edu-start" value="${edu.startDate}">
          </div>
          <div class="form-group">
            <label>End Date</label>
            <input type="month" class="edu-end" value="${edu.endDate}">
          </div>
        </div>
        <div class="form-group">
          <label>Description</label>
          <textarea class="edu-description" rows="3">${edu.description}</textarea>
        </div>
      </div>
    `;
  });

  html += `
    </div>
    <button type="button" class="btn-add-item" onclick="addEducation()">
      <i class="fas fa-plus"></i>
      Add Education
    </button>
  `;

  return html;
}

 function setupSkillsFormListeners() {
 }

function setupExperienceFormListeners() {
  document.querySelectorAll('.exp-present').forEach(checkbox => {
    checkbox.addEventListener('change', (e) => {
      const listItem = e.target.closest('.list-item');
      const endDateInput = listItem.querySelector('.exp-end');
      endDateInput.disabled = e.target.checked;
      if (e.target.checked) {
        endDateInput.value = '';
      }
    });
  });
}

function setupEducationFormListeners() {
 }

 window.addExperience = function () {
  const newExp = {
    id: Date.now(),
    title: '',
    company: '',
    location: '',
    startDate: '',
    endDate: '',
    description: ''
  };

  profileData.experience.push(newExp);
  elements.modalBody.innerHTML = getExperienceForm();
  setupExperienceFormListeners();
};

window.removeExperience = function (index) {
  if (confirm('Are you sure you want to remove this experience?')) {
    profileData.experience.splice(index, 1);
    elements.modalBody.innerHTML = getExperienceForm();
    setupExperienceFormListeners();
  }
};

 window.addEducation = function () {
  const newEdu = {
    id: Date.now(),
    degree: '',
    school: '',
    location: '',
    startDate: '',
    endDate: '',
    description: ''
  };

  profileData.education.push(newEdu);
  elements.modalBody.innerHTML = getEducationForm();
  setupEducationFormListeners();
};

window.removeEducation = function (index) {
  if (confirm('Are you sure you want to remove this education?')) {
    profileData.education.splice(index, 1);
    elements.modalBody.innerHTML = getEducationForm();
    setupEducationFormListeners();
  }
};

  async function saveModalChanges() {
  try {
    showLoading(true);

    let updatedData = {};

    switch (currentEditSection) {
      case 'basic':
        updatedData = {
          name: document.getElementById('editName').value,
          title: document.getElementById('editTitle').value,
          location: document.getElementById('editLocation').value
        };
        break;

      case 'about':
        updatedData = {
          about: document.getElementById('editAbout').value
        };
        break;

      case 'contact':
        updatedData = {
          email: document.getElementById('editEmail').value,
          phone: document.getElementById('editPhone').value,
          website: document.getElementById('editWebsite').value,
          linkedin: document.getElementById('editLinkedin').value,
          github: document.getElementById('editGithub').value
        };
        break;

      case 'skills':
        const skillsText = document.getElementById('editSkills').value;
        updatedData = {
          skills: skillsText.split('\n')
            .map(s => s.trim())
            .filter(s => s.length > 0)
        };
        break;

      case 'experience':
        updatedData = {
          experience: Array.from(document.querySelectorAll('#experienceList .list-item'))
            .map((item, index) => ({
              id: profileData.experience[item.dataset.index]?.id || Date.now() + index,
              title: item.querySelector('.exp-title').value,
              company: item.querySelector('.exp-company').value,
              location: item.querySelector('.exp-location').value,
              startDate: item.querySelector('.exp-start').value,
              endDate: item.querySelector('.exp-present').checked ? 'Present' : item.querySelector('.exp-end').value,
              description: item.querySelector('.exp-description').value
            }))
        };
        break;

      case 'education':
        updatedData = {
          education: Array.from(document.querySelectorAll('#educationList .list-item'))
            .map((item, index) => ({
              id: profileData.education[item.dataset.index]?.id || Date.now() + index,
              degree: item.querySelector('.edu-degree').value,
              school: item.querySelector('.edu-school').value,
              location: item.querySelector('.edu-location').value,
              startDate: item.querySelector('.edu-start').value,
              endDate: item.querySelector('.edu-end').value,
              description: item.querySelector('.edu-description').value
            }))
        };
        break;
    }

    console.log('Saving data:', updatedData);

     const response = await axios.patch(`${API_BASE_URL}/profile/${USER_ID}`, updatedData, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('Save response:', response.data);

     if (response.data.user) {
      Object.assign(profileData, response.data.user);
    } else {
      Object.assign(profileData, updatedData);
    } renderProfile();
closeModal();

 const userData = JSON.parse(localStorage.getItem('user')) || {};
userData.name = profileData.name;
userData.title = profileData.title;
userData.location = profileData.location;
userData.about = profileData.about;
userData.email = profileData.email;
userData.phone = profileData.phone;
userData.website = profileData.website;
userData.linkedin = profileData.linkedin;
userData.github = profileData.github;
userData.skills = profileData.skills || [];
userData.experience = profileData.experience || [];
userData.education = profileData.education || [];
userData.avatar = profileData.avatar;
userData.coverPhoto = profileData.coverPhoto;

userData.role = profileData.role || "";

localStorage.setItem('user', JSON.stringify(userData));
console.log('LocalStorage updated user:', localStorage.getItem('user'));

 window.dispatchEvent(new Event('profileUpdated'));

showNotification('Profile updated successfully!', 'success');

  } catch (error) {
    console.error('Error saving profile:', error);
    showNotification('Failed to save changes. Please try again.', 'error');
  } finally {
    showLoading(false);
  }
}

  
async function handleImageUpload(file, type) {
  if (!file) return;

   if (!file.type.startsWith('image/')) {
    showNotification('Please select a valid image file', 'error');
    return;
  }

   if (file.size > 5 * 1024 * 1024) {
    showNotification('Image size must be less than 5MB', 'error');
    return;
  }

  try {
    showLoading(true);

    const formData = new FormData();
    formData.append('image', file);
    formData.append('type', type);

    console.log(`Uploading ${type}...`);

    const response = await axios.post(
      `${API_BASE_URL}/profile/${USER_ID}/upload?type=${type}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      }
    );

    console.log('Upload response:', response.data);

    const imageUrl = `${API_ORIGIN}${response.data.url}?t=${Date.now()}`;

     if (type === 'avatar') {
      profileData.avatar = imageUrl;
      elements.profileAvatar.src = imageUrl;
      elements.headerAvatar.src = imageUrl;

       const userData = JSON.parse(localStorage.getItem("user")) || {};
      userData.avatar = imageUrl;
      localStorage.setItem('user', JSON.stringify(userData));
      console.log('Avatar saved to localStorage:', localStorage.getItem('user'));

       window.dispatchEvent(new Event('profileAvatarUpdated'));
    } else if (type === 'cover') {
      profileData.coverPhoto = imageUrl;
      elements.coverPhoto.src = imageUrl;

       const userData = JSON.parse(localStorage.getItem("user")) || {};
      userData.coverPhoto = imageUrl;
      localStorage.setItem('user', JSON.stringify(userData));
      console.log('Cover saved to localStorage:', localStorage.getItem('user'));
    }

    showNotification(response.data.msg || `${type === 'avatar' ? 'Profile picture' : 'Cover photo'} updated successfully`, 'success');

  } catch (error) {
    console.error('Error uploading image:', error);

    const errorMsg = error.response?.data?.msg || error.response?.data?.message || error.message || 'Failed to upload image';
    showNotification(errorMsg, 'error');

  } finally {
    showLoading(false);
  }
}


function shareProfile() {
  const profileUrl = `${window.location.origin}/profile/${USER_ID}`;

  if (navigator.share) {
    navigator.share({
      title: `${profileData.name}'s Profile`,
      text: `Check out ${profileData.name}'s professional profile`,
      url: profileUrl
    }).then(() => {
    }).catch((error) => {
      if (error.name !== 'AbortError') {
        copyToClipboard(profileUrl);
      }
    });
  } else {
    copyToClipboard(profileUrl);
  }
}

 function copyToClipboard(text) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(() => {
      showNotification('Profile link copied to clipboard');
    }).catch(() => {
      fallbackCopyToClipboard(text);
    });
  } else {
    fallbackCopyToClipboard(text);
  }
}

function fallbackCopyToClipboard(text) {
  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.style.position = 'fixed';
  textArea.style.left = '-999999px';
  document.body.appendChild(textArea);
  textArea.select();

  try {
    document.execCommand('copy');
    showNotification('Profile link copied to clipboard');
  } catch (error) {
    showNotification('Failed to copy link', 'error');
  }

  document.body.removeChild(textArea);
}

 function showLoading(show) {
  if (show) {
    elements.loadingOverlay.classList.add('active');
  } else {
    elements.loadingOverlay.classList.remove('active');
  }
}

 function showNotification(message, type = 'success') {
  elements.toastMessage.textContent = message;
  elements.notificationToast.classList.remove('error');

  if (type === 'error') {
    elements.notificationToast.classList.add('error');
  }

  elements.notificationToast.classList.add('active');

  setTimeout(() => {
    elements.notificationToast.classList.remove('active');
  }, 3000);
}

// Elements
const imagePreviewModal = document.getElementById('imagePreviewModal');
const previewImage = document.getElementById('previewImage');
const closePreview = document.getElementById('closePreview');

// Avatar & Cover images
const profileAvatar = document.getElementById('profileAvatar');
const coverPhotoEl = document.getElementById('coverPhoto');

// Function to open preview
function openImagePreview(src, type) {
  if (!imagePreviewModal || !previewImage) return;
  previewImage.src = src;

  // Add specific class for avatar or cover
  if (type === 'avatar') {
    previewImage.classList.add('avatar-preview');
    previewImage.classList.remove('cover-preview');
  } else if (type === 'cover') {
    previewImage.classList.add('cover-preview');
    previewImage.classList.remove('avatar-preview');
  }

  imagePreviewModal.classList.add('active');
}

// Close modal
function closeImagePreview() {
  if (!imagePreviewModal || !previewImage) return;
  imagePreviewModal.classList.remove('active');
  previewImage.src = '';
}

// Event listeners
if (profileAvatar) {
  profileAvatar.addEventListener('click', () => {
    openImagePreview(profileAvatar.src, 'avatar');
  });
}

if (coverPhotoEl) {
  coverPhotoEl.addEventListener('click', () => {
    openImagePreview(coverPhotoEl.src, 'cover');
  });
}

if (closePreview) {
  closePreview.addEventListener('click', closeImagePreview);
}

// Click outside image closes modal
if (imagePreviewModal) {
  imagePreviewModal.addEventListener('click', (e) => {
    if (e.target === imagePreviewModal) {
      closeImagePreview();
    }
  });
}

// Mobile sidebar toggle
document.addEventListener('DOMContentLoaded', () => {
  const mobileMenuToggle = document.getElementById('mobileMenuToggle');
  const sidebar = document.getElementById('sidebar');
  const sidebarOverlay = document.getElementById('sidebarOverlay');

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
