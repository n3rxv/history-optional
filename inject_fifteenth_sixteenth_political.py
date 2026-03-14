import re

new_html = r"""<h2>Mughal Historiography</h2>
<p>Different schools of historiography emerged for interpreting Mughal history.</p>

<h3>1. Imperialist Historiography</h3>
<p>British scholars like <strong>Smith and Elphinstone</strong> were the first to interpret the Mughal period, but they were specifically guided by British colonialism.</p>
<p>Since they had <strong>to justify British rule</strong> in India, they tried to <strong>undermine</strong> the Mughal legacy established by <strong>Akbar</strong> by undermining his achievements <strong>vis-a-vis Sher Shah</strong>.</p>
<p>Apart from that, in the economic field, British scholars like <strong>Moreland</strong> tried to prove that the economy under Mughals wasn&#8217;t in any better condition from that under the British in the 19th century.</p>

<h3>2. Nationalist School</h3>
<p>We can divide the nationalist school of historiography into two parts or subgroups-</p>
<ul>
<li>&#8226; (a) Communal historiography</li>
<li>&#8226; (b) Secular historiography</li>
</ul>

<h4>(a) Communal historiography:-</h4>
<p>Communal historiography is further divided into two subgroups -</p>

<h4>Hindu Communalist approach:-</h4>
<p>It was promoted by scholars like <strong>Sir Jadunath Sarkar, Aashirvadi Lal Shrivastava</strong>, etc.</p>
<p>The basic premise of their historiography was that due to the <strong>progressive policy of Akbar</strong> there was the <strong>formation of a vast Mughal Empire</strong> but once this policy was <strong>reversed</strong> by Aurangzeb, the Mughal Empire <strong>disintegrated</strong>.</p>
<p>In this way, this historiography <strong>hovers around certain personalities</strong> in the interpretation of the Mughal Empire.</p>

<h4>Muslim Communalist approach:-</h4>
<p>This school was represented by scholars like <strong>I.H. Quraishi</strong> (First historian of Pakistan).</p>
<p>He tried to <strong>demonise Akbar while praising Aurangzeb</strong>.</p>
<p>For example, he emphasised that due to <strong>anti-Muslim policy of Akbar, Hindus became indisciplined.</strong> So, Aurangzeb&#8217;s tough attitude towards Hindus was necessary.</p>

<h4>(b) Secular historiography:-</h4>
<p>Scholars such as <strong>A.K. Majumdar</strong> were products of the national movement. So, naturally, they were anti-British.</p>
<p>They bitterly <strong>criticised the British Empire</strong> but considered it to be the <strong>descendent of the Mughal Empire.</strong> So, in the course of attacking the British Empire, they also attacked Mughals.</p>
<p>That&#8217;s why, they <strong>idolised regional rulers</strong> like Maharana Pratap of Mewar, Maratha King Shivaji and Lachit Borphukan of Assam who fought against Mughals.</p>

<h3>3. Marxist Nationalist School:-</h3>
<p><strong>Aligarh School</strong> of historiography, led by <strong>Mohd. Habib, Noorul Hasan, Athar Ali, Irfan Habib, Shirin Moosvi</strong>, etc. is inspired by the Marxist school.</p>
<p>Certain features of this school are -</p>
<ul>
<li>&#8226; a. This school emphasised the <strong>role of socio-economic factors</strong> rather than the role of personalities.
  <ul>
  <li style="padding-left:2em">&#9702; For example, they emphasised that <strong>socio-economic and administrative crises</strong> like the Jagirdari and Agrarian crisis were more important for the decline of the Mughal Empire, than the activities of certain individuals.</li>
  </ul>
</li>
<li>&#8226; b. It also emphasised upon the <strong>re-evaluation of sources</strong>.
  <ul>
  <li style="padding-left:2em">&#9702; For example, the policies of Akbar can&#8217;t be evaluated simply on the basis of the description by Abul Fazl.</li>
  </ul>
</li>
<li>&#8226; c. Mughal administration was projected as a <strong>centralised structure</strong>.</li>
</ul>

<h3>4. Revisionist School</h3>
<p>Scholars like <strong>Muzaffar Alam, Chetan Singh, Sanjay Subramaniam, P.J. Marshall, Karen Leonard</strong>, etc. have analysed Mughal history in a new light-</p>
<ul>
<li>&#8226; a. According to these historians the <strong>Aligarh School had unconsciously selected one hero and one villain</strong> from Mughal monarchs i.e. Akbar and Aurangzeb while <strong>neglecting others</strong>.</li>
<li>&#8226; b. These scholars have <strong>rejected</strong> the perception of <strong>centralised Mughal administration</strong> and tried to highlight its limitations.</li>
<li>&#8226; c. While interpreting the <strong>decline</strong> of the Mughal Empire, they have also rejected the empire-centric approach of Aligarh school instead they have adopted a <strong>region-centric approach</strong>.</li>
<li>&#8226; d. While <strong>Aligarh</strong> scholars had declared the <strong>first half of the 18th century as the age of crisis</strong>, but the <strong>revisionist</strong> scholars took the first half of the 18th century as the <strong>era of economic prosperity.</strong></li>
</ul>

<h2>BABUR</h2>

<h3>Tuzuk-i-Babari/ Baburnama</h3>
<p>It is the autobiography of Babur, written as a journal in Chagatai Turk.</p>
<ul>
<li>&#8226; It was translated into Persian by two scholars.
  <ul>
  <li style="padding-left:2em">&#9702; <strong>Painda Khan</strong></li>
  <li style="padding-left:2em">&#9702; <strong>Abdul Rahim Khan-i-Khana</strong></li>
  </ul>
</li>
<li>&#8226; Only 18 years of his life survived in the work.</li>
<li>&#8226; The language used is simple yet incisive.
  <ul>
  <li style="padding-left:2em">&#9702; Babur has written about himself with great candour.
    <ul>
    <li style="padding-left:4em">&#9632; He has not tried to hide his shortcomings.</li>
    <li style="padding-left:4em">&#9632; Neither did he try to hide his father&#8217;s weakness.</li>
    </ul>
  </li>
  </ul>
</li>
<li>&#8226; Other than being an important source of history, Baburnamah is considered to be a literary marvel in its own right.</li>
<li>&#8226; The work may broadly be divided into 3 parts.</li>
</ul>

<h4>First part-</h4>
<ul>
<li>&#8226; It deals with his <strong>formative years and youth</strong>.</li>
<li>&#8226; Babur informs us that he was born in 1483 in Ferghana.</li>
<li>&#8226; He inherited his kingdom at the age of 12.</li>
<li>&#8226; This part also covers his <strong>struggle and defeat to his rivals in Central Asia</strong>.
  <ul>
  <li style="padding-left:2em">&#9702; The battles of <strong>Samarkand</strong> and <strong>Bukhara</strong> have been mentioned.</li>
  <li style="padding-left:2em">&#9702; Babur, informs us of his mistakes that led to the losses and his ultimate expulsion.</li>
  </ul>
</li>
<li>&#8226; He also tells us of his <strong>conquest of Kabul (1504) and Kandhar in (1522)</strong>.</li>
<li>&#8226; He informs us that he was <strong>invited to India by the disgruntled nobles of Ibrahim Lodhi and other Indian rulers</strong> such as,
  <ul>
  <li style="padding-left:2em">&#9702; Daulat Khan Lodhi</li>
  <li style="padding-left:2em">&#9702; Adil Khan Lodhi</li>
  <li style="padding-left:2em">&#9702; Dilawar Khan Lodhi</li>
  <li style="padding-left:2em">&#9702; Rana Sangha</li>
  </ul>
</li>
</ul>

<h4>Second Part-</h4>
<ul>
<li>&#8226; It talks about Indian rulers and Babur&#8217;s clashes with them.</li>
<li>&#8226; Babur has mentioned 5 Indian rulers:
  <ul>
  <li style="padding-left:2em">&#9702; <strong>Ibrahim Lodhi- Delhi</strong> - Babur has praised him, but also called him novice.</li>
  <li style="padding-left:2em">&#9702; <strong>Bahadur Shah- Gujrat</strong></li>
  <li style="padding-left:2em">&#9702; <strong>Nusrat Shah- Bengal</strong></li>
  <li style="padding-left:2em">&#9702; <strong>Rana Sanga- Mewar</strong></li>
  <li style="padding-left:2em">&#9702; <strong>Krishna Deva Raya- Vijayanagra</strong> - Babur has praised him the most, and called him the ablest administrator and best general among all Indian kings.</li>
  </ul>
</li>
</ul>

<h4>Third Part-</h4>
<ul>
<li>&#8226; Here, Babur discusses <strong>India, its flora, fauna, climate, people and diverse culture</strong>. He appears to be a better writer in this part.
  <ul>
  <li style="padding-left:2em">&#9702; He is pleased with India&#8217;s animals, especially the elephant which he encountered for the first time.</li>
  <li style="padding-left:2em">&#9702; He was very fond of mangoes.</li>
  <li style="padding-left:2em">&#9702; He was surprised to see India&#8217;s wealth, and used the terms &#8220;lakh&#8221;, &#8220;crore&#8221;, and &#8220;arab&#8221; to describe it.</li>
  <li style="padding-left:2em">&#9702; However, he did not like India&#8217;s hot and humid climate.</li>
  <li style="padding-left:2em">&#9702; According to him, Indians lack a sense of fashion, and they &#8216;roamed around naked&#8217;.</li>
  <li style="padding-left:2em">&#9702; He says that Indian cities did not have gardens like those in Central Asia and Persia.</li>
  <li style="padding-left:2em">&#9702; He also misses his favourite flowers, the Jasmine and the Rose.</li>
  <li style="padding-left:2em">&#9702; He was extremely displeased with the lack of quality wines in India</li>
  </ul>
</li>
</ul>

<h4>Important battles in India-</h4>
<ul>
<li>&#8226; <strong>1526</strong> - Battle of <strong>Panipat</strong> against <strong>Ibrahim Lodhi.</strong></li>
<li>&#8226; <strong>1527</strong> - Battle of <strong>Khanwa</strong> against <strong>Rana Sanga,</strong> near Fatehpur Sikri (declared as jihad).</li>
<li>&#8226; <strong>1528</strong> - Battle of <strong>Chanderi</strong> against <strong>Medni Rai</strong>, another Rajput chief.</li>
<li>&#8226; <strong>1529</strong> - Battle of <strong>Ghaggar</strong> (Bihar) against the <strong>Afghans</strong>, led by Mohammed Lodhi.</li>
</ul>

<h3>Emergence of Babur</h3>
<p>Babur became the ruler of <strong>Fergana</strong> (1494) at a young age when his father Omar Shaikh Mirza died accidentally.</p>
<p>Babur was ambitious since childhood. He was <strong>eyeing Samarkand</strong> which was under his uncle, the ruler of Herat. So he attacked Samarkand but his uncle defeated him with the help of the Uzbek ruler, Saibani Khan Uzbek.</p>
<p>Babur, later, succeeded in conquering Samarkand with the <strong>help of the Shia Safavid ruler,</strong> Shah Ismail, although very soon he vacated it.</p>

<h4>Impact of Central Asian politics on the Mughals</h4>
<p>The Mughal rulers themselves were Sunni, but since they were allies of the Shia Safavid Empire, they <strong>distanced themselves from both the Sunni alliance (Uzbek and Ottoman Empire) and Sunni fanaticism.</strong></p>

<h3>Babur&#8217;s Invasion</h3>
<p>Babur writes in the Tuzuk-i-Baburi right from his conquest of Kabul (1504) he dreamed of ruling India.</p>

<h4>Reason</h4>
<ol>
<li>Kabul was economically backward, so Babur was attracted towards <strong>India&#8217;s wealth</strong>.</li>
<li>North India was <strong>politically fragmented</strong> and the Afghan nobles were in a power struggle against the Sultan.</li>
<li>As the legitimate <strong>successor of Timur</strong>, Babur had a claim over Punjab.</li>
</ol>

<h4>Babur&#8217;s conquest of Hindustan-</h4>
<p>His campaign started with the battle of <strong>Bhira</strong> in 1518 and after the fifth invasion he finally captured <strong>Punjab</strong>.</p>
<p>Then he defeated Ibrahim Lodi in the Battle of <strong>Panipat</strong> in 1526 and captured Delhi and Agra.</p>
<p>But his victory couldn&#8217;t be considered complete before he defeated Rana Sanga at <strong>Khanwa</strong> in 1527, Medini Rai at <strong>Chanderi</strong> (1528) and the Afghans at <strong>Ghagghar</strong> (1529).</p>

<h4>Reasons behind the success of Babur</h4>
<ol>
<li><strong>Political fragmentation</strong> in North India and differences between various states.</li>
<li>The main cause behind the failure of the Afghans was the <strong>lack of the centralisation</strong> in the Afghan political system, the differences between the Sultan and the nobles as well as the undisciplined nobles.</li>
<li>Demonstration of <strong>superior combat technology</strong> by Babur, e.g. linking the Tulgama warfare system with artillery.</li>
</ol>

<h4>Impact of Babur&#8217;s conquest of Hindustan-</h4>
<ol>
<li><strong>Re-established the prestige of the crown</strong>, that is, the position of the king became much stronger than the nobles.</li>
<li>Due to the use of <strong>artillery</strong> by Babur, better control over the provincial authorities by the central government became possible. This also encouraged <strong>administrative centralization</strong>.</li>
<li>Control over <strong>Kabul and Qandhar</strong> by an Indian ruler after a long period.</li>
<li><strong>Powerful foreign policy</strong> and connection of Indian politics with that of <strong>Central Asia and West Asia</strong>.</li>
<li>Hindustan&#8217;s engagement with Central Asia and promotion of <strong>trade</strong>.</li>
</ol>

<h4>Do you agree with the statement that Babur was a dedicated warrior, not an empire-builder?</h4>
<p>It is beyond doubt that Babur possessed <strong>unparalleled military acumen</strong>. Throughout his life, he remained involved in many military conflicts and also had several military successes. First, he captured Kabul and then after the battles of Panipat and Khanwa, he laid the foundation of the Mughal state.</p>
<p>It is true that he had <strong>insufficient time</strong> to properly focus on either strengthening the base of the newly founded Mughal state or to think in terms of territorial expansion.</p>
<p>But it is also equally true that Babur introduced certain <strong>measures which resulted in empire-building in the future.</strong></p>
<ul>
<li>&#8226; Before the advent of Babur in India, in North India there was an <strong>uneasy balance of power between Afghans and Rajputs.</strong> <strong>Babur destroyed this balance</strong> in the battles of Panipat and Khanwa to establish <strong>Mughal primacy</strong>. So, empire-building in the north became possible in the future.</li>
<li>&#8226; In order for the empire to survive, it was <strong>essential to deny the Mongol succession rule</strong> in India. Under the Mongol succession rule, the empire had to be divided among all the successors. Babur rejected it and advised Humayun not to enforce it after his death.</li>
<li>&#8226; Babur infused a <strong>new spirit into the government</strong> as well. Actually, the structure of the Afghan government was based on a confederate system in which the position of a monarch was weak. Babur emphasised upon a <strong>centralised structure</strong> and took the title of Badshah. In fact, in this system of government, no other noble could make the claim of equality with the monarch.</li>
<li>&#8226; Apart from that, he selected a <strong>liberal social policy</strong> for the government in India. Once he advised Humayun that he should never interfere in the religious life of Hindus. Such advice could become a precursor of the liberal religious policy of Mughals in India.</li>
<li>&#8226; Likewise, <strong>he got his two sons Humayun and Kamran married with the Rajput princess</strong> from the family of Medini Rai. So it was Babur who revealed the potential of Mughal-Rajput relations in future.</li>
</ul>
<p>In the light of these arguments, we can say that Babur&#8217;s steps prepared the way for empire-building in future.</p>

<h3>Tuzuk-i-Baburi as a source of history</h3>
<p>Tuzuk-i-Baburi is an autobiography of the Mughal ruler Babur, written in Chagatai Turk.</p>

<h4>Positive aspect</h4>
<ol>
<li>It has wide significance as a source of study. It provides details of some <strong>major states</strong> of India, such as Delhi, Gujarat, Bengal, Mewar, Vijayanagar and Bahmani.</li>
<li>It also mentions the <strong>prosperity of India and various professional groups and production systems</strong> prevailing here.</li>
<li>Babur was interested in the <strong>geography</strong> of India. He has described the geographical landscape, animals, birds, vegetation of India in detail.</li>
<li>He was also a connoisseur of <strong>human behaviour</strong> and nature and has given details about it.</li>
<li>In many places, he is <strong>completely honest</strong> in his writing. He has exposed the weakness of his father and other relatives. At some places, he has revealed his own weaknesses also. On this basis, Tuzuk-i-Baburi appears to be close to the Confession of St. Augustine and that of Rousseau.</li>
<li>His sensibility as an author <strong>transformed a regional language into a rich literary language</strong>.</li>
<li>He was also a <strong>great connoisseur of art and architecture</strong>, but he did not like the architecture of India because it lacked balance and proportion.</li>
</ol>

<h4>Limitations</h4>
<ol>
<li>Tuzuk-i-Baburi <strong>does not cover Babur&#8217;s entire life</strong>. There are time gaps at many places.</li>
<li>Babur has <strong>manipulated the facts in his favour</strong> at many places. For example, in the Battle of Panipat, he states that Ibrahim Lodhi&#8217;s army was much larger than his army.</li>
<li>He seems to be <strong>biased against Indians</strong> in many places. For example, according to him, there is no lustre on the face of Indians, they are not intelligent. This description does not match the description of Amir Khusro.</li>
</ol>

<p><strong>Question-</strong> Does Babur appear to be a cultured person on the basis of Tuzuk-i-Baburi?</p>

<h2>Humayun (1530&#8211;1555)</h2>

<h3>Sources</h3>
<p>His biography <strong>&#8216;Humayun Nama&#8217;</strong> was written by sister Gulbadan Begum in Persian, during Akbar&#8217;s reign.</p>

<h3>Important events</h3>
<ul>
<li>&#8226; <strong>1532</strong> - he <strong>defeated the Afghans near Allahabad</strong>.</li>
<li>&#8226; <strong>1534</strong> - he <strong>defeated Bahadur Shah of Gujarat</strong>, and built <strong>Dinpanah</strong> - A new city at Delhi.</li>
<li>&#8226; <strong>1539</strong> - he was <strong>defeated by Sher Shah Suri</strong> at the Battle of <strong>Chausa</strong> (Bihar)</li>
<li>&#8226; <strong>1540</strong> - he was <strong>defeated again by Sher Shah Suri</strong> at the battle of <strong>Bilgram</strong> (Kannauj)</li>
<li>&#8226; <strong>1541</strong> - he <strong>fled towards Rajasthan</strong> and married Hamida Banu Begum, a Persian lady, who gave birth to Akbar at Amakot (Sind).
  <ul>
  <li style="padding-left:2em">&#9702; After this, Humayun <strong>fled to Persia</strong> where he was given refuge to Shah Tamas I.</li>
  </ul>
</li>
<li>&#8226; <strong>1555</strong> -he returned to India with Persian help and recovered Delhi. However, he could only rule for 10 months before dying accidently.</li>
</ul>

<h3>Challenges before Humayun after becoming the ruler</h3>
<ol>
<li>His brother Kamran captured Kabul and Kandahar, then Lahore, Hisar Firoza and other areas were also captured by him.</li>
<li>The foundation of the Mughal state, established by Babur, was very weak.</li>
<li>Humayun faced continuous revolt from Afghans.</li>
</ol>

<h4>Question: Was Humayun an incompetent king or an unfortunate one?</h4>
<p>On the basis of <strong>traditional historiography</strong>, Humayun was declared to be lazy, lavish and addicted to opium. He spent his precious time building a new capital &#8216;Dinpanah&#8217; in Delhi, neglecting the Afghan challenge.</p>
<p>But on the basis of the <strong>latest research</strong> on Humayun, such a view has seriously been challenged and certain hidden abilities in his personality have come to light.</p>
<p>Humayun presents a rare example not only in Indian history but also in the history of the world, of <strong>a king who lost his crown and then regained it</strong>. It was not possible without military ability and political acumen.</p>
<p>So far as the charge of <strong>opium taking</strong> is concerned, we shouldn&#8217;t forget that he was not an exception. Almost all the Mughal emperors took opium. Even Babur, who before the battle of Khanwa took the oath not to take wine, depended on opium for the rest of his life.</p>
<p>Likewise, the decision to build a new capital <strong>&#8216;Dinpanah&#8217;</strong> was also a far-sighted one. Actually, due to the political ambition of Gujarat ruler, Bahadur Shah, Agra was under constant threat. So, it was a wise step to build an alternative capital in Delhi.</p>
<p>That&#8217;s why Humayun shouldn&#8217;t be taken as an incompetent ruler but rather as an <strong>unfortunate ruler</strong>.</p>

<h2>Shershah Suri</h2>

<h3>Rise of Sher Shah:</h3>
<p>By dint of his personal valour, entrepreneurship, diplomatic acumen and military talent, Shershah rose from being Jagirdar of Sasaram to the Badshah of Hindustan.</p>
<p>Sher Shah assimilated the elements of fox and the lion within his personality.</p>
<p>When we observe minutely, we come to know that even the <strong>material conditions of the time favoured him.</strong></p>
<ul>
<li>&#8226; For example, firstly, he took advantage of the <strong>political confusion</strong> created by the continuous conflict between Mughals and Afghans.</li>
<li>&#8226; Secondly, he <strong>made use of the Afghan rule of succession</strong> in his favour.
  <ul>
  <li style="padding-left:2em">&#9702; In the Afghan structure, succession was transferred from husband to wife. So, Shershah used this rule in his favour by marrying some prosperous Afghan widows.</li>
  </ul>
</li>
</ul>

<h3>Empire-building under Sher Shah:</h3>
<ul>
<li>&#8226; The process of <strong>political unification had already started</strong> when Sikander Lodhi annexed Jaunpur.
  <ul>
  <li style="padding-left:2em">&#9702; Then the process of political unification continued under Babur and Humayun. Later, Sher Shah brought it to its climax.</li>
  </ul>
</li>
<li>&#8226; Shershah created a big empire that extended to the border of Kashmir in the North to Vindhya in the South and the Indus region in the West to Bengal in the East.</li>
</ul>

<h3>Administrative structure:</h3>
<ul>
<li>&#8226; The main challenge before Sher Shah was <strong>suppressing the Afghan legacy</strong> which worked as a major impediment in the way of <strong>administrative centralisation</strong>.</li>
<li>&#8226; Sher Shah promoted administrative centralisation by <strong>combining the Afghan structure of government with the Turkish one</strong>.
  <ul>
  <li style="padding-left:2em">&#9702; The Turkish model of administration was relatively more centralised than the Afghan model where centrifugal forces were more active.</li>
  </ul>
</li>
<li>&#8226; He made it clear that the <strong>rule of Afghan succession wouldn&#8217;t apply in government posts</strong>. Shershah gave emphasis on effective, transparent and active government.</li>
<li>&#8226; Although he <strong>maintained the old departments</strong> under his government, he infused new strength into them. As we know, these departments existed even under the Sultans but Sher Shah <strong>heavily curtailed the power of the head of the departments</strong>.</li>
<li>&#8226; For provincial administration, we can say that under Sher Shah, <strong>standard provincial administration didn&#8217;t start</strong>.
  <ul>
  <li style="padding-left:2em">&#9702; In the actual sense, this was introduced by Akbar later.</li>
  <li style="padding-left:2em">&#9702; Under the Sultans, a number of Siqs were clubbed together into an irregular administrative unit, known as Khitta or Vilayat.</li>
  <li style="padding-left:2em">&#9702; The same tradition continued under Shershah.</li>
  </ul>
</li>
<li>&#8226; We can give credit to Shershah for the introduction of <strong>standardised local administration</strong> in the form of <strong>Sarkar and Pargana</strong>, i.e. Siq was replaced by Sarkar.
  <ul>
  <li style="padding-left:2em">&#9702; At the level of <strong>Sarkar</strong>, he appointed two officers, <strong>Siqdar-i-Siqdaran and Munsif-i-Munsifan</strong>. First was accountable for general administration while the second for land revenue administration.</li>
  <li style="padding-left:2em">&#9702; Likewise, at the level of <strong>Pargana</strong>, there were officers, <strong>Siqdar and Munsif</strong>. Siqdar was responsible for general administration and Munsif for land revenue administration.</li>
  </ul>
</li>
<li>&#8226; The <strong>village</strong> was the lowest unit of administration and was guided by two local officers i.e. Muqaddam and Patwari.
  <ul>
  <li style="padding-left:2em">&#9702; <strong>Muqaddam</strong> was the head of the village while <strong>Patwari</strong> was a semi-government officer who maintained the documents of the land revenue.</li>
  <li style="padding-left:2em">&#9702; Maqaddam wasn&#8217;t a paid officer.</li>
  </ul>
</li>
</ul>

<h3>Land revenue reforms under Sher Shah</h3>

<h4>Objectives behind the reforms</h4>
<ul>
<li>&#8226; To boost production</li>
<li>&#8226; To augment state revenue</li>
<li>&#8226; To give protection to the peasants.
  <ul>
  <li style="padding-left:2em">&#9702; Shershah believed that the peasants were the axis of production and if they remained dissatisfied, it would affect the whole process of production.</li>
  </ul>
</li>
</ul>

<h4>Land measurement: -</h4>
<ul>
<li>&#8226; Shershah re-introduced land measurement and for that, he made the <strong>Bigha and Gaz-i-Sikandari</strong> as a measuring unit.</li>
<li>&#8226; His system is known as the <strong>Zabti system</strong>.</li>
<li>&#8226; The system also <strong>accounted for soil fertility</strong>, according to which, land was categorised as <strong>good, average or bad</strong>.
  <ul>
  <li style="padding-left:2em">&#9702; The estimated production was adjusted as per the quality of land.</li>
  </ul>
</li>
</ul>

<h4>Recognition of the Rights of tenants:-</h4>
<ul>
<li>&#8226; Shershah introduced the system of <strong>Patta and Qabuliyat</strong>.
  <ul>
  <li style="padding-left:2em">&#9702; In Patta, the rights of the peasants were clearly mentioned but in Qabuliyat the liability of peasants was mentioned.</li>
  </ul>
</li>
</ul>

<h4>Fixation of the rate of land revenue:-</h4>
<ul>
<li>&#8226; Generally, <strong>1/3rd</strong> of the total production was fixed as land revenue.</li>
<li>&#8226; In order to make the collection more convenient, he introduced a rate chart known as <strong>Ray</strong>.</li>
<li>&#8226; Furthermore, apart from the regular rate of land revenue, there were some additional taxes like <strong>Zaribana &amp; Muhasilana</strong>.
  <ul>
  <li style="padding-left:2em">&#9702; The rate of the first was 2.5% of the total production while the second one was 5% of the total production.</li>
  </ul>
</li>
<li>&#8226; Along with these taxes, the state used to impose an <strong>additional tax of 2.5 Ser per Bigha</strong> which was safely stored in local state storehouses, so that the grains could be used at the time of exigencies.</li>
</ul>

<h4>Approach to Zamindars and Intermediaries:-</h4>
<ul>
<li>&#8226; Unlike Alauddin Khilji, Shershah adopted a very <strong>pragmatic approach</strong> to Zamindars and Intermediaries.
  <ul>
  <li style="padding-left:2em">&#9702; Instead of suppressing them he preferred to have an effective check over them.</li>
  </ul>
</li>
</ul>

<h3>Roads and Sarais</h3>
<ul>
<li>&#8226; Sher Shah Suri built long <strong>arterial roads</strong> in India including-:
  <ul>
  <li style="padding-left:2em">&#9702; Sonargaon to Attock</li>
  <li style="padding-left:2em">&#9702; Agra to Chittorgarh via Jodhpur</li>
  <li style="padding-left:2em">&#9702; Multan to Attock</li>
  <li style="padding-left:2em">&#9702; Agra to Burhanpur</li>
  </ul>
</li>
<li>&#8226; On each road, <strong>trees</strong> were planted for shade.</li>
<li>&#8226; At a distance of every 2 Kos (18 Kilometres) a <strong>Sarai</strong> was built.
  <ul>
  <li style="padding-left:2em">&#9702; Approximately 1700 such Sarais were built.</li>
  </ul>
</li>
<li>&#8226; These Sarais served multiple purposes.
  <ul>
  <li style="padding-left:2em">&#9702; Each sarai had a <strong>Barid</strong> (intelligence officer)</li>
  <li style="padding-left:2em">&#9702; Each sarai also had a well provisioned <strong>stable and Dak Chowki</strong>.
    <ul>
    <li style="padding-left:4em">&#9632; According to Sarwani a message could be relayed from Bengal to Agra in a single day.</li>
    </ul>
  </li>
  <li style="padding-left:2em">&#9702; Each Sarais had <strong>2 chefs</strong>, one Brahmin and the other Muslim.
    <ul>
    <li style="padding-left:4em">&#9632; Food was provided free of cost to boarders.</li>
    </ul>
  </li>
  <li style="padding-left:2em">&#9702; The sarais had facilities for <strong>feeding and watering horses</strong>.</li>
  <li style="padding-left:2em">&#9702; Each Sarai had a <strong>water well</strong>, which attracted locals.
    <ul>
    <li style="padding-left:4em">&#9632; This resulted in the roads and sarais becoming safer.</li>
    </ul>
  </li>
  </ul>
</li>
<li>&#8226; Gradually sarais started to serve as a <strong>marketplace</strong>, which eventually evolved into <strong>towns</strong>.
  <ul>
  <li style="padding-left:2em">&#9702; Thus, they helped in the growth of the market economy and contributed to urbanisation.</li>
  </ul>
</li>
</ul>

<h3>Other reforms under Shershah:-</h3>
<ul>
<li>&#8226; Shershah introduced the system of <strong>local responsibility for local crime</strong>. i.e. Muqaddam (the head of the village) had to be convicted if he failed to divulge the name of the criminal.</li>
<li>&#8226; In order to <strong>boost trade and commerce</strong>, he adopted some other measures as well.
  <ul>
  <li style="padding-left:2em">&#9702; He introduced <strong>standard coins</strong> like silver currency, Rupiya, and copper currency Dam.</li>
  <li style="padding-left:2em">&#9702; He <strong>standardised import duties and taxes</strong>. So now on goods, the tax could have been collected only at two points.</li>
  </ul>
</li>
<li>&#8226; Shershah introduced some <strong>military reforms</strong> as well.
  <ul>
  <li style="padding-left:2em">&#9702; He introduced <strong>Chehra or Hulia</strong> as well as the system of <strong>Dagh</strong> (branding of horses).</li>
  </ul>
</li>
</ul>

<h3>Was Sher Shah an innovator or a reformer?</h3>
<p>The period of Sher Shah drew the attention of a number of scholars because he made <strong>remarkable achievements within a short span of 5 years</strong>.</p>
<ul>
<li>&#8226; Although, he infused a new spirit into all institutions, whether he was an institution builder or reformer needs to be investigated.</li>
</ul>
<p>In <strong>central administration</strong>, Shershah maintained all departments i.e. Diwan-i-Wizarat, Diwan-i-Insha, Diwan-i-Arz and Diwan-i- Risalat.</p>
<ul>
<li>&#8226; But he promoted administrative centralisation through the curtailment of the power of officers.</li>
</ul>
<p>As for <strong>provincial administration</strong>, we can say that Shershah couldn&#8217;t introduce any standard model, rather standard provincial administration (Suba) started later under Akbar.</p>
<p>On the other hand, the credit for introducing <strong>standard local administration</strong> can be given to Shershah, like the units of Sarkar and Pargana.</p>
<ul>
<li>&#8226; But here also, we come to know that the old system Siq and Pargana already existed, Shershah simply restructured them.</li>
</ul>
<p>Likewise, as for <strong>military reforms</strong>, Shershah introduced the Hulia and Dagh but these had earlier been introduced by Alauddin Khilji. So, Shershah simply reintroduced it.</p>
<p>The practice of <strong>land measurement</strong> had first been introduced by Alauddin Khilji but there remained certain loopholes which Shershah tried to remove.</p>
<ul>
<li>&#8226; Even in Sher Shah&#8217;s system, some flaws remained, which Akbar tried to remove.</li>
<li>&#8226; So land revenue reforms should be viewed as a process of gradual evolution and the entire credit shouldn&#8217;t be given to Shershah.</li>
</ul>
<p>In the light of above factors, Shershah appears to be a <strong>great reformer but not an innovator</strong>.</p>"""

path = 'lib/noteContent.ts'
content = open(path, encoding='utf-8').read()
pattern = r"('fifteenth-sixteenth-century-political':\s*`)`"
replacement = lambda m: f"'fifteenth-sixteenth-century-political': `{new_html}`"
new_content, count = re.subn(pattern, replacement, content)
print(f"Replaced {count} occurrence(s).")
open(path, 'w', encoding='utf-8').write(new_content)
