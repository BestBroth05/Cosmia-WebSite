/**
 * Cosmia — Experiencia por fases con desbloqueo por tiempo
 * Edita CONFIG, schedule, textos de regalos, letra y carta aquí.
 */

/* ==========================================================================
   CONFIGURACIÓN — Personaliza fechas y horarios
   ========================================================================== */

const PRODUCTION_UNLOCK = {
  dressCodeUnlock: "2026-06-04T08:00:00",
  birthdayDate: "2026-06-15",
};

const CONFIG = {
  /** false = ver todo el diseño sin bloqueo */
  enableTimeLock: true,

  /** Zona horaria para todos los desbloqueos */
  timeZone: "America/Mexico_City",

  /** Horarios reales (se usan cuando testMinuteUnlock.enabled = false) */
  ...PRODUCTION_UNLOCK,

  /**
   * PRUEBA: una sección cada minuto desde el 4 jun 12:45 AM (CDMX).
   * Cuando termines, pon enabled: false para volver a producción.
   */
  testMinuteUnlock: {
    enabled: true,
    start: "2026-06-04T00:54:00",
    intervalMinutes: 1,
  },

  /** Revisar desbloqueos (más seguido en modo prueba) */
  checkIntervalMs: 10000,

  /** Nombres amigables para el toast al desbloquear */
  sectionLabels: {
    dresscode: "Dress Code",
    activities: "El plan",
    gifts: "Tus regalos",
    gokarts: "Go Karts",
    cena: "Cena",
    cancion: "Canción",
    finalLetter: "Carta",
  },

  /**
   * ?debug=1 en la URL desbloquea todo (para probar en desarrollo).
   * ?preview=1 fuerza modo día anterior.
   * ?birthday=1 fuerza modo día del cumpleaños.
   */
};

/**
 * Horarios de desbloqueo — "YYYY-MM-DDTHH:mm:ss" en hora de CONFIG.timeZone
 * Se genera desde dressCodeUnlock, birthdayDate y ACTIVITIES (sectionId).
 */
function parseTime12hToHms(time12) {
  const match = String(time12).trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return "00:00:00";
  let hour = parseInt(match[1], 10);
  const minute = match[2];
  const period = match[3].toUpperCase();
  if (period === "PM" && hour !== 12) hour += 12;
  if (period === "AM" && hour === 12) hour = 0;
  return `${String(hour).padStart(2, "0")}:${minute}:00`;
}

const TEST_SECTION_ORDER = [
  "dresscode",
  "activities",
  "gifts",
  "gokarts",
  "cena",
  "cancion",
  "finalLetter",
];

function isTestMinuteMode() {
  return Boolean(CONFIG.testMinuteUnlock?.enabled);
}

function getDressCodeUnlockTime() {
  if (isTestMinuteMode()) return CONFIG.testMinuteUnlock.start;
  return CONFIG.dressCodeUnlock;
}

