<div align="center">
  <img src="path/to/your/logo.png" alt="AgroLingo AI Logo" width="150">
</div>

🌾 AgroLingo AI
A Hausa-first agricultural intelligence platform for smallholder farmers in Northern Nigeria.
Built by GreenByte Tech Co — RC 9467262, Kano State, Nigeria.

PWA
Go
React
Supabase
License

📖 What is AgroLingo AI?
AgroLingo AI is a multilingual agricultural intelligence platform designed to help underserved smallholder farmers access reliable farming support in their own language.

The project begins with Hausa-speaking farmers in Northern Nigeria and is expanding toward a broader African agricultural intelligence ecosystem combining:

🌿 Crop advisory and disease guidance
🐔 Livestock support
🌦️ Weather-informed farming recommendations
📈 Market intelligence
📔 Farm records and farmer profiles
🧠 Local-language agricultural knowledge systems
🗣️ Future voice-first AI interaction
👩🏾‍🌾 Extension-worker and expert escalation workflows
📊 Research-grade Hausa agricultural datasets and benchmarks
AgroLingo AI is not just a chatbot. It is being developed as agricultural intelligence infrastructure for farmers, extension workers, researchers, NGOs, and development organizations.

🎯 Core Mission
To help farmers access agricultural expertise in their own language while helping institutions understand and support underserved farming communities through localized agricultural intelligence.

🚜 Why AgroLingo AI Matters
Many smallholder farmers in Northern Nigeria face barriers such as:

Limited access to agricultural extension officers
Language barriers in digital tools
Low literacy and low digital access
Poor market information
Climate uncertainty
Limited trusted agricultural guidance
Fragmented agricultural data
AgroLingo AI addresses these challenges by delivering localized, practical, and farmer-centered agricultural support in Hausa and English, with future support for other African languages.

✨ Current MVP Features
Farmers and users can access:

🌾 AI Agricultural Advisory — ask farming questions in Hausa or English
🌿 Crop Disease Guidance — receive possible causes and treatment steps
🐓 Livestock Advice — basic poultry and livestock support
🌦️ Weather Intelligence — farming decisions based on weather context
📈 Market Information — commodity price and market advisory support
📔 Farm Journal — track farm activities and build digital farming records
🌍 Multilingual UI — Hausa, English, and partial French interface support
📱 PWA Support — installable and usable without app-store distribution
🧠 Agentic AI Vision
AgroLingo AI is evolving from:

text

Farmer → Chatbot → Answer
into:

text

Farmer → AgroLingo Agent → Expert Network → Resolution
The long-term goal is for a farmer to call or message AgroLingo and say something naturally, such as:

text

Masara ta na mutuwa.
Kajina suna mutuwa.
Ina neman kasuwar albasa.
The system should then:

Understand Hausa or another supported language.
Ask follow-up questions if needed.
Diagnose or triage the issue.
Estimate confidence level.
Decide whether expert escalation is required.
Create a case summary.
Forward the case to an extension worker, agronomist, veterinary officer, or market advisor.
Generate a farmer-friendly summary and follow-up plan.
Future agent types include:

Crop Doctor Agent — crop diseases, pests, soil and yield issues
Livestock Agent — poultry, goats, sheep, cattle, vaccination and feeding guidance
Market Agent — price discovery, buyer matching, market trends
Weather Agent — rainfall, planting alerts, drought and flood warnings
Extension Agent — virtual extension education and best practices
Emergency Agricultural Agent — pest outbreaks, livestock mortality, flood/drought stress
📊 Research and Dataset Strategy
AgroLingo AI is also a research infrastructure project for low-resource African language AI.

The project is developing a Hausa agricultural dataset ecosystem:

Dataset	Name	Purpose
AGT	Agricultural Terminology Dataset	Hausa agricultural vocabulary, scientific mapping, dialect variants
AGG	Gold Agricultural Q&A Dataset	Farmer questions and validated advisory responses
AGC	Agricultural Conversation Dataset	Multi-turn farmer-agent dialogues
AGW	Weather Advisory Dataset	Weather-informed farming recommendations
AGM	Market Intelligence Dataset	Commodity prices and market trends
AGE	Farm Economics Dataset	Costs, ROI, profitability and farm planning
AGL	Livestock Intelligence Dataset	Poultry, cattle, goats, sheep and animal health support
AGI	Indigenous Agricultural Knowledge Dataset	Traditional farming knowledge and local ecological wisdom
AGB	Agricultural Benchmark Dataset	Model evaluation and leaderboard tasks
AGS	Agricultural Scenario/Speech Dataset	Voice-first and scenario-based agricultural AI evaluation
Dataset quality priorities
Before large-scale publishing, datasets are being improved through:

