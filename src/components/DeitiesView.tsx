"use client";

import { useMemo, useState } from "react";
import { VaisnavaEvent } from "@/lib/data";
import { format, parseISO } from "date-fns";
import { Search, Calendar, ChevronDown, ChevronUp, BookOpen } from "lucide-react";
import { stripDiacritics } from "@/lib/transliteration";

// Biographical info about each deity/personality (who they are, not festival details)
const deityBios: Record<string, string> = {
  "Lord Sri Krishna": "The Supreme Personality of Godhead, the source of all incarnations and the speaker of the Bhagavad-gītā. He appeared over 5,000 years ago in Mathurā and performed His pastimes in Vṛndāvana, Mathurā, and Dvārakā. He is the all-attractive, original person (ādi-puruṣa), from whom everything emanates.",
  "Lord Balarama": "The first expansion of Lord Kṛṣṇa and His elder brother. He is the original spiritual master (ādi-guru) and the source of all strength. He wields a plow and club, and His mood is one of pure service to Kṛṣṇa. He is also known as Saṅkarṣaṇa and Halāyudha.",
  "Srimati Radharani": "The supreme goddess of fortune (hlādinī-śakti) and the eternal consort of Lord Kṛṣṇa. She is the personification of the highest love of God (mahābhāva) and the source of all gopīs. Pleasing Her is the surest way to attain Kṛṣṇa's mercy.",
  "Sri Chaitanya Mahaprabhu": "Kṛṣṇa Himself appearing as His own devotee in the golden form (Gaura). He appeared in Navadvīpa, Bengal in 1486 to teach the yuga-dharma of harināma-saṅkīrtana and to taste the love of Śrīmatī Rādhārāṇī. He is the most munificent incarnation.",
  "Sri Nityananda Prabhu": "The avadhūta expansion of Lord Balarāma who appeared as the most intimate associate of Śrī Caitanya Mahāprabhu. He freely distributed love of God to the most fallen, including Jagāi and Mādhāi, showing unlimited compassion regardless of qualification.",
  "Lord Nrsimhadeva": "The half-man, half-lion incarnation of the Lord who appeared from a pillar to protect His devotee Prahlāda Mahārāja and slay the demon Hiraṇyakaśipu. He demonstrates that the Lord will always protect His surrendered devotees in any circumstance.",
  "Lord Sri Ramacandra": "The ideal king and the seventh incarnation of Lord Viṣṇu. He appeared in the Tretā-yuga as the son of King Daśaratha to establish dharma and demonstrate the perfect example of duty, righteousness, and compassion. His pastimes are narrated in the Rāmāyaṇa.",
  "Lord Jagannatha": "The Lord of the Universe, worshiped in Purī in His distinctive round-eyed form along with His brother Baladeva and sister Subhadrā. He is Kṛṣṇa in the mood of intense separation from the Vraja-gopīs, and His Ratha-yātrā is one of the oldest festivals in the world.",
  "Lord Vamanadeva": "The dwarf-brāhmaṇa incarnation of the Lord who appeared to reclaim the universe from the generous King Bali. He asked for three steps of land and then expanded to cover the entire cosmos, teaching that the Lord can assume any form.",
  "Lord Dāmodara": "Kṛṣṇa bound by the love of Mother Yaśodā with a rope around His belly (dāma + udara). This form is worshiped especially during the month of Kārtika (Dāmodara month) and reveals that the Supreme Lord is conquered only by pure, selfless love.",
  "Sri Madhvacharya": "The 13th-century ācārya who founded the Tattvavāda (Dvaita) school of Vedānta. He powerfully established the personal nature of God, the eternal distinction between the soul and the Lord, and the authority of scripture. He is a key link in the Brahma-Madhva-Gauḍīya paramparā.",
  "Sri Ramanujacarya": "The great 11th-century ācārya of the Śrī Sampradāya who established Viśiṣṭādvaita (qualified non-dualism). He emphasized that the soul is eternally a servant of Lord Viṣṇu and that pure devotion (bhakti) is the path to liberation.",
  "Srila Prabhupada": "His Divine Grace A. C. Bhaktivedanta Swami Prabhupāda, the Founder-Ācārya of ISKCON. He single-handedly brought Kṛṣṇa consciousness to the Western world, translated over 80 volumes of Vedic literature, and established 108 temples worldwide.",
  "Sri Srivasa Pandita": "A close associate of Śrī Caitanya Mahāprabhu and a member of the Pañca-tattva. He opened his home for the Lord's nightly saṅkīrtana gatherings, making it the birthplace of the congregational chanting movement.",
  "Sri Govinda Ghosh": "A renowned devotee and kīrtana singer in the saṅkīrtana movement of Śrī Caitanya Mahāprabhu. His heartfelt singing expressed deep love for Kṛṣṇa and inspired all who heard it.",
  "Srila Bhaktivinoda Thakura": "A 19th-century ācārya, writer, and spiritual reformer who single-handedly revived the Gauḍīya tradition from obscurity. He predicted the worldwide spread of Kṛṣṇa consciousness and wrote over 100 books in Sanskrit, Bengali, and English.",
  "Srila Bhaktisiddhanta Sarasvati Thakura": "The spiritual master of Śrīla Prabhupāda who established the Gauḍīya Maṭha institution with 64 centers. A powerful preacher and scholar, he emphasized pure devotion free from caste prejudice and sahajiyā contamination.",
  "Srila Haridasa Thakura": "The nāmācārya (teacher of the holy name) who chanted 300,000 names daily. Though born in a Muslim family, he was recognized by Śrī Caitanya as the foremost chanter. He demonstrated that the holy name transcends all material designations.",
  "Sri Advaita Acharya": "An incarnation of Mahā-Viṣṇu and Sadāśiva who called Śrī Caitanya Mahāprabhu to descend by His intense prayers and worship of the Lord with Ganges water and tulasī leaves. He is a member of the Pañca-tattva.",
  "Srila Gaura Kishora Dasa Babaji": "A highly advanced paramahaṁsa devotee and the dīkṣā-guru of Śrīla Bhaktisiddhānta Sarasvatī. He exemplified intense renunciation and deep absorption in the holy name, living by the banks of the Ganges in Navadvīpa.",
};

