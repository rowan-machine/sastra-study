#!/usr/bin/env node
/**
 * Scrape Śrīla Prabhupāda's Q&A, lecture transcripts, and morning walks
 * from vedabase.cc into a local corpus under public/prabhupada/.
 *
 * Personal offline study use only. Rate-limited (~1 req/sec), resumable
 * via a checkpoint file. Writes one JSON per entry plus a manifest.
 *
 * Usage:
 *   node scripts/scrape-prabhupada.mjs                    # everything, resumable
 *   node scripts/scrape-prabhupada.mjs --only qa          # just Q&A
 *   node scripts/scrape-prabhupada.mjs --only walks       # just morning walks
 *   node scripts/scrape-prabhupada.mjs --only lectures    # just lectures
 *   node scripts/scrape-prabhupada.mjs --limit 5          # cap total entries per section (proof run)
 *   node scripts/scrape-prabhupada.mjs --refresh          # re-fetch existing entries
 */

import { JSDOM } from "jsdom";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");

const BASE = "https://vedabase.cc";
const USER_AGENT =
  "sastra-study-curriculum/0.1 (+personal-offline-study; contact via github)";
const REQUEST_DELAY_MS = 1100; // ~1 req/sec, polite
const MAX_RETRIES = 3;

const OUT_DIR = path.join(ROOT, "public", "prabhupada");
const CHECKPOINT_FILE = path.join(OUT_DIR, ".checkpoint.json");

// ---------- CLI args ----------
const args = new Set(process.argv.slice(2));
const argVal = (name) => {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : null;
};
const only = argVal("--only"); // "qa" | "walks" | "lectures" | null
const limit = argVal("--limit") ? parseInt(argVal("--limit"), 10) : null;
const refresh = args.has("--refresh");

// ---------- Utility ----------
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchText(url, tries = 0) {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT, Accept: "text/html,*/*" },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
    return await res.text();
  } catch (err) {
    if (tries < MAX_RETRIES) {
      const backoff = 1500 * (tries + 1);
      console.warn(`  retry ${tries + 1}/${MAX_RETRIES} for ${url} in ${backoff}ms: ${err.message}`);
      await sleep(backoff);
      return fetchText(url, tries + 1);
    }
    throw err;
  }
}

async function ensureDir(p) {
  await fs.mkdir(p, { recursive: true });
}

async function loadCheckpoint() {
  try {
    const raw = await fs.readFile(CHECKPOINT_FILE, "utf8");
    return JSON.parse(raw);
  } catch {
    return { qa: {}, lectures: {}, "morning-walks": {} };
  }
}

async function saveCheckpoint(cp) {
  await ensureDir(OUT_DIR);
  await fs.writeFile(CHECKPOINT_FILE, JSON.stringify(cp, null, 2));
}

function slugFromUrl(url) {
  const m = url.match(/\/([^/]+)\/?$/);
  return m ? m[1].replace(/[^a-z0-9-]/gi, "-").toLowerCase() : `entry-${Date.now()}`;
}

/**
 * Extract paragraph-like text from a vedabase.cc transcript / Q&A page.
 * The site is server-rendered; the main content lives in <main> or <article>.
 * We strip nav, header, footer, and script/style tags.
 */
