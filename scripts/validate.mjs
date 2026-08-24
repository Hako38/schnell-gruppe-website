import { access, readFile, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputRoot = path.join(projectRoot, "dist");
const serviceData = JSON.parse(await readFile(path.join(projectRoot, "src", "data", "services.json"), "utf8"));
const rentalData = JSON.parse(await readFile(path.join(projectRoot, "src", "data", "rental.json"), "utf8"));
const locationData = JSON.parse(await readFile(path.join(projectRoot, "src", "data", "locations.json"), "utf8"));
const companyData = JSON.parse(await readFile(path.join(projectRoot, "src", "data", "company.json"), "utf8"));
const careerData = JSON.parse(await readFile(path.join(projectRoot, "src", "data", "career.json"), "utf8"));
const downloadsData = JSON.parse(await readFile(path.join(projectRoot, "src", "data", "downloads.json"), "utf8"));
const contactData = JSON.parse(await readFile(path.join(projectRoot, "src", "data", "contact.json"), "utf8"));
const contactsData = JSON.parse(await readFile(path.join(projectRoot, "src", "data", "contacts.json"), "utf8"));
const redirectsData = JSON.parse(await readFile(path.join(projectRoot, "src", "data", "redirects.json"), "utf8"));
const errors = [];

async function collectHtml(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) return collectHtml(target);
    return entry.isFile() && entry.name.endsWith(".html") ? [target] : [];
  }));
  return nested.flat();
}

const htmlFiles = await collectHtml(outputRoot);

for (const htmlFile of htmlFiles) {
  const relativeName = path.relative(outputRoot, htmlFile);
  const html = await readFile(htmlFile, "utf8");
  if (/{{[A-Z0-9_]+}}/.test(html)) errors.push(`${relativeName}: unaufgelöste Template-Platzhalter`);
  if (!html.includes('<html lang="de">')) errors.push(`${relativeName}: Dokumentsprache fehlt`);
  if (!html.includes('<main id="main">')) errors.push(`${relativeName}: Main-Landmark fehlt`);
  if (!html.includes('class="skip-link"')) errors.push(`${relativeName}: Skip-Link fehlt`);
  if (!html.includes('name="description"')) errors.push(`${relativeName}: Meta-Description fehlt`);
  if ((html.match(/<h1(?:\s|>)/g) || []).length !== 1) errors.push(`${relativeName}: genau eine H1 erwartet`);

  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
  const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
  if (duplicates.length) errors.push(`${relativeName}: doppelte IDs ${[...new Set(duplicates)].join(", ")}`);

  const assetPaths = [...html.matchAll(/(?:src|href)="((?:\.\.\/)*assets\/[^"]+)"/g)].map((match) => match[1]);
  for (const assetPath of new Set(assetPaths)) {
    try {
      await access(path.resolve(path.dirname(htmlFile), assetPath));
    } catch {
      errors.push(`${relativeName}: fehlende lokale Datei ${assetPath}`);
    }
  }
}

const detailPages = htmlFiles.filter((file) => path.relative(outputRoot, file).split(path.sep).length === 3 && path.relative(outputRoot, file).startsWith(`leistungen${path.sep}`));
if (detailPages.length !== serviceData.services.length) errors.push(`Leistungsseiten: ${serviceData.services.length} erwartet, ${detailPages.length} erzeugt`);

for (const service of serviceData.services) {
  const file = path.join(outputRoot, "leistungen", service.slug, "index.html");
  try {
    const html = await readFile(file, "utf8");
    if (!html.includes(`<title>${service.title.replaceAll("&", "&amp;")} | Schnell Gruppe</title>`)) errors.push(`${service.slug}: Titel stimmt nicht mit Datensatz überein`);
    const shouldNoindex = service.status !== "published";
    if (html.includes('name="robots" content="noindex,nofollow"') !== shouldNoindex) errors.push(`${service.slug}: Robots-Status stimmt nicht`);
  } catch {
    errors.push(`${service.slug}: Detailseite fehlt`);
  }
}

const rentalFile = path.join(outputRoot, "mietpark", "index.html");
try {
  const html = await readFile(rentalFile, "utf8");
  const renderedItems = (html.match(/\sdata-rental-item(?:\s|>)/g) || []).length;
  if (renderedItems !== rentalData.items.length) errors.push(`Mietpark: ${rentalData.items.length} Einträge erwartet, ${renderedItems} erzeugt`);
  for (const item of rentalData.items) {
    if (!html.includes(`data-rental-name="${item.name.replaceAll("&", "&amp;").replaceAll('"', "&quot;")}"`)) errors.push(`Mietpark: ${item.id} fehlt`);
  }
} catch {
  errors.push("Mietpark: Übersichtsseite fehlt");
}

const locationDetailPages = htmlFiles.filter((file) => path.relative(outputRoot, file).split(path.sep).length === 3 && path.relative(outputRoot, file).startsWith(`standorte${path.sep}`));
if (locationDetailPages.length !== locationData.locations.length) errors.push(`Standortseiten: ${locationData.locations.length} erwartet, ${locationDetailPages.length} erzeugt`);

for (const location of locationData.locations) {
  const file = path.join(outputRoot, "standorte", location.slug, "index.html");
  try {
    const html = await readFile(file, "utf8");
    if (!html.includes(`<title>${location.name} | Standorte | Schnell Gruppe</title>`)) errors.push(`${location.slug}: Standorttitel stimmt nicht mit Datensatz überein`);
    if (!html.includes(location.address.replaceAll("&", "&amp;"))) errors.push(`${location.slug}: Adresse fehlt`);
  } catch {
    errors.push(`${location.slug}: Standortdetailseite fehlt`);
  }
}

