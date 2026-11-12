'use client';
import { useEffect, useRef, useState } from 'react';
import Link from '@/components/Link';
import { useLang } from '@/lib/i18n/LangContext';

/**
 * The tools, one at a time: a row of tabs and one large panel that says what
 * the tool does and shows it. The previews are drawn in HTML with real
 * content (the PYQs are real questions from the bank, the historians and
 * their positions are the ones the notes teach), so they stay sharp and cost
 * no images.
 */

const Book = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 19.5V5a2 2 0 0 1 2-2h13v16H6.5A2.5 2.5 0 0 0 4 21.5" /><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H19" /></svg>
);
const Tick = ({ size = 13 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
);
const Plus = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
);
const Arrow = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
);

function Frame({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="sw" aria-hidden="true">
      <div className="sw-bar"><i /><i /><i /><span>{title}</span></div>
      <div className="sw-body">{children}</div>
    </div>
  );
}

function ChatPreview({ hi }: { hi: boolean }) {
  if (hi) {
    return (
      <Frame title="AI चैट · इतिहास वैकल्पिक">
        <div className="sw-ask">मुग़ल कृषि संकट पर इरफ़ान हबीब का क्या तर्क था?</div>
        <div className="sw-trace">7 सेकंड में शोध किया ›</div>
        <p className="sw-p">हबीब ने संकट की जड़ <b>जागीर व्यवस्था</b> में देखी: जागीरदार हर कुछ साल में बदल दिए जाते थे, इसलिए जब तक ज़मीन उनके पास रहती, वे किसानों से जितना हो सके उतना वसूल लेते थे <span className="sw-cite"><Book />हबीब</span></p>
        <p className="sw-p">उनके अनुसार, इसके बाद किसानों के पलायन और विद्रोह ने साम्राज्य को नीचे से खोखला कर दिया <span className="sw-cite"><Book />सतीश चंद्र</span></p>
        <div className="sw-sources">
          <span className="sw-sources-n">7 पुस्तक अंश</span>
          <span className="sw-sources-from">इरफ़ान हबीब, सतीश चंद्र और IGNOU इतिहास से</span>
        </div>
        <div className="sw-compose"><span>आगे का प्रश्न पूछें…</span><i>↑</i></div>
      </Frame>
    );
  }
  return (
    <Frame title="AI Chat · History Optional">
      <div className="sw-ask">What did Irfan Habib argue about the Mughal agrarian crisis?</div>
      <div className="sw-trace">Researched 7s ›</div>
      <p className="sw-p">Habib traced the crisis to the <b>jagir system</b>: holders moved every few years, so they squeezed peasants for all they could get while they held the land <span className="sw-cite"><Book />Habib</span></p>
      <p className="sw-p">The flight and revolt of peasants that followed, he argued, wore the empire down from below <span className="sw-cite"><Book />Satish Chandra</span></p>
      <div className="sw-sources">
        <span className="sw-sources-n">7 book passages</span>
        <span className="sw-sources-from">from Irfan Habib, Satish Chandra and IGNOU History</span>
      </div>
      <div className="sw-compose"><span>Ask a follow-up…</span><i>↑</i></div>
    </Frame>
  );
}

function EvalPreview({ hi }: { hi: boolean }) {
  const r = 30, c = 2 * Math.PI * r;
  return (
    <Frame title={hi ? 'मूल्यांकन · 15 अंक' : 'Evaluation · 15 marks'}>
      <div className="sw-score">
        <svg width="78" height="78" viewBox="0 0 78 78">
          <circle cx="39" cy="39" r={r} fill="none" stroke="var(--sw-track)" strokeWidth="7" />
          <circle cx="39" cy="39" r={r} fill="none" stroke="var(--success-text)" strokeWidth="7" strokeLinecap="round" strokeDasharray={`${c * (10 / 15)} ${c}`} transform="rotate(-90 39 39)" />
        </svg>
        <div><strong>10<small>/15</small></strong><span>{hi ? 'अच्छा उत्तर' : 'A good answer'}</span></div>
      </div>
      <div className="sw-bars">
        <div><em>{hi ? 'भूमिका' : 'Introduction'}</em><i style={{ width: '80%' }} /></div>
        <div><em>{hi ? 'मुख्य भाग' : 'Body'}</em><i style={{ width: '70%' }} /></div>
        <div><em>{hi ? 'इतिहासकार' : 'Historians'}</em><i style={{ width: '48%' }} /></div>
      </div>
      <div className="sw-fb ok"><Tick />{hi ? 'सीधे सामंतवाद की बहस से शुरुआत करता है' : 'Opens with the feudalism debate itself'}</div>
      <div className="sw-fb ok"><Tick />{hi ? 'आर.एस. शर्मा को हरबंस मुखिया के सामने रखता है' : 'Sets R.S. Sharma against Harbans Mukhia'}</div>
      <div className="sw-fb add"><Plus />{hi ? 'साक्ष्य के रूप में भूमि-अनुदान के अभिलेख जोड़ें' : 'Bring in the land grant inscriptions as evidence'}</div>
    </Frame>
  );
}

