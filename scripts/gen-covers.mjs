// Generates the cover art for the "Web Security 101" series.
// Usage: node scripts/gen-covers.mjs   (writes public/images/covers/*.svg)
// Covers are plain SVG shown through <img>, so they only use system fonts and ASCII text.
import { mkdirSync, writeFileSync } from "node:fs";

const colors = {
  spectro: "#f2d27a",
  fusion: "#ff6a55",
  glacio: "#62c8ff",
  havoc: "#c264ff",
  aero: "#5ee3b1",
  electro: "#9c8cff",
};

const covers = [
  { file: "web101-01-sqli", no: "01", lines: ["SQL", "INJECTION"], glyph: "' --", code: "SQLi", color: colors.spectro },
  { file: "web101-02-xss", no: "02", lines: ["CROSS-SITE", "SCRIPTING"], glyph: "</>", code: "XSS", color: colors.fusion },
  { file: "web101-03-csrf", no: "03", lines: ["CROSS-SITE", "REQUEST FORGERY"], glyph: "POST", code: "CSRF", color: colors.glacio },
  { file: "web101-04-idor", no: "04", lines: ["BROKEN ACCESS", "CONTROL / IDOR"], glyph: "id+1", code: "IDOR", color: colors.havoc },
  { file: "web101-05-ssrf", no: "05", lines: ["SERVER-SIDE", "REQUEST FORGERY"], glyph: "://", code: "SSRF", color: colors.aero },
  { file: "web101-06-auth", no: "06", lines: ["BROKEN", "AUTHENTICATION"], glyph: "***", code: "AUTH", color: colors.electro },
  { file: "web101-07-upload", no: "07", lines: ["UNSAFE", "FILE UPLOAD"], glyph: ".ext", code: "UPLOAD", color: colors.spectro },
  { file: "web101-08-cmdi", no: "08", lines: ["COMMAND", "INJECTION"], glyph: "; $", code: "CMDi", color: colors.fusion },
  { file: "web101-09-path", no: "09", lines: ["PATH", "TRAVERSAL"], glyph: "../", code: "LFI", color: colors.glacio },
  { file: "web101-10-misconfig", no: "10", lines: ["SECURITY", "MISCONFIG"], glyph: "*", code: "CONFIG", color: colors.havoc },
];

const SANS = "'Segoe UI', 'Helvetica Neue', Arial, sans-serif";
const MONO = "Consolas, 'SF Mono', Menlo, 'DejaVu Sans Mono', monospace";
const CREAM = "#ece6d6";
const GOLD = "#f2cd78";

function ticks(cx, cy, r, color) {
  let out = "";
  for (let i = 0; i < 72; i += 1) {
    const long = i % 6 === 0;
    const angle = (i * 360) / 72;
    out += `<line x1="${cx}" y1="${cy - r}" x2="${cx}" y2="${cy - r + (long ? 16 : 9)}" stroke="${long ? color : CREAM}" stroke-opacity="${long ? 0.95 : 0.3}" stroke-width="${long ? 2 : 1}" transform="rotate(${angle} ${cx} ${cy})"/>`;
  }
  return out;
}

