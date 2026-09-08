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

## Tamil Sangam Era: two questions are post-Sangam

Found while rebuilding note 08 (topic has 17 questions, 15 of them past papers).

| id | Year | Currently tagged | Belongs in |
|---|---|---|---|
| (2025 Mattavilasa, Vichitrachitta, Gunabhara) | 2025 | Tamil Sangam Era | Pallava material. Mahendravarman I reigns after the Kalabhra interregnum, roughly four centuries after the Sangam corpus closes |
| (2016 Eripatti, Taniyurs, Ghatikas) | 2016 | Tamil Sangam Era | `Imperial Cholas`. These are Chola land-tenure and institutional terms, not Sangam ones |

Also in this topic: the 2023 Vattakirutal question and the 2023 Korkai/Poompuhar/
Muchiri question each appear **twice**, in near-identical wording. Duplicates
rather than mis-tags, but they inflate the topic's PYQ count.

Both mis-tags are defensible as adjacency, since a student reading about the
Sangam age does need to know what came after it. Note 08 covers both in its
exam section for that reason, while saying plainly that they sit outside the
period.

### No handout exists for this topic

The supplied set runs Handout 1 to 10 and then jumps to 13. Handouts 11 and 12
are missing, and that gap is where the Sangam material would sit. Note 08 was
therefore built from the Mains notes and the book corpus alone, which is why
it is shorter than its neighbours.

## Imperial Cholas: the same 2001 question appears twice with contradictory answers

Found while building note 14.

| id | Year | Question | Answer in bank |
|---|---|---|---|
| (2001 Ceylon, copy A) | 2001 | "Which one of the Chola kings conquered Ceylon?" | **Rajendra** |
| (2001 Ceylon, copy B) | 2001 | "Which one of the Chola kings conquered Ceylon?" | **Rajaraja I** |

Two rows, identical question text, opposite keys. One of them will mark a
correct answer wrong whichever a student picks.

The underlying history is genuinely split, which is presumably how the
duplicate survived: **Rajaraja I conquered northern Sri Lanka**, and
**Rajendra I completely annexed the island**. The original 2001 paper has one
intended answer; the bank should carry one row.

### Effect on the notes

Note 14 states both facts and warns the reader that the bank disagrees with
itself, rather than picking a side. Nothing else in the topic is affected.

## Early Medieval Language & Literature: six questions are from other periods

Found while building note 16. The topic carries 26 questions, 22 of them past
papers, and it functions as a catch-all for anything about a book.

| id | Year | Belongs in |
|---|---|---|
| (2014 Satyameva Jayate) | 2014 | Vedic Age. Mundaka Upanishad |
| (2014 Bijak and Pushtimarg) | 2014 | Medieval Bhakti. Kabir and Vallabhacharya |
| (2021 Mitakshara and Dayabhaga) | 2021 | Early Medieval North India, where the law texts sit |
| (2001 Charles Wilkins Gita translation) | 2001 | European Advent, or Socio-Religious Reform |
| (2008 UNESCO Memory of the World) | 2008 | Not a history question in any period |
| (2007 Kiran Desai, Man Booker 2006) | 2007 | Modern literature. Nothing to do with any listed topic |
| (2000 My Music My Life / Adha Gaon / The Pilferer) | 2000 | Modern Indian literature |

Also here: the **2022 Nettipakarana / Parishishtaparvan** question, already
logged under `Buddhism & Jainism`, and the **2021 Bhavabhuti playwrights**
question and the **2023 Devichandragupta pairs** question, each of which
appears **twice** in the bank.

### Effect on the notes

Note 16 answers all of them, marking the six out-of-period ones as such so a
student recognises them rather than hunting for an early medieval connection
that does not exist. No handout exists for this topic, so the note was built
from the Mains notes and the book corpus.

## Early Medieval Visual Arts: nineteen questions are not about visual arts

