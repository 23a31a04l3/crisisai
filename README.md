
# CrisisAI — Disaster Response Platform 🚨

**CrisisAI** is an AI-powered, real-time disaster response platform built for the **Google Solution Challenge**. It provides a centralized, professional dashboard for managing emergencies, predicting safety protocols using AI, verifying disaster news, and locating nearby emergency resources.

![CrisisAI](https://img.shields.io/badge/Status-Competition_Ready-brightgreen) ![Tech](https://img.shields.io/badge/Tech-FastAPI%20|%20Firebase%20|%20Gemini%20AI-blue)

---

## 🚀 Key Features

1. **Professional Dashboard Layout**: A fully responsive (mobile-first, tablet-optimized, desktop-ready) navigation system handling live statistics, active incidents, and alerts.
2. **AI Fake News Detector (Gemini)**: Users can paste WhatsApp forwards or news snippets, and the Gemini API will classify them as `Safe/Credible` or `Fake/Unverified` with high confidence.
3. **Live Incident Map (Google Maps)**: Real-time map tracking for active disasters with dynamic emergency resources (Shelters, Hospitals, Rescue Teams) overlaid on the map.
4. **Dynamic AI Safety Hub**: Based on the selected disaster, the Gemini API generates real-time `DOs` and `DONTs`, providing actionable safety recommendations.
5. **Real-Time UX**: Features pulsing live indicators, animated skeleton loaders during API calls, interactive data counters, and tooltips.

---

## 🤖 Resilient AI Architecture

To ensure the platform **never crashes** during live emergencies (especially if free-tier API limits are hit), CrisisAI implements a robust fallback system:

If the backend detects a `429 RESOURCE_EXHAUSTED` error or downtime from the Hugging Face API, the platform automatically switches to a local algorithmic fallback.
- The UI will continue to function perfectly.
- **Why?** This ensures that users always get reliable, immediate safety protocols and news verification without being blocked by temporary AI rate limits.

---

## 🛠 Local Setup Instructions

### Prerequisites
- Python 3.9+
- Node.js (for Live Server) or VS Code Live Server extension

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd crisisai
```

### 2. Backend Setup (FastAPI)
The backend requires Firebase Admin credentials and a Gemini API Key.
```bash
cd server
python -m venv venv
# Windows: venv\Scripts\activate | Mac/Linux: source venv/bin/activate
pip install -r requirements.txt
```
Create a `.env` file in the `/server` folder:
```env
GEMINI_API_KEY=your_gemini_api_key_here
FIREBASE_CREDENTIALS_PATH=./firebase-adminsdk.json
```
*(Make sure to download your Firebase service account JSON and place it in the server folder).*

Start the backend:
```bash
uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```
*The API will run at http://localhost:8000*

### 3. Frontend Setup (HTML/JS)
1. Open the `/public` folder.
2. Open `index.html` and replace the Google Maps placeholder key with your actual Google Maps API Key:
   ```html
   <script src="https://maps.googleapis.com/maps/api/js?key=YOUR_ACTUAL_API_KEY&callback=initMap" async defer></script>
   ```
3. Use VS Code **Live Server** to run `index.html`. It will open the professional dashboard in your browser.

---

## 🌐 Deployment Guide

### Backend (Render)
1. Push the repository to GitHub.
2. On Render, create a new **Web Service**.
3. Connect the repo and set the Root Directory to `server`.
4. Build Command: `pip install -r requirements.txt`
5. Start Command: `uvicorn app:app --host 0.0.0.0 --port 10000`
6. Add your `.env` variables in the Render dashboard.

### Frontend (Firebase Hosting)
Once the backend is deployed, update the `API_BASE_URL` in `/public/script.js` to your Render URL.
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
# Select the /public folder
firebase deploy
```

---

## ⚠️ Troubleshooting

- **Map is Gray/Not Loading:** Ensure your Google Maps API key has the "Maps JavaScript API" enabled and no strict referrer restrictions are blocking `localhost`.
- **"Could not analyze message" Error:** Ensure the FastAPI backend is running on port 8000. Check the terminal for missing dependencies or invalid JSON paths.
- **UI Elements Overflowing:** The UI is completely responsive. If the map breaks, ensure you haven't removed the `aspect-ratio` CSS constraints in `style.css`.

---

**Built with ❤️ for the Google Solution Challenge 2026.**



