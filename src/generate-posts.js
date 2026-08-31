import sharp from "sharp";
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const WIDTH = 1080;
const HEIGHT = 1350;
const outputDir = new URL("../output/", import.meta.url);

const posts = [
  {
    slug: "launch",
    eyebrow: "WELCOME TO THE DEPARTMENT",
    headline: "SPORTS NEVER CLOCK OUT.",
    deck: "News. Arguments. Rankings. Receipts.",
    accent: "#a8ff3e",
    caption: "The Ball Dept is officially open. Daily sports news, arguments, rankings and receipts. Get a $250 bonus on Fliff with code 4F273. 18+"
  },
  {
    slug: "pca-three-homers",
    eyebrow: "MLB • LAST NIGHT",
    headline: "PCA LEFT THE YARD THREE TIMES.",
    deck: "Pete Crow-Armstrong powered Chicago's 17-run explosion. Is he already one of baseball's most dangerous players?",
    accent: "#55c8ff",
    caption: "Pete Crow-Armstrong launched three home runs as Chicago erupted for 17 runs. Where does PCA rank among baseball's most dangerous players right now? Get a $250 bonus on Fliff with code 4F273. 18+"
  },
  {
    slug: "nfl-cut-day",
    eyebrow: "NFL • ROSTER DEADLINE",
    headline: "THE TOUGHEST DAY IN FOOTBALL.",
    deck: "Every roster gets cut to 53. Which surprise release deserves another shot immediately?",
    accent: "#ffb339",
    caption: "NFL rosters are being cut to 53. Which surprise release should be signed immediately? Get a $250 bonus on Fliff with code 4F273. 18+"
  }
];

const esc = (value) => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;");

function wrap(text, max = 26) {
  const words = text.split(/\s+/);
  const lines = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > max && current) {
      lines.push(current);
      current = word;
    } else current = next;
  }
  if (current) lines.push(current);
  return lines;
}

function svg(post) {
  const title = wrap(post.headline, 22);
  const deck = wrap(post.deck, 48);
  return `
  <svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
    <rect width="1080" height="1350" fill="#07111f"/>
    <circle cx="980" cy="110" r="350" fill="${post.accent}" opacity=".10"/>
    <circle cx="120" cy="820" r="420" fill="${post.accent}" opacity=".055"/>
    <path d="M0 0h18v1350H0z" fill="${post.accent}"/>
    <g font-family="Arial, Helvetica, sans-serif">
      <text x="72" y="100" fill="#f7f9fc" font-size="36" font-weight="900" letter-spacing="2">THE BALL DEPT.</text>
      <text x="1008" y="100" fill="${post.accent}" font-size="25" font-weight="800" text-anchor="end">@THEBALLDEPT</text>
      <rect x="72" y="210" width="440" height="58" rx="29" fill="${post.accent}"/>
      <text x="292" y="249" fill="#07111f" font-size="25" font-weight="900" letter-spacing="1" text-anchor="middle">${esc(post.eyebrow)}</text>
      ${title.map((line, i) => `<text x="72" y="${390 + i * 108}" fill="#f7f9fc" font-size="88" font-weight="900" letter-spacing="-3">${esc(line)}</text>`).join("")}
      ${deck.map((line, i) => `<text x="76" y="${735 + i * 49}" fill="#b8c3d4" font-size="35" font-weight="600">${esc(line)}</text>`).join("")}
      <line x1="72" y1="1040" x2="1008" y2="1040" stroke="#263447" stroke-width="2"/>
      <text x="72" y="1110" fill="#f7f9fc" font-size="29" font-weight="900">FLIFF</text>
      <text x="175" y="1110" fill="${post.accent}" font-size="29" font-weight="900">CODE 4F273</text>
      <rect x="72" y="1152" width="936" height="112" rx="24" fill="${post.accent}"/>
      <text x="540" y="1200" fill="#07111f" font-size="31" font-weight="900" text-anchor="middle">GET A $250 BONUS</text>
      <text x="540" y="1241" fill="#07111f" font-size="26" font-weight="800" text-anchor="middle">USE CODE 4F273  •  18+</text>
      <text x="1008" y="1320" fill="#8794a8" font-size="20" font-weight="700" text-anchor="end">UP TO $250</text>
    </g>
  </svg>`;
}

await mkdir(outputDir, { recursive: true });
const manifest = [];
for (const post of posts) {
  const imageName = `${post.slug}.jpg`;
  await sharp(Buffer.from(svg(post))).jpeg({ quality: 92, chromaSubsampling: "4:4:4" }).toFile(fileURLToPath(new URL(imageName, outputDir)));
  manifest.push({ ...post, image: imageName });
}
await writeFile(new URL("manifest.json", outputDir), JSON.stringify(manifest, null, 2));
console.log(`Generated ${manifest.length} Instagram posts.`);
