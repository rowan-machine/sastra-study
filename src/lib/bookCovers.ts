// Book cover image URLs for the curriculum library
// Uses publicly available cover images from BBT and other Vaiṣṇava publishers

const coverMap: Record<string, string> = {
  // Core study
  "Bhagavad-gītā As It Is": "/covers/bhagavad-gita-as-it-is.jpg",
  "Śrīmad-Bhāgavatam Canto 1 Part 1": "/covers/srimad-bhagavatam-1-1.webp",
  "Śrīmad-Bhāgavatam Canto 1 Part 2": "/covers/srimad-bhagavatam-1-1.webp",
  "Śrīmad-Bhāgavatam Canto 1": "/covers/srimad-bhagavatam-1-1.webp",
  "Śrīmad-Bhāgavatam": "/covers/srimad-bhagavatam-1-1.webp",
  "Śrī Caitanya-caritāmṛta": "https://m.media-amazon.com/images/I/51T4LGk+G-L._SY445_SX342_.jpg",
  "Śrī Caitanya-caritāmṛta: Ādi-līlā Part 1": "https://m.media-amazon.com/images/I/51T4LGk+G-L._SY445_SX342_.jpg",
  "Śrī Caitanya-caritāmṛta: Ādi-līlā Part 2": "https://m.media-amazon.com/images/I/51T4LGk+G-L._SY445_SX342_.jpg",
  "Śrī Caitanya-caritāmṛta: Ādi-līlā Part 3": "https://m.media-amazon.com/images/I/51T4LGk+G-L._SY445_SX342_.jpg",
  "Śrī Caitanya-caritāmṛta: Ādi-līlā": "https://m.media-amazon.com/images/I/51T4LGk+G-L._SY445_SX342_.jpg",
  // Foundational
  "Nectar of Instruction (Upadeśāmṛta)": "/covers/nectar-of-instruction.jpg",
  "Nectar of Devotion (Bhakti-rasāmṛta-sindhu)": "/covers/nectar-of-devotion.webp",
  "Science of Self-Realization": "/covers/science-of-self-realization.jpg",
  "Beyond Birth and Death": "https://m.media-amazon.com/images/I/61tX0+PgKOL._AC_UF1000,1000_QL80_.jpg",
  "Easy Journey to Other Planets": "https://m.media-amazon.com/images/I/71FRPm+87XL._AC_UF1000,1000_QL80_.jpg",
  "Perfection of Yoga": "https://m.media-amazon.com/images/I/81qfMGQYNWL._AC_UF1000,1000_QL80_.jpg",
  "Rāja-Vidyā: The King of Knowledge": "https://m.media-amazon.com/images/I/71G9gfxT4SL._AC_UF1000,1000_QL80_.jpg",
  "Elevation to Kṛṣṇa Consciousness": "https://m.media-amazon.com/images/I/81iGiGl1Y+L._AC_UF1000,1000_QL80_.jpg",
  "Kṛṣṇa Consciousness: The Topmost Yoga System": "https://m.media-amazon.com/images/I/71VdI4PJCQL._AC_UF1000,1000_QL80_.jpg",
  "Kṛṣṇa Consciousness: The Matchless Gift": "https://m.media-amazon.com/images/I/71qJ3R2mndL._AC_UF1000,1000_QL80_.jpg",
  "On the Way to Kṛṣṇa": "https://m.media-amazon.com/images/I/61f-yFVFXQL._AC_UF1000,1000_QL80_.jpg",
  "Path of Perfection": "https://m.media-amazon.com/images/I/71VeQTD0X7L._AC_UF1000,1000_QL80_.jpg",
  "Life Comes from Life": "https://m.media-amazon.com/images/I/71qf6QLIIFL._AC_UF1000,1000_QL80_.jpg",
  "Message of Godhead": "https://m.media-amazon.com/images/I/61sQj6r6S-L._AC_UF1000,1000_QL80_.jpg",
  "Light of the Bhāgavata": "https://m.media-amazon.com/images/I/81TXN5kZ3UL._AC_UF1000,1000_QL80_.jpg",
  "Renunciation Through Wisdom": "https://m.media-amazon.com/images/I/41BCJSZ08bL._SY445_SX342_.jpg",
  "Quest for Enlightenment": "https://m.media-amazon.com/images/I/61UF9Qas5hL._AC_UF1000,1000_QL80_.jpg",
  "Civilization and Transcendence": "https://m.media-amazon.com/images/I/71bKzL-2cYL._AC_UF1000,1000_QL80_.jpg",
  "Second Chance": "https://m.media-amazon.com/images/I/71s82Nz8LxL._AC_UF1000,1000_QL80_.jpg",
  "Laws of Nature": "https://m.media-amazon.com/images/I/71EpmLbKaEL._AC_UF1000,1000_QL80_.jpg",
  "Journey of Self-Discovery": "https://m.media-amazon.com/images/I/71y8-3kOhEL._AC_UF1000,1000_QL80_.jpg",
  // Major works
  "Kṛṣṇa Book (Kṛṣṇa, The Supreme Personality of Godhead)": "/covers/krishna-book.jpg",
  "Teachings of Lord Caitanya": "https://m.media-amazon.com/images/I/61F1r0u6AhL._AC_UF1000,1000_QL80_.jpg",
  "Teachings of Lord Kapila": "https://m.media-amazon.com/images/I/61v8CqNDPdL._AC_UF1000,1000_QL80_.jpg",
  "Teachings of Queen Kuntī": "https://m.media-amazon.com/images/I/61F3uPVkY5L._AC_UF1000,1000_QL80_.jpg",
  "Teachings of Prahlāda Mahārāja": "https://m.media-amazon.com/images/I/71xSWEW9V4L._AC_UF1000,1000_QL80_.jpg",
  "Nārada-bhakti-sūtra": "https://m.media-amazon.com/images/I/71fMVG1j1EL._AC_UF1000,1000_QL80_.jpg",
  "Mukunda-mālā-stotra": "https://m.media-amazon.com/images/I/61ByJ4l-OyL._AC_UF1000,1000_QL80_.jpg",
  "Śrī Īśopaniṣad": "https://m.media-amazon.com/images/I/71UQSsXaINL._AC_UF1000,1000_QL80_.jpg",
  // Prabhupāda's other
  "Prabhupāda-līlāmṛta": "https://m.media-amazon.com/images/I/51D0gHCjDaL._SY445_SX342_.jpg",
  "Śrīla Prabhupāda Letters": "https://m.media-amazon.com/images/I/41Hmi2O+NHL._SY445_SX342_.jpg",
  "Conversations with Śrīla Prabhupāda": "https://m.media-amazon.com/images/I/41Hmi2O+NHL._SY445_SX342_.jpg",
  // Garga-saṁhitā
  "Garga-saṁhitā": "/covers/garga-samhita-canto-1.jpg",
  "Garga-saṁhitā: Canto 1 Part 1 (Goloka-khaṇḍa)": "/covers/garga-samhita-canto-1.jpg",
  "Garga-saṁhitā: Canto 1 Part 2 (Goloka-khaṇḍa)": "/covers/garga-samhita-canto-1.jpg",
  "Garga-saṁhitā: Canto 1 (Goloka-khaṇḍa)": "/covers/garga-samhita-canto-1.jpg",
  "Garga-saṁhitā — Kṛṣṇa's Planet": "/covers/garga-samhita-canto-1.jpg",
  "Kṛṣṇa's Planet (Garga-saṁhitā Summary Study)": "/covers/garga-samhita-canto-1.jpg",
  "Garga-saṁhitā: Canto 2 (Vrindāvana-khaṇḍa)": "https://m.media-amazon.com/images/I/71lVK2PIQRL._AC_UF1000,1000_QL80_.jpg",
  "Garga-saṁhitā: Canto 3 (Girirāja-khaṇḍa)": "https://m.media-amazon.com/images/I/71lVK2PIQRL._AC_UF1000,1000_QL80_.jpg",
  "Garga-saṁhitā: Canto 4 (Mādhurya-khaṇḍa)": "https://m.media-amazon.com/images/I/71lVK2PIQRL._AC_UF1000,1000_QL80_.jpg",
  "Garga-saṁhitā: Canto 5 (Mathurā-khaṇḍa)": "https://m.media-amazon.com/images/I/71lVK2PIQRL._AC_UF1000,1000_QL80_.jpg",
  "Garga-saṁhitā: Canto 6 (Dwaraka-khaṇḍa)": "https://m.media-amazon.com/images/I/71lVK2PIQRL._AC_UF1000,1000_QL80_.jpg",
  "Garga-saṁhitā: Canto 7 (Virajā-khaṇḍa)": "https://m.media-amazon.com/images/I/71lVK2PIQRL._AC_UF1000,1000_QL80_.jpg",
  "Garga-saṁhitā: Canto 8 (Balabhadra-khaṇḍa)": "https://m.media-amazon.com/images/I/71lVK2PIQRL._AC_UF1000,1000_QL80_.jpg",
  "Garga-saṁhitā: Canto 9 (Āśvamedhika-khaṇḍa)": "https://m.media-amazon.com/images/I/71lVK2PIQRL._AC_UF1000,1000_QL80_.jpg",
  "Garga-saṁhitā: Canto 10 (Svargārohaṇa-khaṇḍa)": "https://m.media-amazon.com/images/I/71lVK2PIQRL._AC_UF1000,1000_QL80_.jpg",
  // Gosvāmī literature
  "Bhakti-rasāmṛta-sindhu (full, Rūpa Gosvāmī)": "https://m.media-amazon.com/images/I/71cwmAlrFwL._AC_UF1000,1000_QL80_.jpg",
  "Ujjvala-nīlamaṇi (Rūpa Gosvāmī)": "https://m.media-amazon.com/images/I/41vJRYmJf4L._SY445_SX342_.jpg",
  "Vidagdha-mādhava (Rūpa Gosvāmī)": "https://m.media-amazon.com/images/I/41vJRYmJf4L._SY445_SX342_.jpg",
  "Lalita-mādhava (Rūpa Gosvāmī)": "https://m.media-amazon.com/images/I/41vJRYmJf4L._SY445_SX342_.jpg",
  "Hari-bhakti-vilāsa (Sanātana Gosvāmī)": "https://m.media-amazon.com/images/I/51UkqKG5l-L._SY445_SX342_.jpg",
  "Bṛhad-bhāgavatāmṛta (Sanātana Gosvāmī)": "https://m.media-amazon.com/images/I/71I4OixeaIL._AC_UF1000,1000_QL80_.jpg",
  "Sat-sandarbha (Jīva Gosvāmī)": "https://m.media-amazon.com/images/I/51p10CZ0Z4L._SY445_SX342_.jpg",
  "Gopāla-campū (Jīva Gosvāmī)": "https://m.media-amazon.com/images/I/51p10CZ0Z4L._SY445_SX342_.jpg",
  "Mādhurya-kādambinī (Viśvanātha Cakravartī)": "https://m.media-amazon.com/images/I/71pq1XLrN6L._AC_UF1000,1000_QL80_.jpg",
  "Rāga-vartma-candrikā (Viśvanātha Cakravartī)": "https://m.media-amazon.com/images/I/71pq1XLrN6L._AC_UF1000,1000_QL80_.jpg",
  "Śrī Caitanya-bhāgavata (Vṛndāvana dāsa Ṭhākura)": "https://m.media-amazon.com/images/I/61F1r0u6AhL._AC_UF1000,1000_QL80_.jpg",
  "Prema-vivarta (Jagadānanda Paṇḍita)": "https://m.media-amazon.com/images/I/61F1r0u6AhL._AC_UF1000,1000_QL80_.jpg",
  // Vaiṣṇava ācārya works
  "Jaiva-dharma (Bhaktivinoda Ṭhākura)": "https://m.media-amazon.com/images/I/61dw-N72JdL._AC_UF1000,1000_QL80_.jpg",
  "Harināma-cintāmaṇi (Bhaktivinoda Ṭhākura)": "https://m.media-amazon.com/images/I/61dw-N72JdL._AC_UF1000,1000_QL80_.jpg",
  "Śrī Caitanya-śikṣāmṛta (Bhaktivinoda Ṭhākura)": "https://m.media-amazon.com/images/I/61dw-N72JdL._AC_UF1000,1000_QL80_.jpg",
  "Bhaktyāloka (Bhaktivinoda Ṭhākura)": "https://m.media-amazon.com/images/I/61dw-N72JdL._AC_UF1000,1000_QL80_.jpg",
  "Śrī Brahma-saṁhitā (with Bhaktisiddhānta commentary)": "https://m.media-amazon.com/images/I/71xKN6g3nRL._AC_UF1000,1000_QL80_.jpg",
  // Supplementary
  "Vaiṣṇava Songbook (Gītāvalī, Śaraṇāgati, etc.)": "https://m.media-amazon.com/images/I/61dw-N72JdL._AC_UF1000,1000_QL80_.jpg",
  "Bhagavad-gītā — Verse Memorization Guide": "https://m.media-amazon.com/images/I/81jWHfFBHaL._AC_UF1000,1000_QL80_.jpg",
  "ISKCON Disciple Course Manual": "https://m.media-amazon.com/images/I/41Hmi2O+NHL._SY445_SX342_.jpg",
  "Bhakti Śāstrī Course Materials": "https://m.media-amazon.com/images/I/81jWHfFBHaL._AC_UF1000,1000_QL80_.jpg",
  "Bhakti Vaibhava Course Materials": "https://m.media-amazon.com/images/I/51p10CZ0Z4L._SY445_SX342_.jpg",
  "Māyāpur-Vṛndāvana Study Guides": "https://m.media-amazon.com/images/I/41Hmi2O+NHL._SY445_SX342_.jpg",
};

