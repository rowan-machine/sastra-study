export interface SampradayaFigure {
  id: string;
  name: string;
  sanskrit?: string;
  title?: string;
  role?: string;
  description: string;
  photo?: string; // URL to a portrait image
  keyEvents?: string[]; // notable events / contributions
  // Image map hotspot relative to the 630x960 poster
  // All values are in original image pixels
  area: { shape: "rect" | "circle" | "poly"; coords: string };
  group: "four" | "gaudiya";
}

export interface Sampradaya {
  id: string;
  name: string;
  sanskrit?: string;
  founder: string;
  summary: string;
  keyExponents: string[];
  figures: SampradayaFigure[];
}

// The four Vaiṣṇava sampradāyas and the Brahma-Madhva-Gauḍīya disciplic succession.
// Coordinates are approximate for the 630x960 poster (Disciplic-Succession-Sampradaya-2.jpg).
// Adjust them in src/lib/sampradaya.ts if the layout differs on your image.

export const fourSampradayas: Sampradaya[] = [
  {
    id: "brahma",
    name: "Brahma Sampradāya",
    sanskrit: "ब्रह्म सम्प्रदाय",
    founder: "Lord Brahmā",
    summary: "The disciplic succession that descends from Lord Brahmā, the first created being. It was later represented by Madhvācārya and eventually flowered into the Gauḍīya Vaiṣṇava tradition through Śrī Caitanya Mahāprabhu.",
    keyExponents: ["Brahmā", "Nārada", "Vyāsa", "Madhva", "Mādhavendra Purī", "Śrī Caitanya Mahāprabhu"],
    figures: [],
  },
  {
    id: "sri",
    name: "Śrī Sampradāya",
    sanskrit: "श्री सम्प्रदाय",
    founder: "Goddess Lakṣmī (Śrī)",
    summary: "The disciplic succession originating from Lakṣmī, the goddess of fortune and consort of Lord Viṣṇu. It is most widely known through Rāmānujācārya and the Śrī Vaiṣṇava tradition.",
    keyExponents: ["Lakṣmī", "Rāmānuja", "Śrī Vaiṣṇavas"],
    figures: [],
  },
  {
    id: "rudra",
    name: "Rudra Sampradāya",
    sanskrit: "रुद्र सम्प्रदाय",
    founder: "Lord Rudra (Śiva)",
    summary: "The disciplic succession that comes from Lord Śiva. It was later represented by Viṣṇusvāmī and the Vallabha-sampradāya, emphasizing the mercy and opulence of the Lord.",
    keyExponents: ["Rudra/Śiva", "Viṣṇusvāmī", "Vallabha"],
    figures: [],
  },
  {
    id: "kumara",
    name: "Kumāra Sampradāya",
    sanskrit: "कुमार सम्प्रदाय",
    founder: "The four Kumāras",
    summary: "The disciplic succession originating from the four Kumāras, eternal celibate sons of Brahmā. It is most known through Nimbārkācārya and the dvaitādvaita school.",
    keyExponents: ["Sanat-kumāra", "Sanaka", "Sanandana", "Sanātana", "Nimbārka"],
    figures: [],
  },
];

