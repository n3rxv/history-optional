import re

new_html = r"""<h2>Jahangir (1605 - 1627)</h2>

<h3>Rajput policy: -</h3>
<ul>
<li>&#8226; His Rajput policy reflected more <strong>continuity</strong> than change.</li>
<li>&#8226; He maintained good relations with Rajputs. He continued to induct them into royal service and even continued matrimonial relations.</li>
<li>&#8226; However, he <strong>favoured the Bundela Rajputs over the Kachhwahas</strong>.
  <ul>
  <li style="padding-left:2em">&#9702; In one way, it was justified because the over-importance of the Kachhawa family was creating friction in the relationship with other Rajput families.</li>
  </ul>
</li>
</ul>

<h3>Religious policy: -</h3>
<ul>
<li>&#8226; Jahangir, as a whole, <strong>maintained the liberal religious policy</strong> of Akbar.</li>
<li>&#8226; Even after Akbar, he <strong>continued to promote Din-i-Ilahi</strong> by giving Shasta.</li>
<li>&#8226; Likewise, he also gave a large <strong>donation to Bir Singh Bundela</strong> for building Hindu temples at Mathura, Vrindavan and Banaras.</li>
<li>&#8226; He even <strong>permitted his grandson to adopt Christianity</strong>.</li>
<li>&#8226; But certain steps taken by him put a <strong>question mark</strong> on his liberal policy.
  <ul>
  <li style="padding-left:2em">&#9702; For example, he tortured Guru Arjandeva to death.</li>
  <li style="padding-left:2em">&#9702; On one occasion he demolished the Boar statue at Pushkar.</li>
  <li style="padding-left:2em">&#9702; Likewise, he banished Digambar saints from Gujarat.</li>
  </ul>
</li>
</ul>

<h3>Deccani policy:-</h3>
<p>It was <strong>Akbar</strong> who first set foot in the Deccan, snatched <strong>Berar and Balaghat</strong>, and then annexed <strong>Khandesh</strong>.</p>
<ul>
<li>&#8226; <strong>Jahangir did not have any specific ambition in the Deccan</strong>, rather he simply wanted to maintain control over the regions conquered by Akbar.</li>
<li>&#8226; In the meantime, <strong>Malik Amber</strong>, emerged as the prime minister of Ahmadnagar.
  <ul>
  <li style="padding-left:2em">&#9702; With the combined power of Ahmednagar, Bijapur and Golconda, he <strong>expelled the Mughal Subedar, Abdul Rahim Khan-i-Khanan</strong>, from the Deccan.</li>
  </ul>
</li>
<li>&#8226; Then Jahangir <strong>sent Khurram to suppress the revolt</strong>.
  <ul>
  <li style="padding-left:2em">&#9702; He <strong>restored the Mughal power</strong> by defeating the combined forces of Ahmednagar, Bijapur and Golconda.</li>
  <li style="padding-left:2em">&#9702; Jahangir awarded him the title of <strong>&#8216;Shah Jahan&#8217;</strong> to commemorate this victory.</li>
  <li style="padding-left:2em">&#9702; But even now, <strong>Jahangir did not claim more territory</strong> from the defeated powers.</li>
  </ul>
</li>
<li>&#8226; It amply shows that Jahangir wasn&#8217;t having any further territorial ambition in the Deccan.</li>
</ul>

<h2>Shahjahan (1628 - 1658)</h2>

<h3>Rajput policy:-</h3>
<p>We can underline a slight change in the Rajput policy of Shahjahan.</p>
<ul>
<li>&#8226; Although he <strong>continued to employ Rajput nobles</strong> into Mughal service, he <strong>discouraged matrimonial relations</strong> with them.</li>
</ul>

<h3>Religious policy:-</h3>
<p>Even in his religious policy, Shahjahan seemed to have <strong>made a departure</strong> from the liberal outlook of Akbar and Jahangir.</p>
<ul>
<li>&#8226; He showed a sense of <strong>religious orthodoxy and promoted Islam.</strong>
  <ul>
  <li style="padding-left:2em">&#9702; He <strong>nullified the marriages of Muslim girls to Hindu men</strong> in Kashmir and decreed that they would remain void, till they were performed again with Islamic customs.</li>
  <li style="padding-left:2em">&#9702; Some instances of <strong>temple demolition</strong> also took place at Orchha.</li>
  <li style="padding-left:2em">&#9702; He also <strong>tried to revive the pilgrimage tax</strong> but after the advice of Kavindracharya (saint of Mathura), he withdrew the change.</li>
  </ul>
</li>
<li>&#8226; However, he <strong>displayed religious liberalism during the later phase</strong> of life, probably under the influence of Dara Shikoh and Jahanara Begum.</li>
</ul>

<h3>Deccan policy: -</h3>
<p>Shortly after the enthronement of Shahjahan, <strong>Khan-i-Jahan Lodhi</strong>, the governor of the Deccan revolted with the help of <strong>Murtaza Nizam Shah, the ruler of Ahmadnagar</strong>.</p>
<p>Thus, <strong>Shahjahan decided to annihilate Ahmednagar completely</strong>. He believed that this was the only solution for the Deccani problem.</p>
<ul>
<li>&#8226; The rebellion was crushed, and in <strong>1633, Ahmednagar was annexed.</strong></li>
<li>&#8226; But soon after this, he made a very <strong>strong diplomatic gesture towards Bijapur and Golconda</strong> because he knew that their support was necessary to give legitimacy to the Mughal conquest of Ahmednagar.</li>
<li>&#8226; In <strong>1636, a historical agreement was signed.</strong> It&#8217;s important provisions were-
  <ul>
  <li style="padding-left:2em">&#9702; Bijapur was given one-third of the territory of Ahmednagar in return for a payment of 80 Lakh Rupees.</li>
  <li style="padding-left:2em">&#9702; Bijapur and Golconda were given the right to expand in the south at the cost of Nayakas and whatever region they conquered, would be divided 2:1 i.e. two parts to Bijapur and one part to Golkonda.</li>
  </ul>
</li>
<li>&#8226; But in 1656, Shahjahan reversed his prior commitments.</li>
</ul>
<p>Subsequent events proved that the reversal of the treaty by the Mughal Emperor would result in the Deccan crisis.</p>

<h2>Aurangzeb (1658-1707)</h2>
<p>In the evaluation of Aurangzeb, one can find different approaches to historiography &#8211;</p>
<ol>
<li>Traditional approach</li>
<li>Marxist/ New approach</li>
</ol>

<h4>Traditional approach:-</h4>
<ul>
<li>&#8226; Scholars like <strong>Sir Jadunath Sarkar, S.R. Sharma</strong> and others belong to this school.</li>
<li>&#8226; According to this approach, Aurangzeb was presented as an <strong>antithesis to Akbar</strong>. It was his <strong>orthodox religious policy and prejudiced Rajput policy</strong> which became instrumental in the <strong>decline</strong> of the Mughal Empire.
  <ul>
  <li style="padding-left:2em">&#9702; About his religious policy, it has been emphasised that Aurangzeb <strong>tried to rule in strict adherence with Sharia law from the very beginning</strong> and that there was <strong>no change in his policy throughout his career.</strong></li>
  <li style="padding-left:2em">&#9702; Likewise, his <strong>Rajput policy was projected as part of his anti-Hindu agenda</strong> and it was emphasised that this <strong>proved very costly</strong> for the empire.</li>
  </ul>
</li>
</ul>

<h4>Marxist/ New approach:-</h4>
<ul>
<li>&#8226; After the 1950s, a new trend in historiography emerged. According to this new historiography, <strong>the role of an individual shouldn&#8217;t be over-emphasised</strong> as a factor of change rather it should be evaluated in the context of the objective material factors.</li>
<li>&#8226; So now they emphasised on the <strong>objectives behind and the impacts of the religious, Rajput and Deccan policies of Aurangzeb.</strong>
  <ul>
  <li style="padding-left:2em">&#9702; In this way, the new historiography created the background for the re-evaluation of the religious policy, Rajput policy as well as Deccan policy of Aurangzeb.</li>
  </ul>
</li>
</ul>

<h2>Religious Policy of Aurangzeb</h2>

<h4>Stage One (before 1679): -</h4>
<ol>
<li>It is true, in his personal conviction, Aurangzeb was an <strong>orthodox Sunni Muslim</strong>, but it is equally true that his policy and programmes were guided not only by his orthodox mind but also by the <strong>circumstances</strong> of which he was a product.
  <ul>
  <li style="padding-left:2em">&#9702; For example, in one sense, the basis of his orthodox religious policy was prepared in the course of his <strong>war of succession</strong> itself.
    <ul>
    <li style="padding-left:4em">&#9632; During the war of succession with Dara Shukoh, he gave the <strong>slogan &#8216;Islam vs Heretics&#8217;</strong> i.e. Aurangzeb vs Dara Shukoh. Thus, he raised the expectations of ulemas and orthodox Muslims, winning their support. It was natural for him to appease these sections.</li>
    </ul>
  </li>
  <li style="padding-left:2em">&#9702; But <strong>initially, he tried to appease orthodox Muslims and ulemas without antagonising Hindus.</strong>
    <ul>
    <li style="padding-left:4em">&#9632; So, he started a <strong>purification programme</strong> within Islam and <strong>banned all intoxicants, striking off Kalima from coins, banning the Tika ceremony and Tuladan etc.</strong></li>
    </ul>
  </li>
  </ul>
</li>
<li>Then he <strong>took some measures which could be perceived as harsh</strong> but for every such measure, <strong>individual factors</strong> could be identified.
  <ul>
  <li style="padding-left:2em">&#9702; For example, he <strong>banned history-writing as well as music</strong>. According to Marxist historians, this was an <strong>economic measure</strong>, with the objective of shedding off some burden on the treasury.</li>
  <li style="padding-left:2em">&#9702; He <strong>dismissed the Hindu officers</strong> from the post of Karori for sometime. This step was guided by the objective <strong>to promote employment among the Muslim youth</strong>.</li>
  <li style="padding-left:2em">&#9702; He <strong>ordered the governor of Banares and Thatta to demolish some temples</strong>. But this also, was a reaction against <strong>rebellions</strong> in these regions.</li>
  </ul>
</li>
</ol>

<h4>Stage Two (1679-1687): -</h4>
<p>The second stage in his policy started in 1679 when he <strong>revived the Jizya</strong>.</p>
<ul>
<li>&#8226; On the basis of observations made by <strong>Manucci</strong>, some modern scholars had tried to establish that the imposition of Jizya was the result of the <strong>economic compulsions</strong> of Aurangzeb.
  <ul>
  <li style="padding-left:2em">&#9702; But this view is not convincing because the amount collected as Jizya was <strong>spent for the promotion of Islam at the discretion of the ulemas</strong>. So, there was no question of its replenishing the royal treasury.</li>
  </ul>
</li>
<li>&#8226; During the second half of his rule, Aurangzeb <strong>became entangled in Deccani issues</strong>. According to Shariyat, the <strong>bloodshed of Muslim brethren was prohibited</strong>. On this pretext, <strong>some important ulemas refused to issue Fatwa against Deccani states</strong>.
  <ul>
  <li style="padding-left:2em">&#9702; He needed a way to win their support. It was in this context that Jizya was revived.</li>
  </ul>
</li>
<li>&#8226; The decision to re-impose the Jizya was also motivated by another factor.
  <ul>
  <li style="padding-left:2em">&#9702; By this period, a <strong>number of revolts</strong> against the Mughals had been organised at the local level, such as the Jat revolt, Rajput revolt, Satnami revolt, etc. <strong>by the Hindu community.</strong></li>
  </ul>
</li>
</ul>

<h4>Stage three (1687-1707):-</h4>
<p>Once again we can underline a shift in his policy towards non-Muslims after <strong>1687 after he conquered the state of Bijapur and Golconda.</strong></p>
<ul>
<li>&#8226; Bhim Sen, a scholar who accompanied Aurangzeb to the Deccan, informs us that after conquering Bijapur and Golconda, Aurangzeb <strong>didn&#8217;t demolish any temples.</strong></li>
<li>&#8226; He also <strong>abolished Jizya in the Deccan in 1704.</strong>
  <ul>
  <li style="padding-left:2em">&#9702; Although the <strong>pretext</strong> behind this was <strong>recurring famine</strong>, the actual reason was that Aurangzeb needed the support of Hindu Nayakas against the Marathas.</li>
  </ul>
</li>
</ul>
<p>So, there is no reason to accept that neither age nor experience brought any change in the religious policy of Aurangzeb.</p>

<h2>Rajput Policy</h2>
<ul>
<li>&#8226; In 1679, after the <strong>demise of Jaswant Singh, the ruler of Jodhpur</strong>, the question of <strong>succession</strong> appeared.</li>
<li>&#8226; The <strong>intervention of Aurangzeb</strong> in this matter resulted in an open conflict between the Mughal Empire and the Rathods of Jodhpur under Durga Das. Later even Sisodias of Mewar joined the Rathods in this fight.</li>
</ul>
<p><strong>Traditionally,</strong> about the Rajput policy of Aurangzeb, there are <strong>two general perceptions-</strong></p>
<ul>
<li>&#8226; I. Aurangzeb <strong>reversed</strong> the Rajput policy of his predecessors.</li>
<li>&#8226; II. The reversal of Rajput policy by him <strong>resulted in the disintegration</strong> of the empire.</li>
</ul>
<p>But the view mentioned above isn&#8217;t convincing on following grounds-</p>
<p><strong>Firstly, Aurangzeb didn&#8217;t reverse</strong> the Rajput policy of Akbar. We have sufficient reasons to prove it.</p>
<ul>
<li>&#8226; Aurangzeb <strong>continued to induct Rajputs in royal service</strong>. Not simply that, under Aurangzeb, <strong>high Zat and Sawar ranks</strong> were enjoyed by two Rajput nobles i.e. Raja Jai Singh and Jaswant Singh.</li>
<li>&#8226; Further, since the time of Jahangir, after recalling Man Singh from Bengal, no Rajput Mansabdar had been given the <strong>post of Subedar</strong>. It was Aurangzeb who appointed Jai Singh and Jaswant Singh to that post. So, the idea of reversal of Rajput policy doesn&#8217;t appear to be convincing.</li>
</ul>
<p>Secondly, even the <strong>impact</strong> of the conflict between Aurangzeb and Rajput states shouldn&#8217;t be <strong>overestimated</strong>.</p>
<ul>
<li>&#8226; Even after Aurangzeb lost the support of the Rathods and Sisodiyas, he <strong>continued to enjoy the support of Ranthambhore, Amber, Bundi, and Kota</strong> states.</li>
<li>&#8226; Apart from that, when Jagat Singh, the successor of Rana Raj Singh of Mewar, withdrew himself from this conflict then the scope of this conflict remained much limited.</li>
</ul>

<h2>Deccani policy of Aurangzeb</h2>
<p><strong>Traditionally</strong>, the Deccan policy of Aurangzeb was evaluated by <strong>Sir Jadunath Sarkar</strong>. Aurangzeb&#8217;s Deccan policy was treated as if <strong>unrestricted expansion was simply a matter of choice for him.</strong></p>
<ul>
<li>&#8226; He tried to prove that <strong>Aurangzeb&#8217;s empire collapsed under its own weight</strong>.</li>
<li>&#8226; Aurangzeb was compared to a <strong>python that swallowed more than it could digest</strong>.</li>
<li>&#8226; He declared further that as <strong>Spanish Ulcer</strong> ruined Napoleon so Deccani Ulcer ruined Aurangzeb.</li>
</ul>
<p>But after deep observation, we find that <strong>territorial expansion was not only a matter of choice, rather it was a matter of material compulsion</strong> for almost all Mughal rulers, not only for Aurangzeb.</p>
<ul>
<li>&#8226; For example, if <strong>Akbar</strong> brought the region of <strong>Berar, Balaghat and Khandesh</strong> under his control, it was not simply to fulfil his imperialistic desire but also to control the <strong>trade of Gujarat and Malwa</strong>.</li>
<li>&#8226; Likewise, in <strong>1656, when Shah Jahan reversed the treaty of 1636</strong>, setting the stage for Southward expansion by Aurangzeb, one of the reasons behind it was to have <strong>effective control over the trade of the Coromandel coast</strong>.
  <ul>
  <li style="padding-left:2em">&#9702; In fact, <strong>in the second half of the 17th century, the mercantile traffic on the Coromandel coast was almost 4 times larger than that on Gujarat coast.</strong> Aurangzeb&#8217;s Deccan policy should be viewed in this context as well.</li>
  </ul>
</li>
<li>&#8226; In this way, Aurangzeb&#8217;s Deccan policy was a <strong>proper mix between imperialistic design and material compulsion.</strong></li>
<li>&#8226; But it is also true that, through <strong>several personal mistakes</strong>, he brought the situation from bad to worse in Deccan.
  <ul>
  <li style="padding-left:2em">&#9702; For example, he <strong>failed to perceive the popular character of the Maratha movement</strong> and the <strong>brutal execution of Sambhaji proved to be unwise</strong>.</li>
  </ul>
</li>
</ul>

<h4>Critically examine the impact of Deccani policy: -</h4>
<p><strong>Negatives: -</strong></p>
<ol>
<li>Aurangzeb remained wholly involved in the Deccan imbroglio for 25 long years, so <strong>overall administration slackened.</strong></li>
<li>Due to his involvement in Deccan, he continued to appoint Mansabdars on a massive scale from among the Deccani nobles. So it <strong>intensified the demand for more and more Jagirs.</strong></li>
<li>When the <strong>Mansabdari system was extended towards the infertile regions of Deccan, the crisis intensified further.</strong></li>
</ol>
<p><strong>Positives: -</strong></p>
<p>The Deccan expedition of the Mughals, don&#8217;t present simply a story of all-round failure, rather they produced some positive results as well.</p>
<ol>
<li>As a result of Mughal influence, the <strong>Zabti system</strong> was extended to the Deccan region as well.</li>
<li>As the Mughal empire declined, there appeared some <strong>regional states</strong> like the Marathas, Hyderabad and Mysore, which provided efficient government in the Deccan.</li>
<li>Before the Mughal conquest of the Deccan, gold was the main currency in South India, while in North India silver currency was dominant. But after the advent of Mughals, <strong>monetary unification</strong> became possible, as silver currency was introduced as the main currency in South India as well.</li>
</ol>

<h2>Revolts against Aurangzeb:&#8211;</h2>
<p>A series of revolts in the 1670s onward occurred, some important revolts were -</p>
<ol>
<li><strong>Jat Revolt:-</strong> In 1669, under Gokul Jat and in 1685 under Raja Ram Jat. Both were the Zamindars of Mathura.</li>
<li><strong>Satnami Revolt:-</strong> Satnamis were the followers of St. Kabir and the majority of them were cultivators belonging to the lower castes. In 1672, they revolted against the state.</li>
<li><strong>Afghan revolt:-</strong> Afghans consisted of different tribes, and from time to time one or other tribe revolted. Earlier this revolt took place under Bhagu. Then in 1672, once again there was a rise of Afghans under Akmal Khan.</li>
<li><strong>Rajput Revolt:-</strong> Rathods of Jodhpur revolted under the leadership of Durga Das in 1679, later joined by Rana Raj Singh of Mewar.</li>
<li><strong>Maratha Revolt:-</strong> Throughout his life, Aurangzeb faced the challenge of Marathas.</li>
</ol>

<h4>Nature of these revolts:-</h4>
<p>About the nature and character of such revolts, there emerged much <strong>controversy</strong>.</p>
<p>Some of the scholars tried to project them as a <strong>reaction against the religious orthodoxy of Aurangzeb</strong>. They point out that except the Afghan revolt, all other revolts are associated with the Hindus.</p>
<p><strong>But such a view doesn&#8217;t appear to be convincing</strong>. The basic causes behind these revolts were <strong>political and economic</strong>. It is a different matter that they were organised within the framework of religion.</p>
<ul>
<li>&#8226; The fact that the <strong>whole of the Mughal administration, even under Aurangzeb, was running mostly on the pillar of Hindu officers</strong>, cannot be ignored.</li>
<li>&#8226; <strong>Rajput Mansabdars</strong> enjoyed the highest position under the empire.</li>
</ul>
<p>After closer examination, we come to realise that <strong>for every such revolt, an individual reason was accountable.</strong></p>
<ul>
<li>&#8226; For example, in the case of <strong>Jat, Satnami, Sikh and Maratha revolts, agrarian discontent</strong> was a major factor.</li>
<li>&#8226; On the other hand, <strong>Afghans</strong> appear to have been guided by a <strong>strong sense of tribal independence.</strong></li>
<li>&#8226; While in <strong>Rajputs&#8217;</strong> case, the revolt was the reaction against the <strong>intervention of the Mughal Empire into the matter of succession.</strong></li>
</ul>

<h2>Q. Do you take the Mughal Empire as a centralised state?</h2>
<ul>
<li>&#8226; Some historians such as <strong>Irfan Habib, Athar Ali</strong> etc. hold that Mughal administrative structure was <strong>highly centralised</strong>. This centralization is manifested in the efficient working of land revenue system, mansab and jagir, uniform coinage, etc.</li>
<li>&#8226; But <strong>Stephen P. Blake and J.F. Richards</strong>, while they accept the centralising tendencies, point out that the Mughal Empire was <strong>&#8216;patrimonial bureaucratic&#8217;</strong>. For them, everything seemed centred around the imperial household and the vast bureaucracy.</li>
<li>&#8226; For <strong>Streusand</strong>, despite being centralised near the core areas, the Mughal structure was <strong>less centralised at its periphery.</strong></li>
<li>&#8226; <strong>Chetan Singh supports this view</strong>. He is of the opinion that even in the 17th century the Mughal Empire was not very centralised.
  <ul>
  <li style="padding-left:2em">&#9702; For him, the <strong>centralised structure controlled through the efficient working of the jagirdari system seems to hold little ground.</strong></li>
  <li style="padding-left:2em">&#9702; According to him, <strong>jagir transfers were not as frequent as they appear</strong>, and the local elements at the periphery were quite successful in influencing the policies at the centre.</li>
  </ul>
</li>
</ul>

<h4>Conclusion-</h4>
<ul>
<li>&#8226; The extent to which the Mughal Empire was centralised in practice can be a matter of debate.</li>
<li>&#8226; However, <strong>theoretically the Mughal administrative structure seems to be highly centralised and bureaucratic in nature.</strong></li>
<li>&#8226; The <strong>Emperor was the fountainhead of all powers</strong>, and bureaucracy was mere &#8216;bandai dargah&#8217; (slaves of the court).</li>
<li>&#8226; In spite of the vast range of powers enjoyed by the central ministers, they were <strong>not allowed to usurp and interfere in each others&#8217; jurisdiction</strong> nor to assume autocratic powers.</li>
<li>&#8226; The Mughals through a system of <strong>checks and balances</strong> prevented any minister or officer from gaining unlimited powers.</li>
<li>&#8226; Administration under Mughal was constituted on the basis of <strong>two principles:</strong>
  <ul>
  <li style="padding-left:2em">&#9702; <strong>administrative uniformity, and</strong></li>
  <li style="padding-left:2em">&#9702; <strong>check and balance.</strong></li>
  </ul>
</li>
<li>&#8226; In central administration, there were four important officers i.e. <strong>Diwan-i-Ala, Mir Bakshi, Mir-i-Saman, and Sadr-us-Sudr.</strong>
  <ul>
  <li style="padding-left:2em">&#9702; <strong>Diwan-i-Ala</strong> was responsible for the assessment and collection of revenue and maintained the accounts of income and expenditure.
    <ul>
    <li style="padding-left:4em">&#9632; In order to maintain a check on the department, Akbar appointed an officer of <strong>humble origin</strong>.</li>
    <li style="padding-left:4em">&#9632; Sometimes he even appointed <strong>half a dozen Diwans</strong> in order to maintain check and balance within the department.</li>
    </ul>
  </li>
  <li style="padding-left:2em">&#9702; <strong>Mir Bakshi</strong> used to enjoy all the powers pertaining to the military department.
    <ul>
    <li style="padding-left:4em">&#9632; However, the <strong>supreme command</strong> of the army remained in the hands of the <strong>Emperor</strong>.</li>
    <li style="padding-left:4em">&#9632; Further, while Mir Bakshi used to recommend the candidates for the post of Mansabdars, a <strong>Mansabdar could be appointed only by the Emperor himself</strong>, after an interview.</li>
    <li style="padding-left:4em">&#9632; <strong>Mir Bakshi also used to recommend the salary</strong>, but the <strong>salary was released by the Diwan-i-Ala.</strong></li>
    </ul>
  </li>
  <li style="padding-left:2em">&#9702; <strong>Mir-i-Saman</strong>, was responsible for the supply of all the essential commodities to the royal palace. Royal Karkhanas were also under his supervision.
    <ul>
    <li style="padding-left:4em">&#9632; In order to maintain the proper checks over the department, its <strong>annual accounts were scrutinised by the department of Diwan.</strong></li>
    </ul>
  </li>
  <li style="padding-left:2em">&#9702; Lastly, the <strong>Sadr-us-Sudr</strong> was responsible for religious endowments. This department used to distribute land grants (Waqf) and Wazifa (cash).
    <ul>
    <li style="padding-left:4em">&#9632; Effective checks were maintained by <strong>having the accounts scrutinised by the Diwan.</strong></li>
    </ul>
  </li>
  </ul>
</li>
<li>&#8226; <strong>Provincial administration was supposed to be a replica of the central administration.</strong> The standard provincial administration was introduced for the first time by Akbar.
  <ul>
  <li style="padding-left:2em">&#9702; <strong>Subedar/Nazim</strong> was appointed as the head of administration. Apart from him, provincial <strong>Diwan</strong>, provincial <strong>Bakshi</strong> and provincial <strong>Qazi</strong> were associated with the provincial administration.</li>
  </ul>
</li>
<li>&#8226; In order to maintain a proper <strong>check and balance</strong> even in provincial administration, some steps were taken.
  <ul>
  <li style="padding-left:2em">&#9702; The Subedar was officially the head of administration, but sometimes an <strong>officer with higher Mansabdar rank was appointed as Diwan.</strong></li>
  <li style="padding-left:2em">&#9702; Likewise, the provincial <strong>Bakshi was given the responsibility of espionage</strong>. He was authorised to pass sensitive information directly to the centre, bypassing the Subedar.</li>
  </ul>
</li>
<li>&#8226; At the level of <strong>Sarkar</strong>, an officer <strong>Faujdar</strong>, was appointed for the supervision of the whole administration.
  <ul>
  <li style="padding-left:2em">&#9702; Sometimes <strong>more than one Faujdar</strong> was appointed in the same Sarkar.</li>
  </ul>
</li>
</ul>

<h2>Agrarian structure under Mughals</h2>
<p>When we observe rural structure under Mughals, we find a clear cut division and hierarchy among the peasantry.</p>
<ul>
<li>&#8226; The higher peasants who owned and cultivated their <strong>own land</strong> were termed <strong>&#8216;Khud Kasht&#8217;</strong> in North India, <strong>&#8216;Mirasdar&#8217;</strong> in Maharashtra, <strong>&#8216;Gharhul&#8217;</strong> in Rajasthan.</li>
<li>&#8226; There were also <strong>lower peasants</strong> who did not have land and they worked as <strong>sharecroppers</strong> on other&#8217;s fields. They were termed as <strong>&#8216;Pahikast&#8217;</strong> in north India.</li>
<li>&#8226; Beneath the Pahikast, there was another level of the peasants who were known as <strong>&#8216;Mujarian&#8217;</strong>. They were just <strong>marginal farmers</strong> as they were having a small tract of land. So, they worked on others&#8217; fields as <strong>agricultural labour</strong> also.</li>
<li>&#8226; Other than Mujarian there was a large band of agricultural labour who worked as the <strong>wage labour</strong> in the agricultural field.</li>
<li>&#8226; Above peasantry, there was a hierarchy of <strong>landlords</strong> (middle men) who were associated with the collection of revenue.
  <ul>
  <li style="padding-left:2em">&#9702; Under the Delhi Sultanate different names were given to the Zamindars in different regions. For example, <strong>Khut</strong> and <strong>Muqaddam</strong> in north India, <strong>Satrahavi and Viswi</strong> in Awadh and <strong>Banth</strong> in Rajasthan.</li>
  </ul>
</li>
<li>&#8226; But during the Mughal period they were known by a single name, <strong>Zamindar</strong>.</li>
<li>&#8226; According to Sir Jadunath Sarkar, the category of Zamindars were
  <ol>
  <li>Primary Zamindars</li>
  <li>Secondary Zamindars</li>
  <li>Autonomous Zamindars/ Rajas / {Highest Status}</li>
  </ol>
</li>
<li>&#8226; Primary Zamindars, apart from being the collector of revenue, were themselves cultivators as well while the secondary Zamindars and Rajas were associated only with collection of revenue.</li>
</ul>

<h4>How did the Mughal state influence rural structure?</h4>
<ul>
<li>&#8226; The Mughal Empire was in search of more and more resources so, in comparison to other regimes, it tried <strong>to penetrate the countryside more actively and efficiently.</strong></li>
<li>&#8226; Increasing the movement of officers in rural areas, measurement of land, and then determining land revenue accordingly <strong>ended the seclusion of villages</strong>.</li>
<li>&#8226; Towards Zamindars, Akbar had a very specific policy.
  <ul>
  <li style="padding-left:2em">&#9702; The <strong>autonomous Hindu kings were encouraged to join the Mughal Mansabdari.</strong></li>
  <li style="padding-left:2em">&#9702; On the other hand, his policy towards smaller Zamindars was different. In fact, his emphasis was to <strong>convert more and more Khidmati Zamindars into Kharaj giving Zamindars.</strong></li>
  </ul>
</li>
<li>&#8226; Mughal <strong>state encouraged the collection of revenue in cash</strong>. It encouraged the production of cash crops in the rural areas. Thus it created <strong>further differentiation</strong> among the peasantry.</li>
<li>&#8226; <strong>Crafts production was encouraged</strong> during this period as there was the expansion of internal and external trade.
  <ul>
  <li style="padding-left:2em">&#9702; Due to the heavy demand of craft production, merchants even involved village handicrafts into the production of merchandise goods.</li>
  <li style="padding-left:2em">&#9702; It gave a <strong>jolt</strong> to the self-sufficient nature of village economy, popularly known as <strong>Jajmani System</strong>.</li>
  </ul>
</li>
</ul>

<h2>Agrarian Economy</h2>
<ul>
<li>&#8226; Under the Mughal empire, agrarian production was in good condition. India was among selected countries in the world where the <strong>larger part of cultivable land was available.</strong></li>
<li>&#8226; Furthermore, due to a wide range of climatic conditions as well as the availability of the different quality of soil, there was a <strong>scope for different crops</strong>. Abul Fazl in his Ain-e-Akbari presented a long list of crops.</li>
<li>&#8226; During the Mughal period, the cash crops of <strong>Opium, Indigo, Cotton and Sugarcane</strong> were important items. Then in the beginning of the 17th century, the Portuguese introduced <strong>Tobacco</strong> in India. By the end of the 17th century, its production expanded.</li>
<li>&#8226; It was in the 17th century itself that even <strong>maize</strong> was introduced in India.</li>
<li>&#8226; Even the production of <strong>coffee</strong> started in India. Likewise, <strong>silk</strong> production was an important item in Bengal, Assam, Kashmir, and western India. Bengal was definitely the main centre of production where the production started from the 15th century onwards.</li>
<li>&#8226; By the 18th century, even some new cash crops like <strong>red chilli and potatoes</strong> were introduced. Apart from that, <strong>several fruits</strong> were also introduced e.g. pineapple, cashew nut, papaya.</li>
<li>&#8226; At that time, <strong>for irrigation different methods</strong> were in use e.g. Sakia (Persian wheel) was already in use, drawing water from wells i.e. lever system. Furthermore, for irrigation, even canals were built. The state used to give <strong>economic assistance to the peasantry for digging wells.</strong></li>
<li>&#8226; Furthermore, the <strong>state was interested in developing barren land</strong> through the <strong>resettlement</strong> of the peasantry in that region.</li>
</ul>

<h2>Decline of Mughal Empire</h2>
<p>The Mughal Empire remained unparalleled in its geographical reach, political stature and grandeur during the medieval period. So naturally, its decline <strong>attracted a large number of scholars</strong> who tried to interpret its decline in their own respective manner.</p>
<ul>
<li>&#8226; Some earlier scholars like <strong>Irwin and Jadunath Sarkar</strong> tried to explain the decline in the context of the <strong>role of personality</strong> i.e. <strong>Aurangzeb&#8217;s orthodox policy</strong> and reactions against it.</li>
<li>&#8226; While some scholars focused on the <strong>incompetency of later Mughal rulers</strong>, <strong>irresponsible and characterless Mughal aristocracy</strong> as the factor behind the decline of the Mughal Empire. But in course of time, such views lost their lustre.</li>
</ul>
<p>From 1950 onwards, the debate about the decline of the Mughal Empire came to hover around <strong>institutional factors</strong>. Normally the <strong>Aligarh School</strong> of Historiography had talked in terms of <strong>crisis</strong> for the decline of the Mughal Empire.</p>
<ul>
<li>&#8226; It was in this context, <strong>Satish Chandra and Irfan Habib</strong> presented the theory of <strong>Jagirdari crisis and Agrarian crisis respectively.</strong></li>
<li>&#8226; Then Professor <strong>Noorul Hasan</strong> focussed upon <strong>zamindars</strong> under Mughals.</li>
<li>&#8226; Even <strong>Athar Ali</strong> made a study of <strong>Jagirdari system</strong> under Mughals.</li>
</ul>
<p><strong>Later</strong> in the 1970s, some scholars like <strong>M.N. Pearson, P. Hardy and J.F. Frederick</strong>, etc. gave a partial challenge to the view of Aligarh scholars and they started to talk in terms of <strong>Mughal involvement in Deccan</strong> as the important factor behind the decline.</p>
<ul>
<li>&#8226; But even these scholars <strong>couldn&#8217;t modify the view of the crisis</strong> and the whole process of decline continued to be discussed in the terms of the crisis itself.</li>
</ul>
<p>Recently, in the study of the decline of the Mughal Empire, there has been a rise of <strong>revisionist historiography</strong>. It tried to give a serious challenge to the view of crisis. Rather it started to talk about <strong>economic prosperity at the regional level</strong>.</p>
<ul>
<li>&#8226; For that, a <strong>region-centric view</strong> was adopted in the study of the decline of the Mughal Empire.</li>
<li>&#8226; <strong>Muzaffar Alam, Chetan Singh, Karen Leonard, Sanjay Subrahmanyan</strong>, etc. adopted a new paradigm for the study of decline of the Mughal Empire. Now it has been emphasised that during the early 18th century there was the <strong>rise of certain prosperous economic regions like Bareilly, Awadh, Bengal, etc.</strong></li>
<li>&#8226; <strong>Two factors</strong> contributed to economic prosperity at regional level.
  <ul>
  <li style="padding-left:2em">&#9702; One was the <strong>influx of silver</strong> due to European trade and</li>
  <li style="padding-left:2em">&#9702; The second was the <strong>production of cash crops</strong>.</li>
  </ul>
</li>
<li>&#8226; According to this school, different regions always felt the <strong>pressure from the Mughal Empire</strong> and were <strong>compelled to submit a major part of the surplus</strong> to the centre.
  <ul>
  <li style="padding-left:2em">&#9702; Consequently, the empire started to collapse and provincial states like Bengal, Awadh, Hyderabad, etc. came into existence.</li>
  </ul>
</li>
</ul>
<p>When we take all the views mentioned above into consideration, we find that it will be <strong>too simplistic to rely on any single view.</strong></p>
<ul>
<li>&#8226; The Mughal Empire was one of the largest empires to have existed in Indian history. Likewise, it had to face a <strong>number of internal as well as external challenges</strong>. Therefore, its decline might have been caused by a <strong>complex process</strong>, not by a single factor.</li>
<li>&#8226; <strong>In some regions, the disruption in Jagirdari and agrarian system</strong> might be the cause and <strong>in some other regions, the economic prosperity</strong> might have encouraged separation and <strong>once the process of the dismemberment started, incompetent rulers could have intensified the process</strong> by adopting faulty policies.</li>
<li>&#8226; Simultaneously, <strong>foreign invasions</strong> also added fuel to the fire.</li>
</ul>"""

path = 'lib/noteContent.ts'
content = open(path, encoding='utf-8').read()
pattern = r"('mughal-empire-17th-century':\s*`)`"
replacement = lambda m: f"'mughal-empire-17th-century': `{new_html}`"
new_content, count = re.subn(pattern, replacement, content)
print(f"Replaced {count} occurrence(s).")
open(path, 'w', encoding='utf-8').write(new_content)
