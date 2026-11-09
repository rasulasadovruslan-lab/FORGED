import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  deleteUser,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  collection,
  query,
  where,
  orderBy,
  getDocs,
  onSnapshot,
  serverTimestamp,
  deleteField,
  writeBatch,
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// ===== PASTE YOUR FIREBASE CONFIG HERE =====
const cfg = {
  apiKey: "AIzaSyCJpjlOc1xGqzC9Khr2vRFy5FXAyu_shq0",
  authDomain: "forged-5658d.firebaseapp.com",
  projectId: "forged-5658d",
  storageBucket: "forged-5658d.firebasestorage.app",
  messagingSenderId: "177677777560",
  appId: "1:177677777560:web:25af3aaae5b11f22592eed",
};
// ===========================================

const app = initializeApp(cfg),
  auth = getAuth(app),
  db = getFirestore(app);
let page = document.body.dataset.page,
  rid = 0,
  subs = [],
  offs = [];
const $ = (s) => document.querySelector(s),
  m = () => $("#app");
const esc = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const toast = (t) => {
  // toasts live in one stack so several can show at once without overlapping
  let c = $("#tc");
  if (!c) {
    c = document.createElement("div");
    c.id = "tc";
    c.setAttribute("role", "status");
    c.setAttribute("aria-live", "polite");
    document.body.append(c);
  }
  const e = document.createElement("div");
  e.className = "toast";
  e.textContent = t;
  c.append(e);
  setTimeout(() => e.remove(), 3000);
};
const err = (e) =>
  (/are-blocked|api-key-not-valid|api-key-service-blocked/.test(e.code || "")
    ? "Google is blocking this site: check the API key restrictions"
    : null) ||
  ({
    "auth/requires-recent-login": "Please log in again, then retry",
    "permission-denied": "Permission denied: check Firestore rules",
    "auth/unauthorized-domain": "This domain is not authorized in Firebase Auth",
    "auth/operation-not-allowed": "Email/Password sign-in is not enabled in Firebase",
    "auth/network-request-failed": "Network error. Check your connection",
    "auth/invalid-credential": "Wrong email or password",
    "auth/email-already-in-use": "That email already has an account",
    "auth/weak-password": "Password needs 6+ characters",
    "auth/invalid-email": "Enter a valid email",
    "auth/too-many-requests": "Too many attempts. Try again later",
  })[e.code] ||
  e.message ||
  "Something went wrong";
const onErr = (e) => {
  console.error(e);
  toast(err(e));
};
const ds = (d) => d.toLocaleDateString("sv");
const validName = (n) => /^[a-z0-9_]{3,20}$/i.test(n);
const A = (p) =>
  p.photo
    ? `<img class="av" src="${p.photo}" alt="">`
    : `<span class="av">${esc((p.username || "?")[0].toUpperCase())}</span>`;
const nameTaken = async (n) => {
  const r = await getDocs(
    query(
      collection(db, "users"),
      where("usernameLower", "==", n.toLowerCase()),
    ),
  );
  return r.docs.find((d) => d.id !== auth.currentUser?.uid);
};
function applyTheme(p) {
  const r = document.documentElement;
  r.dataset.theme = p.theme || "dark";
  if (p.accent) {
    const c = p.accent,
      l =
        parseInt(c.slice(1, 3), 16) * 0.3 +
        parseInt(c.slice(3, 5), 16) * 0.6 +
        parseInt(c.slice(5), 16) * 0.1;
    r.style.setProperty("--accent", c);
    r.style.setProperty("--on", l > 150 ? "#000" : "#fff");
  } else {
    r.style.removeProperty("--accent");
    r.style.removeProperty("--on");
  }
  localStorage.setItem(
    "t30",
    JSON.stringify({ theme: p.theme, accent: p.accent }),
  );
}
try {
  applyTheme(JSON.parse(localStorage.t30 || "{}"));
} catch {}

let me,
  profile,
  busy = false,
  tap = null,
  first = true;
const P = {},
  quick = document.documentElement.classList.contains("quick");
const snap = (...a) => {
  const u = onSnapshot(...a);
  subs.push(u);
  return u;
};
const on = (t, e, f) => {
  t.addEventListener(e, f);
  offs.push(() => t.removeEventListener(e, f));
};
const sk = (n, h = 46) =>
  Array.from({ length: n }, () => `<div class="sk" style="height:${h}px"></div>`).join("");
const ld = {
  go() {
    const b = $("#ld");
    if (!b) return;
    b.className = "";
    void b.offsetWidth;
    b.className = "run";
  },
  done() {
    const b = $("#ld");
    if (b) b.className = "done";
  },
};
const CK = '<svg class="ck" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg>';
const dlg = (o) =>
  new Promise((res) => {
    const w = document.createElement("div"),
      prev = document.activeElement;
    w.className = "mdl";
    w.innerHTML = `<div class="mbox" role="dialog" aria-modal="true"><h3>${esc(o.title || "")}</h3>${o.msg ? `<p>${esc(o.msg)}</p>` : ""}${o.input ? `<input id="mi" value="${esc(o.value || "")}" placeholder="${esc(o.ph || "")}" maxlength="40" autocomplete="off">` : ""}<div class="row mact"><button class="btn ghost" data-r="0">${esc(o.cancel || "Cancel")}</button><button class="btn${o.danger ? " dng" : ""}" data-r="1">${esc(o.ok || "OK")}</button></div></div>`;
    document.body.append(w);
    const inp = w.querySelector("#mi"),
      okb = w.querySelector('[data-r="1"]');
    const done = (v) => {
      document.removeEventListener("keydown", key, true);
      w.classList.add("out");
      setTimeout(() => w.remove(), 180);
      if (prev && prev.focus) prev.focus();
      res(v);
    };
    const yes = () => done(o.input ? inp.value.trim() || null : true),
      no = () => done(o.input ? null : false);
    function key(e) {
      if (e.key === "Escape") { e.stopPropagation(); no(); }
      else if (e.key === "Enter" && e.target.tagName !== "BUTTON") { e.preventDefault(); yes(); }
      else if (e.key === "Tab") {
        const f = [...w.querySelectorAll("input,button")];
        const i = f.indexOf(document.activeElement), n = e.shiftKey ? i - 1 : i + 1;
        e.preventDefault();
        f[(n + f.length) % f.length].focus();
      }
    }
    document.addEventListener("keydown", key, true);
    w.onclick = (e) => {
      if (e.target === w) no();
      const b = e.target.closest("[data-r]");
      if (b) b.dataset.r === "1" ? yes() : no();
    };
    (inp || okb).focus();
    if (inp) inp.select();
  });
const fit = (t) => {
  t.style.height = "auto";
  t.style.height = Math.max(110, t.scrollHeight) + "px";
};
const stag = () => {
  document
    .querySelectorAll("main>*,#gl>.card,.grid>.card,.fr")
    .forEach((e, i) => e.style.setProperty("--i", Math.min(i, 9)));
  document.querySelectorAll("#nl textarea").forEach(fit);
};
const count = (el, to) => {
  const f = parseInt(el.textContent) || 0,
    t0 = performance.now();
  (function s(t) {
    const k = Math.min((t - t0) / 800, 1);
    el.textContent = Math.round(f + (to - f) * (1 - Math.pow(1 - k, 3))) + "%";
    if (k < 1) requestAnimationFrame(s);
  })(t0);
};
/* ===== Roads =====
   A "road" is one goal with its own length (1-365 days) and its own start date.
   Goals saved before v7 have neither field: they fall back to 30 days and the
   shared cycle start, so old data keeps working untouched. */
const DAY = 864e5,
  DEF_DAYS = 30,
  MAX_DAYS = 365,
  PRESETS = [7, 14, 21, 30, 60, 90];
const D0 = (s) => new Date(s + "T00:00:00");
const midnight = () => {
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  return t;
};
const clampDays = (v) => Math.min(MAX_DAYS, Math.max(1, Math.round(+v) || DEF_DAYS));
const sum = (a) => a.reduce((p, c) => p + c, 0);
const plural = (n, w) => `${n} ${w}${n === 1 ? "" : "s"}`;
const streak = (d, idx) => {
  const e = Math.min(idx, d.length - 1);
  let s = 0;
  for (let i = e; i >= 0; i--) {
    if (d[i] == 1) s++;
    else if (i === e && d[i] == 0) continue;
    else break;
  }
  return s;
};
const bestRun = (d) => {
  let b = 0,
    c = 0;
  for (let i = 0; i < d.length; i++) {
    if (d[i] == 1) b = Math.max(b, ++c);
    else c = 0;
  }
  return b;
};

