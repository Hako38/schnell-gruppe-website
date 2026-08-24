# Schnell Gruppe Website – Phase 11

Die aktuelle Ausbaustufe ergänzt den Ansprechpartnerbereich, lokale PDF-Dokumente und die Alt-URL-Weiterleitungen. Alles ist in reinem HTML, CSS und JavaScript umgesetzt – ohne CMS und Frontend-Framework.

## Aufbau

- `src/data/homepage.json` – strukturierte Inhalte; später direkt auf Datenbanktabellen abbildbar
- `src/data/services.json` – elf Leistungsdatensätze mit Gruppen, Leistungslisten, Kontakten und Prüfstatus
- `src/data/rental.json` – strukturierter Mietkatalog mit Kategorien und Standortzuordnung
- `src/data/locations.json` – vier Standorte mit Funktionen, Kontakten und regulären Öffnungszeiten
- `src/data/company.json` – Unternehmensprofil, Gründungsjahr und Recyclingkreislauf
- `src/data/career.json` – Stellenangebote mit Aufgaben, Profil, Leistungen, Kontakten und Prüfdatum
- `src/data/downloads.json` – 38 Bestandsdokumente, Kategorien, Quellen und Übernahmestatus
- `src/data/contact.json` – Feldschema, Themen, Empfangsadresse, Versandweg und Datenbankzuordnung
- `src/data/contacts.json` – Ansprechpartner nach Fachbereichen mit Prüfdatum
- `src/data/redirects.json` – Alt-URL-Weiterleitungen für die spätere Hosting-Konfiguration
- `src/assets/documents/` – 38 lokal übernommene PDF-Bestandsdokumente
- `src/templates/` – semantische Templates für Startseite, Übersichten und Detailseiten
- `src/assets/css/` – Design-Tokens und Komponenten-/Seitenstile
- `src/assets/js/main.js` – progressive Interaktionen
- `src/assets/images/` – optimierte lokale Originalmedien
- `scripts/build.mjs` – erzeugt die fertige statische Website unter `dist/`
- `scripts/serve.mjs` – lokale Vorschau ohne zusätzliche Abhängigkeiten

## Lokale Nutzung

```bash
npm run build
npm run check
npm run serve
```

Anschließend ist die Vorschau unter `http://127.0.0.1:4173` erreichbar.

## Status

Phase 11 liefert 37 HTML-Seiten. Die 38 PDF-Dokumente liegen jetzt lokal im Projekt; das Downloadcenter ist nicht mehr vom alten WordPress-Auftritt abhängig. Die Ansprechpartnerseite enthält neun Fachbereiche und ein Prüfdatum. Sieben frühere URLs werden mittels Hosting-Regeln und statischen Fallback-Seiten auf die neuen Zielseiten geführt. Impressum, Datenschutz und AGB bleiben absichtlich auf `noindex` und müssen vor dem Produktivgang rechtlich für das neue Hosting und die Formularverarbeitung freigegeben werden.
