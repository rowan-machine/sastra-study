import { writeFileSync } from "fs";

const canto = 1;
const chapters = 19;
const counts = {};

for (let ch = 1; ch <= chapters; ch++) {
  const url = `https://vedabase.io/en/library/sb/${canto}/${ch}/`;
  try {
    const res = await fetch(url);
    const text = await res.text();
    const matches = text.match(/Text \d+:/g);
    if (matches) {
      // The last Text X: number is the count
      const numbers = matches.map(m => parseInt(m.replace(/\D/g, "")));
      counts[ch] = Math.max(...numbers);
      console.log(`Canto ${canto} Chapter ${ch}: ${counts[ch]} verses`);
    } else {
      counts[ch] = 0;
      console.log(`Canto ${canto} Chapter ${ch}: no verses found`);
    }
  } catch (err) {
    console.error(`Failed to fetch ${url}:`, err.message);
    counts[ch] = 0;
  }
}

writeFileSync("sb-canto-1-counts.json", JSON.stringify(counts, null, 2));
console.log("Saved to sb-canto-1-counts.json");
