"use strict";

import { qs, qsa, showToast, renderIcons, escapeHtml, openDialog, closeDialog } from "./ui.js";

const STORE = {
  theme: "hermes:theme",
  sound: "hermes:sound",
  mine: "hermes:my-drops"
};

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

let soundOn = readStore(STORE.sound, "on") === "on";
let audioCtx = null;
let nearbyCount = 0;
let lastAccuracy = null;
let radarDots = [];

/* ---------- almacenamiento seguro ---------- */

function readStore(key, fallback) {
  try {
    return window.localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}

function writeStore(key, value) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* modo privado: se ignora */
  }
}

/* ---------- arranque ---------- */

export function initFx() {
  applyTheme(readStore(STORE.theme, "dark"));

  injectDock();
  injectHud();
  injectRadar();
  injectMineSection();
  injectCounter();
  injectPalette();

  bindReveal();
  bindButtonSounds();
  bindEvents();

  renderMine();
  window.setInterval(tickMine, 1000);
  window.setInterval(tickClock, 1000);
  tickClock();

  renderIcons();
}

/* ---------- tema ---------- */

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme === "light" ? "light" : "dark");
  window.dispatchEvent(new CustomEvent("hermes:theme", { detail: { theme: theme === "light" ? "light" : "dark" } }));
}

function toggleTheme() {
  const next = document.documentElement.getAttribute("data-theme") === "light" ? "dark" : "light";

  applyTheme(next);
  writeStore(STORE.theme, next);
  beep(next === "dark" ? 360 : 640);
  showToast(next === "dark" ? "Modo oscuro" : "Modo claro");
}

/* ---------- sonido (WebAudio, sin archivos) ---------- */

function beep(freq = 520, duration = 0.09, type = "sine", volume = 0.04) {
  if (!soundOn) return;

  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(volume, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);

    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch {
    /* audio no disponible */
  }
}

function chime() {
  [523, 659, 784, 1046].forEach((f, i) => window.setTimeout(() => beep(f, 0.16, "triangle", 0.05), i * 90));
}

function toggleSound() {
  soundOn = !soundOn;
  writeStore(STORE.sound, soundOn ? "on" : "off");
  syncDock();
  beep(700);
  showToast(soundOn ? "Sonido activado" : "Sonido silenciado");
}

function bindButtonSounds() {
  document.addEventListener("click", (event) => {
    if (event.target.closest(".hd-btn, .hd-emoji-bar button, .hd-nav a")) {
      beep(480 + Math.random() * 160, 0.05, "sine", 0.025);
    }
  });
}

/* ---------- dock flotante ---------- */

function injectDock() {
  const dock = document.createElement("div");

  dock.className = "fx-dock";
  dock.innerHTML = `
    <button type="button" id="fxThemeBtn" title="Cambiar tema" aria-label="Cambiar tema"><i data-lucide="sun-moon"></i></button>
    <button type="button" id="fxSoundBtn" title="Sonido" aria-label="Sonido"><i data-lucide="volume-2"></i></button>
    <button type="button" id="fxPaletteBtn" title="Comandos (Ctrl+K)" aria-label="Abrir comandos"><i data-lucide="command"></i></button>
  `;

  document.body.appendChild(dock);

  qs("#fxThemeBtn").addEventListener("click", toggleTheme);
  qs("#fxSoundBtn").addEventListener("click", toggleSound);
  qs("#fxPaletteBtn").addEventListener("click", openPalette);

  syncDock();
}

function syncDock() {
  const button = qs("#fxSoundBtn");

  if (!button) return;

  button.classList.toggle("is-off", !soundOn);
  button.innerHTML = `<i data-lucide="${soundOn ? "volume-2" : "volume-x"}"></i>`;
  renderIcons();
}

/* ---------- revelado al scroll ---------- */

