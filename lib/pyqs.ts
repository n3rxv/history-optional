export type PYQ = {
  year: number;
  paper: 1 | 2;
  section: string;
  question: string;
  marks: number;
  topic: string;
};

export const pyqs: PYQ[] = [
  { year: 2023, paper: 1, section: 'Ancient India', question: 'Discuss the religious and philosophical ideas of the Upanishads. How did they influence later Indian thought?', marks: 20, topic: 'Aryans and Vedic Period' },
  { year: 2023, paper: 1, section: 'Ancient India', question: 'Evaluate the significance of Ashoka\'s Dhamma as a policy of statecraft.', marks: 20, topic: 'Mauryan Empire' },
  { year: 2023, paper: 1, section: 'Medieval India', question: 'How did the Bhakti movement contribute to social reform in medieval India?', marks: 20, topic: 'Cultural Traditions in India (750–1200)' },
  { year: 2023, paper: 2, section: 'Modern India', question: 'Critically examine the nature and causes of the Revolt of 1857. Was it a mutiny or a national uprising?', marks: 20, topic: 'Indian Response to British Rule' },
  { year: 2023, paper: 2, section: 'Modern India', question: 'Analyse the role of Mahatma Gandhi in transforming the character of the Indian National Movement.', marks: 20, topic: 'Rise of Gandhi & Gandhian Nationalism' },
  { year: 2023, paper: 2, section: 'World History', question: 'Discuss the causes and consequences of the Russian Revolution of 1917.', marks: 20, topic: 'Revolution and Counter-Revolution' },
  { year: 2022, paper: 1, section: 'Ancient India', question: 'Examine the town planning of the Indus Valley Civilization. What does it reveal about the social and economic life of its people?', marks: 20, topic: 'Indus Valley Civilization' },
  { year: 2022, paper: 1, section: 'Ancient India', question: 'Trace the rise and fall of the Mauryan Empire. What were the factors responsible for its decline?', marks: 20, topic: 'Mauryan Empire' },
  { year: 2022, paper: 1, section: 'Medieval India', question: 'Discuss the agrarian and economic measures of Alauddin Khalji. How did they affect the economy of the Delhi Sultanate?', marks: 20, topic: 'The Fourteenth Century' },
  { year: 2022, paper: 1, section: 'Medieval India', question: 'Assess the significance of the Mansabdari system in the Mughal administration.', marks: 20, topic: 'Akbar' },
  { year: 2022, paper: 2, section: 'Modern India', question: 'Examine the economic impact of British colonialism on India with special reference to de-industrialization and drain of wealth.', marks: 20, topic: 'Economic Impact of British Colonial Rule' },
  { year: 2022, paper: 2, section: 'World History', question: 'Analyse the causes and consequences of the First World War. How did it change the political map of Europe?', marks: 20, topic: 'World Wars' },
  { year: 2021, paper: 1, section: 'Ancient India', question: 'What were the main features of the Vedic religion? How did it evolve from the Rig Vedic to the Later Vedic period?', marks: 20, topic: 'Aryans and Vedic Period' },
  { year: 2021, paper: 1, section: 'Medieval India', question: 'Examine the nature and extent of the Chola state. How did the Cholas manage their extensive empire?', marks: 20, topic: 'Early Medieval India (750–1200)' },
  { year: 2021, paper: 2, section: 'Modern India', question: 'Evaluate the role of the Indian National Congress in the Freedom Struggle from its inception to 1920.', marks: 20, topic: 'Birth of Indian Nationalism' },
  { year: 2021, paper: 2, section: 'World History', question: 'Discuss the factors responsible for the rise of Fascism in Italy and Germany. How did it lead to the Second World War?', marks: 20, topic: 'Revolution and Counter-Revolution' },
  { year: 2020, paper: 1, section: 'Ancient India', question: 'Discuss the main features of the Gupta administration. How did the Gupta period become the Golden Age of India?', marks: 20, topic: 'Guptas, Vakatakas and Vardhanas' },
  { year: 2020, paper: 2, section: 'Modern India', question: 'Analyse the social and religious reform movements of the 19th century. How did they contribute to the emergence of Indian nationalism?', marks: 20, topic: 'Social & Religious Reform Movements' },
  { year: 2020, paper: 2, section: 'World History', question: 'Trace the process of decolonization in Africa after the Second World War.', marks: 20, topic: 'Liberation from Colonial Rule' },
  { year: 2019, paper: 1, section: 'Ancient India', question: 'Discuss the origin and spread of Buddhism. What were the causes of its decline in India?', marks: 20, topic: 'Period of Mahajanapadas' },
];

export const pyqYears = [...new Set(pyqs.map(q => q.year))].sort((a, b) => b - a);
export const pyqTopics = [...new Set(pyqs.map(q => q.topic))].sort();
