from bs4 import BeautifulSoup
import requests
from pathlib import Path
from playwright.sync_api import sync_playwright

BASE = "https://pisrs.si/api/sitemap/sitemap_pregledNpb1.xml"
CACHE_FILE = "sitemap.xml"
headers = {"User-Agent": "Mozilla/5.0 (research crawler)"}

# ── Load sitemap ──────────────────────────────────────────────────────────────
if Path(CACHE_FILE).exists():
    print("Loading from local file")
    with open(CACHE_FILE, "r", encoding="utf-8") as f:
        content = f.read()
else:
    print("Fetching from server")
    resp = requests.get(BASE, headers=headers)
    content = resp.text
    with open(CACHE_FILE, "w", encoding="utf-8") as f:
        f.write(content)

# ── Parse sitemap ─────────────────────────────────────────────────────────────
soup = BeautifulSoup(content, "xml")
locs = [loc.text for loc in soup.find_all("loc")]
locs = sorted(locs, reverse=True)
print(f"Found {len(locs)} URLs")
print(locs)

# ── Scrape with Playwright ────────────────────────────────────────────────────
def scrape_url(url: str) -> str:
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto(url, wait_until="networkidle")  # waits for JS to finish
        content = page.content()
        browser.close()
        return content


for i in range(100):
    print("Scraping URL:", locs[i])

    
    print("Scraping with Playwright...")
    if "TAR" in locs[i] or "DRUG" in locs[i] or "PRAV" in locs[i] or "ZRDP" in locs[i]:
        print("Skipping doc")
        continue
    html = scrape_url(locs[i])

    #print(html)

    # ── Parse result ──────────────────────────────────────────────────────────────
    page = BeautifulSoup(html, "html.parser")

    
    link = ""
    for a in page.select("a.link-button"):
        span = a.select_one("button span.k-button-text")
        if span and span.get_text(strip=True) == "HTML":
            link = a.get("href")
            break  # remove if you expect multiple

    if link == "":
        print("Skipping doc, missing HTML")
        continue

    print("Scraping file URL:", link)

    doc = requests.get(link, headers=headers).text
    #print(doc.text)

    document = BeautifulSoup(doc, "html.parser")

    #print(document)

    try:
        naslov = [el.get_text(strip=True) for el in document.select(".naslov")]
        print(naslov)
        kraj_datum = document.select_one(".kraj_datum_sprejetja").text
        print(kraj_datum)
        vsebina = [el.get_text(strip=True) for el in document.select(".odstavek, .clen")]
        print(vsebina)
    except:
        print("Missing fields")

