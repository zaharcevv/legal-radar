import requests
import json
import time
from pymongo import MongoClient
from datetime import datetime
from dotenv import load_dotenv
from playwright.sync_api import sync_playwright
import os

load_dotenv()

client = MongoClient(os.getenv("MONGO-DB-URI"))
db = client["AIxPravo"]
collection = db["laws"]
try:
    client.admin.command("ping")
    print("MongoDB connected")
except Exception as e:
    print(f"Connection failed: {e}")


rate_lim = 10

headers = {
    "Accept": "text/html",
    "User-Agent": "Mozilla/5.0 (research crawler)"
}

SPARQL = "https://publications.europa.eu/webapi/rdf/sparql"

query = """
PREFIX cdm: <http://publications.europa.eu/ontology/cdm#>

SELECT ?work ?title ?date
WHERE {
  ?work a cdm:legislation_secondary ;
        cdm:work_date_document ?date ;
        cdm:work_title ?title .
  FILTER(LANG(?title) = "en")
  FILTER(?date >= "2025-01-01"^^xsd:date)
}
ORDER BY DESC(?date)
LIMIT 100
"""

resp = requests.get(SPARQL, params={
    "query": query,
    "format": "application/sparql-results+json"
})
data = resp.json()

entrys = data["results"]["bindings"]
#print(data)
print(len(entrys))

def get_eurlex_document(cellar_id: str) -> dict:
    # EUR-Lex content API
    url = f"https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=cellar:{cellar_id}&format=json"
    
    headers = {
        "Accept": "application/json",
        "User-Agent": "Mozilla/5.0 (research crawler; contact@example.com)"
    }
    
    resp = requests.get(url, headers=headers, timeout=15)
    return resp.text


for entry in entrys:
    cellar_id = entry["work"]["value"].split("/cellar/")[1]

    text = get_eurlex_document(cellar_id)
    print(text[:500])

    time.sleep(rate_lim)  # respect crawl-delay
    break
    



