# MTA Traffic Intelligence Dashboard 🚦

A real-time, AI-powered traffic intelligence and routing dashboard for the MTA Bridges & Tunnels. This application uses a custom XGBoost machine learning model to predict traffic patterns and a React/TypeScript frontend to visualize congestion, capacity risks, and optimal routing.

## 🏗️ Project Architecture

This is a full-stack application divided into two pieces:
- **Backend**: Python FastAPI server utilizing an XGBoost model (`xgboost_model.pkl`) to serve historical and predictive traffic data.
- **Frontend**: React + Vite + Tailwind CSS dashboard providing a glassmorphism UI with interactive Leaflet maps.

---

## 🚀 How to Run this Project Locally 

To run this website directly from the cloned GitHub repository, you will need to start both the Backend API and the Frontend Interface.

### Prerequisites
- [Python 3.9+](https://www.python.org/downloads/)
- [Node.js](https://nodejs.org/en/)

### 1. Start the Backend (FastAPI)

Open a terminal in the root of the project and navigate to the backend directory:

```bash
cd backend

# Create a virtual environment (if you don't have one)
python -m venv .venv

# Activate the virtual environment
# On Windows:
.venv\Scripts\activate
# On Mac/Linux:
source .venv/bin/activate

# Install the Python dependencies
pip install -r requirements.txt

# Start the backend server
python -m uvicorn main:app --reload
```
The backend API and Swagger docs will be available at `http://localhost:8000`.

### 2. Start the Frontend (React / Vite)

Open a *second, new terminal* in the root of the project and navigate to the frontend directory:

```bash
cd frontend

# Install the Node dependencies
npm install

# Start the web interface
npm run dev
```
The frontend dashboard will be available at `http://localhost:5173`.

---

## 🌎 Deployment Notes
Because this system relies on a live Python backend and an XGBoost machine learning model, it **cannot** be hosted directly for free via "GitHub Pages". 

To make this a fully public website accessible via a URL, it should be deployed using services like:
* **Frontend**: Vercel, Netlify, or AWS Amplify
* **Backend**: Render, Heroku, Railway, or AWS EC2
