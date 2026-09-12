"""
Mistral backend for reading the printed question off a booklet page.

Chosen over the Anthropic path for one reason: the credits are already bought
and Auto Recharge is disabled, so no new charge is possible. The balance can
only run down, never over.

That is also the constraint. The same credits pay for the site's own OCR route
in app/api/ocr, so this path tracks its token spend and has to stay a small
fraction of the balance rather than starving a live feature.
"""
import base64, json, os, time, urllib.request, urllib.error

MODEL = os.environ.get('MISTRAL_MODEL', 'mistral-medium-latest')

_usage = {'in': 0, 'out': 0, 'calls': 0}


def read_question_mistral(png_bytes: bytes, prompt: str) -> str:
    key = os.environ['MISTRAL_API_KEY']
    b64 = base64.b64encode(png_bytes).decode()
    body = json.dumps({
        'model': MODEL,
        'temperature': 0.0,
        'max_tokens': 700,
        'messages': [{'role': 'user', 'content': [
            {'type': 'image_url', 'image_url': f'data:image/png;base64,{b64}'},
            {'type': 'text', 'text': prompt},
        ]}],
    }).encode()
    req = urllib.request.Request(
        'https://api.mistral.ai/v1/chat/completions', data=body,
        headers={'content-type': 'application/json', 'Authorization': 'Bearer ' + key})

    for attempt in range(5):
        try:
            with urllib.request.urlopen(req, timeout=120) as r:
                d = json.load(r)
            break
        except urllib.error.HTTPError as e:
            # 429 is the rate limit, not a failure. Back off and retry.
            if e.code in (429, 503) and attempt < 4:
                time.sleep(2 ** attempt)
                continue
            raise

    u = d.get('usage', {})
    _usage['in'] += u.get('prompt_tokens', 0)
    _usage['out'] += u.get('completion_tokens', 0)
    _usage['calls'] += 1
    return ' '.join((d['choices'][0]['message']['content'] or '').split())


def usage():
    return dict(_usage)