function addMinutesToScheduleIso(isoLocal, minutesToAdd) {
  const baseMs = parseScheduleDateTime(isoLocal);
  const target = new Date(baseMs + minutesToAdd * 60 * 1000);
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: CONFIG.timeZone || "America/Mexico_City",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(target)
      .filter((p) => p.type !== "literal")
      .map((p) => [p.type, p.value])
  );
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}`;
}

function buildTestMinuteSchedule() {
  const { start, intervalMinutes = 1 } = CONFIG.testMinuteUnlock;
  return TEST_SECTION_ORDER.map((id, index) => ({
    id,
    unlockTime: addMinutesToScheduleIso(start, index * intervalMinutes),
  }));
}

function buildProductionSchedule() {
  const entries = [{ id: "dresscode", unlockTime: CONFIG.dressCodeUnlock }];

  ACTIVITIES.forEach((item) => {
    if (item.sectionId === "activities") {
      entries.push({
        id: "activities",
        unlockTime: `${CONFIG.birthdayDate}T${parseTime12hToHms(item.time)}`,
      });
      return;
    }
    if (item.sectionId) {
      entries.push({
        id: item.sectionId,
        unlockTime: `${CONFIG.birthdayDate}T${parseTime12hToHms(item.time)}`,
      });
    }
  });

  const seen = new Set();
  return entries.filter((entry) => {
    if (seen.has(entry.id)) return false;
    seen.add(entry.id);
    return true;
  });
}

function buildUnlockSchedule() {
  if (isTestMinuteMode()) return buildTestMinuteSchedule();
  return buildProductionSchedule();
}

/* ==========================================================================
   CONTENIDO EDITABLE
   ========================================================================== */

/** Textos emocionales de cada regalo — body: un string por punto/párrafo */
const GIFTS = {
  flowers: {
    emoji: "🌹",
    title: "Flores rosas",
    body: [
      "Estas rosas no son solo flores: son el color de cada momento en el que pensé en ti hoy.",
      "Rosadas, delicadas, como la forma en que cuidas lo que amas.",
      "Quiero que las veas y recuerdes que mereces gestos que hablen sin prisa.",
    ],
  },
  hoodie: {
    emoji: "👕",
    title: "Playera Taylor Swift",
    body: [
      "Me contaste una vez que cuando Taylor vino a México no pudiste entrar porque no conseguiste boletos… y me quedé con eso en la cabeza.",
      "Por eso esta playera es de la gira de ‘The Eras Tour’ en México. No es solo una playera, es un pequeño recuerdo de ese momento que sé que te hubiera gustado vivir.",
      "Quise darte aunque sea un pedacito de esa experiencia, como una forma de acompañar ese recuerdo contigo.",
    ],
  },
  shirt: {
    emoji: "🧥",
    title: "Sudadera Justin Bieber",
    body: [
      "Esta sudadera la quise hacer especial para ti… no es solo de Justin, es de todas las etapas que te han acompañado a lo largo de su música.",
      "Tiene detalles de sus eras y una firma que la hace única, pero en realidad lo importante no es la playera… eres tú usándola, viviendo esas canciones que tanto te gustan.",
      "Quise darte algo que no solo se vea bonito, sino que se sienta tuyo.",
    ],
  },
  box: {
    emoji: "📦",
    title: "Cajita sorpresa",
    body: [
      "Lo que guarda esta caja es pequeño en tamaño pero enorme en intención.",
      "Cada detalle dentro fue elegido con una sola pregunta: ¿la hará sonreír?",
      "Abrirla es abrir un pedacito de todo lo que siento por ti.",
    ],
  },
};

/** Letra de la canción — sincronizada al audio (at = segundos) */
const LYRICS = {
  songName: "Cosmia",
  audioSrc: "audio/cosmia.mp3",
  /** Ajuste global (+ retrasa · − adelanta) */
  syncOffset: 0,
  /** La línea aparece un poco antes de cantarse (segundos) */
  leadSeconds: 0.45,
  /**
   * at = segundo en el mp3 (calibrado con el audio)
   * Afinación manual: abre ?calibrate=1 en la URL
   */
  lines: [
    { at: 0.0, text: "*Cosmia" },
    { at: 5.0, text: "[Intro — suave, acústica]" },
    { at: 7.5, text: "Te vi entre luces de Santa Mónica," },
    { at: 18.5, text: "como si el ruido dejara de hablar," },
    { at: 21.2, text: "yo no sabía que alguien podía" },
    { at: 25.3, text: "hacer el mundo sentirse en paz." },
    { at: 27.5, text: "[Verso]" },
    { at: 28.1, text: "Y yo vivía sin mirar tan lejos," },
    { at: 31.6, text: "sin imaginarme un lugar," },
    { at: 35.3, text: "pero llegaste con tus ojos tristes," },
    { at: 38.9, text: "y todo empezó a cambiar." },
    { at: 42.0, text: "Cuando la noche cayó sobre mi casa," },
    { at: 45.2, text: "y el miedo no me dejaba dormir," },
    { at: 48.9, text: "te quedaste sosteniendo el silencio," },
    { at: 52.1, text: "cuando ya no sabía seguir." },
    { at: 54.5, text: "[Pre-Coro — empieza a crecer]" },
    { at: 55.0, text: "Y ahora pienso en el futuro," },
    { at: 59.1, text: "como nunca lo hice antes," },
    { at: 62.0, text: "porque por primera vez en mi vida," },
    { at: 65.1, text: "quiero que alguien se quede." },
    { at: 66.5, text: "[Coro — entran guitarras eléctricas]" },
    { at: 68.2, text: "*Cosmia," },
    { at: 71.0, text: "eres el cosmos de mi vida," },
    { at: 74.5, text: "la calma después de la tormenta," },
    { at: 77.8, text: "mi lugar favorito en la tierra." },
    { at: 81.0, text: "*Cosmia," },
    { at: 84.5, text: "desde Guadalajara hasta el mar," },
    { at: 88.0, text: "todo tiene más sentido" },
    { at: 91.5, text: "si tú me vuelves a mirar." },
    { at: 95.0, text: "[Verso 2]" },
    { at: 96.2, text: "Puerto Escondido en tus pestañas," },
    { at: 99.8, text: "Puebla guardado en nuestra voz," },
    { at: 103.5, text: "y cada viaje fue enseñándome" },
    { at: 107.2, text: "que el hogar también eres tú." },
    { at: 111.5, text: "[Último Coro — más intenso]" },
    { at: 113.5, text: "*Cosmia," },
    { at: 116.5, text: "si algún día el mundo se derrumba," },
    { at: 120.5, text: "quiero quedarme en tus brazos" },
    { at: 124.0, text: "como aquella vez conmigo." },
    { at: 127.5, text: "*Cosmia," },
    { at: 130.5, text: "mi romántica empedernida," },
    { at: 134.0, text: "si ahora sueño con un futuro," },
    { at: 137.5, text: "es porque apareciste tú." },
    { at: 143.5, text: "[Outro — suave otra vez]" },
    { at: 150.0, text: "Te vi entre luces de Santa Mónica…" },
    { at: 154.0, text: "y desde entonces," },
    { at: 157.0, text: "ya no quiero caminar solo." },
  ],
};

const LYRIC_SYNC_STORAGE_KEY = "cosmiaLyricSync";

/**
 * El plan — itinerario del día (timeline)
 * sectionId: sección que se desbloquea a esa hora (hora Ciudad de México, día birthdayDate)
 */
const ACTIVITIES = [
  { time: "9:00 AM", title: "Voy por ti", note: "Empieza la aventura", sectionId: "activities" },
  { time: "9:40 AM", title: "Te entrego tu regalo", note: "Un detalle pensado en ti", sectionId: "gifts" },
  {
    time: "12:30 PM",
    title: "Primera experiencia — Go Karts",
    note: "Velocidad, risas y adrenalina",
    sectionId: "gokarts",
  },
  {
    time: "4:30 PM",
    title: "Cena en las Espadas Brasileñas",
    note: "Sabores que celebran tu día",
    sectionId: "cena",
  },
  {
    time: "8:00 PM",
    title: "Canción hecha con amor para ti",
    note: "Palabras que solo tú entiendes",
    sectionId: "cancion",
  },
  { time: "10:00 PM", title: "Carta final", note: "El cierre perfecto", sectionId: "finalLetter" },
];

const schedule = buildUnlockSchedule();

/** Contenido de secciones de experiencia — edita los textos */
const EXPERIENCES = {
  gokarts: {
    desc: "12:30 PM · Primera experiencia del día",
    emoji: "🏎️",
    lead: "Hoy competimos el uno al otro, Checo vs Max, pero la verdad es que yo voy a ganar obvio.",
    body: [
      "En los go-karts quiero que te rías, grites tantito y disfrutes el momento sin pensar nada más. Como quiera te voy a ganar.",
      "Así que solo diviértete y disfruta.",
      "PD: intenta no chocar",
    ],
  },
  cena: {
    desc: "4:30 PM · Las Espadas Brasileñas",
    emoji: "🍽️",
    lead: "Aquí estamos por fin.",
    body: [
      "Es buffet, así que tú disfruta, pide lo que quieras, la casa invita :)",
      "Pero sin exagerar tampoco, eh. No te me vayas a emocionar de más.",
      "Yo sí me voy a exceder como si no hubiera mañana :)",
      "PD: Espero que no nos de chorris",
    ],
  },
};

/** Carta final — párrafos separados */
const FINAL_LETTER = {
  paragraphs: [
    "Cosmia…",
    "Si estás leyendo esto, significa que ya vivimos todo el día que te preparé. Y la verdad… espero que te haya gustado, porque lo hice pensando en ti en cada parte.",
    "Desde el inicio con la página, el dress code y todo lo que viste, la idea era que esto no fuera solo un día normal, sino algo que se sintiera diferente. Algo contigo.",
    "En los regalos… pues ahí va todo lo que te di con mucho cariño, cosas que sé que te gustan y que quería que tuvieran un significado más allá de solo “un regalo” (Espero que si halla llegado tu regalo, sino seguro que el Brayan de futuro improviso jaja).",
    "En los go-karts… espero que nos la hayamos pasado bien. Espero que no me haya humillado tanto XD. Y si llegamos tarde o algo… este es el Brayan del pasado, así que ojalá todo haya salido bien :).",
    "En la cena… espero que no te haya caído mal la comida ni que andemos sufriendo ahorita del estómago por habernos emocionado comiendo. O sea, espero que estemos bien y no con “chodillo” :(. Pero valió la pena.",
    "Y luego… la canción.",
    "Aquí sí me pongo serio contigo.",
    "Esa canción no es solo una canción. Cada parte, cada frase, cada palabra… tiene algo que quería decirte y que a veces no sé cómo explicarlo de otra forma.",
    "Por favor, cuando la escuches, no la oigas de fondo. Escúchala de verdad. Detente en cada parte, porque cada pedazo tiene un significado para ti.",
    "Quise que fuera el momento más importante del día… porque ahí está todo lo que siento por ti, sin interrupciones, sin distracciones, solo tú y lo que significas para mí.",
    "Y ahora que ya terminó todo esto… solo quiero decirte algo simple.",
    "Me gusta compartir la vida contigo.",
    "Feliz cumpleaños, Cosmia.",
    "— Tu Bray 🖤",
  ],
};

/* ==========================================================================
   ESTADO Y UTILIDADES
   ========================================================================== */

const unlockedIds = new Set();
const revealedIds = new Set();
const params = new URLSearchParams(window.location.search);
const isDebug = params.has("debug");
const forcePreview = params.has("preview");
const forceBirthday = params.has("birthday");

/** Convierte "YYYY-MM-DDTHH:mm:ss" a timestamp UTC según CONFIG.timeZone */
function parseScheduleDateTime(isoLocal) {
  const tz = CONFIG.timeZone || "America/Mexico_City";
  const [datePart, timePart] = isoLocal.split("T");
  const [y, mo, d] = datePart.split("-").map(Number);
  const [h, mi, s] = timePart.split(":").map(Number);

  let utc = Date.UTC(y, mo - 1, d, h, mi, s);
  for (let i = 0; i < 4; i++) {
    const parts = Object.fromEntries(
      new Intl.DateTimeFormat("en-US", {
        timeZone: tz,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hourCycle: "h23",
      })
        .formatToParts(new Date(utc))
        .filter((p) => p.type !== "literal")
        .map((p) => [p.type, p.value])
    );
    const zonedUtc = Date.UTC(
      Number(parts.year),
      Number(parts.month) - 1,
      Number(parts.day),
      Number(parts.hour),
      Number(parts.minute),
      Number(parts.second)
    );
    utc += Date.UTC(y, mo - 1, d, h, mi, s) - zonedUtc;
  }
  return utc;
}

function getNowInScheduleTz() {
  return parseScheduleDateTime(
    new Intl.DateTimeFormat("sv-SE", {
      timeZone: CONFIG.timeZone || "America/Mexico_City",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    })
      .format(new Date())
      .replace(" ", "T")
  );
}

function isBeforeDressCodeUnlock() {
  if (isDebug || forceBirthday) return false;
  if (forcePreview) return false;
  return getNowInScheduleTz() < parseScheduleDateTime(getDressCodeUnlockTime());
}

function isTimeLockActive() {
  return CONFIG.enableTimeLock && !isDebug;
}

function shouldUnlockEntry(entry) {
  if (!CONFIG.enableTimeLock || isDebug || forceBirthday) return true;
  if (forcePreview) return entry.id === "dresscode";
  if (isBeforeDressCodeUnlock()) return false;
  return getNowInScheduleTz() >= parseScheduleDateTime(entry.unlockTime);
}

/* ==========================================================================
   DESBLOQUEO DE SECCIONES
   ========================================================================== */

function getSectionElement(id) {
  return document.querySelector(`[data-unlock-id="${id}"]`);
}

function revealSection(id, { animate = true, notify = true } = {}) {
  const el = getSectionElement(id);
  if (!el || revealedIds.has(id)) return;

  revealedIds.add(id);
  unlockedIds.add(id);
  el.classList.remove("section--locked");

  if (animate && isTimeLockActive()) {
    el.classList.add("is-revealing");
    el.addEventListener(
      "animationend",
      () => el.classList.remove("is-revealing"),
      { once: true }
    );
  }

  initSectionContent(id);
  updateProgressBar();
  if (id === "activities") prepareTimelinePreview();
  revealTimelineForSection(id);
  if (notify && isTimeLockActive()) {
    showUnlockToast(CONFIG.sectionLabels[id] || id);
  }
  observeScrollReveals(el, { excludeTimeline: id === "activities" });
}

function unlockSection(id) {
  if (unlockedIds.has(id)) return;
  revealSection(id);
}

function unlockAllSections() {
  schedule.forEach((entry) => revealSection(entry.id, { animate: false, notify: false }));
}

function checkUnlocks() {
  if (!CONFIG.enableTimeLock) return;

  for (const entry of schedule) {
    if (shouldUnlockEntry(entry)) {
      unlockSection(entry.id);
    }
  }

  syncTimelineToUnlockedSections();
  updateProgressBar();
}

/** Al abrir "El plan", todos los puntos visibles con blur hasta su hora */
function prepareTimelinePreview() {
  document.querySelectorAll("#timeline .timeline__item").forEach((li) => {
    li.classList.add("timeline__item--pending");
    li.classList.remove("is-unlocked", "is-visible");
    li.setAttribute("aria-hidden", "false");
  });
}

/** Quita el blur del punto ligado a la sección desbloqueada */
function revealTimelineForSection(sectionId) {
  const items = document.querySelectorAll("#timeline .timeline__item");
  if (!items.length) return;

  ACTIVITIES.forEach((activity, index) => {
    if (activity.sectionId !== sectionId) return;
    const li = items[index];
    if (!li) return;

    li.classList.remove("timeline__item--pending");
    li.classList.add("is-unlocked", "is-visible");
    li.setAttribute("aria-hidden", "false");
  });
}

function revealAllTimelineItems() {
  document.querySelectorAll("#timeline .timeline__item").forEach((li) => {
    li.classList.remove("timeline__item--pending");
    li.classList.add("is-unlocked", "is-visible");
    li.setAttribute("aria-hidden", "false");
  });
}

function syncTimelineToUnlockedSections() {
  if (!CONFIG.enableTimeLock || isDebug || forceBirthday) {
    revealAllTimelineItems();
    return;
  }

  if (!unlockedIds.has("activities")) return;

  document.querySelectorAll("#timeline .timeline__item").forEach((li, index) => {
    const sectionId = ACTIVITIES[index]?.sectionId;
    if (sectionId && unlockedIds.has(sectionId)) {
      revealTimelineForSection(sectionId);
    } else {
      li.classList.add("timeline__item--pending");
      li.classList.remove("is-unlocked", "is-visible");
    }
  });
}

function updateProgressBar() {
  const bar = document.getElementById("unlockProgress");
  const fill = document.getElementById("unlockProgressFill");
  if (!fill || !bar) return;

  if (!CONFIG.enableTimeLock) {
    bar.hidden = true;
    return;
  }

  bar.hidden = false;
  const total = schedule.length;
  const count = schedule.filter((e) => unlockedIds.has(e.id)).length;
  const pct = isDebug ? 100 : (count / total) * 100;
  fill.style.width = `${pct}%`;
}

function showUnlockToast(label) {
  const toast = document.getElementById("unlockToast");
  const text = document.getElementById("unlockToastText");
  if (!toast || !text) return;

  text.textContent = `Se desbloqueó: ${label}`;
  toast.hidden = false;
  toast.classList.add("is-shown");

  clearTimeout(showUnlockToast._timer);
  showUnlockToast._timer = setTimeout(() => {
    toast.classList.remove("is-shown");
    setTimeout(() => {
      toast.hidden = true;
    }, 600);
  }, 3200);
}

/* ==========================================================================
   INICIALIZACIÓN DE CONTENIDO POR SECCIÓN
   ========================================================================== */

const sectionInited = new Set();

function initSectionContent(id) {
  if (sectionInited.has(id)) return;
  sectionInited.add(id);

  switch (id) {
    case "cancion":
      initLyrics();
      break;
    case "activities":
      initTimeline();
      break;
    case "gokarts":
    case "cena":
      initExperience(id);
      break;
    case "finalLetter":
      initLetter();
      break;
    default:
      break;
  }
}

function initExperience(id) {
  const data = EXPERIENCES[id];
  const descEl = document.getElementById(`${id}-desc`);
  const contentEl = document.getElementById(`${id}Content`);
  if (!data || !contentEl) return;

  if (descEl) descEl.textContent = data.desc;

  const bodyHtml = Array.isArray(data.body)
    ? data.body
        .map((point) => `<p class="experience-card__point">${escapeHtml(formatProse(point))}</p>`)
        .join("")
    : `<p class="experience-card__body">${escapeHtml(formatProse(data.body))}</p>`;

  contentEl.innerHTML = `
    <span class="experience-card__emoji" aria-hidden="true">${data.emoji}</span>
    <p class="experience-card__lead">${escapeHtml(formatProse(data.lead))}</p>
    ${bodyHtml}
  `;
}

function normalizeLyricEntry(entry, index) {
  if (typeof entry === "string") {
    return { at: index * 2, text: entry };
  }
  return { at: entry.at ?? 0, text: entry.text ?? "" };
}

function loadSavedLyricTimings() {
  try {
    const raw = localStorage.getItem(LYRIC_SYNC_STORAGE_KEY);
    if (!raw) return null;
    const times = JSON.parse(raw);
    return Array.isArray(times) ? times : null;
  } catch {
    return null;
  }
}

function getLyricLinesForRender() {
  const saved = loadSavedLyricTimings();
  return LYRICS.lines.map((entry, i) => {
    const norm = normalizeLyricEntry(entry, i);
    if (saved && saved[i] !== undefined && saved[i] !== null) {
      norm.at = Number(saved[i]);
    }
    return norm;
  });
}

function initLyrics() {
  const nameEl = document.getElementById("lyricsSongName");
  if (nameEl) nameEl.textContent = LYRICS.songName;

  const container = document.getElementById("lyricLines");
  if (!container) return;

  container.innerHTML = "";
  getLyricLinesForRender().forEach((entry, i) => {
    const { at, text } = entry;
    const p = document.createElement("p");
    p.className = "lyric-line";
    p.dataset.index = String(i);
    p.dataset.at = String(at);

    if (text.startsWith("*")) {
      p.classList.add("lyric-line--highlight");
      p.textContent = text.slice(1).trim();
    } else if (/^\[.+\]$/.test(text.trim())) {
      p.classList.add("lyric-line--stage");
      p.textContent = text.trim();
    } else if (text.trim() === "") {
      p.innerHTML = "&nbsp;";
      p.classList.add("lyric-line--spacer");
    } else {
      p.textContent = text;
    }
    container.appendChild(p);
  });

  initSongAudio();
  const playBtn = document.getElementById("lyricPlayBtn");
  if (playBtn && !playBtn.dataset.bound) {
    playBtn.dataset.bound = "true";
    playBtn.addEventListener("click", toggleSongPlayback);
  }

  if (new URLSearchParams(window.location.search).has("calibrate")) {
    initLyricCalibrator();
  }
}

let songAudio = null;
let audioReady = false;
let lyricSyncRaf = null;

function initSongAudio() {
  songAudio = document.getElementById("songAudio");
  const seek = document.getElementById("audioSeek");
  const hint = document.getElementById("audioHint");
  const status = document.getElementById("audioStatus");

  if (!songAudio || !LYRICS.audioSrc) return;

  songAudio.src = LYRICS.audioSrc;

  songAudio.addEventListener("loadedmetadata", () => {
    audioReady = true;
    if (hint) hint.hidden = true;
    if (status) status.textContent = "Listo para escuchar";
    if (seek) seek.disabled = false;
    updateAudioTimeDisplay();
  });

  songAudio.addEventListener("error", () => {
    audioReady = false;
    if (hint) {
      hint.hidden = false;
      hint.textContent = `No encontré el audio. Coloca tu .mp3 en ${LYRICS.audioSrc}`;
    }
    if (status) status.textContent = "Audio pendiente";
    if (seek) seek.disabled = true;
  });

  songAudio.addEventListener("timeupdate", () => {
    updateAudioSeek();
    updateAudioTimeDisplay();
  });

  songAudio.addEventListener("ended", () => {
    stopSongPlayback({ resetLyrics: false });
  });

  if (seek) {
    seek.addEventListener("input", () => {
      if (!songAudio?.duration) return;
      songAudio.currentTime = (seek.value / 100) * songAudio.duration;
      syncLyricsToAudioTime(songAudio.currentTime);
    });
  }
}

let lastSyncedLyricIndex = -1;

function getLyricLead() {
  return LYRICS.leadSeconds ?? 0.45;
}

function syncLyricsToAudioTime(currentTime) {
  const lineEls = [...document.querySelectorAll("#lyricLines .lyric-line")];
  const scroll = document.getElementById("lyricScroll");
  const t = currentTime + (LYRICS.syncOffset ?? 0);
  const lead = getLyricLead();

  const timed = lineEls
    .map((el) => ({
      el,
      at: parseFloat(el.dataset.at),
      index: Number(el.dataset.index),
    }))
    .filter((row) => !Number.isNaN(row.at));

  let activeLine = null;

  timed.forEach((row, i) => {
    const showAt = row.at - lead;
    const nextAt = timed[i + 1] ? timed[i + 1].at - lead : Infinity;

    if (t >= showAt) {
      row.el.classList.add("is-visible");
      if (t >= showAt && t < nextAt) activeLine = row.el;
    } else {
      row.el.classList.remove("is-visible", "is-active");
    }
  });

  lineEls.forEach((line) => line.classList.remove("is-active"));

  if (!activeLine) {
    lastSyncedLyricIndex = -1;
    return;
  }

  activeLine.classList.add("is-active");
  const activeIndex = Number(activeLine.dataset.index);

  if (scroll && activeIndex !== lastSyncedLyricIndex) {
    lastSyncedLyricIndex = activeIndex;
    const lineTop = activeLine.offsetTop;
    const target = lineTop - scroll.clientHeight / 2 + activeLine.clientHeight / 2;
    scroll.scrollTo({ top: Math.max(0, target), behavior: "smooth" });
  }
}

function startLyricSyncLoop() {
  stopLyricSyncLoop();
  const tick = () => {
    if (document.getElementById("lyricPlayBtn")?.classList.contains("is-playing") && songAudio) {
      syncLyricsToAudioTime(songAudio.currentTime);
    }
    lyricSyncRaf = requestAnimationFrame(tick);
  };
  lyricSyncRaf = requestAnimationFrame(tick);
}

function stopLyricSyncLoop() {
  if (lyricSyncRaf) cancelAnimationFrame(lyricSyncRaf);
  lyricSyncRaf = null;
}

function initLyricCalibrator() {
  if (document.getElementById("lyricCalibrator")) return;

  let calibrateIndex = 0;
  const panel = document.createElement("div");
  panel.id = "lyricCalibrator";
  panel.className = "lyric-calibrator glass-card";
  panel.innerHTML = `
    <p class="lyric-calibrator__title">Calibrar letra</p>
    <p class="lyric-calibrator__line" id="calLinePreview"></p>
    <p class="lyric-calibrator__time" id="calTimePreview"></p>
    <div class="lyric-calibrator__actions">
      <button type="button" id="calPrev">←</button>
      <button type="button" id="calMark" class="lyric-calibrator__mark">Marcar ahora</button>
      <button type="button" id="calNext">→</button>
    </div>
    <div class="lyric-calibrator__actions">
      <button type="button" id="calSave">Guardar</button>
      <button type="button" id="calReset">Restaurar</button>
    </div>
  `;
  document.body.appendChild(panel);

  const preview = document.getElementById("calLinePreview");
  const timePreview = document.getElementById("calTimePreview");

  function refreshCalibratorUI() {
    const lines = getLyricLinesForRender();
    const row = lines[calibrateIndex];
    if (!row || !preview || !timePreview) return;
    preview.textContent = `${calibrateIndex + 1}/${lines.length} · ${row.text}`;
    timePreview.textContent = `at: ${row.at.toFixed(2)}s · audio: ${formatAudioTime(songAudio?.currentTime ?? 0)}`;
    document.querySelectorAll("#lyricLines .lyric-line").forEach((el, i) => {
      el.classList.toggle("is-calibrating", i === calibrateIndex);
    });
  }

  document.getElementById("calPrev")?.addEventListener("click", () => {
    calibrateIndex = Math.max(0, calibrateIndex - 1);
    refreshCalibratorUI();
  });

  document.getElementById("calNext")?.addEventListener("click", () => {
    const max = getLyricLinesForRender().length - 1;
    calibrateIndex = Math.min(max, calibrateIndex + 1);
    refreshCalibratorUI();
  });

  document.getElementById("calMark")?.addEventListener("click", () => {
    if (!songAudio) return;
    const times = getLyricLinesForRender().map((l) => l.at);
    times[calibrateIndex] = Math.round(songAudio.currentTime * 100) / 100;
    localStorage.setItem(LYRIC_SYNC_STORAGE_KEY, JSON.stringify(times));
    const lineEl = document.querySelector(
      `#lyricLines .lyric-line[data-index="${calibrateIndex}"]`
    );
    if (lineEl) lineEl.dataset.at = String(times[calibrateIndex]);
    calibrateIndex = Math.min(calibrateIndex + 1, getLyricLinesForRender().length - 1);
    refreshCalibratorUI();
  });

  document.getElementById("calSave")?.addEventListener("click", () => {
    alert("Tiempos guardados en este navegador. Recarga sin ?calibrate=1 para probar.");
  });

  document.getElementById("calReset")?.addEventListener("click", () => {
    localStorage.removeItem(LYRIC_SYNC_STORAGE_KEY);
    location.reload();
  });

  refreshCalibratorUI();
  setInterval(refreshCalibratorUI, 250);
}

