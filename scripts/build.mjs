import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceRoot = path.join(projectRoot, "src");
const outputRoot = path.join(projectRoot, "dist");
const basePathInput = (process.env.BASE_PATH || "").trim();
const basePath = basePathInput ? `/${basePathInput.replace(/^\/+|\/+$/g, "")}` : "";
const assetVersion = (process.env.GITHUB_SHA || "local").slice(0, 12);

const [homeTemplate, servicesIndexTemplate, serviceDetailTemplate, rentalTemplate, locationsIndexTemplate, locationDetailTemplate, companyTemplate, sustainabilityTemplate, careerIndexTemplate, jobDetailTemplate, downloadsTemplate, contactTemplate, legalReviewTemplate, legalContentTemplate, contactsTemplate, redirectTemplate, homeDataText, serviceDataText, rentalDataText, locationDataText, companyDataText, careerDataText, downloadsDataText, contactDataText, contactsDataText, legalContentDataText, redirectsDataText] = await Promise.all([
  readFile(path.join(sourceRoot, "templates", "index.html"), "utf8"),
  readFile(path.join(sourceRoot, "templates", "services-index.html"), "utf8"),
  readFile(path.join(sourceRoot, "templates", "service-detail.html"), "utf8"),
  readFile(path.join(sourceRoot, "templates", "rental.html"), "utf8"),
  readFile(path.join(sourceRoot, "templates", "locations-index.html"), "utf8"),
  readFile(path.join(sourceRoot, "templates", "location-detail.html"), "utf8"),
  readFile(path.join(sourceRoot, "templates", "company.html"), "utf8"),
  readFile(path.join(sourceRoot, "templates", "sustainability.html"), "utf8"),
  readFile(path.join(sourceRoot, "templates", "career-index.html"), "utf8"),
  readFile(path.join(sourceRoot, "templates", "job-detail.html"), "utf8"),
  readFile(path.join(sourceRoot, "templates", "downloads.html"), "utf8"),
  readFile(path.join(sourceRoot, "templates", "contact.html"), "utf8"),
  readFile(path.join(sourceRoot, "templates", "legal-review.html"), "utf8"),
  readFile(path.join(sourceRoot, "templates", "legal-content.html"), "utf8"),
  readFile(path.join(sourceRoot, "templates", "contacts.html"), "utf8"),
  readFile(path.join(sourceRoot, "templates", "redirect.html"), "utf8"),
  readFile(path.join(sourceRoot, "data", "homepage.json"), "utf8"),
  readFile(path.join(sourceRoot, "data", "services.json"), "utf8"),
  readFile(path.join(sourceRoot, "data", "rental.json"), "utf8"),
  readFile(path.join(sourceRoot, "data", "locations.json"), "utf8"),
  readFile(path.join(sourceRoot, "data", "company.json"), "utf8"),
  readFile(path.join(sourceRoot, "data", "career.json"), "utf8"),
  readFile(path.join(sourceRoot, "data", "downloads.json"), "utf8"),
  readFile(path.join(sourceRoot, "data", "contact.json"), "utf8"),
  readFile(path.join(sourceRoot, "data", "contacts.json"), "utf8"),
  readFile(path.join(sourceRoot, "data", "legal-content.json"), "utf8"),
  readFile(path.join(sourceRoot, "data", "redirects.json"), "utf8")
]);

const homeData = JSON.parse(homeDataText);
const serviceData = JSON.parse(serviceDataText);
const rentalData = JSON.parse(rentalDataText);
const locationData = JSON.parse(locationDataText);
const companyData = JSON.parse(companyDataText);
const careerData = JSON.parse(careerDataText);
const downloadsData = JSON.parse(downloadsDataText);
const contactData = JSON.parse(contactDataText);
const contactsData = JSON.parse(contactsDataText);
const legalContentData = JSON.parse(legalContentDataText);
const redirectsData = JSON.parse(redirectsDataText);

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderTemplate(template, replacements) {
  let html = template;
  for (const [key, value] of Object.entries(replacements)) html = html.replaceAll(`{{${key}}}`, value);
  const unresolved = html.match(/{{[A-Z0-9_]+}}/g);
  if (unresolved) throw new Error(`Unaufgelöste Template-Platzhalter: ${unresolved.join(", ")}`);
  html = html
    .replaceAll("assets/css/tokens.css", `assets/css/tokens.css?v=${assetVersion}`)
    .replaceAll("assets/css/main.css", `assets/css/main.css?v=${assetVersion}`)
    .replaceAll("assets/js/main.js", `assets/js/main.js?v=${assetVersion}`);
  if (!basePath) return html;
  return html
    .replaceAll('href="/', `href="${basePath}/`)
    .replaceAll('src="/', `src="${basePath}/`)
    .replaceAll('location.replace("/', `location.replace("${basePath}/`)
    .replaceAll('content="0; url=/', `content="0; url=${basePath}/`);
}

