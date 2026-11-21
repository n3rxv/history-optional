# Tagging brief: History Optional book passages

You tag one batch of passages from a standard history textbook. The tags feed a search index for UPSC History Optional students. A wrong tag hides the right passage or shows the wrong one, so read each passage. Do not guess from keywords.

## Input

`scripts/rag/work/batches/<BATCH>.txt` (paths are relative to `/Users/nirxv_03/Desktop/history-optional`). The header gives:

- the book and author
- the subjects you may use
- the book's period
- the topic ids you may use

Then the passages follow in reading order. Each passage starts with `=== <id>`.

The file is large. If Read refuses it, read it in parts with `offset` and `limit` until you reach the end. Tag every passage.

## Output

Write `scripts/rag/work/tags/<BATCH>.jsonl` with the Write tool. Put one line per passage, in the same order, with no other text:

```
{"id": 27701, "s": "modern_india", "y0": 1942, "y1": 1942, "t": ["cripps_mission_1942"], "c": "Describes the Cripps offer of March 1942: post-war dominion status and a provincial right to opt out of the Union."}
```

- `id`: the passage id, an integer.
- `s`: one subject from the batch's allowed list. The boundaries follow the syllabus, not the book. Ancient India runs to c. 750 CE. Medieval India runs from c. 750 CE to the mid-18th century. Modern India starts with European arrival and the East India Companies (even in the 1500s–1600s). Modern World runs from the Enlightenment to 1991. Lowe's chapters on India, Pakistan or the Raj are `modern_india`.
- `y0`, `y1`: integers. They are the first and last years of the events the passage actually describes. BCE years are negative (`-321`). Prehistory uses large negatives (Lower Palaeolithic `-500000`).
  - Take the years from what the passage discusses, not from where it sits in the book. A passage in a 1946 chapter that looks back at the 1942 Cripps offer gets `1942`, `1942`.
  - One year: use it for both.
  - A historiographical passage (a debate about feudalism, the nature of the Mughal state) gets the years of the era under debate, not the years of the historians.
  - A preface, method or overview passage gets the span it covers.
  - Years must lie inside the book period.
- `t`: 0 to 3 topic ids from the batch list. Use a topic only when the passage substantially discusses it. A passing mention doesn't count. `[]` is fine and common.
- `c`: one plain sentence, at most about 30 words. It names the specific event(s), people, place and date the passage is about. When the passage says only "the plan", "the scheme" or "they", name the event from the passages around it. That is the main reason this tagging exists. Examples:
  - "Describes the Cabinet Mission Plan of 16 May 1946: three-tier union, groups of provinces and the Constituent Assembly."
  - "Explains the Muslim League's withdrawal of its acceptance of the Cabinet Mission Plan on 29 July 1946."
  - "R.S. Sharma's Indian feudalism thesis on land grants and the decline of trade, c. 600–1200 CE, and its critics."

  Don't evaluate. Don't say "this passage". Use the book's own facts. Don't add dates the passage and its neighbours don't support.

## Rules

1. Tag every passage in the batch once, including short or boring ones. Index pages, footnotes and bibliography fragments still get a line: give them the book period, `t: []`, and a `c` saying what they are (e.g. "Bibliography entries for the chapter on the Delhi Sultanate.").
2. Read the passages in order. A passage often continues the one before it.
3. Don't write anywhere except your own tag file. Don't edit the batch file or any repo file.
4. When the file is written, run:
   `python3 /Users/nirxv_03/Desktop/history-optional/scripts/rag/check_tags.py <BATCH>`
   Fix every problem it lists, then run it again. Stop only when it reports `0 problems`.
5. If the disk is full or a tool fails repeatedly, stop and report it. Don't delete files or work around the sandbox.

## Report

Reply in one or two lines: the batch id, the number of passages tagged, the check result, and anything odd. Examples of odd: garbled OCR, passages from another book, a stretch you couldn't date.