function resetLyricVisibility() {
  lastSyncedLyricIndex = -1;
  document.querySelectorAll("#lyricLines .lyric-line").forEach((line) => {
    line.classList.remove("is-visible", "is-active");
  });
}

function formatAudioTime(seconds) {
  if (!Number.isFinite(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

function updateAudioTimeDisplay() {
  const timeEl = document.getElementById("audioTime");
  if (!timeEl || !songAudio) return;
  if (!songAudio.duration) {
    timeEl.hidden = true;
    return;
  }
  timeEl.hidden = false;
  timeEl.textContent = `${formatAudioTime(songAudio.currentTime)} / ${formatAudioTime(songAudio.duration)}`;
}

function updateAudioSeek() {
  const seek = document.getElementById("audioSeek");
  if (!seek || !songAudio?.duration) return;
  seek.value = String((songAudio.currentTime / songAudio.duration) * 100);
}

function setPlayButtonState(playing) {
  const playBtn = document.getElementById("lyricPlayBtn");
  if (!playBtn) return;
  playBtn.classList.toggle("is-playing", playing);
  playBtn.setAttribute("aria-label", playing ? "Pausar canción" : "Reproducir canción");
}

function toggleSongPlayback() {
  const playBtn = document.getElementById("lyricPlayBtn");
  if (playBtn?.classList.contains("is-playing")) {
    pauseSongPlayback();
    return;
  }
  startSongPlayback();
}

function startSongPlayback() {
  const lines = document.querySelectorAll("#lyricLines .lyric-line");
  if (!lines.length) return;

  resetLyricVisibility();
  setPlayButtonState(true);

  const onPlay = () => {
    syncLyricsToAudioTime(songAudio?.currentTime ?? 0);
    startLyricSyncLoop();
  };

  if (songAudio && audioReady) {
    songAudio.currentTime = 0;
    songAudio
      .play()
      .then(onPlay)
      .catch(onPlay);
  } else {
    onPlay();
  }
}

function pauseSongPlayback() {
  songAudio?.pause();
  stopLyricSyncLoop();
  setPlayButtonState(false);
}

function stopSongPlayback({ resetLyrics = true } = {}) {
  stopLyricSyncLoop();
  if (songAudio) {
    songAudio.pause();
    songAudio.currentTime = 0;
  }
  setPlayButtonState(false);
  updateAudioSeek();
  updateAudioTimeDisplay();
  if (resetLyrics) resetLyricVisibility();
}

function initTimeline() {
  const list = document.getElementById("timeline");
  if (!list || list.children.length) return;

  ACTIVITIES.forEach((item, i) => {
    const li = document.createElement("li");
    li.className = "timeline__item timeline__item--pending";
    li.dataset.sectionId = item.sectionId || "";
    li.setAttribute("aria-hidden", "false");
    li.innerHTML = `
      <span class="timeline__dot" aria-hidden="true"></span>
      <p class="timeline__time">${item.time}</p>
      <div class="timeline__card glass-card">
        <p class="timeline__title">${item.title}</p>
        ${item.note ? `<p class="timeline__note">${item.note}</p>` : ""}
      </div>
    `;
    list.appendChild(li);
  });

  syncTimelineToUnlockedSections();
}

function initLetter() {
  const card = document.getElementById("letterContent");
  const sign = document.querySelector(".letter-sign");
  if (!card) return;

  card.innerHTML = FINAL_LETTER.paragraphs
    .map((p) => `<p>${escapeHtml(formatProse(p))}</p>`)
    .join("");

  requestAnimationFrame(() => {
    card.classList.add("is-animated");
    const paragraphs = card.querySelectorAll("p");
    paragraphs.forEach((p, i) => {
      p.style.transitionDelay = `${0.2 + i * 0.35}s`;
    });
    sign?.classList.add("is-visible");
  });
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

/** Une saltos del editor de código; el texto fluye natural en pantalla */
function formatProse(text) {
  return String(text ?? "")
    .replace(/\r\n/g, "\n")
    .replace(/\n+/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/** Renderiza los puntos del modal de regalo con espacio entre cada uno */
function renderGiftBody(body) {
  const points = Array.isArray(body) ? body : [body];
  return points
    .map((point) => `<p class="gift-modal__point">${escapeHtml(formatProse(point))}</p>`)
    .join("");
}

/* ==========================================================================
   REGALOS — Modal
   ========================================================================== */

function initGifts() {
  const modal = document.getElementById("giftModal");
  const grid = document.getElementById("giftGrid");
  if (!modal || !grid) return;

  grid.addEventListener("click", (e) => {
    const card = e.target.closest("[data-gift]");
    if (!card) return;
    const key = card.dataset.gift;
    const gift = GIFTS[key];
    if (!gift) return;
    openGiftModal(gift);
  });

  modal.querySelectorAll("[data-close-modal]").forEach((el) => {
    el.addEventListener("click", closeGiftModal);
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.classList.contains("is-open")) {
      closeGiftModal();
    }
  });
}

function openGiftModal(gift) {
  const modal = document.getElementById("giftModal");
  document.getElementById("giftModalEmoji").textContent = gift.emoji;
  document.getElementById("giftModalTitle").textContent = gift.title;
  document.getElementById("giftModalBody").innerHTML = renderGiftBody(gift.body);

  modal.hidden = false;
  requestAnimationFrame(() => modal.classList.add("is-open"));
  document.body.style.overflow = "hidden";
}

function closeGiftModal() {
  const modal = document.getElementById("giftModal");
  modal.classList.remove("is-open");
  document.body.style.overflow = "";
  setTimeout(() => {
    modal.hidden = true;
  }, 500);
}

/* ==========================================================================
   SCROLL REVEAL
   ========================================================================== */

let scrollObserver;

function observeScrollReveals(root = document, { excludeTimeline = false } = {}) {
  if (!scrollObserver) {
    scrollObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            scrollObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
    );
  }

  const selector = excludeTimeline
    ? ".reveal-on-scroll:not(.is-visible):not(.timeline__item)"
    : ".reveal-on-scroll:not(.is-visible)";

  root.querySelectorAll(selector).forEach((el) => {
    scrollObserver.observe(el);
  });
}

/* ==========================================================================
   PARTÍCULAS (corazones suaves)
   ========================================================================== */

function initParticles() {
  const canvas = document.getElementById("particles");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReduced) return;

  const particles = [];
  const count = window.innerWidth < 768 ? 18 : 28;
  const symbols = ["♥", "✦", "·", "♡"];

  function resize() {
    canvas.width = window.innerWidth * devicePixelRatio;
    canvas.height = window.innerHeight * devicePixelRatio;
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;
    ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
  }

  function createParticle() {
    return {
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      size: 8 + Math.random() * 14,
      speedY: 0.15 + Math.random() * 0.35,
      speedX: (Math.random() - 0.5) * 0.2,
      opacity: 0.15 + Math.random() * 0.35,
      symbol: symbols[Math.floor(Math.random() * symbols.length)],
      phase: Math.random() * Math.PI * 2,
    };
  }

  resize();
  for (let i = 0; i < count; i++) particles.push(createParticle());

  function draw() {
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    particles.forEach((p) => {
      p.y -= p.speedY;
      p.x += p.speedX + Math.sin(p.phase + p.y * 0.01) * 0.15;
      p.phase += 0.008;

      if (p.y < -20) {
        p.y = window.innerHeight + 20;
        p.x = Math.random() * window.innerWidth;
      }

      ctx.globalAlpha = p.opacity;
      ctx.font = `${p.size}px Poppins, sans-serif`;
      ctx.fillStyle = p.symbol === "·" ? "#c9b8e8" : "#e8a4c4";
      ctx.fillText(p.symbol, p.x, p.y);
    });

    ctx.globalAlpha = 1;
    requestAnimationFrame(draw);
  }

  window.addEventListener("resize", resize);
  draw();
}

/* ==========================================================================
   HERO — Ocultar hint si no hay más secciones visibles abajo
   ========================================================================== */

function updateScrollHint() {
  const hint = document.getElementById("scrollHint");
  if (!hint) return;
  if (!CONFIG.enableTimeLock) {
    hint.style.display = "";
    return;
  }
  const dress = getSectionElement("dresscode");
  const visible = dress && unlockedIds.has("dresscode");
  hint.style.display = visible ? "" : "none";
}

/* ==========================================================================
   PREVIEW: mensaje sutil antes del día anterior
   ========================================================================== */

function maybeShowEarlyHint() {
  if (!CONFIG.enableTimeLock || !isBeforeDressCodeUnlock() || isDebug) return;

  const hero = document.getElementById("hero");
  if (!hero || hero.querySelector(".preview-hint")) return;

  const p = document.createElement("p");
  p.className = "preview-hint reveal";
  p.textContent = "Algo hermoso se revelará muy pronto… ✨";
  hero.querySelector(".hero__content")?.appendChild(p);
}

/* ==========================================================================
   ARRANQUE
   ========================================================================== */

function init() {
  initGifts();
  initParticles();
  observeScrollReveals();

  if (!CONFIG.enableTimeLock) {
    unlockAllSections();
    updateScrollHint();
  } else {
    if (isTestMinuteMode()) {
      console.info(
        "[Cosmia] Modo prueba activo — 1 sección por minuto desde",
        CONFIG.testMinuteUnlock.start,
        "(CDMX). Pon testMinuteUnlock.enabled: false para producción."
      );
      schedule.forEach((entry) => {
        console.info(`  · ${entry.id} → ${entry.unlockTime}`);
      });
    }

    document.querySelectorAll("[data-unlock-id]").forEach((el) => {
      el.classList.add("section--locked");
    });

    checkUnlocks();
    updateScrollHint();

    setInterval(() => {
      const before = unlockedIds.size;
      checkUnlocks();
      if (unlockedIds.size !== before) updateScrollHint();
    }, CONFIG.checkIntervalMs);

    maybeShowEarlyHint();
  }

  updateProgressBar();

  // Hero siempre visible con reveals
  document.querySelectorAll("#hero .reveal-on-scroll").forEach((el) => {
    el.classList.add("is-visible");
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