Forty-five questions carry this topic, the largest count in the bank. About
half concern temple architecture and sculpture, which is what the topic name
promises and what Handout 19 covers. The remaining nineteen concern classical
dance, classical music, festivals, literary prizes and early cinema. They are
not early medieval, not visual, and in several cases not history.

### Classical dance and music

| Question | Year | Where it belongs |
|---|---|---|
| Bharatanatyam origin | 2002 | Performing arts. No period |
| Kathakali state | 2003 | Performing arts. No period |
| Kathak region | 2007 | Performing arts. No period |
| Dance-to-state pairs (Garba, Mohiniyattam, Yakshagana) | 2014 | Performing arts. No period |
| Sattriya statements | 2014 | Performing arts. Medieval Assam at the earliest |
| Manipuri Sankirtana statements | 2017 | Performing arts. No period |
| Chakiarkoothu statements | 2000 | Performing arts. No period |
| Bimbavati Devi | 2008 | Living performer. Current affairs |
| Father of Carnatic music (Purandaradasa) | 2005 | Medieval Bhakti, where the Haridasas sit |
| Tyagaraja kritis | 2018 | 18th to 19th century music |
| Morning raga (Todi) | 2000 | Music theory. No period |
| Dhrupad singers | 2008 | Living performers |
| Gundecha brothers | 2009 | Living performers |
| Gangubai Hangal | 2006 | 20th century music |
| Ronu Mazumdar | 2004 | Living performer |
| My Music My Life (Ravi Shankar) | 2005 | Modern literature. Also filed under topic 16 |
| Gandharva Mahavidyalaya, 1901 | 2025 | 20th century institutional history |

### Festivals, prizes and cinema

| Question | Year | Where it belongs |
|---|---|---|
| Chapchar Kut festival | 2002 | Ethnography. No period |
| Madhubani and Gatka pairs | 2009 | Folk arts and martial arts. No period |
| Bharat Ratna recipients | 2005 | Current affairs |
| Pulitzer Prize | 2007 | Not an India question at all |
| Orange Prize statements | 2008 | Not an India question at all |
| Lumiere Brothers, Watson's Hotel 1896 | 1996 | History of cinema, colonial period |
| Alam Ara, first Indian talkie | 1999 | History of cinema, colonial period |

### Also here: questions that belong to other history topics

The **2000 Ajanta Jataka paintings** question and the **2002 Elephanta**
question are Post-Mauryan and Post-Gupta respectively, not early medieval. The
**2007 Kailasa at Ellora** question is Rashtrakuta, which sits in Post-Gupta
Deccan. The **2016 Ajanta and Mahabalipuram** question straddles two periods by
design and cannot be filed under either. The **2010 Chola Nataraja** and the
**2024 and 2026 UNESCO** questions are answered here but also belong under
`Imperial Cholas` and under a general-knowledge heading that does not exist.

### Effect on the notes

Note 18 covers temple architecture in full from Handout 19, then answers the
nineteen out-of-topic questions in a separate closing section headed for what
they are. No dance or music chapter was written: the corpus carries almost
nothing on Bharatanatyam, Odissi, Kuchipudi or Sattriya, and inventing one
would mean writing without backing. The answers are given; the exposition is
not, because there is nothing here to base it on.

If this topic is ever split, the natural cut is **Early Medieval Temple
Architecture** against a new **Performing Arts and Modern Culture** topic,
which would also absorb the stray items now sitting in notes 16 and 14.

## Southeast Asian Temples: the one past paper appears twice

The topic carries five questions. Two of them are the same 2006 paper, stored
under different ids with slightly different option text.

| id | Question | Year |
|---|---|---|
| `d3_sea_pyq1` | "The initial design and construction of which massive temple took place during the reign of Suryavarman II? [2006]" | 2006 |
| `art_2006_angkor_wat` | Same question, without the trailing year tag | 2006 |

The option lists differ only in that one writes **"Angkor Vat Temple"** and the
other **"Angkor Vat"**. Both mark the same correct answer, so nothing here is
wrong, but the topic reports five questions when it holds four distinct ones,
and a student doing the set meets the same question twice. The duplicate also
inflates the past-paper count from one to two.