Deduplication
Farmer validation
Expert review
Dataset cards
Gold-standard answer sets
Evaluation methodology
Scientific citations
Ethical data collection and consent protocols
🏗️ Architecture
text

agrolingo-ai/
├── client-pwa/                  # React 19 + Vite + TypeScript + Tailwind
│   └── src/
│       ├── screens/             # App screens: Auth, Dashboard, Chat, etc.
│       ├── components/          # Reusable UI components
│       ├── store/               # Zustand global state
│       ├── lib/                 # Supabase client and API client
│       └── utils/               # Translations: Hausa, English, French
│
├── server/                      # Go 1.22 backend using Echo framework
│   ├── cmd/api/                 # Entry point, routes and middleware
│   └── internal/
│       ├── agent/               # AI orchestrator with tool calling
│       ├── handlers/            # HTTP route handlers
│       └── tools/               # Weather, market and farm record tools
│
├── supabase_schema.sql          # Complete database schema
├── .env.example                 # Environment variables template
├── README.md                    # Project documentation
└── LICENSE                      # MIT License
🧰 Tech Stack
Layer	Technology	Purpose
Frontend	React 19 + Vite	Fast modern PWA frontend
Language	TypeScript	Safer frontend development
Styling	Tailwind CSS 4 + Framer Motion	Responsive UI and animations
State	Zustand	Lightweight global state management
Backend	Go 1.22 + Echo	High-performance API backend
AI	Google Gemini 1.5 Flash	Multilingual reasoning and tool calling
Database	Supabase PostgreSQL	Auth, database and storage
Weather	Open-Meteo API	Free weather data source
Deployment	Vercel + Railway	Frontend and backend deployment
🚀 Quick Start
Prerequisites
Install or create the following:

Node.js 20+
Go 1.22+
Supabase account — supabase.com
Google AI Studio API key — aistudio.google.com
1. Clone the repository
Bash

git clone https://github.com/Rhibrahim15/agrolingo-ai.git
cd agrolingo-ai
2. Install frontend dependencies
Bash

cd client-pwa
npm install
3. Install backend dependencies
Bash

cd ../server
go mod tidy
4. Set up environment variables
From the project root:

Bash

cp .env.example .env
Then fill in the required values:

env

VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_BASE_URL=http://localhost:8080
Inside /server:

Bash

cp .env.example .env
Then add backend values such as:

env

SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_JWT_SECRET=your_jwt_secret
GEMINI_API_KEY=your_gemini_api_key
5. Set up Supabase database
Open your Supabase project.
Go to SQL Editor.
Create a new query.
Paste and run the contents of supabase_schema.sql.
Go to Storage and create these public buckets:
avatars — max 5MB, image files only
scans — max 10MB, image files only
6. Run locally
Terminal 1 — frontend:

Bash

cd client-pwa
npm run dev
Frontend should run at:

text

http://localhost:5173
Terminal 2 — backend:

Bash

cd server
go run cmd/api/main.go
Backend should run at:

text

http://localhost:8080
7. Verify backend health
Bash

curl http://localhost:8080/health
Expected response:

JSON

{
  "status": "healthy",
  "service": "AgroLingo AI Engine"
}
🌐 Deployment
Frontend → Vercel
Bash

cd client-pwa
npm install -g vercel
vercel
Set these environment variables in the Vercel dashboard:

env

VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_BASE_URL=your_railway_backend_url
Backend → Railway
Push the project to GitHub.
Go to railway.app.
Create a new project.
Select Deploy from GitHub.
Select the repository.
Set the root directory to /server.
Add backend environment variables from .env.
Deploy.
🔑 Environment Variables
See .env.example for the full list.