function NotesPreview({ hi }: { hi: boolean }) {
  if (hi) {
    return (
      <Frame title="नोट्स · प्रश्नपत्र I">
        <div className="sw-crumb">मध्यकालीन भारत · प्रारंभिक मध्यकालीन भारत</div>
        <div className="sw-h">सामंतवाद की बहस</div>
        <p className="sw-p">आर.एस. शर्मा के अनुसार, ब्राह्मणों और अधिकारियों को दिए गए भूमि-अनुदानों ने राज्य को <mark>अपने-अपने राजस्व वाले स्थानीय सामंतों</mark> में बाँट दिया, लगभग वैसे ही जैसे मध्यकालीन यूरोप में हुआ।</p>
        <div className="sw-sub">किसने क्या कहा</div>
        <ul className="sw-list">
          <li><b>आर.एस. शर्मा:</b> भारतीय सामंतवाद, जो भूमि-अनुदानों और व्यापार के पतन पर टिका था।</li>
          <li><b>हरबंस मुखिया:</b> यूरोप जैसी कृषि-दासता नहीं थी, इसलिए सामंतवाद भी नहीं।</li>
          <li><b>बर्टन स्टाइन:</b> इसके बजाय चोल राज्य एक खंडीय राज्य था।</li>
        </ul>
        <div className="sw-terms"><span>भूमि-अनुदान</span><span>सामंत</span><span>खंडीय राज्य</span></div>
      </Frame>
    );
  }
  return (
    <Frame title="Notes · Paper I">
      <div className="sw-crumb">Medieval India · Early medieval India</div>
      <div className="sw-h">The feudalism debate</div>
      <p className="sw-p">Land grants to Brahmanas and officials, R.S. Sharma argued, broke the state into <mark>local lords with their own revenue</mark>, much as in medieval Europe.</p>
      <div className="sw-sub">Who says what</div>
      <ul className="sw-list">
        <li><b>R.S. Sharma:</b> Indian feudalism, built on land grants and a decline of trade.</li>
        <li><b>Harbans Mukhia:</b> no serfdom of Europe&apos;s kind, so no feudalism.</li>
        <li><b>Burton Stein:</b> the Chola state as a segmentary state instead.</li>
      </ul>
      <div className="sw-terms"><span>Land grants</span><span>Samantas</span><span>Segmentary state</span></div>
    </Frame>
  );
}

function PyqPreview({ hi }: { hi: boolean }) {
  // UPSC's own Hindi wording of the same three questions (lib/pyqDataHi.ts).
  const rows = [
    { year: 2023, marks: 10, q: 'Discuss the various proponents of Indian feudalism.', qHi: 'भारतीय सामंतवाद के विभिन्न समर्थक तत्त्वों की विवेचना कीजिए।' },
    { year: 2021, marks: 10, q: 'Discuss the different stages of Indian feudalism and analyze its impact on Indian political system.', qHi: 'भारतीय सामंतवाद के विविध चरणों की विवेचना करते हुए भारतीय राजनैतिक व्यवस्था पर इसके प्रभाव का विश्लेषण कीजिए।' },
    { year: 2015, marks: 15, q: 'Do the evidences of land ownership at our disposal support the theory of the prevalence of feudalism in early medieval India?', qHi: 'क्या हमारे पास उपलब्ध भू-स्वामित्व के साक्ष्य पूर्व मध्यकालीन भारत में सामंतवाद के प्रचलन के सिद्धांत का समर्थन करते हैं?' },
  ];
  return (
    <Frame title={hi ? 'PYQ · इतिहास वैकल्पिक' : 'PYQs · History Optional'}>
      <div className="sw-filters"><span>{hi ? 'प्रश्नपत्र I' : 'Paper I'}</span><span className="on">{hi ? 'सामंतवाद' : 'Feudalism'}</span><span>{hi ? 'सभी अंक' : 'All marks'}</span></div>
      {rows.map((r) => (
        <div key={r.year} className="sw-pyq">
          <div className="sw-pyq-meta"><b>{r.year}</b> · {r.marks} {hi ? 'अंक' : 'marks'}</div>
          <div className="sw-pyq-q">{hi ? r.qHi : r.q}</div>
        </div>
      ))}
    </Frame>
  );
}

