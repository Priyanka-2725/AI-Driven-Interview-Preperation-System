# 🚀 The AI Interview Coach: Beginner's Journey (Week 1)

This document explains **everything** we have built in Week 1, step-by-step. It is written for absolute beginners. If you have no idea how web applications or machine learning works, reading this will help you understand *what* we did, *why* we did it, and *how* it all connects.

---

## 📌 1. What Are We Building?

We are building the **AI Interview Coach**. 
Imagine a platform where a user gives a mock interview, and the system evaluates their **Confidence**, **Fluency**, and **Technical Accuracy** using Artificial Intelligence. 

### The Golden Rule: "Build It Yourself"
Most modern apps just send data to OpenAI (ChatGPT) and get a score back. **We are NOT doing that.** 
We have a strict rule: *No external paid APIs.* We write the math, we calculate the scores locally, and we use open-source tools. This makes the project highly technical and completely free to run.

---

## 🏗️ 2. The Architecture (The 3 Pillars)

To make the system scalable, we divided it into three separate parts (services). They talk to each other over the internet (HTTP).

1. **Frontend (Port 5173)**: What the user sees (Buttons, Forms, Dashboard). Built with React.
2. **Backend (Port 5000)**: The manager. Handles logins, saves data to the database, and talks to the ML service. Built with Node.js.
3. **ML Service (Port 8000)**: The brain. It takes audio/video and calculates scores using math. Built with Python.

---

## 🎨 3. The Frontend (React + Vite)

The frontend is the face of our app. We used **React** (a JavaScript library for building user interfaces) and **Vite** (a tool that makes running React super fast).

### What we built:
- **Landing Page**: A welcome screen.
- **Login & Register Pages**: Forms for users to enter their email and password.
- **Dashboard**: A secure page only visible after logging in.

### How we built it:
- **Tailwind CSS**: Instead of writing separate CSS files, we used Tailwind. It lets us style buttons by simply adding classes like `bg-blue-500` directly in the HTML.
- **React Router**: This acts like a traffic cop. If you go to `/login`, it shows the Login Page. If you try to go to `/dashboard` without logging in, it blocks you and sends you back to `/login` (we call this a `ProtectedRoute`).

### The Magic of "Axios Interceptors"
When a user logs in, they get a VIP pass (a Token) that expires in 15 minutes. 
What happens if they are using the app and the pass expires? 
Instead of kicking them out abruptly, we built an **Interceptor**. It automatically detects the expiration, silently fetches a *new* pass in the background using a hidden "Refresh Token", and retries the user's action without them ever noticing!

---

## ⚙️ 4. The Backend & Database (Node.js + MongoDB)

The Backend is the secure middleman. 

### What we built:
- **Authentication System**: How users register, log in, and stay securely logged in.
- **Database Connection**: We used **MongoDB** (a database that stores data as JSON documents instead of rigid tables) to store user accounts.

### How Authentication (Login) works securely:
1. **Hashing Passwords**: If a user's password is `password123`, we **never** save it like that. We use a tool called `bcrypt` to scramble it into gibberish (e.g., `$2b$12$xyZ...`). Even if a hacker steals the database, they can't read the passwords.
2. **JWT (JSON Web Tokens)**: When a user logs in successfully, we give them a JWT (Access Token). It’s like a digital wristband that proves they are logged in.
3. **HTTP-Only Cookies**: To make it super secure against hackers stealing the wristband, we send a secondary "Refresh Token" inside an *HTTP-Only Cookie*. This means the browser holds it securely, and hackers' scripts cannot touch it.

---

## 🧠 5. The Machine Learning (ML) Service (Python + FastAPI)

The Backend doesn't know how to do heavy math or analyze audio. That is the job of the ML Service. We used **Python** because it has the best libraries for AI and Math, and **FastAPI** to make it accessible over the web.

### What we built:
An endpoint (a web URL) that can take an audio file and extract numbers (features) out of it. 

### How we did it:
We used a library called **Librosa** which is famous for audio analysis.
- **RMS (Root Mean Square)**: This calculates the "Energy" or loudness of the voice at any given millisecond. If the energy is very low for a long time, we know the user took an "awkward pause".
- **Pitch (Fundamental Frequency)**: We use an algorithm called `pyin` to detect the pitch of the voice. This helps us know exactly when the person is actively speaking versus when there is just background noise.

---

## 🔗 6. How They Talk to Everything (The Flow)

Here is a real-world flow of how the whole system connects:
1. **User Action**: The user opens the React **Frontend** and clicks "Check System Health".
2. **Frontend to Backend**: The Frontend sends an HTTP request to the Node.js **Backend** (Port 5000).
3. **Backend to ML Service**: The Backend realizes it needs ML status, so it makes its own HTTP request to the Python **ML Service** (Port 8000).
4. **The Reply**: The Python service replies "I am alive" to the Backend. The Backend replies "Everything is alive" to the Frontend. The React app shows a green dot to the user!

---

## 🧪 7. Testing (Proving it Works)

Writing code isn't enough; we have to prove it doesn't break. 
- **Backend/ML Tests**: We wrote automated scripts that send fake data to the Backend and ML service to ensure they return the exact correct math and error messages.
- **Puppeteer (E2E Testing)**: For the Frontend, we wrote a bot using a tool called Puppeteer. This bot literally opens a real Chrome browser in the background, types into the login box, clicks "Submit", and verifies that the Dashboard loads correctly, exactly like a human would!

---

### Summary of Week 1
We laid the concrete foundation. We have a secure, scalable 3-part system where users can safely log in, and the infrastructure is completely ready to start processing real audio and video in Week 2!
