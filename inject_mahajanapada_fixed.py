import re

file_path = "lib/noteContent.ts"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

slug = "mahajanapada"

new_html = r"""<h2>Mahajanapada Period (600\u2013400 BCE)</h2>

<h3>Sources for the Study</h3>
<h4>1) Literary sources</h4>
<ul>
<li>&#8226; A larger corpus of literary sources is available for the study of this period. These literary texts include <strong>religious and non-religious texts, as well as foreign accounts</strong>.
<ul>
<li style="padding-left:2em">&#9702; Religious texts can further be categorised into the Brahmanic, Buddhist and Jaina literature.</li>
</ul>
</li>
<li>&#8226; This multiplicity of sources facilitates a comparative study of this period, thus creating a better picture of the contemporary situation.</li>
</ul>

<h4>a) Religious literature</h4>
<h5>Brahmanic literature</h5>
<ul>
<li>&#8226; This includes <strong>Upanishads</strong>, six <strong>Vedangas</strong> including 'Kalpasutras' along with Grihasutras, Dharma-sutras, Shrota-sutras etc.
<ul>
<li style="padding-left:2em">&#9702; The <strong>Dharma sutras</strong> written by Baudhayana, Apashtamba, Gautama and Vashista are important sources for the study of this period.</li>
</ul>
</li>
<li>&#8226; But, the Brahminic literature represents the viewpoint of <strong>only the upper strata</strong> of society.</li>
</ul>

<h5>Buddhist and Jaina literature</h5>
<ul>
<li>&#8226; Buddhist literature consists of <strong>'Tripitakas'</strong> i.e. Sutta Pitaka, Vinaya Pitaka and Abhidhamma Pitaka.
<ul>
<li style="padding-left:2em">&#9702; They throw light on the socio-economic and political institutions of the time.</li>
</ul>
</li>
<li>&#8226; Likewise Jaina literature includes <strong>12 Angas</strong> (which were compiled in the 5th 6th century based on the 14 Purvas, which are now lost), <strong>Bhadrabahu Charita</strong>, <strong>Kalpa-sutra</strong> (biography of Jain Tirthankars, attributed to Bhadrabahu, but compiled much later), <strong>Parishishta Parvan</strong> (written in the 12th century by Hemachandra gives a history of the early Jain teachers and certain details of the political history) etc.</li>
<li>&#8226; Although a <strong>Buddhist or a Jain bias</strong> in this viewpoint cannot be ruled out, the Buddhist and Jaina texts were compiled in Pali and Prakrit respectively and they reflect the <strong>life of the lower strata</strong> of society more closely.</li>
</ul>

<h4>b) Non-religious literature</h4>
<ul>
<li>&#8226; Some sections of the <strong>Arthasastra</strong> (by Kautilya) which belonged to the pre-Maurya period, throw light on this period, as well.</li>
<li>&#8226; <strong>Ashtadhyayi</strong> of Panini (c. 5th - 4th BCE) is a work on Sanskrit grammar.
<ul>
<li style="padding-left:2em">&#9702; He sums up the rules of Sanskrit grammar in 3996 sutra (short condensed instructive statements).
<ul>
<li style="padding-left:4em">&#9632; He inspired later grammarians like Katyayana (4th century BCE; Varttika Kara) and Patanjali (2nd century BCE; Mahabhashya).</li>
</ul>
</li>
<li style="padding-left:2em">&#9702; In order to illustrate the grammar rules, Panini <strong>indirectly refers to many aspects of his time including places, people, customs, coins, measures and weights, institutions etc.</strong></li>
</ul>
</li>
</ul>

<h4>c) Foreign accounts</h4>
<ul>
<li>&#8226; As Persian and Greek invasions took place (in the North-Western part of the subcontinent) during this period, we get a glimpse of the conditions in North-Western region through the works of <strong>Greek and Latin writers.</strong></li>
<li>&#8226; These authors include <strong>Herodotus</strong> (he wrote 'Historica', in which he talks about the trade between India and Persia) and those Greek scholars who came to India with Alexander (Aristobulus, Nearchus etc.)</li>
<li>&#8226; <strong>Aristobulus</strong> accompanied Alexander on his campaign to India. Aristobulus' account of Alexander's conquests <strong>'History of War'</strong> which he started to write during the Indian campaign, is now lost but it was (together with a <strong>biography of Alexander by Ptolemy</strong> and the <strong>Indiké by Nearchus</strong>) among the most important sources of <strong>Arrian's 'Anabasis'</strong>, our main source for the career of the Macedonian conqueror.
<ul>
<li style="padding-left:2em">&#9702; Aristobulus' work is also quoted by other authors, but there are <strong>indications that not all quotations are authentic</strong>.</li>
<li style="padding-left:2em">&#9702; This source, therefore, remains a bit mysterious.</li>
</ul>
</li>
<li>&#8226; <strong>These Greek accounts are the only source for the study of the North-West.</strong>
<ul>
<li style="padding-left:2em">&#9702; When William Jones identified 'Sandrocottus' (the term used by the Greek scholars in their accounts) as none other than Chandra Gupta Maurya, the chronology of ancient Indian history became more clear.</li>
</ul>
</li>
</ul>

<h4>2) Archaeological evidence</h4>
<p>As the <strong>texts were given a written form much later</strong>, there is a certain problem of authenticity with them. So, the archaeological evidence becomes useful in this scenario.</p>

<h5>a) The Northern Black Polished Ware (NBPW) Sites:</h5>
<ul>
<li>&#8226; They are associated with the Mahajanapada period.</li>
<li>&#8226; There are <strong>almost 1500 sites</strong> from Taxila in the North-West to Tamluk in Bengal and Amravati in Andhra Pradesh.</li>
<li>&#8226; The NBPW culture represents an <strong>advanced stage of material culture</strong>.
<ul>
<li style="padding-left:2em">&#9702; It is a wheel made luxury ware.</li>
<li style="padding-left:2em">&#9702; It is well baked and well-levigated.</li>
<li style="padding-left:2em">&#9702; It has a glossy surface.</li>
<li style="padding-left:2em">&#9702; It is sometimes as thin as 1.5 mm.</li>
<li style="padding-left:2em">&#9702; The wares include different shapes of vases, lids, dishes and bowls.</li>
</ul>
</li>
<li>&#8226; This <strong>name is misleading</strong> though, as it is not confined to North India; it is not always black; and it may not be always polished.</li>
</ul>

<h5>b) Punch Marked Coins</h5>
<ul>
<li>&#8226; The use of these coins, in the Indian subcontinent, <strong>started around 500 BCE</strong>.</li>
<li>&#8226; These were either copper or silver coins which were <strong>possibly issued by merchants' guilds</strong> rather than kings because they do not contain any royal legends or images.</li>
<li>&#8226; These coins contained various types of pictures punched on them.</li>
<li>&#8226; Coins belonging to the Nanda period had been unearthed from Golakpur near Patna.</li>
</ul>

<h3>Early state formation in the Buddha Age</h3>
<p>The emergence of Mahajanapadas was the result of a long drawn process of state formation that materialised in several stages. To appreciate the whole process, it is important to start at the beginning.</p>
<p>The <strong>material and socio-economic changes</strong> up to the 6th century BCE had a wide ranging impact on the political situation.</p>
<ul>
<li>&#8226; The contemporary political conditions were marked by the <strong>emergence of and struggle between the Janapadas (Monarchical Kingdoms)</strong> amongst themselves <strong>and Jana Sanghas (Republican States)</strong>.
<ul>
<li style="padding-left:2em">&#9702; This conflict was merely a part of the larger process of state-formation.</li>
</ul>
</li>
</ul>
<p>We need to consider more <strong>basic factors</strong> stimulating change, while continuity is also to be emphasised.</p>
<ul>
<li>&#8226; The new technological changes on account of the use of iron led to a substantial <strong>agrarian surplus</strong>.
<ul>
<li style="padding-left:2em">&#9702; This surplus promoted <strong>proliferation and specialisation of crafts</strong> as well as <strong>trade</strong> in those crafts and goods (agrarian and non-agrarian).</li>
<li style="padding-left:2em">&#9702; A <strong>class of merchants, artists, craftsmen/craftswomen, service providers etc.</strong> emerged, who acted as an intermediary between the rural and urban set-up and catered to their respective needs of goods and services.</li>
<li style="padding-left:2em">&#9702; The opening of <strong>new trade routes</strong> gave a boost to further material changes resulting in the growth of urban centres.
<ul>
<li style="padding-left:4em">&#9632; The increased specialisation in crafts and settling up of craft and trade specific centres are noted from the literary sources.</li>
</ul>
</li>
</ul>
</li>
<li>&#8226; Socially, the <strong>Vaishyas</strong> and even privileged <strong>Kshatriyas questioned</strong> the superior position of the <strong>Brahmins</strong> in the prevailing social hierarchy.</li>
<li>&#8226; In religion, the emerging <strong>heterodox sects both opposed and incorporated the spirit of new material changes</strong> taking place in the society.
<ul>
<li style="padding-left:2em">&#9702; In this way, they challenged the status quo.</li>
<li style="padding-left:2em">&#9702; Emergence of such a large number of heterodox sects clearly indicates that the social norms and values were in a continuous flux.</li>
</ul>
</li>
<li>&#8226; It was the <strong>combined effect of these conflicts and upheavals</strong> that led to <strong>early state formation</strong> in the 6th century BCE. There was not one typical way of life but a set of diverse ways of lives.
<ul>
<li style="padding-left:2em">&#9702; This is reflected in the diversity of the political landscape.</li>
<li style="padding-left:2em">&#9702; While some tribal polities evolved into monarchical kingdoms, others took the evolutionary path towards republicanism.</li>
</ul>
</li>
</ul>

<h3>These republics differed from the monarchies in several ways.</h3>
<ul>
<li>&#8226; In the monarchies, the <strong>king claimed to be the sole recipient of entire taxation</strong> revenue. In the republics, this claim was advanced by every tribal oligarch, who was known as the Raja.
<ul>
<li style="padding-left:2em">&#9702; Each one of the 7707 Lichchhavi rajas (perhaps ruling families of Lichchhavi) maintained his storehouse and administrative apparatus.</li>
</ul>
</li>
<li>&#8226; <strong>Every monarch maintained his regular standing army and did not permit any group to keep arms within his territory.</strong>
<ul>
<li style="padding-left:2em">&#9702; But, in a tribal oligarchy, each Raja was free to maintain his own little army under his Senapati, so that each one of them could compete with the other.</li>
</ul>
</li>
<li>&#8226; The <strong>Brahmnas exercised great influence in monarchy.</strong>
<ul>
<li style="padding-left:2em">&#9702; But they had no place in the early republics, nor did they recognize these states in their law-books.</li>
</ul>
</li>
<li>&#8226; Finally, the main difference between a monarchy and a republic lay in the fact that the <strong>latter functioned under the leadership of oligarchic assemblies</strong> of Rajas.
<ul>
<li style="padding-left:2em">&#9702; These Rajas met once a year to transact political businesses and elect a leader (Ganapati/Ganaraja) with a fixed tenure.</li>
<li style="padding-left:2em">&#9702; Executive power was in the hands of a much smaller council.</li>
</ul>
</li>
</ul>

<h3>Republics of the Buddha Age</h3>
<ul>
<li>&#8226; During the <strong>6th century BCE the tribal polities were slowly consolidating</strong> under a more organised and complex governance system.
<ul>
<li style="padding-left:2em">&#9702; Some of these evolved into monarchies while others emerged as republican systems.</li>
</ul>
</li>
<li>&#8226; <strong>The republican system of government existed either in the Indus basin or in the foothills of the Himalayas in eastern Uttar Pradesh and Bihar.</strong>
<ul>
<li style="padding-left:2em">&#9702; The republics in the Indus basin may have been the remnants of the Vedic tribes although some monarchies may have been followed by the republics.</li>
<li style="padding-left:2em">&#9702; In Uttar Pradesh and Bihar, people were possibly inspired by the old ideals of tribal equality which did not give much prominence to a single raja.</li>
</ul>
</li>
<li>&#8226; In Buddhist literature, <strong>many of these non-monarchical states have been mentioned</strong>.
<ul>
<li style="padding-left:2em">&#9702; The <strong>Sakyas of Kapilvastu</strong>, who had acknowledged the suzerainty of Kosala in the latter half of the 6th century BCE, occupied a tract of land in the Himalayan foothills near Nepal.
<ul>
<li style="padding-left:4em">&#9632; Their capital Kapilvastu has been identified with Piprahwa (in the Siddharthnagar district of U.P.) by some scholars, whereas others identify it with Tilaurakut in Nepal.</li>
<li style="padding-left:4em">&#9632; Lumbini, the birth place of Buddha, seems to be their eastern capital.</li>
</ul>
</li>
<li style="padding-left:2em">&#9702; The <strong>Koliyas of Ramagrama</strong> were the eastern neighbours of the Sakyas.</li>
<li style="padding-left:2em">&#9702; Other tribal republics were the <strong>Bulis of Alakappa</strong>, the <strong>Kalamas</strong> of Kesaputta, the <strong>Moriyas of Pipphalivana</strong> and the <strong>Bhaggas of Sumsumagiri.</strong></li>
</ul>
</li>
<li>&#8226; There were <strong>perhaps two types of Ganas/Sanghas</strong>,
<ul>
<li style="padding-left:2em">&#9702; Those that consisted of only one clan e.g. Shakyas and</li>
<li style="padding-left:2em">&#9702; Those that were the confederation of more than one clans e.g. Vajji.</li>
</ul>
</li>
<li>&#8226; <strong>The Administrative machinery was simple.</strong>
<ul>
<li style="padding-left:2em">&#9702; The <strong>aristocratic council</strong> of each Gana/Sangha (republic) consisted of <strong>Rajas</strong>.</li>
<li style="padding-left:2em">&#9702; Such a council had sovereign powers.
<ul>
<li style="padding-left:4em">&#9632; This assembly did not include women.</li>
</ul>
</li>
<li style="padding-left:2em">&#9702; The aristocratic council met in a hall called <strong>'Santhagara'</strong>.
<ul>
<li style="padding-left:4em">&#9632; Each Raja had an <strong>Uparaja</strong> (Vice-King, perhaps the elder son), <strong>Senapati</strong> (Commander) and <strong>Bhandagarika</strong> (treasurer).</li>
</ul>
</li>
<li style="padding-left:2em">&#9702; We hear of as many as eleven courts in the hierarchical order for trying the same case one after another in the Lichchhavi republic, but this seems to be too good to be true.</li>
</ul>
</li>
<li>&#8226; In the republics, <strong>real power lay in the hands of tribal oligarchies</strong>.
<ul>
<li style="padding-left:2em">&#9702; In the republics of <strong>Shakyas and Vajjis</strong>, the ruling class belonged to the same clan or the <strong>same Varna (Kshatriya).</strong>
<ul>
<li style="padding-left:4em">&#9632; Brahmans were not included in this group.</li>
</ul>
</li>
<li style="padding-left:2em">&#9702; In the post Maurya times, in the republics of the <strong>Malavas and the Kshudrakas, the Kshatriyas and the Brahmans were given citizenship, but slaves and hired labourers were excluded from it.</strong></li>
</ul>
</li>
<li>&#8226; In any case, certain states in the age of the Buddha were not ruled by the hereditary kings but by persons who were responsible to assemblies.
<ul>
<li style="padding-left:2em">&#9702; Although the people living in these ancient republics may not have shared political power equally, the republican tradition in the country is as old as the age of the Buddha.</li>
</ul>
</li>
</ul>

<h3>Reasons for the decline of the Republics-</h3>
<ul>
<li>&#8226; They were situated in <strong>less productive areas</strong> as compared to the regions of contemporary monarchies.</li>
<li>&#8226; It is <strong>easier to sow dissension</strong> among the jealous members of such councils. Ajatsatru used similar tactics against Vajjis.
<ul>
<li style="padding-left:2em">&#9702; That's why they could not sustain the challenge posed by the formidable armies of the contemporary monarchies.</li>
</ul>
</li>
<li>&#8226; They <strong>didn't enjoy the full support of their people</strong>.
<ul>
<li style="padding-left:2em">&#9702; In fact, these were not republics, rather, these were oligarchies. i.e. a system in which power is concentrated in the hands of a few elites.</li>
</ul>
</li>
<li>&#8226; These republics <strong>could not rise above the trappings of the contemporary monarchies.</strong>
<ul>
<li style="padding-left:2em">&#9702; Names of various officer bearers in these republics were similar to those under the monarchies.</li>
<li style="padding-left:2em">&#9702; These republics imposed the same restrictions on their people as the contemporary monarchs.
<ul>
<li style="padding-left:4em">&#9632; For example, all the residents of Malla republic were ordered to stand on the streets to welcome Buddha.</li>
</ul>
</li>
</ul>
</li>
<li>&#8226; <strong>The history of the Ganas of ancient India spans roughly a thousand years.</strong> Samudragupta's campaigns finally wiped them out and assigned the remaining republics to the political insignificance.
<ul>
<li style="padding-left:2em">&#9702; Some of the Ganas (e.g. Malavas, Arjunyanas etc.) are mentioned on the coins of the early centuries CE.</li>
<li style="padding-left:2em">&#9702; In the 4th century CE, Chandragupta I married a Lichchhavi princess Kumaradevi.</li>
<li style="padding-left:2em">&#9702; Samudragupta, was called Lichchavi-dauhitra (grandson of the Lichchavis).
<ul>
<li style="padding-left:4em">&#9632; This suggests that up to that point, Lichchavis were a political force worth aligning.</li>
</ul>
</li>
</ul>
</li>
</ul>

<h3>Reasons for evolution of the Janapadas into the Mahajanapadas</h3>
<p>The surplus from various economic activities was taxed to fund an elaborate <strong>bureaucracy</strong> and standing <strong>armies</strong>, which <strong>consolidated the state control</strong> over its territory.</p>
<ul>
<li>&#8226; This perpetuates a <strong>virtuous cycle between a stronger state and better resource mobilisation</strong> from the area under its control.</li>
<li>&#8226; <strong>Stronger Janapadas acquired territory from the neighbouring Janapadas</strong> in warfare.</li>
<li>&#8226; <strong>Availability of iron</strong> facilitated the development of war weapons in certain Janapadas, thus giving them an edge over the others.</li>
</ul>
<p>Janapadas with stronger economic conditions and abundant natural resources subdued their neighbours. Thus, <strong>16 Mahajanapadas</strong> evolved in due course of time.</p>

<h3>The 16 Mahajanapadas</h3>
<p>The most systematic and detailed information on contemporary the political situation comes from the Buddhist work <strong>'Anguttra Nikaya'</strong>.</p>
<ul>
<li>&#8226; According to this text, there emerged 16 Mahajanapadas in North India immediately before the time of Buddha.</li>
</ul>
<p>The Jaina text, <strong>Bhagwati Sutra</strong>, also mentions 16 Mahajanapadas, which somewhat differs with the list created from the Anguttra Nikaya.</p>
<p>Apart from these, there must have been smaller principalities and chiefdoms.</p>
<p>A brief description of these Mahajanapadas has been given below.</p>
<ol>
<li>The state of <strong>Anga</strong> seems to have comprised the present day districts of Bhagalpur and Munger in Bihar.
<ul>
<li style="padding-left:2em">&#9702; The <strong>river Champa</strong> formed the boundary between Anga in the East and Magadha in the West.</li>
<li style="padding-left:2em">&#9702; Its <strong>capital Champa</strong> (also known as Malini) was one of the most important cities.
<ul>
<li style="padding-left:4em">&#9632; It was located on the confluence of the Ganga and Champa (Chandan) rivers.</li>
</ul>
</li>
<li style="padding-left:2em">&#9702; <strong>Merchants</strong> are described to have sailed from this location to <strong>Suvarnabhumi</strong> (South-East Asia).</li>
<li style="padding-left:2em">&#9702; This state was <strong>absorbed</strong> in the expanding Magadha kingdom by King <strong>Bimbisara</strong> sometime in the later part of 6th century BCE.</li>
</ul>
</li>
<li>The state of <strong>Magadha</strong> comprised the districts of Patna and Gaya in the beginning.
<ul>
<li style="padding-left:2em">&#9702; Its initial capital was <strong>Grihvrij</strong> near modern Rajgir, which was surrounded by Ganga, Son and Punpun rivers from North, West and East respectively and the Vindhyan spurs on the south.</li>
<li style="padding-left:2em">&#9702; It started to gradually absorb many neighbouring states and emerged as an <strong>Empire by the middle of the 5th century BCE.</strong></li>
</ul>
</li>
<li>The kingdom of <strong>Kasi</strong> consisted of the region around the present day district of Varanasi of UP Its capital was at Banaras.
<ul>
<li style="padding-left:2em">&#9702; The Jataka stories indicate that Kasi and Kosala had a long conflict and <strong>Kasi was eventually absorbed into Kosala.</strong></li>
</ul>
</li>
<li>The Kingdom of <strong>Kosala</strong> comprised a large part of present day Eastern U.P.
<ul>
<li style="padding-left:2em">&#9702; Its capital was at <strong>Shravasti</strong> (also a modern district).</li>
<li style="padding-left:2em">&#9702; Another important city (and perhaps second capital) was <strong>Ayodhya or Saket.</strong></li>
<li style="padding-left:2em">&#9702; The state of Kosala aimed for supremacy in North India by <strong>matrimonial alliances and military aggression.</strong>
<ul>
<li style="padding-left:4em">&#9632; The <strong>conquest of Kasi</strong> sometime before the birth of the Buddha turned it into a powerful state.</li>
<li style="padding-left:4em">&#9632; Under the leadership of <strong>Prasenjit</strong> (contemporary of Buddha), it extended its supremacy over the <strong>Sakyas of Kapilvastu and the Kalamas of Kesaputta</strong>.</li>
<li style="padding-left:4em">&#9632; A matrimonial alliance was stitched between <strong>Prasenjit and Bimbisara</strong>, but it unravelled with the ascent of Ajatsatru on the throne of Magadha.</li>
</ul>
</li>
<li style="padding-left:2em">&#9702; However, the political power of Kosala petered out under Vidudabaha.</li>
</ul>
</li>
<li>The <strong>Vajji</strong> confederacy lay to the north of the Ganges and extended as far as the Nepal hills.
<ul>
<li style="padding-left:2em">&#9702; It was a <strong>confederacy of tribal chieftains</strong> with distinct characteristics.</li>
<li style="padding-left:2em">&#9702; The confederacy consisted of eight or nine clans of which the <strong>Videha, the Lichchavis, the Janatrikas and the Vajjis</strong> were the prominent ones.
<ul>
<li style="padding-left:4em">&#9632; Vaishali was the capital of both the Lichhavi clan and the Vajji confederacy.</li>
</ul>
</li>
</ul>
</li>
<li>The <strong>Mallas</strong> were also a confederacy of possibly nine clans.
<ul>
<li style="padding-left:2em">&#9702; It was located to the <strong>west of Vajji confederacy.</strong></li>
<li style="padding-left:2em">&#9702; The Buddhist literature informs us that the Mallas had divided their territory into smaller areas, two of the nine Malla groups had their capitals at <strong>Pava and Kusinara respectively.</strong></li>
<li style="padding-left:2em">&#9702; The former has been identified with Pavapuri in Bihar and the latter with Kasia in Deoria district of U.P.</li>
</ul>
</li>
<li>The territory of <strong>Chedis</strong> lay near the Yamuna, in the eastern part of Bundelkhand region.
<ul>
<li style="padding-left:2em">&#9702; The capital of the state was called Sothivatinagar (Banda district, UP).</li>
</ul>
</li>
<li>The kingdom of <strong>Vatsa</strong> was located south of the Ganga.
<ul>
<li style="padding-left:2em">&#9702; It was known for its <strong>cotton textiles</strong>.</li>
<li style="padding-left:2em">&#9702; Its capital was at <strong>Kosambi</strong> Identified with the village of Kosam on the right bank of the Yamuna.</li>
<li style="padding-left:2em">&#9702; It seems that finally the kingdom of <strong>Vatsa was annexed by Avanti</strong> which in turn was annexed by the emerging Magadhan Empire.</li>
<li style="padding-left:2em">&#9702; <strong>King Udayana of Vatsa</strong> went on to become the hero of the three romantic Sanskrit works- <strong>'Svapna-Vasavdatta' of Bhasa, 'Ratnavali' and 'Priyadarshika' of Harsha.</strong></li>
</ul>
</li>
<li>The state of <strong>Kuru</strong> included modern Delhi, Meerut and Saharanpur district.
<ul>
<li style="padding-left:2em">&#9702; Its capital was at <strong>Indraprastha</strong> which has been tentatively identified with the site of Purana Qila in Delhi.</li>
<li style="padding-left:2em">&#9702; After the time of Buddha, Kurus became a <strong>Sangha</strong> (confederacy).</li>
</ul>
</li>
<li>The territory of <strong>Panchala</strong> roughly corresponded to the modern Badaun, Farrukhabad and Bareilly districts of U.P.
<ul>
<li style="padding-left:2em">&#9702; Their territory was divided in two parts- the northern part had its capital at <strong>Ahichchhatra</strong> identified with modern Ramnagar in the Bareilly district.</li>
<li style="padding-left:2em">&#9702; The Southern part had its capital at <strong>Kampilya</strong> identified with Kampila in the present day Farrukhabad district.</li>
<li style="padding-left:2em">&#9702; According to Arthashastra, the Panchalas later switched to <strong>Oligarchy</strong>.</li>
</ul>
</li>
<li>The <strong>Matsya</strong> country corresponded to the modern territory of Jaipur, Alwar and a part of Bharatpur.
<ul>
<li style="padding-left:2em">&#9702; Its capital was <strong>Viratanagara</strong> (modern Bairat).</li>
</ul>
</li>
<li>The <strong>Surasenas</strong> had their capital at <strong>Mathura</strong> on the banks of Yamuna.
<ul>
<li style="padding-left:2em">&#9702; Buddhist traditions describe <strong>Avantiputra, a king of Surasena, as a disciple of Buddha.</strong></li>
</ul>
</li>
<li>The state of <strong>Ashmaka/Assaka</strong> lay on the river <strong>Godavari</strong> with its capital at <strong>Potali/Potana</strong> (modern Bodhan, Nizamabad district, Telangana).
<ul>
<li style="padding-left:2em">&#9702; Jataka stories suggest that Asmaka was <strong>once under the sway of Kashi and at some point of time it scored a victory over Kalinga.</strong></li>
</ul>
</li>
<li><strong>Avanti</strong> roughly corresponded to modern Malwa, Nimar and adjoining parts of M.P
<ul>
<li style="padding-left:2em">&#9702; Its northern capital was at <strong>Ujjaini</strong> (modern Ujjain) and the southern at <strong>Mahismati</strong> (modern Maheshwar).</li>
<li style="padding-left:2em">&#9702; <strong>Chandra Pradyota</strong> was the rule of Avanti during the time of Buddha.
<ul>
<li style="padding-left:4em">&#9632; He maintained a large army and followed a policy of military <strong>aggression towards the kingdoms of Vatsa, Magadha, Kosala and even the far off Gandhara.</strong></li>
</ul>
</li>
<li style="padding-left:2em">&#9702; Avanti seems to have annexed Vatsa but it was swallowed by Magadha in turn.</li>
</ul>
</li>
<li><strong>Gandhara</strong> denotes the region comprising the modern districts of <strong>Peshawar and Rawalpindi</strong> of Pakistan and Kashmir Valley.
<ul>
<li style="padding-left:2em">&#9702; Its capital <strong>Taxila</strong> was both a centre of trade and a seat of learning.</li>
<li style="padding-left:2em">&#9702; King <strong>Pushkarasarin</strong> established <strong>friendly relations with Bimbisara</strong> of Magadha but waged a <strong>war on the king Chandra Pradyota of Avanti</strong>.</li>
<li style="padding-left:2em">&#9702; The <strong>Behistun inscription (Iran)</strong> of the Achaemenid emperor <strong>Darius</strong> indicates that Gandhara was conquered by the Persians in the later part of the 6th century BCE.</li>
</ul>
</li>
<li><strong>Kamboja</strong> roughly occupied the area around <strong>Rajouri</strong> (Jammu) including the <strong>Hazara</strong> district of Khyber Pakhtunkhwa province and perhaps some parts of the <strong>Nuristan</strong> province in Afghanistan.
<ul>
<li style="padding-left:2em">&#9702; Ancient texts and inscriptions usually associate the Kamboja kingdom with Gandhara.</li>
</ul>
</li>
</ol>

<h3>The Magadha Empire</h3>
<p>It was the first experiment of empire building in India. It expanded from river Beas in the North-West to the border of Bengal in the East; and upto the River Godavari in the south. Material factors as well as the ambitious Magadha kings made this possible.</p>

<h4>Factors favouring military success of Magadha Mahajanapada:</h4>
<p><strong>1. Both the capitals of Magadha were geographically protected.</strong></p>
<ul>
<li>&#8226; For example, the first capital Girivraja or Rajgir was protected by hills. It had vast natural resources. So, it could sustain a war against its enemy for a longer period.</li>
<li>&#8226; Likewise, its second capital, 'Pataliputra' was protected by a number of rivers viz, the Ganges, the Son and the Punpun.</li>
</ul>
<p><strong>2. The Magadha region was militarily well placed.</strong></p>
<ul>
<li>&#8226; It possessed the reserves of iron that were used in weapons manufacturing.</li>
<li>&#8226; Likewise, elephants were also available in nearby forests. They were used for military purposes.</li>
</ul>
<p><strong>3. The Magadha region was in better economic condition.</strong></p>
<ul>
<li>&#8226; As the result of the use of iron in agriculture as well as the beginning of transplantation of paddy, vast agrarian surplus was produced.</li>
<li>&#8226; It led to the development of crafts and trade.</li>
<li>&#8226; So, the money economy and urbanisation flourished in this region.</li>
<li>&#8226; As we know, the earliest punch-marked coins have been unearthed from northern Bihar and eastern U.P.</li>
<li>&#8226; In this way, the favourable material conditions contributed to the success of Magadhan Empire.</li>
</ul>
<p><strong>4. Apart from that, Magadha remained outside of pale of Aryandom (Aryan region).</strong></p>
<ul>
<li>&#8226; So, Magadha was being looked down upon in comparison to those regions where Brahmanic culture was entrenched.</li>
<li>&#8226; That's why Magadha had more enthusiasm to expand, in order to assert its identity.</li>
<li>&#8226; Being relatively free from orthodoxy allowed the enterprising leaders to emerge from different levels of social ranks.</li>
</ul>
<p><strong>5. Contribution of Magadha Rulers:</strong></p>
<p>The military and diplomatic success of some of the ambitious Magadha rulers also contributed to this process.</p>
<ul>
<li>&#8226; For example, the founder of the Haryanka dynasty, <strong>Bimbisara</strong>, not only contributed to the expansion of Magadha, he also did a lot for its consolidation.
<ul>
<li style="padding-left:2em">&#9702; He defeated and annexed <strong>Anga</strong>.</li>
<li style="padding-left:2em">&#9702; Secondly, he developed <strong>matrimonial relations</strong> with a number of states like Kosala, Vajji Confederation, Madra and Videha in order to diplomatically consolidate his position.
<ul>
<li style="padding-left:4em">&#9632; His method was very much like that of some European rulers of the 16th and 17th century.</li>
</ul>
</li>
<li style="padding-left:2em">&#9702; Thirdly, he laid the <strong>foundation of a strong administration</strong>.
<ul>
<li style="padding-left:4em">&#9632; He is credited for establishing a standing <strong>army</strong> as he is known as 'Shrenika Bimbisara'.</li>
<li style="padding-left:4em">&#9632; Furthermore, he carried out land measurement and he is supposed to have convened an <strong>assembly of 80,000 gram bhojkas</strong> (heads of the villages).</li>
</ul>
</li>
</ul>
</li>
<li>&#8226; The process of empire-building was continued under Bimbisara's son <strong>Ajatsatru</strong>.
<ul>
<li style="padding-left:2em">&#9702; He destroyed the power of the <strong>Vajji confederacy</strong> and annexed it.</li>
<li style="padding-left:2em">&#9702; Likewise, he annexed <strong>Kosala</strong>.</li>
</ul>
</li>
<li>&#8226; <strong>Shishunaga</strong> annexed Avanti, ending the rivalry between the two powers which had lasted 100 years.
<ul>
<li style="padding-left:2em">&#9702; <strong>Avanti</strong> was a great rival to Magadha and like Magadha and had overpowered a number of regional states including <strong>Vatsa</strong>.</li>
</ul>
</li>
<li>&#8226; This process was continued under <strong>Mahapadmananda</strong>, the founder of Nanda dynasty.
<ul>
<li style="padding-left:2em">&#9702; He annexed the region of <strong>Kalinga</strong>.</li>
<li style="padding-left:2em">&#9702; Thus, under Mahapadmananda, the Magadha Empire stretched from the river Beas in North-West up to the river Godavari in South,</li>
</ul>
</li>
</ul>

<h3>Persian and Greek invasions on India</h3>
<h4>The Persian Invasion:</h4>
<p>In North and East India, smaller principalities and republics gradually merged with the Magadhan Empire. But north-west India presented a different picture in the first half of the sixth century BC.</p>
<ul>
<li>&#8226; <strong>Several small principalities</strong> such as the Kamboja, Gandhara and Madra <strong>fought one another.</strong></li>
<li>&#8226; This area <strong>did not have any powerful kingdom like Magadha</strong> to weld the warring principalities into one organised kingdom.</li>
<li>&#8226; The area was also <strong>wealthy</strong>, and could be <strong>easily entered through the passes</strong> in the Hindus Kush.</li>
</ul>
<p>The <strong>Achaemenid rulers of Iran</strong>, who spread their empire at the same time as the Magadhan princes, took advantage of the political disunity on the North-West frontier.</p>
<ul>
<li>&#8226; The Iranian ruler <strong>Darius</strong> penetrated into North West India in c. 516 BCE.
<ul>
<li style="padding-left:2em">&#9702; <strong>He annexed</strong> Sindh, Khyber Pakhtunkhwa and the parts of the Punjab that lay to the west of the Indus River.</li>
</ul>
</li>
<li>&#8226; Greek historian Herodotus tells us that this area constituted the <strong>20th province or satrapy</strong> of the Persian Empire, the total number of satrapies being 28.
<ul>
<li style="padding-left:2em">&#9702; It was the <strong>most fertile</strong> and prosperous part of the empire.</li>
<li style="padding-left:2em">&#9702; It paid a tribute of 360 talents of gold, which accounted for <strong>almost one-third of the total revenue of Iran from its Asian provinces</strong>.</li>
<li style="padding-left:2em">&#9702; The Indian subjects were also <strong>enrolled in the Iranian army</strong>.
<ul>
<li style="padding-left:4em">&#9632; Xerxes, the successor of Darius, employed Indians in his long war against the Greeks.</li>
</ul>
</li>
</ul>
</li>
<li>&#8226; It appears that North-West India continued to be a part of the Persian Empire up till Alexander's invasion of India.</li>
</ul>

<h4>The significance of Persian invasion on India</h4>
<ol>
<li>The region of North-West India was integrated with the vast region of West and Central Asia. It certainly <strong>encouraged trade and urbanisation</strong> in this region.</li>
<li>The Persians introduced the <strong>Satrapy system</strong> (provincial government) in India that was later adopted by the Indian rulers.</li>
<li>The <strong>Kharosthi and Aramaic scripts</strong> came to be used in India due to the Persian influence.</li>
<li>Although the matter is debatable, it is argued that the <strong>Ashokan pillars were influenced</strong> by the pillar edicts of Persian emperor Darius I.</li>
</ol>

<h4>The Greek Invasion:</h4>
<p>In the 4th century BCE, the Greeks and the Persian fought for the supremacy of the known world. Under the leadership of Alexander of Macedonia, the Greeks finally destroyed the Persian Empire.</p>
<ul>
<li>&#8226; Alexander conquered Asia Minor, Iraq and Iran.</li>
<li>&#8226; From Iran, he marched to India, obviously attracted by its wealth.
<ul>
<li style="padding-left:2em">&#9702; <strong>Herodotus</strong>- who is called the father of history and other Greek writers, hand painted <strong>India as a fabulous land</strong>, which tempted Alexander to invade it.</li>
<li style="padding-left:2em">&#9702; Alexander also had a <strong>passion for geographical inquiry</strong> and natural history.</li>
<li style="padding-left:2em">&#9702; He was also <strong>inspired by the mythical exploits of past conquerors</strong> whom he wanted to emulate and surpass</li>
<li style="padding-left:2em">&#9702; The <strong>political condition of North West India</strong> suited his plans.
<ul>
<li style="padding-left:4em">&#9632; The area was parcelled out into many independent monarchies and tribal republics.</li>
<li style="padding-left:4em">&#9632; Alexander found it easy to conquer these principalities one by one.</li>
<li style="padding-left:4em">&#9632; Among the local rulers, two were well known - <strong>Ambhi</strong>, the prince of Taxila, and <strong>Porus</strong>, whose kingdom lay between the Jhelum and the Chenab.</li>
<li style="padding-left:4em">&#9632; Together, they might have resisted the advance of Alexander.</li>
</ul>
</li>
<li style="padding-left:2em">&#9702; But they could not put up a joint front; the Khyber Pass remained unguarded.</li>
</ul>
</li>
<li>&#8226; After the conquest of Iran, <strong>Alexander moved on to Kabul</strong>. From here, he <strong>marched to India through the Khyber Pass in 326 B.C.</strong>
<ul>
<li style="padding-left:2em">&#9702; It took him five months to reach the Indus. <strong>Ambhi readily submitted</strong> to the invader, augmented his army and replenished his treasury.</li>
<li style="padding-left:2em">&#9702; When Alexander reached Jhelum, he met the first and the strongest <strong>resistance from Porus.</strong>
<ul>
<li style="padding-left:4em">&#9632; Although Alexander defeated Porus, he was impressed by his bravery and courage.</li>
<li style="padding-left:4em">&#9632; So, he restored his kingdom and made him his ally.</li>
</ul>
</li>
<li style="padding-left:2em">&#9702; Then, he advanced as far as the Beas River.</li>
</ul>
</li>
<li>&#8226; <strong>He wanted to move further eastward but his army refused.</strong>
<ul>
<li style="padding-left:2em">&#9702; The Greek soldiers had grown <strong>war-weary and diseased.</strong></li>
<li style="padding-left:2em">&#9702; The <strong>hot climate</strong> of India and <strong>ten years of continuous campaigning</strong> had made them terribly <strong>homesick</strong>.</li>
<li style="padding-left:2em">&#9702; They had also experienced the <strong>bitter taste of Indian resistance</strong> which made them desist from further progress.
<ul>
<li style="padding-left:4em">&#9632; As the Greek historian Arian tells us: "In the art of war the Indians were far superior to the other nations inhabiting the area at that time."</li>
</ul>
</li>
<li style="padding-left:2em">&#9702; The kingdom of <strong>Magadha</strong>, ruled by the Nandas, <strong>maintained an army far outnumbering that of Alexander.</strong>
<ul>
<li style="padding-left:4em">&#9632; So, despite the repeated appeals of Alexander to advance, the Greek soldiers did not oblige. He was forced to retreat.</li>
</ul>
</li>
</ul>
</li>
<li>&#8226; <strong>On his return march, Alexander vanquished many small republics until he reached the end of the Indian frontier.</strong>
<ul>
<li style="padding-left:2em">&#9702; He remained in India for 19 months (326-325 B.C), which were full of fighting.</li>
</ul>
</li>
<li>&#8226; He had <strong>barely any time to organise his conquests</strong>, though he made <strong>some arrangements.</strong>
<ul>
<li style="padding-left:2em">&#9702; Most conquered states were restored to their rulers who submitted to his authority.</li>
<li style="padding-left:2em">&#9702; But his own territorial possessions were divided into three parts, which were placed under the three Greek governors.</li>
<li style="padding-left:2em">&#9702; He also founded a number of cities to maintain his control in this area.</li>
</ul>
</li>
</ul>

<h4>The significance of Greek invasion on India:</h4>
<ol>
<li>As a result of this invasion, <strong>important routes</strong> were opened between India and the Mediterranean world.</li>
<li>The founder of the Mauryan dynasty, <strong>Chandragupta Maurya</strong>, was impressed with the <strong>new military tactics of Alexander</strong> and he consolidated his position by appropriating these tactics.</li>
<li><strong>Alexander's court historians left</strong> accounts of North-West India. They became the only source of information for the North-West region of India during the 4th century BCE</li>
<li>Greek scholars used the name <strong>'Sandrocottus'</strong> for Chandra Gupta Maurya. When a British scholar, William Jones, identified Sandrocottus as the Chandra Gupta Maurya, the <strong>chronology of ancient Indian history became clearer.</strong></li>
<li><strong>Hellenistic art</strong> developed in North West India as a result of the mixture of Greek elements and Indian elements. Even <strong>Greek script and language</strong> came into use in the region.</li>
</ol>

<h3>The Administrative Structure in Buddha Age</h3>
<ol>
<li>The <strong>king wielded absolute power</strong> in monarchies.
<ul>
<li>&#8226; He started to take pompous titles like 'Samrat'.</li>
<li>&#8226; The general term for officers is <strong>Mahamatra</strong>.</li>
<li>&#8226; Besides the Mahamatras, the king was advised and helped in administrative matters by the <strong>Mantrin</strong> i.e. ministers and councillors.</li>
</ul>
</li>
<li>The <strong>machinery for tax collection was institutionalised</strong>.
<ul>
<li>&#8226; We know about at least half a dozen officers which were associated with the taxation machinery
<ul>
<li style="padding-left:2em">&#9702; <strong>'Dronamapaka'</strong> (officer associated with measurement of land),</li>
<li style="padding-left:2em">&#9702; <strong>'Rajjugrahaka'</strong> (officer who collected revenue in grains),</li>
<li style="padding-left:2em">&#9702; <strong>'Shaulkika'</strong> (collector of tolls)</li>
<li style="padding-left:2em">&#9702; <strong>'Sanghitri'</strong> (treasurer).</li>
<li style="padding-left:2em">&#9702; Apart from these, <strong>Tundiya and Akasiya</strong> were also known for coercive tax collection.</li>
</ul>
</li>
</ul>
</li>
<li><strong>Village</strong> was the lowest unit of administration during this period.
<ul>
<li>&#8226; In the countryside, things were managed by a village <strong>headman</strong> who were variously known as <strong>'Gramabhojakas'</strong> or <strong>'Gramikas'</strong> and <strong>'Graminis'</strong>.</li>
<li>&#8226; They not only <strong>assessed and collected land revenue</strong> but also <strong>maintained law and order</strong> in their localities.</li>
</ul>
</li>
<li>Now, the state could mobilise resources for maintaining a <strong>standing army and a professional bureaucracy</strong>.</li>
<li>With growing complication in governance, it became essential to maintain <strong>written records</strong>.
<ul>
<li>&#8226; So royal documents were maintained under an official known as <strong>'Akshpatladhikrita'</strong>.</li>
<li>&#8226; It is inferred by historians and researchers that the accountants, clerks, auditors etc. in the revenue departments of Kings -and trading establishments- contributed to the early evolution of scripts across the world.</li>
</ul>
</li>
</ol>
<p>One should note that there must have been state wise variations in the efficiency and structure of the administration- general and revenue.</p>

<h3>Economic Structure in the Buddha Age</h3>
<p>This period is marked by considerable economic changes.</p>
<ul>
<li>&#8226; The tribal semi-nomadic economy of Vedic period had transformed into an <strong>agrarian economy.</strong></li>
<li>&#8226; It fuelled the multiplication and <strong>specialisation of crafts, growth in trade</strong> (especially long distance trade) &amp; <strong>money economy</strong> and the beginning of <strong>second urbanisation.</strong></li>
</ul>

<h4>Agriculture-</h4>
<p>The factors which encouraged agriculture are following.</p>
<ol>
<li>In comparison to wheat producing upper Gangetic basin, <strong>rice producing middle Gangetic basin was more fertile.</strong>
<ul>
<li>&#8226; It was more suitable for surplus agrarian production under conducive socio-economic conditions.</li>
</ul>
</li>
<li><strong>Iron implements</strong> played a significant role in the intensification of cultivation in the middle Gangetic basin.
<ul>
<li>&#8226; This was due to the development of <strong>'Socketing technique'</strong>.
<ul>
<li style="padding-left:2em">&#9702; By using this technique, the people could produce better agrarian implements like iron hoes, iron sickles, iron axes and above all iron ploughshares.</li>
</ul>
</li>
<li>&#8226; So, it became <strong>easier to clear dense forest</strong> of the middle Gangetic basin.
<ul>
<li style="padding-left:2em">&#9702; Cereals like rice, barley, wheat and millets were produced over a <strong>wider area.</strong></li>
</ul>
</li>
</ul>
</li>
<li>Earlier, only the family members were associated with cultivation on family land holdings.
<ul>
<li>&#8226; But, now <strong>slaves and wage labourers</strong> were employed by cultivators with sizable land holdings (Gahapatis).</li>
<li>&#8226; These Gahapatis were a new addition to the rural milieu.</li>
</ul>
</li>
<li>The <strong>technique of paddy transplantation</strong> came into existence.
<ul>
<li>&#8226; In place of wheat, rice could feed more people because there could be a larger paddy harvest on a given tract of land than wheat.
<ul>
<li style="padding-left:2em">&#9702; So, better availability of food led to the population growth.</li>
</ul>
</li>
<li>&#8226; That's why we find a larger number of NBPW sites.</li>
</ul>
</li>
<li>A transition was being made from a <strong>subsistence economy to a market economy</strong>.
<ul>
<li>&#8226; The growth in agriculture <strong>encouraged craft activities</strong>.</li>
<li>&#8226; The introduction of <strong>coinage</strong> facilitated this transition.</li>
<li>&#8226; This resulted in the development of a <strong>complex economic web</strong> involving both rural and urban economic systems.</li>
<li>&#8226; This web was spread over the vast subcontinent. It led to <strong>greater mobility, accelerated trade &amp; commerce</strong>, and facilitated intercourse.</li>
</ul>
</li>
</ol>

<h4>Guilds and Corporations</h4>
<ul>
<li>&#8226; The artisans got organised into guilds and merchants into corporations in order <strong>to avoid the competition.</strong></li>
<li>&#8226; The guilds played a <strong>significant role in the economic and social life of their members.</strong>
<ul>
<li style="padding-left:2em">&#9702; The guilds fixed the <strong>price</strong> of the commodities.</li>
<li style="padding-left:2em">&#9702; They used to <strong>maintain the product quality</strong> and organise the whole production process.</li>
<li style="padding-left:2em">&#9702; Likewise, in <strong>social life</strong>, they used to regulate the life of its members
<ul>
<li style="padding-left:4em">&#9632; E.g. if the wife of an artisan wanted to join a Buddhist monastery, she was not only supposed to take permission from her husband but also from her husband's guild.</li>
</ul>
</li>
<li style="padding-left:2em">&#9702; Guilds could make their <strong>codes of conduct</strong> and <strong>enforce them</strong> through their own judicial-police system.</li>
</ul>
</li>
<li>&#8226; <strong>Kings</strong> were advised by the Dharma sutras to <strong>consult these guilds</strong> before taking decisions on relevant matters.</li>
</ul>

<h4>Trade Routes</h4>
<ul>
<li>&#8226; <strong>Development of trade is linked with the growth of specialisation of crafts.</strong></li>
<li>&#8226; In those days, trade-<strong>both inland and foreign</strong>- was fairly brisk.</li>
<li>&#8226; Merchants made fortunes by dealing in articles like <strong>silk, muslin, amour, perfumes, ivory, jewellery etc.</strong>
<ul>
<li style="padding-left:2em">&#9702; They travelled long distances up and down the <strong>great rivers of the country</strong>.</li>
<li style="padding-left:2em">&#9702; They even undertook coastal voyages to <strong>Burma and Sri Lanka</strong> from Tamluk in the east and from Broach in the west.</li>
</ul>
</li>
<li>&#8226; The traders followed certain well established <strong>inland routes</strong>.
<ul>
<li style="padding-left:2em">&#9702; One of them ran from Shravasti to Pratishthana;</li>
<li style="padding-left:2em">&#9702; another linked Shravasti with Rajgir;</li>
<li style="padding-left:2em">&#9702; a third skirted along the foothills of the Himalayas from Taxila to Shravasti; and</li>
<li style="padding-left:2em">&#9702; a fourth connected Kashi with the ports of western coast.</li>
</ul>
</li>
<li>&#8226; <strong>Long distance trade was associated with towns rather than rural areas</strong> because the former were centres of craft production and distribution; besides they were being protected appropriately.</li>
</ul>

<h4>Money Economy</h4>
<ul>
<li>&#8226; This period is marked by the rise of the money economy.</li>
<li>&#8226; Regular coins known as <strong>'Punch marked coins' (Kahapana/Karshapana)</strong> came into use for the first time during this period.
<ul>
<li style="padding-left:2em">&#9702; These coins were made of silver and copper.</li>
<li style="padding-left:2em">&#9702; They were marked by different kinds of figures on them.</li>
<li style="padding-left:2em">&#9702; These coins were <strong>issued by merchants or guilds</strong>.</li>
</ul>
</li>
<li>&#8226; They have been <strong>unearthed from different parts of the Indian subcontinent</strong> in large numbers.</li>
<li>&#8226; Apart from archaeological evidence, even <strong>literary evidence</strong> gives us information about the use of coins.
<ul>
<li style="padding-left:2em">&#9702; According to a contemporary text, physician 'Jivaka' got a large number of coins as a reward from a Gahapati as he cured his son.</li>
</ul>
</li>
<li>&#8226; On the basis of recent research, it has been emphasised that even <strong>'cowries'</strong> (sea shells) were used as coins.</li>
</ul>

<h4>Urbanisation</h4>
<ul>
<li>&#8226; This period is marked by the <strong>second urbanisation.</strong></li>
<li>&#8226; According to the Buddhist text, there were <strong>nearly 60 towns in North India</strong>.
<ul>
<li style="padding-left:2em">&#9702; 20 towns out of these 60 were as large as Shravasti.</li>
<li style="padding-left:2em">&#9702; 6 towns were enjoying the status of a metropolis (Mahanagar).</li>
</ul>
</li>
<li>&#8226; In the north-west, <strong>Alexander's historians had also mentioned towns</strong>.
<ul>
<li style="padding-left:2em">&#9702; According to a Greek scholar, Arrian, Alexander conquered 9 states and 5000 towns.</li>
<li style="padding-left:2em">&#9702; Although it was an exaggeration, we can at least deduce from this statement that urbanisation had already started in the region.</li>
<li style="padding-left:2em">&#9702; Even archaeological evidence shows that Taxila had emerged as a town up to this point.</li>
</ul>
</li>
</ul>

<h4>Urban Occupations</h4>
<ul>
<li>&#8226; The urban occupations can be broadly categorised into <strong>two groups:</strong>
<ul>
<li style="padding-left:2em">&#9702; I.e. those connected with production activities and those which were not connected with production as such.</li>
</ul>
</li>
<li>&#8226; The material remains discovered from the various archaeological sites attest to the existence of various <strong>crafts industries</strong> such as:
<ul>
<li style="padding-left:2em">&#9702; Clay working like pottery, terracotta figurines, brick making etc.</li>
<li style="padding-left:2em">&#9702; Carpentry and wood-working</li>
<li style="padding-left:2em">&#9702; Metal-working</li>
<li style="padding-left:2em">&#9702; Stone-working</li>
<li style="padding-left:2em">&#9702; Glass industry</li>
<li style="padding-left:2em">&#9702; Bone and ivory-working</li>
<li style="padding-left:2em">&#9702; Silk and cotton textile</li>
<li style="padding-left:2em">&#9702; Other miscellaneous industries like garland-makers, bow &amp; arrow makers, combs, baskets, perfumes, liquor, oil, musical instruments etc.</li>
</ul>
</li>
<li>&#8226; <strong>Non-production occupations</strong> included
<ul>
<li style="padding-left:2em">&#9702; Soldiers/policemen, administrators, physicians, scribes, actors, dancers, musicians, acrobats, courtesans etc.</li>
</ul>
</li>
<li>&#8226; The <strong>merchants</strong>, who were an <strong>intermediary</strong> group, played a vital role in the system of distribution.</li>
</ul>

<h4>Evaluation of the role of Iron in second urbanisation:</h4>
<h5>View I: Iron played a crucial role</h5>
<ul>
<li>&#8226; <strong>D.D. Koshambi</strong> was the first to link the role of iron implements to the 2nd urbanisation.
<ul>
<li style="padding-left:2em">&#9702; This theory was developed further by <strong>R.S Sharma, D.N Jha</strong> and other <strong>Marxist</strong> historians.</li>
</ul>
</li>
<li>&#8226; According to this view, <strong>clearing of forests and expansion of cultivation</strong> became easier with the help of iron tools.
<ul>
<li style="padding-left:2em">&#9702; Thus, from the 6th century BCE onwards, agriculture was practised extensively in the middle-Gangetic basin.</li>
<li style="padding-left:2em">&#9702; Some agrarian implements like <strong>sickles, hoes, axes</strong> etc. were associated with this period.
<ul>
<li style="padding-left:4em">&#9632; From the <strong>Jakhera</strong> archeological site, we've unearthed even an <strong>iron ploughshare.</strong></li>
</ul>
</li>
<li style="padding-left:2em">&#9702; Thus, with the help of iron implements, there was <strong>further extension of cultivation</strong> in the arable lands in the middle Gangetic basin.</li>
</ul>
</li>
<li>&#8226; Furthermore, the <strong>rice producing middle Gangetic basin</strong> was more productive that wheat producing upper-Gangetic basin.</li>
<li>&#8226; Apart from that, the <strong>transplantation of paddy</strong> started during this period.</li>
<li>&#8226; Also, <strong>slaves and workers</strong> got associated with cultivation for the first time because paddy transplantation is a productive but labour intensive method.</li>
<li>&#8226; It resulted in surplus agrarian production. Then, this surplus production encouraged <strong>population growth</strong>.
<ul>
<li style="padding-left:2em">&#9702; For example, in the Gangetic basin, the total number of OCP sites was 110 and the total number of PGW sites increased to 750 but the number of NBPW sites reached 1500.</li>
</ul>
</li>
<li>&#8226; On the other hand, surplus production in the field of agriculture encouraged the <strong>development of crafts</strong>.
<ul>
<li style="padding-left:2em">&#9702; In Buddhist texts, different types of crafts have been mentioned.</li>
<li style="padding-left:2em">&#9702; Now, a group of craftsmen associated with a particular craft could settle in a particular region and gradually these regions developed into urban centres.
<ul>
<li style="padding-left:4em">&#9632; These decisions were based on the availability of raw materials and markets for their goods.</li>
</ul>
</li>
<li style="padding-left:2em">&#9702; They could completely dissociate from farming as their craftsmanship could earn them a decent living.
<ul>
<li style="padding-left:4em">&#9632; For example, at Vaishali, 500 potters were settled.</li>
</ul>
</li>
</ul>
</li>
<li>&#8226; During this period, <strong>trade and commerce also was encouraged</strong>.
<ul>
<li style="padding-left:2em">&#9702; Surplus from agriculture and crafts specialisation &amp; proliferation gave birth to long and short distance trade in these goods.</li>
</ul>
</li>
<li>&#8226; This trade could be further facilitated with the rise of the <strong>money economy</strong>.
<ul>
<li style="padding-left:2em">&#9702; For example, punch marked coins, which were the earliest regular coins, came into existence for the first time during this period.</li>
</ul>
</li>
<li>&#8226; <strong>In this way, the emergence of second urbanisation was linked with the effective use of iron implements in the field of agriculture.</strong></li>
</ul>

<h5>View II: Role of iron was limited</h5>
<ul>
<li>&#8226; <strong>Revisionist</strong> historiography has stressed that instead of iron tools, other factors played more significant roles.
<ul>
<li style="padding-left:2em">&#9702; This view was promoted by D.K. Chakravarty, Bridget and Raymond Allchin, George Erdosy etc.</li>
</ul>
</li>
<li>&#8226; <strong>D.K Chakravarty</strong> emphasised that the <strong>political, economic and religious factors</strong> made a more important contribution to the second urbanisation than the iron tools.
<ul>
<li style="padding-left:2em">&#9702; He argues that if we observe the <strong>earliest urban sites</strong>, we come to the conclusion that most of these towns were <strong>mainly political-administrative centres</strong>, eg. Indraprastha, Rajagriha, Shravasti, Kosambi, Champa, Ahichchhatra etc.
<ul>
<li style="padding-left:4em">&#9632; So, here the rise of urban centres should be linked to the administrative activities.</li>
</ul>
</li>
<li style="padding-left:2em">&#9702; Likewise, there were <strong>certain towns which were the product of growing trading activities.</strong>
<ul>
<li style="padding-left:4em">&#9632; As we know, during early centuries of the Common Era (CE), certain towns in northern and southern India appeared as a result of Roman trade.</li>
</ul>
</li>
<li style="padding-left:2em">&#9702; Apart from that, even religious factors might have contributed to this process.
<ul>
<li style="padding-left:4em">&#9632; For example, some <strong>religious structures like Chaityas and Stupas</strong> are visible either along the ancient trade routes or the urban centres.</li>
<li style="padding-left:4em">&#9632; So, it appears that heterodox sects like Buddhism and Jainism contributed to the development of trade and towns.</li>
</ul>
</li>
</ul>
</li>
<li>&#8226; On the other hand, <strong>B. and R. Allchin</strong> tried to prove that, in place of iron implements, it was the <strong>migration of population as well as technology</strong> from the North-West to the Ganga valley which resulted in second urbanisation.
<ul>
<li style="padding-left:2em">&#9702; They argue that the multi-fold increase in the number of settlements towards East should not be linked to the agrarian surplus, rather it should be linked to the <strong>migration of population from West to East due to climatic change.</strong></li>
<li style="padding-left:2em">&#9702; Furthermore, <strong>even technological know-how was coming</strong> from North-West along with people.</li>
<li style="padding-left:2em">&#9702; Likewise, in the Gangetic basin, some new types of crops grew in importance. These developments resulted in the growth in production.</li>
</ul>
</li>
<li>&#8226; There is another perspective that undermines the role of iron in the process of urbanisation. According to this view, <strong>the role of iron in the 2nd urbanisation should not be overestimated due to following reasons:</strong>
<ul>
<li style="padding-left:2em">&#9702; Firstly, the <strong>number of iron implements associated with this period is quite small.</strong>
<ul>
<li style="padding-left:4em">&#9632; The number of agrarian iron tools became significant only in the middle of NBPW phase, when urbanisation was well underway.</li>
<li style="padding-left:4em">&#9632; <strong>Makkhan Lal</strong> argues that there was <strong>no significant increase in the use of iron</strong> from PGW to NBPW phase.
<ul>
<li>&#8226; In fact, latest archaeology shows that the iron was being used in at least some parts of the middle Ganga Valley from as early as the beginning of the 2nd millennium BCE.</li>
</ul>
</li>
<li style="padding-left:4em">&#9632; Furthermore, <strong>A. Ghosh and Niharranjan Ray</strong> argue on the basis of the contemporary texts, that the <strong>fire</strong> was being used for clearing of forest even during this period.</li>
</ul>
</li>
<li style="padding-left:2em">&#9702; Secondly, while expansion of agriculture must have involved some degree of deforestation, but, the <strong>large-scale clearing of the Ganga Valley</strong> and the subcontinent in general, is a relatively recent phenomenon of the <strong>colonial period</strong>.
<ul>
<li style="padding-left:4em">&#9632; This was on account of the railway expansion, population boom and commercialization of agriculture.</li>
</ul>
</li>
<li style="padding-left:2em">&#9702; On these grounds, we can say that for the growth in production, the entire credit should not be given to iron implements only.</li>
</ul>
</li>
<li>&#8226; Also, the <strong>interplay between technology and history is complex</strong>. This is also suggested by archaeology.
<ul>
<li style="padding-left:2em">&#9702; E.g. the advent of the Iron Age was not swiftly followed by urbanisation and radical socio-economic changes in the Deccan and the South.</li>
<li style="padding-left:2em">&#9702; <strong>Rajan Gurukka</strong> points out that, despite having the knowledge of iron technology, the larger socio-political context of war and plunder obstructed the process of agrarian growth in these areas.</li>
</ul>
</li>
</ul>

<h5>Conclusion:</h5>
<ul>
<li>&#8226; In conclusion, we can say that the <strong>role of iron as an instrument of change cannot be denied.</strong>
<ul>
<li style="padding-left:2em">&#9702; Iron contributed not only in production but also in control of this surplus production (coercive element of the state).</li>
</ul>
</li>
<li>&#8226; <strong>But, other factors should be taken into consideration.</strong>
<ul>
<li style="padding-left:2em">&#9702; In other words, we can say that the role of iron should be linked to other relevant factors, only then the evolution of 2nd urbanisation can properly be evaluated.</li>
</ul>
</li>
</ul>

<h3>Social structure in Buddha Age</h3>
<ul>
<li>&#8226; The Varna division had already started to crystallise during the Later Vedic period and the <strong>four-fold Varna system replaced</strong> the old tribal division.
<ul>
<li style="padding-left:2em">&#9702; Now, birth became the basis of social division.</li>
<li style="padding-left:2em">&#9702; On the basis of Dharma Shastras, Varna division was made a rigid structure.</li>
<li style="padding-left:2em">&#9702; The social mobility from one Varna to another Varna was largely disrupted.</li>
</ul>
</li>
<li>&#8226; <strong>Buddhist and Jaina texts</strong> also approve of these divisions.
<ul>
<li style="padding-left:2em">&#9702; But, they treat these divisions as a product of the <strong>human imagination</strong> to establish a social order.
<ul>
<li style="padding-left:4em">&#9632; Unlike Brahamanical texts, they don't belive that this four-fold Varna division is part of the divinely ordained natural order.</li>
</ul>
</li>
<li style="padding-left:2em">&#9702; Naturally, Buddhist and Jain traditions were <strong>more tolerant of the Varna infractions.</strong></li>
</ul>
</li>
<li>&#8226; Also, <strong>two types of marriages</strong> emerged during this period i.e. 'Anuloma' and 'Pratiloma'.
<ul>
<li style="padding-left:2em">&#9702; In <strong>'Anuloma'</strong> marriages, the Varna status of a wife was inferior to that of her husband.
<ul>
<li style="padding-left:4em">&#9632; In the Dharma Sutra tradition, the Anuloma marriage was <strong>accepted</strong>.</li>
</ul>
</li>
<li style="padding-left:2em">&#9702; In the <strong>'Pratiloma'</strong> marriages, the Varna status of husband was inferior.
<ul>
<li style="padding-left:4em">&#9632; The Pratiloma marriage was <strong>strictly prohibited</strong> and the <strong>progeny</strong> of such a marriage was <strong>thrown out of the Varna hierarchy.</strong></li>
</ul>
</li>
</ul>
</li>
<li>&#8226; As a result of such marriages, the number of <strong>'Varna Samkaras'</strong> (Varna Intermixing) increased.
<ul>
<li style="padding-left:2em">&#9702; The fact that these marriages are even discussed in the Sutras means that they took place.
<ul>
<li style="padding-left:4em">&#9632; Perhaps, these prescriptions of the Dharma Sutras were frequently contravened.</li>
</ul>
</li>
<li style="padding-left:2em">&#9702; That is why the <strong>Buddhist texts mention about 12 Varna Samkaras</strong>.</li>
</ul>
</li>
<li>&#8226; Varna was now competing with another marker of social identity, <strong>Jati (caste)</strong>.
<ul>
<li style="padding-left:2em">&#9702; The <strong>Dharma sutras</strong> explain the origin of these Jatis with the <strong>fictitious theory of the mixture of Varnas (Varna Samkaras).</strong>
<ul>
<li style="padding-left:4em">&#9632; Jatis may have had a complex origin.</li>
</ul>
</li>
<li style="padding-left:2em">&#9702; So, the <strong>beginning of the caste system</strong> can be traced to the 6th century BCE.</li>
</ul>
</li>
<li>&#8226; <strong>Untouchability may have started</strong> during this period itself.
<ul>
<li style="padding-left:2em">&#9702; The <strong>Chandalas</strong> are unanimously put into the untouchable category by all the major Dharma sutras.</li>
</ul>
</li>
<li>&#8226; <strong>Kula and Gotra</strong> were the other important markers of social identity.</li>
<li>&#8226; The texts of this period frequently refer to the <strong>slaves</strong>- male and female.</li>
<li>&#8226; <strong>New social groups</strong> evolved during this period with the new economic activities e.g. <strong>Gahapatis</strong> (Grihpatis), <strong>Setthi</strong> (shresthi) etc.
<ul>
<li style="padding-left:2em">&#9702; They mostly belonged to the 'Vaishya' Varna. But, they enjoyed higher economic status which must have increased their social aspirations.</li>
<li style="padding-left:2em">&#9702; It was an important factor behind their support for Buddhism and Jainism.</li>
</ul>
</li>
<li>&#8226; <strong>'Dharma Sutras' relegated women to a lower status</strong>. Their social condition declined during this period.
<ul>
<li style="padding-left:2em">&#9702; They were completely subordinated to the male members of the family.</li>
<li style="padding-left:2em">&#9702; Apart from that, dowry system expanded during this period e.g. Bimbisara got the region of Kashi as dowry.</li>
</ul>
</li>
</ul>

<h3>Religion in the Buddha Age</h3>
<h4>The Intellectual Revolution in 6th century BCE:</h4>
<p>The period of <strong>6th century BCE</strong> onwards is known as the <strong>Age of Enquiry.</strong> A number of thinkers appeared during this period. They reflected over the questions like meaning of life and death, the nature of truth, universal truth, natural order etc.</p>
<ul>
<li>&#8226; The <strong>multiplicity of the heterodox sects</strong> was a feature of this age.
<ul>
<li style="padding-left:2em">&#9702; According to the Buddhist texts, there were 63 sects while Jaina texts mention about 363 sects.</li>
<li style="padding-left:2em">&#9702; During this period, great thinkers like <strong>Buddha and Mahavira</strong> were born.</li>
<li style="padding-left:2em">&#9702; They emphasised over the concepts like <strong>Karma, transmigration of soul and salvation.</strong></li>
</ul>
</li>
<li>&#8226; But other than these thinkers, there were <strong>materialistic thinkers</strong> as well which included Ajit Keskamblin, Pakkuda Katyayana, Purana Kashyapa, Makkhali Gosala and Sanjay Velittaputra.
<ul>
<li style="padding-left:2em">&#9702; They <strong>rejected the concepts of Karma and Rebirth</strong> and believed in the theory of <strong>predetermination</strong>.
<ul>
<li style="padding-left:4em">&#9632; But, other than Buddhism and Jainism, no other heterodox sect left behind a body of literature.</li>
<li style="padding-left:4em">&#9632; Whatever we know about them is sourced from the writings of their competitors.</li>
</ul>
</li>
</ul>
</li>
</ul>
<p>In one sense, it was an <strong>age of enquiry even in the global context.</strong></p>
<ul>
<li>&#8226; This period was marked by the arrival of Zarthrusta in Persia, Pythagoras in Greece and Confucius as well as Laozi in China.</li>
<li>&#8226; So, it does not appear to be an exaggeration to say that the period of 6th century B.C. was marked by an intellectual fermentation.</li>
</ul>

<h4>Factors responsible for the Intellectual Revolution:</h4>
<p>When we observe closely, we find that the origin of heterodox sects was <strong>deeply associated with the contemporary economic and social changes.</strong></p>
<ul>
<li>&#8226; In fact, <strong>Vedic religion was opposing the contemporary economic and social demands.</strong>
<ul>
<li style="padding-left:2em">&#9702; For example, in the 6th century BCE, there was an <strong>expansion in cultivation</strong> in the middle Gangetic basin.
<ul>
<li style="padding-left:4em">&#9632; The <strong>iron implements</strong> played an important role in clearing of forest and ensuring <strong>agrarian expansion</strong>.</li>
<li style="padding-left:4em">&#9632; The <strong>slaves and workers</strong> were involved in cultivation for the first time during this period.</li>
</ul>
</li>
<li style="padding-left:2em">&#9702; As a result of development in agriculture, a <strong>prosperous agrarian class</strong> came into existence.
<ul>
<li style="padding-left:4em">&#9632; In Buddhist text, they came to be known as <strong>'Gahapatis'</strong> (the head of families).</li>
<li style="padding-left:4em">&#9632; During Vedic Age, they were mainly associated with domestication of animals. But, during this period, they became <strong>heads of prosperous families.</strong>
<ul>
<li>&#8226; The Buddhist texts mention prosperous Grihpatis like <strong>Mendaka and Anathapindika.</strong></li>
</ul>
</li>
<li style="padding-left:4em">&#9632; Some Grihpatis possessed big agrarian farms.
<ul>
<li>&#8226; We come to know that 500 oxen were used for cultivation in some of the big farms.</li>
<li>&#8226; So, the demand of the new agrarian economy was the <strong>protection of animal wealth.</strong></li>
</ul>
</li>
<li style="padding-left:4em">&#9632; But at the same time, a large number of animals were being <strong>slaughtered in sacrifices.</strong>
<ul>
<li>&#8226; That's why the ritualistic Vedic religion ran counter to the economic demands of the time.</li>
<li>&#8226; On the other hand, the heterodox sects like Buddhism and Jainism were emphasising over the protection of animal wealth.</li>
<li>&#8226; So, it was very natural that the Grihpatis, associated with cultivation, had supported heterodox sects.</li>
</ul>
</li>
</ul>
</li>
</ul>
</li>
<li>&#8226; Likewise, this period was marked by <strong>growing trade &amp; commerce and the money economy.</strong>
<ul>
<li style="padding-left:2em">&#9702; In fact, Pali texts give us information about the <strong>important trade routes</strong> in Northern India.</li>
<li style="padding-left:2em">&#9702; Likewise, the terms like <strong>'Shresthi, Gana, Sangha'</strong> etc. give a strong hint towards the presence of a mercantile and artisan class.</li>
<li style="padding-left:2em">&#9702; Back then, as it is even today, <strong>money-lending and profit-making</strong> were the backbones of trade and commerce.
<ul>
<li style="padding-left:4em">&#9632; But the Vedic religion looked down upon money lending and profit making. These were declared unethical in the Sutra literature.</li>
</ul>
</li>
<li style="padding-left:2em">&#9702; On the other hand, <strong>Buddhism and Jainism justified money-lending and profit-making.</strong>
<ul>
<li style="padding-left:4em">&#9632; That's why, the mercantile class supported heterodox sects like Buddhism &amp; Jainism.</li>
</ul>
</li>
<li style="padding-left:2em">&#9702; Infact, this phenomenon <strong>goes against the thesis of Max Weber</strong> that the Indian religious sects worked as a barrier against economic development because they lacked rationalism which one could see in the Protestantism of Europe.</li>
</ul>
</li>
<li>&#8226; Likewise, the <strong>origin of heterodox sects had a broad social base as well.</strong>
<ul>
<li style="padding-left:2em">&#9702; In fact, the <strong>unequal distribution of the economic surplus</strong> generated in the 6th century BCE created <strong>social tensions</strong> based on the growing inequality and conflict.</li>
<li style="padding-left:2em">&#9702; As a result of this surplus, a <strong>rivalry</strong> started between the <strong>Brahmins</strong> and the <strong>Kshatriyas</strong>.
<ul>
<li style="padding-left:4em">&#9632; As we know, tribal society was converted into a Varna divided society up to this period and a higher position in the Varna hierarchy meant a bigger claim over the surplus production.</li>
<li style="padding-left:4em">&#9632; That's why, the Kshatriyas started a competition with the Brahmins in order to get a higher social status.</li>
<li style="padding-left:4em">&#9632; So, it is <strong>not simply coincidence that the earlier Upanishads were composed in the land of Videha.</strong></li>
</ul>
</li>
<li style="padding-left:2em">&#9702; Some <strong>Kshatriya kings started to challenge the Brahmanic supremacy</strong> in the field of education.
<ul>
<li style="padding-left:4em">&#9632; They got the status of <strong>philosopher kings</strong>. Likewise, even <strong>religious leaders like Buddha and Mahavira belong to the Kshatriya clans.</strong></li>
<li style="padding-left:4em">&#9632; This Brahman-Kshatriya rivalry is <strong>reflected in the Pali texts</strong>, which presented a new Varna hierarchy viz <strong>Khatiya &gt; Babhan &gt; Vessa &gt; Suda.</strong></li>
</ul>
</li>
<li style="padding-left:2em">&#9702; On the other hand, <strong>heterodox sects got the support of Vaishyas also.</strong>
<ul>
<li style="padding-left:4em">&#9632; Infact, Vaishyas were the only producer and tax-payer class but they were assigned third position in the Varna hierarchy.</li>
<li style="padding-left:4em">&#9632; That's why, even Vaishyas were dissatisfied with the Varna system.</li>
<li style="padding-left:4em">&#9632; They were <strong>ready to give support to those sects which could give a challenge to the Varna system.</strong></li>
</ul>
</li>
</ul>
</li>
<li>&#8226; Apart from that, <strong>even the concept of Karma and rebirth had a relationship with the contemporary economic and social changes.</strong>
<ul>
<li style="padding-left:2em">&#9702; In fact, the concept of karma and rebirth was <strong>conceptualised to give stability to society</strong> which was economically and socially sharply divided.</li>
<li style="padding-left:2em">&#9702; As Buddhism and Jainism accepted this concept, they became relevant in society.</li>
</ul>
</li>
<li>&#8226; Although, we find the literary reference to as many as 63 religious sects during this period, <strong>Buddhism and Jainism gained more prominence</strong>.
<ul>
<li style="padding-left:2em">&#9702; Their importance lay in the fact that they <strong>made spirited attacks on the existing Varna-system and the ritualistic domination of the Brahmins</strong>.</li>
<li style="padding-left:2em">&#9702; They <strong>provided a more balanced and readily adaptable solution</strong>, especially at a time when the society was undergoing significant economic, social and political changes following the use of iron in the second phase.</li>
</ul>
</li>
</ul>

<h4>Impact of the new religious movements:</h4>
<p>The rise and development of the new religious ideas brought some <strong>significant changes in contemporary social life</strong>. Some of the important changes are following:</p>
<ol>
<li>The idea of <strong>social equality</strong> was popularised in this period.
<ul>
<li>&#8226; The Buddhists and Jains did not give much importance to the caste system.</li>
<li>&#8226; They accepted members of different castes in their religious order (Sangha).</li>
<li>&#8226; This was a threat to the age-old domination of the Brahmans in the society.</li>
<li>&#8226; Acceptance of women in the Buddhist order also had an impact on the society because this gave women an alternative way of living.</li>
</ul>
</li>
<li>Brahmanical texts had assigned an inferior <strong>position to traders.</strong>
<ul>
<li>&#8226; Sea voyages were also condemned.</li>
<li>&#8226; But as the Buddhists and Jains did not give much importance to the caste and did not look down upon the sea voyages, the trading community was encouraged by these new religious ideas.</li>
<li>&#8226; Moreover, the emphasis on Karma for future life by these new religious orders also indirectly favoured the activities of the trading community.</li>
</ul>
</li>
<li>These new sects gave importance to <strong>local dialects</strong> like Prakrit, Pali and Ardha Magadhi.</li>
</ol>

<h4>The features of religion during Buddha age</h4>
<ol>
<li>This period is marked by an <strong>intellectual revolution</strong>.
<ul>
<li>&#8226; The multiplicity of sects was one of the features of this time.</li>
<li>&#8226; According to the Buddhist texts, there were nearly 63 sects and according to the Jaina texts, there were nearly 363 sects.</li>
<li>&#8226; Above all, there was an ideological conflict among different scholars and thinkers.</li>
<li>&#8226; Even at the global level, this period was marked by intellectual fermentation e.g. Pythagoras was born in Greece, Confucius and Laozi in China and Zarthrusta in Persia.</li>
</ul>
</li>
<li><strong>Asceticism</strong> was a very common feature among most of the sects.
<ul>
<li>&#8226; This was because most of the sects believed in the concept of karma, rebirth and salvation.</li>
</ul>
</li>
<li>These sects <strong>rejected ritualism</strong>.
<ul>
<li>&#8226; They questioned that, "if Brahma and soul are same then why - and for whom the rituals should be done?"</li>
</ul>
</li>
</ol>

<h3>Important sects or philosophical schools</h3>
<h4>1. Upanishads</h4>
<p>It rejected the Vedic ritualism.</p>
<ul>
<li>&#8226; Instead, it <strong>gave emphasis over the relation between 'brahma' and soul.</strong>
<ul>
<li style="padding-left:2em">&#9702; According to the Upanishads, 'brahma and soul' are one and the same.</li>
<li style="padding-left:2em">&#9702; The superficial differences between them are due to the ignorance about their relationship.</li>
<li style="padding-left:2em">&#9702; According to the Upanishads, the path for salvation is 'Knowledge'.</li>
</ul>
</li>
<li>&#8226; Although Upanishads revolted against the Vedic ritualism, they were <strong>different from Buddhism and Jainism.</strong>
<ul>
<li style="padding-left:2em">&#9702; The objective of Buddhism and Jainism was to deny the existence (concept) of the Vedic religion completely, the objective of Upanishads was to make corrections in the existing Vedic religion in order to strengthen its position vis-\u00e0-vis other sects.</li>
</ul>
</li>
</ul>

<h4>2. Jainism</h4>
<p>Jainism tried to address the contemporary socio-economic challenges.</p>
<ul>
<li>&#8226; According to Jainism, the <strong>world is eternal</strong> i.e. it neither has a beginning nor an end. Further, there are <strong>two phases</strong> in the cyclic functioning of the world.
<ul>
<li style="padding-left:2em">&#9702; First phase is the stage of upsurge. In Jaina texts, it is called <strong>'Utsarpini'</strong>.
<ul>
<li style="padding-left:4em">&#9632; During this stage, 36 'Shalaka Purush' (great men) are born.</li>
<li style="padding-left:4em">&#9632; Among them, there are 24 Tirthankaras and 12 Chakravarty rulers.</li>
</ul>
</li>
<li style="padding-left:2em">&#9702; The second phase is that of decline <strong>'Avasarpini'</strong>.
<ul>
<li style="padding-left:4em">&#9632; During this stage, even the size of man gets reduced so much that he has to pluck brinjal with the help of a bamboo stick.</li>
</ul>
</li>
</ul>
</li>
<li>&#8226; Also, according to Jaina philosophy, this <strong>universe functions through interaction between 'Jiva' (soul) and 'Ajiva' (matter).</strong>
<ul>
<li style="padding-left:2em">&#9702; Ajiva includes dharma, adharma, Akash (space), kaal (time) and pudgal (karma).</li>
</ul>
</li>
<li>&#8226; The <strong>objective</strong> of Jainism is to <strong>make Jiva (soul) free from Pudgal (karma)</strong>.
<ul>
<li style="padding-left:2em">&#9702; Only then can a person attain 'Kaivalya' (the highest knowledge).</li>
<li style="padding-left:2em">&#9702; Two methods are recommended in Jainism to destroy pudgal.
<ul>
<li style="padding-left:4em">&#9632; First one is <strong>'samvara'</strong>.
<ul>
<li>&#8226; Through this method, the entry of 'pudgal' into 'Jiva' has to be prevented.</li>
</ul>
</li>
<li style="padding-left:4em">&#9632; The second method is <strong>'nirjara'</strong>.
<ul>
<li>&#8226; It involves annihilation of the accumulated karma through great penances.</li>
</ul>
</li>
</ul>
</li>
</ul>
</li>
<li>&#8226; Jainism has recommended <strong>5 'mahavrata' and 12 'anuvrata'</strong> for monks and lay followers respectively.</li>
<li>&#8226; A unique ideological achievement of Jainism is its philosophy of <strong>'Syadvada'</strong> or <strong>'Anekantavada'</strong>.
<ul>
<li style="padding-left:2em">&#9702; It is also known as 'Sapta-bhangi Nyaya'.</li>
<li style="padding-left:2em">&#9702; According to this philosophy, <strong>truth can be one and more than one, static and mobile, at the same time.</strong>
<ul>
<li style="padding-left:4em">&#9632; So, there can be more than one aspect of an event and all of them can be true at the same time.</li>
<li style="padding-left:4em">&#9632; As per the theory of Syadvada, truth can have 7 attributes.</li>
</ul>
</li>
</ul>
</li>
</ul>

<h4>Significance and the present relevance of Jainism</h4>
<ol>
<li>It gave a <strong>challenge to the Brahmanic supremacy</strong> and 'varna-ashrama' system.</li>
<li>It <strong>responded to the contemporary economic realities</strong> by giving support to the rising mercantile class.</li>
<li>Jaina saints developed their own <strong>educational institutions</strong>.
<ul>
<li>&#8226; By establishing libraries, they tried to spread education.</li>
</ul>
</li>
<li>They made contributions in development of <strong>architecture</strong> e.g. Dilwara temple.
<ul>
<li>&#8226; Even, its contribution in <strong>painting</strong> is important e.g. earliest miniature paintings of ancient India.</li>
<li>&#8226; Jain <strong>literature</strong> in the regional scripts and dialects promoted their standardisation in the early medieval period.</li>
</ul>
</li>
<li>They also tried to create a <strong>mental climate for tolerance</strong> by promoting philosophy like 'Syadvada'.</li>
<li>Jainism <strong>infused a sense of non-violence</strong> in the cultural heritage of India.</li>
</ol>
<p>For the <strong>present relevance</strong> of Jainism, we can say that Jainism promoted <strong>non-violence</strong>.</p>
<ul>
<li>&#8226; But while doing so, it went to an impractical extent e.g. protection of insects.
<ul>
<li style="padding-left:2em">&#9702; So, in contemporary context, that is not relevant.</li>
</ul>
</li>
<li>&#8226; But the philosophy of <strong>'Syadvada'</strong> propounded by Jainism is still relevant.
<ul>
<li style="padding-left:2em">&#9702; 'Syadvada' says that there are seven attributes of the truth.</li>
<li style="padding-left:2em">&#9702; In true sense, it is Syadvada' which promotes non-violence.</li>
<li style="padding-left:2em">&#9702; It tries to establish that it is wrong to claim that the truth is only one.</li>
<li style="padding-left:2em">&#9702; Normally, every violent act involves a claim by a group that its own version of truth is the only right one.</li>
<li style="padding-left:2em">&#9702; But, if there are more than one attribute of a truth, there is no basis of violence.</li>
<li style="padding-left:2em">&#9702; A sense of tolerance and co-existence is inherent in 'Syadvada.'</li>
<li style="padding-left:2em">&#9702; And, it is this philosophy of Syadvada which became the inspiration for Gandhian non-violence.</li>
</ul>
</li>
</ul>

<h4>3. Buddhism</h4>
<p>It conceives the world in the following manner.</p>
<ul>
<li>&#8226; <strong>First, the world is full of sorrows.</strong>
<ul>
<li style="padding-left:2em">&#9702; It is from here, its philosophy of <strong>four noble truth</strong> emerges
<ul>
<li style="padding-left:4em">&#9632; i.e. there is sorrow;</li>
<li style="padding-left:4em">&#9632; There is a cause of sorrow;</li>
<li style="padding-left:4em">&#9632; There is a solution to sorrow and;</li>
<li style="padding-left:4em">&#9632; There is a method to get rid of sorrow.
<ul>
<li>&#8226; That method was called the Eightfold path (middle path).</li>
</ul>
</li>
</ul>
</li>
</ul>
</li>
<li>&#8226; Second, Buddhism believes that the <strong>world is transitory i.e it is changing every moment.</strong> Also, it declares that the world is <strong>'soulless'</strong>.
<ul>
<li style="padding-left:2em">&#9702; Thus, on the one hand it <strong>accepts the concept of 'Karma and rebirth'</strong>, on the other hand, it <strong>denies the concept of soul</strong>.</li>
<li style="padding-left:2em">&#9702; So, the question arises, if there were no soul then what transmigrates to the next life.</li>
</ul>
</li>
<li>&#8226; Buddhism answers this through the philosophy of <strong>Pratityasamutpada</strong> (the theory of dependent origination).
<ul>
<li style="padding-left:2em">&#9702; According to this philosophy, if the <strong>cause of sorrow is desire then the cause of birth is the cycle of Karma.</strong></li>
<li style="padding-left:2em">&#9702; In this way, Buddhism tried to establish some <strong>causative relationship between birth and Karma.</strong>
<ul>
<li style="padding-left:4em">&#9632; We can understand this concept with the example of a candle.</li>
<li style="padding-left:4em">&#9632; If a candle, before being extinguished, lights another candle, then the 1st candle becomes the cause of the 2nd candle.</li>
<li style="padding-left:4em">&#9632; On the basis of such a causative relationship, rebirth is explained.</li>
<li style="padding-left:4em">&#9632; Thus, it is the karma which travels from one birth to another birth, and not the soul.</li>
<li style="padding-left:4em">&#9632; Note: - Pratyutsamutpada ('Pratyut'- because of this (cause) and 'Sammuppad' - this happens (effects). It is also called the law of causative origination i.e. everything has a cause.</li>
</ul>
</li>
</ul>
</li>
</ul>

<h4>Eightfold path (middle path)</h4>
<ol>
<li>Right view</li>
<li>Right resolve</li>
<li>Right speech</li>
<li>Right concentration</li>
<li>Right livelihood</li>
<li>Right effort</li>
<li>Right recollection</li>
<li>Right meditation</li>
</ol>

<h4>Three Jewels (Tri-ratna)</h4>
<ol>
<li>Buddha</li>
<li>Dharma</li>
<li>Sangha</li>
</ol>

<h4>Why did Buddhism become popular?</h4>
<ol>
<li>Buddhism <strong>kept away from controversial concepts like soul and god</strong>. So, it became <strong>comprehensible</strong> to the common people.</li>
<li>Unlike Jainism, Buddhism adopted a <strong>practical approach to life</strong> as it emphasised over the 'middle path'.</li>
<li><strong>Buddhism catered to the interest of both, the rich and the poor</strong>. It favoured the rich by emphasising on the principle of 'non-stealing'. But, at the same time, it favoured the poor by promoting the principle of 'non-accumulation' of wealth.</li>
<li>Buddhism adopted the <strong>language of the common people</strong> i.e. Pali. So, it could reach the masses easily.</li>
<li>Buddhism enjoyed <strong>royal patronage</strong>. The rulers of Magadha, Bimbisara and Ajatsatru, the ruler of Kosala, Prasenjit etc. gave patronage to Buddhism. Later Ashoka and Kanishka converted it into a world religion.</li>
</ol>

<h4>Limitations of Buddhism:</h4>
<ol>
<li>Despite opposing the <strong>caste system, Buddhism could not develop any alternative model of the social order</strong>.
<ul>
<li>&#8226; It maintained republican norms and equality in the monastic life inside the Buddhist Sangha. But in the world outside the Buddhist Sangha, it compromised with the caste system in practice.</li>
<li>&#8226; Pali texts tried to change the caste hierarchy in the following manner.
<ul>
<li style="padding-left:2em">&#9702; Top: Khatiya (Kshatriya)</li>
<li style="padding-left:2em">&#9702; Babhan (Brahmin)</li>
<li style="padding-left:2em">&#9702; Vessa (Vaishya)</li>
<li style="padding-left:2em">&#9702; Bottom: Suda (Shudra)</li>
</ul>
</li>
</ul>
</li>
<li>Buddhism <strong>couldn't break Brahmanic dominance</strong> and Buddha could not be free from the elite consciousness completely. Even inside the Buddhist monastery, there was a larger presence of the upper Varnas.</li>
<li>Buddhism was not free from the impact of Brahmanical <strong>patriarchy</strong>.
<ul>
<li>&#8226; E.g. earlier Buddha was unwilling to give entry to the women in the Buddhist monastic order.</li>
<li>&#8226; Even when he became ready, he could not be free from his scepticism about this move.</li>
<li>&#8226; A separate monastic order within the Sangha was constituted for the women monks.</li>
<li>&#8226; Women monks were placed under the strict supervision of male monks.</li>
</ul>
</li>
</ol>

<h4>Significance of Buddhism and its relevance today</h4>
<ol>
<li>Buddhism was not simply a religious movement but also a <strong>social revolution</strong>.
<ul>
<li>&#8226; It promoted a social ethics which was noticed by a conscious king, Ashoka.</li>
<li>&#8226; Infact, Ashoka developed a very practical form of Buddhism which represented a social creed minus Nirvana.</li>
</ul>
</li>
<li>Buddhism <strong>promoted economic activities</strong> as well by discouraging animal slaughter and encouraging a mercantile value system.</li>
<li>Buddhism promoted a <strong>sense of compassion and brotherhood</strong> which is a great treasure for human civilization. It promoted the concept of 'Live and let Live'.</li>
<li>Initially, Buddhism encouraged <strong>Pali</strong> language and literature. Later, it encouraged <strong>Sanskrit</strong> language and literature as well.</li>
<li>Buddhism made contributions to <strong>art and architecture</strong> as well. Stupas, Chaityas, Viharas and during Mahayana phase, even temples developed as Buddhist architectures.</li>
</ol>
<p><strong>The relevance of Buddhism can't be denied even during present era:</strong></p>
<ol>
<li>The Eightfold path or <strong>'Middle path'</strong> propounded by Buddha can save the world from <strong>environmental problems</strong> and natural calamities.</li>
<li>The Middle path can provide a better solution to the present society which is facing the problem of <strong>extremism</strong> in every sphere.</li>
<li>The Buddhist concept of nonviolence can give some respite to this <strong>terrorism</strong> haunted world.</li>
<li>A <strong>foreign policy</strong> based on the Buddhist ideals, originally evolved under Ashoka, can be a very effective tool in the present times.</li>
<li>It is surprising that human civilisation had reached such a stage of philosophical refinement during the time of Buddha which we cannot be surpassed even today. Questions raised by Buddha, about human existence (Dukh, Mrityu, Old age, Diseases) are still unanswered.</li>
</ol>
<p>We can underline the relevance of Buddhism in the <strong>modern corporate world</strong> which has turned to Buddhism for maintaining emotional intelligence (corporate Buddha).</p>

<h3>Q. Compare and contrast the Buddhist and Upanishadic thought. Examine their similarities and differences. [20 Marks]</h3>
<p>Buddhist thought and Upanishadic thought emerged during the same period of cultural and intellectual activity in ancient India, sharing certain similarities while also differing in fundamental aspects.</p>
<p><strong>Similarities:</strong></p>
<ul>
<li>&#8226; Both Buddhist and Upanishadic thought originated in ancient India, influenced by the <strong>socio-economic and religious conditions of the time.</strong></li>
<li>&#8226; <strong>Some early Upanishads</strong>, such as the Brihadaranyaka, Chandogya, and Aitareya, <strong>may have influenced the development of Buddhism.</strong></li>
<li>&#8226; Both traditions recognize the <strong>importance of ethical conduct</strong>, such as compassion, charity, and moral improvement.</li>
<li>&#8226; The concepts of <strong>rebirth and karma</strong> are accepted by both Buddhism and Upanishadic thought.</li>
<li>&#8226; Both traditions value the <strong>renunciant lifestyle</strong> and seek <strong>liberation from the cycle of birth and death.</strong></li>
<li>&#8226; <strong>Vegetarianism or nonviolence towards animals</strong> is promoted in both Buddhist and Upanishadic ideas.</li>
<li>&#8226; Both <strong>reject the reliance on Vedic rituals</strong> as a means of salvation.</li>
<li>&#8226; <strong>Personal experience and direct realisation</strong> are emphasised in both traditions.</li>
</ul>
<p><strong>Differences:</strong></p>
<ul>
<li>&#8226; <strong>Buddhism rejects the authority of the Vedas</strong> and orthodox tendencies found in the Upanishads.</li>
<li>&#8226; The concepts of <strong>Brahman</strong> (ultimate reality) and <strong>Atman</strong> (soul, self) are central in Upanishadic thought but <strong>denied by Buddhism</strong>.
<ul>
<li style="padding-left:2em">&#9702; The Buddha questioned the existence of a Creator Deity (Brahman) and Eternal Self (Atman), differing from Upanishadic beliefs.</li>
<li style="padding-left:2em">&#9702; The Upanishads view Brahman as the ultimate reality, whereas Buddhism considers Brahmas as a class of superhuman beings but does not perceive Brahman as the ultimate reality.</li>
</ul>
</li>
<li>&#8226; The <strong>Buddha's teachings focus on the middle way and the elimination of attachment</strong> as a cause of suffering, while the <strong>Upanishads emphasise following dharma and attaining good karma.</strong></li>
<li>&#8226; <strong>Buddhism promoted renunciation without considering caste</strong>, whereas the Upanishads maintained the varna system and prescribed specific stages of life for renunciation.</li>
<li>&#8226; <strong>Buddhism spread through conversion and proselytism</strong>, while the Upanishads are silent on the issue of religious conversion.</li>
<li>&#8226; The <strong>study of salvation in Upanishadic thought is centred on the static Self</strong>, while the Buddha's soteriology emphasises personal effort and dynamic agency.</li>
</ul>
<p>Thus, while they share some ethical values and notions such as rebirth and karma, their fundamental teachings and perspectives are distinct. As such, Buddhism, while definitely inspired by Upanishadic philosophy, represents an entirely independent body of thought.</p>

<h3>Q. Shed light on the Buddhist attitude towards the varna system. [15 Marks]</h3>
<p>Buddhism's stance on the caste system differed from the Brahmanical concept of the varna system. While <strong>Buddhism did not aim to reform or improve social conditions directly, it criticised and challenged the varna system.</strong></p>
<p><strong>Denial of Birth as the Basis of Caste:</strong></p>
<ul>
<li>&#8226; Buddha rejected the notion that one's caste is determined by birth.</li>
<li>&#8226; Instead, he emphasized that a <strong>person's behaviour and deeds define their identity.</strong></li>
<li>&#8226; He compared it to fire that can arise from any wood, indicating that a saint could be born in a family of low status.</li>
<li>&#8226; Buddha defined a Brahmana based on one's character and not their lineage, highlighting the potential for spiritual attainment in all individuals.</li>
</ul>
<p><strong>Rejection of Caste as a Measure of Social Status:</strong></p>
<ul>
<li>&#8226; The <strong>Buddha challenged the superiority claims of Brahmanas, asserting that superiority lies in one's actions, not caste.</strong></li>
<li>&#8226; He criticised the idea that a person's caste automatically confers social status, stating that a noble birth does not make a person inherently good.</li>
<li>&#8226; The Buddha maintained that <strong>all four castes are equal.</strong></li>
</ul>
<p><strong>Caste Distinctions and Moral Conduct:</strong></p>
<ul>
<li>&#8226; The Buddha <strong>acknowledged the existence of the caste system but emphasised that moral conduct, not caste, determines a person's goodness or badness.</strong>
<ul>
<li style="padding-left:2em">&#9702; He recognized that a person's caste may influence their occupation but underscored the importance of actions that promote moral development.</li>
</ul>
</li>
<li>&#8226; The Buddha encouraged individuals to engage in services that make them better, rather than those that make them bad.</li>
</ul>
<p><strong>Buddhist Monks and Caste:</strong></p>
<ul>
<li>&#8226; <strong>Buddhist monks, as a distinct class, were not bound by caste restrictions.</strong>
<ul>
<li style="padding-left:2em">&#9702; The Buddha declared the monkhood as casteless, emphasising that caste becomes irrelevant when a person attains sainthood.</li>
<li style="padding-left:2em">&#9702; However, slaves and debtors were not admitted to the monastic order unless they were freed or had discharged their debts.</li>
</ul>
</li>
</ul>
<p><strong>Karma and Caste:</strong></p>
<ul>
<li>&#8226; The Buddha <strong>established a link between caste and karma, asserting that one's present caste is a result of past karmas.</strong>
<ul>
<li style="padding-left:2em">&#9702; He taught that current actions determine one's caste status in future births.</li>
<li style="padding-left:2em">&#9702; While he acknowledged the role of caste in present life, he emphasised that caste does not determine a person's moral quality, physical features, or wealth.</li>
<li style="padding-left:2em">&#9702; The doctrine of karma provided a rational foundation for understanding the caste system.</li>
</ul>
</li>
</ul>
<p><strong>Limited Emphasis on Sudras and Outcastes</strong></p>
<ul>
<li>&#8226; The Buddha's teachings <strong>primarily address the goals of the privileged classes</strong>, with less emphasis on Sudras and outcastes.
<ul>
<li style="padding-left:2em">&#9702; Sudras and outcastes' participation in religious life is given limited attention, indicating a narrower focus on their spiritual engagement.</li>
</ul>
</li>
</ul>
<p><strong>Silence on Discriminatory Laws</strong></p>
<ul>
<li>&#8226; The Buddhist texts show <strong>no evidence of the Buddha denouncing or addressing the discriminatory laws</strong> associated with the caste system.
<ul>
<li style="padding-left:2em">&#9702; Buddhism seems to lack awareness of the existence of such discriminatory practices.</li>
</ul>
</li>
</ul>
<p>Thus, the Buddha's teachings recognized caste distinctions but challenged the notion that caste determines a person's moral worth. He emphasised the importance of individual actions and deeds, rather than birth, in determining one's spiritual progress. While the <strong>Buddha did not explicitly denounce the caste system or social practices like untouchability, he highlighted the impartiality of karmic law</strong>, which operates independently of man-made societal norms. The formation of a casteless monastic community further demonstrated the Buddha's belief in transcending caste distinctions.</p>"""

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
    new_content2 = __import__('re').sub(close_pattern, lambda m: append_entry + m.group(1), content, count=1)
    if new_content2 != content:
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(new_content2)
        print(f"SUCCESS: '{slug}' appended to noteContent.")
    else:
        print(f"ERROR: Could not find insertion point in {file_path}.")
