import type { Metadata } from "next";
import LegalDoc from "@/components/LegalDoc";
import { SUPPORT_EMAIL, SUPPORT_MAILTO } from "@/lib/contact";

export const metadata: Metadata = {
  title: { absolute: "Privacy Policy: History Optional" },
  description: "Privacy Policy for historyoptional.xyz: how we collect, use, and protect your data.",
  alternates: { canonical: "https://historyoptional.xyz/privacy" },
};

export default function PrivacyPage() {
  return (
    <LegalDoc
      current="privacy"
      title="Privacy Policy"
      titleHi="गोपनीयता नीति"
      updated="Last updated: 8 November 2026 · Effective: 8 November 2026"
      updatedHi="अंतिम अद्यतन: 8 नवंबर 2026 · प्रभावी: 8 नवंबर 2026"
      hi={<PrivacyHi />}
    >
      <p>
        This Privacy Policy describes how History Optional (<strong>historyoptional.xyz</strong>,
        &ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;) collects, uses, and protects information when you use our website
        and services. By using the site you agree to this policy.
      </p>

      <h2>1. Information We Collect</h2>
      <h3>Information you provide</h3>
      <ul>
        <li>Email address and name (when you sign in via Google OAuth)</li>
        <li>Answer scripts and evaluation content you upload</li>
        <li>
          Name and phone number, asked for once so we can reach you about your
          account. Stored by us, never sold or shared for marketing.
        </li>
        <li>
          Payment information, processed by Razorpay. We never see or store your card,
          UPI or bank details.
        </li>
      </ul>
      <h3>Information collected automatically</h3>
      <ul>
        <li>Usage data: pages visited, features used, session duration</li>
        <li>Device and browser information</li>
      </ul>

      <h2>2. How We Use Your Information</h2>
      <ul>
        <li>To provide and improve our UPSC History Optional study platform</li>
        <li>To process payments and manage your subscription</li>
        <li>To deliver AI-powered answer evaluation and chat features</li>
        <li>To send important service notifications (no marketing without consent)</li>
      </ul>

      <h2>3. Data Storage</h2>
      <p>
        Your data is stored securely. We retain your account data
        for as long as your account is active. You may request deletion at any time by contacting
        us at the address below.
      </p>

      <h2>4. Sharing of Information</h2>
      <p>We do not sell your personal data. We share data only with:</p>
      <ul>
        <li><strong>Razorpay</strong>, for payment processing</li>
        <li><strong>Google</strong>, for OAuth sign-in</li>
        <li>Law enforcement, if required by applicable Indian law</li>
      </ul>

      <h2>5. Your Rights (India DPDP Act 2023)</h2>
      <p>Under the Digital Personal Data Protection Act 2023, you have the right to:</p>
      <ul>
        <li>Access the personal data we hold about you</li>
        <li>Correct inaccurate personal data</li>
        <li>Request erasure of your personal data</li>
        <li>Withdraw consent at any time</li>
        <li>Nominate a person to exercise your rights in case of death or incapacity</li>
      </ul>
      <p>To exercise these rights, contact us at the address in Section 7.</p>

      <h2>6. Children&rsquo;s Privacy</h2>
      <p>
        Our services are intended for users aged 18 and above. We do not knowingly collect
        data from minors.
      </p>

      <h2>7. Contact</h2>
      <p>
        For privacy-related queries or to exercise your data rights, contact us at:<br />
        <strong>History Optional Team</strong><br />
        Email: <a href={SUPPORT_MAILTO}>{SUPPORT_EMAIL}</a>
      </p>

      <h2>8. Changes to This Policy</h2>
      <p>
        We may update this policy from time to time. Continued use of the site after changes
        constitutes acceptance of the revised policy.
      </p>
    </LegalDoc>
  );
}

