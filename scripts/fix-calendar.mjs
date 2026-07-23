import { readFileSync, writeFileSync } from "fs";

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const file = "src/lib/vaisnava-calendar.ts";
let src = readFileSync(file, "utf8");

function two(n) {
  return n.toString().padStart(2, "0");
}

const eventRegex = /\{\s*id:\s*"(ek-\d{4}-\d{2}-\d{2})",\s*date:\s*"(\d{4}-\d{2}-\d{2})",([\s\S]*?)breakFastStart:\s*"(\d{1,2} [A-Za-z]{3} \d{4}), ([^"]+)"([\s\S]*?)\}/g;

let changed = false;

const newSrc = src.replace(eventRegex, (match, id, oldDate, between, breakDateStr, breakTime) => {
  const [d, monStr, y] = breakDateStr.split(" ");
  const month = months.indexOf(monStr) + 1;
  if (month === 0) return match;
  const newDate = `${y}-${two(month)}-${two(parseInt(d))}`;
  const newId = `ek-${newDate}`;
  if (newDate === oldDate && newId === id) return match;
  changed = true;
  return match.replace(`id: "${id}"`, `id: "${newId}"`).replace(`date: "${oldDate}"`, `date: "${newDate}"`);
});

if (changed) {
  writeFileSync(file, newSrc);
  console.log("Updated", file);
} else {
  console.log("No changes needed");
}