function render({ no, lines, glyph, code, color }) {
  const cx = 905;
  const cy = 315;
  const glyphSize = glyph.length <= 1 ? 96 : glyph.length <= 3 ? 64 : 50;
  // Long words would run into the emblem, so shrink the title for them.
  const titleSize = Math.max(...lines.map((line) => line.length)) > 13 ? 50 : 62;
  const lineGap = Math.round(titleSize * 1.16);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630" role="img" aria-label="Web Security 101 #${no}: ${lines.join(" ")}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#08090d"/>
      <stop offset="0.6" stop-color="#10121b"/>
      <stop offset="1" stop-color="${color}" stop-opacity="0.2"/>
    </linearGradient>
    <radialGradient id="glow" cx="${cx}" cy="${cy}" r="430" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="${color}" stop-opacity="0.34"/>
      <stop offset="1" stop-color="${color}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="core" cx="${cx}" cy="${cy}" r="120" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#fff5d6" stop-opacity="0.28"/>
      <stop offset="1" stop-color="${color}" stop-opacity="0"/>
    </radialGradient>
    <pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse">
      <path d="M48 0H0V48" fill="none" stroke="${CREAM}" stroke-opacity="0.05"/>
    </pattern>
    <linearGradient id="rule" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${color}"/>
      <stop offset="1" stop-color="${color}" stop-opacity="0"/>
    </linearGradient>
  </defs>

  <rect width="1200" height="630" fill="#08090d"/>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect width="1200" height="630" fill="url(#grid)"/>
  <rect width="1200" height="630" fill="url(#glow)"/>

  <!-- oversized series number, barely visible -->
  <text x="70" y="560" font-family="${SANS}" font-size="420" font-weight="800" fill="${CREAM}" fill-opacity="0.035" letter-spacing="-10">${no}</text>

  <!-- emblem -->
  <circle cx="${cx}" cy="${cy}" r="250" fill="none" stroke="${CREAM}" stroke-opacity="0.16"/>
  ${ticks(cx, cy, 250, color)}
  <circle cx="${cx}" cy="${cy}" r="196" fill="none" stroke="${color}" stroke-opacity="0.6" stroke-dasharray="3 12"/>
  <circle cx="${cx}" cy="${cy}" r="170" fill="none" stroke="${CREAM}" stroke-opacity="0.14"/>
  <path d="M${cx} ${cy - 142} A142 142 0 0 1 ${cx + 142} ${cy}" fill="none" stroke="${color}" stroke-width="3"/>
  <path d="M${cx} ${cy + 142} A142 142 0 0 1 ${cx - 142} ${cy}" fill="none" stroke="${CREAM}" stroke-opacity="0.45" stroke-width="1.5"/>
  ${[0, 90, 180, 270]
    .map(
      (angle) =>
        `<rect x="${cx - 8}" y="${cy - 204}" width="16" height="16" fill="#08090d" stroke="${color}" stroke-width="2" transform="rotate(${angle + 45} ${cx} ${cy}) rotate(45 ${cx} ${cy - 196})"/>`,
    )
    .join("\n  ")}
  <circle cx="${cx}" cy="${cy}" r="120" fill="url(#core)"/>
  <path d="M${cx} ${cy - 118} L${cx + 118} ${cy} L${cx} ${cy + 118} L${cx - 118} ${cy} Z" fill="#0b0c12" fill-opacity="0.82" stroke="${color}" stroke-width="2"/>
  <path d="M${cx} ${cy - 96} L${cx + 96} ${cy} L${cx} ${cy + 96} L${cx - 96} ${cy} Z" fill="none" stroke="${CREAM}" stroke-opacity="0.3"/>
  <text x="${cx}" y="${cy + glyphSize * 0.2}" text-anchor="middle" font-family="${MONO}" font-size="${glyphSize}" font-weight="700" fill="${color}">${glyph.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</text>
  <text x="${cx}" y="${cy + 66}" text-anchor="middle" font-family="${MONO}" font-size="17" letter-spacing="5" fill="${CREAM}" fill-opacity="0.7">${code.toUpperCase()}</text>

  <!-- title block -->
  <rect x="96" y="196" width="9" height="9" fill="${GOLD}" transform="rotate(45 100.5 200.5)"/>
  <text x="122" y="207" font-family="${SANS}" font-size="19" font-weight="700" letter-spacing="7" fill="${GOLD}">WEB SECURITY 101</text>
  <text x="560" y="207" text-anchor="end" font-family="${MONO}" font-size="19" fill="${CREAM}" fill-opacity="0.55">#${no} / 10</text>
  <text font-family="${SANS}" font-size="${titleSize}" font-weight="800" letter-spacing="2" fill="${CREAM}">
    <tspan x="94" y="${368 - lineGap}">${lines[0]}</tspan>
    <tspan x="94" y="368">${lines[1]}</tspan>
  </text>
  <rect x="96" y="402" width="330" height="3" fill="url(#rule)"/>
  <text x="96" y="446" font-family="${MONO}" font-size="20" letter-spacing="3" fill="${color}">&gt; LEARN . BREAK (IN LAB) . FIX</text>
</svg>
`;
}

mkdirSync("public/images/covers", { recursive: true });
for (const cover of covers) {
  writeFileSync(`public/images/covers/${cover.file}.svg`, render(cover));
}
console.log(`Wrote ${covers.length} covers to public/images/covers/`);
