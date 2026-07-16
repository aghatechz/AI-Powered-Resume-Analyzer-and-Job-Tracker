// Navbar scroll effect

const navbar = document.getElementById("navbar")
window.addEventListener("scroll", () => {
  if (window.scrollY > 50) {
    navbar.classList.add("scrolled")
  } else {
    navbar.classList.remove("scrolled")
  }
})

// Mobile menu toggle
const mobileToggle = document.getElementById("mobileMenuToggle")
const navLinks = document.getElementById("navLinks")
const sidebarOverlay = document.getElementById("sidebarOverlay")

mobileToggle.addEventListener("click", () => {
  mobileToggle.classList.toggle("active")
  navLinks.classList.toggle("active")
  sidebarOverlay.classList.toggle("active")
  mobileToggle.setAttribute("aria-expanded", mobileToggle.classList.contains("active"))
  sidebarOverlay.setAttribute("aria-hidden", !sidebarOverlay.classList.contains("active"))
})

// Close mobile menu when clicking overlay
sidebarOverlay.addEventListener("click", () => {
  mobileToggle.classList.remove("active")
  navLinks.classList.remove("active")
  sidebarOverlay.classList.remove("active")
  mobileToggle.setAttribute("aria-expanded", "false")
  sidebarOverlay.setAttribute("aria-hidden", "true")
})

// Close mobile menu when clicking a link
navLinks.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    mobileToggle.classList.remove("active")
    navLinks.classList.remove("active")
    sidebarOverlay.classList.remove("active")
    mobileToggle.setAttribute("aria-expanded", "false")
    sidebarOverlay.setAttribute("aria-hidden", "true")
  })
})

// Active nav link on scroll
const sections = document.querySelectorAll("section[id]")
window.addEventListener("scroll", () => {
  let current = ""
  sections.forEach((section) => {
    const sectionTop = section.offsetTop
    const sectionHeight = section.clientHeight
    if (window.scrollY >= sectionTop - 200) {
      current = section.getAttribute("id")
    }
  })

  navLinks.querySelectorAll("a").forEach((link) => {
    link.classList.remove("active")
    if (link.getAttribute("href") === `#${current}`) {
      link.classList.add("active")
    }
  })
})

// Chatbot functionality
const chatToggle = document.getElementById("chat-toggle-btn")
const chatbot = document.getElementById("chatbot")
const closeChat = document.getElementById("close-chat")
const chatForm = document.getElementById("input-form")
const userInput = document.getElementById("user-input")
const chatArea = document.getElementById("chat-area")

chatToggle.addEventListener("click", () => {
  chatbot.classList.toggle("active")
})

closeChat.addEventListener("click", () => {
  chatbot.classList.remove("active")
})

chatForm.addEventListener("submit", (e) => {
  e.preventDefault()
  const message = userInput.value.trim()
  if (message) {
    addMessage(message, "user")
    userInput.value = ""

    // Simulate bot response
    setTimeout(() => {
      const botResponse = getBotResponse(message)
      addMessage(botResponse, "bot")
    }, 800)
  }
})

function addMessage(text, type) {
  const messageDiv = document.createElement("div")
  messageDiv.className = `message ${type}-message`

  if (type === "bot") {
    messageDiv.innerHTML = `
      <div class="message-avatar">
        <i class="fas fa-robot"></i>
      </div>
      <div class="message-content">${text}</div>
    `
  } else {
    messageDiv.innerHTML = `
      <div class="message-content">${text}</div>
    `
  }

  chatArea.appendChild(messageDiv)
  chatArea.scrollTop = chatArea.scrollHeight
}

