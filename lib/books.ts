/**
 * The books offered in "Chat with Books".
 *
 * This list was hardcoded twice inside app/chat/page.tsx — once for each of the
 * two pickers — so ingesting a book left it invisible: the corpus had it and
 * no reader could select it. That is exactly what happened to both JL Mehta
 * volumes, which were embedded and retrievable but absent from the menu.
 *
 * `value` MUST equal `book_chunks.book_title` exactly. lib/ragSearch filters on
 * it, so a mismatch silently returns nothing rather than failing.
 *
 * scripts/checkBookList.mts compares this against the database in both
 * directions; run it after adding a book.
 */

export type BookCategory = 'Ancient' | 'Medieval' | 'Modern' | 'World';

export type Book = {
  category: BookCategory;
  /** Must match book_chunks.book_title exactly. */
  value: string;
  /** What the reader sees; may be shorter than the stored title. */
  label: string;
};

export const BOOKS: Book[] = [
  { category: 'Ancient', value: 'Ajeet Jha — A History of Ancient India', label: 'Ajeet Jha — A History of Ancient India' },
  { category: 'Ancient', value: 'Upinder Singh - Ancient & Early Medieval India', label: 'Upinder Singh - Ancient & Early Medieval India' },
  { category: 'Ancient', value: 'RS Sharma — Ancient India (Old NCERT)', label: 'RS Sharma — Ancient India (Old NCERT)' },
  { category: 'Ancient', value: 'Romila Thapar — Early India', label: 'Romila Thapar — Early India' },
  { category: 'Ancient', value: 'Ranbir Chakravarti — Exploring Early India', label: 'Ranbir Chakravarti — Exploring Early India' },
  { category: 'Ancient', value: 'RC Majumdar — Ancient India', label: 'RC Majumdar — Ancient India' },
  { category: 'Ancient', value: 'DN Jha — Ancient India in Historical Outline', label: 'DN Jha — Ancient India in Historical Outline' },
  { category: 'Ancient', value: 'KA Nilakanta Sastri — A History of South India', label: 'KA Nilakanta Sastri — A History of South India' },
  { category: 'Ancient', value: 'AL Basham - The Wonder That Was India', label: 'AL Basham - The Wonder That Was India' },
  { category: 'Ancient', value: 'DD Kosambi — An Introduction to the Study of Indian History', label: 'DD Kosambi — An Introduction to the Study of Indian History' },
  { category: 'Medieval', value: 'Mughals IGNOU', label: 'Mughals IGNOU' },
  { category: 'Medieval', value: 'Delhi Sultanate IGNOU', label: 'Delhi Sultanate IGNOU' },
  { category: 'Medieval', value: 'Satish Chandra - Medieval India (800-1700)', label: 'Satish Chandra - Medieval India (800-1700)' },
  { category: 'Medieval', value: 'Satish Chandra - Medieval India Part 2 (1526-1748)', label: 'Satish Chandra - Medieval India Part 2 (1526-1748)' },
  { category: 'Medieval', value: 'Vipul Singh — Interpreting Medieval India', label: 'Vipul Singh — Interpreting Medieval India' },
  { category: 'Medieval', value: 'India in the Persianate Age', label: 'Richard Eaton — India in the Persianate Age' },
  { category: 'Medieval', value: 'The Rise of Islam and the Bengal Frontier', label: 'Richard Eaton — The Rise of Islam and the Bengal Frontier' },
  { category: 'Medieval', value: 'Irfan Habib — Agrarian System of Mughal India', label: 'Irfan Habib — Agrarian System of Mughal India' },
  { category: 'Medieval', value: 'JL Mehta — Advanced Study in the History of Medieval India, Vol. I', label: 'JL Mehta — Medieval India Vol. I (1000–1526)' },
  { category: 'Medieval', value: 'JL Mehta — Advanced Study in the History of Medieval India, Vol. III', label: 'JL Mehta — Medieval India Vol. III (Society & Culture)' },
  { category: 'Modern', value: 'Bipan Chandra - History of Modern India', label: 'Bipan Chandra - History of Modern India' },
  { category: 'Modern', value: "Bipan Chandra — India's Struggle for Independence", label: "Bipan Chandra — India's Struggle for Independence" },
  { category: 'Modern', value: 'Sekhar Bandopadhyay - Plassey to Partition', label: 'Sekhar Bandopadhyay - Plassey to Partition' },
  { category: 'Modern', value: 'Sumit Sarkar — Modern India (1885-1947)', label: 'Sumit Sarkar — Modern India (1885-1947)' },
  { category: 'Modern', value: 'BL Grover - Modern Indian History', label: 'BL Grover - Modern Indian History' },
  { category: 'Modern', value: 'Ranajit Guha — Elementary Aspects of Peasant Insurgency', label: 'Ranajit Guha — Elementary Aspects of Peasant Insurgency' },
  { category: 'World', value: 'Norman Lowe - Mastering Modern World History', label: 'Norman Lowe - Mastering Modern World History' },
  { category: 'World', value: 'Eric Hobsbawm - Age of Revolution', label: 'Eric Hobsbawm - Age of Revolution (1789-1848)' },
  { category: 'World', value: 'Eric Hobsbawm - Age of Capital', label: 'Eric Hobsbawm - Age of Capital (1848-1875)' },
  { category: 'World', value: 'Eric Hobsbawm - Age of Empire', label: 'Eric Hobsbawm - Age of Empire (1875-1914)' },
  { category: 'World', value: 'Eric Hobsbawm - Age of Extremes', label: 'Eric Hobsbawm - Age of Extremes (1914-1991)' },
  { category: 'World', value: 'David Thomson — Europe Since Napoleon', label: 'David Thomson — Europe Since Napoleon' },
];

export const BOOK_CATEGORIES: BookCategory[] = ['Ancient', 'Medieval', 'Modern', 'World'];

export const booksByCategory = (c: BookCategory) => BOOKS.filter(b => b.category === c);
