// API origin: local backend in dev, deployed backend in production.
var API_ORIGIN = (window.API_ORIGIN = window.API_ORIGIN || ((location.hostname === 'localhost' || location.hostname === '127.0.0.1') ? 'http://localhost:5000' : 'https://ai-resume-job-tracker-backend.vercel.app'));
document.addEventListener("DOMContentLoaded", () => {
    const chatToggleBtn = document.getElementById("chat-toggle-btn");
    const chatbot = document.getElementById("chatbot");
    const chatArea = document.getElementById("chat-area");
    const inputForm = document.getElementById("input-form");
    const userInput = document.getElementById("user-input");

     chatToggleBtn.addEventListener("click", () => {
        chatbot.classList.toggle("active");
    });

     function addMessage(text, type) {
        const msgDiv = document.createElement("div");
        msgDiv.className = type === "user" ? "message user-message" : "message bot-message";
        msgDiv.textContent = text;
        chatArea.appendChild(msgDiv);
        chatArea.scrollTo({ top: chatArea.scrollHeight, behavior: 'smooth' });
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

     async function sendMessage(e) {
        if(e) e.preventDefault();
        const text = userInput.value.trim();
        if(!text) return;

        addMessage(text, "user");
        userInput.value = "";

         const loadingDiv = document.createElement("div");
        loadingDiv.className = "message bot-message loading";
        loadingDiv.textContent = "AI is typing...";
        chatArea.appendChild(loadingDiv);
        chatArea.scrollTo({ top: chatArea.scrollHeight, behavior: 'smooth' });

        try {
            const res = await axios.post(`${API_ORIGIN}/api/ai`, { 
                prompt: text 
            });

            loadingDiv.remove();

            if (res.data && res.data.reply) {
                addMessage(res.data.reply, "bot");
            } else {
                addMessage("Unexpected response from server.", "bot");
                showNotification("Unexpected AI response", "error");
            }
        } catch(err) {
            loadingDiv.remove();
            console.error("AI Error:", err);
            addMessage("Server error. Please try again.", "bot");
            showNotification("Failed to reach AI server.", "error");
        }
    }

     inputForm.addEventListener("submit", sendMessage);
    userInput.addEventListener("keypress", (e) => {
        if(e.key === "Enter" && !e.shiftKey) sendMessage();
    });

     addMessage("Hello! I am your AI career assistant. Ask me anything about jobs or your resume.", "bot");
});
