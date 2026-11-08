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
const $ = (s) => document.querySelector(s),
  page = document.body.dataset.page,
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
  const e = document.createElement("div");
  e.className = "toast";
  e.textContent = t;
  document.body.append(e);
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
const streak = (d, idx) => {
  const e = Math.min(idx, 29);
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
  for (let i = 0; i < 30; i++) {
    if (d[i] == 1) b = Math.max(b, ++c);
    else c = 0;
  }
  return b;
};
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
  ["forge", "🛡️", "Forged", "Complete a goal 30/30", "#c0c7d1", (t) => t.forged >= 1],
  ["multi", "🧩", "Multitasker", "Run 3 goals at once", "#818cf8", (t) => t.goals >= 3],
  ["cycle", "🏁", "Road Finisher", "Finish a full 30 days", "#34d399", (t) => t.cycles >= 1],
  ["scribe", "📝", "Scribe", "Write your first note", "#fbbf24", (t, x) => x.notes >= 1],
  ["org", "📁", "Organizer", "Create a folder", "#fb923c", (t, x) => x.folders >= 1],
  ["pal", "🤝", "Companion", "Make a friend", "#60a5fa", (t, x) => x.friends >= 1],
];
function calc(p, docs, idx) {
  const b = p.bank || {},
    ds_ = docs.map((x) => Array.from({ length: 30 }, (_, i) => ((x.data().d || [])[i] == 1 ? 1 : 0)));
  let checks = 0, forged = 0, best = 0, perfect = 0;
  ds_.forEach((d) => {
    const c = d.reduce((a, v) => a + v, 0);
    checks += c;
    if (c === 30) forged++;
    best = Math.max(best, bestRun(d));
  });
  if (ds_.length) for (let i = 0; i <= Math.min(idx, 29); i++) if (ds_.every((d) => d[i])) perfect++;
  const t = {
    checks: checks + (b.checks || 0), forged: forged + (b.forged || 0), perfect: perfect + (b.perfect || 0),
    cycles: b.cycles || 0, best: Math.max(best, b.best || 0), goals: docs.length,
  };
  t.xp = t.checks * 10 + t.perfect * 30 + t.forged * 200 + t.cycles * 100;
  t.lv = lvOf(t.xp);
  return t;
}
function grant(t, x) {
  const have = new Set(profile.awards || []),
    nw = AW.filter((a) => !have.has(a[0]) && a[5](t, x)),
    patch = {};
  if (nw.length) {
    profile.awards = [...have, ...nw.map((a) => a[0])];
    patch.awards = profile.awards;
    toast("Award unlocked: " + nw.map((a) => a[2]).join(", "));
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
document.addEventListener("click", (e) => {
  const a = e.target.closest("nav a");
  if (!a || a.classList.contains("on") || "onpagereveal" in window) return;
  e.preventDefault();
  document.body.classList.add("leave");
  setTimeout(() => (location = a.href), 220);
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
    } finally {
      busy = false;
    }
  };
};

P.goals = () => {
  m().innerHTML = `<div class="row sb"><h2>Your goals</h2><button class="link" id="rs">Restart 30 days</button></div>
 <div class="card gauge"><div class="ring"><svg viewBox="0 0 220 220" aria-hidden="true"><circle class="tr" cx="110" cy="110" r="90"/><circle class="no" id="rg2" cx="110" cy="110" r="90" stroke-dasharray="0 999"/><circle class="ok" id="rg1" cx="110" cy="110" r="90" stroke-dasharray="0 999"/></svg><div class="rc"><span id="all">0%</span><small id="cyc"></small></div></div>
 <small id="lg"></small>
 <div class="meters"><div><div class="row sb"><b>Success</b><b id="ms">-</b></div><div class="bar"><i id="mb1" style="width:0"></i></div></div><div><div class="row sb"><b>Fail</b><b id="mf">-</b></div><div class="bar fail"><i id="mb2" style="width:0"></i></div></div></div></div>
 <form id="gf" class="row card" style="flex-direction:row"><input id="gt" placeholder="Add a goal, e.g. Read 20 pages" required maxlength="60"><button class="btn">Add</button></form><div id="gl"></div>`;
  const col = collection(db, "users", me.uid, "goals");
  let cs = profile.cycleStart || "",
    docs = [],
    firstDraw = true;
  const D0 = (s) => new Date(s + "T00:00:00");
  const tIdx = () => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return Math.round((t - D0(cs)) / 864e5);
  };
  const dayDate = (i) => {
    const d = D0(cs);
    d.setDate(d.getDate() + i);
    return d;
  };
  const restart = async () => {
    if (!confirm("Start a new 30 days? All checkmarks will reset.")) return;
    try {
      const ti = tIdx(), t0 = calc(profile, docs, ti),
        bank = { checks: t0.checks, forged: t0.forged, perfect: t0.perfect, cycles: t0.cycles + (ti >= 30 ? 1 : 0), best: t0.best };
      cs = ds(new Date());
      profile.cycleStart = cs;
      profile.bank = bank;
      await updateDoc(doc(db, "users", me.uid), { cycleStart: cs, bank });
      await Promise.all(
        docs.map((x) => updateDoc(x.ref, { d: Array(30).fill(0) })),
      );
      toast("New 30 days started");
    } catch (x) {
      toast(err(x));
    }
  };
  $("#rs").onclick = restart;
  $("#gf").onsubmit = async (e) => {
    e.preventDefault();
    const t = $("#gt").value.trim();
    if (!t) return;
    try {
      await addDoc(col, { title: t, d: Array(30).fill(0), at: serverTimestamp() });
      $("#gt").value = "";
    } catch (x) {
      toast(err(x));
    }
  };
  const draw = () => {
    const idx = tIdx(),
      n = docs.length,
      old = $(".sheet"),
      sl = old ? old.scrollLeft : null;
    let sum = 0;
    const head = Array.from({ length: 30 }, (_, i) => {
      const dt = dayDate(i);
      return `<th class="dh${i === idx ? " today" : ""}" title="${dt.toDateString()}"><b>${i + 1}</b><small>${dt.getDate()}</small></th>`;
    }).join("");
    const rows = docs
      .map((x) => {
        const g = x.data(),
          d = Array.from({ length: 30 }, (_, i) => (g.d || [])[i]),
          p = Math.round((d.filter((v) => v == 1).length / 30) * 100);
        sum += p;
        return `<tr><th class="gn" scope="row"><div class="gc"><div><b>${esc(g.title)}</b><br><small>${p}% · streak ${streak(d, idx)}</small>${p === 100 ? ' <span class="seal">Forged</span>' : ""}</div><button class="x" data-del="${x.id}" title="Delete goal" aria-label="Delete goal">×</button></div></th>${d.map((v, i) => `<td class="${i === idx ? "today" : ""}"><input type="checkbox" data-g="${x.id}" data-i="${i}" ${v == 1 ? "checked" : ""} ${i > idx ? "disabled" : ""} aria-label="${esc(g.title)} day ${i + 1}"></td>`).join("")}</tr>`;
      })
      .join("");
    const banner =
      idx >= 30
        ? `<div class="card"><b>30 days complete.</b><small>Check your report, then start fresh when you're ready.</small><div class="row"><button class="btn" id="rs2">Start new 30 days</button><a class="btn ghost" href="report.html">View report</a></div></div>`
        : "";
    $("#gl").innerHTML =
      banner +
      (n
        ? `<div class="sheet"><table><thead><tr><th class="gn">Goal</th>${head}</tr></thead><tbody>${rows}</tbody></table></div>`
        : '<p class="muted">No goals yet. Add your first one above.</p>');
    const sh = $(".sheet");
    if (sh) sh.scrollLeft = sl === null ? Math.max(0, idx * 36 - 140) : sl;
    $("#cyc").textContent =
      idx >= 30
        ? "overall · cycle finished"
        : idx < 0
          ? "overall · starts " + cs
          : `overall · Day ${idx + 1} of 30 · ${dayDate(idx).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}`;
    // big ring + success/fail meters
    const C = 2 * Math.PI * 90,
      total = n * 30,
      past = Math.min(Math.max(idx, 0), 30);
    let done = 0,
      donePast = 0;
    docs.forEach((x) => {
      const d = x.data().d || [];
      for (let i = 0; i < 30; i++)
        if (d[i] == 1) {
          done++;
          if (i < past) donePast++;
        }
    });
    const missed = n * past - donePast,
      seg = (id, from, len) => {
        const c = $(id);
        c.setAttribute("stroke-dasharray", `${total ? (C * len) / total : 0} ${C}`);
        c.setAttribute("stroke-dashoffset", -(total ? (C * from) / total : 0));
      };
    seg("#rg1", 0, done);
    seg("#rg2", done, missed);
    const hit = n * past ? Math.round((donePast / (n * past)) * 100) : null;
    $("#ms").textContent = hit === null ? "-" : hit + "%";
    $("#mf").textContent = hit === null ? "-" : 100 - hit + "%";
    $("#mb1").style.width = (hit || 0) + "%";
    $("#mb2").style.width = (hit === null ? 0 : 100 - hit) + "%";
    $("#lg").textContent = `${done} done · ${missed} missed · ${Math.max(total - done - missed, 0)} to go`;
    const all = n ? Math.round(sum / n) : 0,
      dl = firstDraw ? (quick ? 250 : 900) : 0;
    firstDraw = false;
    if (cs) grant(calc(profile, docs, idx), { notes: 0, folders: 0, friends: 0 });
    setTimeout(() => count($("#all"), all), dl);
    if (profile.pct !== all) {
      profile.pct = all;
      updateDoc(doc(db, "users", me.uid), { pct: all }).catch(() => {});
    }
  };
  onSnapshot(
    query(col, orderBy("at")),
    (s) => {
      docs = s.docs;
      if (!cs) {
        cs =
          docs.map((x) => x.data().start).filter(Boolean).sort()[0] ||
          ds(new Date());
        profile.cycleStart = cs;
        updateDoc(doc(db, "users", me.uid), { cycleStart: cs }).catch(() => {});
      }
      // migrate goals made with the old per-goal start date
      docs.forEach((x) => {
        const g = x.data();
        if (!g.start) return;
        const off = Math.max(0, Math.round((D0(g.start) - D0(cs)) / 864e5));
        updateDoc(x.ref, {
          d: [...Array(off).fill(0), ...(g.d || [])]
            .slice(0, 30)
            .map((v) => (v == 1 ? 1 : 0)),
          start: deleteField(),
        }).catch(() => {});
      });
      draw();
    },
    onErr,
  );
  $("#gl").onclick = (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    if (b.id === "rs2") return restart();
    if (b.dataset.del && confirm("Delete this goal and its checkmarks?"))
      deleteDoc(doc(col, b.dataset.del)).catch((x) => toast(err(x)));
  };
  $("#gl").onchange = (e) => {
    const c = e.target;
    if (!c.dataset || !c.dataset.g) return;
    const x = docs.find((y) => y.id === c.dataset.g);
    if (!x) return;
    const d = Array.from({ length: 30 }, (_, i) => ((x.data().d || [])[i] == 1 ? 1 : 0));
    d[+c.dataset.i] = c.checked ? 1 : 0;
    updateDoc(x.ref, { d }).catch((y) => {
      c.checked = !c.checked;
      toast(err(y));
    });
  };
};

