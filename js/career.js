// ===== career.js =====
document.addEventListener("DOMContentLoaded", () => {
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

  const token = localStorage.getItem("token");

  const api = axios.create({
    baseURL: "http://localhost:5000/api/career",
    headers: {
      "Content-Type": "application/json",
      authorization: token ? `Bearer ${token}` : "",
    },
  });

  // Inputs
  const resumeTextInput = document.getElementById("resumeTextInput");
  const resumeFileInput = document.getElementById("resumeFileInput");
  const jobDescInput = document.getElementById("jobDescInput");
  const polishBtn = document.getElementById("polishBtn");

  // Output
  const loadingState = document.getElementById("loadingState");
  const loadingText = document.getElementById("loadingText");
  const aiResultDiv = document.getElementById("aiResult");
  const improvedScore = document.getElementById("improvedScore");
  const atsScore = document.getElementById("atsScore");
  const improvementList = document.getElementById("improvementList");
  const correctedResumeOutput = document.getElementById("correctedResumeOutput");

  // File info
  const fileInfo = document.getElementById("fileInfo");
  const fileName = document.getElementById("fileName");
  const removeFile = document.getElementById("removeFile");

  // Template + Download
  const viewTemplateBtn = document.getElementById("viewTemplateBtn");
  const popupOverlay = document.getElementById("popupOverlay");
  const closeBtn = document.getElementById("closeBtn");
  const templateSelect = document.getElementById("templateSelect");
  const downloadPdfBtn = document.getElementById("downloadPdfBtn");

  let aiData = {};
  let selectedTemplate = null;

  // ===== File Upload & Text Extraction =====
  resumeFileInput.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    fileInfo.style.display = "flex";
    fileName.innerText = file.name;

    if (file.type === "application/pdf") {
      const pdfData = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument(pdfData).promise;
      let text = "";
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        text += content.items.map(item => item.str).join(" ") + "\n\n";
      }
      resumeTextInput.value = text;
    } else if (file.name.endsWith(".docx")) {
      const buffer = await file.arrayBuffer();
      const { value } = await mammoth.extractRawText({ arrayBuffer: buffer });
      resumeTextInput.value = value;
    } else if (file.name.endsWith(".txt")) {
      const text = await file.text();
      resumeTextInput.value = text;
    } else {
      showNotification("Only PDF, DOCX, or TXT files supported.", "error");
    }
  });

  removeFile.addEventListener("click", () => {
    resumeFileInput.value = "";
    resumeTextInput.value = "";
    fileInfo.style.display = "none";
  });

  // ===== Loading Text Animation =====
  let loadingInterval = null;
  function startLoadingText() {
    const messages = ["Reading resume...", "Matching job description...", "Polishing content..."];
    let index = 0;
    loadingText.innerText = messages[index];
    loadingInterval = setInterval(() => {
      index = (index + 1) % messages.length;
      loadingText.innerText = messages[index];
    }, 2000);
  }
  function stopLoadingText() {
    clearInterval(loadingInterval);
  }

  // ===== Polish Resume =====
  polishBtn.addEventListener("click", async () => {
    const resumeText = resumeTextInput.value.trim();
    const jobDescText = jobDescInput.value.trim();

    if (!resumeText) return showNotification("Please upload or paste your resume!", "error");
    if (!jobDescText) return showNotification("Please paste the job description!", "error");

    loadingState.style.display = "block";
    aiResultDiv.style.display = "none";
    startLoadingText();

    try {
      const formData = new FormData();
      formData.append("resumeText", resumeText);
      formData.append("jobDescription", jobDescText);
      if (resumeFileInput.files[0]) formData.append("resumeFile", resumeFileInput.files[0]);

      const { data } = await api.post("/polish", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      aiData = data;
      renderAIResult(data);
      showNotification("Resume polished successfully!", "success");
    } catch (err) {
      console.error(err);
      showNotification(err.response?.data?.message || "AI polishing failed", "error");
    } finally {
      loadingState.style.display = "none";
      stopLoadingText();
    }
  });

  // ===== Render AI Result =====
  function renderAIResult(result) {
    aiResultDiv.style.display = "block";
    improvedScore.innerText = result.aiResult?.score ?? "0";
    atsScore.innerText = result.aiResult?.atsScore ?? "0";

    improvementList.innerHTML = "";
    result.aiResult?.suggestions?.forEach((imp, i) => {
      const div = document.createElement("div");
      div.className = "improvement-item";
      div.innerHTML = `<strong>${i + 1}.</strong> ${imp}`;
      improvementList.appendChild(div);
    });

    correctedResumeOutput.value = result.aiResult?.correctedText || resumeTextInput.value;
  }

  // ===== Template Popup =====
  viewTemplateBtn.addEventListener("click", () => popupOverlay.classList.add("active"));
  closeBtn.addEventListener("click", () => popupOverlay.classList.remove("active"));
  popupOverlay.addEventListener("click", (e) => { if (e.target === popupOverlay) popupOverlay.classList.remove("active"); });

  templateSelect.querySelectorAll(".template-item img").forEach(img => {
    img.addEventListener("click", (e) => {
      e.stopPropagation();
      const previewImg = document.getElementById("previewImg");
      previewImg.src = e.target.src;
      document.getElementById("imagePreview").classList.add("active");
    });
  });

  templateSelect.querySelectorAll(".select-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const templateId = btn.closest(".template-item").getAttribute("data-template");
      selectedTemplate = { id: templateId, name: `template${templateId}.html` };
      btn.textContent = '✓ Selected';
      btn.style.background = '#00c853';
      templateSelect.querySelectorAll(".select-btn").forEach(other => {
        if (other !== btn) { other.textContent = 'Select'; other.style.background = ''; }
      });
      setTimeout(() => popupOverlay.classList.remove("active"), 500);
    });
  });

  // ===== Download PDF =====
  downloadPdfBtn.addEventListener("click", async () => {
    if (!selectedTemplate) return showNotification("Select a template first!", "error");
    if (!correctedResumeOutput.value.trim()) return showNotification("No polished resume!", "error");

    try {
      const response = await api.post("/download-pdf", {
        templateName: selectedTemplate.name,
        data: aiData.aiResult
      }, { responseType: "blob" });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.download = `career_resume_${selectedTemplate.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      showNotification("Resume downloaded successfully!", "success");
    } catch (err) {
      console.error(err);
      showNotification("PDF download failed!", "error");
    }
  });

  // ===== Resume Tabs Switching =====
const tabBtns = document.querySelectorAll(".tab-btn");
const tabContents = document.querySelectorAll(".tab-content");

tabBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    // Remove active from all buttons
    tabBtns.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    // Hide all tab contents
    tabContents.forEach(tc => tc.classList.remove("active"));

    // Show selected tab
    const tab = btn.getAttribute("data-tab");
    document.getElementById(`${tab}-tab`).classList.add("active");
  });
});


  // ===== Notifications =====
  function showNotification(message, type='success') {
    const colors = {
      success: 'linear-gradient(135deg, #00c853 0%, #00e676 100%)',
      error: 'linear-gradient(135deg, #f44336 0%, #e57373 100%)'
    };
    const notification = document.createElement("div");
    notification.style.cssText = `
      position: fixed; top:20px; right:20px;
      background: ${colors[type] || colors.success};
      color: white; padding: 15px 25px;
      border-radius: 10px; z-index: 1000;
      font-weight: 500; box-shadow: 0 4px 15px rgba(0,0,0,0.3);
      animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => { notification.style.animation='slideOut 0.3s ease'; setTimeout(()=>notification.remove(),300)}, 3000);
  }

  const style = document.createElement('style');
  style.innerHTML = `
    @keyframes slideIn { from{transform:translateX(400px);opacity:0} to{transform:translateX(0);opacity:1} }
    @keyframes slideOut { from{transform:translateX(0);opacity:1} to{transform:translateX(400px);opacity:0} }
  `;
  document.head.appendChild(style);
});

