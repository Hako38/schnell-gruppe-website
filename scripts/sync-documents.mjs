import { mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const data = JSON.parse(await readFile(path.join(projectRoot, "src", "data", "downloads.json"), "utf8"));
const documentsDirectory = path.join(projectRoot, "src", "assets", "documents");

await mkdir(documentsDirectory, { recursive: true });
for (const document of data.documents) {
  const response = await fetch(document.url, { redirect: "follow" });
  if (!response.ok) throw new Error(`${document.id}: HTTP ${response.status}`);
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (String.fromCharCode(...bytes.slice(0, 4)) !== "%PDF") throw new Error(`${document.id}: keine PDF-Antwort`);
  await writeFile(path.join(documentsDirectory, `${document.id}.pdf`), bytes);
  console.log(`Synchronisiert: ${document.id}.pdf`);
}