/* Banner rewards: the longer the road, the rarer the banner. */
const BN = [
  [1, "UNLOCKED", "01_UNLOCKED.png"],
  [4, "ELITE", "02_ELITE.png"],
  [7, "NO EXCUSES", "03_NO_EXCUSES.png"],
  [10, "CONSISTENT", "04_CONSISTENT.png"],
  [14, "FORGED", "05_FORGED.png"],
  [21, "ASCEND", "06_ASCEND.png"],
  [30, "BREAK LIMITS", "07_BREAK_LIMITS.png"],
  [45, "UNSTOPPABLE", "08_UNSTOPPABLE.png"],
  [60, "OVERCOME", "09_OVERCOME.png"],
  [90, "LEGEND", "10_LEGEND.png"],
].map(([min, name, file], i) => ({ id: String(i + 1).padStart(2, "0"), min, name, file }));
const tierOf = (n) => BN.reduce((a, b) => (n >= b.min ? b : a), BN[0]);
const bnSrc = (b) => "banners/" + b.file;
const bnRange = (i) => {
  const b = BN[i],
    nx = BN[i + 1];
  if (!nx) return `Road of ${b.min}+ days`;
  return nx.min - 1 === b.min ? `Road of ${b.min} day${b.min === 1 ? "" : "s"}` : `Road of ${b.min}-${nx.min - 1} days`;
};
const forgedXp = (n) => Math.round((200 * n) / 30); // 200 XP at 30 days, scaled by length
const bankFxp = (b) => (b.fxp != null ? b.fxp : (b.forged || 0) * 200);

/* Turn a goal document into everything the UI needs. */
const road = (x, cs) => {
  const g = x.data(),
    n = g.days ? clampDays(g.days) : DEF_DAYS,
    from = g.from || cs || ds(new Date()),
    d = Array.from({ length: n }, (_, i) => ((g.d || [])[i] == 1 ? 1 : 0)),
    idx = Math.round((midnight() - D0(from)) / DAY),
    done = sum(d),
    past = Math.min(Math.max(idx, 0), n),
    donePast = sum(d.slice(0, past));
  return {
    id: x.id,
    ref: x.ref,
    title: g.title || "Untitled",
    n,
    from,
    d,
    idx,
    done,
    past,
    donePast,
    missed: past - donePast,
    p: Math.round((done / n) * 100),
    full: done === n,
    over: idx >= n,
    cur: streak(d, idx),
    best: bestRun(d),
    tier: tierOf(n),
  };
};
const dateOf = (r, i) => {
  const d = D0(r.from);
  d.setDate(d.getDate() + i);
  return d.toDateString();
};
/* A perfect day = a calendar day on which every road that was running was checked. */
function perfectDays(R) {
  if (!R.length) return 0;
  const from = R.map((r) => D0(r.from)),
    base = new Date(Math.min(...from)),
    end = midnight();
  if (isNaN(base)) return 0;
  let n = 0;
  for (let k = 0; k < 4000; k++) {
    const dt = new Date(base);
    dt.setDate(base.getDate() + k);
    if (dt > end) break;
    let act = 0,
      ok = 0;
    R.forEach((r, j) => {
      const i = Math.round((dt - from[j]) / DAY);
      if (i >= 0 && i < r.n) {
        act++;
        ok += r.d[i];
      }
    });
    if (act && act === ok) n++;
  }
  return n;
}
/* Add finished stats to the bank so XP survives a restart or a deleted road. */
const bankWith = (b, list, perfectGain) => ({
  checks: (b.checks || 0) + sum(list.map((r) => r.done)),
  forged: (b.forged || 0) + list.filter((r) => r.full).length,
  fxp: bankFxp(b) + sum(list.filter((r) => r.full).map((r) => forgedXp(r.n))),
  perfect: (b.perfect || 0) + perfectGain,
  cycles: (b.cycles || 0) + list.filter((r) => r.over).length,
  best: Math.max(b.best || 0, ...list.map((r) => r.best)),
});
/* Instant jumps even though the page and the sheet use smooth scrolling. */
const jump = (el, left) => {
  el.style.scrollBehavior = "auto";
  el.scrollLeft = left;
  el.style.scrollBehavior = "";
};
const toTop = () => {
  const r = document.documentElement;
  r.style.scrollBehavior = "auto";
  scrollTo(0, 0);
  r.style.scrollBehavior = "";
};
console.info("Forged build v7");
const lvOf = (xp) => Math.floor(Math.sqrt(xp / 50)) + 1,
  lvStart = (l) => 50 * (l - 1) ** 2,
  RANKS = ["Wanderer", "Walker", "Traveler", "Pathfinder", "Trailblazer", "Forger", "Ironbound", "Warden", "Champion", "Legend"],
  rankOf = (l) => RANKS[Math.min(l - 1, 9)];
