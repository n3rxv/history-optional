import type { Metadata } from "next";
import LegalDoc from "@/components/LegalDoc";
import { SUPPORT_EMAIL, SUPPORT_MAILTO } from "@/lib/contact";

export const metadata: Metadata = {
  title: { absolute: "Terms of Service: History Optional" },
  description: "Terms of Service for historyoptional.xyz: the rules for using our UPSC History Optional platform.",
  alternates: { canonical: "https://historyoptional.xyz/terms" },
};

export default function TermsPage() {
  return (
    <LegalDoc
      current="terms"
      title="Terms of Service"
      titleHi="सेवा की शर्तें"
      updated="Last updated: 12 November 2026 · Effective: 12 November 2026"
      updatedHi="अंतिम अद्यतन: 12 नवंबर 2026 · प्रभावी: 12 नवंबर 2026"
      hi={<TermsHi />}
    >
      <p>
        These Terms of Service govern your use of <strong>historyoptional.xyz</strong> operated
        by the History Optional Team. By accessing or using the site you agree to be bound by
        these terms.
      </p>

      <h2>1. Services</h2>
      <p>
        History Optional provides UPSC History Optional exam preparation resources including
        structured notes, previous year questions (PYQs), AI-powered answer evaluation,
        historiography content, timeline tools, and a premium subscription plan.
      </p>

      <h2>2. Eligibility</h2>
      <p>
        You must be at least 18 years old to use this service. By using the site you represent
        that you meet this requirement.
      </p>

      <h2>3. Account</h2>
      <ul>
        <li>You sign in using Google OAuth. You are responsible for keeping your account secure.</li>
        <li>You must not share your account credentials or allow others to access your subscription.</li>
        <li>We reserve the right to suspend accounts that violate these terms.</li>
      </ul>

      <h2>4. Subscription &amp; Payments</h2>
      <p>
        Every plan we sell is a one-time payment. Nothing renews on its own.
      </p>

      <ul>
        <li>Daily: ₹49 (1 day access)</li>
        <li>Half-Yearly: ₹1,999 (6 months access)</li>
        <li>Annual: ₹2,999 (1 year access)</li>
      </ul>
      <p>
        These are <strong>single payments</strong>. They do not renew, nothing is stored
        to charge you again, and access simply ends on the expiry date unless you choose
        to buy again. Buying again while a plan is still running adds the new period to
        the end of the current one.
      </p>
      <p>
        All payments are processed securely by Razorpay. Prices are in Indian Rupees (INR)
        and inclusive of applicable taxes. We reserve the right to change pricing with
        reasonable prior notice.
      </p>

      <h2>5. Invites</h2>
      <p>
        Every signed-in reader gets an invite link. When someone signs up through it and buys their
        first yearly plan, they pay ₹100 less and the reader who invited them gets ₹100 in an invite
        balance. Only a friend&rsquo;s first yearly plan counts, and each friend counts once.
      </p>
      <ul>
        <li>
          Before you have bought a yearly plan, your balance can grow up to the yearly plan&rsquo;s list
          price and can only be used as money off your own yearly plan.
        </li>
        <li>
          Each yearly plan you buy lets you earn up to what that payment brought us after Razorpay&rsquo;s
          fee and the GST on it. A yearly plan paid wholly from your balance brought nothing in, so
          invites earn again from your next paid yearly plan.
        </li>
        <li>
          Once you have a yearly plan, you can cash out your whole balance to a UPI id each time your
          earnings on that plan reach ₹1,000, ₹2,000 and your limit. We send cash-outs by hand to the
          UPI id you give, so check it carefully. Money sent to a UPI id you entered wrongly cannot be
          recovered by us.
        </li>
        <li>
          Your balance cannot be transferred and has no cash value except through these cash-outs. It
          stays for as long as we run invites. If we end them, we will say here what happens to
          balances.
        </li>
      </ul>

      <h2>6. Refund Policy</h2>
      <p>
        All purchases are final. We do not offer refunds, exchanges, or credits for any
        plan once payment has been processed. Please review the features available
        on the free plan before buying.
      </p>
      <p>
        In the event of a demonstrable technical failure on our part that prevents access
        to premium features for an extended period, we will evaluate refund or credit
        requests on a case-by-case basis. Contact us within 7 days of the issue.
      </p>

      <h2>7. Intellectual Property</h2>
      <p>
        All content on this site, including notes, question banks, AI-generated evaluations
        and design, is owned by historyoptional.xyz or its licensors. You may not copy,
        redistribute, or sell any content without written permission.
      </p>

      <h2>8. Acceptable Use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>Scrape, crawl, or systematically download site content</li>
        <li>Share premium content outside your personal use</li>
        <li>Use the platform for any unlawful purpose</li>
        <li>Attempt to reverse-engineer or interfere with the platform</li>
      </ul>

      <h2>9. AI Features</h2>
      <p>
        AI-powered answer evaluation and chat features are provided as study aids only.
        They do not constitute professional coaching advice. Accuracy of AI responses
        may vary, so always cross-reference with official UPSC sources.
      </p>

      <h2>10. Limitation of Liability</h2>
      <p>
        To the maximum extent permitted by law, historyoptional.xyz shall not be liable for
        any indirect, incidental, or consequential damages arising from your use of the
        platform. Our total liability shall not exceed the amount you paid in the 30 days
        preceding the claim.
      </p>

      <h2>11. Governing Law</h2>
      <p>
        These terms are governed by the laws of India. Any disputes shall be subject to
        the exclusive jurisdiction of courts in India.
      </p>

      <h2>12. Contact</h2>
      <p>
        Questions about these terms? Contact us at:<br />
        <strong>History Optional Team</strong><br />
        Email: <a href={SUPPORT_MAILTO}>{SUPPORT_EMAIL}</a>
      </p>
    </LegalDoc>
  );
}