function bindReveal() {
  const targets = qsa(".hd-panel, .hd-map-section, .fx-mine-section");

  if (!("IntersectionObserver" in window)) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );

  targets.forEach((el, i) => {
    el.classList.add("fx-reveal");
    el.style.setProperty("--fx-d", String(i % 4));
    observer.observe(el);
  });
}

/* ---------- HUD ---------- */

function injectHud() {
  const board = qs(".hd-board");
  const intro = qs(".hd-board__intro");

  if (!board || !intro) return;

  const hud = document.createElement("div");

  hud.className = "fx-hud";
  hud.setAttribute("aria-label", "Estado en vivo");
  hud.innerHTML = `
    <span class="fx-hud__cell"><span class="fx-live-dot"></span>EN VIVO</span>
    <span class="fx-hud__cell"><i data-lucide="clock-3"></i><b id="fxClock">--:--:--</b></span>
    <span class="fx-hud__cell"><i data-lucide="satellite-dish"></i>GPS <b id="fxGps">--</b></span>
    <span class="fx-hud__cell"><i data-lucide="radar"></i>Cercanos <b id="fxNearby">0</b></span>
    <span class="fx-hud__cell"><i data-lucide="package"></i>Mis Drops <b id="fxMineCount">0</b></span>
  `;

  board.insertBefore(hud, intro);
}

function tickClock() {
  const clock = qs("#fxClock");

  if (clock) {
    clock.textContent = new Date().toLocaleTimeString("es-AR", { hour12: false });
  }
}

function setHud(id, value) {
  const el = qs(id);

  if (!el) return;

  const text = String(value);

  if (el.textContent === text) return;

  el.textContent = text;
  el.animate(
    [{ transform: "translateY(-4px)", opacity: 0.2 }, { transform: "none", opacity: 1 }],
    { duration: 300, easing: "ease-out" }
  );
}

/* ---------- radar ---------- */

function injectRadar() {
  const intro = qs(".hd-board__intro");

  if (!intro) return;

  const wrap = document.createElement("div");

  wrap.className = "fx-radar-wrap fx-radar-wrap--hero";
  wrap.innerHTML = `
    <div class="fx-radar" id="fxRadar" role="img" aria-label="Radar de Drops cercanos"></div>
    <span class="fx-radar-caption">Radar · <b id="fxRadarCount">0</b> señales</span>
  `;

  intro.appendChild(wrap);
}

function renderRadar(drops) {
  const radar = qs("#fxRadar");

  if (!radar) return;

  radarDots.forEach((dot) => dot.remove());
  radarDots = [];

  const maxDistance = Math.max(...drops.map((d) => Number(d.distanceMeters || 0)), 50);

  drops.forEach((drop, i) => {
    const dot = document.createElement("span");
    const ratio = Math.min(Number(drop.distanceMeters || 0) / maxDistance, 1);
    const angle = (i * 137.5 * Math.PI) / 180;
    const dist = 12 + ratio * 36;

    dot.className = "fx-radar__dot";
    dot.style.left = `${50 + Math.cos(angle) * dist}%`;
    dot.style.top = `${50 + Math.sin(angle) * dist}%`;
    dot.style.animationDelay = `${(i * 0.3).toFixed(1)}s`;
    dot.title = drop.title || "Drop";

    radar.appendChild(dot);
    radarDots.push(dot);
  });

  setHud("#fxRadarCount", drops.length);
}

/* ---------- contador de caracteres ---------- */

