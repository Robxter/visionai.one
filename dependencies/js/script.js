/* ============================================================
   VISION — site interactions
   Chat assistant · lead form · scroll reveal · nav state ·
   theme toggle · mobile menu
   ============================================================ */

// Announce JS so styles.css may hide .reveal elements. Living HERE (not in the
// inline head script) means: if this file fails to load, nothing is ever
// hidden and the page stays fully readable.
document.documentElement.classList.add("js");

// ---- Configuration ----
const API_BASE = "https://vision-backend-qo8f.onrender.com";
const CHAT_URL = `${API_BASE}/v1/site/chat`;
const LEAD_URL = `${API_BASE}/v1/site/lead`;

// Per-page language + localized UI strings (read from <html data-lang>).
const LANG = document.documentElement.getAttribute("data-lang") || "en";
const I18N = {
  en: {
    greeting: "Hi — I'm VISION. Ask me about our services, pricing, or how the AI assistant works.",
    placeholder: "Ask about our services…",
    typing: "VISION is typing",
    coldStart: "Waking up the assistant — the first reply can take up to a minute…",
    error: "⚠️ Couldn't reach VISION right now. Please try again shortly.",
    sent: "Thank you — we'll be in touch shortly.",
    sending: "Sending…",
    formError: "Something went wrong. Please try again or email us.",
    needName: "Please tell us your name.",
    needEmail: "Please enter a valid email address.",
  },
  es: {
    greeting: "Hola — soy VISION. Pregúntame por nuestros servicios, precios o cómo funciona el asistente con IA.",
    placeholder: "Pregunta por nuestros servicios…",
    typing: "VISION está escribiendo",
    coldStart: "Despertando al asistente — la primera respuesta puede tardar hasta un minuto…",
    error: "⚠️ No pude conectar con VISION ahora. Inténtalo de nuevo en un momento.",
    sent: "Gracias — nos pondremos en contacto pronto.",
    sending: "Enviando…",
    formError: "Algo salió mal. Inténtalo de nuevo o escríbenos.",
    needName: "Cuéntanos tu nombre, por favor.",
    needEmail: "Escribe un correo electrónico válido.",
  },
  de: {
    greeting: "Hallo — ich bin VISION. Fragen Sie mich zu unseren Leistungen, Preisen oder wie der KI-Assistent funktioniert.",
    placeholder: "Nach unseren Leistungen fragen…",
    typing: "VISION schreibt",
    coldStart: "Der Assistent wird geweckt — die erste Antwort kann bis zu einer Minute dauern…",
    error: "⚠️ VISION ist derzeit nicht erreichbar. Bitte versuchen Sie es gleich erneut.",
    sent: "Danke — wir melden uns in Kürze.",
    sending: "Wird gesendet…",
    formError: "Etwas ist schiefgelaufen. Bitte erneut versuchen oder schreiben Sie uns.",
    needName: "Bitte nennen Sie uns Ihren Namen.",
    needEmail: "Bitte geben Sie eine gültige E-Mail-Adresse ein.",
  },
  fr: {
    greeting: "Bonjour — je suis VISION. Posez vos questions sur nos services, nos tarifs ou le fonctionnement de l'assistant IA.",
    placeholder: "Renseignez-vous sur nos services…",
    typing: "VISION écrit",
    coldStart: "Réveil de l'assistant — la première réponse peut prendre jusqu'à une minute…",
    error: "⚠️ Impossible de joindre VISION pour le moment. Réessayez bientôt.",
    sent: "Merci — nous vous recontactons très vite.",
    sending: "Envoi en cours…",
    formError: "Une erreur est survenue. Réessayez ou écrivez-nous.",
    needName: "Merci de nous indiquer votre nom.",
    needEmail: "Merci de saisir une adresse e-mail valide.",
  },
};
const T = I18N[LANG] || I18N.en;

// ============================================================
// NAV — solid background after scrolling + mobile menu
// ============================================================
const nav = document.querySelector(".nav");
if (nav) {
  const onScroll = () => nav.classList.toggle("scrolled", window.scrollY > 40);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
}

const navToggle = document.getElementById("navToggle");
if (navToggle && nav) {
  const setOpen = (open) => {
    nav.classList.toggle("nav-open", open);
    navToggle.setAttribute("aria-expanded", String(open));
    document.body.classList.toggle("nav-locked", open);
  };
  navToggle.addEventListener("click", () => setOpen(!nav.classList.contains("nav-open")));
  // Close after choosing a section, on Escape, or when resizing to desktop.
  nav.querySelectorAll(".nav-links a").forEach((a) =>
    a.addEventListener("click", () => setOpen(false))
  );
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && nav.classList.contains("nav-open")) setOpen(false);
  });
  window.addEventListener("resize", () => {
    if (window.innerWidth > 860) setOpen(false);
  });
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

