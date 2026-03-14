import re

new_html = r"""<h2>AKBAR &#8212; ACHIEVEMENTS</h2>

<h3>A great Empire-builder:-</h3>
<ul>
<li>&#8226; He created a big empire that consisted of the region of Kashmir in North to Berar and Balaghat in the south and Kandhar in the west to Bengal in the east. So he combined a vast region of the North, North-West, East and the Deccan under a single empire.</li>
</ul>

<h3>A new theory of kingship:-</h3>
<ul>
<li>&#8226; In Akbar&#8217;s theory of kingship, one can see the <strong>pluralistic</strong> character of Hindustan. In other words, he tried to establish that the <strong>king shouldn&#8217;t favour any social group or a particular class rather he should work for the betterment of all.</strong></li>
<li>&#8226; While describing Akbar&#8217;s theory of kingship, Abul Fazl characterises it as <strong>&#8216;Farr-i-Izadi&#8217;</strong> (Divine light) which directly emanates from God and falls on the king. Therefore, the role of intermediaries was automatically undermined.</li>
<li>&#8226; In the whole of his writing on kingship, Abul Fazal never used the terms &#8216;Dar-ul-Harb&#8217; (country of Idolater) or &#8216;Dar-ul- Islam&#8217; (the country where Muslim rule prevails), as Akbar&#8217;s theory of kingship was based on <strong>&#8216;Dar-ul-Sulah&#8217;</strong> (peace for all).</li>
</ul>

<h3>A great Institution-builder:-</h3>
<ul>
<li>&#8226; From central administration to local administration, Akbar established an efficient model of government.</li>
<li>&#8226; In central administration, he created a new department called <strong>Diwan-i-Aala</strong>.</li>
<li>&#8226; Apart from that, he introduced a <strong>standardised provincial administration</strong>.</li>
<li>&#8226; His whole administrative structure functioned on <strong>two important formulas, i.e.-</strong>
  <ul>
  <li style="padding-left:2em">&#9702; 1. Administrative uniformity</li>
  <li style="padding-left:2em">&#9702; 2. Check and balance</li>
  </ul>
</li>
<li>&#8226; Above all, Akbar made a great innovation by introducing the <strong>Mansabdari-Jagirdari system</strong>.</li>
<li>&#8226; Not simply that, he also developed an efficient land revenue system in the form of <strong>&#8216;Ain-i-Dahsala&#8217;</strong>.</li>
</ul>

<h2>Central Administration</h2>

<h3>Kingship</h3>
<ul>
<li>&#8226; The Mughal Polity was based on the element of <strong>absolute monarchy</strong>, wherein the emperor was the fountainhead of all authority.</li>
<li>&#8226; Akbar introduced the element of <strong>semi divine origin of kingship</strong>, by introducing concepts such as-
  <ul>
  <li style="padding-left:2em">&#9702; <strong>Farr-i-Izidi (Divine light)</strong> - According to him, the emperor&#8217;s heart was the repository of divine light. Thus, he assumed the title of <strong>&#8216;Zill-i-Illahi&#8217;</strong> (Shadow of God)</li>
  <li style="padding-left:2em">&#9702; <strong>Insan-i-Kamil</strong> (Most rational man) - this notion emphasises that the Emperor has extraordinary capabilities, and is superior to the other man.</li>
  <li style="padding-left:2em">&#9702; <strong>Imam-i-Adil</strong> (Leader of Justice) - The Emperor is inherently a fair and just ruler.</li>
  <li style="padding-left:2em">&#9702; Akbar Also introduced some <strong>new practices</strong> to emphasise the Emperor&#8217;s semi-divine status, such as:
    <ul>
    <li style="padding-left:4em">&#9632; <strong>Sijda</strong> - prostration</li>
    <li style="padding-left:4em">&#9632; <strong>Paibos</strong> - kissing the emperor&#8217;s feet</li>
    <li style="padding-left:4em">&#9632; <strong>Navroz</strong> - Festival to celebrate the Persian new year</li>
    <li style="padding-left:4em">&#9632; <strong>Tuladan</strong> - Borrowed from the Krishnite legends - on special occasions, the emperor was weighed against different things to be distributed among the poor.</li>
    <li style="padding-left:4em">&#9632; <strong>Jharoka Darshan</strong> - Borrowed from Hinduism, the king would appear in his window every morning and bless his subjects.</li>
    </ul>
  </li>
  </ul>
</li>
<li>&#8226; <strong>Sulh-i-Kul</strong>
  <ul>
  <li style="padding-left:2em">&#9702; It was the guiding principle of Akbar&#8217;s Religious philosophy. It refers to the doctrine of <strong>universal peace</strong>, and also served as an essential pillar of his theory of kingship.
    <ul>
    <li style="padding-left:4em">&#9632; According to it-
      <ul>
      <li style="padding-left:6em">&#9679; <strong>All religions had equal rights</strong> to prosper and flourish within the empire.</li>
      <li style="padding-left:6em">&#9679; There was to be <strong>no discrimination</strong> on the basis of religion.</li>
      <li style="padding-left:6em">&#9679; <strong>It was the emperor who was holding the empire together</strong>, and in his absence, various religious communities would descend into communal violence.</li>
      </ul>
    </li>
    <li style="padding-left:4em">&#9632; Thus, it was designed to achieve <strong>stability</strong> and religious <strong>peace</strong> as well as to <strong>reinforce the despotic authority of the emperor.</strong></li>
    </ul>
  </li>
  </ul>
</li>
<li>&#8226; <strong>Succession</strong> - there was <strong>no fixed rule</strong> of succession.
  <ul>
  <li style="padding-left:2em">&#9702; The rule of primogeniture was not followed and succession was decided by competition among contenders for the throne, leading to frequent and destructive war of succession.</li>
  </ul>
</li>
</ul>

<h3>Nature of the State</h3>
<ul>
<li>&#8226; <strong>War State</strong>
  <ul>
  <li style="padding-left:2em">&#9702; Such a state is built by conquest and preserved by armed might.</li>
  <li style="padding-left:2em">&#9702; It has a large military establishment and there is no distinction between civil and military officials. The same official performs both duties.</li>
  </ul>
</li>
<li>&#8226; <strong>Paper State</strong>
  <ul>
  <li style="padding-left:2em">&#9702; The large empire required a large efficient bureaucracy to manage its affairs.</li>
  <li style="padding-left:2em">&#9702; Official business was conducted through written documents, records of which were meticulously maintained.</li>
  </ul>
</li>
<li>&#8226; <strong>Portfolio system of administration</strong> - Different subjects of administration were placed under different departments.</li>
</ul>

<table style="border-collapse:collapse;width:100%;margin:1em 0">
<tr style="background:#f0f0f0"><th style="border:1px solid #ccc;padding:6px">DEPARTMENT</th><th style="border:1px solid #ccc;padding:6px">HEADS</th><th style="border:1px solid #ccc;padding:6px">IN CHARGE OF</th></tr>
<tr><td style="border:1px solid #ccc;padding:6px">Diwan-i-Wazirat</td><td style="border:1px solid #ccc;padding:6px">Diwan-i Ala</td><td style="border:1px solid #ccc;padding:6px">Revenue</td></tr>
<tr><td style="border:1px solid #ccc;padding:6px">Diwan-i-Arz</td><td style="border:1px solid #ccc;padding:6px">Mir Bakshi</td><td style="border:1px solid #ccc;padding:6px">Military</td></tr>
<tr><td style="border:1px solid #ccc;padding:6px">Diwan-i-Rasalat Muhatsib</td><td style="border:1px solid #ccc;padding:6px">Muhtasib</td><td style="border:1px solid #ccc;padding:6px">Foreign affairs and censor of public morals</td></tr>
<tr><td style="border:1px solid #ccc;padding:6px">Diwan-i-Quza</td><td style="border:1px solid #ccc;padding:6px">Qazi-ul-Quzat</td><td style="border:1px solid #ccc;padding:6px">Judiciary</td></tr>
<tr><td style="border:1px solid #ccc;padding:6px">Diwan-i-Insha</td><td style="border:1px solid #ccc;padding:6px">Mir Manshi</td><td style="border:1px solid #ccc;padding:6px">Government papers and royal correspondence</td></tr>
<tr><td style="border:1px solid #ccc;padding:6px">Diwan-i-Saman</td><td style="border:1px solid #ccc;padding:6px">Mir-us-Saman</td><td style="border:1px solid #ccc;padding:6px">Imperial household and Mughal karkhanas</td></tr>
<tr><td style="border:1px solid #ccc;padding:6px">Sadr-us-Sudur</td><td style="border:1px solid #ccc;padding:6px">Sadar-i-Jahan</td><td style="border:1px solid #ccc;padding:6px">Charitable and religious endowments (ecclesiastical department)</td></tr>
</table>

<h3>Provincial Administration</h3>
<ul>
<li>&#8226; <strong>Subas (Provinces)</strong>
  <ul>
  <li style="padding-left:2em">&#9702; They were headed by the <strong>Subedar/ Sipahsalar</strong> (provincial governor), whose main duty was to maintain law and order.</li>
  <li style="padding-left:2em">&#9702; <strong>Diwan</strong> was the chief finance officer.</li>
  <li style="padding-left:2em">&#9702; <strong>Bakshi</strong> was the chief military official.</li>
  <li style="padding-left:2em">&#9702; Judicial administration was overseen by the <strong>Qazi</strong>.</li>
  </ul>
</li>
<li>&#8226; <strong>Sarakars (Districts)</strong>
  <ul>
  <li style="padding-left:2em">&#9702; Headed by <strong>Faujdars</strong> responsible for the maintenance of law and order.</li>
  <li style="padding-left:2em">&#9702; <strong>Amalguzars</strong> were in charge of revenue administration.</li>
  </ul>
</li>
<li>&#8226; <strong>Praganas (Revenue Circles)</strong>
  <ul>
  <li style="padding-left:2em">&#9702; Revenue units headed by <strong>Shiqdar</strong> responsible for the maintenance of law and order</li>
  <li style="padding-left:2em">&#9702; <strong>Amil/ Karori</strong> was in charge of revenue collection.</li>
  <li style="padding-left:2em">&#9702; <strong>Fotedar</strong> was the treasury official. His responsibility was to oversee the smooth remission of the revenue collected to the imperial treasury.</li>
  </ul>
</li>
<li>&#8226; <strong>Gaon (Village)</strong>
  <ul>
  <li style="padding-left:2em">&#9702; <strong>Zamindars</strong> were local landowners who acted as <strong>intermediaries</strong> between the state and the villages.</li>
  <li style="padding-left:2em">&#9702; They <strong>collected revenue</strong> in the exchange for a commission and enjoyed tax exemptions.</li>
  <li style="padding-left:2em">&#9702; As Chaudhris they also had <strong>policing powers</strong>.</li>
  <li style="padding-left:2em">&#9702; However, they were <strong>not part of the Mughal bureaucracy</strong>.</li>
  </ul>
</li>
</ul>
<p>During Akbar&#8217;s period, there were 15 subas. By the time of Shahjahan, the empire had expanded and there were 22 subas. During Aurangzeb&#8217;s reign, there were 21 subas.</p>

<h2>Revenue administration</h2>
<p>Different systems of land revenue assessment and collection were used in different parts of the Mughal empire. This was done to account for the vastness of the empire and its geographical and cultural diversity.</p>
<ul>
<li>&#8226; <strong>Nasq/ Nasaq</strong> - The revenue demand was raised on the basis of previous year&#8217;s production.</li>
<li>&#8226; <strong>Batai/ Galla Bakshi</strong> - Revenue was collected, based on the current year&#8217;s production.
  <ul>
  <li style="padding-left:2em">&#9702; <strong>Khet Batai</strong> - Standing crops were divided.</li>
  <li style="padding-left:2em">&#9702; <strong>Lank Batai</strong> - The crops were harvested and stocked before being divided</li>
  <li style="padding-left:2em">&#9702; <strong>Ras Batai</strong> - Grain was beaten and collected before being divided.</li>
  </ul>
</li>
<li>&#8226; <strong>Zabti</strong> - Introduced by Sher Shah Suri.
  <ul>
  <li style="padding-left:2em">&#9702; Revenue was estimated on the basis of <strong>measurement of sown area and assessment of the quality</strong> of land.</li>
  <li style="padding-left:2em">&#9702; <strong>Jama</strong> was the estimated revenue while <strong>Hasil</strong> was the realised revenue.</li>
  <li style="padding-left:2em">&#9702; The fluctuations between Jama and Hasil was a major concern for the crown.</li>
  </ul>
</li>
</ul>

<h3>Todarmal Bandobast/ Ain-i-Dahsala</h3>
<p>Akbar introduced the Todarmal Bandobast/ Ain-i-Dahsala designed by Raja Todarmal to minimise the gap between Jama and Hasil.</p>
<p>The Features of this arrangement were-</p>
<ul>
<li>&#8226; The system was based on the <strong>survey and measurement</strong> of the sown area.</li>
<li>&#8226; The rate of land revenue was fixed at <strong>half of the estimated production.</strong></li>
<li>&#8226; The <strong>average production of the previous 10 years</strong> was taken to estimate the current year&#8217;s production.</li>
<li>&#8226; Land was divided into <strong>3 categories on the basis of frequency of cultivation</strong> &#8211;
  <ul>
  <li style="padding-left:2em">&#9702; <strong>Polaj</strong>- Cultivated every year</li>
  <li style="padding-left:2em">&#9702; <strong>Parauti</strong>- left fallow of 1-2 year after every crop</li>
  <li style="padding-left:2em">&#9702; <strong>Chachar</strong>- left fallow for 3-4 years after every crop</li>
  </ul>
</li>
<li>&#8226; Each of these categories was subdivided into <strong>three subclasses of Good, Average and Bad, based on soil fertility</strong>.
  <ul>
  <li style="padding-left:2em">&#9702; The <strong>average production</strong> from these subclasses was applied to make an estimate of production.</li>
  </ul>
</li>
<li>&#8226; Revenue was collected in <strong>cash.</strong></li>
<li>&#8226; <strong>Dasturs</strong> (regional price circles) were created to convert the revenue demand into cash form.
  <ul>
  <li style="padding-left:2em">&#9702; Price lists called the <strong>Dastur-i-Amal</strong> were created for each Dastur by taking an average of the prevailing price over the previous 10 years.</li>
  </ul>
</li>
<li>&#8226; Akbar continued the policy of issuing <strong>Patta and Qabuliyat</strong> to farmers.</li>
<li>&#8226; Ain-i-Dahsala- System <strong>incentivised the expansion of agriculture</strong>
  <ul>
  <li style="padding-left:2em">&#9702; 4-5 year tax holiday was given for Banjar land (culturable wasteland).</li>
  <li style="padding-left:2em">&#9702; Further, at least 50% of donated land was to be Banjar land.</li>
  </ul>
</li>
<li>&#8226; <strong>Sondhar loans</strong> were given to farmers in times of famine.</li>
</ul>

<h4>Significance</h4>
<ul>
<li>&#8226; The Ain-i-Dahsala System allowed Akbar to maintain a <strong>large standing army</strong> which could be used to expand the empire and maintain border security.</li>
<li>&#8226; It also allowed the state to undertake <strong>massive construction projects</strong>, further, it helped in the <strong>integration of zamindars into the state</strong>, thus, reducing the possibility of rebellion.</li>
<li>&#8226; However, the <strong>breakdown of the compact</strong> between the state and the peasantry due to the sudden rise in revenue burden later led to frequent <strong>agrarian revolts</strong> by groups such as the Jats, Sikhs, Satnamis.</li>
</ul>

<h2>Mansabdari System</h2>

<h3>Objectives</h3>
<ul>
<li>&#8226; This system was originally created by Chengis Khan and was modified for Indian conditions by Akbar.</li>
<li>&#8226; Its objective was to provide effective administration by <strong>arranging Mughal military aristocracy and bureaucracy into a merit based hierarchy.</strong></li>
<li>&#8226; It was also designed to <strong>strengthen the emperor&#8217;s centrality and streamline military administration</strong>.</li>
</ul>

<h3>Elements</h3>
<ul>
<li>&#8226; It was a dual rank system, that is, each Mughal official was assigned 2 ranks
  <ul>
  <li style="padding-left:2em">&#9702; <strong>Zat</strong>- it denoted the <strong>personal rank</strong> of the Mansabdar, varying from 10 to 5000. It determined the Mansabdar&#8217;s seniority and salary.</li>
  <li style="padding-left:2em">&#9702; <strong>Sawar</strong>- It represented the <strong>military duties</strong> of the Mansabdars in terms of the number of horsemen they maintained, ranging from 10 to 5000.</li>
  <li style="padding-left:2em">&#9702; During Akbar&#8217;s reign, 33 grades of Mansabdars were arranged in a hierarchy of 10 Zat - 10 Sawar to 5000 Zat to 5000 Sawar.</li>
  <li style="padding-left:2em">&#9702; Each rank had 3 grades-
    <ul>
    <li style="padding-left:4em">&#9632; Sawar rank = Zat rank
      <ul>
      <li style="padding-left:6em">&#9679; eg. 5000 Zat - 5000 Sawar</li>
      </ul>
    </li>
    <li style="padding-left:4em">&#9632; &#189; Zat rank &lt; Sawar rank &lt; Zat rank
      <ul>
      <li style="padding-left:6em">&#9679; eg. 5000 Zat - 3000 Sawar</li>
      </ul>
    </li>
    <li style="padding-left:4em">&#9632; Sawar rank &lt; &#189; Zat rank
      <ul>
      <li style="padding-left:6em">&#9679; eg. 5000 Zat -2000 Sawar.</li>
      </ul>
    </li>
    </ul>
  </li>
  </ul>
</li>
<li>&#8226; <strong>Dah-Bishti System</strong> - It was used to determine the ranks of common cavalrymen/ footsoldiers.
  <ul>
  <li style="padding-left:2em">&#9702; On average, each horseman had to have two horses, to ensure a contingency mount.</li>
  <li style="padding-left:2em">&#9702; There were three ranks for every unit of 10 cavalrymen-
    <ul>
    <li style="padding-left:4em">&#9632; Seniormost three soldiers had to maintain three horses each.</li>
    <li style="padding-left:4em">&#9632; Intermediate 4 soldiers had to maintain two horses each.</li>
    <li style="padding-left:4em">&#9632; Junior-most 3 soldiers had to maintain one horse each.</li>
    </ul>
  </li>
  <li style="padding-left:2em">&#9702; Thus, there were to be 20 horses for 10 men.</li>
  </ul>
</li>
<li>&#8226; <strong>Salaries</strong> - Mansabdars could either be paid in cash or jagirs - land revenue assignments.
  <ul>
  <li style="padding-left:2em">&#9702; Those paid in cash were called <strong>Naqadi</strong> Mansabdars.</li>
  <li style="padding-left:2em">&#9702; While those who paid through jagirs were called <strong>Jagirdar</strong>.</li>
  <li style="padding-left:2em">&#9702; Jagirs were of two kinds-
    <ul>
    <li style="padding-left:4em">&#9632; <strong>Tankha Jagirs</strong> &#8211; It was non-hereditary and non transferable, and always situated outside of Mansabdar&#8217;s jurisdiction.</li>
    <li style="padding-left:4em">&#9632; <strong>Watan Jagirs</strong>- It was hereditary and transferable, and situated within the Mansabdar&#8217;s jurisdiction.
      <ul>
      <li style="padding-left:6em">&#9679; These were exclusively given to Rajputs.</li>
      </ul>
    </li>
    </ul>
  </li>
  </ul>
</li>
<li>&#8226; The Mughal Mansabdari was quite <strong>heterogeneous</strong>, consisting of several ethnic, religious and linguistic groups, such as-
  <ul>
  <li style="padding-left:2em">&#9702; Turanis &#8211; Turkish noblemen belonging to Central Asia</li>
  <li style="padding-left:2em">&#9702; Iranis &#8211; Persian nobleman</li>
  <li style="padding-left:2em">&#9702; Afghans</li>
  <li style="padding-left:2em">&#9702; Hindustanis/ Shaikhzadas &#8211; Indian Muslim converts</li>
  <li style="padding-left:2em">&#9702; Deccanis</li>
  <li style="padding-left:2em">&#9702; Rajputs</li>
  </ul>
</li>
<li>&#8226; The system <strong>strengthened the Emperor&#8217;s position by ensuring the loyalty</strong> of the nobility.
  <ul>
  <li style="padding-left:2em">&#9702; All important assignments, transfers, promotions, demotions and dismissals were done by the emperor.</li>
  </ul>
</li>
<li>&#8226; The <strong>success</strong> of the system depended upon-
  <ul>
  <li style="padding-left:2em">&#9702; The <strong>Emperor&#8217;s personal qualities</strong></li>
  <li style="padding-left:2em">&#9702; The <strong>constant expansion</strong> of empire so that more land could be distributed as jagirs</li>
  </ul>
</li>
<li>&#8226; During Akbar&#8217;s reign the Mansabdari had only 5000 members, with very few having ranks more than 1000.
  <ul>
  <li style="padding-left:2em">&#9702; By the time of Shahjahan, the total number of Jagirdar had increased to 14,000 and were being given ranks as high as 40,000 Zat - 40,000 Sawar.</li>
  <li style="padding-left:2em">&#9702; This led to <strong>increasing shortage of Jagirs</strong> which gradually precipitated the <strong>Jagirdari crisis</strong>.</li>
  </ul>
</li>
<li>&#8226; To addresses this issue, some innovations were introduced-
  <ul>
  <li style="padding-left:2em">&#9702; <strong>Du-Aspa &#8212; Si-Aspa</strong> (2 horse- 3 horse)
    <ul>
    <li style="padding-left:4em">&#9632; Under <strong>Jahangir</strong>, some Mansabdars were given an additional rank of Du-Aspa &#8212; Si-Aspa and would have to maintain twice or thrice horses customarily required.</li>
    <li style="padding-left:4em">&#9632; This was done so that a large number of horses could be maintained without giving a higher Zat rank to Mansabdars.</li>
    <li style="padding-left:4em">&#9632; Additional cash payment was made to provide for the added expense.</li>
    </ul>
  </li>
  <li style="padding-left:2em">&#9702; <strong>Monthly Scale</strong>
    <ul>
    <li style="padding-left:4em">&#9632; Introduced by <strong>Shahjahan</strong>, under which Mansabdars were categorised as 6 months, 9 months or 12 months Jagirdar.</li>
    <li style="padding-left:4em">&#9632; Jagirs were assigned proportionally with reduction in Sawar duties.</li>
    </ul>
  </li>
  </ul>
</li>
<li>&#8226; However, the problem assumed crisis proportions during Aurangzeb&#8217;s reign and ultimately led to the empire&#8217;s disintegration.</li>
</ul>

<h2>Religious policy of Akbar</h2>
<p>The religious policy of Akbar went through a <strong>long evolution</strong> and emerged as a standard for those who aspired to rule in India. It was based on Akbar&#8217;s realisation of the <strong>pluralistic</strong> character of Hindustan.</p>

<h4>The factors which shaped the religious policy of Akbar are: -</h4>
<ol>
<li>Liberal Mongol tradition</li>
<li>The impact of Sufi-Bhakti tradition</li>
<li>Influence of his mother Hamida Banu Begum and mentor Abdul Latif</li>
<li>Apart from that, Akbar&#8217;s religious policy was guided by his political ambition as well.
  <ul>
  <li style="padding-left:2em">&#9702; He was inclined to form a composite and unified aristocratic class comprising various racial and communal groups.</li>
  </ul>
</li>
</ol>

<h4>Different stages in the religious policy of Akbar :-</h4>

<h4>The first stage (1556-1570):-</h4>
<p>During this stage Akbar remained an orthodox Sunni Muslim in his personal conviction but still he maintained a liberal religious policy in his statecraft.</p>
<ul>
<li>&#8226; He banned the war captives being forcefully converted to Islam from 1562,</li>
<li>&#8226; the abolition of the pilgrimage tax in 1563,</li>
<li>&#8226; the abolition of Jizya in 1564.</li>
</ul>

<h4>The second stage (1570-1579):-</h4>
<p>During this period, Akbar was <strong>inspired by mystical ideas</strong>, that&#8217;s why he experimented with the <strong>&#8216;Ibadatkhana&#8217;</strong> (a place for open religious discourses).</p>
<ul>
<li>&#8226; He laid the foundation of Ibadatkhana in 1575 and there he introduced the system of religious conversation and debates.</li>
<li>&#8226; Initially, these debates were confined to Islamic texts and culture, but later it was opened for different religious sects i.e. Hinduism, Jainism, Christianity, Zoroastrianism etc.</li>
<li>&#8226; So, in one sense, nearly 300 years before the religious parliament of Chicago, Akbar successfully experimented with a religious assembly.</li>
</ul>
<p>Although, on the one hand, Akbar propagated the mystical ideas and religious universalism through the debates of Ibadatkhana but simultaneously, he <strong>tried to strengthen</strong> the political power and position of the <strong>throne with the help of some Islamic institutions.</strong></p>
<ul>
<li>&#8226; In June 1579, Akbar <strong>read the &#8216;Khutba&#8217; in his name</strong> in the Jama Mosque at Fatehpur Sikri.
  <ul>
  <li style="padding-left:2em">&#9702; In this way, Akbar tried to usurp the position of chief Ulema.</li>
  </ul>
</li>
<li>&#8226; In September 1579, Akbar proclaimed a <strong>&#8216;Mahzarnama&#8217;</strong>.
  <ul>
  <li style="padding-left:2em">&#9702; According to this declaration, if there was a difference among different Ulemas on any religious issue, Akbar, being <strong>&#8216;Insan-i-Kamil&#8217;</strong>, could choose any of the views. Insan-i-Kamil means the most rational person.</li>
  </ul>
</li>
<li>&#8226; Not simply that, Akbar <strong>authorised himself to issue new orders</strong> in the interests of the state <strong>while neglecting all advice</strong>.</li>
<li>&#8226; On the basis of Mahzarnama, Akbar took titles like <strong>&#8216;Imam-i-Adil&#8217;</strong> &amp; <strong>&#8216;Insan-i-Kamil&#8217;</strong>.
  <ul>
  <li style="padding-left:2em">&#9702; So even in the matter of foreign policy, he asserted parity with the Persian Emperor and Ottoman Caliph.</li>
  </ul>
</li>
</ul>
<p>The British scholar <strong>Smith</strong> coined the term <strong>&#8216;Decree of Infallibility&#8217;</strong> for Mahzarnama.</p>
<ul>
<li>&#8226; He emphasised that by introducing Mahzarnama, Akbar tried to attain the status of The Prophet, but upon observation, we find that Smith was mistaken in his analysis of the Mahzarnama.</li>
<li>&#8226; In fact, through Mahzarnama, Akbar was <strong>trying to undermine the role of the Ulemas</strong> and <strong>bring relations between Hindus and Muslims directly under his control</strong>.</li>
<li>&#8226; But orthodox ulemas were not ready to accept the changed situation. They, in association with disgruntled nobles, revolted against the state.</li>
</ul>

<h4>Third stage (after 1579): -</h4>
<p>Akbar was able to suppress the revolt but realised his <strong>error in using religion to fulfil his non-religious objectives.</strong> So now, Akbar tried to undermine religion in statecraft.</p>
<ul>
<li>&#8226; During this stage, the basis of Akbar&#8217;s religious policy was prepared by his experience of the last 20 years as well as the failure of his prior policy.</li>
</ul>
<p>In 1582, Akbar introduced his famous <strong>&#8216;Din-i-Ilahi&#8217;</strong>. Earlier it was known as the &#8216;Tauhid-i-Ilahi&#8217;.</p>
<p>On observing minutely, we find that it was <strong>neither a separate sect nor a religious creed</strong>. It <strong>wasn&#8217;t ritualistic</strong> in nature. Its method was very simple and easily applicable. Akbar opened its gate for all.</p>
<ul>
<li>&#8226; Normally, under this, there were <strong>two stages</strong> of the spiritual development of the &#8216;Ilahia&#8217;. During the first stage, followers simply received Shasta (Allah Hu Akbar) from Akbar personally. In the second stage, the devotee submitted before him, their property, their honour, their religion and their life.</li>
</ul>
<p>So far as the number of followers is concerned, the <strong>number</strong> of common followers who were at the first stage of initiation wasn&#8217;t more than a thousand, while the number of those who reached up to the second stage was nearly 18 among Muslims and Birbal was the single among Hindus.</p>

<h4>Do you agree with the idea of Smith that Akbar&#8217;s Din-i-Ilahi was a monument of folly?</h4>
<p>Din-i-Ilahi of Akbar is a <strong>unique</strong> example of a religious and spiritual <strong>initiative</strong> taken by a monarch <strong>to promote religious harmony</strong> in his multi-racial, multi-lingual and multi-regional empire. The true nature of such an initiative couldn&#8217;t be perceived by Smith so he called it a folly.</p>
<p>In fact, the <strong>mistake</strong> in his perception was guided by a number of <strong>factors</strong>.</p>
<ul>
<li>&#8226; First, Smith <strong>did not have the neutral source material</strong>. For example, the writings of Badauni and that of Portuguese Christian priests both were anti-Akbar in their approach for different reasons. Badauni was irritated with the rational policy of Akbar and Christian priests were irritated because Akbar didn&#8217;t accept Christianity.</li>
<li>&#8226; Secondly, the followers of Din-i-Ilahi were very limited in number and <strong>Smith took numerical strength as the criterion</strong> for evaluation of success or failure of Din-i-Ilahi.</li>
<li>&#8226; Thirdly, the writing of Smith reflected the <strong>common prejudice of British authors</strong> against the Mughals, who left a rich legacy against which the British had to carry out a long struggle.</li>
</ul>
<p><strong>In fact, Din-i-Ilahi should be evaluated from a different perspective.</strong></p>
<ul>
<li>&#8226; Through Din-i-Ilahi, Akbar tried to promote his <strong>political ambition</strong>. It wasn&#8217;t a different religious sect rather it was an attempt to undermine the role of religion in statecraft.</li>
<li>&#8226; In other words, through Din-i-Ilahi, Akbar presented a <strong>code of conduct</strong> on the basis of which <strong>nobles from different classes and communities could be linked to the state</strong>. Apart from that, Akbar also tried to ensure the personal loyalty of the nobles to the institution of monarchy.</li>
<li>&#8226; So, the success of <strong>Din-i-Ilahi can&#8217;t be evaluated on the basis of numerical strength of its followers rather on the basis of Akbar&#8217;s intention</strong> behind it.</li>
<li>&#8226; Furthermore, the <strong>Safavid rulers of Persia also made such attempts</strong>.</li>
</ul>
<p>So, we can&#8217;t agree with the view of Smith that Din-i-Ilahi is a monument of folly.</p>

<h2>Policy towards non-Muslims/ Rajput policy:-</h2>
<p>Hindu nobles could have been inducted into royal service under Muslim rulers for a long time. Even marriage between Muslims and Hindus wasn&#8217;t a new thing but Akbar certainly gave a <strong>new orientation</strong> to state policy towards Rajput or Hindu nobles. In fact, he <strong>successfully assimilated</strong> this warrior class within the Mughal&#8217;s system of government.</p>

<h4>Factors encouraging his Rajput policy -</h4>
<ol>
<li>He was inclined to break the power of Afghans in India.</li>
<li>To break the monopoly of Mughal nobles.</li>
<li>Akbar wanted to enter into the largest military market in India.</li>
<li>The region of Rajasthan had economic and strategic importance and it was rich in certain minerals.</li>
</ol>

<h4>Methods of Akbar</h4>
<ol>
<li>Akbar employed the policy of <strong>carrot and stick</strong> to Rajput nobles.
  <ul>
  <li style="padding-left:2em">&#9702; Rajput states which submitted before him were restored to their rulers as <strong>&#8216;Watan Jagir&#8217;</strong>.</li>
  <li style="padding-left:2em">&#9702; Akbar also inducted them into royal service and they were given the higher Mansabs.</li>
  <li style="padding-left:2em">&#9702; Akbar preferred matrimonial relations as a cementing force but it wasn&#8217;t compulsory.</li>
  </ul>
</li>
<li>As a policy of stick, Akbar <strong>didn&#8217;t hesitate to suppress those states which were not ready to submit</strong> before him e.g. Mewar.</li>
</ol>

<h4>Benefit for Mughals:-</h4>
<ol>
<li>The <strong>social base of the Mughal Empire widened</strong> as even Rajput nobles came to support the empire.</li>
<li>As a result of the pragmatic policy of Akbar towards Rajputs, the <strong>arch-enemy of the empire was converted into powerful friends</strong> and the Rajput nobles became a pillar for Mughals and their empire.</li>
</ol>

<h4>Underline the difference in Akbar&#8217;s Rajput policy with respect to his predecessors.</h4>
<ul>
<li>&#8226; It is true that the <strong>policy towards non-Muslim nobles</strong> in India was not the product of a single ruler and a single time period, rather it was the product of <strong>gradual evolution</strong>.
  <ul>
  <li style="padding-left:2em">&#9702; However, we can&#8217;t deny the fact that Akbar, by bringing a great deal of innovation in his policy, developed it as a model.</li>
  </ul>
</li>
<li>&#8226; Akbar&#8217;s predecessors like Babur and Humayun and even earlier sultans used to induct Hindu nobles into royal service and some of them even maintained matrimonial relations with them.
  <ul>
  <li style="padding-left:2em">&#9702; For example, Babur got his two sons married to Rajput princesses of the same family. Likewise, Shershah got his son, Islam Shah, married to the daughter of a Rajput king Maldeo.</li>
  </ul>
</li>
<li>&#8226; But <strong>Akbar adopted a more effective policy</strong> towards Rajputs.</li>
<li>&#8226; Akbar <strong>inducted those Rajput nobles into Mughal service who submitted</strong> before him and provided them a <strong>greater incentive</strong> to ensure their loyalty.
  <ul>
  <li style="padding-left:2em">&#9702; Their own regions were given to them as a <strong>Watan Jagir</strong>.</li>
  </ul>
</li>
<li>&#8226; Likewise, <strong>while Akbar preferred matrimonial relations</strong> with the Rajputs but <strong>never made it a compulsion</strong>.
  <ul>
  <li style="padding-left:2em">&#9702; Furthermore, once the matrimonial relation was established, Akbar maintained this relation very warmly.</li>
  <li style="padding-left:2em">&#9702; He <strong>gave religious freedom</strong> to his Rajput wives and also permitted them to maintain deep relations with their father&#8217;s house.</li>
  </ul>
</li>
<li>&#8226; In this way, Akbar brought innovation in relation with Rajput.</li>
</ul>

<h2>Contribution to social reforms: -</h2>
<p>Akbar took interest even in social reforms. He increased the <strong>age of marriage</strong> for both boys and girls.</p>
<p>He even <strong>tried to discourage the Sati system</strong> or at least to stop the self-immolation of those women who didn&#8217;t have any children.</p>

<h2>Cultural contribution: -</h2>
<p>He was a <strong>great patron of literature and art</strong>. His court was adorned by several scholars.</p>
<ul>
<li>&#8226; He encouraged not simply Persian literature but also Indian literature.</li>
<li>&#8226; He established a translation department which translated a number of Sanskrit texts into Persian.</li>
<li>&#8226; He also encouraged Indian elements in architecture, painting and music.</li>
</ul>

<h2>Q. Evaluate the achievements of Akbar as a national ruler.</h2>
<p>Akbar can be given the credit for being a national ruler on the ground that he created an <strong>all India model</strong>.</p>
<ul>
<li>&#8226; Creation of an <strong>all India empire</strong></li>
<li>&#8226; Tried to develop a <strong>uniform model of government</strong> from central to local administration</li>
<li>&#8226; He developed a <strong>theory of kingship</strong> as well as a <strong>liberal religious policy</strong> which suited the environment and character of Hindustan which was multilingual, multicultural and multi-communal.</li>
<li>&#8226; He promoted a <strong>composite culture</strong>.</li>
</ul>
<p>But while using the term national we must be conscious of some details.</p>
<ul>
<li>&#8226; <strong>A nation requires good integration between the state and the society</strong>. Therefore, during the period of Akbar, the term &#8216;nation&#8217; appears to be far ahead of his time.</li>
<li>&#8226; Furthermore, whatever <strong>unity</strong> Akbar obtained within his empire, was <strong>on the level of nobles</strong> not on the level of common people. So, the word &#8216;national&#8217; should be used with some reservations.</li>
</ul>"""

path = 'lib/noteContent.ts'
content = open(path, encoding='utf-8').read()
pattern = r"('akbar':\s*`)`"
replacement = lambda m: f"'akbar': `{new_html}`"
new_content, count = re.subn(pattern, replacement, content)
print(f"Replaced {count} occurrence(s).")
open(path, 'w', encoding='utf-8').write(new_content)