function getBotResponse(message) {
  const lowerMessage = message.toLowerCase()

  if (lowerMessage.includes("resume") || lowerMessage.includes("cv")) {
    return "Our AI-powered resume analyzer can help you optimize your resume for ATS systems and increase your chances of getting interviews. Would you like to try it?"
  } else if (lowerMessage.includes("job") || lowerMessage.includes("application")) {
    return "Our job tracker helps you organize all your applications in one place. You can track status, set reminders, and never miss an opportunity!"
  } else if (lowerMessage.includes("price") || lowerMessage.includes("cost")) {
    return "We offer a free tier with basic features, and premium plans starting at $9.99/month with unlimited applications and advanced AI insights."
  } else if (lowerMessage.includes("help") || lowerMessage.includes("support")) {
    return "I'm here to help! You can ask me about our resume analyzer, job tracking features, pricing, or anything else related to your job search."
  } else {
    return "That's a great question! Our platform offers AI-powered resume analysis, job application tracking, and career insights. How can I assist you specifically?"
  }
}

// FAQ Accordion
const faqItems = document.querySelectorAll(".faq-item")

faqItems.forEach((item) => {
  const question = item.querySelector(".faq-question")

  question.addEventListener("click", () => {
    const isActive = item.classList.contains("active")

    // Close all FAQ items
    faqItems.forEach((faq) => faq.classList.remove("active"))

    // Open clicked item if it wasn't active
    if (!isActive) {
      item.classList.add("active")
    }
  })
})

// Reviews loading simulation
const reviewLoader = document.getElementById("reviewLoader")
const reviewCards = document.getElementById("reviewCards")

const reviews = [
  {
    name: "James Anderson",
    role: "Software Engineer",
    avatar: "https://i.pravatar.cc/150?img=65",
    rating: 5,
    text: "NextHire helped me land my dream job at a top tech company! The AI resume analyzer gave me invaluable feedback that made all the difference.",
  },
  {
    name: "Michael Chen",
    role: "Product Manager",
    avatar: "https://i.pravatar.cc/150?img=11",
    rating: 5,
    text: "The job tracking feature is a game-changer. I was able to manage 50+ applications effortlessly and never missed a follow-up.",
  },
  {
    name: "Robert Martinez",
    role: "Marketing Director",
    avatar: "https://i.pravatar.cc/150?img=7",
    rating: 5,
    text: "I was skeptical at first, but this platform truly delivers. My resume score went from 65% to 95% and I got 3x more interviews!",
  },
  {
    name: "David Kim",
    role: "Data Scientist",
    avatar: "https://i.pravatar.cc/150?img=3",
    rating: 5,
    text: "The ATS optimization feature is incredible. Finally, a tool that understands how modern recruitment actually works.",
  },
  {
    name: "William Taylor",
    role: "UX Designer",
    avatar: "https://i.pravatar.cc/150?img=1",
    rating: 5,
    text: "Best investment in my career! The interview prep resources and personalized insights helped me negotiate a 30% salary increase.",
  },
  {
    name: "Alexander Johnson",
    role: "Business Analyst",
    avatar: "https://i.pravatar.cc/150?img=12",
    rating: 5,
    text: "I love how everything is in one place. Resume analysis, job tracking, and interview prep - this platform has it all!",
  },
]

setTimeout(() => {
  reviewLoader.style.display = "none"
  reviewCards.style.display = "flex"

  // Duplicate reviews for infinite scroll
  const allReviews = [...reviews, ...reviews]

  allReviews.forEach((review) => {
    const reviewCard = document.createElement("div")
    reviewCard.className = "review-card"

    const stars = '<i class="fas fa-star"></i>'.repeat(review.rating)

    reviewCard.innerHTML = `
      <div class="review-header">
        <div class="review-avatar">
          <img src="${review.avatar}" alt="${review.name}">
        </div>
        <div class="review-info">
          <h4>${review.name}</h4>
          <p>${review.role}</p>
          <div class="review-stars">${stars}</div>
        </div>
      </div>
      <p>${review.text}</p>
    `

    reviewCards.appendChild(reviewCard)
  })
}, 1500)

// Reveal on Scroll
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('active');
    }
  });
}, { threshold: 0.1 });

document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));
});

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", function (e) {
    const href = this.getAttribute("href")
    if (href !== "#") {
      e.preventDefault()
      const target = document.querySelector(href)
      if (target) {
        target.scrollIntoView({
          behavior: "smooth",
          block: "start",
        })
      }
    }
  })
})
