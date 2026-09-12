"""
Gemini backend for reading the printed question, as a free-tier alternative.

Same prompt and same contract as the Anthropic path in readq.py: transcribe
the printed question with the serial and the marks tag removed, or return NONE.
Which backend runs is chosen by READQ_BACKEND, so the pipeline above this does
not care and the two can be compared on identical pages.
"""
import base64, json, os, re, urllib.request, urllib.error, time
from pathlib import Path

MODEL = os.environ.get('GEMINI_MODEL', 'gemini-3.5-flash')

def read_question_gemini(png_bytes: bytes, prompt: str) -> str:
    key = os.environ['GEMINI_API_KEY']
    url = f'https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent?key={key}'
    body = json.dumps({
        'contents': [{'parts': [
            {'inline_data': {'mime_type': 'image/png',
                             'data': base64.b64encode(png_bytes).decode()}},
            {'text': prompt}]}],
        'generationConfig': {'temperature': 0, 'maxOutputTokens': 2000},
    }).encode()
    req = urllib.request.Request(url, data=body, headers={'content-type': 'application/json'})
    for attempt in range(5):
        try:
            with urllib.request.urlopen(req, timeout=120) as r:
                d = json.load(r)
            break
        except urllib.error.HTTPError as e:
            # 429 is the free tier's rate limit, not a failure: wait and retry.
            if e.code in (429, 503) and attempt < 4:
                time.sleep(2 ** attempt * 3); continue
            raise
    cands = d.get('candidates') or []
    if not cands: return 'NONE'
    parts = cands[0].get('content', {}).get('parts', [])
    return ' '.join(''.join(p.get('text', '') for p in parts).split())