function renderNavigation(items, mobile = false) {
  return items.map((item, index) => {
    const number = String(index + 1).padStart(2, "0");
    const prefix = mobile ? `<span aria-hidden="true">${number}</span>` : "";
    const routeOverrides = { "Leistungen": "/leistungen/", "Mietpark": "/mietpark/", "Standorte": "/standorte/", "Unternehmen": "/unternehmen/", "Karriere": "/karriere/" };
    const href = routeOverrides[item.label] || item.href;
    return `<a href="${escapeHtml(href)}">${prefix}${escapeHtml(item.label)}</a>`;
  }).join("\n        ");
}

function renderFooter(assetPrefix) {
  return `<footer class="site-footer"><div class="container site-footer__grid"><div class="site-footer__brand"><a class="site-logo" href="/" aria-label="Schnell Gruppe – Startseite"><img src="${assetPrefix}assets/images/logo-white.webp" width="768" height="301" loading="lazy" alt="Schnell Gruppe"></a><p>Erdbau · Abbruch · Transport<br>Vermietung · Containerdienst</p></div><div><h2 class="footer-title">Kontakt</h2><address>${escapeHtml(homeData.company.address)}<br><a href="tel:${escapeHtml(homeData.company.phoneHref)}">${escapeHtml(homeData.company.phone)}</a><br><a href="mailto:${escapeHtml(homeData.company.email)}">${escapeHtml(homeData.company.email)}</a></address></div><div><h2 class="footer-title">Direkt</h2><ul class="footer-links"><li><a href="/leistungen/">Leistungen</a></li><li><a href="/mietpark/">Mietpark</a></li><li><a href="/standorte/">Standorte</a></li><li><a href="/ansprechpartner/">Ansprechpartner</a></li><li><a href="/karriere/">Karriere</a></li></ul></div><div><h2 class="footer-title">Rechtliches</h2><ul class="footer-links"><li><a href="/impressum/">Impressum</a></li><li><a href="/datenschutz/">Datenschutz</a></li><li><a href="/agb/">AGB</a></li></ul></div></div><div class="container site-footer__bottom"><span>© <span data-current-year></span> Schnell Gruppe</span><span class="site-footer__credit">Webdesign: <a href="https://webdesign-hamburg.de/">NOVAUX</a></span><a href="#main">Nach oben ↑</a></div></footer>`;
}

function commonReplacements(assetPrefix) {
  return {
    ASSET_PREFIX: assetPrefix,
    COMPANY_PHONE: escapeHtml(homeData.company.phone),
    COMPANY_PHONE_HREF: escapeHtml(homeData.company.phoneHref),
    COMPANY_EMAIL: escapeHtml(homeData.company.email),
    COMPANY_ADDRESS: escapeHtml(homeData.company.address),
    NAVIGATION: renderNavigation(homeData.navigation),
    MOBILE_NAVIGATION: renderNavigation(homeData.navigation, true)
  };
}

function renderFacts(items) {
  return items.map((item) => `
        <div class="hero-fact"><strong>${escapeHtml(item.value)}</strong><span>${escapeHtml(item.label)}</span></div>`).join("");
}

function renderHomeServiceCards(items) {
  return items.map((item) => {
    const anchor = item.slug === "baumaschinen-baugeraetevermietung" ? ' id="mietpark"' : "";
    return `
          <article class="service-card service-card--${escapeHtml(item.accent)}"${anchor} data-reveal>
            <a class="service-card__media" href="${escapeHtml(item.href)}" tabindex="-1" aria-hidden="true"><img src="${escapeHtml(item.image)}" width="${Number(item.imageWidth)}" height="${Number(item.imageHeight)}" loading="lazy" alt=""></a>
            <div class="service-card__copy"><p class="card-label">${escapeHtml(item.label)}</p><h3><a href="${escapeHtml(item.href)}">${escapeHtml(item.title)}</a></h3><p>${escapeHtml(item.text)}</p><a class="card-link" href="${escapeHtml(item.href)}" aria-label="Mehr über ${escapeHtml(item.title)}">Details ansehen <span aria-hidden="true">→</span></a></div>
          </article>`;
  }).join("");
}

function renderHomeServiceGroups(groups) {
  return groups.map((group, index) => `
          <article class="service-group" data-reveal><div class="service-group__number">${String(index + 1).padStart(2, "0")}</div><div><h3>${escapeHtml(group.label)}</h3><ul>${group.items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul></div></article>`).join("");
}

function renderLocations(locations) {
  return locations.map((location, index) => `
          <article class="location-card" data-reveal><span class="location-card__number">0${index + 1}</span><h3>${escapeHtml(location.name)}</h3><p>${escapeHtml(location.address)}</p><p class="location-card__functions">${escapeHtml(location.functions)}</p>${location.phone ? `<a class="location-card__phone" href="tel:${escapeHtml(location.phone.replaceAll(" ", ""))}">${escapeHtml(location.phone)}</a>` : ""}<a class="card-link" href="${escapeHtml(location.href)}" aria-label="Standort ${escapeHtml(location.name)} ansehen">Standort ansehen <span aria-hidden="true">→</span></a></article>`).join("");
}

function imageSize(service) {
  return service.image.includes("leistung-mietpark") ? { width: 1400, height: 875 } : { width: 1800, height: 1125 };
}

function imagePath(service, prefix) {
  return `${prefix}${service.image}`;
}