// Color gradient fallbacks for books without specific covers
const gradientColors: string[] = [
  "from-amber-600 to-orange-800",
  "from-indigo-600 to-purple-800",
  "from-emerald-600 to-teal-800",
  "from-rose-600 to-pink-800",
  "from-sky-600 to-blue-800",
  "from-violet-600 to-indigo-800",
  "from-orange-600 to-red-800",
  "from-teal-600 to-cyan-800",
];

export function getBookCoverUrl(bookName: string): string | null {
  if (coverMap[bookName]) return coverMap[bookName];

  const lower = bookName.toLowerCase();
  let bestKey: string | null = null;
  let bestLen = 0;

  for (const key of Object.keys(coverMap)) {
    const keyLower = key.toLowerCase();
    if (lower.includes(keyLower) || keyLower.includes(lower)) {
      const matchLen = Math.min(keyLower.length, lower.length);
      if (matchLen > bestLen) {
        bestLen = matchLen;
        bestKey = key;
      }
    }
  }

  return bestKey ? coverMap[bestKey] : null;
}

export function getBookGradient(bookName: string): string {
  let hash = 0;
  for (let i = 0; i < bookName.length; i++) {
    hash = ((hash << 5) - hash) + bookName.charCodeAt(i);
    hash |= 0;
  }
  return gradientColors[Math.abs(hash) % gradientColors.length];
}

