import re

html = """<h2>Bhaktism</h2>
<h3>Origin and the rise of Bhakti</h3>
<ul>
<li>&#8226; Bhakti is <strong>inherent in Indian culture</strong>. At different points in history, Bhakti took the form of a philosophical movement then it became the largest cultural movement in India. From the viewpoint of time, it covered more than 1000 years.</li>
<li>&#8226; Likewise, as for its <strong>nature</strong>, we can say it was an <strong>inclusive cultural phenomenon</strong>.
<ul>
<li style="padding-left:2em">&#9702; For example, it assimilated within itself both high Brahmanic culture and lower tribal culture,</li>
<li style="padding-left:2em">&#9702; popular elements as well as feudal elements,</li>
<li style="padding-left:2em">&#9702; Brahmanic orthodoxy as well as religious liberalism.</li>
<li style="padding-left:2em">&#9702; So, it was heterogeneous in character.</li>
</ul>
</li>
<li>&#8226; <strong>Some elements</strong> of Bhakti manifested <strong>even in ancient texts like Vedas and Upanishads</strong>.
<ul>
<li style="padding-left:2em">&#9702; But still, as a social-religious ideology, we find the full extent of Bhaktism in the text, <strong>Bhagwat Gita</strong>, first.</li>
</ul>
</li>
<li>&#8226; <strong>Pre-Gupta Period:</strong> Upto the Gupta period Bhaktism emerged as a <strong>philosophical response to Buddhism</strong>, however, it largely remained confined to high philosophy and never really affected the lives of the common people.</li>
<li>&#8226; <strong>Gupta Period:</strong> Then <strong>idol worship and temple cult</strong> started during Gupta period as a result of the influence of non-Aryan elements.
<ul>
<li style="padding-left:2em">&#9702; There was an <strong>expansion of Aryan culture</strong> due to the phenomenon of land grants and through the process of cultural integration, a large number of non-Aryan gods were assimilated within the Aryan pantheon preparing the way for future Hinduism.</li>
</ul>
</li>
<li>&#8226; <strong>Post-Gupta Period:</strong> Tantricism became the dominant sect in North India and it overpowered Bhaktism for some time.
<ul>
<li style="padding-left:2em">&#9702; Furthermore, we should keep one thing in mind that during Gupta and Post-Gupta periods, Bhakti got associated with a socio-political phenomenon that emerged at that time and which was known as <strong>feudalism</strong>.</li>
</ul>
</li>
<li>&#8226; <strong>Tamil Bhakti:</strong> Then in the 6th and 7th centuries, Bhakti appeared in South India as a <strong>popular movement</strong>.
<ul>
<li style="padding-left:2em">&#9702; Here the initiative was taken by <strong>Alavar and Nayanar</strong> saints. According to the tradition, there were 12 Alwar saints and 63 Nayanar saints.</li>
<li style="padding-left:2em">&#9702; Although these saints came from different social backgrounds, most came from the lower castes. So they opposed varna division.</li>
<li style="padding-left:2em">&#9702; That&#8217;s why initially the Bhakti movement in south India did not work simply as a religious movement but also a social movement.</li>
<li style="padding-left:2em">&#9702; Alavar and Nayanar saints made a demand not simply of religious equality but also of social equality.</li>
</ul>
</li>
<li>&#8226; <strong>Acharyas:</strong> But after the 10th century CE, <strong>Brahmanic elements</strong> started to penetrate the Tamil Bhakti movement. They were known as Acharyas for example, Nath muni, Yamunacharya, Ramanujacharya, Vallabhacharya, Madhavacharya etc.
<ul>
<li style="padding-left:2em">&#9702; They began promoting Bhakti as a philosophy once again.</li>
</ul>
</li>
<li>&#8226; <strong>Ramanujacharya:</strong> Then in the 12th century CE, under Ramanuja, a compromise formula was reached.
<ul>
<li style="padding-left:2em">&#9702; According to this, although in the <strong>religious field equality</strong> for all was accepted, in the <strong>social field, Varna division</strong> had to continue.</li>
<li style="padding-left:2em">&#9702; As a result of this change, the Bhakti movement was converted from a popular movement into an <strong>elitist movement.</strong></li>
<li style="padding-left:2em">&#9702; Ironically, Bhakti became a strong weapon in the hand of Brahmins, with the support of which they could eliminate Buddhist and Jaina adversaries.</li>
<li style="padding-left:2em">&#9702; Simultaneously, this period was marked by the rise of <strong>new dynasties in South India i.e. Cholas</strong>.</li>
<li style="padding-left:2em">&#9702; This dynasty was in search of legitimacy so they could gain support to Brahmanas and temple cult.</li>
</ul>
</li>
<li>&#8226; Thus Bhakti emerged as a <strong>religious structure based on an alliance between monarchy and Brahmans</strong> who were being supported by idol worship and temple cult.</li>
</ul>
<h3>Medieval Bhakti in North India</h3>
<ul>
<li>&#8226; After the 13th century, Bhakti travelled to North India. It is said that it was <strong>Ramananda</strong> who carried the message of Bhaktism from South to North India.</li>
<li>&#8226; Ramananda appeared at the <strong>end of the 15th century</strong> and early 16th century. He spent his early life in South India then the rest of the life he spent at Banaras.</li>
<li>&#8226; Although he was a follower of the Ramanuja tradition, he brought certain innovations.
<ul>
<li style="padding-left:2em">&#9702; For example, he <strong>relaxed the caste barriers</strong> and <strong>accepted disciples even among lower caste</strong> Hindus.</li>
<li style="padding-left:2em">&#9702; That&#8217;s why he is supposed to be the <strong>spiritual inspiration</strong> behind the lower caste saints like <strong>Kabir, Ravidas, Sena and Dhanna</strong>.</li>
</ul>
</li>
</ul>
<h3>Nirguna Bhakti</h3>
<ul>
<li>&#8226; By the 15th century in North India, Nirguna Bhakti had emerged. The background for Nirguna Bhakti was prepared by the <strong>Nathpanthi sect</strong>. It had two specialities.
<ul>
<li style="padding-left:2em">&#9702; Firstly, although Nathpanthi saints were worshippers of Lord Shiva, they <strong>worshipped Lord Shiva in a shapeless form.</strong></li>
<li style="padding-left:2em">&#9702; Secondly, they were <strong>vehemently opposed to the caste system.</strong></li>
</ul>
</li>
<li>&#8226; In fact, it is through a proper <strong>mix between Nathpanth and Bhakti</strong> that Nirguna Bhakti came into existence in North India.</li>
<li>&#8226; Apart from Nathpanth and Bhakti, we can underline the <strong>influence of Sufism</strong> on Nirguna Bhakti as well.
<ul>
<li style="padding-left:2em">&#9702; Possibly the <strong>intensity of love for God</strong> was inspired by Sufism.</li>
</ul>
</li>
</ul>
<p><strong>Kabirdas</strong> became a great exponent of Nirguna Bhakti in North India. His Bhakti had the following features-</p>
<p><strong>1. Worship of a shapeless God:-</strong></p>
<ul>
<li>&#8226; Kabir&#8217;s Ram was quite different from Tulsi&#8217;s Ram as Kabir&#8217;s Ram is not represented in anthropomorphic form.</li>
<li>&#8226; It was this factor in Kabir which made him opposed to Idol worship.</li>
<li>&#8226; So unconsciously he fell into the category of a religious reformer.</li>
</ul>
<p><strong>2. Opposed to the caste system:-</strong></p>
<ul>
<li>&#8226; <strong>Kabir inherited a sense of bitterness against the caste division from Nathpanth</strong>. Simultaneously there might have been some <strong>influence of monotheism of Islam as well.</strong>
<ul>
<li style="padding-left:2em">&#9702; Kabirdas asserted that if Allah and Ishwar (God) are one and the same then how can the followers of Allah and Ishwar be separated from each other as Muslims and Hindus. In this way, through propagating <strong>religions unity</strong> Kabirdas emphasised social unity as well.</li>
</ul>
</li>
<li>&#8226; In fact, Kabir had a <strong>bitter experience of the caste system</strong>. He belonged to the weaver caste. This caste was at the lowest ladder of Hindu society.
<ul>
<li style="padding-left:2em">&#9702; So in the hope of improvement in their social condition weaver (Julaha) caste <strong>embraced Islam</strong> but it realised that even within Muslim society it was marginalised.</li>
<li style="padding-left:2em">&#9702; So practically Kabir Das developed a sense of <strong>disillusionment in both Hinduism and Islam.</strong></li>
</ul>
</li>
<li>&#8226; It was one of the reasons why Kabir made an attack on Hindu and Islamic ritualism simultaneously.</li>
</ul>
<p><strong>3. Challenged the infallibility of the religious scriptures:</strong></p>
<ul>
<li>&#8226; Kabir Das was deprived of education. As he was <strong>illiterate</strong> he did not get support from scripture or Shastra.</li>
<li>&#8226; But it became a blessing in disguise for Kabir as Kabir made his <strong>personal experience</strong> as his guide.</li>
<li>&#8226; It was a very important reason why Kabir expressed such original ideas in socio-religious fields at that time.</li>
</ul>
<p><strong>4. Kabir as a mystical thinker:-</strong></p>
<ul>
<li>&#8226; When there is intensity of love, but the object of love is not clear thus originates mysticism.</li>
<li>&#8226; In the case of Kabir we find that he worshipped God in shapeless form. But he expressed a deep love for God in the manner of a Sufi Saint.</li>
<li>&#8226; Kabir gave the symbol of a <strong>beloved to the Soul</strong> and the symbol of <strong>lover to Brahma</strong>.
<ul>
<li style="padding-left:2em">&#9702; Then he tried to express the relationship between Brahma and Soul through the symbol of human relations. It is here mysticism in Kabir originates and brings him near to Sufi Saint as well.</li>
</ul>
</li>
<li>&#8226; Apart from Kabir, some others were associated with the saint tradition. For example, <strong>Ravidas</strong>, who was a leatherworker from Banaras; <strong>Dhanna</strong>, who was a Jat peasant from Rajasthan; <strong>Sena</strong>, a barber and Pipa; all of them belong to lower caste and shared the same world view with Kabirdas.</li>
</ul>
<h3>Guru Nanak and Sikhism</h3>
<ul>
<li>&#8226; Guru Nanak&#8217;s Bhakti was also influenced by Nath Panth.
<ul>
<li style="padding-left:2em">&#9702; In his speech, there is the use of terms like <strong>&#8216;Shabad&#8217;</strong> (sound) and <strong>&#8216;Sunniya&#8217;</strong> (emptiness). These terms have been taken from Nath Panthi.</li>
<li style="padding-left:2em">&#9702; In this way, he had ideological proximity to Kabir.</li>
</ul>
</li>
<li>&#8226; Apart from that, on Sikhism, we can underline the impact of <strong>monotheism of Islam</strong> as well.</li>
<li>&#8226; Guru Nanak&#8217;s Bhakti produced a <strong>tangible result in the formation of the Sikh state.</strong> It became possible due to certain reasons-
<ul>
<li style="padding-left:2em">&#9702; Sikhism was <strong>deeply associated with a collective spiritual experience,</strong> rather than simply an individual experience as you find in the case of other forms of Nirguna Bhakti.</li>
<li style="padding-left:2em">&#9702; For example, Guru Nanak created a <strong>large group of followers</strong> who were known as Sikhs.</li>
<li style="padding-left:2em">&#9702; Likewise, he started a community kitchen in the form of <strong>&#8216;Langar&#8217;</strong>.</li>
<li style="padding-left:2em">&#9702; Later, Guru Arjandev, the fifth guru, gave a <strong>textual flavour to Sikhism</strong> in form of Guru Granth Sahib.</li>
<li style="padding-left:2em">&#9702; Then later an <strong>egalitarian Sikh society collided with the coercive feudal system under Mughal</strong>. It developed a sense of <strong>mission</strong>.</li>
<li style="padding-left:2em">&#9702; Certainly, such developments paved the way for the rise of an independent Sikh state in the 18th century.</li>
</ul>
</li>
</ul>
<h3>Contributions of Nirguna Bhakti</h3>
<p>1. It promoted <strong>social radicalism</strong> through an attack on the caste system. It rejected the existing pattern of society.</p>
<ul>
<li>&#8226; Although Kabirdas, Nanak, etc. were basically spiritual leaders, they unconsciously brought certain reforms within the society itself.</li>
<li>&#8226; This was due to the responsibility of religious ritualism for many social evils, for example, caste division, idol worship, pilgrimage, etc.
<ul>
<li style="padding-left:2em">&#9702; So once these saints attacked religious ritualism, social evils automatically came into their ambit.</li>
</ul>
</li>
<li>&#8226; It is due to this fact, Kabir is characterised as the Martin Luther of the 15th century.</li>
</ul>
<p>2. Nirguna Bhakti <strong>rejected asceticicism</strong> and preferred to remain associated with productive activities.</p>
<ul>
<li>&#8226; Kabir even after being a saint continued his weaving activity.</li>
<li>&#8226; So in one sense, Nirguna Bhakti encouraged production.</li>
</ul>
<p>3. Apart from this, Nirguna Bhakti promoted production by <strong>breaking the relationship between craft and caste</strong> which was a prevailing norm in India at that time.</p>
<ul>
<li>&#8226; In other words, the change of craft created the situation of Varna Samkara that was decried in society at that time.</li>
<li>&#8226; But Nirguna saints encouraged the people to adopt new crafts, thus weakening the caste system.</li>
</ul>
<p>4. Nirguna Bhakti made a major contribution to the <strong>cultural field</strong> as well.</p>
<ul>
<li>&#8226; These saints, not simply reflected the feelings of the common people but also the <strong>language of the common people.</strong></li>
<li>&#8226; For example, Kabir used the language of the common people, Hindavi, while Punjabi was adopted by Nanak. So local dialects were promoted. <strong>Kabir has declared that Sanskrit was just a well&#8217;s water while Hindavi (perverted form of Hindi) was a stream.</strong></li>
<li>&#8226; Furthermore, Nirguna Bhakti gave <strong>support to local literature</strong> as well.
<ul>
<li style="padding-left:2em">&#9702; Nanak established Punjabi literature.</li>
<li style="padding-left:2em">&#9702; Likewise, Kabir&#8217;s Sakhi, Ramnia and other sorts of poems contributed to Hindi literature.</li>
<li style="padding-left:2em">&#9702; Bijak and Granthawali of Kabir are supposed to be based on his sermons.</li>
</ul>
</li>
<li>&#8226; Even in the development of <strong>music</strong>, Nirguna Bhakti made its contribution.
<ul>
<li style="padding-left:2em">&#9702; Guru Nanak introduced devotional songs in Sikhism and also the instruments like Rabab.</li>
<li style="padding-left:2em">&#9702; Even today devotional songs are part of the Gurudwara&#8217;s life.</li>
</ul>
</li>
</ul>
<h3>Limitations:</h3>
<p>But in spite of the positive contribution of Nirguna Saints, we shouldn&#8217;t overestimate it.</p>
<ul>
<li>&#8226; Although it is true that Nirguna Bhakti made an attack on religious rituals and social tradition, they <strong>couldn&#8217;t bring any radical change in existing religious or social structure in the true sense.</strong></li>
<li>&#8226; Essentially, they were <strong>spiritual leaders</strong> so, even their <strong>reform program was mainly guided by their personal spiritual realisation</strong>, not by any rational ideology.
<ul>
<li style="padding-left:2em">&#9702; That&#8217;s why they <strong>failed to give any alternative system</strong> and their protest remained simply a timely reaction.</li>
</ul>
</li>
<li>&#8226; It is sometimes <strong>compared with the Protestant movement</strong> of Europe.
<ul>
<li style="padding-left:2em">&#9702; In Europe, the Protestant movement <strong>successfully broke the pillar of feudalism</strong> and paved the way for the rise of capitalism. However, Nirguna Bhakti could not overpower the prevailing feudalism of the time.</li>
</ul>
</li>
</ul>
<h3>Vaishnava Bhaktism</h3>
<ul>
<li>&#8226; It was different from Nirguna Bhakti. Nirguna Bhakti believed that God didn&#8217;t take incarnation nor did he come to earth to play his Lila.
<ul>
<li style="padding-left:2em">&#9702; On the other hand, Saguna Bhakti believed in the concept of <strong>incarnation and reincarnation</strong>.</li>
</ul>
</li>
<li>&#8226; Two important exponents of Vaishnava Bhakti in North India were <strong>Ramananda and Vallabhacharya</strong>.</li>
<li>&#8226; <strong>Ramananda</strong> became an <strong>inspiration for both</strong> the Nirguna and Saguna Bhakti in North India.</li>
<li>&#8226; Ramananda brought <strong>three important changes</strong> with respect to the Bhaktism of South India.
<ul>
<li style="padding-left:2em">&#9702; In place of Lord Vishnu and Shiva, he introduced the <strong>Rama cult</strong> in North India.</li>
<li style="padding-left:2em">&#9702; Secondly, <strong>in place of Sanskrit he introduced local dialects</strong> in order to spread his message to the common people.</li>
<li style="padding-left:2em">&#9702; Above all, he created a band of followers from the <strong>lower castes</strong>. In this way, the difference is clearly visible with prevailing Brahmanic orthodoxy.</li>
</ul>
</li>
<li>&#8226; Similarly, <strong>Vallabhacharya</strong> became an ideological inspiration behind Krishna Bhakti in North India.
<ul>
<li style="padding-left:2em">&#9702; Vallabhacharya was a <strong>Telugu Brahmin</strong>. He also appeared at the end of 15th and early 16th century. He was born in Banaras and remained active in North India.</li>
</ul>
</li>
<li>&#8226; He laid the foundation of <strong>Ashtachap</strong> which comprises 8 important Krishna Bhaktas and who were ardent followers of Vallabhacharya.</li>
<li>&#8226; Vallabhacharya influenced <strong>mainly Gujarat</strong> and later after the appearance of Surdas, this movement would be an influential movement in North India in the 17th century.</li>
</ul>
<h3>The difference in the perception of Nirguna and Saguna Bhakti</h3>
<p>1. Nirguna Bhakti emphasised on the worship of God in a shapeless form while Suguna Bhakti believed in individual Gods.</p>
<p>2. Nirguna Bhakti was having a radical social outlook as it rejected caste division while Saguna Bhakti made a compromise with the varna system and accepted caste division.</p>
<h3>The manifestation of Vaishnava Bhakti in different regions of India</h3>
<ul>
<li>&#8226; Vaishnava Bhakti shouldn&#8217;t be taken as a monolithic movement rather it was <strong>heterogeneous</strong> in nature.</li>
<li>&#8226; In different regions, its manifestation was slightly different and there it reflected the influence of some local elements as well.</li>
</ul>
<h3>North India</h3>
<p>In North India as well as in Western India, Vaishnava Bhakti manifested itself in two different branches, i.e. <strong>Rama Bhakti and Krishna bhakti</strong>. Both became popular movements in these regions.</p>
<h3>Rama Bhakti</h3>
<ul>
<li>&#8226; <strong>Tulsidas</strong> appeared to be a great exponent of Rama bhakti. It was he who carried Ram Katha to every Hindu household.
<ul>
<li style="padding-left:2em">&#9702; He composed the famous text <strong>&#8216;Ramcharitmanas&#8217;</strong> in <strong>Awadhi</strong> language which was associated with the birthplace of Ram. If today the story of Rama has survived, it isn&#8217;t in Valmiki&#8217;s Ramayana, but it is in the language of Tulsidas.</li>
</ul>
</li>
<li>&#8226; Another important Ram Bhakta was <strong>Nabhadas</strong>. He composed a famous text i.e. &#8216;Bhaktamal&#8217; in which 200 Bhaktas are mentioned.</li>
</ul>
<h3>Krishna Bhakti</h3>
<ul>
<li>&#8226; <strong>Surdas</strong> emerged to be a great exponent of Krishna bhakti and he popularised his Bhakti among common masses.
<ul>
<li style="padding-left:2em">&#9702; He used <strong>Braj</strong> Bhasha, a local dialect, and composed his famous text, <strong>&#8216;Sur Sagar&#8217;</strong> in this language.
<ul>
<li style="padding-left:4em">&#9632; The popular story of Lord Krishna, Radha, the Gopis, etc. possibly caught popular imagination much deeper than even Rama Bhakti.</li>
</ul>
</li>
</ul>
</li>
<li>&#8226; Krishna Bhakti was promoted by <strong>Narsingh Mehta</strong> in Gujarat and <strong>Mira Bai</strong> in Rajasthan.</li>
</ul>
<h3>Maharashtra Dharma</h3>
<ul>
<li>&#8226; Maharashtra Dharma reflected assimilation between Vaishnavism and Nathpanthi ideology.</li>
<li>&#8226; The centre of Maharashtra Dharma was <strong>Pandharpur</strong> and the God around whose Maharashtra Dharma revolves was <strong>Vithoba</strong>, a local God. The followers of Vithoba formed a new sect that was the <strong>Varkari</strong> sect.</li>
<li>&#8226; <strong>Namdeva</strong> was supposed to be a <strong>bridge between Maharashtra Dharma and Bhakti movement in North India</strong>.</li>
<li>&#8226; One important exponents of Maharashtra Dharma was <strong>Gyandeva</strong>. He composed a commentary on Bhagavad Gita in the Marathi language known as <strong>&#8216;Gyaneshwari Gita&#8217;.</strong></li>
<li>&#8226; Some other important saints associated with this sect were <strong>Namdeva, Eknath, Tukaram</strong>.</li>
<li>&#8226; Maharashtra Dharma was different from other Vaishnava sects as it <strong>advocated for the eradication of social differences</strong> between high and low born in society.
<ul>
<li style="padding-left:2em">&#9702; In this way, a <strong>common Maratha identity</strong> to the people was given.</li>
</ul>
</li>
<li>&#8226; So <strong>unconsciously Maratha saints laid the foundation of the future Maratha state</strong> as they encouraged the process of human capital formation for the promotion of a common political cause.</li>
<li>&#8226; In the 17th century, <strong>Saint Ramdas Samartha</strong> emerged.
<ul>
<li style="padding-left:2em">&#9702; He was <strong>Shivaji&#8217;s teacher</strong> as well.</li>
<li style="padding-left:2em">&#9702; He laid the foundation of the <strong>Dharkari sect</strong>.</li>
<li style="padding-left:2em">&#9702; The emphasis of this sect was the <strong>assimilation between spiritual and mundane life.</strong></li>
</ul>
</li>
<li>&#8226; So gradually Maharashtra Dharma evolved from a Shahishnu Dharma (a tolerant religion) to a Jayishnu Dharma (A sect for conquest). Thus was prepared a basis for the future Maratha state.</li>
</ul>
<h3>Bhaktism in Eastern India</h3>
<p>In Eastern India Bhaktism was <strong>influenced by Siddha and Nath saints</strong>.</p>
<ul>
<li>&#8226; Early exponents of Bhakti ideas in Bengal were <strong>Jayadeva and Vidyapati</strong>.
<ul>
<li style="padding-left:2em">&#9702; Jayadeva composed a famous text <strong>&#8216;Geet Govinda&#8217;</strong> in <strong>Sanskrit</strong>.
<ul>
<li style="padding-left:4em">&#9632; This text focused on the relationship between Radha and Krishna and presented this relationship in a very erotic manner.</li>
</ul>
</li>
<li style="padding-left:2em">&#9702; <strong>Vidyapati</strong> carried Bhakti tradition and composed his text in the <strong>Maithili</strong> language.</li>
<li style="padding-left:2em">&#9702; Likewise, one of the earliest Bhakti saints was <strong>Chandidas</strong> in Bengal.</li>
</ul>
</li>
<li>&#8226; But the most important was <strong>Chaitanya</strong>.
<ul>
<li style="padding-left:2em">&#9702; He popularised Krishna Bhakti in Bengal and created such a deep impact on the mind of the people that he was presented as the <strong>reincarnation of Lord Krishna</strong>.</li>
<li style="padding-left:2em">&#9702; It was Chaitanya who introduced <strong>Kirtana (devotional song)</strong>. So he brought Bhakti to the moment of emotional ecstasy.</li>
</ul>
</li>
<li>&#8226; In Assam, <strong>Sankardeva</strong> was also a Bhakti saint.
<ul>
<li style="padding-left:2em">&#9702; In Assam Bhakti, <strong>Radha didn&#8217;t play a significant role</strong>.</li>
<li style="padding-left:2em">&#9702; Likewise, in place of young Krishna, <strong>Bala Krishna</strong> (Childhood) became a major theme of Bhaktism.</li>
</ul>
</li>
</ul>
<h3>Contribution of Saguna Bhakti :-</h3>
<p>1. Although it is true, Saguna Bhakti made a <strong>compromise</strong> with the Varna system but at least they <strong>tried to soften the rigour of the Varna system.</strong></p>
<p>2. Even in Saguna Bhakti, we can underline the element of <strong>protest against Brahmanic orthodoxy</strong> and elite norms. For example, <strong>Maharashtra Dharma reflected popular consciousness.</strong> Likewise, in Krishna Bhakti, the existing social norms have been challenged.</p>
<p>3. In the cultural <strong>field</strong>, Vaishnava Bhakti made a larger contribution. In one sense, Bhaktism became a major theme in contemporary <strong>literature, architecture, music, dance, painting, etc.</strong></p>
<ul>
<li>&#8226; a. Support for <strong>local dialects</strong> like Hindi, Awadhi, Braj Bhasha, Bengali, Marathi, etc.</li>
<li>&#8226; b. Saguna Bhakti encouraged <strong>temple cult</strong> so the rare example of temple architecture is associated with Saguna Bhakti.</li>
<li>&#8226; c. <strong>Sankritana</strong> system introduced by Chaitanya, devotional songs of <strong>Mira</strong>, <strong>Dhrupada singing of Swami Haridas</strong>, made a rare contribution to Indian music. In one sense, it was Bhaktism which prepared the way for the development of Hindustani music in India.</li>
</ul>
<h3>Limitations of Saguna Bhakti -</h3>
<ul>
<li>&#8226; Through accepting <strong>caste division and temple cult</strong>, Saguna Bhakti accepted the Brahmanic world view and it strengthened the position of Brahmanism in socio-religious life of India.</li>
<li>&#8226; In one sense, the <strong>resurgence of Saguna Bhakti overpowered Nirguna Bhakti</strong> in North India where Nirguna Bhakti had so far continued to promote some sort of social radicalisation.</li>
</ul>
<h3>Women Bhaktas and a note of protest -</h3>
<p>Bhaktism is <strong>supposed to be a movement that advocated for the creation of an egalitarian society</strong> but on observing sincerely we find that while some saints raised the caste issue and opposed the caste system but simultaneously they <strong>neglected the issue of women&#8217;s exploitation.</strong></p>
<ul>
<li>&#8226; But in the course of the Bhakti movement, <strong>some women Bhaktas emerged</strong>.
<ul>
<li style="padding-left:2em">&#9702; <strong>David Kingsley</strong> asserts that for them it became difficult to reconcile their love for the lord and perform their worldly duties.</li>
<li style="padding-left:2em">&#9702; So in one sense, the rise of women Bhaktas symbolises a <strong>protest against the drudgery of domestic life</strong>.</li>
</ul>
</li>
<li>&#8226; We come to know about some important women Bhakta such as <strong>Lalded/Laleshwari</strong> of Kashmir.
<ul>
<li style="padding-left:2em">&#9702; She was a <strong>dedicated Shaivite</strong>.</li>
<li style="padding-left:2em">&#9702; She opposed all sorts of social taboos and religious ritualism.</li>
<li style="padding-left:2em">&#9702; Ideologically she came close to the rishi sect (a Sufi sect) in Kashmir. Nuruddin Rishi was highly influenced by the spiritual perfection of Lalded.</li>
<li style="padding-left:2em">&#9702; On the one hand, Lalded became a symbol of protest against the male dominance of society; on the other in association with the Rishi sect and its exponent Nuruddin, she also became a <strong>symbol of Hindu-Muslim amity</strong>.</li>
</ul>
</li>
<li>&#8226; As in Rajasthan, <strong>Mirabai</strong> was associated with the same symbol of social protest.
<ul>
<li style="padding-left:2em">&#9702; She lost her husband at a young age then also lost her father-in-law, Maharana Sanga, as well after the battle of Khanwa.</li>
<li style="padding-left:2em">&#9702; Along with a sense of loneliness, she also felt a sense of being victimised as a result of domestic violence.</li>
<li style="padding-left:2em">&#9702; It was from the earlier phase she was indulging in Krishna Bhakti but later she became a complete Bhakti saint. She was a symbol of social rebellion. This phenomenon can be ascertained even on the basis that even in earlier phases she didn&#8217;t enjoy respect among Rajasthani women who took her as the breaker of social norms.</li>
</ul>
</li>
<li>&#8226; <strong>Mahadevi Akka</strong> was a Bhakti saint from the Karnataka region.
<ul>
<li style="padding-left:2em">&#9702; She also became a <strong>symbol of women&#8217;s protest</strong> against male dominance in society. In this way, women Bhakta gave a new dimension to the Bhakti movement.</li>
</ul>
</li>
</ul>
<h3>Historiography of the Bhakti Movement</h3>
<p>Bhakti proved to be the largest cultural movement in India. Almost every part of India was touched by it and it made its presence felt for a long time i.e. 1000 years. So it is very natural that there should be some controversy among scholars in specifying its nature.</p>
<ul>
<li>&#8226; Earlier <strong>R.G. Bhandarkar</strong>, while making a study of Bhaktism, tried to find out its <strong>indigenous roots</strong>.
<ul>
<li style="padding-left:2em">&#9702; In other words, he linked Bhaktism to the earlier religious tradition of India.</li>
</ul>
</li>
<li>&#8226; <strong>R.C. Zaehner</strong> tried to link it to the influence of <strong>Islam</strong>.</li>
<li>&#8226; Likewise, some other scholars, such as <strong>Yusuf Hussain</strong>, divided Bhaktism into <strong>two phases</strong> &#8211;
<ul>
<li style="padding-left:2em">&#9702; 1. Starting from the 4th - 5th century to the 12th century, when <strong>Bhaktism was an individual perception.</strong></li>
<li style="padding-left:2em">&#9702; 2. Then, from the 13th century to the 16th century, when Bhaktism became a <strong>religious creed after an interaction with Islam.</strong></li>
</ul>
</li>
<li>&#8226; Some scholars tried to prove that bhakti was an outcome of the <strong>desperation of the lower castes</strong>. For them, it was an expression of social protest.
<ul>
<li style="padding-left:2em">&#9702; They were caught between Devil and Deep Blue Sea.</li>
<li style="padding-left:2em">&#9702; On the one hand, they were exploited by higher-caste Hindus and on the other, they were unable to link themselves to the cruel world view given by the Turkish ruling class.</li>
<li style="padding-left:2em">&#9702; So they moved towards Bhaktism for emotional support.</li>
</ul>
</li>
<li>&#8226; Other scholars like <strong>Irfan Habib</strong> interpret Bhakti in relation to <strong>craft and caste</strong>.
<ul>
<li style="padding-left:2em">&#9702; In fact, he emphasised the point that Nirguna saints promoted new crafts through delinking relations between craft and castes.</li>
</ul>
</li>
<li>&#8226; Another interpretation about this movement is that it was a <strong>reaction of caste-ridden Hindu society against the challenge of Islam.</strong></li>
</ul>
<h3>Conclusion</h3>
<p>Considering different views about the nature of the Bhakti movement we come to the point that it <strong>wasn&#8217;t uniform</strong> in nature rather it was <strong>polyphonic</strong> in nature.</p>
<ul>
<li>&#8226; In fact, it encompassed within itself <strong>varied and sometimes even mutually contradictory elements</strong>.</li>
<li>&#8226; We can very well underline its multifaceted nature when we come to know that on the one hand, it represented <strong>elite</strong> elements on the other <strong>popular</strong> elements.</li>
<li>&#8226; Likewise, it also symbolises the <strong>assimilation between Brahmanic orthodoxy and popular revolt.</strong></li>
<li>&#8226; Apart from that, at some places it appeared to be a <strong>bit insensitive to women</strong> but at other places, it <strong>represented women&#8217;s protest</strong> also in the form of devotion of Lalded and Mirabai.</li>
<li>&#8226; Furthermore, Bhaktism on the one hand <strong>strengthened the position and power of the ruling class</strong>, on the other hand, it represented the <strong>revolt of regional elements</strong> against the centralised power in the form of Maratha and Sikh movement.</li>
</ul>
<p>So, while making the study of Bhakti, we <strong>need to be cautious about generalisations.</strong></p>
<h2>Sufism</h2>
<ul>
<li>&#8226; The term &#8216;Sufism&#8217; came into use for the first time in the 19th century. Earlier, it was known as <strong>&#8216;Tasawwuf&#8217;</strong>.</li>
<li>&#8226; Sufism originated from the term <strong>Safa or Suffa</strong>, which means sacred. Safa also means a coarse blanket made of wool. It also symbolises a rejection of luxurious life.</li>
<li>&#8226; So far as the term &#8216;suffa&#8217; is concerned it symbolized a <strong>religious place outside of the mosque</strong>. On this suffa, saints sat and performed meditation. They were known as Sufi.</li>
<li>&#8226; Sufism emerged in the Islamic world in the 10th century, when on the one hand there was the decline of the Islamic empire, and on the other hand there was the rise of the <strong>Turkish monarchy</strong>.</li>
<li>&#8226; This period was marked by a <strong>transition of values in the Islamic world</strong>.
<ul>
<li style="padding-left:2em">&#9702; It was a time when <strong>power, wealth and influence</strong> had completely overshadowed the original values of egalitarianism, love and rule by the consent of the governed.</li>
<li style="padding-left:2em">&#9702; The new generation of Muslim youth was deeply attracted to a <strong>luxurious life</strong>.</li>
<li style="padding-left:2em">&#9702; So, Sufism represented a spiritual reaction against this social decadence.</li>
</ul>
</li>
<li>&#8226; The <strong>Quran</strong> itself, provides the basis to Sufi ideas. In fact, the Quran had two different types of interpretations.
<ul>
<li style="padding-left:2em">&#9702; First was the <strong>Shariyat</strong>, presented as the orthodox interpretation;</li>
<li style="padding-left:2em">&#9702; At the same time the other interpretation was the <strong>Tariqat</strong>. It gives a liberal interpretation of the Quran. So, it was Tariqat which prepared the basis for mystical ideas of Sufism.</li>
</ul>
</li>
<li>&#8226; <strong>Initially, Sufism was not accepted</strong> in the Islamic world as there were two important differences between orthodox Islam and Sufism.
<ul>
<li style="padding-left:2em">&#9702; Firstly, according to <strong>orthodox Islam</strong>, the relationship between Allah and the common man is just like a <strong>master and slave</strong>, while <strong>Sufism</strong> believed in monistic ideas and talked about <strong>unity and equality of god and soul</strong>.</li>
<li style="padding-left:2em">&#9702; Likewise, <strong>orthodox Islam</strong> and ulemas gave primacy to <strong>faith</strong> while <strong>Sufism</strong> believed in the tradition of <strong>mutazil</strong> (reasoning).</li>
</ul>
</li>
<li>&#8226; It is on the issues mentioned above that <strong>tension</strong> continued between the two.
<ul>
<li style="padding-left:2em">&#9702; Eg. In 10th century CE, a Sufi saint <strong>Mansur-bin-Hallaz</strong> declared himself to be Anhalq (unity of god and soul). He was awarded the death sentence.</li>
</ul>
</li>
<li>&#8226; Later in the 12th century a saint <strong>Al-Gazzali</strong> made Sufism acceptable in Islamic world by bringing an important change in its ideas.
<ul>
<li style="padding-left:2em">&#9702; He declared that <strong>Allah and his merits can&#8217;t be realized only through reasoning but also through faith.</strong></li>
<li style="padding-left:2em">&#9702; Although it was an <strong>attack on</strong> the tradition of <strong>Mutazil</strong> and ultimately proved costly to the Islamic world, but during this period, the <strong>conflict</strong> between orthodox Islam and Sufism <strong>ceased</strong> for time being.</li>
</ul>
</li>
<li>&#8226; Sufism is supposed to have <strong>originated in Iran</strong>, then spread to other parts of the world.</li>
<li>&#8226; Right from the time of Turkish conquest of Punjab under Ghazani, Sufi saints started to travel towards India.
<ul>
<li style="padding-left:2em">&#9702; The first Sufi saint who came to India was Sheikh <strong>Al-Hujwiri or Data Ganj Baksh</strong>. He came to India during the period of Mahmud Gazani. He composed <strong>&#8216;Kashf-ul-Mahjoob&#8217;</strong>, a famous text.</li>
</ul>
</li>
<li>&#8226; Following the invasion of Ghori, Sheikh <strong>Moinuddin Chisti</strong> moved to India and built his Khanqah at Ajmer. After his death his Khanqah became a Dargah and a pilgrimage centre. Several other scholars and Pirs rushed towards India due to the Mongol Menace.
<ul>
<li style="padding-left:2em">&#9702; One of Chisti&#8217;s disciples was <strong>Fariduddin Ganj-i-Shakar</strong>. He established his Khanqah at Ajodhan in Punjab. He became a famous saint and by his period the Chisti sect became fully established in India.</li>
<li style="padding-left:2em">&#9702; Later there appeared two important Chisti saints, Sheikh <strong>Nizamuddin Auliya</strong> and <strong>Nasiruddin Chirag-e-Dehlavi</strong>.</li>
<li style="padding-left:2em">&#9702; Nizamuddin created a wide band of followers. He came in touch even with Hindu Yogis and appropriated the Yoga method. Yogis of his age referred to him as a Siddha (perfect Yogi).</li>
</ul>
</li>
</ul>
<h3>Why did the Chisti sect gain in popularity in comparison to others?</h3>
<ul>
<li>&#8226; The Chistis <strong>maintained relations with the common</strong> people but avoided contact with the ruling class.</li>
<li>&#8226; Chisti saints adopted <strong>local languages</strong> like Awadhi, Punjabi, Urdu and Deccani and expressed their spiritual experience through popular stories from Hindu houses.</li>
<li>&#8226; Sufi saints came in touch with <strong>lower strata</strong> of the society e.g. Nizamddin Auliya contacted Nathpanti Yogis.</li>
</ul>
<h3>Other Sufi Sects-</h3>
<ul>
<li>&#8226; Another important Sufi sect was the Suhrawardi sect. Its founder was Bahauddin Zakariya.</li>
<li>&#8226; Apart from the Suhrawardi sect there were some other sub-sects as well e.g. Sattari, Firdausi, Naqshbandi, Qadiri etc.</li>
<li>&#8226; According to Abul Fazal, there were a total 14 Sufi sub-sects which worked in India.</li>
</ul>
<h3>Sufi Ideology:</h3>
<ul>
<li>&#8226; The objective of Sufism was to make Ruh (Soul) free from earthly bonds. In the course of its journey to God, Ruh has to cross 7 valleys or in spiritual terms, seven levels. Then the soul would come to manifest god.</li>
<li>&#8226; Under Sufism some important concepts are Wahadat-ul Wajood (Unity of Being), Wisal-i- Yaar (sense of loss due to separation from the beloved), Pir/ Haq (teacher/ highest reality), Murid (disciple), Dayra (spiritual territory), Wali (spiritual successor of Pir) and Fanah (self-annihilation).</li>
<li>&#8226; Other articles of faith include Dargah/ Mazar (tomb of a Sufi Saint), Ziyarat (Pilgrimage), Futuh (unsolicited gift), Urs (death anniversary of a Sufi saint), Qawwali (devotional songs), Raksh (dance), Sama (musical gathering) and Hala (state of ecstasy).</li>
</ul>
<h3>Contribution of Sufism:-</h3>
<ul>
<li>&#8226; It was Sufism which provided a <strong>social basis to Islam in India</strong>.
<ul>
<li style="padding-left:2em">&#9702; The people in India were having bad memory for invasions from Muslim army.</li>
<li style="padding-left:2em">&#9702; So, it was Sufism that gave an ointment to the wound of Indians. So in one sense it was Sufism due to which Muslim rule in India became acceptable.</li>
</ul>
</li>
<li>&#8226; Sufi saints even worked as a <strong>critic of government policy.</strong> In this way they worked as a pressure-group.
<ul>
<li style="padding-left:2em">&#9702; Elite Muslim youth was much attracted to the luxuries of life. So Sufi saints through criticising luxurious life infused some moral values in them.</li>
</ul>
</li>
<li>&#8226; Sufism also contributed to the <strong>economic field</strong>.
<ul>
<li style="padding-left:2em">&#9702; As Sufi saints settled in interior regions or forests and built a Khanqah.</li>
<li style="padding-left:2em">&#9702; So very soon devotees started going there, the forest was cleared and <strong>agriculture</strong> developed there.</li>
<li style="padding-left:2em">&#9702; Moreover, these places developed as the Kasba or town in course of time.</li>
</ul>
</li>
<li>&#8226; Likewise, Sufism <strong>encouraged trade and commerce</strong> as well.
<ul>
<li style="padding-left:2em">&#9702; Infact, Sufi Khanqah became a meeting place for merchants.</li>
<li style="padding-left:2em">&#9702; Furthermore, through donations, vast wealth was accumulated in a Sufi khanqah and the khanqah started to invest capital in merchants&#8217; business.</li>
</ul>
</li>
<li>&#8226; In the <strong>cultural</strong> field, Sufism made a great contribution.
<ul>
<li style="padding-left:2em">&#9702; It promoted <strong>Indian languages</strong> like Awadhi and Panjabi.</li>
<li style="padding-left:2em">&#9702; By <strong>telling stories from the houses of Hindus</strong>, it promoted the <strong>composite culture</strong> of India.</li>
<li style="padding-left:2em">&#9702; It made a great contribution to <strong>music</strong> i.e. Gazal and Kawwali are the most important forms of music developed by Sufism.
<ul>
<li style="padding-left:4em">&#9632; Md. Gauss was the teacher of Tansen.</li>
</ul>
</li>
</ul>
</li>
<li>&#8226; Above all, Sufi saints tried to <strong>mitigate the cruel behaviors of orthodox Islam on Hindus</strong>.
<ul>
<li style="padding-left:2em">&#9702; Eg. For orthodox Muslims, the term &#8216;Kafir&#8217; meant non- believer but Sufi saints changed its meaning. For them it means beloved.</li>
</ul>
</li>
</ul>"""

with open('lib/noteContent.ts', 'r', encoding='utf-8') as f:
    content = f.read()

old = "'society-culture-economy-13-14c': ``"
new = "'society-culture-economy-13-14c': `" + html + "`"

count = content.count(old)
print(f"Found {count} occurrence(s) of target string")

if count == 1:
    content = content.replace(old, new, 1)
    with open('lib/noteContent.ts', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Replaced 1 occurrence(s). Done.")
else:
    print("ERROR: Expected exactly 1 occurrence. Aborting.")
