const api = axios.create({
    baseURL: "http://localhost:5000/api/auth",
    headers: { "Content-Type": "application/json" },
});

const signupForm = document.getElementById("signupForm");
const loginForm = document.getElementById("loginForm");

const saveUser = (data) => {
    localStorage.setItem("token", data.token);
    localStorage.setItem(
        "user",
        JSON.stringify({ _id: data._id, name: data.name, email: data.email, role: data.role || "Standard User" })
    );
};

const showMsg = (el, msg, color = "red") => {
    el.style.color = color;
    el.innerText = msg;
};


if (signupForm) {
    signupForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const msgDiv = document.getElementById("signupMsg");
        const name = document.getElementById("name").value.trim();
        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value.trim();

        try {
            const { data } = await api.post("/register", { name, email, password });
            saveUser(data);
            localStorage.setItem("showWelcome", "true");
            showMsg(msgDiv, "Signup successful! Redirecting...", "green");
            setTimeout(() => (window.location.href = "dashboard.html"), 1000);
        } catch (err) {
            showMsg(
                msgDiv,
                err.response?.data?.message || "Signup failed. Try again!"
            );
            console.log(err);
        }
    });
}

if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const msgDiv = document.getElementById("loginMsg");
        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value.trim();

        try {
            const { data } = await api.post("/login", { email, password });
            saveUser(data);
            showMsg(msgDiv, "Login successful! Redirecting...", "green");
            const redirectUser = (role) => {
                if (role === "super-admin") {
                    window.location.href = "superadmin-dashboard.html";
                } else if (role === "admin") {
                    window.location.href = "admin-dashboard.html";
                } else {
                    window.location.href = "dashboard.html";
                }
            };

            redirectUser(data.role);

        } catch (err) {
            showMsg(
                msgDiv,
                err.response?.data?.message || "login failed. Try again!"
            );
            console.log(err);
        }
    })
}