document.addEventListener("DOMContentLoaded", () => {
  function setupCharCounter(textareaId, counterId, maxChars) {
    const textarea = document.getElementById(textareaId);
    const counter = document.getElementById(counterId);

    textarea.addEventListener("input", () => {
      if (textarea.value.length > maxChars) {
        textarea.value = textarea.value.substring(0, maxChars);
      }
      counter.innerText = textarea.value.length;
    });
  }

  setupCharCounter("resumeTextInput", "charCount", 5000);
  setupCharCounter("jobDescInput", "jobCharCount", 3000);
});


// Scope fix for userData
document.addEventListener("DOMContentLoaded", () => {
  const userData = JSON.parse(localStorage.getItem("user")) || { name: "Guest User" };
  const userSpan = document.querySelector(".user-name");
  const userAvatar = document.getElementById("userAvatar");

  if (userData && userData.name) {
    const names = userData.name.split(" ");
    const firstName = names[0] || "Guest";
    const lastName = names[1] || "";

    if (userSpan) userSpan.textContent = userData.name;
    if (userAvatar) userAvatar.src = `https://ui-avatars.com/api/?name=${firstName}+${lastName}&background=7f265b&color=fff`;
  }
});

function updateUserUI() {
  const userSpan = document.querySelector(".user-name");
  const roleSpan = document.querySelector(".user-role");
  const userAvatar = document.getElementById("userAvatar");

  const userData = JSON.parse(localStorage.getItem("user")) || { name: "Guest", role: "Visitor" };

  if (userSpan) userSpan.textContent = userData.name;
  if (roleSpan) roleSpan.textContent = userData.role;

  const avatarUrl = userData.avatar
    ? `${userData.avatar}?t=${Date.now()}`
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name)}&background=7f265b&color=fff`;

  if (userAvatar) userAvatar.src = avatarUrl;
}

document.addEventListener("DOMContentLoaded", () => {
  updateUserUI();

  window.addEventListener('profileAvatarUpdated', () => {
    updateUserUI();
  });

  window.addEventListener('storage', (e) => {
    if (e.key === 'user') updateUserUI();
  });

  // Share Results logic fix with null check
  const shareResultsBtn = document.getElementById("shareResultsBtn");
  if (shareResultsBtn) {
    shareResultsBtn.addEventListener("click", async () => {
      // Accessing aiData from outer scope (career.js line 43)
      if (typeof aiData === 'undefined' || !aiData.aiResult) {
        return showNotification("No AI result to share!", "error");
      }
      try {
        const resultText = JSON.stringify(aiData.aiResult, null, 2);
        await navigator.clipboard.writeText(resultText);
        showNotification("AI results copied to clipboard!", "success");
      } catch (err) {
        console.error(err);
        showNotification("Failed to share results!", "error");
      }
    });
  }
});
