import type { Metadata } from "next";
import LegalDoc from "@/components/LegalDoc";
import { SUPPORT_EMAIL, SUPPORT_MAILTO } from "@/lib/contact";

export const metadata: Metadata = {
  title: { absolute: "Refund Policy: History Optional" },
  description: "Refund Policy for historyoptional.xyz premium subscriptions.",
  alternates: { canonical: "https://historyoptional.xyz/refund" },
};

export default function RefundPage() {
  return (
    <LegalDoc
      current="refund"
      title="Refund Policy"
      titleHi="रिफ़ंड नीति"
      updated="Last updated: 8 November 2026 · Effective: 8 November 2026"
      updatedHi="अंतिम अद्यतन: 8 नवंबर 2026 · प्रभावी: 8 नवंबर 2026"
      hi={<RefundHi />}
    >
      <p>
        This Refund Policy applies to all premium subscription purchases made on{" "}
        <strong>historyoptional.xyz</strong>.
      </p>

      <h2>1. No-Refund Policy</h2>
      <p>
        All purchases are <strong>final and non-refundable</strong>. Once a payment is
        processed via Razorpay, we do not offer refunds, partial refunds, or credits,
        regardless of usage.
      </p>
      <p>
        We strongly recommend using the <strong>free plan</strong> to evaluate the platform
        before subscribing. The free plan includes access to Notes (Paper I &amp; II),
        PYQ bank, Timeline &amp; Historiography, 3 AI chat messages, and 1 answer evaluation.
      </p>

      <h2>2. Subscription Plans</h2>

      <ul>
        <li><strong>Daily:</strong> ₹49 (1 day access)</li>
        <li><strong>Half-Yearly:</strong> ₹1,999 (6 months access)</li>
        <li><strong>Annual:</strong> ₹2,999 (1 year access)</li>
      </ul>
      <p>
        These are single payments. Nothing renews and nothing further is charged, so
        there is nothing to cancel.
      </p>


      <h2>3. Exceptions</h2>
      <p>
        We will consider refund or credit requests only in the following circumstances:
      </p>
      <ul>
        <li>
          <strong>Duplicate payment:</strong> if you were charged more than once for the
          same plan due to a technical error
        </li>
        <li>
          <strong>Extended service outage:</strong> if premium features were inaccessible
          for more than 5 consecutive days due to our platform failure
        </li>
      </ul>
      <p>
        Exception requests must be raised within <strong>7 days</strong> of the payment date
        by contacting us at the address below. We will respond within 5 business days.
      </p>

      <h2>4. Payment Disputes</h2>
      <p>
        If you believe an unauthorised charge has been made, please contact us before
        raising a dispute with your bank or card issuer. We will resolve legitimate issues
        promptly.
      </p>

      <h2>5. Contact</h2>
      <p>
        For refund-related queries, reach us at:<br />
        <strong>History Optional Team</strong><br />
        Email: <a href={SUPPORT_MAILTO}>{SUPPORT_EMAIL}</a><br />
        Response time: within 5 business days
      </p>
    </LegalDoc>
  );
}

/** The Hindi translation, shown in Hindi mode under a note that the English prevails. */
function RefundHi() {
  return (
    <>
      <p>
        यह रिफ़ंड नीति <strong>historyoptional.xyz</strong> पर की गई सभी प्रीमियम सदस्यता ख़रीदों
        पर लागू होती है।
      </p>

      <h2>1. रिफ़ंड न देने की नीति</h2>
      <p>
        सभी ख़रीद <strong>अंतिम और अप्रतिदेय (नॉन-रिफ़ंडेबल)</strong> हैं। Razorpay के माध्यम से
        भुगतान संसाधित हो जाने के बाद, उपयोग चाहे जितना भी हुआ हो, हम रिफ़ंड, आंशिक रिफ़ंड या
        क्रेडिट नहीं देते।
      </p>
      <p>
        हम दृढ़ता से अनुशंसा करते हैं कि सदस्यता लेने से पहले प्लेटफ़ॉर्म को परखने के लिए{" "}
        <strong>निःशुल्क प्लान</strong> का उपयोग करें। निःशुल्क प्लान में नोट्स (प्रश्नपत्र I और II),
        PYQ बैंक, समयरेखा और इतिहास-लेखन, 3 AI चैट संदेश और 1 उत्तर मूल्यांकन शामिल हैं।
      </p>

      <h2>2. सदस्यता प्लान</h2>

      <ul>
        <li><strong>दैनिक:</strong> ₹49 (1 दिन की पहुँच)</li>
        <li><strong>अर्धवार्षिक:</strong> ₹1,999 (6 महीने की पहुँच)</li>
        <li><strong>वार्षिक:</strong> ₹2,999 (1 वर्ष की पहुँच)</li>
      </ul>
      <p>
        ये एकल भुगतान हैं। कुछ भी नवीनीकृत नहीं होता और आगे कोई शुल्क नहीं लिया जाता, इसलिए
        रद्द करने के लिए कुछ भी नहीं है।
      </p>


      <h2>3. अपवाद</h2>
      <p>
        हम केवल निम्नलिखित परिस्थितियों में रिफ़ंड या क्रेडिट के अनुरोधों पर विचार करेंगे:
      </p>
      <ul>
        <li>
          <strong>दोहरा भुगतान:</strong> यदि किसी तकनीकी त्रुटि के कारण एक ही प्लान के लिए
          आपसे एक से अधिक बार शुल्क लिया गया हो
        </li>
        <li>
          <strong>लंबी सेवा बाधा:</strong> यदि हमारे प्लेटफ़ॉर्म की विफलता के कारण प्रीमियम
          सुविधाएँ लगातार 5 से अधिक दिनों तक उपलब्ध न रही हों
        </li>
      </ul>
      <p>
        अपवाद संबंधी अनुरोध भुगतान की तिथि से <strong>7 दिनों</strong> के भीतर नीचे दिए गए पते
        पर हमसे संपर्क करके किए जाने चाहिए। हम 5 कार्य दिवसों के भीतर उत्तर देंगे।
      </p>

      <h2>4. भुगतान विवाद</h2>
      <p>
        यदि आपको लगता है कि आपसे कोई अनधिकृत शुल्क लिया गया है, तो कृपया अपने बैंक या कार्ड
        जारीकर्ता के पास विवाद दर्ज करने से पहले हमसे संपर्क करें। हम वास्तविक समस्याओं का
        शीघ्र समाधान करेंगे।
      </p>

      <h2>5. संपर्क</h2>
      <p>
        रिफ़ंड से संबंधित प्रश्नों के लिए हमसे यहाँ संपर्क करें:<br />
        <strong>History Optional टीम</strong><br />
        ईमेल: <a href={SUPPORT_MAILTO}>{SUPPORT_EMAIL}</a><br />
        उत्तर का समय: 5 कार्य दिवसों के भीतर
      </p>
    </>
  );
}
