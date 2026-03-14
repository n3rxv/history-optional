import re

html_to_append = """<h2>Vijayanagara Empire</h2>
<h3>Background:</h3>
<ul>
<li>&#8226; In c. 1334 CE, <strong>Muhammad bin Tughlaq</strong> marched to suppress a rebellion in Malabar. But, <strong>plague</strong> struck his camp. Rumours spread that the Sultan had perished along with thousands of others.</li>
<li>&#8226; Immediately, all the southern units of the Empire viz. Malabar, Telangana, Kampil etc. <strong>revolted</strong>. At this point, Tughlaq decided to move back to Delhi.</li>
<li>&#8226; <strong>Some of the old kingdoms survived and some emerged</strong> after the collapse of Tughlaq rule over the South, viz. Hoysalas of Mysore, Valema rulers of Warangal, Reddis of Telangana and Sultan of Madurai etc.
<ul>
<li style="padding-left:2em">&#9702; All these powers fought and aligned with each other as it suited them. The stage was set for the rise of two formidable powers in Peninsular India- Vijayanagara Empire and Bahmani Kingdom.</li>
</ul>
</li>
<li>&#8226; There is a consensus that <strong>Harihar and Bukka</strong> laid the foundation of Vijayanagara Empire in c. 1336 CE. However, their <strong>origin story has some variations.</strong>
<ul>
<li style="padding-left:2em">&#9702; A popular opinion is that they had served under the state of Warangal. When it fell to the Tughlaqs, they moved to Kampil.</li>
<li style="padding-left:2em">&#9702; They were captured, converted and sent to Delhi when Kampil fell, too.</li>
<li style="padding-left:2em">&#9702; However, MBT sent them back to consolidate the Sultanate control over Kampil.</li>
<li style="padding-left:2em">&#9702; Here, they deepened their roots and unfurled the banner of revolt when the suitable opportunity presented itself.</li>
</ul>
</li>
<li>&#8226; Their <strong>association with Musunuri Kapaya Nayak</strong> and a Hindu monk <strong>Vidyaranya</strong> (who allegedly brought them back into the fold of Hinduism) and some early policies of this upstart kingdom gave this independence <strong>project a tinge of Hindu revivalism</strong>.</li>
<li>&#8226; But, we can clearly see that both, Vijayanagar and Bahamani Kingdoms, were the <strong>result of regional assertion against imperial subjugation.</strong></li>
</ul>
<h3>Political History of Vijayanagara Empire</h3>
<h3>Sangama Dynasty</h3>
<ul>
<li>&#8226; <strong>Harihar</strong> of Sangama dynasty was crowned in c. 1336 CE. He was followed by his brother <strong>Bukka I</strong> in c. 1356 CE.
<ul>
<li style="padding-left:2em">&#9702; A <strong>new capital Vijayanagara</strong> was set up ostensibly on the advice of Vidyaranya during this period.</li>
</ul>
</li>
<li>&#8226; The <strong>struggle for Raichur doab</strong> started as early as c. 1356 CE when Raichur fell to the Bahamanis.
<ul>
<li style="padding-left:2em">&#9702; The warfare between two sides was frequent which had its roots in the ancient history of this geographical area.</li>
</ul>
</li>
<li>&#8226; During this period, <strong>first the Hoysala kingdom and later the Madurai Sultanate (till c. 1377 CE) were incorporated</strong> into the Empire.
<ul>
<li style="padding-left:2em">&#9702; Having reached peak expansion in the South, Vijayanagara embarked on the <strong>expansion in the West and North-East under Harihar II.</strong></li>
<li style="padding-left:2em">&#9702; He snatched Belgaum and Goa from Bahamanis.</li>
<li style="padding-left:2em">&#9702; He also sent an expedition to northern Sri Lanka.</li>
</ul>
</li>
<li>&#8226; The <strong>struggle for the Doab area renewed under Deva Raya I.</strong>
<ul>
<li style="padding-left:2em">&#9702; <strong>But, he lost</strong> to the Bahamani Sultan, Firuz Shah Bahamani (c. 1397-1422 CE). He had to cede some territory in the doab, pay war indemnity and marry a daughter to Firuz Shah.</li>
<li style="padding-left:2em">&#9702; <strong>Later</strong>, Deva Raya aligned with Warangal to split the Reddi Kingdom between the two. This brought the Warangal out of the alliance with Bahamani Kingdom. Consequently, Deva Raya I <strong>inflicted a shattering defeat on the Firuz Shah Bahaman and annexed almost the entire Doab.</strong></li>
<li style="padding-left:2em">&#9702; Also, Deva Raya I dug a <strong>canal</strong> to meet the drinking water needs of his capital. This canal and one other on Haridra River, were used for irrigation purposes also.</li>
</ul>
</li>
<li>&#8226; <strong>Deva Raya II inducted 2000 Muslim archers in his army and gave them Jagirs.</strong>
<ul>
<li style="padding-left:2em">&#9702; According to Ferishta, this was in addition to the 10000 Muslims already in the service of Vijayanagara army.</li>
<li style="padding-left:2em">&#9702; According to Nuniz, the kings of Sri Lanka, Quilon, Pegu, Tennasserim (Burma) and Malaya paid <strong>tribute</strong> to Deva Raya 2nd.
<ul>
<li style="padding-left:4em">&#9632; Sri Lanka was invaded a number of times.</li>
</ul>
</li>
<li style="padding-left:2em">&#9702; But, it is <strong>doubtful whether Vijayanagara was powerful enough in the Indian Ocean to extract tribute</strong> from Malaya and Burma.</li>
<li style="padding-left:2em">&#9702; This possibly means that these states wanted to maintain friendly relations with the Vijayanagara Empire and sent lavish gifts.</li>
</ul>
</li>
<li>&#8226; The <strong>death of Deva Raya II was followed by civil war</strong>. The geographical authority of his successors shrank considerably as many feudatories assumed independence.</li>
</ul>
<h3>Saluva Dynasty</h3>
<ul>
<li>&#8226; The last ruler of the Sangama dynasty was overthrown by the <strong>Saluva Narsimha</strong> in c. 1485, laying the foundation of the Saluva dynasty. Narasimha was originally the governor of Chandragiri.</li>
<li>&#8226; The Saluva kings restored order in the Empire. After them, came the Tuluva dynasty in c. 1505 CE.</li>
</ul>
<h3>Tuluva Dynasty</h3>
<h3>Krishna Deva Raya</h3>
<ul>
<li>&#8226; Krishna Deva Raya (c. 1509-1530), the greatest of Vijayanagara Kings, belonged to this dynasty. He <strong>gained all around victories, patronised art &amp; culture</strong> and brought <strong>military and administrative reforms.</strong>
<ul>
<li style="padding-left:2em">&#9702; He had to deal with internal problems and external problems, viz. the Deccani state, Orissa, Portuguese etc.</li>
<li style="padding-left:2em">&#9702; By this point, Portuguese had started to harass the small coastal feudatory states of Vijayanagara into making concessions.</li>
</ul>
</li>
<li>&#8226; <strong>Krishna Deva Raya defeated both Orissa state and Bijapur separately</strong>. He ousted them both from the Raichur doab.</li>
<li>&#8226; However, unlike Cholas, he <strong>did not build a strong navy</strong> and largely ignored the Portuguese threat to the trade of Peninsular India.</li>
<li>&#8226; <strong>The Portuguese possibly gave him a monopoly over the supply of horses.</strong></li>
<li>&#8226; <strong>Domingo Paes,</strong> a Portuguese traveller, has given a very positive account of his personality.</li>
</ul>
<h3>Decline of the Vijayanagar Empire</h3>
<ul>
<li>&#8226; <strong>Some chaos followed his rule</strong>. He was succeeded by Achyuta Rai and Sadasiva Raya, consecutively.</li>
<li>&#8226; <strong>Rama Raya, the prime minister of Sadasiva Raya, played the Deccan states against each other.</strong>
<ul>
<li style="padding-left:2em">&#9702; He concluded a pact with the Portuguese to deny horses to the Bijapur state.</li>
<li style="padding-left:2em">&#9702; He attacked Bijapur in alliance with Golconda and Ahmednagar in c. 1543.</li>
<li style="padding-left:2em">&#9702; Then, he sacked Ahmednagar in alliance with Bijapur.</li>
<li style="padding-left:2em">&#9702; But, he humiliated his allies who in turn patched up their differences.</li>
<li style="padding-left:2em">&#9702; Four of them united and defeated the Vijayanagara Kingdom in the battle of Talikota, c. 1565 CE.</li>
<li style="padding-left:2em">&#9702; Hampi, the Vijayanagara capital, was sacked. But, the kingdom lingered on for almost 100 years more while shrinking rapidly.</li>
</ul>
</li>
</ul>
<h3>Aravidu Dynasty</h3>
<ul>
<li>&#8226; Rama Raya&#8217;s brother, Tirumal Raya, and the King Sadasiva fled to <strong>Penugonda</strong>.
<ul>
<li style="padding-left:2em">&#9702; <strong>Gradually, Tirumal Raya retook some parts</strong> of the erstwhile empire and <strong>established order</strong>. Tirumala Raya led the foundation of the Aravidu dynasty in c. 1570 CE.</li>
</ul>
</li>
<li>&#8226; One of his successors, Venkat II shifted the capital to <strong>Chandragiri</strong>. He unsuccessfully tried to stem the rot and prevent further disintegration.
<ul>
<li style="padding-left:2em">&#9702; Gradually, the subordinate Nayaks of Mysore, Tanjore, Madurai and Bednur etc. became independent during the 17th century and the Vijayanagara Empire faded into insignificance.</li>
</ul>
</li>
<li>&#8226; Much of its territory was absorbed by Golconda and Bijapur.</li>
</ul>
<h3>Administration</h3>
<ul>
<li>&#8226; Due to constant warfare, the <strong>military aspect of the kingdom was emphasised</strong> and it shaped the politico-administrative structure of the Vijayanagara Empire.</li>
<li>&#8226; Though the institutions of Vijayanagara administration evolved locally, they had <strong>imprints of North India</strong>.</li>
</ul>
<h3>King</h3>
<ul>
<li>&#8226; The King, called <strong>Raya</strong>, was an autocratic head of state, who gained legitimacy on account of his public works.</li>
<li>&#8226; Kingship was <strong>hereditary</strong>, though revolts and coups were common.</li>
<li>&#8226; The king was supposed to <strong>rule according to the Dharmashastras</strong> and local traditions.
<ul>
<li style="padding-left:2em">&#9702; A king was supposed to look after the interest of people.</li>
<li style="padding-left:2em">&#9702; In his work on polity, Krishna Deva Raya enjoins that a King should protect good and punish evil as far as possible.</li>
<li style="padding-left:2em">&#9702; Nothing should escape his due justice and he should tax his subjects moderately.</li>
</ul>
</li>
<li>&#8226; The King was assisted by a <strong>council of ministers</strong> and <strong>high ranking officials.</strong>
<ul>
<li style="padding-left:2em">&#9702; There was another council which consisted of provincial governors, Nayakas, Nigam representatives and other men of influence.</li>
</ul>
</li>
<li>&#8226; But, the King was not bound by their advice.</li>
<li>&#8226; Princes could be enrolled into administration so as to gather experience.</li>
</ul>
<h3>Provincial Administration</h3>
<ul>
<li>&#8226; Provincial administration had <strong>geographical and historical variations</strong>.</li>
<li>&#8226; In the <strong>peripheral areas</strong> like the Tamil country and coastal areas, <strong>local chiefs</strong> were allowed to rule.
<ul>
<li style="padding-left:2em">&#9702; However, the royal administration maintained a watch over them and they had to pay <strong>regular tributes</strong> to the emperor.</li>
</ul>
</li>
<li>&#8226; The Kingdom was divided into <strong>Rajyas/Mandalam</strong>, headed by the Pradhans. Their number must have varied with the expansion and contraction of the empire.</li>
<li>&#8226; <strong>Earlier</strong>, mostly the members of the <strong>royal family</strong> were Pradhans, but <strong>later</strong>, these posts went more to the <strong>military aristocrats</strong>. They were quite autonomous.
<ul>
<li style="padding-left:2em">&#9702; They could issue coins in their own name.</li>
<li style="padding-left:2em">&#9702; They could maintain their own militia.</li>
<li style="padding-left:2em">&#9702; They were authorised to levy new and abolish old taxes.</li>
<li style="padding-left:2em">&#9702; These governors had to send a fixed amount of revenue to the centre.</li>
</ul>
</li>
<li>&#8226; <strong>Kollam/ Valnadus</strong> were equivalent to the districts.</li>
<li>&#8226; These were divided into <strong>Nadus</strong>, which in turn were subdivided into a group of villages known as <strong>&#8216;Melagrama&#8217; or &#8216;Sthala&#8217;</strong>.</li>
<li>&#8226; <strong>&#8216;Ur&#8217;</strong> (village) was the smallest unit.</li>
<li>&#8226; The concept of <strong>Rajyas</strong>, as an administrative and revenue unit, <strong>vanished by the time</strong> Nayaka system became entrenched under the rule <strong>of Krishna Dev Raya</strong>.</li>
</ul>
<h3>Nayankara System:</h3>
<ul>
<li>&#8226; <strong>Constant warfare</strong> on all its sides made the Vijayanagara state <strong>militaristic and feudal</strong>. The Nayakara system should be evaluated in this context.
<ul>
<li style="padding-left:2em">&#9702; It was an <strong>administrative innovation</strong> of the Vijayanagara state.</li>
</ul>
</li>
<li>&#8226; According to some historians, Nayaks were <strong>originally military officers</strong>. Though, some believe that these were the Zamindars.</li>
<li>&#8226; Eventually, Nayaks turned into a <strong>strong military-aristocratic class</strong>, which was difficult to subjugate at times.
<ul>
<li style="padding-left:2em">&#9702; Nuniz and Paes have left a detailed account of this system.</li>
</ul>
</li>
<li>&#8226; The state used to allot <strong>&#8216;Amaram&#8217;</strong> land to the Nayaks.
<ul>
<li style="padding-left:2em">&#9702; In turn, they had to <strong>administer</strong> their area, pay a certain amount of <strong>revenue</strong> to the state and maintain a certain number of <strong>troops</strong>- elephants, cavalry, infantry etc.</li>
</ul>
</li>
<li>&#8226; The Nayaks were <strong>different from a typical provincial governor</strong>, in that they were not transferable. They were more like feudal lords.
<ul>
<li style="padding-left:2em">&#9702; They were more <strong>autonomous</strong>.</li>
<li style="padding-left:2em">&#9702; The office of a Nayak was <strong>hereditary</strong>.</li>
</ul>
</li>
<li>&#8226; The big Nayaks were called &#8216;Amarnayakas&#8217; and smaller Nayaks were called &#8216;Palaigar&#8217;.</li>
<li>&#8226; Amarnayakas were supposed to maintain <strong>two representatives - military and political - in the royal court.</strong></li>
</ul>
<h3>Control</h3>
<ul>
<li>&#8226; <strong>Theoretically, the state could take back their land</strong>. But, this was rare in practice.</li>
<li>&#8226; The Vijayanagara state maintained a <strong>monopoly over the distribution of horses</strong>, so as to control these Nayaks.</li>
<li>&#8226; Later, an official named <strong>&#8216;Mahamandaleshwara&#8217;</strong> was appointed to monitor their movement during the reign of Achyuta Raya.</li>
<li>&#8226; However, <strong>all these measures were not sufficient</strong>. Nayakas always remained a challenging centrifugal force for the Kings of Vijayanagara.</li>
</ul>
<h3>Ayagar System:</h3>
<ul>
<li>&#8226; The <strong>local self-government institution of the Chola period had declined</strong> up to this time.</li>
<li>&#8226; The responsibilities of village committees were taken over by a group of <strong>12 officials.</strong>
<ul>
<li style="padding-left:2em">&#9702; They were paid in <strong>land grants</strong>.</li>
<li style="padding-left:2em">&#9702; Their post was <strong>hereditary</strong> and it could be bought and sold.</li>
</ul>
</li>
<li>&#8226; This whole system was called the <strong>Ayagar</strong> system.</li>
</ul>
<h3>Revenue Administration:</h3>
<ul>
<li>&#8226; The main sources of the royal income were the revenue from <strong>crown land (Bhandarvada)</strong>, <strong>tributes</strong> from the Nayaks, <strong>revenue from provincial governors</strong> and <strong>tolls</strong> on goods etc.</li>
<li>&#8226; Other than that, <strong>houses, factories, occupations and herds</strong> etc. were taxed.</li>
<li>&#8226; Even <strong>marriages</strong> were taxed.</li>
<li>&#8226; Krishna Deva Raya had decreed that the 1/4th of the revenue had to be spent on the court, 1/2nd on the army and the 1/4 would go to the treasury.</li>
<li>&#8226; Sometimes, a <strong>criticism</strong> is that the Vijayanagara state levied <strong>too many taxes.</strong>
<ul>
<li style="padding-left:2em">&#9702; But, given the <strong>all-around prosperity</strong> reflected in the sources, it is natural that the state would seek a part of it.</li>
<li style="padding-left:2em">&#9702; Also, the <strong>number of taxes may be more</strong> but their <strong>rates were lower</strong>. And, the state was adequately focused on <strong>public welfare</strong>.</li>
</ul>
</li>
</ul>
<h3>Q: Was the foundation of Vijayanagara Empire a result of Hindu resistance?</h3>
<p>Answer:</p>
<ul>
<li>&#8226; Vijayanagara Empire was the product of a cultural reaction to the Delhi Sultanate.
<ul>
<li style="padding-left:2em">&#9702; Harihar and Bukka took the help of Hindu revivalist movement of <strong>Kapaya Nayaka</strong> to complete their independence project.</li>
<li style="padding-left:2em">&#9702; They were also associated with a Hindu monk <strong>Vidyaranya</strong>.</li>
<li style="padding-left:2em">&#9702; During the early stages, Bukka I appealed to the <strong>Hindu scholars</strong> and artists from all around to come to the Vijayanagara Empire so as to give a Hindu identity to this state.</li>
<li style="padding-left:2em">&#9702; Often, the violence between Bahamanis and Vijayanagara took a <strong>bloody religious turn</strong>.</li>
</ul>
</li>
<li>&#8226; But, the claim of Hindu revival is <strong>rhetorical</strong> and not substantive.
<ul>
<li style="padding-left:2em">&#9702; There were <strong>no separate policies</strong> for the Hindu and Muslim subjects of the empire.</li>
<li style="padding-left:2em">&#9702; <strong>Mosques</strong> flourished during this period.</li>
<li style="padding-left:2em">&#9702; A <strong>large number of Muslim soldiers</strong> were enrolled into the Vijayanagara army.</li>
<li style="padding-left:2em">&#9702; <strong>Muslim merchants</strong> were quite active in this kingdom and the Arab merchants dominated the overseas trade.</li>
<li style="padding-left:2em">&#9702; While applying the <strong>Rajamandala</strong> principle, <strong>secular</strong> considerations alone prevailed. Vijayanagar&#8217;s earliest enemies were the Hoysalas, who were great patrons of Hindu temples.</li>
<li style="padding-left:2em">&#9702; When <strong>Gajapatis of Orissa</strong> occupied parts of the Vijayanagara kingdom, they <strong>aligned with the Bahamani kingdom</strong> to oust them.</li>
<li style="padding-left:2em">&#9702; Hindu <strong>Warangal</strong> was aligned with Bahamanis <strong>against Vijayanagara</strong> for a very long time.</li>
<li style="padding-left:2em">&#9702; Vijayanagara <strong>architecture</strong> borrowed freely from the Indo-Islamic architectural tradition.</li>
</ul>
</li>
<li>&#8226; Above facts are enough to convince us that the Vijayanagara Empire was a <strong>geopolitical entity with a separate cultural identity</strong>. It was <strong>not a Hindu revivalist state</strong>. It was a reaction to the exploitative intrusion of Delhi Sultanate into the region.</li>
</ul>
<h3>Nature of the Vijayanagara state:</h3>
<ul>
<li>&#8226; The nationalist historiography led by <strong>Nilkantha Shashtri</strong>, which emphasised <strong>centralisation</strong> remained unchallenged for a long time.</li>
<li>&#8226; Later, <strong>Burton Stein</strong>, rather unconvincingly, tried to apply the <strong>&#8216;Segmentary State Model&#8217;</strong> to the Vijayanagara Empire.
<ul>
<li style="padding-left:2em">&#9702; Here, he tried to separate the ritual head of the state from the actual sovereign authority of an area.</li>
<li style="padding-left:2em">&#9702; He opined that there were many segments of power which were disjointed from each other.</li>
<li style="padding-left:2em">&#9702; The King did not control the far off region with the help of bureaucracy and army, rather with the help of religion and rituals.</li>
<li style="padding-left:2em">&#9702; An example was cited that the annual nine day Dussehra festival in the Vijayanagara capital was not presided over by the Brahmin priests but the King himself performed the rituals.</li>
</ul>
</li>
<li>&#8226; <strong>TV Mahalingam</strong> calls it a <strong>feudal</strong> state and compares it with <strong>European feudalism.</strong>
<ul>
<li style="padding-left:2em">&#9702; European feudalism chained the entire society together in the link of sub-infeudation by smaller and smaller land tenures and fealty to the immediate superior lord.</li>
<li style="padding-left:2em">&#9702; Whereas, the <strong>Nayakara system only bonded Nayaks with the King.</strong></li>
<li style="padding-left:2em">&#9702; King gave them revenue assignments in return for certain responsibilities.</li>
<li style="padding-left:2em">&#9702; Though these Nayaks could lease out their land to smaller Nayaks, which looks like sub-infeudation, the concept of <strong>fealty by the small land holders and cultivators to the Nayaks is absent</strong> in the Nayakara system.</li>
</ul>
</li>
<li>&#8226; A closer reading of the accounts of foreign travellers and the Vijayanagara inscriptions by <strong>Karashima and Subbayaralu</strong> tells us that the Vijayanagara state was <strong>essentially feudal.</strong>
<ul>
<li style="padding-left:2em">&#9702; Karashima says that the strength of Vijayanagara state&#8217;s control over the Nayaks brings its feudalism closer to the <strong>&#8216;Tokugawa feudalism&#8217;</strong> of Japan, more than the European feudalism</li>
</ul>
</li>
<li>&#8226; <strong>Herman Kulke</strong> calls it <strong>&#8216;military feudalism&#8217;.</strong></li>
<li>&#8226; <strong>Burton Stein</strong> himself <strong>modified his views</strong> in his book, &#8216;Vijayanagara&#8217;, in 1989 CE. He said that the Vijayanagara administration was based on the <strong>patrimonial bureaucracy model.</strong></li>
</ul>
<p>We can conclude from the above discussion that the Vijayanagara state was not centralised but it was a <strong>feudal state due to the presence of the Nayak class.</strong></p>
<h3>Causes for the disintegration of Vijayanagara Empire:</h3>
<p>Vijayanagara was created as well as destroyed by the same set of factors.</p>
<ul>
<li>&#8226; It was <strong>surrounded by enemies</strong>. So, it could never reorient from being a <strong>military state</strong> to becoming a development oriented state.
<ul>
<li style="padding-left:2em">&#9702; Its <strong>essential character was feudal</strong> under the overall &#8216;Nayakara-Palaigar-Ayagara&#8217; set up.</li>
<li style="padding-left:2em">&#9702; These military aristocrats were a <strong>headache for all the rulers</strong> and they easily broke into civil wars when the centre became weak.</li>
<li style="padding-left:2em">&#9702; Their deep rooted <strong>vested interests prevented the evolution</strong> of long <strong>lasting politico-administrative institutions</strong> that could embed the name of Vijayanagara kings into the popular mind for centuries.</li>
<li style="padding-left:2em">&#9702; The <strong>military-feudal state consumed all the surplus.</strong></li>
</ul>
</li>
<li>&#8226; <strong>R. S. Sharma</strong> says that Vijayanagara state showed <strong>no enthusiasm for modernity</strong> unlike their contemporary European rulers, e.g. Henry, the navigator, of Portugal.
<ul>
<li style="padding-left:2em">&#9702; Barring its religious tolerance, its essential character was still medieval.</li>
</ul>
</li>
<li>&#8226; According to <strong>C. V. Vaidya</strong>, it was not possible to establish an eternal state as the <strong>state failed to set up robust mercantile processes</strong>.
<ul>
<li style="padding-left:2em">&#9702; Mercantilism was the order of the day in the world during this period.</li>
<li style="padding-left:2em">&#9702; The policy to allow the Portuguese to entrench themselves on the western coast, reduced its reputation as well as profits from overseas trade.</li>
</ul>
</li>
<li>&#8226; Due to its <strong>intense focus on patronising art</strong>, literature and architecture, the state spent a lot of wealth on these narrow groups instead of commissioning durable public welfare works.
<ul>
<li style="padding-left:2em">&#9702; Nuniz says that the peasants ended up giving as much as 80% of their production to different agencies.</li>
</ul>
</li>
<li>&#8226; <strong>As long as Vijayanagara could keep its enemies from uniting, it sustained</strong>. But, it all changed in the battle of Talikota which ended the glory of Vijayanagara.
<ul>
<li style="padding-left:2em">&#9702; However, the state lingered for the next hundred years or so.</li>
<li style="padding-left:2em">&#9702; The capital was first moved to Penugonda by Tirumal of the Aravidu dynasty. He regained some portions of the erstwhile state back and established law &amp; order.</li>
<li style="padding-left:2em">&#9702; Venkat II was the last ruler who tried to revive the empire from his new capital, Chandragiri.</li>
<li style="padding-left:2em">&#9702; However, during the 2nd half of the 17th century, regional chiefs asserted themselves and much of the remaining territory was absorbed by Golconda and Bijapur.</li>
</ul>
</li>
</ul>
<h3>Foreign Travellers</h3>
<p>During the reign of <strong>Devraya I</strong>, <strong>NICCOLO CONTI (Italian traveller)</strong> visited Vijayanagara.</p>
<ul>
<li>&#8226; He has given a detailed account of the city of Vijayanagar, which according to him, was <strong>&#8220;as large and as beautiful as Rome&#8221;.</strong></li>
<li>&#8226; He has also commented on the prevalence of <strong>Sati</strong>.</li>
</ul>
<p>The <strong>Persian traveller ABDURR RAZZAQ</strong> visited India during the reign of <strong>Dev Raya II</strong>. He first visited the Zamorin of Calicut and then went to the Vijaygnara empire.</p>
<ul>
<li>&#8226; He was a historian and scholar from Herat, sent to Vijayanagar as an <strong>ambassador</strong> of the ruler of <strong>Khurasan, Shah Rukh Mirza</strong>, to the court of Deva Raya II.</li>
<li>&#8226; He has described the time period of Deva Raya II in his travelogue, <strong>&#8216;Matla-us-Sadain wa Majma-ul-Bahrain&#8217;.</strong></li>
<li>&#8226; He specially describes the <strong>wealth and splendour</strong> of the capital. He vouches that Vijayanagar&#8217;s market was ten times the size of Herat&#8217;s market.
<ul>
<li style="padding-left:2em">&#9702; He says Vijayanagar was the <strong>largest and the most well provisioned city</strong> in the world.</li>
<li style="padding-left:2em">&#9702; According to him, <strong>traders of precious metals and jewels</strong> flocked its streets and bazaars, and the market sold every commodity imaginable.</li>
<li style="padding-left:2em">&#9702; He mentions that the Vijayanagara <strong>treasury was filled with molten gold nuggets.</strong></li>
</ul>
</li>
<li>&#8226; According to him, Vijayanagara had <strong>seven fortification walls</strong> within which there were provisions of all year water supply and agriculture fields.</li>
<li>&#8226; He mentions that the <strong>Sati</strong> system prevailed in Vijayanagara.</li>
<li>&#8226; According to him, state derived taxation income from <strong>prostitution and brothels.</strong></li>
<li>&#8226; He pegs the strength of Vijayanagara <strong>army</strong> at 11 lakh and counts the number of <strong>ports</strong> at 300.</li>
</ul>
<p>During <strong>Krishna Deva Raya&#8217;s reign, 2 Portuguese travellers</strong> visited the empire-</p>
<ul>
<li>&#8226; <strong>DURATE BARBOSA</strong> -
<ul>
<li style="padding-left:2em">&#9702; He describes the <strong>ship building and sati</strong> system.</li>
<li style="padding-left:2em">&#9702; He mentions that diamond and precious stones were imported from Pegu and silk was imported from China, whereas, black pepper came from Malabar coast.</li>
</ul>
</li>
<li>&#8226; <strong>DOMINGO PAES</strong>
<ul>
<li style="padding-left:2em">&#9702; He was received by Krishnadeva Raya at his court.</li>
<li style="padding-left:2em">&#9702; He has described the beauty of Vijayanagar and the king&#8217;s personal attributes. According to him, Krishna deva raya was a warrior king, whose body was covered in battlescars.</li>
</ul>
</li>
</ul>
<p>During the reign of <strong>Achyuta Raya</strong>, the Portuguese horse trader, <strong>FERNANDO NUNIZ</strong>, visited the empire.</p>
<ul>
<li>&#8226; He has mainly described the social and cultural aspects of Vijayanagara in his travelogue.
<ul>
<li style="padding-left:2em">&#9702; He says that there were <strong>women scribes, wrestlers, astronomers, musicians and fortune tellers</strong> in Vijayanagara.</li>
<li style="padding-left:2em">&#9702; He also mentions the <strong>social evils like dowry, Sati and child marriage</strong> which prevailed in the Vijayanagara society.</li>
<li style="padding-left:2em">&#9702; He praises the <strong>Brahmins</strong> of Vijayanagara as <strong>honest</strong> people who were <strong>good scribes</strong> also.</li>
<li style="padding-left:2em">&#9702; According to Nuniz, the <strong>rulers of Quilon, Sri Lanka, Pulicat, Pegu, Tennasserim and Malaya paid tribute</strong> to the Vijayanagara King.</li>
<li style="padding-left:2em">&#9702; He also describes the <strong>Nayankara system</strong> and says that the <strong>rate of land revenue was 1/10th.</strong></li>
</ul>
</li>
</ul>
<h2>BAHMANI SULTANATE (1347-1687)</h2>
<h3>Unified Bahmani (1347-1482)</h3>
<ul>
<li>&#8226; After Muhammad bin Tughlaq abandoned Daultabad, it was captured by <strong>Zafar Khan</strong> also known as <strong>Hasan Gangu</strong> in c. 1345 CE. He took the title, <strong>&#8216;Allauddin Bahaman Shah&#8217;</strong> upon founding the Bahmani Sultanate which lasted roughly two centuries.</li>
<li>&#8226; He moved his capital to <strong>Gulbarga</strong> in c. 1347 CE, which was moved again to Bidar in c. 1422 CE.</li>
<li>&#8226; A <strong>running theme</strong> in the entire history of Bahamani Kingdom is the <strong>struggle with Vijayanagara Empire</strong> for the control over Raichur Doab, Krishna-Godavari Delta and the Konkan coast, especially its ports like Goa and the <strong>conflict between Afaqi and Dakhni nobles</strong>.</li>
<li>&#8226; <strong>Political fortunes kept swinging</strong> and the details of individual struggles are not important from the point of view of historical processes.</li>
</ul>
<h3>Firoz Shah Bahmani</h3>
<ul>
<li>&#8226; The brightest star on the Bahmani firmament was the Firuz Shah Bahamani (c. 1397-1422 CE).</li>
<li>&#8226; He was a <strong>polymath</strong> who was deft in religion, logic, natural sciences and linguistics etc.
<ul>
<li style="padding-left:2em">&#9702; He was conversant in several languages such as Arabic, Persian, Turkish, Urdu, Kannada and Telugu.</li>
</ul>
</li>
<li>&#8226; He was <strong>tolerant</strong> of other religions and had personally read both the Old and New Testament.
<ul>
<li style="padding-left:2em">&#9702; It was during his reign that <strong>Gesu Daraz</strong>, the famous Chishti Sufi saint established his Khanqah at Gulbarga.</li>
</ul>
</li>
<li>&#8226; The <strong>decline of the Delhi Sultanate</strong> meant that many <strong>learned men migrated</strong> from Delhi to the Gulbarga.</li>
<li>&#8226; Firoz also <strong>invited scholars and nobles from Iraq and Iran</strong>.
<ul>
<li style="padding-left:2em">&#9702; Many of these West Asian migrants were Shiite. Under their influence, <strong>Persian culture and Shiite doctrine</strong> grew within the Bahmani Sultanate.</li>
</ul>
</li>
<li>&#8226; He also <strong>inducted a large number of Hindus in administration</strong>, which possibly acted as a balance against the influx of foreigners called Afaqis or Gharibs.</li>
<li>&#8226; He built an <strong>observatory at Daulatabad</strong>.</li>
<li>&#8226; Having <strong>initially defeated Devaraya I</strong>, he was <strong>later</strong> dealt a crushing defeat by a Warangal-Vijayanagar alliance led by Devaraya I and was <strong>forced to abdicate</strong> in favour of his brother Ahmad Shah &#8216;Wali&#8217;.</li>
</ul>
<h3>Ahmed Shah Wali</h3>
<ul>
<li>&#8226; He <strong>conquered Warangal</strong>, thus breaking the Vijayanagar-Warangal alliance. Following this, he <strong>shifted the capital to Bidar</strong> to better control the newly conquered territory.</li>
<li>&#8226; This <strong>shifted the balance of power</strong> in the favour of Bahamanis.
<ul>
<li style="padding-left:2em">&#9702; They conquered Berar, Khandesh and some parts of the Konkan coast during the second half of the 15th century.</li>
</ul>
</li>
<li>&#8226; As a result, <strong>Vijayanagar was considerably weakened</strong>. The period after Devaraya II was a period of chaos and the frontiers of Vijayanagar shrank on all sides.
<ul>
<li style="padding-left:2em">&#9702; The confusion allowed the Gajapatis of Orissa to move into the Delta region.</li>
</ul>
</li>
<li>&#8226; However, he is remembered more for his contribution as <strong>sufi saint</strong> than as a ruler. He was a close associate of Gesu Daraz and his death anniversary is jointly celebrated by both Hindus and Muslims.</li>
</ul>
<h3>Muhammad Gawan</h3>
<p>Not much is known about his early life. He gradually rose in the service of the Bahamani kingdom until he was appointed as <strong>&#8216;Wakil-us Sultanat&#8217; (Prime Minister)</strong> when the new King <strong>Muhammad Shah III</strong> was coronated in 1463. He dominated the affairs of the Bahamani kingdom for the next two decades.</p>
<h3>Territorial Expansion</h3>
<ul>
<li>&#8226; He <strong>aligned with Vijayanagara</strong> to defeat the Gajapatis.</li>
<li>&#8226; He also made <strong>deep inroads into Vijayanagara</strong>.
<ul>
<li style="padding-left:2em">&#9702; He <strong>annexed the Raichur doab</strong> and reached as far as Kanchipuram.</li>
<li style="padding-left:2em">&#9702; He was also able to <strong>snatch Dabhol and Goa from Vijayanagara.</strong>
<ul>
<li style="padding-left:4em">&#9632; Control over these two ports greatly boosted the external trade. Internal trade and manufacturing of the Kingdom also grew.</li>
</ul>
</li>
</ul>
</li>
<li>&#8226; Gawan had to wage a bitter struggle with <strong>Malwa</strong> ruler Mahmud Khalji over the question of <strong>Berar</strong>.
<ul>
<li style="padding-left:2em">&#9702; In this struggle, he was given active help by the Gujarat rulers.</li>
</ul>
</li>
</ul>
<h3>Internal Reforms and Downfall</h3>
<ul>
<li>&#8226; He carried out the administrative reorganisation of the Sultanate by dividing it into 8 provinces <strong>&#8216;Taraf/Atrafs&#8217;.</strong></li>
<li>&#8226; He also <strong>strengthened the military by including local Marathas</strong> in the army. He introduced the practice of making <strong>land grants</strong> to top commanders, thus winning Maratha loyalty.</li>
<li>&#8226; He also introduced the system of <strong>survey and measurement</strong> for land revenue.</li>
<li>&#8226; Apart from opening <strong>&#8216;Muqtabs&#8217;</strong> for elementary education, Gawan also set up a large <strong>Madrasa (college) in Bidar</strong> in the traditional Persian style called &#8216;REGISTAN&#8217;.
<ul>
<li style="padding-left:2em">&#9702; It was a three storey building in which a thousand teachers and students could live.</li>
<li style="padding-left:2em">&#9702; Some of the most famous scholars of the time from Iran and Iraq came there to teach.</li>
</ul>
</li>
<li>&#8226; The <strong>struggle between the Afaqis and Dakhni</strong> nobles was initially calmed by Mahmud Gawan.
<ul>
<li style="padding-left:2em">&#9702; However, he couldn&#8217;t bridge the factional gap completely, <strong>ultimately falling victim to it himself.</strong></li>
<li style="padding-left:2em">&#9702; The young sultan executed him on trumped up charges.</li>
</ul>
</li>
</ul>
<p>The strife became only more intense after this and the Bahamani <strong>Kingdom soon splintered</strong> into the five Deccan states, out of which, Bijapur, Golconda and Ahmednagar played important historical roles.</p>
<h3>AFANASY NIKITIN</h3>
<ul>
<li>&#8226; He was possibly the first <strong>Russian</strong> traveller to come to India. He has described both Vijayanagar and Bahamani kingdom in the 15th century.</li>
<li>&#8226; Nikitin calls Mahmud Gawan, &#8216;Tuzzar&#8217;, as Mahmud Gawan held the title of <strong>&#8216;Malik-i-Tuzzar&#8217;.</strong></li>
<li>&#8226; According to him, the <strong>land was very populous</strong> and the <strong>common people were very poor</strong>. But the <strong>nobles lived in great luxury</strong>.
<ul>
<li style="padding-left:2em">&#9702; Nikitin was amazed to see the <strong>king and the nobles ride on men</strong>. Perhaps he refers to palanquins carried by four to twenty men on special occasions.</li>
</ul>
</li>
<li>&#8226; It was his observation that, in India, <strong>everyone goes naked</strong>. All were <strong>barefoot</strong>, <strong>walked fast</strong> and were <strong>strong</strong>.
<ul>
<li style="padding-left:2em">&#9702; The intensity of heat possibly made people use scanty clothes. Perhaps this practice made Nikitin think that they went &#8216;naked&#8217;.</li>
<li style="padding-left:2em">&#9702; He, however, admits that they <strong>wore jewellery and ornaments</strong>.</li>
</ul>
</li>
<li>&#8226; He has given a rich, but not free from errors, account of contemporary society.</li>
</ul>
<h3>Administration</h3>
<p>The Bahamanis <strong>imitated the broad administrative structure of Delhi Sultanate.</strong> The offices and departments bear similarity with the ones from Delhi Sultanate.</p>
<ul>
<li>&#8226; However, <strong>some new offices</strong> were created with time, e.g. Wakil-us-Sultanat (Prime minister).</li>
<li>&#8226; Muhammad I (c. 1358-78 CE) is credited for institutionalizing the administrative structure.</li>
<li>&#8226; The Sultanate was divided into four <strong>&#8216;tarafs&#8217;</strong> with their headquarters at Daulatabad, Berar, Bidar and Gulbarga.
<ul>
<li style="padding-left:2em">&#9702; Governors (Tarafdars) of different provinces were given different titles.</li>
</ul>
</li>
<li>&#8226; Mahmud Gawan tried to <strong>reform</strong> the administration.
<ul>
<li style="padding-left:2em">&#9702; He tried to issue <strong>revenue assignments on the basis of land measurement.</strong></li>
<li style="padding-left:2em">&#9702; He also <strong>tried to curb the power of the &#8216;tarafdars&#8217;</strong>, who were controlling the military administration of the province.</li>
</ul>
</li>
<li>&#8226; The <strong>law of primogeniture gained comparatively more acceptance</strong> in the Bahamani Kingdom than the Delhi Sultanate.</li>
<li>&#8226; Throughout the life of Bahamani Kingdom, there was a tussle between the Dakhni and Afaqi nobles over plum posts in the administration.</li>
</ul>
<h3>Economy and Society</h3>
<ul>
<li>&#8226; The economy under the Bahamani sultans was <strong>prosperous but highly unequal.</strong>
<ul>
<li style="padding-left:2em">&#9702; Nikitin has thrown light on the trade and commerce of this period. According to him, <strong>Dabhol</strong> port was connected with the other ports of the Indian subcontinent and Africa.</li>
<li style="padding-left:2em">&#9702; <strong>Horses, clothes, silk and black pepper</strong> etc. were important items of trade.</li>
<li style="padding-left:2em">&#9702; Horses were imported from Arabia, Khurasan and Turkistan.</li>
<li style="padding-left:2em">&#9702; Indian merchants dominated the inland trade.</li>
</ul>
</li>
<li>&#8226; Nikitin highlights the <strong>glaring inequality</strong> between the nobility and commoners.
<ul>
<li style="padding-left:2em">&#9702; However, the society <strong>must have been more differentiated</strong> than this binary classification as the different occupational and ethnic groups must have occupied different positions in the socioeconomic hierarchy.</li>
</ul>
</li>
<li>&#8226; The social outlook of the Bahmani kings was mostly <strong>liberal</strong>.
<ul>
<li style="padding-left:2em">&#9702; Hindus of all castes, local Muslims, the immigrants from central and west Asia etc. lived in the kingdom which had a <strong>cosmopolitan</strong> structure.</li>
<li style="padding-left:2em">&#9702; <strong>Shia</strong> Muslims emerged as a social group due to migration from central Asia.</li>
</ul>
</li>
<li>&#8226; Persian, Marathi, Dakhni, Kannada and Telugu etc. were the commonly spoken <strong>languages</strong>.</li>
<li>&#8226; <strong>Hindus were usually not discriminated against.</strong>
<ul>
<li style="padding-left:2em">&#9702; There is no solid evidence to suggest that Jizya was imposed. If it was collected at all, then, it was a part of Kharaj.</li>
</ul>
</li>
<li>&#8226; <strong>Sufis</strong> migrated to the Deccan before and during this period in a large number. Sultans needed their support for legitimacy. Sattariya, Chishti and Qadiri were among the main Sufi orders.
<ul>
<li style="padding-left:2em">&#9702; <strong>Bidar</strong> was an important centre of the <strong>Qadiria</strong> order.</li>
<li style="padding-left:2em">&#9702; The Chisti saint Syed Muhammad <strong>Gesu Daraz</strong> migrated from Delhi to <strong>Gulbarga</strong> in c. 1402 CE. Firuz Shah granted &#8216;Inam&#8217; land for the maintenance of his &#8216;khanqah&#8217;.</li>
</ul>
</li>
</ul>
<h3>Successor States (1482-1687)</h3>
<ul>
<li>&#8226; <strong>Ahmednagar</strong> - it was ruled by the <strong>Nizam Shahi</strong> dynasty. In <strong>1601</strong> it was forced to accept the Mughal suzerainty by Akbar. It was finally annexed by Shah Jahan in <strong>1636</strong>.</li>
<li>&#8226; <strong>Bidar</strong>- it was ruled by the <strong>Barid Shahi</strong> Dynasty and was absorbed by the Ahmednagar Sultanate.</li>
<li>&#8226; <strong>Berar</strong> - it was ruled by the <strong>Imad Shahi</strong> dynasty, and was also absorbed by the Ahamednagar.</li>
<li>&#8226; <strong>Bijapur</strong> - it was ruled by the <strong>Adil Shahi</strong> dynasty. It was forced to accept the Mughal suzerainty by the Shah Jahan in <strong>1636</strong> and later annexed by Aurangzeb in <strong>1686</strong>.</li>
<li>&#8226; <strong>Golkonda</strong> - it was ruled by the <strong>Qutub Shahi</strong> dynasty and suffered the same fate as Bijapur. Shah Jahan established Mughal overlordship over it in <strong>1636</strong> and Aurangzeb annexed it in <strong>1687</strong>.</li>
</ul>
<h3>Important personalities of the later phase included</h3>
<ul>
<li>&#8226; <strong>Ibrahim Adil Shah</strong> - He built the Gol Gumbaz at Bijapur, the largest dome in Asia. He was also known as <strong>Jagatguru</strong> due to his religious tolerance, love for knowledge and music.</li>
<li>&#8226; <strong>Malik Ambar</strong> - originally a slave from Ethiopia named Chapu.
<ul>
<li style="padding-left:2em">&#9702; He was educated and trained in Baghdad, converted to Islam and renamed.</li>
<li style="padding-left:2em">&#9702; He was sold into the service of Malik Dabir (Royal Scribe) of Ahmednagar under whom he gained administrative and military experience.</li>
<li style="padding-left:2em">&#9702; After the death of his master, he was freed and became a military leader, raising his own force.</li>
<li style="padding-left:2em">&#9702; Mughal aggression towards the Deccan allowed him to quickly rise in power.</li>
<li style="padding-left:2em">&#9702; He became the Prime Minister and had his daughter married to the Sultan of Ahmednagar, becoming the regent and de facto ruler of Ahmednagar.</li>
<li style="padding-left:2em">&#9702; He joined hands with the Marathas to successfully resist Mughal encroachment.</li>
</ul>
</li>
</ul>
<h3>Bahmani - Vijayanagar Struggle</h3>
<p>The 14th century saw the emergence of two powerful Deccani kingdoms.</p>
<ul>
<li>&#8226; Bahamani Sultanate covered the linguistic region of Telugu, Kannada and Marathi. It was situated to the north of the Vijaynagar Empire.</li>
<li>&#8226; The Vijaynagar Empire covered the linguistic region of Telugu, Tamil, Kannada.
<ul>
<li style="padding-left:2em">&#9702; Their proximity led to a number of disputes between the two kingdoms and their history in rife with incessant warfare. For almost 200 years, they fought for the control of,
<ul>
<li style="padding-left:4em">&#9632; The Konkan Coast, including important ports such as Goa and Dabhol</li>
<li style="padding-left:4em">&#9632; Raichur Doab (between the Krishna and the Tunghbadhra)</li>
<li style="padding-left:4em">&#9632; Krishna-Godavari Delta</li>
</ul>
</li>
</ul>
</li>
<li>&#8226; During this period, their fortunes shifted constantly. Finally in 1565, the combined armies of 4 successor states (Ahmednagar, Bijapur, Golconda and Bidar) defeated the Vijayanagar Empire, being led by Rama Raya, in the decisive <strong>Battle of Talikota/ Bannihatti/ Rakshasa Tagadi.</strong></li>
<li>&#8226; The Vijaynagar empire collapsed after this. However, some of its Amara Nayakas continued to rule independently.</li>
</ul>
<h3>Q: Examine the nature of conflict between the Vijayanagara Kingdom and the Bahamani Sultanate.</h3>
<p>Both, Vijayanagara Empire and Bahamani Kingdom were born almost simultaneously and started fighting immediately.</p>
<ul>
<li>&#8226; Harihar and Bukka took the help of Hindu revivalist movement of Kapaya Nayaka to complete his independence project.</li>
<li>&#8226; They were also associated with a Hindu monk Vidyaranya.</li>
<li>&#8226; Often, the geopolitical contest between the Bahamanis and Vijayanagara took a bloody religious turn.</li>
<li>&#8226; Vijayanagara Kings tried to create the image of a Hindu state and the Sultans also used religion and religious vengeance as it suited them.</li>
<li>&#8226; Richard Eaton calls the Vijayanagara frontier the &#8216;Maginot Line&#8217; of the Deccan.</li>
</ul>
<h3>Historiography</h3>
<ul>
<li>&#8226; However, it was essentially a geopolitical conflict with historical roots.
<ul>
<li style="padding-left:2em">&#9702; They fought for the control of fertile land and strategic ports, just like the erstwhile kingdoms of the Peninsular India had fought for the control of Raichur Doab, Krishna-Godavari Delta and the Konkan Coast.</li>
</ul>
</li>
<li>&#8226; Their Rajamandala considerations were purely secular. Once they even aligned with each other.</li>
<li>&#8226; Firuz Shah employed a large number of Hindus in his administration and Vijayanagara inducted Muslim archers in their army.</li>
<li>&#8226; Within their respective kingdoms, there was no considerable favouritism in the matters of taxation, trade and rights of the subjects.</li>
<li>&#8226; Both kingdoms practised their own versions of tolerance.</li>
<li>&#8226; Thus, it becomes clear that the Vijayanagar-Bahmani conflict was not a religious crusade but religion was certainly used to mobilise the respective sides more strongly.</li>
</ul>"""

with open('lib/noteContent.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# The entry ends with the closing backtick on line 10074
# We need to find the exact closing pattern and insert before it
old = """<li>&#8226; So land revenue reforms should be viewed as a process of gradual evolution and the entire credit shouldn&#8217;t be given to Shershah.</li>
</ul>
<p>In the light of above factors, Shershah appears to be a <strong>great reformer but not an innovator</strong>.</p>`,"""

new = """<li>&#8226; So land revenue reforms should be viewed as a process of gradual evolution and the entire credit shouldn&#8217;t be given to Shershah.</li>
</ul>
<p>In the light of above factors, Shershah appears to be a <strong>great reformer but not an innovator</strong>.</p>""" + html_to_append + """`,"""

count = content.count(old)
print(f"Found {count} occurrence(s) of target string")

if count == 1:
    content = content.replace(old, new, 1)
    with open('lib/noteContent.ts', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Replaced 1 occurrence(s). Done.")
else:
    print("ERROR: Expected exactly 1 occurrence. Aborting.")