P.notes = () => {
  m().innerHTML = `<div class="nb" id="nb"><aside class="ns card"><div class="row sb"><b>Folders</b><button class="link" id="nf">+ Folder</button></div><div class="fos" id="fo"></div><div class="row" id="fa"></div><button class="btn" id="nn">+ New note</button><div id="nl" class="nls"></div></aside>
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
      .then(() => { if (sel === id) $("#sv").textContent = "Saved ✓"; })
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
  onSnapshot(query(nc), (s) => {
    N = {};
    s.docs.forEach((x) => (N[x.id] = x.data()));
    if (sel && !N[sel]) shut();
    drawN();
  }, onErr);
  onSnapshot(query(fc, orderBy("at")), (s) => {
    F = s.docs;
    if (cur !== "all" && cur !== "none" && !F.some((f) => f.id === cur)) cur = "all";
    drawF();
    drawN();
  }, onErr);
  $("#nf").onclick = () => {
    const n = (prompt("Folder name") || "").trim();
    if (n) addDoc(fc, { name: n.slice(0, 30), at: serverTimestamp() }).catch(onErr);
  };
  $("#fo").onclick = (e) => {
    const b = e.target.closest("[data-f]");
    if (b) { cur = b.dataset.f; drawF(); drawN(); }
  };
  $("#fa").onclick = async (e) => {
    if (e.target.id === "fr") {
      const n = (prompt("Rename folder", F.find((f) => f.id === cur).data().name) || "").trim();
      if (n) updateDoc(doc(fc, cur), { name: n.slice(0, 30) }).catch(onErr);
    }
    if (e.target.id === "fd" && confirm("Delete this folder? Its notes move to Unfiled.")) {
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
  $("#nd").onclick = () => {
    if (!sel || !confirm("Delete this note?")) return;
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
  document.addEventListener("selectionchange", () => {
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
  addEventListener("pagehide", flush);
};

P.road = async () => {
  m().innerHTML = '<h2>Your Road</h2><div id="rd"><p class="muted">Loading...</p></div>';
  const u = (c) => getDocs(collection(db, "users", me.uid, c));
  let g, nt, fo, fr;
  try {
    [g, nt, fo, fr] = await Promise.all([u("goals"), u("notes"), u("folders"),
      getDocs(query(collection(db, "friendships"), where("users", "array-contains", me.uid)))]);
  } catch (x) { $("#rd").innerHTML = ""; return onErr(x); }
  const tn = new Date();
  tn.setHours(0, 0, 0, 0);
  const idx = profile.cycleStart ? Math.round((tn - new Date(profile.cycleStart + "T00:00:00")) / 864e5) : 0,
    t = calc(profile, g.docs, idx),
    x = { notes: nt.size, folders: fo.size, friends: fr.docs.filter((d) => d.data().status === "accepted").length },
    have = new Set([...(profile.awards || []), ...AW.filter((a) => a[5](t, x)).map((a) => a[0])]);
  grant(t, x);
  const lv = t.lv, a0 = lvStart(lv), a1 = lvStart(lv + 1),
    pc = Math.round(((t.xp - a0) / (a1 - a0)) * 100),
    hue = (L) => `hsl(${(L * 47) % 360} 85% 62%)`,
    c1 = profile.c1 || "#5865f2", c2 = profile.c2 || "#eb459e",
    roles = [[rankOf(lv), hue(lv)], t.best ? [t.best + "-day best streak", "#ff8a3d"] : 0, t.checks ? [t.checks + " check-ins", "#38bdf8"] : 0,
      [have.size + " awards", "#f5c542"], t.forged ? [t.forged + " goals forged", "#3ddc84"] : 0].filter(Boolean),
    badges = AW.filter((a) => have.has(a[0])).slice(0, 10).map((a) => `<span title="${esc(a[2])}">${a[1]}</span>`).join(""),
    nodes = Array.from({ length: 7 }, (_, i) => Math.max(1, lv - 1) + i)
      .map((L) => `<div class="rn${L < lv ? " dn" : L === lv ? " cur" : ""}"><i>${L}</i><b>${rankOf(L)}</b><em>${lvStart(L)} xp</em></div>`).join("");
  $("#rd").innerHTML = `<div class="dc"><div class="bn" id="bn" style="background:linear-gradient(120deg,${c1},${c2},${c1})"></div><div class="dcb">
 <div class="dav">${A(profile)}<span class="lvb">Lv ${lv}</span></div>
 <div class="dnm"><b>${esc(profile.username)}</b><span class="rk" style="color:${hue(lv)}">${rankOf(lv)}</span></div>
 <div class="badges">${badges || '<small class="muted">No badges yet. Check off a day to earn your first.</small>'}</div>
 <div class="dsec"><small>ABOUT ME</small><p id="abt">${esc(profile.bio || "Nothing here yet. Tell people about your road.")}</p></div>
 <div class="dsec"><small>XP</small><div class="row sb"><b>${t.xp} XP</b><small>${a1 - t.xp} to Lv ${lv + 1}</small></div><div class="xpb"><i style="width:${pc}%"></i></div></div>
 <div class="dsec"><small>ROLES</small><div class="roles">${roles.map(([n, c]) => `<span class="role"><i style="background:${c}"></i>${esc(n)}</span>`).join("")}</div></div>
 <div><button class="btn ghost" id="es">Edit style</button></div></div></div>
 <div class="card" id="ep" hidden><label>Banner colors</label><div class="row"><input type="color" id="c1" value="${c1}"><input type="color" id="c2" value="${c2}"></div><label>About me</label><textarea id="ab" maxlength="160">${esc(profile.bio || "")}</textarea><div><button class="btn" id="sv2">Save style</button></div></div>
 <h3>The road ahead</h3><div class="card"><div class="road">${nodes}</div><small class="muted">10 XP per check-in · 30 per perfect day · 200 per forged goal · 100 per finished 30 days</small></div>
 <h3>Awards · ${have.size}/${AW.length}</h3><div class="awg">${AW.map((a) => `<div class="aw${have.has(a[0]) ? "" : " lk"}" style="--c:${a[4]}"><span class="ic">${a[1]}</span><b>${a[2]}</b><small>${a[3]}</small></div>`).join("")}</div>`;
  $("#es").onclick = () => ($("#ep").hidden = !$("#ep").hidden);
  $("#sv2").onclick = async () => {
    const d = { c1: $("#c1").value, c2: $("#c2").value, bio: $("#ab").value.trim() };
    try {
      await updateDoc(doc(db, "users", me.uid), d);
      Object.assign(profile, d);
      $("#bn").style.background = `linear-gradient(120deg,${d.c1},${d.c2},${d.c1})`;
      $("#abt").textContent = d.bio || "Nothing here yet. Tell people about your road.";
      toast("Style saved");
    } catch (y) { onErr(y); }
  };
};

P.friends = () => {
  m().innerHTML = `<h2>Friends</h2><form id="ff" class="row card" style="flex-direction:row"><input id="fu" placeholder="Find a friend by username" required><button class="btn">Add</button></form><div id="fl"></div>`;
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
  onSnapshot(
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
 <div class="card"><label>Progress report</label><small>Completion, streaks, missed days and your strongest goals for this 30-day cycle.</small><div><a class="btn ghost" href="report.html">Open report</a></div></div>
 <div class="card"><button class="btn ghost" id="so">Log out</button></div>
 <div class="card danger"><label>Delete account</label><small>Permanently deletes your goals, notes, friendships and profile. This cannot be undone.</small>
 <input type="password" id="dp" placeholder="Your password" autocomplete="current-password"><input id="dc" placeholder="Type DELETE to confirm" autocomplete="off" autocapitalize="characters" spellcheck="false"><div><button class="btn" id="dx" disabled>Delete my account</button></div></div>`;
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
    if (!confirm("Last chance: permanently delete your account and all your data?")) return;
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
  m().innerHTML = `<div class="row sb"><h2>Report</h2><a href="settings.html">← Settings</a></div><div id="rp"><p class="muted">Loading...</p></div>`;
  let s;
  try {
    s = await getDocs(query(collection(db, "users", me.uid, "goals"), orderBy("at")));
  } catch (x) {
    $("#rp").innerHTML = "";
    return onErr(x);
  }
  if (s.empty) {
    $("#rp").innerHTML =
      '<p class="muted">No goals yet. Add some on the Goals page and your report will show up here.</p>';
    return;
  }
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  const cs = profile.cycleStart,
    idx = cs ? Math.round((t - new Date(cs + "T00:00:00")) / 864e5) : 0,
    past = Math.min(Math.max(idx, 0), 30);
  const rows = s.docs.map((x) => {
    const g = x.data(),
      d = Array.from({ length: 30 }, (_, i) => ((g.d || [])[i] == 1 ? 1 : 0)),
      sum = (a) => a.reduce((p, c) => p + c, 0),
      done = sum(d),
      pd = sum(d.slice(0, past));
    return {
      t: g.title,
      d,
      done,
      miss: past - pd,
      rate: past ? Math.round((pd / past) * 100) : null,
      p: Math.round((done / 30) * 100),
      cur: streak(d, idx),
      best: bestRun(d),
    };
  });
  const total = rows.reduce((a, r) => a + r.done, 0),
    overall = Math.round(rows.reduce((a, r) => a + r.p, 0) / rows.length);
  let perfect = 0;
  for (let i = 0; i < past; i++) if (rows.every((r) => r.d[i])) perfect++;
  const sorted = [...rows].sort((a, b) => b.p - a.p),
    top = sorted[0],
    low = sorted[sorted.length - 1];
  $("#rp").innerHTML = `<div class="grid">${[
    ["Overall completion", overall + "%"],
    ["Check-ins", total],
    ["Cycle day", Math.min(Math.max(idx + 1, 1), 30) + " / 30"],
    ["Perfect days", perfect],
  ]
    .map(([k, v]) => `<div class="card"><small>${k}</small><span class="big">${v}</span></div>`)
    .join("")}</div>
 <div class="card"><small>Strongest goal</small><b>${esc(top.t)} · ${top.p}%</b>${rows.length > 1 ? `<small>Needs the most attention</small><b>${esc(low.t)} · ${low.p}%</b>` : ""}</div>
 <h3>By goal</h3><div class="rt"><table><thead><tr><th>Goal</th><th>Done</th><th>Missed</th><th>Hit rate</th><th>Streak</th><th>Best</th></tr></thead><tbody>${rows
   .map(
     (r) =>
       `<tr><td>${esc(r.t)}</td><td>${r.done}/30</td><td>${r.miss}</td><td>${r.rate === null ? "-" : r.rate + "%"}</td><td>${r.cur}</td><td>${r.best}</td></tr>`,
   )
   .join("")}</tbody></table></div>
 <p class="muted"><small>Hit rate = checked days ÷ days that have already passed. Missed counts only past days, so today is never a miss until tomorrow.</small></p>`;
};