### No handout exists for this topic

Note 19 is built from the book corpus alone, chiefly R. C. Majumdar's
*Ancient India* chapter on the Far East, with Upinder Singh, Satish Chandra,
Romila Thapar and A. L. Basham. Every term in it was checked against the
corpus. Three checks returned zero on a literal match and were confirmed
present under their diacritic spellings: **Nagara-Kritagama**, **Zabag** and
**Bhatara-Guru**. This is an OCR artefact of the scanned books, not a gap.

## Arab and Turkish Invasions: the only past paper is not about invasions

The topic holds six questions. Five are drills on the invasions themselves. The
sixth, and the only past paper, is the **2025 Araghatta question**, which asks
what an irrigation device was.

| Question | Year | Where it belongs |
|---|---|---|
| "The irrigation device called 'Araghatta' was:" | 2025 | Agrarian technology and economy. The natural home is a topic on society and economy, or the Delhi Sultanate, where the saqiya debate sits |

It is defensible to file it here, because the historiographical argument about
araghatta is an argument about **what the Turks did and did not bring to
India**, which is this topic's subject. But a student meeting this topic finds
one past paper and it is about a water wheel, which misrepresents what the
examiner has actually asked about the invasions: nothing, in the whole run of
past papers held in the bank.

### Two source discrepancies between the Mains notes and the book corpus

These are not bank errors. They are places where the Mains notes and the books
disagree, and note 20 records both rather than silently picking one.

| Claim | Mains note | Book corpus |
|---|---|---|
| Baladhuri's work on the Arab conquest | "**Futuh-ul-Abdan** by Al-Biladuri" | Ranbir Chakravarti has "the accounts of **al Baladhuri**", giving no title. The corpus has no instance of the title in any spelling |
| Language of Kitab-ul-Hind | "the first true historical work on India written in **Persian**" | Both the corpus and the other Mains note have it written in **Arabic** |
| Who defeated Ghori in Gujarat, 1178 | **Bhima II** | Majumdar names **Mularaja II** |

The Kitab-ul-Hind language claim is the one that could cost a mark, since a
paper could ask it directly. The note carries **Arabic** and flags the Mains
wording.

### No handout exists for this topic

Handout 23 begins with the Delhi Sultanate in 1206 and does not reach back to
the invasions. Note 20 is built from the Mains notes `early-medieval-india`,
`regional-states-gupta-era` and `cultural-traditions-750-1200`, together with
the book corpus.

## Literary Sources of Delhi Sultanate: four questions, no past papers

The topic holds four questions and **not one of them is a past paper**. All
four are drills. That is worth flagging because a student rationing effort by
past-paper count would skip this topic entirely, and the topic is one of the
highest-yield in the medieval half: it underwrites every question in the
Sultanate, Vijayanagara, Bahmani and Sufism topics that names a chronicle.

### One spelling that will not match a search

| Drill | Spelling used | Spelling in the books |
|---|---|---|
| Amir Khusrau's works | "Debal Rani-Khizr Khan" | **Dewal Rani Khizr Khani** (J. L. Mehta) |

"Debal" is also the name of the Sindh port captured by Muhammad bin Qasim in
712, which is a live confusion in a bank that carries both topics. Note 21
gives the book spelling and records the drill's.

### One question that belongs to two topics at once

The drill "Who is the author of the book 'Tahqiq-i Hind'?" is filed here, but
Al-Biruni's work is also the substance of two questions under **Arab and
Turkish Invasions** and is asked under the Gupta topics for the era
calculation. Nothing is wrong; it is simply the same author counted in three
places, which inflates how much of the bank looks like distinct content.

### The handout covers this topic only in outline

Handout 23 carries a "Sources of Delhi Sultanate" section of about 1,900
characters, listing authors and titles by dynasty with no evaluation. Note 21
is therefore built out from the Mains notes and the book corpus, chiefly Vipul
Singh's *Interpreting Medieval India*, whose opening chapter is a full
historiography of the period, and J. L. Mehta Volume I, whose introduction is
a survey of contemporary sources.

