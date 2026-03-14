# Architecture Overview

This document describes the architecture of the **AIxPravo** system and how the different components interact.

AIxPravo is designed as a **full-stack application** that automatically collects legal updates, processes them using AI models, and presents them through a web interface.

---

# System Overview

The system is composed of three main layers:

1. **Frontend** – User interface for browsing legal updates
2. **Backend** – API and processing logic
3. **Data & AI Layer** – Scraping, storage, and AI analysis

The architecture follows a **modular design**, allowing each component to be developed and scaled independently.

```
User
  │
  ▼
Frontend (React / Vite)
  │
  ▼
Backend API (Python)
  │
  ├── Scraper
  ├── AI Processing
  └── Database Layer
```

---

# Frontend Layer

The frontend provides the **user interface** where users can explore legal updates and interact with the system.

### Responsibilities

* Display legal change cards
* Show AI-generated summaries
* Provide filtering and search
* Allow users to bookmark legal changes

### Typical Workflow

1. The frontend sends requests to the backend API.
2. The backend returns processed legal updates.
3. The frontend renders the information in a structured UI.

### Example Request

```
GET /api/laws?region=EU&importance=high
```

---

# Backend Layer

The backend acts as the **core orchestrator of the system**.

It exposes API endpoints used by the frontend and manages:

* scraping
* AI processing
* data storage
* user interactions

The backend is implemented in **Python**.

### Backend Responsibilities

* Collect legal data
* Process legal text
* Generate AI summaries
* Classify legal areas
* Estimate importance of legal changes
* Serve processed data to the frontend

---

# Scraper Module

The scraper collects legal updates from official legal information sources.

### Responsibilities

* Fetch legal documents
* Parse HTML pages
* Extract relevant legal text
* Normalize the data format

### Output

The scraper produces structured objects such as:

```
{
  "title": "...",
  "date": "...",
  "source": "...",
  "content": "..."
}
```

These objects are then sent to the AI processing pipeline.

---

# AI Processing Layer

The AI module analyzes the collected legal texts using **Large Language Models (LLMs)**.

### Tasks Performed

* **Summarization**
  Generates a short explanation of the legal change.

* **Legal Area Classification**
  Determines which legal domain the change belongs to.

* **Importance Scoring**
  Estimates how significant the change is relative to current legal or social conditions.

### Output Example

```
{
  "summary": "...",
  "area": "Labor Law",
  "importance": "High"
}
```

---

# Database Layer

The system uses two types of databases.

### MongoDB

Stores processed legal updates.

Example structure:

```
{
  id,
  title,
  date,
  region,
  summary,
  area,
  importance,
  source_url
}
```

### Firebase

Stores **user-related data**, including:

* user accounts
* bookmarks
* saved legal updates

---

# Data Flow

The following sequence describes how data moves through the system.

### 1. Scraping

The scraper retrieves legal documents from online sources.

### 2. Processing

Raw text is sent to the AI processing module.

### 3. AI Analysis

The LLM generates:

* summaries
* classifications
* importance scores

### 4. Storage

Processed records are stored in MongoDB.

### 5. API Access

The backend exposes endpoints that allow the frontend to retrieve legal updates.

### 6. User Interaction

Users can browse, filter, and bookmark legal changes.

---

# Scalability Considerations

The system is designed so that each major component can be scaled independently.

Examples:

* The **scraper** can run as a scheduled job.
* The **AI pipeline** can run asynchronously.
* The **API server** can be horizontally scaled.

---

# Future Architecture Improvements

Possible future improvements include:

* Task queues for asynchronous processing
* Notification system for important legal changes
* Semantic search across legal texts
* Personalized recommendations

---

# Summary

AIxPravo combines:

* automated **legal data collection**
* **AI-powered legal analysis**
* a **modern web interface**

to create a system that helps users quickly understand important legal developments.
