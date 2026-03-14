import re

html = """<h2>Vijayanagara — Economy</h2>
<p>The Vijayanagara economy was <strong>similar to the Chola economy</strong>.</p>
<ul>
<li>&#8226; <strong>Economic administration was shaped according to the mercantile conditions</strong>. The coastal areas were dotted with ports and cities. Often, cities were centres of commercial, cultural, religious and political activities.</li>
<li>&#8226; Its <strong>main income sources</strong> were <strong>agriculture and commerce</strong>, the former being the main source of income. The tax ranged from 1/4 to 1/6, depending upon the quality of land.</li>
<li>&#8226; <strong>Irrigation</strong> was an important source of income for the state.
<ul>
<li style="padding-left:2em">&#9702; It was called <strong>&#8216;Dashavanda&#8217;</strong> in the Tamil area and <strong>&#8216;Kattukadage&#8217;</strong> in the Kannada area.</li>
<li style="padding-left:2em">&#9702; Even <strong>temples and Amaranayakas</strong> encouraged the extension of irrigation to the semi-arid areas.</li>
<li style="padding-left:2em">&#9702; In the <strong>Karnataka</strong> area, the <strong>Kattukadage rights</strong> were especially mentioned in the <strong>inscriptions</strong> so as to protect the income of the concerned individual.</li>
</ul>
</li>
<li>&#8226; <strong>Land was divided into three parts</strong>-
<ul>
<li style="padding-left:2em">&#9702; <strong>&#8216;Amaram&#8217;</strong> land, which was biggest of the three groups, went to the Nayak; <strong>&#8216;Bhandarvada&#8217;</strong> land was the crown land and a part of income from this land went to the maintenance of forts and</li>
<li style="padding-left:2em">&#9702; The tax free <strong>&#8216;Manya&#8217;</strong> land was granted to the temples, Brahmans and Mathas.</li>
</ul>
</li>
<li>&#8226; A <strong>majority of people</strong> lived in the <strong>rural areas</strong> which were fairly <strong>self-dependent.</strong>
<ul>
<li style="padding-left:2em">&#9702; Temples played an important role in rural life.</li>
<li style="padding-left:2em">&#9702; Temples had amassed huge land and acted as centres of socio- economic life.</li>
</ul>
</li>
<li>&#8226; <strong>Artisans operated in guilds</strong>.
<ul>
<li style="padding-left:2em">&#9702; Their economic importance gave them political influence in the court and their <strong>leaders had the ears of important political figures</strong>.</li>
</ul>
</li>
<li>&#8226; <strong>Items of trade</strong>
<ul>
<li style="padding-left:2em">&#9702; According to &#8216;Amuktamalyada&#8217;, the main items of import were horses, precious stones, sandalwood and pearl etc.</li>
<li style="padding-left:2em">&#9702; According to Nuniz, Vijayanagara state was importing 13000 horses annually.</li>
<li style="padding-left:2em">&#9702; Commodities like rice, sugar, coconut, dyes, sandalwood, black pepper, ivory, silk and printed cotton were exported mainly to Persia, Africa, China and Sri Lanka.</li>
</ul>
</li>
<li>&#8226; The <strong>level of monetization</strong> was high as the trade was mainly in coins.
<ul>
<li style="padding-left:2em">&#9702; Hence, the Vijayanagara state had many mints.</li>
</ul>
</li>
<li>&#8226; Also, the state made sure that the foreign trade did not slip into the hands of rival states.
<ul>
<li style="padding-left:2em">&#9702; Thus, they made <strong>concessions to foreigners</strong> like the Portuguese.</li>
</ul>
</li>
<li>&#8226; Overall, the internal trade during this period was stable and increased gradually.
<ul>
<li style="padding-left:2em">&#9702; The trade of India during this period invited both envy and admiration of the foreign travelers. Perhaps, India was in the process of becoming the proverbial &#8216;Golden Bird&#8217; during this period.</li>
</ul>
</li>
</ul>
<h2>Society</h2>
<p>The society was caste based and hierarchical, however, unlike north India, there was not a four-fold Varna division, rather the society had Brahmins and Non-Brahmins.</p>
<ul>
<li>&#8226; <strong>Brahmins</strong> held the supreme position and enjoyed both political power and social prestige.
<ul>
<li style="padding-left:2em">&#9702; The kings, top officials, ministers, army commanders, etc. were Brahmin.</li>
<li style="padding-left:2em">&#9702; Brahmin priests received lightly taxed land grants.</li>
<li style="padding-left:2em">&#9702; Educational institutions were completely under their control</li>
<li style="padding-left:2em">&#9702; Religious life was characterised by regimented ritualism due to which their importance increased.</li>
</ul>
</li>
<li>&#8226; The Non-Brahmins were divided into the <strong>Valangai (right handed) and Idangai (left handed) castes.</strong>
<ul>
<li style="padding-left:2em">&#9702; The Valangai group consisted of castes with an agricultural basis, whereas,</li>
<li style="padding-left:2em">&#9702; The Idangai group consisted of castes which were involved in manufacturing, craft and trading etc.</li>
</ul>
</li>
<li>&#8226; The <strong>society was not divided along blood relations but on the basis of geography</strong>.
<ul>
<li style="padding-left:2em">&#9702; So, it was common that blood relatives living in separate geographical areas establish marital relations.</li>
</ul>
</li>
<li>&#8226; Due to Brahmanical orthodoxy prevalent in the Vijayanagara society, the <strong>condition of women</strong> in the Vijayanagara society was no better than north India.
<ul>
<li style="padding-left:2em">&#9702; <strong>Child Marriage and Polygamy</strong> were common.</li>
<li style="padding-left:2em">&#9702; <strong>Widow remarriages</strong> were considered <strong>taboo</strong>.
<ul>
<li style="padding-left:4em">&#9632; However, the <strong>rulers encouraged it</strong> through tax exemptions.</li>
</ul>
</li>
<li style="padding-left:2em">&#9702; <strong>Tippadiyal (Sati)</strong> was also popular.
<ul>
<li style="padding-left:4em">&#9632; At the same time, we also find evidence of male Royal bodyguards jumping onto the funeral pyres of deceased kings.</li>
</ul>
</li>
<li style="padding-left:2em">&#9702; In temples, <strong>Devadasis</strong> were heavily exploited but the condition of <strong>Ganikas</strong> was far better.</li>
</ul>
</li>
<li>&#8226; Although the Varnashrama Dharma system was rigidly observed, the <strong>Vijayanagara kings were remarkably liberal and practical in their outlook.</strong>
<ul>
<li style="padding-left:2em">&#9702; They readily <strong>patronised</strong> skilled artisans, workmen, scholars and <strong>promoted</strong> able administrators and military commanders <strong>from all backgrounds, including Muslims.</strong></li>
<li style="padding-left:2em">&#9702; They <strong>welcomed Christian missionaries</strong> from Portugal.</li>
<li style="padding-left:2em">&#9702; They even <strong>joined hands with the Golconda Sultanate against the Gajpati rulers.</strong></li>
</ul>
</li>
</ul>
<h2>Culture</h2>
<p>Bukka I <strong>invited scholars and artists</strong> from all over India to his Kingdom. In the subsequent centuries, Vijayanagara Empire oversaw further evolution of the Dravida School of architecture, development of Telugu literature and evolution of new art forms etc.</p>
<h3>Architecture</h3>
<p>Vijayanagara made special contributions to the Dravida School.</p>
<ul>
<li>&#8226; Now, the temple <strong>enclosures</strong> became wider.</li>
<li>&#8226; The temple walls were <strong>painted</strong> with themes from epics and Puranas and the lavishly ornamented <strong>Gopurams</strong> grew taller as they enclosed more area.</li>
<li>&#8226; <strong>Kalyan Mandapa</strong> was a Vijayanagara addition to the temples, where ceremonial weddings of the deities were organised.</li>
</ul>
<p>Another important feature was the profusely decorated <strong>pillars</strong>.</p>
<ul>
<li>&#8226; A <strong>mount with two lofted feet</strong> is an impressive sculpture on these pillars.</li>
<li>&#8226; Pillars invariably had <strong>brackets as their capitals</strong>.</li>
</ul>
<p><strong>Vithhal Swami and Hazara temples</strong> are the two examples of this period with raised platforms, big assembly halls and pillars.</p>
<ul>
<li>&#8226; Kumbakonam, Kanchipuram, Srirangam, Chidambaram, Tirumala and Vellore etc. are full of the Vijayanagara era temples.</li>
</ul>
<p>Secular buildings had features of <strong>Indo-Islamic architecture</strong> too.</p>
<ul>
<li>&#8226; E.g. The elephant stable at Hampi which had domes and the Lotus Mahal Ruins of Vijayanagara (modern Hampi) are the witness to the genius of Vijayanagara architecture.</li>
</ul>
<p>Vijayanagara architecture was carried forward by the Madurai school in later centuries.</p>
<h3>Literature</h3>
<p>Vijayanagara kings were great patrons of literature and education and Krishna Deva Raya has a special place among them.</p>
<h3>Sanskrit Literature</h3>
<ul>
<li>&#8226; <strong>Sanskrit literature</strong> was reinvigorated under state sponsorship.
<ul>
<li style="padding-left:2em">&#9702; Under the leadership of <strong>Sayanacharya</strong> (brother of Vidyaranya), scholars composed a large number of Sanskrit works including <strong>commentaries on the Vedic corpus</strong>.</li>
<li style="padding-left:2em">&#9702; <strong>Hemadri</strong> also wrote a <strong>commentary on the Dharmashastras</strong>.</li>
</ul>
</li>
<li>&#8226; Authors in the <strong>regional languages</strong>- Telugu, Malayalam, Kannada and Tamil- were also patronised.</li>
</ul>
<h3>Telugu Literature</h3>
<ul>
<li>&#8226; This was also the period of <strong>Telugu renaissance</strong>, e.g. the gems produced by the <strong>Astadiggaja</strong> of Krishna Deva Raya.
<ul>
<li style="padding-left:2em">&#9702; Additionally, a large number of <strong>Sanskrit religious and secular literature was translated into Telugu</strong>
<ul>
<li style="padding-left:4em">&#9632; eg. <strong>Tirumal</strong> wrote a commentary on the <strong>&#8216;Geet Govinda&#8217;</strong> of Jayadeva.</li>
</ul>
</li>
</ul>
</li>
</ul>
<h3>Malayalam Literature</h3>
<ul>
<li>&#8226; The <strong>first authentic Malayalam literature, &#8216;Unnuneeli Sandesham&#8217;</strong> was written during this period, which is based on Kalidasa&#8217;s Meghadutam.</li>
<li>&#8226; <strong>Madhav Panikkar translated Bhagavad Gita</strong> into Malayalam.</li>
</ul>
<h3>Kannada Literature</h3>
<ul>
<li>&#8226; Kannada scholar <strong>Madhur</strong> wrote, <strong>Dharmanathapuran</strong>, which is based on the life of 15th Jain Tirthankar.</li>
<li>&#8226; <strong>Palkuriki Somnatha</strong> wrote many pieces on <strong>Virashaivism</strong> in Telugu and Kannada.</li>
<li>&#8226; <strong>&#8216;Karnataka Shabd Anushasan&#8217;</strong>, the Kannada grammar was written during this period.</li>
</ul>
<h3>Tamil Literature</h3>
<ul>
<li>&#8226; <strong>Except for Tamil, the themes and styles of these works were mostly derived from Sanskrit literature.</strong>
<ul>
<li style="padding-left:2em">&#9702; Jain, Shaivite and Vaishanava saints composed <strong>religious literature in Tamil.</strong></li>
</ul>
</li>
</ul>
<h3>Other art forms</h3>
<ul>
<li>&#8226; <strong>Portuguese writers and Abdur Razzaq</strong> have mentioned the talented <strong>painters</strong> in the service of Vijayanagara state.
<ul>
<li style="padding-left:2em">&#9702; <strong>Lepakshi</strong> painting developed during this period.</li>
<li style="padding-left:2em">&#9702; Themes from epics were used in this type of painting.</li>
</ul>
</li>
<li>&#8226; A large number of <strong>portrait sculptures</strong> were made during this period.
<ul>
<li style="padding-left:2em">&#9702; The portrait sculpture of Krishna Deva Raya and his queens is found in Tirupati temple</li>
</ul>
</li>
<li>&#8226; A new art form called, <strong>&#8216;Yakshgana&#8217;</strong>, developed during this period which mixed both music and dance.
<ul>
<li style="padding-left:2em">&#9702; It was mostly associated with temples.</li>
</ul>
</li>
<li>&#8226; Nambudiri Brahmins developed a new art form, <strong>&#8216;Koodiyattam&#8217;</strong>, in which Puranic stories are told through dance.</li>
<li>&#8226; The Vijayanagara period saw <strong>Carnatic music</strong> evolve into a definite form.
<ul>
<li style="padding-left:2em">&#9702; <strong>Purandara Dasa</strong> was a renowned proponent of Carnatic music.</li>
<li style="padding-left:2em">&#9702; <strong>Rudraveena</strong> was possibly invented during this period.</li>
</ul>
</li>
<li>&#8226; <strong>Bharatnatyam</strong> was also promoted during this period, primarily as a form of temple art.</li>
</ul>
<h3>Contribution of Krishna Dev Raya to art and literature:</h3>
<p>Due to his creative genius, Krishna Deva Raya was <strong>comparable to Akbar</strong>. Despite the incessant fighting, he could focus on the creative potential of his empire as his court was decorated with many scholars and artists.</p>
<ul>
<li>&#8226; He had <strong>good command over both Telugu and Sanskrit</strong>.
<ul>
<li style="padding-left:2em">&#9702; He continued the earlier tradition of writing <strong>commentaries on the Vedas and other Sanskrit works.</strong></li>
<li style="padding-left:2em">&#9702; During his period, <strong>Telugu literature came out of the shadow of Sanskrit literature.</strong> His reign was a period of <strong>Telugu renaissance</strong>.
<ul>
<li style="padding-left:4em">&#9632; His court had <strong>8 Telugu poets (Astadiggajas)</strong> - Allasani Peddana, Nandi Thimmana, Madayyagari Mallana, Dhurjati, Ayyala-raju, Pingali Surana, Ramaraja Bhushanudu and Tenali Ramakrishna.</li>
<li style="padding-left:4em">&#9632; These scholars authored amazing masterpieces.</li>
<li style="padding-left:4em">&#9632; His own work, <strong>Amuktamalyada</strong>, is an epic poem in Telugu which describes the wedding of Lord Vishnu and Andal, a Tamil bhakti poet.</li>
</ul>
</li>
<li style="padding-left:2em">&#9702; <strong>He patronised Tamil and Kannada scholars too.</strong></li>
<li style="padding-left:2em">&#9702; He composed literature in Sanskrit too.</li>
</ul>
</li>
<li>&#8226; He also patronised art and architecture.
<ul>
<li style="padding-left:2em">&#9702; <strong>Dravida School</strong> of architecture evolved further under his rule, e.g. <strong>Hazara temple and Vithhal temple</strong>.</li>
</ul>
</li>
<li>&#8226; <strong>Duarte Barbosa</strong> profusely praises him for his religious tolerance, his sense of justice and his efficient administration.</li>
</ul>"""

with open('lib/noteContent.ts', 'r', encoding='utf-8') as f:
    content = f.read()

old = "'fifteenth-sixteenth-century-society': ``"
new = "'fifteenth-sixteenth-century-society': `" + html + "`"

count = content.count(old)
print(f"Found {count} occurrence(s) of target string")

if count == 1:
    content = content.replace(old, new, 1)
    with open('lib/noteContent.ts', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Replaced 1 occurrence(s). Done.")
else:
    print("ERROR: Expected exactly 1 occurrence. Aborting.")