function renderServiceIndexGroups() {
  return serviceData.groups.map((group, groupIndex) => {
    const services = serviceData.services.filter((service) => service.groupId === group.id);
    const cards = services.map((service) => {
      const size = imageSize(service);
      return `
            <article class="service-index-card service-index-card--${escapeHtml(service.accent)}" data-reveal>
              <img class="service-index-card__image" src="${escapeHtml(imagePath(service, "../"))}" width="${size.width}" height="${size.height}" loading="lazy" alt="">
              <div class="service-index-card__shade"></div>
              <div class="service-index-card__copy"><h3><a href="/leistungen/${escapeHtml(service.slug)}/">${escapeHtml(service.shortTitle)}</a></h3><p>${escapeHtml(service.summary)}</p><a class="card-link" href="/leistungen/${escapeHtml(service.slug)}/" aria-label="${escapeHtml(service.title)} ansehen">Leistung ansehen <span aria-hidden="true">→</span></a></div>
            </article>`;
    }).join("");
    return `
        <section class="service-index-group" aria-labelledby="group-${escapeHtml(group.id)}">
          <div class="service-index-group__heading" data-reveal><span class="service-index-group__number">${String(groupIndex + 1).padStart(2, "0")}</span><h2 id="group-${escapeHtml(group.id)}">${escapeHtml(group.label)}</h2><p>${escapeHtml(group.description)}</p></div>
          <div class="service-index-cards">${cards}</div>
        </section>`;
  }).join("");
}

function renderBodyParagraphs(service) {
  return service.body.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("\n          ");
}

function renderFeatureSections(service) {
  return service.sections.map((section) => `
        <section class="service-feature-block" data-reveal><div class="service-feature-block__heading"><h2>${escapeHtml(section.heading)}</h2><span class="service-feature-block__count">${section.items.length} Punkte</span></div><ul class="feature-list">${section.items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul></section>`).join("");
}

function relatedServices(service) {
  const peers = serviceData.services.filter((candidate) => candidate.id !== service.id && candidate.groupId === service.groupId);
  const others = serviceData.services.filter((candidate) => candidate.id !== service.id && candidate.groupId !== service.groupId);
  return [...peers, ...others].slice(0, 3);
}

function renderRelatedServices(service) {
  return relatedServices(service).map((related) => {
    const size = imageSize(related);
    return `
          <article class="related-card" data-reveal><img src="${escapeHtml(imagePath(related, "../../"))}" width="${size.width}" height="${size.height}" loading="lazy" alt=""><div class="related-card__copy"><h3>${escapeHtml(related.shortTitle)}</h3><a class="card-link" href="/leistungen/${escapeHtml(related.slug)}/">Ansehen <span aria-hidden="true">→</span></a></div></article>`;
  }).join("");
}

function renderRentalCategoryOptions() {
  return rentalData.categories.map((category) => `<option value="${escapeHtml(category.id)}">${escapeHtml(category.label)}</option>`).join("");
}

function renderRentalItems() {
  const categoryLabels = new Map(rentalData.categories.map((category) => [category.id, category.label]));
  const locationLabels = new Map(locationData.locations.map((location) => [location.id, location.name]));
  return rentalData.items.map((item, index) => {
    const locationBadges = item.locationIds.map((locationId) => `<span>${escapeHtml(locationLabels.get(locationId) || locationId)}</span>`).join("");
    const firstLocation = item.locationIds[0] || "ockenheim";
    return `
          <article class="rental-item" data-rental-item data-rental-name="${escapeHtml(item.name)}" data-rental-category="${escapeHtml(item.categoryId)}" data-rental-locations="${escapeHtml(item.locationIds.join(" "))}" data-reveal>
            <div class="rental-item__top"><span>${escapeHtml(categoryLabels.get(item.categoryId) || item.categoryId)}</span><span>${String(index + 1).padStart(2, "0")}</span></div>
            <h3>${escapeHtml(item.name)}</h3><p>${escapeHtml(item.summary)}</p>
            <div class="rental-item__locations" aria-label="Verfügbar an">${locationBadges}</div>
            <a class="card-link" href="/kontakt/?thema=mietgeraete&amp;standort=${escapeHtml(firstLocation)}&amp;quelle=mietpark">Gerät anfragen <span aria-hidden="true">→</span></a>
          </article>`;
  }).join("");
}

function renderLocationIndexCards() {
  return locationData.locations.map((location, index) => `
          <article class="location-index-card" data-reveal>
            <div class="location-index-card__media"><img class="location-index-card__image" src="../${escapeHtml(location.image)}" width="1800" height="1125" loading="lazy" alt="${escapeHtml(location.imageAlt)}"></div>
            <div class="location-index-card__copy"><div class="location-index-card__meta"><span>${String(index + 1).padStart(2, "0")}</span><span>${escapeHtml(location.type)}</span></div><h3>${escapeHtml(location.name)}</h3><address>${escapeHtml(location.address)}</address><p>${escapeHtml(location.summary)}</p><a class="card-link" href="/standorte/${escapeHtml(location.slug)}/">Standort ansehen <span aria-hidden="true">→</span></a></div>
          </article>`).join("");
}

