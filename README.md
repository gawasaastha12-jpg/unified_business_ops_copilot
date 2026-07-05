# Unified Business Ops Copilot

A multi-agent automation system for a business that handles customer care, social media, finance, and management reporting through one shared pipeline.

## Setup Instructions

1. **Create and activate a virtual environment:**
   ```bash
   python -m venv venv
   # On Windows:
   venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure Environment Variables:**
   - Copy `.env.example` to `.env`
   - Get a free Gemini API key from [Google AI Studio](https://aistudio.google.com/)
   - Update `GEMINI_API_KEY` in your `.env` file

4. **Seed the database:**
   ```bash
   python -m app.seed_data
   ```

5. **Run the application:**
   ```bash
   uvicorn app.main:app --reload
   ```

6. **Test the classification endpoint:**
   ```bash
   curl -X POST http://127.0.0.1:8000/api/route/1
   ```

## Running the Frontend

The React dashboard is located in the `frontend` directory and uses Vite.

1. **Navigate to the frontend folder:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```
   
Open `http://localhost:5173` in your browser.
