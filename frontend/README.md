# LegalRadar — Frontend

A web portal for tracking and searching EU and Slovenian legislation, built with Vite + React + TypeScript.

---

## Overview

LegalRadar helps legal professionals stay on top of relevant regulatory changes. Users set up their law areas and business needs in a profile, then search for recent legislation filtered by time range and region. Results are scored by relevance, filterable by phase and area, and can be bookmarked for later reference.

---

## Tech Stack

- **Vite** — build tool and dev server
- **React 18** + **TypeScript**
- **Tailwind CSS** — utility-first styling
- **shadcn/ui** — component primitives
- **Firebase** — authentication and Firestore (bookmarks, user profiles)
- **React Router** — client-side routing

---

## Features

- 🔍 **Legislation search** — fetches laws from the LegalRadar API filtered by time range (1 month / 1 trimester / 1 semester / 1 year) and region (EU, Slovenia)
- 📊 **Relevance scoring** — results are weighted by importance (1–10 scale)
- 🗂 **Filtering & sorting** — filter by legal phase (In Force / Proposal) and law area; sort by date or importance score
- 🔖 **Bookmarks** — save results to Firestore, persisted per user
- 👤 **User profiles** — law area preferences drive personalised search
- 🌐 **Bilingual** — full English and Slovenian UI support
- 📄 **Pagination** — configurable page size (10 / 25 / 50) with load-more

---

## Project Structure

```
src/
├── assets/              # Logos, flags
├── components/
│   ├── ResultCard.tsx   # Individual law result card
│   └── SkeletonResults.tsx
├── contexts/
│   └── AuthContext.tsx  # Firebase auth context
├── hooks/
│   └── useUserProfile.ts
├── lib/
│   └── firebase.ts      # Firebase init
├── pages/
│   └── Index.tsx        # Main search page
└── main.tsx
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- A Firebase project with Firestore and Authentication enabled

### Installation

```bash
git clone https://github.com/your-org/legalradar-frontend.git
cd legalradar-frontend
npm install
```

### Environment Variables

Create a `.env` file in the root:

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

### Development

```bash
npm run dev
```

### Production Build

```bash
npm run build
npm run preview
```

---

## API

The app fetches legislation from:

```
GET https://ai-x-pravo-api.onrender.com/laws
```

Results are filtered client-side by the selected time range and mapped to the internal `LawResult` shape:

| Field | Source | Description |
|---|---|---|
| `act` | `item.title` | Name of the legislation |
| `areas` | `item.area` | Law areas (e.g. `"Financial Law"`) |
| `date` | `item.date` | Publication date |
| `phase` | hardcoded | `"In force"` or `"Proposal"` |
| `summary` | `item.summary` | AI-generated summary |
| `source` | `item.url` | Link to original document |
| `importance` | `item.weight * 10` | Relevance score (1–10) |

---

## Law Areas

Supported law areas (matched against API values):

| Key | English | Slovenian |
|---|---|---|
| `energyLaw` | Energy Law | Energetsko pravo |
| `labourLaw` | Labour Law | Delovno pravo |
| `dataProtection` | Data Protection | Varstvo podatkov |
| `environmentalLaw` | Environmental Law | Okoljsko pravo |
| `taxLaw` | Tax Law | Davčno pravo |
| `financialLaw` | Financial Law | Finančno pravo |
| `corporateLaw` | Corporate Law | Gospodarsko pravo |
| `healthSafetyLaw` | Health and Safety Law | Varnost in zdravje pri delu |
| `consumerProtection` | Consumer Protection | Varstvo potrošnikov |
| `digitalTechLaw` | Digital / Technology Law | Digitalno / tehnološko pravo |

---

## Firebase Structure

```
users/
  {uid}/
    profile        # law areas, business needs
    bookmarks/
      {bookmarkId} # saved LawResult documents
```

---

