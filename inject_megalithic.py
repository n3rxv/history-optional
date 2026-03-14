import re

SLUG = 'megalithic-cultures'

NEW_HTML = """<h1>Megalithic Cultures</h1>

<h2>Defining Megalith</h2>
<ul>
<li>&#8226; The term 'megalith' is derived from Greek 'megas' (great) and 'lithos' (stone) — megaliths refer to monuments built of large stones.</li>
<li>&#8226; But all monuments constructed of big stones are not megaliths.</li>
</ul>
<ul class="sub-list">
<li>&#9702; The term has a restricted usage and is applied only to a particular class of monuments or structures, which are built of large stones and have some sepulchral (grave-like), commemorative or ritualistic association except the hero stones or memorial stones.</li>
<li>&#9702; The megaliths usually refer to the <strong>burials made of large stones</strong> in graveyards away from the habitation area.</li>
</ul>

<h2>Chronology</h2>
<ul>
<li>&#8226; Based on archaeological evidence (first on the basis of Brahmagiri excavation, dating the megaliths on the basis of a characteristic ceramic type — the <strong>Black and Red Ware (BRW)</strong>, which is available in all types of megaliths in South India), these cultures are placed between the <strong>3rd c. B.C and the 1st c. A.D.</strong></li>
<li>&#8226; But, Megalithic culture of South India had a much larger chronological span.</li>
<li>&#8226; The problem in ascertaining the chronological span lies in the fact that only a few radiocarbon dates are so far available from megalithic habitations.</li>
</ul>
<ul class="sub-list">
<li>&#9702; The habitation site at <strong>Hallur</strong> gave a date of <strong>1000 B.C</strong> for the earliest phase. This phase is correlated with the graves at Tadakanahalli, 4 kms away.</li>
<li>&#9702; Two radiocarbon dates for <strong>Naikund and Takalghat</strong> place Vidarbha megaliths in circa <strong>600 B.C.</strong></li>
<li>&#9702; In Tamilnadu, <strong>Paiyampalli</strong> recorded a date of circa <strong>4th c. B.C.</strong></li>
</ul>
<ul>
<li>&#8226; On the basis of explorations and excavations, the date of the megaliths is pushed in the <strong>North Karnataka region as early as 1200 B.C.</strong></li>
<li>&#8226; As the megalithic culture overlapped with the end phases of neolithic-chalcolithic culture, it is found in association with neolithic-chalcolithic wares at the lower end and with the <strong>rouletted ware</strong> (the first millennium AD) at the upper end.</li>
<li>&#8226; On this basis the time bracket of the megalithic cultures in South India may be placed between <strong>1000 B.C and A.D 100.</strong></li>
</ul>
<ul class="sub-list">
<li>&#9702; However, the available archaeological data suggests that the <strong>period of their maximum popularity lies somewhere between 600 B.C and A.D 100.</strong></li>
</ul>

<h2>Origin and Spread of Megalithic Cultures</h2>
<ul>
<li>&#8226; In the context of India, it has been suggested that this culture arrived with the Dravidian speakers who came to South India from west Asia by sea.</li>
</ul>
<ul class="sub-list">
<li>&#9702; But we find that the typical West Asian megaliths yielded bronze objects and this culture came to an end in the last phase of their Bronze Age around <strong>1500 B.C.</strong></li>
<li>&#9702; The Indian megaliths, on the other hand, belong to the <strong>Iron Age generally dated to 1000 B.C onwards.</strong></li>
<li>&#9702; It is yet not certain when and how iron technology developed and became an integral part of the megalithic culture.</li>
</ul>
<ul>
<li>&#8226; The material and chronological differences between the megalithic culture of northern India and southern India suggest that the coming of this culture into the Indian subcontinent would have taken place by <strong>two routes by the two different groups:</strong></li>
</ul>
<ul class="sub-list">
<li>&#9702; one following the sea route from the Gulf of Oman to the West coast of India</li>
<li>&#9702; and the other following the land route from Iran.</li>
</ul>
<ul>
<li>&#8226; <strong>The complex pattern of widely different burial practices that are all lumped together under the term 'megaliths' is the result of mingling of various traditions and developments during a long period.</strong></li>
<li>&#8226; <strong>These megaliths have been found in different chronological contexts practically all over India, from</strong></li>
</ul>
<ul class="sub-list">
<li>&#9702; the plains of Punjab, Indo-Gangetic basin,</li>
<li>&#9702; the desert of Rajasthan,</li>
<li>&#9702; northern part of Gujarat and</li>
<li>&#9702; all regions south of Nagpur in the Peninsular India.</li>
<li>&#9702; It survives as a living tradition in the north-eastern part of India and in the Nilgiris.</li>
</ul>
<ul>
<li>&#8226; <strong>The main concentration of the megalithic cultures in India was the Deccan, especially south of the river Godavari.</strong></li>
<li>&#8226; However, large-stone structures resembling some of the usual megalith types have also been reported from some places in <strong>North India, Central India and Western India.</strong> These include:</li>
</ul>
<ul class="sub-list">
<li>&#9702; Seraikala in Bihar;</li>
<li>&#9702; Deodhoora in Almora district and Khera near Fatehpur Sikri of Uttar Pradesh;</li>
<li>&#9702; Nagpur;</li>
<li>&#9702; Chanda and Bhandra districts of Madhya Pradesh;</li>
<li>&#9702; Deosa, near Jaipur in Rajasthan.</li>
</ul>
<ul>
<li>&#8226; Similar monuments or structures are also found near Karachi in Pakistan, near Leh in the Himalayas and at Burzahom in Jammu and Kashmir.</li>
<li>&#8226; <strong>However, their wide distribution in the southern region of India suggests that it was essentially a South Indian feature which flourished at least for a thousand years.</strong></li>
<li>&#8226; <strong>Sepulchral megaliths:</strong></li>
</ul>
<ul class="sub-list">
<li>&#9702; The sepulchral (containing remains of the dead) megaliths can store the remains of the dead in a variety of forms.</li>
<li>&#9702; They could be <strong>primary burials,</strong> in which case the dead is interned soon after his or her death and it will contain a complete skeleton with some additional material as homage to the dead for the dead to use in afterlife.</li>
</ul>
<ul>
<li style="list-style:none; padding-left:2em;">&#9632; In some cases, these primary burials may also be in a <strong>sarcophagus</strong> made of terracotta. The whole chamber of burial therefore is a rich source of information.</li>
</ul>
<ul class="sub-list">
<li>&#9702; <strong>Secondary burials</strong> are also common when the remains of the dead, essentially the bones, are put in urns or pits.</li>
</ul>
<ul>
<li style="list-style:none; padding-left:2em;">&#9632; The location of the dead is most often marked with <strong>stone circles</strong> but <strong>Cairns and slab circles</strong> are also found on the surface.</li>
</ul>

<h2>Megalithic Culture — The Iron Age Culture of South India</h2>
<ul>
<li>&#8226; Most of the information about the iron age in South India comes from the excavations of the megalithic burials. The megalithic culture in South India was a <strong>full fledged iron age culture.</strong></li>
</ul>
<ul class="sub-list">
<li>&#9702; Hence, <strong>stone dropped out of use as a material for weapons and tools</strong> but found alternate use.</li>
</ul>
<ul>
<li>&#8226; Iron objects have been found universally in all the megalithic sites right from <strong>Junapani near Nagpur</strong> in Vidarbha region (Central India) down to <strong>Adichanallur</strong> in Tamilnadu in the far south.</li>
<li>&#8226; With the introduction of iron there was a <strong>gradual change in almost everything</strong> except perhaps the house plans.</li>
<li>&#8226; But, of all these changes <strong>the most remarkable was the elaborate method of disposing the dead.</strong> This became a characteristic feature of the South Indian regions.</li>
</ul>
<ul class="sub-list">
<li>&#9702; Instead of laying the dead accompanied by four or five pots in a pit in the house, now the dead were buried in a separate place — a <strong>cemetery or a graveyard away from the house.</strong></li>
</ul>
<ul>
<li>&#8226; The remains of the dead were collected perhaps after exposing the body for sometime and then the bones were placed underground in a specially prepared stone box called a <strong>cist.</strong></li>
</ul>
<ul class="sub-list">
<li>&#9702; The cists were elaborate structures and must have necessitated an amount of <strong>planning and cooperation</strong> among the community and the existence of <strong>masons and other craftsmen</strong> capable of manufacturing the required size of stones, large and small.</li>
<li>&#9702; It is probable that these megaliths must have been planned and <strong>kept ready before the death</strong> of an individual.</li>
</ul>

<h2>Classification of the Megaliths</h2>
<ul>
<li>&#8226; The megalithic burials show a variety of methods for the disposal of the dead. Moreover, there are megaliths which are internally different but exhibit the same external features.</li>
<li>&#8226; The megaliths can be classified under different categories:</li>
</ul>
<ul class="sub-list">
<li>&#9702; Rock Cut Caves,</li>
<li>&#9702; Hood Stones and Hat Stones / Cap Stones</li>
<li>&#9702; Menhirs, Alignments and Avenues</li>
<li>&#9702; Dolmenoid Cists</li>
<li>&#9702; Cairn Circles</li>
<li>&#9702; Stone Circles,</li>
<li>&#9702; Pit Burials, and</li>
<li>&#9702; Barrows</li>
</ul>

<h3>(1) Rock Cut Caves</h3>
<ul>
<li>&#8226; These are scooped out on soft laterite, as found in the southern part of the West Coast. These rock cut cave tombs are peculiar to this region and occur in the <strong>Cochin and Malabar regions of Kerala.</strong></li>
</ul>
<p>The laterite rocks cut caves of the burial site constitute three chambers.</p>
<ul>
<li>&#8226; They also occur in other regions. On the East Coast of South India, they are present in <strong>Mamallapuram near Madras.</strong></li>
<li>&#8226; These rock cut burial caves in Cochin region are of four types — (i) Caves with Central pillar, (ii) Caves without central pillar, (iii) Caves with a deep opening and (iv) Multi-chambered caves.</li>
</ul>

<h3>(2) Hood Stones (Kudaikallu) and Cap Stones (Toppikkals)</h3>
<ul>
<li>&#8226; Allied with the rock cut caves but of a simpler form are the Hood stones or Kudaikallu mostly found in Kerala.</li>
</ul>
<ul class="sub-list">
<li>&#9702; These consists of a dome-shaped dressed laterite block which cover the underground circular pit cut into a natural rock and provided with a stairway.</li>
</ul>
<ul>
<li>&#8226; In some cases the hood stone gives place to a cap stone or toppikkal, which is a plano-convex slab resting on three or four quadrilateral boulders.</li>
<li>&#8226; This also covers an underground burial pit containing the funerary urn and other grave furnishings.</li>
<li>&#8226; Unlike as in the rock cut caves, there is no chamber apart from this open pit in which itself the burial is made.</li>
<li>&#8226; Usually, it contains a burial urn covered with a convex or dome-shaped pottery lid or a stone slab and contains skeletal remains, small pots and, sometimes ashes.</li>
<li>&#8226; Similar monuments are commonly encountered in Cochin and Malabar regions extending along the Western Ghats into the Coimbatore region upto the <strong>Noyyal river valley in Tamilnadu.</strong></li>
</ul>

<h3>(3) Menhirs, Alignments and Avenues</h3>
<ul>
<li>&#8226; Menhirs are monolithic pillars planted vertically into the ground. These may be small or gigantic in height.</li>
<li>&#8226; They are dressed or not dressed at all.</li>
<li>&#8226; These are essentially <strong>commemorative stone pillars</strong> set up at or near a burial spot.</li>
<li>&#8226; These menhirs are mentioned in ancient Tamil literature as <strong>nadukal</strong> and are often called <strong>Pandukkkal or Pandil.</strong></li>
<li>&#8226; In some cases, the menhirs are not planted in ground but rest on the original ground propped up with a mass of rubble as at Maski.</li>
<li>&#8226; These occur in a number of sites in close vicinity of other type of megalithic burials, mostly in different regions of Kerala and Bellary, Raichur and Gulbarga regions of Karnataka in large numbers, but less frequently at other places of South India.</li>
</ul>
<p>Mizoram's first 'monument' — The menhirs of <strong>Vangchhia village, Champai district of Mizoram.</strong> The actual site where the 171 menhirs stand is known as <strong>Kawtchhuah Ropui,</strong> meaning the Great Entranceway. Menhirs or monoliths are found in Meghalaya, Nagaland and Andhra Pradesh but are not common in the rest of India.</p>
<ul>
<li>&#8226; Alignments are closely associated to the menhirs.</li>
</ul>
<ul class="sub-list">
<li>&#9702; These consists of a series of standing stones.</li>
<li>&#9702; These stones are sometimes dressed.</li>
<li>&#9702; The alignments are found at Komalaparathala in Kerala and at a number of sites in Gulbarga, Raichur, Nalgonda and Mahboobnagar districts of Karnataka.</li>
</ul>
<ul>
<li>&#8226; Avenues consists of two or more parallel rows of the alignments and hence many of the sites under alignments, may be considered as examples of this category of monuments when they are in parallel lines.</li>
</ul>

<h3>(4) Dolmenoid Cists</h3>
<ul>
<li>&#8226; Dolmenoid cists consists of square or rectangular box-like graves built of several <strong>orthostats</strong> (upright stone or slab) one or more for each side, supporting the super incumbent <strong>capstone</strong> consisting of one or more stones, often with the floor also paved with the stone slabs.</li>
<li>&#8226; The orthostats and the capstones might be formed either of undressed rough blocks of stone or partly dressed stones.</li>
<li>&#8226; The dolmenoid cists occur at large number at <strong>Sanur near Chingleput (T.N.)</strong> and many other sites in this region.</li>
<li>&#8226; The cists built of dressed slabs or the slab cists are the normal type of cists, occurring all over South India, as also in some parts of the north.</li>
</ul>
<p>Dolmens of Marayur. Marayur in Kerala is also famous for Ancient rock paintings.</p>
<ul>
<li>&#8226; There are many sub-types of this in Tamilnadu:</li>
</ul>
<ul class="sub-list">
<li>&#9702; Dolmenoid cist with multiple orthostats,</li>
<li>&#9702; Dolmenoid cist with four orthostats with U-shaped port-hole in the east or west,</li>
<li>&#9702; Dolmenoid cist with four orthostats with U-shaped port-hole on the top corner of the eastern orthostat, and</li>
<li>&#9702; Dolmenoid cist with four orthostats with slab-circles.</li>
</ul>

<h3>(5) Cairn Circles</h3>
<ul>
<li>&#8226; Cairn circles are one the most popular type of megalithic monuments occurring all over south India in association with other types.</li>
</ul>
<ul class="sub-list">
<li>&#9702; They consist of a heap of stone rubble enclosed within a circle of boulders.</li>
</ul>
<ul>
<li>&#8226; The pit burials under the cairn circles consist of deep pits dug into the soil, roughly circular, square or oblong on plan.</li>
</ul>
<ul class="sub-list">
<li>&#9702; The skeletal remains and the grave furniture were placed on the floors of these pits.</li>
<li>&#9702; The pits were then filled up with earth.</li>
</ul>
<ul>
<li>&#8226; Above this earth filling was placed the cairn heap which might be just a thin layer or may rise upto 3 to 4 ft. above the ground level and bounded by a circle of stones.</li>
<li>&#8226; Such pit burials have been found at many sites in the Chingleput (Tamilnadu), Chitradurg and Gulbarga (Karnataka) districts.</li>
<li>&#8226; A sarcophagus is literally a legged coffin made of terracotta.</li>
</ul>
<ul class="sub-list">
<li>&#9702; The cairn circles containing sarcophagi entombments are comparatively more widespread than the pit burials.</li>
<li>&#9702; They are similar to the pit burials but the skeletal remains and the primary deposits of the grave furniture are placed in an oblong terracotta sarcophagus.</li>
<li>&#9702; This sarcophagus is generally provided with a convex terracotta lid, rows of legs at the bottom and often with a capstone at a higher level.</li>
</ul>
<ul>
<li style="list-style:none; padding-left:2em;">&#9632; Such megalithic structures are found from: South Arcot, Chingleput and North Arcot districts of Tamilnadu, Kolar district of Karnataka.</li>
</ul>
<ul>
<li>&#8226; The urn burials under the cairn circles are a variant form of the sarcophagi burials and occur in large number in most parts of South India.</li>
</ul>
<ul class="sub-list">
<li>&#9702; The urns (a pot) in which the burials are made, are deposited in pits dug into the soil.</li>
<li>&#9702; The pits are filled up with the soil upto the ground level and are frequently provided with a capstone.</li>
<li>&#9702; Then, the heap of cairns on the surface, which marks the burial, is surrounded by a circle of stones.</li>
<li>&#9702; They are predominant in:</li>
</ul>
<ul>
<li style="list-style:none; padding-left:2em;">&#9632; Kerala</li>
<li style="list-style:none; padding-left:2em;">&#9632; Madurai, Tiruchirapalli, Coimbatore, Nilgiris, Salem, Chingleput and South Arcot district of Tamilnadu;</li>
<li style="list-style:none; padding-left:2em;">&#9632; Kolar, Banglore, Hassan, Chitradurg, Bellary, Raichur and Gulbarga districts of Karnataka;</li>
<li style="list-style:none; padding-left:2em;">&#9632; various districts of Andhra Pradesh and the region around Nagpur.</li>
</ul>

<h3>(6) Stone Circles</h3>
<ul>
<li>&#8226; They are the <strong>most commonly encountered megalithic monuments in India.</strong></li>
<li>&#8226; They reflect the features of various forms of megalithic monuments such as the Kudaikallu, Topikkal, different types of pit burials, menhirs, dolmenoid cists of different types, cairns, etc. These occur from the southern tip of the peninsula upto Nagpur region and in different parts of North India.</li>
</ul>
<ul class="sub-list">
<li>&#9702; But in this category under consideration, only stone circles without any considerable cairn filling within the circle, containing burial pits with or without urns or sarcophagi, are included.</li>
</ul>

<h3>(7) Pit Burials</h3>
<ul>
<li>&#8226; Burials in pyriform or fuciform urns — large conical jars containing the funerary deposits, are buried in the underground pits specially dug for the purpose into the hard natural soil and sometimes into the basal rock and the pits are filled up.</li>
<li>&#8226; In these kinds of burials we do not find any surface indication of the burial in the form of a stone circle, cairn heap, hood stone or hat (cap) stone, or even a menhir.</li>
</ul>
<ul class="sub-list">
<li>&#9702; These urn burials are without any megalithic appendage.</li>
</ul>
<ul>
<li>&#8226; This class of megalithic burials cannot be included under the megalithic burial monuments, because no megalithic is observed in relation to them.</li>
</ul>
<ul class="sub-list">
<li>&#9702; But they exhibit the general traits of the megalithic culture of South India, characterized by the use of the typically megalithic <strong>Black-and-red ware (BRW)</strong> and associated wares with iron objects.</li>
<li>&#9702; These grave goods are identical with their counterparts found in the regular megalithic burials.</li>
<li>&#9702; Moreover, these occur in the general areas where the typical megalithic burials exist.</li>
<li>&#9702; In fact, these urn burials do not differ in any detail from the urn burials under a stone or cairn circle of the megalithic order, except for the surface features.</li>
</ul>
<ul>
<li>&#8226; These urn burials without megalithic appendage are found in many sites of Tamilnadu like <strong>Adichanallur, Gopalasamiparambu</strong> and scores of other sites.</li>
</ul>
<ul class="sub-list">
<li>&#9702; However, these occur less abundantly in Karnataka and Andhra regions.</li>
<li>&#9702; Even in North India, these urn burials are frequently observed at a number of Harappan and the Later Chalcolithic sites in Western, Central and North-western India, but their context is completely different from the South Indian urn burials.</li>
</ul>

<h3>(8) Barrows</h3>
<ul>
<li>&#8226; The barrows or earthen mounds mark off the underground burials. They may be either a circular barrow, oblong on plan, a long barrow.</li>
<li>&#8226; They have or may not have the surrounding stone circles or ditches.</li>
<li>&#8226; Monuments of this kind have not been found in large numbers in India. However, such monuments have been observed in the <strong>Hassan district of Karnataka.</strong></li>
</ul>

<h2>Grave Goods in Megalithic Burials</h2>
<ul>
<li>&#8226; The megalithic burials have yielded a variety of objects, which prove to be very important in the study of megalithic culture.</li>
<li>&#8226; It is observed that right from the Later Palaeolithic period, an intentional burial was accorded to the dead.</li>
</ul>
<ul class="sub-list">
<li>&#9702; The megalithic people were no exception to the age-old custom and, therefore took pains to construct <strong>elaborate and labour-consuming tombs.</strong></li>
<li>&#9702; They furnished them with as many <strong>essential objects</strong> as they could afford.</li>
<li>&#9702; They thought this practice to be necessary as they believed in the <strong>after-life</strong> of the dead.</li>
<li>&#9702; And so, the dead were suitably provided for a place to live in with goods of their essential needs.</li>
</ul>
<ul>
<li>&#8226; In the Indian megalithic especially those in South India, the grave furniture consisted of:</li>
</ul>
<ul class="sub-list">
<li>&#9702; a large variety of <strong>pottery;</strong></li>
<li>&#9702; <strong>weapons and implements</strong> mostly of iron but often of stone or copper;</li>
<li>&#9702; <strong>ornaments</strong> like beads of terracotta, semi-precious stones, gold or copper, shell, etc., strung into necklaces or rarely the ear or nose ornaments, armlets or bracelets and diadems;</li>
<li>&#9702; <strong>food</strong> as indicated by the presence of <strong>paddy</strong> husk and chaff, and some other <strong>cereals;</strong></li>
<li>&#9702; <strong>animals,</strong> as indicated by skeletal remains, sometimes complete, in these graves.</li>
</ul>

<h2>Subsistence Pattern</h2>
<ul>
<li>&#8226; Megalithic sites were <strong>initially understood as settlements of nomadic pastoralists.</strong></li>
</ul>
<ul class="sub-list">
<li>&#9702; However, the evidence clearly indicates that early iron age communities in the far south lived on a <strong>combination of agriculture, hunting, fishing, and animal husbandry.</strong></li>
<li>&#9702; There is also evidence of <strong>well-developed craft traditions.</strong></li>
<li>&#9702; These features, along with the megalithic monuments themselves, suggest <strong>sedentary living.</strong></li>
</ul>

<h3>(1) Agriculture</h3>
<ul>
<li>&#8226; <strong>The basis of their economy was agriculture.</strong></li>
</ul>
<ul class="sub-list">
<li>&#9702; In fact, the megalith builders were responsible for the introduction of <strong>advanced methods of agriculture</strong> on a large scale, based on irrigation.</li>
<li>&#9702; They introduced the <strong>'tank-irrigation'</strong> in South India and thus brought a revolutionary change in the agricultural system.</li>
</ul>
<ul>
<li>&#8226; People grew <strong>cereals, millets, and pulses.</strong></li>
</ul>
<ul class="sub-list">
<li>&#9702; <strong>Charred grains</strong> of horse gram, green gram, and possibly ragi were found at Paiyampalli.</li>
<li>&#9702; <strong>Rice,</strong> an essentially irrigational crop, served as their <strong>staple food.</strong></li>
</ul>
<ul>
<li style="list-style:none; padding-left:2em;">&#9632; Paddy husks and rarely paddy grains are reported from a number of excavated graves from all over the region.</li>
<li style="list-style:none; padding-left:2em;">&#9632; Rice as attested by the Sangam literature, is the staple food of the people of South India since very early times and remains till today.</li>
</ul>
<ul class="sub-list">
<li>&#9702; Rice husk occurred at Coorg and Khapa (in Karnataka), and Hallur yielded charred grains of ragi.</li>
<li>&#9702; Rice grains were found in one of the tombs at Kunnatur (in Tamil Nadu).</li>
<li>&#9702; Naturally, there were some regional variations in the crops grown.</li>
</ul>
<ul>
<li>&#8226; <strong>Pestles and grinding stones</strong> have been found at some megalithic sites. For instance, a granite grinding stone was found in a cist at Machad (in Kerala).</li>
<li>&#8226; <strong>The location of megalithic sites on unproductive land</strong> was more than a coincidence. These highly intelligent and pragmatic communities saw to it that <strong>fertile arable lands were not wasted due to encroachments by their graves.</strong></li>
</ul>
<ul class="sub-list">
<li>&#9702; <strong>Unproductive foot-hills, rocky and gravelly lands</strong> were used for the location of their graves, while lower down, the plains were reserved for agricultural purposes.</li>
</ul>
<ul>
<li>&#8226; But some communities seem to have considered that the <strong>spirit of their dead ancestors would guard and bestow prosperity</strong> on their fields.</li>
</ul>
<ul class="sub-list">
<li>&#9702; Hence, massive though empty dolmens are located in the midst of their fields, as at Uthiramerur in Tamilnadu.</li>
</ul>

<h3>(2) Pastoralism and Animal Husbandry</h3>
<ul>
<li>&#8226; The frequent occurrence of animal bones — of both wild and domesticated species — indicates <strong>domestication and hunting.</strong></li>
<li>&#8226; The cattle, sheep, goat, dog, pig, horse, buffalo, fowl, ass etc. were among the domesticated animals.</li>
<li>&#8226; <strong>Cattle (including buffalo) were the most important domesticated animal.</strong> This brings out two important facts.</li>
</ul>
<ul class="sub-list">
<li>&#9702; <strong>First, the earlier neolithic tradition of cattle keeping was continued.</strong></li>
<li>&#9702; <strong>Second, cattle pastoralism and not sheep/goat pastoralism, formed a major preoccupation of megalithic society.</strong></li>
</ul>
<ul>
<li>&#8226; The occurrence of the remains of domesticated pig and fowl suggests <strong>pig rearing and poultry farming on a small scale</strong> at many of the sites.</li>
</ul>

<h3>(3) Hunting and Fishing</h3>
<ul>
<li>&#8226; Hunting naturally <strong>augmented the food supply,</strong> as the equipment for hunting, like <strong>arrowheads, spears</strong> and <strong>javelins</strong> would indicate.</li>
</ul>
<ul class="sub-list">
<li>&#9702; <strong>Sling</strong> was probably another equipment used for hunting by megalithic people, as attested by the large-scale findings of stone balls.</li>
</ul>
<ul>
<li>&#8226; The occurrence of <strong>skeletal remains of wild fauna</strong> like Wild boar, Hyena, Barking deer, Chousingha, Sambar, Chital, Nilgai, Peacock, Leopard, Tiger, Cheetah, Sloth bear, Wild hog, Peafowl, Jungle fowl, Water fowl, etc. from different sites indicate that these species were hunted and formed part of their dietary system.</li>
<li>&#8226; <strong>Paintings:</strong></li>
</ul>
<ul class="sub-list">
<li>&#9702; Some clues to subsistence practice of hunting come from paintings and figurines. <strong>Hunting scenes</strong> are depicted at Marayur and Attala (in Kerala).</li>
<li>&#9702; At Hire Benkal (in Karnataka), there are scenes of hunting, showing peahens, peacocks, stags, and antelopes, as well as scenes of people dancing in groups.</li>
</ul>
<ul>
<li>&#8226; <strong>Fishing:</strong></li>
</ul>
<ul class="sub-list">
<li>&#9702; The evidence in the form of <strong>terracotta net sinkers</strong> from Takalghat and <strong>fish-hooks</strong> from Khapa and Tangal besides the actual <strong>skeletal remains of fish</strong> from Yelleshwaram reflect that fishing was also practised.</li>
<li>&#9702; Fish-hooks have been found in some megalithic graves in Tamil Nadu.</li>
</ul>

<h3>(4) Technology: Industries and Crafts</h3>
<ul>
<li>&#8226; The megalithic sites of South India give evidence of well-developed traditions of specialized crafts.</li>
<li>&#8226; The industrial activities such as <strong>smithery, carpentry, pottery making, lapidary (art of working with precious stone), basketry and stone cutting</strong> formed other economic activities of megalithic society.</li>
</ul>

<p><strong>(a) Metals:</strong></p>
<ul>
<li>&#8226; There are many megalithic sites which were the production sites of metals like <strong>iron, copper, gold, silver etc.</strong></li>
<li>&#8226; <strong>Smelting:</strong></li>
</ul>
<ul class="sub-list">
<li>&#9702; The archaeological evidence in the form of <strong>crucibles, smelting-furnaces, clay tuyers</strong> and presence of material like <strong>iron ore pieces, iron slag, copper slag</strong> and traces of copper or gold mines or other mineral resources at or near to these sites is suggestive of smithery.</li>
</ul>
<ul>
<li style="list-style:none; padding-left:2em;">&#9632; There is evidence of local smelting of iron at <strong>Paiyampalli (Karnataka).</strong></li>
</ul>
<ul class="sub-list">
<li>&#9702; An efficient utilisation of metallic resources is dependent upon <strong>availability of fuel and type of fuel</strong> capable of producing the required degree of temperature.</li>
</ul>
<ul>
<li style="list-style:none; padding-left:2em;">&#9632; The most common type of fuel used by these pre-industrial smelters were <strong>charcoal, wood, dung and paddy husk.</strong></li>
</ul>
<ul>
<li>&#8226; The available archaeological evidence indicates the utilisation of metal implements such as <strong>axes, plough shares, hoes, sickles, spades, etc.</strong></li>
</ul>
<ul class="sub-list">
<li>&#9702; The use of axes was either for cutting logs or for clearing forests.</li>
<li>&#9702; The use of hoe (or bladed harrow) for cultivation has been recorded at many sites.</li>
<li>&#9702; The use of ploughshare from many sites amply attest to the technological base of megalithic people for carrying out the agricultural operations.</li>
</ul>
<ul>
<li>&#8226; <strong>Iron:</strong></li>
</ul>
<ul class="sub-list">
<li>&#9702; <strong>Iron objects generally outnumber objects made of other metals at megalithic sites.</strong></li>
<li>&#9702; The large volume and variety of iron artefacts which indicate the metal's widespread use in everyday life.</li>
</ul>
<ul>
<li style="list-style:none; padding-left:2em;">&#9632; utensils,</li>
<li style="list-style:none; padding-left:2em;">&#9632; <strong>Weapons</strong> (arrowheads, spearheads, swords, knives, etc.),</li>
<li style="list-style:none; padding-left:2em;">&#9632; <strong>carpentry tools</strong> (axes, chisels, adzes), and</li>
<li style="list-style:none; padding-left:2em;">&#9632; <strong>Agricultural implements</strong> (sickles, hoes, coulters — the vertical blade fixed in front of a ploughshare).</li>
</ul>
<ul class="sub-list">
<li>&#9702; These objects reflect that <strong>agriculture was their primary occupation</strong> as a large number of iron tools necessary for agricultural activities are found at different sites.</li>
<li>&#9702; Other more elaborate objects found in burials may have had <strong>ritualistic functions.</strong></li>
<li>&#9702; The rich variety of iron objects enables us to understand the aspects of their economy and their way of life to a large extent.</li>
</ul>
<ul>
<li>&#8226; <strong>Copper, bronze, gold silver:</strong></li>
</ul>
<ul class="sub-list">
<li>&#9702; There are copper and bronze artefacts such as utensils, bowls, and bangles; a few silver and gold ornaments also occur.</li>
<li>&#9702; Copper was used for the production of vessels and ornaments.</li>
<li>&#9702; Though Adichannallur burials and Nilgiris yielded bronze objects the use of bronze at these two sites are exceptions.</li>
<li>&#9702; Ornaments were also made of gold.</li>
<li>&#9702; The use of silver was rather scarce.</li>
</ul>
<ul>
<li>&#8226; <strong>Different sorts of metallurgical techniques</strong> were used in the manufacture of metal artefacts.</li>
</ul>
<ul class="sub-list">
<li>&#9702; Some of the copper and bronze objects were evidently cast in moulds, others were hammered into shape.</li>
<li>&#9702; Some communities knew how to alloy metals.</li>
</ul>

<p><strong>(b) Woodcraft / Carpentry:</strong></p>
<ul>
<li>&#8226; <strong>The evidence shows that the axes, chisels, wedges, adzes, anvil, borers, hammer stones, etc.,</strong> formed the main tool-kit for working on the wood.</li>
<li>&#8226; The archaeo-botanical evidence shows that plant species like <strong>Acacia, Pinus, Brassica, Stellaria, Teak, Satinwood etc.</strong> were already known to these communities.</li>
<li>&#8226; The use of <strong>wooden plough</strong> for cultivation cannot be set aside. Even now, the tillage implement common in black cotton soil tracts, is the wooden plough.</li>
<li>&#8226; Wood was also used for posts in the construction of huts with thatched or reed roofs supported on <strong>wooden posts.</strong></li>
</ul>
<ul class="sub-list">
<li>&#9702; Post-holes are observed at Brahmagiri and Maski indicating the presence of timber construction for domestic buildings.</li>
</ul>
<ul>
<li>&#8226; There was an <strong>advanced stage of wooden architecture</strong> involving dressing of wood and creating different types of mortises and tenons.</li>
</ul>
<ul class="sub-list">
<li>&#9702; The common occurrence of these items suggests ample use of wood for construction and many other purposes.</li>
</ul>

<p><strong>(c) Ceramics (Pottery):</strong></p>
<ul>
<li>&#8226; The ceramic fabrics associated with the megalithic culture are:</li>
</ul>
<ul class="sub-list">
<li>&#9702; <strong>Black-and-Red Ware (BRW),</strong></li>
</ul>
<ul>
<li style="list-style:none; padding-left:2em;">&#9632; BRW, which is a wheel-turned pottery, consists of utilitarian shapes and a majority of the forms probably served as <strong>tableware</strong> of megalithic society.</li>
<li style="list-style:none; padding-left:2em;">&#9632; The prominent shapes encountered in this ware are varieties of bowls, dishes, lids or covers, vases, basins, legged jars and channel-spouted vessels.</li>
</ul>
<ul class="sub-list">
<li>&#9702; <strong>Burnished Black Ware,</strong></li>
</ul>
<ul>
<li style="list-style:none; padding-left:2em;">&#9632; The burnished black ware, which is also wheel-turned, comprises some prominent shapes such as elongated vases, tulip-shaped lids, funnel-shaped lids, goblets, spouted vessels, circular ring-stands, knobbed and rimmed lids with bird or animal finials.</li>
</ul>
<ul class="sub-list">
<li>&#9702; <strong>Red Ware,</strong></li>
</ul>
<ul>
<li style="list-style:none; padding-left:2em;">&#9632; In red ware the shapes are utilitarian which include legged vessels, double knobbed lids, ring-stands, dough plates and vases.</li>
</ul>
<ul class="sub-list">
<li>&#9702; <strong>Micaceous Red Ware,</strong></li>
</ul>
<ul>
<li style="list-style:none; padding-left:2em;">&#9632; The micaceous red ware exhibits typical shapes like pots with globular body and funnel-shaped mouth, dough plates and basins. Decoration in the form of cording, applique and painted designs have also been noticed.</li>
</ul>
<ul class="sub-list">
<li>&#9702; <strong>Grey Ware,</strong></li>
<li>&#9702; <strong>Russet Coated Painted Ware (RCPW)</strong></li>
</ul>
<ul>
<li style="list-style:none; padding-left:2em;">&#9632; Of all the types, the most attractive are the RCPW with wavy lines and other decorations. They are occasionally bearing post-firing graffiti. Russet-coated jars are recovered from several sites.</li>
</ul>
<ul>
<li>&#8226; Some pots with lids with decorated finials in the shape of birds or animals appear to be <strong>ceremonial wares.</strong></li>
<li>&#8226; All these varieties of pottery are characterised by a <strong>fine fabric</strong> and are produced from well levigated clay rarely with sand or such gritty material. They were well fired in open kilns at low temperature.</li>
<li>&#8226; The <strong>evidence of pottery kilns from sites, such as Polakonda and Beltada Banahalli</strong> can be taken as supportive evidence for the practice of this craft.</li>
<li>&#8226; The technical efficiency evident in the preparation of these ceramics or potteries might hint at a <strong>professional class of potters</strong> and pottery making as one of the important economic activities.</li>
</ul>

<p><strong>(d) Miscellaneous (Bead making, Mat weaving, Stone cutting, Terracotta making, Rock art, etc.):</strong></p>
<ul>
<li>&#8226; <strong>Bead making.</strong></li>
</ul>
<ul class="sub-list">
<li>&#9702; A number of objects ranging from single <strong>terracotta beads to very finely manufactured gold ornaments</strong> were used by the megalithic folk for their <strong>personal decoration.</strong></li>
<li>&#9702; Grave goods included etched carnelian beads and of other material as well.</li>
<li>&#9702; The <strong>evidence of the bead making industry attested at two megalithic sites — Mahurjhari and Kodumanal,</strong> are suggestive of the practice of this craft.</li>
<li>&#9702; The availability of a large variety of beads show that agate, carnelian, chalcedony, feldspar, coral, crystal, garnet, jasper, tremolite, magnesite, faience, paste martz, serpentine, shell, steatite, amethyst and terracotta were utilised in the preparation of beads of different exquisite shapes.</li>
<li>&#9702; Apart from the use of semi-precious stones, some of the shapes have also been worked on precious metals like gold, shell, horn, bone and glass.</li>
</ul>
<ul>
<li>&#8226; <strong>Mat weaving:</strong></li>
</ul>
<ul class="sub-list">
<li>&#9702; The mat <strong>impressions left on the base of jars</strong> at sites like Managondanahalli and Nagarjunakonda indicate that the art of mat-weaving was practised.</li>
</ul>
<ul>
<li>&#8226; <strong>Stone cutting:</strong></li>
</ul>
<ul class="sub-list">
<li>&#9702; The activity of stone-cutting is attested by:</li>
</ul>
<ul>
<li style="list-style:none; padding-left:2em;">&#9632; the <strong>chisel impressions</strong> noticed at Borgaon Khurd (Maharashtra) on a stone trough,</li>
<li style="list-style:none; padding-left:2em;">&#9632; excellent <strong>laterite cutting</strong> evidenced in rock-cut chamber tombs of Kerala region,</li>
<li style="list-style:none; padding-left:2em;">&#9632; <strong>chamber tombs</strong> in North Karnataka and</li>
<li style="list-style:none; padding-left:2em;">&#9632; the occurrence of <strong>domestic stone artefacts</strong> such as pestles, mortars, saddle querns, etc., at many megalithic sites.</li>
</ul>
<ul>
<li>&#8226; <strong>Toy:</strong></li>
</ul>
<ul class="sub-list">
<li>&#9702; <strong>Terracotta</strong> discs, figurines, gamesmen, <strong>miniature pottery</strong> vessels found from graves attest their use as toys for entertainment of children.</li>
</ul>
<ul>
<li>&#8226; <strong>Painting:</strong></li>
</ul>
<ul class="sub-list">
<li>&#9702; The <strong>engravings and paintings on the megaliths</strong> in peninsular India, proves that these megalith builders were the authors of these paintings.</li>
<li>&#9702; There is evidence in Sangam literature also, of the erection of burial stones with paintings as well as writings.</li>
</ul>
<ul>
<li>&#8226; Thus, we can say that the megalithic people practised many other craft industries apart from highly specialised agro-pastoral economy. The divergent economic patterns, which seem to have prevailed then, were not isolated but had a symbiotic relationship with each other.</li>
</ul>

<h2>Trade and Exchange Network</h2>
<ul>
<li>&#8226; Some megalithic sites must have been centres of craft production linked to networks of exchange.</li>
</ul>
<ul class="sub-list">
<li>&#9702; This is suggested by the location of <strong>several large megalithic settlements on the trade routes of the early historical period.</strong></li>
</ul>
<ul>
<li>&#8226; The excavations have yielded various <strong>non-local items</strong> among the grave goods which reflect that there were exchange activities during the megalithic period.</li>
</ul>
<ul class="sub-list">
<li>&#9702; <strong>Carnelian beads</strong> reported from coastal sites, which were points of exchange in ancient times.</li>
<li>&#9702; The availability of bronze suggests the <strong>arrivals of copper and an alloy, either tin or arsenic,</strong> from somewhere.</li>
<li>&#9702; From the <strong>Graeco-Roman writings</strong> and the <strong>Tamil texts</strong> it is clear that <strong>at a little later period maritime exchange was the major source for procuring them.</strong></li>
<li>&#9702; The archaeological remains like <strong>rouletted ware, amphora and other ceramic materials</strong> found at many sites like those at Arikamedu are evidence for this.</li>
<li>&#9702; Inter-regional and intra-regional exchange of goods were fairly well established in South India by the <strong>3rd c. B.C.</strong></li>
</ul>
<ul>
<li>&#8226; <strong>Regional variation in the production of commodities and the non-availability of local raw materials/finished goods had resulted in long-distance transactions under the initiative of the long-distance traders from the Gangetic region as well as the overseas world.</strong></li>
</ul>
<ul class="sub-list">
<li>&#9702; The exchange network which was in an incipient state during the early iron age expanded over the centuries as a result of internal dynamics and external impetus involving the demand for goods in other parts of the subcontinent as well as the Mediterranean region.</li>
<li>&#9702; It was a network across land and seas with long-distance traders in the middle and unevenly developed people at either side.</li>
</ul>

<h2>Social Organisation and Settlement Pattern</h2>
<ul>
<li>&#8226; It is not archaeology but <strong>anthropology,</strong> which provides us <strong>evidence to assume the possibility of production relations transcending clan and kinship ties</strong> in such remote periods of tribal descent groups.</li>
</ul>
<ul class="sub-list">
<li>&#9702; They point to the material culture of diverse forms of subsistence such as hunting/gathering and shifting cultivation besides the production of a few craft-goods.</li>
</ul>
<ul>
<li>&#8226; The <strong>variations observed in the external and internal features of the burials</strong> reflect that the Iron Age society of the megalithic people was <strong>not a homogenous entity.</strong></li>
<li>&#8226; Some of the relatively huge burial types are suggestive of <strong>status differentiation and ranking</strong> of the buried individuals.</li>
</ul>
<ul class="sub-list">
<li>&#9702; <strong>Differences in the types and contents of the burials</strong> suggest that there was some sort of disparity in the attributes of the buried individuals.</li>
<li>&#9702; The number of more elaborate burials like the <strong>multi-chambered rock-cut tombs at many sites, are limited.</strong> Moreover, these have yielded <strong>rare artefacts made of bronze or gold.</strong></li>
</ul>
<ul>
<li style="list-style:none; padding-left:2em;">&#9632; On the other hand, <strong>many of the burials are simple urn burials</strong> with a very few artefacts.</li>
</ul>
<ul class="sub-list">
<li>&#9702; The <strong>variety, high quality and fineness of ceramic goods in huge burials</strong> including the elaborate urn burials, are also suggestive of the difference in social status.</li>
</ul>
<ul>
<li style="list-style:none; padding-left:2em;">&#9632; An individual's treatment after death bears some predictable relationship to the individual's state in life and to the organisation of the society to which the individual belonged.</li>
</ul>
<ul>
<li>&#8226; The megalithic people lived in <strong>villages consisting of sizable populations.</strong></li>
</ul>
<ul class="sub-list">
<li>&#9702; <strong>Though they had a bias for urban life, they were slow in building huge cities like their contemporaries in the Gangetic Valley.</strong></li>
<li>&#9702; <strong>The large size of the population is indicated by the organised mass of manual labour</strong> that was available for transporting and housing massive blocks of stone in the construction of cists, dolmens and other types of megaliths, or in erecting large rubble and earthen mounds across the water courses for storing up rain waters for irrigation purposes.</li>
<li>&#9702; The large size of population is further attested by the fact that <strong>extensive burial grounds with numerous graves,</strong> many of them containing the remains of more than one individual, and occasionally of as many as 20 or more individuals, have been found.</li>
</ul>
<ul>
<li>&#8226; <strong>Houses:</strong></li>
</ul>
<ul class="sub-list">
<li>&#9702; The houses in which the megalithic people lived probably consisted of <strong>huts with thatched or reed roofs, supported on wooden posts</strong> as indicated by the presence of post-holes in the excavated sites.</li>
<li>&#9702; Post-holes were found at Brahmagiri and Maski indicating the presence of timber construction for ordinary buildings.</li>
</ul>
<ul>
<li>&#8226; <strong>Distribution of settlements:</strong></li>
</ul>
<ul class="sub-list">
<li>&#9702; <strong>An increase in the size and number of settlements</strong> during the megalithic period from the preceding neolithic/chalcolithic phase and <strong>growing use of different metallic resources</strong> were certainly not independent developments.</li>
<li>&#9702; This can be observed in the effect of the spread of <strong>plough cultivation</strong> which produced major alterations in the structure and distribution of settlements.</li>
<li>&#9702; An analysis on the locational context and the distribution patterns of these sites strongly indicates a <strong>growing inclination towards intensive-field cropping methods.</strong></li>
<li>&#9702; The <strong>maximum concentration of sites in river valleys</strong> and basins and <strong>preference shown towards occupying black soil, red sandy-loamy soil zones</strong> also supports this contention.</li>
<li>&#9702; The distribution pattern of these sites in rainfall zones where the average annual precipitation is <strong>600-1500 mm,</strong> also hints to the same conclusion.</li>
<li>&#9702; <strong>Village transhumance</strong> was present, as attested to by the location of most of the settlements on the banks of rivers and that of most of the burial sites within a distance of <strong>10-20 km from major water resources.</strong></li>
</ul>

<h2>Religious Beliefs and Practices</h2>
<ul>
<li>&#8226; The elaborate architecture of their graves, the grave goods and other metal and stone objects throw light on the religious beliefs of megalithic people.</li>
<li>&#8226; <strong>Cult of dead:</strong></li>
</ul>
<ul class="sub-list">
<li>&#9702; The megalithic people had <strong>great veneration for the dead</strong> as they constructed these monuments with great effort and devotion.</li>
<li>&#9702; They believed that the dead had a <strong>life after death</strong> and the living had to provide them with their necessities.</li>
</ul>
<ul>
<li style="list-style:none; padding-left:2em;">&#9632; The grave goods indicate that they belonged to the dead man in life and since they were required for his/her use in the other world, they were buried along with the mortal remains.</li>
</ul>
<ul class="sub-list">
<li>&#9702; All these certainly reflect that the <strong>'cult of the dead'</strong> had a strong hold on the people.</li>
<li>&#9702; The grave goods represented the affection and respect of the living for their dead.</li>
</ul>
<ul>
<li>&#8226; <strong>Animism:</strong></li>
</ul>
<ul class="sub-list">
<li>&#9702; Their belief in animism is reflected in animistic cults. This is evident by the <strong>occurrence of animal bones of domestic animals</strong> like cattle, sheep/goats <strong>and wild animals</strong> like the wolf <strong>in megaliths.</strong></li>
<li>&#9702; It seems that these animals were <strong>killed for the funeral-feast</strong> and the skeletal remains were buried in the graves, or they were sacrificed and buried in the graves to supply food for the dead.</li>
<li>&#9702; Animism is also reflected by <strong>terracotta figurines of animals decorated with garlands and ornaments.</strong></li>
</ul>
<ul>
<li>&#8226; <strong>Sangam literature,</strong> which is contemporaneous with the end phase of the megalithic culture in South India, also throws light on the <strong>different methods of disposal of the dead</strong> prevalent among the megalithic people.</li>
</ul>
<ul class="sub-list">
<li>&#9702; Many of the earlier beliefs continued during the Sangam age.</li>
<li>&#9702; So, we may assume that the religious practices referred to in the Sangam literature reflect, to an extent, those that prevailed among the megalithic people.</li>
<li>&#9702; The tradition of associating stone with the dead has survived in South India till late times and the <strong>hero stones or Virakal and Mastikal</strong> are examples of this.</li>
</ul>

<h2>Polity</h2>
<ul>
<li>&#8226; The <strong>differences in the size of monuments</strong> and the nature of the grave valuables reflecting differentiation in status and ranking, also suggest the nature of contemporary political power.</li>
<li>&#8226; The construction of a huge monument involving the <strong>mobilisation of substantial collective labour</strong> implies the power of the buried individual to command it.</li>
<li>&#8226; In the light of the fact that the <strong>contemporary people were tribal descent groups, we may assume the prevalence of chiefly power, i.e. chiefdoms.</strong></li>
<li>&#8226; <strong>The Late phase of the megalithic culture coincides with the Early historical period</strong> as reflected by the excavation at many sites. So, the <strong>Sangam works also help</strong> us in understanding the period.</li>
</ul>
<ul class="sub-list">
<li>&#9702; The <strong>chief</strong> of the tribal group is referred to as <strong>Perumakan (great son)</strong> in the literary texts.</li>
<li>&#9702; <strong>He commanded the entire material and cultural resources of his clan.</strong></li>
<li>&#9702; This attests that these elaborate burials probably were of the chiefs or descent heads.</li>
</ul>
<ul>
<li>&#8226; <strong>This period witnessed numerous small chiefdoms co-existing and contesting against one another and anticipating the emergence of big chiefdoms by the turn of the Christian era.</strong></li>
</ul>
<ul class="sub-list">
<li>&#9702; The megalithic people had been <strong>interacting and exchanging material and cultural goods</strong> with one another.</li>
</ul>
<ul>
<li style="list-style:none; padding-left:2em;">&#9632; There was <strong>need-oriented and use-value based interaction</strong> at the level of clans.</li>
</ul>
<ul class="sub-list">
<li>&#9702; <strong>But at the level of chiefs it was competitive</strong> and hence a <strong>combative</strong> process of <strong>plundering raids,</strong> both inter-clan and intra-clan, led by chiefs for predatory control.</li>
</ul>
<ul>
<li style="list-style:none; padding-left:2em;">&#9632; This led to <strong>subjugation</strong> of one chief by the other which in turn helped the <strong>emergence of bigger chiefs</strong> and the formations of bigger chiefdoms.</li>
<li style="list-style:none; padding-left:2em;">&#9632; This is testified by the <strong>prestige goods and varieties of ceramics</strong> and other artefacts found in the graves.</li>
</ul>
<ul>
<li>&#8226; These armed fights among the clans must have resulted in the <strong>death of many chiefs and warriors.</strong></li>
</ul>
<ul class="sub-list">
<li>&#9702; Probably, this was the reason for erecting <strong>numerous sepulchral monuments</strong> during the megalithic period.</li>
<li>&#9702; This also accounts for the emergence of the <strong>cult of heroism and ancestral worship.</strong></li>
</ul>
<ul>
<li>&#8226; Through armed confrontation and predatory subjugation the cultural and political power of a few chiefdoms became more evolved over the years and they emerged as bigger chiefdoms.</li>
</ul>
<ul class="sub-list">
<li>&#9702; We can infer that the <strong>last phase of the megalithic period which is contemporaneous to the Sangam period, marked the march towards bigger chiefdoms as mentioned in Tamil heroic texts.</strong></li>
</ul>

<h2>Legacy of the Megalithic Culture</h2>
<ul>
<li>&#8226; Megalithism is <strong>still alive</strong> amongst different tribes in India, for example:</li>
</ul>
<ul class="sub-list">
<li>&#9702; the Maria Gonds of Bastar in Madhya Pradesh,</li>
<li>&#9702; the Bondos and Gadabas of Orissa,</li>
<li>&#9702; the Oraons and Mundas of Chotanagpur region of Jharkhand, and</li>
<li>&#9702; the Khasis and Nagas of Assam.</li>
</ul>
<ul>
<li>&#8226; Their monuments, which are of a memorial nature, include dolmens, stone-circles and menhirs.</li>
<li>&#8226; <strong>The North-east Indian megalithic culture seems to have a South-east Asian affiliation rather than the western influence.</strong></li>
<li>&#8226; <strong>In South Indian context, the remnants of megalithism among the Todas of Nilgiris are very significant.</strong></li>
</ul>
<ul class="sub-list">
<li>&#9702; It helps us in understanding the probable customs that existed among the now extinct megalithic builders of South India.</li>
<li>&#9702; The existing burial practices of the Todas include many common features of the megalithic burials with grave goods including food items and the use of stone circles to mark the place of the burial.</li>
</ul>

<h2>Limitations of the Sources for the Study of Megalithic Culture</h2>
<ul>
<li>&#8226; The major problem that comes in the way of studying megalithic culture is the <strong>form in which the sources are available</strong> to us.</li>
<li>&#8226; Firstly, as <strong>almost the whole of our evidence is collected from the burials,</strong> the knowledge about the conditions and methods of their everyday life is necessarily limited to the evidence supplied by their grave furniture and the various inferences that can be drawn from the observation of the architecture of the graves and connected considerations.</li>
<li>&#8226; The <strong>literary evidence</strong> which includes the accounts of Graeco-Roman writers and the ancient Tamil texts (Sangam literature) have their own limitations as their <strong>period marks the end phase of the megalithic culture.</strong></li>
<li>&#8226; <strong>Vertical digging</strong> in excavations of different habitation sites with the aim of unfolding the cultural sequence of these sites provides us with evidence, which is <strong>scant and limited</strong> in nature.</li>
<li>&#8226; Moreover, the <strong>lack of settlement remains</strong> associated with the burials is the frequently raised issue in the context of the peninsular Indian megaliths.</li>
</ul>
<ul class="sub-list">
<li>&#9702; Due to the absence of habitation sites in regions like Kerala, the analysis of the settlement pattern of the megalithic culture has become a difficult task.</li>
<li>&#9702; The settlement sites could have provided a variety of evidence in addition to the stratigraphic data for separating periods of various culture strands, thus, making the reconstruction of the cultural history of megalithic people more elusive.</li>
</ul>
<ul>
<li>&#8226; <strong>Some have even questioned the authenticity of the megaliths as a burial.</strong></li>
</ul>

<h2>Megalithic Culture as a Foundational Phase of Peninsular India</h2>
<ul>
<li>&#8226; <strong>Beginning of the sedentary life</strong></li>
</ul>
<ul class="sub-list">
<li>&#9702; Megalithic communities lived on a combination of agriculture, hunting, fishing, and animal husbandry.</li>
<li>&#9702; There is also evidence of craft traditions.</li>
<li>&#9702; These features, along with the megalithic monuments themselves, suggest sedentary living.</li>
</ul>
<ul>
<li>&#8226; <strong>Widespread use of iron</strong></li>
</ul>
<ul class="sub-list">
<li>&#9702; Iron objects generally outnumber objects made of other metals.</li>
<li>&#9702; The large volume and variety of iron artefacts include utensils, weapons (arrowheads, spearheads, swords, knives, etc.), carpentry tools (axes, chisels, adzes, etc.), and agricultural implements (sickles, hoes, coulters).</li>
</ul>
<ul>
<li>&#8226; <strong>Well-developed traditions of specialized crafts</strong></li>
</ul>
<ul class="sub-list">
<li>&#9702; Different kinds of pottery have been found, including BRW.</li>
<li>&#9702; There is also evidence of bead making. Grave goods include etched carnelian beads and beads of other materials as well.</li>
<li>&#9702; There are copper and bronze artefacts such as utensils, bowls, and bangles; a few silver and gold ornaments also occur.</li>
</ul>
<ul>
<li>&#8226; <strong>Development of metallurgy</strong></li>
</ul>
<ul class="sub-list">
<li>&#9702; Different sorts of metallurgical techniques were used in the manufacture of metal artefacts. Some of the copper and bronze objects were evidently cast in moulds, others were hammered into shape.</li>
<li>&#9702; Some communities knew how to alloy metals. There is also evidence of local smelting of iron at Paiyampalli.</li>
</ul>
<ul>
<li>&#8226; <strong>Beginning of trade</strong></li>
</ul>
<ul class="sub-list">
<li>&#9702; Some megalithic sites were centres of craft production linked to networks of exchange. This is suggested by the location of several large megalithic settlements on the trade routes of the early historical period.</li>
<li>&#9702; Interregional trade is also suggested by the distribution of non-local items of precious metals and semi-precious metals.</li>
</ul>
<ul>
<li>&#8226; <strong>Rock paintings</strong></li>
</ul>
<ul class="sub-list">
<li>&#9702; Paintings found at the megalithic sites show fighting scenes, cattle raids, hunting scenes, scenes of people dancing in groups, horse raiders, flora, birds, sun motifs etc.</li>
</ul>
<ul>
<li>&#8226; <strong>Community work</strong></li>
</ul>
<ul class="sub-list">
<li>&#9702; The construction of the megaliths must have involved community endeavour. These monuments must have been sites of rituals that formed an important part of the social and cultural lives of people.</li>
<li>&#9702; The practice of making megaliths continues among certain tribal communities of India.</li>
</ul>"""

with open('lib/noteContent.ts', 'r') as f:
    content = f.read()

pattern = rf"('{re.escape(SLUG)}':\s*`)([^`]*)(`)"

def replacer(m):
    return f"'{SLUG}': `{NEW_HTML}`"

new_content = re.sub(pattern, replacer, content, flags=re.DOTALL)

with open('lib/noteContent.ts', 'w') as f:
    f.write(new_content)

print(f"Done! Injected: {SLUG}")