export const bookInvocations: Record<string, { has: string; text: string }> = {
  "Bhagavad-gītā As It Is": { has: "Yes", text: "oṁ ajñāna-timirāndhasya..., namo oṁ viṣṇu-pādāya..., etc." },
  "Śrīmad-Bhāgavatam": { has: "Yes", text: "oṁ namo bhagavate vāsudevāya followed by janmādy asya yataḥ... (SB 1.1.1)" },
  "Śrī Caitanya-caritāmṛta": { has: "Extensive", text: "Begins with maṅgalācaraṇa verses glorifying guru, Vaiṣṇavas, Caitanya, Nityānanda, Advaita, Gadādhara, Śrīvāsa, and Rādhā-Kṛṣṇa." },
  "Nectar of Instruction (Upadeśāmṛta)": { has: "Yes", text: "Traditional editions begin with guru-vandanā and other prayers before the verses." },
  "Nectar of Devotion (Bhakti-rasāmṛta-sindhu)": { has: "Yes", text: "Begins by offering obeisances to Śrī Kṛṣṇa and describing pure devotional service." },
  "Śrī Īśopaniṣad": { has: "Yes", text: "Often preceded by oṁ pūrṇam adaḥ pūrṇam idaṁ..." },
  "Nārada-bhakti-sūtra": { has: "Usually", text: "Traditional editions begin with guru and Viṣṇu prayers." },
};

export function getBookInitials(bookName: string): string {
  // Remove parenthetical suffixes and get first letters of major words
  const clean = bookName.replace(/\(.*?\)/g, "").replace(/[—:]/g, " ").trim();
  const words = clean.split(/\s+/).filter((w) => w.length > 2 && !["the", "and", "of", "to", "in"].includes(w.toLowerCase()));
  return words.slice(0, 3).map((w) => w[0]).join("").toUpperCase();
}
