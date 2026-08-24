document.documentElement.classList.add("js");

const header = document.querySelector("[data-site-header]");
const menuButton = document.querySelector("[data-menu-toggle]");
const mobileMenu = document.querySelector("[data-mobile-menu]");
const year = document.querySelector("[data-current-year]");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

if (year) {
  year.textContent = String(new Date().getFullYear());
}

function setMenu(open) {
  if (!menuButton || !mobileMenu) return;

  menuButton.setAttribute("aria-expanded", String(open));
  mobileMenu.setAttribute("aria-hidden", String(!open));
  mobileMenu.classList.toggle("is-open", open);
  document.body.classList.toggle("menu-open", open);

  if (open) {
    mobileMenu.querySelector("a")?.focus();
  } else if (document.activeElement && mobileMenu.contains(document.activeElement)) {
    menuButton.focus();
  }
}

menuButton?.addEventListener("click", () => {
  const open = menuButton.getAttribute("aria-expanded") !== "true";
  setMenu(open);
});

mobileMenu?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => setMenu(false));
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && menuButton?.getAttribute("aria-expanded") === "true") {
    setMenu(false);
  }
});

window.addEventListener("resize", () => {
  if (window.innerWidth > 960 && menuButton?.getAttribute("aria-expanded") === "true") {
    setMenu(false);
  }
});

function updateHeader() {
  header?.classList.toggle("is-sticky", window.scrollY > 80);
}

updateHeader();
window.addEventListener("scroll", updateHeader, { passive: true });

const revealItems = document.querySelectorAll("[data-reveal]");

if (reducedMotion.matches || !("IntersectionObserver" in window)) {
  revealItems.forEach((item) => item.classList.add("is-visible"));
} else {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    });
  }, { rootMargin: "0px 0px -8%", threshold: 0.08 });

  revealItems.forEach((item) => observer.observe(item));
}

const rentalFilters = document.querySelector("[data-rental-filters]");

if (rentalFilters) {
  const search = rentalFilters.querySelector("[data-rental-search]");
  const category = rentalFilters.querySelector("[data-rental-category]");
  const location = rentalFilters.querySelector("[data-rental-location]");
  const items = [...document.querySelectorAll("[data-rental-item]")];
  const count = document.querySelector("[data-rental-count]");
  const empty = document.querySelector("[data-rental-empty]");

  const normalize = (value) => value.toLocaleLowerCase("de-DE").normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  function applyRentalFilters() {
    const searchValue = normalize(search?.value.trim() || "");
    const categoryValue = category?.value || "all";
    const locationValue = location?.value || "all";
    let visible = 0;

    items.forEach((item) => {
      const matchesSearch = !searchValue || normalize(item.dataset.rentalName || "").includes(searchValue);
      const matchesCategory = categoryValue === "all" || item.dataset.rentalCategory === categoryValue;
      const itemLocations = (item.dataset.rentalLocations || "").split(" ");
      const matchesLocation = locationValue === "all" || itemLocations.includes(locationValue);
      const matches = matchesSearch && matchesCategory && matchesLocation;
      item.hidden = !matches;
      if (matches) visible += 1;
    });

    if (count) count.textContent = `${visible} ${visible === 1 ? "Gerät oder Gruppe" : "Geräte & Gruppen"}`;
    if (empty) empty.hidden = visible !== 0;
  }

  rentalFilters.addEventListener("submit", (event) => event.preventDefault());
  search?.addEventListener("input", applyRentalFilters);
  category?.addEventListener("change", applyRentalFilters);
  location?.addEventListener("change", applyRentalFilters);
}

const downloadFilters = document.querySelector("[data-download-filters]");

if (downloadFilters) {
  const search = downloadFilters.querySelector("[data-download-search]");
  const category = downloadFilters.querySelector("[data-download-category]");
  const items = [...document.querySelectorAll("[data-download-item]")];
  const count = document.querySelector("[data-download-count]");
  const empty = document.querySelector("[data-download-empty]");
  const normalize = (value) => value.toLocaleLowerCase("de-DE").normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  function applyDownloadFilters() {
    const searchValue = normalize(search?.value.trim() || "");
    const categoryValue = category?.value || "all";
    let visible = 0;

    items.forEach((item) => {
      const matchesSearch = !searchValue || normalize(item.dataset.downloadTitle || "").includes(searchValue);
      const matchesCategory = categoryValue === "all" || item.dataset.downloadCategory === categoryValue;
      const matches = matchesSearch && matchesCategory;
      item.hidden = !matches;
      if (matches) visible += 1;
    });

    document.querySelectorAll("[data-download-group]").forEach((group) => {
      group.hidden = !group.querySelector("[data-download-item]:not([hidden])");
    });
    if (count) count.textContent = `${visible} ${visible === 1 ? "Dokument" : "Dokumente"}`;
    if (empty) empty.hidden = visible !== 0;
  }

  downloadFilters.addEventListener("submit", (event) => event.preventDefault());
  search?.addEventListener("input", applyDownloadFilters);
  category?.addEventListener("change", applyDownloadFilters);
}

const contactForm = document.querySelector("[data-contact-form]");

if (contactForm) {
  const error = contactForm.querySelector("[data-contact-error]");
  const status = contactForm.querySelector("[data-contact-status]");
  const topicField = contactForm.querySelector('[name="topic"]');
  const locationField = contactForm.querySelector('[name="location"]');
  const params = new URLSearchParams(window.location.search);
  if (topicField && params.has("thema")) topicField.value = params.get("thema");
  if (locationField && params.has("standort")) locationField.value = params.get("standort");

  contactForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!contactForm.checkValidity()) {
      error.hidden = false;
      status.textContent = "";
      contactForm.reportValidity();
      return;
    }

    error.hidden = true;
    const values = new FormData(contactForm);
    const recipient = contactForm.dataset.recipient;
    const subject = values.get("topic") ? `Website-Anfrage: ${values.get("topic")}` : "Website-Anfrage";
    const lines = [
      `Vorname: ${values.get("firstName") || ""}`,
      `Name: ${values.get("lastName") || ""}`,
      `E-Mail: ${values.get("email") || ""}`,
      `Telefon: ${values.get("phone") || ""}`,
      `Betreff: ${values.get("topic") || ""}`,
      `Standort: ${values.get("location") || ""}`,
      "",
      "Nachricht:",
      String(values.get("message") || "")
    ];
    status.textContent = "Ihr E-Mail-Programm wird vorbereitet.";
    window.location.href = `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join("\n"))}`;
  });
}