function TopperPreview({ hi }: { hi: boolean }) {
  // The handwritten line stays as it is: the copies are scans of real
  // answer sheets, written in English.
  return (
    <Frame title={hi ? 'टॉपर कॉपियाँ · मध्यकालीन भारत' : 'Topper copies · Medieval India'}>
      <div className="sw-sheet">
        <div className="sw-sheet-q">{hi ? '2015 · 15 अंक · क्या भू-स्वामित्व के साक्ष्य सामंतवाद के सिद्धांत का समर्थन करते हैं?' : '2015 · 15 marks · Do the evidences of land ownership support the theory of feudalism?'}</div>
        <div className="sw-hand">
          The debate on <u>Indian feudalism</u>, opened by D.D. Kosambi and carried forward by R.S. Sharma, rests on the copper-plate land grants…
        </div>
      </div>
      <div className="sw-note"><Tick />{hi ? 'पहली ही पंक्ति में इतिहास-लेखन से शुरुआत' : 'Opens with the historiography in the first line'}</div>
      <div className="sw-note"><Tick />{hi ? 'पक्ष और विपक्ष, दोनों के साक्ष्य तौलता है' : 'Weighs the evidence for and against'}</div>
    </Frame>
  );
}

function CardsPreview({ hi }: { hi: boolean }) {
  return (
    <Frame title={hi ? 'फ़्लैशकार्ड · मुग़ल साम्राज्य' : 'Flashcards · Mughal Empire'}>
      <div className="sw-progress"><span>{hi ? '20 में से कार्ड 4' : 'Card 4 of 20'}</span><span className="sw-streak">{hi ? 'लगातार 6 सही' : '6 in a row'}</span></div>
      <div className="sw-track"><i style={{ width: '20%' }} /></div>
      <div className="sw-card"><small>{hi ? 'प्रश्न' : 'Question'}</small><b>{hi ? <>मुग़ल राज्य को &lsquo;पैतृक-नौकरशाही&rsquo; साम्राज्य किसने कहा?</> : <>Who called the Mughal state a &lsquo;patrimonial-bureaucratic&rsquo; empire?</>}</b></div>
      <div className="sw-card back"><small>{hi ? 'उत्तर' : 'Answer'}</small><b>{hi ? 'स्टीफ़न ब्लेक, 1979 में' : 'Stephen Blake, in 1979'}</b></div>
      <div className="sw-rate"><span>{hi ? 'फिर से' : 'Again'}</span><span>{hi ? 'कठिन' : 'Hard'}</span><span className="on">{hi ? 'याद आया' : 'Got it'}</span></div>
    </Frame>
  );
}

type Copy = { tab: string; title: string; text: string; points: string[]; cta: string };
type Tab = Copy & {
  key: string; hi: Copy; href: string; wash: string; Preview: (p: { hi: boolean }) => React.ReactNode;
};