function extractEntryFromHtml(html, url) {
  const dom = new JSDOM(html);
  const doc = dom.window.document;

  const title =
    doc.querySelector("h1")?.textContent?.trim() ||
    doc.querySelector("title")?.textContent?.trim() ||
    "";

  // Try main content selectors — vedabase.cc uses <main> and content divs.
  const candidates = [
    "main article",
    "main .content",
    "main",
    "article",
    ".content",
    "#content",
  ];
  let container = null;
  for (const sel of candidates) {
    container = doc.querySelector(sel);
    if (container) break;
  }
  container = container || doc.body;

  // Remove nav/aside/header/footer/scripts/styles inside the container.
  container
    .querySelectorAll("nav, aside, header, footer, script, style, .breadcrumbs, .site-footer, .site-header, .navigation")
    .forEach((el) => el.remove());

  // Collect paragraphs and blockquotes, preserving order.
  const blocks = [];
  container.querySelectorAll("p, blockquote, h2, h3, li").forEach((el) => {
    const t = el.textContent?.replace(/\s+/g, " ").trim();
    if (t && t.length > 1) blocks.push(t);
  });
  const text = blocks.join("\n\n").trim();

  // Metadata heuristics: date, location, speakers from slug or subtitle.
  const slug = slugFromUrl(url);
  const dateMatch = slug.match(/^(\d{6})/); // yymmdd
  let date = "";
  if (dateMatch) {
    const yy = parseInt(dateMatch[1].slice(0, 2), 10);
    const mm = dateMatch[1].slice(2, 4);
    const dd = dateMatch[1].slice(4, 6);
    const yyyy = yy < 50 ? 2000 + yy : 1900 + yy;
    date = `${yyyy}-${mm}-${dd}`;
  }
  // Subtitle: e.g. "Morning Walk — Los Angeles, June 14, 1972"
  const subtitle =
    doc.querySelector("main h2")?.textContent?.trim() ||
    doc.querySelector("main .subtitle")?.textContent?.trim() ||
    "";
  const location = subtitle.match(/,\s*([^,]+?)(?:,\s*[A-Z][a-z]+ \d)/)?.[1]?.trim() || "";

  // Tags: try meta keywords or category chips
  const tags = [];
  doc.querySelectorAll('meta[name="keywords"]').forEach((m) => {
    const c = m.getAttribute("content");
    if (c) tags.push(...c.split(",").map((s) => s.trim()).filter(Boolean));
  });
  doc.querySelectorAll(".tags a, .categories a, .category").forEach((el) => {
    const t = el.textContent?.trim();
    if (t) tags.push(t);
  });

  return { title, date, location, subtitle, tags: Array.from(new Set(tags)), text };
}

/**
 * Walk paginated index pages and collect entry URLs.
 * All three sections use `?page=N` pagination.
 */
async function collectIndexUrls(startUrl) {
  const seen = new Set();
  const collected = [];
  let url = startUrl;
  let pageCount = 0;
  while (url && pageCount < 200) {
    pageCount++;
    console.log(`  index page ${pageCount}: ${url}`);
    const html = await fetchText(url);
    await sleep(REQUEST_DELAY_MS);
    const dom = new JSDOM(html);
    const doc = dom.window.document;
    // Entry links: any anchor whose href points into transcripts/ or qa/ subpaths and isn't the index itself.
    doc.querySelectorAll("a[href]").forEach((a) => {
      const href = a.getAttribute("href");
      if (!href) return;
      const abs = new URL(href, url).toString();
      if (isEntryUrl(abs, startUrl) && !seen.has(abs)) {
        seen.add(abs);
        collected.push(abs);
      }
    });
    // Look for a Next link — vedabase.cc uses "Next →"
    const nextAnchor = Array.from(doc.querySelectorAll("a")).find((a) => {
      const t = (a.textContent || "").trim();
      return /next\s*→|^next$|page=\d+/i.test(t) && a.getAttribute("href");
    });
    if (nextAnchor) {
      const nextHref = nextAnchor.getAttribute("href");
      const nextUrl = new URL(nextHref, url).toString();
      if (nextUrl === url) break;
      url = nextUrl;
    } else {
      url = null;
    }
  }
  return collected;
}