/** The Hindi translation, shown in Hindi mode under a note that the English prevails. */
function TermsHi() {
  return (
    <>
      <p>
        सेवा की ये शर्तें History Optional टीम द्वारा संचालित <strong>historyoptional.xyz</strong> के
        आपके उपयोग को नियंत्रित करती हैं। साइट तक पहुँचकर या उसका उपयोग करके आप इन शर्तों से
        बाध्य होने के लिए सहमत होते हैं।
      </p>

      <h2>1. सेवाएँ</h2>
      <p>
        History Optional UPSC इतिहास वैकल्पिक परीक्षा की तैयारी के संसाधन प्रदान करता है, जिनमें
        संरचित नोट्स, पिछले वर्षों के प्रश्न (PYQ), AI-आधारित उत्तर मूल्यांकन, इतिहास-लेखन से
        संबंधित सामग्री, समयरेखा उपकरण और एक प्रीमियम सदस्यता प्लान शामिल हैं।
      </p>

      <h2>2. पात्रता</h2>
      <p>
        इस सेवा का उपयोग करने के लिए आपकी आयु कम से कम 18 वर्ष होनी चाहिए। साइट का उपयोग करके
        आप यह घोषित करते हैं कि आप इस अपेक्षा को पूरा करते हैं।
      </p>

      <h2>3. खाता</h2>
      <ul>
        <li>आप Google OAuth के माध्यम से साइन इन करते हैं। अपने खाते को सुरक्षित रखने का उत्तरदायित्व आपका है।</li>
        <li>आप अपने खाते के लॉगिन विवरण किसी के साथ साझा नहीं करेंगे और न ही किसी अन्य व्यक्ति को अपनी सदस्यता तक पहुँच देंगे।</li>
        <li>इन शर्तों का उल्लंघन करने वाले खातों को निलंबित करने का अधिकार हम सुरक्षित रखते हैं।</li>
      </ul>

      <h2>4. सदस्यता और भुगतान</h2>
      <p>
        हमारे द्वारा बेचा जाने वाला प्रत्येक प्लान एकमुश्त भुगतान है। कोई भी प्लान अपने आप
        नवीनीकृत नहीं होता।
      </p>

      <ul>
        <li>दैनिक: ₹49 (1 दिन की पहुँच)</li>
        <li>अर्धवार्षिक: ₹1,999 (6 महीने की पहुँच)</li>
        <li>वार्षिक: ₹2,999 (1 वर्ष की पहुँच)</li>
      </ul>
      <p>
        ये <strong>एकल भुगतान</strong> हैं। ये नवीनीकृत नहीं होते, आपसे दोबारा शुल्क लेने के लिए
        कुछ भी संग्रहीत नहीं किया जाता, और जब तक आप फिर से ख़रीदना न चुनें, पहुँच समाप्ति तिथि
        पर स्वतः समाप्त हो जाती है। किसी प्लान के चालू रहते हुए फिर से ख़रीदने पर नई अवधि
        वर्तमान अवधि के अंत में जोड़ दी जाती है।
      </p>
      <p>
        सभी भुगतान Razorpay द्वारा सुरक्षित रूप से संसाधित किए जाते हैं। मूल्य भारतीय रुपये (INR)
        में हैं और इनमें लागू कर शामिल हैं। उचित पूर्व सूचना देकर मूल्य बदलने का अधिकार हम
        सुरक्षित रखते हैं।
      </p>

      <h2>5. आमंत्रण</h2>
      <p>
        हर साइन-इन किए गए पाठक को एक आमंत्रण लिंक मिलता है। जब कोई उस लिंक से साइन अप करके अपना
        पहला एक साल का प्लान ख़रीदता है, तो उसे ₹100 कम देने पड़ते हैं और बुलाने वाले पाठक के आमंत्रण
        बैलेंस में ₹100 जुड़ जाते हैं। केवल दोस्त का पहला एक साल का प्लान गिना जाता है, और हर दोस्त
        एक ही बार गिना जाता है।
      </p>
      <ul>
        <li>
          एक साल का प्लान ख़रीदने से पहले आपका बैलेंस एक साल के प्लान की सूची क़ीमत तक बढ़ सकता है और
          केवल आपके अपने एक साल के प्लान पर छूट के रूप में इस्तेमाल हो सकता है।
        </li>
        <li>
          आपके हर एक साल के प्लान से आप उतना कमा सकते हैं जितना वह भुगतान Razorpay का शुल्क और उस पर
          GST कटने के बाद हमें लाया। जो एक साल का प्लान पूरी तरह आपके बैलेंस से चुकाया गया, उससे कुछ
          नहीं आया, इसलिए आमंत्रणों से कमाई आपके अगले चुकाए गए एक साल के प्लान से फिर शुरू होती है।
        </li>
        <li>
          एक साल का प्लान लेने के बाद, उस प्लान पर आपकी कमाई जब भी ₹1,000, ₹2,000 और आपकी सीमा तक
          पहुँचे, आप अपना पूरा बैलेंस किसी UPI आईडी पर निकाल सकते हैं। हम पैसे आपकी दी गई UPI आईडी
          पर हाथ से भेजते हैं, इसलिए उसे ध्यान से जाँचें। आपके द्वारा ग़लत डाली गई UPI आईडी पर भेजे
          गए पैसे हम वापस नहीं ला सकते।
        </li>
        <li>
          आपका बैलेंस किसी और को नहीं दिया जा सकता और इन निकासियों के अलावा इसका कोई नक़द मूल्य नहीं
          है। जब तक हम आमंत्रण चला रहे हैं, यह बना रहता है। अगर हम इन्हें बंद करते हैं, तो यहाँ
          बताएँगे कि बैलेंस का क्या होगा।
        </li>
      </ul>

      <h2>6. रिफ़ंड नीति</h2>
      <p>
        सभी ख़रीद अंतिम हैं। भुगतान संसाधित हो जाने के बाद हम किसी भी प्लान के लिए रिफ़ंड, विनिमय
        या क्रेडिट नहीं देते। कृपया ख़रीदने से पहले निःशुल्क प्लान में उपलब्ध सुविधाओं की समीक्षा करें।
      </p>
      <p>
        हमारी ओर से किसी ऐसी प्रमाणित की जा सकने वाली तकनीकी विफलता की स्थिति में, जिसके कारण
        लंबी अवधि तक प्रीमियम सुविधाओं तक पहुँच बाधित रहे, हम रिफ़ंड या क्रेडिट के अनुरोधों का
        मूल्यांकन प्रत्येक मामले के आधार पर अलग से करेंगे। समस्या होने के 7 दिनों के भीतर हमसे
        संपर्क करें।
      </p>

      <h2>7. बौद्धिक संपदा</h2>
      <p>
        इस साइट की सभी सामग्री, जिसमें नोट्स, प्रश्न बैंक, AI द्वारा तैयार किए गए मूल्यांकन और
        डिज़ाइन शामिल हैं, historyoptional.xyz या उसके लाइसेंसदाताओं के स्वामित्व में है। लिखित
        अनुमति के बिना आप किसी भी सामग्री की प्रतिलिपि, पुनर्वितरण या बिक्री नहीं कर सकते।
      </p>

      <h2>8. स्वीकार्य उपयोग</h2>
      <p>आप सहमत होते हैं कि आप निम्नलिखित कार्य नहीं करेंगे:</p>
      <ul>
        <li>साइट की सामग्री को स्क्रेप करना, क्रॉल करना या व्यवस्थित रूप से डाउनलोड करना</li>
        <li>प्रीमियम सामग्री को अपने व्यक्तिगत उपयोग के बाहर साझा करना</li>
        <li>किसी भी विधिविरुद्ध प्रयोजन के लिए प्लेटफ़ॉर्म का उपयोग करना</li>
        <li>प्लेटफ़ॉर्म की रिवर्स-इंजीनियरिंग करने या उसके संचालन में हस्तक्षेप करने का प्रयास करना</li>
      </ul>

      <h2>9. AI सुविधाएँ</h2>
      <p>
        AI-आधारित उत्तर मूल्यांकन और चैट सुविधाएँ केवल अध्ययन सहायता के रूप में प्रदान की जाती
        हैं। ये पेशेवर कोचिंग परामर्श नहीं हैं। AI के उत्तरों की सटीकता भिन्न हो सकती है, इसलिए
        सदैव आधिकारिक UPSC स्रोतों से मिलान करें।
      </p>

      <h2>10. दायित्व की सीमा</h2>
      <p>
        क़ानून द्वारा अनुमत अधिकतम सीमा तक, historyoptional.xyz प्लेटफ़ॉर्म के आपके उपयोग से
        उत्पन्न किसी भी अप्रत्यक्ष, आनुषंगिक या परिणामी क्षति के लिए उत्तरदायी नहीं होगा। हमारा
        कुल दायित्व दावे से ठीक पहले के 30 दिनों में आपके द्वारा भुगतान की गई राशि से अधिक नहीं
        होगा।
      </p>

      <h2>11. शासी क़ानून</h2>
      <p>
        ये शर्तें भारत के क़ानूनों द्वारा शासित हैं। कोई भी विवाद भारत के न्यायालयों के अनन्य
        क्षेत्राधिकार के अधीन होगा।
      </p>

      <h2>12. संपर्क</h2>
      <p>
        इन शर्तों के बारे में कोई प्रश्न है? हमसे यहाँ संपर्क करें:<br />
        <strong>History Optional टीम</strong><br />
        ईमेल: <a href={SUPPORT_MAILTO}>{SUPPORT_EMAIL}</a>
      </p>
    </>
  );
}