const TABS: Tab[] = [
  {
    key: 'chat', tab: 'AI Chat', title: 'Stuck on a historian at 11 PM? Ask us.',
    text: 'It answers from the standard books and marks each line with the book it came from, so you can open the page and check for yourself.',
    points: ['It names the historians behind each view', 'Ask for a proper Mains answer when you want one', 'Mentor mode, for when you want to be marked hard'],
    cta: 'Open AI Chat',
    hi: {
      tab: 'AI चैट', title: 'रात 11 बजे किसी इतिहासकार पर अटके हैं? हमसे पूछें।',
      text: 'यह मानक पुस्तकों से उत्तर देता है और हर पंक्ति के साथ उस पुस्तक का नाम देता है जहाँ से वह आई है, ताकि आप वह पन्ना खोलकर ख़ुद जाँच सकें।',
      points: ['हर मत के पीछे के इतिहासकारों के नाम बताता है', 'जब चाहें, मुख्य परीक्षा का पूरा उत्तर माँगें', 'मेंटर मोड, जब आप कड़ी जाँच चाहें'],
      cta: 'AI चैट खोलें',
    },
    href: '/chat', wash: 'var(--accent-wash)', Preview: ChatPreview,
  },
  {
    key: 'eval', tab: 'Evaluation', title: 'Write the way you would in the exam hall.',
    text: 'Snap a photo of your answer sheet and upload it. You’ll see your marks, the historians you missed, and a model answer for the same question.',
    points: ['Marks for the introduction, body and conclusion', 'A model answer to set beside yours', 'It reads handwriting fine'],
    cta: 'Check an answer',
    hi: {
      tab: 'मूल्यांकन', title: 'वैसे ही लिखें, जैसे परीक्षा हॉल में लिखते हैं।',
      text: 'अपनी उत्तर पुस्तिका की फ़ोटो खींचकर अपलोड करें। आपको अपने अंक, छूटे हुए इतिहासकार, और उसी प्रश्न का एक आदर्श उत्तर दिखेगा।',
      points: ['भूमिका, मुख्य भाग और निष्कर्ष के अलग-अलग अंक', 'अपने उत्तर से मिलाने के लिए एक आदर्श उत्तर', 'हाथ की लिखावट ठीक से पढ़ लेता है'],
      cta: 'उत्तर जँचवाएँ',
    },
    href: '/evaluate', wash: 'var(--success-wash)', Preview: EvalPreview,
  },
  {
    key: 'notes', tab: 'Notes', title: 'Notes that carry the debates.',
    text: 'Every topic in both papers, with who argued what worked right into the notes, so the debates are there when you need them.',
    points: ['Laid out the way the syllabus is', 'Highlight and write on them, on any device', 'Ask the AI about anything you are reading'],
    cta: 'Read the notes',
    hi: {
      tab: 'नोट्स', title: 'ऐसे नोट्स, जिनमें बहसें भी हैं।',
      text: 'दोनों प्रश्नपत्रों का हर विषय, और किसने क्या तर्क दिया, यह नोट्स में ही बुना हुआ है, ताकि ज़रूरत पड़ने पर बहसें सामने हों।',
      points: ['पाठ्यक्रम के क्रम में ही सजे हुए', 'किसी भी डिवाइस पर हाइलाइट करें और उन पर लिखें', 'जो भी पढ़ रहे हों, उसके बारे में AI से पूछें'],
      cta: 'नोट्स पढ़ें',
    },
    href: '/notes', wash: 'var(--wash-ancient)', Preview: NotesPreview,
  },
  {
    key: 'pyq', tab: 'PYQs', title: 'See what UPSC keeps asking.',
    text: 'Every History Optional question since 1979, sorted by topic. Pick one, see how a good answer goes, then write your own.',
    points: ['Filter by year, paper, topic and marks', 'Model answers when you want one', 'Topper copies for many of them'],
    cta: 'Browse PYQs',
    hi: {
      tab: 'PYQ', title: 'देखें कि UPSC बार-बार क्या पूछता है।',
      text: '1979 से अब तक इतिहास वैकल्पिक का हर प्रश्न, विषय के अनुसार। कोई एक चुनें, देखें कि अच्छा उत्तर कैसे लिखा जाता है, फिर अपना लिखें।',
      points: ['वर्ष, प्रश्नपत्र, विषय और अंकों से छाँटें', 'जब चाहें, आदर्श उत्तर', 'कई प्रश्नों की टॉपर कॉपियाँ'],
      cta: 'पिछले प्रश्न देखें',
    },
    href: '/pyqs', wash: 'var(--warning-wash)', Preview: PyqPreview,
  },
  {
    key: 'topper', tab: 'Topper copies', title: 'Read how toppers actually wrote it.',
    text: 'Real answer sheets from toppers, matched to the questions they answer, so you can see what a high-scoring answer looks like on paper.',
    points: ['Matched to the PYQ they answer', 'Compare two answers side by side', 'Diagrams and maps as drawn in the exam'],
    cta: 'See topper copies',
    hi: {
      tab: 'टॉपर कॉपियाँ', title: 'पढ़ें कि टॉपरों ने असल में कैसे लिखा।',
      text: 'टॉपरों की असली उत्तर पुस्तिकाएँ, उन्हीं प्रश्नों के साथ जिनका वे उत्तर हैं, ताकि आप देख सकें कि ऊँचे अंकों वाला उत्तर काग़ज़ पर कैसा दिखता है।',
      points: ['जिस PYQ का उत्तर है, उसी के साथ', 'दो उत्तरों को साथ-साथ रखकर तुलना करें', 'आरेख और मानचित्र, जैसे परीक्षा में बनाए गए'],
      cta: 'टॉपर कॉपियाँ देखें',
    },
    href: '/topper-copies', wash: 'var(--premium-wash)', Preview: TopperPreview,
  },
  {
    key: 'cards', tab: 'Flashcards', title: 'The dates and names that slip away.',
    text: 'Short cards for the facts you need to have at your fingertips, topic by topic, with the ones you miss coming back sooner.',
    points: ['Every topic in both papers', 'In English and Hindi', 'Your progress, kept for you'],
    cta: 'Start revising',
    hi: {
      tab: 'फ़्लैशकार्ड', title: 'वे तिथियाँ और नाम, जो याद से फिसल जाते हैं।',
      text: 'उन तथ्यों के छोटे कार्ड जो आपको ज़बानी याद होने चाहिए, विषय दर विषय, और जो कार्ड छूट जाते हैं वे जल्दी लौटकर आते हैं।',
      points: ['दोनों प्रश्नपत्रों का हर विषय', 'अंग्रेज़ी और हिंदी में', 'आपकी प्रगति, आपके लिए सहेजी हुई'],
      cta: 'दोहराना शुरू करें',
    },
    href: '/flashcards', wash: 'var(--wash-modern)', Preview: CardsPreview,
  },
];

