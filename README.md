<p align="center">
  <img src="https://img.shields.io/badge/Expo-54-blue?logo=expo" alt="Expo SDK 54" />
  <img src="https://img.shields.io/badge/React_Native-0.81-61DAFB?logo=react" alt="React Native" />
  <img src="https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Supabase-Auth_&_DB-3ECF8E?logo=supabase" alt="Supabase" />
</p>

<h1 align="center">⚔️ SOLO</h1>
<p align="center"><strong>Level up your body. Train like a warrior.</strong></p>
<p align="center">A gamified fitness RPG that turns every workout into an adventure.<br/>Track exercises, earn XP, unlock milestones, and climb the leaderboard.</p>

<p align="center">
  <a href="https://solo-eslam24394.vercel.app">🌐 Live Demo</a>
</p>

---

## ✨ Features

### 🎮 RPG Progression System

- **XP & Leveling** — Earn XP from workouts with a scaling level system (levels 1–100+)
- **Stat Attributes** — Build **Strength**, **Endurance**, and **Discipline** based on exercise types
- **Milestones** — Unlock 20 titled milestones every 5 levels (e.g., _Iron Will_, _Warlord_)
- **Level-Up Celebrations** — Full-screen confetti, trophy animations, and random celebration words
- **Streak System** — Daily streaks with tiered labels (_On Fire_, _Beast Mode_, _Legendary_)

### 🏋️ Workout Tracking

- **Muscle Groups** — Chest, Back, Shoulders, Arms, Legs, Abs
- **Cardio** — Running, Cycling, Swimming, Jump Rope, HIIT
- **Stretching** — Yoga, Foam Rolling, Dynamic/Static Stretching, Pilates
- **Session Counter** — Track total sessions with daily bonus rewards

### 👤 User Profiles

- **Username & Email Auth** — Sign in with either email or username
- **Profile Editing** — Update name, DOB, gender, and username
- **Avatar Upload** — Custom profile photos via Supabase Storage
- **Gender-Specific Defaults** — Automatic default avatars

### 🏆 Leaderboard

- **Global Ranking** — Compete with all users by level and XP
- **Top 3 Podium** — Gold, silver, and bronze highlighting
- **Your Position** — Always visible in the rankings

### 🌍 Full Bilingual Support

- **English & Arabic (Egyptian dialect)** — Complete UI translations
- **RTL Layout** — Proper right-to-left support for Arabic
- **Custom Fonts** — Inter (English) + Cairo (Arabic) via Google Fonts

### 🎨 Theming

- **Dark & Light Mode** — Full theme support with smooth toggling
- **Consistent Design** — Cyan accent palette across all screens
- **Responsive Web** — Centered card layout optimized for desktop browsers

---

## 🛠️ Tech Stack

| Layer      | Technology                                                                        |
| ---------- | --------------------------------------------------------------------------------- |
| Framework  | [Expo SDK 54](https://expo.dev) + [React Native 0.81](https://reactnative.dev)    |
| Router     | [Expo Router v6](https://docs.expo.dev/router/introduction/) (file-based routing) |
| Language   | [TypeScript 5.8](https://www.typescriptlang.org/)                                 |
| Auth & DB  | [Supabase](https://supabase.com) (Auth, PostgreSQL, Storage)                      |
| Web Deploy | [Vercel](https://vercel.com) (auto-deploy on push)                                |
| Fonts      | [@expo-google-fonts](https://github.com/expo/google-fonts) (Inter + Cairo)        |
| Animations | React Native Animated API                                                         |
| Icons      | [MaterialCommunityIcons](https://materialdesignicons.com/)                        |

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- A [Supabase](https://supabase.com) project

### 1. Clone & Install

```bash
git clone https://github.com/eslammamdouh24/solo.git
cd solo
npm install
```

### 2. Environment Variables

Create a `.env.local` file in the root:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Supabase Setup

Run the SQL from [`SUPABASE_SETUP.md`](./SUPABASE_SETUP.md) in your Supabase SQL Editor to create:

- `game_states` table with all required columns
- Row Level Security (RLS) policies
- Username lookup function for sign-in

### 4. Run the App

```bash
# Web (recommended for development)
npm run web

# iOS Simulator
npm run ios

# Android Emulator
npm run android
```

### 5. Deploy to Vercel

```bash
npx expo export --platform web
npx vercel --prod
```

Or just push to `master` — Vercel auto-deploys on every push.

---

## 📁 Project Structure

```
solo/
├── app/                        # Expo Router screens
│   ├── _layout.tsx             # Root layout, auth guard, theming
│   ├── auth.tsx                # Sign in / Sign up / Forgot password
│   ├── index.tsx               # Home — workout selection & game state
│   ├── profile.tsx             # Profile editing, stats, milestones
│   └── leaderboard.tsx         # Global rankings
├── components/                 # Reusable UI components
│   ├── TopBar.tsx              # Navigation bar with logo & controls
│   ├── XPBar.tsx               # XP progress bar with streak display
│   ├── LevelUpCelebration.tsx  # Full-screen level-up animation
│   ├── MilestoneModal.tsx      # Milestone unlock celebration
│   ├── ConfirmationBottomSheet.tsx
│   ├── DropdownPicker.tsx      # Modernized dropdown component
│   ├── Toast.tsx               # Animated toast notifications
│   └── ...
├── constants/                  # App configuration
│   ├── theme-colors.ts         # Colors, spacing, typography tokens
│   ├── translations.ts         # EN/AR translation strings
│   ├── exercises.ts            # Muscle groups & cardio definitions
│   └── fonts.ts                # Font family helpers
├── contexts/                   # React Context providers
│   ├── AppContext.tsx           # Theme, language, layout state
│   └── AuthContext.tsx          # Supabase auth + username login
├── hooks/                      # Custom hooks
│   ├── useColors.ts            # Theme-aware color values
│   ├── useGameStateWithDB.ts   # Game state sync with Supabase
│   └── useSound.ts             # Sound effects (expo-audio)
├── utils/                      # Business logic
│   ├── xpCalculations.ts       # XP formula & level requirements
│   └── workoutProcessor.ts     # Workout → XP/stats conversion
└── lib/
    └── supabase.ts             # Supabase client initialization
```

---

## 📝 License

This project is for personal and educational use.

---

<p align="center">Built with ☕ and determination.</p>