function renderLocationNetwork() {
  return locationData.locations.map((location, index) => `<li><span>${String(index + 1).padStart(2, "0")}</span><a href="/standorte/${escapeHtml(location.slug)}/">${escapeHtml(location.name)}</a><small>${escapeHtml(location.type)}</small></li>`).join("");
}

function renderFunctions(location) {
  return location.functions.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
}

function renderDirectContact(location) {
  const contactLinks = [];
  if (location.phone && location.phoneHref) contactLinks.push(`<a href="tel:${escapeHtml(location.phoneHref)}">${escapeHtml(location.phone)}</a>`);
  if (location.email) contactLinks.push(`<a href="mailto:${escapeHtml(location.email)}">${escapeHtml(location.email)}</a>`);
  const contact = contactLinks.length ? contactLinks.join("") : "<p>Für diesen Standort ist aktuell kein direkter Kontakt bestätigt. Nutzen Sie bitte das Kontaktformular.</p>";
  return `<address>${escapeHtml(location.address)}</address>${contact}`;
}

function renderOpeningHours(location) {
  return location.openingHours.map((hours) => `
          <article class="hours-card" data-reveal><div><h3>${escapeHtml(hours.season)}</h3>${hours.period ? `<p>${escapeHtml(hours.period)}</p>` : ""}</div><dl><div><dt>${escapeHtml(hours.weekdays)}</dt><dd>${escapeHtml(hours.weekdayHours)}</dd></div>${hours.saturday && hours.saturdayHours ? `<div><dt>${escapeHtml(hours.saturday)}</dt><dd>${escapeHtml(hours.saturdayHours)}</dd></div>` : ""}</dl></article>`).join("");
}

function renderProfileBody() {
  return companyData.profile.body.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("");
}

function renderProfileFacts() {
  return companyData.profile.facts.map((fact) => `<article data-reveal><strong>${escapeHtml(fact.value)}</strong><span>${escapeHtml(fact.label)}</span></article>`).join("");
}

function renderPrinciples() {
  return companyData.profile.principles.map((principle, index) => `<article data-reveal><span>${String(index + 1).padStart(2, "0")}</span><h3>${escapeHtml(principle.title)}</h3><p>${escapeHtml(principle.text)}</p></article>`).join("");
}

function renderRecyclingSteps() {
  return companyData.sustainability.steps.map((step) => `<article data-reveal><span>${escapeHtml(step.number)}</span><h3>${escapeHtml(step.title)}</h3><p>${escapeHtml(step.text)}</p></article>`).join("");
}

function renderRecyclingProducts() {
  return companyData.sustainability.products.map((product) => `<article data-reveal><h3>${escapeHtml(product.title)}</h3><p>${escapeHtml(product.use)}</p></article>`).join("");
}

function renderJobCards() {
  return careerData.jobs.filter((job) => job.status === "published").map((job, index) => `<article class="job-card" data-reveal><div class="job-card__number">${String(index + 1).padStart(2, "0")}</div><div><p class="card-label">${escapeHtml(job.department)}</p><h3><a href="/karriere/${escapeHtml(job.slug)}/">${escapeHtml(job.title)}</a></h3><p>${escapeHtml(job.summary)}</p><div class="job-card__meta"><span>${escapeHtml(job.location)}</span><span>${escapeHtml(job.start)}</span></div><a class="card-link" href="/karriere/${escapeHtml(job.slug)}/">Stelle ansehen <span aria-hidden="true">→</span></a></div></article>`).join("");
}

function renderList(items) {
  return items.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
}

function renderDownloadCategoryOptions() {
  return downloadsData.categories.map((category) => `<option value="${escapeHtml(category.id)}">${escapeHtml(category.label)}</option>`).join("");
}

function renderDownloadGroups() {
  return downloadsData.categories.map((category) => {
    const documents = downloadsData.documents.filter((document) => document.categoryId === category.id);
    return `<section class="download-group" data-download-group aria-labelledby="download-group-${escapeHtml(category.id)}"><h3 id="download-group-${escapeHtml(category.id)}">${escapeHtml(category.label)}</h3><div>${documents.map((document) => `<a class="download-row" data-download-item data-download-title="${escapeHtml(document.title)}" data-download-category="${escapeHtml(document.categoryId)}" href="../assets/documents/${escapeHtml(document.id)}.pdf" download><span>PDF</span><strong>${escapeHtml(document.title)}</strong><i aria-hidden="true">↓</i></a>`).join("")}</div></section>`;
  }).join("");
}

function renderContactFields() {
  const topicOptions = contactData.topics.map((topic) => `<option value="${escapeHtml(topic.id)}">${escapeHtml(topic.label)}</option>`).join("");
  const locationOptions = locationData.locations.map((location) => `<option value="${escapeHtml(location.id)}">${escapeHtml(location.name)}</option>`).join("");
  return contactData.fields.map((field) => {
    const required = field.required ? " required" : "";
    const marker = field.required ? " <b aria-hidden=\"true\">*</b>" : "";
    if (field.type === "textarea") return `<label class="form-field form-field--wide"><span>${escapeHtml(field.label)}${marker}</span><textarea name="${escapeHtml(field.id)}" rows="6"${required}></textarea></label>`;
    if (field.type === "select") {
      const options = field.id === "topic" ? topicOptions : locationOptions;
      return `<label class="form-field"><span>${escapeHtml(field.label)}${marker}</span><select name="${escapeHtml(field.id)}"${required}><option value="">Bitte wählen</option>${options}</select></label>`;
    }
    return `<label class="form-field"><span>${escapeHtml(field.label)}${marker}</span><input type="${escapeHtml(field.type)}" name="${escapeHtml(field.id)}" autocomplete="${field.id === "email" ? "email" : field.id === "phone" ? "tel" : "name"}"${required}></label>`;
  }).join("");
}