Variable	Description	Where to Get It
VITE_SUPABASE_URL	Supabase project URL	Supabase → Project Settings → API
VITE_SUPABASE_ANON_KEY	Public frontend Supabase key	Supabase → Project Settings → API
SUPABASE_SERVICE_ROLE_KEY	Backend service role key	Supabase → Project Settings → API
SUPABASE_JWT_SECRET	JWT verification secret	Supabase → Project Settings → API → JWT Settings
GEMINI_API_KEY	AI model API key	Google AI Studio
🌍 Language Support
Language	Code	Status
Hausa	ha	✅ Primary support
English	en	✅ Supported
French	fr	🟡 UI strings only
Fulfulde	ff	🔜 Planned
Kanuri	kr	🔜 Planned
Yoruba	yo	🔜 Future
Igbo	ig	🔜 Future
📱 PWA Features
Installable on mobile devices
Add-to-home-screen support
Offline app shell caching
Shareable through WhatsApp links or QR codes
Lightweight initial loading target
Useful for low-bandwidth environments
🔐 Security and Responsible AI
AgroLingo AI is designed with safety, privacy, and responsible AI principles in mind.

Current and planned safeguards include:

JWT authentication through Supabase Auth
Row Level Security on database tables
Admin role checks at frontend and backend levels
Input validation on forms and API requests
No secrets stored in client-side code
Consent-based farmer data collection
Anonymized and aggregated data use for research or institutional insights
Human expert escalation for uncertain or high-risk agricultural cases
AgroLingo AI does not replace qualified agricultural extension officers, veterinarians, agronomists, or emergency services. It is designed to support decision-making and improve access to agricultural guidance.

🗺️ Roadmap
Phase 1 — Evidence Foundation
Target: Month 1

Create validation and evidence folder
Collect first 30–50 farmer profiles
Identify 5–10 extension workers
Draft first 100 agricultural terminology entries
Document MVP screenshots and user feedback
Phase 2 — Dataset Cleanup and Validation
Target: Months 2–3

Reach 100 farmers
Engage 20 extension workers
Draft AGT, AGS and AGB dataset cards
Clean initial benchmark items
Prepare ethics and consent documents
Phase 3 — MVP Strengthening and Research Draft
Target: Months 4–6

Add feedback and anonymized query logging
Publish dataset repository v0.1
Create benchmark documentation
Draft first dataset paper
Build simple leaderboard prototype
Phase 4 — Pilot Expansion and Partnerships
Target: Months 7–9

Reach 300 farmers/interactions
Run pilot in 2–3 communities
Start 3–5 institutional partnership conversations
Prepare pitch deck and grant materials
Submit or finalize dataset paper
Phase 5 — Research, Funding and Agentic AI Planning
Target: Months 10–12

Reach 500 farmers/interactions
Engage 50 extension workers/practitioners
Release Dataset v1.0 and Benchmark v1.0
Submit dataset paper
Draft system paper
Design expert escalation and agentic AI workflow
📈 Key Target Metrics
Metric	3-Month Target	6-Month Target	12-Month Target
Farmer profiles/interactions	100	200	500
Real farmer questions collected	100	500	2,000
Extension workers engaged	20	30	50
Expert-reviewed dataset entries	100	300	1,000
Dataset cards	3 drafts	3–5 published	5+ complete
Partnership conversations	3	5–8	15+
Grant/fellowship applications	1–2	3	5+
🏆 Recognition and Status
Built by GreenByte Tech Co. — CAC Nigeria RC 9467262
Focused on Northern Nigerian smallholder farmers
African Union IEA 2026 grant application submitted
MVP stage with ongoing validation and dataset development
Research direction includes Hausa agricultural NLP, AI for agriculture, voice-first AI, and human-AI extension support
🤝 Contributing
AgroLingo AI welcomes collaboration from:

Hausa language experts
Agricultural extension workers
Agronomists and veterinarians
NLP and machine learning researchers
Frontend and backend developers
Data annotators
Farmer cooperatives and NGOs
Climate resilience organizations
Potential contribution areas:

Hausa agricultural terminology
Dataset validation
Expert review of agricultural advice
Benchmark design
Voice AI development
UI/UX for low-literacy users
Field testing and farmer interviews
👨‍💻 Author
Halifa Rabiu Ibrahim
Founder, GreenByte Tech Co.
Computer Science Graduate, Federal University Dutse
AI Researcher, Dataset Architect and Builder

📧 greenbyte.tech01@gmail.com

📄 License
MIT License — see LICENSE for details.

🌱 Final Note
AgroLingo AI is being built with a simple belief:

Farmers should not be excluded from the AI revolution because of language, literacy, location, or income.

The long-term goal is to build practical, trusted, and research-grade agricultural intelligence infrastructure for African farming communities.
