import re

with open('lib/noteContent.ts', encoding='utf-8') as f:
    content = f.read()

new_html = """<h2>Gupta period (c. 300 CE to 600 CE)</h2>
<h2>The Rise of Guptas</h2>
<ul>
<li>&#8226; The historiography of Gupta Dynasty becomes clear from the time of <strong>Chandra Gupta I (c. 319-335 CE)</strong>.</li>
<li>&#8226; Earlier Gupta might have been <strong>feudatories of Kushanas</strong>.</li>
<li>&#8226; But, <strong>Chandra Gupta I became the 1st sovereign king</strong> as he was the first to take the title of <strong>'Maharajadhiraja'</strong>.</li>
<li>&#8226; Possibly, Guptas acquired some essential <strong>military technologies from Kushanas</strong> which became an important factor in their success.</li>
<li>&#8226; Unlike earlier periods, this time the initiative for empire building was taken in the <strong>upper Gangetic basin</strong>.</li>
<li>&#8226; In other words, the Guptas started their kingdom from <strong>Prayag (Allahabad)</strong>.</li>
</ul>
<h2>Role of matrimonial relations in foundation and consolidation of Gupta Empire</h2>
<p>Matrimonial relations played the same role in foundation and consolidation of Gupta Empire as it had played in the case of Magadhan kings earlier.</p>
<ul>
<li>&#8226; Chandra Gupta I was the first one to adopt this method to consolidate his position in the middle Gangetic basin.
<ul>
<li style="padding-left:2em">&#9702; He married a Lichchhavi princess <strong>Kumara Devi</strong>.</li>
<li style="padding-left:2em">&#9702; That this relation was important for him, can be surmised from the fact that he engraved the name of <strong>'Kumara Devi'</strong> on his coins.</li>
<li style="padding-left:2em">&#9702; Later even his son, Samudra Gupta preferred to call himself <strong>'Lichchhavi-dauhitra'</strong> (son of the daughter of Lichchavi).</li>
<li style="padding-left:2em">&#9702; It may be inferred that <strong>Lichchavi state was a powerful state</strong> in North India during this time.</li>
<li style="padding-left:2em">&#9702; So, matrimonial relations with Lichchavi might have strengthened the position of Guptas.</li>
</ul>
</li>
<li>&#8226; Samudra Gupta also tried to strengthen his position through matrimonial relations.
<ul>
<li style="padding-left:2em">&#9702; In the course of his victory march, he converted the various defeated kings into his feudatories.</li>
<li style="padding-left:2em">&#9702; He presented the proposal of <strong>'Kanyopanya'</strong> (offering a daughter to the sovereign king) as a condition to his feudatories.</li>
<li style="padding-left:2em">&#9702; In fact, in the feudal set up of those days, matrimonial relations were possibly the best guarantee against the treacherous behaviour of feudal lords.</li>
</ul>
</li>
<li>&#8226; Matrimonial relationship was vital in the diplomatic scheme of <strong>Chandra Gupta II</strong> too, the successor of Samudragupta.
<ul>
<li style="padding-left:2em">&#9702; He married off his daughter <strong>Prabhavati Gupta</strong> to a Vakataka king <strong>Rudrasen II</strong>.</li>
<li style="padding-left:2em">&#9702; With the support of Vakatakas, he defeated Shaka king of Gujarat area and consolidated his control over central India also.</li>
<li style="padding-left:2em">&#9702; Further, he himself married a <strong>Naga princess</strong> which might have consolidated his position in North India.</li>
</ul>
</li>
</ul>
<h2>Parakramah (brave) Samudra Gupta: Is it a reality or myth that Samudra Gupta was a great conqueror and empire builder?</h2>
<p>A court scholar of Samudra Gupta, <strong>Harisena</strong> has given an elaborate account of the great conquest of Samudra Gupta.</p>
<ul>
<li>&#8226; According to his account, he conquered different parts of India in several stages.
<ul>
<li style="padding-left:2em">&#9702; In <strong>1st stage</strong>, he defeated and uprooted <strong>9 states in Gangetic basin</strong> including Vidisha, Ahichchhatra and Champavati.</li>
<li style="padding-left:2em">&#9702; During the <strong>2nd stage</strong>, he conquered some republics in Punjab and some bordering states.</li>
<li style="padding-left:2em">&#9702; In the <strong>3rd stage</strong>, he defeated <strong>'Aatvika'</strong> or forest states.</li>
<li style="padding-left:2em">&#9702; In the <strong>4th stage</strong>, he defeated and conquered <strong>12 states in the Deccan</strong>.</li>
<li style="padding-left:2em">&#9702; In the <strong>5 stage</strong>, he defeated some foreign states in the North-West region including Shakas, Murundas and Devaputra Shahanshahi.</li>
</ul>
</li>
<li>&#8226; But Samudra Gupta did not bring all the region under his direct control, rather, he had <strong>direct control only over Gangetic basin and nearby regions</strong>.
<ul>
<li style="padding-left:2em">&#9702; The area of conquest was divided into 3 Zones
<ul>
<li style="padding-left:4em">&#9632; <strong>Graham</strong>: Directly Ruled Regions</li>
<li style="padding-left:4em">&#9632; <strong>Anugraha</strong>: Under Indirect Rule of Feudatories</li>
<li style="padding-left:4em">&#9632; <strong>Moksha</strong>: Defeated Rulers were Restored and Freed</li>
</ul>
</li>
<li style="padding-left:2em">&#9702; Samudra Gupta, according to Harisena, presented some conditions before the feudatories and defeated kings.
<ul>
<li style="padding-left:4em">&#9632; <strong>'Atmanivedan'</strong> (seeking of grace)</li>
<li style="padding-left:4em">&#9632; <strong>'Kanyopanya'</strong> (offering of a daughter)</li>
<li style="padding-left:4em">&#9632; <strong>'Garudamandaka'</strong> (to receive the royal emblem as a sub-ordinate ruler).</li>
</ul>
</li>
</ul>
</li>
<li>&#8226; Surprisingly, Samudra Gupta engraved the account of his military conquests on the same <strong>Allahabad pillar</strong>, on which earlier a peace loving king Ashoka had engraved his message of 'Dhamma'.
<ul>
<li style="padding-left:2em">&#9702; What could be the reason behind this move?
<ul>
<li style="padding-left:4em">&#9632; Either, he was trying to highlight some link of Guptas with Mauryas or he might have been showing a reaction against the policy of peace of Ashoka.</li>
</ul>
</li>
</ul>
</li>
<li>&#8226; But we can't ignore the fact that we are solely dependent on a single account for the knowledge of the military success of Samudra Gupta i.e. <strong>Allahabad inscription</strong>.
<ul>
<li style="padding-left:2em">&#9702; As a court scholar, neutrality of Harisena is doubtful. Therefore, the question arises whether the account is more of a myth than a reality?</li>
</ul>
</li>
<li>&#8226; We can't say so.
<ul>
<li style="padding-left:2em">&#9702; Although, there may be some exaggeration in the description of Harisena, for example Harisena projects Sri Lanka as a tribute paying state.</li>
<li style="padding-left:2em">&#9702; But, as a source material, it still has relevance. Information from the <strong>Prayag Prashasti</strong> can be cross-verified in various ways.
<ul>
<li style="padding-left:4em">&#9632; First, by a critical reading of the account.</li>
<li style="padding-left:4em">&#9632; Second, some of the information given by Harisena has been corroborated by some other evidences like Vakataka inscriptions as well as the text like <strong>'Raghuvansam'</strong> of Kalidasa.</li>
</ul>
</li>
<li style="padding-left:2em">&#9702; That's why, we can take the account of Harisena <strong>more as a reality than a myth</strong>.</li>
</ul>
</li>
</ul>
<h2>Chandra Gupta 'Vikramaditya': (A conqueror with a rare passion for Art &amp; Literature)</h2>
<p>It is said that Chandra Gupta Vikramaditya' combined the military prowess of his father with the diplomatic acumen of his grandfather in his own personality.</p>
<ul>
<li>&#8226; He strengthened his position through a matrimonial relation with Vakataks and <strong>conquered Gujarat region after defeating Shakas</strong>.</li>
<li>&#8226; The conquest of Gujarat might have encouraged the <strong>economic &amp; commercial activities</strong> within the empire.</li>
<li>&#8226; Likewise, the inscription engraved on the <strong>iron pillar at Mehrauli in Delhi</strong> gives us information about the conquest of a king <strong>'Chandra'</strong>.</li>
<li>&#8226; Chandra has been identified with Chandra Gupta 'Vikramaditya'.</li>
<li>&#8226; In this inscription, he has been credited for conquering <strong>Banga region (Bengal)</strong> and <strong>Bahlik region (Indus)</strong>.</li>
<li>&#8226; In this way, Chandra Gupta 'Vikramaditya' continued the conquest march started by his father Samudra Gupta.</li>
</ul>
<p>Simultaneously, Chandra Gupta Vikramaditya was a cultured personality as well.</p>
<ul>
<li>&#8226; He maintained a policy of <strong>religious tolerance</strong> in his empire.</li>
<li>&#8226; Apart from that, he patronised a large number of scholars, popularly known as <strong>'Navaratnas'</strong> (nine jewels/luminaries).</li>
<li>&#8226; <strong>Kalidasa &amp; Vishakadatta</strong> composed their masterpieces during his period.</li>
<li>&#8226; Likewise, <strong>Amar Singh</strong>, another court scholar, wrote the famous <strong>Amarakosha</strong> (a lexicon).</li>
<li>&#8226; It was during his period that his military commander built the famous <strong>'Boar temple' (Varaha temple) at Udayagiri</strong>.</li>
</ul>
<h2>Features of the Administrative Structure</h2>
<p>1. <strong>Increasing decentralisation</strong> was one of the significant features of the Gupta administration.</p>
<ul>
<li>&#8226; This phenomenon of decentralisation should be viewed in context of the changing socio-economic condition of the time.</li>
<li>&#8226; Due to the emerging feudalism and the phenomenon of land grants, decentralisation tendencies were encouraging and the state was gradually shedding off much of its responsibilities.</li>
</ul>
<p>2. While the Mauryan kings preferred to take the titles like 'Devanampiya' and 'Raja', Gupta kings took higher titles like <strong>'Maharajadhiraja', 'Paramesvara', 'Parambhattaraka'</strong> etc. on their coins and inscriptions.</p>
<ul>
<li>&#8226; But, these pompous titles don't prove at all that the Gupta kings gained in power, rather, it seems that they took these titles to differentiate themselves from the subordinate kings and intermediaries under them.</li>
</ul>
<p>3. Kings continued to profess the <strong>divine right of kingship</strong>.</p>
<ul>
<li>&#8226; Divinity was attached to royalty. E.g. Samudragupta compared himself with gods like <strong>Indra, Varuna, Yama and Kuber</strong> (four of the Digpals i.e. the 10 gods who are the guardians of 10 directions, according to the Purana tradition).</li>
</ul>
<p>4. During the Gupta period, the <strong>number of officers decreased in central administration</strong> in comparison to the Mauryan period.</p>
<ul>
<li>&#8226; Allahabad Prashasti mentions a council of ministers, <strong>Sabha</strong>. It had officers like:
<ul>
<li style="padding-left:2em">&#9702; <strong>Mahamatya</strong> (Prime Minister)</li>
<li style="padding-left:2em">&#9702; <strong>Sandhivigrahaka</strong> (external affairs minister/ minister of war and peace)</li>
<li style="padding-left:2em">&#9702; <strong>Maha Dandanayaka</strong> (Police Superintendent)</li>
<li style="padding-left:2em">&#9702; <strong>Mahabaladhikrita</strong> (military commander)</li>
<li style="padding-left:2em">&#9702; <strong>Mahapratihara</strong> (guard of the palace)</li>
</ul>
</li>
<li>&#8226; But, the post of these officers became <strong>hereditary</strong> and one person started to occupy more than one office.
<ul>
<li style="padding-left:2em">&#9702; For example, Harisena was holding the posts of Mahamatya, Maha Dandanayaka and Sandhivigrahaka simultaneously.</li>
<li style="padding-left:2em">&#9702; Harisena's father was also a Mahadandnayaka.</li>
<li style="padding-left:2em">&#9702; Udayagiri inscription describes <strong>Virasena</strong>, the Sandhivigrahaka of Chandragupta II, was also a poet.</li>
<li style="padding-left:2em">&#9702; The Karamdanda inscription of Kumaragupta mentions two generations of <strong>Mantri-Kumaramatyas</strong> who served two generations of Kings.</li>
</ul>
</li>
<li>&#8226; This possibly means that these ministers were <strong>more than simple bureaucrats</strong>.</li>
</ul>
<p>5. Under Guptas, the empire was divided into provinces <strong>(Bhuktis)</strong>. But, the element of supervision on the provincial administration definitely declined during this period.</p>
<ul>
<li>&#8226; The head of a Bhukti was known as <strong>Uparika or Uparika Maharaja</strong>.</li>
<li>&#8226; The Uparikas were enjoying more power than the Kumaras under Mauryas.</li>
<li>&#8226; In at least three copper plate inscriptions found from Damodarpur, the Uparika has the titles like Maharaja, indicating the importance of this office.</li>
</ul>
<p>6. However, this structure was <strong>not uniform</strong>.</p>
<ul>
<li>&#8226; Such variations may have happened because of the overlap between the developing feudalism during the Gupta period and the administrative apparatus of the Gupta kings.
<ul>
<li style="padding-left:2em">&#9702; The <strong>Eran pillar inscription of Budhagupta</strong> refers to Maharaja Surashmichandra as a Lokpal governing the land between Kalindi and Narmada rivers.</li>
<li style="padding-left:2em">&#9702; Also, <strong>Skandagupta's Junagadh inscription</strong> mentions that he commissioned the Goptri (governor) of the Saurashtra province to repair the Sudarshan Lake which had been damaged by torrential rains.
<ul>
<li style="padding-left:4em">&#9632; This Goptri, in turn, appointed his son to govern the city where the inscription was put up.</li>
</ul>
</li>
</ul>
</li>
</ul>
<p>7. In district <strong>(Vishay)</strong> administration, we come to know about the officers like <strong>Vishayapati or Kumaramatyas</strong>.</p>
<ul>
<li>&#8226; During this period, the centre did not have a strong supervision on the district administration as was the case during Mauryan period.
<ul>
<li style="padding-left:2em">&#9702; For example, district officers like Vishayapati or Kumaramatyas were being appointed by provincial officers, Uparikas, in most of the cases.</li>
<li style="padding-left:2em">&#9702; One of the Damodarpur (Dinajpur, Bangladesh) mentions that <strong>Chittradatta</strong>, the Uparika of Pundravardhan Bhukti, appointed Kumaramatya Vetravarman as the head of the district council (Adhishthana Adhikarana) of Kotivarsha Vishaya.</li>
</ul>
</li>
<li>&#8226; The designation <strong>'Kumaramatya'</strong> also occurs on six seals found from Vaishali and the designation <strong>'Amatyas'</strong> occurs on some Bhita seals.</li>
</ul>
<p>8. One important feature of the Gupta administration was the <strong>representation of the local elements in the district administration</strong>.</p>
<ul>
<li>&#8226; For example, at the level of district, we come to know about a local council <strong>'Adhisthana Adhikarana'</strong> which comprised of five members:
<ul>
<li style="padding-left:2em">&#9702; <strong>Vishayapati</strong> (possibly the head of the council),</li>
<li style="padding-left:2em">&#9702; <strong>Nagarasreshesthi</strong> (chief banker/merchant),</li>
<li style="padding-left:2em">&#9702; <strong>Sarthavaha</strong> (chief of the caravan traders),</li>
<li style="padding-left:2em">&#9702; <strong>Prathamakulika</strong> (chief craftsman)</li>
<li style="padding-left:2em">&#9702; <strong>Prathama Kayastha</strong> (chief of the scribes)</li>
</ul>
</li>
<li>&#8226; It was a district council in which local elements were given representation. The district officer had to work in association with this town council.</li>
</ul>
<p>9. Likewise, an administrative unit consisted of a group of villages below the district/ Vishay level, called <strong>Vithi</strong>.</p>
<ul>
<li>&#8226; Here, the officer was <strong>Vithi Mahattara/ Ayukta</strong>.</li>
<li>&#8226; At this level as well, there was a local council named as <strong>Vithi Parishad or Ashtakula-Adhikarana</strong> (a board of eight members).</li>
<li>&#8226; In this council, <strong>Kutumbins</strong> (cultivators) and <strong>Mahattaras</strong> (head of villages) were given representation.</li>
</ul>
<p>10. Even in town administration, we come to know about the town council <strong>Adhisthana-Adhikaran</strong>.</p>
<ul>
<li>&#8226; This council consisted of members like Vishayapati, <strong>Nagar-Shresthi</strong> (head of the finance), <strong>Sarthavaha</strong> (head of merchants), the <strong>Pratham Kulika</strong> (representative of artisans) and the <strong>Pratham Kayastha</strong> (representative of scribes / clerks).</li>
<li>&#8226; When we compare the town administration under the Mauryan period and the Gupta period, we find out that Megasthenes talked about the town committees.
<ul>
<li style="padding-left:2em">&#9702; But, these committees were different from the councils under Guptas as these committees were appointed from above.</li>
</ul>
</li>
</ul>
<p>11. Under the Guptas, the <strong>lowest unit of administration was the village</strong>.</p>
<ul>
<li>&#8226; During this period, one important development was the <strong>growing power of the village administration, caste institutions and the guilds</strong>.</li>
<li>&#8226; They played a significant role in the administration.</li>
<li>&#8226; The Sanchi inscription of the time of Chandragupta II mentions a <strong>'Pancha Mandali'</strong> which may have been a village corporate body.</li>
</ul>
<p>12. The Vakataka inscriptions indicate that the Vakataka kingdom was divided into <strong>Rashtra/Rajya</strong> which in turn were divided into <strong>Vishaya</strong> and the Vishaya were subdivided into <strong>aharas/bhogas</strong> etc.</p>
<ul>
<li>&#8226; The <strong>Rajukas</strong>, the revenue assessment officers of the Mauryan times, were now the writers of the land grant charters, according to the <strong>Indore plates of Pravarasena II</strong>.</li>
<li>&#8226; The inscriptions of the feudatories of Vakatakas refer to some additional administrative posts.</li>
</ul>
<h2>Economy</h2>
<ul>
<li>&#8226; The picture of economic life during the Gupta age was a <strong>mixed</strong> one.
<ul>
<li style="padding-left:2em">&#9702; <strong>Agriculture</strong> continued to develop throughout this period</li>
<li style="padding-left:2em">&#9702; However, the <strong>urban economy</strong> was characterised by the element of <strong>continuity and change.</strong>
<ul>
<li style="padding-left:4em">&#9632; During the first half of the Gupta age, the process of urban growth continued without any restriction.</li>
<li style="padding-left:4em">&#9632; But around the mid-fifth century CE, the urban economy entered a phase of decline.</li>
<li style="padding-left:4em">&#9632; These changes were the outcome of both <strong>internal as well as external forces.</strong></li>
</ul>
</li>
</ul>
</li>
</ul>
<h3>Agrarian Economy</h3>
<p>During the Gupta period, the agrarian economy grew due to the following <strong>reasons</strong>.</p>
<p>1. Due to the <strong>land grants</strong>, cultivation extended into new regions.</p>
<ul>
<li>&#8226; Generally, the grants during Gupta period were given in bordering regions and a substantial part of these grants included uncultivated land.
<ul>
<li style="padding-left:2em">&#9702; So, grantees were supposed to develop these uncultivated lands with the help of Shudra peasants.</li>
</ul>
</li>
<li>&#8226; During this period, the <strong>importance of agriculture definitely increased</strong> in the overall economy.
<ul>
<li style="padding-left:2em">&#9702; This phenomenon is approved by the text <strong>Amarakosha</strong> which mentions 12 different types of land.</li>
<li style="padding-left:2em">&#9702; Apart from that, the growing importance of agriculture can be implied even on the basis of the <strong>growing number of taxes</strong> associated with agriculture.</li>
</ul>
</li>
</ul>
<p>2. Furthermore, efforts were made for the <strong>development of irrigation</strong>.</p>
<ul>
<li>&#8226; During the reign of Skandagupta, his officials <strong>Parnadatta and Chakrapalit</strong> got the <strong>Sudarshana Lake repaired</strong>.</li>
<li>&#8226; Likewise, from Harshcharita of Banabhatta, we come to know about the <strong>Ghatiyantra</strong>.</li>
<li>&#8226; The Brihat Samhita and Amarakosha throw light on the scientific methods of irrigation.</li>
</ul>
<p>3. The Brihat Samhita and Amarakosha also talk about the <strong>different types of plants- wild and agrarian varieties of crops.</strong></p>
<ul>
<li>&#8226; Even <strong>horticulture</strong> was encouraged possibly due to the development in the technique of <strong>grafting</strong>.
<ul>
<li style="padding-left:2em">&#9702; Grafting two varieties of fruits has been mentioned in the 'Brihat Samhita'.</li>
</ul>
</li>
</ul>
<p>4. <strong>But</strong> during this period, <strong>feudal relationships</strong> emerged in the agrarian structure due to the phenomena of land grants.</p>
<ul>
<li>&#8226; The <strong>traditional rights of peasants were adversely affected</strong> due to the introduction of a large number of <strong>intermediaries</strong> into the agrarian structure.
<ul>
<li style="padding-left:2em">&#9702; For example, Amarkosha talks about the different layers of landed class such as <strong>Mahipati, Kshetraswami</strong> and peasants.</li>
</ul>
</li>
<li>&#8226; Furthermore, during this period <strong>forced labour/ bonded labour</strong> became more common.
<ul>
<li style="padding-left:2em">&#9702; One can find the first epigraphical evidence of forced labour in Junagadh inscription of Rudradaman.</li>
<li style="padding-left:2em">&#9702; Contemporary Gupta inscriptions primarily from the Malwa region also mention that the recipients of land grants had the right to extract forced labour i.e. <strong>'Vishti/ Vrishti'</strong>.</li>
<li style="padding-left:2em">&#9702; Vatsayana's <strong>Kama Sutra and Skanda Purana</strong> also hint towards the use of forced labour and begar respectively.</li>
</ul>
</li>
</ul>
<p>The agrarian structure involves the social, economic and technical factors that affect the productivity of farmers, the distribution of the farm income and the social hierarchy of the rural population.<br>
The agrarian structure also includes the process of land management and land tenure system.</p>
<h3>Urban Economy</h3>
<h3>300 CE &#8211; 450 CE</h3>
<ul>
<li>&#8226; The economy of India reached its <strong>peak</strong> during this age and remarkable progress was witnessed in every sector of the economy.</li>
<li>&#8226; <strong>Contemporary sources</strong> like the works of Kalidas, Vishakhadatta, Shudraka, Kamandaka the 'Kama Sutra' of Vatsyayana, hint towards a prosperous urban life.
<ul>
<li style="padding-left:2em">&#9702; Even <strong>Fa-Hein</strong>, who visited India during the 4th century CE, talks about the prosperity of Pataliputra and Madhya Desha.</li>
</ul>
</li>
</ul>
<h3>Craft Production</h3>
<p>During this period, the development of handicraft industries continued to <strong>flourish</strong>. <strong>Literary texts</strong> of this period give reference to the production of different kinds of goods.</p>
<ul>
<li>&#8226; Craftsmanship associated with <strong>pottery, furniture and domestic utensils</strong> continued and it played a significant role in the internal trade.</li>
<li>&#8226; In <strong>textile</strong> production, cotton goods, silk goods and woollen goods occupied an important place.
<ul>
<li style="padding-left:2em">&#9702; The <strong>Amarakosha</strong> gives reference to the production of cotton goods.</li>
<li style="padding-left:2em">&#9702; Even in the <strong>paintings of Ajanta</strong>, we find glimpses of superb quality clothes.</li>
<li style="padding-left:2em">&#9702; <strong>Benaras, Mathura and Kamrup</strong> etc. were the important centres for the textile production.</li>
<li style="padding-left:2em">&#9702; From <strong>Mandasore</strong>, we get inscription based reference to the guild of silk weavers.</li>
</ul>
</li>
<li>&#8226; The production of <strong>gems and jewellery</strong> became important.
<ul>
<li style="padding-left:2em">&#9702; The Brihat Samhita mentions different types of gems and jewelries.</li>
</ul>
</li>
<li>&#8226; Likewise, during this period, <strong>metallurgy</strong> was at a developed stage.
<ul>
<li style="padding-left:2em">&#9702; As an example, we can take the iron pillar of Chandragupta Vikramaditya at Mehrauli and Gupta gold coins.</li>
</ul>
</li>
<li>&#8226; During this period, even <strong>leather based crafts</strong> developed further.</li>
</ul>
<h3>Trade</h3>
<p>Apart from the internal trade, even <strong>external trade</strong> was in a developed position during this period.</p>
<ul>
<li>&#8226; The Gupta Empire maintained trade relationships with the <strong>Western world</strong>.
<ul>
<li style="padding-left:2em">&#9702; For example, its trading partners in the West were Persia, Arabia and Eastern Roman Empire etc.</li>
</ul>
</li>
<li>&#8226; Likewise other trading partners were <strong>China, Burma and South-East Asia</strong>.</li>
</ul>
<h3>Factors for the growth of trade</h3>
<ul>
<li>&#8226; <strong>Political unification</strong> under the strong centralised administration of the Guptas acted as a catalyst for economic growth.
<ul>
<li style="padding-left:2em">&#9702; When Chandragupta <strong>Vikramaditya conquered Gujarat</strong>, it further encouraged trade &amp; commerce, because the Guptas came to control the most important port of western coast, Bharuch.</li>
</ul>
</li>
<li>&#8226; The growth of India's overseas trade was also facilitated by the advancement of <strong>ship building</strong>.
<ul>
<li style="padding-left:2em">&#9702; Contemporary sources inform us that the largest ships in the world, capable of carrying 500 people, were manufactured in India.</li>
</ul>
</li>
<li>&#8226; During this period, the merchants and artisans were organised into <strong>corporations and guilds.</strong>
<ul>
<li style="padding-left:2em">&#9702; Guilds maintained their own laws, seals and flags and were recognized by the state.</li>
<li style="padding-left:2em">&#9702; They also played an important role in administration.</li>
</ul>
</li>
</ul>
<h3>Items of Export and Import</h3>
<ul>
<li>&#8226; The most important item for import was <strong>horses</strong>.</li>
<li>&#8226; India's <strong>external trade was highly favourable</strong> towards India.
<ul>
<li style="padding-left:2em">&#9702; Large quantities of luxury items such as <strong>silk, pepper, ivory and sandalwood</strong> were sent to the Roman Empire.</li>
<li style="padding-left:2em">&#9702; These exports were balanced by the influx of horses and bullion making India a sink of precious metals.
<ul>
<li style="padding-left:4em">&#9632; During the reign of <strong>Marcus Aurelius</strong> (161-190 CE), silk was worth its weight in gold.</li>
<li style="padding-left:4em">&#9632; When <strong>Alaric I</strong>, the king of the Visigoths, laid siege to Rome in 408 CE, he demanded a ransom of <strong>4000 rolls of silk and 3000 pounds of black pepper</strong>.</li>
</ul>
</li>
</ul>
</li>
</ul>
<h3>Money Economy</h3>
<ul>
<li>&#8226; The <strong>level of monetisation was exceptionally high</strong>.
<ul>
<li style="padding-left:2em">&#9702; In fact the Guptas issued the <strong>largest number of gold coins</strong> in the entire history of ancient India.</li>
<li style="padding-left:2em">&#9702; <strong>Chandra Gupta II</strong> issued silver coins for the 1st time during this period after the conquest of Gujarat (Shakas).</li>
</ul>
</li>
<li>&#8226; However, the <strong>debasement of currency</strong> was also visible especially during the Later Gupta Age.</li>
<li>&#8226; It appears that higher denomination coins were more frequently used compared to lower denomination coins during this period.
<ul>
<li style="padding-left:2em">&#9702; But, they were used mainly for sale/purchase of land and to make payment in higher value transactions.</li>
<li style="padding-left:2em">&#9702; This may suggest the presence of <strong>feudal tendencies</strong> in the economy even during this period.</li>
</ul>
</li>
</ul>
<h3>450 &#8211; 750 CE</h3>
<p>1. The process of urban economic <strong>decline</strong> characterised by falling trade, crafts production, monetisation and feudalisation, set in by the middle of the fifth century CE.</p>
<ul>
<li>&#8226; This period witnessed a considerable <strong>debasement of currency.</strong>
<ul>
<li style="padding-left:2em">&#9702; Further, the use of copper coins was also becoming more and more limited.</li>
<li style="padding-left:2em">&#9702; Also, we have evidence that the common people were using cowries' (shells) as a medium of exchange.</li>
<li style="padding-left:2em">&#9702; This suggests a rising economic <strong>crisis</strong> and resulting <strong>demonetisation</strong>.</li>
</ul>
</li>
</ul>
<p>2. This was brought about by a combination of internal and external <strong>factors</strong>.</p>
<ul>
<li>&#8226; The emergence of the <strong>Hunas</strong>, a warlike group from Central Asia, and their incursion into India affected trade.
<ul>
<li style="padding-left:2em">&#9702; Their presence in north-western part of the Indian subcontinent <strong>disrupted India's overland external trade.</strong></li>
<li style="padding-left:2em">&#9702; They <strong>began invading India</strong> roughly around the last years of the reign of Kumaragupta I. This further destabilised the economy.</li>
</ul>
</li>
<li>&#8226; The <strong>decline of the Roman Empire</strong> towards the end of the 5th century CE gave a big shock to India's external trade and overall economy.
<ul>
<li style="padding-left:2em">&#9702; Rome was a big consumer of Indian luxury goods and India's trade with Rome was a major component of material prosperity.</li>
</ul>
</li>
<li>&#8226; The urban economic crisis deepened with the <strong>disintegration of the Gupta empire</strong> in the middle of the sixth century CE. Central authority disappeared completely and north India became fragmented into a number of regional principalities.
<ul>
<li style="padding-left:2em">&#9702; The lack of political unity and uniform administration obstructed internal trade and commerce.</li>
<li style="padding-left:2em">&#9702; The frequent warfare among these regional kingdoms further suppressed commerce.</li>
</ul>
</li>
<li>&#8226; The beginning of <strong>sericulture</strong> (production of silk) in the western world around 600 CE greatly reduced the demand of Indian silk. This gave another blow to India's overseas trade.</li>
<li>&#8226; The beginning of the <strong>Sino-Tibetan conflict</strong> (700 CE) adversely affected India's trade with China.</li>
<li>&#8226; The decline in trade and commerce <strong>adversely affected industries</strong> and crafts production because the demand for manufactured goods reduced significantly.</li>
</ul>
<p>3. With the decline of economic prosperity, <strong>urban growth could not be maintained</strong> in the second half of Gupta Age.</p>
<ul>
<li>&#8226; But here, the decline of urbanisation <strong>does not mean a complete disruption of urban tradition.</strong>
<ul>
<li style="padding-left:2em">&#9702; After all, the texts written during this period are full of flowery accounts of city life.</li>
<li style="padding-left:2em">&#9702; According to the importance given to the urban milieu in the Tamil epics, urbanisation remained a continuous process in the Tamilkam from the post-Mauryan period onwards.</li>
</ul>
</li>
</ul>
<h3>Impact of Economic decline</h3>
<ul>
<li>&#8226; The decline of secondary economic activities <strong>increased the economic significance of agriculture.</strong></li>
<li>&#8226; The <strong>ruralisation of the Indian economy</strong> took place as a result of deindustrialisation.</li>
<li>&#8226; Deindustrialisation also resulted in <strong>de-urbanisation</strong>.
<ul>
<li style="padding-left:2em">&#9702; Cities such as Ahhichatra and Kaushambi were abandoned during the seventh century CE.</li>
</ul>
</li>
<li>&#8226; The decline of the money economy resulted in the expansion of the system of land grants, giving way to the emergence of <strong>closed self-sufficient estates village economies.</strong></li>
<li>&#8226; <strong>Social rigidity</strong> increased enormously and a strong feudal outlook began to dominate the society.</li>
<li>&#8226; With the decline of trade, the <strong>social status of Vaishyas decreased</strong>. On the other hand, with the increasing importance of agriculture, the condition of shudras relatively improved.</li>
<li>&#8226; The <strong>society became inward looking and insulated</strong>. Contact with the outside world was deliberately discouraged by the use of religion and caste rules.</li>
</ul>
<h2>Society</h2>
<p>The Gupta society was based on a <strong>complex structure</strong>.<br>
A number of <strong>factors</strong> contributed to the growing complexity in the Gupta society, viz.</p>
<ul>
<li>&#8226; Brahmanic revivalism</li>
<li>&#8226; Assimilation of tribal elements in society</li>
<li>&#8226; Growth in the regional economy</li>
</ul>
<p>This complexity is best reflected in the institutions of <strong>Varna and Caste</strong>.</p>
<h3>Varna and Caste</h3>
<p>1. According to the <strong>Brahmanical scheme</strong> of social structure, society was divided into four Varnas-Brahmana, Kshatriya, Vaishya and Shudras.</p>
<ul>
<li>&#8226; Each Varna was supposed to perform the set of <strong>duties</strong> prescribed to it and enjoy the <strong>rights</strong> conferred on it.</li>
<li>&#8226; The <strong>state</strong> was expected to preserve this supposedly divinely ordained social order.
<ul>
<li style="padding-left:2em">&#9702; This meant that even when a small state emerged in some corner of the country, the King of that state was expected to recognize this ideal social order.</li>
</ul>
</li>
</ul>
<p>2. The Brahmanas came to exert <strong>considerable influence on the kings from the Gupta period.</strong></p>
<ul>
<li>&#8226; This is quite clear from the way they received <strong>land grants</strong> from the kings and their feudatories.
<ul>
<li style="padding-left:2em">&#9702; The kings, officials and other feudatories gave land not only to the individual Brahmanas, but also <strong>incentivised bigger groups of Brahmanas to settle in remote areas.</strong></li>
<li style="padding-left:2em">&#9702; Thus, the number of Brahmana settlements (variously called <strong>Brahmadeyas, Agraharas</strong> and so on) started increasing.</li>
</ul>
</li>
<li>&#8226; These Brahmanas <strong>started spreading, inter alia, the idea of a Varna divided social order</strong> into hitherto untouched areas.</li>
</ul>
<p>3. However, this four-fold Varna division was an <strong>ideal</strong> order</p>
<ul>
<li>&#8226; Due to the spread of agriculture, there were many social groups/ tribal groups/ occupational <strong>groups whose Varna identity could never be determined</strong>.</li>
<li>&#8226; Secondly, it was <strong>assumed that the Varnas would perform their duties</strong>.
<ul>
<li style="padding-left:2em">&#9702; In reality, they may not have always done so.</li>
</ul>
</li>
</ul>
<p>3. The <strong>real society was different</strong> from this ideal society and this was <strong>recognized by the writers of the Dharmashastras.</strong></p>
<ul>
<li>&#8226; Therefore, they tried to <strong>fix the status</strong> of various caste groups (Jatis) in the social order <strong>by giving fictitious explanations of their origins</strong>.
<ul>
<li style="padding-left:2em">&#9702; They theorised that <strong>various Jatis were actually varna-samkaras</strong> or the product of intermarriages between various Varnas.
<ul>
<li style="padding-left:4em">&#9632; The various foreign ruling families of the pre-Gupta period, Greek, Scythians etc. were given a semi-Kshatriya status <strong>(Vratya-Kshatriya)</strong>, because they could not be considered of a pure Kshatriya origin.</li>
<li style="padding-left:4em">&#9632; Similarly fictitious origin stories were weaved for the tribal groups who came to be absorbed into the Brahmanical society.</li>
</ul>
</li>
</ul>
</li>
<li>&#8226; Local cults, deities, rituals etc. were linked with the Brahmanical religion via the concept of reincarnation (<strong>avatars</strong>) of the prominent deities like Shiva, Vishnu and Shakti etc.</li>
<li>&#8226; The Dharmashastras also speak of <strong>apadharma</strong> (conduct to be followed during periods of distress).
<ul>
<li style="padding-left:2em">&#9702; This means that the <strong>Varnas could take up the professions and duties not usually assigned to them</strong> in extraordinary situations.</li>
<li style="padding-left:2em">&#9702; However, the agency of occupational mobility was available only to the upper Varnas.</li>
</ul>
</li>
</ul>
<p>4. These <strong>changes of course originated much before the Gupta period</strong>, as the Brahmanical revival had started with the beginning of the Puranic traditions itself.</p>
<ul>
<li>&#8226; But, with the <strong>spread of the Brahmanas to different parts</strong> of India during the Gupta period, the social structure became very complex.</li>
<li>&#8226; The new society had to absorb many social groups.</li>
<li>&#8226; Thus, the actual social structure came to vary from region to region.</li>
</ul>
<p><strong>At the same time certain ideas were common:</strong></p>
<p>1. The <strong>Brahmans</strong> came to be recognized as the purest and therefore, the <strong>highest</strong> Varna.</p>
<ul>
<li>&#8226; Since they were associated with Sanskrit learning and performed priestly functions, they easily connected with royal power.
<ul>
<li style="padding-left:2em">&#9702; Even when the rulers were supportive of Buddhism, Jainism or any particular religious sect, they continued to patronise Brahmanas, particularly the learned ones.</li>
</ul>
</li>
<li>&#8226; This remained one of the major reasons for the economic prosperity and prestige of the Brahmanas.</li>
</ul>
<p>2. Ideally there were four Varnas, but there were various groups who were kept out of this scheme. These were the antyjas (<strong>untouchables</strong>). We can underline the <strong>growing number of untouchables</strong> and their declining condition.</p>
<ul>
<li>&#8226; <strong>Katyayana</strong> was the first Smritikara (Smriti writer) who used the term 'untouchable'.</li>
<li>&#8226; Furthermore, we find <strong>10 different terms for untouchables</strong> in Amarakosha.</li>
<li>&#8226; <strong>Fa-Hein</strong> also mentions their deplorable condition.
<ul>
<li style="padding-left:2em">&#9702; It means the number of untouchables increased during this period.</li>
<li style="padding-left:2em">&#9702; Not simply that even the social condition of untouchables became worse.</li>
</ul>
</li>
</ul>
<p>3. The transformation of a large number of craft groups into the caste groups resulted in the <strong>proliferation of castes</strong>.</p>
<ul>
<li>&#8226; Those associated with production activities were relegated to a lower status.</li>
<li>&#8226; However, those castes which were associated with the agrarian structure enjoyed a higher social status.</li>
</ul>
<p>4. The <strong>relative decline in the position of Vaishyas and a relative improvement in the position of Shudras</strong> was an important feature in the Gupta society.</p>
<ul>
<li>&#8226; For example, Yajnavalkya accepted Shudras as cultivators.
<ul>
<li style="padding-left:2em">&#9702; Furthermore, he declared that in place of pronouncing 'Omkaras', the term 'Namah' could be used.</li>
<li style="padding-left:2em">&#9702; By using this term, even Shudras could perform Pancha Mahayajna.</li>
</ul>
</li>
<li>&#8226; Likewise, a decline in the social position of Vaishyas took place due to some reasons.
<ul>
<li style="padding-left:2em">&#9702; There was decline in trade and commerce during the last phase of the Gupta period.</li>
</ul>
</li>
</ul>
<p>5. During this period, there was a <strong>relative decline in the social condition of women</strong>.</p>
<ul>
<li>&#8226; During this period, <strong>old restrictions were becoming more severe</strong> and <strong>new restrictions</strong> were being added.</li>
<li>&#8226; Right from the period of Manu Smriti, <strong>widow remarriage</strong> was getting increasingly restricted and <strong>early marriage</strong> for girls was becoming the norm.</li>
<li>&#8226; Although Yajnavalkya prescribed the right to <strong>property</strong> to women, some other Smritikaras like Narad and Brihaspati opposed it.</li>
<li>&#8226; Likewise, we find evidence of the <strong>Devadasi</strong> system during this period.
<ul>
<li style="padding-left:2em">&#9702; Kalidasa mentions in his text Meghadutam that the Devadasis were working in the Mahakala temple at Ujjain.</li>
</ul>
</li>
<li>&#8226; Furthermore, in his text 'Abhigyan Shakuntalam', Kalidasa gives a hint towards the faint beginning of the <strong>Purdah</strong> system when he uses the term <strong>Abgunthan</strong>.
<ul>
<li style="padding-left:2em">&#9702; It means that the high born women were supposed to cover their faces at public places.</li>
</ul>
</li>
<li>&#8226; Above all, it was during this period that we find the first epigraphic evidence of the <strong>Sati</strong> system (Eran inscription, c. 510 CE).</li>
<li>&#8226; So, quite opposed to the ideal picture and exalted position of women in contemporary literature, the actual social position of women only declined.
<ul>
<li style="padding-left:2em">&#9702; Their <strong>perpetual tutelage was argued forcefully.</strong></li>
</ul>
</li>
<li>&#8226; The social philosophy demanding a complete subjection of women to men was a <strong>natural development in a patriarchal set up which was based on the notions of private property.</strong></li>
</ul>
<p>5. During the Gupta period, <strong>Slavery system declined.</strong></p>
<ul>
<li>&#8226; Although Narad talks about 15 types of slaves, the slavery system was weakened as Narad performed rituals for the liberation of slaves.</li>
<li>&#8226; In fact, by this period, the slavery system <strong>lost its earlier economic importance</strong> as a result of the development of forced/ unpaid labour known as 'Vishti' or 'Begar'.
<ul>
<li style="padding-left:2em">&#9702; The growth in the unpaid labour might be due to the fact that peasantry was tied to the land in the land grants.</li>
</ul>
</li>
</ul>
<h2>Religion</h2>
<p>The religious landscape of the Gupta period was marked by complexity. In fact, a number of factors contributed to this complexity:</p>
<ul>
<li>&#8226; 1- Brahmanic (sacrifices cult) revivalism</li>
<li>&#8226; 2- Assimilation of tribal elements into the mainstream socio-religious current</li>
<li>&#8226; 3- Growing feudalization etc.</li>
</ul>
<h3>Features</h3>
<p><strong>1. Brahmanic Revivalism:</strong></p>
<ul>
<li>&#8226; As a result of this, the cult of sacrifice was revived.</li>
<li>&#8226; Inscriptions amply demonstrate that the Gupta kings and other regional kings performed sacrifices.</li>
</ul>
<p><strong>2. Bhaktism:</strong></p>
<ul>
<li>&#8226; Bhaktism emerged as a result of assimilation between the Aryan and Non-Aryan elements.</li>
<li>&#8226; Bhaktism influenced almost all the contemporary sects.
<ul>
<li style="padding-left:2em">&#9702; For example, the Mahayana sect appeared under Buddhism and Jainism adopted idol worship.</li>
<li style="padding-left:2em">&#9702; Likewise, under Brahmanism, Vaishnavism and Shaivism emerged.</li>
</ul>
</li>
<li>&#8226; In one sense, Bhaktism corresponded with the feudal structure in society.
<ul>
<li style="padding-left:2em">&#9702; For example, as is the case in Bhaktism, where the devotees were supposed to totally surrender to an individual God, similarly in the feudal structure, peasants were supposed to totally surrender to their lords.</li>
</ul>
</li>
</ul>
<p><strong>3. The Theory of Reincarnation, Idol Worship &amp; Temple Cult:</strong></p>
<ul>
<li>&#8226; Through the theory of reincarnation, assimilation between Aryan and Non-Aryan Gods became possible.
<ul>
<li style="padding-left:2em">&#9702; For example, both Aryan and Non-Aryan Gods were included among the 10 reincarnation of Lord Vishnu.</li>
</ul>
</li>
<li>&#8226; Likewise, idols were placed in temples and temple cults started during this period. Later, it became the main feature of Hinduism.</li>
<li>&#8226; The concept of <strong>trinity of gods</strong> developed during the Gupta period.</li>
</ul>
<p><strong>4. Tantrism:</strong></p>
<ul>
<li>&#8226; During this period, we can underline the faint beginning of Tantrism.</li>
<li>&#8226; Tantrism is not a separate sect, rather, it emerged as a common element of different sects possibly on account of assimilation between Aryan and tribal elements.</li>
<li>&#8226; Some common Tantrism features include
<ul>
<li style="padding-left:2em">&#9702; The importance attached to <strong>energy, tantric rituals, yogic/ meditative practices, sexual rites and terrifying deities.</strong></li>
<li style="padding-left:2em">&#9702; <strong>Goddesses</strong> were associated with male Gods as spouses and a concept was being developed that, in order to activate male gods, their association with goddesses was essential.</li>
</ul>
</li>
<li>&#8226; Tantrism manifested itself in the form of
<ul>
<li style="padding-left:2em">&#9702; Kapalika, Kalamukha and Natha sub-sects within Shaivism</li>
<li style="padding-left:2em">&#9702; Pancharatra developed as a Tantric cult with Vaishnavism.</li>
<li style="padding-left:2em">&#9702; Shaktism developed as a tantric cult.</li>
<li style="padding-left:2em">&#9702; Likewise, Vajrayana sub-sect (the cult of thunderbolt) appeared under Buddhism</li>
<li style="padding-left:2em">&#9702; Even Jainism adopted worship of Yaksha and Yakshini.</li>
</ul>
</li>
<li>&#8226; The early medieval period saw further development of Tantric elements.</li>
</ul>
<p><strong>5. The Development of Concept of the cyclic view of the world:</strong></p>
<ul>
<li>&#8226; According to this view, the Kalpa was divided into Manavantras, Manavantras into Mahayugas and Mahayugas into Yugas such as <strong>Satyuga, Kaliyuga, Dwapar and Treta</strong>.</li>
</ul>
<p><strong>6. Development of 6 Materialistic Philosophies:</strong></p>
<ul>
<li>&#8226; During the ancient period, there were a number of ideas, ideologies and schools.</li>
<li>&#8226; By the Gupta period, these were crystallised into six schools of materialistic philosophy. These were <strong>"Sankhya, Yoga, Nyaya, Vaisheshika, Mimansa and Vedanta"</strong>.</li>
</ul>
<h2>Literature</h2>
<h3>Secular Literature</h3>
<p>The Gupta period witnessed intense activities in the literary field. After centuries of evolution and lavish royal patronage during the Gupta period, <strong>Sanskrit literature reached a level of classical excellence.</strong></p>
<ul>
<li>&#8226; Among the known Sanskrit poets of the period, <strong>Kalidasa</strong> is the greatest. He lived in the court of Chandragupta II.
<ul>
<li style="padding-left:2em">&#9702; The <strong>Meghadutam</strong>, a lyrical poem of little over a hundred graceful stanzas, contains the message from the Yaksha to his wife across the northern mountains.</li>
<li style="padding-left:2em">&#9702; The <strong>Rituasamhara</strong> describes the six seasons in relation to how the lovers react to the changing landscape with changing seasons. The poems of Kalidasa remain unequalled in their metrical perfection.</li>
<li style="padding-left:2em">&#9702; The <strong>Raghuvansam</strong> speaks of the all-round victories of Rama, which may indirectly refer to some Gupta conquests.</li>
<li style="padding-left:2em">&#9702; The <strong>Kumarasambhava</strong> deals with the courtship of Shiva and Parvati and the birth of their son Skanda.</li>
<li style="padding-left:2em">&#9702; His most famous work, the play <strong>Abhijnanashakuntalam</strong> is based on the story of the union and separation of the king Dushyant with Shakuntala. It remains to be the highest achievement of early Indian literature and stagecraft (drama).</li>
</ul>
</li>
<li>&#8226; Several <strong>other dramatists</strong> flourished during the Gupta Age.</li>
<li>&#8226; <strong>Shudraka</strong>, often supposed to be of royal lineage, wrote the <strong>Mrichchhakatika</strong>.
<ul>
<li style="padding-left:2em">&#9702; Its plot centres on the love of a poor Brahmana trader Charudatta for the wealthy, beautiful, accomplished and cultured courtesan Vsantesena.</li>
</ul>
</li>
<li>&#8226; <strong>Vishakadatta</strong> is the author of the <strong>Mudrarakshasha</strong>, which deals with schemes of the shrewd Chanakya.
<ul>
<li style="padding-left:2em">&#9702; The <strong>Devichandraguptam</strong>, another drama written by him, has survived only in fragments.</li>
</ul>
</li>
<li>&#8226; The <strong>Sanskrit language</strong> was also enriched by the development of grammar and lexicography.
<ul>
<li style="padding-left:2em">&#9702; The <strong>Amarakosha</strong> compiled by Amarasimha, has remained to be an indispensable lexicon till modern times.</li>
</ul>
</li>
<li>&#8226; Sanskrit literature was <strong>mainly enjoyed by the upper classes</strong> and aristocracy.
<ul>
<li style="padding-left:2em">&#9702; The uneducated masses could have hardly understood, much less appreciated, the ornate court literature.</li>
<li style="padding-left:2em">&#9702; Not surprisingly, the leading male characters of high social status speak polished Sanskrit and those of the lower status and women speak Prakrit in these plays.</li>
</ul>
</li>
</ul>
<h3>Religious Literature</h3>
<p>The Gupta period also saw a spurt in the production of religious literature.</p>
<ul>
<li>&#8226; This is clear from the fact that some of the most important of the eighteen <strong>Puranas</strong> (the <strong>Markandey, Brahmanda, Vishnu, Bhagavata and Matsya</strong>) were finally compiled during this period.
<ul>
<li style="padding-left:2em">&#9702; These Puranas were <strong>originally composed by the bards</strong>.</li>
<li style="padding-left:2em">&#9702; But, they fell into the hands of the Brahmana compilers up to this period, who often <strong>inserted new gods</strong> into the narrative and made substantial interpolations.</li>
</ul>
</li>
<li>&#8226; The <strong>Mahabharata</strong>, traditionally attributed to Vyasa, was also finally compiled during this period.
<ul>
<li style="padding-left:2em">&#9702; It was <strong>inflated</strong> from the original 24000 verses to 1000,000 verses. There is much in common between this epic and the law books.</li>
<li style="padding-left:2em">&#9702; Some of the injunctions (injunctions of Manu for instance) occur in identical form in the Shanti Parva of the Mahabharata.</li>
<li style="padding-left:2em">&#9702; It may imply-contrary to the popular view- that this legal text belongs to the Gupta period.</li>
</ul>
</li>
<li>&#8226; Several other <strong>law books</strong> like those of Vishnu, Yajnavalkya, Narada, Brihaspati and Katyayana may also have been composed during the Gupta times.</li>
<li>&#8226; The <strong>Brahmanical world view</strong> found in the epics and the Dharmashastras texts is r<strong>eflected in the various versions of the Panchatantra fables.</strong></li>
</ul>
<h2>Science and Technology</h2>
<p>Some important works on science were composed during the period.</p>
<p><strong>Aryabhatta</strong>, the author of the Aryabhatiya, lived in the 5th century.</p>
<ul>
<li>&#8226; He had suggested that the <strong>earth revolved around the sun and rotates on its own axis</strong>.</li>
<li>&#8226; Through his efforts, <strong>astronomy branched off as a separate discipline</strong> from mathematics.</li>
<li>&#8226; He was the first to use the <strong>decimal system</strong> but its invention is not attributed to him.</li>
</ul>
<p><strong>Varahamihira</strong>, who lived in c. 6th century, wrote several treatises on astronomy and astrology.</p>
<ul>
<li>&#8226; His <strong>Brihatsamhita</strong> is an encyclopaedic work on architecture, planetary motions, timekeeping, astrology, seasons, agriculture, mathematics, gemology and perfumes etc.
<ul>
<li style="padding-left:2em">&#9702; According to Varahamihira, in some verses, he was <strong>merely summarising earlier existing literature</strong> on astronomy and temple architecture.</li>
<li style="padding-left:2em">&#9702; The chapters of the Brihatsamhita were <strong>quoted by Al Beruni</strong>.</li>
</ul>
</li>
<li>&#8226; His <strong>Panchasiddhantika</strong> deals with <strong>five astronomical systems (siddhanta)</strong>;
<ul>
<li style="padding-left:2em">&#9702; Two of these have a close connection with the Greek knowledge on astronomy.</li>
</ul>
</li>
<li>&#8226; The <strong>Laghu Jataka and Brihad Jataka</strong>, both written by him, are works on horoscopy.</li>
</ul>
<h2>Art and Architecture</h2>
<p>The basic inspiration behind the Gupta art was <strong>Brahmanism</strong>.</p>
<ul>
<li>&#8226; Temple construction started during this period.</li>
</ul>
<p>Simultaneously, <strong>Buddhist influence</strong> continued during this period.</p>
<ul>
<li>&#8226; Ajanta and Ellora caves reflect Buddhist influence.</li>
</ul>
<p>Different art forms viz. <strong>paintings, sculpture</strong> etc. flourished during this period and some of them achieved a <strong>classical standard</strong>.</p>
<ul>
<li>&#8226; The term 'classical standard' can't be used in the context of temple architecture as temple construction was in its nascent phase at this point and it attained the classical standard only during the Rajput period.</li>
</ul>
<h3>Architecture</h3>
<p>Temple construction became the main form of architecture during this period.<br>
Most of the Gupta temples were examples of <strong>'Free standing Temples'</strong> as opposed to rock cut cave temples.</p>
<p>The <strong>stone temples</strong> include the</p>
<ul>
<li>&#8226; Kankali Devi temple at Tigawa (Katni district, MP),</li>
<li>&#8226; Shiva temples at Bhumara (Satna district, MP) and Khoh (Satna),</li>
<li>&#8226; Parvati temple of Nachna Kuthara (Panna district, MP),</li>
<li>&#8226; Dashavatara temple of Deogarh (Lalitpur district, UP),</li>
<li>&#8226; Dah Parbatia (Tezpur, Assam),</li>
<li>&#8226; Buddhist shrines at Sanchi and a Buddhist temple at Bodh Gaya.</li>
</ul>
<p>Then, there are <strong>brick temples</strong> of</p>
<ul>
<li>&#8226; Bhitargaon (Kanpur),</li>
<li>&#8226; Laxman temple at Sirpur (Mahsamund district, Chhattisgarh) and</li>
<li>&#8226; Paharpur (Rajshahi, Bangladesh).</li>
</ul>
<p>Apart from the free standing temples, we find the examples of <strong>rock cut temples</strong> as well i.e.</p>
<ul>
<li>&#8226; <strong>Udayagiri</strong> rock cut temples (near Vidisha) associated with Vishnu (Varaha avatar in the rock cave number 5)</li>
<li>&#8226; Shiva and Shakti, Buddhist temples of <strong>Ellora</strong>.</li>
</ul>
<p>When we observe the features of temple construction during the Gupta period, we notice that the Gupta architecture <strong>prepared the basis of Nagara style of architecture</strong>.</p>
<ul>
<li>&#8226; The temples were built on <strong>raised platforms</strong> and there were stairs from all the sides.</li>
<li>&#8226; The <strong>Sanctum Santorum</strong> (Garbha Griha-the chamber where the main deity is consecrated) was built in the <strong>centre</strong>.</li>
<li>&#8226; The <strong>idol of the main god</strong> was placed in the centre while the idols of <strong>subordinate gods</strong> were put up on the four sides of the temple.</li>
<li>&#8226; The inner walls of the temples were plain but the <strong>exterior walls were ornately carved.</strong></li>
<li>&#8226; The earlier temples had flat roofs but the Dashavatara temple of Deogarh had a <strong>'Shikhara'</strong>.
<ul>
<li style="padding-left:2em">&#9702; This is true for the Bhitargaon temple also.</li>
</ul>
</li>
</ul>
<p>We find an example of the <strong>Buddhist architecture</strong> during this period i.e. <strong>Dhamekh stupa</strong> situated near Varanasi.</p>
<ul>
<li>&#8226; Unlike other stupas, which were semi-spherical in shape, Dhamekh stupa was <strong>cylindrical in shape</strong>.</li>
</ul>
<p>During this period Buddhist architecture continued in the form of <strong>cave rock cut architecture</strong> viz. Ajanta (Aurangabad), Ellora (Aurangabad), Bhaja/ Karley (Pune) Bagh (Dhar district, MP) etc.</p>
<ul>
<li>&#8226; Many Buddhist Chaityas, Viharas and stupas were built during this period including those at <strong>Jaulian</strong> (near Taxila), <strong>Charssada</strong> (near Mardan, Khyber Pakhtunkhwa province, Pakistan) etc.</li>
</ul>
<p><strong>The Gupta temples can be divided into following styles:</strong></p>
<p>1. Flat-roofed, square temple, a shallow pillared porch with the entire structure built on a low platform.</p>
<ul>
<li>&#8226; <strong>E.g.</strong> Temple no. 17 at Sanchi, Vishnu and Varaha temple at Eran.</li>
</ul>
<p>2. Flat-roofed, square temple with a covered ambulatory around the sanctum which was preceded by a pillared porch.</p>
<ul>
<li>&#8226; Sometimes the temple had a second floor.</li>
<li>&#8226; Temple was built on a raised platform</li>
<li>&#8226; <strong>E.g.</strong> Parvati temple at Nachana Kuthara, Shiva temple at Bhumara.</li>
</ul>
<p>3. A low sikhara (tower) replaced the flat roof.</p>
<ul>
<li>&#8226; Panchayatan style was introduced in which there are four subsidiary shrines along with the shrine of the main deity.</li>
<li>&#8226; The main shrine is square but it has an elongated Mandap in front of it with four subsidiary shrines in its four corners, thus, giving the temple an overall rectangular shape.</li>
<li>&#8226; <strong>E.g.</strong> Dashavatara temple at Deogarh, Brick temple at Bhitargaon, Durga temple at Aihole.</li>
</ul>
<p>4. Rectangular temple with an apsidal back and a barrel-vaulted roof above.</p>
<ul>
<li>&#8226; <strong>E.g.</strong> Ter temple (Sholapur).</li>
</ul>
<p>5. Circular temple with shallow rectangular projections at the four cardinal faces.</p>
<ul>
<li>&#8226; <strong>E.g.</strong> Maniyar Math (Bihar)</li>
</ul>
<h3>Sculpture</h3>
<p>Earlier Gandhara and Mathura schools of sculpture had developed.</p>
<ul>
<li>&#8226; In course of time, both combined some of their elements and developed into the <strong>Sarnath School</strong> of sculpture during the Gupta period.</li>
<li>&#8226; Whenever we observe the Gupta sculptures, it shows more <strong>confidence and perfection</strong>.
<ul>
<li style="padding-left:2em">&#9702; The face of the statue reflects a cool and calm posture.</li>
<li style="padding-left:2em">&#9702; The sculptures have a perceptible aura.</li>
<li style="padding-left:2em">&#9702; While the sculptures during the Kushana period were often naked, Gupta sculpture is properly covered.</li>
<li style="padding-left:2em">&#9702; Apart from stone sculptures, we have metal sculptures as well e.g. a <strong>bronze sculpture of Buddha</strong> was unearthed from <strong>Sultanganj (Bihar)</strong>.</li>
<li style="padding-left:2em">&#9702; It is a great piece of art. That's why Gupta sculpture is considered to have reached <strong>classical standard</strong>.</li>
</ul>
</li>
</ul>
<h3>Paintings</h3>
<p>Whenever we talk about the Gupta paintings, we look towards <strong>Ajanta</strong> which presents a treasure of paintings from the early centuries of the Common Era to the early medieval age.</p>
<ul>
<li>&#8226; All the dynasties of this period, such as <strong>Satvahanas, Vakatakas, Guptas and Chalukyas</strong> contributed to the development of Ajanta paintings.</li>
<li>&#8226; Ajanta paintings were basically associated with <strong>Buddhism</strong>.
<ul>
<li style="padding-left:2em">&#9702; In <strong>cave no. 16</strong>, we find a rare painting of a dying princess whose family members are standing beside her and she is dying due to the pain of separation from her husband.</li>
<li style="padding-left:2em">&#9702; <strong>Cave no. 17</strong> is known as <strong>'Chitrasala'</strong>. In this cave, we find some rare paintings.</li>
<li style="padding-left:2em">&#9702; In one of the paintings <strong>Yashodhara</strong>, wife of Buddha, has been shown as submitting her only son Rahul to Buddha.</li>
<li style="padding-left:2em">&#9702; It creates charged emotional moments.</li>
</ul>
</li>
<li>&#8226; Apart from Ajanta, cave paintings are visible at <strong>Bagh</strong>.
<ul>
<li style="padding-left:2em">&#9702; There are 9 caves near Bagh, which have similar design but they are simpler.</li>
<li style="padding-left:2em">&#9702; Paintings have practically disappeared at Bagh.</li>
</ul>
</li>
<li>&#8226; Up to the Gupta period, paintings had reached a stage of excellence.</li>
<li>&#8226; Thus, it was supposed to have achieved <strong>classical standard</strong>.</li>
</ul>
<h3>Other Forms of art</h3>
<ul>
<li>&#8226; The <strong>Kama Sutra of Vatsyayana</strong> gives a hint towards other forms of art i.e. music, dance, play etc.
<ul>
<li style="padding-left:2em">&#9702; Vatsayana informs us that girls were given training in dance and music in towns.</li>
<li style="padding-left:2em">&#9702; Likewise, theatres used to organise plays in towns.</li>
</ul>
</li>
<li>&#8226; <strong>Natyashastra</strong> is a text on the performing arts.
<ul>
<li style="padding-left:2em">&#9702; The subjects covered by the treatise include composition of plays, structure of a play and the construction of a stage to host it, genres of acting, body movements, makeup and costumes, role and goals of an art director, the musical scales, musical instruments and the integration of music with art performance.</li>
</ul>
</li>
</ul>
<h2>Evaluation of Gupta Period as 'Golden Age'</h2>
<p>The term Golden Age denotes a phase of upsurge. This term is frequently applied to certain ages in world history.</p>
<ul>
<li>&#8226; For example, this term has been applied in the context of <strong>Periclean Athens</strong> (c. 400 BCE) and the <strong>England of Elizabeth</strong> in the 16th century.</li>
<li>&#8226; Likewise, this term was applied to certain phases of Indian history; including the Gupta Age.</li>
<li>&#8226; Indian historians who wrote during the phase of national struggle against colonial rule termed the Gupta Age as the 'Golden Age'.
<ul>
<li style="padding-left:2em">&#9702; But, in the light of recent historiography, which shifted from the history of elite to the history of masses, this term has been <strong>challenged</strong>.</li>
</ul>
</li>
</ul>
<p>The Gupta period was supposed to be Golden Age on following grounds:</p>
<p><strong>1. Revival of an empire/ political unification after the Mauryas:</strong></p>
<ul>
<li>&#8226; The Gupta Empire was initially presumed to be centralised.</li>
</ul>
<p><strong>2. Economic prosperity.</strong></p>
<ul>
<li>&#8226; (a) Condition of crafts.</li>
<li>&#8226; (b) Condition of trade and commerce.</li>
<li>&#8226; (c) Fa-Hein mentions the economic prosperity of Madhya Desha.</li>
<li>&#8226; (d) Guptas kings issued the largest number of gold coins in ancient India.</li>
</ul>
<p><strong>3. Religious tolerance:</strong></p>
<ul>
<li>&#8226; Although the Gupta kings were Vaishanava in their religious conviction, they gave patronage to other sects as well.</li>
<li>&#8226; The chief minister of Chandragupta Vikramaditya, <strong>Virasena</strong> was a Shaivite while his military commander <strong>Amar Kardawa</strong> was a Buddhist.</li>
<li>&#8226; <strong>Kumaragupta I and Budhagupta</strong> built monasteries at Nalanda.</li>
</ul>
<p><strong>4. Development of Art &amp; Literature:</strong></p>
<ul>
<li>&#8226; It was under the Guptas that literature and art reached a classical standard.</li>
<li>&#8226; The scholars like Harisena, Vatsvatti, Vasu, Amar Singh, Kalidas etc. got patronage under the Guptas.</li>
<li>&#8226; Likewise, temple construction started for the first time during this period. It prepared the base for the Nagara style of architecture.</li>
<li>&#8226; Sarnath School of sculpture, paintings of Ajanta and Bagh, all stood as the monument of cultural achievements under Guptas,</li>
</ul>
<p><strong>5. Development of Science &amp; Technology:</strong></p>
<ul>
<li>&#8226; Achievements of Aryabhatta, Varahamihira, iron pillar of Mehrauli at Delhi etc.</li>
</ul>
<p>It was believed that all these achievements were based on economic growth and social integration.</p>
<h3>Limitations</h3>
<p>But, there is another side of the picture and we should be a bit cautious while using the term 'Golden Age'.</p>
<ul>
<li>&#8226; Because for the <strong>common people</strong>, the term Golden Age hardly had any relevance.
<ul>
<li style="padding-left:2em">&#9702; Whatever economic prosperity we witnessed was at the elite level.</li>
<li style="padding-left:2em">&#9702; Among the common people, we find frequent evidence of <strong>forced labour.</strong></li>
</ul>
</li>
<li>&#8226; Even <strong>Varna</strong> division crystallised further.</li>
<li>&#8226; Furthermore, one can underline a relative decline in the condition of <strong>women</strong> as well.</li>
<li>&#8226; Likewise, the condition of <strong>untouchables</strong> became worse as attested by Fahian.</li>
<li>&#8226; We can clearly see growing signs of <strong>feudalization of economy and polity</strong> in this period.</li>
<li>&#8226; In fact, even <strong>trade declined</strong> to some extent.</li>
</ul>
<p>So, although this period should be credited for the unparalleled production of cultural products, still the term 'golden age' does not appear to be relevant.</p>
<h2>Disintegration of Gupta Empire</h2>
<p>Following are some of the factors that contribute towards the disintegration of the Gupta Empire.</p>
<p><strong>1. Huna Invasions:</strong></p>
<p>From the time of <strong>Kumaragupta I</strong> (successor of Chandra Gupta II), the North- West borders had been continuously threatened by the Hunas.<br>
It was a Central Asian (roughly area around Oxus valley) tribe which was successfully moving in different directions.<br>
It was establishing pockets of Huna rule in northern and western India.<br>
But, their attacks were repulsed during this period by prince <strong>Skandagupta</strong>.<br>
Huna invasion was repulsed even during the reign of Skandagupta.</p>
<ul>
<li>&#8226; But these attacks must have caused <strong>political convulsions.</strong></li>
</ul>
<p>However, towards the end of the 5th century CE and the beginning of 6th century, the Huna chief <strong>Toramana</strong> was able to establish his authority over a large part of western India and around Eran in central India.</p>
<ul>
<li>&#8226; Inscriptions suggest that his rule extended over parts of Kashmir, Punjab, UP and Rajasthan.</li>
<li>&#8226; An 8th century Jain text, <strong>Kuvalayamal</strong>, mentions that Toramana adopted Jainism.</li>
</ul>
<p><strong>Maihirakula</strong>, his son, further extended this dominion. Mihirkula's inscription has been found at Gwalior.</p>
<ul>
<li>&#8226; According to <strong>Xuanzang</strong>, his capital was at Sakala (Sialkot).</li>
<li>&#8226; Rajtarangini describes the cruelty of Mihirakula and exaggerates his conquest. Thus, the Huna attacks were a major blow to the Gupta authority particularly in northern and western regions of the empire.</li>
<li>&#8226; Eventually, Mihirakula was defeated at the hands of <strong>Narasimhagupta</strong> (a later Gupta ruler), <strong>Yashodharman of Malwa</strong> and <strong>Maukharis of Kannauj</strong>.</li>
</ul>
<p><strong>2. Administrative Weaknesses:</strong></p>
<p>The Guptas adopted the policy to <strong>restore the authority of local chiefs</strong> or kings in the conquered areas.</p>
<ul>
<li>&#8226; This created a problem for almost every Gupta King who had to reinforce his authority over recalcitrant subordinates.</li>
<li>&#8226; The <strong>constant military campaigns</strong> were a burden on the state treasury.</li>
<li>&#8226; Towards the end of the 5th century CE and beginning of 6th century CE, <strong>many regional powers reasserted their authority</strong> taking advantage of the weak Gupta emperors.
<ul>
<li style="padding-left:2em">&#9702; In due course of time they declared their independence.</li>
</ul>
</li>
<li>&#8226; Possibly, the competition from Vakataks and rise of the <strong>Yashodharman of Malwa</strong> were also factors behind the decline of Guptas.</li>
</ul>
<p><strong>3. There were many other reasons which contributed to the decline of Guptas.</strong></p>
<ul>
<li>&#8226; For example, it has been argued that the Guptas issued <strong>land grants</strong> to the Brahmana donees and in this process <strong>surrendered the revenue and resources administrative rights in favour of the donees.</strong>
<ul>
<li style="padding-left:2em">&#9702; But, inscriptions do not support the view that the royal Guptas were involved in giving royal land grants on a large scale, but Vakatakas certainly were.</li>
</ul>
</li>
<li>&#8226; Further, it is believed that the <strong>Samanta system</strong> in which the Samantas (minor rulers), who ruled as the subordinates, made the Gupta administrative structure loose.
<ul>
<li style="padding-left:2em">&#9702; There is a diversity of opinion as to how the system originated and regarding the details of the system, but the <strong>presence of many Samantas within the empire does show that they wielded power almost independently of the Gupta authority.</strong></li>
</ul>
</li>
<li>&#8226; There is no doubt that <strong>division within the imperial family, concentration of power in the hands of local chiefs or governors, loose administrative structure of the empire etc.</strong> contributed towards the disintegration of the Gupta Empire.</li>
</ul>"""

pattern = r"('guptas-vakatakas-vardhanas':\s*`)`"
result = re.sub(pattern, lambda m: m.group(1) + new_html + '`', content)

if result == content:
    print("ERROR: slug not found or pattern did not match.")
else:
    with open('lib/noteContent.ts', 'w', encoding='utf-8') as f:
        f.write(result)
    print("SUCCESS: 'guptas-vakatakas-vardhanas' injected.")
