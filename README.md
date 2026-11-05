# 🏋️ Hevy Analytics Pro

A modern, high-performance fitness analytics and body recomposition dashboard built with **React 19**, **TypeScript**, **Tailwind CSS v4**, **Supabase (PostgreSQL)**, and **Vite**. 

Designed for lifters who track with [Hevy](https://hevy.com), featuring direct cloud synchronization, 1RM progression modeling, 52-week consistency heatmaps, muscle volume radar, body recomp metrics, and a mobile-first PWA experience.

---

## ✨ Features

### 1. 📊 Overview & Consistency
* **Bento KPI Grid:** Real-time metrics for Avg Weekly Volume, Total Sessions, Weekly Streak (consecutive active training weeks), and Total PRs.
* **52-Week Contribution Heatmap:** Interactive GitHub-style activity grid mapping daily training volume. Click any day to inspect workout sets, exercises, and volume breakdowns in an interactive modal.
* **Key Lift Sparklines:** Quick performance indicators and `% gain` for core compound lifts (e.g. Bench Press, Squats, Deadlifts, Pull-ups).
* **Monthly Trends:** Dual-axis visualization comparing training frequency (sessions/month) and total tonnage (kg/month).
* **Recent Activity Feed:** Detailed logs with expandable sets, weights, reps, RPE, and workout notes.

### 2. 🏋️ Exercise & PR Explorer
* **128 Exercises Indexed:** Categorized by primary and secondary muscle groups with smart typo and variant normalization.
* **1RM Progression Curve:** Historical progression charts tracking calculated 1RM (Epley formula), top set weight, and session volume.
* **Yearly PR Milestones:** Highlights all-time personal records segmented by year.
* **Complete Set History:** Searchable and filterable history of every set performed for a selected exercise.

### 3. 💪 Muscle Volume & Balance
* **Movement Category Breakdown:** Push, Pull, Legs, Arms, and Core distribution with set count percentages.
* **Muscle Volume Radar:** Visualizes training balance across Chest, Back, Quads, Hamstrings, Shoulders, Arms, and Core.
* **Fatigue & Volume Allocation:** Weekly set distribution compared against volume recommendations.
* **Anatomy Emoji Icons:** Intuitive icons for muscle groups (🍼 Chest, 🦅 Back, 🪖 Shoulders, 💪 Biceps, 🧱 Core).

### 4. ⚖️ Body & Recomposition
* **Weight vs. Lean Mass vs. Fat %:** Dual-axis chart tracking body composition changes over time.
* **V-Taper Analysis:** Automatic calculation of Shoulder-to-Waist and Chest-to-Waist ratios.
* **Circumference Measurements:** Trend lines for Neck, Chest, Arms, Waist, Hips, and Thighs.
* **Limb Symmetry Analyzer:** Compares Left vs. Right Bicep, Forearm, Thigh, and Calf measurements to detect imbalances.

### 5. ⚡ Cloud Sync & Automation
* **Direct Hevy API Integration:** One-click sync via Hevy Developer API (`/v1/workouts`), fetching new workouts incrementally without full re-downloads.
* **Database & File Sync:** Upserts data directly into **Supabase PostgreSQL** while maintaining a local CSV fallback (`raw/workout_data.csv`).
* **Automated Midnight Sync:** Pre-configured **GitHub Actions Workflow** that automatically syncs workouts every night at midnight (00:00 Bangkok Time).

### 6. 📱 Mobile-First & PWA
* **Bottom Navigation Bar:** Native mobile feel with quick thumb-accessible tab switching on small screens.
* **Touch-Friendly Heatmap:** Smooth horizontal scrolling on mobile viewports.
* **Installable PWA:** Add to Home Screen on iOS and Android with custom splash screen and icons.
* **Optional PIN Security:** Screen lock protection via 4-6 digit passcode (`VITE_APP_PIN`).

---

## 🛠️ Tech Stack

* **Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4, Lucide Icons
* **Charts & Visualizations:** Recharts
* **Database:** Supabase (PostgreSQL with Row Level Security & Indexes)
* **Backend / Serverless:** Vercel Serverless Functions & Vite Middleware proxy
* **Automation:** GitHub Actions Cron Job
* **Data Parsing:** PapaParse (RFC 4180 CSV parser & serializer)

---

## 🚀 Getting Started

### Prerequisites
* **Node.js:** v18.0.0 or higher
* **npm:** v9.0.0 or higher
* **Hevy Account:** Hevy Pro with a Developer API Key ([hevy.com/settings?developer](https://hevy.com/settings?developer))
* **Supabase Project:** Free tier account on [supabase.com](https://supabase.com)

### 1. Clone & Install
```bash
git clone <your-repo-url>
cd hevy-dashboard
npm install
```

### 2. Environment Setup
Create a `.env.local` file in the project root:
```bash
cp .env.example .env.local
```

Fill in your credentials:
```env
# Hevy API Key (from hevy.com/settings?developer)
HEVY_API_KEY=your_hevy_api_key_here

# Supabase Credentials
SUPABASE_PROJECT_URL=https://your-project-ref.supabase.co
SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key_here
SUPABASE_POSTGRES_CONNECTION_STRING=postgresql://postgres:password@db.your-project-ref.supabase.co:5432/postgres

# Optional: PIN Code (4-8 digits) to lock the dashboard
VITE_APP_PIN=
```

### 3. Database Migration
If starting fresh or importing existing CSV data into Supabase:
```bash
# 1. Apply table schemas and indexes
node -e "
const fs = require('fs');
const { Client } = require('pg');
const sql = fs.readFileSync('supabase/schema.sql', 'utf8');
const client = new Client({ connectionString: process.env.SUPABASE_POSTGRES_CONNECTION_STRING, ssl: { rejectUnauthorized: false } });
client.connect().then(() => client.query(sql)).then(() => console.log('Schema ready!')).finally(() => client.end());
"

# 2. Migrate existing raw CSV records to Supabase
node scripts/migrateCsvToSupabase.js
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🚢 Production Deployment (Vercel)

### 1. Deploy with Vercel
1. Push your repository to **GitHub** (set to **Private**).
2. Go to [vercel.com](https://vercel.com) and click **"Add New Project"**.
3. Import your GitHub repository.
4. Add the following **Environment Variables** in Vercel project settings:
   * `HEVY_API_KEY`
   * `SUPABASE_PROJECT_URL`
   * `SUPABASE_PUBLISHABLE_KEY`
   * `SUPABASE_POSTGRES_CONNECTION_STRING`
   * `VITE_APP_PIN` *(Optional)*
5. Click **Deploy**.

### 2. Enable Automated Nightly Sync (GitHub Actions)
In your GitHub repository:
1. Navigate to **Settings > Secrets and variables > Actions**.
2. Click **New repository secret** and add:
   * `HEVY_API_KEY`
   * `SUPABASE_POSTGRES_CONNECTION_STRING`
   * `SUPABASE_PROJECT_URL`
   * `SUPABASE_PUBLISHABLE_KEY`
3. GitHub Actions will now automatically pull new workouts from Hevy into Supabase every midnight!

---

## 📱 Mobile Installation (PWA)

* **iOS (Safari):** Open your Vercel URL ➔ Tap the **Share** button ➔ Select **"Add to Home Screen"**.
* **Android (Chrome):** Open your Vercel URL ➔ Tap the **Three Dots menu** (⋮) ➔ Select **"Install App"** or **"Add to Home Screen"**.

---

## 📁 Project Structure

```
hevy-dashboard/
├── .github/workflows/          # GitHub Actions automated midnight sync
├── api/                        # Vercel Serverless Functions (/api/sync-hevy)
├── public/                     # Static assets, PWA manifest, and app icons
├── raw/                        # Local CSV files (workout_data.csv, measurement_data.csv)
├── scripts/                    # Database migration & CLI sync scripts
├── src/
│   ├── components/
│   │   ├── body/               # Body recomposition & symmetry components
│   │   ├── exercises/          # Exercise explorer & PR progression charts
│   │   ├── layout/             # Header, Bottom Nav, Date Range Picker
│   │   ├── muscles/            # Muscle radar & volume balance views
│   │   └── overview/           # Bento KPIs, Heatmap, Sparklines, Trends
│   ├── config/                 # Muscle mappings, exercise aliases, anatomy icons
│   ├── lib/                    # Supabase client initialization
│   ├── server/                 # Hevy API incremental sync engine
│   ├── types/                  # TypeScript interfaces & domain models
│   ├── utils/                  # Analytics computation & data loaders
│   ├── App.tsx                 # Main application dashboard
│   └── main.tsx                # React root entry point
├── supabase/                   # PostgreSQL schema DDL files
├── vercel.json                 # Vercel SPA rewrites & serverless configuration
├── vite.config.ts              # Vite plugins, proxy middlewares, & build config
└── package.json
```

---

## 🔒 Security & Privacy

* **Zero Secret Leakage:** All API keys and connection strings are strictly kept on the server/serverless layer and excluded from the client bundle.
* **Row Level Security (RLS):** Supabase tables are guarded with PostgreSQL RLS policies.
* **Passcode Protection:** Optional PIN code locks both dashboard visualization and trigger actions when deployed to a public URL.

---

## 📄 License
ISC License. Built for personal fitness tracking and analytics.