function isEntryUrl(abs, indexUrl) {
  try {
    const u = new URL(abs);
    const iu = new URL(indexUrl);
    if (u.origin !== iu.origin) return false;
    // Q&A entries: /en/qa/<slug>/
    if (iu.pathname.startsWith("/en/qa")) {
      return /^\/en\/qa\/[^/]+\/?$/.test(u.pathname) && u.pathname !== "/en/qa/";
    }
    // Transcript entries: /en/library/transcripts/<slug>/
    if (iu.pathname.startsWith("/en/library/transcripts")) {
      return (
        /^\/en\/library\/transcripts\/[^/]+\/?$/.test(u.pathname) &&
        u.pathname !== "/en/library/transcripts/"
      );
    }
    return false;
  } catch {
    return false;
  }
}

// ---------- Section runners ----------
async function scrapeSection({ key, type, indexUrl, subdir }) {
  console.log(`\n=== ${key.toUpperCase()} ===`);
  console.log(`  index: ${indexUrl}`);
  await ensureDir(path.join(OUT_DIR, subdir));

  const checkpoint = await loadCheckpoint();
  checkpoint[key] = checkpoint[key] || {};

  const urls = await collectIndexUrls(indexUrl);
  console.log(`  discovered ${urls.length} entry URLs`);

  const targets = limit ? urls.slice(0, limit) : urls;
  const manifest = [];
  let done = 0;
  for (const url of targets) {
    const slug = slugFromUrl(url);
    const outPath = path.join(OUT_DIR, subdir, `${slug}.json`);
    if (!refresh && checkpoint[key][url]) {
      manifest.push(checkpoint[key][url]);
      continue;
    }
    try {
      const html = await fetchText(url);
      await sleep(REQUEST_DELAY_MS);
      const parsed = extractEntryFromHtml(html, url);
      const entry = {
        id: `${type}-${slug}`,
        type,
        title: parsed.title,
        subtitle: parsed.subtitle,
        date: parsed.date,
        location: parsed.location,
        speakers: type === "qa" ? [] : ["Śrīla Prabhupāda"],
        tags: parsed.tags,
        text: parsed.text,
        sourceUrl: url,
        scrapedAt: new Date().toISOString(),
      };
      await fs.writeFile(outPath, JSON.stringify(entry, null, 2));
      const summary = {
        id: entry.id,
        type: entry.type,
        title: entry.title,
        date: entry.date,
        location: entry.location,
        tags: entry.tags,
        file: path.posix.join("prabhupada", subdir, `${slug}.json`),
        sourceUrl: entry.sourceUrl,
      };
      checkpoint[key][url] = summary;
      manifest.push(summary);
      done++;
      if (done % 10 === 0) {
        await saveCheckpoint(checkpoint);
        console.log(`  saved ${done}/${targets.length}`);
      }
    } catch (err) {
      console.warn(`  ! failed ${url}: ${err.message}`);
    }
  }
  await saveCheckpoint(checkpoint);
  console.log(`  wrote ${manifest.length} entries to ${subdir}/`);

  const manifestPath = path.join(OUT_DIR, `${subdir}.json`);
  await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`  manifest → ${manifestPath}`);
  return manifest;
}

// ---------- Main ----------
async function main() {
  await ensureDir(OUT_DIR);
  const sections = [
    { key: "qa", type: "qa", indexUrl: `${BASE}/en/qa/`, subdir: "qa" },
    { key: "morning-walks", type: "morning-walk", indexUrl: `${BASE}/en/library/transcripts/?type=Walk`, subdir: "morning-walks" },
    { key: "lectures", type: "lecture", indexUrl: `${BASE}/en/library/transcripts/`, subdir: "lectures" },
  ].filter((s) => !only || s.key === only || (only === "walks" && s.key === "morning-walks"));

  const combined = {
    generatedAt: new Date().toISOString(),
    sourceSite: BASE,
    sections: {},
  };
  for (const s of sections) {
    const manifest = await scrapeSection(s);
    combined.sections[s.key] = { count: manifest.length, file: `${s.subdir}.json` };
  }
  await fs.writeFile(path.join(OUT_DIR, "manifest.json"), JSON.stringify(combined, null, 2));
  console.log("\nDone. Top-level manifest → public/prabhupada/manifest.json");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