/** How long each tab shows before the next opens on its own. */
const DWELL_MS = 60_000;

export default function HomeShowcase() {
  const { langHi } = useLang();
  const [active, setActive] = useState(0);
  const tabsRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const t = TABS[active];
  const copy = langHi ? t.hi : t;

  // The tabs move on by themselves every minute. A line under the chosen
  // tab fills over that time and its end opens the next, so the two cannot
  // drift. It holds while a mouse is over the showcase, while focus is in it,
  // and while it is off screen; reduced motion turns it off (see the CSS).
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.35 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const held = hovered || focused || !inView;

  // On a phone the tabs scroll sideways; keep the chosen one in sight
  // without moving the page.
  useEffect(() => {
    const strip = tabsRef.current;
    const tab = strip?.querySelectorAll<HTMLElement>('[role="tab"]')[active];
    if (!strip || !tab || strip.scrollWidth <= strip.clientWidth) return;
    strip.scrollTo({ left: tab.offsetLeft - (strip.clientWidth - tab.offsetWidth) / 2, behavior: 'smooth' });
  }, [active]);

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const next = (active + (e.key === 'ArrowRight' ? 1 : TABS.length - 1)) % TABS.length;
    setActive(next);
    tabsRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]?.focus();
  };

  return (
    <div className="hs" ref={rootRef} data-held={held ? 'true' : undefined} style={{ ['--hs-dwell' as string]: `${DWELL_MS}ms` }}
      onPointerEnter={(e) => { if (e.pointerType === 'mouse') setHovered(true); }}
      onPointerLeave={(e) => { if (e.pointerType === 'mouse') setHovered(false); }}
      onFocus={(e) => { if ((e.target as HTMLElement).matches(':focus-visible')) setFocused(true); }}
      onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocused(false); }}>
      <style dangerouslySetInnerHTML={{ __html: HS_CSS }} />
      <div className="hs-tabs" role="tablist" aria-label={langHi ? 'इसमें क्या है' : 'What is inside'} ref={tabsRef} onKeyDown={onKey}>
        {TABS.map((x, i) => (
          <button
            key={x.key}
            role="tab"
            id={`hs-tab-${x.key}`}
            aria-selected={i === active}
            aria-controls="hs-panel"
            tabIndex={i === active ? 0 : -1}
            className={`hs-tab${i === active ? ' on' : ''}`}
            onClick={() => setActive(i)}
            onAnimationEnd={(e) => { if (i === active && e.animationName === 'hs-dwell') setActive((active + 1) % TABS.length); }}
          >
            {langHi ? x.hi.tab : x.tab}
          </button>
        ))}
      </div>

      <div className="hs-panel" id="hs-panel" role="tabpanel" aria-labelledby={`hs-tab-${t.key}`} style={{ ['--hs-wash' as string]: t.wash }}>
        <div className="hs-copy" key={`copy-${t.key}`}>
          <h3 className="hs-title">{copy.title}</h3>
          <p className="hs-text">{copy.text}</p>
          <ul className="hs-points">
            {copy.points.map((p) => <li key={p}>{p}</li>)}
          </ul>
          <Link href={t.href} className="ds-btn ds-btn-solid">{copy.cta}<Arrow /></Link>
        </div>
        <div className="hs-shot" key={`shot-${t.key}`}><t.Preview hi={langHi} /></div>
      </div>
    </div>
  );
}

