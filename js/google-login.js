// API origin: local backend in dev, deployed backend in production.
var API_ORIGIN = (window.API_ORIGIN = window.API_ORIGIN || ((location.hostname === 'localhost' || location.hostname === '127.0.0.1') ? 'http://localhost:5000' : 'https://server-xi-six-60.vercel.app'));
window.onload = function () {
  google.accounts.id.initialize({
    client_id: "584630867834-itdnrnoupds35gg21ala11lcl3vfa5hd.apps.googleusercontent.com",
    callback: handleCredentialResponse
  });

  const googleBtn = document.getElementById("googleLoginBtn");
  if (googleBtn) {
    google.accounts.id.renderButton(googleBtn, { theme: "outline", size: "large" });
    google.accounts.id.prompt();
  }

  function handleCredentialResponse(response) {
    console.log("JWT token from Google:", response.credential);

    axios.post(`${API_ORIGIN}/api/auth/google-login`, {
      token: response.credential
    })
      .then(res => {
        console.log("Backend response:", res.data);
        if (res.data.token) localStorage.setItem("token", res.data.token);
        if (res.data.user) localStorage.setItem("user", JSON.stringify(res.data.user));

        updateUserUI();

        window.location.href = "/frontend/dashboard.html";
      })
      .catch(err => {
        console.error(err);
        alert("Google login failed. Try again!");
      });
  }
};

function updateUserUI() {
  const userSpan = document.querySelector(".user-name");
  const roleSpan = document.querySelector(".user-role");
  const userAvatar = document.getElementById("userAvatar");

  const userData = JSON.parse(localStorage.getItem("user")) || { name: "Guest", role: "Visitor" };

  if (userSpan) userSpan.textContent = userData.name;
  if (roleSpan) roleSpan.textContent = userData.role;

  const avatarUrl = userData.picture 
    ? userData.picture 
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name)}&background=0d6efd&color=fff`;

  if (userAvatar) userAvatar.src = avatarUrl;
}

