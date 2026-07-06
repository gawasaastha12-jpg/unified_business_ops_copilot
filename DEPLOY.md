# Deployment Guide — Unified Business Ops Copilot

This guide outlines how to build and deploy the **Unified Business Ops Copilot** as a single Render Web Service.

## Deployment Architecture

In production, FastAPI serves both:
1. The **Backend API** at `/api/...` and automatic docs at `/docs`
2. The **React Production Frontend** static assets at `/` (served from `app/frontend_dist/`)

This eliminates cross-origin issues (CORS) and allows running the entire application under a single Render Web Service instance.

---

## 1. Prerequisites on Render

Create a new **Web Service** on Render with the following configurations:

- **Runtime**: `Python 3.11+`
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `python -m uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- **Environment Variables**:
  - `GEMINI_API_KEY`: Your Gemini API Key (used for model fallback routing and response generation).

---

## 2. Preparing and Committing the Frontend Build

Since Render runs Python and does not have Node.js in the Python runtime environment, you must compile the frontend locally and commit the built files to your repository before deploying.

### Windows (Local Dev)
Run the automated batch file:
```cmd
build.bat
```

### macOS / Linux (Local Dev)
Run the shell script:
```bash
chmod +x build.sh
./build.sh
```

These scripts will:
1. Compile the React frontend using Vite.
2. Clear any stale production assets inside the backend directory.
3. Copy the compiled assets directly to `app/frontend_dist`.

Once the build finishes:
```bash
git add app/frontend_dist
git commit -m "build: compile frontend for deployment"
git push
```
Render will detect the new commit and automatically deploy it.

---

## 3. Database Persistence Note

The application uses SQLite as its database (`copilot.db`).
- On Render's **Free Tier**, the filesystem is ephemeral. If the service restarts or redeploys, the database will be wiped.
- To prevent database failure on startup, the application **automatically seeds demo data** on launch if the database is empty.
- For true data persistence across deployments, attach a **Render Persistent Disk** and configure the database URL path to point to a folder on that disk, or migrate the connection string in `app/database.py` to a persistent PostgreSQL database.
