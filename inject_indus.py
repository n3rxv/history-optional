import re

with open("lib/noteContent.ts", "r") as f:
    content = f.read()

html = """<h1>Harappan Civilisation</h1>

<p>It represents the first urbanisation in the Indian subcontinent.</p>

<h2>Origin of the Harappan Civilisation</h2>

<p>Controversies about the origin, nature of urbanisation and decline of the Harappan civilisation persist due to the following factors:</p>

<ol>
<li>The Harappan script has not been deciphered yet.</li>
<li>On most of the Harappan sites, only vertical excavation has been carried out. Not being able to conduct horizontal excavation means precious information to create a complete picture of the Harappan civilisation remains missing.</li>
</ol>

<p>There are different theories about the origin of Harappan civilisation:</p>

<h3>1. Theory of Mesopotamian Origin (Diffusion Theory)</h3>

<ul>
<li>• Harappan civilization came to light after excavations were carried out at Harappa by John Marshall and Daya Ram Sahni and Mohenjodaro by R.D. Banerjee.</li>
<li>• Some British scholars tried to trace the roots of this civilisation. British scholars like Gordon, Kramar and Mortimer Wheeler emphasised the idea of Mesopotamian origin of the Harappan civilisation.
<ul>
<li>◦ While Gordon and Kramar talked about the migration of people from Mesopotamia to Meluha (Harappa), Mortimer Wheeler laid emphasis on the import of the idea of urbanisation from Mesopotamia.</li>
</ul>
</li>
</ul>

<h4>Arguments in favour of this theory</h4>

<ul>
<li>• Most of the Harappan cities, including Harappa and Mohenjodaro, were divided into two parts i.e. citadel and lower town.
<ul>
<li>◦ Citadels are fortified. So, it seems that those living in the citadel area were not interested in regular interactions with the inhabitants of the lower town.</li>
<li>◦ On this ground, the propagators of the foreign origin theory tried to prove that those who lived in the citadel area, might have belonged to a foreign elite group.</li>
</ul>
</li>
<li>• In some Harappan structures, like the granaries at Mohenjodaro and Harappa, wooden roof work was done.
<ul>
<li>◦ These structures had some architectural similarity with the Mesopotamian structures.</li>
</ul>
</li>
</ul>

<h4>Arguments against this theory</h4>

<ul>
<li>• There was a vast difference in the town planning patterns of the two civilisations.
<ul>
<li>◦ While Harappan towns were built on a grid pattern, the Mesopotamian towns were laid out in a haphazard manner.</li>
</ul>
</li>
<li>• There was a difference in the nature of seals, script and implements.
<ul>
<li>◦ E.g. The Mesopotamian seals were cylindrical in shape whereas the Harappan seals were either rectangular or square.</li>
<li>◦ Likewise the Harappan script was pictographic but the Mesopotamian script was cuneiform — which has been deciphered.</li>
<li>◦ Apart from that, the Mesopotamians produced finer copper implements than the Harappan artisans.</li>
</ul>
</li>
<li>• So, the theory of Mesopotamian origin has almost been discarded. The whole debate has now moved towards the theory of 'Gradual Evolution'.</li>
</ul>

<h3>2. The Theory of 'Gradual Evolution'</h3>

<ul>
<li>• It began to be argued that the Harappan Civilisation organically emerged from different rural cultures spread over the vast region in the North-Western part of the Indian subcontinent.</li>
<li>• Amalanand Ghosh has postulated the origin of Harappan Culture from the Sothi Culture of Rajasthan.
<ul>
<li>◦ He came to this conclusion on the basis of similarities of potteries of Harappan Civilisation and Sothi Culture.</li>
</ul>
</li>
<li>• Later, M. R. Mughal took up this issue. On the basis of his comprehensive study of the rural cultures of Cholistan area, he found them to be the genesis of Harappan Civilisation.
<ul>
<li>◦ His theory was based, not only on pottery, but also on a meticulous assessment of implements, seal, script, subsistence pattern etc.</li>
</ul>
</li>
<li>• Since the first excavations at Harappa, excavations have been going on continuously.
<ul>
<li>◦ So, a lot of new sites have been discovered and excavated. New breakthroughs have been made in the study of Harappan civilization with the help of continuous research, re-excavation of some old sites and analysis of the old materials from a fresh perspective.</li>
</ul>
</li>
<li>• If we look at the Harappan sites of Dholavira from Gujarat, Kunal from Haryana and Harappa from Pakistani Punjab, we find that all these three archaeological sites show a transition from the early Harappan phase to mature Harappan phase.</li>
<li>• Now, it is widely believed that the Harappan civilisation gradually evolved from the village cultures which were spread in the vast region of North-Western part of the Indian subcontinent like Sothi-Siswal culture (Rajasthan/Haryana), Amri-Kot Diji Culture (Sindh), Irani-Balochi village culture, Hakra Wares Culture etc.</li>
</ul>

<h3>The Process of Evolution</h3>

<h4>1. The Neolithic Phase (5500–3200 BCE)</h4>

<ul>
<li>• While observing the Neolithic sites in the North-West, we realise that the alluvial soil beds of the Indus system were fertile but they were subjected to the annual flooding. So, practising agriculture in this region was difficult.</li>
<li>• Gradually, the people in this region learnt to use the fertile soil by growing crops after the annual flooding season was over i.e. sowing in November and harvesting in April.</li>
<li>• They also developed the skills to channelise the flooding with the help of barrages, canals etc.</li>
<li>• In due course of time, they also learnt to utilise the stone quarries in the surrounding areas and started to make sophisticated stone tools.</li>
<li>• Consequently, a number of prosperous rural cultures developed in the north-west between 5500 BCE and 3200 BCE. E.g. Rehman Dheri, Gumla, Kila Tarkai, Jalilpur, Ranaghundia, etc.</li>
</ul>

<h4>2. Early Harappan Phase (3200 BCE – 2600 BCE)</h4>

<ul>
<li>• The next phase of material development is visible during the Early Harappan phase between 3200 BCE to 2600 BCE.</li>
<li>• The most significant technological development during this period was seen in the area of agriculture; it was the usage of the wooden plough.
<ul>
<li>◦ A much larger area could be brought under cultivation with the help of plough.</li>
<li>◦ Initially, manpower went into drawing it, later, animals were harnessed for ploughing.</li>
</ul>
</li>
<li>• There was a diversification in the cultivated crops, and apart from grains like wheat and barley, even commercial crops like cotton were grown.
<ul>
<li>◦ We find evidence of cotton from Mehrgarh.</li>
</ul>
</li>
<li>• Various crafts developed as craft specialisation took place as well.
<ul>
<li>◦ E.g. bronze metal began to be used.</li>
<li>◦ 'Spindle' was used for 'spinning' and 'fabric weaving' also started.</li>
</ul>
</li>
<li>• The use of wheels had started during the Neolithic period. It was first used to make pottery. Later, it was fitted to carts.
<ul>
<li>◦ Therefore, technological advancement accelerated not only production, but transportation as well.</li>
</ul>
</li>
<li>• The production of commercial crops like cotton encouraged the craft activities. Craftsmen were settled in different regions. So, some sort of network developed between them; thus started the regional trade. Long distance trade also developed during this period.
<ul>
<li>◦ Alluvial plains of the Indus River system were linked to the mountainous Balochistan. The nomadic people of this region domesticated sheep and goats.</li>
<li>◦ They periodically moved into the Indus valley in search of pasture. During floods they would move back to the mountains of Baluchistan and finally to the Iranian plateau. It was this element which linked the West Asian region with the Indus region.</li>
</ul>
</li>
<li>• Trade led to the development of a script as well. Because it was essential to maintain records of the transactions.</li>
<li>• Then, as the artisans and merchants were settled in some specific regions, they needed food and commercial crops. These products were supplied to them by some sort of authority or government.
<ul>
<li>◦ The authorities might have imposed taxes to take the surplus from the rural areas and channelize this surplus to the urban centres.</li>
<li>◦ Areas with the production surplus were connected to the granaries.</li>
<li>◦ Even tax authorities needed a script to maintain taxation records. From the early Harappan sites like Padri (Gujarat), we find evidence of the use of script.</li>
</ul>
</li>
<li>• By this period, the processes of change became so complex that some sort of ideological support structure — religious beliefs, state, kinship etc. — became necessary to sustain these complex socio-political interactions.
<ul>
<li>◦ Thus, fertile ground had been laid for the emergence of a centralising or unifying entity, a typical civilisational force.</li>
<li>◦ But we are not yet sure about the ideology of the Harappan people because the Harappan script has not been deciphered yet.</li>
</ul>
</li>
<li>• Some Early Harappan Sites: Kila Tarkai, Lewan, Rehman Dheri, Gumla, Damb Sadat, Nal, Kulli, Nindowari, Nausharo, Balakot, Amri, Mohenjodaro, Jhang, Sarai Khola, Harappa, Jalilpur, Kalibangan, Sothi-Siswal, Rakhigarhi, Kunal, Banawali, Bhirrana, Gamanwala, Nagwada, Surkotda, Dholavira, Padri.</li>
</ul>

<h4>3. The Mature Harappan Phase (2600 BCE–1900 BCE)</h4>

<ul>
<li>• During the Early Harappan phase, the society was still at a rural stage. But during the mature Harappan phase, it advanced to the urbanisation stage and became one of the earliest urban civilizations of the world.</li>
</ul>

<h4>Limitations of the Theory of Gradual Origin</h4>

<ul>
<li>• Not all of the Early Harappan sites developed into mature Harappan sites.
<ul>
<li>◦ For example, in Cholistan (Ghaggar-Hakra) region, there were hundreds of the Early Harappan sites but only three could transform into mature Harappan sites.</li>
</ul>
</li>
<li>• Further, there are those 'mature' Harappan sites that do not yield an 'early' Harappan occupational layer underneath.
<ul>
<li>◦ Many urban Harappan sites like Lothal, Desalpur, Chanhudaro, Ropar, Mitathal and Alamgirpur etc. do not have an 'early' Harappan occupational layer below them.</li>
</ul>
</li>
<li>• Moreover, important sites like Harappa and Mohenjo Daro do have an early Harappan layer below them. But, there is some sort of discontinuity between two successive occupation levels and their mutual relationship i.e. between the 'early' Harappan and 'mature' Harappan phase is not clear.</li>
<li>• The theory of gradual origination also doesn't shine light on the unifying force/forces that could mobilise resources on such a large scale so as to build a full fledged civilisation with planned cities, extensive trading networks and centralised administration.</li>
</ul>

<h2>Characteristic Features of the Harappan Civilisation</h2>

<ul>
<li>• It was the first urban civilisation in the Indian subcontinent and it was contemporary to the urban civilisations of Mesopotamia, Egypt and China.</li>
<li>• It cropped up during the Chalcolithic period. But, as the Harappan people developed bronze by mixing copper and tin, it is also associated with the Bronze Age.</li>
<li>• Normally agriculture and trade play important roles in Urbanisation. But in the context of Harappan Civilisation, trade definitely played a more decisive role than agriculture. That's why Urban Centers emerged even in those regions where practising agriculture was difficult e.g. Sutkagen Dor and Sukta Koh in Balochistan.</li>
<li>• Town Planning — The entire city was planned and the civic infrastructure was impressive. Most of the important towns were divided into two parts i.e. the Western part had a well-fortified citadel which was often built on a raised platform and the Eastern part had a lower town.
<ul>
<li>◦ The citadel area was meant for the ruling class and it consisted of some important monuments and commoners were settled in the Eastern part.</li>
</ul>
</li>
<li>• If we compare the standard of living of the Harappan people with other contemporary civilisations, we note that the Mesopotamian and Egyptian ruling class lavishly spent resources on monuments but the ordinary people lived in huts or mud houses.
<ul>
<li>◦ On the other hand, the Harappan elites spent less on monuments and the people enjoyed higher standards of life. They lived in the houses which were built from the standardised burnt bricks. Thus, the Harappan ruling class had an egalitarian approach.</li>
</ul>
</li>
<li>• Scholars suggest that a state control is necessary to attain such a high level of standardisation.</li>
<li>• The Harappan people developed a scientific temper. This was visible in the following areas:
<ul>
<li>◦ Harappan town planning was a rare example in their contemporary world. It proves that the Harappan people had a good working knowledge of mathematics and measurement e.g. bricks were standardised in almost all the Harappan sites, their measurements were always in the ratio of 4:2:1.</li>
<li>◦ Harappan people were familiar with the science of astronomy.</li>
<li>◦ They had knowledge of copper and bronze forging.</li>
<li>◦ They were using standard weights and measures.</li>
<li>◦ They were familiar with the decimal system (higher weights) and binary system (smaller weights) in calculation.</li>
<li>◦ They developed numerals and they used 16 and its multiples in measurements.</li>
</ul>
</li>
</ul>

<h2>Economic Activities — Agriculture, Trade and Commerce</h2>

<h3>Agriculture and Animal Husbandry</h3>

<ul>
<li>• Agriculture developed in certain areas where the land was fertile. The Harappan people were using agrarian implements which were made from stone, copper and bronze.</li>
<li>• They used ploughs for cultivation. We have found evidence of a furrowed field from Kalibangan in Rajasthan.</li>
<li>• The Harappans produced varieties of crops i.e. wheat, barley, peas, pulses, cotton etc. From Gujarat, we find evidence of rice production as well.</li>
<li>• Animal rearing was an occupation which was practised for food production and other purposes like wool, transportation etc. We infer the domestication of these animals on the basis of their excavated bones and their representation in terracotta figures.</li>
<li>• The discovery of granaries from Harappa, Mohenjodaro and Kalibangan gives a hint of the channelisation of agrarian surplus towards cities.</li>
</ul>

<h3>Art and Craft</h3>

<ul>
<li>• A civilisation reaches up to the urbanisation stage with the help of robust craft based activities and trade. The Harappan people represented a complex trading community and the backbone of their trade was their craft specialisation.</li>
<li>• They were efficient in producing the following items:
<ul>
<li>◦ Cotton goods e.g. evidenced from Mohenjo Daro</li>
<li>◦ Bead making e.g. workshops in Chanhudaro (Sindh), Lothal (Gujarat)</li>
<li>◦ Ivory works at Lothal</li>
<li>◦ Shell work at Lothal</li>
</ul>
</li>
</ul>

<h3>Trade and Commerce</h3>

<p>Evidences of a developed trade and commerce network are:</p>

<ul>
<li>• The use of standardised weights and measures.</li>
<li>• The use of a script.</li>
<li>• The evidence of boats and carts (from pictures on seals and toy carts).</li>
<li>• Harappan seals which were discovered from the Persian Gulf, Ur and Nippur in Mesopotamia.
<ul>
<li>◦ Persian seals were found from Lothal. Mesopotamian seals were discovered from both Mohenjodaro and Kalibangan.</li>
</ul>
</li>
<li>• A Mesopotamian tablet dated 2350 BCE declares that merchants from Dilmun (Bahrain), Magan (Oman) and Meluha (Harappa) anchor their boats at Mesopotamian ports.</li>
</ul>

<h4>Types of Trade</h4>

<ul>
<li>• Regional Trade:
<ul>
<li>◦ Movement of agrarian goods from villages to towns.</li>
<li>◦ Exchange of goods among different regions within the Indian subcontinent e.g. trade with Rajasthan chalcolithic cultures for copper, Karnataka Neolithic cultures for gold etc.</li>
</ul>
</li>
<li>• External Trade — with the Persian Gulf, Mesopotamia, Egypt, Turkmenistan in Central Asia etc.</li>
</ul>

<h4>Routes of Trade</h4>

<ul>
<li>• Both land routes and sea routes were used. The evidence of boats and carts prove this fact.</li>
<li>• Important ports — Lothal, Rangpur and Rojdi (Gujarat), Sutkagendor, Sutka Koh, Balakot (Balochistan).</li>
</ul>

<h4>Imported Items</h4>

<ul>
<li>• Shell from Baluchistan, Copper from Rajasthan, Gold from Kolar (Karnataka) and Afghanistan, Silver from Afghanistan, Turquoise from Persia, Lapis Lazuli from Afghanistan etc.</li>
</ul>

<h4>Exported Items</h4>

<ul>
<li>• Shell and Ivory products from Gujarat, other types of finished goods of gold, black wood, cotton and possibly grains.</li>
</ul>

<h3>Construction Works</h3>

<ul>
<li>• Construction activities were regularly going on in the Harappan cities. It would have involved a large number of labourers, architects, administrators etc.</li>
<li>• From Harappa and Mohenjodaro, we find evidence of coolie lines (workers apartment). It means a large number of workers were regularly commissioned.</li>
<li>• Public buildings include the Granary, the Great Bath, an assembly hall in Mohenjodaro, Dockyard from Lothal, Stadium from Dholavira etc.</li>
</ul>

<h3>How Far Is It Justified to Say That Mesopotamian Trade Played a Decisive Role in the Rise of the Harappan Civilisation?</h3>

<p>Such a statement is very difficult to substantiate due to the following factors:</p>

<ul>
<li>• We don't have any solid data which can highlight the volume of trade between Meluha and Mesopotamia.</li>
<li>• On the basis of new research, it has been proven that the Indian subcontinent was more prosperous than Mesopotamia. So, the Harappan people might have depended more on trade within the Indian sub-continent than with outside.</li>
</ul>

<h2>Harappan Society and Culture</h2>

<ul>
<li>• We don't have much knowledge about the Harappan society and culture as archaeological evidence is not the right kind of source to shed light on society and culture. For that, we require literary evidence. Unfortunately, the Harappan script has not been deciphered yet.</li>
<li>• However, on the basis of the seals, sealings, sculptures, terracotta figures etc we can infer the following propositions:</li>
</ul>

<h3>Society</h3>

<ul>
<li>• The Harappan civilisation was at an advanced stage of development. Thus, social stratification seems possible. It may have been divided into the richer and poorer classes with a full spectrum ranging from the rich merchant class to the poor labourers.</li>
<li>• Within the Harappan civilisation, we can trace different socio-economic groups.
<ul>
<li>◦ The scheme of town planning and governance gives the hint of an efficient ruling class. So, there would have been a ruling class of bureaucrats and officers who belonged to an elite group.</li>
<li>◦ Merchants, different professional groups, peasants etc. would have made up other groups. These groups were associated with the production processes.</li>
<li>◦ The statue of a man with beard, unearthed from Mohenjodaro, hints towards the presence of a priestly class as well.
<ul>
<li>◦ The evidence of fire altars from Lothal and Kalibangan proves it further.</li>
</ul>
</li>
<li>◦ Lastly we find evidence of the labour class as well.</li>
</ul>
</li>
<li>• The condition of women vis-à-vis males and whether the society was matriarchal or patriarchal are not clear. The Women figurines inspired some historians to conclude that it represented a matriarchal society. But, latest anthropological narratives challenge this common sense conclusion.</li>
</ul>

<h3>Religion</h3>

<ul>
<li>• A Religion has two important parts i.e. metaphysics (ideology) and rituals. Due to the dearth of literary evidence, we are unable to understand the metaphysical aspects of the Harappan religion. On the basis of the archaeological evidence, we get some idea about the rituals. Thus, we get a keyhole view into the philosophy behind those rituals.</li>
</ul>

<h4>Features</h4>

<ul>
<li>• The Harappan religion was polytheistic. Multiple cults prevailed e.g. water cult, tree cult, serpent cult, fire cult, animal cult, worship of swastika etc.
<ul>
<li>◦ Actually the multiplicity of cults conforms to the diversified life of an urban culture which was an amalgamation of different social groups.</li>
</ul>
</li>
<li>• The Harappan cults were linked with production (fertility) e.g. the worship of male and female sex organs, the cult of mother goddess, the fire altars and the serpent cult, all of these represent fertility and production — this view is based on the modern practices by modern tribes and cultures. In fact, serpent stood as an allegorical representation of sex, which in turn is associated with fertility (production).</li>
<li>• The Harappan religion reflected the elements of 'Bhakti' and 'Animism'.
<ul>
<li>◦ In fact, idol worship was practised in the Harappan civilisation, although temples are not visible. As idol worship is associated with the worship of an individual god, it resembles the 'Bhakti' type of worship.</li>
<li>◦ Likewise, in the Harappan civilization, the use of amulets was widespread. It gives a hint towards the idea of 'animism' prevailing there.</li>
</ul>
</li>
<li>• The Harappan cults didn't vanish even after the decline of the Harappan civilisation. Rather, they merged with the other Indian ways and ideas of worship and spirituality and later they prepared the way for the rise of Hinduism.</li>
</ul>

<h2>Art and Architecture</h2>

<h3>Art</h3>

<p>It was earlier believed that Harappans lagged behind the Mesopotamians and the Egyptians in terms of artistic expression. But on the basis of recent research, it has been proved that the Harappan people produced artifacts in larger quantities and they were quite diverse in nature.</p>

<ul>
<li>• Seals — They were possibly used for making impressions on the mercantile goods. Most of the seals were made of steatite stone.
<ul>
<li>◦ Normally, they were rectangular or square shaped. These seals bore some script on them. On square shaped seals, animals were represented as well.</li>
</ul>
</li>
<li>• Beads — These were meant for jewellery. Most of the beads were made of steatite, semi-precious stones and coral while few others were made of metals as well.</li>
<li>• Bronze art — The Harappans produced bronze statues of humans as well as animals in large numbers.
<ul>
<li>◦ Some of the bronze pieces are art marvels e.g. dancing girl from Mohenjodaro. The Harappans used the 'Lost wax technique' to make bronze statues.</li>
</ul>
</li>
<li>• Terracotta figurines — The Harappans produced large numbers of terracotta figurines representing men, women, animals, birds etc.
<ul>
<li>◦ These figures were meant to be used either as idols or toys.</li>
<li>◦ Possibly, these figurines belonged to the people who came from the lower strata of society. But, they reflect the Harappan expertise in making sculptures.</li>
<li>◦ Later, this art merged with the other common Indian art forms.</li>
</ul>
</li>
<li>• Stone art — The Harappan people produced stone sculptures as well. They represented human beings and animals in those sculptures.
<ul>
<li>◦ Unfortunately, nearly all the stone sculptures which so far have come to the light are damaged. Still some statues — like that of the bearded priest from Mohenjodaro and two statues from the Harappa representing the human anatomy — have a superb quality.</li>
</ul>
</li>
</ul>

<h3>Architecture</h3>

<ul>
<li>• Harappan architecture is represented in public monuments and individual houses.</li>
<li>• As the Harappan ruling class didn't prefer to spend much on public monuments, the number of public monuments is limited.</li>
<li>• On the other hand, the common people were enjoying higher standards of living than their counterparts in other contemporary civilisations.</li>
<li>• So, a large number of burnt-brick houses for the common people is a unique feature of this civilization.</li>
</ul>

<p><strong>Building materials:</strong> Mud bricks, burnt bricks (most commonly used) and stone.</p>

<p><strong>Cementing material or mortars:</strong> Mud, Bitumen and gypsum.</p>

<h4>Public Buildings</h4>

<ul>
<li>• Mohenjodaro — Assembly hall, the Great Bath, Granary (largest building).</li>
<li>• Harappa — 12 granaries (6-6 in two rows), surface area equal to that of the single granary at Mohenjodaro.</li>
<li>• Dholavira — A stadium-like building.</li>
<li>• Lothal — A dockyard represented the largest piece of architecture.</li>
</ul>

<h4>Private Houses</h4>

<ul>
<li>• The houses were made of burnt bricks — single storied or double storied.</li>
<li>• At Mohenjodaro, almost every house had a courtyard with a well inside.</li>
<li>• Stairs were built to go to the upper storey.</li>
<li>• Every house had a bathroom with a burnt-brick floor.</li>
<li>• A proper drainage system was installed in the houses which were connected to the main drainage system in turn.</li>
</ul>

<h2>Decline of Harappan Civilisation</h2>

<p>There is a heated debate about the decline of the Harappan civilisation because:</p>

<ul>
<li>• The Harappan script has not been deciphered yet.</li>
<li>• Even the archaeological evidence doesn't help to clarify this issue as most of the excavations are vertical and not horizontal.</li>
</ul>

<p>Various theories were propounded in this regard:</p>

<h3>1. The Theory of Aryan Invasion</h3>

<p>It was propounded by the British historian, Mortimer Wheeler. He declares that the decline of the Harappan civilization was sudden and catastrophic.</p>

<ul>
<li>• In favour of his theory, he presented the following evidences:
<ul>
<li>◦ He presented 26 human skulls with cut wounds — found at Mohenjodaro — as a sign of a conflict.</li>
<li>◦ Likewise, he claimed that the skeleton in the 'Cemetery H' layer from Harappa belonged to an invader group.</li>
<li>◦ As literary evidence, he has given reference to the Rig Veda i.e. he identifies the term 'Hariyupiya' and 'Purandar' with Harappa and breaker of forts (Indra) respectively.</li>
</ul>
</li>
</ul>

<p>But on the basis of recent research, scholars have come to the conclusion that the views of Mortimer Wheeler were not convincing because:</p>

<ul>
<li>• The archaeological evidence that he cited is not sufficient. The number of skeletons at Mohenjodaro is too small and limited to only one location. Even a smaller number of those deaths can be conclusively attributed to the violent wounds.</li>
<li>• The skeleton at the cemetery-H belongs to a different period.</li>
<li>• The literary evidence which he presented is not authentic as the Rig Veda was transferred in the oral form for centuries and it was written at a much later period.</li>
<li>• There is a time gap of nearly 300-400 years between the decline of Harappan civilization and the advent of Aryans in India.</li>
<li>• In fact, Mortimer Wheeler was representing an imperialistic view on Indian historiography. By propounding the theory of Aryan invasion, he tried to justify British invasion of India.</li>
</ul>

<p>That's why the whole debate about the decline of Harappan civilisation moved in other directions.</p>

<h3>2. Decline Due to Climatic and Environmental Factors</h3>

<p><strong>The theory of flood</strong> — John Marshall and S.R. Rao supported this theory.</p>

<ul>
<li>• John Marshal traced some seven layers of flooding from Mohenjodaro.</li>
<li>• Likewise S.R. Rao found evidence of flooding at Lothal and Bhagtrav in Gujarat.</li>
</ul>

<p><strong>The theory of tectonic movement</strong> — M.R. Sahni differed with the view of a normal monsoon type of flooding.</p>

<ul>
<li>• According to him, this was a catastrophic inundation which was caused by the tectonic movements.</li>
<li>• The Indus water was blocked due to the upliftment of a tectonic plate at Mohenjodaro. Due to this, people vacated Mohenjodaro.</li>
<li>• The view of Sahni was approved by a U.S. hydrologist R.L. Raikes.</li>
</ul>

<p><strong>Growing desertification</strong> — H.T. Lambrick didn't accept this view.</p>

<ul>
<li>• He argued that even if such a blockage was created, the river could make its way by cutting through it.</li>
<li>• He gives 'Drought' as the reason behind the decline.
<ul>
<li>◦ Lambrick emphasised that earlier, River Sutlej and Yamuna were tributaries of the River Ghaggar; later Sutlej shifted to join the Indus while the Yamuna joined the Ganges.</li>
<li>◦ Consequently, the River Ghaggar dried up creating an acute water shortage in the region.</li>
</ul>
</li>
<li>• Also, a botanist Gurdeep Singh studied pollen grains at Pushkar and Didwana (Rajasthan) and has tried to establish that by 1900 BCE there was decline in the rainfall in this region.</li>
</ul>

<p><strong>Drifting away of the Monsoon</strong> — In 2012, a group of archaeologists studied the decline of Harappan civilisation by excavating the Indian and Pakistani regions.</p>

<ul>
<li>• According to this theory, the monsoon drifted away resulting in the decline of precipitation in the region, thus resulting in decline of civilisation.</li>
</ul>

<p><strong>Ecological imbalance</strong> — Fairservis has highlighted the problem of ecological imbalance caused due to the over exploitation of natural resources.</p>

<ul>
<li>• Likewise, Vishnu Mitre has given a hint of the phenomenon of the excessive human intervention in nature.</li>
</ul>

<p><strong>Decline of Mesopotamian trade</strong> — Recently, Sheeren Ratnagar has underscored the decline of Mesopotamian trade and called it a major factor behind the decline of Harappan Civilisation. But, there is no data to support this hypothesis.</p>

<h3>3. Change of Character of Harappan Civilisation</h3>

<p>D.K. Chakravarty has given a new perspective to this debate.</p>

<ul>
<li>• According to him, the Harappan Civilization was based on a proper balance between its urban and rural regions, agriculture and trade etc.</li>
<li>• But when it made an eastward shift gradually, it merged with less developed social groups like peasants, shifting cultivators, hunter-gatherers etc.</li>
<li>• In association with the inhabitants of an urban civilization (Harappan people), these social groups certainly advanced; but simultaneously Harappan inhabitants (civilisation) lost their urban character.</li>
</ul>

<h3>Critical Appraisal of the Views on the Decline of Harappan Civilisation</h3>

<p>As we have seen, different scholars have given different views while explaining the causes of decline of civilisation.</p>

<ul>
<li>• The earlier view of the Aryan invasion theory can't be substantiated, so it has lost its relevance.</li>
<li>• But, while analysing other factors, we should be cautious of the fact that a generalised cause will not do justice to all the regions.
<ul>
<li>◦ E.g. The theory of flooding is not relevant for the sites like Sutkagendor and Sutkakoh — which are situated in the desert area.</li>
<li>◦ Likewise, the theory of desertification can't be applied to sites like Alamgirpur in the Gangetic basin.</li>
</ul>
</li>
<li>• So we can conclude that, for the decline of Harappan sites, a single factor was not accountable. Rather, different factors might have been responsible for the decline of the different sites.</li>
<li>• When we observe the nature of decline and the time span of decline, we notice that these were different for the different sites.
<ul>
<li>◦ E.g. Mohenjodaro declined in 2100 BCE but Kalibangan and Banawali continued upto 1800 BCE.</li>
<li>◦ Likewise, the signs of stagnancy and exhaustion appeared at Mohenjodaro before its final demise but Banawali and Kalibangan disappeared young.</li>
</ul>
</li>
<li>• So, while discussing the nature of decline, we should also keep these facts in our mind.</li>
</ul>

<h3>Evaluation of the Term 'Decline' of the Harappan Civilisation</h3>

<ul>
<li>• Earlier the term 'Decline' was understood as the end of the civilisation.</li>
<li>• But from the 1960s onward, it is believed that the civilisation didn't end but it continued in an altered form after its decline.
<ul>
<li>◦ So, now the term 'decline' means the decline of the urban phase only.</li>
<li>◦ The civilisation continued in its post urban phase.</li>
<li>◦ It came to be known as the Late Harappan culture.</li>
</ul>
</li>
</ul>

<h2>Later Harappan Cultures (1900 BCE to 1300 BCE)</h2>

<ul>
<li>• They are supposed to have continued between 1900 BCE to 1300 BCE.</li>
<li>• During this period, the elements of late Harappan cultures were visible in the regions of Sindh, Western Punjab-Bahawalpur, Eastern Punjab and Haryana, Kutch-Saurashtra and Ganga-Yamuna Doab.</li>
<li>• Certain late Harappan cultures include the Jhukar Culture (Sindh), 'Cemetery H' culture (Western Punjab-Ghaggar Hakra valley), Gandhara Grave Culture, Red Lustrous Ware culture (Gujarat) etc.</li>
</ul>

<h3>Features of Late Harappan Culture</h3>

<ul>
<li>• It represents the phase of decline of Harappan civilisation and its transformation from urban to rural culture.</li>
<li>• Town planning was discarded.</li>
<li>• The use of standardised implements, weights and measure, seals, potteries etc. lost their relevance.</li>
<li>• The number of settlements declined in its core region i.e. the triangle of Harappa-Mohenjodaro-Bahawalpur. But on the other hand, the number of sites increased sharply in the Eastern and Southern regions.</li>
</ul>

<h3>Significance of Late Harappan Culture</h3>

<ul>
<li>• Although, the Harappan people were growing both kinds of crops i.e. Rabi and Kharif; but they sowed both kinds of crops in the Rabi season only and in the same field.
<ul>
<li>◦ It is only in the late Harappan period that the concept of two cropping seasons developed properly.</li>
<li>◦ It needed more land for cultivation as the crops had to be sown in different fields alternatively and for the intervening period they had to leave the land fallow for regaining fertility.</li>
<li>◦ It was due to this factor that the Harappan people made an eastward expansion in search of better climate and more cultivable land.</li>
<li>◦ At Pirak (Balochistan), wheat and barley were sown as the Rabi crop and rice, millet, sorghum were grown in the summer.</li>
</ul>
</li>
<li>• Late Harappan people worked as an intermediary between the Harappan and the historical phase.
<ul>
<li>◦ In fact, the late Harappan people carried some Harappan technology like copper and bronze making, potter's wheel etc. and made these technologies available to the next generation.</li>
</ul>
</li>
<li>• Late Harappan people developed prosperous rural settlements and preserved the rural life. In course of time it merged with the common Indian life.</li>
<li>• Late Harappan people preserved the religious ideas and cults of the Harappan civilisation like the cult of mother goddess, Pashupati (Shiva), fire altar, serpent cult etc. Later, all these elements merged into the religious life of Indian society. In this way, they prepared the way for the rise of Hinduism in future.</li>
</ul>

<h2>Scenario in the Indian Sub-Continent After the Decline of Harappan Civilisation (1900 BCE to 500 BCE)</h2>

<ul>
<li>• Harappan civilization declined c. 1900 BCE.
<ul>
<li>◦ After the decline of the urban phase, the Harappan civilisation continued in the post-urban phase in the form of Late Harappan cultures.</li>
<li>◦ Late Harappan cultures were chalcolithic in nature (not Bronze Age like Harappan).</li>
</ul>
</li>
<li>• Separate Chalcolithic cultures were spread throughout India during the period between 1900 BCE (after the decline of Harappan civilisation) and 1100 BCE (when use of iron started in the Indian subcontinent).</li>
<li>• So the question arises, what is the difference between late Harappan cultures and other Indian cultures of the time; as both were chalcolithic, and why we segregate few sites as late Harappan cultural sites.
<ul>
<li>◦ Those chalcolithic sites which carried the legacy of the Harappan civilisation are termed as the late Harappan cultural sites, others are categorised simply as the chalcolithic cultural sites.</li>
</ul>
</li>
</ul>

<p><strong>Distribution</strong> — The chalcolithic sites were scattered all over India. E.g. in the Gangetic basin — Senuar, Taradih, Chirand, Sonpur etc. In Bengal — Pandu Rajar Dhibi and Mahisdal. In North East — Sarutaru, Daojali Hading etc. In south India — Utnur (A.P), Paiyampalli (TN), Bramhagiri, Maski, Hallur, T. Narsipur (Karnataka) etc.</p>

<ul>
<li>• These Neolithic sites directly developed into the chalcolithic sites.
<ul>
<li>◦ If it is difficult to separate the Neolithic phase and the beginning of the use of the copper at a particular site then it is known as the Neolithic-Chalcolithic sites, unlike the Harappan sites which developed from the Neolithic (rural) to the copper-bronze phase (urban) and then back to chalcolithic (rural) phase.</li>
</ul>
</li>
</ul>

<p>Whenever we observe the chalcolithic cultures between 1900 BCE and 1100 BCE in different parts of Indian sub-continent we find the following:</p>

<ul>
<li>• Around 2400 BCE 'Ahar culture or Banas culture' developed in Rajasthan by the side of the river Banas. For some time it was contemporary to the Harappan civilisation as well. It continued upto 1400 BCE.</li>
<li>• Next is the 'Malwa culture' (1700 BCE to 1200 BCE). This culture flourished in Malwa and nearby regions. Some of the chalcolithic sites in Maharashtra have occupational layers belonging to the Malwa culture.</li>
<li>• Then, the 'Jorwe culture' appeared in Maharashtra region between 1400 BCE to 700 BCE.</li>
</ul>

<h3>Some Regional Cultures in the Gangetic Basin</h3>

<ul>
<li>• Ochre Coloured Pottery culture (2000 BCE to 1500 BCE) — Nearly 110 sites have come to light in the upper Gangetic basin and nearby region which belong to this culture. It is associated with the Late Harappan phase (copper phase).</li>
<li>• Painted Grey Ware culture (1500 BCE to 500 BCE) — It emerged after the decline of OCP culture. This culture is associated with both, the pre-iron phase (1500 BCE–1000 BCE) and iron phase (1000 BCE–500 BCE). Nearly 750 sites of PGW culture have come to the light. It corresponded to the Vedic period of literature.</li>
<li>• Northern Black Polished Ware culture — It is a relatively more developed culture which appeared around 800 BCE. It is associated with the iron phase, burnt bricks and 2nd Urbanisation. This culture was spread over a vast region i.e. from Taxila in north-west to Tamluk in West Bengal and Amravati in South India. This culture is also associated with the Buddha age.</li>
</ul>

<h3>Occupation</h3>

<ul>
<li>• The Chalcolithic people were leading a sedentary life.</li>
<li>• They were involved in agriculture and animal rearing.</li>
<li>• We don't have any evidence of the use of plough from any chalcolithic site but still the people were producing more grains than their requirement.
<ul>
<li>◦ E.g. We have found evidence of a granary from a Chalcolithic site at Inamgaon in Maharashtra.</li>
</ul>
</li>
<li>• They were involved in the craft production as well and produced several varieties of pottery. These potteries were used for cooking food as well as storing grains.
<ul>
<li>◦ Also, from Malwa culture occupational level at Inamgaon, we find some evidence of spinning as well.</li>
</ul>
</li>
<li>• Possibly, they were also involved in trade and commerce e.g. from certain sites we find objects which were not locally available.</li>
</ul>

<h3>Society</h3>

<ul>
<li>• Some sort of social division is visible. We can infer it on the basis of the burial system.
<ul>
<li>◦ Normally, the Chalcolithic people used to bury the dead either in the courtyard or under the floor of the room. The dead bodies of kids were placed in an urn or pottery. Also, they buried some essential goods with the body for use in the afterlife.</li>
</ul>
</li>
<li>• On the basis of these grave goods, we can underline social differentiation.</li>
<li>• Apart from that, at the site of Inamgaon, we find a different type of settlement.
<ul>
<li>◦ The artisans were settled in the western region while the house of the chief was in the centre. This also indicates some sort of social differentiation.</li>
</ul>
</li>
</ul>
"""

new_content = re.sub(
    r"('indus-valley-civilization': `)([^`]*?)(`)",
    lambda m: m.group(1) + html + m.group(3),
    content,
    flags=re.DOTALL
)

if new_content == content:
    print("ERROR: Pattern not found - no change made")
else:
    with open("lib/noteContent.ts", "w") as f:
        f.write(new_content)
    print("Done!")