function phoneHref(phone) {
  return `+49${String(phone).replace(/\D/g, "").replace(/^0/, "")}`;
}

function renderContactPerson(person) {
  if (typeof person === "string") return `<li>${escapeHtml(person)}</li>`;
  const links = [person.phone ? `<a href="tel:${escapeHtml(phoneHref(person.phone))}">${escapeHtml(person.phone)}</a>` : "", person.mobile ? `<a href="tel:${escapeHtml(phoneHref(person.mobile))}">Mobil ${escapeHtml(person.mobile)}</a>` : "", person.email ? `<a href="mailto:${escapeHtml(person.email)}">${escapeHtml(person.email)}</a>` : ""].filter(Boolean).join("");
  return `<li><strong>${escapeHtml(person.name)}</strong>${links ? `<span>${links}</span>` : ""}</li>`;
}

function renderContactDepartments() {
  return contactsData.departments.map((department, index) => {
    const contactLinks = [department.phone ? `<a href="tel:${escapeHtml(department.phoneHref || phoneHref(department.phone))}">${escapeHtml(department.phone)}</a>` : "", department.email ? `<a href="mailto:${escapeHtml(department.email)}">${escapeHtml(department.email)}</a>` : ""].filter(Boolean).join("");
    return `<article class="contact-department" data-reveal><span>${String(index + 1).padStart(2, "0")}</span><h3>${escapeHtml(department.label)}</h3><ul>${department.people.map(renderContactPerson).join("")}</ul>${contactLinks ? `<div class="contact-department__links">${contactLinks}</div>` : ""}</article>`;
  }).join("");
}

const homeHtml = renderTemplate(homeTemplate, {
  META_TITLE: escapeHtml(homeData.meta.title), META_DESCRIPTION: escapeHtml(homeData.meta.description), META_CANONICAL: escapeHtml(homeData.meta.canonical),
  COMPANY_PHONE: escapeHtml(homeData.company.phone), COMPANY_PHONE_HREF: escapeHtml(homeData.company.phoneHref), COMPANY_EMAIL: escapeHtml(homeData.company.email), COMPANY_ADDRESS: escapeHtml(homeData.company.address),
  NAVIGATION: renderNavigation(homeData.navigation), MOBILE_NAVIGATION: renderNavigation(homeData.navigation, true),
  HERO_IMAGE: escapeHtml(homeData.hero.image), HERO_IMAGE_ALT: escapeHtml(homeData.hero.imageAlt), HERO_EYEBROW: escapeHtml(homeData.hero.eyebrow), HERO_HEADLINE: escapeHtml(homeData.hero.headline), HERO_TEXT: escapeHtml(homeData.hero.text), HERO_PRIMARY_LABEL: escapeHtml(homeData.hero.primaryCta.label), HERO_PRIMARY_HREF: escapeHtml(homeData.hero.primaryCta.href), HERO_SECONDARY_LABEL: escapeHtml(homeData.hero.secondaryCta.label), HERO_SECONDARY_HREF: escapeHtml(homeData.hero.secondaryCta.href),
  FACTS: renderFacts(homeData.facts), INTRO_EYEBROW: escapeHtml(homeData.intro.eyebrow), INTRO_HEADLINE: escapeHtml(homeData.intro.headline), INTRO_TEXT: escapeHtml(homeData.intro.text), FEATURED_SERVICES: renderHomeServiceCards(homeData.featuredServices), SERVICE_GROUPS: renderHomeServiceGroups(homeData.serviceGroups),
  RECYCLING_EYEBROW: escapeHtml(homeData.recycling.eyebrow), RECYCLING_HEADLINE: escapeHtml(homeData.recycling.headline), RECYCLING_TEXT: escapeHtml(homeData.recycling.text), RECYCLING_CTA_LABEL: escapeHtml(homeData.recycling.cta.label), RECYCLING_CTA_HREF: escapeHtml(homeData.recycling.cta.href), RECYCLING_IMAGE: escapeHtml(homeData.recycling.image), RECYCLING_IMAGE_ALT: escapeHtml(homeData.recycling.imageAlt),
  LOCATIONS: renderLocations(homeData.locations), CLOSING_EYEBROW: escapeHtml(homeData.closingCta.eyebrow), CLOSING_HEADLINE: escapeHtml(homeData.closingCta.headline), CLOSING_TEXT: escapeHtml(homeData.closingCta.text), CLOSING_CTA_LABEL: escapeHtml(homeData.closingCta.cta.label), CLOSING_CTA_HREF: escapeHtml(homeData.closingCta.cta.href)
});