function injectCounter() {
  const textarea = qs("#dropMessage");

  if (!textarea) return;

  const max = Number(textarea.maxLength) > 0 ? Number(textarea.maxLength) : 1000;
  const counter = document.createElement("div");

  counter.className = "fx-counter";
  counter.innerHTML = `
    <svg class="fx-ring" viewBox="0 0 24 24" aria-hidden="true">
      <circle class="bg" cx="12" cy="12" r="9"></circle>
      <circle class="fg" cx="12" cy="12" r="9"></circle>
    </svg>
    <span><b id="fxCharCount">0</b> / ${max}</span>
  `;

  textarea.insertAdjacentElement("afterend", counter);

  const fg = counter.querySelector(".fg");
  const circumference = 56.55;

  function update() {
    const length = textarea.value.length;
    const ratio = Math.min(length / max, 1);

    counter.querySelector("#fxCharCount").textContent = String(length);
    fg.style.strokeDashoffset = String(circumference * (1 - ratio));
    counter.classList.toggle("is-warn", ratio >= 0.8 && ratio < 1);
    counter.classList.toggle("is-max", ratio >= 1);
  }

  textarea.addEventListener("input", update);
  textarea.form?.addEventListener("reset", () => window.setTimeout(update, 0));

  textarea.addEventListener("keydown", (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
      textarea.form?.requestSubmit();
    }
  });

  update();
}

/* ---------- Mis Drops (historial local con cuenta regresiva) ---------- */

function loadMine() {
  try {
    const list = JSON.parse(readStore(STORE.mine, "[]"));

    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

function saveMine(list) {
  writeStore(STORE.mine, JSON.stringify(list.slice(0, 30)));
}

function injectMineSection() {
  const workspace = qs(".hd-workspace");

  if (!workspace) return;

  const section = document.createElement("section");

  section.className = "fx-mine-section";
  section.id = "mis";
  section.innerHTML = `
    <div class="hd-panel__header hd-panel__header--inline">
      <div>
        <span class="hd-kicker"><b>04</b>Este dispositivo</span>
        <h3>Mis Drops</h3>
      </div>
      <button class="hd-btn hd-btn--compact" type="button" id="fxClearMine"><i data-lucide="trash-2"></i>Limpiar</button>
    </div>
    <div class="fx-mine" id="fxMine"></div>
  `;

  workspace.insertAdjacentElement("afterend", section);

  qs("#fxClearMine").addEventListener("click", () => {
    saveMine([]);
    renderMine();
    showToast("Historial local borrado.");
  });
}

function renderMine() {
  const box = qs("#fxMine");

  if (!box) return;

  const list = loadMine();

  setHud("#fxMineCount", list.filter((d) => d.expiresAt > Date.now()).length);

  if (!list.length) {
    box.innerHTML = `
      <div class="hd-empty">
        <i data-lucide="package-open"></i>
        <strong>Todavía no creaste Drops</strong>
        <span>Los Drops que crees aparecen acá con su cuenta regresiva. Solo se guardan en tu dispositivo.</span>
      </div>
    `;
    renderIcons();
    return;
  }

  box.innerHTML = list
    .map(
      (d) => `
      <div class="fx-mine__item" data-mine="${escapeHtml(d.code)}" data-start="${d.createdAt}" data-end="${d.expiresAt}">
        <i data-lucide="${d.hasKeyword ? "lock-keyhole" : "mail"}"></i>
        <div>
          <span class="fx-mine__title">${escapeHtml(d.title || "Drop sin título")}</span>
          <span class="fx-mine__sub"><span class="fx-mine__code">${escapeHtml(d.code)}</span> · <span data-left>--</span></span>
        </div>
        <div class="fx-mine__actions">
          <button class="fx-mini-btn" type="button" data-share="${escapeHtml(d.code)}" title="Compartir código" aria-label="Compartir código"><i data-lucide="share-2"></i></button>
          <button class="fx-mini-btn" type="button" data-copy="${escapeHtml(d.code)}" title="Copiar código" aria-label="Copiar código"><i data-lucide="copy"></i></button>
          <button class="fx-mini-btn" type="button" data-del="${escapeHtml(d.code)}" title="Quitar" aria-label="Quitar"><i data-lucide="x"></i></button>
        </div>
        <div class="fx-mine__bar"><span data-bar style="width:100%"></span></div>
      </div>`
    )
    .join("");

  box.querySelectorAll("[data-copy]").forEach((btn) =>
    btn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(btn.dataset.copy);
        showToast("Código copiado.", "success");
        beep(880, 0.08);
      } catch {
        showToast("No se pudo copiar.", "warning");
      }
    })
  );

  box.querySelectorAll("[data-share]").forEach((btn) =>
    btn.addEventListener("click", async () => {
      const text = `Hay un Drop esperándote en Hermes Drop. Código: ${btn.dataset.share}`;

      try {
        if (navigator.share) {
          await navigator.share({ title: "Hermes Drop", text });
        } else {
          await navigator.clipboard.writeText(text);
          showToast("Mensaje copiado para compartir.", "success");
        }
      } catch {
        /* compartir cancelado */
      }
    })
  );

  box.querySelectorAll("[data-del]").forEach((btn) =>
    btn.addEventListener("click", () => {
      saveMine(loadMine().filter((d) => d.code !== btn.dataset.del));
      renderMine();
    })
  );

  renderIcons();
  tickMine();
}