const IC = {
  goals: '<svg viewBox="0 0 24 24"><path d="M9 11l3 3 8-8M20 12v7a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h9"/></svg>',
  road: '<svg viewBox="0 0 24 24"><path d="M5 21L8 3M19 21L16 3M12 5v3M12 11v3M12 17v3"/></svg>',
  notes: '<svg viewBox="0 0 24 24"><path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8zM14 3v5h5M9 13h6M9 17h6"/></svg>',
  friends: '<svg viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8M22 21v-2a4 4 0 00-3-3.9M16 3.1a4 4 0 010 7.8"/></svg>',
};
const TABS = [["goals", "Goals"], ["road", "Road"], ["notes", "Notes"], ["friends", "Friends"]];
const AW = [
  ["spark", "✨", "First Spark", "Check off your first day", "#f5c542", (t) => t.checks >= 1],
  ["warm", "🔥", "Warming Up", "10 check-ins", "#ff8a3d", (t) => t.checks >= 10],
  ["grind", "⚔️", "Grinder", "50 check-ins", "#e5484d", (t) => t.checks >= 50],
  ["cent", "💯", "Centurion", "100 check-ins", "#a855f7", (t) => t.checks >= 100],
  ["str3", "🌱", "On a Roll", "3-day streak", "#3ddc84", (t) => t.best >= 3],
  ["str7", "⚡", "Weekly Warrior", "7-day streak", "#38bdf8", (t) => t.best >= 7],
  ["str14", "🌋", "Inferno", "14-day streak", "#ff5a36", (t) => t.best >= 14],
  ["str30", "👑", "Unbroken", "30-day streak", "#ffd700", (t) => t.best >= 30],
  ["perf", "🌟", "Perfect Day", "Check every goal in one day", "#f472b6", (t) => t.perfect >= 1],
  ["flaw", "💎", "Flawless", "7 perfect days", "#22d3ee", (t) => t.perfect >= 7],
  ["forge", "🛡️", "Forged", "Check off every day of a road", "#c0c7d1", (t) => t.forged >= 1],
  ["multi", "🧩", "Multitasker", "Run 3 goals at once", "#818cf8", (t) => t.goals >= 3],
  ["cycle", "🏁", "Road Finisher", "Run a road to its last day", "#34d399", (t) => t.cycles >= 1],
  ["scribe", "📝", "Scribe", "Write your first note", "#fbbf24", (t, x) => x.notes >= 1],
  ["org", "📁", "Organizer", "Create a folder", "#fb923c", (t, x) => x.folders >= 1],
  ["pal", "🤝", "Companion", "Make a friend", "#60a5fa", (t, x) => x.friends >= 1],
];
function calc(p, R) {
  const b = p.bank || {};
  const forgedNow = R.filter((r) => r.full),
    t = {
      checks: sum(R.map((r) => r.done)) + (b.checks || 0),
      forged: forgedNow.length + (b.forged || 0),
      perfect: perfectDays(R) + (b.perfect || 0),
      cycles: R.filter((r) => r.over).length + (b.cycles || 0),
      best: Math.max(...R.map((r) => r.best), b.best || 0),
      goals: R.length,
      banners: [...new Set(forgedNow.map((r) => r.tier.id))],
    };
  t.xp = t.checks * 10 + t.perfect * 30 + sum(forgedNow.map((r) => forgedXp(r.n))) + bankFxp(b) + t.cycles * 100;
  t.lv = lvOf(t.xp);
  return t;
}
function grant(t, x) {
  const have = new Set(profile.awards || []),
    nw = AW.filter((a) => !have.has(a[0]) && a[5](t, x)),
    hb = new Set(profile.banners || []),
    nb = BN.filter((b) => t.banners.includes(b.id) && !hb.has(b.id)),
    patch = {};
  if (nw.length) {
    profile.awards = [...have, ...nw.map((a) => a[0])];
    patch.awards = profile.awards;
    toast("Award unlocked: " + nw.map((a) => a[2]).join(", "));
  }
  if (nb.length) {
    profile.banners = [...hb, ...nb.map((b) => b.id)];
    patch.banners = profile.banners;
    toast("Banner earned: " + nb.map((b) => b.name).join(", "));
  }
  if (t.lv > (profile.lvl || 1)) {
    if (profile.lvl) toast("Level up! You are Lv " + t.lv);
    profile.lvl = patch.lvl = t.lv;
  }
  if (t.xp !== profile.xp) profile.xp = patch.xp = t.xp;
  const lp = document.querySelector(".lv");
  if (lp) lp.textContent = "Lv " + t.lv;
  if (Object.keys(patch).length) updateDoc(doc(db, "users", me.uid), patch).catch(() => {});
}
const clean = (h) => {
  const d = new DOMParser().parseFromString("<body>" + h, "text/html"),
    ok = "B I U S STRIKE STRONG EM BR DIV P SPAN FONT UL OL LI H1 H2 H3 BLOCKQUOTE".split(" ");
  (function w(n) {
    [...n.childNodes].forEach((c) => {
      if (c.nodeType === 3) return;
      if (c.nodeType !== 1 || /^(SCRIPT|STYLE|IFRAME|OBJECT|EMBED)$/.test(c.tagName)) return c.remove();
      w(c);
      if (!ok.includes(c.tagName)) return c.replaceWith(...c.childNodes);
      [...c.attributes].forEach((a) => {
        const fa = c.tagName === "FONT" && ["face", "size", "color"].includes(a.name),
          st = a.name === "style" && /^[\w\s:;#,.()%'"-]*$/.test(a.value) && !/url|expr|java/i.test(a.value);
        if (!fa && !st) c.removeAttribute(a.name);
      });
    });
  })(d.body);
  return d.body.innerHTML;
};
const plain = (h) => new DOMParser().parseFromString(h, "text/html").body.textContent.trim();
function embers() {
  if (matchMedia("(prefers-reduced-motion:reduce)").matches) return;
  const c = document.createElement("canvas");
  c.id = "fx";
  document.body.prepend(c);
  const x = c.getContext("2d");
  let W,
    H,
    ps = [];
  const nw = (a) => ({
    x: Math.random() * W,
    y: a ? Math.random() * H : H + 10,
    r: Math.random() * 1.6 + 0.4,
    v: Math.random() * 0.5 + 0.2,
    d: Math.random() * 6.28,
    a: Math.random() * 0.45 + 0.15,
  });
  const rs = () => {
    W = c.width = innerWidth;
    H = c.height = innerHeight;
    ps = Array.from({ length: Math.min(50, (W / 20) | 0) }, () => nw(true));
  };
  addEventListener("resize", rs);
  rs();
  (function f(t) {
    x.clearRect(0, 0, W, H);
    x.fillStyle =
      getComputedStyle(document.documentElement)
        .getPropertyValue("--fg")
        .trim() || "#fff";
    for (const p of ps) {
      p.y -= p.v;
      p.x += Math.sin(t / 1500 + p.d) * 0.3;
      p.a -= 0.0006;
      if (p.y < -10 || p.a <= 0) Object.assign(p, nw(false));
      x.globalAlpha = p.a;
      x.beginPath();
      x.arc(p.x, p.y, p.r, 0, 7);
      x.fill();
    }
    requestAnimationFrame(f);
  })(0);
}
document.addEventListener("pointermove", (e) => {
  const c = e.target.closest && e.target.closest(".card");
  if (c) {
    const r = c.getBoundingClientRect();
    c.style.setProperty("--mx", e.clientX - r.left + "px");
    c.style.setProperty("--my", e.clientY - r.top + "px");
  }
});
P.auth = () => {
  let up = false;
  const f = $("#f");
  const draw = () => {
    $("#un").hidden = !up;
    $("#un").required = up;
    f.querySelector(".btn").textContent = up ? "Create account" : "Log in";
    $("#pw").autocomplete = up ? "new-password" : "current-password";
    $("#sw").innerHTML = up
      ? 'Have an account? <a href="#" id="tg">Log in</a>'
      : 'New here? <a href="#" id="tg">Create account</a>';
  };
  $("#sw").onclick = (e) => {
    if (e.target.id === "tg") {
      e.preventDefault();
      up = !up;
      draw();
    }
  };
  f.onsubmit = async (e) => {
    e.preventDefault();
    const b = f.querySelector(".btn");
    b.disabled = busy = true;
    b.classList.add("busy");
    try {
      const em = $("#em").value.trim(),
        pw = $("#pw").value;
      if (!up) await signInWithEmailAndPassword(auth, em, pw);
      else {
        const un = $("#un").value.trim();
        if (!validName(un))
          throw { message: "Username: 3-20 letters, numbers or _" };
        const c = await createUserWithEmailAndPassword(auth, em, pw);
        let taken;
        try {
          taken = await nameTaken(un);
        } catch (x) {
          await deleteUser(c.user).catch(() => {});
          throw x;
        }
        if (taken) {
          await deleteUser(c.user);
          throw { message: "That username is taken" };
        }
        await setDoc(doc(db, "users", c.user.uid), {
          username: un,
          usernameLower: un.toLowerCase(),
          photo: "",
          bio: "",
          theme: "dark",
          accent: "",
          pct: 0,
          createdAt: serverTimestamp(),
        });
      }
      location = "goals.html";
    } catch (x) {
      toast(err(x));
      b.disabled = false;
      b.classList.remove("busy");
    } finally {
      busy = false;
    }
  };
};

/* ---- shared pieces for road UI ---- */
const LOCK = '<svg class="ck" viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 018 0v3"/></svg>';
const RS_IC = '<svg viewBox="0 0 24 24"><path d="M3 12a9 9 0 109-9 9 9 0 00-6.4 2.6L3 8M3 3v5h5"/></svg>';
const RC = 2 * Math.PI * 15;
/* Small progress ring: green = done, red = missed, grey = still to go. */
const ring = (r) => {
  const ok = (RC * r.done) / r.n,
    miss = (RC * r.missed) / r.n,
    tip = `${r.done} done · ${r.missed} missed · ${Math.max(r.n - r.done - r.missed, 0)} to go`;
  return `<svg class="mr${r.full ? " full" : ""}" viewBox="0 0 36 36" role="img" aria-label="${r.p}% complete: ${tip}"><title>${tip}</title><g transform="rotate(-90 18 18)"><circle class="mt" cx="18" cy="18" r="15"/><circle class="mm" cx="18" cy="18" r="15" stroke-dasharray="${miss} ${RC}" stroke-dashoffset="${-ok}"/><circle class="mo" cx="18" cy="18" r="15" stroke-dasharray="${ok} ${RC}"/></g>${r.full ? '<path class="mk" d="M12 18.5l4 4 8-9"/>' : `<text x="18" y="21.3">${r.p}%</text>`}</svg>`;
};
const roadStat = (r) =>
  r.full
    ? "Forged"
    : r.idx < 0
      ? `Starts in ${plural(-r.idx, "day")}`
      : r.over
        ? `Ended · ${r.missed} missed`
        : `Day ${r.idx + 1} of ${r.n}`;
/* A banner that fills in with colour as the road progresses. */
const bnFig = (b, p, got, cap, cls = "") =>
  `<figure class="rw${got ? " got" : ""}${cls}" style="--p:${p}%"><div class="rwi"><img class="base" src="${bnSrc(b)}" alt="" width="760" height="130" loading="lazy" decoding="async"><img class="fill" src="${bnSrc(b)}" alt="${got ? esc(b.name) + " banner" : ""}" width="760" height="130" loading="lazy" decoding="async"><span class="rwb" aria-hidden="true">${got ? CK : LOCK}</span></div><figcaption>${cap}</figcaption></figure>`;
const rewardTile = (r) => {
  const left = r.n - r.done;
  return bnFig(
    r.tier,
    r.p,
    r.full,
    `<div><b>${r.tier.name}</b><small>${r.full ? "Reward unlocked" : `${plural(left, "more day")} to unlock`}</small></div>`,
  );
};
const roadActions = (r) =>
  `<button class="ib" data-rs="${r.id}" title="Restart road" aria-label="Restart ${esc(r.title)}">${RS_IC}</button><button class="x" data-del="${r.id}" title="Delete goal" aria-label="Delete ${esc(r.title)}">×</button>`;
const lastDays = () => {
  try {
    return clampDays(localStorage.gd);
  } catch {
    return DEF_DAYS;
  }
};

P.goals = () => {
  m().innerHTML = `<div class="row sb"><h2>Your goals</h2><button class="link" id="rsa">Restart all</button></div>
 <div class="card gauge"><div class="ring"><svg viewBox="0 0 220 220" aria-hidden="true"><circle class="tr" cx="110" cy="110" r="90"/><circle class="no" id="rg2" cx="110" cy="110" r="90" stroke-dasharray="0 999"/><circle class="ok" id="rg1" cx="110" cy="110" r="90" stroke-dasharray="0 999"/></svg><div class="rc"><span id="all">0%</span><small id="cyc"></small></div></div>
 <small id="lg"></small>
 <div class="meters"><div><div class="row sb"><b>Success</b><b id="ms">-</b></div><div class="bar"><i id="mb1" style="width:0"></i></div></div><div><div class="row sb"><b>Fail</b><b id="mf">-</b></div><div class="bar fail"><i id="mb2" style="width:0"></i></div></div></div></div>
 <form id="gf" class="card gform" autocomplete="off">
  <div class="gfr"><input id="gt" placeholder="Add a goal, e.g. Code for 1 hour" required maxlength="60" aria-label="Goal name"><div class="dayin"><button type="button" class="st" data-st="-1" aria-label="Fewer days">−</button><input id="gd" type="number" inputmode="numeric" min="1" max="${MAX_DAYS}" value="${lastDays()}" aria-label="Number of days"><button type="button" class="st" data-st="1" aria-label="More days">+</button><span>days</span></div><button class="btn">Add</button></div>
  <div class="gfr2"><div class="presets" role="group" aria-label="Quick lengths">${PRESETS.map((n) => `<button type="button" class="fo pre" data-n="${n}">${n} days</button>`).join("")}</div><div class="prev" id="gp"></div></div>
 </form><div id="gl">${sk(4, 52)}</div>`;
  const col = collection(db, "users", me.uid, "goals"),
    gd = $("#gd");
  let cs = profile.cycleStart || "",
    docs = [],
    R = [],
    firstDraw = true;

  /* ---- add form: day picker + live reward preview ---- */
  const paint = () => {
    const n = clampDays(gd.value),
      b = tierOf(n);
    document.querySelectorAll(".pre").forEach((c) => c.classList.toggle("on", +c.dataset.n === n));
    $("#gp").innerHTML = `<img src="${bnSrc(b)}" alt="" width="120" height="21"><small>Finish all ${plural(n, "day")} to earn <b>${b.name}</b></small>`;
  };
  const setN = (v) => {
    gd.value = clampDays(v);
    paint();
  };
  gd.oninput = paint;
  gd.onchange = () => setN(gd.value);
  $("#gf").onclick = (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    if (b.dataset.n) setN(b.dataset.n);
    else if (b.dataset.st) setN((+gd.value || DEF_DAYS) + +b.dataset.st);
  };
  paint();

  /* ---- restart ---- */
  const restartRoad = async (id) => {
    const r = R.find((y) => y.id === id);
    if (!r) return;
    if (
      !(await dlg({
        title: `Restart "${r.title}"?`,
        msg: "Its checkmarks reset and the road starts again today. Your XP, awards and banners stay.",
        ok: "Restart road",
      }))
    )
      return;
    try {
      const today = ds(new Date()),
        fresh = R.map((y) => (y.id === id ? { ...y, from: today, d: Array(y.n).fill(0) } : y)),
        gain = Math.max(0, perfectDays(R) - perfectDays(fresh)),
        bank = bankWith(profile.bank || {}, [r], gain),
        bt = writeBatch(db);
      bt.update(doc(db, "users", me.uid), { bank });
      bt.update(r.ref, { from: today, d: Array(r.n).fill(0) });
      await bt.commit();
      profile.bank = bank;
      toast("Road restarted");
    } catch (x) {
      toast(err(x));
    }
  };
  const restartAll = async () => {
    if (!R.length) return toast("No roads to restart yet");
    if (
      !(await dlg({
        title: "Restart every road?",
        msg: "All checkmarks reset and each road starts again today. Your XP, awards and banners stay.",
        ok: "Restart all",
      }))
    )
      return;
    try {
      const today = ds(new Date()),
        bank = bankWith(profile.bank || {}, R, perfectDays(R)),
        bt = writeBatch(db);
      bt.update(doc(db, "users", me.uid), { cycleStart: today, bank });
      R.forEach((r) => bt.update(r.ref, { from: today, d: Array(r.n).fill(0) }));
      await bt.commit();
      cs = profile.cycleStart = today;
      profile.bank = bank;
      toast("All roads restarted");
    } catch (x) {
      toast(err(x));
    }
  };
  $("#rsa").onclick = restartAll;

  /* ---- add a road ---- */
  $("#gf").onsubmit = async (e) => {
    e.preventDefault();
    const t = $("#gt").value.trim(),
      n = clampDays(gd.value);
    if (!t) return;
    try {
      await addDoc(col, { title: t, days: n, from: ds(new Date()), d: Array(n).fill(0), at: serverTimestamp() });
      try {
        localStorage.gd = n;
      } catch {}
      $("#gt").value = "";
      toast(`Road started: ${plural(n, "day")}`);
    } catch (x) {
      toast(err(x));
    }
  };

  const draw = () => {
    R = docs.map((x) => road(x, cs)).sort((a, b) => a.n - b.n); // shortest roads first
    const n = R.length,
      max = Math.max(0, ...R.map((r) => r.n)),
      old = $(".sheet"),
      sl = old ? old.scrollLeft : null;
    const head =
      '<th class="gn">Goal</th>' +
      Array.from({ length: max }, (_, i) => `<th class="dh"><b>${i + 1}</b></th>`).join("") +
      '<th class="dh endh">Progress</th>';
    const rows = R.map((r) => {
      const cells = r.d
        .map(
          (v, i) =>
            `<td class="${i === r.idx ? "today" : ""}" title="${dateOf(r, i)}"><input type="checkbox" data-g="${r.id}" data-i="${i}" ${v ? "checked" : ""} ${i > r.idx ? "disabled" : ""} aria-label="${esc(r.title)} day ${i + 1}"></td>`,
        )
        .join("");
      return `<tr class="${r.full ? "fin" : ""}"><th class="gn" scope="row"><div class="gc"><div class="gi"><b>${esc(r.title)}</b><div class="gmeta"><span class="chip">${plural(r.n, "day")}</span><small>${r.p}% · streak ${r.cur}</small></div></div><div class="gact">${roadActions(r)}</div></div></th>${cells}<td class="end" colspan="${max - r.n + 1}"><div class="endc">${ring(r)}<div class="endt"><b>${r.done}/${r.n}</b><small>${roadStat(r)}</small></div>${r.over ? `<button class="btn ghost sm" data-rs="${r.id}">Restart</button>` : ""}</div></td></tr>`;
    }).join("");
    const cards = R.map((r) => {
      const td = r.idx >= 0 && r.idx < r.n ? r.d[r.idx] : null;
      return `<div class="card gcard"><div class="row sb"><div class="gi"><b>${esc(r.title)}</b><div class="gmeta"><span class="chip">${plural(r.n, "day")}</span><small>${r.p}% · streak ${r.cur}</small></div><small>${roadStat(r)}</small></div><div class="gact">${roadActions(r)}</div></div>${
        r.over
          ? `<button class="btn ghost" data-rs="${r.id}">Restart road</button>`
          : td === null
            ? ""
            : `<button class="tdy${td ? " on" : ""}" data-g="${r.id}" data-i="${r.idx}">${CK}<span>${td ? "Done today" : "Mark today done"}</span></button>`
      }<div class="mdays">${r.d.map((v, i) => `<button class="md${v ? " on" : ""}${i === r.idx ? " now" : ""}" data-g="${r.id}" data-i="${i}" ${i > r.idx ? "disabled" : ""} aria-label="Day ${i + 1}">${v ? CK : i + 1}</button>`).join("")}<div class="mend">${ring(r)}</div></div>${rewardTile(r)}</div>`;
    }).join("");
    const shelf = `<section class="rws"><h3>Road rewards</h3><div class="rwg">${R.map((r) => `<div class="rwc"><div class="rwh"><b>${esc(r.title)}</b><small>${plural(r.n, "day")}</small></div>${rewardTile(r)}</div>`).join("")}</div></section>`;
    $("#gl").innerHTML = n
      ? `<div class="sheet"><table><thead><tr>${head}</tr></thead><tbody>${rows}</tbody></table></div><div class="gm">${cards}</div>${shelf}`
      : '<p class="muted">No goals yet. Name a goal, pick how many days it runs, and add your first road above.</p>';
    const sh = $(".sheet");
    if (sh) {
      const live = R.filter((r) => !r.over && r.idx >= 0),
        focus = live.length ? Math.min(...live.map((r) => r.idx)) : 0;
      jump(sh, sl === null ? Math.max(0, focus * 36 - 40) : sl);
    }
    const today = new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" }),
      running = R.filter((r) => !r.over).length;
    $("#cyc").textContent = `overall · ${today}${n ? ` · ${running} running` : ""}`;

    // big ring + success/fail meters
    const C = 2 * Math.PI * 90,
      total = sum(R.map((r) => r.n)),
      done = sum(R.map((r) => r.done)),
      missed = sum(R.map((r) => r.missed)),
      past = sum(R.map((r) => r.past)),
      donePast = sum(R.map((r) => r.donePast)),
      seg = (id, from, len) => {
        const c = $(id);
        c.setAttribute("stroke-dasharray", `${total ? (C * len) / total : 0} ${C}`);
        c.setAttribute("stroke-dashoffset", -(total ? (C * from) / total : 0));
      };
    seg("#rg1", 0, done);
    seg("#rg2", done, missed);
    const hit = past ? Math.round((donePast / past) * 100) : null;
    $("#ms").textContent = hit === null ? "-" : hit + "%";
    $("#mf").textContent = hit === null ? "-" : 100 - hit + "%";
    $("#mb1").style.width = (hit || 0) + "%";
    $("#mb2").style.width = (hit === null ? 0 : 100 - hit) + "%";
    $("#lg").textContent = `${done} done · ${missed} missed · ${Math.max(total - done - missed, 0)} to go`;
    const all = n ? Math.round(sum(R.map((r) => r.p)) / n) : 0,
      dl = firstDraw ? (document.documentElement.classList.contains("quick") ? 250 : 900) : 0;
    firstDraw = false;
    if (cs) grant(calc(profile, R), { notes: 0, folders: 0, friends: 0 });
    setTimeout(() => $("#all") && count($("#all"), all), dl);
    if (profile.pct !== all) {
      profile.pct = all;
      updateDoc(doc(db, "users", me.uid), { pct: all }).catch(() => {});
    }
  };
  snap(
    query(col, orderBy("at")),
    (s) => {
      docs = s.docs;
      if (!cs) {
        cs =
          docs
            .map((x) => x.data().start)
            .filter(Boolean)
            .sort()[0] || ds(new Date());
        profile.cycleStart = cs;
        updateDoc(doc(db, "users", me.uid), { cycleStart: cs }).catch(() => {});
      }
      // migrate goals made with the old per-goal start date
      docs.forEach((x) => {
        const g = x.data();
        if (!g.start) return;
        const off = Math.max(0, Math.round((D0(g.start) - D0(cs)) / DAY));
        updateDoc(x.ref, {
          d: [...Array(off).fill(0), ...(g.d || [])].slice(0, 30).map((v) => (v == 1 ? 1 : 0)),
          start: deleteField(),
        }).catch(() => {});
      });
      draw();
    },
    onErr,
  );
  const setDay = (gid, i, v, undo) => {
    const r = R.find((y) => y.id === gid);
    if (!r) return;
    const d = [...r.d];
    d[i] = v === undefined ? 1 - d[i] : v;
    if (navigator.vibrate) navigator.vibrate(12);
    updateDoc(r.ref, { d }).catch((y) => {
      if (undo) undo();
      toast(err(y));
    });
  };
  $("#gl").onclick = async (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    if (b.dataset.rs) return restartRoad(b.dataset.rs);
    if (b.dataset.g) return setDay(b.dataset.g, +b.dataset.i);
    if (b.dataset.del && (await dlg({ title: "Delete this goal?", msg: "Its checkmarks will be removed too.", ok: "Delete", danger: true })))
      deleteDoc(doc(col, b.dataset.del)).catch((x) => toast(err(x)));
  };
  $("#gl").onchange = (e) => {
    const c = e.target;
    if (!c.dataset || !c.dataset.g) return;
    if (c.type !== "checkbox") return;
    setDay(c.dataset.g, +c.dataset.i, c.checked ? 1 : 0, () => (c.checked = !c.checked));
  };
};

P.notes = () => {
  m().innerHTML = `<div class="nb" id="nb"><aside class="ns card"><div class="row sb"><b>Folders</b><button class="link" id="nf">+ Folder</button></div><div class="fos" id="fo"></div><div class="row" id="fa"></div><button class="btn" id="nn">+ New note</button><div id="nl" class="nls">${sk(3, 56)}</div></aside>
 <section class="ne card"><p class="muted" id="em">Pick a note on the left, or make a new one.</p><div id="ex" hidden>
 <div class="row"><button class="btn ghost bk" id="bk">← Notes</button><input class="tt" id="nt" placeholder="Title" maxlength="80"><button class="x" id="nd" title="Delete note" aria-label="Delete note">×</button></div>
 <div class="row"><select id="nfs"></select><small id="sv" class="muted"></small></div>
 <div class="tb" id="tb"><button data-c="bold" title="Bold"><b>B</b></button><button data-c="italic" title="Italic"><i>I</i></button><button data-c="underline" title="Underline"><u>U</u></button><button data-c="strikeThrough" title="Strike"><s>S</s></button>
 <select id="ff"><option value="">Font</option><option value="Chakra Petch">Chakra</option><option value="Arial">Sans</option><option value="Georgia">Serif</option><option value="Courier New">Mono</option><option value="Comic Sans MS">Hand</option></select>
 <select id="fz"><option value="">Size</option><option value="2">Small</option><option value="3">Normal</option><option value="5">Large</option><option value="6">Huge</option></select>
 <input type="color" id="tc" value="#ff5a36" title="Text color"><input type="color" id="hc" value="#f5c542" title="Highlight">
 <button data-c="formatBlock" data-v="h2" title="Heading">H</button><button data-c="insertUnorderedList" title="Bullets">• List</button><button data-c="insertOrderedList" title="Numbers">1. List</button><button data-c="removeFormat" title="Clear formatting">Clear</button></div>
 <div class="rte" id="rt" contenteditable="true" data-ph="Start writing..."></div></div></section></div>`;
  const nc = collection(db, "users", me.uid, "notes"),
    fc = collection(db, "users", me.uid, "folders");
  let F = [], N = {}, cur = "all", sel = null, tm = null, rg = null;
  const ms = (v) => (v && v.toMillis ? v.toMillis() : v || Date.now()),
    html = (n) => (n.html != null ? clean(n.html) : esc(n.text || "").replace(/\n/g, "<br>")),
    ttl = (n) => n.title || plain(html(n)).slice(0, 40) || "Untitled",
    shut = () => {
      sel = null;
      $("#ex").hidden = true;
      $("#em").hidden = false;
      $("#nb").classList.remove("open");
    };
  const drawF = () => {
    $("#fo").innerHTML = [["all", "All"], ["none", "Unfiled"], ...F.map((f) => [f.id, f.data().name])]
      .map(([id, n]) => `<button class="fo${cur === id ? " on" : ""}" data-f="${id}">${esc(n)}</button>`).join("");
    $("#fa").innerHTML = F.some((f) => f.id === cur)
      ? '<button class="link" id="fr">Rename</button><button class="link" id="fd">Delete folder</button>' : "";
    $("#nfs").innerHTML = '<option value="">Unfiled</option>' + F.map((f) => `<option value="${f.id}">${esc(f.data().name)}</option>`).join("");
    if (sel && N[sel]) $("#nfs").value = N[sel].folder || "";
  };
  const drawN = () => {
    const l = Object.entries(N)
      .filter(([, n]) => cur === "all" || (cur === "none" ? !n.folder : n.folder === cur))
      .sort((a, b) => ms(b[1].upd || b[1].at) - ms(a[1].upd || a[1].at));
    $("#nl").innerHTML = l.map(([id, n]) => `<button class="nt${id === sel ? " on" : ""}" data-n="${id}"><b>${esc(ttl(n))}</b><small>${esc(plain(html(n)).slice(0, 60) || "Empty note")}</small></button>`).join("") || '<p class="muted">No notes here yet.</p>';
  };
  const flush = () => {
    clearTimeout(tm);
    if (!sel || $("#ex").hidden || !N[sel]) return;
    const id = sel, d = { title: $("#nt").value.trim(), html: clean($("#rt").innerHTML), folder: $("#nfs").value };
    Object.assign(N[id], d, { upd: Date.now() });
    updateDoc(doc(nc, id), { ...d, upd: serverTimestamp() })
      .then(() => { if (sel === id && $("#sv")) $("#sv").textContent = "Saved ✓"; })
      .catch(onErr);
    drawN();
  };
  const save = () => {
    clearTimeout(tm);
    tm = setTimeout(flush, 700);
    $("#sv").textContent = "Typing...";
  };
  const open = (id) => {
    flush();
    sel = id;
    const n = N[id];
    $("#em").hidden = true;
    $("#ex").hidden = false;
    $("#nb").classList.add("open");
    $("#nt").value = n.title || "";
    $("#rt").innerHTML = html(n);
    $("#sv").textContent = "";
    drawF();
    drawN();
  };
  snap(query(nc), (s) => {
    N = {};
    s.docs.forEach((x) => (N[x.id] = x.data()));
    if (sel && !N[sel]) shut();
    drawN();
  }, onErr);
  snap(query(fc, orderBy("at")), (s) => {
    F = s.docs;
    if (cur !== "all" && cur !== "none" && !F.some((f) => f.id === cur)) cur = "all";
    drawF();
    drawN();
  }, onErr);
  $("#nf").onclick = async () => {
    const n = (await dlg({ input: true, title: "New folder", ph: "Folder name", ok: "Create" })) || "";
    if (n) addDoc(fc, { name: n.slice(0, 30), at: serverTimestamp() }).catch(onErr);
  };
  $("#fo").onclick = (e) => {
    const b = e.target.closest("[data-f]");
    if (b) { cur = b.dataset.f; drawF(); drawN(); }
  };
  $("#fa").onclick = async (e) => {
    if (e.target.id === "fr") {
      const n = (await dlg({ input: true, title: "Rename folder", value: F.find((f) => f.id === cur).data().name, ok: "Rename" })) || "";
      if (n) updateDoc(doc(fc, cur), { name: n.slice(0, 30) }).catch(onErr);
    }
    if (e.target.id === "fd" && (await dlg({ title: "Delete this folder?", msg: "Its notes move to Unfiled.", ok: "Delete", danger: true }))) {
      const id = cur;
      cur = "all";
      await Promise.all(Object.entries(N).filter(([, n]) => n.folder === id).map(([k]) => updateDoc(doc(nc, k), { folder: "" })));
      deleteDoc(doc(fc, id)).catch(onErr);
    }
  };
  $("#nn").onclick = async () => {
    try {
      flush();
      const f = F.some((x) => x.id === cur) ? cur : "",
        r = await addDoc(nc, { title: "", html: "", folder: f, at: serverTimestamp(), upd: serverTimestamp() });
      N[r.id] = { title: "", html: "", folder: f, at: Date.now(), upd: Date.now() };
      open(r.id);
      $("#nt").focus();
    } catch (x) { onErr(x); }
  };
  $("#nl").onclick = (e) => {
    const b = e.target.closest("[data-n]");
    if (b) open(b.dataset.n);
  };
  $("#bk").onclick = () => { flush(); $("#nb").classList.remove("open"); };
  $("#nd").onclick = async () => {
    if (!sel || !(await dlg({ title: "Delete this note?", msg: "This cannot be undone.", ok: "Delete", danger: true }))) return;
    const id = sel;
    clearTimeout(tm);
    shut();
    deleteDoc(doc(nc, id)).catch(onErr);
  };
  $("#nt").oninput = $("#rt").oninput = save;
  $("#nfs").onchange = flush;
  $("#rt").onpaste = (e) => {
    e.preventDefault();
    document.execCommand("insertText", false, e.clipboardData.getData("text/plain"));
  };
  on(document, "selectionchange", () => {
    const s = getSelection();
    if (s.rangeCount && $("#rt") && $("#rt").contains(s.anchorNode)) rg = s.getRangeAt(0).cloneRange();
  });
  const run = (c, v) => {
    $("#rt").focus();
    if (rg) { const s = getSelection(); s.removeAllRanges(); s.addRange(rg); }
    document.execCommand("styleWithCSS", false, false);
    document.execCommand(c, false, v);
    save();
  };
  $("#tb").onmousedown = (e) => { if (e.target.closest("button")) e.preventDefault(); };
  $("#tb").onclick = (e) => {
    const b = e.target.closest("button");
    if (b) run(b.dataset.c, b.dataset.v || null);
  };
  $("#ff").onchange = (e) => { if (e.target.value) run("fontName", e.target.value); e.target.value = ""; };
  $("#fz").onchange = (e) => { if (e.target.value) run("fontSize", e.target.value); e.target.value = ""; };
  $("#tc").onchange = (e) => run("foreColor", e.target.value);
  $("#hc").onchange = (e) => run("hiliteColor", e.target.value);
  on(window, "pagehide", flush);
  offs.push(flush);
};

P.road = async () => {
  const my = rid;
  m().innerHTML = '<h2>Your Road</h2><div id="rd">' + sk(1, 150) + sk(2, 90) + "</div>";
  const u = (c) => getDocs(collection(db, "users", me.uid, c));
  let g, nt, fo, fr;
  try {
    [g, nt, fo, fr] = await Promise.all([u("goals"), u("notes"), u("folders"),
      getDocs(query(collection(db, "friendships"), where("users", "array-contains", me.uid)))]);
  } catch (x) {
    if (my !== rid) return;
    $("#rd").innerHTML = "";
    return onErr(x);
  }
  if (my !== rid) return;
  const R = g.docs.map((d) => road(d, profile.cycleStart)),
    t = calc(profile, R),
    x = { notes: nt.size, folders: fo.size, friends: fr.docs.filter((d) => d.data().status === "accepted").length },
    have = new Set([...(profile.awards || []), ...AW.filter((a) => a[5](t, x)).map((a) => a[0])]);
  grant(t, x);
  const lv = t.lv, a0 = lvStart(lv), a1 = lvStart(lv + 1),
    pc = Math.round(((t.xp - a0) / (a1 - a0)) * 100),
    hue = (L) => `hsl(${(L * 47) % 360} 85% 62%)`,
    c1 = profile.c1 || "#5865f2", c2 = profile.c2 || "#eb459e",
    roles = [[rankOf(lv), hue(lv)], t.best ? [t.best + "-day best streak", "#ff8a3d"] : 0, t.checks ? [t.checks + " check-ins", "#38bdf8"] : 0,
      [have.size + " awards", "#f5c542"], t.forged ? [plural(t.forged, "road") + " forged", "#3ddc84"] : 0].filter(Boolean),
    badges = AW.filter((a) => have.has(a[0])).slice(0, 10).map((a) => `<span title="${esc(a[2])}">${a[1]}</span>`).join(""),
    nodes = Array.from({ length: 7 }, (_, i) => Math.max(1, lv - 1) + i)
      .map((L) => `<div class="rn${L < lv ? " dn" : L === lv ? " cur" : ""}"><i>${L}</i><b>${rankOf(L)}</b><em>${lvStart(L)} xp</em></div>`).join("");
  // banners: earned by finishing roads, optionally worn on the profile card
  const owned = new Set([...(profile.banners || []), ...t.banners]),
    worn = () => BN.find((b) => b.id === profile.banner && owned.has(b.id)),
    bnCss = () => {
      const b = worn();
      return b
        ? `background:#000 url('${bnSrc(b)}') center/cover no-repeat`
        : `background:linear-gradient(120deg,${profile.c1 || "#5865f2"},${profile.c2 || "#eb459e"},${profile.c1 || "#5865f2"})`;
    },
    bnApply = () => {
      const el = $("#bn");
      if (!el) return;
      el.style.cssText = bnCss();
      el.classList.toggle("img", !!worn());
    },
    drawBn = () => {
      const cur = worn(),
        h = $("#bnh"),
        g = $("#bng");
      if (!h || !g) return;
      h.textContent = `Banner rewards · ${owned.size}/${BN.length}`;
      g.innerHTML = BN.map((b, i) => {
        const got = owned.has(b.id),
          eq = !!cur && cur.id === b.id;
        return bnFig(
          b,
          got ? 100 : 0,
          got,
          `<div><b>${b.name}</b><small>${bnRange(i)}</small></div>${got ? `<button class="btn ghost sm" data-eq="${b.id}">${eq ? "Remove" : "Use on profile"}</button>` : ""}`,
          eq ? " eq" : "",
        );
      }).join("");
    };
  $("#rd").innerHTML = `<div class="dc"><div class="bn${worn() ? " img" : ""}" id="bn" style="${bnCss()}"></div><div class="dcb">
 <div class="dav">${A(profile)}<span class="lvb">Lv ${lv}</span></div>
 <div class="dnm"><b>${esc(profile.username)}</b><span class="rk" style="color:${hue(lv)}">${rankOf(lv)}</span></div>
 <div class="badges">${badges || '<small class="muted">No badges yet. Check off a day to earn your first.</small>'}</div>
 <div class="dsec"><small>ABOUT ME</small><p id="abt">${esc(profile.bio || "Nothing here yet. Tell people about your road.")}</p></div>
 <div class="dsec"><small>XP</small><div class="row sb"><b>${t.xp} XP</b><small>${a1 - t.xp} to Lv ${lv + 1}</small></div><div class="xpb"><i style="width:${pc}%"></i></div></div>
 <div class="dsec"><small>ROLES</small><div class="roles">${roles.map(([n, c]) => `<span class="role"><i style="background:${c}"></i>${esc(n)}</span>`).join("")}</div></div>
 <div><button class="btn ghost" id="es">Edit style</button></div></div></div>
 <div class="card" id="ep" hidden><label>Banner colors</label><div class="row"><input type="color" id="c1" value="${c1}"><input type="color" id="c2" value="${c2}"></div><label>About me</label><textarea id="ab" maxlength="160">${esc(profile.bio || "")}</textarea><div><button class="btn" id="sv2">Save style</button></div></div>
 <h3>The road ahead</h3><div class="card"><div class="road">${nodes}</div><small class="muted">10 XP per check-in · 30 per perfect day · a bonus for every road you forge (200 XP at 30 days, scaled by length) · 100 per road run to its last day</small></div>
 <h3>Awards · ${have.size}/${AW.length}</h3><div class="awg">${AW.map((a) => `<div class="aw${have.has(a[0]) ? "" : " lk"}" style="--c:${a[4]}"><span class="ic">${a[1]}</span><b>${a[2]}</b><small>${a[3]}</small></div>`).join("")}</div>
 <h3 id="bnh"></h3><small class="muted">Finish a road to earn its banner. Longer roads unlock rarer banners.</small><div class="bng" id="bng"></div>`;
  $("#es").onclick = () => ($("#ep").hidden = !$("#ep").hidden);
  drawBn();
  $("#bng").onclick = async (e) => {
    const b = e.target.closest("[data-eq]");
    if (!b) return;
    const id = profile.banner === b.dataset.eq ? "" : b.dataset.eq;
    try {
      await updateDoc(doc(db, "users", me.uid), { banner: id });
      profile.banner = id;
      bnApply();
      drawBn();
      toast(id ? "Banner applied to your profile" : "Banner removed");
    } catch (y) {
      onErr(y);
    }
  };
  $("#sv2").onclick = async () => {
    const d = { c1: $("#c1").value, c2: $("#c2").value, bio: $("#ab").value.trim() };
    try {
      await updateDoc(doc(db, "users", me.uid), d);
      Object.assign(profile, d);
      bnApply();
      $("#abt").textContent = d.bio || "Nothing here yet. Tell people about your road.";
      toast("Style saved");
    } catch (y) { onErr(y); }
  };
};

P.friends = () => {
  m().innerHTML = `<h2>Friends</h2><form id="ff" class="row card" style="flex-direction:row"><input id="fu" placeholder="Find a friend by username" required><button class="btn">Add</button></form><div id="fl">${sk(3, 64)}</div>`;
  $("#ff").onsubmit = async (e) => {
    e.preventDefault();
    const r = await getDocs(
      query(
        collection(db, "users"),
        where("usernameLower", "==", $("#fu").value.trim().toLowerCase()),
      ),
    );
    if (r.empty) return toast("No user with that name");
    const o = r.docs[0].id;
    if (o === me.uid) return toast("That's you");
    try {
      await setDoc(doc(db, "friendships", [me.uid, o].sort().join("_")), {
        users: [me.uid, o],
        from: me.uid,
        status: "pending",
      });
      toast("Request sent");
      $("#fu").value = "";
    } catch (x) {
      console.error(x);
      toast("A request with this person already exists");
    }
  };
  snap(
    query(
      collection(db, "friendships"),
      where("users", "array-contains", me.uid),
    ),
    async (s) => {
      const rows = await Promise.all(
        s.docs.map(async (x) => {
          const f = x.data(),
            o = f.users.find((u) => u !== me.uid),
            p = (await getDoc(doc(db, "users", o))).data() || {
              username: "Unknown",
            };
          return { id: x.id, f, p };
        }),
      );
      const btns = (r) =>
        r.f.status === "accepted"
          ? `<button class="link" data-id="${r.id}">Remove</button>`
          : r.f.from === me.uid
            ? `<button class="link" data-id="${r.id}">Cancel</button>`
            : `<button class="btn" data-id="${r.id}" data-ok="1">Accept</button><button class="link" data-id="${r.id}">Decline</button>`;
      const sec = (t, list, fn) =>
        list.length
          ? `<h3>${t}</h3>` +
            list
              .map(
                (r) =>
                  `<div class="fr">${A(r.p)}<div><b>${esc(r.p.username)}</b><br><small>${fn(r)}</small>${r.f.status === "accepted" ? `<div class="bar"><i style="width:${r.p.pct || 0}%"></i></div>` : ""}</div>${btns(r)}</div>`,
              )
              .join("")
          : "";
      const inc = rows.filter(
          (r) => r.f.status === "pending" && r.f.from !== me.uid,
        ),
        fr = rows
          .filter((r) => r.f.status === "accepted")
          .sort((a, b) => (b.p.pct || 0) - (a.p.pct || 0)),
        out = rows.filter(
          (r) => r.f.status === "pending" && r.f.from === me.uid,
        );
      if (!$("#fl")) return;
      $("#fl").innerHTML =
        sec("Requests", inc, () => "wants to be friends") +
          sec("Friends", fr, (r) => (r.p.pct || 0) + "% overall") +
          sec("Sent", out, () => "waiting for them") ||
        '<p class="muted">No friends yet. Search a username above.</p>';
    },
    (e) => { console.error(e); toast(err(e)); },
  );
  $("#fl").onclick = (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    const r = doc(db, "friendships", b.dataset.id);
    b.dataset.ok ? updateDoc(r, { status: "accepted" }) : deleteDoc(r);
  };
};

P.profile = () => {
  let photo = profile.photo || "";
  m().innerHTML = `<h2>Profile</h2><div class="card center"><div id="pv">${A(profile)}</div><b>${esc(profile.username)}</b><small>${profile.pct || 0}% overall completion</small><label class="btn ghost">Upload photo<input type="file" id="pf" accept="image/*" hidden></label>
 <textarea id="bio" maxlength="160" placeholder="Short bio">${esc(profile.bio || "")}</textarea><button class="btn" id="ps">Save profile</button></div>`;
  $("#pf").onchange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    const im = new Image();
    im.onload = () => {
      const c = document.createElement("canvas");
      c.width = c.height = 160;
      const s = Math.min(im.width, im.height);
      c.getContext("2d").drawImage(
        im,
        (im.width - s) / 2,
        (im.height - s) / 2,
        s,
        s,
        0,
        0,
        160,
        160,
      );
      photo = c.toDataURL("image/jpeg", 0.8);
      $("#pv").innerHTML = A({ photo });
    };
    im.src = URL.createObjectURL(f);
  };
  $("#ps").onclick = async () => {
    await updateDoc(doc(db, "users", me.uid), {
      photo,
      bio: $("#bio").value.trim(),
    });
    toast("Profile saved");
  };
};