const HS_CSS = `
.hs { --sw-bg: #111114; --sw-line: rgba(255,255,255,0.08); --sw-track: rgba(255,255,255,0.1); }
[data-theme="light"] .hs { --sw-bg: #ffffff; --sw-line: rgba(0,0,0,0.07); --sw-track: rgba(0,0,0,0.07); }

/* Tabs: one pill track, the chosen one raised. */
.hs-tabs {
  display: flex; gap: 4px; width: max-content; max-width: 100%; margin: 0 auto var(--space-6);
  padding: 4px; border-radius: var(--radius-full); background: var(--ds-soft); border: 1px solid var(--border);
  overflow-x: auto; scrollbar-width: none;
}
.hs-tabs::-webkit-scrollbar { display: none; }
.hs-tab {
  flex-shrink: 0; padding: 9px 18px; border: none; border-radius: var(--radius-full); background: none;
  color: var(--text2); font-size: 0.94rem; font-weight: 600; cursor: pointer; white-space: nowrap;
  transition: background 0.18s, color 0.18s, box-shadow 0.18s;
}
.hs-tab:hover { color: var(--text); }
.hs-tab.on { background: var(--ds-card); color: var(--text); box-shadow: var(--elev-1); }
/* The time left on this tab, filling left to right. */
.hs-tab { position: relative; }
.hs-tab.on::after { content: ''; position: absolute; left: 18px; right: 18px; bottom: 4px; height: 2px; border-radius: 2px; background: var(--accent); opacity: 0.7; transform: scaleX(0); transform-origin: left; animation: hs-dwell var(--hs-dwell) linear forwards; }
.hs[data-held] .hs-tab.on::after { animation-play-state: paused; }
@keyframes hs-dwell { to { transform: scaleX(1); } }
@media (prefers-reduced-motion: reduce) { .hs-tab.on::after { display: none; } }
.hs-tab:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }

/* The panel: words on the left, the tool on the right, rising off the bottom edge. */
.hs-panel {
  display: grid; grid-template-columns: 5fr 7fr; gap: var(--space-8); align-items: center;
  min-height: 460px; padding: var(--space-10) 0 0 var(--space-10); overflow: hidden;
  border-radius: 28px; border: 1px solid var(--border);
  background: color-mix(in srgb, var(--hs-wash) 55%, var(--ds-soft));
  transition: background 0.3s ease;
}
.hs-copy { display: flex; flex-direction: column; align-items: flex-start; gap: var(--space-4); padding-bottom: var(--space-10); animation: hsIn 0.32s ease both; }
.hs-title { font-weight: 800; font-size: clamp(1.4rem, 2.4vw, 1.9rem); line-height: 1.2; letter-spacing: -0.025em; color: var(--text); }
.hs-text { font-size: 1.02rem; line-height: 1.65; color: var(--text2); }
.hs-points { list-style: none; display: flex; flex-direction: column; gap: var(--space-2); margin-bottom: var(--space-2); }
.hs-points li { position: relative; padding-left: var(--space-4); font-size: 0.95rem; color: var(--text2); }
.hs-points li::before { content: ''; position: absolute; left: 2px; top: 0.62em; width: 5px; height: 5px; border-radius: 50%; background: color-mix(in srgb, var(--text) 35%, transparent); }
.hs-shot { align-self: end; padding-left: var(--space-2); animation: hsUp 0.4s cubic-bezier(0.22, 1, 0.36, 1) both; }
@keyframes hsIn { from { opacity: 0; transform: translateY(6px); } }
@keyframes hsUp { from { opacity: 0; transform: translateY(18px); } }

/* The preview window */
.sw {
  margin-right: -2px; height: 390px; overflow: hidden;
  background: var(--sw-bg); color: var(--text);
  border: 1px solid var(--border); border-bottom: none; border-right: none;
  border-radius: 16px 0 0 0; box-shadow: var(--elev-3);
  font-family: var(--font-ui); font-size: 13.5px; line-height: 1.55;
}
.sw-bar { display: flex; align-items: center; gap: 6px; height: 40px; padding: 0 16px; border-bottom: 1px solid var(--sw-line); font-size: 12px; font-weight: 600; color: var(--text3); }
.sw-bar i { width: 10px; height: 10px; border-radius: 50%; background: var(--sw-line); border: 1px solid var(--border2); }
.sw-bar span { margin-left: 8px; }
.sw-body { display: flex; flex-direction: column; gap: 12px; padding: 20px 22px; }
.sw-ask { align-self: flex-end; max-width: 75%; padding: 9px 13px; border-radius: 14px 14px 4px 14px; background: var(--accent-wash); border: 1px solid color-mix(in srgb, var(--accent) 25%, transparent); font-weight: 500; }
.sw-trace { font-size: 12px; color: var(--text3); }
.sw-p { margin: 0; color: var(--text); }
.sw-p b { font-weight: 700; }
.sw-p mark { background: color-mix(in srgb, #f2c94c 45%, transparent); color: inherit; padding: 0 3px; border-radius: 3px; }
.sw-dim { color: var(--text2); }
.sw-cite { display: inline-flex; align-items: center; gap: 4px; margin-left: 4px; padding: 1px 8px; vertical-align: 1px; border: 1px solid var(--sw-line); border-radius: 6px; background: var(--bg-sunken); font-family: var(--font-mono); font-size: 11px; color: var(--text2); white-space: nowrap; }
.sw-sources { display: flex; flex-direction: column; gap: 2px; padding: 12px 14px; border: 1px solid var(--sw-line); border-radius: 12px; background: var(--ds-soft); }
.sw-sources-n { font-weight: 700; }
.sw-sources-from { font-size: 12.5px; color: var(--text2); }
.sw-score { display: flex; align-items: center; gap: 16px; }
.sw-score div { display: flex; flex-direction: column; }
.sw-score strong { font-size: 32px; font-weight: 800; letter-spacing: -0.03em; line-height: 1.05; }
.sw-score small { font-size: 16px; font-weight: 600; color: var(--text3); }
.sw-score span { font-size: 13px; font-weight: 600; color: var(--success-text); }
.sw-bars { display: flex; flex-direction: column; gap: 8px; margin: 4px 0; }
.sw-bars div { display: grid; grid-template-columns: 76px 1fr; align-items: center; gap: 10px; }
.sw-bars em { font-style: normal; font-size: 12.5px; color: var(--text3); }
.sw-bars i { display: block; height: 7px; border-radius: 4px; background: var(--accent); }
.sw-fb { display: flex; align-items: center; gap: 8px; }
.sw-fb.ok { color: var(--success-text); }
.sw-fb.add { color: var(--warning-text); }
.sw-crumb { font-size: 12px; color: var(--text3); }
.sw-h { font-weight: 800; font-size: 20px; letter-spacing: -0.02em; line-height: 1.25; margin-top: -4px; }
.sw-terms { display: flex; flex-wrap: wrap; gap: 6px; }
.sw-terms span { padding: 3px 10px; border-radius: 999px; border: 1px solid var(--sw-line); background: var(--bg-sunken); font-size: 12px; color: var(--text2); }
.sw-filters { display: flex; gap: 6px; }
.sw-filters span { padding: 4px 12px; border-radius: 999px; border: 1px solid var(--sw-line); font-size: 12px; color: var(--text2); }
.sw-filters span.on { background: var(--accent); border-color: var(--accent); color: var(--accent-on); font-weight: 600; }
.sw-pyq { display: flex; flex-direction: column; gap: 3px; padding: 12px 14px; border: 1px solid var(--sw-line); border-radius: 12px; }
.sw-pyq-meta { font-size: 12px; color: var(--text3); }
.sw-pyq-meta b { color: var(--accent-text); }
.sw-pyq-q { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.sw-progress { display: flex; justify-content: space-between; align-items: center; font-size: 12px; color: var(--text3); }
.sw-streak { padding: 2px 10px; border-radius: 999px; background: var(--warning-wash); color: var(--warning-text); font-weight: 700; }
.sw-track { height: 6px; border-radius: 3px; background: var(--sw-track); overflow: hidden; margin-top: -4px; }
.sw-track i { display: block; height: 100%; border-radius: 3px; background: var(--accent); }
.sw-q { font-size: 18px; margin-top: 2px; }
.sw-opt { display: flex; align-items: center; gap: 10px; padding: 10px 14px; border: 1px solid var(--sw-line); border-radius: 12px; }
.sw-opt i { width: 16px; height: 16px; flex-shrink: 0; border-radius: 50%; border: 1.5px solid var(--border3); display: inline-flex; align-items: center; justify-content: center; }
.sw-opt.right { border-color: color-mix(in srgb, var(--success-text) 50%, transparent); background: var(--success-wash); color: var(--success-text); font-weight: 600; }
.sw-opt.right i { background: var(--success-text); border-color: var(--success-text); color: var(--sw-bg); }
.sw-explain { font-size: 12.5px; color: var(--text2); }
.sw-compose { display: flex; align-items: center; justify-content: space-between; margin-top: 2px; padding: 8px 8px 8px 14px; border: 1.5px solid var(--border2); border-radius: 14px; color: var(--text3); }
.sw-compose i { width: 28px; height: 28px; display: inline-flex; align-items: center; justify-content: center; border-radius: 9px; border: 1px solid var(--border2); font-style: normal; font-size: 13px; }
.sw-sub { font-weight: 700; font-size: 14px; margin-top: 2px; }
.sw-list { margin: -4px 0 0; padding-left: 18px; display: flex; flex-direction: column; gap: 4px; color: var(--text); }
.sw-list b { font-weight: 700; }


/* History-only previews */
.sw-card { display: flex; flex-direction: column; justify-content: center; gap: 10px; min-height: 150px; padding: 18px; border: 1px solid var(--sw-line); border-radius: 14px; background: var(--ds-soft); }
.sw-card small { font-size: 12px; color: var(--text3); }
.sw-card b { font-size: 17px; font-weight: 800; letter-spacing: -0.015em; line-height: 1.35; }
.sw-card.back { background: var(--accent-wash); border-color: color-mix(in srgb, var(--accent) 25%, transparent); }
.sw-rate { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.sw-rate span { padding: 8px; border-radius: 10px; border: 1px solid var(--sw-line); text-align: center; font-size: 12.5px; font-weight: 600; color: var(--text2); }
.sw-rate span.on { background: var(--success-wash); color: var(--success-text); border-color: transparent; }
.sw-sheet { padding: 14px 16px; border: 1px solid var(--sw-line); border-radius: 12px; background: var(--ds-soft); }
.sw-sheet-q { font-size: 12.5px; color: var(--text3); }
.sw-hand { margin-top: 8px; font-family: 'Segoe Print', 'Bradley Hand', 'Comic Sans MS', cursive; font-size: 14px; line-height: 1.7; color: var(--text); }
.sw-hand u { text-decoration-color: color-mix(in srgb, var(--accent) 60%, transparent); text-decoration-thickness: 2px; }
.sw-note { display: flex; align-items: center; gap: 8px; font-size: 12.5px; color: var(--success-text); }

@media (max-width: 960px) {
  .hs-panel { grid-template-columns: 1fr; gap: var(--space-6); min-height: 0; padding: var(--space-8) 0 0 var(--space-6); }
  .hs-copy { padding: 0 var(--space-6) 0 0; }
  .sw { height: 360px; }
}
@media (max-width: 640px) {
  .hs-tabs { width: auto; margin-left: calc(-1 * var(--space-4)); margin-right: calc(-1 * var(--space-4)); border-radius: 0; border-left: none; border-right: none; background: none; border: none; padding: 0 var(--space-4); }
  .hs-tab { background: var(--ds-soft); border: 1px solid var(--border); }
  .hs-tab.on { background: var(--text); color: var(--bg); border-color: var(--text); box-shadow: none; }
  .hs-tab.on::after { background: var(--bg); left: 14px; right: 14px; }
  .hs-panel { border-radius: 22px; padding: var(--space-6) 0 0 var(--space-5); }
  .hs-copy { padding-right: var(--space-5); gap: var(--space-3); }
  .hs-copy .ds-btn { width: calc(100% - 0px); }
  .sw { height: 320px; font-size: 13px; }
  .sw-body { padding: 16px 16px; gap: 10px; }
}
@media (prefers-reduced-motion: reduce) { .hs-copy, .hs-shot { animation: none; } }
`;
