import requests
import json
import time
from pymongo import MongoClient
from datetime import datetime
from dotenv import load_dotenv
import os
from summarizer import get_client, summarize_html_content

load_dotenv()

client = MongoClient(os.getenv("MONGO-DB-URI"))
db = client["AIxPravo"]
collection = db["laws"]
try:
    client.admin.command("ping")
    print("MongoDB connected")
except Exception as e:
    print(f"Connection failed: {e}")

client = get_client()

page = 1
pageSize = 100

BASE = "https://www.tax-fin-lex.si/api/v1/"
leg_endpoint = f"legislation?page={page}&pageSize={pageSize}&type=zakon&status=veljaven"
art_endpoint = "legislation/{id}"

rate_lim = 10


headers = {
    "User-Agent": "Mozilla/5.0",
    "accept": "application/json",
    "X-Api-Key": os.getenv("TAX-FIN-LEX-API")
}

resp = requests.get(BASE+leg_endpoint, headers=headers)
data = resp.json()
#print(data)

items = data["data"]["items"]


for item in items:

    id = item["id"]

    if collection.find_one({"id": id}):
        print(f"Skipping {id}, already in db")
        continue

    print("sending get")
    resp = requests.get(BASE+art_endpoint.format(id=id), headers=headers)
    data = resp.json()
    try:
        data = data["data"]

        title = data["title"]
        date = item["validFrom"]
        url = item["url"]

        if "RS" in item["documentMark"]:
            locality = "RS"
        else:
            locality = "EU"


        articles = data["articles"]

        text = ""

        if (len(articles) == 0):
            continue

        for article in articles:
            text += article["html"]
    except:
        print(data)


    print(date)
    date = datetime.fromisoformat(date)

    print(id)

    print(title)

    print(date)

    print(locality)

    print(url)

    #print(text)

    ## llm + DB insert
    response = summarize_html_content(text, client)
    print("LLM response:", response)
    res_js = json.loads(response)
    summary = res_js["summary"]
    area = res_js["legal_area"]
    # normalize area to list; if single string, wrap in list
    if isinstance(area, str):
        area = [area]
    elif area is None:
        area = []
    elif not isinstance(area, list):
        # fallback: try converting to list
        try:
            area = list(area)
        except Exception:
            area = [str(area)]

    if (not isinstance(area, list)) :
        print("Unexpected format for legal_area:", area)
        break
    
    # make sure we have a numeric value and turn it into an integer
    raw = res_js["weight"]

    # if the model returns a string like "0.3" we first cast to float,
    # then to int (or whatever rounding behaviour you prefer)
    try:
        weight = float(raw)
    except (TypeError, ValueError):
        # fallback if the field is missing or unparsable
        weight = 0.5

    collection.insert_one({
        "id": id, 
        "title": title,
        "date": date,
        "area": area,
        "locality": locality,
        "url": url,
        "summary": summary,
        "weight": weight
    })


   
    time.sleep(60 / rate_lim)