P.settings = () => {
  m().innerHTML = `<h2>Settings</h2>
 <div class="card"><label>Username</label><div class="row"><input id="su" value="${esc(profile.username)}" maxlength="20"><button class="btn" id="sun">Change</button></div></div>
 <div class="card"><label>Theme</label><div class="row"><button class="btn ghost" data-t="dark">Black</button><button class="btn ghost" data-t="light">White</button></div>
 <label>Accent color</label><div class="row"><input type="color" id="sc" value="${profile.accent || "#888888"}"><button class="btn ghost" id="sr">Reset accent</button></div>
 <div><button class="btn ghost" id="sd">Reset all settings to default</button></div></div>
 <div class="card"><label>Progress report</label><small>Completion, streaks, missed days and your strongest goals for every road.</small><div><a class="btn ghost" href="report.html">Open report</a></div></div>
 <div class="card"><button class="btn ghost" id="so">Log out</button></div>
 <div class="card danger"><label>Delete account</label><small>Permanently deletes your goals, notes, friendships and profile. This cannot be undone.</small>
 <input type="password" id="dp" placeholder="Your password" autocomplete="current-password"><input id="dc" placeholder="Type DELETE to confirm" autocomplete="off" autocapitalize="characters" spellcheck="false"><div><button class="btn" id="dx" disabled>Delete my account</button></div></div>
 <p class="muted" style="text-align:center"><small>Forged build v7 · custom roads</small></p>`;
  const mark = () =>
    document
      .querySelectorAll("[data-t]")
      .forEach((b) =>
        b.classList.toggle("sel", b.dataset.t === (profile.theme || "dark")),
      );
  const save = (d) => {
    Object.assign(profile, d);
    applyTheme(profile);
    mark();
    return updateDoc(doc(db, "users", me.uid), d);
  };
  $("#sun").onclick = async () => {
    const n = $("#su").value.trim();
    if (!validName(n)) return toast("Username: 3-20 letters, numbers or _");
    try {
      if (await nameTaken(n)) return toast("That username is taken");
      await save({ username: n, usernameLower: n.toLowerCase() });
      toast("Username changed");
    } catch (x) {
      toast(err(x));
    }
  };
  document
    .querySelectorAll("[data-t]")
    .forEach((b) => (b.onclick = () => save({ theme: b.dataset.t })));
  mark();
  $("#sc").onchange = (e) => save({ accent: e.target.value });
  $("#sr").onclick = () => {
    $("#sc").value = "#888888";
    save({ accent: "" });
  };
  $("#sd").onclick = async () => {
    $("#sc").value = "#888888";
    await save({ theme: "dark", accent: "" });
    toast("Settings reset to default");
  };
  $("#so").onclick = () => signOut(auth);

  const ready = () =>
    ($("#dx").disabled = !($("#dp").value && $("#dc").value.trim() === "DELETE"));
  $("#dp").oninput = $("#dc").oninput = ready;
  $("#dx").onclick = async () => {
    if (!(await dlg({ title: "Delete your account?", msg: "Your goals, notes, friends and profile will be permanently erased. This cannot be undone.", ok: "Delete forever", danger: true }))) return;
    const b = $("#dx");
    b.disabled = true;
    try {
      const u = auth.currentUser;
      // 1) prove it's really you
      await reauthenticateWithCredential(
        u,
        EmailAuthProvider.credential(u.email, $("#dp").value),
      );
      // 2) wipe data while we still have permission
      for (const s of ["goals", "notes"]) {
        const r = await getDocs(collection(db, "users", u.uid, s));
        await Promise.all(r.docs.map((d) => deleteDoc(d.ref)));
      }
      const f = await getDocs(
        query(collection(db, "friendships"), where("users", "array-contains", u.uid)),
      );
      await Promise.all(f.docs.map((d) => deleteDoc(d.ref)));
      await deleteDoc(doc(db, "users", u.uid));
      // 3) finally remove the login itself
      await deleteUser(u);
      try {
        localStorage.removeItem("t30");
      } catch {}
      location = "index.html";
    } catch (x) {
      console.error(x);
      toast(err(x));
      b.disabled = false;
    }
  };
};

