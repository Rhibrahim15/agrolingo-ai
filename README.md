# 🌾 AgroLingo AI

> **The world's first Hausa-native agricultural intelligence assistant.**  
> Built by [GreenByte Tech Co](https://greenbyte.tech) — RC 9467262, Kano State, Nigeria.

[![PWA](https://img.shields.io/badge/PWA-Ready-green?style=flat-square&logo=pwa)](https://web.dev/progressive-web-apps/)
[![Go](https://img.shields.io/badge/Backend-Go%201.22-blue?style=flat-square&logo=go)](https://go.dev)
[![React](https://img.shields.io/badge/Frontend-React%2019-61DAFB?style=flat-square&logo=react)](https://react.dev)
[![Supabase](https://img.shields.io/badge/Database-Supabase-3ECF8E?style=flat-square&logo=supabase)](https://supabase.com)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)

---

## 📖 What is AgroLingo AI?

AgroLingo AI delivers expert agricultural intelligence to smallholder farmers in Northern Nigeria — **in Hausa, in their hands, at the speed of a question.**

Farmers speak or type in Hausa or English and receive:

- 🌿 **Crop disease diagnosis** with treatment steps
- 🌦️ **Hyper-local weather advice** (not just weather — *farming decisions based on weather*)
- 📈 **Real-time market prices** from Kano, Dutse, and Kaduna markets
- 📔 **Farm journal** to track seasons and build a digital farming record

---

## 🏗️ Architecture

```
agrolingo-ai/
├── client-pwa/          # React 19 + Vite + TypeScript + Tailwind 4
│   └── src/
│       ├── screens/     # All app screens (Auth, Dashboard, Chat, etc.)
│       ├── components/  # Reusable UI components
│       ├── store/       # Zustand global state
│       ├── lib/         # Supabase client, API client
│       └── utils/       # Translations (Hausa, English, French)
│
├── server/              # Go 1.22 backend (Echo framework)
│   ├── cmd/api/         # Entry point, routes, middleware
│   └── internal/
│       ├── agent/       # Gemini AI orchestrator with tool calling
│       ├── handlers/    # HTTP route handlers
│       └── tools/       # Weather, market, farm record tools
│
├── supabase_schema.sql  # Complete database schema — run once
└── .env.example         # Environment variables template
```

**Tech Stack:**

| Layer | Technology | Why |
|---|---|---|
| Frontend | React 19 + Vite 8 | Fast, modern, PWA-ready |
| Styling | Tailwind CSS 4 + Framer Motion | Professional animations |
| State | Zustand | Lightweight, TypeScript-first |
| Backend | Go 1.22 + Echo | High performance, concurrent |
| AI | Google Gemini 1.5 Flash | Multilingual, tool calling |
| Database | Supabase (PostgreSQL) | Auth + DB + Storage in one |
| Weather | Open-Meteo API | Free, no API key needed |
| Deployment | Vercel (frontend) + Railway (backend) | Both have free tiers |

---

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- Go 1.22+
- A Supabase account (free at [supabase.com](https://supabase.com))

### 1. Clone and install

```bash
git clone https://github.com/Rhibrahim15/agrolingo-ai.git
cd agrolingo-ai

# Frontend
cd client-pwa
npm install

# Backend
cd ../server
go mod tidy
```

### 2. Set up environment variables

```bash
# In project root
cp .env.example .env
# Fill in your Supabase URL, anon key, Gemini key
```

```bash
# In /server
cp .env.example .env
# Fill in Supabase JWT secret, service role key, Gemini key
```

### 3. Set up Supabase database

1. Go to your Supabase project → **SQL Editor** → **New Query**
2. Paste and run the contents of `supabase_schema.sql`
3. Go to **Storage** → Create two public buckets:
   - `avatars` (max 5MB, image/* only)
   - `scans` (max 10MB, image/* only)

### 4. Run locally

```bash
# Terminal 1 — Frontend (http://localhost:5173)
cd client-pwa
npm run dev

# Terminal 2 — Backend (http://localhost:8080)
cd server
go run cmd/api/main.go
```

### 5. Verify it's working

```bash
curl http://localhost:8080/health
# Expected: {"status":"healthy","service":"AgroLingo AI Engine"}
```

---

## 🌐 Deployment (Free)

### Frontend → Vercel

```bash
cd client-pwa
npm i -g vercel
vercel
```

Set these environment variables in Vercel dashboard:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_API_BASE_URL` → your Railway backend URL

### Backend → Railway

1. Push to GitHub
2. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
3. Select your repo → set root directory to `/server`
4. Add environment variables from `.env`
5. Railway auto-detects Go and deploys

---

## 🔑 Environment Variables

See `.env.example` for the full list. Critical variables:

| Variable | Where to get it |
|---|---|
| `VITE_SUPABASE_URL` | Supabase → Project Settings → API |
| `VITE_SUPABASE_ANON_KEY` | Supabase → Project Settings → API |
| `SUPABASE_JWT_SECRET` | Supabase → Project Settings → API → JWT Settings |
| `GEMINI_API_KEY` | [Google AI Studio](https://aistudio.google.com) |

---

## 🌍 Language Support

AgroLingo AI supports three languages:

| Language | Code | Status |
|---|---|---|
| Hausa | `ha` | ✅ Full support |
| English | `en` | ✅ Full support |
| French | `fr` | ✅ UI strings only |

---

## 📱 PWA Features

- **Installable** — "Add to Home Screen" on Android/iOS
- **Offline capable** — Service worker caches app shell
- **No app store needed** — Share via WhatsApp link or QR code
- **< 1MB** initial load

---

## 🔐 Security

- JWT authentication via Supabase Auth
- Row Level Security (RLS) on all database tables
- Admin role enforced at both frontend and backend JWT level
- Input validation on all forms
- No secrets in client-side code

---

## 🏆 Recognition

- **African Union IEA 2026** — Grant application submitted (April 2026)
- **Registered company** — GreenByte Tech Co, RC 9467262, CAC Nigeria
- Built for Northern Nigerian smallholder farmers

---

## 👨‍💻 Author

**Halifa Rabiu Ibrahim** (Khalifa Elgezy)  
Founder, GreenByte Tech Co  
Computer Science Graduate, Federal University Dutse  
📧 [greenbyte.tech.ng@gmail.com](mailto:greenbyte.tech.ng@gmail.com)

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.
