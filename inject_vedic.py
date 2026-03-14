import re

with open('lib/noteContent.ts', 'r') as f:
    content = f.read()

html = """<h1>Vedic Age</h1>

<h2>Vedic Period (1500 BCE - 500 BCE)</h2>

<h2>Aryans - Indigenous or Foreigners?</h2>

<p>It is true that we don't have any archaeological evidence to prove any massive migration from Central Asia to India between 1500-1000 BCE. Still, we can't support the theory of indigenous origin of Aryans on the following grounds -</p>

<ol>
<li>If India was the birthplace of Aryans then they should have colonised India first and then they should have proceeded to Central and West Asia. But we find that the situation is reversed.</li>
<li><strong>Except Indian Aryans, no other Aryan group performed sacrifices (Yajna).</strong> If Aryans had moved from India to Central and West Asia, then those people should also have adopted practises like yajnas, but that is not the case. Thus, the most acceptable view is that the Aryans originally belonged to Central Asia and from there, they migrated in different directions.</li>
<li>Recently on the basis of <strong>DNA analysis</strong>, it is emphasised that Aryans came from outside.</li>
</ol>

<h2>Aryan Invasion Theory</h2>

<ul>
<li>&#8226; The Aryan invasion theory was propounded by <strong>Mortimer Wheeler</strong>. It reflects an imperialist view of historiography. This theory is not convincing as it can't be supported with proper evidence.</li>
<li>&#8226; Alternatively, the term 'migration' has been used in place of invasion. According to the migration theory, Aryans came to India in different groups at different times.
<ul>
<li style="padding-left:2em">&#9702; E.g. from an inscription unearthed from Turkey (<strong>Bogaz Koi or Mittani inscription</strong>), dated <strong>1400 BCE</strong>, we come to know that two tribes of Aryans concluded a treaty after a long fight. In order to sanctify the treaty, they invoked the names of four gods (Indra, Mitra, Varuna and Nasatya or Ashwin) in this inscription. The name of <strong>Agni</strong> has not been mentioned here. On the other hand the Rig-Veda informs us that by the side of the river Saraswati, Drishadvati (Ghaggar) and Apaya, the Bharata tribe worshipped Agni by performing sacrifices. It means that the Bharata tribe had come to India after the Bogazkoi inscription was inscribed as the name of 'Agni' was not mentioned there.</li>
<li style="padding-left:2em">&#9702; Likewise, the Rig-Veda mentions that Indra brought <strong>Yadus and Turvasu</strong> (Vedic tribes) later. It means Yadus and Turvasu tribes were late comers.</li>
</ul>
</li>
</ul>

<h2>Aryans - Non Aryans Conflict and Assimilation</h2>

<ul>
<li>&#8226; Vedic Aryans confronted the indigenous people of India but they were certainly not the Harappans. They were <strong>either later Harappans or other Chalcolithic cultures</strong>. It is almost certain that the Harappan civilization declined earlier than the arrival of Aryans in India.</li>
<li>&#8226; As the Aryans used <strong>superior military techniques</strong>, such as horse driven chariot etc., they prevailed over their rivals. But it should be kept in mind that this conflict was going on <strong>not only between the Aryans and non-Aryan tribes only, but also between the Aryan tribes</strong>.
<ul>
<li style="padding-left:2em">&#9702; E.g. The Rig-Veda informs us that a <strong>battle of ten kings</strong> took place on the banks of the Parushni (Ravi) River and five Aryans and five non-Aryan tribes were combined together to fight an important Aryan tribe, the 'Bharatas'.</li>
</ul>
</li>
<li>&#8226; Apart from that, there is some evidence of <strong>cohabitation</strong> as well. While literary evidence talks about the conflict, archaeological evidence hints at cooperation.
<ul>
<li style="padding-left:2em">&#9702; There is an overlap between <strong>late Harappan culture and Painted Grey Ware (PGW)</strong> culture at sites such as <strong>Bhagwanpura</strong> and <strong>Dadheri</strong> in Haryana and <strong>Katpalon</strong> and <strong>Nagar</strong> in Punjab.</li>
<li style="padding-left:2em">&#9702; Also, there is an overlap between <strong>later Harappan</strong> and Ochre Coloured Pottery (<strong>OCP</strong>) culture at sites such as <strong>Bargaon</strong> and <strong>Ambakheri</strong> in Western UP. This gives us a hint that Vedic Aryans and non-Aryans perhaps lived together in the same settlements.</li>
</ul>
</li>
</ul>

<h2>Aryan - a Racial or Linguistic Group?</h2>

<p>Far-right nationalists like Hitler used propaganda to identify Aryans as a racial group but the term 'Aryan' denotes a linguistic or cultural group.</p>
<p>The term 'Aryan' refers to a group of people who spoke languages which belonged to the Indo-European family. Yet, the debunked racial definition refuses to leave popular imagination.</p>

<h2>Geographical Expansion of Aryans</h2>

<p><strong>Rig Vedic period (1500 BCE - 1000 BCE):</strong> We get an idea of the geographical expansion of Rig Vedic Aryans mainly from <strong>Rig-Veda and to some extent, from the archaeological evidences from PGW sites associated with the pre-Iron Age</strong>, such as Nagar, Katpalon, Dadheri, and Bhagwanpura.</p>

<p>Rig-Veda mentions about 41 rivers, out of which 19 have been clearly identified. Based on these descriptions geographical expansion of Rig Vedic Aryans can be outlined.</p>

<p><strong>Regions -</strong></p>
<ul>
<li>&#8226; <strong>(i) Eastern Afghanistan</strong> - Western tributaries of river Indus like Suvastu (Swat), Krumu (Kurram), Kubha (Kabul), Gomal (Gomati).</li>
<li>&#8226; <strong>(ii) Punjab and Sindh</strong> - Indus and its eastern tributaries Vitasta (Jhelum), Asikini (Chenab), Parushini (Ravi), Sutudri (Sutlej), Vipasa (Beas).</li>
<li>&#8226; <strong>(iii) Kashmir</strong> - River Maru Vridha and the mountain Mujavant (from which Aryans got Soma, an intoxicating drink) and Himvant (Himalayas).</li>
<li>&#8226; <strong>(iv) Rajasthan and Haryana</strong> - Saraswati, Drishadvati and Apaya. In Rig-Veda, the term 'Dhanwa' denotes the desert region.</li>
<li>&#8226; <strong>(v) Western U.P.</strong> - Yamuna and Ganga. Ganga has been mentioned only once, so river Yamuna might be the eastern boundary of the Vedic Aryans.</li>
</ul>

<p>So, during the Rig Vedic period, Aryans covered the region including Eastern Afghanistan, Sindh, Kashmir, Punjab, Haryana, Rajasthan and Western U.P.</p>

<h2>Geographical Expansion during the Later Vedic Period (1000 BCE - 500 BCE)</h2>

<p>The main sources from which we can infer about the geographical expansion of the later Vedic people include the <strong>later Vedic literature and the PGW sites with iron implements</strong>.</p>

<ul>
<li>&#8226; During this period, the upper Ganga basin (the region between Dehradun and Allahabad) became the main region of activity. The Rig-Veda mentions the region between Yamuna and the Ganges as the southern and the eastern boundary of Aryans but a later Vedic text, 'Aitareya Brahmana' has mentioned this region as the main region of Aryans.</li>
<li>&#8226; Up to the end of the later Vedic period, the Vedic Aryans made an eastward shift. For example, the state of Kosala (by the side of Saryu), Kashi (by the side of river Ganga) became prominent.</li>
<li>&#8226; According to the 'Shatapatha Brahmana', King Videha Madhava moved eastward with the help of 'Agni', the fire god, and crossed the Sadanira River. So, he laid the foundation of the state of Videha by the side of Sadanira or Gandak. Thus, Sadanira became the eastern boundary of Aryans.</li>
<li>&#8226; The Aitareya Brahmana divides the country into north, south, east, west and central. They possibly knew about Narmada River, Vindhyan Mountains, Eastern and Western oceans.</li>
<li>&#8226; Although 'Atharva Veda' mentions 'Anga' and 'Magadha', they were outside the pale of Aryandom.</li>
</ul>

<h1>Rigvedic Period (1500 BCE - 1000 BCE)</h1>

<h2>Economic Structure</h2>

<ul>
<li>&#8226; <strong>Animal husbandry was the main occupation.</strong>
<ul>
<li style="padding-left:2em">&#9702; It can be inferred on the basis of the frequent use of the terms which are associated with the cow herding
<ul>
<li style="padding-left:4em">&#9632; e.g. War was called 'Gavishti' (search/struggle for cows),</li>
<li style="padding-left:4em">&#9632; king was called 'Gopati' (owning large number of cows),</li>
<li style="padding-left:4em">&#9632; a prosperous man was called 'Gomath' (someone who has many cattles),</li>
<li style="padding-left:4em">&#9632; the daughter was called 'Duhita' (one who milks cows),</li>
</ul>
</li>
<li style="padding-left:2em">&#9702; Prayers were composed to ask for more cattles from gods etc.</li>
<li style="padding-left:2em">&#9702; Panis were the non-Aryans who were engaged in barter.
<ul>
<li style="padding-left:4em">&#9632; They are maligned for apparently stealing cattles and amassing huge wealth.</li>
</ul>
</li>
</ul>
</li>
<li>&#8226; <strong>But it doesn't mean that the Rigvedic Aryans were not familiar with agriculture.</strong>
<ul>
<li style="padding-left:2em">&#9702; The Rig Veda mentions many agrarian activities like ploughing of the field, sowing seeds, harvesting crops, threshing grains etc.</li>
<li style="padding-left:2em">&#9702; Apart from that, even some archaeological evidence has established the relationship of Rigvedic Aryans with cultivation.
<ul>
<li style="padding-left:4em">&#9632; E.g. we have found evidence of a cultivated field from the Swat Valley (Pakistan) which was dated to 1100 BCE. Thus, it can be associated with Rigvedic Aryans.</li>
</ul>
</li>
<li style="padding-left:2em">&#9702; The Rig Veda mentions a single crop 'Yava'.
<ul>
<li style="padding-left:4em">&#9632; It was identified with barley.</li>
<li style="padding-left:4em">&#9632; Cotton, rice, wheat etc. are not mentioned in the Rig Veda.</li>
<li style="padding-left:4em">&#9632; Perhaps, non-Aryan tribes cultivated them and traded these items with Aryans.</li>
</ul>
</li>
</ul>
</li>
<li>&#8226; As there was less scope for the production surplus in the Rig Vedic economy, so there was a <strong>narrow scope for the development of many crafts</strong>.
<ul>
<li style="padding-left:2em">&#9702; OCP was the primary Rig Vedic Pottery, though they knew Black and Red Ware too.</li>
<li style="padding-left:2em">&#9702; The Rig-Veda mentions certain crafts like copper and bronze making, chariot making, weaving etc.</li>
<li style="padding-left:2em">&#9702; Metal smelters were called 'Karmars'.
<ul>
<li style="padding-left:4em">&#9632; Also, following metals were used - 'Hiranya' (gold) which was obtained from the river sand, 'Ayas' (copper or bronze).</li>
</ul>
</li>
</ul>
</li>
<li>&#8226; As agriculture and crafts played a limited role in the Rigvedic economy, <strong>trading activities were limited</strong>.
<ul>
<li style="padding-left:2em">&#9702; The Rigveda mentions a class of merchants who were non-Aryan, who used to barter some goods with Aryans.</li>
</ul>
</li>
<li>&#8226; <strong>Money economy didn't develop</strong> during this period.
<ul>
<li style="padding-left:2em">&#9702; The Rigveda mentions certain mediums of exchange like 'Nishka' (gold jewelry) and 'Shatmana' (100 cows).</li>
<li style="padding-left:2em">&#9702; But they were not regular coins.</li>
</ul>
</li>
<li>&#8226; The Rigvedic economy invariably represented a <strong>rural economy</strong>.
<ul>
<li style="padding-left:2em">&#9702; It could not reach the stage of Urbanisation.</li>
<li style="padding-left:2em">&#9702; The Rigveda mentions 'Pur/ Durg' (fort), which were perhaps makeshift fortifications around the tribal settlements.</li>
<li style="padding-left:2em">&#9702; But, it does not use the term 'nagar' (city).</li>
</ul>
</li>
</ul>

<h2>Political Structure</h2>

<ul>
<li>&#8226; Rig Vedic polity was based on a <strong>tribal structure</strong>.
<ul>
<li style="padding-left:2em">&#9702; During this period, the state was people (<strong>Jana</strong>) based and not territory based as the Rigvedic people were <strong>semi-nomadic pastoralists</strong> and they were not leading a settled life.</li>
</ul>
</li>
<li>&#8226; <strong>Position of the king was like a tribal chieftain</strong> known as the <strong>'Janasyagopa'</strong> (head of people).
<ul>
<li style="padding-left:2em">&#9702; His post was created mainly to lead the tribe in wars or conflicts.</li>
<li style="padding-left:2em">&#9702; King was not hereditary and often elected.</li>
<li style="padding-left:2em">&#9702; The concept of divine kingship had not formed yet. Only King Purukutsa has been called the Ardha deva (half-god) in the Rig Veda.</li>
</ul>
</li>
<li>&#8226; As the economy was not producing sufficient surplus (as the main occupation was animal domestication and agriculture was only secondary), the <strong>taxation system was not fully established.</strong>
<ul>
<li style="padding-left:2em">&#9702; War booty was the main source of royal income, in which the king had a larger share.</li>
<li style="padding-left:2em">&#9702; Apart from that, we have references of a single tax 'Bali'. But, it was not a regular tax, rather, it was a voluntary tax (tribute).</li>
</ul>
</li>
<li>&#8226; There were <strong>no professional armies.</strong>
<ul>
<li style="padding-left:2em">&#9702; So, the king used to commission his own tribesmen (Jana) at the time of war.</li>
</ul>
</li>
<li>&#8226; Similarly, a <strong>regular bureaucracy had not come into existence yet.</strong>
<ul>
<li style="padding-left:2em">&#9702; However, in the Rig-Veda, we have references of certain officers like 'Senani' (commander), 'Vajrapati' (head of pasture), 'Gramini' (head of village), 'Vispati' (head of Vis), 'Purap' (head of fort) etc.</li>
</ul>
</li>
<li>&#8226; There were certain tribal organisations like <strong>'Sabha', Samiti', 'Vidhatha' and 'Gana'</strong> which balanced the royal power. These organisations had different functions e.g.
<ul>
<li style="padding-left:2em">&#9702; 'Sabha' was an assembly of the elders associated with judicial work.</li>
<li style="padding-left:2em">&#9702; 'Samiti' was an organisation of all the men and sometimes it was associated with the election of the king.</li>
<li style="padding-left:2em">&#9702; 'Vidhatha' was an organisation associated with military decisions.</li>
<li style="padding-left:2em">&#9702; 'Gana' was some sort of a republican organisation.</li>
<li style="padding-left:2em">&#9702; It seems that the Vidhatha was the oldest organisation from which Sabha and Samiti had evolved for specific purposes.
<ul>
<li style="padding-left:4em">&#9632; Kings showed an eagerness to win the support of the latter two bodies.</li>
</ul>
</li>
</ul>
</li>
<li>&#8226; The lowest unit of administrative organisation was the <strong>'Kula' or family.</strong>
<ul>
<li style="padding-left:2em">&#9702; Above 'Kula' there was the 'Grama', above the 'Grama' there was the 'Vis' and above the 'Vis' there was the 'Jana'.</li>
<li style="padding-left:2em">&#9702; The 'Jana' was the highest unit of administration.</li>
<li style="padding-left:2em">&#9702; In the Rig-Veda, the term 'Jana' has been used frequently but there is no use of the term 'Janapada'.</li>
<li style="padding-left:2em">&#9702; Clearly, legitimacy for the political structures - kingship, assemblies, administration, taxation system, militia etc. - came from tight groups of ethnically/linguistically homogeneous people, rather than from some kind of territory, which may be inhabited by heterogeneous groups.</li>
</ul>
</li>
</ul>

<h2>Social Structure</h2>

<ul>
<li>&#8226; <strong>It was a tribal society.</strong>
<ul>
<li style="padding-left:2em">&#9702; Although social divisions had started during this period, they were still in a nascent phase.</li>
<li style="padding-left:2em">&#9702; The society was more or less egalitarian.</li>
<li style="padding-left:2em">&#9702; The Rigveda informs us about the three Varnas - priests, warriors and vis (people).
<ul>
<li style="padding-left:4em">&#9632; But the basis of this Varna division was the respective occupations.</li>
<li style="padding-left:4em">&#9632; One could change his/her Varna by changing one's occupation.</li>
<li style="padding-left:4em">&#9632; The fourth category, the 'shudras', appeared towards the end of Rig Vedic period, as it is mentioned for the first time in the Purusha Sukta (hymn) in the tenth book (mandala) of the Rig Veda.</li>
</ul>
</li>
</ul>
</li>
<li>&#8226; <strong>The condition of women was comparatively better.</strong>
<ul>
<li style="padding-left:2em">&#9702; Although in a tribal set up dominated by persistent warfare, the birth of a warrior 'son' was wished and prayed for; but the birth of a female child was not discouraged.</li>
<li style="padding-left:2em">&#9702; Girls were married at the age of 16/17 years.</li>
<li style="padding-left:2em">&#9702; They were afforded education.</li>
<li style="padding-left:2em">&#9702; They could participate in a sacrifice with their husband.</li>
<li style="padding-left:2em">&#9702; They could participate in the proceedings of 'Sabha' and 'Vidhatha' as well.</li>
<li style="padding-left:2em">&#9702; Sometimes, they participated in war as well.</li>
</ul>
</li>
<li>&#8226; The Pater Familias (head of the family) controlled other members of the family.
<ul>
<li style="padding-left:2em">&#9702; He enjoyed a privileged position in the family but normally he was kind and compassionate to other members.</li>
<li style="padding-left:2em">&#9702; The story of Bhujyu is an exception, where Bhujyu blinded his son as a cruel punishment.</li>
</ul>
</li>
</ul>

<h2>Religious Structure</h2>

<ul>
<li>&#8226; The <strong>deification (worship) of nature</strong> was one of the features of Rigvedic religion.
<ul>
<li style="padding-left:2em">&#9702; The forces of nature - rain, thunderstorms, sun, vegetation, rivers, fire etc. - were a mystery to them.</li>
<li style="padding-left:2em">&#9702; They could not scientifically explain these phenomena with the laws of nature. So, they simply deified them and gave them humans attributes like anger, kindness, empathy etc.</li>
<li style="padding-left:2em">&#9702; In order to gain the favour of these natural elements like rainfall, they worshipped them and made offerings to them.</li>
</ul>
</li>
<li>&#8226; In the Rigvedic religion, there was a <strong>dominance of male gods.</strong>
<ul>
<li style="padding-left:2em">&#9702; Among the Rigvedic gods, Indra, Agni and Varuna were the superior gods.</li>
<li style="padding-left:2em">&#9702; Although some goddesses like Usha, Nisha, Aditi, Ratri etc. have also been mentioned in the Rigveda, they were in subordinate positions.</li>
<li style="padding-left:2em">&#9702; In the life of Rigvedic Aryans, war was a regular feature so <strong>Indra</strong> was the most important god.
<ul>
<li style="padding-left:4em">&#9632; He was the god of war.</li>
<li style="padding-left:4em">&#9632; Roughly 250 hymns are devoted to him in the Rig Veda.</li>
<li style="padding-left:4em">&#9632; He is called the 'Purandar', breaker of the forts.</li>
<li style="padding-left:4em">&#9632; He is also considered the 'rain god' and is invoked with many other names.</li>
</ul>
</li>
<li style="padding-left:2em">&#9702; Agni was the second most important god (200 hymns in the Rig Veda) as Agni was used not simply for cooking food but also for clearing forests.
<ul>
<li style="padding-left:4em">&#9632; He was the god of sacrifices. Agni is the priest of the Gods and the god of the priests as he is the personification of the sacrificial altar.</li>
<li style="padding-left:4em">&#9632; Terrestrial fire, atmospheric lightning and celestial sun, all three are associated with him.</li>
<li style="padding-left:4em">&#9632; The fire cult is also popular in the Iranian Zoroastrianism.</li>
</ul>
</li>
<li style="padding-left:2em">&#9702; Varuna was also an important god. He was the personification of water.
<ul>
<li style="padding-left:4em">&#9632; The unique thing about him was that he was the protector of the cosmic order (Rta).</li>
<li style="padding-left:4em">&#9632; So, he was called the 'Rtasyagopa'.</li>
<li style="padding-left:4em">&#9632; In one sense, the concept of 'Rita' was the highest spiritual flight taken by the Rigvedic Aryans.</li>
</ul>
</li>
</ul>
</li>
<li>&#8226; The Rigvedic religion was <strong>polytheistic</strong>. From polytheism, it moved gradually to <strong>'Kathenotheism'</strong>. Later, it reflected some elements of <strong>monotheism</strong> as well.
<ul>
<li style="padding-left:2em">&#9702; e.g. in a hymn dedicated to Agni, the Rigveda says 'Is Agni one or more than one..... More in one or one in more'. Thus, it hints towards the unity of gods.</li>
<li style="padding-left:2em">&#9702; In the first mandala (book) of Rig Veda, which perhaps belongs to the later Vedic period, a hymn proclaims that "ekam sad vipra bahudha vadanti", meaning, there is only one truth, but, learned men/seers call it by different names.</li>
<li style="padding-left:2em">&#9702; (The term "Kathenotheism' was coined by Max Muller, especially in reference to the Rig Vedic Religion. It means that each deity is treated as supreme in turn, whenever he/she is invoked. It is closely related to the word 'henotheism' (worshipping one god while not rejecting the existence of others))</li>
</ul>
</li>
<li>&#8226; Rigvedic religion had a <strong>materialistic and mundane</strong> (concerned with the worldly matters and not the afterlife) approach to life.
<ul>
<li style="padding-left:2em">&#9702; They were praying to the Gods for material happiness, praja (children) and pashu (cattle, wealth etc.).</li>
<li style="padding-left:2em">&#9702; They were not seeking salvation or 'nirvana'.</li>
</ul>
</li>
<li>&#8226; During the Rigvedic times there were mainly two modes of worship - <strong>prayers and sacrifice</strong>.
<ul>
<li style="padding-left:2em">&#9702; But chanting mantras publically and slaughtering animals on a large scale had not become part of sacrifice.</li>
<li style="padding-left:2em">&#9702; So, the Rigvedic religion was simple and not ritualistic.</li>
</ul>
</li>
</ul>

<h1>Later Vedic Period (1000 BCE - 500 BCE)</h1>

<h2>Economic Structure</h2>

<ul>
<li>&#8226; <strong>Agriculture</strong> became the mainstay of the economy.
<ul>
<li style="padding-left:2em">&#9702; We can underline the growing importance of agriculture during this period on the basis of the story of king Janaka who ploughed the field himself.</li>
<li style="padding-left:2em">&#9702; It amply shows that even high born people didn't hesitate to be associated with cultivation.</li>
<li style="padding-left:2em">&#9702; During this period, the increased importance of agriculture among the Aryan people was perhaps on account of the further Aryan expansion into the Ganga basin and their intense interactions with the later Harappan chalcolithic cultures which had also progressed - technically and economically - during the 2nd millennium BCE.</li>
<li style="padding-left:2em">&#9702; On account of these interactions, many non-Aryan words entered into the later Vedic language.</li>
</ul>
</li>
<li>&#8226; From the later Vedic literature, we came to know about the <strong>different varieties of crops</strong>.
<ul>
<li style="padding-left:2em">&#9702; For example, apart from the 'Yava', 'Godhum' (wheat) and 'Vrihi' (rice) are also mentioned.</li>
<li style="padding-left:2em">&#9702; Different types of pulses were also being produced.</li>
</ul>
</li>
<li>&#8226; There was a larger scope for production surplus which led to the <strong>proliferation of crafts</strong> and further <strong>craft specialization</strong>.
<ul>
<li style="padding-left:2em">&#9702; The 'Vajsaneyi Samhita' mentions a number of crafts.</li>
</ul>
</li>
<li>&#8226; Apart from gold, copper and bronze, even <strong>iron and silver</strong> came into use during this period.
<ul>
<li style="padding-left:2em">&#9702; For example, Shyam Ayas/Krishna Ayas (iron), Rajat (silver) are mentioned in the later Vedic texts.</li>
<li style="padding-left:2em">&#9702; But, we should not forget that iron was used mainly for making weapons and not agricultural tools during this period.</li>
<li style="padding-left:2em">&#9702; This is inferred on the basis of the relative abundance of the various iron objects detected from the archeological excavations.</li>
</ul>
</li>
<li>&#8226; Comparatively, the <strong>intensity of trade improved</strong> but it didn't play any significant role in the economy.</li>
<li>&#8226; <strong>Money economy had not developed yet.</strong>
<ul>
<li style="padding-left:2em">&#9702; Later Vedic literature mentions 'Krishnala', along with 'Nishka' and 'Shatmana'.</li>
<li style="padding-left:2em">&#9702; But, it was not a regular coin.</li>
</ul>
</li>
<li>&#8226; A later Vedic text, 'Taitreya Aranyaka', has used the term <strong>nagar</strong> (town) but later Vedic economy <strong>had not reached the stage of Urbanisation</strong>.
<ul>
<li style="padding-left:2em">&#9702; It is only in the 'Buddha age' that the economy could reach the stage of Urbanisation which is known as the Second Urbanisation.</li>
</ul>
</li>
</ul>

<h2>Political Structure</h2>

<ul>
<li>&#8226; The tribal structure had started to disintegrate and a 'people based' state was gradually replaced by a <strong>'territory based' entity.</strong>
<ul>
<li style="padding-left:2em">&#9702; Aryan people had started to lead a largely settled life.</li>
<li style="padding-left:2em">&#9702; 'Janas' gradually transformed into 'Janpads'.</li>
<li style="padding-left:2em">&#9702; The word 'Rashtra' first appears in this period.</li>
</ul>
</li>
<li>&#8226; By this period, the <strong>power and position of the king was enhanced.</strong>
<ul>
<li style="padding-left:2em">&#9702; He began to enjoy high sounding royal titles like 'Sarvajanin', 'Sarvabhumipati' and 'Ekrat'.</li>
<li style="padding-left:2em">&#9702; Above all, even some rituals like 'Ashvamedha', 'Vajpeya' and 'Rajsuya' etc. were deeply attached to the institution of kingship.</li>
<li style="padding-left:2em">&#9702; This reflects his increased stature.</li>
</ul>
</li>
<li>&#8226; Although, even during this period, the <strong>taxation system was not fully established</strong>, it <strong>certainly improved</strong> due to the fact that there was a larger scope for the production surplus.
<ul>
<li style="padding-left:2em">&#9702; During this period, 'Bali' became a regular tax.</li>
<li style="padding-left:2em">&#9702; Part from that, 'Bhaga' i.e. 1/16 of land production and 'Shulka' (tolls) emerged as new taxes.</li>
</ul>
</li>
<li>&#8226; The <strong>number of officers increased.</strong>
<ul>
<li style="padding-left:2em">&#9702; E.g. from a later Vedic text 'Shatapatha Brahmana', we come to know about a group of officers, called 12 Ratnins.</li>
<li style="padding-left:2em">&#9702; But even during this period professional bureaucracy did not come into existence.</li>
<li style="padding-left:2em">&#9702; Even standing armies were not established during this period.</li>
</ul>
</li>
<li>&#8226; The <strong>tribal organisations began to crumble</strong> e.g. 'Vidhatha' and 'Gana' vanished, while 'Sabha' and 'Samiti' lost their relevance.
<ul>
<li style="padding-left:2em">&#9702; It was due to the fact that the tribal institutions were not compatible with the expanding state power.</li>
<li style="padding-left:2em">&#9702; A state with an ever increasing population base needs a hands-on political authority like a King.</li>
</ul>
</li>
<li>&#8226; <strong>'Kula' remained the lowest unit of administration,</strong> then came the 'Grama', the 'Vis' and the 'Jana'.
<ul>
<li style="padding-left:2em">&#9702; Now, <strong>'Janapada'</strong> became the highest unit of administration.</li>
<li style="padding-left:2em">&#9702; It was clearly a territory based political structure and it could expand or contract according to the political fortune of the ruling group.</li>
</ul>
</li>
</ul>

<h2>Social Structure</h2>

<ul>
<li>&#8226; The <strong>four fold Varna system</strong> came into existence. In fact the tribal structure started to crumble and there emerged a Varna divided society.
<ul>
<li style="padding-left:2em">&#9702; Four Varnas consisted of Brahmana, Kshatriya, Vaishya and Shura, in the descending order of ritualistic privilege.</li>
<li style="padding-left:2em">&#9702; The social mobility of the earlier age was disrupted to a certain extent during this period.</li>
</ul>
</li>
<li>&#8226; There was a <strong>relative decline in the condition of women.</strong>
<ul>
<li style="padding-left:2em">&#9702; The 'Aitareya Brahmana' gives hints that the birth of a female child was discouraged.</li>
<li style="padding-left:2em">&#9702; Women were now prohibited from taking part in the proceedings of Sabha.</li>
</ul>
</li>
<li>&#8226; The <strong>power and position of the Kulpati (head of the family) increased further.</strong>
<ul>
<li style="padding-left:2em">&#9702; Now, he had the right to expel other members from the family e.g. Vishvamitra expelled his 50 sons from his family.</li>
</ul>
</li>
<li>&#8226; The concept of <strong>'Gotra'</strong> developed during this period.
<ul>
<li style="padding-left:2em">&#9702; The term 'Gotra' had originated from the term 'Gostha' which meant a 'Cow pen'.</li>
<li style="padding-left:2em">&#9702; In other words, those members whose cows were tied together at a common place were associated with a common 'Gotra'.</li>
<li style="padding-left:2em">&#9702; Originally, Gotra's were decided on the basis of the names of seven important sages. In this way, Gotras were owned by the Brahmas first, and the Brahmas offered their Gotra's to Kshatriya and Vaishya patrons also.</li>
</ul>
</li>
<li>&#8226; The concept of <strong>'Ashram'</strong> originated during this period.
<ul>
<li style="padding-left:2em">&#9702; Currently, there are four ashrams i.e. Brahmacharya, Grihastha, Vanaprastha and Sanyasa.</li>
<li style="padding-left:2em">&#9702; But, during this period only three ashrams had evolved, the fourth one i.e. 'Sanyasa' was added later.</li>
<li style="padding-left:2em">&#9702; There were two objectives behind the ashram system.
<ul>
<li style="padding-left:4em">&#9632; First, as a payback for three types of debts/obligations (Pitra Rin - Debt to the parents/ancestors; Brahma/Dev Rin - debt to the creator, Guru Rin - Debt to the teacher).</li>
<li style="padding-left:4em">&#9632; Second, so as to realise four Purusharthas ie. Dharma, Artha, Kama and Moksha.</li>
</ul>
</li>
<li style="padding-left:2em">&#9702; But another subtle objective of the ashrama system was to achieve a synthesis between individual freedom and social control.</li>
</ul>
</li>
</ul>

<h2>Religious Structure</h2>

<ul>
<li>&#8226; <strong>Deification of nature continued</strong> to be the dominant feature of religion even during this period.</li>
<li>&#8226; With changing socio-economic conditions, the nature, types and <strong>relative importance of gods also changed.</strong>
<ul>
<li style="padding-left:2em">&#9702; During this period, Aryans had started to lead a settled life and even their priorities in life had changed. So, we can see changes in the position of gods as well.</li>
<li style="padding-left:2em">&#9702; Prajapati, Vishnu and Rudra (creator, preserver and destroyer) emerged as important gods during this period.</li>
<li style="padding-left:2em">&#9702; Some goddess are also mentioned but they were firmly subordinated to the male gods e.g. Agney and Indrani were associated with Agni and Indra respectively.</li>
</ul>
</li>
<li>&#8226; The religion was <strong>polytheistic but gradually it was moving in the direction of monotheism.</strong>
<ul>
<li style="padding-left:2em">&#9702; The 'Aranyakas' worked as a bridge between the Vedas and the Upanishads.</li>
<li style="padding-left:2em">&#9702; The 'Aranyakas' emphasised 'Tapas' (meditation) in place of the sacrifices.</li>
<li style="padding-left:2em">&#9702; Finally, the Upanishadic philosophy directly promoted monotheism as it emphasised the relation between the 'Brahma' and the soul.</li>
</ul>
</li>
<li>&#8226; The objective of later Vedic religion was <strong>material happiness</strong>. It was only at the end of the later Vedic period that the Upanishads appeared and they presented the pursuit of <strong>salvation</strong> as an ultimate goal.</li>
<li>&#8226; Now, <strong>religion had become very ritualistic.</strong>
<ul>
<li style="padding-left:2em">&#9702; Chanting mantras and slaughtering animals had become an essential part of the sacrifice cult.</li>
<li style="padding-left:2em">&#9702; The Brahmins consciously advocated in the favour of sacrifice.
<ul>
<li style="padding-left:4em">&#9632; They theorised that the world was created from the sacrifice of Brahma (primordial man) in a cosmic yagna. The Purush Sukta in the 10th book of Rig Veda belongs to this period.</li>
<li style="padding-left:4em">&#9632; It also says that the four fold Varna division was an outcome of this sacrifice.</li>
<li style="padding-left:4em">&#9632; Even Prajapati was born out of this sacrifice.</li>
</ul>
</li>
<li style="padding-left:2em">&#9702; They also emphasised that the correct pronunciation of mantras is a crucial part of the sacrifice.
<ul>
<li style="padding-left:4em">&#9632; As Brahmas studied Vedas and performed sacrifice, thus along with sacrifice their importance also increased.</li>
</ul>
</li>
</ul>
</li>
</ul>

<h2>Vedic Philosophy</h2>

<p>The Vedic <strong>literature reflects the deep contemplation and curiosity of the Aryans.</strong> It represents the earliest philosophy of ancient India.</p>

<ul>
<li>&#8226; We find elements of <strong>monotheism</strong> in the Rigveda where it is said that 'truth is one but the sages have given it different names'.
<ul>
<li style="padding-left:4em">&#9632; In the same way, it is asked 'Is Agni one or more than one?.....' These facts represent monotheistic thinking.</li>
</ul>
<ul>
<li style="padding-left:2em">&#9702; We also find that the Rig Veda lays stress on a <strong>'self-creating'</strong> process of the universe.
<ul>
<li style="padding-left:4em">&#9632; According to Upanishads, Brahma didn't simply create the universe, rather, <strong>he himself is the universe.</strong></li>
<li style="padding-left:4em">&#9632; E.g. it is indicated in the 'Purush Sukta' that, along with the four Varnas, gods like Chandra, Surya, Indra and Agni also evolved from the sacrifice of the primaeval man.</li>
</ul>
</li>
</ul>
</li>
<li>&#8226; In the Vedic texts, there is a strong undercurrent of <strong>non-dualism</strong> as well. In fact, The <strong>Advaita</strong> philosophy propounded first by the Upanishads became the core element of Indian philosophy.
<ul>
<li style="padding-left:2em">&#9702; There is a <strong>strong relation between the soul and the Brahma.</strong></li>
<li style="padding-left:2em">&#9702; Whatever differences appear between the two are due to the ignorance or lack of knowledge.</li>
<li style="padding-left:2em">&#9702; The relation between brahma and soul is further clarified in the 'Chandogya Upanishad'. The concept of <strong>'Aham Brahmasmi - tat tvam asi'</strong> (I am Brahma - thou art that) is found in the Chandogya Upanishad.</li>
</ul>
</li>
<li>&#8226; The concept of <strong>transmigration of soul</strong> from one life to the other (rebirth) can be clearly seen for the first time in the 'Brihadaranyaka Upanishad'.
<ul>
<li style="padding-left:2em">&#9702; When we observe rationally, we find that the concepts of rebirth and transmigration of soul from one life to the other suited the Varna divided society of the later Vedic period.</li>
<li style="padding-left:2em">&#9702; It legitimised the contemporary social division.</li>
</ul>
</li>
<li>&#8226; The Vedic religion was <strong>naturalistic</strong> but it had an element of <strong>scepticism</strong> since the beginning.
<ul>
<li style="padding-left:2em">&#9702; For example, a Rig Vedic Sukta asks 'where is Indra? Actually, he does not exist'.</li>
</ul>
</li>
<li>&#8226; Similarly, it also had a strong basis in <strong>rationalism</strong> and <strong>anti-ritualism.</strong>
<ul>
<li style="padding-left:2em">&#9702; During the <strong>later Vedic period</strong>, the relevance of prayers continued but more <strong>emphasis was laid on rituals, sacrifice and Yajnas.</strong>
<ul>
<li style="padding-left:4em">&#9632; But soon <strong>Aranyakas</strong> emphasised a sense of <strong>alienation from ritualism.</strong></li>
<li style="padding-left:4em">&#9632; It stressed more on intellectual exercises (thinking, reflecting and meditating).</li>
<li style="padding-left:4em">&#9632; Although, it didn't reject sacrifice and ritual, but it ignored them.</li>
</ul>
</li>
<li style="padding-left:2em">&#9702; Later, we can trace the evolution of <strong>Vedic philosophy in the Upanishads.</strong>
<ul>
<li style="padding-left:4em">&#9632; They <strong>reject rituals</strong> and stress on the unity of 'Brahma' and soul.</li>
<li style="padding-left:4em">&#9632; The Upanishadic philosophy reflects the purest form of monotheism which emerged as the concept of Advaita (non-dualism) of Shankaracharya later.</li>
</ul>
</li>
</ul>
</li>
</ul>

<h2>Significance of Vedic Age</h2>

<ul>
<li>&#8226; The Vedic age has directly contributed to the <strong>evolution of social structure and cultural aspects</strong> of Northern India.
<ul>
<li style="padding-left:2em">&#9702; The Vedic culture expanded even towards the Southern and Eastern parts of the Indian subcontinent.</li>
<li style="padding-left:2em">&#9702; So in that sense, it contributed to the evolution of Indian society.</li>
</ul>
</li>
<li>&#8226; <strong>The Vedic Aryans seemed to be more flexible in their approach to life.</strong>
<ul>
<li style="padding-left:2em">&#9702; It was this flexibility that helped them to broaden their area of political influence.</li>
<li style="padding-left:2em">&#9702; They not only fought the indigenous tribes, they also slowly assimilated with them.
<ul>
<li style="padding-left:4em">&#9632; For example, the Vedic Aryans were basically cattle breeders, but they adopted agriculture as a result of this contact as they expanded further towards the Ganga-doab region.</li>
<li style="padding-left:4em">&#9632; With the help of better arms and chariots, they won over their enemies.</li>
</ul>
</li>
<li style="padding-left:2em">&#9702; They even effectively coped with the forces of nature and environment.</li>
</ul>
</li>
<li>&#8226; The study of Vedic literature shows that the Aryans were <strong>optimistic and progressive</strong> in their approach.
<ul>
<li style="padding-left:2em">&#9702; This aspect can be seen in their ability to leave their home regions in the west and move towards the east, and in the process, adopt new traits which would suit their migration.</li>
<li style="padding-left:2em">&#9702; They sang the 'songs of joy' in life and never talked about death (except that of their enemies).</li>
<li style="padding-left:2em">&#9702; It was mainly due to this kind of approach, coupled with their ability to assimilate new cultural traits, that the Vedic Aryans were able to expand their area of influence from the northwest to the entire north India within a period of 1000 years.</li>
</ul>
</li>
<li>&#8226; The <strong>fundamentals of the political, social and cultural institutions of India derive their roots from the Vedic culture.</strong>
<ul>
<li style="padding-left:2em">&#9702; For example monarchy and bureaucracy in the political field, and Varna and Caste structures in the social field have been influenced by the Vedic civilization.</li>
</ul>
</li>
<li>&#8226; The <strong>basic tenets of social equality were present</strong> in the Vedic Society as the social division during the Early Vedic age was based on occupation and not on birth.
<ul>
<li style="padding-left:2em">&#9702; Even though the Vedic society was a patriarchal society, the condition of women was much better compared to the latter ages.</li>
<li style="padding-left:2em">&#9702; Due to this reason, many modern reformers of the 19th century had accepted the Vedic age as an ideal model for society.</li>
</ul>
</li>
<li>&#8226; Their <strong>dietary habits and way of life affected Indian society</strong> to a great extent.
<ul>
<li style="padding-left:2em">&#9702; For example, prior to the arrival of Vedic Aryans, the cattle breeding activity was mainly for obtaining meat.</li>
<li style="padding-left:2em">&#9702; But, Vedic Aryans practised cattle breeding mainly for milk and other milk products, this practice continues till date.</li>
</ul>
</li>
<li>&#8226; In the religious field, the <strong>'materialistic' approach</strong> of the Aryans was reflected in their ways of worship.
<ul>
<li style="padding-left:2em">&#9702; Their main objective was to gain material happiness rather than obtaining salvation.</li>
<li style="padding-left:2em">&#9702; Indian religious reformers in the 19th century were attracted to this aspect of Vedic age.</li>
</ul>
</li>
<li>&#8226; The Vedic philosophy's main contribution was to the <strong>development of monism of Shankaracharya.</strong>
<ul>
<li style="padding-left:2em">&#9702; He laid stress on the relationship between the Brahman and the soul in his Advaita.</li>
<li style="padding-left:2em">&#9702; In due course, this doctrine became an inspiration for further developments in Indian philosophy up to Vivekananda and his modern day disciples of Vedantism.</li>
</ul>
</li>
<li>&#8226; Vedic scriptures talk about the <strong>development of science and literature.</strong>
<ul>
<li style="padding-left:2em">&#9702; In Rigveda, the hymns dedicated to goddess Usha reflect a higher poetic tradition.</li>
<li style="padding-left:2em">&#9702; Similarly, in the Rig Veda, we hear about the presence of physicians.</li>
<li style="padding-left:2em">&#9702; The Atharva Veda is an important text on medicine.</li>
</ul>
</li>
</ul>"""

new_content = content.replace(
    "'aryans-vedic-period': ``",
    f"'aryans-vedic-period': `{html}`"
)

if new_content == content:
    print("ERROR: Slug not found or already has content.")
else:
    with open('lib/noteContent.ts', 'w') as f:
        f.write(new_content)
    print("Done! Injected: aryans-vedic-period")
