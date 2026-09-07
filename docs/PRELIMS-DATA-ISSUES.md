# Prelims question bank: data issues found while writing the notes

Running log. Nothing here is fixed yet, by decision: the notes come first and
these are corrected in one pass at the end, so the bank is edited once rather
than thirty-eight times.

Each row carries the question `id` from `lib/prelimsData.ts` so the fix is
mechanical.

## Mis-tagged topics

| id | Year | Currently tagged | Should be | Evidence |
|---|---|---|---|---|
| `d1_ivc_pyq1` | 2012 | Indus Valley Civilisation | Buddhism & Jainism | Asks what was common to Buddhism and Jainism. Nothing to do with the Harappans. |
| `d1_vedic_pyq2` | 2013 | Vedic Age | Indus Valley Civilisation | "Which of the following characterizes the people of the Indus Civilization" |
| `d1_vedic_pyq1` | 2019 | Vedic Age | Art & Architecture | Sthapati and Sutradhara are terms of temple architecture; the answer key says so |

## Duplicates

| ids | Year | Problem |
|---|---|---|
| `d1_ivc_pyq2` and `pyq_ivc_2021_dholavira` | 2021 | The same Dholavira water-harvesting question entered twice in near-identical wording. A reader drilling the topic meets it twice, and the topic's PYQ count reads one higher than it is. |

## Effect on the notes

The topic counts quoted in the notes are the raw counts. Once these are
corrected, Indus Valley loses two entries (one duplicate, one mis-tag) and
gains one from Vedic Age; Vedic Age loses two.

## When to fix

After the last topic note is written. Fixing earlier would mean the topic
counts shift under notes already approved.

## Buddhist and Jain questions filed under Mahajanapadas

Fourteen of the 39 PYQs tagged `Mahajanapadas & Mauryan Empire` are about
Buddhist or Jain doctrine, sects and iconography rather than about the period's
politics: Sthaviravadins, Sautrantika, Sammitiya, paramitas, Maitreya,
Sthanakvasi, bodhisattvas, stupa origin, Dhanyakataka, Bhaja, Besnagar.

A separate `Buddhism & Jainism` topic already exists with 27 questions, so the
split is inconsistent rather than deliberate. Confirmed example:

| id | Year | Currently tagged | Subject |
|---|---|---|---|
| (2018 Sthanakvasi) | 2018 | Mahajanapadas & Mauryan Empire | Which religion the Sthanakvasi sect belongs to. Answer: Jainism |

This is a decision rather than a clear error. Either these move to
`Buddhism & Jainism`, or they stay as questions of the period. They should not
be split arbitrarily between the two, which is the present state.

## Effect on the notes

Note 04 covers the politics of the period and note 05 covers doctrine, so the
notes are correct either way. Only the drill sets behind the footer links are
affected.

## Indus Valley Civilisation: one question is not about the Indus at all

Found while rebuilding note 02 (topic has 19 questions, 14 of them past papers).

| id | Year | Currently tagged | Subject |
|---|---|---|---|
| (2012 Buddhism/Jainism common features) | 2012 | Indus Valley Civilisation | "Which of the following was/were common to both Buddhism and Jainism?" Answer: 2 and 3 only |

This is a plain mis-tag, not a judgement call. The question names neither the
Indus nor anything Harappan, and a `Buddhism & Jainism` topic exists. It should
move there.

Also in this topic: the 2021 water-harvesting question (answer Dholavira)
appears **twice**, once as "well known" and once as "well-known". Duplicate
rather than mis-tag, but it inflates the topic's PYQ count from 13 to 14 and
will show a student the same question twice in a drill set.

### Effect on the notes

Note 02 was written from the other 17 questions and is unaffected. The footer
drill set for this topic will serve one off-topic question and one duplicate
until both are fixed.

## Vedic Age: two questions belong to other topics

Found while rebuilding note 03 (topic has 21 questions, 17 of them past papers).

| id | Year | Currently tagged | Subject |
|---|---|---|---|
| (2013 Indus characteristics) | 2013 | Vedic Age | "Which of the following characterizes the people of Indus Civilization?" Answer: 2 only |
| (2019 Sthapati and Sutradhara) | 2019 | Vedic Age | In what context those two terms are mentioned. Answer: Temple architecture |

The 2013 one is a duplicate of a question already correctly tagged under
`Indus Valley Civilisation`, so it is served twice under two different topics.

The 2019 one is defensible but wrong on balance. `Sthapati` does appear in the
later Vedic list of sixteen ratnins, as a local chief or judge, which is
presumably why it was filed here. But the question pairs it with `Sutradhara`
and its own answer is temple architecture, so it belongs with the architecture
topic.

### Effect on the notes

Note 03 was written from the other 19 questions. The 2019 pair is covered in
its exam section anyway, since the ratnin sense of Sthapati is genuinely part
of the topic and a student who meets the question needs to know both senses.

## Buddhism & Jainism: three questions belong elsewhere

Found while rebuilding note 05 (topic has 27 questions, 22 of them past papers).

| id | Year | Currently tagged | Belongs in |
|---|---|---|---|
| (2013 Gautamiputra Satakarni) | 2013 | Buddhism & Jainism | Post-Mauryan. Nothing in it is about either religion |
| (2016 memorising chronicles and dynasty histories) | 2016 | Buddhism & Jainism | Vedic Age or Mahajanapadas. It is about the suta and magadha bards. Answer: Magadha |
| (2023 Ashoka's Dhamma) | 2023 | Buddhism & Jainism | Mahajanapadas & Mauryan Empire, where the dhamma debate is covered |

The 2007 Nalanda question stays: Nalanda is a Buddhist institution and the
question is about a Buddhist university as described by a Buddhist pilgrim.

### The larger pattern

This is the third topic in a row where the mis-tags run in one direction:
questions about Buddhist and Jain **doctrine** were filed under the political
topics (Mahajanapadas & Mauryan, Vedic Age), and questions about **political
history** were filed here. The split looks like it was made on which century
the question mentions rather than what it asks about. Fixing it is one pass
over roughly twenty questions, not a redesign.

### Effect on the notes

None. Note 04 covers the politics and note 05 the doctrine, so a student
reading both meets every question either way. Only the footer drill sets are
affected.

## Mauryan & Post-Mauryan: one mis-tag and one probable data error

Found while rebuilding note 07 (topic has 9 questions, 7 of them past papers).

| id | Year | Issue |
|---|---|---|
| (2015 common to Buddhism and Jainism) | 2015 | Mis-tagged. Belongs under `Buddhism & Jainism`, where the same question already sits for 1996 and 2012 |
| (2019 "Pabhosa inscription") | 2019 | **Probable corruption of the question text.** It reads "In which of the following relief sculpture inscriptions is the 'Pabhosa inscription' found?" with the answer Kanaganahalli. The 2019 paper asked which relief sculpture inscription mentions **'Ranyo Ashoka'** along with a stone portrait of Ashoka; that question is also in the bank, correctly worded, under `Mahajanapadas & Mauryan Empire`. The Pabhosa inscriptions are Shunga-period cave inscriptions in Uttar Pradesh, not at Kanaganahalli, so as worded the question has no correct answer |

The second is worth fixing ahead of the tagging work, because a student who
looks up Pabhosa will find it contradicts the key.

### Effect on the notes

Note 07 covers Kanaganahalli in its exam section for what it genuinely is, a
stupa in Karnataka whose relief panels carry inscribed labels including a
portrait of Ashoka. It does not repeat the Pabhosa claim.
