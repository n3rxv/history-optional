export type FlashCard = {
  id: string;
  topic: string;      // slug from notes.ts
  paper: 1 | 2;
  section: string;
  type: 'historian' | 'comparison' | 'cause-effect' | 'quote' | 'concept';
  front: string;
  back: string;
};

export const flashcards: FlashCard[] = [

  // ─── ANCIENT INDIA ────────────────────────────────────────────────────────

  // Sources
  { id: 'a001', topic: 'sources-ancient-india', paper: 1, section: 'Ancient India', type: 'historian',
    front: "What is R.S. Sharma's critique of using Brahmanical texts as primary sources for ancient Indian history?",
    back: "R.S. Sharma argued that Brahmanical texts like the Manusmriti and Puranas were composed by the elite to legitimize the varna-jati system and cannot be taken at face value as reflections of social reality. He emphasized the need to read them against material and epigraphic evidence to recover the lives of subordinated groups — peasants, women, and shudras." },

  { id: 'a002', topic: 'sources-ancient-india', paper: 1, section: 'Ancient India', type: 'concept',
    front: "What is the 'Orientalist vs. Nationalist' debate on sources for ancient Indian history?",
    back: "Orientalists like Max Müller and James Mill used Sanskrit texts to construct an image of India as spiritually rich but historically passive. Nationalist historians like Bal Gangadhar Tilak reclaimed these texts to assert India's ancient glory. Both approaches were criticized for reading ideology into sources — the former for colonial utility, the latter for nationalist myth-making. A.L. Basham sought a more balanced reconstruction." },

  // IVC
  { id: 'a003', topic: 'indus-valley-civilization', paper: 1, section: 'Ancient India', type: 'historian',
    front: "Compare Mortimer Wheeler's and Shereen Ratnagar's interpretations of the Indus Valley Civilization.",
    back: "Wheeler emphasized military conquest and a priest-king theocracy, famously arguing that Aryan invaders destroyed the IVC — citing skeletal remains at Mohenjo-daro as massacre victims. Ratnagar rejected this entirely; she argued the IVC was a trade-based mercantile civilization with no evidence of centralized theocracy. She stressed the absence of temples, palaces, and warfare iconography as defining characteristics." },

  { id: 'a004', topic: 'indus-valley-civilization', paper: 1, section: 'Ancient India', type: 'cause-effect',
    front: "What are the major theories explaining the decline of the Indus Valley Civilization?",
    back: "1. Aryan Invasion (Wheeler) — now largely discredited by lack of battle evidence.\n2. Ecological/Climate change — Gwen Robbins Schug and others point to aridification, shifting of the Ghaggar-Hakra (possibly Saraswati) river.\n3. Flooding — repeated inundations at Mohenjo-daro documented by Marshall.\n4. Epidemic disease — Schug's bioarchaeological work found evidence of interpersonal violence and infectious disease in late phase.\n5. Trade collapse — breakdown of Persian Gulf trade networks reduced surplus. Most scholars favour a multi-causal model." },

  // Aryans & Vedic
  { id: 'a005', topic: 'aryans-vedic-period', paper: 1, section: 'Ancient India', type: 'quote',
    front: "Who proposed the 'Out of India' theory regarding Aryan origins, and how does it challenge the mainstream view?",
    back: "Scholars like Shrikant Talageri and B.B. Lal proposed that the Vedic culture originated in India and spread outward, inverting the conventional 'Aryan Migration Theory.' The mainstream view, supported by geneticists like David Reich and linguists like Michael Witzel, holds that Indo-Aryan speakers migrated into the subcontinent from the Eurasian steppe (BMAC culture) around 1500 BCE. The 2019 Rakhigarhi ancient DNA study supported the migration thesis, finding no steppe ancestry in IVC individuals." },

  { id: 'a006', topic: 'aryans-vedic-period', paper: 1, section: 'Ancient India', type: 'comparison',
    front: "Compare Rig Vedic and Later Vedic society — key structural changes.",
    back: "Rig Vedic: Pastoral, semi-nomadic; tribal (jana/vish) organization; varna distinctions nascent and occupational; women had relative freedom (gargi, Lopamudra); rajna was a war-leader not king; no fixed territory.\nLater Vedic: Settled agriculture in Gangetic plains; varna system rigid and hereditary; emergence of 16 mahajanapadas; ashvamedha yajna to legitimize territorial kingship; women's position deteriorated (excluded from upanayana); Brahmin supremacy consolidated through rituals." },

  // Mahajanapadas
  { id: 'a007', topic: 'mahajanapadas', paper: 1, section: 'Ancient India', type: 'cause-effect',
    front: "Why did Magadha emerge as the dominant Mahajanapada over others like Kosala and Vajji?",
    back: "1. Geography: Surrounded by rivers Ganga, Son, Champa — natural defense and trade advantage.\n2. Iron resources: Proximity to iron ore in Chota Nagpur gave military and agricultural superiority.\n3. Elephant forests: War elephants gave decisive battlefield advantage.\n4. Aggressive rulers: Bimbisara's matrimonial alliances, Ajatashatru's military innovations (catapult/covered chariot).\n5. Absorption of trade routes: Control of Ganga trade routes gave fiscal strength.\n6. Weak republican confederacies: The Vajjian confederacy (Lichchhavis) lacked centralized command, making them vulnerable." },

  // Mauryan Empire
  { id: 'a008', topic: 'mauryan-empire', paper: 1, section: 'Ancient India', type: 'historian',
    front: "How do D.D. Kosambi and Romila Thapar differ in their interpretation of Ashoka's Dhamma?",
    back: "Kosambi (Marxist): Dhamma was a pragmatic state ideology to integrate a diverse empire through a common ethical code, replacing costly sacrificial rituals of Brahmins that drained agrarian surplus. It was essentially a tool of class consolidation.\nThapar: Dhamma was a policy of 'social responsibility' — a deliberate attempt to resolve conflicts between different sects (Buddhists, Jains, Ajivikas, Brahmins). It was not Buddhism per se but a syncretic civic ethics. She emphasizes Ashoka's genuine personal commitment alongside political utility." },

  { id: 'a009', topic: 'mauryan-empire', paper: 1, section: 'Ancient India', type: 'comparison',
    front: "Compare Kautilya's Arthashastra model of the state with Ashoka's Dhammic state.",
    back: "Arthashastra (Kautilya): Realpolitik — the king's primary duty is vijigishu (conquest); saptanga theory of state (king, minister, territory, fort, treasury, army, ally); espionage central; matsya nyaya (big fish eats small) is the natural order the state must overcome through force.\nAshokan State: Moral governance — dhammamahamatas (officers of righteousness) replace spies; conquest by dharma (dhammavijaya) over conquest by force; welfare of subjects (praja) is primary; king as father-figure. These represent two entirely different philosophies of statecraft within the same dynasty." },

  { id: 'a010', topic: 'mauryan-empire', paper: 1, section: 'Ancient India', type: 'cause-effect',
    front: "What caused the decline of the Mauryan Empire after Ashoka?",
    back: "1. Brahmanical reaction (H.C. Raychaudhuri): Ashoka's Buddhist leanings alienated Brahmin officials — the last Maurya Brihadratha was assassinated by his Brahmin general Pushyamitra Shunga.\n2. Economic strain (Kosambi): Massive expenditure on stupas, welfare, and army depleted treasury; silver punch-mark coins debased.\n3. Administrative weakness: Vast empire with poor communication; governors (kumaras) became autonomous.\n4. No strong successor: Ashoka's successors divided the empire.\n5. Invasion pressure: Indo-Greek pressure from northwest.\nModern consensus: Multi-causal — no single factor sufficient." },

  // Post-Mauryan
  { id: 'a011', topic: 'post-mauryan-period', paper: 1, section: 'Ancient India', type: 'historian',
    front: "What is the significance of the Kushana period for Indian cultural history? How do historians assess Kanishka?",
    back: "The Kushanas (1st–3rd century CE) facilitated the Silk Route trade, enabling the spread of Mahayana Buddhism to Central Asia and China. Kanishka's patronage of the 4th Buddhist Council (Kundalavana, Kashmir) canonized Mahayana texts.\nGandhara art — fusion of Hellenistic and Indian styles — emerged under Kushana patronage. B.N. Mukherjee emphasizes their role in integrating India into a Eurasian trade network. Some historians (Romila Thapar) caution against overstating Kanishka's personal religiosity — his coins show multiple deities (Zoroastrian, Greek, Buddhist), suggesting pragmatic eclecticism." },

  { id: 'a012', topic: 'post-mauryan-period', paper: 1, section: 'Ancient India', type: 'comparison',
    front: "Compare Hinayana and Mahayana Buddhism — doctrinal and social differences.",
    back: "Hinayana (Theravada): Individual salvation (nirvana) through monastic discipline; the Buddha is a historical teacher, not divine; Pali canon; ideal is the Arhat (perfected monk).\nMahayana: Universal salvation through bodhisattvas who delay nirvana to help others; the Buddha becomes a cosmic deity; Sanskrit texts (Prajnaparamita); concept of Sunyata (Nagarjuna) and Yogachara (Vasubandhu); more accessible to laypersons.\nSocial significance: Mahayana's inclusivity made it exportable — it spread to China, Japan, Korea, Tibet. Hinayana remained dominant in Sri Lanka, Myanmar, Thailand." },

  // Guptas
  { id: 'a013', topic: 'guptas-vakatakas-vardhanas', paper: 1, section: 'Ancient India', type: 'historian',
    front: "Was the Gupta period truly a 'Golden Age'? Examine the debate.",
    back: "For: Vincent Smith coined the term — remarkable achievements in literature (Kalidasa), mathematics (Aryabhata, zero, decimal system), astronomy (Varahamihira), sculpture (Sarnath Buddha), temple architecture.\nAgainst (R.S. Sharma): The 'golden age' was for the upper varna elite. Evidence shows deterioration of shudra and women's status; decline of urban trade and guilds; copper coins replacing silver indicates economic contraction.\nUma Chakravarti: Brahmanical patriarchy intensified during this period — women increasingly confined to domestic sphere.\nBalance: The Gupta period saw elite cultural brilliance alongside increasing social stratification. 'Golden Age' is a partial truth." },

  { id: 'a014', topic: 'guptas-vakatakas-vardhanas', paper: 1, section: 'Ancient India', type: 'concept',
    front: "What is the 'Indian Feudalism' debate? Who are the key historians and what do they argue?",
    back: "R.S. Sharma (1965): Post-Gupta India (6th–12th century) saw feudalism — land grants (brahmadeya, agrahara) to Brahmins and officers replaced salaries; peasants became serfs; decline of trade and urbanism; political fragmentation. Comparable to European feudalism.\nD.N. Jha: Broadly supports Sharma but emphasizes that land grants were not uniform across regions.\nB.D. Chattopadhyaya (critic): Rejects the feudalism model — land grants actually stimulated agricultural expansion into forest areas; urban centres didn't disappear; regional kingdoms maintained fiscal systems. Calls it 'integrative' rather than feudal.\nHarbans Mukhia: Feudalism requires serfdom — Indian peasants were never legally serfs. The analogy with European feudalism is flawed." },

  // Bhakti & Sufism
  { id: 'a015', topic: 'cultural-traditions-750-1200', paper: 1, section: 'Medieval India', type: 'historian',
    front: "How do historians assess the Bhakti movement's challenge to caste hierarchy?",
    back: "Optimist view (R.C. Majumdar, early nationalists): Bhakti saints like Kabir, Ravidas, Tukaram democratized religion, rejected caste and priesthood, promoted human equality.\nPessimist view (D.N. Jha, Eleanor Zelliot): The movement did not fundamentally dismantle the caste system. Saints were often absorbed back into caste frameworks after death — their shrines controlled by upper castes. Ravidas's movement (Ravidassia) remained socially marginal.\nModern consensus (Ramnarayan Rawat): Bhakti provided ideological resources for Dalit assertion but did not achieve structural change. Its radical potential was routinely contained by brahmanical incorporation." },

  { id: 'a016', topic: 'cultural-traditions-750-1200', paper: 1, section: 'Medieval India', type: 'comparison',
    front: "Compare Shankaracharya's Advaita Vedanta with Ramanuja's Vishishtadvaita.",
    back: "Shankara (8th–9th c): Non-dualism — Brahman alone is real; the world is maya (illusion); jnana (knowledge) is the path to liberation; the individual self (atman) is identical with Brahman. No role for devotion in ultimate liberation.\nRamanuja (11th–12th c): Qualified non-dualism — Brahman is real AND the world and individual souls are real but dependent on Brahman (like body to soul); bhakti (devotion) is the supreme path; God (Vishnu/Narayana) is personal. This made religion accessible to all castes — underpinned the Sri Vaishnava movement.\nSignificance: Ramanuja's philosophy provided theological grounding for the popular Bhakti tradition that Shankara's elite jnana-marga could not." },

  // Delhi Sultanate
  { id: 'a017', topic: 'thirteenth-century', paper: 1, section: 'Medieval India', type: 'historian',
    front: "What is the 'Khalji Revolution' and why does Mohammad Habib use this term?",
    back: "Mohammad Habib argued that Alauddin Khalji's accession (1296) represented a revolution because it broke the Turkish monopoly on power — non-Turkish Muslims (including converts and Afghans) were admitted to the nobility. The state became more imperial and less tribal.\nCritics (Peter Jackson): The term 'revolution' overstates the change — the fundamental nature of Sultanate rule did not transform; the nobility remained Muslim and Persian-speaking; peasants and Hindus gained nothing structural.\nModern view: Khalji's reign was a significant administrative and military modernization, but 'revolution' is an ideologically loaded term reflecting Habib's nationalist-secular framework." },

  { id: 'a018', topic: 'fourteenth-century', paper: 1, section: 'Medieval India', type: 'cause-effect',
    front: "Why did Muhammad bin Tughluq's ambitious policies fail?",
    back: "1. Transfer of capital to Daulatabad: Logistically disastrous — weakened control over north, the new capital lacked economic base. Ibn Battuta documented mass suffering.\n2. Token currency (copper for silver): No mechanism to prevent forgery; traders lost confidence; economic chaos ensued.\n3. Khorasan and Qarachil expeditions: Military overreach into Central Asia and Himalayan foothills — both failed catastrophically.\n4. Doab tax increase during famine: Alienated peasantry; triggered revolts (Vijayanagara rebellion, Madurai sultanate).\nBarni's assessment: Mad genius — brilliant ideas, execrable implementation. Modern historians (Satish Chandra) are more balanced: the problems were structural (mongol threats, revenue needs) not merely personal incompetence." },

  { id: 'a019', topic: 'society-culture-economy-13-14c', paper: 1, section: 'Medieval India', type: 'historian',
    front: "How does Irfan Habib characterize the agrarian system of the Delhi Sultanate?",
    back: "Irfan Habib (Agrarian System of Mughal India, though his Sultanate work informs it): The Sultanate extracted maximum surplus from peasants through the kharaj (land tax up to 1/2 or 1/3 of produce). The peasant (raiyat) was exploited by three layers — the Sultan's revenue apparatus, the iqtadar (holder of iqta), and the local zamindar/muqaddam. This 'triple burden' kept peasants at subsistence level. Habib uses a Marxist framework — the Sultanate state as a mechanism of surplus extraction from the peasant class." },

  // Vijayanagara & Mughals
  { id: 'a020', topic: 'fifteenth-sixteenth-century-political', paper: 1, section: 'Medieval India', type: 'historian',
    front: "How do historians assess the Vijayanagara Empire — was it a Hindu state resisting Islam?",
    back: "Traditional/nationalist view (K.A. Nilakanta Sastri): Vijayanagara was the 'bulwark of Hindu civilization' against Muslim sultanates — protector of temples, Sanskrit learning, and Brahmanical order.\nRevision (Burton Stein): Vijayanagara was a 'segmentary state' — not a centralized empire but a ritual center commanding the loyalty of nayakas (subordinate chiefs). The Hindu-Muslim binary is misleading — Vijayanagara employed Muslim soldiers, used Persian administrative vocabulary, and sometimes allied with Bahmani sultans against other Hindu rulers.\nPhilip Wagoner: The kings adopted Islamic courtly culture (titles like 'Sultan among Hindu kings') pragmatically — the Hindu-Muslim civilizational divide was a modern imposition." },

  { id: 'a021', topic: 'akbar', paper: 1, section: 'Medieval India', type: 'historian',
    front: "How do Vincent Smith, M. Athar Ali, and Shireen Moosvi differently assess Akbar's greatness?",
    back: "Vincent Smith (1917): Akbar as 'the Great' — enlightened despot ahead of his time; religious tolerance and administrative genius made him comparable to European monarchs.\nM. Athar Ali: Focuses on structural analysis — the Mansabdari system was a fiscal-military mechanism to prevent nobility from becoming hereditary landlords; Akbar's system was innovative but created structural contradictions (jagir crisis) that destabilized the later empire.\nShireen Moosvi (Economy of the Mughal Empire): Uses quantitative data from Ain-i-Akbari — demonstrates the massive agricultural surplus the empire extracted; qualifies the 'golden age' narrative by showing peasant exploitation was systematic." },

  { id: 'a022', topic: 'akbar', paper: 1, section: 'Medieval India', type: 'concept',
    front: "What was Akbar's Sulh-i-kul and how does it differ from modern secularism?",
    back: "Sulh-i-kul ('Universal Peace' or 'peace with all') was Akbar's governing philosophy — no religion should be favored by the state; learned men of all faiths (Ibadat Khana debates included Jesuits, Jains, Hindus, Shia, Sunni); the Din-i-Ilahi was an eclectic ethical code, not a new religion imposed on subjects.\nDifference from secularism: Modern secularism separates religion from the state entirely. Akbar's sulh-i-kul was a tolerant imperial ideology — the emperor remained the axis; all religions were tolerated as subordinate to the sovereign. Abu'l Fazl's concept of the 'divine light' (farr-i-izadi) in the emperor made it a form of sacred kingship, not a secular arrangement." },

  { id: 'a023', topic: 'mughal-empire-17th-century', paper: 1, section: 'Medieval India', type: 'quote',
    front: "Who first called Aurangzeb a religious bigot responsible for the empire's decline, and who challenged this view?",
    back: "Jadunath Sarkar (History of Aurangzeb, 5 vols): Aurangzeb's reimposition of jizya (1679), temple demolitions, and Islamization alienated Hindus and Rajputs, triggering revolts (Marathas, Jats, Sikhs) that fatally weakened the empire.\nChallengers:\n— Satish Chandra: The decline was structural — jagir crisis, mansabdari contradictions, not primarily religious policy.\n— Audrey Truschke (Aurangzeb: The Man and the Myth, 2017): Aurangzeb also patronized Hindu temples, employed more Hindus in his nobility than Akbar, and his temple destructions were politically targeted (rebellious rulers), not systematic religious persecution.\n— Irfan Habib: Agrees with structural causes over religious ones." },

  { id: 'a024', topic: 'mughal-empire-17th-century', paper: 1, section: 'Medieval India', type: 'cause-effect',
    front: "Explain the Jagir Crisis of the 17th century Mughal Empire.",
    back: "The Mansabdari system assigned jagirs (revenue assignments) to mansabdars to pay their salary. As the number of mansabdars grew (especially under Aurangzeb's Deccan campaigns), the total jagir demand exceeded available assessed land (jama). Consequences:\n1. Mansabdars received jagirs in remote/poor areas — actual revenue (hasil) far below assessed (jama).\n2. Short tenures meant mansabdars extracted maximum in minimum time — devastating for peasants.\n3. Nobles competed viciously for good jagirs — factionalism at court.\n4. The state could not adequately pay its military — structural fiscal collapse.\nIrfan Habib identified this as the primary mechanism of Mughal decline." },

  // Mughal Culture
  { id: 'a025', topic: 'mughal-culture', paper: 1, section: 'Medieval India', type: 'comparison',
    front: "Compare Mughal and Vijayanagara architectural traditions.",
    back: "Mughal: Composite Indo-Islamic style — Persian (bulbous dome, iwan arch, minaret) + Hindu (trabeate elements, chhatri, lotus motifs); red sandstone (Akbar era) to white marble (Shah Jahan); gardens (charbagh) as paradise on earth; Taj Mahal as apex.\nVijayanagara: Dravidian tradition — gopuram (towered gateway), mandapa (pillared halls), sculptural exuberance; Hampi's Vitthala Temple with its stone chariot and musical pillars; secular structures (Lotus Mahal) show Islamic influence in arches.\nKey difference: Mughal architecture served imperial display and tomb culture (mausoleum tradition from Central Asia); Vijayanagara architecture was temple-centric — the king as temple patron validating cosmic order." },

  // 18th Century
  { id: 'a026', topic: 'eighteenth-century', paper: 1, section: 'Medieval India', type: 'historian',
    front: "Was the 18th century in India a period of 'decline and chaos' or 'decentralization and regional vitality'? Who are the key historians?",
    back: "Decline thesis (traditional): With Mughal collapse came anarchy — Nadir Shah's invasion (1739), Afghan raids, Maratha plunder; economic regression and political fragmentation.\nRevision — 'Regional vitality' thesis:\n— Muzaffar Alam (Crisis of Empire in Mughal North India): Awadh and Punjab saw regional state-building, not just chaos.\n— Sanjay Subrahmanyam & C.A. Bayly: The 18th century saw commercial expansion, new merchant classes, and dynamic regional cultures (Awadh, Hyderabad, Bengal, Mysore) — not simply decline.\n— C.A. Bayly (Rulers, Townsmen and Bazaars): Indian merchant networks remained robust; the crisis was political not economic.\nConclusion: The 18th century was complex — political fragmentation coexisted with cultural florescence and commercial activity." },

  // ─── MODERN INDIA ─────────────────────────────────────────────────────────

  // Economic Impact
  { id: 'm001', topic: 'economic-impact-british-rule', paper: 2, section: 'Modern India', type: 'historian',
    front: "What is Dadabhai Naoroji's 'Drain of Wealth' theory and how did later historians develop it?",
    back: "Naoroji (Poverty and Un-British Rule in India, 1901): British rule systematically drained India's wealth through 'home charges' (pensions, interest on India's debt held in Britain, civil and military expenditure charged to India). This was 'un-British' — India generated surplus but could not reinvest it.\nR.C. Dutt: Added de-industrialization — British tariff policy destroyed Indian textile industry.\nRomila Thapar & Irfan Habib: Placed drain within broader colonial economic framework.\nUtsa Patnaik (2018): Calculated the drain at $44.6 trillion over 1765–1938 — triggered major debate; critics question her methodology but the structural argument stands.\nModern consensus: The drain was real and significant, though its exact quantum is contested." },

  { id: 'm002', topic: 'economic-impact-british-rule', paper: 2, section: 'Modern India', type: 'comparison',
    front: "Compare the Permanent Settlement, Ryotwari, and Mahalwari systems — their intent, implementation, and impact.",
    back: "Permanent Settlement (Bengal, 1793 — Cornwallis): Created zamindars as permanent proprietors at fixed revenue; intent was to create an improving landlord class like English gentry. Result: Zamindars became rack-renters; peasants lost security; revenue fixed while prices rose (state lost benefit).\nRyotwari (Madras, Bombay — Munro): Direct settlement with individual peasant cultivators; intent to eliminate intermediaries. Result: Revenue assessed too high; peasants borrowed from moneylenders; land alienation.\nMahalwari (North India — Holt Mackenzie): Settlement with village community collectively. Result: Village solidarity undermined as individual peasants differentiated.\nCommon outcome: All three commercialized agriculture but impoverished the peasantry through high revenue demands." },

  // 1857
  { id: 'm003', topic: 'indian-response-british-rule', paper: 2, section: 'Modern India', type: 'quote',
    front: "Was 1857 a 'Sepoy Mutiny', a 'National Revolt', or something else? Trace the historiographical debate.",
    back: "'Sepoy Mutiny' (British view — John Lawrence, Charles Ball): A military mutiny triggered by the greased cartridge issue; no national consciousness; different groups had different parochial grievances.\n'First War of Independence' (V.D. Savarkar, 1909): A planned national uprising against British rule; the first expression of Indian nationalism. Savarkar wrote this in exile — it was banned by the British.\n'Feudal revolt' (S.B. Chaudhuri, R.C. Majumdar): Led by dispossessed taluqdars and princes protecting their privileges — not a people's revolt.\nSocial revolt (Eric Stokes, Rudrangshu Mukherjee): Peasant participation in UP shows agrarian grievances were central — it was a composite uprising.\nConsensus: It was neither purely a mutiny nor a fully national uprising — a multi-layered revolt with military, feudal, peasant, and religious dimensions." },

  // Social Reform
  { id: 'm004', topic: 'social-religious-reform', paper: 2, section: 'Modern India', type: 'historian',
    front: "How do historians assess Raja Ram Mohan Roy — modernizer, colonial collaborator, or nationalist precursor?",
    back: "Nationalist view (Bipin Chandra): Roy was the 'Father of Indian Renaissance' — first to use reason and Western learning to reform Hinduism from within; abolition of sati (1829) was a landmark.\nRevision (Lata Mani): Roy's campaign against sati was not primarily about women's welfare — it was a debate between Indian men (Roy vs. orthodox pandits) with women as the contested ground. The woman's experience was peripheral to both sides.\nPostcolonial critique (Partha Chatterjee): Roy accepted the colonial framework — he petitioned the British state, not indigenous institutions. His 'reform' reinforced colonial legitimacy.\nBalance: Roy was genuinely reform-minded within the constraints of his class and era; the limits of his feminism are real but shouldn't erase his importance." },

  // Nationalism
  { id: 'm005', topic: 'birth-indian-nationalism', paper: 2, section: 'Modern India', type: 'cause-effect',
    front: "What factors led to the foundation of the Indian National Congress in 1885 — and was it a 'safety valve'?",
    back: "Factors:\n1. Growth of Western-educated middle class seeking political representation.\n2. Economic grievances — drain of wealth, exclusion of Indians from civil services.\n3. Impact of press and vernacular literature building national consciousness.\n4. Ilbert Bill controversy (1883) — racial solidarity among British; Indian solidarity in response.\n5. A.O. Hume's role (retired ICS officer).\n'Safety valve' theory: Lala Lajpat Rai and later historians argued Hume founded the INC to provide a controlled outlet for Indian grievances and prevent revolution — making it a tool of imperial management.\nBipin Chandra rejects this as reductive — the INC quickly outgrew British control and became a genuine nationalist platform, whatever Hume's intentions." },

  { id: 'm006', topic: 'birth-indian-nationalism', paper: 2, section: 'Modern India', type: 'comparison',
    front: "Compare the Moderates and Extremists within the Indian National Congress on aims and methods.",
    back: "Moderates (Gopal Krishna Gokhale, Dadabhai Naoroji, Pherozeshah Mehta):\n— Believed in British justice and constitutional methods\n— Petitions, memorials, resolutions; 'mendicancy' criticized by extremists\n— Aim: Self-governance within the British Empire (colonial self-government)\n— Trusted the educated elite as the vanguard\nExtremists (Bal Gangadhar Tilak, Bipin Chandra Pal, Lala Lajpat Rai — 'Lal-Bal-Pal'):\n— Rejected faith in British benevolence\n— Mass mobilization; Swadeshi, boycott, passive resistance\n— Aim: Swaraj (self-rule) — Tilak: 'Swaraj is my birthright'\n— Drew on religious symbols (Ganapati festival, Shivaji festival)\n— Split at Surat (1907) — British exploited the division" },

  // Gandhi
  { id: 'm007', topic: 'gandhian-nationalism', paper: 2, section: 'Modern India', type: 'historian',
    front: "How do Bipin Chandra, Shahid Amin, and Partha Chatterjee differently interpret Gandhian nationalism?",
    back: "Bipin Chandra (India's Struggle for Independence): Gandhi was the supreme mass mobilizer — transformed the Congress from elite club to mass movement; Satyagraha was a brilliant tactical innovation; Gandhi's greatness lay in connecting economic, political, and moral dimensions of colonialism.\nShahid Amin (Event, Metaphor, Memory — Chauri Chaura): At the subaltern level, Gandhi was perceived as a messianic figure with magical powers — peasants interpreted Gandhian symbols through their own frameworks, not Congress ideology. The gap between elite nationalism and subaltern consciousness was vast.\nPartha Chatterjee (The Nation and Its Fragments): Gandhi's nationalism reproduced a spiritual/material split — the inner (spiritual, cultural) domain was nationalized while the outer (political, economic) was contested with colonialism. This created a conservative cultural nationalism that marginalized women, minorities, and lower castes." },

  { id: 'm008', topic: 'gandhian-nationalism', paper: 2, section: 'Modern India', type: 'cause-effect',
    front: "Why did Gandhi withdraw the Non-Cooperation Movement in 1922 after Chauri Chaura?",
    back: "Event: February 1922 — a crowd of peasants burned a police station in Chauri Chaura (UP), killing 22 policemen after police fired on protesters.\nGandhi's reasons: Satyagraha must be non-violent; mass movement had gone beyond discipline; he had been warning of premature violence; moral authority of the movement had to be preserved.\nCritiques:\n— Subhas Chandra Bose: Withdrawal was a 'national calamity' — the movement was at its peak; momentum was squandered.\n— Jawaharlal Nehru (in prison): Shock and bewilderment; the political implications weren't thought through.\n— Shahid Amin: Chauri Chaura was not simply a breakdown of discipline but revealed the autonomous political agency of peasants that Gandhi could not control or fully understand." },

  // Partition
  { id: 'm009', topic: 'politics-separatism-partition', paper: 2, section: 'Modern India', type: 'historian',
    front: "Was the Partition of India inevitable? Examine the major historiographical positions.",
    back: "Two-nation theory (Jinnah, Muslim League): Hindus and Muslims were two separate nations incapable of coexistence in one democratic state — Muslim minority would always be outvoted. Partition was the only logical outcome.\nCongress failure thesis (Ayesha Jalal, The Sole Spokesman): Jinnah did not necessarily want Pakistan — he wanted a confederation with strong provinces and Muslim veto rights. Congress's insistence on a strong centre and majority-rule democracy forced him toward separatism. Partition was a failure of negotiation.\nColonial responsibility (Alastair Lamb, Mushirul Hasan): British 'divide and rule' — the 1909 separate electorates institutionalized communal identities; Mountbatten's hasty timetable made peaceful transfer impossible.\nSubaltern dimension (Urvashi Butalia, The Other Side of Silence): Focus shifts from elite politics to the experience of ordinary people — women, refugees, survivors. Partition was not just a political event but a human catastrophe." },

  // Constitutional
  { id: 'm010', topic: 'constitutional-developments', paper: 2, section: 'Modern India', type: 'comparison',
    front: "Compare the Morley-Minto Reforms (1909) and the Montagu-Chelmsford Reforms (1919) — intent and significance.",
    back: "Morley-Minto (1909):\n— Introduced separate electorates for Muslims — institutionalized communal representation\n— Enlarged legislative councils but no real power transferred\n— Morley explicitly denied any move toward self-government\n— Significance: First formal acknowledgment that Indians could be in councils; but separate electorates proved fateful for communalism\nMontagu-Chelmsford (1919):\n— Introduced dyarchy in provinces — transferred subjects (education, health) to Indian ministers; reserved subjects (finance, police) to British\n— Bicameral legislature at centre\n— Declared objective: 'Responsible government as an integral part of the British Empire'\n— Significance: Dyarchy was inherently contradictory — Indian ministers had no real power over finances; created frustration that fed into Non-Cooperation" },

  // ─── WORLD HISTORY ────────────────────────────────────────────────────────

  // Enlightenment
  { id: 'w001', topic: 'enlightenment-modern-ideas', paper: 2, section: 'World History', type: 'comparison',
    front: "Compare Rousseau and Locke on the social contract — how did their differences shape different revolutionary traditions?",
    back: "Locke: Social contract to protect pre-existing natural rights (life, liberty, property); government is a trustee — if it violates rights, it can be dissolved; popular sovereignty is limited; influenced American Revolution and liberal constitutional tradition.\nRousseau: Natural man was good; civilization corrupted him; social contract must create a 'general will' (volonté générale) — the collective moral will that may override individual interests; no division between legislature and executive in ideal republic.\nImpact: Locke → American constitutionalism (rights-based, checks and balances). Rousseau → French Revolution's radical phase — the 'general will' justified Jacobin terror, suppression of dissent ('forcing people to be free'). Isaiah Berlin identified Rousseau as an ancestor of totalitarianism through the concept of positive liberty." },

  { id: 'w002', topic: 'enlightenment-modern-ideas', paper: 2, section: 'World History', type: 'historian',
    front: "What is Marx's materialist conception of history and how does it differ from Hegel's idealism?",
    back: "Hegel: History is the unfolding of the Absolute Spirit (Geist) — ideas drive historical change; the Prussian state represented the culmination of Spirit's self-realization.\nMarx (inverting Hegel): 'I found Hegel standing on his head; I set him on his feet.' Material conditions (mode of production — forces + relations of production) determine consciousness, not vice versa. History is driven by class struggle — the contradiction between the exploiting and exploited class at each stage (slavery → feudalism → capitalism → socialism → communism).\nBase-Superstructure: The economic base (mode of production) determines the superstructure (law, politics, culture, religion). False consciousness: The ruling class's ideas dominate as the ruling ideas of each age." },

  // French Revolution
  { id: 'w003', topic: 'origins-modern-politics', paper: 2, section: 'World History', type: 'historian',
    front: "Trace the historiographical debate on the causes of the French Revolution.",
    back: "Classic liberal view (Jules Michelet, 19th c): Triumph of reason and liberty over despotism; the bourgeoisie led the people against aristocratic privilege.\nMarxist view (Albert Soboul, Georges Lefebvre): Bourgeois revolution — the rising capitalist class overthrew the feudal aristocracy; the Jacobin phase represented the revolutionary peak.\nRevision (Alfred Cobban, 1964 — 'The Social Interpretation of the French Revolution'): The bourgeoisie were not a coherent capitalist class — most revolutionaries were lawyers and officeholders (noblesse de robe), not merchants. The Revolution was led by a 'declining' rather than rising group.\nPost-revisionist (William Doyle, Timothy Tackett): A genuine political and social crisis — fiscal bankruptcy of the state, Enlightenment ideas, aristocratic reaction, popular famine. No single social group 'made' the revolution." },

  // Industrial Revolution
  { id: 'w004', topic: 'industrialization', paper: 2, section: 'World History', type: 'cause-effect',
    front: "Why did the Industrial Revolution begin in Britain and not in France, China, or India?",
    back: "1. Agricultural revolution preceded it — enclosures freed labour and increased food surplus.\n2. Coal and iron geography — accessible deposits near navigable rivers.\n3. Colonial markets and raw materials — captive demand and cheap inputs.\n4. Property rights and patent law — incentivized innovation.\n5. Nonconformist culture — Quakers, Unitarians disproportionately represented among industrialists (Joel Mokyr).\n6. Proto-industrialization — cottage industry prepared skilled labour.\nWhy not China (Kenneth Pomeranz — The Great Divergence): China had coal but in the wrong place (northwest, far from Yangtze economic core); no colonies providing labour-equivalent inputs; different institutional incentives.\nWhy not India: Colonial deindustrialization actively prevented it — British tariffs destroyed textile industry; surplus extracted rather than reinvested." },

  { id: 'w005', topic: 'industrialization', paper: 2, section: 'World History', type: 'historian',
    front: "How did E.P. Thompson transform the historiography of the Industrial Revolution?",
    back: "Thompson (The Making of the English Working Class, 1963): Rejected the view that the working class was a product of economic forces — it was self-made through shared experience and struggle. Class is a relationship and a process, not a structure.\nKey arguments:\n1. Workers had pre-existing moral economy (just price, subsistence rights) that industrialism violated.\n2. Methodism was a form of social control that displaced radical political energy into religious channels.\n3. Luddism was not irrational machine-breaking but a rational defense of craft skills and wages.\nSignificance: Humanized the history of industrialization — gave agency to workers; launched 'history from below' as a major methodology. Challenged both Marxist determinism and Whig progress narratives." },

  // Nation-State
  { id: 'w006', topic: 'nation-state-system', paper: 2, section: 'World History', type: 'comparison',
    front: "Compare Bismarck's unification of Germany with Cavour's unification of Italy — methods and outcomes.",
    back: "Bismarck (Germany, 1866–71): 'Blood and Iron' — used Prussian military superiority; three wars (Danish War 1864, Austro-Prussian 1866, Franco-Prussian 1870–71); the German Empire proclaimed in Versailles Hall of Mirrors (deliberate humiliation of France). Result: Powerful, militaristic federal empire with Prussian dominance; Reichstag had limited power; Kaiser supreme.\nCavour (Italy, 1852–61): Diplomatic finesse — alliance with France (Plombières Agreement, 1858) against Austria; used Garibaldi's popular nationalist force while controlling it from above. Result: Kingdom of Italy (1861) under Sardinian monarchy; the south ('Question of the South') remained underdeveloped; Italy weak internationally.\nKey difference: Germany achieved unification through Prussian military power — creating a strong state; Italy was unified through a combination of diplomacy and popular nationalism — creating a weak state with regional disparities." },

  // Imperialism
  { id: 'w007', topic: 'imperialism-colonialism', paper: 2, section: 'World History', type: 'historian',
    front: "Compare J.A. Hobson and Lenin's theories of imperialism.",
    back: "Hobson (Imperialism: A Study, 1902): Imperialism results from underconsumption at home — capitalists seek overseas markets and investment outlets because domestic workers can't afford to buy what they produce. Solution: redistribute income domestically — imperialism is not inevitable.\nLenin (Imperialism, the Highest Stage of Capitalism, 1916): Imperialism is the inevitable final stage of monopoly capitalism — the fusion of bank and industrial capital creates finance capital; the world is divided among monopolist powers; inter-imperialist rivalry leads to wars. Cannot be reformed — only revolution can end it.\nKey difference: Hobson thought reform could cure imperialism (progressive liberal); Lenin thought it was systemic and terminal (revolutionary socialist). Both agreed on the economic driver but differed on necessity and solution." },

  // Russian Revolution
  { id: 'w008', topic: 'revolution-counter-revolution', paper: 2, section: 'World History', type: 'historian',
    front: "Was the Russian Revolution of 1917 a genuine popular revolution or a Bolshevik coup? Examine the debate.",
    back: "Soviet/Leninist view: A proletarian revolution — the working class, led by the Bolsheviks (vanguard party), overthrew the bourgeois Provisional Government in October 1917 in fulfillment of historical necessity.\nLiberal critique (Richard Pipes, The Russian Revolution): October 1917 was a coup — the Bolsheviks had minority support; they dissolved the Constituent Assembly (January 1918) when it didn't give them majority; Lenin's party imposed dictatorship, not socialism.\nRevision (Orlando Figes, A People's Tragedy): The revolution was genuinely popular in February 1917; October was more ambiguous — the Bolsheviks exploited exhaustion and chaos; the subsequent civil war and Terror revealed the revolution devouring itself.\nSubaltern/Social history (Sheila Fitzpatrick): Ordinary people (workers, soldiers, peasants) had their own revolutionary agendas that partially converged with and partially diverged from Bolshevik goals." },

  { id: 'w009', topic: 'revolution-counter-revolution', paper: 2, section: 'World History', type: 'comparison',
    front: "Compare Italian Fascism and German Nazism — similarities and key differences.",
    back: "Similarities: Ultra-nationalism; single-party totalitarian state; leader cult (Duce/Führer); anti-communism; glorification of violence and war; corporatist economics suppressing both labour and independent capital; use of propaganda and spectacle.\nDifferences:\n— Race: Nazism was fundamentally racial — antisemitism, Aryan supremacy, Holocaust. Italian Fascism was not racially defined initially; racial laws came in 1938 under Nazi pressure.\n— Ideology: Mussolini was more pragmatic — 'Fascism is not an article for export.' Hitler had a coherent (though monstrous) racial-ideological worldview (Mein Kampf).\n— Church: Mussolini made peace with the Catholic Church (Lateran Treaty, 1929). Nazis sought to subordinate Christianity to a Germanic racial religion.\n— Totalitarian completeness: Nazi state was more thoroughly totalitarian; Italian state had more institutional gaps." },

  // World Wars
  { id: 'w010', topic: 'world-wars', paper: 2, section: 'World History', type: 'historian',
    front: "What is the Fischer Controversy regarding the causes of World War I?",
    back: "Fritz Fischer (Germany's Aims in the First World War, 1961): Germany deliberately sought a European war in 1914 to achieve world power (Weltpolitik) — the 'September Programme' showed Germany's expansionist war aims; the blank cheque to Austria was calculated. Germany bore primary responsibility.\nReaction: Massive controversy in Germany — attacked as unpatriotic; other historians (Gerhard Ritter) insisted all powers shared responsibility.\nModern consensus (John Keiger, Hew Strachan): Fischer overstated the case — all great powers had aggressive elements; Austria-Hungary and Russia's decisions were crucial; the alliance system made a local Balkan crisis into a continental war. The war was the product of systemic failure, not German conspiracy alone.\nChristopher Clark (The Sleepwalkers, 2012): All the major powers 'sleepwalked' into war — no single power planned or wanted a world war." },

  { id: 'w011', topic: 'world-wars', paper: 2, section: 'World History', type: 'cause-effect',
    front: "Why did World War II happen? Was the Treaty of Versailles the primary cause?",
    back: "Versailles as cause (A.J.P. Taylor, John Maynard Keynes — Economic Consequences of the Peace): The 'war guilt' clause (Article 231), reparations, territorial losses (Alsace-Lorraine, Polish Corridor), disarmament humiliated Germany and created conditions for Nazi rise.\nChallenge to this: Sally Marks — Versailles was not unusually harsh; Germany could have paid; it was the Great Depression (1929) and Weimar's political instability that enabled Hitler, not Versailles alone.\nAppeasement: Chamberlain's Munich Agreement (1938) emboldened Hitler — belief that Hitler had limited aims was catastrophically wrong.\nMulti-causal: 1) Global Depression → mass unemployment → political radicalization; 2) Failure of collective security (weak League of Nations); 3) Stalin-Hitler Pact (1939) gave Hitler freedom to invade Poland; 4) Japanese aggression in Asia (Pearl Harbor 1941) made it truly global." },

  // Cold War
  { id: 'w012', topic: 'world-after-wwii', paper: 2, section: 'World History', type: 'historian',
    front: "Compare the Orthodox, Revisionist, and Post-revisionist interpretations of the Cold War's origins.",
    back: "Orthodox (1950s–60s, Arthur Schlesinger Jr.): Soviet aggression and expansionism — Stalin's ideology drove him to extend communism; the West merely responded defensively. The Soviet Union bears primary responsibility.\nRevisionist (1960s–70s, William Appleman Williams, Gar Alperovitz): American economic imperialism — the US sought an 'Open Door' world for capital; the atomic bombing of Hiroshima was primarily a message to the USSR; Truman Doctrine was aggressive containment, not defense.\nPost-revisionist (1970s–80s, John Lewis Gaddis): Both superpowers shared responsibility; the Cold War resulted from mutual misperception and the security dilemma; neither side fully controlled events; domestic politics in both countries constrained leadership.\nPost-Cold War (after Soviet archives opened): Confirms Soviet expansionist intentions in Eastern Europe; Stalin was genuinely aggressive; but US overreaction also escalated tensions." },

  // Liberation
  { id: 'w013', topic: 'liberation-colonial-rule', paper: 2, section: 'World History', type: 'comparison',
    front: "Compare the decolonization of India and Algeria — peaceful transfer vs. violent liberation.",
    back: "India (1947): Negotiated transfer — decades of mass nationalist movement (Congress, Gandhi); the British were financially exhausted post-WWII; political elite (Nehru, Jinnah) engaged in constitutional negotiation; partition was violent but independence itself was negotiated.\nAlgeria (1954–62): Prolonged armed struggle — Algeria was constitutionally part of France ('departments'); one million European settlers (colons) with political power; the FLN (National Liberation Front) launched guerrilla war; France used systematic torture (Battle of Algiers); over 1 million Algerians killed; independence came only through intractable war.\nKey difference: The presence of a settler colonial population (as in Algeria, Kenya, Zimbabwe) made peaceful decolonization far harder. In India, the British were administrators and merchants, not settlers — departure was conceivable without existential threat to a settler community." },

  // Soviet Disintegration
  { id: 'w014', topic: 'disintegration-soviet-union', paper: 2, section: 'World History', type: 'cause-effect',
    front: "What caused the disintegration of the Soviet Union in 1991?",
    back: "1. Economic stagnation: The command economy could not compete with Western technology; oil price collapse (1986) devastated Soviet finances; arms race drained resources.\n2. Gorbachev's reforms: Glasnost (openness) unleashed suppressed nationalism and criticism; Perestroika (restructuring) destabilized the economy without replacing it.\n3. Nationalism: Baltic states, Ukraine, Caucasus — suppressed national identities resurfaced; the 1991 August coup attempt by hardliners paradoxically accelerated dissolution.\n4. Legitimacy crisis: The party had lost ideological credibility; the 1989 revolutions in Eastern Europe showed the system was not irreversible.\nHistoriographical debate: Stephen Kotkin — the Soviet collapse was overdetermined by structural factors; the command economy was inherently uncompetitive. Others (Archie Brown) emphasize Gorbachev's personal role — a different leader might have preserved the union through repression." },

  // Additional high-value cards
  { id: 'x001', topic: 'economy-society-16-17c', paper: 1, section: 'Medieval India', type: 'historian',
    front: "How does Irfan Habib's Agrarian System of Mughal India characterize peasant conditions?",
    back: "Habib (1963, revised 1999): The Mughal state extracted 1/3 to 1/2 of agricultural produce as land revenue — leaving peasants at bare subsistence. Three levels of exploitation: state (diwan), jagirdar/mansabdar, and village zamindar. This heavy extraction prevented capital formation in agriculture.\nKey arguments:\n1. The peasant revolt cycle — over-extraction → peasant flight (hijrat) or revolt → production collapse.\n2. Zamindars were not a fixed class but a heterogeneous group absorbing local power structures.\n3. The agrarian crisis of the 17th century was structurally produced — not caused by individual bad rulers.\nCritique (Tapan Raychaudhuri): Habib overestimates extraction rates; regional variation was vast; the Ain-i-Akbari data used are for ideal assessments, not actual collections." },

  { id: 'x002', topic: 'gandhian-nationalism', paper: 2, section: 'Modern India', type: 'concept',
    front: "What is the Subaltern Studies approach to Indian nationalism and who are its key figures?",
    back: "Founded by Ranajit Guha (Subaltern Studies collective, from 1982): Mainstream nationalist historiography (both colonial and nationalist) wrote history 'from above' — elites (colonial officials, Congress leaders) dominated the narrative. The subaltern (peasant, tribal, woman, worker) was absent as a historical subject.\nKey interventions:\n— Ranajit Guha (Elementary Aspects of Peasant Insurgency): Peasant revolts had their own logic, codes, and consciousness — not merely reactive to elite politics.\n— Shahid Amin (Chauri Chaura): Peasant perception of Gandhi as magical figure.\n— Partha Chatterjee: Nationalist thought reproduced colonial categories.\n— Gayatri Spivak ('Can the Subaltern Speak?'): Even subaltern studies cannot fully recover the voice of the most marginalized — the subaltern woman.\nImpact: Transformed South Asian historiography; influenced postcolonial studies globally." },

  { id: 'x003', topic: 'post-independence-consolidation', paper: 2, section: 'Modern India', type: 'historian',
    front: "How do historians assess Nehru's foreign policy — Non-Alignment, China policy, and its legacy?",
    back: "Nehru's vision: Non-Alignment Movement (Bandung 1955, with Nasser, Tito, Sukarno) — India would not join either Cold War bloc; 'Panchsheel' (five principles of peaceful coexistence) with China (1954).\nCritique of China policy:\n— Vijayalakshmi Pandit, military establishment: Nehru was naive — 'Hindi-Chini bhai-bhai' while China occupied Aksai Chin.\n— 1962 Sino-Indian War exposed the failure of 'Forward Policy' and the gap between idealism and military preparedness.\nDefence (Srinath Raghavan): Non-Alignment was strategically rational — India was too poor to re-arm; it leveraged both superpowers for aid; 1962 resulted from structural constraints, not just naivety.\nLegacy: Non-Alignment gave India moral authority in the developing world; created the template for strategic autonomy that India still formally maintains." },

  { id: 'x004', topic: 'social-cultural-developments', paper: 2, section: 'Modern India', type: 'historian',
    front: "What was the Orientalist-Anglicist controversy and what did Thomas Macaulay argue?",
    back: "The controversy (1830s): Should British India educate Indians in classical Indian languages (Sanskrit, Arabic, Persian) or in English?\nOrientalists (H.H. Wilson, H.T. Prinsep): Indian classical learning had value; education should build on existing knowledge systems; govern through indigenous institutions.\nAnglicists (Charles Trevelyan, T.B. Macaulay): Indian learning was inferior — 'a single shelf of a good European library is worth the whole native literature of India and Arabia.' English education would create 'Indians in blood and colour, but English in tastes, opinions, morals and intellect' — the famous 'Minute on Education' (1835).\nOutcome: Macaulay's view prevailed — English became the medium of higher education.\nHistorical assessment: Created a Western-educated elite that led nationalism (irony noted by Macaulay's critics); but also deepened the divide between educated elite and vernacular masses." },

  { id: 'x005', topic: 'imperialism-colonialism', paper: 2, section: 'World History', type: 'comparison',
    front: "Compare the Scramble for Africa (1880s–1900s) among European powers — causes and consequences.",
    back: "Causes:\n1. Economic: Search for raw materials, markets, investment outlets (Hobson-Lenin thesis).\n2. Strategic: Control of sea routes (Suez Canal, Cape Route).\n3. Nationalist competition: European powers competed for prestige.\n4. Technology: Quinine (malaria), Maxim gun, steamships made interior Africa accessible.\n5. Berlin Conference (1884–85): Bismarck convened to regulate partition — 'effective occupation' principle; Africa divided without African consent.\nConsequences:\n1. Artificial borders cutting across ethnic/cultural lines — legacy of conflict.\n2. Economic extraction without development.\n3. Destruction of indigenous political systems.\n4. Cultural imperialism — missionary education created a Western-educated but displaced elite.\n5. Apartheid systems (South Africa) as extreme form of settler colonialism.\nBy 1914: 90% of Africa under European control." },

];

export const flashcardTopics = [...new Set(flashcards.map(f => f.topic))];
export const flashcardSections = [...new Set(flashcards.map(f => f.section))];
export const flashcardTypes = ['historian', 'comparison', 'cause-effect', 'quote', 'concept'] as const;
