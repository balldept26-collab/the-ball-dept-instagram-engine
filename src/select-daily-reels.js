import { readFile } from "node:fs/promises";

const reels = JSON.parse(
  await readFile(new URL("../content/reels.json", import.meta.url), "utf8"),
);
const chicagoDate = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Chicago",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
})
  .formatToParts(new Date())
  .reduce((parts, part) => ({ ...parts, [part.type]: part.value }), {});
const dayNumber = Math.floor(
  Date.UTC(Number(chicagoDate.year), Number(chicagoDate.month) - 1, Number(chicagoDate.day)) /
    86_400_000,
);
const start = (dayNumber * 4) % reels.length;
const selected = Array.from({ length: 4 }, (_, slot) => reels[(start + slot) % reels.length]);

if (new Set(selected.map((reel) => reel.slug)).size !== 4) {
  throw new Error("The Reel library must contain at least four unique entries.");
}
for (const reel of selected) console.log(reel.slug);
