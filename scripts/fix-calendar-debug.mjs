import { readFileSync } from "fs";
const src = readFileSync("src/lib/vaisnava-calendar.ts", "utf8");
const regex = /\{\s*id:\s*"(ek-\d{4}-\d{2}-\d{2})",\s*date:\s*"(\d{4}-\d{2}-\d{2})",([\s\S]*?)breakFastStart:\s*"(\d{1,2} [A-Za-z]{3} \d{4}), ([^"]+)"([\s\S]*?)\}/g;
const matches = Array.from(src.matchAll(regex));
console.log("matches", matches.length);
if (matches.length > 0) {
  console.log(matches[0][1], matches[0][2], matches[0][4]);
}