## Delhi Sultanate: three wrong answers, and thirteen duplicated questions

The largest topic in the bank, 53 questions and 42 past papers. It also carries
the most problems of any topic so far.

### Three answers that contradict the handouts or the books

These are the ones that could actually cost a mark, so they matter more than
the duplicates below.

| Question | Bank's answer | What the sources say |
|---|---|---|
| **2022** "who of the following were known as 'KulahDaran'?" (`d4_ds_pyq1`) | **Qalandars** | **Sayyids.** Handout 24, in the section on the Sayyid dynasty: "Sayyids maintained their distinct identity by wearing a pointed cap which was known as Kullah (thus called Kulhadaran). It distinguished them from other dastarbandi ulamas." Sayyids is also one of the four options offered |
| **2023** Amil / iqta / Mir Bakshi statements (`pyq_ds_2023_mir_bakshi`) | **1 and 2 only** | **1 only.** The bank's own 2019 entry (`d4_ds_pyq4`) carries the identical question with the identical options and answers **1 only**. Statement 2, that the iqta was "an ancient indigenous institution", is false: Vipul Singh has the conquerors bringing "west Asian concepts and practices regarding tax collection and distribution", and the iqta "borrowed from politico-administrative institutions in Central and West Asia" |
| Drill: "Alauddin Khilji declared 'Kingship knows no Kinship'" (`d4_ds_2`) | Marked **true** | Handout 23 places the principle under **Balban's** theory of kingship: "Balban also insisted on the principle that 'Kingship knows no kinship' i.e. impartial justice." The handout says nothing of the sort about Alauddin |

Note 22 gives the handout-backed answer in each case and says plainly where
the bank disagrees, rather than silently picking one.

### Fourteen questions stored twice

Every past paper in this topic from 1997 to 2022 appears twice, under two id
schemes: a `d4_ds_pyq*` series and a `med_*` / `pyq_ds*` series.

| Question | Year | The two ids |
|---|---|---|
| Mongol invasion statements | 2022 | `d4_ds_pyq2`, `pyq_dsu_2022_mongol_invasions` |
| Chengiz / Taimur / Vasco da Gama | 2021 | `d4_ds_pyq3`, `pyq_dsu_2021_iltutmish_chengiz` |
| Amil / iqta / Mir Bakshi | 2019 and 2023 | `d4_ds_pyq4`, `pyq_ds_2023_mir_bakshi` |
| Banjaras | 2016 | `d4_ds_pyq5`, `pyq_ds_2016_banjaras` |
| Afghan rulers in order | 2006 | `d4_ds_pyq6`, `med_2006_lodi_chronology` |
| Last Tughlaq ruler | 2004 | `d4_ds_pyq7`, `med_2004_tughlaq_last_ruler` |
| How Aibak died | 2003 | `d4_ds_pyq8`, `med_2003_qutb_aibak_death` |
| Firuz Tughlaq / department of slaves | 2002 | `d4_ds_pyq9`, `med_2002_medieval_rulers_firuz` |
| Dewan-i-Bandagani pair | 2001 | `d4_ds_pyq10`, `med_2001_dewan_tughlaq` |
| Genghis Khan / Iltutmish | 2001 | `d4_ds_pyq11`, `med_2001_mongols_iltutmish` |
| Badauni on MBT | 1999 | `d4_ds_pyq12`, `med_1999_badauni_tughlaq` |
| Biggest canal network | 1998 | `d4_ds_pyq14`, `med_1998_feroz_shah_canals` |
| Fawazil | 1998 | `d4_ds_pyq15`, `med_1998_fawazil_iqtadars` |
| Balban's title | 1997 | `d4_ds_pyq16`, `med_1997_balban_zil_ilahi` |

