/* ============================================================
   VISION — site interactions
   Chat assistant · lead form · scroll reveal · nav state
   ============================================================ */

// ---- Configuration ----
const API_BASE = "https://api.visionai.one";
const CHAT_URL = `${API_BASE}/chat`;
const LEAD_URL = `${API_BASE}/lead`;

// Per-page language + localized UI strings (read from <html data-lang>).
const LANG = document.documentElement.getAttribute("data-lang") || "en";
const I18N = {
  en: {
    greeting: "Hi — I'm VISION. Ask me about properties, availability, or book a visit and I'll connect you with an agent.",
    placeholder: "Ask about a property…",
    typing: "VISION is typing",
    error: "⚠️ Couldn't reach VISION right now. Please try again shortly.",
    sent: "Thank you — we'll be in touch shortly.",
    formError: "Something went wrong. Please try again or email us.",
  },
  es: {
    greeting: "Hola — soy VISION. Pregúntame por propiedades, disponibilidad o agenda una visita y te conecto con un agente.",
    placeholder: "Pregunta por una propiedad…",
    typing: "VISION está escribiendo",
    error: "⚠️ No pude conectar con VISION ahora. Inténtalo de nuevo en un momento.",
    sent: "Gracias — nos pondremos en contacto pronto.",
    formError: "Algo salió mal. Inténtalo de nuevo o escríbenos.",
  },
  de: {
    greeting: "Hallo — ich bin VISION. Fragen Sie nach Immobilien, Verfügbarkeit oder buchen Sie eine Besichtigung; ich verbinde Sie mit einem Makler.",
    placeholder: "Nach einer Immobilie fragen…",
    typing: "VISION schreibt",
    error: "⚠️ VISION ist derzeit nicht erreichbar. Bitte versuchen Sie es gleich erneut.",
    sent: "Danke — wir melden uns in Kürze.",
    formError: "Etwas ist schiefgelaufen. Bitte erneut versuchen oder schreiben Sie uns.",
  },
  fr: {
    greeting: "Bonjour — je suis VISION. Posez vos questions sur les biens, la disponibilité, ou réservez une visite et je vous mets en relation avec un agent.",
    placeholder: "Renseignez-vous sur un bien…",
    typing: "VISION écrit",
    error: "⚠️ Impossible de joindre VISION pour le moment. Réessayez bientôt.",
    sent: "Merci — nous vous recontactons très vite.",
    formError: "Une erreur est survenue. Réessayez ou écrivez-nous.",
  },
};
const T = I18N[LANG] || I18N.en;

// ============================================================
// NAV — add solid background after scrolling
// ============================================================
const nav = document.querySelector(".nav");
if (nav) {
  const onScroll = () => nav.classList.toggle("scrolled", window.scrollY > 40);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
}

// ============================================================
// SCROLL REVEAL
// ============================================================
const revealEls = document.querySelectorAll(".reveal");
if (revealEls.length && "IntersectionObserver" in window) {
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
  );
  revealEls.forEach((el) => io.observe(el));
} else {
  revealEls.forEach((el) => el.classList.add("in"));
}

// ============================================================
// CHAT WIDGET
// ============================================================
const chatFab = document.getElementById("chatFab");
const chatWidget = document.getElementById("chatWidget");
const chatClose = document.getElementById("chatClose");
const chatMessages = document.getElementById("chatMessages");
const chatInput = document.getElementById("chatInput");
const chatSend = document.getElementById("chatSend");
const openChatBtns = document.querySelectorAll("[data-open-chat]");

let sessionId = null;
let greeted = false;

function openChat() {
  if (!chatWidget) return;
  chatWidget.classList.remove("hidden");
  if (chatFab) chatFab.classList.add("hidden");
  if (!greeted) {
    appendMessage("ai", T.greeting);
    greeted = true;
  }
  if (chatInput) chatInput.focus();
}
function closeChat() {
  if (!chatWidget) return;
  chatWidget.classList.add("hidden");
  if (chatFab) chatFab.classList.remove("hidden");
}

function appendMessage(sender, text) {
  const msg = document.createElement("div");
  msg.className = `chat-message ${sender}`;
  msg.textContent = text;
  chatMessages.appendChild(msg);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  return msg;
}

function showTyping() {
  const el = document.createElement("div");
  el.className = "chat-message ai typing";
  el.innerHTML = `${T.typing}<span>.</span><span>.</span><span>.</span>`;
  chatMessages.appendChild(el);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  return el;
}

async function sendUserMessage() {
  const message = chatInput.value.trim();
  if (!message) return;

  appendMessage("user", message);
  chatInput.value = "";
  const typing = showTyping();

  try {
    const res = await fetch(CHAT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, session_id: sessionId, lang: LANG }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    sessionId = data.session_id || sessionId;
    typing.remove();
    appendMessage("ai", data.response);
  } catch (err) {
    typing.remove();
    appendMessage("ai", T.error);
    console.error("Chat error:", err);
  }
}

if (chatFab) chatFab.addEventListener("click", openChat);
openChatBtns.forEach((b) =>
  b.addEventListener("click", (e) => {
    e.preventDefault(); // some triggers are <a href="#">
    openChat();
  })
);
if (chatClose) chatClose.addEventListener("click", closeChat);
if (chatSend) chatSend.addEventListener("click", sendUserMessage);
if (chatInput) {
  chatInput.placeholder = T.placeholder;
  chatInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") { e.preventDefault(); sendUserMessage(); }
  });
}

// ============================================================
// LEAD FORM
// ============================================================
const leadForm = document.getElementById("leadForm");
if (leadForm) {
  leadForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const status = document.getElementById("formStatus");
    const btn = leadForm.querySelector("button[type=submit]");
    const data = {
      name: leadForm.name.value.trim(),
      email: leadForm.email.value.trim(),
      phone: leadForm.phone.value.trim(),
      message: leadForm.message.value.trim(),
      session_id: sessionId,
      source: "web-form",
    };
    btn.disabled = true;
    status.textContent = "…";
    status.className = "form-status";
    try {
      const res = await fetch(LEAD_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      leadForm.reset();
      status.textContent = T.sent;
      status.className = "form-status ok";
    } catch (err) {
      status.textContent = T.formError;
      status.className = "form-status err";
      console.error("Lead error:", err);
    } finally {
      btn.disabled = false;
    }
  });
}

// ============================================================
// THEME TOGGLE — Observatory (light, default) / Deep Field (dark)
// Shares the `vision_theme` key with the dashboards.
// ============================================================
const themeToggle = document.getElementById("themeToggle");
if (themeToggle) {
  const themeMeta = document.querySelector('meta[name="theme-color"]');
  const applyTheme = (t) => {
    document.documentElement.setAttribute("data-theme", t);
    if (themeMeta) themeMeta.content = t === "dark" ? "#0b0e14" : "#f7f8fa";
    themeToggle.setAttribute("aria-pressed", String(t === "dark"));
  };
  applyTheme(document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light");
  themeToggle.addEventListener("click", () => {
    const next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
    try { localStorage.setItem("vision_theme", next); } catch (e) { /* private mode */ }
    applyTheme(next);
  });
}

// Current year in footer
const yearEl = document.getElementById("year");
if (yearEl) yearEl.textContent = new Date().getFullYear();
