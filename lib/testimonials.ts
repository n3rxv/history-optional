/**
 * What readers have written about the site, shown on the home page.
 *
 * The words are theirs, as they sent them: only spacing and plain typos are
 * fixed. They stay in English in Hindi mode too, since a translation would
 * put words in their mouths; only the line under the name and the tag are
 * translated. The title is cut from their own text, word for word. Add one
 * only with the writer's permission to show it.
 */
export type Testimonial = {
  name: string;
  /** The line under the name. */
  role?: string;
  roleHi?: string;
  /** A short fact from their own text, shown as a chip on the card. */
  tag?: string;
  tagHi?: string;
  /** A line from the text, shown large at the top of the card. */
  title: string;
  /** One string per paragraph. */
  text: string[];
  /** Three colour tokens for the card's border, glow, title and avatar. */
  colors: [string, string, string];
};

export const TESTIMONIALS: Testimonial[] = [
  {
    name: 'Aditya Kumar',
    role: 'Assistant Professor, Department of History, Government of Bihar',
    roleHi: 'सहायक प्राध्यापक, इतिहास विभाग, बिहार सरकार',
    tag: '4th attempt · CSE 2027',
    tagHi: 'चौथा प्रयास · CSE 2027',
    title: 'An indispensable partner in my pursuit.',
    text: [
      'A 4th attempt carries both the weight of past setbacks and the quiet determination to leave no stone unturned. Preparing for UPSC CSE 2027 with History Optional demanded a shift from mere reading to precision writing, and HistoryOptional.xyz has provided exactly that clarity.',
      'From studying toppers’ handwritten copies to relying on their sharp, high-yield notes and standard book insights, every resource feels purposeful. The lightning-fast, detailed copy evaluations and the 24/7 AI doubt-resolution feature have restored my confidence and sharpened my analytical presentation. When you balance teaching with your own aspirations, having a platform that values your time and pushes your preparation forward is invaluable. It’s more than a study portal. It is an indispensable partner in my pursuit.',
    ],
    colors: ['var(--accent-text)', 'var(--tint-modern)', 'var(--tint-medieval)'],
  },
  {
    name: 'Isha Jain',
    role: 'Aspirant',
    roleHi: 'अभ्यर्थी',
    tag: '1st attempt',
    tagHi: 'पहला प्रयास',
    title: 'It has become such a dependable resource.',
    text: [
      'Ur website has genuinely made my History Optional preparation so much easier. I just specially came to write this review. It has reduced the burden of constantly wandering from one source to another. I find myself using it almost every day for my preparation and it has become such a dependable resource. Really appreciate the effort you have put into creating something so useful for aspirants, thanks a lot for making our journey a little easier!!!',
      'It’s a one-stop solution for PYQs, topper copies, books of various authors and much more. I mean, it’s commendable to have such a go-to website for History Optional preparation with such high-quality content. Totally recommended to all!',
    ],
    colors: ['var(--tint-medieval)', 'var(--tint-ancient)', 'var(--tint-world)'],
  },
];
