'use client’;
import { useState } from 'react’;

type Event = {
  year: number;
  yearLabel: string;
  title: string;
  description: string;
  category: string;
  paper: 1 | 2;
  section: string;
};

const events: Event[] = [
  { year: -2500, yearLabel: '2500 BCE’, title: 'Indus Valley Civilization (Mature Phase)', description: 'Peak phase of IVC — Mohenjo-daro and Harappa flourish with advanced town planning, drainage systems, and trade networks.', category: 'Ancient India’, paper: 1, section: 'Ancient India’ },
  { year: -1500, yearLabel: '1500 BCE’, title: 'Aryan Migration & Rig Veda’, description: 'Composition of the Rig Veda begins; Aryan migration into the Indian subcontinent; early Vedic age.', category: 'Ancient India’, paper: 1, section: 'Ancient India’ },
  { year: -1000, yearLabel: '1000 BCE’, title: 'Later Vedic Age Begins’, description: 'Expansion into Gangetic plains; emergence of varna system, iron tools, and later Vedic literature (Upanishads, Aranyakas).', category: 'Ancient India’, paper: 1, section: 'Ancient India’ },
  { year: -600, yearLabel: '600 BCE’, title: 'Rise of 16 Mahajanapadas’, description: '16 Mahajanapadas emerge; rise of urban centers, trade routes, punch-marked coins; republican and monarchical polities coexist.', category: 'Ancient India’, paper: 1, section: 'Ancient India’ },
  { year: -599, yearLabel: '599 BCE’, title: 'Birth of Mahavira’, description: 'Vardhamana Mahavira born in Vaishali; later becomes the 24th Tirthankara and systematiser of Jainism.', category: 'Ancient India’, paper: 1, section: 'Ancient India’ },
  { year: -563, yearLabel: '563 BCE’, title: 'Birth of Gautama Buddha’, description: 'Siddhartha Gautama born in Lumbini (Nepal); founder of Buddhism and one of the most influential thinkers in history.', category: 'Ancient India’, paper: 1, section: 'Ancient India’ },
  { year: -327, yearLabel: '327 BCE’, title: "Alexander’s Invasion of India", description: "Alexander the Great crosses the Indus; defeats Porus at Battle of Hydaspes (326 BCE); retreats due to army’s mutiny.", category: 'Ancient India’, paper: 1, section: 'Ancient India’ },
  { year: -321, yearLabel: '321 BCE’, title: 'Chandragupta Maurya Founds Maurya Empire’, description: 'Chandragupta overthrows Nanda dynasty with Kautilya\u2019s guidance; Maurya Empire established — first pan-Indian empire.', category: 'Mauryan’, paper: 1, section: 'Ancient India’ },
  { year: -305, yearLabel: '305 BCE’, title: 'Chandragupta Defeats Seleucus Nicator’, description: 'Chandragupta defeats Seleucus, gains trans-Indus territories; Megasthenes sent as ambassador to Pataliputra.', category: 'Mauryan’, paper: 1, section: 'Ancient India’ },
  { year: -269, yearLabel: '269 BCE’, title: 'Ashoka Ascends the Throne’, description: 'Ashoka becomes Mauryan Emperor; launches administrative reforms, later transforms after Kalinga War.', category: 'Mauryan’, paper: 1, section: 'Ancient India’ },
  { year: -261, yearLabel: '261 BCE’, title: 'Kalinga War’, description: "Ashoka’s brutal conquest of Kalinga; massive casualties cause transformation; adopts Buddhism and policy of Dhamma.", category: 'Mauryan’, paper: 1, section: 'Ancient India’ },
  { year: -185, yearLabel: '185 BCE’, title: 'Fall of Maurya Empire’, description: 'Pushyamitra Shunga assassinates last Maurya king Brihadratha; Shunga dynasty begins; fragmentation of empire.', category: 'Mauryan’, paper: 1, section: 'Ancient India’ },
  { year: -180, yearLabel: '180 BCE’, title: 'Indo-Greek Kingdoms in Northwest India’, description: 'Post-Maurya period sees Indo-Greek rulers like Menander (Milinda) in northwest; Milindapanha records his dialogue with Nagasena.', category: 'Ancient India’, paper: 1, section: 'Ancient India’ },
  { year: 78, yearLabel: '78 CE’, title: "Kanishka’s Accession & Saka Era", description: 'Kanishka ascends the Kushan throne; Saka era begins; Buddhism spreads to Central Asia; fourth Buddhist council held.', category: 'Ancient India’, paper: 1, section: 'Ancient India’ },
  { year: 320, yearLabel: '320 CE’, title: 'Gupta Empire Founded’, description: 'Chandragupta I founds the Gupta dynasty; beginning of the "Golden Age" of India in arts, science, and literature.', category: 'Gupta’, paper: 1, section: 'Ancient India’ },
  { year: 335, yearLabel: '335 CE’, title: "Samudragupta’s Reign", description: 'Military campaigns across India; Allahabad Pillar inscription records conquests; called "Napoleon of India" by V.A. Smith.', category: 'Gupta’, paper: 1, section: 'Ancient India’ },
  { year: 375, yearLabel: '375 CE’, title: 'Chandragupta II (Vikramaditya)', description: 'Golden age of Gupta culture; Kalidasa, Aryabhata flourish; Fa Hien visits (405–411 CE); silver coinage expands.', category: 'Gupta’, paper: 1, section: 'Ancient India’ },
  { year: 455, yearLabel: '455 CE’, title: 'First Huna Invasion’, description: 'Hunas (White Huns) begin invasions into India; Skandagupta repels them initially; weakens Gupta Empire.', category: 'Gupta’, paper: 1, section: 'Ancient India’ },
  { year: 606, yearLabel: '606 CE’, title: "Harsha’s Reign", description: "Harshavardhana rules from Kanauj (606–647 CE); last great empire before medieval fragmentation; Xuanzang visits his court.", category: 'Ancient India’, paper: 1, section: 'Ancient India’ },
  { year: 711, yearLabel: '711 CE’, title: 'Arab Conquest of Sindh’, description: 'Muhammad bin Qasim defeats Raja Dahir; Arabs conquer Sindh and southern Punjab — first Islamic political presence in India.', category: 'Medieval’, paper: 1, section: 'Medieval India’ },
  { year: 750, yearLabel: '750 CE’, title: 'Rise of Pala Dynasty’, description: 'Gopala founds Pala dynasty in Bengal; Palas patronize Buddhism, Nalanda, Vikramashila; Tripartite Struggle for Kannauj begins.', category: 'Medieval’, paper: 1, section: 'Medieval India’ },
  { year: 753, yearLabel: '753 CE’, title: 'Rashtrakuta Dynasty Founded’, description: 'Dantidurga founds Rashtrakutas in Deccan; major contestants in Tripartite Struggle; Kailasa temple at Ellora built under Krishna I.', category: 'Medieval’, paper: 1, section: 'Medieval India’ },
  { year: 985, yearLabel: '985 CE’, title: 'Rajaraja Chola I’, description: 'Rajaraja Chola I ascends throne (985–1014 CE); builds Brihadeswara temple; expands Chola navy across Bay of Bengal.', category: 'Medieval’, paper: 1, section: 'Medieval India’ },
  { year: 1000, yearLabel: '1000 CE’, title: 'Mahmud of Ghazni — First Raid’, description: 'Mahmud of Ghazni begins his raids into India; total 17 raids; economic plunder and religious iconoclasm.', category: 'Sultanate’, paper: 1, section: 'Medieval India’ },
  { year: 1025, yearLabel: '1025 CE’, title: 'Mahmud Sacks Somnath Temple’, description: 'Most famous of Mahmud’s raids; Somnath temple destroyed and plundered; major symbolic and material blow.', category: 'Sultanate’, paper: 1, section: 'Medieval India’ },
  { year: 1192, yearLabel: '1192 CE’, title: 'Second Battle of Tarain’, description: 'Muhammad Ghori defeats Prithviraj Chauhan III; Ghurian conquest of northern India established; Delhi comes under Muslim rule.', category: 'Sultanate’, paper: 1, section: 'Medieval India’ },
  { year: 1206, yearLabel: '1206 CE’, title: 'Delhi Sultanate Established’, description: "Qutb-ud-din Aibak becomes first Sultan of Delhi; Slave dynasty begins; 320-year era of Sultanate rule.", category: 'Sultanate’, paper: 1, section: 'Medieval India’ },
  { year: 1221, yearLabel: '1221 CE’, title: 'Mongol Invasion (Genghis Khan)', description: "Genghis Khan’s forces reach the Indus pursuing Jalal-ud-din Mangabarni; Iltutmish refuses shelter, saving Delhi.", category: 'Sultanate’, paper: 1, section: 'Medieval India’ },
  { year: 1236, yearLabel: '1236 CE’, title: 'Reign of Razia Sultana’, description: 'Razia Sultana becomes first female ruler of Delhi Sultanate (1236–1240); faces resistance from Turkish nobles; killed 1240.', category: 'Sultanate’, paper: 1, section: 'Medieval India’ },
  { year: 1290, yearLabel: '1290 CE’, title: 'Khalji Dynasty Begins’, description: 'Jalal-ud-din Khalji founds Khalji dynasty; break from Turkish exclusivism; later Alauddin Khalji expands empire dramatically.', category: 'Sultanate’, paper: 1, section: 'Medieval India’ },
  { year: 1296, yearLabel: '1296 CE’, title: "Alauddin Khalji’s Reign", description: "Alauddin Khalji’s market reforms, price control, agrarian reforms; repels Mongol invasions; conquests across Deccan (Malik Kafur).", category: 'Sultanate’, paper: 1, section: 'Medieval India’ },
  { year: 1320, yearLabel: '1320 CE’, title: 'Tughlaq Dynasty Begins’, description: 'Ghiyasuddin Tughlaq founds Tughlaq dynasty; followed by Muhammad bin Tughlaq whose ambitious experiments caused chaos.', category: 'Sultanate’, paper: 1, section: 'Medieval India’ },
  { year: 1325, yearLabel: '1325 CE’, title: "Muhammad bin Tughlaq’s Reign", description: 'Token currency experiment, transfer of capital to Daulatabad, Khorasan expedition — visionary but failed policies; Ibn Battuta visits.', category: 'Sultanate’, paper: 1, section: 'Medieval India’ },
  { year: 1336, yearLabel: '1336 CE’, title: 'Vijayanagara Empire Founded’, description: 'Harihara and Bukka Raya found Vijayanagara in South India; major Hindu kingdom; Hampi as capital; lasts till 1646.', category: 'Vijayanagara’, paper: 1, section: 'Medieval India’ },
  { year: 1347, yearLabel: '1347 CE’, title: 'Bahmani Sultanate Founded’, description: 'Alauddin Bahman Shah founds Bahmani Sultanate in Deccan; rival of Vijayanagara; later fragmented into Deccan Sultanates.', category: 'Sultanate’, paper: 1, section: 'Medieval India’ },
  { year: 1351, yearLabel: '1351 CE’, title: 'Firuz Shah Tughlaq Reign’, description: 'Firuz Shah Tughlaq (1351–1388); extensive public works, canals, hospitals; but religious orthodoxy and weak military.', category: 'Sultanate’, paper: 1, section: 'Medieval India’ },
  { year: 1398, yearLabel: '1398 CE’, title: "Timur’s Invasion", description: "Timur (Tamerlane) invades India; sacks Delhi; massacres population; Tughlaq dynasty effectively ends; Delhi left desolate.", category: 'Sultanate’, paper: 1, section: 'Medieval India’ },
  { year: 1451, yearLabel: '1451 CE’, title: 'Lodi Dynasty Begins’, description: 'Bahlul Lodi founds Lodi dynasty — first Afghan dynasty of Delhi; last of the Delhi Sultanate rulers.', category: 'Sultanate’, paper: 1, section: 'Medieval India’ },
  { year: 1453, yearLabel: '1453 CE’, title: 'Fall of Constantinople’, description: 'Ottoman Turks capture Constantinople; end of Byzantine Empire; triggers European search for alternative trade routes to Asia.', category: 'World History’, paper: 2, section: 'World History’ },
  { year: 1492, yearLabel: '1492 CE’, title: 'Columbus Reaches Americas’, description: 'Christopher Columbus lands in the Caribbean; beginning of European colonization of the Americas; Columbian Exchange begins.', category: 'World History’, paper: 2, section: 'World History’ },
  { year: 1498, yearLabel: '1498 CE’, title: 'Vasco da Gama Arrives at Calicut’, description: 'Vasco da Gama reaches Calicut (Kozhikode); opens direct sea route from Europe to India; Portuguese colonial era begins.', category: 'Modern’, paper: 2, section: 'Modern India’ },
  { year: 1517, yearLabel: '1517 CE’, title: "Luther’s 95 Theses — Protestant Reformation", description: "Martin Luther nails 95 Theses in Wittenberg; Protestant Reformation begins; challenges Catholic Church’s authority across Europe.", category: 'World History’, paper: 2, section: 'World History’ },
  { year: 1526, yearLabel: '1526 CE’, title: 'First Battle of Panipat’, description: 'Babur defeats Ibrahim Lodi using artillery and flanking tactics; Mughal Empire established in India.', category: 'Mughal’, paper: 1, section: 'Medieval India’ },
  { year: 1527, yearLabel: '1527 CE’, title: 'Battle of Khanwa’, description: 'Babur defeats Rana Sanga of Mewar; consolidates Mughal hold over Rajputana; Babur calls himself Ghazi.', category: 'Mughal’, paper: 1, section: 'Medieval India’ },
  { year: 1539, yearLabel: '1539 CE’, title: 'Battle of Chausa — Sher Shah Suri’, description: 'Sher Shah Suri defeats Humayun at Chausa; followed by Kanauj (1540); Humayun exiled; Sur Empire begins.', category: 'Mughal’, paper: 1, section: 'Medieval India’ },
  { year: 1543, yearLabel: '1543 CE’, title: 'Copernicus — Heliocentric Theory’, description: 'Copernicus publishes De Revolutionibus; heliocentric model of the solar system; beginning of the Scientific Revolution.', category: 'World History’, paper: 2, section: 'World History’ },
  { year: 1555, yearLabel: '1555 CE’, title: 'Humayun Recaptures Delhi’, description: 'Humayun recaptures Delhi with Safavid help after 15 years; dies in 1556 falling from library stairs; Akbar succeeds.', category: 'Mughal’, paper: 1, section: 'Medieval India’ },
  { year: 1556, yearLabel: '1556 CE’, title: 'Second Battle of Panipat — Akbar’, description: "Akbar’s general Bairam Khan defeats Hemu; Akbar begins reign; builds largest Indian empire and introduces Din-i-Ilahi.", category: 'Mughal’, paper: 1, section: 'Medieval India’ },
  { year: 1564, yearLabel: '1564 CE’, title: 'Akbar Abolishes Jizya’, description: 'Akbar abolishes the Jizya tax on non-Muslims; earlier (1562) banned enslavement of war prisoners; (1563) abolished pilgrim tax — policy of Sulh-i-Kul.', category: 'Mughal’, paper: 1, section: 'Medieval India’ },
  { year: 1576, yearLabel: '1576 CE’, title: 'Battle of Haldighati’, description: "Akbar’s forces under Man Singh defeat Rana Pratap of Mewar; Rana Pratap escapes; symbol of Rajput resistance.", category: 'Mughal’, paper: 1, section: 'Medieval India’ },
  { year: 1580, yearLabel: '1580 CE’, title: "Akbar’s Din-i-Ilahi", description: "Akbar promulgates Din-i-Ilahi (Divine Faith); syncretic religion blending Islam, Hinduism, Zoroastrianism; Ibadat Khana debates.", category: 'Mughal’, paper: 1, section: 'Medieval India’ },
  { year: 1588, yearLabel: '1588 CE’, title: 'Defeat of Spanish Armada’, description: "England defeats Philip II’s Spanish Armada; English naval supremacy rises; decline of Spanish imperial power begins.", category: 'World History’, paper: 2, section: 'World History’ },
  { year: 1600, yearLabel: '1600 CE’, title: 'East India Company Founded’, description: 'British East India Company established by royal charter on December 31; enters Indian Ocean trade; later becomes colonial ruler.', category: 'Modern’, paper: 2, section: 'Modern India’ },
  { year: 1605, yearLabel: '1605 CE’, title: 'Jahangir Ascends Mughal Throne’, description: "Akbar dies; Jahangir ascends; reign known for artistic patronage, justice system (Chain of Justice); Nur Jahan’s influence.", category: 'Mughal’, paper: 1, section: 'Medieval India’ },
  { year: 1618, yearLabel: '1618 CE’, title: 'Thirty Years War Begins’, description: 'Thirty Years War (1618–1648) in Europe; religious and political conflict; Peace of Westphalia (1648) establishes modern state system.', category: 'World History’, paper: 2, section: 'World History’ },
  { year: 1628, yearLabel: '1628 CE’, title: 'Shah Jahan Ascends Mughal Throne’, description: "Shah Jahan’s reign (1628–1658); pinnacle of Mughal architecture — Taj Mahal, Red Fort, Jama Masjid; Peacock Throne built.", category: 'Mughal’, paper: 1, section: 'Medieval India’ },
  { year: 1658, yearLabel: '1658 CE’, title: 'Aurangzeb Becomes Emperor’, description: 'Aurangzeb imprisons Shah Jahan; defeats brothers in war of succession; reign marks political expansion but ideological rigidity.', category: 'Mughal’, paper: 1, section: 'Medieval India’ },
  { year: 1664, yearLabel: '1664 CE’, title: 'Shivaji Sacks Surat — Maratha Rise’, description: "Shivaji sacks Surat (Mughal port); Maratha power rises in Deccan; Shivaji’s guerrilla warfare humiliates Mughals.", category: 'Mughal’, paper: 1, section: 'Medieval India’ },
  { year: 1674, yearLabel: '1674 CE’, title: 'Shivaji Crowned Chhatrapati’, description: 'Shivaji crowned Chhatrapati at Raigad; Maratha kingdom formally established; independent Hindu sovereignty asserted.', category: 'Mughal’, paper: 1, section: 'Medieval India’ },
  { year: 1688, yearLabel: '1688 CE’, title: 'Glorious Revolution — England’, description: "England’s Glorious Revolution; William of Orange replaces James II; constitutional monarchy established; Bill of Rights (1689).", category: 'World History’, paper: 2, section: 'World History’ },
  { year: 1707, yearLabel: '1707 CE’, title: 'Aurangzeb Dies — Mughal Decline’, description: 'Aurangzeb dies; Mughal decline accelerates; succession wars, provincial rebellions, Maratha resurgence fragment the empire.', category: 'Mughal’, paper: 1, section: 'Medieval India’ },
  { year: 1739, yearLabel: '1739 CE’, title: "Nadir Shah’s Invasion", description: "Nadir Shah of Persia sacks Delhi; takes Peacock Throne and Kohinoor diamond; massacre of Delhi population; Mughal prestige shattered.", category: 'Modern’, paper: 2, section: 'Modern India’ },
  { year: 1757, yearLabel: '1757 CE’, title: 'Battle of Plassey’, description: 'Clive defeats Siraj-ud-Daula with help of Mir Jafar; British political supremacy established in Bengal; colonial era begins.', category: 'Modern’, paper: 2, section: 'Modern India’ },
  { year: 1761, yearLabel: '1761 CE’, title: 'Third Battle of Panipat’, description: 'Ahmad Shah Abdali defeats Marathas; Maratha expansion checked; Vishwasrao and Bhau Sahib killed; Maratha power weakens.', category: 'Modern’, paper: 2, section: 'Modern India’ },
  { year: 1764, yearLabel: '1764 CE’, title: 'Battle of Buxar’, description: 'British defeat combined forces of Mir Qasim, Nawab of Awadh, and Mughal Emperor; complete British dominance over Bengal.', category: 'Modern’, paper: 2, section: 'Modern India’ },
  { year: 1765, yearLabel: '1765 CE’, title: 'Diwani Rights Granted’, description: 'Diwani (revenue rights) of Bengal granted to EIC by Mughal Emperor; dual government system; exploitation of Bengal begins.', category: 'Modern’, paper: 2, section: 'Modern India’ },
  { year: 1773, yearLabel: '1773 CE’, title: 'Regulating Act’, description: 'Regulating Act; Warren Hastings becomes Governor-General; first parliamentary intervention to regulate EIC in India.', category: 'Modern’, paper: 2, section: 'Modern India’ },
  { year: 1776, yearLabel: '1776 CE’, title: 'American Declaration of Independence’, description: 'Thirteen colonies declare independence from Britain; foundation of the United States of America; first modern democratic republic.', category: 'World History’, paper: 2, section: 'World History’ },
  { year: 1784, yearLabel: '1784 CE’, title: "Pitt’s India Act", description: "Pitt’s India Act establishes Board of Control; dual government of EIC and Crown; tightens Parliamentary oversight of India.", category: 'Modern’, paper: 2, section: 'Modern India’ },
  { year: 1789, yearLabel: '1789 CE’, title: 'French Revolution’, description: "Fall of Bastille; Declaration of Rights of Man and Citizen; end of Ancien Régime; ideas of liberty, equality, fraternity spread globally.", category: 'World History’, paper: 2, section: 'World History’ },
  { year: 1793, yearLabel: '1793 CE’, title: 'Permanent Settlement of Bengal’, description: 'Cornwallis introduces Permanent Settlement; zamindari system created; fixed land revenue; dispossession of peasants begins.', category: 'Modern’, paper: 2, section: 'Modern India’ },
  { year: 1799, yearLabel: '1799 CE’, title: 'Fourth Anglo-Mysore War — Tipu Sultan Killed’, description: 'British forces storm Seringapatam; Tipu Sultan killed; Mysore reduced to subsidiary state; British supremacy in South India.', category: 'Modern’, paper: 2, section: 'Modern India’ },
  { year: 1804, yearLabel: '1804 CE’, title: 'Napoleon Proclaimed Emperor’, description: 'Napoleon Bonaparte crowns himself Emperor of the French; Napoleonic Code; dominates Europe until defeat at Waterloo (1815).', category: 'World History’, paper: 2, section: 'World History’ },
  { year: 1813, yearLabel: '1813 CE’, title: 'Charter Act 1813', description: 'EIC loses trade monopoly (except tea and China trade); Christian missionaries allowed; ₹1 lakh for Indian education.', category: 'Modern’, paper: 2, section: 'Modern India’ },
  { year: 1815, yearLabel: '1815 CE’, title: 'Congress of Vienna’, description: "Battle of Waterloo; Napoleon’s final defeat; Congress of Vienna redraws European map; Concert of Europe; conservative order restored.", category: 'World History’, paper: 2, section: 'World History’ },
  { year: 1818, yearLabel: '1818 CE’, title: 'Third Anglo-Maratha War’, description: 'Third Anglo-Maratha War ends; Peshwa exiled to Bithur; British supremacy over entire India complete; Pax Britannica begins.', category: 'Modern’, paper: 2, section: 'Modern India’ },
  { year: 1829, yearLabel: '1829 CE’, title: 'Sati Abolished’, description: 'Lord William Bentinck abolishes Sati; major social reform supported by Raja Ram Mohan Roy and the Brahmo Samaj.', category: 'Modern’, paper: 2, section: 'Modern India’ },
  { year: 1833, yearLabel: '1833 CE’, title: 'Charter Act 1833', description: 'EIC loses all commercial functions; becomes purely administrative; Governor-General of India created; Law Commission set up.', category: 'Modern’, paper: 2, section: 'Modern India’ },
  { year: 1835, yearLabel: '1835 CE’, title: "Macaulay’s Minute on Education", description: "Macaulay’s Minute adopts English as medium of instruction; creation of 'brown Englishmen’; Western education expands.", category: 'Modern’, paper: 2, section: 'Modern India’ },
  { year: 1848, yearLabel: '1848 CE’, title: 'Revolutions across Europe & Communist Manifesto’, description: 'Wave of revolutions across France, Germany, Austria-Hungary, Italy; Marx and Engels publish Communist Manifesto; Spring of Nations.', category: 'World History’, paper: 2, section: 'World History’ },
  { year: 1853, yearLabel: '1853 CE’, title: 'First Railway & Telegraph in India’, description: 'First railway from Bombay to Thane (April 16); first telegraph line; infrastructure of colonial exploitation laid.', category: 'Modern’, paper: 2, section: 'Modern India’ },
  { year: 1856, yearLabel: '1856 CE’, title: "Dalhousie’s Reforms & Doctrine of Lapse", description: 'Dalhousie annexes Awadh; Doctrine of Lapse used to annex Satara, Jhansi, Nagpur; widow remarriage legalized; Wood’s Education Despatch.', category: 'Modern’, paper: 2, section: 'Modern India’ },
  { year: 1857, yearLabel: '1857 CE’, title: 'The Great Revolt of 1857', description: 'Revolt begins at Meerut (May 10); spreads across north India; Mangal Pandey, Rani Lakshmibai, Tantia Tope, Bahadur Shah Zafar lead resistance.', category: 'National Movement’, paper: 2, section: 'Modern India’ },
  { year: 1858, yearLabel: '1858 CE’, title: 'Crown Takes Over — End of EIC’, description: "Government of India Act 1858; EIC dissolved; Crown takes direct control; Queen’s Proclamation promises equality and no annexation.", category: 'Modern’, paper: 2, section: 'Modern India’ },
  { year: 1861, yearLabel: '1861 CE’, title: 'Italian Unification & American Civil War’, description: 'Kingdom of Italy proclaimed (1861); Garibaldi, Cavour, Mazzini lead Risorgimento. American Civil War (1861–1865) — slavery abolished.', category: 'World History’, paper: 2, section: 'World History’ },
  { year: 1871, yearLabel: '1871 CE’, title: 'Unification of Germany & Paris Commune’, description: 'Bismarck unifies Germany after Franco-Prussian War; German Empire proclaimed at Versailles. Paris Commune — first workers’ government.’, category: ’World History’, paper: 2, section: 'World History’ },
  { year: 1877, yearLabel: '1877 CE’, title: 'Queen Victoria — Empress of India’, description: 'Delhi Durbar; Queen Victoria proclaimed Empress of India; Lord Lytton as Viceroy; pageantry of British imperialism at peak.', category: 'Modern’, paper: 2, section: 'Modern India’ },
  { year: 1878, yearLabel: '1878 CE’, title: 'Vernacular Press Act’, description: 'Vernacular Press Act passed under Lord Lytton; censors Indian language newspapers; sparks nationalist anger.', category: 'National Movement’, paper: 2, section: 'Modern India’ },
  { year: 1884, yearLabel: '1884 CE’, title: 'Berlin Conference — Scramble for Africa’, description: 'Berlin Conference (1884–85) formalizes European partition of Africa; imperialism at its peak; Africa divided without African consent.', category: 'World History’, paper: 2, section: 'World History’ },
  { year: 1885, yearLabel: '1885 CE’, title: 'Indian National Congress Founded’, description: 'INC founded by A.O. Hume; first session in Bombay (Dadabhai Naoroji presides); beginning of organized nationalist movement.', category: 'National Movement’, paper: 2, section: 'Modern India’ },
  { year: 1894, yearLabel: '1894 CE’, title: 'First Sino-Japanese War’, description: 'Japan defeats China (1894–95); Treaty of Shimonoseki; rise of Japan as Asian power; signals decline of Chinese empire.', category: 'World History’, paper: 2, section: 'World History’ },
  { year: 1898, yearLabel: '1898 CE’, title: 'Spanish-American War’, description: 'USA defeats Spain; gains Philippines, Guam, Puerto Rico; US emerges as imperial power; American century begins.', category: 'World History’, paper: 2, section: 'World History’ },
  { year: 1899, yearLabel: '1899 CE’, title: 'Boer War’, description: 'Boer War (1899–1902) in South Africa; Britain vs Boer republics; British concentration camps; seeds of Afrikaner nationalism.', category: 'World History’, paper: 2, section: 'World History’ },
  { year: 1904, yearLabel: '1904 CE’, title: 'Russo-Japanese War’, description: 'Japan defeats Russia (1904–05); first Asian nation defeats a European power; shock to European imperial confidence.', category: 'World History’, paper: 2, section: 'World History’ },
  { year: 1905, yearLabel: '1905 CE’, title: 'Partition of Bengal & Swadeshi Movement’, description: 'Curzon partitions Bengal; Swadeshi and Boycott movement begins; Tilak, Lajpat Rai, Bipin Chandra Pal lead Extremists. Russian Revolution of 1905 — Bloody Sunday.', category: 'National Movement’, paper: 2, section: 'Modern India’ },
  { year: 1906, yearLabel: '1906 CE’, title: 'Muslim League Founded’, description: 'All India Muslim League founded at Dhaka; Aga Khan leads; demand for separate Muslim political representation; seeds of partition.', category: 'National Movement’, paper: 2, section: 'Modern India’ },
  { year: 1907, yearLabel: '1907 CE’, title: 'Surat Split’, description: 'INC splits at Surat into Moderates (Gokhale) and Extremists (Tilak); fundamental difference over methods and goals of nationalism.', category: 'National Movement’, paper: 2, section: 'Modern India’ },
  { year: 1909, yearLabel: '1909 CE’, title: 'Morley-Minto Reforms’, description: 'Indian Councils Act 1909; separate electorates for Muslims introduced — communal representation institutionalized; Morley-Minto Reforms.', category: 'National Movement’, paper: 2, section: 'Modern India’ },
  { year: 1911, yearLabel: '1911 CE’, title: 'Partition of Bengal Annulled — Capital Shifted’, description: 'Partition of Bengal annulled at Delhi Durbar 1911; capital shifted from Calcutta to Delhi; nationalist triumph but Swadeshi loses momentum.', category: 'National Movement’, paper: 2, section: 'Modern India’ },
  { year: 1914, yearLabel: '1914 CE’, title: 'World War I Begins’, description: "Assassination of Archduke Franz Ferdinand at Sarajevo; alliance system triggers WWI; trench warfare, total war; 17 million killed.", category: 'World History’, paper: 2, section: 'World History’ },
  { year: 1915, yearLabel: '1915 CE’, title: 'Gandhi Returns to India’, description: 'Gandhi returns from South Africa; meets Gokhale; tours India; launches Champaran Satyagraha (1917); transforms Indian nationalism.', category: 'National Movement’, paper: 2, section: 'Modern India’ },
  { year: 1916, yearLabel: '1916 CE’, title: 'Lucknow Pact & Home Rule League’, description: 'Lucknow Pact between INC and Muslim League; Tilak-Besant Home Rule League founded; wartime nationalism intensifies.', category: 'National Movement’, paper: 2, section: 'Modern India’ },
  { year: 1917, yearLabel: '1917 CE’, title: 'Russian Revolution’, description: 'February Revolution topples Tsar; October Revolution — Bolsheviks seize power under Lenin; world’s first communist state; Cold War seeds sown. USA enters WWI. Balfour Declaration on Palestine.’, category: ’World History’, paper: 2, section: 'World History’ },
  { year: 1918, yearLabel: '1918 CE’, title: 'WWI Ends — Montagu Declaration’, description: 'WWI ends November 11, 1918; Treaty of Brest-Litovsk; Montagu Declaration promises responsible government in India; Montagu-Chelmsford Reforms.', category: 'World History’, paper: 2, section: 'World History’ },
  { year: 1919, yearLabel: '1919 CE’, title: 'Rowlatt Act & Jallianwala Bagh’, description: 'Rowlatt Act (Black Act) passed; Jallianwala Bagh massacre April 13 — General Dyer kills 379+; Montagu-Chelmsford Reforms; Treaty of Versailles.', category: 'National Movement’, paper: 2, section: 'Modern India’ },
  { year: 1920, yearLabel: '1920 CE’, title: 'Non-Cooperation & Khilafat Movement’, description: 'Gandhi launches Non-Cooperation Movement; Khilafat Movement alliance with Muslims; hartals, boycotts, surrender of titles; mass mobilization.', category: 'National Movement’, paper: 2, section: 'Modern India’ },
  { year: 1922, yearLabel: '1922 CE’, title: 'Chauri Chaura & Suspension of NCM’, description: 'Chauri Chaura incident (February 5) — mob burns police station; Gandhi suspends Non-Cooperation Movement; Swaraj Party founded (Das & Motilal).', category: 'National Movement’, paper: 2, section: 'Modern India’ },
  { year: 1927, yearLabel: '1927 CE’, title: 'Simon Commission’, description: 'Simon Commission appointed with no Indian members; all-white commission to review Montford reforms; nationwide protests and boycotts.', category: 'National Movement’, paper: 2, section: 'Modern India’ },
  { year: 1929, yearLabel: '1929 CE’, title: 'Purna Swaraj Declared & Wall Street Crash’, description: 'Lahore Session (Dec 31) — INC declares Purna Swaraj (Complete Independence); Jawaharlal Nehru as president. Wall Street Crash triggers Great Depression.', category: 'National Movement’, paper: 2, section: 'Modern India’ },
  { year: 1930, yearLabel: '1930 CE’, title: 'Dandi March & Civil Disobedience’, description: "Gandhi’s Dandi March (March 12 – April 6); Salt Satyagraha; Civil Disobedience Movement launched; First Round Table Conference (without Congress).", category: 'National Movement’, paper: 2, section: 'Modern India’ },
  { year: 1931, yearLabel: '1931 CE’, title: 'Gandhi-Irwin Pact & Second RTC’, description: 'Gandhi-Irwin Pact (March 5); Civil Disobedience suspended; Gandhi attends Second Round Table Conference in London; no resolution on communal award.', category: 'National Movement’, paper: 2, section: 'Modern India’ },
  { year: 1932, yearLabel: '1932 CE’, title: 'Communal Award & Poona Pact’, description: "MacDonald’s Communal Award gives separate electorates to Depressed Classes; Gandhi’s fast unto death; Poona Pact between Gandhi and Ambedkar.", category: 'National Movement’, paper: 2, section: 'Modern India’ },
  { year: 1933, yearLabel: '1933 CE’, title: 'Hitler Becomes Chancellor — New Deal’, description: 'Hitler appointed Chancellor of Germany (Jan 30); Nazi regime; Enabling Act; racial laws. Roosevelt launches New Deal in USA to tackle Depression.', category: 'World History’, paper: 2, section: 'World History’ },
  { year: 1935, yearLabel: '1935 CE’, title: 'Government of India Act 1935', description: 'GoI Act 1935; provincial autonomy; federal structure proposed; diarchy abolished; largest constitutional document of British India.', category: 'National Movement’, paper: 2, section: 'Modern India’ },
  { year: 1936, yearLabel: '1936 CE’, title: 'Spanish Civil War’, description: 'Spanish Civil War (1936–1939); Franco vs Republican government; Hitler and Mussolini support Franco; USSR supports Republicans; prelude to WWII.', category: 'World History’, paper: 2, section: 'World History’ },
  { year: 1937, yearLabel: '1937 CE’, title: 'Provincial Elections — Congress Governments’, description: 'First elections under GoI Act 1935; Congress wins in 7 of 11 provinces; Congress ministries formed; Muslim League performs poorly.', category: 'National Movement’, paper: 2, section: 'Modern India’ },
  { year: 1938, yearLabel: '1938 CE’, title: 'Munich Agreement & Anschluss’, description: "Germany annexes Austria (Anschluss, March 1938); Munich Agreement (Sep 1938) — Britain and France appease Hitler over Czechoslovakia; 'peace in our time’.", category: 'World History’, paper: 2, section: 'World History’ },
  { year: 1939, yearLabel: '1939 CE’, title: 'World War II Begins’, description: "Germany invades Poland (Sep 1); Britain and France declare war; Nazi-Soviet Pact; Congress ministers resign over India’s forced entry into war.", category: 'World History’, paper: 2, section: 'World History’ },
  { year: 1940, yearLabel: '1940 CE’, title: 'Lahore Resolution & Battle of Britain’, description: "Muslim League’s Lahore Resolution demands separate homeland; August Offer by Linlithgow rejected by Congress. Battle of Britain — RAF defeats Luftwaffe.", category: 'National Movement’, paper: 2, section: 'Modern India’ },
  { year: 1941, yearLabel: '1941 CE’, title: 'Operation Barbarossa & Pearl Harbor’, description: 'Germany invades USSR (June 22); Pearl Harbor attack (Dec 7); USA enters WWII; Grand Alliance formed; turning point of the war.', category: 'World History’, paper: 2, section: 'World History’ },
  { year: 1942, yearLabel: '1942 CE’, title: 'Quit India Movement’, description: "Gandhi gives 'Do or Die’ call on August 8; Quit India Movement — most mass uprising since 1857; Cripps Mission fails; INA formed under Bose.", category: 'National Movement’, paper: 2, section: 'Modern India’ },
  { year: 1943, yearLabel: '1943 CE’, title: 'Bengal Famine & Battle of Stalingrad’, description: 'Bengal Famine — 2–3 million die; Churchill blamed; Subhas Chandra Bose takes over INA in Southeast Asia. Battle of Stalingrad ends — Soviet turning point.', category: 'National Movement’, paper: 2, section: 'Modern India’ },
  { year: 1944, yearLabel: '1944 CE’, title: 'D-Day & Bretton Woods’, description: 'D-Day (June 6) — Allied landings in Normandy; liberation of France begins. Bretton Woods Conference establishes IMF and World Bank; new economic order.', category: 'World History’, paper: 2, section: 'World History’ },
  { year: 1945, yearLabel: '1945 CE’, title: 'World War II Ends & UN Founded’, description: 'Yalta Conference; Germany surrenders (May 8); atomic bombs on Hiroshima (Aug 6) and Nagasaki (Aug 9); Japan surrenders (Aug 15); UN founded (Oct 24).', category: 'World History’, paper: 2, section: 'World History’ },
  { year: 1946, yearLabel: '1946 CE’, title: 'Cabinet Mission & Direct Action Day’, description: 'Cabinet Mission Plan (May 1946); Interim Government formed; Direct Action Day (August 16) by Muslim League triggers massive communal violence.', category: 'National Movement’, paper: 2, section: 'Modern India’ },
  { year: 1947, yearLabel: '1947 CE’, title: 'Indian Independence & Partition’, description: 'Indian Independence Act; Mountbatten Plan; India and Pakistan gain independence; Partition and massive population transfer; 1 million+ die.', category: 'National Movement’, paper: 2, section: 'Modern India’ },
  { year: 1948, yearLabel: '1948 CE’, title: 'Berlin Blockade, Israel & Gandhi Assassinated’, description: 'Gandhi assassinated (Jan 30) by Nathuram Godse. State of Israel founded (May 14). Berlin Blockade (Soviet). Universal Declaration of Human Rights (Dec 10).', category: 'World History’, paper: 2, section: 'World History’ },
  { year: 1949, yearLabel: '1949 CE’, title: "NATO & People’s Republic of China", description: "NATO founded (April 4); People’s Republic of China proclaimed by Mao Zedong (Oct 1); USSR tests atomic bomb; Cold War bipolarism established.", category: 'World History’, paper: 2, section: 'World History’ },
  { year: 1950, yearLabel: '1950 CE’, title: 'Korean War Begins’, description: 'Korean War (1950–1953); North Korea (Soviet/Chinese backed) vs South Korea (US/UN backed); armistice at 38th parallel; Cold War proxy war.', category: 'World History’, paper: 2, section: 'World History’ },
  { year: 1954, yearLabel: '1954 CE’, title: 'Dien Bien Phu — French Defeat in Vietnam’, description: 'Viet Minh defeats France at Dien Bien Phu; Geneva Accords partition Vietnam at 17th parallel; US steps in to fill French vacuum.', category: 'World History’, paper: 2, section: 'World History’ },
  { year: 1955, yearLabel: '1955 CE’, title: 'Bandung Conference & Warsaw Pact’, description: 'Bandung Conference — 29 Asian and African nations; origins of Non-Aligned Movement; Nehru, Nasser, Sukarno. Warsaw Pact founded as Soviet counter to NATO.', category: 'World History’, paper: 2, section: 'World History’ },
  { year: 1956, yearLabel: '1956 CE’, title: 'Suez Crisis & Hungarian Uprising’, description: 'Suez Crisis — Egypt nationalizes canal; Britain-France-Israel attack; US forces withdrawal; decline of European imperialism. Hungarian Uprising crushed by USSR.', category: 'World History’, paper: 2, section: 'World History’ },
  { year: 1957, yearLabel: '1957 CE’, title: 'Sputnik Launch & Ghana Independence’, description: "USSR launches Sputnik (Oct 4) — first artificial satellite; Space Race begins. Ghana becomes first sub-Saharan African nation independent (Nkrumah).", category: 'World History’, paper: 2, section: 'World History’ },
  { year: 1959, yearLabel: '1959 CE’, title: 'Cuban Revolution & Tibet Uprising’, description: "Castro’s Cuban Revolution succeeds (Jan 1); Batista flees; US-Cuba tensions begin. Tibet uprising against China; Dalai Lama flees to India.", category: 'World History’, paper: 2, section: 'World History’ },
  { year: 1960, yearLabel: '1960 CE’, title: 'Year of Africa’, description: '17 African nations gain independence in 1960 (Year of Africa); decolonization accelerates; Non-Aligned Movement grows; U-2 spy plane incident.', category: 'World History’, paper: 2, section: 'World History’ },
  { year: 1961, yearLabel: '1961 CE’, title: 'Berlin Wall & Non-Aligned Movement Founded’, description: "Berlin Wall built (Aug 13); divides East and West Berlin. Bay of Pigs invasion fails. Non-Aligned Movement formally founded at Belgrade Conference (Sep).", category: 'World History’, paper: 2, section: 'World History’ },
  { year: 1962, yearLabel: '1962 CE’, title: 'Cuban Missile Crisis & Sino-Indian War’, description: 'Cuban Missile Crisis (Oct) — closest Cold War came to nuclear war; resolved by Kennedy-Khrushchev deal. Sino-Indian War — China defeats India; humiliation for Nehru.', category: 'World History’, paper: 2, section: 'World History’ },
  { year: 1963, yearLabel: '1963 CE’, title: 'JFK Assassinated & Nuclear Test Ban Treaty’, description: 'President Kennedy assassinated in Dallas (Nov 22). Partial Nuclear Test Ban Treaty signed; limited nuclear testing; Cold War tensions ease slightly.', category: 'World History’, paper: 2, section: 'World History’ },
  { year: 1966, yearLabel: '1966 CE’, title: 'Cultural Revolution — China’, description: "Mao Zedong launches Cultural Revolution (1966–1976); Red Guards; destruction of 'old’ culture; millions persecuted; China’s decade of chaos.", category: 'World History’, paper: 2, section: 'World History’ },
  { year: 1967, yearLabel: '1967 CE’, title: 'Six-Day War’, description: 'Israel defeats Egypt, Jordan, Syria in Six Days (June 5–10); captures West Bank, Gaza, Sinai, Golan Heights; reshapes Middle East permanently.', category: 'World History’, paper: 2, section: 'World History’ },
  { year: 1968, yearLabel: '1968 CE’, title: 'Prague Spring & Global Unrest’, description: "Czechoslovakia’s Prague Spring crushed by USSR (Aug). Martin Luther King assassinated (April 4). Paris student revolts. Year of global revolutionary ferment.", category: 'World History’, paper: 2, section: 'World History’ },
  { year: 1969, yearLabel: '1969 CE’, title: 'Moon Landing — Apollo 11', description: "Neil Armstrong and Buzz Aldrin land on Moon (July 20); 'One giant leap for mankind’; US wins Space Race; peak of American technological power.", category: 'World History’, paper: 2, section: 'World History’ },
  { year: 1971, yearLabel: '1971 CE’, title: 'Bangladesh Liberation War’, description: 'Bangladesh Liberation War; Indo-Pak War; India defeats Pakistan in 13 days; Bangladesh created; Simla Agreement (1972); Indira Gandhi at peak power.', category: 'World History’, paper: 2, section: 'World History’ },
  { year: 1972, yearLabel: '1972 CE’, title: 'Nixon Visits China & SALT I’, description: "Nixon’s historic visit to China (Feb); US-China rapprochement; Mao-Nixon meeting. SALT I arms limitation treaty between US and USSR signed.", category: 'World History’, paper: 2, section: 'World History’ },
  { year: 1973, yearLabel: '1973 CE’, title: 'Yom Kippur War & Oil Crisis’, description: 'Yom Kippur War (Oct) — Egypt and Syria attack Israel; OPEC oil embargo; Oil Crisis quadruples prices; stagflation hits Western economies.', category: 'World History’, paper: 2, section: 'World History’ },
  { year: 1975, yearLabel: '1975 CE’, title: 'Fall of Saigon & Helsinki Accords’, description: 'Fall of Saigon (April 30); Vietnam reunified under communist rule; US defeat. Helsinki Accords — detente; human rights provisions challenge Soviet bloc.', category: 'World History’, paper: 2, section: 'World History’ },
  { year: 1978, yearLabel: '1978 CE’, title: 'Camp David Accords’, description: 'Camp David Accords (Sep) brokered by Carter; Egypt-Israel peace treaty; Sadat and Begin; first Arab state to recognize Israel; Sadat assassinated 1981.', category: 'World History’, paper: 2, section: 'World History’ },
  { year: 1979, yearLabel: '1979 CE’, title: 'Iranian Revolution & Soviet Afghanistan’, description: "Iranian Revolution — Shah overthrown; Ayatollah Khomeini; Islamic Republic. Soviet invasion of Afghanistan (Dec 27); Cold War’s Vietnam begins.", category: 'World History’, paper: 2, section: 'World History’ },
  { year: 1980, yearLabel: '1980 CE’, title: 'Solidarity Movement & Reagan Elected’, description: 'Solidarity trade union founded in Poland under Lech Walesa; cracks in Soviet bloc. Ronald Reagan elected US President; New Right; military buildup.', category: 'World History’, paper: 2, section: 'World History’ },
  { year: 1985, yearLabel: '1985 CE’, title: 'Gorbachev — Glasnost & Perestroika’, description: "Mikhail Gorbachev comes to power (March 1985); Glasnost (openness) and Perestroika (restructuring); unintentionally accelerates USSR’s collapse.", category: 'World History’, paper: 2, section: 'World History’ },
  { year: 1986, yearLabel: '1986 CE’, title: 'Chernobyl Disaster’, description: "Chernobyl nuclear disaster (April 26) in Soviet Ukraine; worst nuclear accident; accelerates Gorbachev’s glasnost; undermines faith in Soviet system.", category: 'World History’, paper: 2, section: 'World History’ },
  { year: 1987, yearLabel: '1987 CE’, title: 'INF Treaty — Reagan & Gorbachev’, description: 'Intermediate-Range Nuclear Forces Treaty signed by Reagan and Gorbachev; first treaty to eliminate entire class of nuclear weapons; Cold War thaw.', category: 'World History’, paper: 2, section: 'World History’ },
  { year: 1989, yearLabel: '1989 CE’, title: 'Berlin Wall Falls & Revolutions in Eastern Europe’, description: 'Berlin Wall falls (Nov 9); Tiananmen Square massacre (June 4) in China. Velvet Revolution in Czechoslovakia; Solidarity wins in Poland; communist regimes collapse across Eastern Europe.', category: 'World History’, paper: 2, section: 'World History’ },
  { year: 1990, yearLabel: '1990 CE’, title: 'German Reunification & Gulf Crisis’, description: 'Germany reunified (Oct 3); Cold War order dissolves. Iraq invades Kuwait (Aug 2); Gulf War coalition assembled; New World Order proclaimed by Bush.', category: 'World History’, paper: 2, section: 'World History’ },
  { year: 1991, yearLabel: '1991 CE’, title: 'Dissolution of Soviet Union’, description: 'Soviet Union officially dissolves (Dec 25); Gorbachev resigns; 15 independent republics; Cold War ends; US emerges as sole superpower; unipolar world begins.', category: 'World History’, paper: 2, section: 'World History’ },
];

const CATEGORIES = [...new Set(events.map(e => e.category))];
const SECTIONS = [...new Set(events.map(e => e.section))];

const CATEGORY_COLORS: Record<string, string> = {
  'Ancient India': '#c9a84c’,
  'Mauryan': '#c97a4c’,
  'Gupta': '#c9c44c’,
  'Medieval': '#6a9c5a’,
  'Sultanate': '#5a8a9c’,
  'Vijayanagara': '#9c5a8a’,
  'Mughal': '#8a6a9c’,
  'Modern': '#4c8bc9',
  'National Movement': '#c94c4c’,
  'World History': '#4cad7a’,
};

export default function TimelinePage() {
  const [filterSection, setFilterSection] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [selected, setSelected] = useState<Event | null>(null);

  const filtered = events
    .filter(e => filterSection === 'all’ || e.section === filterSection)
    .filter(e => filterCategory === 'all’ || e.category === filterCategory)
    .sort((a, b) => a.year - b.year);

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto’, padding: '2.5rem 1.5rem 4rem’ }}>
      <div style={{ marginBottom: '2rem’ }}>
        <div style={{ color: 'var(--text3)', fontSize: '0.75rem’, textTransform: 'uppercase’, letterSpacing: '0.1em’, marginBottom: '0.5rem’ }}>History Optional</div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem’, fontWeight: 700, color: 'var(--text)', marginBottom: '0.5rem’ }}>Historical Timeline</h1>
        <p style={{ color: 'var(--text2)', fontSize: '0.9rem’ }}>{events.length} events from 2500 BCE to 1991 CE to 1991 CE</p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex’, gap: '0.75rem’, marginBottom: '2rem’, flexWrap: 'wrap’, alignItems: 'center’ }}>
        <select value={filterSection} onChange={e => setFilterSection(e.target.value)} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 6, padding: '0.5rem 0.75rem’, color: 'var(--text)', fontSize: '0.875rem’, cursor: 'pointer’ }}>
          <option value="all">All Sections</option>
          {SECTIONS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 6, padding: '0.5rem 0.75rem’, color: 'var(--text)', fontSize: '0.875rem’, cursor: 'pointer’ }}>
          <option value="all">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <span style={{ color: 'var(--text3)', fontSize: '0.8rem’, marginLeft: '0.5rem’ }}>{filtered.length} events</span>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex’, flexWrap: 'wrap’, gap: '0.5rem’, marginBottom: '2rem’ }}>
        {CATEGORIES.filter(c => filterCategory === 'all’ || c === filterCategory).map(cat => (
          <span key={cat} style={{
            display: 'flex’, alignItems: 'center’, gap: '0.35rem’,
            fontSize: '0.72rem’, color: 'var(--text2)',
            padding: '3px 8px’, borderRadius: 20,
            background: 'var(--bg2)', border: '1px solid var(--border)',
          }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: CATEGORY_COLORS[cat] || 'var(--accent)', flexShrink: 0 }} />
            {cat}
          </span>
        ))}
      </div>

      {/* Timeline */}
      <div style={{ position: 'relative’ }}>
        {/* Center line */}
        <div style={{
          position: 'absolute’,
          left: '50%',
          top: 0, bottom: 0,
          width: 2,
          background: 'linear-gradient(to bottom, transparent, var(--border) 5%, var(--border) 95%, transparent)',
          transform: 'translateX(-50%)',
        }} />

        <div style={{ display: 'flex’, flexDirection: 'column’, gap: '0.5rem’ }}>
          {filtered.map((event, i) => (
            <div key={i} style={{
              display: 'flex’,
              justifyContent: i % 2 === 0 ? 'flex-start’ : 'flex-end’,
              position: 'relative’,
            }}>
              {/* Year label on center */}
              <div style={{
                position: 'absolute’,
                left: '50%', transform: 'translateX(-50%)',
                top: '50%', marginTop: -12,
                background: 'var(--bg)',
                border: `2px solid ${CATEGORY_COLORS[event.category] || 'var(--accent)'}`,
                borderRadius: '50%',
                width: 12, height: 12,
                zIndex: 2,
                cursor: 'pointer’,
                transition: 'transform 0.15s’,
              }}
              onClick={() => setSelected(selected?.title === event.title ? null : event)}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateX(-50%) scale(1.5)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateX(-50%) scale(1)'; }}
              />

              {/* Card */}
              <div style={{
                width: 'calc(50% - 2rem)',
                marginLeft: i % 2 === 0 ? 0 : 'auto’,
                marginRight: i % 2 !== 0 ? 0 : 'auto’,
                background: selected?.title === event.title ? 'var(--bg3)' : 'var(--bg2)',
                border: `1px solid ${selected?.title === event.title ? CATEGORY_COLORS[event.category] : 'var(--border)'}`,
                borderRadius: 8,
                padding: '0.85rem 1.1rem’,
                cursor: 'pointer’,
                transition: 'all 0.15s’,
              }}
              onClick={() => setSelected(selected?.title === event.title ? null : event)}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = CATEGORY_COLORS[event.category] || 'var(--accent)'; }}
              onMouseLeave={e => { if (selected?.title !== event.title) (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; }}
              >
                <div style={{ display: 'flex’, justifyContent: 'space-between’, alignItems: 'flex-start’, gap: '0.5rem’, marginBottom: '0.35rem’, flexWrap: 'wrap’ }}>
                  <span style={{
                    fontSize: '0.7rem’, fontFamily: 'var(--font-mono)',
                    color: CATEGORY_COLORS[event.category] || 'var(--accent)',
                    background: `${CATEGORY_COLORS[event.category]}18`,
                    border: `1px solid ${CATEGORY_COLORS[event.category]}40`,
                    padding: '1px 7px’, borderRadius: 3,
                  }}>{event.yearLabel}</span>
                  <span style={{ fontSize: '0.68rem’, color: 'var(--text3)', background: 'var(--bg3)', border: '1px solid var(--border)', padding: '1px 6px’, borderRadius: 3 }}>{event.category}</span>
                </div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--text)', fontSize: '0.9rem’, marginBottom: '0.3rem’, lineHeight: 1.3 }}>
                  {event.title}
                </div>
                {selected?.title === event.title && (
                  <div style={{ color: 'var(--text2)', fontSize: '0.82rem’, lineHeight: 1.5, marginTop: '0.4rem’, borderTop: '1px solid var(--border)', paddingTop: '0.5rem’ }}>
                    {event.description}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
