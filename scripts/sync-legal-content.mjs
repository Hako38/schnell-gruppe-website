import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceFiles = {
  impressum: process.argv[2],
  datenschutz: process.argv[3]
};

if (!sourceFiles.impressum || !sourceFiles.datenschutz) {
  throw new Error("Aufruf: node scripts/sync-legal-content.mjs <impressum-html> <datenschutz-html>");
}

function extractArticle(html, name) {
  const marker = '<div class="der-beitrag">';
  const start = html.indexOf(marker);
  if (start === -1) throw new Error(`${name}: Inhaltsbereich nicht gefunden`);
  const bodyStart = start + marker.length;
  const bodyEnd = html.indexOf("</div>", bodyStart);
  if (bodyEnd === -1) throw new Error(`${name}: Inhaltsbereich ist unvollständig`);
  return html.slice(bodyStart, bodyEnd)
    .replaceAll(' class="wp-block-heading"', "")
    .replaceAll(' class="wp-block-paragraph"', "")
    .replace(/^\s*<h2>.*?<\/h2>/, "")
    .trim();
}

const pages = {};
for (const [slug, file] of Object.entries(sourceFiles)) {
  pages[slug] = extractArticle(await readFile(file, "utf8"), slug);
}

await writeFile(
  path.join(projectRoot, "src", "data", "legal-content.json"),
  `${JSON.stringify({ source: "https://schnell-gruppe.de/", pages }, null, 2)}\n`,
  "utf8"
);

console.log("Bestehende Rechtstexte übernommen: Impressum, Datenschutz.");
