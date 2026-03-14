import re

SLUG = 'prehistory-protohistory'

# This is the correct Chalcolithic HTML to append — exact PDF hierarchy:
# ● → <li>&#8226; ...
# ○ → <li style="padding-left:2em">&#9702; ...
# ■ → <li style="padding-left:4em">&#9632; ...

CHALCOLITHIC_HTML = """
<h2>Chalcolithic Age</h2>

<p>By the end of the Neolithic period, a full-fledged civilization had developed in the Indus and Saraswati valleys in the northern part of India.</p>
<p>A completely different kind of culture known as the Chalcolithic Culture had emerged in central India and the Deccan region.</p>
<ul>
<li style="padding-left:2em">&#9702; They were contemporary of the Harappan culture, but some others were of later Harappan age.</li>
<li style="padding-left:2em">&#9702; In spite of using metal, they however, never reached the same level of development.</li>
</ul>

<h3>Chalcolithic Cultures</h3>
<ul>
<li>&#8226; Chalcolithic cultures flourished in semi-arid regions of <strong>Rajasthan, MP, Gujarat, and Maharashtra.</strong>
<ul>
<li style="padding-left:2em">&#9702; Ahar culture c. 2800-1400 B.C.</li>
<li style="padding-left:2em">&#9702; Kayatha culture c. 2250-1900 B.C.</li>
<li style="padding-left:2em">&#9702; Malwa culture c. 1700-1400 B.C.</li>
<li style="padding-left:2em">&#9702; Savalda culture c. 2000-1800 B.C.</li>
<li style="padding-left:2em">&#9702; Jorwe culture c. 1400-700 B.C.</li>
<li style="padding-left:2em">&#9702; Prabhas culture c. 2000-1400 B.C.</li>
<li style="padding-left:2em">&#9702; Rangpur culture c. 1700-1400 B.C.</li>
<li style="padding-left:2em">&#9702; Chirand Culture c. 1700-750 B.C.</li>
</ul>
</li>
</ul>

<h3>Kayatha Culture</h3>
<ul>
<li>&#8226; Located on the <strong>Chambal River and its tributaries.</strong>
<ul>
<li style="padding-left:2em">&#9702; They were only a <strong>few</strong> in number and <strong>relatively small</strong> in size and the biggest may not be over two hectares.</li>
</ul>
</li>
</ul>

<h3>Ahar Culture</h3>
<ul>
<li>&#8226; The settlements of Ahar Culture were <strong>larger in comparison to Kayatha culture.</strong>
<ul>
<li style="padding-left:2em">&#9702; Excavations revealed that they used <strong>stone, mud bricks, and mud</strong> for the construction of houses and other structures.</li>
</ul>
</li>
<li>&#8226; <strong>Balathal</strong> was a <strong>fortified</strong> settlement.</li>
</ul>

<h3>Malwa Culture</h3>
<ul>
<li>&#8226; Located on the <strong>Narmada</strong> and its tributaries.</li>
<li>&#8226; Its best known settlements are at <strong>Navdatoli, Eran, and Nagada.</strong></li>
<li>&#8226; <strong>Navdatoli was one of the largest</strong> Chalcolithic settlements in the country.
<ul>
<li style="padding-left:2em">&#9702; It was spread in almost 10 hectares.</li>
</ul>
</li>
<li>&#8226; Some of these sites were <strong>fortified.</strong>
<ul>
<li style="padding-left:2em">&#9702; <strong>Eran</strong> had a fortification wall with a moat.</li>
<li style="padding-left:2em">&#9702; <strong>Nagada</strong> had a bastion of mud-bricks.</li>
</ul>
</li>
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
<li>&#8226; <strong>More than 200 settlements</strong> of Jorwe culture are known.
<ul>
<li style="padding-left:2em">&#9702; Greater number of these settlements are found in Maharashtra.</li>
</ul>
</li>
<li>&#8226; The best known settlements of Jorwe culture are <strong>Prakash, Daimabad, and Inamgaon.</strong>
<ul>
<li style="padding-left:2em">&#9702; <strong>Daimabad</strong> was the <strong>largest</strong> one measuring almost 20 hectares.</li>
</ul>
</li>
</ul>

<h3>Chirand Culture</h3>
<ul>
<li>&#8226; Stone and Copper using agricultural communities have been reported from eastern India too.</li>
<li>&#8226; In northern <strong>Bihar</strong> at a place called <strong>Chirand</strong> remains of an ancient village settlement have been found.
<ul>
<li style="padding-left:2em">&#9702; People lived in small houses made of bamboo and mud plaster.</li>
<li style="padding-left:2em">&#9702; They ate rice and fish and hunted many wild animals.</li>
<li style="padding-left:2em">&#9702; They used <strong>black and red ware pottery.</strong></li>
</ul>
</li>
<li>&#8226; Similar kinds of settlements have been reported from <strong>Sohagaura</strong> in Gorakhpur (U.P.) and <strong>Sonpur</strong> in Gaya (Bihar) where people seem to have grown wheat and barley also.</li>
<li>&#8226; In West Bengal the sites of <strong>Pandu-Rajar-Dhibi</strong> and <strong>Mahisdal</strong> in the Burdman district have yielded similar evidence.</li>
<li>&#8226; All these settlements have been dated between 1500 to 750 B.C.</li>
</ul>

<h2>Chalcolithic Economy</h2>

<h3>Agriculture</h3>
<ul>
<li>&#8226; The economy was largely based on <strong>subsistence agriculture, stock-raising, hunting, and fishing.</strong>
<ul>
<li style="padding-left:2em">&#9702; A greater part of the region in which these chalcolithic cultures flourished is the zone of <strong>black cotton soil.</strong></li>
<li style="padding-left:2em">&#9702; The climate is <strong>semi-arid.</strong></li>
</ul>
</li>
<li>&#8226; The main crops were barley, wheat, rice, bajra, jowar, lentil, horse gram, hyacinth bean, grass pea, pea, black gram and green gram.
<ul>
<li style="padding-left:2em">&#9702; <strong>Barley</strong> was the <strong>principal cereal</strong> during this period.</li>
</ul>
</li>
<li>&#8226; Evidence from Inamgaon suggests the practice of <strong>crop rotation,</strong> harvesting of <strong>summer and winter crops,</strong> and <strong>artificial irrigation.</strong>
<ul>
<li style="padding-left:2em">&#9702; A massive embankment was built at Inamgaon to divert the flood water through a channel.</li>
</ul>
</li>
<li>&#8226; <strong>Black cotton soil was ploughed</strong> for farming operations as suggested by the discovery of a Prototype of the ploughshare made from the shoulder bone of cattle at Walki (not very far from Inamgaon).
<ul>
<li style="padding-left:2em">&#9702; Chalcolithic agriculture <strong>reflects ecological adaptation</strong> by the people in developing a system of <strong>dry farming, dependent on moisture retentive soils</strong> based upon then available technology, knowledge, and means.</li>
</ul>
</li>
</ul>

<h3>Animals</h3>
<p>The excavations have revealed evidence of <strong>both domesticated as well as wild animals.</strong></p>
<p><strong>Domesticated Animals:</strong></p>
<ul>
<li>&#8226; Cattle, sheep, goat, dog, pig, horse.
<ul>
<li style="padding-left:2em">&#9702; The bones of cattle and sheep/goat predominate at most of the sites.</li>
</ul>
</li>
<li>&#8226; Cut and chop marks on the bones of these animals indicate that they were slaughtered for food.
<ul>
<li style="padding-left:2em">&#9702; Host of the animals were slaughtered when they were young.</li>
</ul>
</li>
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
<li>&#8226; The Chalcolithic people were <strong>farmers.</strong> They had made considerable progress in <strong>ceramics</strong> as well as <strong>metal</strong> technology.
<ul>
<li style="padding-left:2em">&#9702; They used painted pottery, which was well made and well fired in a kiln.</li>
<li style="padding-left:2em">&#9702; It was fired at a temperature between 500 - 700° C.</li>
</ul>
</li>
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
<p><strong>Copper objects</strong> consist of flat axes or celts with convex cutting edges, arrowheads, spearheads, chisels, fish hooks, mid-ribbed swords, blades, bangles, rings and beads.</p>
<ul>
<li>&#8226; <strong>At Kayatha, one pot contained 28 copper bangles.</strong></li>
</ul>

<h3>Ornaments:</h3>
<ul>
<li>&#8226; <strong>Beads</strong> made of carnelian, jasper, chalcedony, agate, shell, etc.</li>
<li>&#8226; A <strong>necklace made of 40,000 microbeads of steatite</strong> has been found in a pot belonging to the <strong>Kayatha</strong> culture.</li>
<li>&#8226; At <strong>Inamgaon</strong> beads of gold and ivory, a spiral ear ring of gold and anklets of copper were found.</li>
</ul>

<h3>Terracotta objects:</h3>
<p>These are in the form of <strong>human and animal figurines.</strong></p>
<p>The <strong>stylized terracotta bulls at Kayatha.</strong></p>
<ul>
<li>&#8226; Considering the occurrence of numerous terracotta bull figurines at several of Chalcolithic sites it can be suggested that bull was a <strong>sacred animal,</strong> or may be they were just toys.</li>
</ul>
<p><strong>Daimabad Hoard:</strong></p>
<ul>
<li>&#8226; A hoard of four bronze objects
<ul>
<li style="padding-left:2em">&#9702; Two Wheeled Chariot with a Rider</li>
<li style="padding-left:2em">&#9702; a water buffalo,</li>
<li style="padding-left:2em">&#9702; an elephant,</li>
<li style="padding-left:2em">&#9702; a rhinoceros</li>
</ul>
</li>
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
<li>&#8226; Well-known pottery forms used in this culture are −
<ul>
<li style="padding-left:2em">&#9702; Dishes-on-stand,</li>
<li style="padding-left:2em">&#9702; Spouted vases,</li>
<li style="padding-left:2em">&#9702; Stemmed cups,</li>
<li style="padding-left:2em">&#9702; Pedestalled bowls,</li>
<li style="padding-left:2em">&#9702; Big storage jars, and</li>
<li style="padding-left:2em">&#9702; Spouted basins and bowls.</li>
</ul>
</li>
</ul>

<h2>Trade and Commerce</h2>
<ul>
<li>&#8226; The Chalcolithic communities traded and exchanged materials with other contemporary communities.</li>
<li>&#8226; A large settlement serves as the major center of trade and exchange.
<ul>
<li style="padding-left:2em">&#9702; Some of them were Ahar, Gilund, Nagada, Navdatoli, Eran, Prabhas, Rangpur, Prakash, Daimabad, and Inamgaon.</li>
</ul>
</li>
<li>&#8226; The <strong>Ahar</strong> people settled close to the <strong>copper source</strong> and were used to supply copper tools and objects to other contemporary communities in Malwa and Gujarat.
<ul>
<li style="padding-left:2em">&#9702; Identical marks embedded on most of the copper axes found in Malwa, Jorwe, and Prabhas cultures that might indicate that it may be the trademarks of the smiths who made them.</li>
</ul>
</li>
<li>&#8226; It is found that <strong>Conch shell for bangles was traded from the Saurashtra coast</strong> to other regions.</li>
<li>&#8226; <strong>Gold and ivory come to Jorwe people from Tekkalkotta</strong> in Karnataka and <strong>semiprecious stones</strong> may have been traded to various parts <strong>from Rajpipla in Gujarat.</strong></li>
<li>&#8226; <strong>Inamgaon pottery</strong> has been found at several sites located far away. This shows that the Jorwe people used to trade even the pottery to distant places.</li>
<li>&#8226; <strong>Wheeled bullock carts</strong> were used for long distance trade, besides the river transport. The drawings of wheeled bullock carts have been found on pots.</li>
</ul>

<h2>Houses and Habitations</h2>
<p><strong>Rectangular and circular houses</strong> with <strong>mud walls and thatched roofs</strong> are the most common types, though there are <strong>variations in house size</strong> from site to site.</p>
<ul>
<li>&#8226; <strong>Ahar</strong> people built houses <strong>on plinths made of schist.</strong>
<ul>
<li style="padding-left:2em">&#9702; <strong>Walls</strong> were built on these plinths with <strong>mud or mud brick</strong> and the walls were <strong>decorated with quartz cobbles.</strong></li>
<li style="padding-left:2em">&#9702; <strong>Floors</strong> were made of <strong>burnt clay or clay mixed with river gravels.</strong></li>
<li style="padding-left:2em">&#9702; <strong>Bigger houses had partition walls, and chulhas</strong> (hearths) and <strong>quartzite saddle querns</strong> in the kitchen.</li>
</ul>
</li>
<li>&#8226; <strong>Malwa settlements</strong> such as those found at Navdatoli, Parkash, Daimabad and Inamgaon were <strong>quite large.</strong>
<ul>
<li style="padding-left:2em">&#9702; Evidence at <strong>Inamgaon</strong> suggests that some kind of <strong>planning</strong> was adopted in the laying out of the settlement.
<ul>
<li style="padding-left:4em">&#9632; The majority houses were aligned in <strong>east-west orientation.</strong></li>
<li style="padding-left:4em">&#9632; Though these houses were built close to each other, they had an intervening space which might have served as a <strong>lane.</strong></li>
</ul>
</li>
<li style="padding-left:2em">&#9702; These houses at <strong>Inamgaon</strong> were large (7m X 5m) rectangular structures with a partition wall.
<ul>
<li style="padding-left:4em">&#9632; The houses had a <strong>low mud wall and gabled roof.</strong></li>
<li style="padding-left:4em">&#9632; Inside the house was a large <strong>oval fire pit</strong> with raised sides for keeping the fire under control.</li>
</ul>
</li>
<li style="padding-left:2em">&#9702; The houses at <strong>Navdatoli</strong> were provided with one or two mouthed chulhas in the kitchen.
<ul>
<li style="padding-left:4em">&#9632; The grain was stored in deep pit silos.</li>
</ul>
</li>
</ul>
</li>
<li>&#8226; A significant feature of the <strong>Jorwe culture</strong> is the presence of a <strong>large centre in each region.</strong>
<ul>
<li style="padding-left:2em">&#9702; These centres are Prakash, Daimabad and Inamgaon, respectively in the valleys of Tapi, Godavari and Bhima.
<ul>
<li style="padding-left:4em">&#9632; The <strong>Jorwe settlement at Daimabad was the largest</strong> (30 hectares). Prakash and Inamgaon cover about 5 Ha each.</li>
</ul>
</li>
<li style="padding-left:2em">&#9702; A noteworthy feature of the Jorwe settlement at <strong>Inamgaon</strong> is that:
<ul>
<li style="padding-left:4em">&#9632; the <strong>houses of the artisans</strong> such as the potter, the goldsmith, the lapidary, the ivory-carver etc. were located on the <strong>western periphery</strong> of the principal habitation area,</li>
<li style="padding-left:4em">&#9632; Whereas those of <strong>well-to-do farmers</strong> were in the <strong>central part.</strong></li>
<li style="padding-left:4em">&#9632; The <strong>size of the artisans houses is smaller</strong> than those of the well-to-do.</li>
<li style="padding-left:4em">&#9632; Both these aspects i.e. the position and size of houses demonstrate <strong>social differentiation</strong> in terms of a lower position for artisans in the society.</li>
</ul>
</li>
</ul>
</li>
<li>&#8226; At Inamgaon a <strong>change</strong> has been noticed in house types from <strong>Early Jorwe</strong> (1400–1000 B.C.) to <strong>Late Jorwe</strong> period (1000 – 700 B.C.):
<ul>
<li style="padding-left:2em">&#9702; The Early Jorwe houses were large rectangular structures with low mud walls.
<ul>
<li style="padding-left:4em">&#9632; These houses were laid out in rows with their longer axis in east-west orientation.</li>
<li style="padding-left:4em">&#9632; These houses have an open space in between which might have served as a road or lane.</li>
</ul>
</li>
<li style="padding-left:2em">&#9702; The Late Jorwe houses on the other hand depict a picture of poverty.
<ul>
<li style="padding-left:4em">&#9632; Large rectangular huts were no longer built, and instead there were small round huts (with a low mud wall) in clusters of three or four.</li>
<li style="padding-left:4em">&#9632; The pit silos were replaced by a four legged storage jar.</li>
</ul>
</li>
</ul>
</li>
<li>&#8226; The overall evidence indicates that this shift from Early Jorwe to Late Jorwe was due to <strong>decline in agriculture as a result of drop in rainfall.</strong>
<ul>
<li style="padding-left:2em">&#9702; At the close of the second millennium B.C. there was a <strong>drastic climatic change in</strong> western and central India that led to increasing aridity forcing the people to resort to a <strong>semi-nomadic existence.</strong>
<ul>
<li style="padding-left:4em">&#9632; This conclusion is based on <strong>calculations of percentages of animal bones</strong> found from different phases.</li>
<li style="padding-left:4em">&#9632; It seems that increasing aridity during the Late Jorwe period led to the <strong>decline of agriculture,</strong> and the economy based on farming changed over to <strong>sheep/goat pastoralism.</strong></li>
</ul>
</li>
</ul>
</li>
</ul>
<p>Some of these chalcolithic sites have <strong>fortification walls</strong> around the settlement.</p>
<ul>
<li>&#8226; <strong>Eran</strong> and <strong>Nagda</strong> of the Malwa Culture, and <strong>Inamgaon</strong> have a fortified mud wall with a ditch around the habitation.</li>
</ul>

<h2>Religious Beliefs</h2>
<ul>
<li>&#8226; Religion was an important aspect that interlinked all centres of Chalcolithic cultures.</li>
<li>&#8226; The people of Chalcolithic cultures worshipped the <strong>mother goddess and the bull.</strong>
<ul>
<li style="padding-left:2em">&#9702; In Malwa, the bull cult seems to have been predominant.</li>
</ul>
</li>
<li>&#8226; The <strong>Mother Goddess</strong> is depicted on a <strong>huge storage jar of Malwa culture</strong> in an applique design.
<ul>
<li style="padding-left:2em">&#9702; She is surrounded by a woman on the right and a crocodile on the left, by the side of which is represented a shrine.</li>
</ul>
</li>
<li>&#8226; In a painted design on a pot, a <strong>deity is shown with dishevelled hair, resembling the Rudra of the later period.</strong></li>
<li>&#8226; A painting on a jar found from Daimabad portrayed a <strong>deity surrounded by animals and birds</strong> such as tigers and peacocks.
<ul>
<li style="padding-left:2em">&#9702; It is similar to the Siva Pashupati that was found depicted on a seal from Mohenjo Daro.</li>
</ul>
</li>
<li>&#8226; A large number of both the <strong>naturalistic as well as stylized lingas</strong> have been found from most of the sites.</li>
<li>&#8226; <strong>Two figurines belonging to late Jorwe culture</strong> found from Inamgaon have been identified as <strong>proto-Ganesh,</strong> which was worshipped for success before embarking on an undertaking.</li>
<li>&#8226; A <strong>large number of Fire-altars</strong> have been found from the Chalcolithic sites during the course of excavations shows that Fire worship was a very widespread phenomenon among the people.</li>
<li>&#8226; The people of Chalcolithic had a <strong>belief in life after death,</strong> which is indicated by the existence of <strong>pots and other funerary objects</strong> found with the burials of the Malwa and Jorwe people.</li>
</ul>

<h2>Burial Practices</h2>
<ul>
<li>&#8226; Disposal of the dead by burial was a common custom.</li>
<li>&#8226; Adults as well as children were usually buried in a <strong>north-south orientation;</strong> the head towards the north and the legs towards the south.</li>
<li>&#8226; <strong>Adults</strong> were, in a majority of cases, buried in an <strong>extended position,</strong> whereas <strong>children</strong> were buried in <strong>urn-burials</strong>-either in single pots or in two pots.</li>
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
<li>&#8226; Seen in the larger context of the post-Harappan developments, these chalcolithic cultures betray discernible influences of the Harappan culture, though in a residual form.
<ul>
<li style="padding-left:2em">&#9702; All the same, they are marked by <strong>strong regional elements,</strong> and also display <strong>trade links and cultural contacts</strong> between each other.</li>
</ul>
</li>
<li>&#8226; These metal-using farming communities which flourished in the second millennium B.C. disappeared around the first millennium B.C. (excepting Late Jorwe which continued till 700 B.C.).
<ul>
<li style="padding-left:2em">&#9702; One possible reason attributed for such a decay was <strong>increasing aridity and unfavourable climatic conditions.</strong></li>
<li style="padding-left:2em">&#9702; Many of these settlements in the Godavari, Tapi and other valleys were deserted, and were reoccupied after a gap of six or five centuries in fifth-fourth centuries B.C., heralded by urbanisation.</li>
</ul>
</li>
</ul>"""

with open('lib/noteContent.ts', 'r') as f:
    content = f.read()

# Find the slug's full content block
slug_pattern = re.compile(
    r"('prehistory-protohistory':\s*`)(.*?)(`)",
    re.DOTALL
)

match = slug_pattern.search(content)
if not match:
    print("ERROR: Could not find slug 'prehistory-protohistory'")
    exit(1)

full_block = match.group(2)  # everything between the backticks

# Find where the first <h2>Chalcolithic Age</h2> appears and cut everything from there
chalco_start = full_block.find('<h2>Chalcolithic Age</h2>')
if chalco_start == -1:
    print("ERROR: Could not find <h2>Chalcolithic Age</h2> in the slug content")
    exit(1)

# Keep everything before the first Chalcolithic block, then append the correct version
clean_block = full_block[:chalco_start].rstrip() + '\n' + CHALCOLITHIC_HTML

new_content = slug_pattern.sub(
    lambda m: m.group(1) + clean_block + m.group(3),
    content
)

with open('lib/noteContent.ts', 'w') as f:
    f.write(new_content)

print("✅ Done! Replaced all Chalcolithic content with correct version in: prehistory-protohistory")
