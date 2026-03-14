# AIxPravo

**AIxPravo** is an AI-powered legal change tracker focused on **Slovenian and EU legislation**.
The system automatically collects legal updates, processes them using Large Language Models (LLMs), and presents **clear summaries and structured insights** to help users quickly understand important changes in the law.

---

## Overview

Monitoring legal updates can be difficult because new regulations, amendments, and decisions are published frequently and often in complex legal language.

AIxPravo solves this problem by combining:

* Automated **web scraping of legal sources**
* **AI summarization** of legal texts
* Intelligent **classification of legal areas**
* **Filtering and bookmarking** features for users

The goal is to make legal information **more accessible, searchable, and understandable**.

---

## Features

### Legal Change Tracking

* Collects updates from legal information sources.
* Stores and organizes legal documents and changes.

### AI-Generated Summaries

* Large Language Models analyze legal texts.
* Generates concise summaries explaining the key changes.

### Smart Filtering

Users can filter legal changes by:

* **Time range**
* **Region** (EU / Slovenia)
* **Area of law** (automatically classified by the AI)
* **Importance level** (AI-estimated relevance)

### Bookmarking

Users can bookmark important legal changes to keep track of them.

---


## Tech Stack

### Frontend

* JavaScript / TypeScript
* Vite
* Modern UI framework

### Backend

* Python
* Web scraping tools
* LLM API integration

### Databases

* MongoDB (legal article storage)
* Firebase (user profiles and bookmarks)

---

## How It Works

1. A **scraper** collects legal updates from official sources.
2. The backend processes the text.
3. A **Large Language Model** generates:

   * summaries
   * legal area classification
   * importance scoring
4. Processed information is stored in a database.
5. The **frontend displays structured cards** showing each legal update.

---


### Backend

```
cd backend
pip install -r requirements/base.txt
python src/api/api.py
```

### Frontend

```
cd frontend
npm install
npm run dev
```

---

## Future Improvements

* Better legal classification models
* Notification system for important legal changes
* Advanced search across legal updates
* Personalized recommendations

---

## Authors

Developed by the AIxPravo team.