const servicesIndexHtml = renderTemplate(servicesIndexTemplate, { ...commonReplacements("../"), SERVICE_INDEX_GROUPS: renderServiceIndexGroups() });
const rentalHtml = renderTemplate(rentalTemplate, {
  ...commonReplacements("../"),
  RENTAL_CATEGORY_OPTIONS: renderRentalCategoryOptions(),
  RENTAL_ITEM_COUNT: String(rentalData.items.length),
  RENTAL_ITEMS: renderRentalItems(),
  RENTAL_PHONE: escapeHtml(rentalData.contact.phone),
  RENTAL_PHONE_HREF: escapeHtml(rentalData.contact.phoneHref),
  RENTAL_EMAIL: escapeHtml(rentalData.contact.email)
});
const locationsIndexHtml = renderTemplate(locationsIndexTemplate, {
  ...commonReplacements("../"),
  LOCATION_INDEX_CARDS: renderLocationIndexCards(),
  LOCATION_NETWORK: renderLocationNetwork()
});
const companyHtml = renderTemplate(companyTemplate, {
  ...commonReplacements("../"),
  FOUNDED: String(companyData.profile.founded),
  PROFILE_HEADLINE: escapeHtml(companyData.profile.headline),
  PROFILE_LEAD: escapeHtml(companyData.profile.lead),
  PROFILE_BODY: renderProfileBody(),
  PROFILE_FACTS: renderProfileFacts(),
  PRINCIPLES: renderPrinciples(),
  FOOTER: renderFooter("../")
});
const sustainabilityHtml = renderTemplate(sustainabilityTemplate, {
  ...commonReplacements("../../"),
  SUSTAINABILITY_HEADLINE: escapeHtml(companyData.sustainability.headline),
  SUSTAINABILITY_LEAD: escapeHtml(companyData.sustainability.lead),
  RECYCLING_STEPS: renderRecyclingSteps(),
  RECYCLING_PRODUCTS: renderRecyclingProducts(),
  RECYCLING_LOCATIONS: escapeHtml(companyData.sustainability.locations.join(" und ")),
  FOOTER: renderFooter("../../")
});
const careerIndexHtml = renderTemplate(careerIndexTemplate, {
  ...commonReplacements("../"),
  CAREER_HEADLINE: escapeHtml(careerData.intro.headline),
  CAREER_LEAD: escapeHtml(careerData.intro.lead),
  VERIFIED_AT: escapeHtml(new Intl.DateTimeFormat("de-DE").format(new Date(`${careerData.meta.verifiedAt}T12:00:00Z`))),
  JOB_CARDS: renderJobCards(),
  FOOTER: renderFooter("../")
});
let downloadsHtml = renderTemplate(downloadsTemplate, {
  ...commonReplacements("../"),
  DOCUMENT_COUNT: String(downloadsData.documents.length),
  DOWNLOAD_CATEGORY_OPTIONS: renderDownloadCategoryOptions(),
  DOWNLOAD_GROUPS: renderDownloadGroups(),
  FOOTER: renderFooter("../")
});
downloadsHtml = downloadsHtml.replace("Die Dokumente sind bis zur lokalen Übernahme direkt bei der Schnell Gruppe verlinkt und öffnen in einem neuen Fenster.", "Alle Dokumente liegen als geprüfte lokale Projektkopien vor. Die fachliche Aktualität bitte vor Nutzung prüfen.");
const contactHtml = renderTemplate(contactTemplate, {
  ...commonReplacements("../"),
  CONTACT_RECIPIENT: escapeHtml(contactData.recipient),
  CONTACT_FIELDS: renderContactFields(),
  FOOTER: renderFooter("../")
});
const contactsHtml = renderTemplate(contactsTemplate, {
  ...commonReplacements("../"),
  VERIFIED_AT: escapeHtml(new Intl.DateTimeFormat("de-DE").format(new Date(`${contactsData.meta.verifiedAt}T12:00:00Z`))),
  CONTACT_DEPARTMENTS: renderContactDepartments(),
  FOOTER: renderFooter("../")
});

await rm(outputRoot, { recursive: true, force: true });
await mkdir(path.join(outputRoot, "data"), { recursive: true });
await mkdir(path.join(outputRoot, "leistungen"), { recursive: true });
await mkdir(path.join(outputRoot, "mietpark"), { recursive: true });
await mkdir(path.join(outputRoot, "standorte"), { recursive: true });
await mkdir(path.join(outputRoot, "unternehmen", "nachhaltigkeit-recycling"), { recursive: true });
await mkdir(path.join(outputRoot, "karriere"), { recursive: true });
await mkdir(path.join(outputRoot, "downloads"), { recursive: true });
await mkdir(path.join(outputRoot, "kontakt"), { recursive: true });
await mkdir(path.join(outputRoot, "ansprechpartner"), { recursive: true });
await Promise.all(contactData.legal.map((legal) => mkdir(path.join(outputRoot, legal.slug), { recursive: true })));
await cp(path.join(sourceRoot, "assets"), path.join(outputRoot, "assets"), { recursive: true });

