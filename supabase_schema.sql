-- ============================================================
-- AGROLINGO AI — SUPABASE DATABASE SCHEMA
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- ── PROFILES ─────────────────────────────────────────────────
-- Extends Supabase auth.users with farm-specific data
CREATE TABLE IF NOT EXISTS public.profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         TEXT,
  full_name     TEXT,
  farm_location TEXT,
  avatar_url    TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at    TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Auto-create profile on new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── CHAT MESSAGES ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role       TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content    TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON public.chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON public.chat_messages(created_at DESC);

-- ── FARM JOURNAL ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.farm_journal (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('Planting', 'Irrigation', 'Fertilizer', 'Harvest', 'Spraying', 'Other')),
  description   TEXT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_farm_journal_user_id ON public.farm_journal(user_id);

-- ── CROP PROGRESS ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.crop_progress (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  crop_type    TEXT NOT NULL,
  variety      TEXT,
  status       TEXT NOT NULL DEFAULT 'Growing' CHECK (status IN ('Growing', 'Harvested', 'Failed', 'Planned')),
  growth_stage INTEGER DEFAULT 0 CHECK (growth_stage BETWEEN 0 AND 100),
  area_ha      DECIMAL(5,2),
  planted_at   DATE,
  created_at   TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_crop_progress_user_id ON public.crop_progress(user_id);

-- ── MARKET INTELLIGENCE ───────────────────────────────────────
-- Admin updates these prices; all farmers can read
CREATE TABLE IF NOT EXISTS public.market_intelligence (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  crop_name         TEXT NOT NULL,
  price_per_measure DECIMAL(12,2) NOT NULL,
  measure_unit      TEXT DEFAULT '100kg bag',
  market_name       TEXT NOT NULL,
  trend             TEXT DEFAULT 'stable' CHECK (trend IN ('up', 'down', 'stable')),
  change_percent    DECIMAL(5,2) DEFAULT 0,
  insight           TEXT,
  updated_at        TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Seed with initial data
INSERT INTO public.market_intelligence (crop_name, price_per_measure, market_name, trend, change_percent, insight)
VALUES
  ('Groundnut', 85000, 'Dawanau, Kano', 'up', 12.0, 'Prices rising in Dambatta. Wait 3 days to sell for ~10% higher return.'),
  ('Maize', 35000, 'Dutse, Jigawa', 'stable', 0.0, 'Price stable. Dutse market offers best rates for bulk sellers.'),
  ('Millet', 38500, 'Dawanau, Kano', 'up', 8.0, 'Steady increase this month. Hold for another week to maximise returns.'),
  ('Cowpea', 120000, 'Kano Main', 'up', 5.0, 'Strong demand in Kano. Good time to sell now before demand eases.'),
  ('Sorghum', 42000, 'Kaduna', 'down', -3.0, 'Price dipping slightly. Hold stock 1-2 weeks — recovery expected.'),
  ('Tomato', 18000, 'Mile 12, Kano', 'down', -7.0, 'Seasonal glut. Consider processing or cold storage if possible.')
ON CONFLICT DO NOTHING;

-- ── BROADCASTS (Admin alerts) ─────────────────────────────────
CREATE TABLE IF NOT EXISTS public.broadcasts (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title      TEXT NOT NULL,
  message    TEXT NOT NULL,
  is_active  BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ── NOTIFICATIONS ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notification_history (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  message    TEXT NOT NULL,
  type       TEXT DEFAULT 'info' CHECK (type IN ('market', 'weather', 'pest', 'info')),
  is_read    BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notification_history(user_id);

-- ── ROW LEVEL SECURITY ────────────────────────────────────────
-- Enable RLS on all user tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farm_journal ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crop_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_history ENABLE ROW LEVEL SECURITY;

-- Market intelligence is public read
ALTER TABLE public.market_intelligence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broadcasts ENABLE ROW LEVEL SECURITY;

-- PROFILES: users can only read/update their own
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- CHAT MESSAGES: users can only see their own
CREATE POLICY "chat_messages_own" ON public.chat_messages FOR ALL USING (auth.uid() = user_id);

-- FARM JOURNAL: users can only see their own
CREATE POLICY "farm_journal_own" ON public.farm_journal FOR ALL USING (auth.uid() = user_id);

-- CROP PROGRESS: users can only see their own
CREATE POLICY "crop_progress_own" ON public.crop_progress FOR ALL USING (auth.uid() = user_id);

-- NOTIFICATIONS: users can only see their own
CREATE POLICY "notifications_own" ON public.notification_history FOR ALL USING (auth.uid() = user_id);

-- MARKET INTELLIGENCE: anyone authenticated can read
CREATE POLICY "market_read_all" ON public.market_intelligence FOR SELECT TO authenticated USING (true);

-- BROADCASTS: anyone authenticated can read active ones
CREATE POLICY "broadcasts_read_active" ON public.broadcasts FOR SELECT TO authenticated USING (is_active = true);

-- ── STORAGE BUCKETS ───────────────────────────────────────────
-- Run these in Supabase Dashboard → Storage → New Bucket
-- OR via API. They cannot be created via SQL directly.
-- 
-- Bucket 1: "avatars"   — Public, 5MB limit, image/* only
-- Bucket 2: "scans"     — Public, 10MB limit, image/* only
--
-- After creating, add these storage policies:
-- avatars: users can upload to their own folder (user_id/*)
-- scans: users can upload to their own folder (scans/user_id/*)

-- ── DONE ─────────────────────────────────────────────────────
-- After running this script:
-- 1. Go to Storage → Create "avatars" bucket (public)
-- 2. Go to Storage → Create "scans" bucket (public)
-- 3. Add storage policies for both buckets
-- 4. Copy your SUPABASE_URL and SUPABASE_ANON_KEY to .env
