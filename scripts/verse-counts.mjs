import { writeFileSync } from "fs";

const BASE = "https://vedabase.io";

// VedaBase book path definitions and optional fallback counts (chapter count will be discovered if not given)
const books = [
  { key: "bhagavad-gita", path: "/en/library/bg/", chapters: 18, label: "bhagavad-gītā" },
  { key: "śrī īśopaniṣad", path: "/en/library/iso/", chapters: 18, label: "śrī īśopaniṣad" },
  { key: "srimad-bhagavatam", path: "/en/library/sb/", cantos: 12, label: "śrīmad-bhāgavatam" },
  { key: "caitanya-caritāmṛta", path: "/en/library/cc/", lilas: { "adi": 17, "madhya": 25, "antya": 20 }, label: "caitanya-caritāmṛta" },
  { key: "kṛṣṇa book", path: "/en/library/kb/", chapters: 90, label: "kṛṣṇa book" },
  { key: "nectar of devotion", path: "/en/library/nod/", chapters: 34, label: "nectar of devotion" },
  { key: "nectar of instruction", path: "/en/library/noi/", chapters: 11, label: "nectar of instruction" },
  { key: "teachings of lord caitanya", path: "/en/library/tlc/", chapters: 32, label: "teachings of lord caitanya" },
  { key: "teachings of lord kapila", path: "/en/library/tlk/", chapters: 36, label: "teachings of lord kapila" },
  { key: "teachings of queen kuntī", path: "/en/library/tqk/", chapters: 26, label: "teachings of queen kuntī" },
  { key: "teachings of prahlāda", path: "/en/library/tpm/", chapters: 19, label: "teachings of prahlāda" },
  { key: "nārada-bhakti-sūtra", path: "/en/library/nbs/", chapters: 84, label: "nārada-bhakti-sūtra" },
  { key: "mukunda-mālā-stotra", path: "/en/library/mms/", chapters: 59, label: "mukunda-mālā-stotra" },
  { key: "brahma-saṁhitā", path: "/en/library/bs/", chapters: 62, label: "brahma-saṁhitā" },
  { key: "bhakti-rasāmṛta-sindhu", path: "/en/library/nod/", chapters: 34, label: "bhakti-rasāmṛta-sindhu" },
  { key: "second chance", path: "/en/library/sc/", chapters: 22, label: "second chance" },
  { key: "perfection of yoga", path: "/en/library/poy/", chapters: 8, label: "perfection of yoga" },
  { key: "easy journey to other planets", path: "/en/library/ej/", chapters: 7, label: "easy journey to other planets" },
  { key: "on the way to kṛṣṇa", path: "/en/library/otwk/", chapters: 10, label: "on the way to kṛṣṇa" },
  { key: "rāja-vidyā", path: "/en/library/rv/", chapters: 13, label: "rāja-vidyā" },
  { key: "elevation to kṛṣṇa consciousness", path: "/en/library/etkc/", chapters: 9, label: "elevation to kṛṣṇa consciousness" },
  { key: "matchless gift", path: "/en/library/mg/", chapters: 16, label: "matchless gift" },
  { key: "path of perfection", path: "/en/library/pop/", chapters: 12, label: "path of perfection" },
  { key: "message of godhead", path: "/en/library/mog/", chapters: 10, label: "message of godhead" },
  { key: "life comes from life", path: "/en/library/lcfl/", chapters: 7, label: "life comes from life" },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchText(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.text();
}

function getChapterNumbers(html, path) {
  const re = new RegExp(`${path.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&")}(\\d+)\\/`, "g");
  const nums = new Set();
  let m;
  while ((m = re.exec(html)) !== null) nums.add(parseInt(m[1]));
  return [...nums].sort((a, b) => a - b);
}

function countVerses(html) {
  const matches = [...html.matchAll(/Text\s+(\d+)<!--/g)];
  if (matches.length === 0) return 0;
  return Math.max(...matches.map((m) => parseInt(m[1])));
}

async function fetchBookCounts(book) {
  let result = {};
  if (book.cantos) {
    for (let c = 1; c <= book.cantos; c++) {
      const indexUrl = `${BASE}${book.path}${c}/`;
      const indexHtml = await fetchText(indexUrl);
      const chapters = getChapterNumbers(indexHtml, `${book.path}${c}/`);
      const counts = {};
      for (const ch of chapters) {
        const chUrl = `${BASE}${book.path}${c}/${ch}/`;
        const chHtml = await fetchText(chUrl);
        counts[ch] = countVerses(chHtml);
        await sleep(100);
      }
      result[c] = { chapters: counts };
    }
  } else if (book.lilas) {
    for (const [lila, count] of Object.entries(book.lilas)) {
      const indexUrl = `${BASE}${book.path}${lila}/`;
      const indexHtml = await fetchText(indexUrl);
      const chapters = getChapterNumbers(indexHtml, `${book.path}${lila}/`);
      const counts = {};
      for (const ch of chapters) {
        const chUrl = `${BASE}${book.path}${lila}/${ch}/`;
        const chHtml = await fetchText(chUrl);
        counts[ch] = countVerses(chHtml);
        await sleep(100);
      }
      result[lila] = { chapters: counts };
    }
  } else {
    const indexUrl = `${BASE}${book.path}`;
    const indexHtml = await fetchText(indexUrl);
    const chapters = getChapterNumbers(indexHtml, book.path);
    const counts = {};
    for (const ch of chapters) {
      const chUrl = `${BASE}${book.path}${ch}/`;
      const chHtml = await fetchText(chUrl);
      counts[ch] = countVerses(chHtml);
      await sleep(100);
    }
    result = counts;
  }
  return result;
}

async function main() {
  const all = {};
  for (const book of books) {
    console.log(`Fetching ${book.key}...`);
    try {
      all[book.key] = await fetchBookCounts(book);
      console.log(`  done: ${book.key}`);
    } catch (e) {
      console.error(`  failed: ${book.key}: ${e.message}`);
    }
  }
  writeFileSync("scripts/verse-counts.json", JSON.stringify(all, null, 2));
  console.log("Wrote scripts/verse-counts.json");
}

main().catch((e) => { console.error(e); process.exit(1); });