function formatLeft(ms) {
  if (ms <= 0) return "Expirado";

  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;

  if (d) return `${d}d ${h}h`;
  if (h) return `${h}h ${String(m).padStart(2, "0")}m`;

  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

function tickMine() {
  const now = Date.now();

  qsa("[data-mine]").forEach((item) => {
    const start = Number(item.dataset.start);
    const end = Number(item.dataset.end);
    const left = end - now;
    const pct = Math.max(0, Math.min(100, (left / (end - start)) * 100));

    item.querySelector("[data-left]").textContent = formatLeft(left);
    item.querySelector("[data-bar]").style.width = `${pct}%`;
    item.classList.toggle("is-expired", left <= 0);
  });
}

/* ---------- confeti ---------- */

function confetti() {
  if (reducedMotion) return;

  const canvas = document.createElement("canvas");

  canvas.id = "fxConfetti";
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  document.body.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  const accent = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || "#d9c7a3";
  const colors = [accent, "#f5f3ee", "#8a8a8f", accent];
  const pieces = Array.from({ length: 140 }, () => ({
    x: canvas.width / 2,
    y: canvas.height * 0.4,
    vx: (Math.random() - 0.5) * 16,
    vy: Math.random() * -14 - 3,
    s: Math.random() * 7 + 4,
    c: colors[Math.floor(Math.random() * colors.length)],
    r: Math.random() * Math.PI,
    vr: (Math.random() - 0.5) * 0.4
  }));

  let frames = 0;

  (function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    pieces.forEach((p) => {
      p.vy += 0.35;
      p.x += p.vx;
      p.y += p.vy;
      p.r += p.vr;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.r);
      ctx.fillStyle = p.c;
      ctx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2);
      ctx.restore();
    });

    frames += 1;

    if (frames < 130) {
      window.requestAnimationFrame(draw);
    } else {
      canvas.remove();
    }
  })();
}

/* ---------- paleta de comandos (Ctrl+K) ---------- */

let paletteItems = [];
let paletteIndex = 0;

const COMMANDS = [
  { icon: "plus-circle", label: "Crear Drop", run: () => goto("#crear", "#dropMessage") },
  { icon: "scan-search", label: "Buscar Drops cercanos", run: () => qs("#findNearbyDropsButton")?.click() },
  { icon: "map", label: "Ir al mapa", run: () => goto("#mapa") },
  { icon: "package-check", label: "Ver Mis Drops", run: () => qs(".fx-mine-section")?.scrollIntoView({ behavior: "smooth" }) },
  { icon: "sun-moon", label: "Cambiar tema claro / oscuro", run: toggleTheme },
  { icon: "volume-2", label: "Activar / silenciar sonido", run: toggleSound },
  { icon: "arrow-up", label: "Volver arriba", run: () => window.scrollTo({ top: 0, behavior: "smooth" }) }
];

export function registerCommand(command) {
  COMMANDS.push(command);
}

