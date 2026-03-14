import re

new_html = """<h2>Early Medieval Age (8th - 12th C. CE)</h2>
<h3>Tripartite struggle (8th - 10th C. CE)</h3>
<p>It was a struggle for supremacy and control over the Central Gangetic Valley among three early medieval empires. The major factors for the struggle were as follows:</p>
<ul>
<li>&#8226; To acquire control over the rich resources of the Ganga Valley.</li>
<li>&#8226; To assert supremacy over Kannauj, a symbol of prestige and power since the period of Harshvardhan.</li>
<li>&#8226; To acquire control over the lucrative trade routes of Gujarat and Malwa.</li>
<li>&#8226; To acquire war booty, which was important for maintaining a large army.</li>
</ul>
<h3>Powers Involved</h3>
<p><strong>1. The Palas</strong> \u2013 they ruled over Bengal and Bihar. Notable kings include:</p>
<ul>
<li>&#8226; <strong>Gopala</strong> \u2013 he was <strong>elected</strong> as king in 750 CE. He brought stability to Bengal, which had been facing anarchy since the defeat of Shashanka. He was a patron of Buddhism and established the
<ul>
<li style="padding-left:2em">&#9702; <strong>Odantapuri</strong> Mahavihara (Bihar Sharif).</li>
</ul>
</li>
<li>&#8226; <strong>Dharampal</strong> \u2013 he temporarily established control over Kannauj but lost to the Rashtrakutas. He built the
<ul>
<li style="padding-left:2em">&#9702; <strong>Vikramshila</strong> Mahavihara (Bhagalpur, Bihar),</li>
<li style="padding-left:2em">&#9702; <strong>Jagdalla</strong> Mahavihara (Bangladesh) and</li>
<li style="padding-left:2em">&#9702; <strong>Somapura</strong> Mahavihara (Bangladesh).</li>
</ul>
</li>
<li>&#8226; <strong>Devpala</strong> \u2013 he conquered Pragjyotishpur and parts of Odisha. During his reign the Nalanda monastery was expanded through donations made by Balaputradeva (the Shailendra king of Suvarnadwipa).</li>
</ul>
<p><strong>2. The Gurjara-Pratiharas</strong> \u2013 It is believed that their ancestors belonged to the Gurjara tribe of Central Asia, who settled in south-west Rajasthan and Gujarat. The process of state formation gradually propelled them to power.</p>
<p>They claimed Kshatriya status as Rajputs and also claimed to be the descendants of Lakshman. Their empire included Avanti, Ujjain and Jalore. They are notable kings were:</p>
<ul>
<li>&#8226; <strong>Nagabhatta I</strong> \u2013 the first ruler who successfully resisted Arab expansion from Sindh.</li>
<li>&#8226; <strong>Nagabhatta II</strong> \u2013 he gained control of Kannauj by defeating the Palas but was himself defeated by the Rashtrakutas.</li>
<li>&#8226; <strong>Mihir Bhoja</strong> \u2013 considered to be the greatest Pratihara ruler. He was praised by Arab travellers for his military prowess and patronage of the arts and literature. According to them, the Pratiharas imported horses from Arabia and had the best cavalry in India.</li>
<li>&#8226; <strong>Mahendrapal</strong> \u2013 he expanded his empire to Bihar and north Bengal. His inscriptions have been found from Kathiawar, Punjab and Awadh. He also fought against the king of Kashmir but had to return empty-handed.</li>
<li>&#8226; <strong>Mahipal</strong> \u2013 he patronised the famous Sanskrit poet <strong>Rajashekhara</strong> who composed the \u2018Kapuramanjari\u2019, the \u2018Kavyamimanasa\u2019, the \u2018Bala-Ramayan\u2019 and the \u2018Bala-Bharat\u2019.</li>
</ul>
<p><strong>3. The Rashtrakutas</strong> \u2013 They were of Kannada origin and hailed from Lattaluru/Latur (Maharashtra). Their empire extended over the Deccan with their capital at Manyakheta/Malkhed (Karnataka). Their important Kings included:</p>
<ul>
<li>&#8226; <strong>Dantidurga</strong> \u2013 he began his career as a feudatory of the Chalukyas. He overthrew them and established his capital at Manyakheta.</li>
<li>&#8226; <strong>Krishna I</strong> \u2013 he was Dantidurga\u2019s uncle. He constructed the Kailashnath Temple (Ellora cave complex).</li>
<li>&#8226; <strong>Dhruva III</strong> \u2013 he was the first south Indian king to successfully invade north India. He defeated the Palas and Pratiharas to establish his supremacy over Kannauj.</li>
<li>&#8226; <strong>Govinda III</strong> \u2013 he lost all the gains made by Dhruva III and was driven out of North India.</li>
<li>&#8226; <strong>Amoghvarsha</strong> \u2013 considered to be the greatest of the Rashtrakutas. He preferred literature over warfare. Three important works are attributed to him.
<ul>
<li style="padding-left:2em">&#9702; <strong>\u2018Kavirajmarga\u2019</strong> \u2013 first book of Kannada poetry.</li>
<li style="padding-left:2em">&#9702; <strong>\u2018Ratnamalika\u2019</strong> and <strong>\u2018Prasnottaramalika\u2019</strong> \u2013 moral treatises in Sanskrit.</li>
</ul>
</li>
<li>&#8226; <strong>Indira III</strong> \u2013 he established Rashtrakuta power in North India and acquired control of Kannauj and Gujarat.</li>
<li>&#8226; <strong>Krishna III</strong> \u2013 he defeated the Pratiharas and Parantaka I (Chola ruler), thus annexing the northern part of the Chola empire. He erected a victory pillar and constructed a temple at Rameswaram.</li>
</ul>
<h3>Outcome</h3>
<ul>
<li>&#8226; The tripartite struggle continued for almost 2 centuries. Frequent wars became a characteristic of this period. The fortune of the parties kept shifting continuously. However, <strong>no single power could emerge as the clear winner</strong>.</li>
<li>&#8226; The intense warfare <strong>sapped the strength and vitality</strong> of the contenders, exhausting their human and economic resources.</li>
<li>&#8226; Although the <strong>Pratiharas</strong> finally established control over Kannauj, this was a <strong>pyrrhic victory</strong>.</li>
<li>&#8226; The three powers <strong>disintegrated almost simultaneously</strong> towards the end of the 10th century CE. This left India without a dominant central authority. As a result, India was <strong>unable to resist the Turkish invasions</strong> from the 10th century onwards.</li>
</ul>
<h3>Arab Invasion of Sind</h3>
<ul>
<li>&#8226; Arabs are a group of people with a <strong>shared language and culture</strong> living in the Arabic world i.e., west of Iran up to north Africa.</li>
<li>&#8226; The Arabs had had <strong>trading contacts with India</strong> since the early Christian centuries. The first Arabs to come to India were thus non-Muslims.</li>
<li>&#8226; <strong>Islam</strong> spread among the Arabs during the <strong>7th century CE</strong> and India\u2019s first contact with the Muslim world also took place through Arab traders.</li>
<li>&#8226; As <strong>invaders</strong>, the Arabs came to Sindh in the beginning of the 8th century CE <strong>(711\u2013712CE)</strong>.</li>
<li>&#8226; The text <strong>\u2018Futuh-ul-Abdan\u2019 by Al-Biladuri</strong> and <strong>\u2018Chachnama\u2019</strong> by an unknown author are important sources for the study of this period.</li>
<li>&#8226; <strong>Mohammed bin Qasim</strong> defeated King Dahir of the Chach Dynasty.
<ul>
<li style="padding-left:2em">&#9702; He was sent to establish control over the Sindh region by the Caliph at Baghdad.</li>
<li style="padding-left:2em">&#9702; The justification for this invasion was to punish the ruler of Sindh where some Arab merchants had reportedly been looted while returning from Kerala.</li>
<li style="padding-left:2em">&#9702; The Arab hold over Sind lasted for the next 300 years, influencing the local culture heavily.</li>
<li style="padding-left:2em">&#9702; However, their influence could not expand further into the subcontinent beyond Sind due to the presence of the Pratiharas to the east.</li>
</ul>
</li>
</ul>
<h3>Cultural impact of Arab conquest on Sind</h3>
<ul>
<li>&#8226; <strong>Islam</strong> spread rapidly and became the most popular religion in Sindh.</li>
<li>&#8226; The development of <strong>Sindhi language</strong> was also influenced by the introduction of several <strong>Arabic words.</strong></li>
<li>&#8226; The <strong>Arabic script</strong> became popular and today Sindhi is written both in Arabic as well as Devanagari script.</li>
<li>&#8226; <strong>Geography, history, medicine, astronomy</strong> received a huge boost due to Arab influence, who had developed advanced knowledge in these fields.</li>
<li>&#8226; The Arabs were also great <strong>interlocutors of culture</strong>. They transmitted many new inventions from China and Greece to the rest of the world. e.g. paper, soap, gun powder, the magnetic compass etc.</li>
</ul>
<h3>Cultural impact on Arabs</h3>
<ul>
<li>&#8226; In the field of <strong>mathematics</strong>, they learnt the <strong>Hindsa</strong> (the Indian numeral system including zero) and the use of decimals.
<ul>
<li style="padding-left:2em">&#9702; This revolutionised the development of science and commerce.</li>
</ul>
</li>
<li>&#8226; They learnt <strong>yoga</strong> from the great Indian physician <strong>Manak</strong>, who was appointed as the chief surgeon at Baghdad.</li>
<li>&#8226; The great Indian physicist <strong>Hala</strong> was also invited to Baghdad. He contributed to the development of <strong>physics</strong> in the Arab world.</li>
<li>&#8226; The Arabs also learnt <strong>Chaturanga/ Shatranj</strong> from India.</li>
</ul>
<h3>Political impact of the Arab Conquest of Sind</h3>
<ul>
<li>&#8226; It was due to military success against Arab invaders that certain Indian dynasties like Gurjar-Pratiharas and Rashtrakutas gained legitimacy.</li>
<li>&#8226; Arabs were the first to establish an Islamic state in India, which became a template for the Turkish rulers later.</li>
</ul>
<h3>Rajputs</h3>
<p>Due to their persistent mutual conflict, both Pala and Pratihara powers declined and they were supplanted by smaller states that have been identified as Rajput states.</p>
<p>Some of the important Rajput dynasties were as following:</p>
<ul>
<li>&#8226; Chauhans of Delhi \u2013 Ajmer area</li>
<li>&#8226; Gahadavalas of Kannauj region</li>
<li>&#8226; Solankis of Gujarat</li>
<li>&#8226; Paramaras of Malwa</li>
<li>&#8226; Kalachuris of Tripuri</li>
<li>&#8226; Chandelas of Khajuraho-Kalinjar- Mahoba area, etc.</li>
</ul>
<h3>Origin of the Rajputs</h3>
<p>It is one of the <strong>hotly debated</strong> issues of Indian historiography.</p>
<p>There have been controversies over their <strong>&quot;foreign vs. local&quot;</strong> origin. But, a deeper assessment tells us that the origin of Rajputs was part of a larger and a <strong>complex socio-political process</strong>.</p>
<ul>
<li>&#8226; The <strong>Kshatriya Varna</strong> of ancient period possibly got <strong>absorbed in the Rajput identity</strong>.</li>
<li>&#8226; Whatever their Varna or the location of their origin might be, <strong>if a social group emerged as a ruling class</strong>, then it was <strong>incorporated into the larger Rajput identity</strong>.
<ul>
<li style="padding-left:2em">&#9702; <strong>Agrarian economy expanded</strong> into the tribal areas with the help of <strong>land grants</strong>. Consequently, a class of <strong>local level landlords</strong> also emerged.
<ul>
<li style="padding-left:4em">&#9632; These land owners, in turn, built their own forts and maintained small armed contingents. Therefore, these groups despite their tribal origin became Rajputs.</li>
</ul>
</li>
<li style="padding-left:2em">&#9702; Then, <strong>some groups with hitherto lower social status</strong>, due to the expanding agrarian economy and its surplus, <strong>became rich landlords</strong>.
<ul>
<li style="padding-left:4em">&#9632; They elevated their social status with the help of marital alliances and joined the Rajput class.</li>
</ul>
</li>
</ul>
</li>
<li>&#8226; The concept of <strong>\u2018Bramhachhatra\u2019</strong> also helped some dynasties to achieve Rajput status.
<ul>
<li style="padding-left:2em">&#9702; E.g. Gurjara-Pratiharas first took the \u2018Bramhana\u2019 status and then they acquired \u2018Kshatriya\u2019 status. In this way, they joined the Rajput class.</li>
</ul>
</li>
</ul>
<h3>Political system of the Rajputs</h3>
<ul>
<li>&#8226; <strong>Multi-state system</strong> was a feature of the Rajput polity.
<ul>
<li style="padding-left:2em">&#9702; It had developed since some old states had fragmented and, due to the expansion of agrarian economy and land grants, some new states had emerged.</li>
</ul>
</li>
<li>&#8226; The <strong>deification of kingship</strong> continued.
<ul>
<li style="padding-left:2em">&#9702; Gahadwala rulers like Chandradeva and Govindchandra took the titles of \u2018Gopal\u2019 and \u2018Hari\u2019 respectively.</li>
<li style="padding-left:2em">&#9702; Rajput rulers also adopted pompous titles like Parmeshwara, Bhateshwara etc.</li>
</ul>
</li>
<li>&#8226; Rajput states were divided into <strong>bhuktis</strong>, which in turn, were divided into <strong>mandalas</strong> and <strong>vishayas</strong>, in that order. <strong>Grama (Village)</strong> was the smallest unit of administration.</li>
<li>&#8226; <strong>Feudalism</strong> - In the Rajput states, land was divided between \u2018home provinces\u2019 and \u2018jagirs\u2019.
<ul>
<li style="padding-left:2em">&#9702; In the home province, the king enjoyed direct rule and appointed officials.</li>
<li style="padding-left:2em">&#9702; But, jagirs were divided between his samantas.</li>
<li style="padding-left:2em">&#9702; Basically, villages were grouped together in the multiple of 10, 12 and 16 and allotted to the feudatories.</li>
<li style="padding-left:2em">&#9702; In return, these feudatories paid military service.</li>
</ul>
</li>
<li>&#8226; <strong>Feudalisation of bureaucracy</strong> took place i.e. some important feudatories were given royal offices and, on the other hand, considering the significance of some royal officials they were given status of a feudatory.
<ul>
<li style="padding-left:2em">&#9702; A whole chain of subordinate rulers and feudatories had developed under them viz. Mandlik, Mandaleshwar, Mahamandaleshwar, Samanta, Mahasamanta, etc.</li>
</ul>
</li>
<li>&#8226; Rajput <strong>armies were made up of feudal levies</strong>.
<ul>
<li style="padding-left:2em">&#9702; Thus they did not have a strong centralised command, due to which they lacked cohesion and coordination.</li>
</ul>
</li>
<li>&#8226; Rajputs had deep attachment to their <strong>area, their lineage and their blood relations.</strong>
<ul>
<li style="padding-left:2em">&#9702; Due to this, they could not establish an all Indian alliance, even in the face of repeated Turkish invasions.</li>
</ul>
</li>
<li>&#8226; Neighbouring kingdoms were treated as obvious enemies and this resulted in the emergence of a <strong>ritualised martial tradition.</strong>
<ul>
<li style="padding-left:2em">&#9702; The most ideal king was one who attacked his neighbour on the day after Vijayadashami.</li>
<li style="padding-left:2em">&#9702; As a result, war was treated as a sport.</li>
<li style="padding-left:2em">&#9702; Several rules of war were observed such as
<ul>
<li style="padding-left:4em">&#9632; not fighting after dusk,</li>
<li style="padding-left:4em">&#9632; not attacking an unarmed enemy,</li>
<li style="padding-left:4em">&#9632; not retreating even in the face of certain death and</li>
<li style="padding-left:4em">&#9632; not attacking a surrendered enemy.</li>
</ul>
</li>
</ul>
</li>
<li>&#8226; The notion of a glorious death was popularised. <strong>Martyrdom</strong> was coveted and Veergathas (eulogies) were written in honour of martyrs.</li>
<li>&#8226; In contrast, the Turks had no such scruples. They treated war as a means to an end rather than an end in itself.
<ul>
<li style="padding-left:2em">&#9702; Thus, they could easily overcome the Rajputs during their invasions.</li>
</ul>
</li>
</ul>
<h3>Social system of the Rajputs</h3>
<ul>
<li>&#8226; The Rajput society was <strong>extremely hierarchical</strong> and the <strong>Varnashrama Dharma</strong> system was rigidly observed.
<ul>
<li style="padding-left:2em">&#9702; Brahmins occupied the supreme position and received lavish gifts in the form of precious metals, cattle and land from both the state and lay people.</li>
<li style="padding-left:2em">&#9702; The right to rule was strictly in the hands of the Kshatriyas.</li>
<li style="padding-left:2em">&#9702; Further, only Kshatriyas had the right to take up arms.</li>
<li style="padding-left:2em">&#9702; The ruling class depended upon the priests to legitimise their rule.</li>
</ul>
</li>
<li>&#8226; In his book <strong>\u2018Kitab ul Hind\u2019</strong>, Al-Biruni observes that there was no discernible difference between the condition of the <strong>shudras and the Vaishyas</strong>.
<ul>
<li style="padding-left:2em">&#9702; This was due to the decline of trade and the increasing importance of agriculture.</li>
<li style="padding-left:2em">&#9702; Al-Biruni says that neither of them had the right to recite or to listen to the Vedas.</li>
</ul>
</li>
<li>&#8226; <strong>Proliferation of casts and emergence of sub-jatis</strong> due to the following reasons:
<ul>
<li style="padding-left:2em">&#9702; Peasantization of various tribal groups due to the expansion of agrarian economy.</li>
<li style="padding-left:2em">&#9702; Occupational groups turned into caste groups.
<ul>
<li style="padding-left:4em">&#9632; Kalhana mentions 64 jatis</li>
<li style="padding-left:4em">&#9632; Al-Biruni mentions 4 varnas and 8 antyaja castes.</li>
<li style="padding-left:4em">&#9632; Brahmavaivarta Purana mentioned 100 mixed jatis.</li>
</ul>
</li>
</ul>
</li>
<li>&#8226; The practice of <strong>untouchability</strong> was widespread and outcasts were heavily ostracised against.
<ul>
<li style="padding-left:2em">&#9702; The number of untouchables consistently increased. Al-Biruni mentions the presence of 8 antyaja castes (outcasts). It was because-
<ul>
<li style="padding-left:4em">&#9632; Some of the tribal groups that were enrolled into the &quot;caste based settled agrarian societies&quot; were relegated to an untouchable status.</li>
<li style="padding-left:4em">&#9632; Due to the revival of Brahmanism, some of the occupational groups lost their social status and were pushed into the category of untouchables.</li>
</ul>
</li>
</ul>
</li>
<li>&#8226; <strong>Theoretically, some improvement in women\u2019s social status</strong> is visible.
<ul>
<li style="padding-left:2em">&#9702; E.g. In the <strong>\u2018Mitakshara\u2019</strong>, Vigyaneshwara\u2019s commentary on Yajnavalkya Smriti, women were given the <strong>right to inherit property.</strong></li>
<li style="padding-left:2em">&#9702; Similarly, in the <strong>Swayamvara</strong> tradition of Rajputs, women had the right to choose their own husbands.</li>
</ul>
</li>
<li>&#8226; <strong>But, in practice, their social status declined further.</strong>
<ul>
<li style="padding-left:2em">&#9702; According to Al-Biruni, the condition of women was extremely poor. They had to face several social evils.
<ul>
<li style="padding-left:4em">&#9632; Purdah</li>
<li style="padding-left:4em">&#9632; Female infanticide</li>
<li style="padding-left:4em">&#9632; Denial of education</li>
<li style="padding-left:4em">&#9632; Child marriage</li>
<li style="padding-left:4em">&#9632; Denial of inheritance</li>
<li style="padding-left:4em">&#9632; Sati</li>
<li style="padding-left:4em">&#9632; Jauhar</li>
</ul>
</li>
</ul>
</li>
<li>&#8226; <strong>Education</strong> was entirely controlled by the temples and the priestly class.
<ul>
<li style="padding-left:2em">&#9702; Al-Biruni reports that the right to receive education was <strong>exclusive</strong> to upper caste males.</li>
<li style="padding-left:2em">&#9702; He mentions that Indians had <strong>advanced</strong> knowledge of mathematics and astronomy. However, Indian learning had <strong>stagnated</strong> due to the superiority complex and inward looking attitude of Indians.
<ul>
<li style="padding-left:4em">&#9632; He says that the Hindus (people of India) believe that their country is the best of all countries; their king is the best of all kings and their science is the best of all sciences.</li>
<li style="padding-left:4em">&#9632; But he clarifies that their ancestors were not so narrow minded.</li>
</ul>
</li>
<li style="padding-left:2em">&#9702; He further blames <strong>Brahmins</strong> as being <strong>insulators</strong> of knowledge.</li>
</ul>
</li>
<li>&#8226; <strong>Peasants</strong> formed the bulk of the population and bore the maximum burden of taxation. Both Vaishyas and shudras were engaged in cultivation.</li>
<li>&#8226; Al-Biruni further informs us that <strong>common masses lived in extreme poverty</strong> and were heavily taxed.
<ul>
<li style="padding-left:2em">&#9702; Meanwhile, <strong>temples had become fabulously rich</strong> due to large donations and tax-free land grants.</li>
<li style="padding-left:2em">&#9702; Thus, they had emerged as soft targets for invaders.</li>
</ul>
</li>
<li>&#8226; Al-Biruni talks in detail about <strong>fasting and pilgrimage</strong> in India. Kannauj, Kurukshetra and Benaras were important pilgrim centres.</li>
<li>&#8226; Al-Biruni mentions some <strong>peculiar habits of Indians</strong> viz.
<ul>
<li style="padding-left:2em">&#9702; no shaving of hair and not trimming nails,</li>
<li style="padding-left:2em">&#9702; drinking alcohol before eating,</li>
<li style="padding-left:2em">&#9702; eating betel leaves and</li>
<li style="padding-left:2em">&#9702; riding horses without a saddle.</li>
</ul>
</li>
</ul>
<h3>Turkish Invasions</h3>
<ul>
<li>&#8226; The Turks were a collection of <strong>ethnically and religiously diverse warlike tribes of nomadic herders spread across the Steppes of Central Asia.</strong>
<ul>
<li style="padding-left:2em">&#9702; They were driven out of their homeland in the 8th and 9th centuries due the rise of other groups.</li>
</ul>
</li>
<li>&#8226; Being excellent horsemen, they entered the service of the growing <strong>Caliphate</strong> in which they served as both <strong>mercenaries and regular soldiers</strong>. They also <strong>accepted Islam.</strong></li>
<li>&#8226; Gradually, they rose to power under the increasingly <strong>Persianised</strong> Caliphate and spread to different parts of Central and Western Asia to establish <strong>powerful kingdoms</strong> such as
<ul>
<li style="padding-left:2em">&#9702; The Seljuk Sultanate of Anatolia</li>
<li style="padding-left:2em">&#9702; The Mamluk Sultanate of Egypt</li>
<li style="padding-left:2em">&#9702; The Ghaznavids Empire of Afghanistan</li>
</ul>
</li>
<li>&#8226; Beginning <strong>from the 10th century, the Ghaznavids mounted several invasions</strong> of India under:
<ul>
<li style="padding-left:2em">&#9702; Alaptgin (948-973 CE)</li>
<li style="padding-left:2em">&#9702; Subuktgin (973-998 CE)</li>
<li style="padding-left:2em">&#9702; Mahmud Ghazni (998-1030 CE)</li>
</ul>
</li>
</ul>
<h3>Mahmud of Ghazni</h3>
<ul>
<li>&#8226; Also known as <strong>\u2018Butshikan\u2019</strong> (idol breaker), he is said to have invaded India 17 times.</li>
<li>&#8226; His first attack came in 1000 CE against Jaipala, the Hindu Shahi ruler of Northwestern Punjab and Southeastern Afghanistan.</li>
<li>&#8226; His most famous attack was on Somnath in 1025-26 CE, in which the Solanki ruler, Bhima I fled instead of facing the invader.</li>
<li>&#8226; <strong>Firdausi\u2019s \u2018Shahnameh\u2019</strong>, considered to be a jewel of Persian literature, consists of a mythological and historical account of Persian kings. It covers both the pre-Islamic and Islamic phases of Persian history.
<ul>
<li style="padding-left:2em">&#9702; It also includes a Qaseeda (eulogy written in praise of a living subject) dedicated to Mahmood.</li>
</ul>
</li>
<li>&#8226; <strong>Abu Rehan Al-Biruni</strong> \u2013 originally from Khwarizm, he found his way to the court of Mahmud. He was a polymath who excelled in various disciples such as philosophy, science, mathematics, theology and linguistics.
<ul>
<li style="padding-left:2em">&#9702; After accompanying Mahmud to India, he stayed at Banaras for two years where he learnt Sanskrit and researched about India by conversing with learned men and reading ancient scriptures.</li>
<li style="padding-left:2em">&#9702; His work <strong>\u2018Kitab ul Hind\u2019</strong> is regarded as a mirror of 11th century India. It is the first true historical work on India written in Persian.</li>
</ul>
</li>
<li>&#8226; <strong>The early invaders did not want to establish an empire in India, nor did they try to spread Islam.</strong>
<ul>
<li style="padding-left:2em">&#9702; Their main motive was to <strong>plunder</strong> Indian wealth, especially temple wealth, to fund their own wars in Central Asia.</li>
</ul>
</li>
</ul>
<h3>Rise of Ghurid Empire</h3>
<ul>
<li>&#8226; After the decline of the Ghaznavid Empire two empires emerged in Central Asia to fill up the vacuum- the <strong>Khwarizmi Empire and Ghurid Empire</strong>.</li>
<li>&#8226; <strong>Mohammed-bin-Sam</strong>, popularly known as Mohammed Ghori, took the throne at Ghur in 1173 and looked towards India.
<ul>
<li style="padding-left:2em">&#9702; His larger objective was to <strong>expand in Central Asia</strong> while using the resources of India.</li>
<li style="padding-left:2em">&#9702; But unlike Mahmud of Ghazni, he wanted to establish <strong>direct control over Hindustan as well.</strong></li>
</ul>
</li>
<li>&#8226; Initially he tried to enter India through Bolan pass (Balochistan), looking to avoid confrontation with Ghazani\u2019s successor in Punjab.
<ul>
<li style="padding-left:2em">&#9702; But he received a setback as he was <strong>defeated by Bhima II of Gujarat in 1178</strong>.</li>
</ul>
</li>
<li>&#8226; Then he turned towards <strong>Punjab</strong>, finally <strong>conquering it by 1190</strong>. Now he wanted to expand further to the south-east.</li>
<li>&#8226; On the other hand, <strong>Prithviraj Chauhan III was looking towards the north-west.</strong>
<ul>
<li style="padding-left:2em">&#9702; Ghori was defeated in the First Battle of Tarain (1191) by a confederacy of Rajput Kings led by Prithviraj Chauhan III, who established his control over Bhatinda (Tabarhind).</li>
</ul>
</li>
<li>&#8226; But this victory did not last long. Ghori invaded again and defeated the Chauhans in the <strong>Second Battle of Tarain in 1192</strong>, capturing Delhi and Ajmer.
<ul>
<li style="padding-left:2em">&#9702; Thus, Turkish Rule was established in north India.</li>
</ul>
</li>
<li>&#8226; In <strong>1194</strong>, Ghori defeated the Gahadavala ruler of Kannauj, <strong>Jaichand</strong> in the Battle of <strong>Chandawar</strong>.
<ul>
<li style="padding-left:2em">&#9702; But Ghori was <strong>unable to consolidate</strong> his Indian conquests as his main interest lay in expansion in Central Asia at the cost of Khwarizm.</li>
</ul>
</li>
<li>&#8226; Having laid down the foundations of an empire straddling North India, Afghanistan and Sindh, he appointed <strong>three governors</strong>
<ul>
<li style="padding-left:2em">&#9702; Qutubuddin Aibak - Lahore</li>
<li style="padding-left:2em">&#9702; Tajuddin Yaldoz - Ghur</li>
<li style="padding-left:2em">&#9702; Nasiruddin Qabacha - Sind</li>
</ul>
</li>
<li>&#8226; <strong>After Ghori\u2019s death (1206), his empire broke apart</strong>, with each of the three governors declaring independence and competing against each other.</li>
</ul>"""

with open('lib/noteContent.ts', encoding='utf-8') as f:
    content = f.read()

pattern = r"('early-medieval-india':\s*`)`"
replacement = lambda m: f"'early-medieval-india': `{new_html}`"

new_content, count = re.subn(pattern, replacement, content)

if count == 0:
    print("ERROR: pattern not found")
else:
    with open('lib/noteContent.ts', 'w', encoding='utf-8') as f:
        f.write(new_content)
    print(f"Done. Replaced {count} occurrence(s).")
