# MenuWise

**AI-Powered Personalized Restaurant Menu Assistant**

MenuWise helps you make smarter, healthier choices at restaurants. Open the app, take a short video of the menu, and receive personalized dish recommendations based on your goals, health history, dietary preferences, and biological needs — all powered by a multi-agent AI pipeline.

---

## Table of Contents

1. [Features](#features)
2. [New in This Release](#new-in-this-release)
3. [How It Works](#how-it-works)
4. [Tech Stack](#tech-stack)
5. [System Architecture](#system-architecture)
6. [AI Transparency](#ai-transparency)
7. [Getting Started](#getting-started)
8. [Project Structure](#project-structure)
9. [Environment Variables](#environment-variables)
10. [API Reference](#api-reference)
11. [Database Schema](#database-schema)
12. [Scoring Algorithm](#scoring-algorithm)
13. [Caching Strategy](#caching-strategy)
14. [Scaling Guide](#scaling-guide)
15. [Privacy & Data Policy](#privacy--data-policy)
16. [Medical Disclaimer](#medical-disclaimer)
17. [Contributing](#contributing)
18. [License](#license)

---

## Features

### Core

- **Video-based menu scanning** — Record a short clip flipping through any restaurant menu. No tap-to-capture required.
- **AI menu intelligence** — Multimodal LLM (Claude Vision) extracts every dish, price, and description from your video frames, even on challenging menus.
- **OCR fallback** — For low-confidence frames, Google Vision API document detection kicks in automatically.
- **Personalized recommendations** — Dishes are scored and ranked against your unique biological needs profile using a weighted nutrient dot-product algorithm.
- **Explainable recommendations** — Every recommended dish comes with a short AI-generated explanation of why it matches your goal.
- **Streamed results** — Recommendations appear on screen within seconds, not after a long wait.

### Health Profile

- **Goal setting** — Weight loss, muscle building, maintenance, longevity, or condition management.
- **Dietary preferences** — Vegan, vegetarian, keto, halal, kosher, gluten-free, and more.
- **Allergy tracking** — Declare allergies; allergen-flagged dishes are automatically excluded from recommendations.
- **Health history** — Log personal health conditions (diabetes type 2, hypertension, PCOS, IBD, etc.) that influence your nutrient priority profile.
- **Menstrual cycle tracking** — Women can log period dates. The app adjusts micronutrient priorities (iron, magnesium, B6) in the week before and during menstruation.
- **Profile photo** — Personalize your account with a profile picture.

### Weekly Calorie Tracker

- **Daily calorie log** — Every meal you log contributes to your weekly intake total.
- **Goal-adaptive targets** — Your daily calorie target is computed from your TDEE and current goal.
- **Weekly trend view** — A 7-day bar chart showing actual intake vs target, broken down by meal.
- **Streak tracking** — Consecutive days within calorie target are tracked and celebrated.

### Settings & Account

- **Profile editor** — Update name, photo, biometrics, and goals at any time.
- **Health history manager** — Add, edit, or remove health conditions and cycle dates.
- **Notification preferences** — Control daily reminders and weekly summary push notifications.
- **Data export** — Download all your personal data as JSON.
- **Account deletion** — Permanently delete all data within 30 days of request.

### Privacy & Transparency

- **AI disclosure** — Every scan screen displays a clear banner indicating AI is analyzing the menu.
- **Confidence indicators** — Dishes extracted with lower confidence are flagged with a visual indicator.
- **Estimated nutrition labels** — Nutrition values derived from LLM estimation (not a database match) are marked with `~` and an "Estimated" badge.
- **Privacy Policy** — Accessible in-app under Settings > Privacy Policy.

---

## New in This Release

| Feature | Description |
|---|---|
| Profile photo | Upload or capture a photo for your account |
| Health history | Log personal medical conditions and menstrual cycle dates |
| Menstrual cycle awareness | Nutrient priorities automatically adjusted around cycle phases |
| Weekly calorie tracker | 7-day intake chart with goal vs actual comparison |
| AI scan disclosure | Clear in-app banner during every menu scan |
| Privacy Policy screen | Full policy accessible from Settings |
| Profile editor | Edit all profile fields including new health history fields |

---

## How It Works

### The scan flow

```
User records video (10–30s)
        │
        ▼
On-device: gyro stabilisation + blur filtering + keyframe extraction (1 frame/1.5s)
        │
        ▼
Frames uploaded to S3 (JPEG, 1080p, ~2–4MB total)
        │
        ▼
Vision Agent: multimodal LLM parses each frame → structured dish JSON
        │  (parallel)
        ├── OCR Fallback: Google Vision API for low-confidence frames
        └── Nutrition Agent: USDA / Edamam lookup per dish
        │
        ▼
Merge + deduplicate dishes across frames (Levenshtein fuzzy match)
        │
        ▼
Bio-needs Agent: loads user profile → computes TDEE → builds NutrientPriorityVector
        │
        ▼
Ranking Agent: dot-product(dish_nutrients, priority_vector) → filter allergies → top 5
        │
        ▼
Explain Agent: per-dish LLM narrative → "why this dish helps your goal"
        │
        ▼
WebSocket push → mobile UI (results stream in as they resolve)
```

### The scoring formula

```
score(dish) = Σ [ normalise(dish[nutrient], RDA) × priority_vector[nutrient] ]
```

Goal-specific multipliers are applied on top:
- **Muscle building** — dishes with `protein_g > 25` receive a 1.25× multiplier.
- **Weight loss** — dishes with `calories < 500` receive a 1.15× multiplier.
- **Longevity** — dishes with `fiber_g > 8` receive a 1.10× multiplier.

Dishes containing declared allergens are scored at `-Infinity` and never surfaced.

### Menstrual cycle awareness

When a user has logged period dates, the Bio-needs Agent applies phase-specific weight adjustments to the `NutrientPriorityVector`:

| Cycle Phase | Days | Adjustments |
|---|---|---|
| Menstrual | 1–5 | Iron +0.4, Magnesium +0.3, B6 +0.2 |
| Follicular | 6–13 | No adjustment |
| Ovulatory | 14–16 | Zinc +0.2, Antioxidants +0.2 |
| Luteal | 17–28 | Magnesium +0.3, B6 +0.3, Calcium +0.2 |

These adjustments are applied on top of the user's base goal profile, not as a replacement.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Mobile | React Native (Expo SDK 52) |
| Camera | react-native-vision-camera v4 |
| Backend services | Node.js 22, TypeScript |
| Container orchestration | AWS ECS Fargate |
| Job queue | AWS SQS + Lambda |
| Primary database | PostgreSQL 16 |
| Vector search | pgvector (IVFFlat index) |
| Cache | Redis 7 (Cluster mode) |
| Object storage | AWS S3 |
| CDN | AWS CloudFront |
| AI — vision + agents | Anthropic Claude (Opus for vision, Sonnet for reasoning, Haiku for structuring) |
| AI — OCR fallback | Google Cloud Vision API |
| Nutrition data | USDA FoodData Central, Edamam |
| Auth | Supabase Auth (JWT + OAuth) |
| Observability | Datadog (APM + logs + dashboards) |
| Infrastructure as code | Terraform |

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Mobile Client (React Native)                │
│   Onboarding · Camera scan · Recommendation feed · History      │
│   Settings · Profile editor · Weekly calorie tracker           │
└────────────────────────┬────────────────────────────────────────┘
                         │ HTTPS + WebSocket
                         ▼
              ┌──────────────────────┐
              │  CloudFront CDN + WAF │
              └──────────┬───────────┘
                         │
              ┌──────────▼───────────┐
              │  Application Load    │
              │  Balancer (ALB)      │
              └──────┬───────┬───────┘
                     │       │
          ┌──────────▼──┐ ┌──▼──────────┐
          │ API Service │ │Agent Service│
          │ (ECS pods)  │ │ (ECS pods)  │
          │ Auth·Profile│ │Vision·Score │
          │ WS Hub      │ │Explain·Bio  │
          └──────┬──────┘ └──────┬──────┘
                 │               │
          ┌──────▼───────────────▼──────┐
          │         SQS Queues          │
          │  scan-frames · enrichment   │
          │  notifications · corrections│
          └──────────────┬──────────────┘
                         │
          ┌──────────────▼──────────────┐
          │       Lambda workers        │
          │  frame_processor (x0–1000)  │
          │  nutrition_enricher         │
          └──────────────┬──────────────┘
                         │
    ┌────────────────────▼─────────────────────┐
    │                Data Layer                │
    │  Postgres (primary + 2 read replicas)    │
    │  pgvector (dish corpus, IVFFlat)         │
    │  Redis Cluster (sessions, NPV, cache)    │
    │  S3 (frames, training data)              │
    └──────────────────────────────────────────┘
                         │
    ┌────────────────────▼─────────────────────┐
    │           External Integrations          │
    │  Anthropic API · Google Vision           │
    │  USDA FoodData · Edamam                  │
    │  Supabase Auth · Datadog                 │
    └──────────────────────────────────────────┘
```

---

## AI Transparency

MenuWise is powered by artificial intelligence at several points in the recommendation pipeline. We believe users have a right to know when AI is involved.

### Where AI is used

| Step | AI model | What it does |
|---|---|---|
| Menu parsing | Claude Opus (vision) | Reads menu frames, extracts dish names, descriptions, prices |
| OCR fallback | Google Vision API | Recovers text from low-quality frames |
| OCR structuring | Claude Haiku | Converts raw OCR text into structured dish data |
| Biological needs | Claude Sonnet | Computes your nutrient priorities from your profile |
| Ranking | Claude Haiku | Applies scoring formula, filters allergens |
| Explanations | Claude Sonnet | Writes why each dish matches your goal |
| Nutrition estimation | Claude Sonnet | Estimates macros for dishes not in nutrition databases |

### What AI cannot do

- AI **cannot verify** what ingredients a dish actually contains. It can only read what is printed on the menu.
- AI **cannot replace** a registered dietitian or physician.
- AI **cannot guarantee** that allergen information visible on the menu is complete or accurate.
- Nutrition values marked with `~` are **estimates** produced by AI inference, not laboratory-verified data.

### Disclosure in the app

Every scan session displays a persistent banner: *"AI is analysing this menu — results may not be 100% accurate."* This banner cannot be dismissed. It remains visible until the scan is complete and recommendations are displayed.

---

## Getting Started

### Prerequisites

- Node.js >= 22
- Expo CLI >= 6
- AWS account (for S3, SQS, Lambda, ECS)
- Anthropic API key
- Google Cloud project with Vision API enabled
- Supabase project
- PostgreSQL 16 with `pgvector` extension
- Redis 7

### Installation

```bash
# Clone the repository
git clone https://github.com/anu-ship-it/Nutrilens
cd Nutrilens

# Install dependencies
npm install

# Install mobile dependencies
cd mobile && npm install && cd ..

# Copy environment template
cp .env.example .env
# Fill in all required values — see Environment Variables section

# Run database migrations
npm run db:migrate

# Start development server
npm run dev
```

### Running the mobile app

```bash
cd mobile
npx expo start

# Android
npx expo run:android

# iOS
npx expo run:ios
```

### Running the backend

```bash
# API service
npm run start:api

# Agent service
npm run start:agents

# Worker (local BullMQ for development)
npm run start:worker
```

---

## Project Structure

```
Nutrilens/
├── mobile/                        # React Native (Expo) application
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login.tsx
│   │   │   └── signup.tsx
│   │   ├── (onboarding)/
│   │   │   ├── goals.tsx          # Goal selection screen
│   │   │   ├── dietary.tsx        # Dietary restrictions + allergies
│   │   │   ├── biometrics.tsx     # Age, weight, height
│   │   │   ├── activity.tsx       # Activity level
│   │   │   └── health-history.tsx # Medical conditions + cycle dates
│   │   └── (tabs)/
│   │       ├── scan.tsx           # Camera + upload flow
│   │       ├── results.tsx        # Recommendation feed (WebSocket)
│   │       ├── tracker.tsx        # Weekly calorie tracker
│   │       ├── history.tsx        # Past scans + meal log
│   │       └── settings/
│   │           ├── index.tsx      # Settings menu
│   │           ├── profile.tsx    # Profile editor + photo
│   │           ├── health.tsx     # Health history + cycle dates
│   │           ├── notifications.tsx
│   │           ├── privacy.tsx    # Privacy Policy screen
│   │           └── delete.tsx     # Account deletion
│   ├── components/
│   │   ├── DishCard.tsx           # Score ring + nutrient badges + explanation
│   │   ├── ScanCamera.tsx         # expo-camera + frame extraction
│   │   ├── AIDisclosureBanner.tsx # Persistent AI transparency banner
│   │   ├── NutrientBadge.tsx      # "High protein", "Low sodium" pills
│   │   ├── CalorieChart.tsx       # 7-day weekly bar chart
│   │   ├── CyclePhaseCard.tsx     # Cycle phase + active adjustments
│   │   ├── SkeletonFeed.tsx       # Loading state during WebSocket stream
│   │   └── ProfilePhoto.tsx       # Avatar upload + crop component
│   ├── hooks/
│   │   ├── useRecommendations.ts  # WebSocket hook, streams dishes
│   │   ├── useScanUpload.ts       # Multipart upload + progress
│   │   ├── useProfile.ts          # Profile CRUD + cache
│   │   ├── useCalorieTracker.ts   # Weekly calorie aggregation
│   │   └── useCyclePhase.ts       # Current phase from period dates
│   └── services/
│       ├── api.ts                 # REST client (Axios + interceptors)
│       ├── socket.ts              # WebSocket manager (reconnect logic)
│       └── storage.ts             # AsyncStorage wrapper
│
├── services/
│   ├── api/                       # API Gateway / BFF service
│   │   ├── routes/
│   │   │   ├── auth.ts
│   │   │   ├── profile.ts
│   │   │   ├── scan.ts
│   │   │   ├── tracker.ts
│   │   │   └── websocket.ts
│   │   └── middleware/
│   │       ├── auth.ts
│   │       └── rateLimit.ts
│   │
│   ├── agents/                    # AI Agent orchestration service
│   │   ├── orchestrator.ts        # LangGraph orchestration
│   │   ├── visionAgent.ts         # Frame parsing + OCR fallback
│   │   ├── bioNeedsAgent.ts       # TDEE + NutrientPriorityVector
│   │   ├── nutritionAgent.ts      # USDA + Edamam + LLM fallback
│   │   ├── rankingAgent.ts        # Dot-product scorer
│   │   ├── explainAgent.ts        # Per-dish LLM narrative
│   │   └── tools/
│   │       ├── visionApi.ts
│   │       ├── tdeeCalc.ts
│   │       ├── usdaLookup.ts
│   │       └── llmEstimate.ts
│   │
│   └── workers/                   # SQS Lambda workers
│       ├── frameProcessor.ts
│       ├── nutritionEnricher.ts
│       └── correctionIngester.ts
│
├── db/
│   ├── migrations/                # Ordered SQL migration files
│   └── schema.sql                 # Full schema reference
│
├── infrastructure/                # Terraform IaC
│   ├── ecs.tf
│   ├── sqs.tf
│   ├── rds.tf
│   ├── redis.tf
│   └── s3.tf
│
└── docs/
    ├── PRIVACY_POLICY.md
    ├── TERMS_OF_SERVICE.md
    ├── MEDICAL_DISCLAIMER.md
    └── SCORING_ALGORITHM.md
```

---

## Environment Variables

```bash
# ── Anthropic ──────────────────────────────────────
ANTHROPIC_API_KEY=sk-ant-...

# ── Google Cloud ───────────────────────────────────
GOOGLE_VISION_API_KEY=...
GOOGLE_CLOUD_PROJECT=Nutrilens-prod

# ── Database ───────────────────────────────────────
DATABASE_URL=postgresql://user:pass@host:5432/Nutrilens
DATABASE_REPLICA_URL=postgresql://user:pass@replica:5432/Nutrilens

# ── Redis ──────────────────────────────────────────
REDIS_URL=redis://host:6379

# ── AWS ────────────────────────────────────────────
AWS_REGION=ap-south-1
AWS_S3_BUCKET=menuwise-frames-prod
AWS_SQS_SCAN_QUEUE_URL=https://sqs.ap-south-1.amazonaws.com/...
AWS_SQS_ENRICHMENT_QUEUE_URL=https://sqs.ap-south-1.amazonaws.com/...

# ── Auth ───────────────────────────────────────────
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=eyJ...
JWT_SECRET=...

# ── Nutrition APIs ─────────────────────────────────
USDA_API_KEY=...
EDAMAM_APP_ID=...
EDAMAM_APP_KEY=...

# ── App ────────────────────────────────────────────
NODE_ENV=production
PORT=3000
LOG_LEVEL=info
```

---

## API Reference

### Authentication

All endpoints require `Authorization: Bearer <jwt>` except `/auth/*`.

### Profile

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/profile` | Fetch current user profile |
| `PUT` | `/profile` | Update profile fields |
| `POST` | `/profile/photo` | Upload profile photo (multipart) |
| `GET` | `/profile/health-history` | Get health conditions + cycle dates |
| `PUT` | `/profile/health-history` | Update health history |
| `DELETE` | `/profile` | Request account deletion |

### Scan

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/scan/init` | Initiate a scan session, returns `scanId` + S3 presigned URLs |
| `POST` | `/scan/:id/complete` | Signal upload complete, starts processing |
| `GET` | `/scan/:id` | Get scan status + results |
| `WS` | `/scan/:id/stream` | WebSocket — streams recommendations as they resolve |
| `PATCH` | `/scan/:id/dish/:dishId` | Submit user correction for a dish |

### Calorie Tracker

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/tracker/week` | Weekly calorie summary (7 days) |
| `POST` | `/tracker/log` | Log a meal from a recommendation |
| `GET` | `/tracker/streak` | Current within-target streak |

### Settings

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/settings/notifications` | Get notification preferences |
| `PUT` | `/settings/notifications` | Update notification preferences |
| `GET` | `/settings/export` | Request personal data export (async) |
| `GET` | `/privacy-policy` | Fetch current privacy policy text |

---

## Database Schema

### Core tables

```sql
-- Users
CREATE TABLE users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email           TEXT UNIQUE NOT NULL,
  hashed_password TEXT NOT NULL,
  created_at      TIMESTAMP DEFAULT now(),
  last_login      TIMESTAMP
);

-- User profiles
CREATE TABLE user_profiles (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 UUID REFERENCES users(id) ON DELETE CASCADE,
  display_name            TEXT,
  photo_url               TEXT,
  age                     INT,
  sex                     TEXT,
  height_cm               FLOAT,
  weight_kg               FLOAT,
  goal                    TEXT CHECK (goal IN (
                            'weight_loss','muscle_building',
                            'maintenance','longevity','condition_management'
                          )),
  activity_level          TEXT,
  dietary_restrictions    TEXT[],
  allergies               TEXT[],
  condition               TEXT,
  nutrient_priority_vector JSONB,
  updated_at              TIMESTAMP DEFAULT now()
);

-- Health history (conditions + cycle dates)
CREATE TABLE health_history (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES users(id) ON DELETE CASCADE,
  entry_type    TEXT CHECK (entry_type IN ('condition', 'cycle_start')),
  label         TEXT,         -- e.g. "Type 2 Diabetes", "Period start"
  onset_date    DATE,
  notes         TEXT,
  created_at    TIMESTAMP DEFAULT now()
);

-- Scan sessions
CREATE TABLE scan_sessions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID REFERENCES users(id),
  s3_video_key     TEXT,
  restaurant_name  TEXT,
  status           TEXT DEFAULT 'pending',
  created_at       TIMESTAMP DEFAULT now(),
  processing_ms    INT
) PARTITION BY RANGE (created_at);

-- Dishes extracted from a scan
CREATE TABLE dishes (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_session_id  UUID REFERENCES scan_sessions(id),
  name             TEXT NOT NULL,
  price            NUMERIC,
  currency_symbol  TEXT,
  description      TEXT,
  tags             TEXT[],
  nutrient_profile JSONB,
  vision_confidence FLOAT,
  source           TEXT,       -- 'vision' | 'ocr_fallback' | 'corpus_cache'
  estimated        BOOLEAN DEFAULT false
);

-- Ranked recommendations
CREATE TABLE recommendations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_session_id UUID REFERENCES scan_sessions(id),
  dish_id         UUID REFERENCES dishes(id),
  rank            INT,
  score           FLOAT,
  explanation     TEXT,
  user_selected   BOOLEAN DEFAULT false,
  created_at      TIMESTAMP DEFAULT now()
);

-- Meal log + calorie tracker
CREATE TABLE meal_log (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID REFERENCES users(id),
  recommendation_id UUID REFERENCES recommendations(id),
  eaten_at          TIMESTAMP DEFAULT now(),
  calories_logged   INT,
  feedback          TEXT,
  rating            INT CHECK (rating BETWEEN 1 AND 5)
);

-- Global dish corpus (shared across all users, powers cache)
CREATE TABLE dish_corpus (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_name   TEXT NOT NULL,
  embedding        VECTOR(1536),
  nutrient_profile JSONB NOT NULL,
  confidence       FLOAT,
  source           TEXT,
  seen_count       INT DEFAULT 1,
  last_seen        TIMESTAMP DEFAULT now()
);

CREATE INDEX dish_corpus_embedding_idx
  ON dish_corpus USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);
```

---

## Scoring Algorithm

The core scoring function is a weighted dot product between the dish's nutrient profile and the user's `NutrientPriorityVector`, normalized against recommended daily allowances.

```typescript
function scoreDish(
  dish: DishNutrientProfile,
  vector: NutrientPriorityVector,
  goal: UserGoal,
  allergies: string[]
): number {
  // Hard exclusion — allergens always score -Infinity
  if (hasAllergen(dish, allergies)) return -Infinity;

  let score = 0;

  for (const [nutrient, weight] of Object.entries(vector)) {
    const dishValue = dish[nutrient] ?? 0;
    const normalised = normaliseToRDA(nutrient, dishValue); // 0.0 – 1.0
    score += normalised * weight;
  }

  // Goal multipliers
  if (goal === 'muscle_building' && dish.protein_g > 25)  score *= 1.25;
  if (goal === 'weight_loss'     && dish.calories  < 500) score *= 1.15;
  if (goal === 'longevity'       && dish.fiber_g   > 8)   score *= 1.10;

  return Math.min(score, 1.0);
}
```

The `NutrientPriorityVector` is computed by the Bio-needs Agent on first profile creation and cached in Redis with a 7-day TTL. It is invalidated when the user updates their profile or health history. Menstrual cycle phase adjustments are applied at query time as additive offsets.

---

## Caching Strategy

Three independent cache layers reduce LLM API costs as the user base grows.

| Cache | Key | TTL | Hit rate target |
|---|---|---|---|
| NutrientPriorityVector | `npv:{user_id}:{profile_hash}` | 7 days | > 90% |
| Dish nutrition | `dish:{restaurant_id}:{dish_slug}` | 24 hours | > 70% at 3 months |
| Explanation text | `explain:{dish_slug}:{goal}` | 30 days | > 40% at 6 months |
| Restaurant menu corpus | pgvector similarity search | permanent | grows over time |

At 70% dish cache hit rate, the per-scan LLM cost reduces from ~$0.068 to ~$0.022.

---

## Scaling Guide

### Phase 1 — 0 to 10k DAU

Single-region deployment. Single Postgres instance. BullMQ on EC2. Focus on cache hit rate and correct rate limiting.

**Key metric targets:**
- Scan success rate > 90%
- P95 scan latency < 4 seconds
- LLM cost per DAU < $0.07/day

### Phase 2 — 10k to 200k DAU

- Add Postgres read replicas (2 minimum)
- Migrate job queue from BullMQ to AWS SQS + Lambda (auto-scaling to 1000 concurrent)
- Enable Redis Cluster
- Introduce multi-model LLM routing (Opus for vision, Sonnet for reasoning, Haiku for simple structuring)
- Partition `scan_sessions` and `recommendations` tables by month
- Add CloudFront CDN for frame assets

### Phase 3 — 200k to 1M+ DAU

- Multi-region active-active deployment (ap-south-1 + us-east-1)
- Aurora Global Database for user profiles (< 1s cross-region replication)
- Fine-tune a custom vision model on accumulated correction dataset
- Migrate to Kafka for event streaming
- Shard Postgres by `user_id` for write-heavy tables

---

## Privacy & Data Policy

Nutrilens collects and processes health data including body metrics, medical conditions, dietary restrictions, menstrual cycle dates, and meal history. This data is classified as **sensitive personal data** under the Digital Personal Data Protection Act 2023 (India) and as **special category data** under GDPR.

**What we collect:** Profile data, health history, scan session data, meal logs, device identifiers, and usage analytics.

**What we do not collect:** Raw video files are deleted from S3 within 24 hours of scan completion. Only extracted keyframes are retained for quality review, and only with explicit user consent.

**Third-party processors:** Anthropic (LLM processing), Google Cloud (Vision API), AWS (infrastructure). Data Processing Agreements are in place with each provider.

**Your rights:**
- Access all your data via Settings > Export My Data
- Correct inaccurate data via the Profile editor
- Delete all data via Settings > Delete Account (processed within 30 days)
- Withdraw consent for health data processing at any time

**Full privacy policy:** Available in-app at Settings > Privacy Policy and at `https://Nutrilens.app/privacy`.

---

## Medical Disclaimer

MenuWise is a general wellness tool. It is **not a medical device**, **not a clinical nutrition service**, and **not a substitute for professional medical or dietary advice**.

- Do not use MenuWise to manage a diagnosed medical condition without consulting your healthcare provider.
- Allergen information is extracted from visible menu text only. MenuWise **cannot guarantee** that all allergens present in a dish are declared on the menu. Always inform restaurant staff of severe allergies.
- Nutrition values are sourced from third-party databases and AI estimation. They are approximations and may differ significantly from actual dish composition.
- Users with Type 1 diabetes, active eating disorders, or post-bariatric surgery are strongly advised to consult a registered dietitian before using this app.

---

## Contributing

1. Fork the repository and create a feature branch: `git checkout -b feat/your-feature`
2. Write tests for new logic, especially scoring and agent prompt changes
3. Run the full test suite: `npm test`
4. Ensure all new environment variables are documented in `.env.example`
5. Submit a pull request with a clear description of the change and its motivation

### Commit convention

```
feat: add menstrual cycle phase nutrient adjustment
fix: correct Levenshtein threshold for non-Latin dish names
docs: update scoring algorithm documentation
chore: upgrade Claude SDK to 1.4.0
```

### Running tests

```bash
npm test                  # Full suite
npm run test:agents       # Agent unit tests only
npm run test:scoring      # Scoring algorithm tests
npm run test:integration  # End-to-end scan flow (requires API keys)
```

---

## License

Copyright 2026 MenuWise. All rights reserved.

This software is proprietary and confidential. Unauthorized copying, distribution, modification, or use of this software is strictly prohibited.

---

*Built with care for everyone trying to eat better, one restaurant at a time.*