function goto(hash, focusSelector) {
  qs(hash)?.scrollIntoView({ behavior: "smooth", block: "start" });

  if (focusSelector) {
    window.setTimeout(() => qs(focusSelector)?.focus({ preventScroll: true }), 500);
  }
}

function injectPalette() {
  const dialog = document.createElement("dialog");

  dialog.className = "fx-palette";
  dialog.id = "fxPalette";
  dialog.innerHTML = `
    <div class="fx-palette__box">
      <input type="text" id="fxPaletteInput" placeholder="Escribí un comando…" autocomplete="off" aria-label="Buscar comando" />
      <ul id="fxPaletteList" role="listbox"></ul>
      <div class="fx-palette__hint">↑↓ navegar · Enter ejecutar · Esc cerrar</div>
    </div>
  `;

  document.body.appendChild(dialog);

  const input = qs("#fxPaletteInput");

  input.addEventListener("input", () => renderPalette(input.value));

  input.addEventListener("keydown", (event) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      paletteIndex = (paletteIndex + 1) % Math.max(paletteItems.length, 1);
      renderPalette(input.value, true);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      paletteIndex = (paletteIndex - 1 + paletteItems.length) % Math.max(paletteItems.length, 1);
      renderPalette(input.value, true);
    } else if (event.key === "Enter") {
      event.preventDefault();
      runPalette(paletteIndex);
    }
  });

  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) closeDialog(dialog);
  });

  document.addEventListener("keydown", (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      openPalette();
    }
  });
}

function openPalette() {
  const dialog = qs("#fxPalette");
  const input = qs("#fxPaletteInput");

  input.value = "";
  paletteIndex = 0;
  renderPalette("");
  openDialog(dialog);
  input.focus();
  beep(600);
}

function renderPalette(query, keepIndex = false) {
  const q = query.trim().toLowerCase();

  paletteItems = COMMANDS.filter((c) => c.label.toLowerCase().includes(q));

  if (!keepIndex) paletteIndex = 0;

  qs("#fxPaletteList").innerHTML = paletteItems
    .map(
      (c, i) =>
        `<li role="option" data-i="${i}" class="${i === paletteIndex ? "is-active" : ""}"><i data-lucide="${c.icon}"></i>${escapeHtml(c.label)}${i === 0 ? "<kbd>↵</kbd>" : ""}</li>`
    )
    .join("");

  qsa("#fxPaletteList li").forEach((li) => li.addEventListener("click", () => runPalette(Number(li.dataset.i))));

  renderIcons();
}

function runPalette(index) {
  const command = paletteItems[index];

  closeDialog(qs("#fxPalette"));

  if (command) command.run();
}

/* ---------- eventos de la app ---------- */

function bindEvents() {
  window.addEventListener("hermes:position", (event) => {
    lastAccuracy = Math.round(Number(event.detail?.accuracy || 0));
    setHud("#fxGps", lastAccuracy ? `±${lastAccuracy} m` : "OK");
  });

  window.addEventListener("hermes:nearby", (event) => {
    const drops = event.detail?.drops || [];

    nearbyCount = drops.length;
    setHud("#fxNearby", nearbyCount);
    renderRadar(drops);
  });

  window.addEventListener("hermes:scan", (event) => {
    document.body.classList.toggle("fx-scanning", Boolean(event.detail?.scanning));
  });

  window.addEventListener("hermes:drop-read", () => {
    confetti();
    chime();

    if (navigator.vibrate) navigator.vibrate([40, 30, 80]);
  });

  window.addEventListener("hermes:drop-created", (event) => {
    const d = event.detail || {};

    if (!d.code) return;

    const now = Date.now();
    const list = loadMine();

    list.unshift({
      code: d.code,
      title: d.title || "",
      hasKeyword: Boolean(d.hasKeyword),
      createdAt: now,
      expiresAt: now + Number(d.durationMinutes || 1440) * 60000
    });

    saveMine(list);
    renderMine();
    confetti();
    chime();
  });
}