export const gaudiyaLineage: SampradayaFigure[] = [
  { id: "krsna", name: "Śrī Kṛṣṇa", sanskrit: "कृष्ण", title: "The Supreme Personality of Godhead", role: "source of all sampradāyas", description: "The original source of all Vedic knowledge and the root of every bona fide disciplic succession. He spoke the Bhagavad-gītā to Arjuna and reappears as Śrī Caitanya Mahāprabhu to teach pure love of God.", photo: "/images/gurus/krishna.png", keyEvents: ["Spoke the Bhagavad-gītā to Arjuna on the battlefield of Kurukṣetra", "Performed childhood pastimes in Vṛndāvana with the gopīs and gopas", "Lifted Govardhana Hill to protect the residents of Vraja", "Killed the demon Kaṁsa and liberated His parents", "Established Dvārakā as His capital city", "Enacted the rāsa-līlā — the highest expression of divine love", "Reappeared as Śrī Caitanya Mahāprabhu in Kali-yuga"], area: { shape: "rect", coords: "12,5,133,140" }, group: "gaudiya" },
  { id: "brahma", name: "Lord Brahmā", sanskrit: "ब्रह्मा", title: "The first created being", role: "first ācārya of the Brahma-sampradāya", description: "The senior-most disciple of the Lord and the father of all living beings. He received the Vedic knowledge from Kṛṣṇa and initiated the Brahma-sampradāya.", photo: "/images/gurus/brahma.jpg", keyEvents: ["Received the Vedic seed knowledge (catuḥ-ślokī) directly from Kṛṣṇa", "Created the material universe and all species of life", "Sang the Brahma-saṁhitā (Chapter 5) in praise of Govinda", "Initiated Nārada Muni into the science of devotion", "Attempted to test Kṛṣṇa by hiding the cowherd boys and calves"], area: { shape: "rect", coords: "496,5,617,140" }, group: "gaudiya" },
  { id: "narada", name: "Nārada Muni", sanskrit: "नारद", title: "The great sage and transcendental spaceman", role: "disciple of Brahmā", description: "A perfect devotee who travels the universe chanting the holy name. He taught the philosophy of pure devotion to Vyāsadeva.", keyEvents: ["Received initiation from Brahmā and later directly from Kṛṣṇa", "Authored the Nārada-bhakti-sūtra on the science of devotion", "Cursed Nālakūvara and Maṇigrīva, leading to their liberation by Kṛṣṇa", "Instructed Vyāsadeva to write the Śrīmad-Bhāgavatam", "Travels the three worlds chanting the names of Nārāyaṇa on his vīṇā"], area: { shape: "rect", coords: "12,142,133,277" }, group: "gaudiya" },
  { id: "vyasa", name: "Vyāsadeva", sanskrit: "व्यास", title: "Compiler of the Vedas", role: "disciple of Nārada", description: "The literary incarnation of God who compiled the Vedic literature, including the Śrīmad-Bhāgavatam, Mahābhārata, and Vedānta-sūtra.", photo: "/images/gurus/vyasadeva.jpg", keyEvents: ["Divided the one Veda into four — Ṛg, Yajur, Sāma, and Atharva", "Compiled the Vedānta-sūtra (Brahma-sūtra)", "Composed the Mahābhārata, including the Bhagavad-gītā", "Wrote the Śrīmad-Bhāgavatam — the ripened fruit of Vedic knowledge", "Composed the 18 Mahā-purāṇas", "Was instructed by Nārada to describe the glories of Kṛṣṇa directly"], area: { shape: "rect", coords: "133,142,254,277" }, group: "gaudiya" },
  { id: "madhva", name: "Madhvācārya", sanskrit: "मध्वाचार्य", title: "Founder of the Tattvavāda school", role: "disciple in the line of Vyāsa", description: "A 13th-century ācārya who established the philosophy of Dvaita Vedānta and forcefully preached the personal nature of the Supreme Lord.", keyEvents: ["Established the Dvaita (dualism) school of Vedānta philosophy", "Defeated the Advaita (monist) scholars in debate", "Wrote 37 commentaries on Vedic scriptures", "Visited Badarikāśrama and met Vyāsadeva personally", "Founded eight maṭhas (monasteries) in Uḍupī"], area: { shape: "rect", coords: "254,142,375,277" }, group: "gaudiya" },
  { id: "padmanabha", name: "Padmanābha Tīrtha", sanskrit: "पद्मनाभ", title: "Direct disciple of Madhva", role: "disciple of Madhva", description: "One of the first successors of Madhvācārya who helped preserve and propagate his teachings.", area: { shape: "rect", coords: "375,142,496,277" }, group: "gaudiya" },
  { id: "narahari", name: "Nṛhari Tīrtha", sanskrit: "नृहरि", title: "Disciple of Padmanābha", role: "disciple of Padmanābha", description: "A prominent ācārya in the Madhva line who continued the system of Vaiṣṇava discipline and scholarship.", area: { shape: "rect", coords: "496,142,617,277" }, group: "gaudiya" },
  { id: "madhava-t", name: "Mādhava Tīrtha", sanskrit: "माधव", title: "Successor of Nṛhari Tīrtha", role: "disciple of Nṛhari", description: "An important ācārya in the Brahma-sampradāya who upheld the teachings of his predecessors.", area: { shape: "rect", coords: "12,277,133,412" }, group: "gaudiya" },
  { id: "akshobhya", name: "Akṣobhya Tīrtha", sanskrit: "अक्षोभ्य", title: "Disciple of Mādhava Tīrtha", role: "disciple of Mādhava Tīrtha", description: "A revered teacher in the Madhva-Gauḍīya line who transmitted the teachings to Jaya-tīrtha.", area: { shape: "rect", coords: "133,277,254,412" }, group: "gaudiya" },
  { id: "jayatirtha", name: "Jaya-tīrtha", sanskrit: "जयतीर्थ", title: "Great commentator on Madhva's works", role: "disciple of Akṣobhya", description: "A brilliant scholar who wrote extensive commentaries and defended the Dvaita philosophy.", area: { shape: "rect", coords: "254,277,375,412" }, group: "gaudiya" },
  { id: "jnanasindhu", name: "Jñānasindhu", sanskrit: "ज्ञानसिन्धु", title: "Disciple of Jaya-tīrtha", role: "disciple of Jaya-tīrtha", description: "A teacher in the Brahma-sampradāya who carried the disciplic line forward.", area: { shape: "rect", coords: "375,277,496,412" }, group: "gaudiya" },
  { id: "dayanidhi", name: "Dayānidhi", sanskrit: "दयानिधि", title: "Disciple of Jñānasindhu", role: "disciple of Jñānasindhu", description: "An ācārya who continued the transmission of Vaiṣṇava siddhānta in the Brahma line.", area: { shape: "rect", coords: "496,277,617,412" }, group: "gaudiya" },
  { id: "vidyanidhi", name: "Vidyānidhi", sanskrit: "विद्यानिधि", title: "Disciple of Dayānidhi", role: "disciple of Dayānidhi", description: "A teacher who preserved the strict standard of Vaiṣṇava discipline.", area: { shape: "rect", coords: "12,412,133,547" }, group: "gaudiya" },
  { id: "rajendra", name: "Rājendra Tīrtha", sanskrit: "राजेन्द्र", title: "Disciple of Vidyānidhi", role: "disciple of Vidyānidhi", description: "An ācārya in the Madhva line who continued the paramparā.", area: { shape: "rect", coords: "133,412,254,547" }, group: "gaudiya" },
  { id: "jayadharma", name: "Jayadharma Tīrtha", sanskrit: "जयधर्म", title: "Disciple of Rājendra", role: "disciple of Rājendra", description: "A leading teacher in the Brahma-sampradāya who helped the line flourish in South India.", area: { shape: "rect", coords: "254,412,375,547" }, group: "gaudiya" },
  { id: "purushottama", name: "Puruṣottama Tīrtha", sanskrit: "पुरुषोत्तम", title: "Disciple of Jayadharma", role: "disciple of Jayadharma", description: "A dedicated Vaiṣṇava teacher who transmitted the knowledge to Brahmaṇya-tīrtha.", area: { shape: "rect", coords: "375,412,496,547" }, group: "gaudiya" },
  { id: "brahmanya", name: "Brahmaṇya Tīrtha", sanskrit: "ब्रह्मण्य", title: "Disciple of Puruṣottama", role: "disciple of Puruṣottama", description: "An ācārya in the Madhva line who continued the paramparā to Vyāsatīrtha.", area: { shape: "rect", coords: "496,412,617,547" }, group: "gaudiya" },
  { id: "vyasatirtha", name: "Vyāsatīrtha", sanskrit: "व्यासतीर्थ", title: "Preceptor of Vijaya-nagara", role: "disciple of Brahmaṇya", description: "A towering ācārya, scholar, and contemporary of Śrī Caitanya Mahāprabhu. He was instrumental in the flourishing of the Madhva tradition and gave Lakṣmīpati initiation.", area: { shape: "rect", coords: "12,547,133,682" }, group: "gaudiya" },
  { id: "lakshmipati", name: "Lakṣmīpati Tīrtha", sanskrit: "लक्ष्मीपति", title: "Disciple of Vyāsatīrtha", role: "disciple of Vyāsatīrtha", description: "A sannyāsī in the Brahma-sampradāya who initiated Mādhavendra Purī.", area: { shape: "rect", coords: "133,547,254,682" }, group: "gaudiya" },
  { id: "madhavendrapuri", name: "Mādhavendra Purī", sanskrit: "माधवेन्द्र पुरी", title: "Reviver of the prema-bhakti line", role: "disciple of Lakṣmīpati", description: "A revered sannyāsī who restored the spirit of pure devotion (prema-bhakti) within the Brahma-sampradāya. He initiated Īśvara Purī and Nīlāmbara Cakravartī.", area: { shape: "rect", coords: "254,547,375,682" }, group: "gaudiya" },
  { id: "isvarapuri", name: "Īśvara Purī", sanskrit: "ईश्वर पुरी", title: "Guru of Śrī Caitanya Mahāprabhu", role: "disciple of Mādhavendra Purī", description: "The initiating spiritual master of Śrī Caitanya Mahāprabhu. He taught the young Nimāi Paṇḍita the essence of pure devotion and the mantra of Kṛṣṇa.", area: { shape: "rect", coords: "375,547,496,682" }, group: "gaudiya" },
  { id: "caitanya", name: "Śrī Caitanya Mahāprabhu", sanskrit: "श्री चैतन्य महाप्रभु", title: "The pioneer of the saṅkīrtana movement", role: "disciple of Īśvara Purī; Kṛṣṇa Himself", description: "Kṛṣṇa who appeared as His own devotee to teach the chanting of the holy names and distribute love of God. He is the root of the Gauḍīya tradition.", keyEvents: ["Appeared in 1486 in Navadvīpa, West Bengal", "Inaugurated the saṅkīrtana movement — congregational chanting of Hare Kṛṣṇa", "Accepted sannyāsa at age 24 from Keśava Bhāratī", "Traveled throughout South India converting many to Vaiṣṇavism", "Instructed Rūpa and Sanātana Gosvāmī in the science of devotion", "Spent the last 18 years of His life in Jagannātha Purī absorbed in ecstasy", "Taught the Śikṣāṣṭaka — eight verses summarizing His entire philosophy"], area: { shape: "rect", coords: "496,547,617,682" }, group: "gaudiya" },
  { id: "rupa", name: "Rūpa Gosvāmī", sanskrit: "रूप गोस्वामी", title: "The most elevated devotee of Śrī Caitanya", role: "disciple of Śrī Caitanya", description: "The chief of the Six Gosvāmīs and the author of Bhakti-rasāmṛta-sindhu, Ujjvala-nīlamaṇi, and many other works. He established the systematic philosophy of Gauḍīya Vaiṣṇavism.", area: { shape: "rect", coords: "12,682,113,817" }, group: "gaudiya" },
  { id: "sanatana", name: "Sanātana Gosvāmī", sanskrit: "सनातन गोस्वामी", title: "The elder of the Six Gosvāmīs", role: "disciple of Śrī Caitanya", description: "A great scholar and devotee who, along with Rūpa Gosvāmī, established the theological and practical standards of Vṛndāvana. He wrote Bṛhad-bhāgavatāmṛta.", area: { shape: "rect", coords: "113,682,214,817" }, group: "gaudiya" },
  { id: "jiva", name: "Jīva Gosvāmī", sanskrit: "जीव गोस्वामी", title: "The principal philosopher of the Six Gosvāmīs", role: "disciple/nephew of Rūpa and Sanātana", description: "The author of the Ṣaṭ-sandarbha and the definitive commentaries on the Bhāgavatam. He systematized Gauḍīya theology under the guidance of Rūpa and Sanātana.", area: { shape: "rect", coords: "214,682,315,817" }, group: "gaudiya" },
  { id: "krsnadasakaviraja", name: "Kṛṣṇadāsa Kavirāja Gosvāmī", sanskrit: "कृष्णदास कविराज", title: "Author of Caitanya-caritāmṛta", role: "disciple of the Six Gosvāmīs' tradition", description: "The author of Śrī Caitanya-caritāmṛta, the definitive biography of Lord Caitanya. He was instructed by Raghunātha dāsa Gosvāmī and the Vṛndāvana Gosvāmīs.", area: { shape: "rect", coords: "315,682,416,817" }, group: "gaudiya" },
  { id: "narottamadasa", name: "Narottama dāsa Ṭhākura", sanskrit: "नरोत्तम दास ठाकुर", title: "The prince of devotees", role: "disciple of Lokanātha Gosvāmī", description: "A great ācārya, poet, and composer whose songs are sung throughout the Gauḍīya tradition. He preached widely in Bengal and established the spirit of Vṛndāvana.", area: { shape: "rect", coords: "416,682,517,817" }, group: "gaudiya" },
  { id: "vishvanatha", name: "Viśvanātha Cakravartī Ṭhākura", sanskrit: "विश्वनाथ चक्रवर्ती ठाकुर", title: "The crest jewel of commentators", role: "disciple of the line of Narottama", description: "A prolific writer and commentator on the Bhāgavatam and the works of the Gosvāmīs. His commentary on Bhagavad-gītā is highly respected.", area: { shape: "rect", coords: "517,682,617,817" }, group: "gaudiya" },
  { id: "jagannathadasa", name: "Jagannātha dāsa Bābājī", sanskrit: "जगन्नाथ दास बाबाजी", title: "The senior-most guide of the Gauḍīya line", role: "disciple of Śrīla Viśvanātha Cakravartī", description: "A powerful siddha-bābājī who guided Bhaktivinoda Ṭhākura and confirmed the birthsite of Lord Caitanya. He was the śikṣā-guru of Bhaktivinoda Ṭhākura.", area: { shape: "rect", coords: "12,817,133,955" }, group: "gaudiya" },
  { id: "bhaktivinoda", name: "Bhaktivinoda Ṭhākura", sanskrit: "भक्तिविनोद ठाकुर", title: "The pioneer of the modern Kṛṣṇa consciousness movement", role: "disciple of Jagannātha dāsa Bābājī", description: "A 19th-century ācārya, writer, and spiritual reformer who revived the Gauḍīya tradition. He predicted the worldwide spread of Kṛṣṇa consciousness.", area: { shape: "rect", coords: "133,817,254,955" }, group: "gaudiya" },
  { id: "gaurakisora", name: "Gaurakiśora dāsa Bābājī", sanskrit: "गौरकिशोर दास बाबाजी", title: "The guru of Bhaktisiddhānta", role: "disciple of Bhaktivinoda Ṭhākura", description: "A highly advanced devotee and instructing spiritual master of Śrīla Bhaktisiddhānta Sarasvatī Ṭhākura. He exemplified intense renunciation and deep devotion.", area: { shape: "rect", coords: "254,817,375,955" }, group: "gaudiya" },
  { id: "bhaktisiddhanta", name: "Śrīla Bhaktisiddhānta Sarasvatī Ṭhākura", sanskrit: "भक्तिसिद्धान्त सरस्वती", title: "The spiritual master of Bhaktivedanta Swami", role: "disciple of Gaurakiśora dāsa Bābājī", description: "A dynamic ācārya who established the Gauḍīya Maṭha and sent disciples to preach all over India. He is the śikṣā and dīkṣā-guru of Śrīla Prabhupāda.", area: { shape: "rect", coords: "375,817,496,955" }, group: "gaudiya" },
  { id: "prabhupada", name: "A. C. Bhaktivedanta Swami Prabhupāda", sanskrit: "अभय चरनारविन्द भक्तिवेदान्त स्वामी", title: "Founder-ācārya of ISKCON", role: "disciple of Bhaktisiddhānta Sarasvatī", description: "Śrīla Prabhupāda brought the teachings of the Brahma-Madhva-Gauḍīya sampradāya to the whole world. He founded ISKCON and translated the major Vaiṣṇava literatures into English.", keyEvents: ["Traveled to America in 1965 at age 69 on the cargo ship Jaladuta", "Founded the International Society for Krishna Consciousness (ISKCON) in 1966", "Translated and commented on over 80 volumes of Vedic literature", "Circled the globe 14 times establishing 108 temples", "Initiated over 5,000 disciples from all walks of life", "Established Māyāpur and Vṛndāvana as ISKCON's spiritual headquarters", "Introduced Ratha-yātrā and Janmāṣṭamī celebrations worldwide"], area: { shape: "rect", coords: "496,817,617,955" }, group: "gaudiya" },
];

export const allSampradayaFigures: SampradayaFigure[] = [
  { id: "four-brahma", name: "Brahma Sampradāya", description: fourSampradayas[0].summary, area: { shape: "rect", coords: "20,140,300,310" }, group: "four" },
  { id: "four-sri", name: "Śrī Sampradāya", description: fourSampradayas[1].summary, area: { shape: "rect", coords: "330,140,610,310" }, group: "four" },
  { id: "four-rudra", name: "Rudra Sampradāya", description: fourSampradayas[2].summary, area: { shape: "rect", coords: "20,330,300,500" }, group: "four" },
  { id: "four-kumara", name: "Kumāra Sampradāya", description: fourSampradayas[3].summary, area: { shape: "rect", coords: "330,330,610,500" }, group: "four" },
  ...gaudiyaLineage,
];

export function findSampradayaFigure(id: string): SampradayaFigure | undefined {
  return allSampradayaFigures.find((f) => f.id === id);
}