const writes = [
  writeFile(path.join(outputRoot, "index.html"), homeHtml, "utf8"),
  writeFile(path.join(outputRoot, "leistungen", "index.html"), servicesIndexHtml, "utf8"),
  writeFile(path.join(outputRoot, "mietpark", "index.html"), rentalHtml, "utf8"),
  writeFile(path.join(outputRoot, "standorte", "index.html"), locationsIndexHtml, "utf8"),
  writeFile(path.join(outputRoot, "unternehmen", "index.html"), companyHtml, "utf8"),
  writeFile(path.join(outputRoot, "unternehmen", "nachhaltigkeit-recycling", "index.html"), sustainabilityHtml, "utf8"),
  writeFile(path.join(outputRoot, "karriere", "index.html"), careerIndexHtml, "utf8"),
  writeFile(path.join(outputRoot, "downloads", "index.html"), downloadsHtml, "utf8"),
  writeFile(path.join(outputRoot, "kontakt", "index.html"), contactHtml, "utf8"),
  writeFile(path.join(outputRoot, "ansprechpartner", "index.html"), contactsHtml, "utf8"),
  writeFile(path.join(outputRoot, "data", "homepage.json"), `${JSON.stringify(homeData, null, 2)}\n`, "utf8"),
  writeFile(path.join(outputRoot, "data", "services.json"), `${JSON.stringify(serviceData, null, 2)}\n`, "utf8"),
  writeFile(path.join(outputRoot, "data", "rental.json"), `${JSON.stringify(rentalData, null, 2)}\n`, "utf8"),
  writeFile(path.join(outputRoot, "data", "locations.json"), `${JSON.stringify(locationData, null, 2)}\n`, "utf8"),
  writeFile(path.join(outputRoot, "data", "company.json"), `${JSON.stringify(companyData, null, 2)}\n`, "utf8"),
  writeFile(path.join(outputRoot, "data", "career.json"), `${JSON.stringify(careerData, null, 2)}\n`, "utf8"),
  writeFile(path.join(outputRoot, "data", "downloads.json"), `${JSON.stringify(downloadsData, null, 2)}\n`, "utf8"),
  writeFile(path.join(outputRoot, "data", "contact.json"), `${JSON.stringify(contactData, null, 2)}\n`, "utf8")
  ,writeFile(path.join(outputRoot, "data", "contacts.json"), `${JSON.stringify(contactsData, null, 2)}\n`, "utf8")
  ,writeFile(path.join(outputRoot, "data", "redirects.json"), `${JSON.stringify(redirectsData, null, 2)}\n`, "utf8")
];

