import re

new_html = r"""<h2>Khilji Dynasty (1290&#8211;1320)</h2>

<h3>Khilji Revolution</h3>
<p>It is a term that denotes the replacement of the Ilbari dynasty by the Khilji dynasty.</p>
<p>But it was <strong>not simply a change of government,</strong> rather it was something more than that. It involved the following aspects -</p>
<ul>
<li>&#8226; Khiljis came to power not due to the support of the nobility, Ulema or the common people but by <strong>dint of their military strength</strong>.</li>
<li>&#8226; It was a <strong>rejection of the racial policy of the Ilbaris.</strong> As a result, the social basis of the state broadened.
  <ul>
  <li style="padding-left:2em">&#9702; The Khiljis opened the gate of the nobility class not simply to <strong>non-Turks</strong> but also to <strong>Indian Muslims</strong>.</li>
  </ul>
</li>
<li>&#8226; Khilji revolution implied a <strong>revolt of the lower class Muslims</strong> against the established Muslim aristocracy.
  <ul>
  <li style="padding-left:2em">&#9702; In one sense it was a <strong>revolt against those who were looking to Ghazni and Ghur</strong> region for their pedigree.</li>
  </ul>
</li>
<li>&#8226; The Khilji revolution emphasised the <strong>separation of religion from politics</strong>.</li>
<li>&#8226; The Khilji revolution had a <strong>negative side</strong> as well.
  <ul>
  <li style="padding-left:2em">&#9702; It gave too much emphasis on the military aspect of government, but in spite of that limitation, the Khilji revolution implies the beginning of a new era.</li>
  </ul>
</li>
</ul>

<h3>Jalaluddin Khilji (1290&#8211;96)</h3>
<ul>
<li>&#8226; He founded the Khilji dynasty by overthrowing the last Mamluk king. He was 70 at the time of his accession to the throne.</li>
<li>&#8226; His rise to power <strong>ended the monopoly of Turks in high offices</strong>.
  <ul>
  <li style="padding-left:2em">&#9702; The Khilji&#8217;s were an Afghan tribe who could not claim the nobility of pure Turkish blood.</li>
  </ul>
</li>
<li>&#8226; He also <strong>tried to mitigate some of the harsh aspects of Balban&#8217;s rule</strong>.
  <ul>
  <li style="padding-left:2em">&#9702; He believed that the state should be based on the willing support of the governed, and that any state in India could not be a truly Islamic State due to the Hindu majority.</li>
  <li style="padding-left:2em">&#9702; Thus, he tried to win the goodwill of all his subjects by following a policy of tolerance.
    <ul>
    <li style="padding-left:4em">&#9632; For this reason, he was considered a weak ruler.</li>
    </ul>
  </li>
  </ul>
</li>
<li>&#8226; His forgiveness of Balban&#8217;s nephew, Malik Chajju&#8217;s revolt for the second time in 1292 was seen as a sign of weakness, leading to his ultimate assassination by Alauddin Khilji, his nephew and son-in-law.</li>
</ul>

<h3>Alauddin Khilji (1296&#8211;1316)</h3>
<ul>
<li>&#8226; He had helped Jalaluddin in his rise to power and was appointed
  <ul>
  <li style="padding-left:2em">&#9702; <strong>Amir-i-Tuzuk</strong> (master of ceremonies) and <strong>Ariz-i-Mumalik</strong> (commander-in-chief).</li>
  </ul>
</li>
<li>&#8226; During his predecessor&#8217;s reign he had gained the reputation for <strong>military conquest</strong> due to his two victorious campaigns against:
  <ul>
  <li style="padding-left:2em">&#9702; Bhilsa/Vidisha (1292)</li>
  <li style="padding-left:2em">&#9702; Devagiri (1296) - The first Turkish expedition to South India.</li>
  </ul>
</li>
<li>&#8226; In 1296, he assassinated Jalaluddin, crowned himself Sultan, and propounded his own theory of kingship</li>
</ul>

<h4>Theory of kingship</h4>
<p>He borrowed some elements from Balban&#8217;s theory and introduced some unique elements of his own.</p>
<ul>
<li>&#8226; The <strong>principle of strength</strong> was emphasised upon, according to which any person of strength and capability could become Sultan.
  <ul>
  <li style="padding-left:2em">&#9702; Qualifications like legitimate kingship were purely academic and all questions regarding the legality of the Crown were futile.</li>
  <li style="padding-left:2em">&#9702; Alauddin emphasised that the crown is justification in itself.</li>
  </ul>
</li>
<li>&#8226; <strong>Despotism</strong> was central to his theory, even more so than Balban&#8217;s.
  <ul>
  <li style="padding-left:2em">&#9702; According to Alauddin, the <strong>king is answerable only to God</strong>. There should be no secular or religious check on his authority.</li>
  </ul>
</li>
<li>&#8226; <strong>Secularism</strong> was an extension of Alauddin&#8217;s despotism.
  <ul>
  <li style="padding-left:2em">&#9702; He maintained a <strong>strict separation between the state and religion</strong>. He prohibited the ulema from interfering in state affairs.</li>
  <li style="padding-left:2em">&#9702; Thus, he frequently issued <strong>&#8216;Zawabits&#8217;</strong> (secular decrees).</li>
  </ul>
</li>
<li>&#8226; <strong>Racism was absent</strong> and Alauddin did not discriminate on the basis of ethnicity, language or ancestry.
  <ul>
  <li style="padding-left:2em">&#9702; This was a reflection of his Afghan origin, as unlike Balban, he could not claim pure Turkish nobility.</li>
  <li style="padding-left:2em">&#9702; He promoted capable people on the basis of <strong>merit,</strong> including Turks, Afghans, Persians, Tajiks and even Indian Musalmans.</li>
  </ul>
</li>
<li>&#8226; <strong>Imperialism</strong> was another central feature.
  <ul>
  <li style="padding-left:2em">&#9702; Alauddin believed that neighbouring states are necessarily antagonistic. Thus, it was the duty of a strong Sultan to subjugate his neighbours.</li>
  <li style="padding-left:2em">&#9702; His dream of conquest is reflected in his title, <strong>&#8216;Sikander-i-sani&#8217;</strong> (Second Alexander).</li>
  </ul>
</li>
<li>&#8226; He was the first Sultan of Delhi to have a conscious policy of imperialism.
  <ul>
  <li style="padding-left:2em">&#9702; In <strong>North India</strong>, he followed the policy of <strong>direct control:</strong>
    <ul>
    <li style="padding-left:4em">&#9632; 1299 &#8211; Gujarat</li>
    <li style="padding-left:4em">&#9632; 1301 &#8211; Ranthambore</li>
    <li style="padding-left:4em">&#9632; 1303 &#8211; Mewar</li>
    <li style="padding-left:4em">&#9632; 1305 &#8211; Malwa</li>
    <li style="padding-left:4em">&#9632; 1308 &#8211; Jalore</li>
    </ul>
  </li>
  <li style="padding-left:2em">&#9702; In <strong>South India</strong>, he followed the policy of <strong>indirect control</strong>.
    <ul>
    <li style="padding-left:4em">&#9632; Defeated rulers were restored on the condition of annual <strong>tribute</strong> and <strong>recognition of overlordship</strong> of the Sultan.</li>
    </ul>
  </li>
  <li style="padding-left:2em">&#9702; The South Indian campaigns were led by his trusted general, <strong>Malik Kafur</strong>, who subjugated:
    <ul>
    <li style="padding-left:4em">&#9632; 1306 &#8211; Devagiri</li>
    <li style="padding-left:4em">&#9632; 1308 &#8211; Warangal</li>
    <li style="padding-left:4em">&#9632; 1309 &#8211; Dwarasamudra</li>
    <li style="padding-left:4em">&#9632; 1310 &#8211; Madurai</li>
    </ul>
  </li>
  <li style="padding-left:2em">&#9702; Thus, Allauddin transformed the Sultanate from a north Indian principality into a pan Indian empire.</li>
  </ul>
</li>
</ul>

<h4>Military Reforms</h4>
<ul>
<li>&#8226; In order to fulfil his imperialistic ambitions, Allauddin maintained a <strong>huge standing army of 3,50,000 soldiers.</strong></li>
<li>&#8226; He organised his army on the <strong>decimal pattern</strong>.</li>
<li>&#8226; He introduced the practice of <strong>Dagh and Huliya</strong>.</li>
<li>&#8226; He discontinued the practice of being soldiers through Iqtas. Instead, they received regular <strong>cash salaries</strong>.
  <ul>
  <li style="padding-left:2em">&#9702; Cavalrymen were paid 238 Tankas per annum</li>
  <li style="padding-left:2em">&#9702; An additional allowance of 75 Tankas was given for the maintenance of a horse.</li>
  <li style="padding-left:2em">&#9702; Infantrymen were paid 75 Tankas per year.</li>
  </ul>
</li>
</ul>

<h4>Administrative Reforms</h4>
<p>Alauddin Khilji was concerned about the possibility of <strong>rebellions</strong>, which were the most serious challenge to the health of the Sultanate.</p>
<p>After deep introspection and consultation, he came to the conclusion that these rebellions had the following root causes:</p>
<ul>
<li>&#8226; Excessive wealth with the people</li>
<li>&#8226; Negligence of the Sultan&#8217;s</li>
<li>&#8226; Intermarriage among nobles</li>
<li>&#8226; Alcohol</li>
</ul>
<p>In response he proclaimed <strong>four ordinances</strong>:</p>
<ul>
<li>&#8226; To <strong>confiscate all tax-free land grants</strong> such as Inaam, Milk and Waqf; and abolish all tax exemptions enjoyed by the upper and lower nobility.</li>
<li>&#8226; To <strong>reorganise the spy system</strong>, with a large number of regular spies (Barid) and irregular spies (Muhiyan).</li>
<li>&#8226; All <strong>nobles must seek prior permission from the Sultan before intermarrying</strong>.</li>
<li>&#8226; To <strong>prohibit consumption of alcohol</strong>.
  <ul>
  <li style="padding-left:2em">&#9702; According to Barni, he gave it up himself. However, people started fermenting their own wine.</li>
  <li style="padding-left:2em">&#9702; Therefore, he modified the order and allowed private consumption.</li>
  </ul>
</li>
</ul>

<h4>Revenue reforms</h4>
<p>These were part of his larger internal reforms and restructuring, through which he <strong>wanted to fill the state treasury so that he could raise a large army</strong>.</p>
<p>He was also determined to <strong>take away the excess wealth</strong> from his subjects to prevent the possibility of a rebellion.</p>
<ul>
<li>&#8226; He introduced the <strong>Mashahat system</strong> of survey and measurement.
  <ul>
  <li style="padding-left:2em">&#9702; A new unit of land measurement known as the <strong>Wafa-i-Biswa</strong> was introduced to measure farm area.</li>
  <li style="padding-left:2em">&#9702; Produce was estimated by applying the average yield to the farm area.</li>
  <li style="padding-left:2em">&#9702; The rate of land revenue was fixed at 50% of the produce.</li>
  </ul>
</li>
<li>&#8226; All <strong>intermediaries</strong> such as Khut, Muqaddam and Iqtadars were <strong>deprived of their revenue collection duties.</strong>
  <ul>
  <li style="padding-left:2em">&#9702; They were also <strong>ordered to pay land revenue at the prevailing rate</strong>. Their tax exemptions were abolished.</li>
  <li style="padding-left:2em">&#9702; <strong>Diwan-i-Mustakharaj</strong> was created to collect accumulated revenue from the upper and lower nobility on a retrospective basis</li>
  </ul>
</li>
<li>&#8226; All <strong>tax-free land grants were confiscated.</strong></li>
<li>&#8226; <strong>Ghari</strong> (house tax) and <strong>Charai</strong> (grazing tax) were imposed.</li>
<li>&#8226; The rate of <strong>Khums</strong> (states share in war booty) was increased to 4/5.</li>
<li>&#8226; The <strong>Patwari&#8217;s accounts were frequently inspected</strong> in order to prevent embezzlement.
  <ul>
  <li style="padding-left:2em">&#9702; Irregularities were punished severely.</li>
  </ul>
</li>
</ul>

<h4>Market Reforms/ Price Controls</h4>
<ul>
<li>&#8226; These were an elaborate system of price controls <strong>designed to allow him to raise and maintain a large army</strong> to fulfil his imperialistic ambitions of a pan-Indian empire.</li>
<li>&#8226; The Empire was divided into:
  <ul>
  <li style="padding-left:2em">&#9702; <strong>Free zone</strong></li>
  <li style="padding-left:2em">&#9702; <strong>Control zone</strong> &#8211; Price control was implemented only here.
    <ul>
    <li style="padding-left:4em">&#9632; It stretched from Lahore to Allahabad.</li>
    <li style="padding-left:4em">&#9632; This was the most populous region of the Empire.</li>
    <li style="padding-left:4em">&#9632; The control of the Sultan was strongest here.</li>
    <li style="padding-left:4em">&#9632; The majority of the army was garrisoned in cities within the zone.</li>
    </ul>
  </li>
  </ul>
</li>
<li>&#8226; A new department called <strong>Diwan-i-Riyasat</strong> was created to implement these reforms.</li>
<li>&#8226; <strong>Three different kinds of markets</strong> for established:
  <ul>
  <li style="padding-left:2em">&#9702; <strong>Mandi</strong> for food items</li>
  <li style="padding-left:2em">&#9702; <strong>Sardar Adl</strong> for essential goods such as sugar, salt, oil and cloth</li>
  <li style="padding-left:2em">&#9702; <strong>Market for living beings</strong> such as horses and slaves</li>
  </ul>
</li>
<li>&#8226; <strong>Prices of all commodities were fixed by the state.</strong>
  <ul>
  <li style="padding-left:2em">&#9702; A strict system of weights and measures was introduced.
    <ul>
    <li style="padding-left:4em">&#9632; Underweighing, overpricing and black marketing were punished severely.</li>
    <li style="padding-left:4em">&#9632; Spies employed by the state used to report such activities.</li>
    <li style="padding-left:4em">&#9632; Surprise inspections were also conducted.</li>
    </ul>
  </li>
  </ul>
</li>
<li>&#8226; Steps were taken to <strong>ensure the availability</strong> of important commodities:
  <ul>
  <li style="padding-left:2em">&#9702; Half the revenue from the Doab was collected in kind.</li>
  <li style="padding-left:2em">&#9702; Licences were issued to Banjaras (nomadic grain traders) to transport grains from the countryside to the cities.</li>
  <li style="padding-left:2em">&#9702; Only licensed traders were allowed to set up shop inside the market.</li>
  <li style="padding-left:2em">&#9702; Luxury goods were rationed</li>
  <li style="padding-left:2em">&#9702; The state subsidised imported items.</li>
  </ul>
</li>
<li>&#8226; A police official known as the <strong>Shahna-i-Mandi</strong> was appointed to maintain law and order.</li>
</ul>

<h4>Impact of Price Controls</h4>
<ul>
<li>&#8226; Alauddin&#8217;s price controls were remarkably successful. He was <strong>able to raise a large army at a low-cost</strong>.</li>
<li>&#8226; According to <strong>Barni</strong>, <strong>city dwellers benefited</strong> from the low prices and easy availability of goods.</li>
<li>&#8226; However, <strong>food producers/farmers outside cities suffered</strong>.
  <ul>
  <li style="padding-left:2em">&#9702; They were not able to drive the benefit of price controls themselves.</li>
  <li style="padding-left:2em">&#9702; Moreover, their bargaining power with respect to grain traders also suffered.</li>
  </ul>
</li>
</ul>

<h4>Alauddin Khilji &#8212; Land Revenue</h4>
<ul>
<li>&#8226; <strong>Alauddin Khilji:</strong> He wanted to maintain a powerful army and this project needed larger resources, so he became the first Sultan to directly intervene in rural administration.
  <ul>
  <li style="padding-left:2em">&#9702; Measures taken by Alauddin Khilji-
    <ul>
    <li style="padding-left:4em">&#9632; He converted Milk, Waqf and Inam land into Khalisa land in order to boost the royal income.</li>
    <li style="padding-left:4em">&#9632; He abolished intermediaries like Mukuddam and Chaudhary.</li>
    <li style="padding-left:4em">&#9632; He carried land measurement and his system was known as Mashahat system.</li>
    <li style="padding-left:4em">&#9632; He increased the rates of land revenue to 50% of the total production.</li>
    <li style="padding-left:4em">&#9632; Also, Ghari (house tax) and Charai (grazing tax) taxes were imposed.</li>
    </ul>
  </li>
  </ul>
</li>
<li>&#8226; Also: <strong>Alauddin</strong> Khilji increased the intervention of the centre at the Iqtas through regulation of provincial revenue.</li>
</ul>

<h2>Tughlaq Dynasty (1320&#8211;1412)</h2>

<h3>Ghiasuddin Tughlaq (1321&#8211;25)</h3>
<ul>
<li>&#8226; Originally called &#8216;Ghazi Malik&#8217;, he was an important commander under Alauddin.</li>
<li>&#8226; He ascended to the throne as Gihasuddin Tughlaq in 1321, thus becoming the founder of his dynasty.</li>
<li>&#8226; He laid the foundations of Tughlaqabad near Delhi.</li>
<li>&#8226; <strong>Gyasuddin</strong> Tughlaq separated the salary of soldiers from the personal salary of Muqtis to prevent them from appropriating any part of the soldiers&#8217; salary.</li>
<li>&#8226; The system of Alauddin Khilji was discarded by <strong>Gyasuddin Tughlaq who revived the crop sharing or batai system.</strong></li>
</ul>

<h3>Mohammed bin Tughlaq (1325&#8211;51 CE)</h3>
<p>Originally called <strong>Jauna Khan</strong>, he assassinated his father and ascended the throne as Mohammed bin Tughlaq.</p>
<ul>
<li>&#8226; In history, he is looked upon as a <strong>paradox</strong> - a mixture of opposites; a generous and at the same time a pitiless ruler; a &#8216;Mad King;&#8217; and the &#8216;Wisest Fool&#8217;.
  <ul>
  <li style="padding-left:2em">&#9702; This was mostly due to his ambitious projects and the novel experiments which were all far ahead of their time.</li>
  </ul>
</li>
<li>&#8226; He was the only Delhi sultan to have received <strong>comprehensive literary, religious and philosophical education.</strong></li>
<li>&#8226; <strong>Very tolerant religiously</strong>, he heavily patronised non-Muslims:
  <ul>
  <li style="padding-left:2em">&#9702; He promoted a number of Hindus to high office, both in civilian as well as military capacities.</li>
  <li style="padding-left:2em">&#9702; Jina Prabha Suri (Jain scholar) was his close personal friend and trusted advisor.</li>
  <li style="padding-left:2em">&#9702; He celebrated the festival of Holi with great fanfare.</li>
  <li style="padding-left:2em">&#9702; He even visited the Hindu and Jain Temples of Mt. Abu and made donations towards them.</li>
  </ul>
</li>
<li>&#8226; He maintained <strong>diplomatic relations with Egypt, Persia and China.</strong></li>
<li>&#8226; As a Prince he led an expedition against the Kakatiya ruler Rai Rudra Dev and brought <strong>Warangal</strong> under the <strong>direct control</strong> of the Delhi Sultanate.</li>
<li>&#8226; In 1324 he also defeated Bhanu Dev II, the ruler of <strong>Janjnagar</strong> (Odisha), who had helped Rai Rudra Dev and annexed his territory as well.</li>
</ul>

<h4>Muhammad bin Tughlaq is famous for his 6 experiments</h4>

<h4>Transfer of capital (1327&#8211;1328)</h4>
<ul>
<li>&#8226; The capital was shifted from Delhi to <strong>Daulatabad</strong>.</li>
<li>&#8226; He had established <strong>direct control over South India</strong> and Daulatabad was better suited to govern the new territory.</li>
<li>&#8226; Moreover, it was <strong>relatively safer than Delhi</strong>, which was constantly under Mongol threat.</li>
<li>&#8226; According to <strong>Barni</strong>, all residents of Delhi were forced to make the long journey in the height of summer, on foot. Not even cats and dogs had been left behind.</li>
<li>&#8226; Soon after reaching Daulatabad, the Sultan was forced to reconsider the transfer due to <strong>shifting political currents</strong> in South India.
  <ul>
  <li style="padding-left:2em">&#9702; Many newly acquired territories had <strong>rebelled</strong> against the Sultanate and his position in Daulatabad had become precarious.</li>
  </ul>
</li>
<li>&#8226; Further, most historians suggest that <strong>Delhi was never deserted completely</strong>. Coins struck in 1329 have been discovered, along with 2 Sanskrit inscriptions from Naraina in Delhi, belonging to 1327 &amp; 1328.</li>
</ul>

<h4>Token Concurrency (1329&#8211;1333)</h4>
<ul>
<li>&#8226; Mohammed bin Tughlaq issued <strong>base metal coins</strong> of copper and bronze instead of gold and silver coins.</li>
<li>&#8226; This experiment had to be <strong>abandoned due to widespread forgery</strong>.</li>
<li>&#8226; As a result of forgery, public confidence declined and the state was forced to replace them with precious metal coins.</li>
<li>&#8226; Barni says that peasants used forged coins to pay revenue and rebels used them to buy horses and arms.</li>
</ul>

<h4>Khorasan Expedition (1333&#8211;1334)</h4>
<ul>
<li>&#8226; Muhammad bin Tughlaq wanted to capture the Khurasan region (Central Asia).</li>
<li>&#8226; According to <strong>Barni</strong>, the <strong>flattery</strong> of some Khorasani nobles had filled the Sultan&#8217;s head with lofty ideas.
  <ul>
  <li style="padding-left:2em">&#9702; Other <strong>contemporary sources</strong> suggest that the plan was the outcome of the prevailing <strong>political chaos</strong> in Khurasan after the death of Tamarshin Khan.</li>
  </ul>
</li>
<li>&#8226; He raised a <strong>3.7 Lakh strong army</strong> and paid them 1 year&#8217;s salary in advance.</li>
<li>&#8226; However after waiting for six months the <strong>plan was abandoned.</strong>
  <ul>
  <li style="padding-left:2em">&#9702; <strong>Barni</strong> says that the Sultan realised his mistake and came to his senses.</li>
  <li style="padding-left:2em">&#9702; According to him the treasury had been emptied completely and the soldiers turned to highway robbery.</li>
  </ul>
</li>
<li>&#8226; However, other contemporary sources inform that <strong>Abu Said</strong> (a powerful ruler), had established control over Khorasan before the Sultan&#8217;s plan could materialise.</li>
</ul>

<h4>Qarachil Expedition (1333&#8211;1334)</h4>
<ul>
<li>&#8226; Qarachil was a <strong>small Himalayan tributary state</strong> of the sultanate, along the Indo-Tibetan frontier.
  <ul>
  <li style="padding-left:2em">&#9702; During Muhammad bin Tughlaq&#8217;s reign, it <strong>declared independence</strong> and stopped paying the annual tribute.</li>
  <li style="padding-left:2em">&#9702; The Sultan in turn, sent a force of 10,000 soldiers to subdue the recalcitrant state.</li>
  </ul>
</li>
<li>&#8226; According to <strong>Barni the hasty campaign was disastrous</strong>.
  <ul>
  <li style="padding-left:2em">&#9702; The men were poorly supplied and the Sultan had made the mistake of appointing Hindu commanders.</li>
  <li style="padding-left:2em">&#9702; Thus, the forces were soundly defeated, and only 10 men returned to Delhi, empty handed.</li>
  <li style="padding-left:2em">&#9702; In a fit of rage, the Sultan executed them on the spot.</li>
  </ul>
</li>
<li>&#8226; However, <strong>other contemporary sources</strong> suggest that it was <strong>successful</strong>, and Qarachil was brought back into the fold.
  <ul>
  <li style="padding-left:2em">&#9702; However, it was also <strong>costly</strong> due to the unfamiliar terrain and inclement weather.</li>
  <li style="padding-left:2em">&#9702; While returning there was heavy rainfall and many soldiers were lost in landslides.</li>
  </ul>
</li>
</ul>

<h4>Taxation in the Doab (1333&#8211;1334)</h4>
<ul>
<li>&#8226; Due to expensive military campaigns and disastrous policy experiments, the imperial <strong>treasury was critically depleted</strong> and in order to replenish it, the Sultan introduced a <strong>new tax policy</strong> in the Ganga Yamuna doab.
  <ul>
  <li style="padding-left:2em">&#9702; According to <strong>Barni</strong> the burden of taxation was increased by <strong>10-20 times</strong>.</li>
  <li style="padding-left:2em">&#9702; <strong>Sirhindi</strong> informs us that it was increased by more than <strong>20 times.</strong></li>
  <li style="padding-left:2em">&#9702; <strong>Isami</strong> says that it was <strong>doubled</strong>.</li>
  </ul>
</li>
<li>&#8226; <strong>Modern</strong> historical research suggests that the official rate of the taxation was the <strong>same as Alauddin&#8217;s reign (50%)</strong>.</li>
<li>&#8226; However, the policy failed due to the <strong>insensitivity and corruption</strong> of state officials in collecting revenue from helpless peasants.
  <ul>
  <li style="padding-left:2em">&#9702; The very year that the policy was implemented, a <strong>severe drought</strong> affected north India, resulting in widespread crop failure.</li>
  <li style="padding-left:2em">&#9702; However, tax officials <strong>forced peasants to pay</strong> the increased land revenue.</li>
  <li style="padding-left:2em">&#9702; Further, they also collected <strong>&#8216;Abwabs&#8217;</strong> (illegal cesses) from the already distressed peasants.</li>
  </ul>
</li>
<li>&#8226; Many peasants abandoned their fields, let their cattle loose and fled to the forests. <strong>Agriculture collapsed</strong> completely and contemporary sources inform us that <strong>famine affected north India for the next eight years.</strong></li>
<li>&#8226; When the Sultan learnt of the situation, he immediately suspended tax collection and introduced <strong>rehabilitative measures.</strong>
  <ul>
  <li style="padding-left:2em">&#9702; A new department of agriculture known as the <strong>Diwan-i-Amir Kohi</strong> was established, through which the state made rehabilitative loans known as <strong>&#8216;Sondhar/Taqavvi&#8217; loans</strong> to peasants so that they may purchase seeds, agricultural implements, animals and fodder. The state also provided assistance in digging wells.</li>
  <li style="padding-left:2em">&#9702; A new <strong>famine code</strong> was also promulgated, consisting of guidelines regarding the state&#8217;s response to famine.</li>
  </ul>
</li>
</ul>

<h4>Model Agricultural Farm (1337&#8211;38)</h4>
<p>The disastrous Taxation experiment in the Doab had resulted in a complete collapse of agriculture.</p>
<ul>
<li>&#8226; To <strong>revive</strong> it, the Sultan created a model agricultural farm, from which <strong>new methods, techniques and practices</strong> could be taken to the general population.</li>
<li>&#8226; Further, the farm was also meant to <strong>expand agriculture</strong> in order to replenish the state treasury.</li>
<li>&#8226; A parcel of land measuring roughly <strong>100 square kilometres</strong> was selected and a sum of <strong>70 Lakh Tankas</strong> was set aside for distribution among peasants over 3 years to expand agriculture.</li>
<li>&#8226; According to Barni, <strong>not a single inch of additional land</strong> was brought under the plough.
  <ul>
  <li style="padding-left:2em">&#9702; The Sultan had envisaged expansion of agriculture by bringing uncultivated fertile land under the plough. However, the plot of land selected was <strong>completely barren</strong>.</li>
  <li style="padding-left:2em">&#9702; Much of the money set aside to expand agriculture was <strong>misappropriated</strong> by the bureaucracy.</li>
  <li style="padding-left:2em">&#9702; Finally, the money which reached the peasants was used by them to <strong>fulfil their basic needs since they had still not recovered from the long years of famine.</strong></li>
  </ul>
</li>
</ul>
<p>As a result of these disastrous policies, <strong>revolts and rebellions</strong> were frequent.</p>
<ul>
<li>&#8226; <strong>1335</strong> &#8211; <strong>Madurai</strong> broke away from the Sultanate</li>
<li>&#8226; <strong>1336</strong> &#8211; Harihara and Bukka declared independence and established the <strong>Vijaynagar</strong> Empire.</li>
<li>&#8226; <strong>1338</strong> &#8211; Rebellion erupted in <strong>Bengal</strong> which declared its independence.</li>
<li>&#8226; <strong>1347</strong> &#8211; Deccan slipped out of the grasp of the Sultanate and Alauddin Bahman Shah established the <strong>Bahmani</strong> Sultanate.</li>
</ul>
<p>Also: <strong>Mohammed bin Tughlaq</strong> took many stern steps to put a check on the misappropriation of funds.</p>
<ul>
<li style="padding-left:2em">&#9702; Firstly, he began appointing two officers of equivalent rank in the Iqta. They were known as Muqti and <strong>Wali-ul-Kharaj</strong>.
  <ul>
  <li style="padding-left:4em">&#9632; The first was responsible for general administration while the second was responsible for collecting revenue in cash.</li>
  </ul>
</li>
<li style="padding-left:2em">&#9702; Further, Mohammed bin Tughlaq introduced the practice of <strong>appropriating the entire revenue collected from the Iqta in favour of the central treasury</strong>. Muqti and other officers were paid cash salaries.</li>
<li style="padding-left:2em">&#9702; It was due to this fact that there were so many revolts against Mohammed bin Tughlaq.</li>
</ul>
<p>Also: <strong>Muhammad-bin-Tughlaq</strong> became the first Sultan who tried to introduce a new theory in land revenue system.</p>
<ul>
<li style="padding-left:2em">&#9702; He proposed that royal income can be increased not simply by increasing the rate of land revenue but also by <strong>increasing production</strong>.</li>
<li style="padding-left:2em">&#9702; This measure later inspired rulers like Sher Shah and Akbar as well.</li>
</ul>

<h3>Feroz Shah Tughlaq (1351&#8211;88)</h3>
<ul>
<li>&#8226; After the death of Muhammad bin Tughluq, his cousin Feroz Shah Tughlaq was elevated to the position of Sultan by the nobles.</li>
<li>&#8226; Feroz Shah Tughlaq ascended to the throne at a time of <strong>great crisis</strong>. His predecessor&#8217;s policies had extracted a heavy cost.
  <ul>
  <li style="padding-left:2em">&#9702; The Sultanate had lost much of its <strong>territory</strong> and been reduced to a north Indian principality.</li>
  <li style="padding-left:2em">&#9702; <strong>Agriculture</strong> was in ruins and was yet to recover from the disastrous taxation policy. <strong>Unrest</strong> among the peasants was high and they were on the verge of rebellion.</li>
  <li style="padding-left:2em">&#9702; Likewise, the <strong>nobility and clergy</strong> had seen their power and privilege disappear under Muhammad bin Tughluq and were looking to retaliate.</li>
  <li style="padding-left:2em">&#9702; The <strong>treasury</strong> was completely depleted due to Muhammad bin Tughluq&#8217;s adventurism.</li>
  <li style="padding-left:2em">&#9702; <strong>Rebellions</strong> were frequent, with <strong>Bengal and Sind</strong> being the most problematic.</li>
  </ul>
</li>
<li>&#8226; The situation demanded an able administrator and gifted general. Feroz Shah Tughlaq lacked both these qualities. Therefore, he adopted a <strong>policy of appeasement</strong>, both internally and externally.</li>
</ul>

<h4>External Policy</h4>
<ul>
<li>&#8226; In the early part of his reign, Feroz Shah Tughlaq undertook <strong>four military campaigns.</strong>
  <ul>
  <li style="padding-left:2em">&#9702; He <strong>successfully raided Nagarkot</strong> (HP), destroyed the Jwalamukhi temple there, and extracted tribute from its ruler.</li>
  <li style="padding-left:2em">&#9702; The <strong>other three</strong> campaigns ended in <strong>complete failure</strong>, two against Bengal and one against Sind.
    <ul>
    <li style="padding-left:4em">&#9632; The <strong>Sind invasion could not even materialise</strong> because the Sultan and his army lost its way in the Rann of Kutch and had to be rescued by his Prime Minister Khan-i-Jahan.</li>
    </ul>
  </li>
  </ul>
</li>
<li>&#8226; Following this, the Sultan <strong>abandoned the policy of war</strong>. He declared that he did not wish to gain territory by shedding the blood of innocent Muslims.</li>
<li>&#8226; However, most modern historians believe that his pacifism was a result of his <strong>military ineptitude.</strong></li>
</ul>

<h4>Internal/ Domestic Policy</h4>
<p>Feroz Shah Tughlaq&#8217;s reign was more notable for his internal administration, to which he also applied his <strong>policy of appeasement</strong>, and to restore normalcy after the turbulent rule of his predecessor.</p>
<ul>
<li>&#8226; <strong>Revenue Reforms</strong>
  <ul>
  <li style="padding-left:2em">&#9702; A <strong>detailed survey</strong> was conducted under Khan-i-Jahan (Prime Minister). The revenue of the entire Sultanate was permanently fixed at 6.5 Crore Tankas.</li>
  <li style="padding-left:2em">&#9702; Feroz Shah Tughlaq abolished 21 non-Shariat taxes and replaced them with the <strong>5 Shariat taxes.</strong>
    <ul>
    <li style="padding-left:4em">&#9632; Kharaj - Land revenue collected from non-Muslims</li>
    <li style="padding-left:4em">&#9632; Ushr - Land revenue collected from Muslims</li>
    <li style="padding-left:4em">&#9632; Khums - The share of the state in war booty - it was restored to the prescribed proportion of &#8533;.</li>
    <li style="padding-left:4em">&#9632; Zakat - Charitable donation made by Muslims.</li>
    <li style="padding-left:4em">&#9632; Jizya - Poll tax imposed on Non-Muslims. He was the first Sultan to collect it separately from Kharaj. He also imposed it upon Brahmins, who had been exempted till now.</li>
    </ul>
  </li>
  <li style="padding-left:2em">&#9702; <strong>Barni</strong> informs us that as a result of these reforms, agriculture flourished and the imperial treasury was refilled.
    <ul>
    <li style="padding-left:4em">&#9632; There was no shortage or famine, the peasants were happy and new land was brought under the plough.</li>
    </ul>
  </li>
  </ul>
</li>
<li>&#8226; <strong>Agrarian Reforms</strong>
  <ul>
  <li style="padding-left:2em">&#9702; Small experimental farms were set up in the vicinity of Delhi.</li>
  <li style="padding-left:2em">&#9702; <strong>1200 orchards</strong> and gardens were laid around Delhi, which yielded an annual income of 1.8 Lakh Tankas.</li>
  <li style="padding-left:2em">&#9702; The state also encouraged the cultivation of <strong>superior crops</strong> such as wheat instead of millets and rice instead of paddy.</li>
  <li style="padding-left:2em">&#9702; The <strong>Taqavi loans</strong> made during Mohammed bin Tughlaq&#8217;s reign were <strong>written off</strong>.</li>
  <li style="padding-left:2em">&#9702; A network of <strong>five major canals</strong> was constructed around Delhi - Two from the Yamuna, and one each from the Ghaggar, the Sutlej and the Kali Sindh.</li>
  <li style="padding-left:2em">&#9702; An irrigation tax of 10%, known as <strong>&#8216;Haq-i-Sharb&#8217;</strong> was also introduced.</li>
  <li style="padding-left:2em">&#9702; <strong>Barni</strong> reports that these reforms were highly successful and that there was no shortage of food during his reign.
    <ul>
    <li style="padding-left:4em">&#9632; The prices of food grains and fruits were low</li>
    <li style="padding-left:4em">&#9632; Even the poor could afford rich fare including fruits and ghee.</li>
    </ul>
  </li>
  </ul>
</li>
<li>&#8226; <strong>Judicial Reforms</strong>
  <ul>
  <li style="padding-left:2em">&#9702; The <strong>penal code was made milder</strong> and inhumane practices such as torture and amputations were prohibited.</li>
  </ul>
</li>
<li>&#8226; <strong>Welfare Initiatives</strong>
  <ul>
  <li style="padding-left:2em">&#9702; Firoz Shah Tughlaq used the state machinery for the welfare of his subjects.
    <ul>
    <li style="padding-left:4em">&#9632; <strong>Diwan-i-Ishtiaq</strong> - Created to help those who had suffered under the reign of Muhammad bin Tughluq by giving them state pensions.</li>
    <li style="padding-left:4em">&#9632; <strong>Diwan-i-Khairat</strong> - Established to help poor parents marry their daughters.</li>
    <li style="padding-left:4em">&#9632; <strong>Diwan-i-Bandagan</strong> - You look after the welfare of slaves. The Sultan himself and more than 1.8 lakh slaves.</li>
    <li style="padding-left:4em">&#9632; <strong>Dar-ul Shifa/ Dawakhana</strong> - These were hospitals/ infirmaries overseen by competent physicians employed by the state. Treatment was provided free of cost.</li>
    <li style="padding-left:4em">&#9632; <strong>Free Kitchens</strong> - The state organised Langars to provide free meals to the poor.</li>
    <li style="padding-left:4em">&#9632; <strong>Travellers&#8217; Welfare</strong> - A number of measures were initiated for the welfare of travellers, such as maintenance of state owned rest houses and inns, plantation of shady trees along roads and digging of wells along state highways at state expense.</li>
    </ul>
  </li>
  <li style="padding-left:2em">&#9702; It must be kept in mind that under Feroz Shah Tughlaq, these welfare programmes were aimed not only to provide relief to subjects but also as a <strong>means of promoting Islam</strong>.
    <ul>
    <li style="padding-left:4em">&#9632; They were available only to Muslims and were meant to act as inducements to non-Muslims to convert to Islam.</li>
    </ul>
  </li>
  </ul>
</li>
<li>&#8226; <strong>Public Works</strong>
  <ul>
  <li style="padding-left:2em">&#9702; Firoz Shah Tughlaq was the most prolific builder among all the Sultan&#8217;s of Delhi.
    <ul>
    <li style="padding-left:4em">&#9632; He built <strong>five cities</strong>
      <ul>
      <li style="padding-left:6em">&#9679; Feroz Shah Kotla/ Firozabad (Delhi)</li>
      <li style="padding-left:6em">&#9679; Fatehabad (Haryana)</li>
      <li style="padding-left:6em">&#9679; Hisar Firoza (Haryana)</li>
      <li style="padding-left:6em">&#9679; Firozabad (UP)</li>
      <li style="padding-left:6em">&#9679; Jaunpur (UP)</li>
      </ul>
    </li>
    <li style="padding-left:4em">&#9632; He also constructed a network of <strong>five major canals</strong> around Delhi.</li>
    <li style="padding-left:4em">&#9632; He repaired the <strong>Hauz-i-Shamsi</strong> (built by Iltutmish) and the <strong>Hauz-i-Alai/Hauz Khas</strong> (built by Alauddin Khilji)</li>
    <li style="padding-left:4em">&#9632; He <strong>repaired the Qutub Minar</strong>, which had been destroyed by lightning, and added its fifth story.</li>
    <li style="padding-left:4em">&#9632; He <strong>transported 2 Ashokan pillars</strong> to Delhi from Meerut and Topara.</li>
    <li style="padding-left:4em">&#9632; He designed an astronomical calendar called <strong>&#8216;Utsarlab&#8217;</strong> in order to better detect the onset of seasons.</li>
    <li style="padding-left:4em">&#9632; The concept of clock towers was introduced by him. These were known as <strong>&#8216;Tas-i-Gharial&#8217;</strong>.</li>
    <li style="padding-left:4em">&#9632; He also constructed a number of saris, palaces, bridges, mosques, madrasas and pleasure resorts.</li>
    </ul>
  </li>
  </ul>
</li>
<li>&#8226; <strong>Patronage to Learning</strong>
  <ul>
  <li style="padding-left:2em">&#9702; Feroz Shah Tughlaq was a gifted scholar and the only Sultan to write an autobiography called <strong>&#8216;Futuhat-i-Firoz Shahi&#8217;</strong>.</li>
  <li style="padding-left:2em">&#9702; He also patronised accomplished <strong>scholars</strong> such as Barni and Afif, among others.</li>
  <li style="padding-left:2em">&#9702; During the plunder of the Jwalamukhi Temple (Nagarkot), 1300 rare Sanskrit manuscripts were confiscated. Firoz Shah had them translated to Persian in 3 different compilations.
    <ul>
    <li style="padding-left:4em">&#9632; &#8216;Ragdarpan&#8217; - A work on music</li>
    <li style="padding-left:4em">&#9632; &#8216;Tib-i-Firuzshahi&#8217; - A work on medicine</li>
    <li style="padding-left:4em">&#9632; &#8216;Dalil-i-Firuzshahi&#8217; - A work on philosophy</li>
    </ul>
  </li>
  </ul>
</li>
</ul>

<h4>Firozshah Tughlaq as the &#8216;Ideal Muslim King&#8217;</h4>
<p><strong>Barni</strong> in his <strong>&#8216;Fatwa-i-Jahandari&#8217;</strong>, has highlighted the qualities of an ideal Muslim king. In his judgement, Firoz Shah Tughlaq fulfils these qualities.</p>
<ul>
<li>&#8226; Firoz Shah followed an <strong>orthodox religious policy</strong> in accordance with the Shariat.</li>
<li>&#8226; He showed utmost respect to the <strong>ulema</strong>, who became immensely influential during his reign.</li>
<li>&#8226; He tried to <strong>promote Islam as a matter of state policy</strong>. For this, the <strong>carrot and stick approach</strong> was adopted.
  <ul>
  <li style="padding-left:2em">&#9702; Converted Hindus were rewarded with government appointments, tax exemptions and welfare measures.</li>
  <li style="padding-left:2em">&#9702; On the other hand, those who resisted conversion were punished with tools such as Jizya, pilgrimage tax and destruction of temples.</li>
  <li style="padding-left:2em">&#9702; He separated Jizya from Kharaj for the first time and also imposed it on Brahmins.</li>
  </ul>
</li>
<li>&#8226; In his own words, he <strong>abandoned the policy of violent conquest</strong> to avoid shedding the blood of innocent Muslims.</li>
<li>&#8226; <strong>Forcible conversions</strong> were also carried out even during peacetime.</li>
<li>&#8226; <strong>Persecution of non-Muslims</strong> was also common. He once had a Brahmin burnt alive for merely suggesting that Hinduism is superior to Islam.</li>
</ul>
<p>Although Barni has portrayed Firoz Shah as an Ideal Muslim King, who not only followed the Islamic law in letter and spirit, but also made it a state priority to promote Islam, many of the <strong>Sultan&#8217;s personal traits contradict this notion.</strong></p>
<ul>
<li>&#8226; He was <strong>addicted to gambling and drinking</strong>, which are both prohibited under Islam. He also did not make any effort to prohibit these practices.</li>
<li>&#8226; <strong>Music</strong> is prohibited by orthodox Islamists, however, Feroz Shah himself was an accomplished musician and generously patronised music.</li>
<li>&#8226; Islam permits a man to have a <strong>maximum of 4 wives</strong>. The sultan had many more than that number.</li>
<li>&#8226; Although he abolished several non-Shariat taxes, he also introduced the <strong>Haq-i-Sharb</strong>, which does not have any recognition under Shariat.</li>
<li>&#8226; While writing off <strong>Taqavi loans</strong>, he did not differentiate between Muslims and Non-Muslims.</li>
</ul>
<p>A closer examination of his reign reveals that his religious policy was shaped not only by his <strong>personal outlook</strong> but also by his <strong>political compulsions.</strong></p>
<ul>
<li>&#8226; Many historians believe that:
  <ul>
  <li style="padding-left:2em">&#9702; Through his orthodox policy, he was <strong>trying to compensate for having a Hindu mother.</strong></li>
  <li style="padding-left:2em">&#9702; Due to his <strong>weak nature and the political turmoil</strong> within the Sultanate, he was forced to seek the support of the Ulemas and orthodox Muslims, which pulled the state towards greater orthodoxy.</li>
  </ul>
</li>
</ul>
<p>As such, it would be safe to conclude that his religious policy was an more an outcome of his own weakness as a Sultan and the political compulsions of his time, rather than any desire to live up to the model of an Ideal Muslim King.</p>

<h2>Invasion of Amir Timur (1398)</h2>
<p><strong>Afif</strong>, in his <strong>&#8216;Tarikh-i-Firuzshahi&#8217;</strong>, has recounted the horror of the Turkish invasion and the sack of Delhi under Amir Timur, during the reign of <strong>Naseeruddin Mohammad Tughlaq.</strong></p>
<ul>
<li>&#8226; According to him, the invading forces <strong>slaughtered the entire population of Delhi</strong>, not sparing even the elderly and crippled.</li>
<li>&#8226; A <strong>large number of Indians were enslaved</strong> and sent to Central Asia in chains.</li>
<li>&#8226; There was <strong>large-scale plunder</strong> and the Sultan was forced to pay a sum amounting to <strong>3 years of revenue</strong> to purchase peace.</li>
<li>&#8226; The invasion had a <strong>lasting political impact</strong> on the Delhi Sultanate:
  <ul>
  <li style="padding-left:2em">&#9702; The prestige of the Tughlaqs was completely destroyed leading to their ultimate downfall.</li>
  <li style="padding-left:2em">&#9702; Frequent rebellions destabilised the empire.</li>
  <li style="padding-left:2em">&#9702; Punjab slipped out of the grasp of the Sultan. Amir Timur appointed Khizr Khan, as the governor of Punjab. He regularly interfered in the political affairs at Delhi.</li>
  <li style="padding-left:2em">&#9702; This became the background for the emergence of the Sayyid Dynasty founded by Khizr Khan. It replaced the Tughlaqs in 1414.</li>
  </ul>
</li>
<li>&#8226; Delhi also <strong>lost its place as the cultural centre</strong> of the Islamic world. Timur carried off the learned men, artists, architects, poets, musicians, scientists, philosophers and theologians of Delhi to Samarkand.</li>
</ul>

<h2>Role of Firuz Shah Tughlaq in the decline of Delhi Sultanate</h2>
<p>The evaluation of the role of Firuz Shah Tughlaq in the decline of Delhi Sultanate is an important question in Medieval historiography.</p>
<ul>
<li>&#8226; <strong>Traditionally</strong> it was believed that the policy of <strong>appeasement</strong> by Firuzshah Tughlaq proved instrumental in the decline of Delhi Sultanate.</li>
<li>&#8226; But this issue should be discussed in a larger context. When we observe minutely we find that from the very beginning <strong>a rupture already existed</strong> in the basic structure of the state. These were:
  <ul>
  <li style="padding-left:2em">&#9702; Conflict between Sultan and nobility</li>
  <li style="padding-left:2em">&#9702; Conflict between Sultan and Ulema class</li>
  <li style="padding-left:2em">&#9702; Conflict between different sections of the nobility</li>
  </ul>
</li>
<li>&#8226; <strong>It was not Firuzshah Tughlaq who gave birth to these problems.</strong>
  <ul>
  <li style="padding-left:2em">&#9702; From Iltutmish to Muhammad-Bin-Tughlaq almost all the sultans of Delhi tried to solve these problems in their respective manner.</li>
  <li style="padding-left:2em">&#9702; It was in this context that Muhammad-Bin-Tughlaq followed a strict policy.</li>
  <li style="padding-left:2em">&#9702; As a result of this he left behind a <strong>disgruntled nobility and dissatisfied Ulema.</strong></li>
  <li style="padding-left:2em">&#9702; So Firuzshah Tughlaq inherited a <strong>bitter legacy</strong> from his predecessor.</li>
  </ul>
</li>
<li>&#8226; He tried to solve this question in his own way and it was in this context that he followed the policy of <strong>appeasement</strong> toward nobles and Ulemas.</li>
<li>&#8226; For short term gains, he <strong>unconsciously enlarged the rift which had already existed</strong> within the structure of Delhi Sultanate.</li>
<li>&#8226; In conclusion, although we <strong>can&#8217;t absolve Firuzshah</strong> Tughlaq from the responsibility for the decline of Delhi Sultanate, his role should be viewed in the context of <strong>objective material factors</strong> as well. These were -
  <ul>
  <li style="padding-left:2em">&#9702; Lack of well defined <strong>law of succession</strong></li>
  <li style="padding-left:2em">&#9702; <strong>Conflict between Sultan and Nobles</strong></li>
  <li style="padding-left:2em">&#9702; <strong>Crisis in Revenue Administration</strong></li>
  <li style="padding-left:2em">&#9702; Rise of <strong>Regional states</strong> and</li>
  <li style="padding-left:2em">&#9702; <strong>Mongol Threat</strong></li>
  </ul>
</li>
</ul>

<h2>Disintegration of Delhi Sultanate</h2>
<ul>
<li>&#8226; The disintegration of the Delhi sultanate was caused by some persistent problems, such as-
  <ul>
  <li style="padding-left:2em">&#9702; The <strong>relations between the monarch and the nobility.</strong></li>
  <li style="padding-left:2em">&#9702; The <strong>conflicts with local rulers</strong>.</li>
  <li style="padding-left:2em">&#9702; The <strong>pull of regional and geographical factors</strong>.</li>
  </ul>
</li>
<li>&#8226; <strong>Individual rulers tried to cope</strong> with these problems but none of them were in a position to bring about fundamental changes in society to affect these perennial factors.
  <ul>
  <li style="padding-left:2em">&#9702; <strong>Disintegration of the political fabric, thus, always lurked beneath the surface</strong> and any weakness in the central administration set off a chain of events leading to political disintegration.</li>
  </ul>
</li>
<li>&#8226; Balban and Alauddin Khalji made some efforts to evolve a theory of kingship that could give permanence to the state, but all <strong>attempts were abortive</strong>.</li>
<li>&#8226; For that matter, the Delhi sultans themselves <strong>could never make a clean break from the Caliphate</strong>.
  <ul>
  <li style="padding-left:2em">&#9702; They were compelled to seek legitimacy by modelling the state as both the sword and the oracle of Islam.</li>
  <li style="padding-left:2em">&#9702; This constricted the <strong>political leverage</strong> of the sultans and <strong>social base</strong> of the sultanate.</li>
  </ul>
</li>
<li>&#8226; <strong>Opposition to the state was virtually endemic</strong> due to-
  <ul>
  <li style="padding-left:2em">&#9702; The hostile native population, recalcitrant traditional aristocracy and intriguing nobility.</li>
  <li style="padding-left:2em">&#9702; Absence of law of succession</li>
  <li style="padding-left:2em">&#9702; Heterogeneous nature of the army</li>
  <li style="padding-left:2em">&#9702; Coupled with these factors, the external invasions of Mongols made the state amorphous</li>
  </ul>
</li>
</ul>

<h2>Limitations on centralization during the reign of Afghans</h2>
<ul>
<li>&#8226; A major shift was visible in the relationship between the sultan and the nobility with the establishment of the <strong>Lodi</strong> dynasty. The Lodis were Afghans.</li>
<li>&#8226; As Afghans belonged to a <strong>tribal society</strong> so the sense of <strong>equality</strong> was much stronger.</li>
<li>&#8226; As a result, there was <strong>less scope for administrative centralisation</strong>. This led to the strengthening of centrifugal forces.</li>
<li>&#8226; Bahlol Lodi had to face this difficult situation when he founded the first Afghan state.
  <ul>
  <li style="padding-left:2em">&#9702; Bahlol Lodi <strong>did not even have a throne</strong> in his court. Rather he used to sit on the carpet with his nobles.</li>
  <li style="padding-left:2em">&#9702; Although the administrative machinery, institutions, nomenclature of the officers of the earlier period continued, <strong>imperial control was slackened</strong> considerably, especially over the provinces.</li>
  <li style="padding-left:2em">&#9702; The <strong>position of Muqti became hereditary</strong> and he came to be known as &#8220;wajahdar&#8221;.</li>
  <li style="padding-left:2em">&#9702; The state did not contest the right of the wajahdars over the <strong>entire revenue from the provinces.</strong></li>
  </ul>
</li>
<li>&#8226; Later his successors <strong>Sikandar Lodi and Ibrahim Lodi</strong> tried to make monarchy a serious profession but their <strong>bid for centralisation was unsuccessful.</strong></li>
<li>&#8226; Ultimately the first Afghan state declined due to the role of centrifugal forces. Later <strong>Shershah</strong> revived the Afghan power and tried to infuse <strong>new spirit into old institutions.</strong>
  <ul>
  <li style="padding-left:2em">&#9702; He <strong>borrowed</strong> the elements of centralisation from the <strong>Turkish model</strong>.</li>
  <li style="padding-left:2em">&#9702; He experimented with <strong>military reforms, land revenue reforms etc</strong>. and to have a better control over lower level administration he divided his empire into different <strong>Sarkars</strong>.</li>
  <li style="padding-left:2em">&#9702; Furthermore he made clear to his Afghan nobles that the <strong>rules of Afghan succession would not be applicable</strong> to public life and the royal service.</li>
  <li style="padding-left:2em">&#9702; But in spite of his best efforts he could not free the system from the Afghan legacy and shortly after his death, centrifugal forces resurfaced leading to the decline of the second Afghan empire.</li>
  </ul>
</li>
</ul>

<h2>Nature of the State &#8212; Theocracy or Secular State</h2>
<p>This is a matter of <strong>controversy</strong> among scholars whether the state under Delhi sultanate was a theocratic state or a secular state.</p>
<ul>
<li>&#8226; Before coming to any conclusion we have to make a <strong>close examination</strong> of the affairs under Delhi Sultanate.</li>
<li>&#8226; The term theocracy originates from the word &#8216;Theos&#8217;, a Greek word meaning God.
  <ul>
  <li style="padding-left:2em">&#9702; So Theocracy means the <strong>&#8216;Rule of God&#8217;</strong>.</li>
  </ul>
</li>
<li>&#8226; To qualify as a theocracy or the rule by God, the Delhi Sultanate should have fulfilled two criteria:
  <ul>
  <li style="padding-left:2em">&#9702; The presence of a <strong>sovereign hereditary ulema</strong> class, ruling on behalf of God.</li>
  <li style="padding-left:2em">&#9702; The presence of <strong>divine laws exclusively</strong>.</li>
  </ul>
</li>
<li>&#8226; On observation we find that the state under <strong>Delhi Sultanate didn&#8217;t fulfil either of these</strong>.
  <ul>
  <li style="padding-left:2em">&#9702; Although under the Delhi Sultanate there was an Ulema class and it was involved in defining Shariat rules but these <strong>Ulemas were not hereditary</strong>.
    <ul>
    <li style="padding-left:4em">&#9632; Furthermore, <strong>Ulemas depended on the Sultan for their power and prestige</strong>.</li>
    <li style="padding-left:4em">&#9632; Powerful Sultans like Allauddin Khalji and Muhammad bin Tughlaq placed proper <strong>checks</strong> over Ulemas.</li>
    </ul>
  </li>
  <li style="padding-left:2em">&#9702; Secondly, under the Delhi Sultanate, although the laws of Sharia (divine laws) were followed, <strong>there were certain rules, made by the sultan, which didn&#8217;t comply with the Sharia.</strong></li>
  <li style="padding-left:2em">&#9702; Within the Delhi Sultanate, all legal aspects of the sharia were <strong>distorted</strong>. Islamic Shariat covers <strong>3 subjects - Ibadat (Prayer), civil law and criminal law</strong>.
    <ul>
    <li style="padding-left:4em">&#9632; In civil law, <strong>women were disinherited</strong> from property.</li>
    <li style="padding-left:4em">&#9632; Likewise, there was <strong>distortion in the fixation of land revenue</strong>.</li>
    <li style="padding-left:4em">&#9632; In <strong>criminal law</strong>, there was provision for <strong>dancing houses, prostitution etc.</strong>, which were banned by Islam. So these laws did not fulfil the demand of a theocratic state.</li>
    </ul>
  </li>
  <li style="padding-left:2em">&#9702; Furthermore, apart from Sharia laws, for practical purposes, even some supplementary laws were formulated by Sultans. These laws were popularly known as <strong>&#8216;Urfi&#8217; or &#8216;Zawabit&#8217;</strong>.</li>
  </ul>
</li>
<li>&#8226; At the same time, <strong>we cannot accept that the state under Delhi Sultanate was secular</strong>, because in theory the declared objective of the state was to convert India from &#8216;Dar-ul-Harb&#8217; into <strong>&#8216;Dar-ul-Islam&#8217;</strong></li>
</ul>

<h2>How far was the Caliphate the source of power and the sanction of the legal authority of the Sultan under Delhi Sultanate? (UPSC, 2017)</h2>
<ul>
<li>&#8226; Under the Delhi Sultanate, the <strong>relationship between Caliph and Sultan was vague and complex</strong>. The formal and actual nature of relations remained quite different.</li>
<li>&#8226; One interesting fact is that <strong>almost all sultans of Delhi used to look towards the Caliph for formal recognition but never allowed him to interfere</strong> in political and administrative matters.</li>
<li>&#8226; In order to perceive their relations in totality, we need to explore different events systematically.
  <ul>
  <li style="padding-left:2em">&#9702; The Islamic world was marked by a major change in the <strong>10th century</strong> with the <strong>decline of Abbasid Caliphate and the rise of the institution of Sultan</strong>.
    <ul>
    <li style="padding-left:4em">&#9632; Under Islam there was the concept of a single king who was the Caliph but taking advantage of his weakening position, <strong>ambitious governors began asserting their independence.</strong></li>
    <li style="padding-left:4em">&#9632; So, to maintain the at least formal unity of the Islamic Empire, the <strong>Caliph began giving investiture to such governors</strong>. Thus emerged the institution of the Sultan.</li>
    </ul>
  </li>
  <li style="padding-left:2em">&#9702; In a formal sense, the Caliph was both the political and religious head and the Sultan was his subordinate, but <strong>in reality, the Sultan was independent.</strong></li>
  <li style="padding-left:2em">&#9702; Sultans usually preferred to accept the authority of the Caliph so that they could gain legitimacy among the Muslim masses.</li>
  </ul>
</li>
</ul>

<h4>Different Sultans of Delhi:</h4>
<ul>
<li>&#8226; <strong>Iltutmish:-</strong> In Order to ensure the legitimate position of Delhi Sultanate, Iltutmish <strong>sought investiture</strong> from the Caliph of Baghdad. But it was <strong>merely a matter of formality</strong>.
  <ul>
  <li style="padding-left:2em">&#9702; It can be ascertained from the fact that when the <strong>governor of Bengal</strong> received the same investiture from the Caliph, Iltutmish did not respect this, rather he eliminated Iwas Shah.</li>
  </ul>
</li>
<li>&#8226; <strong>Balban:-</strong> Balban <strong>gave due respect</strong> to the institution of Caliph even after Halagu Khan, a grandson of Changiz Khan, executed the Caliph.</li>
<li>&#8226; <strong>Alauddin Khilji:-</strong> He could maintain his autocratic power by dint of his military authority but still preferred to characterise himself as <strong>the right hand of the Caliph</strong>.</li>
<li>&#8226; <strong>Mubarak Shah Khilji:-</strong> On the other hand his successor Mubarak Shah Khilji <strong>declared himself to be the Caliph</strong> of the age.</li>
<li>&#8226; <strong>Muhammad-Bin-Tughlaq:-</strong> Initially MBT tried to <strong>neglect</strong> the Caliph and even struck out his name from the coin, but later when the series of <strong>revolts</strong> started against him, he <strong>sought investiture</strong> from the Caliph.</li>
<li>&#8226; <strong>Firuz Shah Tughlaq:-</strong> FST always tried to project himself an orthodox Sunni Muslim so he maintained good relations with Caliph and <strong>received the investiture twice</strong>.</li>
</ul>

<h2>3rd Urbanisation &#8212; Historiography</h2>

<h4>K.M. Ashraf &#8212; Changing Skyline</h4>
<ul>
<li>&#8226; Mosques, tombs and arches overshadowed the temples</li>
</ul>

<h4>Mohammad Habib &#8212; &#8216;Urban Revolution&#8217;</h4>
<ul>
<li>&#8226; India of the eleventh century was a country of <strong>fortified cities and towns and unfortified villages</strong>.
  <ul>
  <li style="padding-left:2em">&#9702; Control of the higher classes was supreme and exclusive.</li>
  <li style="padding-left:2em">&#9702; The <strong>condition of the producing classes was tragic</strong>.</li>
  </ul>
</li>
<li>&#8226; The <strong>higher classes appropriated the cities and towns</strong> exclusively to themselves while the workers lived in unprotected villages and in settlements outside the city-walls.</li>
<li>&#8226; This changed with Turkish conquest.
  <ul>
  <li style="padding-left:2em">&#9702; <strong>Cities were thrown open</strong> to workers.</li>
  <li style="padding-left:2em">&#9702; &#8216;Indian city labour, both low caste Hindu and Muslim, helped to establish the new regime&#8217;.</li>
  </ul>
</li>
<li>&#8226; Thus the new regime <strong>emancipated the labouring classes</strong>.</li>
<li>&#8226; This also facilitated urban expansion.</li>
</ul>

<h4>Irfan Habib &#8212; Technological innovation led to expansion of the urban economy</h4>
<ul>
<li>&#8226; He <strong>rejected the notion of emancipation</strong> of the working class.
  <ul>
  <li style="padding-left:2em">&#9702; According to him, the <strong>condition of workers and peasants remained largely the same</strong>.</li>
  </ul>
</li>
<li>&#8226; He asserts that the <strong>expansion of urban economy and craft production</strong> was more of a result of <strong>technological innovation.</strong>
  <ul>
  <li style="padding-left:2em">&#9702; Introduction of the <strong>Persian wheel</strong> facilitated continuous water supply thus irrigating vast tracts became possible that in turn created surplus, so essential for the growth of towns.</li>
  <li style="padding-left:2em">&#9702; Similarly, introduction of <strong>charkha with crank-handle</strong> increased the production of the cotton yarn six fold.</li>
  <li style="padding-left:2em">&#9702; Introduction of the <strong>treadle (pit)-loom</strong> further facilitated the increase in the textile production.</li>
  </ul>
</li>
</ul>

<h4>HK Naqvi &#8212; State led Urbanisation</h4>
<ul>
<li>&#8226; She argues that Sultanate towns were established as <strong>political centres by the state</strong>.
  <ul>
  <li style="padding-left:2em">&#9702; Lahore, Sialkot, Multan, Delhi, Hissar, Jaunpur, Ahmadabad, Burhanpur, Agra.</li>
  </ul>
</li>
<li>&#8226; She even viewed the <strong>&#8216;growth&#8217; of the towns as a result of state action.</strong>
  <ul>
  <li style="padding-left:2em">&#9702; By establishing <strong>internal peace and security</strong>, maintenance of law and order providing for a smooth administrative organisation, promotion of industries, and improvement in communication system.</li>
  <li style="padding-left:2em">&#9702; The Sultans worked carefully towards urban growth. They <strong>provided the essential &#8216;outlay&#8217;</strong> by way of repairs, extensions, or introduction of new constructions.</li>
  </ul>
</li>
<li>&#8226; She remarks since the growth of towns in the Sultanate period is &#8216;politically inspired&#8217; its <strong>future too got intertwined with the &#8216;political vicissitudes&#8217;</strong>.
  <ul>
  <li style="padding-left:2em">&#9702; The <strong>Portuguese blockade</strong> on the seas <strong>adversely affected growth of Gujarat towns</strong> in the early 16th century.
    <ul>
    <li style="padding-left:4em">&#9632; In the early 15th century, Ahmedabad had 360 puras as reported in &#8216;Haft Iqlim&#8217;. This number reduced to 175 and further the number came down to 80 as reported in the Ain-i Akbari.</li>
    </ul>
  </li>
  </ul>
</li>
</ul>

<h4>Satish Chandra &#8212; Agrarian Expansion led to Urban Growth</h4>
<ul>
<li>&#8226; Chandra has <strong>disputed Naqvi&#8217;s model</strong> of state sponsored urbanisation.</li>
<li>&#8226; He argues that <strong>political stability played a minor role</strong> in the process of urbanisation.
  <ul>
  <li style="padding-left:2em">&#9702; According to him, if political stability was such a decisive factor, then why did the <strong>reign of Firozshah Tughlaq</strong> witness the emergence of new towns in spite of the fact that a declining trend was clearly visible in the field of empire-building.</li>
  </ul>
</li>
<li>&#8226; Rather, he tries to link the process of urbanisation with <strong>agrarian expansion.</strong></li>
</ul>

<h4>Andre Wink &amp; Sunil Kumar &#8212; Garrison Towns</h4>
<ul>
<li>&#8226; Wink has attributed the emergence of garrison towns to the <strong>rise of &#8216;cash nexus&#8217; and the &#8216;iqta&#8217; system</strong>.</li>
<li>&#8226; He remarks that <strong>&#8216;iqtas&#8217; could not be defined as &#8216;local territorial units but as garrisoned urban centres (khitta)&#8217;</strong>.</li>
<li>&#8226; In the entire conquest area &#8211; from Lahore to Lakhnauti &#8211; a similar pattern emerged.
  <ul>
  <li style="padding-left:2em">&#9702; The <strong>new horse-troop garrison towns</strong> established by the Turkish conquerors became centres of iqta management, <strong>aiming at</strong>
    <ul>
    <li style="padding-left:4em">&#9632; the safeguarding of trade routes, markets,</li>
    <li style="padding-left:4em">&#9632; the subjugation of the marches,</li>
    <li style="padding-left:4em">&#9632; agrarian expansion,</li>
    <li style="padding-left:4em">&#9632; monetisation, regulation and rationalisation of land revenue collection.</li>
    </ul>
  </li>
  </ul>
</li>
<li>&#8226; He listed as many as eighteen such towns including Delhi, Gwalior, Multan, Uchh, Lahore, Kara, Manikpur, and Lakhnauti.</li>
<li>&#8226; Kumar also argues that from its very inception, &#8216;Delhi was a collection of garrison towns commanded by senior military commanders and former slaves of Ghori.&#8217;</li>
</ul>

<h4>Pre-Turkish Towns</h4>
<ul>
<li>&#8226; However, when the Turks emerged on the scene <strong>many of these towns were already flourishing</strong>;
  <ul>
  <li style="padding-left:2em">&#9702; <strong>Though no doubt the thanas</strong> established by Balban, such Badaun were used as &#8216;garrisoned&#8217; posts which later <strong>developed into</strong> towns and qasabs, <strong>Lahore, Kara, Manikpur and Lakhnauti, in no way could be labelled as &#8216;garrison towns&#8217;.</strong></li>
  <li style="padding-left:2em">&#9702; Similarly, <strong>Delhi was not only recognised as the capital,</strong> but at the same time, as the <strong>&#8216;principal&#8217; town</strong> by Hasan Nizami.</li>
  <li style="padding-left:2em">&#9702; At the time of Muhammad Qasim&#8217;s invasion both <strong>Uchh and Multan</strong> were flourishing towns.</li>
  </ul>
</li>
<li>&#8226; Most of them owed their position to their strategic location or being capital towns.</li>
</ul>

<h2>Mongol Policy &#8212; Balban to Alauddin Khilji</h2>
<ul>
<li>&#8226; It was Balban who laid the foundation of Mongol policy of Delhi Sultanate. He built a strong defence mechanism in the north-west.
  <ul>
  <li style="padding-left:2em">&#9702; In fact, he built <strong>two defence lines</strong>.
    <ul>
    <li style="padding-left:4em">&#9632; One line went through Lahore, Multan and Dipalpur and another through Sunam, Samana and Bathinda</li>
    <li style="padding-left:4em">&#9632; He also built a large number of forts and deployed a large number of soldiers there.</li>
    </ul>
  </li>
  </ul>
</li>
<li>&#8226; <strong>Alauddin Khilji</strong> also continued the policy of Balban and even <strong>extended</strong> it.
  <ul>
  <li style="padding-left:2em">&#9702; Once he realised that the weakness of the Delhi Sultanate was caused by poor military preparedness, he developed a huge standing army and started to pay cash salary to the soldiers.</li>
  <li style="padding-left:2em">&#9702; Furthermore, he also repaired the forts of Balban in the north-west and built some new forts and appointed Ghazi Malik (later Ghiasuddin Tughlaq) as warden of marches.</li>
  <li style="padding-left:2em">&#9702; Apart from that, Alauddin Khilji followed the dictum <strong>&#8216;offence is the best defence&#8217;</strong>.</li>
  <li style="padding-left:2em">&#9702; So now the Mongols were forced to be defensive.</li>
  </ul>
</li>
<li>&#8226; In this way, Alauddin Khilji almost eliminated Mongol menace. Thus, by the period of the Tughlaqs, the Mongol menace was over.
  <ul>
  <li style="padding-left:2em">&#9702; Only a single Mongol invasion took place under Tashmarshin Khan, at the time of Muhammad-bin-Tughlaq but it was repelled.</li>
  <li style="padding-left:2em">&#9702; The period of Firuz Shah Tughlaq was free from Mongol invasions, as Mongol power already declined and Mongol leaders were involved in internal conflicts</li>
  </ul>
</li>
<li>&#8226; However, it can be stated with certainty that the continuous Mongol invasions produced a <strong>wider impact on political, administrative, economic as well as cultural structure of Delhi Sultanate.</strong></li>
</ul>

<h4>Impact of Mongol invasion on Delhi Sultanate</h4>
<ul>
<li>&#8226; According to <strong>Peter Hardy</strong>, Mongol invasions left a deep impact on <strong>polity</strong> under Delhi Sultanate.
  <ul>
  <li style="padding-left:2em">&#9702; <strong>Earlier sultans</strong> were so engrossed with the Mongol question that they <strong>didn&#8217;t take any initiative towards territorial expansion</strong> into India&#8217;s interior.
    <ul>
    <li style="padding-left:4em">&#9632; In his entire reign, Balban never left his capital except on the Bengal expedition.</li>
    </ul>
  </li>
  <li style="padding-left:2em">&#9702; Furthermore, in order to consolidate their power against the Mongols, initially the Sultans of Delhi <strong>couldn&#8217;t take any specific measures against provincial officers like Muqtis</strong>. So Muqtis began enjoying greater autonomy.</li>
  <li style="padding-left:2em">&#9702; The need for countering the Mongols intensified the <strong>demand for resources</strong> so that a strong standing army could be maintained.
    <ul>
    <li style="padding-left:4em">&#9632; Inspired by this objective, <strong>Alauddin Khilji</strong> took steps for <strong>land revenue reforms</strong>.</li>
    <li style="padding-left:4em">&#9632; He also introduced the <strong>market control policy</strong> so that all essential goods could have been available to soldiers at cheaper cost.</li>
    </ul>
  </li>
  </ul>
</li>
<li>&#8226; Mongol invasions had a <strong>deep cultural impact</strong> as well.
  <ul>
  <li style="padding-left:2em">&#9702; As Mongol invasions wreaked havoc in the Islamic world, scholars from different regions of Islamic world rushed towards Delhi to take refuge.</li>
  <li style="padding-left:2em">&#9702; As a result, Delhi became a nerve centre for cultural activities. Apart from scholars, even Sufi saints moved towards India as a safe haven.</li>
  </ul>
</li>
</ul>

<h2>Land Revenue System (continued)</h2>
<ul>
<li>&#8226; In this way, the Delhi Sultanate land revenue system underwent a phase of gradual evolution or development.
  <ul>
  <li style="padding-left:2em">&#9702; Some Sultans tried to promote the system of land measurement (mashahat) but due to certain compulsions, this system remained confined to specific regions.</li>
  <li style="padding-left:2em">&#9702; In other regions the old system continued i.e. Batai or Galla Bakshi, Nasaq and Kankut.
    <ul>
    <li style="padding-left:4em">&#9632; Batai system was based on crop sharing</li>
    <li style="padding-left:4em">&#9632; Nasaq and Kankut were based on some sort of estimation.</li>
    </ul>
  </li>
  </ul>
</li>
</ul>

<h2>Barani as a Historian</h2>
<p>For the study of the Delhi Sultanate, two important texts of Barani, the <strong>&#8216;Tarikh-i-Firozshahi&#8217;</strong> and the <strong>&#8216;Fatwa-i-Jahandari&#8217;</strong> have greater importance.</p>
<ul>
<li>&#8226; It is said that where &#8216;Tabakat-i-Nasri&#8217; of Minhas-us-Siraj, ended the &#8216;Tarikh-i-Firozshahi&#8217; of Barani began.
  <ul>
  <li style="padding-left:2em">&#9702; However, unlike Minhas-us-Siraj, he <strong>separated the history of India from that of Central Asia.</strong></li>
  </ul>
</li>
<li>&#8226; This text throws light on the period from the reign of <strong>Balban up to the early years of Firozshah Tuglaq.</strong></li>
<li>&#8226; As compared to other contemporary writers, Barani had a different conception and ideal of history writing. For him, history writing was a <strong>religious work.</strong>
  <ul>
  <li style="padding-left:2em">&#9702; This is reflected in his <strong>sense of guilt</strong> over being unable to oppose the anti Islamic policies of Muhammad Bin Tuglaq.</li>
  <li style="padding-left:2em">&#9702; This is also the reason why he appears to be a <strong>overtly critical of Muhammad Bin Tuglaq.</strong></li>
  </ul>
</li>
<li>&#8226; On the surface it appears that the writing of Barani is very orthodox with a strong anti Hindu tinge but closer examination, reveals that, Barani&#8217;s <strong>prejudice</strong> is a result of both his <strong>personal bias</strong> and the <strong>conflict between the Hindu and Muslim nobility.</strong></li>
</ul>

<h4>Limitations</h4>
<ul>
<li>&#8226; He is very careless about dates and the chronology of events.</li>
<li>&#8226; He is overtly prejudiced against Hindus.</li>
</ul>

<h4>Conclusion</h4>
<ul>
<li>&#8226; In spite of these limitations, the account of Barani is an <strong>important</strong> source for the study of the Delhi Sultanate.</li>
<li>&#8226; From the writings of Barani we not only get information about administrative and economic affairs but also we get the reflection of the intellectual development of society.</li>
</ul>

<h2>Amir Khusro as a Historian</h2>
<ul>
<li>&#8226; Amir Khusro was a noted scholar during the period of Delhi Sultanate. But he falls under the category of a <strong>literary personality rather than a historian</strong>. Still his texts are an important source for the study of this period.</li>
<li>&#8226; He saw the reign of <strong>seven sultans</strong> and his texts throw light on the period between Bughra Khan and Giyassudin Tughlaq.
  <ul>
  <li style="padding-left:2em">&#9702; The <strong>&#8216;Qiran-us-Sadain&#8217;</strong> covers a conversation between Bughra Khan and his son Kaiquabad. Apart from this, buildings, palaces, etc have also been mentioned.</li>
  <li style="padding-left:2em">&#9702; The <strong>&#8216;Miftah-ul-Futuh&#8217;</strong>, focuses on the period of Jalaluddin Khilji.</li>
  <li style="padding-left:2em">&#9702; His third text, <strong>&#8216;Khazain-ul-Futuh&#8217;</strong> which was also known as &#8216;Tarikh-i-Alai&#8217;, he throws light on the period of Alauddin Khilji and 15 years of his rule. From this text, we come to know about Mongol invasions and Malik Kafur&#8217;s Deccan expeditions as well.</li>
  <li style="padding-left:2em">&#9702; Another important text, the <strong>&#8216;Nuh Sipihr&#8217;</strong>, exclusively focuses on praising Delhi, the climate of Hindustan, its vegetation, flora and fauna etc.</li>
  </ul>
</li>
<li>&#8226; Being a literary person, his <strong>writing is chaste and ornate</strong>. He presents a very lively picture of the social and cultural history of his time.</li>
<li>&#8226; Although he was a literary person, <strong>even the political events described by him appear to be authentic.</strong>
  <ul>
  <li style="padding-left:2em">&#9702; For example gives an accurate account of the battle between Khusro Shah and Ghazi Mallik. Unlike Barani, he is <strong>careful about the dates and chronology.</strong></li>
  </ul>
</li>
</ul>

<h4>Limitations</h4>
<ul>
<li>&#8226; He <strong>didn&#8217;t select his subjects independently</strong>, rather he was given the assignment to write on these subjects.
  <ul>
  <li style="padding-left:2em">&#9702; So, sometimes his writing appears to be a form of flattery meant for satisfying his master.</li>
  </ul>
</li>
<li>&#8226; In order to win the favour of his master he simply <strong>omitted embarrassing episodes</strong>, such as, the assassination of Jalaludin Khalji by Alauddin Khalji</li>
</ul>

<h4>Conclusion</h4>
<ul>
<li>&#8226; But in spite of the limitations mentioned above the writing of Amir Khusro remains to be an <strong>important source</strong> for the study of the social, cultural and political history of Delhi Sultanate.</li>
<li>&#8226; His sensibility as a literary person infused a new life in his history writing.</li>
</ul>

<h2>Ibn Battuta as a Historian</h2>
<ul>
<li>&#8226; Ibn Battuta was an inhabitant of <strong>Morocco</strong>. He started his tour from Africa and in 1333 he reached Delhi while crossing the regions of Constantinople, Alexandria, Kahira, Arabia, Persia, Balkh, Samarkand and Herat.</li>
<li>&#8226; He easily got the patronage of <strong>Muhammad-Bin-Tughlaq</strong> and was appointed as the <strong>Qazi of Delhi</strong>, a post he held for the next 3 years.
  <ul>
  <li style="padding-left:2em">&#9702; Later, on corruption charges he was imprisoned.</li>
  </ul>
</li>
<li>&#8226; After his release he was <strong>sent to China as an ambassador</strong>.</li>
<li>&#8226; Upon returning to Morocco, he composed his famous text <strong>Kitab-i-Rehla</strong>.</li>
<li>&#8226; The account of Ibn Battuta is important for the knowledge of the <strong>political and social conditions</strong> during the period of Muhammad-Bin-Tughlaq.</li>
<li>&#8226; Ibn Battuta commented on almost all the political events of his time.</li>
<li>&#8226; He threw light even on the <strong>grand projects of Muhammad-Bin-Tughlaq</strong>.</li>
</ul>

<h4>Limitations:-</h4>
<ul>
<li>&#8226; As a foreign traveller he gives us only <strong>superficial knowledge</strong> of the events.</li>
<li>&#8226; He appears to be <strong>heavily prejudiced against Muhammad Bin Tughlaq</strong>.</li>
<li>&#8226; But still <strong>with proper caution, his account can be used as an important source</strong> for the study of this (Muhammad-Bin-Tughlaq) period.</li>
</ul>

<h2>Malfuzat: As a source of study of Delhi Sultanate</h2>
<ul>
<li>&#8226; Malfuzat or Malfuz was Sufi literature which reflects the conversation of important Sufi saints, Pir, Seikh etc. Such conversations were recorded by the disciples of these Sufi saints.
  <ul>
  <li style="padding-left:2em">&#9702; The <strong>&#8216;Fawad-ul-Fuwad&#8217;</strong> composed by <strong>Hasan Sijzi</strong> focuses on the conversations and sermons of <strong>Nizamuddin Auliya</strong> while the <strong>&#8216;Khair-ul- Majlis&#8217;</strong> by <strong>Hamid Qalander</strong> covers the religious discourse of <strong>Nasiruddin Chirag-i-Dehlavi.</strong></li>
  </ul>
</li>
<li>&#8226; Although these texts were associated with religion, they give <strong>equal focus on contemporary society</strong>.
  <ul>
  <li style="padding-left:2em">&#9702; Thus Malfuzat texts have emerged as valuable alternatives to Tawarikh literature.</li>
  </ul>
</li>
<li>&#8226; While Tawarikh reflects a courtly attitude and elite lifestyle, Malfuzat takes us <strong>close to the life of common people.</strong></li>
<li>&#8226; That is why, scholars like <strong>Simon Digby</strong> have highlighted the importance of Malfuzat for the study of Delhi Sultanate.</li>
</ul>

<h2>Art and Architecture &#8212; Phase 2 &amp; 3 and Regional Styles</h2>

<h4>Second Phase: Tughlaq Dynasty</h4>
<ul>
<li>&#8226; The buildings of the Tughlaqs reflect the growing political insecurity, economic austerity and religious conservatism.</li>
<li>&#8226; They lost the youthful splendour and ornamentation of the earlier period. Seemingly massive and solid, in reality they were poorly built.</li>
<li>&#8226; The rugged simplicity of the Turks re-asserted itself later in the fortress called <strong>Tughlaqabad</strong>, constructed by Ghiyas-ud-din Tughlaq in 1321 CE.</li>
<li>&#8226; Tughlaqabad includes Ghiyasuddin&#8217;s tomb, <strong>Bijay Mandal</strong> built by Muhammad Tughlaq and hall of thousand pillar which has only a few ruins left.</li>
<li>&#8226; Of all the Tughlaq rulers, Firuz Shah proved an indefatigable builder and numerous cities, forts, palaces, mosques and tombs are credited to him.
  <ul>
  <li style="padding-left:2em">&#9702; Like the preceding Tughlaq buildings, however, they too were made of poor materials and clearly lacked the elegance of the Ilbari and the Khilji monuments.</li>
  </ul>
</li>
<li>&#8226; Another important feature of Tughlaq architecture is <strong>batter</strong> or sloping wall that gave the appearance of strength to a monument. The only exception is the monuments of Firoz Tughlaq where use of batter is very rare.</li>
</ul>

<h4>Third Phase: Sayyid and Lodi Dynasty</h4>
<ul>
<li>&#8226; The shrunken political empire of the Lodis and the Sayyids seriously handicapped them from undertaking any vast and elaborate buildings.</li>
<li>&#8226; Consequently, with few exceptions, their best efforts were confined to the tombs of kings and nobles which nevertheless reflect an attempt to revive the animated style of the Khiljis.</li>
<li>&#8226; Features:
  <ul>
  <li style="padding-left:2em">&#9702; Building of monuments on higher platform</li>
  <li style="padding-left:2em">&#9702; Monuments were built in a garden.</li>
  <li style="padding-left:2em">&#9702; Normally the shape of the monument was octagonal.</li>
  <li style="padding-left:2em">&#9702; The construction of a double dome.</li>
  <li style="padding-left:2em">&#9702; The construction of a kiosk for decoration.</li>
  </ul>
</li>
<li>&#8226; Sikandar Lodi&#8217;s tomb was built by Ibrahim Lodi in 1518 A.D. It stands out for its internal and external ornamentation, use of several coloured tiles and the innovation of the <strong>double dome</strong> used to preserve the symmetry and relative proportion of the interior and the exterior. This was later massively used by the Mughals.</li>
<li>&#8226; The tombs of various nobles like <strong>Bara Gumbad</strong> and <strong>Moth-ki-Masjid</strong>, too, represent the best of the Lodi architecture which neither achieved the poetic refinement of the Ilbari and Khilji monuments nor the later Mughal perfection.</li>
<li>&#8226; It, however, definitely displayed a sober dignity and use of imagination in achieving a harmony of design and colour, which was lacking in the severity of the Tughlaq architecture.</li>
<li>&#8226; Sher Shah&#8217;s tomb is the last of the series of Turkish burial places. It is more elaborate than the Tughlaq or Lodi memorials, but is still quite rugged.</li>
<li>&#8226; The basic plan of a Turkish tomb consists of an octagonal apartment, roughly 15m. in diameter, surrounded by a verandah of the same shape, each face ornamented by three arches of the stilted style and supported by double square columns. It is derived from the Jaina style, but bears no apparent similarity to its prototype. The mosques of the Turko-Afghans were as simple as their tombs.</li>
<li>&#8226; By the time of Sher Shah, there is visible a love of detail, pointing to a richer imagination. Compared to the more ornamental mosques of the later period, the contours of the <strong>Kalan Masjid</strong> in Delhi, for instance, remain hard. The buildings of the Turko-Afghan monarchs are the index to the rough and ready culture which they brought.</li>
</ul>

<h4>Development of Regional Architecture:</h4>
<ul>
<li>&#8226; With the decline and disintegration of the sultanate, the architectural activities were also decentralised and shifted to the provincial capitals and the regional states which emerged on its ruins.</li>
<li>&#8226; It resulted in the diversification of the Indo-islamic architecture, giving birth to a number of art styles with the manifestation of new features, distinct from those of the traditional Indo-Islamic architecture as had been patronised by the sultans of Delhi in the 13th and the first half of the 14th centuries.</li>
<li>&#8226; To the arched domes and radiating vaults of the mosques of the North, there were added cloisters that surrounded the courts. The galleries of the interior were elaborated with short square pillars, bracket capitals, horizontal archways and roofs of flat slabs in the manner of the Hindu and Jaina temples.</li>
</ul>

<h4>Jaunpur</h4>
<ul>
<li>&#8226; Jaunpur developed a new style of Indo-Islamic architecture which showed a profuse and very refreshing blending of the Hindu and Muslim architectural traditions.</li>
<li>&#8226; The Sharqi architects made simultaneous use of the arcuate and trabeate principles in their building structures, thus bringing about a very healthy synthesis between the two styles.</li>
<li>&#8226; The buildings of Jaunpur were noted for their beautiful arches and decorated vaults side by side with square pillars with bracket capitals, massive sloping walls and cloisters while its mosques were devoid of minarets of the traditional Islamic style.</li>
<li>&#8226; The earliest mosque at Jaunpur is distinguished by a number of carved pillars which were obviously taken from a temple. However, the <strong>Jami Masjid</strong> (commenced by Ibrahim Shah Sharqi and finished under Husain Shah about 1470 CE) is an attempt at absorbing Middle Eastern and Egyptian influences.</li>
<li>&#8226; The <strong>Lal Darwaza mosque</strong> and the lovely <strong>Atala Masjid</strong> owe much more to the Indian styles both Hindu and Buddhist.</li>
<li>&#8226; Among the extant monuments of the Sharqi dynasty may be mentioned the <strong>Jhanjhari</strong> and <strong>Khalis Mukhlis</strong>.</li>
</ul>

<h4>Gujarat</h4>
<ul>
<li>&#8226; In Gujarat, the synthesis of Hindu and Muslim traditions was almost perfect. The turkish governors and later on, the sovereign Muslim rulers of Gujarat thoroughly exploited the local architectural talent thus giving birth to the most remarkable and the finest among the provincial sties of Indo-Islamic architecture.</li>
<li>&#8226; Among the monuments of this period mention may be made of the magnificent <strong>Jama Masjid of Ahmedabad</strong> which has fifteen domes, each supported on eight columns, and a hall of 260 lofty pillars and wide cloisters on all the four sides of the open courtyard, make it one of the noblest edifices&#8217; in the whole world. With this mosque; says Percy Brown, &#8220;the medieval architecture reached the high water mark of the mosque design in Western India, if not in the entire country.</li>
<li>&#8226; A small but elegant tomb of <strong>Rani Sipri</strong> with an attached lovely little mosque has been adjudged, by far, as the most beautiful monument of Ahmedabad.</li>
<li>&#8226; Another production of rare architectural dignity at Ahmedabad is the <strong>&#8216;Tin Darwaza&#8217;</strong> crowned by a well-balanced and richly decorated arch, it constituted a stately entrance to the royal building complex.</li>
</ul>

<h4>Bengal</h4>
<ul>
<li>&#8226; Bengal had a strong local tradition of art and architecture in ancient times; accordingly, the Muslim rulers of the province, whether independent or subordinate to the sultans of Delhi, became responsible for the emergence of remarkably original Bengali style of Indo-Islamic architecture.</li>
<li>&#8226; It retained many popular Hindu traditions in the structural as well as decorative fields even in the construction of purely Islamic art forms like the masjids and tombs.</li>
<li>&#8226; The Muslim architects adopted the Hindu temple style of curvilinear cornices, dwarf square pillars and the carved designs, like lotus, for decoration.</li>
<li>&#8226; Paucity of stone necessitated the use of Kiln-burnt bricks as the chief building material as ever before although the use of stone, where available, was also not neglected by them.</li>
<li>&#8226; The tomb and a mosque of <strong>Zafar Khan Ghazi at Tribeni</strong> which constituted the earliest architectural monument of the Indo-Islamic style in Bengal was constructed almost exclusively from material of the hindu buildings.</li>
<li>&#8226; The <strong>&#8216;Eklakhi&#8217;</strong> tomb of Jalaluddin Muhammad Shah (1415-31 CE) at Panda exhibits the true character of the Bengali style of Indo-Islamic architecture.</li>
<li>&#8226; The <strong>Dakhil Darwaza at Gaur</strong> is an imposing gateway which has been built of bricks with terracotta surface decoration.</li>
<li>&#8226; Among other monuments of the later Ilyas Shahi and subsequent rulers of Bengal may be mentioned <strong>Tantipara, Chamkan Darasbari, Lotan, Bara Sona, Chhota Sona</strong> and <strong>Qadam Rasul Mosque at Gaur</strong> and <strong>Bagha masjid</strong> in modern Bangladesh.</li>
</ul>

<h4>Malwa</h4>
<ul>
<li>&#8226; The Muslim rulers of Malwa have also left behind quite a few monuments of Indo-Islamic architecture with a local strain.</li>
<li>&#8226; Of these, the <strong>Jama-i-Masjid of Mandu</strong> completed in 1454 CE is a beautiful edifice, which has been built on a raised platform with a series of arched chambers on the sides, and three massive domes, standing on twelve pillars each thus leaving very little open space for the congregation.</li>
<li>&#8226; The <strong>tomb of Hushang Shah</strong> situated at the back of the mosque, is characterized by the extensive use of white marble, wide expanse of its dome, and an additional terrace, with four corner cupolas between the dome and the lower square chamber.</li>
<li>&#8226; The <strong>Hindola Mahal</strong> which is &#8220;T shaped&#8217; in plan, was constructed by Hushang Shah.</li>
<li>&#8226; In its final stage of development, the Malwa style of Indo-Islamic architecture was characterised by the immense love for pleasure and luxurious life.</li>
<li>&#8226; The first example of this art style is furnished by the <strong>Jahaz Mahal</strong> which stands between two small lakes; a double storeyed building with a facade of well-proportioned, tall and pointed arches.</li>
<li>&#8226; Among other such monuments may be mentioned the palaces of <strong>Baz Bahadur</strong> and <strong>Roopmati</strong> in the vicinity of Mandu and the water-palace of <strong>Kaliadeh near Ujjain</strong>.</li>
<li>&#8226; Chanderi has also preserved a few monuments of Malwa style, including the <strong>Jam-i-Masjid, Shahzadi Ka Rauza, the Madrassa tomb</strong>, and the seven-stroyed <strong>Kushak Mahal</strong>.</li>
<li>&#8226; The last monument of the period under review at Chanderi is the lofty <strong>Badal Mahal</strong>, a double storey archway.</li>
</ul>

<h4>Kashmir</h4>
<ul>
<li>&#8226; In Kashmir too, a blending of the two styles was visible. They continued to use old stone and wooden architecture but Muslim geometrical designs were also incorporated.</li>
</ul>

<h4>South India</h4>
<ul>
<li>&#8226; In Southern India, the architecture was again a synthesis of Islamic, Persian, Egyptian and Hindu styles.</li>
<li>&#8226; Of these, the large <strong>mosque at Gulbarga</strong>, erected according to an inscription, in 1367 CE, is a unique piece of architecture. This is the only mosque in India which is wholly covered over, the light being admitted through the side-walls which are pierced with great arches.</li>
<li>&#8226; Notable among the constructions in Bijapur is the <strong>Jami-Masjid</strong>, created out of the remains of Hindu structures, but never completed.</li>
<li>&#8226; On the walls of the tomb of <strong>Adil Shah</strong>, the entire Quran was engraved and the skill of South Indian craftsmen was ably used in its of Mahmud Gawan at Bidar.</li>
<li>&#8226; Thus, the art and architecture of the period cannot be classified into rigid divisions for while its fundamentals may be traced to a particular school, they are equally influenced by the topography, political and socio-economic conditions of the region.</li>
<li>&#8226; This especially holds good in India where its vast area, diversity of climate and frequent invasions, resulted in the growth of numerous styles or art and architecture.</li>
</ul>"""

path = 'lib/noteContent.ts'
content = open(path, encoding='utf-8').read()

pattern = r"('fourteenth-century':\s*`)`"
replacement = lambda m: f"'fourteenth-century': `{new_html}`"
new_content, count = re.subn(pattern, replacement, content)

print(f"Replaced {count} occurrence(s).")
open(path, 'w', encoding='utf-8').write(new_content)
