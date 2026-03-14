import re

html_to_append = """<h2>Rise of the Marathas</h2>
<p><strong>Different views related to the rise of Marathas as a major power in Deccan towards the middle of the 17th century</strong></p>
<ul>
<li>&#8226; The term &#8220;Maratha&#8221; originally referred to the speakers of the Marathi language.</li>
<li>&#8226; In the 17th century, it emerged as a designation for soldiers serving in the armies of Deccan sultanates.
<ul>
<li style="padding-left:2em">&#9702; A number of Maratha warriors, including Shivaji&#8217;s father, Shahaji, originally served in those armies.</li>
<li style="padding-left:2em">&#9702; Gradually they emerged as a powerful political entity and by the mid-1660&#8217;s, Shivaji had established an independent Maratha kingdom. He was crowned as Chhatrapati (sovereign) of the new Maratha kingdom in 1674.</li>
</ul>
</li>
</ul>
<p>There are <strong>different perspectives</strong> regarding rise of Maratha as a power, which has been propounded by different historians:</p>
<p><strong>1. Hindu reaction against policies of Aurangzeb: by Jadunath Sirkar, GS Sardesai, V. V Joshi:</strong></p>
<ul>
<li>&#8226; This view focuses on Aurangzeb&#8217;s conservative religious policy. i.e. anti-Hindu approach, and rise of Marathas as reaction to this.</li>
<li>&#8226; Shivaji was greatly influenced by the saint Ramdas who guided him onto an orthodox Hindu path.</li>
<li>&#8226; Shivaji adopted the title &#8216;Haindava dharmodharaka&#8217; at the time of coronation.</li>
<li>&#8226; He also adopted the title of &#8216;Gau Brahman Pratipalak&#8217;.</li>
<li>&#8226; The military campaigns of Shivaji was characterised by the slogan &#8211; &#8216;har har mahadev&#8217;.</li>
</ul>
<p><strong>Criticism of this view:</strong></p>
<ul>
<li>&#8226; Early phase of rise of Marathas under Shahji and Shivaji started before Aurangzeb came to the throne.
<ul>
<li style="padding-left:2em">&#9702; This view presents a chronological error</li>
</ul>
</li>
<li>&#8226; After dealing with Bijapur and Golconda, the next target of the Marathas were the Nayakas and Deshmukh chiefs, this led to even destruction of temples.</li>
<li>&#8226; Muslims were employed in Shivaji&#8217;s state system.</li>
<li>&#8226; Shivaji didn&#8217;t not ally with Hindu powers such as Rajputs for rebelling against Mughals.</li>
<li>&#8226; Titles adopted by Shivaji were general titles adopted by Hindu kings, so this was no departure.</li>
<li>&#8226; Recent evidence and research have shown that Shivaji did not meet or know Ramdas until late in his life i.e after coronation.</li>
</ul>
<p><strong>2. National struggle for independence against alien rule (Mughals): by M.G Ranade, Raj Wade:</strong></p>
<ul>
<li>&#8226; This perspective views the rise of the Marathas as the nascent beginning of the nationalist sentiment in India.</li>
<li>&#8226; Geographical isolation of Marathwada region protected it from foreign invasions, fostered a feeling of regional independence among the Marathas. It also made possible, the effective use of guerrilla tactics against the Mughals.</li>
<li>&#8226; Military confrontation against the Mughals turned the Marathas into hardy warriors and disciplined soldiers.</li>
</ul>
<p><strong>Criticism of this view:</strong></p>
<ul>
<li>&#8226; The term foreign has been used in the context of north Indian powers which hardly seems to conform to the notion of nationalistic consciousness.</li>
<li>&#8226; According to Satish Chardra: In a nationalistic struggle there is a primary condition- existence and role of middle class which is absent here.</li>
</ul>
<p><strong>3. Role of Maratha dharma, Marathi language, social cohesion etc:</strong></p>
<ul>
<li>&#8226; <strong>Maharashtra dharma and the spread of the devotional cult:</strong>
<ul>
<li style="padding-left:2em">&#9702; Growth of Bhakti Movement fostered a sense of social cohesion and strong sense of brotherhood among the Marathas, leveled social distinctions and discrimination and created homogeneous society.</li>
<li style="padding-left:2em">&#9702; It provided the base for transforming the Marathas into a community with strong roots which was later grafted into a solid political base by Shivaji.</li>
</ul>
</li>
<li>&#8226; <strong>Common language Marathi:</strong>
<ul>
<li style="padding-left:2em">&#9702; Use of Marathi language by the Bhakta saints promoted a sense of unity among the Marathas and social unity paved the way for the rise of the Marathas as a major political force in the area.</li>
</ul>
</li>
</ul>
<p><strong>Criticism:</strong></p>
<ul>
<li>&#8226; P V Ranade disputes the view that the rise of Maratha power was caused by Maharashtra Dharma as it is very difficult to establish a direct link between Maharashtra dharma and the rise of Maratha power.
<ul>
<li style="padding-left:2em">&#9702; He considered it a myth that there was greater social unity and cohesion in Maratha society which was as much stratified as north Indian society.</li>
<li style="padding-left:2em">&#9702; For e.g. the word Watandar related to a class of indigenous, hereditary land owners. They were either Brahmins or Kshatriyas by caste. Constituting a caste based and economically dominant aristocracy, they shared the same exploitative tendencies that were displayed by the Mughal jagirdars or zamindars of peasantry.</li>
</ul>
</li>
</ul>
<p><strong>4. Shivaji&#8217;s leadership:</strong></p>
<ul>
<li>&#8226; Maraths emerged as a powerful force not before the rise of Shivaji.</li>
<li>&#8226; He provided bold, dynamic and capable leadership to the Marathas and led them successfully to the attainment of political independence.</li>
<li>&#8226; Marathas were groomed into a community by Shivaji through his political intelligence and foresight. He transformed them from plundering and marauding hordes into the most enduring and effective regional power to contest the authority of the Mughals.</li>
</ul>
<p><strong>Criticism</strong></p>
<ul>
<li>&#8226; Discipline in the ranks of the Marathas was more a myth than a reality as can be seen in the policy of plunder and pillage followed by them towards their neighbour, both Hindus and Muslims.</li>
</ul>
<p><strong>5. Mughal expansion and pressure in Deccan: by Adrew Wink, Grant Duff:</strong></p>
<ul>
<li>&#8226; The expansion of the Mughals in Deccan caused political uncertainty in the Deccan and posed threat to the both Deccani states and Marathas.
<ul>
<li style="padding-left:2em">&#9702; The Deccani Sultanates, hard pressed by the Mughals, were unable to check the growing power of the Maratha watandars and some even came to depend on the support of the Marathas against the Mughals.</li>
</ul>
</li>
<li>&#8226; Valuable military experience gained by the Maraths in course of their campaigns and the administrative experience obtained in the service of the Deccani Sultanates proved extremely helpful for the Marathas in later years.</li>
<li>&#8226; The collapse of the Deccani Sultanates and the failure of the Mughals to consolidate their authority there left a political vacuum in the Deccan which the Maraths tried to and succeeded in filling up.</li>
<li>&#8226; This was the time when Shivaji began to mobilise the Maratha forces and began military adventure.</li>
<li>&#8226; This view has not been questioned yet but there was perhaps more than just this reason.</li>
</ul>
<p><strong>6. Socio-economic factor, Representing Social tension and struggle: by Satish Chandra.</strong></p>
<ul>
<li>&#8226; According to Satish chandra:
<ul>
<li style="padding-left:2em">&#9702; Maratha society was characterised by a land based hierarchical social structure.</li>
<li style="padding-left:2em">&#9702; Shivaji curtailed the power of big Deshmukhs, mitigated their abuses and established necessary supervisory authority.</li>
<li style="padding-left:2em">&#9702; Petty landholders, who were often at the mercy of bigger Deshmukhs benefited from this policy.</li>
<li style="padding-left:2em">&#9702; It was these petty landholders that became the basis of his strength.</li>
</ul>
</li>
<li>&#8226; The position of Marathas in the Varna system was ambivalent and as late as the early 19th century. The Marathas as a whole were not accepted as Kshatriyas by Brahmins.
<ul>
<li style="padding-left:2em">&#9702; This scenario resulted in deep ferment within the Maratha society and a trend of upward social mobility emerged.
<ul>
<li style="padding-left:4em">&#9632; Shivaji&#8217;s claim of Kshatriya status at the time of coronation is a good example of such a trend.</li>
<li style="padding-left:4em">&#9632; Many social groups relying on Shivaji were motivated by the prospect of rising in social scale.</li>
<li style="padding-left:4em">&#9632; Maharashtra Dharma with its stress on egalitarian ideas provided as ideological justification for social mobility by individuals and groups.</li>
</ul>
</li>
</ul>
</li>
</ul>
<p><strong>Conclusion</strong></p>
<ul>
<li style="padding-left:2em">&#9702; Thus, it was not religion or nationalism but political and social factors that provided the basis for the rise of Marathas.</li>
<li style="padding-left:2em">&#9702; It can be seen as a regional reaction against the centralising tendencies of the Mughal Empire.</li>
<li style="padding-left:2em">&#9702; The Marathas wanted a large principality for themselves, for which an ideal background was provided by the disintegration of the Nizam Shahi power of Ahmednagar and the introduction of a new factor- Mughals.</li>
<li style="padding-left:2em">&#9702; Its inherent socio-economic contradictions helped in mobilising the local landed element, which became the basis for political formation.</li>
</ul>
<h2>Nature of the Maratha Political System</h2>
<p>The nature of political system of Marathas can be divided into three main phases:</p>
<h3>Phase I (17th century): Centralised nature of Maratha political system (under Shivaji)</h3>
<h3>Centralised state machinery:</h3>
<ul>
<li>&#8226; Shivaji as an absolute ruler with all powers concentrated in his hands.</li>
<li>&#8226; He was a benevolent despot.</li>
</ul>
<h3>Ashtapradhan:</h3>
<ul>
<li>&#8226; Council of eight ministers appointed by Shivaji:
<ul>
<li style="padding-left:2em">&#9702; Peshwa &#8211; Prime Minister, headed Ashtapradhan</li>
<li style="padding-left:2em">&#9702; Amatya &#8211; Auditor,</li>
<li style="padding-left:2em">&#9702; Mantri &#8211; Record keeper,</li>
<li style="padding-left:2em">&#9702; Sachiv &#8211; incharge of Royal Secretariat,</li>
<li style="padding-left:2em">&#9702; Sumant &#8211; foreign secretary,</li>
<li style="padding-left:2em">&#9702; Senapati &#8211; commander-in-chief,</li>
<li style="padding-left:2em">&#9702; Pandit Rao &#8211; in charge of Religious affairs,</li>
<li style="padding-left:2em">&#9702; Nyayadhish &#8211; Chief Justice.</li>
</ul>
</li>
<li>&#8226; All ministers except Nyayadhish and Pandit Rao were required to command armies and lead expeditions. Their functions were purely advisory.</li>
<li>&#8226; M G Ranade writes that &#8220;Like Napoleon, Shivaji in his time was a great organiser and a builder of civil institutions&#8221;. His system was an autocracy of which he himself was the supreme head. His administration principles included the welfare of his subjects.</li>
</ul>
<h3>Centralised military:</h3>
<ul>
<li>&#8226; Before Shivaji, the army was made up mostly of part time soldiers who worked their fields for half the year and gave active service during the dry season.</li>
<li>&#8226; Shivaji introduced a regular standing army under a Commander in Chief known as Senapati.</li>
</ul>
<h3>Navy &#8211;</h3>
<ul>
<li>&#8226; Shivaji realised the importance of building a navy for the purpose of trade and defence against the Europeans.</li>
</ul>
<h3>Forts &#8211;</h3>
<ul>
<li>&#8226; Forts occupied an important position in Shivaji&#8217;s Swarajya.</li>
<li>&#8226; He appointed Havaldar for their administration, assisted by a Subedar and a Karkhani.</li>
<li>&#8226; Multiple officials provided checks and balances.</li>
</ul>
<h3>Centralised revenue system:</h3>
<ul>
<li>&#8226; For the purpose of revenue collection and administration, Shivaji divided his kingdom into a number of Provinces, further divided into Parganas and villages formed the lowest unit.</li>
<li>&#8226; The revenue settlement was based on measurement of land.
<ul>
<li style="padding-left:2em">&#9702; Assessment after careful survey of land.</li>
<li style="padding-left:2em">&#9702; State dues fixed at 30%.</li>
</ul>
</li>
<li>&#8226; Besides land revenue Shivaji imposed various other taxes, like taxes on
<ul>
<li style="padding-left:2em">&#9702; professions,</li>
<li style="padding-left:2em">&#9702; trade,</li>
<li style="padding-left:2em">&#9702; social and religious functions.</li>
</ul>
</li>
<li>&#8226; To establish his supremacy over Deshmukhs, Shivaji proclaimed himself as &#8216;Sardeshmukh&#8217; and introduced a tax called Sardeshmukhi.</li>
</ul>
<h3>Legitimacy to power through ideological means</h3>
<ul>
<li>&#8226; To legitimise his rule, Shivaji claimed Kshatriya status and linked his lineage with the Sisodias.
<ul>
<li style="padding-left:2em">&#9702; He also adopted the title &#8216;Kshatriyakulvatamsa&#8217; (jewel of the warrior race).</li>
</ul>
</li>
<li>&#8226; Further, he also adopted titles such as
<ul>
<li style="padding-left:2em">&#9702; &#8216;Haindav Dharmaodharak&#8217; (protector of Hindu Dharma) and</li>
<li style="padding-left:2em">&#9702; &#8216;Gau Brahman Pratipalak&#8217; (protector of cows and Brahmins)</li>
</ul>
</li>
</ul>
<h3>Phase II (1713 to 1761): Feudal system (under the Peshwas)</h3>
<ul>
<li>&#8226; Due to the weak successors of Shivaji, Ashtapradhan and the office of Peshwas became hereditary.</li>
<li>&#8226; By the Sangola agreement of 1750, the Peshwa emerged as the real and effective head of the state and the Chatrapati became a &#8216;Roi Faineant&#8217; (do-nothing King).</li>
<li>&#8226; The centralised state system lost relevance and a feudal polity based on landed aristocracy emerged.
<ul>
<li style="padding-left:2em">&#9702; Deshmukhs became important.</li>
<li style="padding-left:2em">&#9702; Maratha chiefs like Nimbalkar, Holkar, Gaekwad, Bhonsle etc became powerful. They were headed by the Peshwa.</li>
</ul>
</li>
</ul>
<h3>Phase III (From 1761) &#8211; Maratha Confederacy</h3>
<ul>
<li>&#8226; The feudal system which began under the Peshwas, culminated in the Maratha confederacy which comprised of:
<ul>
<li style="padding-left:2em">&#9702; Peshwa of Poona</li>
<li style="padding-left:2em">&#9702; Sindhia of Gwalior</li>
<li style="padding-left:2em">&#9702; Gaekwad of Baroda</li>
<li style="padding-left:2em">&#9702; Bhonsle of Nagpur</li>
<li style="padding-left:2em">&#9702; Holkars of Indore</li>
</ul>
</li>
<li>&#8226; Although the Peshwa remained the head, in principle, Maratha chiefs like Gaekwad, Holkar, Sindhia, Bhonsle, etc. became almost sovereign.</li>
<li>&#8226; So, there emerged a number of parallel powers as these chiefs were almost autonomous in their rights, which considerably undermined the powers of Peshwas.</li>
</ul>
<h2>The Maratha Fiscal System</h2>
<h3>Land revenue: Background:</h3>
<ul>
<li>&#8226; During Shivaji&#8217;s reign, the revenue system seems to have been patterned on the system of Malik Ambar.</li>
<li>&#8226; A new revenue assessment was completed by Annaji Datto in 1679.</li>
<li>&#8226; Shivaji also strictly supervised the mirasdars, that is, those with hereditary rights in land.
<ul>
<li style="padding-left:2em">&#9702; Describing the situation, Sabhasad, who wrote in the 18th century, says that these sections paid to the government only a small part of their collections.</li>
<li style="padding-left:2em">&#9702; &#8216;In consequence, the mirasdars grew and strengthened themselves by building bastions, castles, and strongholds in the villages, enlisting footmen and musketeers... this class became unruly and seized the country.&#8217;</li>
<li style="padding-left:2em">&#9702; Shivaji destroyed their bastions and forced them to submit.</li>
</ul>
</li>
</ul>
<h3>Mokasa, jagir and saranjams:</h3>
<ul>
<li>&#8226; Traditionally, in the Maratha territory the terms mokasa, jagir and saranjams were often used interchangeably. However, jagirs were more permanent in nature than mokasa.
<ul>
<li style="padding-left:2em">&#9702; They were military tenures though theoretically temporary and were transferable and could be confiscated. But in practice they assumed hereditary character.</li>
<li style="padding-left:2em">&#9702; Officials were largely paid in the form of mokasas or jagirs in lieu of their services.</li>
<li style="padding-left:2em">&#9702; It is interesting to find the presence of the practice of sub-letting of Jagirs, a feature totally absent in north India.</li>
</ul>
</li>
<li>&#8226; Mokasadars had dual ranks, Jat and Fauj (parallel to Mughal Zat and Sawar ranks).
<ul>
<li style="padding-left:2em">&#9702; Jat denoted personal pay while Fauj was given for the maintenance of the troops.</li>
<li style="padding-left:2em">&#9702; The revenues were assigned to mokasadars only after deducting sardeshmukhi, chauth, and batai.</li>
</ul>
</li>
<li>&#8226; Shivaji discontınued granting mokasas/ saranjams/ jagirs, and instead preferred to pay his officials in cash.
<ul>
<li style="padding-left:2em">&#9702; However soon after Shivaji&#8217;s death his son Raja Ram revived the practice of granting mokasas.</li>
<li style="padding-left:2em">&#9702; There was the tendency on the part of mokasa holders to convert their grant as inam or watan to make it hereditary.</li>
<li style="padding-left:2em">&#9702; A R Kulkarni finds the tendency to convert mokasas into hereditary tenures as &#8216;feudal&#8217;.</li>
</ul>
</li>
</ul>
<h3>Inam Lands:</h3>
<ul>
<li>&#8226; Inam lands were revenue free assignments made to the pious, needy and the scholars.
<ul>
<li style="padding-left:2em">&#9702; Interestingly, inam lands were not completely tax free.
<ul>
<li style="padding-left:4em">&#9632; They had to pay 1/3rd or 1/4th of the revenue collected to the state depending on the nature of the inam tenure.</li>
</ul>
</li>
<li style="padding-left:2em">&#9702; Inams were of two types - Diwan Nisbat Inam and Gaon Nisbat Inam.
<ul>
<li style="padding-left:4em">&#9632; The former was granted by the state through a sanad;</li>
<li style="padding-left:4em">&#9632; while the latter were made by the village community. It was known as dehangi-inam and was granted to village artisans and servants.</li>
</ul>
</li>
</ul>
</li>
<li>&#8226; Watan was a service tenure given to the holder in lieu of service.
<ul>
<li style="padding-left:2em">&#9702; Watans were largely held by village officials &#8211; village headmen (patil/muqaddam), village accountant (kulkarni), changula (assistant of patil), shete mahajan (village market officer), and the mahar (village watchman), temples, priests, etc.</li>
<li style="padding-left:2em">&#9702; In practice these were hereditary and permanent.</li>
</ul>
</li>
<li>&#8226; Watan and inam were used as synonyms in Maharashtra.</li>
</ul>
<h3>Evolution of Revenue Policy</h3>
<ul>
<li>&#8226; Shivaji introduced a system of collecting a share of actual produce on the basis of land survey and measurement.
<ul>
<li style="padding-left:2em">&#9702; Fixing of state demand according to the availability of irrigation facilities was as old as the days of Manu and Kautilya, but the classification of land according to fertility and actual state of cultivation was due the influence of Malik Ambar&#8217;s revenue system.</li>
</ul>
</li>
<li>&#8226; Under the Peshwas, the system of survey and Measurement was largely abandoned. They preferred making grants of land on long leases on a fixed state demand.</li>
<li>&#8226; The state demand as well as the mode of payment of land revenue was not uniform and varied from region to region.</li>
<li>&#8226; Expansion of Agriculture
<ul>
<li style="padding-left:2em">&#9702; To incentivise cultivators to bring more and more land under cultivation the land newly brought under cultivation was lightly taxed.
<ul>
<li style="padding-left:4em">&#9632; For bringing waste and rocky land under cultivation, Madhav Rao II announced that half of such land would be given in inam and for the remaining half, rent-free concessions were offered for 20 years and further concession in reduced tax for another 5 years.</li>
</ul>
</li>
</ul>
</li>
<li>&#8226; Welfare Measures
<ul>
<li style="padding-left:2em">&#9702; In times of famine, drought, plunder of crops or failure of crops, remissions of land revenue were granted.</li>
<li style="padding-left:2em">&#9702; To save the cultivator from the clutches of money-lenders the state granted &#8216;Tagai Loans&#8217; at low rates of interest.</li>
</ul>
</li>
<li>&#8226; Thus, the revenue system of the Marathas was based on the principle of security of the tax-payer.
<ul>
<li style="padding-left:2em">&#9702; However, the benevolent system was upset by Baji Rao II who introduced the system of revenue-farming.</li>
</ul>
</li>
</ul>
<h3>Chauth and Sardeshmukhi:</h3>
<p>Chauth and Sardeshmukhi were two instruments used by Shivaji and the subsequent Maratha rulers to obtain treasure from enemy territories and Deshmukhs respectively.</p>
<h3>Chauth:</h3>
<ul>
<li>&#8226; Shivaji demanded from the subjects of his enemies, tribute roughly equivalent to one-fourth of the estimated revenue of the province to save themselves from the harassment of his armies.
<ul>
<li style="padding-left:2em">&#9702; He captured the rich people of the enemy territory and compelled them to agree to this ransom.</li>
<li style="padding-left:2em">&#9702; It is roughly estimated that the income of Shivaji from Chauth alone was approximately 90 lakh hons.</li>
</ul>
</li>
<li>&#8226; Chauth has a long history. Koli Rajas of Ramnagar (Konkan) were collecting Chauth from the Portuguese much before Shivaji levied it.
<ul>
<li style="padding-left:2em">&#9702; That is why the Portuguese used to address the Koli Rajas as Chauthia Raja.</li>
<li style="padding-left:2em">&#9702; The first instance of Shivaji asking for Chauth occurs when Shivaji subdued the Kolis (after the conquest of Ramnagar) and demanded the same Chauth from the Portuguese.</li>
<li style="padding-left:2em">&#9702; They resented it and there followed a tussle between them over the issue. Sometimes they delayed the payments and at times avoided paying in full.</li>
<li style="padding-left:2em">&#9702; Gradually, the Marathas began imposing the levy on a regular basis even from those Mughal territories over which they had claim/ indirect control.</li>
</ul>
</li>
</ul>
<h3>Sardeshmukhi:</h3>
<ul>
<li>&#8226; It was imposed by Shivaji in his own dominion &#8216;Swarajya&#8217; on the basis of his claim as hereditary Sardeshmukh (head-man of all Maharashtra). Thus, it was claimed by Shivaji as a matter of right unlike Chauth.
<ul>
<li style="padding-left:2em">&#9702; It was based on the claim that as the hereditary Sardeshmukh, he was entitled to compensation for protecting the welfare of the people of the state.</li>
<li style="padding-left:2em">&#9702; This was only a fiction and was collected from all areas which paid Chauth as well.</li>
</ul>
</li>
<li>&#8226; Chauth and Sardeshmukhi, however, should not be confused with the spoils of war.</li>
<li>&#8226; It was 10 percent of the total revenue realised. Sardeshmukhi was fixed along with jamabandi.</li>
<li>&#8226; Sabhasad (Krishnaji Anant) has estimated the income of Shivaji&#8217;s empire from Sardeshmukhi at 1 crore hons.</li>
</ul>
<h3>Debate about Chauth:</h3>
<p>Later on in the time of the Peshwas, the Mughal emperor&#8217;s sanction was secured to collect Chauth and Sardeshmukhi from the six subas of the Deccan for which the Marathas agreed to serve the Mughal government with 15,000 horses and pay a small sum as fee. Thus the enemy sources were gradually exhausted and the marathas were enabled to extend their boundaries.</p>
<p><strong>View I: Chauth was similar to Wellesly&#8217;s Subsidiary Alliance System</strong></p>
<ul>
<li>&#8226; This fact makes the Maratha historian Ranade say that Chauth was not a mere military contribution without any legal obligation but a payment in lieu of protection against the invasion of a third power.
<ul>
<li style="padding-left:2em">&#9702; He says that this could be compared with Wellesley&#8217;s subsidiary system. In this system, the ruler of a native state, if he chose to sign the subsidiary treaty, had to keep a British force in his territory and pay for its maintenance.</li>
<li style="padding-left:2em">&#9702; The East India Company in its turn undertook the duty of protecting the ruler against external invasion and internal rebellion.</li>
<li style="padding-left:2em">&#9702; In Shivaji&#8217;s system, though there was a tacit understanding to protect the state that pays Chauth from foreign aggression.</li>
<li style="padding-left:2em">&#9702; However the Maratha leaders could not pursue it to its logical end and give protection to those states.</li>
<li style="padding-left:2em">&#9702; In other words, under the subsidiary system, the control of the British over the other party was far more complete and exacting than under the Maratha system.</li>
</ul>
</li>
</ul>
<p><strong>View II: Counter-view</strong></p>
<ul>
<li>&#8226; According to Sardesai, Chauth was just a tribute collected from hostile or conquered territories.</li>
<li>&#8226; Surendra Nath Sen is of opinion that Chauth was nothing but a contribution exacted by a military leader and maintains that this black-mail was justified by the exigencies of the situation.</li>
<li>&#8226; Jadunath Sarkar thinks that the payment of Chauth merely saved a kingdom from the unwelcome presence of the Maratha soldiers and civil underlings, but did not impose on Shivaji any corresponding obligation to guard the district from foreign invasion or internal disorder.
<ul>
<li style="padding-left:2em">&#9702; The Marathas looked only to their gain and not to the fate of their prey after they had left. Chauth was only a means of buying off one robber and not a subsidiary system for the maintenance of peace and order against all enemies.</li>
<li style="padding-left:2em">&#9702; The lands subject to the chauth cannot therefore be rightly called spheres of influence.</li>
<li style="padding-left:2em">&#9702; Chauth for all intents and purposes, appears to have been a military contribution. It was paid to ward off an attack of the Marathas and perhaps to prevent their reappearance in a country.</li>
</ul>
</li>
</ul>
<p><strong>View III: Chauth as an instrument of Feudalism</strong></p>
<ul>
<li>&#8226; V.G. Dighe and S.N. Qanungo assert that in the time of the Peshwas, Chauth and Sardeshmukhi helped the growth of feudalism which Shivaji wanted to put an end to.
<ul>
<li style="padding-left:2em">&#9702; In the time of Shahu and his successors, the chiefs who raised men and money for realising Chauth and Sardeshrmukhi in distant lands on their own, could neither be expected to obey the royal orders nor render accounts of money they raised and spent.</li>
<li style="padding-left:2em">&#9702; The main cause for this was that the king himself showed no interest in distant operations.</li>
</ul>
</li>
</ul>
<h3>Other sources:</h3>
<ul>
<li>&#8226; The Marathas also derived some revenue from forests, customs and excise duties, mints etc.</li>
<li>&#8226; Permits were sold for cutting timber from forests; forest grass, bamboo, wood and wild honey were also sold.</li>
<li>&#8226; The state also granted licences for private mints to approved goldsmiths who were required to pay a royalty to the state.</li>
<li>&#8226; Some other kind of taxes imposed were:
<ul>
<li style="padding-left:2em">&#9702; tax on land irrigated from wells,</li>
<li style="padding-left:2em">&#9702; a house tax recovered from everyone except brahmans and village officers,</li>
<li style="padding-left:2em">&#9702; an annual fee for the testing of weights and measures,</li>
<li style="padding-left:2em">&#9702; a tax on marriage and the remarriage of widows,</li>
<li style="padding-left:2em">&#9702; taxes on sheep and she-buffaloes,</li>
<li style="padding-left:2em">&#9702; a pasturage fee,</li>
<li style="padding-left:2em">&#9702; a tax on melon cultivation on river bed,</li>
<li style="padding-left:2em">&#9702; a succession duty and</li>
<li style="padding-left:2em">&#9702; a town duty</li>
</ul>
</li>
</ul>"""

with open('lib/noteContent.ts', 'r', encoding='utf-8') as f:
    content = f.read()

old = """<li>&#8226; Simultaneously, <strong>foreign invasions</strong> also added fuel to the fire.</li>
</ul>`,
  'economy-society-16-17c': ``"""

new = """<li>&#8226; Simultaneously, <strong>foreign invasions</strong> also added fuel to the fire.</li>
</ul>""" + html_to_append + """`,
  'economy-society-16-17c': ``"""

count = content.count(old)
print(f"Found {count} occurrence(s) of target string")

if count == 1:
    content = content.replace(old, new, 1)
    with open('lib/noteContent.ts', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Replaced 1 occurrence(s). Done.")
else:
    print("ERROR: Expected exactly 1 occurrence. Aborting.")