P.report = async () => {
  const my = rid;
  m().innerHTML = `<div class="row sb"><h2>Report</h2><a href="settings.html">← Settings</a></div><div id="rp">${sk(2, 90)}${sk(3, 46)}</div>`;
  let s;
  try {
    s = await getDocs(query(collection(db, "users", me.uid, "goals"), orderBy("at")));
  } catch (x) {
    if (my !== rid) return;
    $("#rp").innerHTML = "";
    return onErr(x);
  }
  if (my !== rid) return;
  if (s.empty) {
    $("#rp").innerHTML =
      '<p class="muted">No goals yet. Add some on the Goals page and your report will show up here.</p>';
    return;
  }
  const R = s.docs.map((x) => road(x, profile.cycleStart)),
    rows = R.map((r) => ({
      t: r.title,
      n: r.n,
      done: r.done,
      miss: r.missed,
      rate: r.past ? Math.round((r.donePast / r.past) * 100) : null,
      p: r.p,
      cur: r.cur,
      best: r.best,
    }));
  const total = sum(R.map((r) => r.done)),
    overall = Math.round(sum(R.map((r) => r.p)) / R.length),
    forged = R.filter((r) => r.full).length,
    perfect = perfectDays(R);
  const sorted = [...rows].sort((a, b) => b.p - a.p),
    top = sorted[0],
    low = sorted[sorted.length - 1];
  $("#rp").innerHTML = `<div class="grid">${[
    ["Overall completion", overall + "%"],
    ["Check-ins", total],
    ["Roads forged", forged + " / " + R.length],
    ["Perfect days", perfect],
  ]
    .map(([k, v]) => `<div class="card"><small>${k}</small><span class="big">${v}</span></div>`)
    .join("")}</div>
 <div class="card"><small>Strongest goal</small><b>${esc(top.t)} · ${top.p}%</b>${rows.length > 1 ? `<small>Needs the most attention</small><b>${esc(low.t)} · ${low.p}%</b>` : ""}</div>
 <h3>By goal</h3><div class="rt"><table><thead><tr><th>Goal</th><th>Done</th><th>Missed</th><th>Hit rate</th><th>Streak</th><th>Best</th></tr></thead><tbody>${rows
   .map(
     (r) =>
       `<tr><td>${esc(r.t)}</td><td>${r.done}/${r.n}</td><td>${r.miss}</td><td>${r.rate === null ? "-" : r.rate + "%"}</td><td>${r.cur}</td><td>${r.best}</td></tr>`,
   )
   .join("")}</tbody></table></div>
 <p class="muted"><small>Hit rate = checked days ÷ days that have already passed. Missed counts only past days, so today is never a miss until tomorrow.</small></p>`;
};