if (page === "auth") P.auth();
onAuthStateChanged(auth, async (u) => {
  me = u;
  if (!u) {
    if (page !== "auth") location = "index.html";
    return;
  }
  if (page === "auth") {
    if (!busy) location = "goals.html";
    return;
  }
  profile = (await getDoc(doc(db, "users", u.uid))).data() || {
    username: "user",
    theme: "dark",
  };
  applyTheme(profile);
  document.body.insertAdjacentHTML(
    "afterbegin",
    `<header><a class="logo" href="goals.html"><img src="logo.png" alt="Forged"></a><span class="date" id="dt">${new Date().toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}</span><a class="lv" href="road.html">Lv ${lvOf(profile.xp || 0)}</a><nav>${TABS.map(([k, l]) => `<a href="${k}.html" class="${k === page ? "on" : ""}">${IC[k]}<span>${l}</span></a>`).join("")}</nav><div class="pm"><button class="avb" id="pb" aria-label="Account menu" aria-haspopup="true" aria-expanded="false">${A(profile)}</button><div class="menu" id="am" hidden><a href="profile.html">Profile</a><a href="settings.html">Settings</a><a href="report.html">Report</a><button id="lo">Log out</button></div></div></header>`,
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
  P[page]();
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
  const b = e.target.closest(".btn,nav a,.menu a,.menu button,.nt,.fo,.tb button");
  if (!b) return;
  const r = b.getBoundingClientRect(), z = Math.max(r.width, r.height) * 2, i = document.createElement("i");
  i.className = "rip";
  i.style.cssText = `width:${z}px;height:${z}px;left:${e.clientX - r.left - z / 2}px;top:${e.clientY - r.top - z / 2}px`;
  b.append(i);
  setTimeout(() => i.remove(), 600);
});