// Conversation survives reloads within the tab (session id + transcript).
let sessionId = null;
let transcript = [];
try {
  sessionId = sessionStorage.getItem("vision_chat_sid") || null;
  transcript = JSON.parse(sessionStorage.getItem("vision_chat_log") || "[]");
} catch (e) { /* storage unavailable — degrade to in-memory */ }

let greeted = transcript.length > 0;
let sending = false;
let lastFocus = null;

function persistChat() {
  try {
    if (sessionId) sessionStorage.setItem("vision_chat_sid", sessionId);
    sessionStorage.setItem("vision_chat_log", JSON.stringify(transcript.slice(-30)));
  } catch (e) { /* ignore */ }
}

function openChat(trigger) {
  if (!chatWidget) return;
  lastFocus = trigger || document.activeElement;
  chatWidget.classList.remove("hidden");
  if (chatFab) {
    chatFab.classList.add("hidden");
    chatFab.setAttribute("aria-expanded", "true");
  }
  if (!chatMessages.childElementCount) {
    if (transcript.length) {
      transcript.forEach((m) => appendMessage(m.s, m.t, false));
    } else if (!greeted) {
      appendMessage("ai", T.greeting);
      greeted = true;
    }
  }
  if (chatInput) chatInput.focus();
}
function closeChat() {
  if (!chatWidget) return;
  chatWidget.classList.add("hidden");
  if (chatFab) {
    chatFab.classList.remove("hidden");
    chatFab.setAttribute("aria-expanded", "false");
  }
  // Return focus to whatever opened the dialog (WCAG 2.4.3).
  if (lastFocus && document.contains(lastFocus)) lastFocus.focus();
  else if (chatFab) chatFab.focus();
}

function appendMessage(sender, text, record = true) {
  const msg = document.createElement("div");
  msg.className = `chat-message ${sender}`;
  msg.textContent = text;
  chatMessages.appendChild(msg);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  if (record && (sender === "ai" || sender === "user")) {
    transcript.push({ s: sender, t: text });
    persistChat();
  }
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
  if (sending) return; // one request at a time — no out-of-order replies
  const message = chatInput.value.trim();
  if (!message) return;

  sending = true;
  if (chatSend) chatSend.disabled = true;
  appendMessage("user", message);
  chatInput.value = "";
  const typing = showTyping();

  // Render free tier sleeps: past ~6s, explain the wait instead of looking dead.
  const coldTimer = setTimeout(() => {
    typing.textContent = T.coldStart;
  }, 6000);

  try {
    const res = await fetch(CHAT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, session_id: sessionId, lang: LANG }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    sessionId = data.session_id || sessionId;
    persistChat();
    typing.remove();
    appendMessage("ai", typeof data.response === "string" && data.response ? data.response : T.error);
  } catch (err) {
    typing.remove();
    appendMessage("ai", T.error, false);
    console.error("Chat error:", err);
  } finally {
    clearTimeout(coldTimer);
    sending = false;
    if (chatSend) chatSend.disabled = false;
    if (chatInput) chatInput.focus();
  }
}

if (chatFab) chatFab.addEventListener("click", (e) => openChat(e.currentTarget));
openChatBtns.forEach((b) =>
  b.addEventListener("click", (e) => {
    e.preventDefault(); // some triggers are <a href="#">
    openChat(e.currentTarget);
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
// Escape closes the dialog from anywhere inside it.
if (chatWidget) {
  chatWidget.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeChat();
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
    const name = leadForm.name.value.trim();
    const email = leadForm.email.value.trim();

    // Client-side validation with a focused field — the backend re-validates.
    if (!name) {
      status.textContent = T.needName;
      status.className = "form-status err";
      leadForm.name.focus();
      return;
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      status.textContent = T.needEmail;
      status.className = "form-status err";
      leadForm.email.focus();
      return;
    }

    const data = {
      name,
      email,
      phone: leadForm.phone.value.trim(),
      message: leadForm.message.value.trim(),
      session_id: sessionId,
      source: "visionai.one",
    };
    btn.disabled = true;
    status.textContent = T.sending;
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