/** The Hindi translation, shown in Hindi mode under a note that the English prevails. */
function PrivacyHi() {
  return (
    <>
      <p>
        यह गोपनीयता नीति बताती है कि History Optional (<strong>historyoptional.xyz</strong>,
        &ldquo;हम&rdquo;, &ldquo;हमें&rdquo; या &ldquo;हमारा&rdquo;) आपके द्वारा हमारी वेबसाइट और सेवाओं का उपयोग
        किए जाने पर जानकारी किस प्रकार एकत्र करता है, उसका उपयोग करता है और उसकी सुरक्षा करता है।
        साइट का उपयोग करके आप इस नीति से सहमति देते हैं।
      </p>

      <h2>1. हमारे द्वारा एकत्र की जाने वाली जानकारी</h2>
      <h3>आपके द्वारा दी जाने वाली जानकारी</h3>
      <ul>
        <li>ईमेल पता और नाम (जब आप Google OAuth के माध्यम से साइन इन करते हैं)</li>
        <li>आपके द्वारा अपलोड की गई उत्तर पुस्तिकाएँ और मूल्यांकन सामग्री</li>
        <li>
          नाम और फ़ोन नंबर, जो एक बार इसलिए माँगे जाते हैं ताकि हम आपके खाते के संबंध में
          आपसे संपर्क कर सकें। इन्हें हम संग्रहीत करते हैं, इन्हें कभी बेचा नहीं जाता और न ही
          विपणन के लिए साझा किया जाता है।
        </li>
        <li>
          भुगतान संबंधी जानकारी, जिसका प्रसंस्करण Razorpay करता है। हम आपके कार्ड, UPI या बैंक
          विवरण न तो कभी देखते हैं और न ही संग्रहीत करते हैं।
        </li>
      </ul>
      <h3>स्वतः एकत्र की जाने वाली जानकारी</h3>
      <ul>
        <li>उपयोग संबंधी डेटा: देखे गए पृष्ठ, उपयोग की गई सुविधाएँ, सत्र की अवधि</li>
        <li>डिवाइस और ब्राउज़र संबंधी जानकारी</li>
      </ul>

      <h2>2. हम आपकी जानकारी का उपयोग कैसे करते हैं</h2>
      <ul>
        <li>अपने UPSC इतिहास वैकल्पिक अध्ययन प्लेटफ़ॉर्म को उपलब्ध कराने और उसमें सुधार करने के लिए</li>
        <li>भुगतान संसाधित करने और आपकी सदस्यता का प्रबंधन करने के लिए</li>
        <li>AI-आधारित उत्तर मूल्यांकन और चैट सुविधाएँ प्रदान करने के लिए</li>
        <li>महत्वपूर्ण सेवा सूचनाएँ भेजने के लिए (आपकी सहमति के बिना कोई विपणन संदेश नहीं)</li>
      </ul>

      <h2>3. डेटा भंडारण</h2>
      <p>
        आपका डेटा सुरक्षित रूप से संग्रहीत किया जाता है। जब तक आपका खाता सक्रिय है, हम आपके
        खाते का डेटा बनाए रखते हैं। आप नीचे दिए गए पते पर हमसे संपर्क करके किसी भी समय विलोपन का अनुरोध कर सकते हैं।
      </p>

      <h2>4. जानकारी साझा करना</h2>
      <p>हम आपका व्यक्तिगत डेटा नहीं बेचते। हम डेटा केवल निम्नलिखित के साथ साझा करते हैं:</p>
      <ul>
        <li><strong>Razorpay</strong>, भुगतान प्रसंस्करण के लिए</li>
        <li><strong>Google</strong>, OAuth साइन-इन के लिए</li>
        <li>विधि प्रवर्तन एजेंसियाँ, यदि लागू भारतीय क़ानून के अंतर्गत ऐसा करना आवश्यक हो</li>
      </ul>

      <h2>5. आपके अधिकार (भारत का DPDP अधिनियम 2023)</h2>
      <p>डिजिटल व्यक्तिगत डेटा संरक्षण अधिनियम 2023 के अंतर्गत आपको निम्नलिखित अधिकार प्राप्त हैं:</p>
      <ul>
        <li>हमारे पास उपलब्ध आपके व्यक्तिगत डेटा तक पहुँच</li>
        <li>अशुद्ध व्यक्तिगत डेटा में सुधार</li>
        <li>अपने व्यक्तिगत डेटा को मिटाने का अनुरोध</li>
        <li>किसी भी समय अपनी सहमति वापस लेना</li>
        <li>मृत्यु या अक्षमता की स्थिति में अपने अधिकारों का प्रयोग करने के लिए किसी व्यक्ति को नामित करना</li>
      </ul>
      <p>इन अधिकारों का प्रयोग करने के लिए खंड 7 में दिए गए पते पर हमसे संपर्क करें।</p>

      <h2>6. बच्चों की गोपनीयता</h2>
      <p>
        हमारी सेवाएँ 18 वर्ष और उससे अधिक आयु के उपयोगकर्ताओं के लिए हैं। हम जानबूझकर
        नाबालिगों का डेटा एकत्र नहीं करते।
      </p>

      <h2>7. संपर्क</h2>
      <p>
        गोपनीयता से संबंधित प्रश्नों के लिए या अपने डेटा अधिकारों का प्रयोग करने के लिए हमसे यहाँ संपर्क करें:<br />
        <strong>History Optional टीम</strong><br />
        ईमेल: <a href={SUPPORT_MAILTO}>{SUPPORT_EMAIL}</a>
      </p>

      <h2>8. इस नीति में परिवर्तन</h2>
      <p>
        हम समय-समय पर इस नीति को अद्यतन कर सकते हैं। परिवर्तनों के बाद साइट का निरंतर उपयोग
        संशोधित नीति की स्वीकृति माना जाएगा।
      </p>
    </>
  );
}
