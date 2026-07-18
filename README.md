# Stadium AI — FIFA World Cup 2026 Operations Platform

A Generative AI-powered solution that enhances stadium operations and the overall tournament experience for **fans, organizers, volunteers, and venue staff** during the FIFA World Cup 2026.

Built with **Google Gemini AI**, **React 19**, **FastAPI**, and **Firebase**.

---

## Problem Statement

> Build a GenAI-enabled solution that enhances stadium operations and the overall tournament experience for fans, organizers, volunteers, or venue staff. The solution must leverage Generative AI to improve navigation, crowd management, accessibility, transportation, sustainability, multilingual assistance, operational intelligence, or real-time decision support during the FIFA World Cup 2026.

---

## Features

### 🏢 Crowd Management & Operational Intelligence
- Real-time crowd density monitoring across 8 stadium zones
- Interactive density sliders with color-coded alert levels (Low → Critical)
- AI-powered crowd management recommendations via Gemini
- **AI Operational Briefing**: Dedicated Operational Intelligence panel calling the `/api/operations` endpoint for Real-Time Decision Support (generating risk levels, staffing guides, safety alerts, and contingency protocols)
- Pie and bar chart visualizations using Recharts

### 🗺️ Venue Navigator & Accessibility
- Interactive SVG stadium map with clickable zones
- Zone details panel with capacity, amenities, and wayfinding info
- Accessibility mode toggle generating fully wheelchair-accessible elevator/ramp routes
- Venue selector for all FIFA 2026 host stadiums
- Zero ARIA violations on interactive controls (fully compliant list semantics)

### 🤖 Multilingual AI Assistant
- Gemini-powered chatbot with venue-aware context
- Tailored prompt context based on user roles (**Fan, Volunteer, Venue Staff, Organizer**)
- Support for **10+ languages** (English, Spanish, French, Arabic, Hindi, etc.)
- Quick-question shortcuts for common stadium and accessibility queries
- Fallback responses when API is unavailable (intelligently re-ordered by specificity)

### 🚌 Transport Planner
- Multi-modal route comparison (Metro, Bus, Shuttle, Rideshare, Walk)
- CO₂ emissions comparison per transport mode (IPCC AR6 data)
- Cost and duration estimates
- Google Calendar integration for travel planning

### ♻️ Sustainability Dashboard
- Track waste, energy, water, and recycling metrics per event
- Per-capita sustainability scoring against FIFA Green 2026 targets
- Letter grade system (A+ to D) with progress bars
- AI-generated reduction strategies via Gemini

### 🔒 Security
- XSS prevention via DOMPurify sanitization
- Content Security Policy (CSP) headers and meta tags
- 8 security headers on every API response (X-Content-Type-Options, X-Frame-Options, HSTS, etc.)
- CORS restricted to specific origins
- Rate limiting on all API endpoints (slowapi)
- Pydantic v2 input validation with strict `Annotated` constraints

---

## Architecture

```
Stadium/
├── backend/                 # FastAPI + Gemini AI
│   ├── app/
│   │   ├── __init__.py      # Package declaration & exports
│   │   ├── schemas.py       # Pydantic v2 request/response models
│   │   ├── services.py      # Business logic, caching, prompts, fallback
│   │   ├── routes.py        # API endpoint handlers (request-state model injection)
│   │   └── middleware.py     # Security headers + CORS
│   ├── main.py              # App assembly & startup validations (~90 lines)
│   └── test_main.py         # 66 backend tests
├── frontend/                # React 19 + Vite
│   ├── src/
│   │   ├── constants/       # Centralized application data
│   │   ├── hooks/           # Custom React hooks with JSDoc annotations
│   │   ├── components/      # Shared components
│   │   ├── pages/           # 6 page components
│   │   ├── utils/           # Pure utility functions
│   │   └── __tests__/       # 134 frontend tests
│   ├── vite.config.js       # Build optimization + test config
│   └── eslint.config.js     # Strict linting rules
└── .gitignore               # Comprehensive ignore rules
```

---

## Tech Stack

| Layer       | Technology                    |
|-------------|-------------------------------|
| Frontend    | React 19, Vite, Tailwind CSS  |
| Routing     | React Router DOM v7           |
| Charts      | Recharts                      |
| Animations  | Framer Motion                 |
| Icons       | Lucide React                  |
| AI          | Google Gemini Pro (GenAI)     |
| Backend     | FastAPI, Pydantic, Uvicorn   |
| Security    | DOMPurify, slowapi, CSP      |
| Testing     | Vitest + RTL (FE), Pytest (BE)|
| Analytics   | Firebase Analytics            |
| Deployment  | Vercel (FE), Render (BE)      |

---

## Setup

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
echo "GEMINI_API_KEY=your_key_here" > .env
uvicorn main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

---

## Testing

### Backend (66 tests)
```bash
cd backend
pytest test_main.py -v
```

### Frontend (134 tests)
```bash
cd frontend
npx vitest run
```

---

## Environment Variables

| Variable          | Description                  | Required |
|-------------------|------------------------------|----------|
| `GEMINI_API_KEY`  | Google Gemini API key        | Yes      |
| `VITE_API_URL`    | Backend API base URL         | No       |

---

## Code Quality

- **Modular backend**: Separated into `schemas.py`, `services.py`, `routes.py`, `middleware.py`
- **Zero Circular Imports**: Clean dependency injection using FastAPI `app.state` context
- **Centralized constants**: All static data in `constants/index.js`
- **Strict ESLint**: `eqeqeq`, `prefer-const`, `no-var`, `no-console`
- **Comprehensive JSDoc**: All functions and custom hooks documented with `@param`, `@returns`
- **Type-safe API**: Pydantic v2 schemas using standard `Annotated` types
- **LRU caching**: Reduces redundant Gemini API calls

---

## License

Built for the PromptWars Virtual Hackathon 2026.

**#BuildWithAI #PromptWarsVirtual**
