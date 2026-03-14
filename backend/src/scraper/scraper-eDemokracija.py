from bs4 import BeautifulSoup
import requests
import json

BASE = "https://e-uprava.gov.si/si/drzava-in-druzba/e-demokracija/predlogi-predpisov.html"

areas = {
        0: "-1", # vsa področja
        # 1: "14393", # ministrstvo za vzgojo in izobraževanje
        # 2: "14394", # gospodarstvo turizem in šport
        # 3: "14391", # kohezijo in regionalni razvoj
        4: "14392", # naravni viri in prostor
        # 5: "3001", # urad vlade republike slovenije za slovence v zamejstvu po svetu
        6: "14390", # ministerstvo za digitalno preobrazbo
        8: "12517", # pravosodje
        10: "12518", # gospodarski razvoj
        11: "2866", # urad republike za varovanje tajnih podatkov
        12: "12516", # kmetijstvo gozdarstvo in prehrano
        13: "1730", # služba RS za zakonodajo
        14: "533", # notranje zadeve
        15: "12519", # izobraževanje znanost in šport
        16: "566", # zdravje
        17: "436", # finance
        20: "14379", # delo, družine, socialne zadeve, ...
        22: "12533", # kultura
        23: "14381", # urad RS za informacijsko varnost
        24: "14387", # okolje podnebje in energijo
        26: "322", # statistični urad
        27: "1883", # obramba
        29: "12520", # infrastruktura
        28: "12543", # javna uprava
        29: "14388", # solidarno prihodnost
        30: ""

        }

params = {
    "lang": "si",
    "is_ajax": "1",
    "comment": "-",
    "type": "-",
    "status": "-",
    "cat": "-",
    "rijs": "14394",
    "offset": "0",
    "sentinel_type": "ok",
    "sentinel_status": "ok",
    "complete": "true",
}

headers = {
    "User-Agent": "Mozilla/5.0 (research crawler; contact@yourdomain.com)",
    "X-Requested-With": "XMLHttpRequest",  # often required for AJAX endpoints
    "Referer": BASE,
}

session = requests.Session()
resp = session.get(BASE, params=params, headers=headers)
print(resp.status_code)
#print(resp.headers.get("content-type"))
#print(resp.text)   # preview first 1000 chars

soup = BeautifulSoup(resp.text, "html.parser")

results = soup.select_one("#results")

table = results.select_one("table.noMarginTable.edemokracijaSeznam")

#print(table)

rows = table.select("tr")

#print(rows)

data = []

for row in rows:
    status = row.select_one("div[aria-label]")
    date = row.select_one(".datumSpremembe")

    link = row.select_one("td a")

    infos = row.select("td:nth-of-type(2) .additionalInfo")
    ministry = row.select_one("td:nth-of-type(2) a + div")

    item = {
        "status_label": status["aria-label"] if status else None,
        "date": date.get_text(strip=True) if date else None,
        "title": link.get_text(strip=True) if link else None,
        "url": "https://e-uprava.gov.si" + link["href"] if link else None,
        "category": infos[0].get_text(strip=True) if len(infos) > 0 else None,
        "stage": infos[1].get_text(strip=True) if len(infos) > 1 else None,
        "ministry": ministry.get_text(strip=True) if ministry else None,
    }

    data.append(item)

for d in data:
    print(d["ministry"])
