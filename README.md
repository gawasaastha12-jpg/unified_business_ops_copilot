# Unified Business Ops Copilot

**One AI pipeline that routes and connects customer care, social media, finance, and management — so nothing falls through the cracks.**

Built solo (backend, agents, resilience layer) with a teammate on frontend, in a 2-day hackathon sprint.

---

## The Problem

Growing businesses run support, social media, and finance through separate, disconnected tools. This causes three recurring issues:

- **Slow response times** — customer issues sit in siloed inboxes, context lost between tools
- **Missed cross-domain signals** — a support complaint, a social mention, and a finance anomaly about the same issue happen in isolation, and the connection between them goes unnoticed
- **No unified view** — management has no single picture of "what happened today" across the business

## The Solution

A single AI-driven pipeline that ingests events from every domain, routes each one to a specialized agent, and logs everything to one shared store — powering a live dashboard and a management digest that catches patterns no single tool would surface on its own.

```
Inbound Events (email · social · transactions)
                 │
                 ▼
        Intelligent Router
     (classifies domain + urgency via Gemini)
                 │
     ┌───────┬───────┬───────┬────────┐
     ▼       ▼       ▼       ▼        
 Customer  Social  Finance  General   
  Care     Media   Ops      (fallback)
     │       │       │       │
     └───────┴───────┴───────┘
                 │
                 ▼
          Shared Data Store
       (one queryable event log)
                 │
                 ▼
          Live Dashboard
   (real-time view + human approval + digest)
```

## Live Demo

**https://unified-business-ops-copilot.onrender.com**

> Note: hosted on Render's free tier, which spins down after inactivity — the first load may take 30-60 seconds to wake up.

---

## Key Features

### 🧭 Intelligent Router
Every incoming event is classified by domain (customer care / social / finance / general) and urgency (low / medium / high) via Gemini, with a confidence threshold — low-confidence or unrecognized events fall back to a `general` queue for manual review instead of getting silently stuck.

### 🎧 Customer Care Agent — RAG-Grounded
Drafts customer replies grounded in a real embedded FAQ knowledge base via retrieval-augmented generation, not generic LLM guesswork. High-confidence, low-urgency replies are marked ready-to-send; everything else queues for human approval.

### 📣 Social Media Agent
Classifies mentions as risky or routine and drafts brand-safe public responses, flagging anything reputationally sensitive for human sign-off before it goes out.

### 💰 Finance Agent — Rule-Based, Not LLM
Deterministic anomaly detection over transactions (duplicate charges, unusual spend spikes) — faster and more reliable than an LLM call for numeric checks, with zero added latency.

### 🧠 Management Digest — The Differentiator
Continuously scans the shared event store **across every domain** and generates a natural-language summary, explicitly surfacing cross-domain patterns — e.g. catching that a support complaint, a social mention, and a finance refund all trace back to the same defective product, something no single tool would connect on its own.

### ✅ Human-in-the-Loop
Every customer-facing or financially significant action requires explicit approval before being marked complete — automation drafts and flags, a human still decides.

### 🛡️ Full Audit Trail
Every status change (routing decisions, approvals, rejections) is logged to a persistent `status_log` table and viewable as a timeline per event — nothing changes state silently.

### 🔄 Resilient LLM Layer
Automatic retry logic plus a model fallback chain keeps the system responsive under rate limits, degrading gracefully (a clean `503`, never a crash) if every fallback is exhausted.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | FastAPI (Python) |
| Database | SQLite (shared event store + audit log) |
| LLM | Google Gemini (`gemini-1.5-flash`, with model fallback chain) |
| Retrieval | Lightweight in-memory embedding search for RAG |
| Frontend | React (Vite) |
| Animation | Framer Motion |
| Deployment | Render (single service — FastAPI serves the built frontend) |

---

## Architecture Decisions

A few deliberate scope choices worth knowing about, given the 2-day timeline:

- **Simulated event feeds instead of live Gmail/Twitter integration.** Real OAuth setup for both would have eaten a disproportionate share of the build time for demo purposes. The event schema is source-agnostic, so swapping in real integrations later is additive, not a rewrite.
- **Rule-based finance checks instead of an LLM call.** Numeric anomaly detection doesn't need a language model — it needs to be fast and deterministic. Reserved LLM calls for tasks that actually require language understanding.
- **SQLite instead of Postgres.** Sufficient for a single-instance hackathon deployment; the ORM layer makes a future Postgres migration straightforward if needed.

---

## Project Structure

```
unified_business_ops_copilot/
├── app/
│   ├── main.py              # FastAPI entrypoint
│   ├── models.py             # SQLAlchemy models (Event, StatusLog)
│   ├── database.py           # DB engine/session setup
│   ├── llm.py                 # Gemini wrapper with retry + fallback chain
│   ├── seed_data.py          # Demo data seeding
│   ├── agents/
│   │   ├── customer_care.py  # RAG-based reply drafting
│   │   ├── social.py         # Social mention classification + drafting
│   │   ├── finance.py        # Rule-based anomaly detection
│   │   ├── general.py        # Fallback handler
│   │   └── retrieval.py      # FAQ embedding + similarity search
│   ├── routes/
│   │   ├── router.py         # Classification endpoint
│   │   ├── customer_care.py
│   │   ├── social.py
│   │   ├── finance.py
│   │   ├── general.py
│   │   └── management.py     # Cross-domain digest endpoint
│   └── frontend_dist/        # Built React app (served by FastAPI)
├── frontend_v2/
│   └── client/                # React source (Vite)
├── requirements.txt
└── README.md
```

---

## Running Locally

**Backend**

```bash
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Create a `.env` file in the project root:

```
GEMINI_API_KEY=your_key_here
```

Get a free key at [Google AI Studio](https://aistudio.google.com/).

```bash
uvicorn app.main:app --reload
```

Backend runs at `http://127.0.0.1:8000`. Interactive API docs at `http://127.0.0.1:8000/docs`.

**Frontend (development)**

```bash
cd frontend_v2/client
npm install
npm run dev
```

**Seed demo data**

```bash
python -m app.seed_data
```

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/events` | List all events (filter by `domain`, `status`) |
| `GET` | `/api/events/{id}` | Get a single event |
| `GET` | `/api/events/{id}/history` | Audit log of status changes |
| `PATCH` | `/api/events/{id}/status` | Approve or reject an event |
| `POST` | `/api/events/simulate` | Create a new event for live testing |
| `POST` | `/api/route/{id}` | Classify an event's domain + urgency |
| `POST` | `/api/agents/customer-care/{id}` | Run the Customer Care agent |
| `POST` | `/api/agents/social/{id}` | Run the Social agent |
| `POST` | `/api/agents/finance/{id}` | Run the Finance agent |
| `POST` | `/api/agents/general/{id}` | Run the fallback General agent |
| `POST` | `/api/process/{id}` | One-shot: classify + run correct agent |
| `POST` | `/api/process-all` | Process every pending event |
| `GET` | `/api/agents/digest` | Cross-domain management digest + stats |

---

## What's Next

- Real production integrations with Gmail and the X/Twitter developer platform, replacing simulated feeds
- Multi-tenant data isolation for serving more than one business from a single deployment
- Stateless agent workers to handle higher event volume in production

---