const T = { goals: "Goals", road: "Your Road", notes: "Notes", friends: "Friends", profile: "Profile", settings: "Settings", report: "Report" };
const pageOf = (u) => (new URL(u, location.href).pathname.split("/").pop() || "").replace(".html", "");
const mount = (p) => {
  if ($("header")) {
    $("#pb").innerHTML = A(p);
    $(".lv").textContent = "Lv " + lvOf(p.xp || 0);
    return;
  }
  document.body.insertAdjacentHTML(
    "afterbegin",
    `<header><a class="logo" href="goals.html"><img src="logo.png" alt="Forged"></a><span class="date" id="dt">${new Date().toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}</span><a class="lv" href="road.html">Lv ${lvOf(p.xp || 0)}</a><nav>${TABS.map(([k, l]) => `<a href="${k}.html" class="${k === page ? "on" : ""}">${IC[k]}<span>${l}</span></a>`).join("")}</nav><div class="pm"><button class="avb" id="pb" aria-label="Account menu" aria-haspopup="true" aria-expanded="false">${A(p)}</button><div class="menu" id="am" hidden><a href="profile.html">Profile</a><a href="settings.html">Settings</a><a href="report.html">Report</a><button id="lo">Log out</button></div></div></header>`,
  );
  const pb = $("#pb"),
    am = $("#am"),
    shut = () => {
      am.hidden = true;
      pb.setAttribute("aria-expanded", "false");
    };
  pb.onclick = (e) => {
    e.stopPropagation();
    am.hidden = !am.hidden;
    pb.setAttribute("aria-expanded", String(!am.hidden));
  };
  document.addEventListener("click", shut);
  document.addEventListener("keydown", (e) => e.key === "Escape" && shut());
  $("#lo").onclick = () => signOut(auth);
};
let introT;
const show = (name, initial) => {
  offs.forEach((f) => { try { f(); } catch {} });
  offs = [];
  subs.forEach((u) => u());
  subs = [];
  rid++;
  page = name;
  document.body.dataset.page = name;
  document.title = "Forged · " + T[name];
  if (!initial) document.documentElement.classList.add("quick");
  document.querySelectorAll("header nav a").forEach((a) => a.classList.toggle("on", pageOf(a.href) === name));
  toTop();
  m().innerHTML = sk(3, 80);
  ld.go();
  const mn2 = $("main");
  mn2.classList.remove("intro");
  void mn2.offsetWidth;
  mn2.classList.add("intro");
  clearTimeout(introT);
  introT = setTimeout(() => mn2.classList.remove("intro"), 1800);
  Promise.resolve(P[name]()).catch(onErr).finally(() => setTimeout(ld.done, 350));
};
const go = (name, push = true) => {
  if (name === page) return;
  if (push) history.pushState({}, "", name + ".html");
  if (document.startViewTransition && !matchMedia("(prefers-reduced-motion: reduce)").matches)
  {
    const vt = document.startViewTransition(() => show(name));
    [vt.ready, vt.finished, vt.updateCallbackDone].forEach((x) => x && x.catch(() => {}));
  }
  else {
    const a = m();
    a.classList.add("out");
    setTimeout(() => { show(name); a.classList.remove("out"); }, 160);
  }
};
document.addEventListener("click", (e) => {
  const a = e.target.closest("a[href]");
  if (!a || e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || a.target || !profile || page === "auth") return;
  const u = new URL(a.href, location.href),
    n = pageOf(u);
  if (u.origin !== location.origin || !T[n]) return;
  e.preventDefault();
  go(n);
});
addEventListener("popstate", () => {
  const n = pageOf(location.href);
  if (T[n] && page !== "auth" && profile) go(n, false);
});

