// Temporary script to scrape BBT cover image URLs
// Run with: node scripts/scrape-bbt-covers.js

// eslint-disable-next-line @typescript-eslint/no-require-imports
const https = require("https");

function fetch(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { "User-Agent": "Mozilla/5.0" } }, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => resolve(data));
    }).on("error", reject);
  });
}

async function main() {
  const coversPage = await fetch("https://images.bbtmedia.com/covers");
  const linkMatches = [...coversPage.matchAll(/<a href="(\/node\/\d+)"[^>]*>([\s\S]*?)<\/a>/g)];
  const nodeMap = new Map();
  for (const m of linkMatches) {
    const title = m[2].replace(/&#039;/g, "'").replace(/\s+/g, " ").trim();
    if (!nodeMap.has(title) && title.length > 0) nodeMap.set(title, m[1]);
  }

  const results = [];
  for (const [title, path] of nodeMap) {
    try {
      const html = await fetch(`https://images.bbtmedia.com${path}`);
      const match = html.match(/src="(https:\/\/images\.bbtmedia\.com\/sites\/default\/files\/[^"]+\.jpg[^"]*)"/);
      if (match) {
        results.push({ title, url: match[1] });
      } else {
        results.push({ title, url: null });
      }
    } catch (e) {
      results.push({ title, url: null, error: e.message });
    }
  }

  console.log(JSON.stringify(results, null, 2));
}

main().catch(console.error);