interface Deity {
  name: string;
  bio: string;
  events: VaisnavaEvent[];
}

function getDeities(events: VaisnavaEvent[]): Deity[] {
  const map = new Map<string, VaisnavaEvent[]>();
  for (const e of events) {
    if (!e.personDeity) continue;
    const list = map.get(e.personDeity) || [];
    list.push(e);
    map.set(e.personDeity, list);
  }

  const deities: Deity[] = [];
  for (const [name, list] of map.entries()) {
    list.sort((a, b) => a.date.localeCompare(b.date));
    const bio = deityBios[name] || `A Vaiṣṇava personality honored in the Gauḍīya tradition.`;
    deities.push({ name, bio, events: list });
  }

  return deities.sort((a, b) => a.name.localeCompare(b.name));
}

export function DeitiesView({ events }: { events: VaisnavaEvent[] }) {
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const deities = useMemo(() => getDeities(events), [events]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const qNorm = stripDiacritics(search);
    return deities.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        stripDiacritics(d.name).includes(qNorm) ||
        d.bio.toLowerCase().includes(q) ||
        d.events.some((e) => e.name.toLowerCase().includes(q) || stripDiacritics(e.name).includes(qNorm))
    );
  }, [deities, search]);

  const toggle = (name: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search deities, festivals, or descriptions..."
            className="input-field w-full !pl-10"
          />
        </div>
        <p className="text-sm text-zinc-500 self-center">
          {filtered.length} {filtered.length === 1 ? "deity" : "deities"}
        </p>
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12">
          <BookOpen size={48} className="mx-auto text-zinc-300 mb-3" />
          <p className="text-sm text-zinc-500">No deities match your search.</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((deity) => {
          const isExpanded = expanded.has(deity.name);
          return (
            <div
              key={deity.name}
              className="bg-white dark:bg-zinc-900 rounded-xl border border-amber-200 dark:border-zinc-800 p-5 flex flex-col"
            >
              <h3 className="text-lg font-semibold text-amber-900 dark:text-amber-100 mb-2">
                {deity.name}
              </h3>
              <p
                className={`text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed ${
                  isExpanded ? "" : "line-clamp-3"
                }`}
              >
                {deity.bio}
              </p>
              {deity.bio.length > 140 && (
                <button
                  onClick={() => toggle(deity.name)}
                  className="flex items-center gap-1 text-xs text-amber-700 dark:text-amber-300 hover:underline mt-2 self-start"
                >
                  {isExpanded ? (
                    <>
                      <ChevronUp size={14} /> Show less
                    </>
                  ) : (
                    <>
                      <ChevronDown size={14} /> Read more
                    </>
                  )}
                </button>
              )}

              <div className="mt-4 pt-4 border-t border-amber-100 dark:border-zinc-800">
                <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                  <Calendar size={12} />
                  Honored in
                </p>
                <ul className="space-y-1.5">
                  {deity.events.map((e) => (
                    <li key={e.id} className="text-sm text-zinc-700 dark:text-zinc-300">
                      <span className="text-zinc-500 text-xs">
                        {format(parseISO(e.date + "T12:00"), "MMM d, yyyy")}
                      </span>{" "}
                      <span className="font-medium">{e.name}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