if (page === "auth") P.auth();
else {
  document.body.insertAdjacentHTML("afterbegin", '<div id="ld" class="run"></div>');
  try {
    const c = JSON.parse(localStorage.fp || "null");
    if (c) mount(c);
  } catch {}
  m().innerHTML = sk(3, 80);
}
onAuthStateChanged(auth, async (u) => {
  me = u;
  if (!u) {
    if (page !== "auth") {
      try { localStorage.removeItem("fp"); } catch {}
      location = "index.html";
    }
    return;
  }
  if (page === "auth") {
    if (!busy) location = "goals.html";
    return;
  }
  profile = (await getDoc(doc(db, "users", u.uid))).data() || { username: "user", theme: "dark" };
  applyTheme(profile);
  try {
    localStorage.fp = JSON.stringify({ username: profile.username, photo: profile.photo || "", xp: profile.xp || 0 });
  } catch {}
  mount(profile);
  show(page, true);
});

const mn = document.querySelector("main");
mn.classList.add("intro");
setTimeout(() => mn.classList.remove("intro"), 2600);
new MutationObserver(stag).observe(mn, { childList: true, subtree: true });
stag();
embers();

// the site knows the date: reload when midnight passes
const day0 = ds(new Date());
setInterval(() => {
  if (ds(new Date()) !== day0) location.reload();
}, 60000);

document.addEventListener("pointerdown", (e) => {
  const b = e.target.closest(".btn,nav a,.menu a,.menu button,.nt,.fo,.tb button,.tdy");
  if (!b) return;
  const r = b.getBoundingClientRect(), z = Math.max(r.width, r.height) * 2, i = document.createElement("i");
  i.className = "rip";
  i.style.cssText = `width:${z}px;height:${z}px;left:${e.clientX - r.left - z / 2}px;top:${e.clientY - r.top - z / 2}px`;
  b.append(i);
  setTimeout(() => i.remove(), 600);
});
