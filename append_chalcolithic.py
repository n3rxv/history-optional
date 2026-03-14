import re

SLUG = 'prehistory-protohistory'

NEW_HTML = """
<h2>Chalcolithic Age</h2>

<p>By the end of the Neolithic period, a full-fledged civilization had developed in the Indus and Saraswati valleys in the northern part of India.</p>
<p>A completely different kind of culture known as the Chalcolithic Culture had emerged in central India and the Deccan region.</p>
<ul class="sub-list">
<li>&#9702; They were contemporary of the Harappan culture, but some others were of later Harappan age.</li>
<li>&#9702; In spite of using metal, they however, never reached the same level of development.</li>
</ul>

<h3>Chalcolithic Cultures</h3>
<ul>
<li>&#8226; Chalcolithic cultures flourished in <strong>semi-arid regions of Rajasthan, MP, Gujarat, and Maharashtra.</strong></li>
</ul>
<ul class="sub-list">
<li>&#9702; Ahar culture c. 2800-1400 B.C.</li>
<li>&#9702; Kayatha culture c. 2250-1900 B.C.</li>
<li>&#9702; Malwa culture c. 1700-1400 B.C.</li>
<li>&#9702; Savalda culture c. 2000-1800 B.C.</li>
<li>&#9702; Jorwe culture c. 1400-700 B.C.</li>
<li>&#9702; Prabhas culture c. 2000-1400 B.C.</li>
<li>&#9702; Rangpur culture c. 1700-1400 B.C.</li>
<li>&#9702; Chirand Culture c. 1700-750 B.C.</li>
</ul>

<h3>Kayatha Culture</h3>
<ul>
<li>&#8226; Located on the <strong>Chambal River and its tributaries.</strong></li>
</ul>
<ul class="sub-list">
<li>&#9702; They were only a <strong>few</strong> in number and <strong>relatively small</strong> in size and the biggest may not be over two hectares.</li>
</ul>

<h3>Ahar Culture</h3>
<ul>
<li>&#8226; The settlements of Ahar Culture were <strong>larger in comparison to Kayatha culture.</strong></li>
</ul>
<ul class="sub-list">
<li>&#9702; Excavations revealed that they used <strong>stone, mud bricks, and mud</strong> for the construction of houses and other structures.</li>
</ul>
<ul>
<li>&#8226; <strong>Balathal</strong> was a <strong>fortified</strong> settlement.</li>
</ul>

<h3>Malwa Culture</h3>
<ul>
<li>&#8226; Located on the <strong>Narmada</strong> and its tributaries.</li>
<li>&#8226; Its best known settlements are at <strong>Navdatoli, Eran, and Nagada.</strong></li>
<li>&#8226; <strong>Navdatoli was one of the largest</strong> Chalcolithic settlements in the country.</li>
</ul>
<ul class="sub-list">
<li>&#9702; It was spread in almost 10 hectares.</li>
</ul>
<ul>
<li>&#8226; Some of these sites were <strong>fortified.</strong></li>
</ul>
<ul class="sub-list">
<li>&#9702; <strong>Eran</strong> had a fortification wall with a moat.</li>
<li>&#9702; <strong>Nagada</strong> had a bastion of mud-bricks.</li>
</ul>

<h3>Savalda Culture</h3>
<ul>
<li>&#8226; The type site of Savalda culture is Savalda (Dhule district, Maharashtra).</li>
<li>&#8226; It is mostly confined to the <strong>Tapi</strong> valley but the evidence from Daimabad suggests that it reached up to the Pravara valley.</li>
</ul>

<h3>Prabhas Culture</h3>
<ul>
<li>&#8226; <strong>Very few</strong>, not more than half a dozen settlements of Prabhas culture are known.</li>
</ul>

<h3>Rangpur Culture</h3>
<ul>
<li>&#8226; The settlements of Rangpur culture are located mostly on <strong>Ghelo and Kalubhar</strong> rivers in Gujarat.</li>
</ul>

<h3>Jorwe Culture</h3>
<ul>
<li>&#8226; <strong>More than 200 settlements</strong> of Jorwe culture are known.</li>
</ul>
<ul class="sub-list">
<li>&#9702; Greater number of these settlements are found in Maharashtra.</li>
</ul>
<ul>
<li>&#8226; The best known settlements of Jorwe culture are <strong>Prakash, Daimabad, and Inamgaon.</strong></li>
</ul>
<ul class="sub-list">
<li>&#9702; <strong>Daimabad</strong> was the <strong>largest</strong> one measuring almost 20 hectares.</li>
</ul>

<h3>Chirand Culture</h3>
<ul>
<li>&#8226; Stone and Copper using agricultural communities have been reported from eastern India too.</li>
<li>&#8226; In northern <strong>Bihar</strong> at a place called <strong>Chirand</strong> remains of an ancient village settlement have been found.</li>
</ul>
<ul class="sub-list">
<li>&#9702; People lived in small houses made of bamboo and mud plaster.</li>
<li>&#9702; They ate rice and fish and hunted many wild animals.</li>
<li>&#9702; They used <strong>black and red ware pottery.</strong></li>
</ul>
<ul>
<li>&#8226; Similar kinds of settlements have been reported from <strong>Sohagaura</strong> in Gorakhpur (U.P.) and <strong>Sonpur</strong> in Gaya (Bihar) where people seem to have grown wheat and barley also.</li>
<li>&#8226; In West Bengal the sites of <strong>Pandu-Rajar-Dhibi</strong> and <strong>Mahisdal</strong> in the Burdman district have yielded similar evidence.</li>
<li>&#8226; All these settlements have been dated between 1500 to 750 B.C.</li>
</ul>

<h2>Chalcolithic Economy</h2>

<h3>Agriculture</h3>
<ul>
<li>&#8226; The economy was largely based on <strong>subsistence agriculture, stock-raising, hunting, and fishing.</strong></li>
</ul>
<ul class="sub-list">
<li>&#9702; A greater part of the region in which these chalcolithic cultures flourished is the zone of <strong>black cotton soil.</strong></li>
<li>&#9702; The climate is <strong>semi-arid.</strong></li>
</ul>
<ul>
<li>&#8226; The main crops were barley, wheat, rice, bajra, jowar, lentil, horse gram, hyacinth bean, grass pea, pea, black gram and green gram.</li>
</ul>
<ul class="sub-list">
<li>&#9702; <strong>Barley</strong> was the <strong>principal cereal</strong> during this period.</li>
</ul>
<ul>
<li>&#8226; Evidence from Inamgaon suggests the practice of <strong>crop rotation</strong>, harvesting of <strong>summer and winter crops</strong>, and <strong>artificial irrigation.</strong></li>
</ul>
<ul class="sub-list">
<li>&#9702; A massive embankment was built at Inamgaon to divert the flood water through a channel.</li>
</ul>
<ul>
<li>&#8226; <strong>Black cotton soil was ploughed</strong> for farming operations as suggested by the discovery of a Prototype of the ploughshare made from the shoulder bone of cattle at Walki (not very far from Inamgaon).</li>
</ul>
<ul class="sub-list">
<li>&#9702; Chalcolithic agriculture <strong>reflects ecological adaptation</strong> by the people in developing a system of <strong>dry farming, dependent on moisture retentive soils</strong> based upon then available technology, knowledge, and means.</li>
</ul>

<h3>Animals</h3>
<p>The excavations have revealed evidence of <strong>both domesticated as well as wild animals.</strong></p>
<p><strong>Domesticated Animals:</strong></p>
<ul>
<li>&#8226; Cattle, sheep, goat, dog, pig, horse.</li>
</ul>
<ul class="sub-list">
<li>&#9702; The bones of cattle and sheep/goat predominate at most of the sites.</li>
</ul>
<ul>
<li>&#8226; Cut and chop marks on the bones of these animals indicate that they were slaughtered for food.</li>
</ul>
<ul class="sub-list">
<li>&#9702; Host of the animals were slaughtered when they were young.</li>
</ul>
<p><strong>Wild Animals:</strong></p>
<ul>
<li>&#8226; Black buck, four horned antelope, niligai, barasingha, sambar, chital, wild buffalo, and one horned rhinoceros.</li>
<li>&#8226; Bones of fish, waterfowl, turtle and rodents have also been found at some of the sites.</li>
<li>&#8226; Bones of <strong>marine fish</strong> species have been found at Inamgaon and the source of these fish could be either Kalyan or Mahad, the nearest creek ports.</li>
<li>&#8226; The <strong>charred bones of both the domestic and wild species indicate that they were cooked in open fire.</strong></li>
</ul>

<h3>Technology</h3>
<ul>
<li>&#8226; The Chalcolithic people were <strong>farmers.</strong> They had made considerable progress in <strong>ceramics</strong> as well as <strong>metal</strong> technology.</li>
</ul>
<ul class="sub-list">
<li>&#9702; They used painted pottery, which was well made and well fired in a kiln.</li>
<li>&#9702; It was fired at a temperature between 500 - 700° C.</li>
</ul>
<ul>
<li>&#8226; <strong>Metal tools</strong> were mostly made up of <strong>copper obtained from the Khetri mines</strong> of Rajasthan. Some of the commonly used tools were axes, chisels, bangles, beads, hooks, etc.</li>
<li>&#8226; <strong>Crucibles and pairs of tongs of copper found at Inamgaon</strong> illustrate the working of goldsmiths.</li>
<li>&#8226; <strong>Chalcedony drills</strong> were used for perforating beads of semi precious stones.</li>
<li>&#8226; <strong>Lime was prepared out of Kankar</strong> that was used for painting houses and lining the storage bins and various other purposes.</li>
</ul>

<h3>Tools</h3>
<p>All these cultures are characterized by a <strong>stone blade/flake industry based on siliceous stones such as chalcedony, chert, jasper and agate.</strong></p>
<ul>
<li>&#8226; The tools include long parallel sided blades, blunted back blades, serrated blades, pen knives, lutes, triangles and trapezes.</li>
<li>&#8226; Some of these blade tools have a shine on the sharp edge suggesting that they were used for <strong>harvesting.</strong></li>
<li>&#8226; <strong>Polished stone axes,</strong> which are typical of the Neolithic-Chalcolithic cultures of Karnataka-Andhra, have also been found at some of these sites.</li>
</ul>
<p>Copper objects consist of flat axes or celts with convex cutting edges, arrowheads, spearheads, chisels, fish hooks, mid-ribbed swords, blades, bangles, rings and beads.</p>
<ul>
<li>&#8226; <strong>At Kayatha, one pot contained 28 copper bangles.</strong></li>
</ul>

<h3>Ornaments</h3>
<ul>
<li>&#8226; <strong>Beads</strong> made of carnelian, jasper, chalcedony, agate, shell, etc.</li>
<li>&#8226; A <strong>necklace made of 40,000 microbeads of steatite</strong> has been found in a pot belonging to the <strong>Kayatha</strong> culture.</li>
<li>&#8226; At <strong>Inamgaon</strong> beads of gold and ivory, a spiral ear ring of gold and anklets of copper were found.</li>
</ul>

<h3>Terracotta Objects</h3>
<p>These are in the form of <strong>human and animal figurines.</strong></p>
<p>The <strong>stylized terracotta bulls at Kayatha.</strong></p>
<ul>
<li>&#8226; Considering the occurrence of numerous terracotta bull figurines at several of Chalcolithic sites it can be suggested that bull was a <strong>sacred animal,</strong> or may be they were just toys.</li>
</ul>
<p><strong>Daimabad Hoard:</strong></p>
<ul>
<li>&#8226; A hoard of four bronze objects:</li>
</ul>
<ul class="sub-list">
<li>&#9702; Two Wheeled Chariot with a Rider</li>
<li>&#9702; a water buffalo,</li>
<li>&#9702; an elephant,</li>
<li>&#9702; a rhinoceros</li>
</ul>

<h2>Chalcolithic Pottery</h2>
<p><strong>Painted pottery</strong> is the most distinguishing feature of all Chalcolithic cultures. Each of these cultures had distinct forms of pottery.</p>
<p><strong>Kayatha</strong> culture:</p>
<ul>
<li>&#8226; A <strong>sturdy red-slipped ware</strong> painted with designs in chocolate colour, a <strong>red painted buff ware,</strong> and a <strong>combed ware</strong> bearing incised patterns.</li>
</ul>
<p><strong>Ahar</strong> culture:</p>
<ul>
<li>&#8226; Unique <strong>black-and-red ware decorated with the white designs.</strong></li>
</ul>
<p><strong>Prabhas and Rangpur</strong> cultures:</p>
<ul>
<li>&#8226; <strong>Derived from Harappan culture and are called Lustrous Red Ware</strong> because of their glossy surface.</li>
</ul>
<p><strong>Malwa</strong> culture:</p>
<ul>
<li>&#8226; <strong>Slightly coarse in fabric, but has a thick buff surface</strong> over which designs were made either in red or black.</li>
</ul>
<p><strong>Jorwe</strong> culture:</p>
<ul>
<li>&#8226; <strong>Painted black-on-red and has a matte surface</strong> treated with a wash.</li>
<li>&#8226; Well-known pottery forms used in this culture are:</li>
</ul>
<ul class="sub-list">
<li>&#9702; Dishes-on-stand,</li>
<li>&#9702; Spouted vases,</li>
<li>&#9702; Stemmed cups,</li>
<li>&#9702; Pedestalled bowls,</li>
<li>&#9702; Big storage jars, and</li>
<li>&#9702; Spouted basins and bowls.</li>
</ul>

<h2>Trade and Commerce</h2>
<ul>
<li>&#8226; The Chalcolithic communities traded and exchanged materials with other contemporary communities.</li>
<li>&#8226; A large settlement serves as the major center of trade and exchange.</li>
</ul>
<ul class="sub-list">
<li>&#9702; Some of them were Ahar, Gilund, Nagada, Navdatoli, Eran, Prabhas, Rangpur, Prakash, Daimabad, and Inamgaon.</li>
</ul>
<ul>
<li>&#8226; The <strong>Ahar</strong> people settled close to the <strong>copper source</strong> and were used to supply copper tools and objects to other contemporary communities in Malwa and Gujarat.</li>
</ul>
<ul class="sub-list">
<li>&#9702; Identical marks embedded on most of the copper axes found in Malwa, Jorwe, and Prabhas cultures that might indicate that it may be the trademarks of the smiths who made them.</li>
</ul>
<ul>
<li>&#8226; It is found that <strong>Conch shell for bangles was traded from the Saurashtra coast</strong> to other regions.</li>
<li>&#8226; <strong>Gold and ivory come to Jorwe people from Tekkalkotta</strong> in Karnataka and <strong>semiprecious stones</strong> may have been traded to various parts <strong>from Rajpipla in Gujarat.</strong></li>
<li>&#8226; <strong>Inamgaon pottery</strong> has been found at several sites located far away. This shows that the Jorwe people used to trade even the pottery to distant places.</li>
<li>&#8226; <strong>Wheeled bullock carts</strong> were used for long distance trade, besides the river transport. The drawings of wheeled bullock carts have been found on pots.</li>
</ul>

<h2>Houses and Habitations</h2>
<p><strong>Rectangular and circular houses</strong> with <strong>mud walls and thatched roofs</strong> are the most common types, though there are <strong>variations in house size</strong> from site to site.</p>
<ul>
<li>&#8226; <strong>Ahar</strong> people built houses on <strong>plinths made of schist.</strong></li>
</ul>
<ul class="sub-list">
<li>&#9702; <strong>Walls</strong> were built on these plinths with <strong>mud or mud brick</strong> and the walls were <strong>decorated with quartz cobbles.</strong></li>
<li>&#9702; <strong>Floors</strong> were made of <strong>burnt clay or clay mixed with river gravels.</strong></li>
<li>&#9702; <strong>Bigger houses had partition walls, and chulhas</strong> (hearths) and <strong>quartzite saddle querns</strong> in the kitchen.</li>
</ul>
<ul>
<li>&#8226; <strong>Malwa settlements</strong> such as those found at Navdatoli, Parkash, Daimabad and Inamgaon were <strong>quite large.</strong></li>
</ul>
<ul class="sub-list">
<li>&#9702; Evidence at <strong>Inamgaon</strong> suggests that some kind of <strong>planning</strong> was adopted in the laying out of the settlement.</li>
<li>&#9702; These houses at Inamgaon were large (7m X 5m) rectangular structures with a partition wall.</li>
<li>&#9702; The houses at <strong>Navdatoli</strong> were provided with one or two mouthed chulhas in the kitchen.</li>
</ul>
<ul>
<li>&#8226; A significant feature of the <strong>Jorwe culture</strong> is the presence of a <strong>large centre in each region.</strong></li>
</ul>
<ul class="sub-list">
<li>&#9702; These centres are Prakash, Daimabad and Inamgaon, respectively in the valleys of Tapi, Godavari and Bhima.</li>
<li>&#9702; The <strong>Jorwe settlement at Daimabad was the largest</strong> (30 hectares). Prakash and Inamgaon cover about 5 Ha each.</li>
<li>&#9702; A noteworthy feature of the Jorwe settlement at <strong>Inamgaon</strong> is that the houses of the artisans were located on the <strong>western periphery,</strong> whereas those of <strong>well-to-do farmers</strong> were in the <strong>central part</strong> — demonstrating <strong>social differentiation.</strong></li>
</ul>
<ul>
<li>&#8226; At Inamgaon a change has been noticed in house types from <strong>Early Jorwe (1400–1000 B.C.)</strong> to <strong>Late Jorwe period (1000–700 B.C.):</strong></li>
</ul>
<ul class="sub-list">
<li>&#9702; The Early Jorwe houses were large rectangular structures with low mud walls laid in rows.</li>
<li>&#9702; The Late Jorwe houses depict a picture of poverty — small round huts in clusters of three or four, pit silos replaced by a four legged storage jar.</li>
</ul>
<ul>
<li>&#8226; The overall evidence indicates that this shift was due to <strong>decline in agriculture as a result of drop in rainfall.</strong></li>
</ul>
<ul class="sub-list">
<li>&#9702; At the close of the second millennium B.C. there was a <strong>drastic climatic change</strong> in western and central India that led to increasing aridity forcing the people to resort to a <strong>semi-nomadic existence.</strong></li>
<li>&#9702; It seems that increasing aridity during the Late Jorwe period led to the <strong>decline of agriculture,</strong> and the economy based on farming changed over to <strong>sheep/goat pastoralism.</strong></li>
</ul>
<ul>
<li>&#8226; <strong>Eran</strong> and <strong>Nagda</strong> of the Malwa Culture, and <strong>Inamgaon</strong> have a fortified mud wall with a ditch around the habitation.</li>
</ul>

<h2>Religious Beliefs</h2>
<ul>
<li>&#8226; Religion was an important aspect that interlinked all centres of Chalcolithic cultures.</li>
<li>&#8226; The people of Chalcolithic cultures worshipped the <strong>mother goddess and the bull.</strong></li>
</ul>
<ul class="sub-list">
<li>&#9702; In Malwa, the bull cult seems to have been predominant.</li>
</ul>
<ul>
<li>&#8226; The <strong>Mother Goddess</strong> is depicted on a <strong>huge storage jar of Malwa culture</strong> in an applique design.</li>
</ul>
<ul class="sub-list">
<li>&#9702; She is surrounded by a woman on the right and a crocodile on the left, by the side of which is represented a shrine.</li>
</ul>
<ul>
<li>&#8226; In a painted design on a pot, a <strong>deity is shown with dishevelled hair, resembling the Rudra of the later period.</strong></li>
<li>&#8226; A painting on a jar found from Daimabad portrayed a <strong>deity surrounded by animals and birds</strong> such as tigers and peacocks.</li>
</ul>
<ul class="sub-list">
<li>&#9702; It is similar to the Siva Pashupati that was found depicted on a seal from Mohenjo Daro.</li>
</ul>
<ul>
<li>&#8226; A large number of both the <strong>naturalistic as well as stylized lingas</strong> have been found from most of the sites.</li>
<li>&#8226; <strong>Two figurines belonging to late Jorwe culture</strong> found from Inamgaon have been identified as <strong>proto-Ganesh,</strong> which was worshipped for success before embarking on an undertaking.</li>
<li>&#8226; A <strong>large number of Fire-altars</strong> have been found from the Chalcolithic sites showing that Fire worship was a very widespread phenomenon among the people.</li>
<li>&#8226; The people of Chalcolithic had a <strong>belief in life after death,</strong> which is indicated by the existence of <strong>pots and other funerary objects</strong> found with the burials of the Malwa and Jorwe people.</li>
</ul>

<h2>Burial Practices</h2>
<ul>
<li>&#8226; Disposal of the dead by burial was a common custom.</li>
<li>&#8226; Adults as well as children were usually buried in a <strong>north-south orientation;</strong> the head towards the north and the legs towards the south.</li>
<li>&#8226; <strong>Adults</strong> were, in a majority of cases, buried in an <strong>extended position,</strong> whereas <strong>children</strong> were buried in <strong>urn-burials</strong> — either in single pots or in two pots.</li>
<li>&#8226; Adults, and also children, were buried in a <strong>pit</strong> which was dug into the house floor, and rarely in the <strong>courtyard</strong> of the house.</li>
<li>&#8226; During the Jorwe period, in the case of adults, the portion below the ankle was purposely <strong>chopped off.</strong></li>
</ul>

<h2>Administrative Organisation</h2>
<p>In the chalcolithic culture regions, a study of the distribution pattern of the sites suggests that these sites were of two types:</p>
<ul>
<li>&#8226; One type representing <strong>regional centres</strong> and</li>
<li>&#8226; The other type representing <strong>village settlements.</strong></li>
</ul>
<p>This difference, or hierarchy, has been taken to suggest that <strong>some form of administrative organisation</strong> was present in the chalcolithic cultures.</p>
<p>The presence of an administrative authority is further supported by existence of <strong>public structures such as fortifications, rampart and moat, granaries, the embankment and canals</strong> (well documented at Inamgaon) etc. found at different sites.</p>

<h2>Conclusion</h2>
<ul>
<li>&#8226; Seen in the larger context of the post-Harappan developments, these chalcolithic cultures betray discernible influences of the Harappan culture, though in a residual form.</li>
</ul>
<ul class="sub-list">
<li>&#9702; All the same, they are marked by <strong>strong regional elements,</strong> and also display <strong>trade links and cultural contacts</strong> between each other.</li>
</ul>
<ul>
<li>&#8226; These metal-using farming communities which flourished in the second millennium B.C. disappeared around the first millennium B.C. (excepting Late Jorwe which continued till 700 B.C.).</li>
</ul>
<ul class="sub-list">
<li>&#9702; One possible reason attributed for such a decay was <strong>increasing aridity and unfavourable climatic conditions.</strong></li>
<li>&#9702; Many of these settlements in the Godavari, Tapi and other valleys were deserted, and were reoccupied after a gap of six or five centuries in fifth-fourth centuries B.C., heralded by urbanisation.</li>
</ul>

<h2>PYQ: Chalcolithic Pottery as a Source of History</h2>
<p><strong>Q. How can pottery be used as a source of human history during the Chalcolithic period?</strong></p>
<p>A <strong>distinctive feature</strong> of these cultures is their <strong>painted pottery</strong> which is mostly black-on-red.</p>
<ul>
<li>&#8226; Since the Chalcolithic cultures were part of the proto-historic age when literary traditions were not known, the only available sources are archaeological and Pottery forms an important component of it.</li>
<li>&#8226; Pottery manufacturing was an <strong>important craft</strong> and one of the characteristic features of the Chalcolithic period is a well-developed ceramic industry, including fine-painted, plain and coarse pottery for a variety of purposes.</li>
</ul>
<p><strong>In the following ways, Chalcolithic pottery can be used as a source of history:</strong></p>
<ul>
<li>&#8226; <strong>Technological advancement in the fields of pottery manufacturing</strong> — The Chalcolithic pottery is both wheel-made and well fired.</li>
</ul>
<ul class="sub-list">
<li>&#9702; It also shows the use of inverted firing technique in pottery which was black from inside and red from outside.</li>
<li>&#9702; There is also handmade pottery.</li>
</ul>
<ul>
<li>&#8226; <strong>Use of different colours</strong> — The pottery has geometrical designs and motifs of various colours which shows their aesthetic sense, knowledge of natural rocks like haematite and how to make colour out of them.</li>
<li>&#8226; <strong>Variety of Pottery</strong> — Different types of pottery of varying sizes and designs have been found like <strong>Dishes-on-stand, spouted vases, spouted cups, pedestalled bowls, big storage jars and spouted basins and bowls</strong> which provide information about their lifestyle.</li>
</ul>
<ul class="sub-list">
<li>&#9702; For example — Big storage jars indicate they might be used for storing food grains which point towards agricultural surplus.</li>
<li>&#9702; Perforated jars might have been used for making wines.</li>
<li>&#9702; Jars with a narrow neck might have been used for storing water.</li>
</ul>
<ul>
<li>&#8226; <strong>Pottery associated with burial</strong> — Grave goods in pots have been found at a number of burial sites which indicate a belief in next birth as well as the beginning of social inequalities.</li>
<li>&#8226; <strong>Influence of Harappan civilization</strong> — Prabhas and Rangpur pottery clearly shows the influence of Harappan pottery which is reflected in their glossy surface.</li>
<li>&#8226; <strong>Trade in Pottery</strong> — Inamgaon pottery has been found at several sites located far away. This shows that the Jorwe people used to trade even the pottery to distant places.</li>
<li>&#8226; <strong>Paintings were drawn on Pottery:</strong></li>
</ul>
<ul class="sub-list">
<li>&#9702; Paintings of Sun and mother goddess may reflect their <strong>religious belief.</strong></li>
<li>&#9702; Paintings of birds like peacocks and animals like bulls, antelopes, etc. along with bows, arrows provide evidence of <strong>hunting</strong> and painting of fish indicate the prevalence of <strong>fishery</strong> for subsistence.</li>
<li>&#9702; Paintings of cattle along with dogs may be associated with their <strong>domestication.</strong></li>
<li>&#9702; Paintings of the <strong>boat</strong> may reflect its use as a mode of transport or use for long-distance trade.</li>
<li>&#9702; Various geometrical designs like triangles, dots, and circles, diamonds, hooks, stylized 'S' motifs, along with wavy lines, straight lines, broad thick bands as borders shows the <strong>advanced aesthetic sense</strong> of the Chalcolithic people.</li>
</ul>
<p>However, there are also limitations of using Chalcolithic Pottery as a source:</p>
<ul>
<li>&#8226; Chalcolithic Pottery <strong>only reflects the material culture</strong> and that too in parts rather than presenting the whole picture.</li>
<li>&#8226; Further, the various <strong>uses</strong> of pottery as suggested above are one of the several <strong>interpretations and need to be corroborated</strong> with other sources.</li>
<li>&#8226; The interpretations of paintings on pottery like <strong>Sun motifs, mother goddess etc may be speculations</strong> rather than the actual beliefs of the Chalcolithic people.</li>
</ul>
"""

with open('lib/noteContent.ts', 'r') as f:
    content = f.read()

pattern = rf"('{re.escape(SLUG)}':\s*`)([^`]*)(`)"

def appender(m):
    existing = m.group(2)
    return f"'{SLUG}': `{existing}{NEW_HTML}`"

new_content = re.sub(pattern, appender, content, flags=re.DOTALL)

with open('lib/noteContent.ts', 'w') as f:
    f.write(new_content)

print(f"Done! Appended Chalcolithic Age to: {SLUG}")
