import re

with open("lib/noteContent.ts", "r") as f:
    content = f.read()

html = """<h1>Stone Ages</h1>

<h2>Prehistory, Proto-history and Historical Period</h2>

<ul>
<li>• Prehistory refers to a period, for the study of which, only archaeological evidence is available while literary evidence is totally absent.</li>
<li>• We find two different definitions for the proto-historical period.
<ul>
<li>◦ According to the first definition, literary evidence is available for studying the proto-historic period but is not being utilised or is not contemporary; for example, the Harappan and Vedic period.
<ul>
<li>◦ The Harappan script has not been deciphered yet and the Vedic people had dialects or languages but they did not have a script.</li>
</ul>
</li>
<li>◦ According to the second definition, the proto-historic period is supposed to have started with the beginning of agriculture.
<ul>
<li>◦ Based on this criterion, even the Neolithic and Chalcolithic periods come under the purview of proto-history.</li>
</ul>
</li>
</ul>
</li>
<li>• The historical period refers to that phase, for the study of which, both the archaeological evidence and literary evidence are available. It starts from 600 BCE onwards for India.</li>
</ul>

<h2>Development of Human Civilisation</h2>

<ul>
<li>• Manufacturing and using tools is the criterion upon which archaeologists recognise ancient humans. The first evidence of tools is available roughly from 2.5 million years ago.</li>
<li>• The Humans (Genus: Homo) first evolved in East Africa about 2.5 million years ago (m.y.a), after which, they migrated outwards from Africa.</li>
<li>• Then, about 150000 years ago, Homo Sapiens (Wise Man) appeared in East Africa first; then, their migration out of Africa started from about 150000–120000 years ago.</li>
<li>• Currently, the entire Human Civilisation is the Homo Sapiens civilisation.</li>
<li>• Human civilisation is supposed to have evolved through three different phases:
<ol>
<li>Stone Age</li>
<li>Copper Age</li>
<li>Iron Age</li>
</ol>
</li>
</ul>

<h2>Stone Age</h2>

<ul>
<li>• The Stone Age consists of the Paleolithic period, the Mesolithic period and the Neolithic period. This categorization is based on the changing climate, changes in the flora and fauna, type and technology of the stone tools and the subsistence base.</li>
<li>• During the Paleolithic period, human beings were in the hunting and food-gathering stage, while during the Neolithic period, they had reached the food-producing stage.</li>
</ul>

<p>As a phase of transition between these two periods, some scholars have conceived a new period, that is the Mesolithic period.</p>

<ul>
<li>• We should remember that there is a great deal of variation in the dates for the different sites.
<ul>
<li>◦ For example, recently at Attirampakkam near Chennai, the transition from the lower Paleolithic to the Middle Paleolithic was observed in the artefacts dated around 385000 years ago. Before this, the earliest transition we saw was pegged around 125000 years ago.</li>
</ul>
</li>
<li>• Palaeolithic age sites belong to the Pleistocene geological era (the last ice age) and the Mesolithic era onwards, we are living in the Holocene geological era (the period of deglaciation).</li>
</ul>

<h2>1. Paleolithic Period (5 Lakh BCE to 10,000 BCE)</h2>

<ul>
<li>• During this entire period, the Pleistocene or the last ice age (2.6 m.y.a.–11700 years ago) was going on and the climate was harsh. Glaciers covered a much larger part of the globe. But gradually climatic conditions improved and conditions became conducive to life.</li>
<li>• On the basis of climatic change and the use of technology, even the Paleolithic period could be divided into three sub-periods, namely lower, middle and upper Paleolithic ages.</li>
</ul>

<h3>a- Lower Paleolithic Period</h3>

<ul>
<li>• It covers a long time period i.e. from 5 Lakh BCE to 50,000 BCE.</li>
<li>• During this period, the climate was particularly cold and people were mainly using the 'Core implements' for hunting and food gathering.</li>
<li>• The Hand axe and cleavers were the main tools. Chopper was also an important tool.</li>
<li>• Palaeolithic sites have been unearthed from almost all parts of the Indian subcontinent except the Gangetic basin region and the forested regions of Kerala.</li>
</ul>

<p>From about 3 lakh years ago, Homo Erectus, Neanderthals and the forefathers of modern human beings were using fire on a regular basis.</p>

<ul>
<li>• Stone tools are the most viable archaeological key to getting an insight into the lives of the Stone Age foragers.
<ul>
<li>◦ So, it is very important to understand what the different key terms used to describe different kinds of tools mean.</li>
<li>◦ When a piece of stone is broken into two, the larger part is called the core and the smaller part is called the flake.</li>
<li>◦ Chipping out small pieces from a piece of stone in order to turn it into a usable tool is called flaking.</li>
</ul>
</li>
<li>• Early Palaeolithic tools were fairly large core tools made of quartzite stone, which is not so amenable to chipping and flaking.
<ul>
<li>◦ A stone hand axe is a core tool, which is usually worked on both sides, i.e. it is a bi-face.</li>
<li>◦ A pebble hand axe (made from pebbles) has only one side chipped away.
<ul>
<li>◦ These hand axes could be used alone or they could be tied on a piece of wood.</li>
</ul>
</li>
<li>◦ A chopper is usually a core implement and it is flaked on only one side to produce a tool which then can be used to chop pieces of meat.
<ul>
<li>◦ It is a uni-facial tool.</li>
</ul>
</li>
<li>◦ A cleaver is a flattish tool made out of rectangular/triangular flakes; which has one straight cutting edge.</li>
<li>◦ Acheulian tools represent an advanced stage of the lower Paleolithic tools which have symmetrical flaking on both sides of the hand axes and cleavers.</li>
</ul>
</li>
</ul>

<h3>b- Middle Paleolithic Period</h3>

<ul>
<li>• It is supposed to have started around 50,000 BCE and lasted approximately till 30,000 BCE.</li>
<li>• By this time, the climate was more comfortable.</li>
<li>• Above all, one can underline the change in the nature of tools.
<ul>
<li>◦ In place of the 'core implements' the overall balance shifted towards making the lighter flake implements, some of them actually made by preparing the core part itself.</li>
</ul>
</li>
<li>• The Levallois technique (named after a suburban area in Paris) is an advanced way of making flake tools from the core part itself.</li>
</ul>

<h3>c- Upper Paleolithic Period</h3>

<ul>
<li>• It started from about 30,000 BCE and continued till about 10,000 BCE.</li>
<li>• The climate became warmer and more favourable.</li>
<li>• In tools, there was a preponderance of the flake implements now.</li>
<li>• The main tools during this period were blades, scrapers and burins (they may have been used to engrave tools or to make grooves in the wood/bone handles in which stone tools would then be hafted).</li>
<li>• Apart from that, along with the use of stone tools, the use of bone tools and wooden tools became more frequent, perhaps because of climate change.</li>
<li>• The most important technical advance of the upper Paleolithic age is the double-sided blade.
<ul>
<li>◦ Needle: made of bone and used for sewing.</li>
<li>◦ Perforator: used for making holes in hides.</li>
<li>◦ Harpoon: used for fishing.</li>
<li>◦ Spear thrower: used to throw javelins.</li>
</ul>
</li>
</ul>

<h3>Occupation</h3>

<ul>
<li>• Food gathering and hunting were the main occupations of the time.</li>
<li>• Earlier, it was believed that hunting was more important in their life than food gathering but, on the basis of new research, it was proved that food gathering was more important than hunting.
<ul>
<li>◦ This is because the meat rots fairly quickly but food gathered from the jungle or plucked from the trees would last longer.</li>
</ul>
</li>
<li>• Ancient foragers gathered other things like wood, bamboo and stones for making tools. All this required a very keen understanding of the environment in which they lived.</li>
</ul>

<h3>Palaeolithic Society and Culture</h3>

<ul>
<li>• Man was in the hunting and food-gathering stage during this period. The Palaeolithic people did not lead a sedentary life and they moved from one place to the other as per the availability of food.</li>
<li>• Their technology was quite rudimentary and they had as yet, not established dominance over their environment.
<ul>
<li>◦ Thus, it is obvious that the human population was quite low.</li>
</ul>
</li>
<li>• For much of the Palaeolithic age, humans were solitary beings.
<ul>
<li>◦ They competed with each other for resources such as food, shelter, territory and sexual partners.</li>
<li>◦ In some instances, they may have formed small groups of 2-4, for the purpose of security.</li>
<li>◦ As such, the concept of society had not developed initially.</li>
</ul>
</li>
<li>• It was towards the end of the Palaeolithic age, when the climate and human technology began improving, that they began living in small bands of 20-40.
<ul>
<li>◦ Thus, the Upper Paleolithic society represented a band society. It was the initial phase of human society and co-operation.</li>
<li>◦ Evidence from the early cave paintings of Bhimbetka throws some light on the scope of human socio-economic activities.</li>
</ul>
</li>
<li>• The society was egalitarian in nature and resources were used collectively. The concept of a permanent head or leader had not evolved yet.</li>
<li>• It is believed that the origin of the art, religion, socio-political institutions etc. lay in the cognitive revolution, which happened among Homo sapiens around 70,000 years ago.
<ul>
<li>◦ Before this cognitive revolution, our learning, memory and communication abilities were far more limited. This cognitive revolution in our neural network took us out of the traffic jam of genetic evolution and put us on the fast lane of cultural development.</li>
<li>◦ The first reliable evidence of art, religion and commerce from around the world began to appear during this period.
<ul>
<li>◦ E.g. a statue of a goddess was unearthed from Lohadanala (Belan Valley).</li>
<li>◦ A sketch on an ostrich eggshell was found from Patne (Maharashtra).</li>
<li>◦ Apart from this, the early cave paintings of Bhimbetka belonged to the Upper Paleolithic period.</li>
</ul>
</li>
</ul>
</li>
</ul>

<h2>2. Mesolithic Period (10,000 BCE to 6000 BCE)</h2>

<ul>
<li>• It is the phase of transition from the Paleolithic to the Neolithic period.</li>
<li>• The climatic, technological and occupational changes work as the dividing line between the Paleolithic period and the Mesolithic period.</li>
<li>• The Pleistocene ice age was now over. The beginning of the Mesolithic period corresponds to the beginning of the Holocene age which started roughly from 10,000 BCE.
<ul>
<li>◦ During this period the climate became drier and warmer.</li>
</ul>
</li>
<li>• The use of microliths is another defining feature of the beginning of the Mesolithic period.
<ul>
<li>◦ But, in some cases, the usage of microliths started in the upper Paleolithic stage itself, e.g. Patne.</li>
<li>◦ Also, microliths continued to be used in the historical period.</li>
</ul>
</li>
</ul>

<h3>Technological Advancement</h3>

<ul>
<li>• During the Mesolithic period, people started using tools and implements of better quality, known as Microliths i.e., small stone implements.
<ul>
<li>◦ Normally, Microliths were about 1 cm to 5 cm in size and these tools were grafted either to wood or bone.</li>
<li>◦ Microliths were mostly triangular in shape.</li>
<li>◦ As a result of such changes, there was the development of weapons like bows and arrows.</li>
</ul>
</li>
</ul>

<h3>Occupations</h3>

<ul>
<li>• Even during this phase, people continued to hunt and gather food.
<ul>
<li>◦ Although they were not in the food-producing stage yet, there was definitely a change in the method of hunting and gathering.</li>
</ul>
</li>
<li>• A warmer climate meant more ecological diversity.
<ul>
<li>◦ Now, there was more to hunt from and more to gather from. Overall, there were more food sources.</li>
</ul>
</li>
<li>• Apart from that, the invention of bows and arrows led to the hunting of fast-moving birds and animals.</li>
<li>• Further, fishing led to better food availability.
<ul>
<li>◦ There is archaeological evidence which proves that permanent fishing villages were the first permanent human settlements in history.</li>
<li>◦ Fishing villages appeared along the Indonesian coastline as early as 45,000 years ago.</li>
</ul>
</li>
</ul>

<p>Overall, these changes resulted in the growth of population and the number of settlements associated with this period expanded in different parts of the Indian subcontinent.</p>

<ul>
<li>◦ Generally, during this period, human settlements spread into new areas where the climate was earlier prohibitive.</li>
</ul>

<ul>
<li>• As a phase of transition, it had some features of the Neolithic period as well.
<ul>
<li>◦ E.g. Although people didn't start the domestication of animals on a regular basis but from Bagor (Rajasthan) and Adamgarh (M.P) we find the earliest evidence of domestication of animals.</li>
<li>◦ Likewise, people didn't start to lead a settled life, but possibly they had started to spend more time at those locations where food was more easily available.
<ul>
<li>◦ That's why from the sites of Sarai Nahar Rai and Mahadaha (U.P), we can trace some evidence of uprooted bamboo which was meant for house-making.</li>
</ul>
</li>
</ul>
</li>
<li>• Apart from that, although the use of pottery became a common phenomenon from the Neolithic period onwards, we find the earliest evidence of the use of pottery from the Mesolithic sites of Chopani Mando (Belan Valley - U.P) and Langhnaj (Gujarat).</li>
</ul>

<h3>Mesolithic Society and Culture</h3>

<ul>
<li>• Even the Mesolithic society is an example of a band society.
<ul>
<li>◦ Although, the average size of a band must have increased.</li>
<li>◦ Because, the availability of more food meant a longer life span, meaning that the number of members in the band increased.</li>
</ul>
</li>
<li>• The concept of the family further evolved during the Mesolithic period.
<ul>
<li>◦ Initially, every member of the group would go hunting. But now the older members stayed back at those semi-permanent locations and looked after the children. Thus, the concept of family evolved.</li>
</ul>
</li>
<li>• During this period human cultural sense also evolved.
<ul>
<li>◦ This consciousness represented itself in the form of religion and art e.g. a statue of a goddess was unearthed from Bagor (Rajasthan).</li>
<li>◦ In the same way, jewellery became more elaborate e.g. a necklace made of animal horn was found from Mahadaha.</li>
</ul>
</li>
<li>• The tradition of burial of the dead body also started during this period.
<ul>
<li>◦ This reflects the development of a sense of respect for ancestors.</li>
<li>◦ Also, people now lived longer in one location. So, simply discarding the dead body near the site wasn't a good idea.</li>
</ul>
</li>
</ul>

<h3>Paintings</h3>

<ul>
<li>• Cave paintings were another major development of this period. These paintings are a combination of paintings and carvings.
<ul>
<li>◦ Although cave paintings appeared during the Upper Paleolithic period itself, by the Mesolithic period they became more diverse and vivid in nature.</li>
<li>◦ Paintings of this period are found from Bhimbetka (near Bhopal), Suhagighat (Mirzapur), Sundergarh and Sambalpur (Orissa) etc. Paintings are also found in Tamil Nadu, Karnataka and Andhra Pradesh.</li>
</ul>
</li>
<li>• Certain animals got special representation in the cave paintings of this time. These animals include deer, tortoise, rabbit, wolf, etc.</li>
<li>• Human representations are also found.</li>
<li>• They reflect the social life of the time. These pictures include scenes of hunting, group dance, musical instruments, family, pregnant women etc.</li>
<li>• Mesolithic paintings show the actual form of animals but the human representation is symbolic i.e. only an outline is drawn to represent a man.
<ul>
<li>◦ This could have some special meaning. The killing of animals might have created an emotional stress and no one wanted to be held responsible individually for the act.</li>
<li>◦ This may be the reason behind the absence of any individual representation of a hunter.</li>
</ul>
</li>
<li>• Paintings of females are clearer and closer to reality when compared to that of men.
<ul>
<li>◦ Women were responsible for food gathering, childbirth and child care etc.
<ul>
<li>◦ This represents our usual division of labour.</li>
<li>◦ But the social primacy seems to be in favour of women as food gathering was more important than hunting.</li>
</ul>
</li>
</ul>
</li>
<li>• Thus, we can conclude that Mesolithic paintings represented contemporary life.
<ul>
<li>◦ They reflect the economic and social activity of the time and also throw some light on human emotions.</li>
</ul>
</li>
<li>• The symbolism and diversity of these paintings resemble modern paintings although their nature is different.
<ul>
<li>◦ Mesolithic paintings portray the simple life and emotions of man while modern paintings are more complex reflecting the complications and intricacies of modern man.</li>
</ul>
</li>
<li>• However, whenever we try to interpret them, we should be careful not to project our modern perspective onto these Stone Age paintings. The world of thoughts, values and emotions is far more difficult to decipher.</li>
</ul>

<ul>
<li>• Scholars agree that the Stone Age foragers followed Animism.
<ul>
<li>◦ It is unlike any modern religion. It is based on the philosophy that every entity — living and non-living — has a soul/consciousness and it can communicate with human beings.</li>
<li>◦ But, this much information isn't enough to take a definite stand on the Stone Age religion.</li>
<li>◦ We have no way to tell which band of foragers worshipped which divine entity and in what manner.</li>
</ul>
</li>
<li>• We can tell about their dietary habits on the basis of the analysis of their bone structure, but did they accept the concept of private property? Were they monogamous?
<ul>
<li>◦ Perhaps, there is no way to find the right answers.</li>
<li>◦ Perhaps, there is no one right answer.</li>
<li>◦ Hence, our understanding of Stone Age culture is fairly limited.</li>
</ul>
</li>
<li>• The Stone Age should be more accurately called the wood age.
<ul>
<li>◦ Artefacts made from more perishable materials like wood, bamboo and leather, almost never survive.</li>
</ul>
</li>
<li>• Any reconstruction of the Stone Age society on the basis of the available archaeological evidence will be like trying to reconstruct the life of a 21st-century teenager only on the basis of his emails, without having any access to his Facebook page, text messages and internet browsing history.</li>
</ul>

<h2>3. Neolithic Period (6000 BCE onwards)</h2>

<ul>
<li>• The world's first agricultural villages appear on the scene around c. 8000 BCE.
<ul>
<li>◦ The earliest neolithic communities appeared in the areas of West Asia, the Indian Subcontinent, Thailand and South China.</li>
<li>◦ Later on, Peruvian highlands, Central America, Mexico, sub-Saharan Africa etc. emerged as the independent cradles of agriculture.</li>
<li>◦ So far as the latest evidence is concerned, agriculture developed independently in these cradles.</li>
</ul>
</li>
</ul>

<h3>Evidence</h3>

<ul>
<li>• The first instance of the domestication of any particular plant or animal species took place in their natural habitat.
<ul>
<li>◦ Only later, they were planted in secondary areas.</li>
</ul>
</li>
<li>• When a plant or animal species has been domesticated for many generations, some morphological changes show up.
<ul>
<li>◦ Archaeologists differentiate a domestic breed from a wild one on the basis of these changes.</li>
<li>◦ E.g. a domestic animal would have smaller teeth and its horns would shrink.</li>
</ul>
</li>
<li>• Also, animal bones or seeds found outside their natural habitation zones, age and sex ratio in the animal bones etc. give indirect hints towards domestication.</li>
<li>• Burnt seeds, impressions of seeds on clay or pottery etc. give evidence of agriculture.</li>
<li>• Pollen analysis and examination of soil constituents including the remains/fossils of the insects can inform us about the pattern of land use.</li>
<li>• However, not all kinds of seeds can survive long. E.g. root crops like potato, which have no solid parts.
<ul>
<li>◦ So, a community may have cultivated these crops, but, we simply can't tell.</li>
</ul>
</li>
<li>• Paintings can attest to Neolithic practices like harvesting, processing and cooking food.
<ul>
<li>◦ But, these are not conclusive as the paintings usually can't tell the difference between food gathering and producing.</li>
</ul>
</li>
</ul>

<h3>Features</h3>

<ul>
<li>• Some of the common features of a Neolithic community are:
<ul>
<li>◦ food production from both crop harvesting and animal rearing;</li>
<li>◦ using grounded and polished stone tools;</li>
<li>◦ widespread use of pottery;</li>
<li>◦ a greater degree of sedentary life in settled villages;</li>
<li>◦ a gender-based division of labour etc.</li>
</ul>
</li>
<li>• However, one might see the absence or presence of one or more of the activities mentioned above to different degrees in different ecological niches. In short, everything is relative.</li>
<li>• The Neolithic age marks a new stage in the relationship between human beings, plants and animals.
<ul>
<li>◦ When grain is harvested only to consume, that would be called the food gathering stage.
<ul>
<li>◦ But, when some of the harvested grains are stored for planting later, a community would then have officially reached the food-producing stage.</li>
</ul>
</li>
<li>◦ Similarly, when captured animals are bred in a confined environment, that would be called the stage of animal domestication.</li>
</ul>
</li>
<li>• Only those societies which depend substantially on domestication and/or agricultural activities can give birth to permanently settled — and relatively prosperous — villages.</li>
<li>• However, it is difficult to exactly tell the extent to which a community depended on these activities for their sustenance.</li>
</ul>

<h3>Technological Upgradation in the Neolithic Age</h3>

<ul>
<li>• During this period people started using polished stone tools — which were more efficient.
<ul>
<li>◦ Earlier, the stone tools were made by breaking the stone by striking it with the other stone. But, now they were made by rubbing one stone against the other. Such tools worked better in agrarian activities (increased efficiency).</li>
</ul>
</li>
<li>• This period is also linked with the invention of the wheel.</li>
</ul>

<h3>Occupations</h3>

<ul>
<li>• During this period, human beings moved from the hunting/food-gathering stage to the food-producing stage.
<ul>
<li>◦ Thus started animal rearing and agriculture.</li>
</ul>
</li>
<li>• This period also marks the start of the use of pottery on a much larger scale.
<ul>
<li>◦ They were made of clay and were meant for storing grains and cooking food.</li>
</ul>
</li>
<li>• Also, although on a limited scale, even trading activities started during this period.
<ul>
<li>◦ E.g. at certain sites we find some objects that were not locally available. It gives us a hint towards trading activities.</li>
</ul>
</li>
</ul>

<h3>Neolithic Society</h3>

<ul>
<li>• Food is not merely for eating. It is a means of creating social bonds and cooperation structures — within families and outside of it — which are crucial for the survival of the communities.
<ul>
<li>◦ By donating, gifting, hosting feasts and trading in food articles, community bonds of reciprocity are forged in smaller communities.
<ul>
<li>◦ A chieftain who receives tributes grants safety in return.</li>
<li>◦ A sorcerer asks for donations of food in return for performing spells etc.</li>
</ul>
</li>
</ul>
</li>
<li>• The earliest form of trade, the barter system, has food as the most important item of exchange.</li>
<li>• The evidence of community feasts at Budhihal reflects the socio-cultural values of the society based on agriculture.</li>
<li>• Food can impact ethics also.
<ul>
<li>◦ Hunter-gatherers had to eat what they found, immediately.</li>
<li>◦ But, farmers had to think long term.</li>
<li>◦ Planning for the future and giving it more importance comes to us naturally today.</li>
<li>◦ But, farmers may have had to acquire a new social attitude — and organise their entire society and life — around this new habit.</li>
<li>◦ Even today, we see the perpetual conflict between our rational thinking which encourages us to think long term and our impulsive self which seeks immediate gratification of human desires.
<ul>
<li>◦ Such conflicts inside a person created numerous anomalies like crime, bad eating habits, indiscipline in studies etc.</li>
</ul>
</li>
<li>◦ In short, food production had a profound impact on the social order.</li>
</ul>
</li>
<li>• The Neolithic age led to the development of early villages.
<ul>
<li>◦ Practically speaking, one might sense the need for a socio-political organisation to run the affairs of a settled village smoothly.
<ul>
<li>◦ How would people interact with each other?</li>
<li>◦ How would they deal with private property?</li>
<li>◦ How would they access shared resources like wells?</li>
</ul>
</li>
<li>◦ So, the social order, which is necessary for a settled community, needs social ranking.</li>
</ul>
</li>
<li>• The social and political organisation may have varied according to its size — smaller settlements with simpler socio-political order and larger ones living under more complex orders.</li>
<li>• In these villages, people used to live in houses made of wattle &amp; daub or mud brick huts.
<ul>
<li>◦ The size and design of houses also give us a hint of the social stratification.</li>
<li>◦ Some houses were round in shape while others were rectangular.
<ul>
<li>◦ So, it is assumed that the round-shaped houses, if also larger in size and less numerous, may have belonged to the local chief.</li>
</ul>
</li>
</ul>
</li>
<li>• Further, evidence of a granary from the site of Mehrgarh hints at an agrarian surplus.
<ul>
<li>◦ This might indicate the rise of chiefdom.</li>
</ul>
</li>
<li>• When precious goods are buried with the dead, it gives a hint of social rank.</li>
<li>• Food production didn't mean that communities stopped hunting and gathering.</li>
<li>• Ethnographic studies point out that, primarily women are associated with gathering and men are mostly associated with hunting.
<ul>
<li>◦ So, when the Neolithic communities first moved on to agriculture, the gatherers — the women — may have played a more proactive role, at least in the beginning.</li>
</ul>
</li>
</ul>

<h3>Neolithic Lifestyle</h3>

<ul>
<li>• It is difficult to tell which one is the net cause and which one is the net effect, sedentary lifestyle or food production.
<ul>
<li>◦ But, it is certain that the shift to food production increased the level of sedentariness.</li>
</ul>
</li>
<li>• A sedentary life and an agriculture-based diet meant less hardship for pregnant women and infants.
<ul>
<li>◦ Sedentary life was also suitable for the elderly.</li>
<li>◦ So, together these factors led to an increased birth rate and reduced death rate.</li>
<li>◦ So, the age profile of the Neolithic communities became more diverse.</li>
</ul>
</li>
<li>• But, it is debatable whether human beings were, on average, better off than the hunter-gatherers of the bygone era.
<ul>
<li>◦ Vagaries of nature continuously threatened crops and livestock.</li>
<li>◦ Settled villages are also more vulnerable to infectious diseases than the mobile bands of foragers.</li>
<li>◦ Analysis of human bones suggests that hunter-gatherers had a high-protein diet which was also diverse; whereas the early farmers had a carbohydrate-based diet. This is a nutritional problem even today.</li>
</ul>
</li>
<li>• One might say that the chances of survival increased but the quality of health may have dropped.</li>
</ul>

<h3>Neolithic Culture</h3>

<ul>
<li>• Disposing of the dead bodies of loved ones is an emotional issue. Therefore, rituals and practices associated with the last rites, if identified accurately, can give a hint of the prevalent human values of the time.
<ul>
<li>◦ E.g. The practice of burying essential and/or luxury goods along with the dead reflects a belief in the concept of an afterlife.</li>
</ul>
</li>
<li>• Dead bodies were usually buried in the ground but dead bodies of children were placed in an earthen urn and buried.</li>
<li>• Evidence of group burial is also available.
<ul>
<li>◦ This either indicates simultaneous death due to some common cause or strengthening kinship ties.</li>
<li>◦ Human sacrifice cannot be ruled out here.</li>
</ul>
</li>
<li>• In the same way, covering a dead body with a Red or Ochre coloured shroud indicates some sort of ritual.
<ul>
<li>◦ Such evidence is available from Mehrgarh.</li>
</ul>
</li>
<li>• The evidence of human burial with a dog from Burzahom reflects the deepening relationship between man and animal.
<ul>
<li>◦ Both inhumation and secondary burials were practised at Burzahom.</li>
</ul>
</li>
<li>• But, we have no way of finding out the prevalence of cremation and other forms of disposing of dead bodies.</li>
<li>• Also, did the living fear the dead or revered them or both? We don't know.</li>
<li>• Animal husbandry and agriculture, which were based on production, also led to the increased importance of fertility cults.
<ul>
<li>◦ A number of statues of the mother goddess and the humped bull found in the North Western region — Mehrgarh, Mundigak, Rana Ghundai — prove the fact.</li>
</ul>
</li>
<li>• But, we should not attribute any cultic or religious significance to these artefacts without understanding the archaeological context in which they are found.</li>
</ul>

<h3>Why Did Communities Take to Food Production?</h3>

<ul>
<li>• V. Gordon Childe suggests that environmental changes — like the extinction of big prey animals — compelled the push towards agriculture.
<ul>
<li>◦ But, one may ask, why the environmental changes in the Pleistocene age did not lead to domestication?</li>
</ul>
</li>
<li>• Braidwood argues that domestication was a unique initiative out of human inquisitiveness and a greater understanding of the environment.
<ul>
<li>◦ But, even in modern times, foraging tribes don't take up agriculture if there is a balance between population pressure and resource availability, no matter how well they know their environment.</li>
</ul>
</li>
<li>• Binford suggests that because of the rising sea levels in the Holocene Age, people were pushed from the coastal areas towards the inland.
<ul>
<li>◦ This, in turn, generated population pressure, hence, the incentive to look for new methods of food production.</li>
<li>◦ But, can we talk about population pressure in an era when the human population was already so low?</li>
</ul>
</li>
</ul>

<p>Some scholars talk in terms of positive feedback systems:</p>

<ul>
<li>◦ i.e. factors like cross-fertilisation increased the growth of certain plants which attracted the attention of early farming communities.</li>
<li>◦ So, they leaned more and more towards manipulating the growth of plants in their surroundings which further developed into full-scale agriculture.</li>
</ul>

<ul>
<li>• Another kind of climatic factor might have played its part. The onset of the Holocene epoch meant a warmer, wetter and milder climate.
<ul>
<li>◦ So, the natural habitat of the plants and animals with the potential for domestication expanded.</li>
<li>◦ Thus, environmental congeniality rather than pressure paved the way for cultivation.</li>
</ul>
</li>
<li>• But, we should remember that the available archaeological evidence is fairly limited and it is very difficult to understand complex cultural processes like the development of agricultural practices and animal domestication without fully understanding the role of social and political institutions.</li>
<li>• Isolating a single causative factor is problematic, so charting the trajectory of this evolution is a better alternative.</li>
<li>• Perhaps, different sets of factors emboldened the early farming communities in the different ecological zones.</li>
</ul>

<h3>Does the Period Represent a Revolution in Human History?</h3>

<ul>
<li>• Gordon-Childe called this period the 'Neolithic Revolution'.</li>
<li>• But, some scholars question the use of the term 'Revolution'.
<ul>
<li>◦ They argue that the changes which took place were not so rapid as to be called a Revolution. In fact, the changes took place over a long period of time of nearly 3000 years.</li>
<li>◦ Secondly, most of the activities that came to define the Neolithic Age i.e. animal domestication, agriculture and pottery had started well before, in the Mesolithic Age itself.</li>
<li>◦ Thirdly, it should be noted that this process of change was initially concentrated in some key geographical areas only and spread gradually over thousands of years.</li>
</ul>
</li>
<li>• On the other hand, the term 'Revolution' should be associated with the Neolithic period because of the radical changes in the relationship between man and animal on the one hand and man and land on the other.
<ul>
<li>◦ In other words, man moved out of the hunting/food-gathering stage and entered the food-producing stage.</li>
</ul>
</li>
<li>• Further, although it is true that the changes did not take place suddenly and occurred over a long span of time, the pace of change (during the 3000 years) was much faster than in the preceding 30,000 years.</li>
<li>• Due to the complex socio-economic and cultural changes that had occurred during the Neolithic age, man had been brought on the proverbial threshold of civilisation.</li>
</ul>

<h2>Expansion of Neolithic Sites in India</h2>

<ul>
<li>• In India, Neolithic communities are identified with three broad features — food production, settled villages and use of pottery. But, the roots of some of these features go back to the Mesolithic Period in some cases.
<ul>
<li>◦ E.g. Langhnaj and Kaimur Hills Mesolithic sites have provided us with evidence of pottery.</li>
<li>◦ Also, the bones of domesticated animals have been found from Bagor, Ratanpura, Adamgarh etc.</li>
</ul>
</li>
<li>• The level of sedentariness is also relative. As we know, some Mesolithic communities were already living a fairly settled lifestyle.
<ul>
<li>◦ Neolithic communities practised production but it doesn't mean that they abandoned hunting and gathering activities.</li>
</ul>
</li>
<li>• Different regions of the Indian subcontinent have different regional trajectories.
<ul>
<li>◦ E.g. on the northern fringes of the Vindhyas, Neolithic sites emerged over the earlier Mesolithic sites.</li>
<li>◦ In the North-West, the earliest settlements seem to belong to the Neolithic farmers.</li>
<li>◦ If we find evidence of the use of metal (usually copper), then it will be called a Neolithic-Chalcolithic site, instead of a pure Neolithic site.</li>
<li>◦ In certain areas like Rajasthan, the earliest settled communities appear in a full-fledged Chalcolithic context, skipping both the Neolithic and Neolithic-Chalcolithic stages.</li>
</ul>
</li>
</ul>

<h3>Mehrgarh</h3>

<ul>
<li>• Mehrgarh is the earliest Neolithic site in the Indian subcontinent. It has been dated to c. 7000 BCE. We have excavated many stratigraphic layers from this site.
<ul>
<li>◦ First Stage: 7000 BCE to 5000 BCE</li>
<li>◦ Second Stage: 5000 BCE to 4000 BCE</li>
<li>◦ Third Stage: 4300 BCE to 3400 BCE</li>
</ul>
</li>
<li>• Many varieties of charred grains of wheat and barley have been found here. Even evidence of cotton is found.</li>
<li>• Sheep, goat and cattle were domesticated here. Evidence of granary and pit burial have also been found.</li>
</ul>

<h3>North-West</h3>

<ul>
<li>• After Mehrgarh, some other Neolithic sites were discovered from the North-West.</li>
<li>• These were dated between 6000 BCE to 4000 BCE.</li>
<li>• E.g. Kiligul Muhammad, Rehman Dheri, Kila Tarkai, Gumla Amri, Kot Diji etc.</li>
<li>• From the point of view of development of agriculture, these were relatively developed sites.</li>
</ul>

<h3>Kashmir</h3>

<ul>
<li>• Later, in the Kashmir region, sites like Burzahom and Gufkral came into existence between 3000-2000 BCE.</li>
</ul>

<h3>Northern Fringes of the Vindhyas</h3>

<ul>
<li>• Northern fringes of Vindhya Mountains were sites of earlier agricultural and pastoral communities.</li>
<li>• Koldihwa, Mahagara, Kunjhun, Pachoh and Indari etc. are some of the excavated Neolithic sites here.</li>
<li>• Evidence of 'rice cultivation' has been found from this area.</li>
<li>• Another speciality of these sites is that these have emerged from earlier Mesolithic settlements on the same site — only animal husbandry and rice cultivation are additional features of the Neolithic stage.</li>
</ul>

<h3>Gangetic Valley and North-East Region</h3>

<ul>
<li>• In the Gangetic Valley and North-East region, we find sites like Narhan (east U.P), Chirand (Bihar), Pandu Rajar Dhibi (Bengal), Daojali Hading (Assam) etc.
<ul>
<li>◦ These sites appeared somewhere between 3000-2500 BCE.</li>
</ul>
</li>
<li>• In South India, Neolithic sites gradually appeared from 2900 BCE onwards and few sites are dated as near as 1000 BCE.
<ul>
<li>◦ E.g. Neolithic sites are visible at Utnur (A.P), Paiyampalli (T.N) and Brahmagiri, Hallur, Mask, and Tekalkotta (Karnataka).</li>
<li>◦ In the Neolithic settlements of south India, animal husbandry was a more important activity compared to the agriculture.</li>
</ul>
</li>
<li>• We notice that the Neolithic sites in the North-Western region were the earliest and relatively more developed.
<ul>
<li>◦ E.g. From the site of Mehrgarh three varieties of barley, three varieties of wheat and evidence of dates and cotton were found.</li>
<li>◦ Apart from that a mud structure was also found.</li>
<li>◦ This evidence provides some clues as to why a civilisation, like the Harappan civilisation, developed in the region of the northwest.</li>
</ul>
</li>
</ul>
"""

new_content = re.sub(
    r"('prehistory-protohistory': `)([^`]*?)(`)",
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
