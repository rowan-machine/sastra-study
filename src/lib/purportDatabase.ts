// Purport knowledge database — key concepts from Prabhupāda's purports
// Organized by chapter for dynamic quiz generation based on reading progress

export interface PurportInsight {
  chapter: number;
  verseRange: string; // e.g. "2.11-2.30" or "3.27"
  book: "BG" | "SB";
  topic: string;
  question: string;
  correctAnswer: string;
  wrongAnswers: string[];
  explanation: string;
  category: "philosophy" | "practice" | "history" | "terminology" | "application";
}

// BG purport-based questions — key teachings a student should absorb
export const bgPurportInsights: PurportInsight[] = [
  // Chapter 1
  {
    chapter: 1,
    verseRange: "1.1",
    book: "BG",
    topic: "Significance of Kurukṣetra",
    question: "According to Prabhupāda's purport, why is the word 'dharma-kṣetre' significant in the very first verse?",
    correctAnswer: "Kurukṣetra is a place of pilgrimage where religious acts are amplified — Dhṛtarāṣṭra feared the holy place would influence the outcome in favor of the Pāṇḍavas",
    wrongAnswers: [
      "It simply describes the geographical location of the battlefield",
      "It indicates that the war was being fought for religious purposes by both sides",
      "It refers to the fact that Kṛṣṇa was present, making it automatically a holy place",
    ],
    explanation: "Dhṛtarāṣṭra was worried because a holy place (dharma-kṣetra) naturally favors the righteous. The pious Pāṇḍavas would benefit from the spiritual atmosphere.",
    category: "philosophy",
  },
  // Chapter 2
  {
    chapter: 2,
    verseRange: "2.11-2.30",
    book: "BG",
    topic: "The soul's nature",
    question: "According to the purport of BG 2.12, what is the key philosophical refutation Prabhupāda makes against Māyāvāda?",
    correctAnswer: "Kṛṣṇa clearly states individuality of all souls in past, present, and future — refuting the idea that we merge into one impersonal Brahman",
    wrongAnswers: [
      "The soul is temporary and created at birth by the combination of matter",
      "All living entities are one soul appearing as many through the illusion of māyā",
      "Individual identity only exists in the material world and ceases after liberation",
    ],
    explanation: "Prabhupāda emphasizes that Kṛṣṇa uses plural 'all of us' — individuality is eternal, not a product of illusion. This directly refutes Śaṅkara's monism.",
    category: "philosophy",
  },
  {
    chapter: 2,
    verseRange: "2.13",
    book: "BG",
    topic: "Transmigration",
    question: "What practical example does Prabhupāda use in the purport to BG 2.13 to explain transmigration?",
    correctAnswer: "The body changes from childhood to youth to old age — just as we accept these changes without losing identity, the soul similarly accepts a new body at death",
    wrongAnswers: [
      "Water evaporating and condensing into rain shows how the soul cycles between states",
      "A caterpillar becoming a butterfly demonstrates complete transformation of identity",
      "Changing clothes is the only analogy used — the soul puts on new bodies like garments",
    ],
    explanation: "The within-one-lifetime body changes (childhood→youth→old age) are used as direct proof that consciousness continues despite bodily transformation.",
    category: "philosophy",
  },
  {
    chapter: 2,
    verseRange: "2.40",
    book: "BG",
    topic: "Devotional service safety",
    question: "What does Prabhupāda explain about spiritual activities in the purport to BG 2.40 ('In this endeavor there is no loss or diminution')?",
    correctAnswer: "Unlike material activities, any spiritual progress made is permanent — even a small beginning is never lost and carries forward to the next life",
    wrongAnswers: [
      "Spiritual progress is only kept if one completes the entire path in one lifetime",
      "The benefit only applies to those who have taken formal initiation from a guru",
      "Only activities performed in Kṛṣṇa consciousness after liberation are permanent",
    ],
    explanation: "Prabhupāda emphasizes the 'spiritual bank account' — even svalpam apy asya dharmasya (a little devotional service) protects from the greatest fear.",
    category: "practice",
  },
  {
    chapter: 2,
    verseRange: "2.41",
    book: "BG",
    topic: "Intelligence in Kṛṣṇa consciousness",
    question: "What does 'vyavasāyātmikā buddhiḥ' mean and why is it singular according to Prabhupāda's purport?",
    correctAnswer: "Resolute intelligence in devotional service — it is one-pointed because the goal is singular (serving Kṛṣṇa), unlike material intelligence which branches into unlimited desires",
    wrongAnswers: [
      "It means the intelligence to perform karma-yoga without attachment to results",
      "It refers to academic study of scripture as the primary means of self-realization",
      "It describes the intelligence of yogīs who focus on the Supersoul through meditation",
    ],
    explanation: "Those resolute in purpose have only one aim — satisfying Kṛṣṇa. The many-branched intelligence of the irresolute comes from unlimited material desires.",
    category: "terminology",
  },
  {
    chapter: 2,
    verseRange: "2.47",
    book: "BG",
    topic: "Karma-yoga",
    question: "In the purport to BG 2.47, what does Prabhupāda say is the REAL meaning of 'you have a right to work but not the fruits'?",
    correctAnswer: "One should work only for the satisfaction of Kṛṣṇa (the master) — we are servants, and a servant has no independent right to the results of work done for the master",
    wrongAnswers: [
      "One should work without any motivation at all and simply perform duty mechanically",
      "The fruits belong to society, so all earnings should be donated to charitable causes",
      "One should expect results but not become attached — work hard but maintain detachment through meditation",
    ],
    explanation: "Prabhupāda explains this as the master-servant relationship with Kṛṣṇa, not mere stoic indifference. The alternative to working for Kṛṣṇa is not 'no motivation' but working in His service.",
    category: "application",
  },
  {
    chapter: 2,
    verseRange: "2.62-63",
    book: "BG",
    topic: "Degradation sequence",
    question: "What is the complete sequence of degradation described in BG 2.62-63 that Prabhupāda elaborates in the purport?",
    correctAnswer: "Contemplation → attachment → lust → anger → delusion → bewilderment of memory → loss of intelligence → fall down",
    wrongAnswers: [
      "Desire → greed → jealousy → hatred → violence → self-destruction",
      "Ignorance → passion → attachment → ego → suffering → death → rebirth",
      "Sense contact → pleasure → addiction → pain → depression → material bondage",
    ],
    explanation: "This is the precise chain: thinking about sense objects creates attachment, from attachment comes lust, frustrated lust produces anger, then delusion, memory loss, intelligence loss, and finally one falls back into the material pool.",
    category: "philosophy",
  },
  // Chapter 3
  {
    chapter: 3,
    verseRange: "3.9",
    book: "BG",
    topic: "Yajña and duty",
    question: "According to Prabhupāda's purport to BG 3.9, what is the difference between work done as yajña and ordinary work?",
    correctAnswer: "Work done for the satisfaction of Viṣṇu (yajña) liberates — all other work, however pious, creates karmic bondage in the material world",
    wrongAnswers: [
      "Yajña means fire sacrifice only — other forms of worship are secondary",
      "Any charitable work automatically qualifies as yajña regardless of consciousness",
      "Yajña is only relevant for brāhmaṇas; other varṇas serve through their occupational duty alone",
    ],
    explanation: "Prabhupāda explains yajñārthāt karmaṇo 'nyatra — only work for Viṣṇu is free from reaction. Even good deeds done without Kṛṣṇa consciousness bind one.",
    category: "practice",
  },
  {
    chapter: 3,
    verseRange: "3.21",
    book: "BG",
    topic: "Leadership by example",
    question: "What principle does Prabhupāda emphasize in the purport to BG 3.21 about why leaders must be careful in their behavior?",
    correctAnswer: "Common people follow the standards set by great personalities — a leader's personal behavior becomes the standard for all of society",
    wrongAnswers: [
      "Leaders should hide their spiritual practices to avoid disturbing materialistic people",
      "Only sannyāsīs and brāhmaṇas are considered leaders; others are followers by nature",
      "The principle applies only to political leaders, not spiritual practitioners",
    ],
    explanation: "Prabhupāda uses this verse to explain why ācāryas and devotees must maintain high standards — people naturally imitate those they respect.",
    category: "application",
  },
  {
    chapter: 3,
    verseRange: "3.37-43",
    book: "BG",
    topic: "Lust as the eternal enemy",
    question: "In the purport to BG 3.37, what does Prabhupāda identify as the origin of lust (kāma)?",
    correctAnswer: "Lust is a perverted reflection of love of God — pure love for Kṛṣṇa, when in contact with the mode of passion, transforms into lust",
    wrongAnswers: [
      "Lust is a natural part of the soul's constitution that must be entirely destroyed",
      "Lust comes from the physical body and has no connection to the spirit soul",
      "Lust is created by association with women and can be removed only by complete celibacy",
    ],
    explanation: "This is a key teaching: kāma is not inherently evil — it is love of God covered by material contamination. The solution is not suppression but redirecting it to Kṛṣṇa.",
    category: "philosophy",
  },
  // Chapter 4
  {
    chapter: 4,
    verseRange: "4.1-3",
    book: "BG",
    topic: "Paramparā system",
    question: "What is the significance of the disciplic succession (paramparā) as explained in the purport to BG 4.1-2?",
    correctAnswer: "Transcendental knowledge must be received through an authorized chain of teachers — it cannot be understood by mental speculation, and the chain must be unbroken",
    wrongAnswers: [
      "Any sincere student can understand the Gītā directly without a teacher if they are intelligent enough",
      "The paramparā only preserves the Sanskrit text — the meaning can be independently interpreted",
      "The disciplic succession is a formality; the real qualification is academic scholarship",
    ],
    explanation: "Prabhupāda stresses evaṁ paramparā-prāptam — the science was received through succession. When the chain breaks, the Lord Himself re-establishes it.",
    category: "philosophy",
  },
  {
    chapter: 4,
    verseRange: "4.7-8",
    book: "BG",
    topic: "Kṛṣṇa's appearance",
    question: "What does Prabhupāda clarify about Kṛṣṇa's 'birth' in the purport to BG 4.6-9?",
    correctAnswer: "Kṛṣṇa's appearance is not an ordinary birth — He appears in His original transcendental form by His internal potency, not forced by karma like conditioned souls",
    wrongAnswers: [
      "Kṛṣṇa takes birth in a material body just like us but is God inside it",
      "Kṛṣṇa only appears as an avatāra — His original form never comes to the material world",
      "The appearance of Kṛṣṇa is a symbolic story, not a literal historical event",
    ],
    explanation: "Prabhupāda emphasizes sambhavāmy ātma-māyayā — Kṛṣṇa appears by His own internal energy. His body is sac-cid-ānanda, not material.",
    category: "philosophy",
  },
  {
    chapter: 4,
    verseRange: "4.34",
    book: "BG",
    topic: "Approaching a spiritual master",
    question: "According to Prabhupāda's purport to BG 4.34, what are the THREE requirements for receiving knowledge from a guru?",
    correctAnswer: "Praṇipāta (surrender/obeisances), paripraśna (submissive inquiry), and sevā (render service) — one must approach with humility, ask relevant questions, and serve",
    wrongAnswers: [
      "Pay dakṣiṇā, memorize scriptures, and pass an examination administered by the guru",
      "Blind faith, complete silence, and physical proximity to the guru at all times",
      "Academic study, philosophical debate, and independent verification of teachings",
    ],
    explanation: "These three — surrender, inquiry, and service — form the basis of the guru-disciple relationship. Without them, knowledge cannot be properly transmitted.",
    category: "practice",
  },
  // Chapter 5
  {
    chapter: 5,
    verseRange: "5.29",
    book: "BG",
    topic: "Three aspects of God consciousness",
    question: "In the purport to BG 5.29, what three roles of Kṛṣṇa does Prabhupāda say bring peace when understood?",
    correctAnswer: "Bhoktā (enjoyer of all sacrifices), Maheśvara (supreme owner of all planets), and Suhṛdaṁ sarva-bhūtānām (well-wisher of all beings)",
    wrongAnswers: [
      "Creator, Maintainer, and Destroyer — the three functions of the material world",
      "Paramātmā, Brahman, and Bhagavān — the three aspects of the Absolute Truth",
      "Father, Teacher, and Judge — the three relationships God has with all souls",
    ],
    explanation: "Understanding Kṛṣṇa as the ultimate enjoyer, proprietor, and friend of all beings is the formula for peace. Without this, one will always be disturbed.",
    category: "philosophy",
  },
  // Chapter 6
  {
    chapter: 6,
    verseRange: "6.47",
    book: "BG",
    topic: "Highest yogī",
    question: "According to Prabhupāda's purport to BG 6.47, who is the highest yogī and why?",
    correctAnswer: "The bhakti-yogī who constantly thinks of Kṛṣṇa with faith — because all other yoga systems are means to reach this point of pure devotion",
    wrongAnswers: [
      "The aṣṭāṅga-yogī who can sit in samādhi for unlimited time periods",
      "The jñāna-yogī who has realized the impersonal Brahman beyond material nature",
      "The karma-yogī who performs all actions without any desire for personal benefit",
    ],
    explanation: "Prabhupāda explains that bhakti-yoga is the culmination of all yoga. The word 'śraddhāvān' (with faith) indicates the simplicity of the path — no need for gymnastic postures.",
    category: "philosophy",
  },
  // Chapter 7
  {
    chapter: 7,
    verseRange: "7.14",
    book: "BG",
    topic: "Crossing māyā",
    question: "According to the purport of BG 7.14, what is the ONLY way to cross over the divine material energy (māyā)?",
    correctAnswer: "Surrendering to Kṛṣṇa (mām eva ye prapadyante) — māyā cannot be overcome by jñāna, yoga, or any independent endeavor",
    wrongAnswers: [
      "Cultivating knowledge of the difference between matter and spirit through intense study",
      "Practicing severe austerities and penances to purify the material body",
      "Accumulating enough pious credits through charitable work over many lifetimes",
    ],
    explanation: "Prabhupāda is emphatic: no one can break free of māyā by their own efforts. Only by surrender to Kṛṣṇa does māyā release the conditioned soul.",
    category: "practice",
  },
  {
    chapter: 7,
    verseRange: "7.15",
    book: "BG",
    topic: "Four types of miscreants",
    question: "What are the four types of miscreants (duṣkṛtinaḥ) who do not surrender to Kṛṣṇa as described in BG 7.15?",
    correctAnswer: "Mūḍhas (grossly foolish), narādhamās (lowest of mankind), māyayāpahṛta-jñānās (knowledge stolen by illusion), and āsuraṁ bhāvam āśritāḥ (atheistic by nature)",
    wrongAnswers: [
      "The poor, the sick, the ignorant, and the powerful — those distracted by circumstance",
      "Karmīs, jñānīs, yogīs, and impersonalists — those pursuing incorrect paths",
      "Brāhmaṇas, kṣatriyas, vaiśyas, and śūdras who fail to follow their varṇāśrama duties",
    ],
    explanation: "Despite human intelligence, these four categories refuse to surrender: the foolish, the degraded, those whose knowledge is covered, and the demoniac.",
    category: "terminology",
  },
  // Chapter 8
  {
    chapter: 8,
    verseRange: "8.5-6",
    book: "BG",
    topic: "Consciousness at death",
    question: "What practical instruction does Prabhupāda give in the purport to BG 8.5-6 about thinking of Kṛṣṇa at death?",
    correctAnswer: "One must practice thinking of Kṛṣṇa throughout life (by chanting Hare Kṛṣṇa) — it is not possible to suddenly remember God at death without lifelong practice",
    wrongAnswers: [
      "Simply hearing the holy name once at the moment of death guarantees liberation regardless of one's life",
      "One should meditate on the impersonal Brahman effulgence to merge into the spiritual energy",
      "A priest performing last rites can transfer one's consciousness to Kṛṣṇa regardless of the dying person's state",
    ],
    explanation: "Prabhupāda stresses abhyāsa-yoga — practice. The chanting of Hare Kṛṣṇa throughout life trains the mind so it naturally goes to Kṛṣṇa at the critical moment of death.",
    category: "practice",
  },
  // Chapter 9
  {
    chapter: 9,
    verseRange: "9.2",
    book: "BG",
    topic: "King of knowledge",
    question: "Why does Prabhupāda call the ninth chapter 'the most confidential' knowledge?",
    correctAnswer: "It directly reveals Kṛṣṇa's personal relationship with the devotee — not just philosophical truth but the intimate exchange of pure devotional service",
    wrongAnswers: [
      "It contains the most difficult Sanskrit terminology requiring advanced scholarship",
      "It was originally only spoken to sannyāsīs and not meant for householders",
      "It describes yoga techniques that are dangerous if practiced without supervision",
    ],
    explanation: "Rāja-vidyā, rāja-guhyam — king of education, king of secrets. This knowledge is both supreme and intimate because it establishes the personal loving relationship with God.",
    category: "philosophy",
  },
  {
    chapter: 9,
    verseRange: "9.26",
    book: "BG",
    topic: "Simple offerings to Kṛṣṇa",
    question: "In the purport to BG 9.26, what key point does Prabhupāda make about WHY Kṛṣṇa only mentions simple vegetarian offerings?",
    correctAnswer: "Kṛṣṇa specifies 'leaf, flower, fruit, water' to indicate He only accepts vegetarian offerings made with love — this is the basis for devotees' vegetarian diet",
    wrongAnswers: [
      "These are symbolic representations of the four elements, not actual food items",
      "Kṛṣṇa was speaking to Arjuna who was poor and could only afford simple things",
      "Any food can be offered as long as a priest chants the right mantras over it",
    ],
    explanation: "Prabhupāda explains that Kṛṣṇa deliberately excludes meat, fish, and eggs. The principle is 'with love and devotion' (bhaktyā) — even the simplest offering with devotion pleases Him.",
    category: "practice",
  },
  {
    chapter: 9,
    verseRange: "9.30",
    book: "BG",
    topic: "The fallen devotee",
    question: "According to Prabhupāda's purport to BG 9.30, how should we understand 'even if a devotee commits the most abominable action'?",
    correctAnswer: "An accidental falldown by a sincere devotee is not the same as habitual sin — his determination to serve Kṛṣṇa will quickly correct him; this is NOT a license to sin intentionally",
    wrongAnswers: [
      "A devotee can do anything wrong because devotional service automatically nullifies all reactions",
      "This verse only applies to liberated souls, not conditioned devotees still in the material world",
      "The 'abominable action' refers only to accidentally eating non-vegetarian food, nothing else",
    ],
    explanation: "Prabhupāda is careful: this is not a license for sinning on the strength of chanting. It means that if a sincere devotee accidentally falls, his bhakti will correct him — sādhu eva sa mantavyaḥ.",
    category: "application",
  },
  // Chapter 10
  {
    chapter: 10,
    verseRange: "10.8-11",
    book: "BG",
    topic: "Buddhi-yoga",
    question: "According to Prabhupāda's purport to BG 10.10, what is 'buddhi-yoga' that Kṛṣṇa gives to His devotees?",
    correctAnswer: "Devotional service itself — Kṛṣṇa from within the heart gives intelligence by which the devotee can come to Him; it is not mere intellectual understanding",
    wrongAnswers: [
      "A mystical power that allows the yogī to read minds and predict the future",
      "The academic ability to understand complex Vedānta philosophy through Sanskrit scholarship",
      "The eight mystic perfections (siddhis) given to advanced meditators",
    ],
    explanation: "Dadāmi buddhi-yogaṁ tam — Kṛṣṇa personally guides sincere devotees from within. This is practical: when you serve Him sincerely, He removes obstacles and gives direction.",
    category: "practice",
  },
  // Chapter 12
  {
    chapter: 12,
    verseRange: "12.8-12",
    book: "BG",
    topic: "Progressive practice",
    question: "What step-by-step progression does Prabhupāda outline in the purport to BG 12.8-12 for one who cannot fix the mind on Kṛṣṇa?",
    correctAnswer: "Fix mind on Kṛṣṇa → if not, practice regulative bhakti-yoga → if not, work for Kṛṣṇa → if not, give up fruits of action",
    wrongAnswers: [
      "Study scripture → take initiation → become a sannyāsī → achieve liberation",
      "Practice aṣṭāṅga-yoga → achieve samādhi → then transfer to bhakti-yoga",
      "Charity → penance → pilgrimage → finally meditation on the impersonal Brahman",
    ],
    explanation: "Prabhupāda shows Kṛṣṇa's compassionate step-down process: each level accommodates less capacity, ensuring everyone has a path to spiritual advancement.",
    category: "practice",
  },
  // Chapter 18
  {
    chapter: 18,
    verseRange: "18.54-55",
    book: "BG",
    topic: "Beyond Brahman realization",
    question: "In the purport to BG 18.54-55, what does Prabhupāda say comes AFTER Brahman realization?",
    correctAnswer: "Pure devotional service (bhakti) — Brahman realization is not the final stage; one must advance to serving the Supreme Person to enter the kingdom of God",
    wrongAnswers: [
      "Merging into the impersonal Brahman effulgence is the ultimate and final goal",
      "One becomes God and creates their own spiritual planet to enjoy",
      "One enters an eternal state of unconscious bliss without any activity or relationship",
    ],
    explanation: "Prabhupāda explains that brahma-bhūtaḥ prasannātmā is a stage, not the goal. After becoming joyful through Brahman realization, one engages in parā bhakti — transcendental service.",
    category: "philosophy",
  },
  {
    chapter: 18,
    verseRange: "18.66",
    book: "BG",
    topic: "Surrender",
    question: "According to Prabhupāda's purport to BG 18.66, what are the six symptoms of śaraṇāgati (surrender)?",
    correctAnswer: "Accept what is favorable for devotion, reject what is unfavorable, believe Kṛṣṇa will protect, accept Kṛṣṇa as maintainer, full self-surrender, and humility",
    wrongAnswers: [
      "Chanting 16 rounds, following 4 regulative principles, attending maṅgala-āratī, reading daily, service, and preaching",
      "Renouncing family, giving up wealth, shaving the head, wearing saffron, begging alms, and living in a temple",
      "Studying Vedānta, practicing yoga, performing fire sacrifice, visiting holy places, bathing in sacred rivers, and fasting",
    ],
    explanation: "The six limbs of surrender (ṣaḍ-vidha śaraṇāgati) are: ānukūlyasya saṅkalpaḥ, prātikūlyasya varjanam, rakṣiṣyatīti viśvāsaḥ, goptṛtve varaṇam, ātma-nikṣepa, kārpaṇya.",
    category: "terminology",
  },
];

/**
 * Get purport insights for a given chapter range.
 */
export function getPurportInsights(
  book: "BG" | "SB",
  startCh: number,
  endCh: number
): PurportInsight[] {
  const db = book === "BG" ? bgPurportInsights : [];
  return db.filter((p) => p.chapter >= startCh && p.chapter <= endCh);
}

/**
 * Get all purport insights for a set of chapters.
 */
export function getPurportInsightsForChapters(
  book: "BG" | "SB",
  chapters: number[]
): PurportInsight[] {
  const db = book === "BG" ? bgPurportInsights : [];
  return db.filter((p) => chapters.includes(p.chapter));
}
