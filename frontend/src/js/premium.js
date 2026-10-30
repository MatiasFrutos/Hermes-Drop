"use strict";

import { qs, qsa, showToast, renderIcons, escapeHtml, openDialog, closeDialog } from "./ui.js";
import { registerCommand } from "./fx.js";

const KEYS = {
  accent: "hermes:accent",
  draft: "hermes:draft",
  zen: "hermes:zen",
  mine: "hermes:my-drops"
};

const ACCENTS = [
  { name: "Champagne", dark: "#d9c7a3", light: "#8a6d3b" },
  { name: "Hielo", dark: "#a9c8f5", light: "#2f5fa8" },
  { name: "Salvia", dark: "#a8cfa0", light: "#3d7a46" },
  { name: "Coral", dark: "#f0a892", light: "#b4523a" },
  { name: "Lila", dark: "#c5b4f2", light: "#6a4cc0" }
];

const TEMPLATES = [
  { label: "Pista", title: "Pista escondida", message: "Mirá hacia arriba. La respuesta está más cerca de lo que pensás. 🧭" },
  { label: "Sorpresa", title: "Algo para vos", message: "Llegaste justo a tiempo. Este lugar guarda una sorpresa. 🎁" },
  { label: "Recuerdo", title: "Aquí pasó algo", message: "Acá me acordé de vos. Guardé este mensaje para cuando vuelvas. 🪽" },
  { label: "Aviso", title: "Dato útil", message: "Tip del lugar: el mejor momento para venir es al atardecer. 🔥" }
];

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function read(key, fallback = "") {
  try {
    return window.localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}

function write(key, value) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* modo privado: se ignora */
  }
}

export function initPremium() {
  injectSplash();
  injectProgress();
  injectBackToTop();
  injectAccentPicker();
  injectTemplates();
  injectPreview();
  injectDraftAutosave();
  injectMineExport();
  injectShortcuts();

  applyAccent(Number(read(KEYS.accent, "0")));
  setZen(read(KEYS.zen) === "1", false);

  bindMagnetic();
  bindStagger();
  bindNetwork();
  bindNavIndicator();
  window.addEventListener("hermes:theme", () => applyAccent(Number(read(KEYS.accent, "0"))));

  registerCommand({ icon: "focus", label: "Modo zen (minimalista)", run: () => setZen(!document.body.classList.contains("px-zen")) });
  registerCommand({ icon: "palette", label: "Cambiar color de acento", run: cycleAccent });
  registerCommand({ icon: "download", label: "Exportar Mis Drops (JSON)", run: exportMine });
  registerCommand({ icon: "keyboard", label: "Atajos de teclado", run: openKeys });

  renderIcons();
}

/* ---------- splash de entrada ---------- */

function injectSplash() {
  if (reducedMotion || sessionStorageGet("hermes:splash")) return;

  const splash = document.createElement("div");

  splash.className = "px-splash";
  splash.innerHTML = `
    <div class="px-splash__box">
      <img src="./public/hermes-icon.png" alt="" />
      <span class="px-splash__word">Hermes Drop</span>
      <span class="px-splash__bar"></span>
    </div>
  `;

  document.body.appendChild(splash);

  window.setTimeout(() => {
    splash.classList.add("is-done");
    window.setTimeout(() => splash.remove(), 700);
  }, 1100);

  sessionStorageSet("hermes:splash", "1");
}

