export const t = {
  // Navbar
  notes: { en: 'Notes', hi: 'नोट्स' },
  pyqs: { en: 'PYQs', hi: 'पिछले प्रश्न' },
  prelims: { en: 'Prelims', hi: 'प्रारंभिक' },
  evaluate: { en: 'Evaluate', hi: 'मूल्यांकन' },
  chat: { en: 'Chat', hi: 'चैट' },
  resources: { en: 'Resources', hi: 'संसाधन' },
  mapping: { en: 'Mapping', hi: 'मानचित्र' },
  flashcards: { en: 'Flashcards', hi: 'फ्लैशकार्ड' },
  subscribe: { en: 'Subscribe', hi: 'सदस्यता लें' },
  login: { en: 'Login', hi: 'लॉगिन' },
  logout: { en: 'Logout', hi: 'लॉगआउट' },
  dashboard: { en: 'Dashboard', hi: 'डैशबोर्ड' },
  // Evaluate page
  uploadAnswer: { en: 'Upload Answer Sheet', hi: 'उत्तर पत्रक अपलोड करें' },
  evaluate_btn: { en: 'Evaluate', hi: 'मूल्यांकन करें' },
  score: { en: 'Score', hi: 'अंक' },
  feedback: { en: 'Feedback', hi: 'प्रतिक्रिया' },
  strengths: { en: 'Strengths', hi: 'मजबूत पक्ष' },
  improvements: { en: 'Areas to Improve', hi: 'सुधार के क्षेत्र' },
  modelAnswer: { en: 'Model Answer', hi: 'आदर्श उत्तर' },
  // Chat
  askQuestion: { en: 'Ask a question...', hi: 'प्रश्न पूछें...' },
  send: { en: 'Send', hi: 'भेजें' },
  thinking: { en: 'Thinking...', hi: 'सोच रहा हूँ...' },
  // Prelims
  submit: { en: 'Submit', hi: 'जमा करें' },
  next: { en: 'Next', hi: 'अगला' },
  previous: { en: 'Previous', hi: 'पिछला' },
  explanation: { en: 'Explanation', hi: 'स्पष्टीकरण' },
  correct: { en: 'Correct', hi: 'सही' },
  incorrect: { en: 'Incorrect', hi: 'गलत' },
  // Notes
  englishNotes: { en: 'English Notes', hi: 'English Notes' },
  hindiNotes: { en: 'Hindi Notes', hi: 'Hindi Notes' },
  // General
  loading: { en: 'Loading...', hi: 'लोड हो रहा है...' },
  error: { en: 'Something went wrong', hi: 'कुछ गलत हुआ' },
  premium: { en: 'Premium Feature', hi: 'प्रीमियम सुविधा' },
  upgrade: { en: 'Upgrade to Premium', hi: 'प्रीमियम में अपग्रेड करें' },
} as const;

export type TKey = keyof typeof t;

/** Usage: tr(t.notes, langHi) → 'नोट्स' or 'Notes' */
export function tr(entry: { en: string; hi: string }, langHi: boolean) {
  return langHi ? entry.hi : entry.en;
}
