import re

file_path = "lib/noteContent.ts"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

slug = "mauryan-empire"

new_html = """<h2>Sources</h2>

<h3>1. Archaeological Sources</h3>
<p><strong>Inscriptions</strong>: Inscriptions pertaining to Mauryan history can be divided into three parts: <strong>pre-Ashokan, Ashokan, and post-Ashokan inscriptions.</strong></p>
<ul>
<li>&#8226; <strong>Pre-Ashokan:</strong> Two inscriptions from <strong>Shogaura</strong> (copper plate, Brahmi script, Prakrit language) in Gorakhpur district and <strong>Mahasthan</strong> inscription (roughly circular stone, Brahmi script, Prakrit language) from Bogra district in Bangladesh.
<ul>
<li style="padding-left:2em">&#9702; Both deal with relief measures to be adopted during a famine.</li>
<li style="padding-left:2em">&#9702; Piprahwa casket inscription may also be pre-Ashokan.</li>
</ul>
</li>
<li>&#8226; <strong>Ashokan inscriptions</strong> consist of <strong>fourteen major rock edicts, minor rock edicts, seven pillar edicts, minor pillar edicts</strong> and some miscellaneous inscriptions.
<ul>
<li style="padding-left:2em">&#9702; <strong>14 major rock edicts</strong> found from 8 locations: Kalsi (Dehradun), Mansehra (NWFP, Pakistan), Shahbazgarhi (Peshawar), Girnar (Junagadh, Gujarat), Sopara (Thane, Mumbai), Erragudi (Kurnool, AP), Dhauli (Puri, Orissa), Jaguada (Ganjam, Orissa). Major rock edicts were perhaps later than the minor rock edicts.</li>
<li style="padding-left:2em">&#9702; <strong>Minor rock edicts</strong> are considered the earliest. Located in Bairat, Rupnath, Ahraura, Gujjara, Panguraria, Sasaram, Maski, Gavimath, Palkigundu, Nittur, Udegolam, Brahmagiri, Siddhapur, Jatinga Rameshwar, Bahapur (Delhi), Erragudi and Rajula Mandagiri.</li>
<li style="padding-left:2em">&#9702; <strong>Seven Major pillar edicts</strong> at Kosam (Allahabad), Topra (Delhi), Meerut (Delhi), Rampurva (Bihar), Lauriya Nandagarh (Betiah), Lauriya Araraj (Motihari) and Kandahar. Amaravati is an exception in the Deccan. Pillar edicts are the latest among the three groups.</li>
<li style="padding-left:2em">&#9702; <strong>Minor pillar inscriptions</strong>: schism edicts (Kosambi, Sanchi, Sarnath); commemorative inscriptions (Lumbini/Rummindei, Nigali Sagar); donative inscription of one of Ashoka's queens (Allahabad-Kosam pillar).</li>
<li style="padding-left:2em">&#9702; <strong>Cave inscriptions</strong> in the walls of Barabar hills (Gaya district, Bihar). Miscellaneous: bilingual inscription at Kandahar, Piyadassi inscriptions at Taxila, broken inscription near Jalalabad.</li>
</ul>
</li>
<li>&#8226; <strong>Post-Ashokan inscriptions:</strong> Cave inscriptions of <strong>Nagarjuni hills</strong> in Bihar, engraved during the reign of <strong>Dasarath</strong>. Help reconstruct Mauryan provincial administration.</li>
<li>&#8226; The <strong>Junagadh inscription of Rudradaman</strong> (150 CE) mentions that the Sudarshan Lake was constructed from the time of Chandra Gupta Maurya till Ashoka.</li>
<li>&#8226; <strong>Many Ashokan inscriptions have gone missing</strong> — Fahien and Xuanzang mentioned seeing pillars which cannot be found today.
<ul>
<li style="padding-left:2em">&#9702; Major rock edicts mostly along the borders; minor rock edicts have widest distribution with concentration in Karnataka.</li>
<li style="padding-left:2em">&#9702; Major pillar edicts mostly from North India.</li>
</ul>
</li>
<li>&#8226; Inscriptions mostly consist of explanations of <strong>Dhamma</strong>. Ashoka was a <strong>Buddhist</strong> in personal conviction. References to administration, society and economy are fewer.</li>
</ul>

<p><strong>Coins:</strong> Mauryan coins are <strong>punch-marked</strong> (mostly silver, fewer copper).</p>
<ul>
<li>&#8226; Discovered from North-West India, the Gangetic valley and the Northern Deccan.</li>
<li>&#8226; The meaning of motifs is hard to explain.</li>
<li>&#8226; Large-scale availability shows the economy — particularly trade and commerce — was in good shape.</li>
<li>&#8226; Arthashastra mentions silver coins (panas) and copper coins (mashakas).</li>
</ul>

<p><strong>Artefacts:</strong> Include <strong>NBPW</strong> (Northern Black Polished Ware) and burnt bricks. Mauryan terracotta found from Pataliputra to Taxila gives a glimpse of folk art and common beliefs.</p>

<h3>2. Literary Sources</h3>
<p>Divided into <strong>indigenous literature</strong> and <strong>foreign accounts</strong>. Indigenous literature further divided into religious and secular literature.</p>

<h4>a. Religious Literature</h4>
<ul>
<li>&#8226; <strong>Buddhist literature</strong> is the most important.
<ul>
<li style="padding-left:2em">&#9702; <strong>Jataka stories</strong> (3rd century BCE–2nd century CE) reveal socio-economic conditions.</li>
<li style="padding-left:2em">&#9702; <strong>Digha Nikaya</strong> exhibits Buddhist influence on the political sphere.</li>
<li style="padding-left:2em">&#9702; Sri Lankan chronicles — <strong>Dipavamsa</strong> (c. 4th–5th century) and <strong>Mahavamsa</strong> (c. 5th century) — confirmed that 'Piyadassi' is synonymous with 'Ashoka'; cover Buddhist councils and Ashoka's propagation of Buddhism in Sri Lanka.</li>
<li style="padding-left:2em">&#9702; <strong>Milindapanho</strong> (conversation between Indo-Greek king Menander and Buddhist saint Nagsena) contains some information on the Mauryan dynasty.</li>
<li style="padding-left:2em">&#9702; Tibetan Lama <strong>Taranath's accounts</strong> (c. 16th century CE) provide useful information.</li>
</ul>
</li>
<li>&#8226; <strong>Jaina work 'Parishishta Parvan'</strong> by Hemachandra (12th century CE) gives some information on the last phase of Chandragupta's reign.</li>
<li>&#8226; <strong>Brahmanical literature</strong>: <strong>Puranas</strong> give a list of Maurya kings interspersed with religious teachings. However, the list varies across Puranas, and they were compiled very late with frequent interpolations.</li>
</ul>

<h4>b. Secular Works</h4>
<ul>
<li>&#8226; <strong>Mudrarakshasa</strong> of Vishakadatta (5th century CE), <strong>Rajtarangini</strong> of Kalhana, <strong>Harshacharita</strong> of Banabhatta — composed later but refer to the Mauryan period in retrospect.</li>
<li>&#8226; The outstanding secular work is <strong>Arthashastra by Kautilya</strong>.
<ul>
<li style="padding-left:2em">&#9702; Some scholars consider it a 3rd century CE work, but similarities with Ashokan edicts suggest it was contemporary to the Mauryan period.</li>
<li style="padding-left:2em">&#9702; Gives detailed information about Mauryan society, polity and economy.</li>
</ul>
</li>
</ul>

<h4>c. Foreign Accounts</h4>
<ul>
<li>&#8226; Most important: <strong>'Indica' of Megasthenes</strong> — ambassador of <strong>Seleucus Nikator</strong> in the court of <strong>Chandragupta Maurya</strong>.
<ul>
<li style="padding-left:2em">&#9702; Original book has not survived; referred to by Diodorus, Strabo, Pliny and Arrian.</li>
<li style="padding-left:2em">&#9702; Basically deals with court life and town administration.</li>
</ul>
</li>
<li>&#8226; <strong>Limitations of Indica:</strong>
<ul>
<li style="padding-left:2em">&#9702; Subjectivity and prejudices reduce reliability.</li>
<li style="padding-left:2em">&#9702; As a royal guest, exposure to Indian society was limited.</li>
<li style="padding-left:2em">&#9702; Confused between practical and theoretical aspects — described Indian society as almost utopian; claimed 7 castes, non-existence of slavery, all land belongs to the king, Indians did not know writing.</li>
<li style="padding-left:2em">&#9702; Incredible accounts — unicorns, men with dog-like heads, gold-digging ants.</li>
<li style="padding-left:2em">&#9702; Later Greek and Roman authors cherry-picked sensational parts; unclear whether they directly accessed Indica or used it indirectly.</li>
</ul>
</li>
<li>&#8226; Accounts of <strong>Fa-Hien and Hiuen Tsang</strong> also throw some light on the Mauryan period.</li>
</ul>

<h4>Limitations of Literary Sources</h4>
<ul>
<li>&#8226; Lack of adequate contemporary support, problems of authenticity and dating.</li>
<li>&#8226; Buddhist, Jaina and Brahmanical texts have a religious bias — tendency to inflate or undermine the ancestry of Mauryas based on their own views.</li>
</ul>

<h3>Kautilya and Arthashastra</h3>
<ul>
<li>&#8226; Kautilya (also Chanakya/Vishnugupta) was <strong>Chandragupta Maurya's minister</strong> who helped overthrow the Nanda dynasty.</li>
<li>&#8226; Arthashastra is one of the most important sources for ancient Indian economy, legal institutions, social structures and polity.
<ul>
<li style="padding-left:2em">&#9702; Concerned with political theories and statecraft; also throws light on contemporary society.</li>
<li style="padding-left:2em">&#9702; Cites opinions of at least <strong>5 schools of political thinking and 13 individual political thinkers</strong>.</li>
<li style="padding-left:2em">&#9702; Contains <strong>15 Adhikaranas (books)</strong>. Each section begins by posing a problem in Sutras, then commenting (Tika).
<ul>
<li style="padding-left:4em">&#9632; First five books: internal administration; next eight: inter-state affairs; last two: miscellaneous.</li>
</ul>
</li>
<li style="padding-left:2em">&#9702; Framed from the perspective of a middle-sized kingdom of an ambitious king. Does not mention Mauryan kings — it is a theoretical work, not a memoir.</li>
<li style="padding-left:2em">&#9702; References to Sangha politics and Ajivikas locate it in the Mauryan period. Administrative structure outlined is uniquely Mauryan.</li>
</ul>
</li>
<li>&#8226; <strong>Debate on authorship:</strong> Some historians argue Kautilya's existence cannot be corroborated from Indica or Mahabhashya, and the authorship may be a later interpolation. However, none of these arguments convincingly refute Kautilyan authorship.</li>
</ul>

<h2>Foundation of Mauryan Empire</h2>
<ul>
<li>&#8226; <strong>D.D. Kosambi</strong> argued that Alexander's invasion hastened the Mauryan conquest — tribes of North-West had already been weakened.</li>
<li>&#8226; Greek sources suggest Chandragupta even met Alexander and advised him to attack Magadha.</li>
<li>&#8226; Alexander's retreat created a vacuum; most of the Gangetic Valley was already under Magadha's control.</li>
<li>&#8226; Chandragupta was assisted by <strong>Kautilya</strong> (also known as Chanakya or Vishnugupta).</li>
</ul>

<h2>Chandra Gupta Maurya (321/322 BCE to 300 BCE)</h2>
<ul>
<li>&#8226; Most historians assign a <strong>'lower caste' or tribal origin</strong> to the Maurya family.</li>
<li>&#8226; According to some accounts, Chandragupta was the son of the last Nanda king by a "low born" woman called <strong>Mura</strong> — the name Maurya came from her.</li>
<li>&#8226; Both Indian and Classical sources agree that Chandragupta <strong>overthrew the last Nanda king and occupied Pataliputra</strong> — linked with his accession c. 321 BCE.</li>
<li>&#8226; Engaged <strong>Seleucus Nikator</strong> (c. 305 BCE). Chandragupta won; peace concluded c. 303 BCE.
<ul>
<li style="padding-left:2em">&#9702; Seleucus gave him eastern Afghanistan, Baluchistan and the area west of the Indus in return for 500 elephants.</li>
<li style="padding-left:2em">&#9702; A marital alliance was also concluded.</li>
<li style="padding-left:2em">&#9702; Seleucus sent <strong>Megasthenes</strong> as ambassador to Chandragupta's court.</li>
</ul>
</li>
</ul>

<h2>Bindusara (c. 300 BCE to 273/272 BCE)</h2>
<ul>
<li>&#8226; Son of Chandragupta. Known as <strong>'Amitrachotus'</strong> in Greek sources. Little is known about him.</li>
<li>&#8226; Had contacts with <strong>Seleucid king of Syria, Antiochus I</strong>, requesting sweet wine, dried figs and a sophist.</li>
<li>&#8226; Called the "slayer of foes". Taranath mentions he was "master of the land between the two seas" — may indicate victory over the Deccan.</li>
<li>&#8226; Religious leanings were towards the <strong>Ajivikas</strong>.</li>
<li>&#8226; After his death c. 273–272 BCE, <strong>succession struggle</strong> lasted ~4 years. Bindusara favoured Susima but Ashoka was supported by ministers, especially <strong>Radhagupta</strong>.</li>
<li>&#8226; According to Dipavamsa and Mahavamsa, Ashoka killed his 99 brothers and spared one, Tissa. <strong>Ashoka crowned c. 269–268 BCE.</strong></li>
</ul>

<h2>Extent of Mauryan Empire</h2>
<ul>
<li>&#8226; <strong>Possibly the largest empire in the Indian subcontinent</strong>; gave actual shape to the idea of 'Jambudvipa'; became an ideal for later empires.</li>
<li>&#8226; Chandragupta captured the region between the <strong>rivers Beas and Indus</strong> by exploiting Alexander's withdrawal. He then dethroned Dhanananda and captured Pataliputra c. 322 BCE.</li>
<li>&#8226; Got <strong>Kabul, Kandahar, Balochistan and Herat</strong> from Seleucus. Empire extended up to the <strong>Hindu Kush range</strong> in the North-West.</li>
<li>&#8226; <strong>Central India</strong>: Ashoka was Governor of Ujjain (title 'Ujjain Karmoli') before becoming king. Ashokan inscriptions from Gurjara, Rupnath, Panguraria and Sanchi establish Mauryan control.</li>
<li>&#8226; <strong>Himalayan foothills and upper/middle Gangetic basin</strong>: Inscriptions of Rummindei, Nigali Sagar, Kalsi, Rampurva, Lauriya Areraj and Lauriya Nandangarh confirm control. Major pillar edicts traced from this region.</li>
<li>&#8226; <strong>Bengal</strong>: Ashoka travelled to Tamralipti to see off son Mahendra and daughter Sangamitra to Sri Lanka. Chandragupta's rock edict found at Mahasthan (Bangladesh).</li>
<li>&#8226; <strong>Gujarat and Maharashtra</strong>: Junagadh inscription of Rudradaman — Pushyagupta (Chandragupta's time) and Tushaspa (Ashoka's time) were governors of Kathiawar. Major rock edicts from Girnar and Sopara.</li>
<li>&#8226; <strong>Peninsular India</strong>: Up to the region of Brahmagiri, including minor rock edicts from Nittur, Udegolam, Gavimath, Palkigundu, Brahmagiri, Maski, Sannati (Karnataka) and Yerragudi (Andhra).</li>
<li>&#8226; <strong>Kalinga</strong> (present-day Orissa) still had to be conquered — strategic importance as the route to South India by land and sea. Ashoka describes its conquest in <strong>Major Rock Edict XIII</strong> — took place in the 8th year of his rule.</li>
</ul>

<h2>Mauryan Administration</h2>

<h3>Introduction</h3>
<ul>
<li>&#8226; The Mauryan state was firmly established by the <strong>3rd century BCE</strong> with a layered administrative apparatus — core region (Magadha), regional centres and peripheral areas.</li>
<li>&#8226; Sources have limitations: Arthashastra speaks from the perspective of a kingdom aspiring to become an Empire; Indica references are fragmentary; Ashokan inscriptions mainly focus on Dhamma.</li>
<li>&#8226; Administrative levels: <strong>central, provincial, district and village.</strong></li>
</ul>

<h3>Central Administration</h3>
<p>Classified under: I. The King &nbsp; II. Council of Ministers and Bureaucracy &nbsp; III. Army &nbsp; IV. Espionage &nbsp; V. Law and Justice &nbsp; VI. Revenue Administration &nbsp; VII. Public Works</p>

<p><strong>The King</strong></p>
<ul>
<li>&#8226; The King was the <strong>supreme authority</strong>. Called <strong>'Dharmapravartaka'</strong> (upholder/promulgator of social order).</li>
<li>&#8226; Arthashastra: King's law prevailed over traditional law (Shastras) when they diverged.</li>
<li>&#8226; Three basic pre-conditions (Arthashastra): (1) Pay equal attention to all matters. (2) Remain vigilant for corrective action. (3) Always discharge his duties.</li>
<li>&#8226; By Ashoka's time, a <strong>paternal attitude</strong> emerged — Dhauli and Jaguada inscriptions: "all subjects are his children."</li>
<li>&#8226; Ashoka was an absolute monarch but maintained welfare as the primary goal. By adopting the title <strong>'Devanampiya'</strong> (beloved of the Gods), he emphasised the link between kingship and divinity — may indicate authority over religious matters too.</li>
</ul>

<p><strong>Council of Ministers (Mantrin Parishad)</strong></p>
<ul>
<li>&#8226; Arthashastra and Ashokan inscriptions refer to the <strong>Mantrin Parishad</strong>.</li>
<li>&#8226; Major Rock Edict III: Parishad ensures new administrative measures are carried out. Edict VI: ministers can discuss policy in the King's absence, suggest amendments — but must report to the King immediately.</li>
<li>&#8226; Role was <strong>primarily advisory</strong>; final authority vested with the King. No fixed number of ministers — Kautilya said it should be decided by need but a large council is beneficial.</li>
<li>&#8226; Issues for ministerial consultation: how to start state work; manpower and finances needed; new initiatives; dealing with calamities.</li>
<li>&#8226; <strong>Amatyas</strong>: civil servants filling the highest administrative and judicial appointments.</li>
<li>&#8226; Central administration conducted by <strong>Superintendents (Adhyakshas)</strong> — Kautilya mentions ~27 Adhyakshas: Akshapataladhyaksha (Accountant-General), Sitadhyaksha (royal lands), Akaradhyaksha (mining), Lavanyadhyaksha (salt), Navadhyaksha (ports), Panyadhyaksha (commerce), Sulkadhyaksa (customs and tolls), Suradhyaksha (excise), Pautavadhyaksha (weights and measures), Maudradhyaksha (mint), etc.</li>
</ul>

<p><strong>Army</strong></p>
<ul>
<li>&#8226; Pliny: 9000 elephants, 30000 cavalry, 6000 infantry. Plutarch: 6000 elephants, 80000 horses, 20000 foot soldiers, 8000 war chariots. These may be exaggerated.</li>
<li>&#8226; According to Megasthenes, branches: Infantry, Cavalry, Elephants, Chariots, Transport, Naval fleet — each looked after by a committee of 5 members.</li>
<li>&#8226; Kautilya's <strong>'Chaturangabala'</strong>: infantry, cavalry, chariots and elephants — each under a commander. Also mentions medical services to the army.</li>
</ul>

<p><strong>Espionage</strong></p>
<ul>
<li>&#8226; Well-knit espionage system. Tasks: keeping an eye on ministers; reporting on government officials; collecting impressions of public opinion; finding out secrets of foreign rulers.</li>
</ul>

<p><strong>Judicial Administration</strong></p>
<ul>
<li>&#8226; Arthashastra contains codes listing punishments for a vast range of offences.</li>
<li>&#8226; Two kinds of courts: <strong>Dharmasthiya</strong> (personal disputes) and <strong>Kantak Shodhan</strong> (criminal matters).</li>
<li>&#8226; Courts existed at village level (Gramikas), Janapada level and the centre. The king held supreme judicial power.</li>
</ul>

<p><strong>Revenue Administration</strong></p>
<ul>
<li>&#8226; Treasury looked after by an official called <strong>'Sannidhata'</strong>.</li>
<li>&#8226; Sources of revenue: Income from fortified cities (Durga) — fines, sales tax (Shulka), excise, income tax (Arthashastra lists 21 such taxes); income from rural areas — crown lands (Sita), land revenue (Bhaga); income from mines; irrigation works; herds of animals; forest produce; trade routes.</li>
</ul>

<p><strong>Public Works</strong></p>
<ul>
<li>&#8226; Irrigation: State supervised dams, ponds, canals. Violations of water-use regulations were an offence. Sudarshan Lake originally constructed during Chandragupta's times (mentioned in Rudradaman inscription).</li>
<li>&#8226; Medical professionals: physicians (Chikitsakah), midwives (Garbhavyadh). Ashokan inscriptions: medical treatment for men and animals.</li>
<li>&#8226; State helped citizens during natural calamities; looked after orphans and old destitute women (Arthashastra).</li>
<li>&#8226; Laying and repairing roads, opening inns.</li>
</ul>

<h3>Provincial Administration</h3>
<ul>
<li>&#8226; Headed by a <strong>Kumara/Aryaputra</strong> (royal prince) as King's representative, assisted by <strong>Mahamatyas/Mahamatras</strong> and a council of ministers.</li>
<li>&#8226; Four provincial capitals from Ashokan edicts: <strong>Tosali</strong> (east), <strong>Ujjain</strong> (west), <strong>Suvarnagiri</strong> (south), <strong>Taxila</strong> (north).</li>
<li>&#8226; Some areas administered by minor rulers — e.g. Tushaspa (Yavana Raja) as governor of Junagadh during Ashoka; Pushyagupta (Vaishya) as governor during Chandragupta.</li>
</ul>

<h3>District and Village Level Administration</h3>
<ul>
<li>&#8226; District officials: <strong>Pradeshika</strong> (overall in-charge, revenue and law &amp; order), <strong>Rajuka</strong> (surveyor and assessor of land), <strong>Yukta</strong> (secretarial assistant).</li>
<li>&#8226; In the 4th Pillar Edict, Ashoka granted "independent authority" to the Rajukas for public welfare matters.</li>
<li>&#8226; Village officials called <strong>'Gramikas'</strong>. Intermediate officers between district and village: <strong>Gopas</strong> (accountants — maintained records of village boundaries, land use, income/expenditure, taxes) and <strong>Sthanikas</strong> (collected revenue, functioned under Pradeshika).</li>
</ul>

<h3>City Administration</h3>
<ul>
<li>&#8226; Megasthenes described <strong>Palibothra (Pataliputra)</strong>: city council divided into <strong>six sub-councils</strong>, each with five members.
<ul>
<li style="padding-left:2em">&#9702; 1st: Industry and crafts (inspection of production centres, fixing wages).</li>
<li style="padding-left:2em">&#9702; 2nd: Foreigners (food, lodging, comfort, security).</li>
<li style="padding-left:2em">&#9702; 3rd: Registration of births and deaths.</li>
<li style="padding-left:2em">&#9702; 4th: Trade and commerce (weights and measures, market control).</li>
<li style="padding-left:2em">&#9702; 5th: Sale of manufactured goods (distinguishing new from second-hand).</li>
<li style="padding-left:2em">&#9702; 6th: Collected taxes on goods sold — rate usually 1/10th.</li>
</ul>
</li>
<li>&#8226; Arthashastra mentions the <strong>Nagaraka</strong> (city superintendent) responsible for law and order, assisted by Gopa and Sthanika.</li>
<li>&#8226; City administration regulated: sanitation and water sources, checking adulteration, watching over inns, precautions against fire.</li>
</ul>

<h3>Limitations of Centralisation</h3>
<ul>
<li>&#8226; Uncritical reading of Arthashastra misleads one to assume a <strong>high degree of centralisation</strong>.</li>
<li>&#8226; <strong>Gerard Fussman's extreme view</strong>: Ashoka's authority was merely limited to religious affairs. This view gives too much importance to transport and communication backwardness.</li>
<li>&#8226; Given the vastness of the empire, <strong>significant decentralisation was inevitable</strong>, but Mauryan state had some elements of centralisation — e.g. appointment of key provincial officials, receiving revenue tributes, hosting royal armed forces strategically, imposing rules for ease of doing business.</li>
<li>&#8226; <strong>Romila Thapar's nuanced stand</strong>: divided empire into metropolitan, core and peripheral areas.
<ul>
<li style="padding-left:2em">&#9702; <strong>Metropolitan (Magadha)</strong>: highest degree of centralisation.</li>
<li style="padding-left:2em">&#9702; <strong>Core area</strong>: conquered states, important trading centres, areas of incipient state formation. Centralisation was necessary only to consolidate Mauryan control. Important trade centres (ports, craft production centres, mines) received greater central attention.</li>
<li style="padding-left:2em">&#9702; <strong>Periphery</strong>: pre-state societies (forest dwellers, hill tribes, rugged terrain). Greater internal autonomy but had to meet central demands for revenue, resources and manpower.</li>
</ul>
</li>
</ul>

<h2>Mauryan Society</h2>
<ul>
<li>&#8226; Three sources: <strong>Indica of Megasthenes, Buddhist texts, Kautilya's Arthashastra.</strong></li>
<li>&#8226; <strong>Megasthenes</strong>: divided Mauryan society into 7 occupation-based groups but mistakenly called them 7 classes (genos), borrowing Herodotus's method for Egyptian society. He was closer to understanding the social order when noting that people in India could not marry outside their genos or practise someone else's occupation.</li>
<li>&#8226; <strong>Buddhist texts</strong>: mention 4 Varnas with a changed hierarchy — 'Khatiya' placed above 'Babhan'; Vessa and Suda unchanged.</li>
<li>&#8226; <strong>Kautilya (Arthashastra)</strong>: shows old Brahmanic prejudice but was more lenient than Dharma Sutras.
<ul>
<li style="padding-left:2em">&#9702; Refers to Shudras as 'Arya'; asserts shudras cannot be enslaved; encourages their involvement in agriculture.</li>
<li style="padding-left:2em">&#9702; Lenient towards women; respectfully deals with 'Ganikas' (Prostitutes) — a source of royal income, patronised by the state.</li>
<li style="padding-left:2em">&#9702; Gives social acceptance to all 8 types of marriages including the 4 'adharma' types — because denial of social acceptance would cause inhumane suffering to offspring.</li>
<li style="padding-left:2em">&#9702; The difference from Dharma Sutras: Dharma Sutras aimed to strictly maintain Varna-based social norms; Arthashastra's priority was the acquisition of Artha (resources) to create a powerful monarchical state.</li>
</ul>
</li>
</ul>

<h2>Mauryan Economy</h2>
<ul>
<li>&#8226; An <strong>expanding economy</strong> — result of rural agricultural productivity, iron-based craft production and trade. Strong army ensured internal security.</li>
<li>&#8226; A <strong>classic model of state controlled economy</strong>: State participated in agriculture, industries and trade; provided infrastructure; employed a large bureaucracy; taxed all segments of society and imposed fines for minor offences.</li>
</ul>

<h3>Rural Economy</h3>
<ul>
<li>&#8226; Developed by establishing new settlements. Shudras (slaves and hired labourers) were transported to new areas with land, tax exemptions, cattle, seeds and money.</li>
<li>&#8226; Megasthenes claimed all land belonged to the king — but historians argue the king was the <strong>protector of land, not the owner.</strong></li>
<li>&#8226; Jatakas mention 'Gahapatis' and 'Gramabhojakas' — Romila Thapar: Gahapatis were entrepreneurs responsible for developing agricultural villages in new areas.</li>
<li>&#8226; Two categories of land: (i) cultivators paid traditional taxes; (ii) <strong>Sita land</strong> — directly under crown supervision.</li>
<li>&#8226; Principal tax: <strong>Bhaga</strong> (royal share in harvest) — 1/6th normally; raised to 1/4th during emergencies. Sharecroppers paid half their crop.</li>
<li>&#8226; Other taxes: <strong>Pindakara</strong> (assessment tax from groups of villages), <strong>Bali</strong> (nature unknown), <strong>Kara</strong> (produce from fruit and flower gardens), <strong>Senabhakta</strong> (provision to royal army), <strong>Hiranya</strong> (payment in cash).</li>
<li>&#8226; Emergency tax <strong>'Pranaya'</strong> — 1/3rd or 1/4th of produce according to soil nature (only once).</li>
</ul>

<h3>Craft Production</h3>
<ul>
<li>&#8226; <strong>Mining and metallurgy</strong> sustained royal power, agriculture, trade and industry.</li>
<li>&#8226; State exercised <strong>monopoly</strong> on arms, ships, salt production and certain implements. Dyes, gums, drugs and perfume manufactured in state enterprises. Liquor brewing under official supervision.</li>
<li>&#8226; Centres like Mathura, Kasi and Mahisa became famous for excellent fabric. Woollen work flourished.</li>
<li>&#8226; Advanced leather work, stone cutting, pottery (NBPW, ring wells) at a high level of specialisation.</li>
</ul>

<h3>Guilds</h3>
<ul>
<li>&#8226; Craftsmen organised into <strong>guilds</strong> — developed and stabilised under Mauryas due to extension of trade.
<ul>
<li style="padding-left:2em">&#9702; Controlled almost entire manufacturing; registered by local officials; developed social hierarchy within artisans.</li>
<li style="padding-left:2em">&#9702; Acted as a check on fraudulent practices; maintained wage levels by collective bargaining.</li>
<li style="padding-left:2em">&#9702; By the last phase of Mauryan rule, guilds became <strong>independent of state's economic policy</strong> — an important reason for continued economic prosperity even after the Mauryan sunset. Guilds are mentioned as significant sources of religious charity in post-Mauryan Buddhist and Jaina sources.</li>
</ul>
</li>
</ul>

<h3>Trade and Commerce</h3>
<ul>
<li>&#8226; Trade regulations carefully planned and executed. Tax rate on merchandise: 1/10th. Foreign articles: not more than 10% profit; indigenous articles: not more than 5% profit.</li>
<li>&#8226; Trade flourished due to <strong>political unity and centralised administration</strong> — efficient transport, security and communication. Friendly relations with Hellenistic rulers reinforced Indian foreign trade.</li>
<li>&#8226; <strong>Trade Materials</strong>: Foreign trade mainly with Egypt, West Asia, Red Sea region and Seleucid Empire in the West; Burma, Sri Lanka and South East Asia in the East. Exports: ivory, tortoise shells, pearls, cotton textile, rare wood. Imports: horses, hides and other luxury goods.</li>
<li>&#8226; <strong>Four main trade routes:</strong>
<ul>
<li style="padding-left:2em">&#9702; East-West along Ganga-Yamuna: Chandraketugarh to Mathura via Pataliputra, Banaras and Kosambi.</li>
<li style="padding-left:2em">&#9702; North to Deccan: Ganga-Yamuna doab to Pratishthana, Bharuch, Dwarka, Suvarnagiri, Mosali.</li>
<li style="padding-left:2em">&#9702; Pataliputra to ports: Tamralipti, Mahasthangarh and Chandraketugarh.</li>
<li style="padding-left:2em">&#9702; Ganga-Yamuna to North-West: Taxila, Sakala (Sialkot), Pushkalavati (Peshawar) — further stretched to the great highways of central and western Asia.</li>
</ul>
</li>
</ul>

<h3>Money Economy</h3>
<ul>
<li>&#8226; Coins: gold (Nishka/Suvarna), silver (Dharanas/Panas) and copper (Karshapana/Masika). Issued by a central authority (imperial mint).</li>
<li>&#8226; Copper coins — smaller denomination — more widely used; silver coins mainly hoarded or used for high-value transactions.</li>
<li>&#8226; Megasthenes's claim that Indians neither put money in usury nor knew how to borrow is contradicted by Kautilya's treatment of organised money-lending in the Arthashastra.</li>
</ul>

<h2>External Contacts of Mauryas</h2>
<p>Two distinct phases of foreign relations:</p>
<ul>
<li>&#8226; <strong>(i) Initial phase — expansion:</strong> Policy of securing trade routes and subjugating Greek settlements in North and North-West. Incorporation of central India gave control over Dakshinapatha. Initial phase ended with the Kalinga war.</li>
<li>&#8226; <strong>(ii) Latter phase — consolidation:</strong> Emphasis shifted to consolidation and maintaining friendly relations. Regular exchange of messengers during Bindusara. Strabo mentions Deimachus as successor to Megasthenes in the Mauryan court.</li>
<li>&#8226; In <strong>Major Rock Edict XIII</strong>, Ashoka referred to five contemporary rulers: Antiochus II of Syria, Ptolemy II Philadelphus of Egypt, Antigonas of Macedonia, Magas of Cyrene and Alexander of Epirus — in the context of <strong>dhammavijaya</strong>.</li>
<li>&#8226; Relations with Southern powers (Chola, Pandyas, Tampraparni/Sri Lanka) were cordial.</li>
<li>&#8226; Marked shift: from expansion and subjugation to <strong>friendship and moral conquest.</strong></li>
</ul>

<h2>Internal and External Policy of Ashoka</h2>
<ul>
<li>&#8226; Brahmanic texts projected him as a less important king; Buddhist texts (Sri Lankan chronicles) presented him as a monk-king; Ashokan inscriptions throw fresh light — major rock edicts show a monarch with a different attitude who respected all dominant religious sects; minor edicts project him as a dedicated Buddhist.</li>
</ul>

<h3>Ashoka's Policy of Dhamma</h3>
<ul>
<li>&#8226; <strong>Dhamma</strong> mainly means <strong>righteousness</strong> — not religion per se.</li>
<li>&#8226; <strong>Earlier view</strong>: Dhamma was synonymous with Buddhism. Evidence: Bhabru inscription (faith in three gems of Buddhism); Rummindei inscription (visited Lumbini); Rupnath inscription (lay Buddhist follower); Schism inscriptions (concern for discipline in Buddhist monasteries).</li>
<li>&#8226; <strong>Counter Argument</strong>: Ashoka's state policy rose above sectarian boundaries.
<ul>
<li style="padding-left:2em">&#9702; From Brahmanism: royal conduct, discipline and coercive power. From Buddhism: morality, a code of conduct.</li>
<li style="padding-left:2em">&#9702; His Dhamma emphasised: respect for elders, parents and teachers; compassion towards slaves and servants; equal respect to Brahmanas and Shramanas.</li>
<li style="padding-left:2em">&#9702; He did not talk about four noble truths or eightfold path. Minor rock edict 3 (Bairat/Bhabru) is the only exception — recommends six Buddhist texts to laypersons.</li>
</ul>
</li>
<li>&#8226; The policy of Dhamma fulfilled <strong>political, economic and cultural needs</strong>:
<ul>
<li style="padding-left:2em">&#9702; Political: Maintaining unity and integrity of a vast multi-racial, multilingual, multi-regional empire through persuasion rather than coercion.</li>
<li style="padding-left:2em">&#9702; Economic: Encouraged agrarian activities by discouraging animal slaughter.</li>
<li style="padding-left:2em">&#9702; Cultural: Encouraged cultural homogeneity and religious tolerance.</li>
</ul>
</li>
<li>&#8226; Ashoka dabbled with Zoroastrianism — in the Aramaic version (Kandahar) of his inscription, he declared there is no last judgement for a sacred man.</li>
<li>&#8226; Ashoka becomes unique — comparable only to Akhenaten of Egypt (c. 1300 BCE) in world history. Presented a universal civil code. After independence, his policy reappeared as <strong>Panchsheel doctrine</strong> and the <strong>Gujral doctrine</strong>.</li>
</ul>

<h3>Evaluation of Dhamma Policy in External Affairs</h3>
<ul>
<li>&#8226; Gave up military conquest for <strong>conquest by Dhamma</strong>. Replaced <strong>Bherighosha</strong> (siren of war) with <strong>Dhammaghosha</strong>.</li>
<li>&#8226; Appointed <strong>'Dhamma Duta'</strong> (moral ambassadors) in place of Rajaduta.</li>
<li>&#8226; Major Rock Edict VII (supposedly last royal order) shows dissatisfaction with Dhamma policy's progress. Permanent peace could not be established — successors were invaded by Indo-Greeks just after Ashoka's death.</li>
<li>&#8226; <strong>Long Term Impact</strong>: Success lay in unique methods and noble objectives. Rejected Kautilya's 'Rajmandala' doctrine; emphasised peace with neighbours.</li>
</ul>

<h3>Did Dhamma Contribute to Mauryan Decline?</h3>
<ul>
<li>&#8226; Counter-argument: Ashoka was pragmatic — he neither gave up power nor demobilised his army. Death penalty was not abolished.</li>
<li>&#8226; However, Dhamma did have some negative impact:
<ul>
<li style="padding-left:2em">&#9702; Dhamma Mahamatras started to interfere in the personal life of the people — possibly producing reaction against the government.</li>
<li style="padding-left:2em">&#9702; Too much emphasis on welfare works strained state finances.</li>
<li style="padding-left:2em">&#9702; Shift in focus from governance to promotion of morality — administration suffered.</li>
<li style="padding-left:2em">&#9702; Successors inherited an army that had not fought for 30 years — fell easily before the invading Bactrian-Greeks.</li>
</ul>
</li>
</ul>

<h2>Disintegration of Mauryan Empire</h2>
<ul>
<li>&#8226; Decline began with Ashoka's death c. 232 BCE. Succeeded directly by two grandsons — <strong>Dasartha</strong> (eastern half) and <strong>Samprati</strong> (western half, capital Ujjain).</li>
<li>&#8226; Western province lost to Bactrian Greeks by c. 180 BCE. Threat from Deccan: the Andhra dynasty.</li>
<li>&#8226; <strong>Brihadratha</strong>, last Maurya ruler, assassinated by <strong>Pushyamitra Sunga</strong> (commander-in-chief) c. 181 BCE. Mauryan rule ended within <strong>50 years of Ashoka's death.</strong></li>
</ul>

<h3>Reasons for Disintegration</h3>
<p><strong>General Causes:</strong></p>
<ul>
<li>&#8226; <strong>Localism:</strong> Great diversity of people, language and culture with primitive means of communication. Most regions were economically self-sufficient; maintaining armies everywhere was impractical. Centrifugal tendencies emerged at the slightest sign of central weakness.
<ul>
<li style="padding-left:2em">&#9702; Divyavadana: Ashoka sent to suppress a revolt in Taxila. Plutarch: Chandragupta had to 'overrun' his territory to establish order.</li>
</ul>
</li>
<li>&#8226; <strong>Chain of weak successors:</strong> Incompetent rulers after Ashoka. Military bureaucracy grew restive as military conquests had ended.</li>
<li>&#8226; <strong>Threat of court intrigues:</strong> Centralised bureaucracies are fertile grounds for factionalism. Romila Thapar: arbitrary system of recruitment — arbitrary appointments to strengthen individual power bases, competition between factions making government unstable. The case of Pushyamitra Sunga exemplifies this.</li>
</ul>

<p><strong>Causes Specific to the Mauryan Empire:</strong></p>
<ul>
<li>&#8226; A distinct feature of Mauryan collapse was its <strong>suddenness</strong> — only ~50 years after Ashoka's death.</li>
<li>&#8226; Romila Thapar: <strong>refutes</strong> the proposition that Ashoka's pro-Buddhist policies led to the Brahmanical revolt of Pushyamitra Sunga — Pushyamitra's coup was more of a <strong>military coup</strong> than a conscious pro-Brahmin revenge. The fact that Pushyamitra could become commander-in-chief shows there was no discrimination against Brahmins.</li>
<li>&#8226; Romila Thapar and H.C. Ray Chaudhary: the view that Ashoka's obsession with non-violence emasculated the army is overstretched (Bhandarkar). One person cannot bring about such a drastic change in the character of a people. The army grew weak primarily due to <strong>economic strain on state finances.</strong></li>
<li>&#8226; <strong>Ashoka's Role:</strong> Successors had the burdensome model of Ashoka's pacifism. Shift in focus from governance to promotion of morality meant administration suffered. The most important cause was the <strong>economic consequences of Dhamma policy</strong>:
<ul>
<li style="padding-left:2em">&#9702; Army became rigid and too costly to maintain after the Kalinga war.</li>
<li style="padding-left:2em">&#9702; Ashoka substantially added to an already large bureaucracy — officers who contributed little to organisation and nothing to production.</li>
<li style="padding-left:2em">&#9702; Charitable public works and donations drained state resources.</li>
<li style="padding-left:2em">&#9702; Mounting expenditure not accompanied by territorial gains.</li>
<li style="padding-left:2em">&#9702; Tax structure stretched to its limits. Possible deforestation in Doab area causing floods, crop damage and loss of revenue.</li>
<li style="padding-left:2em">&#9702; <strong>Kosambi's analysis</strong>: silver content in punch-marked coins decreased in the later years of Ashoka's reign — coin debasement to meet demands of a deflated treasury.</li>
</ul>
</li>
<li>&#8226; Conclusion: The ultimate political disintegration was caused in a large measure by the <strong>gradual weakening of imperial finances.</strong></li>
</ul>"""

# Try to replace existing slug entry first
pattern = r'("' + slug + r'":\s*`)[^`]*(`)'
new_content = re.sub(pattern, lambda m: m.group(1) + new_html + m.group(2), content, flags=re.DOTALL)

if new_content != content:
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(new_content)
    print(f"SUCCESS: '{slug}' content replaced.")
else:
    # Slug not found — append before closing }; of the export
    append_entry = f'\n  "{slug}": `{new_html}`,\n'
    close_pattern = r'(\n\};)'
    new_content2 = re.sub(close_pattern, lambda m: append_entry + m.group(1), content, count=1)
    if new_content2 != content:
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(new_content2)
        print(f"SUCCESS: '{slug}' appended to noteContent.")
    else:
        print(f"ERROR: Could not find insertion point in {file_path}.")
