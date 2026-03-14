# summarizer.py

import openai
from bs4 import BeautifulSoup
import os

def get_client( base_url: str = "https://llm.505labs.ai"):
    """
    Returns an initialized LiteLLM client.
    """
    api_key = os.getenv("LLM_API_KEY")

    return openai.OpenAI(
        api_key=api_key,
        base_url=base_url
    )

def summarize_html_content(html_content: str, client) -> str:
    """
    Accepts an HTML string and a LiteLLM client, extracts visible text, and summarizes it
    for EU/Slovenia legal news.
    """
    # Extract visible text
    soup = BeautifulSoup(html_content, "html.parser")
    for element in soup(["script", "style", "head", "meta", "link"]):
        element.decompose()
    text_content = soup.get_text(separator="\n", strip=True)

    # Build prompt
    prompt = f"""
You are a legal news analyst specializing in EU and Slovenian legislation. 

The document already includes the title, date, and institution, so do not repeat them. 

Your task is to:

1. Summarize the main content (recitals, enacting terms, articles, decisions) into clear, concise bullet points (2–3 sentences per bullet), focusing on key points, decisions, amounts, and affected parties. Ignore citations or references.  

2. Determine the **primary legal area** of this news item. Choose areas that apply from the following list:

3. Determine the weight of the importance of the news item on a scale from 0 to 1, where 0 is not important at all and 1 is extremely important. Consider the potential impact on businesses, individuals, and legal practices in Slovenia and the EU.
- Energy Law
- Labour Law
- Data Protection
- Environmental Law
- Tax Law
- Financial Law
- Corporate Law
- Health and Safety Law
- Consumer Protection
- Digital Technology Law

3. Output the result in the following **JSON format**:

  "summary": 
    "Bullet point 1",
    "Bullet point 2",
    ...
  ,
  "legal_area": "List of legal areas that apply" ,
  "weight" : "weight of the importance of the news item on a scale from 0 to 1 in DOUBLE"

Content to analyze:
{text_content}
"""

    # Send to LiteLLM
    response = client.chat.completions.create(
        model="gpt-5-nano",
        messages=[{"role": "user", "content": prompt}],
        extra_body = {"reasoning_effort" : "low"}
    )

    return response.choices[0].message.content