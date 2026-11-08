import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  deleteUser,
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
  ({
    "auth/invalid-credential": "Wrong email or password",
    "auth/email-already-in-use": "That email already has an account",
    "auth/weak-password": "Password needs 6+ characters",
    "auth/invalid-email": "Enter a valid email",
    "auth/too-many-requests": "Too many attempts. Try again later",
  })[e.code] ||
  e.message ||
  "Something went wrong";
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
  if (!a || a.classList.contains("on")) return;
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
        if (await nameTaken(un)) {
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
  m().innerHTML = `<h2>Your goals</h2><div class="card stat"><span id="all">0%</span><small>overall completion</small></div>
 <form id="gf" class="row card" style="flex-direction:row"><input id="gt" placeholder="New 30-day goal, e.g. Read 20 pages" required maxlength="60"><button class="btn">Start</button></form><div id="gl"></div>`;
  const col = collection(db, "users", me.uid, "goals"),
    G = {};
  $("#gf").onsubmit = async (e) => {
    e.preventDefault();
    const t = $("#gt").value.trim();
    if (!t) return;
    await addDoc(col, {
      title: t,
      start: new Date().toLocaleDateString("sv"),
      d: Array(30).fill(0),
      at: serverTimestamp(),
    });
    $("#gt").value = "";
  };
  onSnapshot(query(col, orderBy("at")), (s) => {
    const t0 = new Date();
    t0.setHours(0, 0, 0, 0);
    let sum = 0;
    $("#gl").innerHTML =
      s.docs
        .map((x) => {
          const g = (G[x.id] = x.data()),
            p = Math.round((g.d.filter((v) => v == 1).length / 30) * 100),
            idx = Math.round((t0 - new Date(g.start + "T00:00:00")) / 864e5);
          sum += p;
          return `<div class="card"><div class="row sb"><b>${esc(g.title)}</b><b>${p === 100 ? '<span class="seal">Forged</span>' : ""}${p}%</b></div><div class="bar"><i style="width:${p}%"></i></div><div class="row sb"><small>Day ${Math.min(Math.max(idx + 1, 1), 30)} of 30</small><small>Streak ${streak(g.d, idx)}</small></div>
   <div class="days">${g.d.map((v, i) => `<button class="day s${v}${tap === x.id + "_" + i ? " stamp" : ""}" data-g="${x.id}" data-i="${i}" ${i > idx ? "disabled" : ""}>${v == 1 ? "✓" : v == 2 ? "✕" : i + 1}</button>`).join("")}</div>
   <div class="row sb"><small>Started ${g.start}. Tap a day: done, missed, clear.</small><button class="link" data-del="${x.id}">Delete</button></div></div>`;
        })
        .join("") ||
      '<p class="muted">No goals yet. Add your first one above.</p>';
    const all = s.size ? Math.round(sum / s.size) : 0;
    setTimeout(
      () => count($("#all"), all),
      (() => {
        const d = first ? (quick ? 250 : 900) : 0;
        first = false;
        return d;
      })(),
    );
    if (profile.pct !== all) {
      profile.pct = all;
      updateDoc(doc(db, "users", me.uid), { pct: all });
    }
  });
  $("#gl").onclick = (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    if (b.dataset.del) {
      if (confirm("Delete this goal?")) deleteDoc(doc(col, b.dataset.del));
      return;
    }
    const d = [...G[b.dataset.g].d],
      i = +b.dataset.i;
    d[i] = (d[i] + 1) % 3;
    tap = b.dataset.g + "_" + i;
    setTimeout(() => (tap = null), 500);
    updateDoc(doc(col, b.dataset.g), { d });
  };
};

P.notes = () => {
  m().innerHTML = `<div class="row sb"><h2>Notes</h2><button class="btn" id="nn">New note</button></div><div id="nl" class="grid"></div>`;
  const col = collection(db, "users", me.uid, "notes");
  $("#nn").onclick = () => addDoc(col, { text: "", at: serverTimestamp() });
  onSnapshot(query(col, orderBy("at", "desc")), (s) => {
    if (document.activeElement?.tagName === "TEXTAREA") return;
    $("#nl").innerHTML =
      s.docs
        .map(
          (x) =>
            `<div class="card"><textarea data-id="${x.id}" placeholder="Write something...">${esc(x.data().text)}</textarea><button class="link" data-del="${x.id}">Delete</button></div>`,
        )
        .join("") || '<p class="muted">No notes yet. Tap New note.</p>';
  });
  $("#nl").onfocusout = (e) => {
    if (e.target.tagName === "TEXTAREA")
      updateDoc(doc(col, e.target.dataset.id), { text: e.target.value }).then(
        () => toast("Note saved"),
      );
  };
  $("#nl").oninput = (e) => fit(e.target);
  $("#nl").onclick = (e) => {
    const id = e.target.dataset.del;
    if (id && confirm("Delete this note?")) deleteDoc(doc(col, id));
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
    } catch {
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
 <label>Accent color</label><div class="row"><input type="color" id="sc" value="${profile.accent || "#888888"}"><button class="btn ghost" id="sr">Reset to default</button></div></div>
 <div class="card"><button class="btn ghost" id="so">Sign out</button></div>`;
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
    if (await nameTaken(n)) return toast("That username is taken");
    await save({ username: n, usernameLower: n.toLowerCase() });
    toast("Username changed");
  };
  document
    .querySelectorAll("[data-t]")
    .forEach((b) => (b.onclick = () => save({ theme: b.dataset.t })));
  mark();
  $("#sc").onchange = (e) => save({ accent: e.target.value });
  $("#sr").onclick = () => save({ accent: "" });
  $("#so").onclick = () => signOut(auth);
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
    `<header><a class="logo" href="goals.html"><img src="logo.png" alt="Forged"></a><nav>${["goals", "notes", "friends", "profile", "settings"].map((k) => `<a href="${k}.html" class="${k === page ? "on" : ""}">${k[0].toUpperCase() + k.slice(1)}</a>`).join("")}</nav>${A(profile)}</header>`,
  );
  P[page]();
});

const mn = document.querySelector("main");
mn.classList.add("intro");
setTimeout(() => mn.classList.remove("intro"), 2600);
new MutationObserver(stag).observe(mn, { childList: true, subtree: true });
stag();
embers();