for (const redirect of redirectsData.redirects) {
  const routeDirectory = path.join(outputRoot, redirect.from.replace(/^\//, "").replace(/\/$/, ""));
  await mkdir(routeDirectory, { recursive: true });
  const redirectHtml = renderTemplate(redirectTemplate, { REDIRECT_TO: escapeHtml(redirect.to) });
  writes.push(writeFile(path.join(routeDirectory, "index.html"), redirectHtml, "utf8"));
}

for (const legal of contactData.legal) {
  const publishedContent = legalContentData.pages[legal.slug];
  const legalHtml = renderTemplate(publishedContent ? legalContentTemplate : legalReviewTemplate, {
    ...commonReplacements("../"),
    LEGAL_TITLE: escapeHtml(legal.title),
    LEGAL_SLUG: escapeHtml(legal.slug),
    LEGAL_SOURCE: escapeHtml(legal.source),
    LEGAL_CONTENT: publishedContent || "",
    FOOTER: renderFooter("../")
  });
  writes.push(writeFile(path.join(outputRoot, legal.slug, "index.html"), legalHtml, "utf8"));
}

for (const service of serviceData.services) {
  const size = imageSize(service);
  const serviceHtml = renderTemplate(serviceDetailTemplate, {
    ...commonReplacements("../../"),
    META_TITLE: escapeHtml(`${service.title} | Schnell Gruppe`), META_DESCRIPTION: escapeHtml(service.summary), META_CANONICAL: escapeHtml(`https://schnell-gruppe.de/leistungen/${service.slug}/`), ROBOTS_META: service.status === "published" ? "" : '<meta name="robots" content="noindex,nofollow">',
    SLUG: escapeHtml(service.slug), ACCENT: escapeHtml(service.accent), SHORT_TITLE: escapeHtml(service.shortTitle), EYEBROW: escapeHtml(service.eyebrow), TITLE: escapeHtml(service.title), SUMMARY: escapeHtml(service.summary), LEAD: escapeHtml(service.lead), BODY_PARAGRAPHS: renderBodyParagraphs(service),
    HERO_IMAGE: escapeHtml(imagePath(service, "../../")), HERO_IMAGE_ALT: escapeHtml(service.imageAlt), IMAGE_WIDTH: String(size.width), IMAGE_HEIGHT: String(size.height),
    CONTACT_LABEL: escapeHtml(service.contact.label), CONTACT_PHONE: escapeHtml(service.contact.phone), CONTACT_PHONE_HREF: escapeHtml(service.contact.phoneHref), CONTACT_EMAIL: escapeHtml(service.contact.email), FEATURE_SECTIONS: renderFeatureSections(service), RELATED_SERVICES: renderRelatedServices(service)
  });
  const routeDirectory = path.join(outputRoot, "leistungen", service.slug);
  await mkdir(routeDirectory, { recursive: true });
  writes.push(writeFile(path.join(routeDirectory, "index.html"), serviceHtml, "utf8"));
}

for (const location of locationData.locations) {
  const locationHtml = renderTemplate(locationDetailTemplate, {
    ...commonReplacements("../../"),
    META_TITLE: escapeHtml(`${location.name} | Standorte | Schnell Gruppe`),
    META_DESCRIPTION: escapeHtml(location.summary),
    META_CANONICAL: escapeHtml(`https://schnell-gruppe.de/standorte/${location.slug}/`),
    SLUG: escapeHtml(location.slug),
    NAME: escapeHtml(location.name),
    TYPE: escapeHtml(location.type),
    SUMMARY: escapeHtml(location.summary),
    ADDRESS: escapeHtml(location.address),
    ROUTE_URL: escapeHtml(location.routeUrl),
    HERO_IMAGE: escapeHtml(`../../${location.image}`),
    HERO_IMAGE_ALT: escapeHtml(location.imageAlt),
    MEDIA_NOTE: escapeHtml(location.mediaNote),
    FUNCTIONS: renderFunctions(location),
    DIRECT_CONTACT: renderDirectContact(location),
    OPENING_HOURS: renderOpeningHours(location)
  });
  const routeDirectory = path.join(outputRoot, "standorte", location.slug);
  await mkdir(routeDirectory, { recursive: true });
  writes.push(writeFile(path.join(routeDirectory, "index.html"), locationHtml, "utf8"));
}

for (const job of careerData.jobs) {
  const verifiedAt = new Intl.DateTimeFormat("de-DE").format(new Date(`${careerData.meta.verifiedAt}T12:00:00Z`));
  const jobHtml = renderTemplate(jobDetailTemplate, {
    ...commonReplacements("../../"),
    META_TITLE: escapeHtml(`${job.title} | Karriere | Schnell Gruppe`),
    META_DESCRIPTION: escapeHtml(job.summary),
    META_CANONICAL: escapeHtml(`https://schnell-gruppe.de/karriere/${job.slug}/`),
    JOB_TITLE: escapeHtml(job.title),
    EMAIL_SUBJECT: encodeURIComponent(job.title),
    DEPARTMENT: escapeHtml(job.department),
    JOB_SUMMARY: escapeHtml(job.summary),
    JOB_LOCATION: escapeHtml(job.location),
    JOB_START: escapeHtml(job.start),
    JOB_TASKS: renderList(job.tasks),
    JOB_PROFILE: renderList(job.profile),
    JOB_BENEFITS: renderList(job.benefits),
    JOB_CONTACT: escapeHtml(job.contact.name),
    JOB_EMAIL: escapeHtml(job.contact.email),
    VERIFIED_AT: escapeHtml(verifiedAt),
    FOOTER: renderFooter("../../")
  });
  const routeDirectory = path.join(outputRoot, "karriere", job.slug);
  await mkdir(routeDirectory, { recursive: true });
  writes.push(writeFile(path.join(routeDirectory, "index.html"), jobHtml, "utf8"));
}

const publicServices = serviceData.services.filter((service) => service.status === "published");
const publicLocations = locationData.locations.filter((location) => location.status === "published");
const publicJobs = careerData.jobs.filter((job) => job.status === "published");
const sitemapUrls = ["https://schnell-gruppe.de/", "https://schnell-gruppe.de/leistungen/", ...publicServices.map((service) => `https://schnell-gruppe.de/leistungen/${service.slug}/`), "https://schnell-gruppe.de/mietpark/", "https://schnell-gruppe.de/standorte/", ...publicLocations.map((location) => `https://schnell-gruppe.de/standorte/${location.slug}/`), "https://schnell-gruppe.de/unternehmen/", "https://schnell-gruppe.de/unternehmen/nachhaltigkeit-recycling/", "https://schnell-gruppe.de/karriere/", ...publicJobs.map((job) => `https://schnell-gruppe.de/karriere/${job.slug}/`), "https://schnell-gruppe.de/downloads/", "https://schnell-gruppe.de/kontakt/", "https://schnell-gruppe.de/ansprechpartner/"];
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapUrls.map((url) => `  <url><loc>${url}</loc></url>`).join("\n")}\n</urlset>\n`;
writes.push(writeFile(path.join(outputRoot, "sitemap.xml"), sitemap, "utf8"), writeFile(path.join(outputRoot, "robots.txt"), "User-agent: *\nAllow: /\nSitemap: https://schnell-gruppe.de/sitemap.xml\n", "utf8"), writeFile(path.join(outputRoot, "_redirects"), redirectsData.redirects.map((redirect) => `${redirect.from} ${redirect.to} ${redirect.status}`).join("\n") + "\n", "utf8"), writeFile(path.join(outputRoot, ".nojekyll"), "", "utf8"));

await Promise.all(writes);
console.log(`Website erstellt: 37 Seiten inklusive Ansprechpartner, ${downloadsData.documents.length} lokaler Downloads und ${redirectsData.redirects.length} Alt-URL-Weiterleitungen.`);
