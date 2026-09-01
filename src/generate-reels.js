import sharp from "sharp";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const WIDTH = 1080;
const HEIGHT = 1920;
const FPS = 30;
const FRAME_SECONDS = 2;
const TRANSITION_SECONDS = 0.25;
const outputDir = new URL("../output/reels/", import.meta.url);
const frameDir = new URL("../output/reel-frames/", import.meta.url);
const reels = JSON.parse(await readFile(new URL("../content/reels.json", import.meta.url), "utf8"));
const requested = process.argv.slice(2);
const selected = requested.length ? reels.filter((reel) => requested.includes(reel.slug)) : reels;

if (requested.length && selected.length !== requested.length) {
  throw new Error(`Unknown reel slug in: ${requested.join(", ")}`);
}

const escapeXml = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

function wrap(text, max = 18) {
  const lines = [];
  let line = "";
  for (const word of text.split(/\s+/)) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > max && line) {
      lines.push(line);
      line = word;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

function textLines(lines, { x = 72, y = 610, size = 92, gap = 24, color = "#f7f9fc" } = {}) {
  return lines
    .map(
      (line, index) =>
        `<text x="${x}" y="${y + index * (size + gap)}" fill="${color}" font-size="${size}" font-weight="950" letter-spacing="-3">${escapeXml(line)}</text>`,
    )
    .join("");
}

function chrome(reel, frameIndex) {
  const progress = Array.from({ length: 5 }, (_, index) => {
    const width = index <= frameIndex ? 176 : 92;
    const opacity = index <= frameIndex ? 1 : 0.28;
    return `<rect x="${72 + index * 190}" y="1760" width="${width}" height="8" rx="4" fill="${reel.accent}" opacity="${opacity}"/>`;
  }).join("");
  return `
    <text x="72" y="106" fill="#f7f9fc" font-size="34" font-weight="950" letter-spacing="2">THE BALL DEPT.</text>
    <text x="1008" y="106" text-anchor="end" fill="${reel.accent}" font-size="24" font-weight="900">@THEBALLDEPT</text>
    <rect x="72" y="145" width="936" height="2" fill="${reel.accent}" opacity=".8"/>
    <rect x="72" y="1810" width="936" height="62" rx="18" fill="#0c1a2b" stroke="${reel.accent}" stroke-width="2"/>
    <text x="98" y="1850" fill="#f7f9fc" font-size="22" font-weight="900">FLIFF • CODE 4F273</text>
    <text x="982" y="1850" text-anchor="end" fill="${reel.accent}" font-size="20" font-weight="900">UP TO $250 • 18+ • #AD</text>
    ${progress}`;
}

function background(reel) {
  return `
    <defs>
      <radialGradient id="glow" cx="86%" cy="8%">
        <stop offset="0" stop-color="${reel.accent}" stop-opacity=".34"/>
        <stop offset=".46" stop-color="#0a1a2d" stop-opacity=".3"/>
        <stop offset="1" stop-color="#050b14"/>
      </radialGradient>
      <linearGradient id="shade" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#07111f"/>
        <stop offset="1" stop-color="#02060d"/>
      </linearGradient>
    </defs>
    <rect width="1080" height="1920" fill="url(#shade)"/>
    <rect width="1080" height="1920" fill="url(#glow)"/>
    <g opacity=".08" stroke="${reel.accent}" stroke-width="3">
      <path d="M-120 430L1200 40"/><path d="M-120 650L1200 260"/><path d="M-120 870L1200 480"/>
      <path d="M-120 1090L1200 700"/><path d="M-120 1310L1200 920"/><path d="M-120 1530L1200 1140"/>
    </g>
    <circle cx="910" cy="420" r="330" fill="none" stroke="${reel.accent}" stroke-width="5" opacity=".12"/>
    <circle cx="910" cy="420" r="225" fill="none" stroke="${reel.accent}" stroke-width="3" opacity=".1"/>`;
}

function frameSvg(reel, frameIndex) {
  let body = "";
  if (frameIndex === 0) {
    body = `
      <rect x="72" y="260" width="350" height="66" rx="33" fill="${reel.accent}"/>
      <text x="247" y="303" text-anchor="middle" fill="#06101c" font-size="25" font-weight="950">SETTLE THIS RIGHT NOW</text>
      ${textLines(wrap(reel.hook, 18), { y: 570, size: 96 })}
      <text x="72" y="1460" fill="#94a4ba" font-size="29" font-weight="800">DON'T ANSWER UNTIL YOU SEE BOTH SIDES.</text>`;
  } else if (frameIndex < 4) {
    const beat = reel.beats[frameIndex - 1];
    body = `
      <text x="72" y="292" fill="${reel.accent}" font-size="28" font-weight="950" letter-spacing="3">POINT 0${frameIndex}</text>
      <text x="1008" y="292" text-anchor="end" fill="#516176" font-size="112" font-weight="950">0${frameIndex}</text>
      ${textLines(wrap(beat, 16), { y: 650, size: 108 })}
      <rect x="72" y="1370" width="936" height="4" fill="${reel.accent}" opacity=".45"/>
      <text x="72" y="1435" fill="#a9b5c5" font-size="26" font-weight="800">KEEP WATCHING — THE COMMENTS WON'T AGREE.</text>`;
  } else {
    body = `
      <rect x="72" y="260" width="255" height="66" rx="33" fill="${reel.accent}"/>
      <text x="199" y="303" text-anchor="middle" fill="#06101c" font-size="25" font-weight="950">YOUR VERDICT</text>
      ${textLines(wrap(reel.question, 17), { y: 585, size: 98 })}
      <rect x="72" y="1310" width="936" height="190" rx="34" fill="#0d1a2a" stroke="${reel.accent}" stroke-width="3"/>
      <text x="540" y="1385" text-anchor="middle" fill="#f7f9fc" font-size="31" font-weight="950">SEND THIS TO THE FRIEND</text>
      <text x="540" y="1435" text-anchor="middle" fill="${reel.accent}" font-size="31" font-weight="950">WHO ALWAYS ARGUES THIS.</text>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}">
    ${background(reel)}
    <g font-family="Arial, Helvetica, sans-serif">${chrome(reel, frameIndex)}${body}</g>
  </svg>`;
}

function ffmpeg(args) {
  return new Promise((resolve, reject) => {
    const child = spawn("ffmpeg", args, { stdio: ["ignore", "ignore", "pipe"] });
    let error = "";
    child.stderr.on("data", (chunk) => (error += chunk));
    child.on("error", reject);
    child.on("close", (code) => (code === 0 ? resolve() : reject(new Error(error.slice(-4000)))));
  });
}

await mkdir(outputDir, { recursive: true });
await mkdir(frameDir, { recursive: true });
const manifest = [];

for (const reel of selected) {
  const frames = [];
  for (let frameIndex = 0; frameIndex < 5; frameIndex += 1) {
    const path = fileURLToPath(new URL(`${reel.slug}-${frameIndex}.png`, frameDir));
    await sharp(Buffer.from(frameSvg(reel, frameIndex))).png().toFile(path);
    frames.push(path);
  }
  const output = fileURLToPath(new URL(`${reel.slug}.mp4`, outputDir));
  const inputs = frames.flatMap((path) => ["-loop", "1", "-t", String(FRAME_SECONDS), "-i", path]);
  const filters =
    frames
      .map(
        (_, index) =>
          `[${index}:v]scale=1120:1992,crop=1080:1920:x='20+8*sin(t*1.1+${index})':y='36+10*cos(t*.9+${index})',fps=${FPS},format=yuv420p[v${index}]`,
      )
      .join(";") +
    `;[v0][v1]xfade=transition=fade:duration=${TRANSITION_SECONDS}:offset=1.75[x1]` +
    `;[x1][v2]xfade=transition=wipeleft:duration=${TRANSITION_SECONDS}:offset=3.5[x2]` +
    `;[x2][v3]xfade=transition=slideup:duration=${TRANSITION_SECONDS}:offset=5.25[x3]` +
    `;[x3][v4]xfade=transition=fade:duration=${TRANSITION_SECONDS}:offset=7[out]`;
  await ffmpeg([
    "-y", ...inputs, "-filter_complex", filters, "-map", "[out]", "-t", "9", "-an",
    "-c:v", "libx264", "-pix_fmt", "yuv420p", "-preset", "medium", "-crf", "21",
    "-movflags", "+faststart", output,
  ]);
  const caption = `${reel.question}\n\nSend this to the friend who always argues this. Then drop your answer below.\n\nGet up to $250 in bonus bets on Fliff with code 4F273. 18+; terms apply. #ad I may earn rewards from qualifying activity.\n\n#sports #sportsdebate #theballdept #fliff`;
  manifest.push({ ...reel, video: `reels/${reel.slug}.mp4`, caption });
  console.log(`Generated ${reel.slug}.mp4`);
}

await writeFile(
  new URL("../output/reels-manifest.json", import.meta.url),
  JSON.stringify(manifest, null, 2),
);
