# 🌿 AgroLingo AI: GreenByte Engine
**Multilingual Agentic AI Assistant for Precision Agriculture**

AgroLingo AI is a high-performance PWA designed to empower smallholder farmers in Northern Nigeria. It provides real-time market intelligence, AI-driven crop disease diagnosis, and localized weather insights in Hausa, English, and French.

---

## 🚀 Key Capabilities
* **🤖 Agentic Chat:** Context-aware agricultural advice using Gemini 1.5 Flash.
* **📸 Agro-Scan:** Instant crop disease identification via computer vision.
* **📈 Market Pulse:** Live pricing data from regional hubs like Dawanau.
* **🌦️ SkySense:** Hyper-local weather forecasting for Dutse/Jigawa regions.
* **🍱 Bento Records:** Visual growth tracking and yield analytics.

## 🛠️ Tech Stack
- **Frontend:** React, TypeScript, Vite 8, Tailwind CSS, Framer Motion.
- **Backend:** Go (Golang), Echo Framework, Gemini AI SDK.
- **Database/Auth:** Supabase (PostgreSQL + RLS).
- **PWA:** Vite-PWA for offline-first accessibility.

---

## 🏗️ Getting Started

### Prerequisites
- Go 1.22+
- Node.js 20+
- Supabase Project & Gemini API Key

### Backend Setup
1. Navigate to `/server`
2. Create a `.env` file with `GEMINI_API_KEY` and `SUPABASE_JWT_SECRET`.
3. Run the engine:
   ```bash
   go mod tidy
   go run main.go