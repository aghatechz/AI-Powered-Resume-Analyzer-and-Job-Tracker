// API origin: local backend in dev, deployed backend in production.
var API_ORIGIN = (window.API_ORIGIN = window.API_ORIGIN || ((location.hostname === 'localhost' || location.hostname === '127.0.0.1') ? 'http://localhost:5000' : 'https://server-xi-six-60.vercel.app'));
// ===== PDF.js Worker Setup =====
document.addEventListener("DOMContentLoaded", () => {
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

  const token = localStorage.getItem("token");

  const api = axios.create({
    baseURL: `${API_ORIGIN}/api/resume`,
    headers: {
      "Content-Type": "application/json",
      authorization: token ? `Bearer ${token}` : "",
    },
  });

  // ===== Elements =====
  const analyzeBtn = document.getElementById("analyzeBtn");
  const resumeTextArea = document.getElementById("resumeText");
  const aiResultDiv = document.getElementById("aiResult");
  const loadingState = document.getElementById("loadingState");
  const correctedTextOutput = document.getElementById("correctedTextOutput");
  const scoreNumber = document.getElementById("scoreNumber");
  const atsScore = document.getElementById("atsScore");
  const strengthsList = document.getElementById("strengthsList");
  const improvementsList = document.getElementById("improvementsList");
  const fileInput = document.getElementById("fileInput");
  const fileInfo = document.getElementById("fileInfo");
  const fileNameSpan = document.getElementById("fileName");
  const removeFileBtn = document.getElementById("removeFile");
  const downloadBtn = document.getElementById("downloadBtn");

  const viewBtn = document.getElementById('viewTemplateBtn');
  const popup = document.getElementById('popupOverlay');
  const closeBtn = document.getElementById('closeBtn');
  const selectBtns = document.querySelectorAll('.select-btn');
  const imagePreview = document.getElementById('imagePreview');
  const previewImg = document.getElementById('previewImg');
  const previewCloseBtn = document.getElementById('previewCloseBtn');

  let selectedTemplate = null;
  let aiCorrectedData = {};

  // ===== File Upload =====
  fileInput.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    fileInfo.style.display = "flex";
    fileNameSpan.innerText = file.name;

    if (file.type === "application/pdf") {
      const pdfData = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument(pdfData).promise;
      let text = "";

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const pageText = content.items.map(item => item.str).join(" ");
        text += pageText + "\n\n";
      }

      resumeTextArea.value = text;
      document.getElementById("charCount").innerText = text.length;
    } else {
      showNotification("Only PDF files are supported for upload.", "error");
    }
  });

  removeFileBtn.addEventListener("click", () => {
    fileInput.value = "";
    resumeTextArea.value = "";
    fileInfo.style.display = "none";
    document.getElementById("charCount").innerText = 0;
  });

  // ===== Tabs =====
  const tabBtns = document.querySelectorAll(".tab-btn");
  const tabContents = document.querySelectorAll(".tab-content");
  tabBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      tabBtns.forEach(b => b.classList.remove("active"));
      tabContents.forEach(c => c.classList.remove("active"));
      btn.classList.add("active");
      const tabId = btn.getAttribute("data-tab") + "-tab";
      document.getElementById(tabId).classList.add("active");
    });
  });

  // ===== AI Render =====
  const renderResult = (result) => {
    aiCorrectedData = {
      name: result.aiResult?.name || "N/A",
      email: result.aiResult?.email || "N/A",
      phone: result.aiResult?.phone || "N/A",
      experience: result.aiResult?.experience || "N/A",
      education: result.aiResult?.education || "N/A",
      skills: result.aiResult?.skills || "N/A",
      summary: result.aiResult?.summary || "N/A",
    };

    const r = result.aiResult || {};

    aiResultDiv.style.display = "block";
    scoreNumber.innerText = r.score ?? "N/A";
    correctedTextOutput.innerText = r.correctedText || "No corrected text returned.";
    document.getElementById("corrected-section").classList.add("active");

    // ===== Overview metric cards =====
    atsScore.innerText = (r.atsScore ?? r.atsScore === 0) ? r.atsScore + "%" : "--%";
    const keywordScoreEl = document.getElementById("keywordScore");
    const formatScoreEl = document.getElementById("formatScore");
    const impactScoreEl = document.getElementById("impactScore");
    if (keywordScoreEl) keywordScoreEl.innerText = r.keywordsMatched ?? (Array.isArray(r.keywords) ? r.keywords.length : "--");
    if (formatScoreEl) formatScoreEl.innerText = (r.formatQuality != null) ? r.formatQuality + "%" : "--%";
    if (impactScoreEl) impactScoreEl.innerText = (r.impactScore != null) ? r.impactScore + "%" : "--%";

    // ===== Strengths tab =====
    strengthsList.innerHTML = "";
    if (Array.isArray(r.strengths) && r.strengths.length) {
      r.strengths.forEach((item, i) => {
        const div = document.createElement("div");
        div.className = "strength-item";
        div.innerHTML = `<strong>${i + 1}.</strong> ${item}`;
        strengthsList.appendChild(div);
      });
    } else {
      strengthsList.innerHTML = "<p>No strengths detected.</p>";
    }

    // ===== Improvements =====
    improvementsList.innerHTML = "";
    (r.suggestions || []).forEach((item, index) => {
      const div = document.createElement("div");
      div.className = "improvement-item";
      div.innerHTML = `<strong>${index + 1}.</strong> ${item}`;
      improvementsList.appendChild(div);
    });

    // ===== Keywords tab =====
    const keywordsContainer = document.getElementById("keywordsContainer");
    if (keywordsContainer) {
      keywordsContainer.innerHTML = "";
      const kws = Array.isArray(r.keywords) ? r.keywords : [];
      if (kws.length) {
        kws.forEach(kw => {
          const span = document.createElement("span");
          span.className = "keyword-badge";
          span.textContent = kw;
          span.style.cssText = "display:inline-block;margin:4px;padding:6px 14px;background:var(--primary);color:#fff;border-radius:20px;font-size:13px;";
          keywordsContainer.appendChild(span);
        });
      } else {
        keywordsContainer.innerHTML = "<p>No keywords detected.</p>";
      }
    }
  };

  // ===== Analyze =====
  analyzeBtn.addEventListener("click", async () => {
    const text = resumeTextArea.value.trim();
    if (!text) {
      showNotification("Please paste or upload your resume first!", "info");
      return;
    }

    loadingState.style.display = "block";
    aiResultDiv.style.display = "none";

    try {
      const { data } = await api.post("/analyze", { resumeText: text });
      loadingState.style.display = "none";
      renderResult(data);
      showNotification("Resume analyzed successfully!", "success");
    } catch (err) {
      loadingState.style.display = "none";
      console.log(err);
      showNotification(err.response?.data?.message || "AI analysis failed", "error");
    }
  });

  // ===== Download PDF (client-side via the browser's print engine) =====
  // Renders the chosen template in a new window and opens the print dialog,
  // where the user picks "Save as PDF". Works on any host (no server Chromium).
  downloadBtn.addEventListener("click", async () => {
    if (!selectedTemplate) return showNotification("Please select a template first!", "error");
    if (!aiCorrectedData || !aiCorrectedData.name) {
      return showNotification("Please analyze your resume first!", "info");
    }

    // Open the window synchronously (inside the click) so pop-up blockers allow it.
    const printWindow = window.open("", "_blank");
    if (!printWindow) return showNotification("Please allow pop-ups to download the PDF.", "error");

    try {
      const res = await fetch(`templates/${selectedTemplate.name}`);
      if (!res.ok) throw new Error("Template not found");
      let html = await res.text();

      const d = aiCorrectedData;
      const fields = {
        name: d.name,
        email: d.email,
        phone: d.phone,
        summary: d.summary,
        experience: d.experience,
        education: d.education,
        skills: Array.isArray(d.skills) ? d.skills.map(s => `<span>${s}</span>`).join("") : d.skills,
      };

      for (const [key, val] of Object.entries(fields)) {
        const value = (val === undefined || val === null || String(val).trim() === "") ? "N/A" : val;
        html = html.replace(new RegExp(`{{\\s*${key}\\s*}}`, "g"), value);
      }
      html = html.replace(/{{\s*[^}]+\s*}}/g, "N/A");

      printWindow.document.open();
      printWindow.document.write(html);
      printWindow.document.close();

      let printed = false;
      const doPrint = () => {
        if (printed) return;
        printed = true;
        printWindow.focus();
        printWindow.print();
      };
      printWindow.onload = () => setTimeout(doPrint, 400); // let fonts/styles settle
      setTimeout(doPrint, 1200); // fallback if onload doesn't fire

      showNotification("Print dialog opening — choose 'Save as PDF'.", "success");
    } catch (error) {
      console.error("PDF download failed:", error);
      try { printWindow.close(); } catch (e) {}
      showNotification("Failed to generate PDF. Please try again.", "error");
    }
  });

  // ===== Template Popup =====
  if (viewBtn) viewBtn.addEventListener('click', () => popup.classList.add('active'));
  if (closeBtn) closeBtn.addEventListener('click', () => popup.classList.remove('active'));
  if (popup) popup.addEventListener('click', (e) => { if(e.target === popup) popup.classList.remove('active'); });
  if (previewCloseBtn) previewCloseBtn.addEventListener('click', () => imagePreview.classList.remove('active'));
  if (imagePreview) imagePreview.addEventListener('click', (e) => { if(e.target === imagePreview) imagePreview.classList.remove('active'); });

  document.querySelectorAll('.template-item img').forEach(img => {
    img.addEventListener('click', (e) => {
      e.stopPropagation();
      previewImg.src = e.target.src;
      imagePreview.classList.add('active');
    });
  });

  selectBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const templateItem = e.target.closest('.template-item');
      const templateId = templateItem.getAttribute('data-template');

      selectedTemplate = { id: templateId, name: `template${templateId}.html` };
      btn.textContent = '✓ Selected';
      btn.style.background = '#00c853';
      selectBtns.forEach(otherBtn => { if (otherBtn !== btn) { otherBtn.textContent = 'Select'; otherBtn.style.background = ''; } });
      setTimeout(() => popup.classList.remove('active'), 500);
    });
  });

  // ===== User UI =====
  function updateUserUI() {
    const userSpan = document.querySelector(".user-name");
    const roleSpan = document.querySelector(".user-role");
    const userAvatar = document.getElementById("userAvatar");
    const userData = JSON.parse(localStorage.getItem("user")) || { name: "Guest", role: "Visitor" };
    if (userSpan) userSpan.textContent = userData.name;
    if (roleSpan) roleSpan.textContent = userData.role;

    const avatarUrl = userData.avatar
      ? `${userData.avatar}?t=${Date.now()}`
      : `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name)}&background=0d6efd&color=fff`;

    if (userAvatar) userAvatar.src = avatarUrl;
  }

  updateUserUI();
  window.addEventListener('profileAvatarUpdated', updateUserUI);
  window.addEventListener('storage', (e) => { if (e.key === 'user') updateUserUI(); });
});

// ===== Notifications =====
function showNotification(message, type = 'success') {
  const colors = {
    success: 'linear-gradient(135deg, #00c853 0%, #00e676 100%)',
    error: 'linear-gradient(135deg, #f44336 0%, #e57373 100%)',
    info: 'linear-gradient(135deg, #2196F3 0%, #64B5F6 100%)'
  };

  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed; top: 20px; right: 20px;
    background: ${colors[type] || colors.success};
    color: white; padding: 15px 25px; border-radius: 10px;
    box-shadow: 0 4px 15px rgba(0,0,0,0.3); z-index: 1000;
    font-weight: 500; animation: slideIn 0.3s ease;
  `;
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// ===== Animations =====
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn { from { transform: translateX(400px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
  @keyframes slideOut { from { transform: translateX(0); opacity: 1; } to { transform: translateX(400px); opacity: 0; } }
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
