# Verify brief, second pass: timeline dates against the textbooks

You check one batch of timeline rows against passages from standard history textbooks. Each row is a key event with a date. Decide from the passages alone whether the books confirm the date. A wrong verdict puts a wrong date in front of UPSC students, so read carefully and never guess.

## Input

`scripts/rag/work/verify2/<BATCH>.txt` (paths relative to `/Users/nirxv_03/Desktop/history-optional`). The file holds up to 24 rows. Each row starts with `### EVENT <id>` and gives:

- the event's name and aliases
- the row's date, precision and tolerance
- a one-line summary
- up to 5 book passages, each starting `[P<number>] <book>:`

If Read refuses the file, read it in parts with `offset` and `limit`. Check every row.

## Output

Write `scripts/rag/work/verify2/<BATCH>.out.jsonl` with the Write tool. Put one line per row, in the same order:

```
{"id": "cwc_resolution_cmp", "verdict": "corrected", "books": [{"p": 27738, "date": "24 June 1946", "quote": "...and the Congress on 24 June..."}], "suggest": {"start": "1946-06-24", "precision": "day", "tolerance": 0, "note": "Sarkar gives 24 June."}, "why": "Sarkar dates the Congress acceptance to 24 June, not 25 June."}
```

- `verdict` is one of:
  - `confirmed`: a passage clearly about **this same event** states a date that matches the row at the row's precision, and no passage about this same event gives a different date. A `day` row needs the same day, month and year. A `month` row needs the same month and year. A `year` row needs the same year. A `circa` or `contested` row needs a year within the tolerance.
  - `corrected`: passages about this same event give a different date from the row, and they don't contradict each other.
  - `disputed`: passages about this same event disagree with each other, or one confirms the row while another gives a different date.
  - `unsupported`: no passage states a date for this event. Use this for passages that only mention the event without dating it, or date something else.
- `books`: every passage you relied on, with:
  - `p`: the passage number, as an integer
  - `date`: the date as the passage gives it, e.g. "24 June 1946", "1757", "c. 321 BCE"
  - `quote`: the exact words from the passage, **copied character for character**, 8 to 40 words long, containing the date
  
  Give `[]` only for `unsupported`.
- `suggest`: only for `corrected` and `disputed`. It holds the date the books support: `start` (and `end` for a span) as `1946-06-24`, `1946-06`, `1946` or `321 BCE`; `precision` (`day`, `month`, `year`, `circa`, `contested`); `tolerance` in years; and a `note` naming which book says what. For `disputed`, set `precision` to `contested` or widen `tolerance` so that every book's date fits, and say so in the note.
- `why`: one short sentence.

## Rules

1. **Same event only.** A passage about a related but different event is not evidence. The 1942 Cripps offer is not the 1946 Cabinet Mission. A plan's announcement, its clarification and a party's resolution on it are three different events. The start of a war is not its end.
2. **Dates must be written in the passage.** Don't use your own knowledge to confirm, correct or fill in a date. If you "know" a date but no passage states it, the verdict is `unsupported`.
3. **Text that may be garbled.** Passages come from OCR and can be garbled. A date that is clearly an OCR slip ("l946", "19 46") still counts. A date you can't read with certainty doesn't.
4. **Year in context.** Each passage here starts with the end of the paragraph before it, so a year stated just before a date is visible. If a passage gives only a day and month ("on 24 June"), you may take the year from the same text when it clearly applies to that date. Don't take it from your own knowledge.
   A span row (with an end date) is `confirmed` only when the passages date its start **and** its end. If they date only one end, use `unsupported`, list the entry for the end they do date, and say which end is missing in `why`.
5. **Books against the row.** When books disagree with the row but agree with each other, the books win (`corrected`). When books disagree with each other, use `disputed`.
6. **Your own file only.** Don't write anywhere except your output file.
7. **Check your file.** When it's written, run `python3 /Users/nirxv_03/Desktop/history-optional/scripts/rag/check_verify.py --dir verify2 <BATCH>`. Fix every problem it lists and run it again. Stop only when it reports `0 problems`.

## Report

Reply in one or two lines: the batch id, the count of each verdict, and anything odd.