function sessionStorageGet(key) {
  try {
    return window.sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function sessionStorageSet(key, value) {
  try {
    window.sessionStorage.setItem(key, value);
  } catch {
    /* ignorar */
  }
}

/* ---------- progreso de scroll + volver arriba ---------- */

let progressBar = null;
let topButton = null;

function injectProgress() {
  progressBar = document.createElement("div");
  progressBar.className = "px-progress";
  document.body.appendChild(progressBar);

  let ticking = false;

  window.addEventListener(
    "scroll",
    () => {
      if (ticking) return;

      ticking = true;

      window.requestAnimationFrame(() => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        const ratio = max > 0 ? window.scrollY / max : 0;

        progressBar.style.transform = `scaleX(${Math.min(Math.max(ratio, 0), 1)})`;
        topButton?.classList.toggle("is-on", window.scrollY > 600);
        ticking = false;
      });
    },
    { passive: true }
  );
}

function injectBackToTop() {
  topButton = document.createElement("button");
  topButton.type = "button";
  topButton.className = "px-top";
  topButton.setAttribute("aria-label", "Volver arriba");
  topButton.innerHTML = `<i data-lucide="arrow-up"></i>`;
  topButton.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
  document.body.appendChild(topButton);
}

/* ---------- acento de color ---------- */

function applyAccent(index) {
  const accent = ACCENTS[index] || ACCENTS[0];
  const light = document.documentElement.getAttribute("data-theme") === "light";
  const root = document.documentElement.style;

  root.setProperty("--accent", light ? accent.light : accent.dark);

  qsa(".px-accents button").forEach((btn, i) => btn.classList.toggle("is-on", i === index));
}

function cycleAccent() {
  const next = (Number(read(KEYS.accent, "0")) + 1) % ACCENTS.length;

  write(KEYS.accent, String(next));
  applyAccent(next);
  showToast(`Acento: ${ACCENTS[next].name}`);
}

function injectAccentPicker() {
  const dock = qs(".fx-dock");

  if (!dock) return;

  const picker = document.createElement("div");

  picker.className = "px-accents";
  picker.innerHTML = ACCENTS.map(
    (a, i) => `<button type="button" data-accent="${i}" title="${a.name}" aria-label="Acento ${a.name}" style="background:${a.dark}"></button>`
  ).join("");

  dock.appendChild(picker);

  const toggle = document.createElement("button");

  toggle.type = "button";
  toggle.title = "Color de acento";
  toggle.setAttribute("aria-label", "Color de acento");
  toggle.innerHTML = `<i data-lucide="palette"></i>`;
  toggle.addEventListener("click", () => picker.classList.toggle("is-open"));

  const zen = document.createElement("button");

  zen.type = "button";
  zen.title = "Modo zen";
  zen.setAttribute("aria-label", "Modo zen");
  zen.innerHTML = `<i data-lucide="focus"></i>`;
  zen.addEventListener("click", () => setZen(!document.body.classList.contains("px-zen")));

  dock.append(toggle, zen);

  picker.addEventListener("click", (event) => {
    const btn = event.target.closest("[data-accent]");

    if (!btn) return;

    const index = Number(btn.dataset.accent);

    write(KEYS.accent, String(index));
    applyAccent(index);
  });
}

/* ---------- modo zen ---------- */

function setZen(on, notify = true) {
  document.body.classList.toggle("px-zen", on);
  write(KEYS.zen, on ? "1" : "0");

  if (notify) showToast(on ? "Modo zen activado" : "Modo zen desactivado");
}

/* ---------- plantillas rápidas ---------- */

function injectTemplates() {
  const group = qs("#dropMessage")?.closest(".hd-form__group");
  const dock = qs(".hd-emoji-dock", group || document);

  if (!group || !dock) return;

  const wrap = document.createElement("div");

  wrap.className = "px-templates";
  wrap.setAttribute("aria-label", "Plantillas rápidas");
  wrap.innerHTML = TEMPLATES.map((t, i) => `<button type="button" class="px-chip" data-tpl="${i}">${escapeHtml(t.label)}</button>`).join("");

  dock.insertAdjacentElement("beforebegin", wrap);

  wrap.addEventListener("click", (event) => {
    const btn = event.target.closest("[data-tpl]");
    const tpl = btn ? TEMPLATES[Number(btn.dataset.tpl)] : null;

    if (!tpl) return;

    const title = qs("#dropTitle");
    const message = qs("#dropMessage");

    if (title) title.value = tpl.title;

    if (message) {
      message.value = tpl.message;
      message.dispatchEvent(new Event("input", { bubbles: true }));
      message.focus();
    }

    title?.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

/* ---------- vista previa en vivo ---------- */

function injectPreview() {
  const actions = qs("#createDropForm .hd-form__actions");

  if (!actions) return;

  const preview = document.createElement("div");

  preview.className = "px-preview";
  preview.innerHTML = `
    <div class="px-preview__top"><span>Vista previa</span><span class="px-draft" id="pxDraft"><i data-lucide="check-circle-2"></i>Borrador guardado</span></div>
    <h4 class="px-preview__title" id="pxPrevTitle"></h4>
    <p class="px-preview__msg is-blurred px-caret" id="pxPrevMsg"></p>
    <div class="px-preview__meta" id="pxPrevMeta"></div>
  `;

  actions.insertAdjacentElement("beforebegin", preview);

  const form = qs("#createDropForm");
  const update = () => {
    const title = qs("#dropTitle")?.value.trim() || "Título del Drop";
    const message = qs("#dropMessage")?.value.trim() || "Tu mensaje aparecerá acá…";
    const radius = qs("#dropRadius");
    const duration = qs("#dropDuration");
    const locked = Boolean(qs("#dropKeyword")?.value.trim());

    qs("#pxPrevTitle").textContent = title;
    qs("#pxPrevMsg").textContent = message;
    qs("#pxPrevMeta").innerHTML = [
      `📍 ${escapeHtml(radius?.selectedOptions[0]?.text || "")}`,
      `⏳ ${escapeHtml(duration?.selectedOptions[0]?.text || "")}`,
      locked ? "🔐 Con clave" : "🔓 Sin clave"
    ]
      .map((t) => `<span>${t}</span>`)
      .join("");
  };

  form?.addEventListener("input", update);
  form?.addEventListener("change", update);
  form?.addEventListener("reset", () => window.setTimeout(update, 0));

  update();
}

/* ---------- autoguardado de borrador (sin la clave) ---------- */

function injectDraftAutosave() {
  const form = qs("#createDropForm");

  if (!form) return;

  const fields = ["#dropTitle", "#dropMessage", "#dropRadius", "#dropDuration"];

  try {
    const draft = JSON.parse(read(KEYS.draft, "{}"));

    fields.forEach((selector) => {
      const el = qs(selector);

      if (el && typeof draft[selector] === "string") {
        el.value = draft[selector];
        el.dispatchEvent(new Event("input", { bubbles: true }));
      }
    });
  } catch {
    /* borrador corrupto: se ignora */
  }

  let timer = null;

  form.addEventListener("input", () => {
    window.clearTimeout(timer);

    timer = window.setTimeout(() => {
      const draft = {};

      fields.forEach((selector) => {
        draft[selector] = qs(selector)?.value || "";
      });

      write(KEYS.draft, JSON.stringify(draft));

      const badge = qs("#pxDraft");

      badge?.classList.add("is-on");
      window.setTimeout(() => badge?.classList.remove("is-on"), 1600);
    }, 500);
  });

  window.addEventListener("hermes:drop-created", () => write(KEYS.draft, "{}"));
  form.addEventListener("reset", () => write(KEYS.draft, "{}"));
}

/* ---------- exportar Mis Drops ---------- */

function exportMine() {
  let list = [];

  try {
    list = JSON.parse(read(KEYS.mine, "[]"));
  } catch {
    list = [];
  }

  if (!Array.isArray(list) || !list.length) {
    showToast("No hay Drops para exportar.", "warning");
    return;
  }

  const blob = new Blob([JSON.stringify(list, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "mis-drops-hermes.json";
  link.click();

  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  showToast("Exportación lista.", "success");
}

function injectMineExport() {
  const clear = qs("#fxClearMine");

  if (!clear) return;

  const button = document.createElement("button");

  button.className = "hd-btn hd-btn--compact";
  button.type = "button";
  button.innerHTML = `<i data-lucide="download"></i>Exportar`;
  button.addEventListener("click", exportMine);

  clear.insertAdjacentElement("beforebegin", button);
  clear.parentElement.style.display = "flex";
  clear.parentElement.style.gap = "8px";
}

/* ---------- atajos de teclado ---------- */

function injectShortcuts() {
  const dialog = document.createElement("dialog");

  dialog.className = "px-keys";
  dialog.id = "pxKeys";
  dialog.innerHTML = `
    <div class="px-keys__box">
      <h3>Atajos de teclado</h3>
      <dl>
        <div><dt>Paleta de comandos</dt><dd><kbd>Ctrl</kbd> <kbd>K</kbd></dd></div>
        <div><dt>Enviar mensaje</dt><dd><kbd>Ctrl</kbd> <kbd>Enter</kbd></dd></div>
        <div><dt>Modo zen</dt><dd><kbd>Z</kbd></dd></div>
        <div><dt>Cambiar acento</dt><dd><kbd>A</kbd></dd></div>
        <div><dt>Esta ayuda</dt><dd><kbd>?</kbd></dd></div>
      </dl>
    </div>
  `;

  document.body.appendChild(dialog);

  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) closeDialog(dialog);
  });

  document.addEventListener("keydown", (event) => {
    const tag = (event.target.tagName || "").toLowerCase();

    if (["input", "textarea", "select"].includes(tag) || event.ctrlKey || event.metaKey || event.altKey) return;

    if (event.key === "?") openKeys();
    else if (event.key.toLowerCase() === "z") setZen(!document.body.classList.contains("px-zen"));
    else if (event.key.toLowerCase() === "a") cycleAccent();
  });
}

function openKeys() {
  openDialog(qs("#pxKeys"));
}

/* ---------- ripple y botones magnéticos ---------- */

function bindMagnetic() {
  if (reducedMotion || !window.matchMedia("(hover: hover)").matches) return;

  document.addEventListener("pointermove", (event) => {
    qsa(".hd-btn--primary, .hd-btn--secondary").forEach((btn) => {
      const rect = btn.getBoundingClientRect();
      const dx = event.clientX - (rect.left + rect.width / 2);
      const dy = event.clientY - (rect.top + rect.height / 2);
      const dist = Math.hypot(dx, dy);

      btn.style.transform = dist < 80 ? `translate(${(dx * 0.14).toFixed(1)}px, ${(dy * 0.2).toFixed(1)}px)` : "";
    });
  });
}

/* ---------- stagger en listas dinámicas ---------- */

function bindStagger() {
  const targets = [qs("#nearbyDropsList"), qs("#fxMine")].filter(Boolean);

  targets.forEach((list) => {
    new MutationObserver(() => {
      Array.from(list.children).forEach((child, i) => child.style.setProperty("--i", String(i)));
    }).observe(list, { childList: true });
  });
}

/* ---------- conexión ---------- */

function bindNetwork() {
  window.addEventListener("offline", () => showToast("Sin conexión. Hermes espera señal…", "warning"));
  window.addEventListener("online", () => showToast("Conexión restablecida.", "success"));
}

/* ---------- indicador deslizante de navegación ---------- */

function bindNavIndicator() {
  const nav = qs(".hd-nav");
  const bar = qs(".hd-nav__bar");
  const links = qsa("[data-nav]");

  if (!nav || !bar || !links.length) return;

  const move = (link) => {
    if (!link) {
      bar.style.opacity = "0";
      return;
    }

    bar.style.opacity = "1";
    bar.style.width = `${link.offsetWidth}px`;
    bar.style.transform = `translateX(${link.offsetLeft}px)`;
  };

  const sections = links.map((link) => qs(link.getAttribute("href"))).filter(Boolean);
  let current = null;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        current = links.find((link) => link.getAttribute("href") === `#${entry.target.id}`) || null;
        links.forEach((link) => link.classList.toggle("is-active", link === current));
        move(current);
      });
    },
    { rootMargin: "-40% 0px -55% 0px" }
  );

  sections.forEach((section) => observer.observe(section));

  links.forEach((link) => {
    link.addEventListener("mouseenter", () => move(link));
    link.addEventListener("focus", () => move(link));
  });

  nav.addEventListener("mouseleave", () => move(current));
  window.addEventListener("resize", () => move(current));
}
