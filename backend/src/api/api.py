from fastapi import FastAPI, HTTPException
from motor.motor_asyncio import AsyncIOMotorClient
from contextlib import asynccontextmanager
from pydantic import BaseModel, Field
from bson import ObjectId
from typing import Optional
import os

from fastapi.middleware.cors import CORSMiddleware



# ── MongoDB connection ────────────────────────────────────────────────────────
MONGO_URL = os.getenv("MONGO-DB-URI", "mongodb+srv://AIxPravoUser:hekaton26@cluster0.uv4lr.mongodb.net/")
DB_NAME   = "AIxPravo"


@asynccontextmanager
async def lifespan(app: FastAPI):
    # startup
    app.state.client = AsyncIOMotorClient(MONGO_URL)
    app.state.db = app.state.client[DB_NAME]
    print(f"Connected to MongoDB at {MONGO_URL}")
    yield
    # shutdown
    app.state.client.close()

# ── App setup ────────────────────────────────────────────────────────────────

app = FastAPI(title="FastAPI + MongoDB", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    return app.state.db

# ── Helpers ───────────────────────────────────────────────────────────────────
def fix_id(doc: dict) -> dict:
    """Convert ObjectId to string so it's JSON-serialisable."""
    return doc

# ── Schemas ───────────────────────────────────────────────────────────────────
class Law(BaseModel):
    id: str
    title: str
    date: str
    area: str
    locality: str
    url: str
    summary: str

# ── Routes ────────────────────────────────────────────────────────────────────
@app.get("/")
async def root():
    return {"message": "FastAPI + MongoDB is running 🚀"}


@app.get("/laws")
async def list_laws():
    db = get_db()
    laws = await db.laws.find({}, {"_id": 0}).to_list(length=100)
    return laws


@app.get("/laws/{law_id}")
async def get_item(law_id: str):
    db = get_db()
    law = await db.laws.find_one({"id": law_id}, {"_id": 0})
    if not law:
        raise HTTPException(status_code=404, detail="Item not found")
    return law