Fourteen pairs, so **28 of the 53 questions are 14 questions counted twice**.
The topic reports 53 questions and 42 past papers when it holds **39 distinct
questions and 28 distinct past papers**. A student working through the set
meets the same question twice within a few screens, which reads as a bug
rather than as revision.

The 2019/2023 pair is the worst case: the two copies are not only duplicated
but **dated differently and answered differently**.

### Two questions belong to other topics

| Question | Year | Where it belongs |
|---|---|---|
| Vijayanagara ruler who dammed the Tungabhadra (`pyq_dsu_2023_vijayanagara_dam`) | 2023 | **Vijayanagara**, topic 23 |
| Essential elements of the feudal system (`pyq_dsu_2015_feudal_elements`) | 2015 | General historiography. No Sultanate content at all |

Also here: the **2025 Araghatta** question, already logged under `Arab and
Turkish Invasions`, where it also appears. Between the two topics that word is
now asked three times (2016 here, 2025 here, 2025 there).

## Vijayanagara: nine questions belong elsewhere, and one drill answer is wrong

Thirty-six questions, twenty-eight past papers. Only about half are about
Vijayanagara.

### Nine questions filed here that are not about Vijayanagara

| Question | Year | Where it belongs |
|---|---|---|
| Rajendra I's campaign against Srivijaya (`pyq_vij_2025_*`) | 2025 | **Imperial Cholas** and **Southeast Asian Temples**, where note 19 already covers the Thanjavur inscription |
| Nannuka / Jayashakti / Nagabhata II / Bhoja dynasty pairs | 2022 | **Early Medieval North India** |
| Nizamat of Arcot; Mysore kingdom | 2021 | **Eighteenth century** |
| Nimbarka and Akbar; Kabir and Shaikh Ahmad Sirhindi | 2019 | **Medieval Bhakti** and **Sufism** |
| Tavernier and the diamond mines | 2018 | **Mughal-era European travellers** |
| Motupalli, a Kakatiya seaport | 2017 | **Early Medieval Deccan** |
| Siddhas (sittars) of the Tamil region | 2016 | **Medieval Bhakti** |
| Champaka / Durgara / Kuluta region pairs | 2015 | Early medieval historical geography |
| Mahattara and Pattakila | 2014 | **Early Medieval North India** |

The 2023 archaeologists question (Alexander Rea, Longhurst, Sewell, Burgess,
Elliot) is defensible here, since **Robert Sewell's book is what recovered
Vijayanagara for modern history**, so it is not listed as a mis-tag.

### One drill answer that does not follow from the handout

| Drill | Bank's answer | What the handout's table gives |
|---|---|---|
| "Match Vijayanagara kings with travellers: 1. Dev Raya I — Nicolo Conti; 2. Dev Raya II — Abdur Razzak; 3. Krishna Deva Raya — Cesare Frederici; 4. Achyut Raya — Nuniz. How many are correctly matched?" | **Only two** | **Three.** Pairs 1, 2 and 4 all match the handout's traveller table exactly. Only pair 3 is wrong: **Cesare Frederici belongs to Tirumala Deva Raya**, and Krishnadeva Raya's travellers are **Barbosa and Paes** |

Note 23 answers **three** and says where the bank differs.

### Seven questions stored twice

2024 Bhatkal, 2023 Tungabhadra dam, 2021 Nuniz on women, 2016 Krishnadeva Raya
taxation, 2015 Harihara I, 2004 succession statements, and the 2023 Tungabhadra
dam again under **Delhi Sultanate**, where it does not belong at all and is
already logged.

### One internal conflict inside Handout 25

The narrative section places the **Hazara Rama temple** under **Devaraya I**
("Hazara Rama temple, an excellent example of Deccan architecture, was
constructed during his rule"); the summary table at the end of the
architecture section credits it to **Krishnadeva Raya**. Note 23 records both
rather than choosing one silently.

The handout also labels **Tenasserim** as "upper Burma" in Nuniz's tribute
list, while labelling **Pegu** "lower Burma" two words earlier. Note 23 says
only "in Burma".
