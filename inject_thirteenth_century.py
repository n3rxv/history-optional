import re

new_html = r"""<h2>Mamluk/ Ilbari Dynasty (1206&#8211;90)</h2>

<h3>Qutubuddin Aibak (1206&#8211;10)</h3>
<p>After the death of Mohammed Ghori, Aibak, his governor at Lahore claimed his Indian territories.</p>
<p>However, before he could resolve the conflict against Yaldoz and Qabacha, he <strong>died accidentally while playing Chaugan (Polo)</strong> in 1210 and thus could not consolidate his power.</p>
<ul>
<li>&#8226; It is generally held that in spite of the title of Sultan and the manumission, Aibak should not be regarded as a sovereign of Delhi Sultanate. This is due to the following factors -
  <ul>
  <li style="padding-left:2em">&#9702; <strong>No coins</strong> have yet been discovered bearing his name</li>
  <li style="padding-left:2em">&#9702; <strong>Khutba</strong> was not read in his name</li>
  <li style="padding-left:2em">&#9702; <strong>Ibn Battuta</strong> does not consider him as the first independent sovereign of Delhi</li>
  <li style="padding-left:2em">&#9702; His name is <strong>not included in the list of Delhi</strong> sultans that Firuz Shah Tughlag ordered to be inserted in the Friday Khutba.</li>
  </ul>
</li>
</ul>

<h4>Important details:</h4>
<ul>
<li>&#8226; He made <strong>Lahore</strong> as his capital.</li>
<li>&#8226; He was popularly known as <strong>&#8216;Quran Khawan&#8217;</strong> and <strong>&#8216;Lakh Baksh&#8217;</strong>.</li>
<li>&#8226; He constructed the <strong>Quwwat-ul Islam Mosque</strong> (1st mosque in India) at Mehrauli, over the destroyed remains of a Vaishnavite temple, which was earlier a Jain Temple.</li>
<li>&#8226; He built the <strong>Adhai Din Ka Jhonpra Mosque</strong> (2nd mosque in India) at Ajmer over the remains of an old Buddhist monastery.</li>
<li>&#8226; He <strong>started construction on the Qutub Minar</strong> and was able to complete the first storey.
  <ul>
  <li style="padding-left:2em">&#9702; The second, third and fourth stories were built by Iltutmish.</li>
  <li style="padding-left:2em">&#9702; It was repaired by Feroz Shah Tughlaq after being destroyed by lightning and a fifth story was added.</li>
  <li style="padding-left:2em">&#9702; The Qutub Minar was built as a <strong>victory tower</strong> symbolising Turkish victory over India.</li>
  <li style="padding-left:2em">&#9702; It was dedicated to <strong>Qutbuddin Bakhtiyar Kaki</strong> (a Chishti Sufi saint).</li>
  </ul>
</li>
</ul>

<h3>Iltutmish (1211&#8211;36)</h3>
<p>He is considered to be the <strong>real founder</strong> of the Delhi Sultanate.</p>
<ul>
<li>&#8226; He provided a solid administrative, military, economic and cultural foundation to the Empire in its infancy and protected it from external challenges also.</li>
</ul>

<h4>Challenges Before Iltutmish</h4>
<p>We can evaluate the achievements of Iltutmish in context of the problems which Iltutmish had to face in his career.</p>
<ul>
<li>&#8226; Almost all the <strong>Rajput states rebelled successfully</strong> during the weak rule of Aram Shah.</li>
<li>&#8226; The <strong>governor of Bengal, Iwaz, declared his freedom</strong> and became the independent ruler in the name of Giyasuddin Iwaz Shah.</li>
<li>&#8226; The threat of the <strong>Mongol invasion</strong> was looming large over the newly founded Delhi Sultanate.</li>
<li>&#8226; <strong>Yalduz and Qabacha</strong> continued to threaten Delhi&#8217;s independence.</li>
<li>&#8226; The Sultanate lacked the support of an efficient <strong>administrative structure</strong>.</li>
<li>&#8226; Further, the newly founded Delhi Sultanate still lacked <strong>legitimacy and acceptance from the caliph.</strong></li>
</ul>

<h4>Measures taken by Iltutmish</h4>
<ul>
<li>&#8226; He shifted his capital to <strong>Delhi</strong> from Lahore.</li>
<li>&#8226; Iltutmish quickly <strong>subjugated the rebellious Rajput states</strong>:
  <ul>
  <li style="padding-left:2em">&#9702; Kannauj</li>
  <li style="padding-left:2em">&#9702; Katihar</li>
  <li style="padding-left:2em">&#9702; Badaun</li>
  <li style="padding-left:2em">&#9702; Banaras</li>
  <li style="padding-left:2em">&#9702; Ranthambore</li>
  <li style="padding-left:2em">&#9702; Jalore</li>
  </ul>
</li>
<li>&#8226; He <strong>eliminated Yalduz and Qabacha</strong> as well.</li>
<li>&#8226; With his astute diplomacy, he was able to <strong>prevent</strong> a <strong>Mongol invasion</strong> of India under Genghiz Khan.</li>
<li>&#8226; He was the first Sultan to have a permanent royal bodyguard called the <strong>Sar-i-Jahandar</strong>, the precursor to a standing army.</li>
<li>&#8226; He also introduced the permanent cavalry called the <strong>Hashm-i Qalb</strong>.</li>
<li>&#8226; He provided an <strong>efficient administrative structure</strong> to this newly founded state.
  <ul>
  <li style="padding-left:2em">&#9702; He selected some important slaves from the long list of slaves of Muhamad Ghori and formed a group of officers known as <strong>&#8216;Turkan-e-Chihalgani&#8217;</strong>.</li>
  <li style="padding-left:2em">&#9702; Most of the slaves were of Turkish origin but Iltutmish selected some Tajik slaves as well to put create a proper system of <strong>checks and balance</strong>.</li>
  <li style="padding-left:2em">&#9702; All the important posts were given to the members of the Chahalgani.</li>
  </ul>
</li>
<li>&#8226; He also introduced the <strong>Iqta system</strong>.
  <ul>
  <li style="padding-left:2em">&#9702; Among the sultans, Iltutmish was the first to recognise the <strong>economic importance of the Gangetic Doab.</strong></li>
  <li style="padding-left:2em">&#9702; He divided the area from Multan to Lakhnauti into <strong>administrative iqtas</strong> and allocated them to nobles.</li>
  <li style="padding-left:2em">&#9702; Similarly, he gave <strong>small villages</strong> in the Ganga Yamuna Doab area to about <strong>2000 Shamsi chiefs in return for military service</strong> rendered to the state.
    <ul>
    <li style="padding-left:4em">&#9632; Thus he also organised the military system.</li>
    </ul>
  </li>
  </ul>
</li>
<li>&#8226; He was the first Sultan to introduce <strong>standard Arabic currency</strong>.
  <ul>
  <li style="padding-left:2em">&#9702; <strong>Silver Tanka</strong></li>
  <li style="padding-left:2em">&#9702; <strong>Copper Jital</strong>
    <ul>
    <li style="padding-left:4em">&#9632; Earlier, coins issued by Mohammed Ghori were simply the defaced and restruck coins of Prithivraj III. They carried the image of the Goddess Lakshmi and the name of Ghori in Devanagari script written as &#8216;Sri Muhammad bin Sam Suratan&#8217;</li>
    </ul>
  </li>
  </ul>
</li>
<li>&#8226; He built two colleges at Delhi
  <ul>
  <li style="padding-left:2em">&#9702; <strong>Nasiria</strong></li>
  <li style="padding-left:2em">&#9702; <strong>Muzia</strong></li>
  </ul>
</li>
<li>&#8226; He also built the <strong>&#8216;Agrasen ki Baoli&#8217;/ &#8216;Gandhak ki Baoli&#8217;</strong>.</li>
<li>&#8226; He was the first Sultan to receive the <strong>Mansur</strong> (letter of investiture from the Caliph).
  <ul>
  <li style="padding-left:2em">&#9702; After this, he adopted the title &#8216;Amin-ul Mominu Khalifa&#8217; (deputy of the leader of the faithful).</li>
  </ul>
</li>
<li>&#8226; During his reign, Delhi became the <strong>cultural centre of the Islamic world</strong>.
  <ul>
  <li style="padding-left:2em">&#9702; The sacking of Baghdad, Damascus, Samarkand, Samana, Aleppo, etc. by the Mongols had suddenly uprooted the developed Islamic culture of West Asia.</li>
  <li style="padding-left:2em">&#9702; A large number of Muslim scholars, artists, architects, engineers and craftsmen migrated to Delhi as the <strong>last refuge of Islam</strong>.</li>
  <li style="padding-left:2em">&#9702; Thus, Delhi witnessed unprecedented cultural progress and became famous as <strong>&#8216;Hazrat-i-Delhi&#8217;</strong>.</li>
  </ul>
</li>
</ul>

<h4>Limitations</h4>
<ul>
<li>&#8226; He didn&#8217;t create a strong base of administration.
  <ul>
  <li style="padding-left:2em">&#9702; The &#8216;Turkan-e- Chahalgani&#8217; was just an <strong>ad-hoc arrangement.</strong></li>
  <li style="padding-left:2em">&#9702; His successors had to pay a heavy price as this Chalisa turned to be a <strong>Frankenstein&#8217;s monster.</strong></li>
  </ul>
</li>
<li>&#8226; From the very beginning itself Iltutmish seems to have <strong>encouraged the ambition of Muslim nobility through linking them to landed property.</strong></li>
</ul>

<h4>Conclusion</h4>
<ul>
<li>&#8226; But in spite of the limitations mentioned above we can&#8217;t diminish the achievements of Iltutmish in the history of the Delhi Sultanate.</li>
<li>&#8226; In fact he was the <strong>real founder</strong> of this state and in one sense it was Iltutmish who prepared the base for the strong rule of Balban and the imperialistic expansion of Alauddin Khilji.</li>
</ul>

<h3>Razia Sultan (1236&#8211;1240)</h3>
<ul>
<li>&#8226; The only capable son of Iltutmish, Mohammad had already died during his lifetime. The rest of his sons were incapable.</li>
<li>&#8226; <strong>Iltutmish</strong> tried to break precedence by <strong>nominating Razia as his successor,</strong> but the members of &#8216;Turkan-e-Chahalgani&#8217; selected an incompetent prince <strong>Ruknud-din-Firuz.</strong>
  <ul>
  <li style="padding-left:2em">&#9702; Corruption was encouraged, law and order deteriorated and <strong>anarchy prevailed.</strong></li>
  </ul>
</li>
<li>&#8226; Taking advantage of this anarchy, <strong>Razia seized power</strong> with the support of the people and a section of the army.
  <ul>
  <li style="padding-left:2em">&#9702; In 1236 AD, she declared herself the sultan of Delhi.</li>
  </ul>
</li>
</ul>

<h4>Challenges before Razia Sultan</h4>
<p>Unlike ambitious Mughal women like Maham Anga and Nurjahan who worked from behind the scenes, Razia occupied the throne and ruled directly. But she had to face several challenges.</p>
<ul>
<li>&#8226; With a view to take advantage of the chaos during Razia&#8217;s revolt, <strong>some nobles had laid siege to the capital</strong> with a view to control the outcome.</li>
<li>&#8226; <strong>Orthodox Muslims and ulemas</strong> considered it against their dignity to be ruled by a woman.</li>
<li>&#8226; The <strong>Chihalgani felt threatened</strong> by her popularity and independence:
  <ul>
  <li style="padding-left:2em">&#9702; Razia was <strong>the popular choice</strong>.
    <ul>
    <li style="padding-left:4em">&#9632; This was unacceptable to the nobility, because they wanted a puppet installed by them.</li>
    </ul>
  </li>
  <li style="padding-left:2em">&#9702; Further, Razia was a <strong>competent and efficient ruler</strong>, therefore Turkish nobles feared that their power would be curtailed.</li>
  </ul>
</li>
<li>&#8226; Some <strong>Rajput states rebelled</strong> again.</li>
</ul>

<h4>Razia&#8217;s Response</h4>
<ul>
<li>&#8226; She <strong>lifted the siege of the nobles without bloodshed</strong> by sowing the seeds of mutual suspicion among them.</li>
<li>&#8226; Razia proved to be an <strong>excellent administrator</strong> and quickly brought the anarchy in Delhi under control.
  <ul>
  <li style="padding-left:2em">&#9702; Law and order was restored and corruption was curtailed.</li>
  <li style="padding-left:2em">&#9702; Minhaj-us-Siraj writes that all the nobles and Maliks from Deval to Lakhnauti bowed before Razia.</li>
  </ul>
</li>
<li>&#8226; She <strong>started promoting non-Turks</strong> to break the monopoly of Turkish nobles.
  <ul>
  <li style="padding-left:2em">&#9702; An Abyssinian noble Yakut, earlier a simple Amir-i-Akhur (Lord of the stables), he became Amir-ul-Umra (Chief of the Nobles).</li>
  <li style="padding-left:2em">&#9702; Similarly Hasan Ghori was made chief commander.</li>
  </ul>
</li>
<li>&#8226; Razia sent Hasan Ghori to <strong>suppress the rebellious Rajputs</strong>. He was able to do so successfully.</li>
</ul>

<h4>Downfall</h4>
<ul>
<li>&#8226; The <strong>jealous Turkish nobility and Ulemas</strong> tried to <strong>tarnish her image</strong> by spreading the rumour of an illicit relationship between Razia and Yakut.</li>
<li>&#8226; Then a <strong>series of revolts</strong> were orchestrated.
  <ul>
  <li style="padding-left:2em">&#9702; The nobles at Delhi entered into a secret arrangement with the nobles at the provinces.</li>
  </ul>
</li>
<li>&#8226; As Razia enjoyed the support of the people of Delhi, the nobles compelled her to fight them outside the capital.
  <ul>
  <li style="padding-left:2em">&#9702; Ultimately she was defeated.</li>
  </ul>
</li>
</ul>

<h4>Reasons for her Downfall</h4>
<ul>
<li>&#8226; Many historians try to emphasise that Razia&#8217;s biggest weakness was her <strong>gender</strong>.
  <ul>
  <li style="padding-left:2em">&#9702; <strong>Minhaj-us-Siraj</strong> writes that Razia had all the qualities of an efficient ruler; She had only one weakness and that was her womanhood.</li>
  <li style="padding-left:2em">&#9702; However, this is an <strong>over-simplistic</strong> explanation of her downfall.</li>
  </ul>
</li>
<li>&#8226; The real reason behind the Shamsi nobility&#8217;s opposition to Razia was her <strong>independence and ability</strong>. It threatened their unbridled ambition.
  <ul>
  <li style="padding-left:2em">&#9702; Razia <strong>refused to become a puppet</strong> in their hands. Infact, she took effective measures to check their power.</li>
  <li style="padding-left:2em">&#9702; This, above all, was the main reason for her downfall.</li>
  </ul>
</li>
</ul>

<h3>Balban (1266&#8211;86)</h3>
<p>Balban began his career as a <strong>mamluk foot soldier</strong> in Ghori&#8217;s army.</p>
<ul>
<li>&#8226; The Sultan realised his potential and groomed him for command. He displayed a natural spark for leadership and rose quickly through the ranks.</li>
<li>&#8226; During the <strong>Shamsi period</strong> (Iltutmish&#8217;s reign), he was a <strong>leading member of the Chihalgani, later serving as Naib</strong> (prime minister) during the reign of his son-in-law Nasiruddin Mahmud.
  <ul>
  <li style="padding-left:2em">&#9702; Since the king was weak and irresolute, Balban emerged as the <strong>de facto ruler</strong>.</li>
  </ul>
</li>
<li>&#8226; After serving as Wazir for almost 20 years, it is believed that <strong>he had the Sultan poisoned to death</strong> and took up the mantle of kingship himself.</li>
</ul>

<h4>Challenges before Balban</h4>
<p>A proper evaluation of the achievements of Balban can be done in context of problems that Balban had to face. At the time of his coronation Balban faced a number of challenges -</p>
<ul>
<li>&#8226; During the period following Iltutmish&#8217;s reign, the <strong>crown&#8217;s power and prestige</strong> had deteriorated considerably.
  <ul>
  <li style="padding-left:2em">&#9702; The Shamsi nobility had emerged as <strong>kingmakers.</strong></li>
  <li style="padding-left:2em">&#9702; During the weak rule of Nasiruddin Mahmud, they had become over ambitious and unruly, openly defying the Sultan.</li>
  <li style="padding-left:2em">&#9702; This resulted in <strong>frequent revolts and rebellions</strong>.
    <ul>
    <li style="padding-left:4em">&#9632; Eg. Turghil Khan, the governor of Bengal had rebelled and declared independence.</li>
    </ul>
  </li>
  </ul>
</li>
<li>&#8226; <strong>Rajput Rebellions and Meo Issue</strong>
  <ul>
  <li style="padding-left:2em">&#9702; The breakdown of political machinery was reflected in the deteriorating law and order situation.</li>
  <li style="padding-left:2em">&#9702; Robbery became commonplace and fear of the law had virtually evaporated.</li>
  <li style="padding-left:2em">&#9702; Many Rajput states of the Gangetic valley were also in open rebellion.</li>
  </ul>
</li>
<li>&#8226; The problem of <strong>continuous Mongol invasions</strong> on the North-West border of India.
  <ul>
  <li style="padding-left:2em">&#9702; The army was in shambles. As a result, the empire&#8217;s frontiers were poorly defended.</li>
  <li style="padding-left:2em">&#9702; The Mongols repeatedly raided Lahore and Multan and reached the outskirts of Delhi on several occasions.</li>
  </ul>
</li>
</ul>

<h4>Balban&#8217;s Response</h4>
<ul>
<li>&#8226; In order to prevent the empire&#8217;s disintegration, Balban realised that the <strong>crown&#8217;s prestige</strong> and <strong>respect for authority</strong> must be restored.
  <ul>
  <li style="padding-left:2em">&#9702; <strong>Despotism</strong> became a central feature of his policy.</li>
  </ul>
</li>
<li>&#8226; Further, he required a <strong>legitimising principle</strong> to justify his accession to the throne.</li>
<li>&#8226; The Sultanate needed to be <strong>strengthened from within</strong> to protect it from foreign threats.</li>
</ul>

<h4>Theory of Kingship</h4>
<p>He propounded a new theory of kingship in order to tackle the problem of the <strong>Turkan-i-Chahalgani, legitimise his rule and ensure dynastic succession.</strong></p>
<ul>
<li>&#8226; Balban claimed that kingship had a <strong>semi-divine origin</strong>.
  <ul>
  <li style="padding-left:2em">&#9702; According to him, the office of the Sultan was <strong>&#8216;Niyabat-i-Khudai&#8217;</strong> (gift of God). No ordinary person can receive this gift. It requires a man of extraordinary capability and piety.
    <ul>
    <li style="padding-left:4em">&#9632; Thus, he took the title <strong>&#8216;Zilullah&#8217;</strong> (shadow of God).</li>
    </ul>
  </li>
  <li style="padding-left:2em">&#9702; In order to inspire high respect for the Crown, Balban also adopted Persian court rituals such as the <strong>&#8216;Sijda&#8217; and &#8216;Paibos&#8217;</strong>.</li>
  <li style="padding-left:2em">&#9702; Nobles had to maintain the proper <strong>decorum</strong> in the court. They had to appear in court in proper dress.
    <ul>
    <li style="padding-left:4em">&#9632; An official <strong>Amir-e-Hajib</strong> was appointed to strictly implement court discipline.</li>
    </ul>
  </li>
  </ul>
</li>
<li>&#8226; Balban also insisted on the principle that <strong>&#8216;Kingship knows no kinship&#8217;</strong> i.e. impartial justice.
  <ul>
  <li style="padding-left:2em">&#9702; To gain the support of common masses he gave emphasis over justice. Through this measure he tried to give a human face to his despotic regime.</li>
  </ul>
</li>
<li>&#8226; He adopted a <strong>two-pronged policy towards the Chalisa</strong>
  <ul>
  <li style="padding-left:2em">&#9702; <strong>&#8216;Blood and Iron&#8217;</strong> was a reflection of Balban&#8217;s despotism.
    <ul>
    <li style="padding-left:4em">&#9632; To break the power of the Turkan-i-Chahalgani, he transferred some of the members from one region to another. He also killed some of them and punished some others.</li>
    <li style="padding-left:4em">&#9632; All political opposition was ruthlessly suppressed and rebellion was subdued with extreme prejudice.</li>
    <li style="padding-left:4em">&#9632; Any opposition to the Sultan&#8217;s rule was regarded as high treason and as a violation to the will of God.</li>
    </ul>
  </li>
  <li style="padding-left:2em">&#9702; At the same time, he emphasised upon the <strong>racial superiority</strong> of Turkish blood.
    <ul>
    <li style="padding-left:4em">&#9632; According to him, Turks had the exclusive right to rule.</li>
    </ul>
  </li>
  <li style="padding-left:2em">&#9702; Thus, in the same instance, he emerged as the protector and destroyer of the Shamsi nobility.</li>
  </ul>
</li>
<li>&#8226; Balban also insisted on <strong>dynastic succession</strong>. He claimed descent from Afrasiyab (a mythical Persian hero).
  <ul>
  <li style="padding-left:2em">&#9702; Further, in the style of Persian royalty, he named his sons and grandsons after great Persian Kings such as Qaiqubad and Kaykhusraw.</li>
  </ul>
</li>
<li>&#8226; To portray himself as superior to ordinary men, he also affected a <strong>remarkable change in his appearance and habits.</strong></li>
</ul>

<h4>Military Reforms</h4>
<ul>
<li>&#8226; To maintain and perfect the <strong>despotic and coercive instrument</strong> in the authority of the crown, it was essential to maintain a <strong>strong centralised army.</strong>
  <ul>
  <li style="padding-left:2em">&#9702; Therefore, he increased the numerical strength of his army.</li>
  <li style="padding-left:2em">&#9702; He also enhanced the soldiers&#8217; pay and gave some of them the assignment of villages as salary.</li>
  <li style="padding-left:2em">&#9702; Military exercises were more regular.</li>
  <li style="padding-left:2em">&#9702; Changes in strategy, like keeping the objectives of campaigns a close secret, were also implemented.</li>
  </ul>
</li>
<li>&#8226; In order to create a powerful military base he created a new department <strong>&#8216;Diwan-e-Arz&#8217;</strong> under an official &#8216;Ariz-e-Mumalik&#8217; responsible for military administration.</li>
</ul>

<h4>Mongol Policy</h4>
<ul>
<li>&#8226; He laid the foundation of the Mongol policy of the Delhi Sultanate. In fact he adopted a <strong>two pronged strategy</strong> against them-
  <ul>
  <li style="padding-left:2em">&#9702; He exchanged <strong>embassies</strong> with the Mongol courts.</li>
  <li style="padding-left:2em">&#9702; He created <strong>two defence lines</strong> in order to repulse Mongol invasion.
    <ul>
    <li style="padding-left:4em">&#9632; The first defence line was created along the regions of Lahore, Multan and Dipalpur. He appointed his son prince Muhammad as the warden of the marches.</li>
    <li style="padding-left:4em">&#9632; The second defence line was laid in Samana, Sunam and Bhatinda. Buhgra Khan, his youngest son, was appointed on this defence line.</li>
    </ul>
  </li>
  </ul>
</li>
</ul>

<h4>Office of Khwaja</h4>
<ul>
<li>&#8226; In order to have better supervision of the income of the Iqta he appointed an officer &#8216;Khwaja&#8217; in the Iqtas.</li>
</ul>

<h4>Spy System</h4>
<ul>
<li>&#8226; He organised the espionage system. This department was placed under an officer <strong>&#8216;Barid-i-Mumalik&#8217;</strong>.</li>
</ul>

<h4>Response to the Law and Order and Rajput Problems</h4>
<ul>
<li>&#8226; In order to restore the law and order situation he <strong>constructed some forts</strong> in Delhi and nearby regions and <strong>appointed Afghan mercenaries</strong> on these forts.</li>
<li>&#8226; Likewise, <strong>in the Gangetic basin he repaired some old forts and constructed some new ones</strong> at Jalali, Patiali and Gopalpur etc., so that the revolt of Rajputs and Meo menace could be suppressed.</li>
<li>&#8226; In this way he restored the law and order situation in the vast region of North India.</li>
</ul>

<h4>Response to the revolt of Turghil Khan</h4>
<ul>
<li>&#8226; The revolt by the governor of Bengal, Tughril Khan was a big challenge to him because it was associated with the <strong>principle of royal supremacy over the nobility</strong>.
  <ul>
  <li style="padding-left:2em">&#9702; Earlier he sent two military expeditions against Tughril. But these were unsuccessful.</li>
  <li style="padding-left:2em">&#9702; So he himself took the command against Bengal.</li>
  </ul>
</li>
<li>&#8226; He adopted the <strong>policy of terror</strong> against Tughril.
  <ul>
  <li style="padding-left:2em">&#9702; Tughril Khan was killed with the members of his family.</li>
  <li style="padding-left:2em">&#9702; It was meant as a lesson to the recalcitrant provincial governors.</li>
  </ul>
</li>
<li>&#8226; The Bengal campaign to subjugate Tughril ultimately led to the <strong>consolidation</strong> of the empire.</li>
</ul>

<h4>Limitations</h4>
<ul>
<li>&#8226; In spite of his best efforts he <strong>couldn&#8217;t stabilise his dynasty</strong> and just three years after his death, it was uprooted.</li>
<li>&#8226; He gave too much emphasis over <strong>racial exclusiveness</strong>. As a result of this the social basis of the state shrank.</li>
<li>&#8226; Overall the <strong>Mongol policy</strong> was also not successful because the frontier in the northwest receded from Indus river to Beas river.</li>
<li>&#8226; In the course of implementation of his policies he showed <strong>excessive cruelty</strong>.</li>
</ul>

<h4>Conclusion</h4>
<ul>
<li>&#8226; In spite of these limitations, we can&#8217;t diminish his achievements. He was the <strong>consolidator</strong> of Delhi Sultanate.</li>
<li>&#8226; It is true that he <strong>didn&#8217;t take interest in political expansion</strong> and rather gave priority to the consolidation of his state but it was equally true that it was due to this consolidation that the <strong>future expansion of Delhi Sultanate became possible.</strong>
  <ul>
  <li style="padding-left:2em">&#9702; He <strong>restored law and order</strong> in the Gangetic basin that was one of the most productive regions in the world.
    <ul>
    <li style="padding-left:4em">&#9632; So it led to <strong>economic growth</strong> in the region.</li>
    </ul>
  </li>
  <li style="padding-left:2em">&#9702; That&#8217;s why we can not deny that <strong>it was Balban who laid the foundation of Khilji imperialism.</strong></li>
  </ul>
</li>
</ul>

<h2>Mongol Policy under Sultans of Delhi</h2>
<p>KA Nizami has divided the Mongol policy of the Delhi Sultans into three phases-</p>
<ol>
<li>The policy of <strong>avoidance/ aloofness</strong> under Iltutmish</li>
<li>The policy of <strong>appeasement</strong> under Razia to Nasiruddin</li>
<li>The policy of <strong>resistance</strong> from Balban to Alauddin Khilji</li>
</ol>

<h4>Iltutmish-</h4>
<ul>
<li>&#8226; He dissociated himself from the politics of central and West Asia by refusing the asylum to Prince Jalaluddin Mangbarni of Khwarizm. In this way he maintained <strong>aloofness</strong>.</li>
</ul>

<h4>Razia to Nasiruddin Muhammad-</h4>
<ul>
<li>&#8226; During the period of Iltutmish, Mongol invasion didn&#8217;t take place.
  <ul>
  <li style="padding-left:2em">&#9702; It was due to the fact that Mongols were busy in the region of Central and West Asia.</li>
  <li style="padding-left:2em">&#9702; But <strong>after Iltutmish they moved towards India</strong>.</li>
  </ul>
</li>
<li>&#8226; The first Mongol invasion of Hindustan took place under <strong>Tair Bahadur in 1241</strong>.</li>
<li>&#8226; As the Delhi Sultanate at that time couldn&#8217;t match the Mongol force so the policy of <strong>appeasement</strong> was adopted towards them.
  <ul>
  <li style="padding-left:2em">&#9702; It involved maintaining diplomatic relations with the Mongols and recognising their nominal superiority.</li>
  </ul>
</li>
<li>&#8226; But this policy <strong>didn&#8217;t succeed as the Mongols were divided into different groups</strong>.
  <ul>
  <li style="padding-left:2em">&#9702; So even after engaging diplomatically with one group there was no guarantee of safety from another group of invaders.</li>
  </ul>
</li>
</ul>

<h2>Iqta System</h2>
<p>Under the Delhi Sultanate, territory was divided between <strong>Khalisa and Iqta</strong> land. Khalisa was the Crown land. The income from this land went directly into the royal treasury. On the other hand, <strong>Iqta developed as a substitute for provincial administration</strong>. The literal meaning of Iqta is a tract of land and the holder of Iqta was called Muqti.</p>

<h4>Objectives behind Iqta system</h4>
<ol>
<li>To ensure surplus production from far off regions reached the treasury.</li>
<li>To synthesise the state interests and the personal ambition of nobles.</li>
</ol>

<h4>Functioning of Iqta system</h4>
<p>An officer was appointed in an Iqta. He was called Muqti and was supposed to collect revenue from the region and to spend part of the revenue in the maintenance of administration as well as military structure. But the remaining amount known as &#8216;Fawazil&#8217; was transferred to the royal treasury.</p>

<h4>Contributions:-</h4>
<ul>
<li>&#8226; It secured revenue for the royal treasury from remote areas</li>
<li>&#8226; It emerged as an instrument of administrative centralization</li>
<li>&#8226; The prevailing feudal structure was also suppressed through the Iqta system.</li>
<li>&#8226; It helped in the maintenance of a strong army.</li>
<li>&#8226; Iqta system also helped in the consolidation and expansion of the empire.
  <ul>
  <li style="padding-left:2em">&#9702; Through the Iqta system even remote areas could be linked to the centre.</li>
  <li style="padding-left:2em">&#9702; Further, sometimes even Muqtis used to take some steps for the expansion of the empire.</li>
  </ul>
</li>
<li>&#8226; In the spread of Islamic culture as well, the Iqta system played some role.
  <ul>
  <li style="padding-left:2em">&#9702; Even provincial Muqtis patronised scholars, poets and artists.</li>
  </ul>
</li>
</ul>

<h4>Limitations:-</h4>
<ul>
<li>&#8226; Competition over surplus between the Sultan and the Muqtis led to tensions within the empire.</li>
<li>&#8226; The interlinkage of the aristocracy and provincial power with land led to the emergence of centrifugal tendencies.</li>
</ul>

<h4>Was the Iqta system feudal in structure?</h4>
<ul>
<li>&#8226; Some scholars try to characterise the Iqta system as feudal in nature and compared it with the European fief (Jagir) that was given on <strong>hereditary</strong> basis.</li>
<li>&#8226; They also tried to prove that under Delhi Sultanate there was some sort of <strong>hierarchy</strong> in the administrative structure e.g. the Sultan, Muslim nobles, then Hindu nobles, Soldiers etc.</li>
</ul>
<p>But when we observe minutely we find that in the Iqta system, some important features of feudalism were missing, i.e.-</p>
<ul>
<li>&#8226; Normally under feudalism, the <strong>King&#8217;s position</strong> was weak but under the Delhi Sultanate many sultans enjoyed too much power.</li>
<li>&#8226; Under feudalism Jagir was <strong>hereditary</strong> but Iqta was not.
  <ul>
  <li style="padding-left:2em">&#9702; Under feudalism the nobles are hereditary but under the Delhi Sultanate there was always an influx of new elements from Central and West Asia. Therefore, old elements were replaced by new ones, so there wasn&#8217;t scope for hereditary nobles.</li>
  </ul>
</li>
<li>&#8226; Under the Sultanate, the <strong>nobility was not an immutable and permanent institution.</strong>
  <ul>
  <li style="padding-left:2em">&#9702; Its composition was fluid and Sultans had the power to elevate outsiders into the aristocracy. In fact, they used this feature to check the power of the nobility.</li>
  </ul>
</li>
</ul>

<h4>Working of Iqta system under different sultans</h4>
<ul>
<li>&#8226; It was <strong>Iltutmish</strong> who systematised the Iqta system in India.
  <ul>
  <li style="padding-left:2em">&#9702; He divided the vast region between Multan and Lakhnauti and distributed it among different nobles.</li>
  <li style="padding-left:2em">&#9702; These nobles were called Muqtis.</li>
  <li style="padding-left:2em">&#9702; But there was a big challenge before the Sultan - how to ensure Fawazil from Iqta to the central treasury. So different Sultan solved it in their own respective way.</li>
  </ul>
</li>
<li>&#8226; <strong>Balban</strong> appointed an officer Khwaja to supervise income and expenditure from Iqta.</li>
</ul>

<h2>Land Revenue System</h2>
<ul>
<li>&#8226; Under Delhi Sultanate the theoretical basis of the land revenue administration was provided by a text <strong>&#8216;Kitab-ul-Kharaj&#8217;</strong> which was composed by Abu Yakub, a Qazi from Baghdad.</li>
<li>&#8226; But in practice, the land revenue policy of the sultanate was <strong>influenced by Indian elements</strong> as well.</li>
<li>&#8226; Due to <strong>practical compulsions, early sultans avoided making a direct intervention</strong> in the land revenue system.
  <ul>
  <li style="padding-left:2em">&#9702; Rather they preferred to take a <strong>lump-sum amount</strong> from Hindu nobles per annum.</li>
  </ul>
</li>
</ul>

<h2>Historical Chronicles as the source of study for Delhi Sultanate</h2>
<ul>
<li>&#8226; Unlike early medieval age for the study of which we mainly depend on the epigraphic (inscriptions) and numismatic evidence, for the study of Delhi Sultanate, a <strong>large number of historical chronicles are available</strong> which came to be known as the <strong>Tawarikh</strong>.</li>
<li>&#8226; Tawarikh is a type of <strong>court narrative</strong> describing important political events and actions of the ruling class.</li>
<li>&#8226; If we explore the <strong>pre-Turkish texts</strong>, we find that <strong>except</strong> for Kalhan&#8217;s <strong>Rajtarangini</strong>, such literature is <strong>missing</strong>. So, writing purely historical chronicles is supposed to be a grand contribution of Islam in India.</li>
<li>&#8226; Naturally, a question arises, which <strong>factors</strong> worked as the stimulus behind the composition of such historical chronicles? When we observe minutely, we find several factors behind it-
  <ul>
  <li style="padding-left:2em">&#9702; One important factor was the tradition of the <strong>Quran</strong> itself. In fact, the Quran <strong>encouraged the temperament of narrating events that influenced the intellectual tradition of the age.</strong></li>
  <li style="padding-left:2em">&#9702; The second factor was that in Islam, to <strong>narrate the events associated with the life of the Prophet and Caliphs was supposed to be sacred work</strong>. So, obviously, it encouraged history writing.</li>
  <li style="padding-left:2em">&#9702; Third, under the rule of the <strong>Caliphs</strong>, <strong>economic prosperity emerged</strong>. So, it became easy to give <strong>patronage</strong> to a large number of scholars. Such a tendency definitely encouraged intellectual activities.</li>
  <li style="padding-left:2em">&#9702; Fourth, Islam was also influenced by the <strong>intellectual tradition of the Byzantine and Sassanian Empire</strong>, which valued the narration of events.</li>
  <li style="padding-left:2em">&#9702; Fifth, with the <strong>rise of early Turkish monarchs</strong> such as Mahmud of Gazni, recording events associated with their lives was also encouraged.
    <ul>
    <li style="padding-left:4em">&#9632; For example, it was under Mahmud Gazni that Firdausi composed his first famous history chronicle <strong>&#8216;Shahnama&#8217;</strong>. This text was associated with Persian renaissance.</li>
    </ul>
  </li>
  <li style="padding-left:2em">&#9702; Later the <strong>same tradition was adopted by the Sultans of Delhi</strong> as well, who gave patronage to important scholars in their court and encouraged them to record the events which speak about the achievements of their period.</li>
  </ul>
</li>
<li>&#8226; Islamic history writing can be divided into <strong>two phases</strong>.
  <ul>
  <li style="padding-left:2em">&#9702; The first phase first was associated with early <strong>Arabic</strong> history writing which hovers around the life of the Prophet and the Caliphs and</li>
  <li style="padding-left:2em">&#9702; The second phase was linked with <strong>Persian</strong> writing which started with Shahnama of Firdausi and continued under Sultans of Delhi.</li>
  </ul>
</li>
<li>&#8226; The early Persian text, which recorded the success of Turks and the foundation of Delhi Sultanate, was <strong>&#8216;Taj-ul-Masir&#8217;</strong> by <strong>Hassan Nizami</strong>, a court historian of Aibak.</li>
<li>&#8226; The <strong>&#8216;Tabakat-i-Nasari&#8217;</strong> of <strong>Minhaj-us-Siraj</strong> continued the story. Siraj was a court chronicle of Iltutmish and his son Nasiruddin Mahmud.</li>
<li>&#8226; Then Barani&#8217;s <strong>&#8216;Tarikh-i-Firozshahi&#8217;</strong> appeared almost as a sequel to Tabkat-i-Nasiri.</li>
<li>&#8226; In the same manner, <strong>&#8216;Tarikh-i- Firozshahi&#8217;</strong> of <strong>Afif</strong> continues the story.</li>
<li>&#8226; In this tradition, we find other chronicles also e.g. <strong>&#8216;Tarikh-i- Mubarakshahi&#8217;</strong> of Yahiya-bin-Ahmad <strong>Sarhindi</strong> and the <strong>&#8216;Futuh-us- Salatin&#8217;</strong> of <strong>Isami.</strong></li>
</ul>

<h4>Limitations of court Chronicles/Tawarikhs</h4>
<ul>
<li>&#8226; For modern historians, <strong>Tawarikhs are a very attractive source</strong> of history. They represent a <strong>ready-made historical narrative</strong>, recorded by professional contemporary historians. On closer observation, we discover that such texts have their own <strong>pitfalls</strong>.
  <ul>
  <li style="padding-left:2em">&#9702; Peter Hardy, believes that such readymade historical texts <strong>may dull our critical insight</strong> while analysing the facts of history.</li>
  </ul>
</li>
<li>&#8226; Normally, <strong>historians take such chronicles to be contemporary and authentic</strong> sources, but they <strong>ignore the bias</strong> of their creators.
  <ul>
  <li style="padding-left:2em">&#9702; <strong>E.H. Carr</strong> has emphasised that an <strong>author can&#8217;t be evaluated without knowing his political and social background</strong>.</li>
  </ul>
</li>
<li>&#8226; Therefore, while making a study of any historical work, a historian must consider the political, social and economic milieu in which it was created. The motivations of the author and his personal bias must also be accounted for. This is true about the Delhi Sultanate as well.</li>
</ul>

<h2>Art and Architecture during Delhi Sultanate &#8212; Phase 1 (Ilbari &amp; Khalji)</h2>

<h4>Introduction:</h4>
<ul>
<li>&#8226; The Central Asian tradition of architecture brought by the sultans to India is sometimes styled as &#8216;Islamic architecture&#8217; which is rather a misnomer.</li>
<li>&#8226; Arabia, where Islam took its birth, had no architectural traditions.
  <ul>
  <li style="padding-left:2em">&#9702; The only structure of architectural interest, prevalent in that land, was &#8216;the roofless caravan serai&#8217; built in a rectangular form with a gate and guard&#8217;s post and small chambers, protected by a strong peripheral wall.</li>
  <li style="padding-left:2em">&#9702; Of course, it left a distinct mark on the infant Islamic culture; the mosque is a replica of this &#8216;caravan serai&#8217; with the additional provision of a prayer niche in the wall, situated opposite to the main gate.</li>
  </ul>
</li>
<li>&#8226; Early Islamic architecture under the Arabs was nothing but an adaptation of indigenous elements, borrowed from the various nations which they overcame to the requirements of their religion.</li>
</ul>

<h4>Difference Between Indigenous and &#8216;Islamic&#8217; Architecture:</h4>
<ul>
<li>&#8226; Broadly speaking, the indigenous architecture was based on the general principle of <strong>&#8216;beam and bracket&#8217;</strong> which enabled the construction of vast and sprawling building complexes of almost any dimension.
  <ul>
  <li style="padding-left:2em">&#9702; It was made possible by the erection of narrow columns and pillars, long beams and corbelled brackets to support the flat roofs to which any number of storeys could be added.</li>
  <li style="padding-left:2em">&#9702; In technical language, this style is called <strong>&#8216;trabeate&#8217;</strong> which implies the use of rows of pillars and long beams, instead of arches and vaults, to span the spaces.</li>
  </ul>
</li>
<li>&#8226; On the other hand &#8216;the Islamic style&#8217; was <strong>&#8216;arcuate&#8217;</strong> (bent like a bow or arched) which employed arches and vaults to bridge the spaces and envisaged the construction of graceful domes in place of flat roofs. This was the basic difference between the two art styles.</li>
<li>&#8226; The other distinguishing features of the two art styles are-
  <ul>
  <li style="padding-left:2em">&#9702; The &#8216;solidarity and grace&#8217; of Indian architecture; these two virtues were readily adopted by the sultans of Delhi in their building activities.</li>
  <li style="padding-left:2em">&#9702; The &#8216;Hindu style&#8217; of ornamentations, though very rich in character was &#8216;expressive of natural, particularly human forms&#8217;</li>
  <li style="padding-left:2em">&#9702; On the other hand, &#8216;the decoration of the Muslims&#8217; under religious injunction, avoided representation of living beings and took the form of flat surface ornament depicting arabesque or geometrical and floral patterns etc. However, these antitheses when drawn together served to enrich a new style that was peculiarly Indian.</li>
  </ul>
</li>
</ul>

<h4>Cultural Synthesis:</h4>
<ul>
<li>&#8226; A synthesis of the two styles seemed logical for the Turkish conquerors, who were few in number, and who had the necessity to employ Indian artisans and sculptors for the construction of their buildings.</li>
<li>&#8226; The Indian workers, with a rich experience of the indigenous styles, forms and methods of construction, introduced consciously or unconsciously, Indian architectural designs and decorative details.</li>
<li>&#8226; The Turkish rulers made extensive use of the rich architectural materials obtained by the destruction and demolition of the Hindu temples and converted them into mosques by simply demolishing their roofs and idolatrous features and erecting domes and minarets in their place.</li>
<li>&#8226; As a consequence, a blending of the two styles was a natural corollary. In spite of the apparent differences, there were some features common to both, e.g. the use of the open courtyard encompassed by corridors.</li>
<li>&#8226; Consequently, the <strong>Indo-Islamic style</strong> as it developed was neither a form of Islamic art nor a modification of the Hindu art but an amalgamation of the two concepts to suit their environments and needs.</li>
<li>&#8226; It was purely Indian in composition. Ferguson has enumerated twelve to fifteen such styles that varied from region to region. Of these, the foremost were the styles of Delhi and Ajmer, Jaipur, Gujarat, Malwa, Bengal and Gulbarga.</li>
</ul>

<h4>3 Phases</h4>
<p>The growth and development of the &#8216;Indo-Islamic&#8217; architecture during the sultanate period took place in three phases.</p>
<ul>
<li>&#8226; During the first phase buildings were constructed at Lahore, Ajmer and Delhi by the Ilbari and the Khalji monarchs.</li>
<li>&#8226; The construction of buildings by the Tughlaqs constitutes the second phase, quite distinct from the earlier phase.</li>
<li>&#8226; The construction of architectural monuments by the sultans of Delhi suffered a setback after the downfall of the Tughlaq dynasty; albeit, by this time, the architectural activities had shifted to the provincial and regional capitals of the sultanate whose governors, particularly after declaring their independence. This marked the third phase of development of architecture during the period under review.</li>
</ul>

<h4>First Phase: Ilbari and Khalji dynasty</h4>
<ul>
<li>&#8226; At first, from 1200 to 1246 CE, the Turks seemed to find readymade mosques in the courts of the Jaina temples. They only had to remove the existing structure in the middle and erect a new wall on the west, adorned with &#8216;Mihrabs&#8217; pointing the way to Mecca.</li>
<li>&#8226; Later, they began to erect a series of arches in front of the Jaina pillars and to have them carved by Indian artisans in a rich and intricate style with mixed natural and religious motifs.
  <ul>
  <li style="padding-left:2em">&#9702; There are two early mosques, the Quwat-ul-Islam mosque at Delhi and the Arhai-Din-Ka-Jhopra at Ajmer, built mainly out of old Jaina and Hindu temples.</li>
  </ul>
</li>
<li>&#8226; Iltutmish added two wings to the prayer chamber and enlarged the outer court which included the Qutub Minar.
  <ul>
  <li style="padding-left:2em">&#9702; While he made more use of Islamic ideas, especially the weaving of sacred texts with geometrical patterns, nevertheless, Hindu patterns were still used.</li>
  </ul>
</li>
<li>&#8226; The outstanding Ilbari monument, <strong>Qutub Minar</strong>, is a tribute to the constructive genius of the times, which was completed by Iltutmish and later repaired by other sultans. In fact, the Qutub group of mosques with tapering towers, and beautiful blending of calligraphic inscriptions with geometrical designs, comprise the best example of Delhi style.</li>
<li>&#8226; The <strong>tomb of Iltutmish</strong>, built by the sultan during his lifetime near the Quwat-ul-Islam mosque, is a beautiful monument of the Persian art. It contains a single chamber, made up of red sandstone with an outer layer of grey granite. It had arched entrances on three sides and a mehrab, flanked by two small arched entrances on the fourth side.</li>
<li>&#8226; An entirely different type of tomb was built by Iltutmish on the grave of his son Nasiruddin Mahmmud called <strong>&#8216;Sultan Garhi&#8217;</strong>. Its exterior is made of grey granite stone and white marble while its inner base is octagonal in form and the roof is supported by beautiful pillars with decorative capitals and arches of the Hindu architectural designs.</li>
<li>&#8226; <strong>Balban&#8217;s tomb</strong>, situated to the south-East of &#8216;Oila-i-Rai Pithaura&#8217; is a square chamber, covered by a dome which has doorways on all sides. It is also furnished with the arches of the hindu style.</li>
<li>&#8226; The Khalji&#8217;s continued the slave policy of building. Alauddin Khilji prepared an elaborate plan for the extension of the architectural complex in the Qutub area. <strong>Alai Darwaza</strong> &#8216;a treasured gem of islamic architecture&#8217; was completed in 1311 and served as an entrance to the imperial campus.
  <ul>
  <li style="padding-left:2em">&#9702; Its building consisted of a square hall, covered by a dome, with arched doorways on each of its four sides. It is made of red sandstone, picked out by white marble strips and enriched by calligraphic inscriptions and decorative carvings. It shows that by this time, Indian craftsmen had mastered the alien style of decoration, for the decorative pendentives in this building introduce a fresh style of ornamentation of the older simple Turkish styles. Also, the true arch form is introduced here.</li>
  </ul>
</li>
<li>&#8226; Other important buildings of Alauddin Khalji are <strong>Jamait Khana, Siri, &#8216;Mahal hazar Satoon&#8217;</strong> and <strong>&#8216;Hauz-i-Alai&#8217;</strong>.</li>
</ul>"""

path = 'lib/noteContent.ts'
content = open(path, encoding='utf-8').read()

pattern = r"('thirteenth-century':\s*`)`"
replacement = lambda m: f"'thirteenth-century': `{new_html}`"
new_content, count = re.subn(pattern, replacement, content)

print(f"Replaced {count} occurrence(s).")
open(path, 'w', encoding='utf-8').write(new_content)