for (const requiredPage of [
  { file: path.join(outputRoot, "unternehmen", "index.html"), title: "<title>Unternehmen | Schnell Gruppe</title>", label: "Unternehmen" },
  { file: path.join(outputRoot, "unternehmen", "nachhaltigkeit-recycling", "index.html"), title: "<title>Nachhaltigkeit & Recycling | Schnell Gruppe</title>", label: "Nachhaltigkeit" },
  { file: path.join(outputRoot, "karriere", "index.html"), title: "<title>Karriere | Schnell Gruppe</title>", label: "Karriere" }
]) {
  try {
    const html = await readFile(requiredPage.file, "utf8");
    if (!html.includes(requiredPage.title)) errors.push(`${requiredPage.label}: Seitentitel stimmt nicht`);
  } catch {
    errors.push(`${requiredPage.label}: Seite fehlt`);
  }
}

for (const job of careerData.jobs) {
  const file = path.join(outputRoot, "karriere", job.slug, "index.html");
  try {
    const html = await readFile(file, "utf8");
    const escapedTitle = job.title.replaceAll("&", "&amp;");
    if (!html.includes(`<title>${escapedTitle} | Karriere | Schnell Gruppe</title>`)) errors.push(`${job.slug}: Stellentitel stimmt nicht`);
    if (!html.includes(`mailto:${job.contact.email}`)) errors.push(`${job.slug}: Bewerbungskontakt fehlt`);
    for (const task of job.tasks) {
      if (!html.includes(task.replaceAll("&", "&amp;"))) errors.push(`${job.slug}: Aufgabe fehlt: ${task}`);
    }
  } catch {
    errors.push(`${job.slug}: Stellendetailseite fehlt`);
  }
}

if (!Number.isInteger(companyData.profile.founded) || companyData.profile.founded !== 1988) errors.push("Unternehmen: bestätigtes Gründungsjahr fehlt");
if (careerData.jobs.some((job) => !job.source || !job.status)) errors.push("Karriere: Quellen- oder Statusfeld fehlt");

try {
  const html = await readFile(path.join(outputRoot, "downloads", "index.html"), "utf8");
  const renderedDocuments = (html.match(/\sdata-download-item(?:\s|>)/g) || []).length;
  if (renderedDocuments !== downloadsData.documents.length) errors.push(`Downloads: ${downloadsData.documents.length} Dokumente erwartet, ${renderedDocuments} erzeugt`);
  if (!html.includes('href="../assets/documents/') || !html.includes(" download")) errors.push("Downloads: lokale Dokumentlinks fehlen");
} catch {
  errors.push("Downloads: Seite fehlt");
}

try {
  const html = await readFile(path.join(outputRoot, "kontakt", "index.html"), "utf8");
  if (!html.includes("data-contact-form")) errors.push("Kontakt: Formular fehlt");
  if (!html.includes(`data-recipient="${contactData.recipient}"`)) errors.push("Kontakt: Empfänger fehlt");
  for (const field of contactData.fields.filter((field) => field.required)) {
    if (!html.includes(`name="${field.id}"`) || !html.includes(`name="${field.id}"`) ) errors.push(`Kontakt: Pflichtfeld ${field.id} fehlt`);
  }
  if (!html.includes('name="privacyConsent" required')) errors.push("Kontakt: Datenschutz-Einwilligung fehlt");
} catch {
  errors.push("Kontakt: Seite fehlt");
}

for (const legal of contactData.legal) {
  try {
    const html = await readFile(path.join(outputRoot, legal.slug, "index.html"), "utf8");
    if (!html.includes('name="robots" content="noindex,nofollow"')) errors.push(`${legal.slug}: Noindex-Schutz fehlt`);
    if (!html.includes(legal.source)) errors.push(`${legal.slug}: Bestandsquelle fehlt`);
  } catch {
    errors.push(`${legal.slug}: rechtliche Prüfseite fehlt`);
  }
}

try {
  const html = await readFile(path.join(outputRoot, "ansprechpartner", "index.html"), "utf8");
  if ((html.match(/class="contact-department"/g) || []).length !== contactsData.departments.length) errors.push(`Ansprechpartner: ${contactsData.departments.length} Fachbereiche erwartet`);
} catch {
  errors.push("Ansprechpartner: Seite fehlt");
}

for (const redirect of redirectsData.redirects) {
  const file = path.join(outputRoot, redirect.from.replace(/^\//, "").replace(/\/$/, ""), "index.html");
  try {
    const html = await readFile(file, "utf8");
    if (!html.includes(`url=${redirect.to}`) || !html.includes(`location.replace("${redirect.to}")`)) errors.push(`Weiterleitung ${redirect.from}: Ziel fehlt`);
  } catch {
    errors.push(`Weiterleitung ${redirect.from}: Seite fehlt`);
  }
}

const expectedHtmlCount = 6 + serviceData.services.length + 1 + locationData.locations.length + careerData.jobs.length + 2 + contactData.legal.length + 1 + redirectsData.redirects.length;
if (htmlFiles.length !== expectedHtmlCount) errors.push(`HTML-Seiten: ${expectedHtmlCount} erwartet, ${htmlFiles.length} erzeugt`);

if (errors.length) {
  console.error(errors.map((error) => `- ${error}`).join("\n"));
  process.exitCode = 1;
} else {
  console.log(`Prüfung erfolgreich: ${htmlFiles.length} HTML-Seiten, ${downloadsData.documents.length} lokale Downloads, ${contactsData.departments.length} Fachbereiche und ${redirectsData.redirects.length} Weiterleitungen.`);
}
