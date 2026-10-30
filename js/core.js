// Shared namespace, helpers, icons, the sections and the saved progress.
window.FD = (() => {
  'use strict';
  const FD = { scenes: [], speed: 1 };

  FD.add = (scene) => FD.scenes.push(scene);

  // Build one element from an HTML string.
  FD.h = (html) => {
    const t = document.createElement('template');
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  };

  // Durations are divided by the playback speed.
  FD.dur = (ms) => ms / FD.speed;
  FD.wait = (ms) => new Promise((r) => setTimeout(r, FD.dur(ms)));
  FD.fmt = (n) => Math.round(n).toLocaleString('en-GB');
  FD.esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  FD.shuffle = (a) => a.map((v) => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map((x) => x[1]);
  FD.clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  FD.today = () => new Date().toLocaleDateString('en-GB');

  // Run fn(t) with t going 0 → 1 over ms (scaled by speed). Resolves when finished.
  FD.tween = (ms, fn) => new Promise((res) => {
    const t0 = performance.now(), d = FD.dur(ms);
    const tick = (now) => {
      const t = Math.min(1, (now - t0) / d);
      fn(t);
      if (t < 1) requestAnimationFrame(tick); else res();
    };
    requestAnimationFrame(tick);
  });
  // Point at fraction t along a polyline [[x, y], …].
  FD.along = (pts, t) => {
    const seg = pts.slice(1).map((p, i) => Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]));
    let d = t * seg.reduce((a, b) => a + b, 0);
    for (let i = 0; i < seg.length; i++) {
      if (d <= seg[i] || i === seg.length - 1) {
        const k = seg[i] ? Math.min(1, d / seg[i]) : 1;
        return [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * k, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * k];
      }
      d -= seg[i];
    }
    return pts[pts.length - 1];
  };

  FD.shake = (el) => {
    el.classList.remove('shake');
    void el.offsetWidth;
    el.classList.add('shake');
  };
  FD.pulse = (el) => {
    if (!el) return;
    el.classList.remove('pulse');
    void el.offsetWidth;
    el.classList.add('pulse');
  };

  // Segmented control: buttons with data-v, one is .on.
  FD.segSet = (root, v) => {
    root.querySelectorAll('button[data-v]').forEach((b) => {
      const on = b.dataset.v === String(v);
      b.classList.toggle('on', on);
      b.setAttribute('aria-pressed', on);
    });
  };

  // Highlight one zone of a mock: root gets .focusing, matching [data-zone] gets .focus.
  FD.focus = (root, zones) => {
    const list = zones ? [].concat(zones) : [];
    root.classList.toggle('focusing', list.length > 0);
    const zs = [...root.querySelectorAll('[data-zone]')];
    zs.forEach((z) => { z.classList.toggle('focus', list.includes(z.dataset.zone)); z.classList.remove('focus-in'); });
    zs.filter((z) => z.classList.contains('focus')).forEach((z) => {
      for (let p = z.parentElement?.closest('[data-zone]'); p && root.contains(p); p = p.parentElement?.closest('[data-zone]')) p.classList.add('focus-in');
    });
  };

  // Small toast inside a mock.
  FD.toast = (host, html, ms = 2600) => {
    const t = FD.h(`<div class="toast">${html}</div>`);
    host.appendChild(t);
    setTimeout(() => t.classList.add('out'), FD.dur(ms));
    setTimeout(() => t.remove(), FD.dur(ms) + 400);
  };

  // Panels inside a stage: buttons [data-p] switch the visible [data-panel].
  FD.panels = (root, onShow) => {
    const show = (p) => {
      root.querySelectorAll('[data-panel]').forEach((x) => { x.hidden = x.dataset.panel !== p; });
      root.querySelectorAll('.ptabs button[data-p]').forEach((b) => {
        const on = b.dataset.p === p;
        b.classList.toggle('on', on);
        b.setAttribute('aria-pressed', on);
      });
      root.dataset.panel = p;
      if (onShow) onShow(p);
    };
    root.querySelectorAll('.ptabs button[data-p]').forEach((b) => b.addEventListener('click', () => show(b.dataset.p)));
    return show;
  };

  // Copy text to the clipboard, with a fallback for older browsers.
  FD.copy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (e) {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.cssText = 'position:fixed;top:-1000px;opacity:0';
      document.body.appendChild(ta);
      ta.select();
      let ok = false;
      try { ok = document.execCommand('copy'); } catch (err) { ok = false; }
      ta.remove();
      return ok;
    }
  };

  FD.download = (name, text, type = 'text/plain') => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type }));
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };
  FD.slug = (s) => String(s || 'student').trim().replace(/[^\w]+/g, '-').replace(/^-|-$/g, '').toLowerCase() || 'student';

  // ---------- the two parts and their games (mins = suggested minutes in class) ----------
  // mode: 'together' = whole class on the projector, 'solo' = each student on their own device.
  FD.PARTS = {
    A: { name: 'Your data and the law', pages: 'about 19 min' },
    B: { name: 'Privacy in real life', pages: 'about 11 min' },
  };
  FD.SECTIONS = [
    { id: 'recap', part: 'A', name: 'Quick-fire recap', short: 'Recap', color: '--c4', mins: 2, mode: 'solo', line: 'Big data and why organisations collect it.' },
    { id: 'trail', part: 'A', name: 'Follow the data trail', short: 'Data trail', color: '--c2', mins: 3, mode: 'together', line: 'One ordinary day, one huge data profile.' },
    { id: 'circles', part: 'A', name: 'Privacy circles', short: 'Circles', color: '--c1', mins: 3, mode: 'solo', line: 'Who would you share each kind of data with?' },
    { id: 'laws', part: 'A', name: 'Four laws and a match-up', short: 'The laws', color: '--c3', mins: 3, mode: 'solo', line: 'Article 8, DPA, GDPR and the IPA.' },
    { id: 'court', part: 'A', name: 'The Privacy Court', short: 'Court', color: '--c9', mins: 5, mode: 'together', line: 'Six cases. Which law? Legal or not?' },
    { id: 'inspector', part: 'A', name: 'Data Inspector', short: 'Inspector', color: '--c5', mins: 3, mode: 'solo', line: 'Find where a company breaks the principles.' },
    { id: 'snapvibe', part: 'B', name: 'Install SnapVibe', short: 'SnapVibe', color: '--c6', mins: 4, mode: 'solo', line: 'Terms and conditions: what do you give away?' },
    { id: 'society', part: 'B', name: 'Design your society', short: 'Society', color: '--c7', mins: 3, mode: 'together', line: 'Safety or freedom? Set the privacy level.' },
    { id: 'debate', part: 'B', name: 'Debate builder', short: 'Debate', color: '--c8', mins: 2, mode: 'solo', line: 'Build your argument for or against.' },
    { id: 'rights', part: 'B', name: 'Bonus: claim your rights', short: 'Bonus', color: '--c4', mins: 0, mode: 'solo', bonus: true, line: 'Six problems, six rights. Then a reality check.' },
  ];
  FD.section = (id) => FD.SECTIONS.find((s) => s.id === id);

  // ---------- saved progress (this browser, plus a progress code to move it) ----------
  const KEY = 'rp-progress-v1';
  const blank = () => ({ v: 1, name: '', cls: '', seen: {}, last: '', step: 0, checks: {}, acts: {}, tests: {}, games: {}, started: FD.today(), updated: '' });
  FD.state = blank();
  FD.canSave = true;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) FD.state = Object.assign(blank(), JSON.parse(raw));
  } catch (e) { FD.canSave = false; }
  FD.results = FD.state.checks;

  let saveTimer = null;
  FD.save = (now) => {
    FD.state.updated = new Date().toISOString();
    clearTimeout(saveTimer);
    const write = () => { try { localStorage.setItem(KEY, JSON.stringify(FD.state)); FD.canSave = true; } catch (e) { FD.canSave = false; } };
    if (now) write(); else saveTimer = setTimeout(write, 250);
    if (FD.onChange) FD.onChange();
  };
  FD.replaceState = (s) => {
    FD.state = Object.assign(blank(), s);
    FD.results = FD.state.checks;
    FD.save(true);
  };
  FD.resetState = () => FD.replaceState(blank());
  FD.hasProgress = () => !!(Object.keys(FD.state.seen).length || Object.keys(FD.state.games).length || Object.keys(FD.state.tests).length);

  FD.markSeen = (id) => {
    if (FD.state.seen[id]) return;
    FD.state.seen[id] = FD.today();
    FD.save();
    if (FD.onResult) FD.onResult(id);
  };

  // ---------- games: each one keeps its own data and the lines that go in the report ----------
  // FD.game(id) → the saved record (created if needed). FD.gameDone(id, {score, total, lines}) finishes it.
  FD.game = (id) => FD.state.games[id] || (FD.state.games[id] = { done: false, data: {} });
  FD.gameData = (id) => FD.game(id).data;
  FD.gameSave = (id, patch) => { Object.assign(FD.game(id).data, patch || {}); FD.save(); };
  FD.gameDone = (id, res) => {
    const g = FD.game(id), first = !g.done;
    Object.assign(g, { done: true, date: FD.today(), tries: (g.tries || 0) + 1 }, res);
    if (res.score != null) g.best = Math.max(g.best || 0, res.score);
    FD.state.seen[id] = FD.state.seen[id] || FD.today();
    FD.save(true);
    if (FD.onResult) FD.onResult(id);
    return first;
  };

  // ---------- class mode or solo mode ----------
  FD.mode = () => (document.body.classList.contains('class-mode') ? 'class' : 'solo');

  // A vote for "together" games. In class mode the teacher counts hands with + / −
  // and the bars show the class result; on a student's device it records their own pick.
  // opts: [{ v, label }]. Returns { el, pick(), tallies(), lock(right), reset() }.
  FD.vote = (host, opts, onPick) => {
    const el = FD.h(`<div class="vote">${opts.map((o) => `
      <div class="vt" data-v="${o.v}">
        <button class="vt-b" data-v="${o.v}"><span>${o.label}</span></button>
        <div class="vt-tally"><button class="vt-m" aria-label="One hand less">−</button><b class="vt-n">0</b><button class="vt-p" aria-label="One hand more">+</button><span class="vt-bar"><i></i></span></div>
      </div>`).join('')}</div>`);
    host.appendChild(el);
    let mine = null, locked = false;
    const n = {};
    opts.forEach((o) => { n[o.v] = 0; });
    const draw = () => {
      const tot = Object.values(n).reduce((a, b) => a + b, 0);
      el.querySelectorAll('.vt').forEach((r) => {
        const v = r.dataset.v;
        r.querySelector('.vt-n').textContent = n[v];
        r.querySelector('.vt-bar i').style.width = tot ? (100 * n[v] / tot) + '%' : '0';
        r.querySelector('.vt-b').classList.toggle('on', mine === v);
        r.querySelector('.vt-b').setAttribute('aria-pressed', mine === v);
      });
    };
    el.addEventListener('click', (e) => {
      if (locked) return;
      const r = e.target.closest('.vt');
      if (!r) return;
      const v = r.dataset.v;
      if (e.target.closest('.vt-p')) n[v]++;
      else if (e.target.closest('.vt-m')) n[v] = Math.max(0, n[v] - 1);
      else if (e.target.closest('.vt-b')) { mine = v; if (onPick) onPick(v); }
      draw();
    });
    draw();
    return {
      el,
      pick: () => mine,
      tallies: () => ({ ...n }),
      hasTally: () => Object.values(n).some(Boolean),
      lock(right) {
        locked = true;
        el.classList.add('locked');
        el.querySelectorAll('.vt').forEach((r) => {
          r.classList.toggle('right', right != null && [].concat(right).includes(r.dataset.v));
          r.classList.toggle('wrong', right != null && mine === r.dataset.v && ![].concat(right).includes(r.dataset.v));
        });
      },
      reset() { locked = false; mine = null; Object.keys(n).forEach((k) => { n[k] = 0; }); el.classList.remove('locked'); el.querySelectorAll('.vt').forEach((r) => r.classList.remove('right', 'wrong')); draw(); },
    };
  };
  // "Class: 12 · 5 · 3" for the report.
  FD.tallyText = (opts, t) => opts.filter((o) => t[o.v]).map((o) => `${o.short || o.label} ${t[o.v]}`).join(' · ');

  // A countdown used for think / pair / share. Returns { el, start(secs), stop() }.
  FD.timer = (host, label) => {
    const el = FD.h(`<div class="tmr"><span class="tmr-l">${label || 'Timer'}</span><b class="tmr-t mono">0:00</b>
      <button class="mini-btn" data-s="30">30 s</button><button class="mini-btn" data-s="60">1 min</button><button class="mini-btn" data-s="120">2 min</button><button class="mini-btn" data-s="0">Stop</button></div>`);
    host.appendChild(el);
    let t = null, end = 0;
    const draw = (ms) => { const s = Math.max(0, Math.ceil(ms / 1000)); el.querySelector('.tmr-t').textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
    const stop = () => { clearInterval(t); el.classList.remove('run'); };
    const start = (secs) => {
      stop();
      if (!secs) { draw(0); return; }
      end = Date.now() + secs * 1000;
      el.classList.add('run'); el.classList.remove('end');
      draw(secs * 1000);
      t = setInterval(() => { const ms = end - Date.now(); draw(ms); if (ms <= 0) { stop(); el.classList.add('end'); FD.shake(el); } }, 250);
    };
    el.addEventListener('click', (e) => { const b = e.target.closest('[data-s]'); if (b) start(+b.dataset.s); });
    return { el, start, stop };
  };

  // ---------- icons (24×24 line icons) ----------
  const ic = (p) => `<svg viewBox="0 0 24 24" class="ic" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
  FD.icon = {
    recap: ic('<path d="M13 2.5L5 13.5h6l-1 8 8-11h-6z"/>'),
    trail: ic('<circle cx="6" cy="18" r="2"/><circle cx="18" cy="6" r="2"/><path d="M8 18h5a3.5 3.5 0 0 0 0-7h-2a3.5 3.5 0 0 1 0-7h5"/>'),
    circles: ic('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5.5"/><circle cx="12" cy="12" r="2"/>'),
    laws: ic('<path d="M12 3.5v17M7 20.5h10M4.5 7h15"/><path d="M7 7l-3 6.5a3 3 0 0 0 6 0zM17 7l-3 6.5a3 3 0 0 0 6 0z"/>'),
    court: ic('<path d="M13.5 4.5l6 6M11 7l6 6M12.3 5.8l4.9 4.9-3 3-4.9-4.9zM10.5 11.5L4 18"/><path d="M3 21h9"/>'),
    inspector: ic('<circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5L21 21"/><path d="M7.8 10.5l1.8 1.8 3.3-3.6"/>'),
    snapvibe: ic('<rect x="6.5" y="2.5" width="11" height="19" rx="2.5"/><path d="M10.5 18.5h3"/><path d="M9.5 9.5l2 2 3-3.5"/>'),
    society: ic('<path d="M3 20.5h18M5 20.5V10l4-3v13.5M9 20.5V4.5h6v16M15 20.5V9l4 2.5v9"/>'),
    debate: ic('<path d="M3.5 5h10v7h-5l-3 3v-3h-2z"/><path d="M13.5 9h7v7h-2v3l-3-3h-4.5v-3"/>'),
    rights: ic('<path d="M12 3l7.5 3v5.5c0 4.6-3.2 8.3-7.5 9.5-4.3-1.2-7.5-4.9-7.5-9.5V6z"/><path d="M8.5 12l2.5 2.5 4.5-5"/>'),
    start: ic('<circle cx="12" cy="12" r="9"/><path d="M10 8.5l5 3.5-5 3.5z"/>'),
    hook: ic('<path d="M12 3.5l9.5 16.5h-19z"/><path d="M12 10v4.5"/><circle cx="12" cy="17.3" r=".6"/>'),
    malware: ic('<ellipse cx="12" cy="13.5" rx="4.5" ry="5.5"/><path d="M12 8V5.5M9.5 6.5L8 4.5M14.5 6.5L16 4.5M7.5 12H4M7.5 16l-3 1.5M16.5 12H20M16.5 16l3 1.5M12 9v9"/>'),
    virus: ic('<circle cx="12" cy="12" r="5"/><path d="M12 7V3.5M12 17v3.5M7 12H3.5M17 12h3.5M8.5 8.5L6 6M15.5 8.5L18 6M8.5 15.5L6 18M15.5 15.5L18 18"/><circle cx="10.5" cy="11" r=".6"/><circle cx="13.5" cy="13" r=".6"/>'),
    worm: ic('<path d="M3 15c2-4 4-4 6 0s4 4 6 0 3-5 5-4"/><circle cx="20" cy="10.5" r="1.6"/>'),
    ransomware: ic('<rect x="4" y="10.5" width="12" height="9.5" rx="2"/><path d="M7 10.5V7.5a3 3 0 0 1 6 0v3"/><circle cx="18.5" cy="6.5" r="3"/><path d="M18.5 5v3"/>'),
    trojan: ic('<path d="M5 20v-6h11v6M5 14l-1-3 3-1 1-4 3 1-1 3h7l1-3h2v6"/><circle cx="7" cy="20" r="1"/><circle cx="14" cy="20" r="1"/>'),
    spyware: ic('<path d="M2.5 12s3.5-6.5 9.5-6.5 9.5 6.5 9.5 6.5-3.5 6.5-9.5 6.5S2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>'),
    adware: ic('<path d="M4 10v4h3l7 4V6L7 10z"/><path d="M17.5 9a4 4 0 0 1 0 6M7 14l1 5h2.5l-1-4.5"/>'),
    which: ic('<circle cx="12" cy="12" r="9"/><path d="M9.6 9.3a2.5 2.5 0 0 1 4.8.9c0 1.7-2.4 2.2-2.4 3.8"/><circle cx="12" cy="17.2" r=".5"/>'),
    bots: ic('<rect x="5" y="8" width="14" height="11" rx="3"/><path d="M12 8V4.5"/><circle cx="12" cy="4" r="1"/><circle cx="9.3" cy="13" r="1.2"/><circle cx="14.7" cy="13" r="1.2"/><path d="M3 12.5v3M21 12.5v3"/>'),
    botnet: ic('<circle cx="12" cy="5" r="2.2"/><circle cx="5" cy="17" r="2.2"/><circle cx="19" cy="17" r="2.2"/><circle cx="12" cy="13" r="2.2"/><path d="M12 7.2v3.6M10.2 14.3L6.8 15.8M13.8 14.3l3.4 1.5"/>'),
    election: ic('<path d="M4 12h16v8H4z"/><path d="M8 12V4h8v8"/><path d="M10 8l1.5 1.5L14.5 6"/>'),
    wifi: ic('<path d="M2.5 9a14 14 0 0 1 19 0M5.5 12.5a9.5 9.5 0 0 1 13 0M8.6 16a5 5 0 0 1 6.8 0"/><circle cx="12" cy="19.2" r=".8"/>'),
    terms: ic('<path d="M3.5 5h6a2.5 2.5 0 0 1 2.5 2.5V20a2 2 0 0 0-2-2H3.5z"/><path d="M20.5 5h-6A2.5 2.5 0 0 0 12 7.5V20a2 2 0 0 1 2-2h6.5z"/>'),
    final: ic('<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V3h6v1"/><path d="M8.5 11l1.6 1.6 3-3M8.5 16.5h7"/>'),
    check: ic('<circle cx="12" cy="12" r="9"/><path d="M8 12.3l2.8 2.8L16.2 9.6"/>'),
    activity: ic('<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>'),
    progress: ic('<path d="M3.5 3.5v17h17"/><path d="M7.5 15l4-4.5 3 2.5 5-6"/>'),
    help: ic('<circle cx="12" cy="12" r="9"/><path d="M9.6 9.3a2.5 2.5 0 0 1 4.8.9c0 1.7-2.4 2.2-2.4 3.8"/><circle cx="12" cy="17.2" r=".5"/>'),
    tick: ic('<path d="M4.5 12.5l5 5 10-11"/>'),
    cross: ic('<path d="M6 6l12 12M18 6L6 18"/>'),
    copy: ic('<rect x="8.5" y="8.5" width="12" height="12" rx="2"/><path d="M15.5 8.5V5a1.5 1.5 0 0 0-1.5-1.5H5A1.5 1.5 0 0 0 3.5 5v9A1.5 1.5 0 0 0 5 15.5h3.5"/>'),
    download: ic('<path d="M12 4v11M7 10.5l5 5 5-5"/><path d="M4.5 19.5h15"/>'),
    upload: ic('<path d="M12 15.5V4.5M7 9l5-5 5 5"/><path d="M4.5 19.5h15"/>'),
    key: ic('<circle cx="7.5" cy="12" r="3.5"/><path d="M11 12h10M17.5 12v3M20.5 12v2"/>'),
    lock: ic('<rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/>'),
    unlock: ic('<rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8 10.5V7.5a4 4 0 0 1 7.6-1.7"/>'),
    globe: ic('<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a14 14 0 0 1 0 18a14 14 0 0 1 0-18z"/>'),
    user: ic('<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>'),
    play: ic('<path d="M7 4.5v15l12-7.5z"/>'),
    shield: ic('<path d="M12 3l7.5 3v5.5c0 4.6-3.2 8.3-7.5 9.5-4.3-1.2-7.5-4.9-7.5-9.5V6z"/>'),
    search: ic('<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/>'),
    file: ic('<path d="M6 3h8l4.5 4.5V21H6z"/><path d="M14 3v4.5h4.5"/>'),
    printer: ic('<path d="M7 9V3.5h10V9"/><rect x="3.5" y="9" width="17" height="7.5" rx="1.5"/><path d="M7 14h10v6.5H7z"/>'),
    bt: ic('<path d="M7 7.5l10 9-5 4.5V3l5 4.5-10 9"/>'),
  };

  // ---------- small device drawings used in several scenes (inline SVG <g>) ----------
  // Each returns markup for a 60×46 box with its top-left corner at (x, y).
  FD.dv = {
    laptop: (x, y) => `<g transform="translate(${x} ${y})"><rect class="dv-body" x="8" y="2" width="44" height="30" rx="3"/><rect class="dv-screen" x="12" y="6" width="36" height="22" rx="1"/><path class="dv-body" d="M2 34h56l-4 7H6z"/></g>`,
    desktop: (x, y) => `<g transform="translate(${x} ${y})"><rect class="dv-body" x="6" y="2" width="48" height="32" rx="3"/><rect class="dv-screen" x="10" y="6" width="40" height="24" rx="1"/><rect class="dv-body" x="26" y="34" width="8" height="6"/><rect class="dv-body" x="18" y="40" width="24" height="4" rx="2"/></g>`,
    phone: (x, y) => `<g transform="translate(${x} ${y})"><rect class="dv-body" x="19" y="0" width="22" height="44" rx="4"/><rect class="dv-screen" x="22" y="5" width="16" height="32" rx="1"/><circle class="dv-detail" cx="30" cy="40.5" r="1.6"/></g>`,
    tablet: (x, y) => `<g transform="translate(${x} ${y})"><rect class="dv-body" x="10" y="0" width="40" height="46" rx="4"/><rect class="dv-screen" x="14" y="4" width="32" height="36" rx="1"/><circle class="dv-detail" cx="30" cy="43" r="1.4"/></g>`,
    printer: (x, y) => `<g transform="translate(${x} ${y})"><rect class="dv-paper" x="16" y="2" width="28" height="14"/><rect class="dv-body" x="4" y="14" width="52" height="20" rx="4"/><rect class="dv-paper" x="14" y="30" width="32" height="12"/><circle class="dv-led" cx="48" cy="21" r="2"/></g>`,
    server: (x, y) => `<g transform="translate(${x} ${y})"><rect class="dv-body" x="14" y="0" width="32" height="46" rx="3"/><path class="dv-detail" d="M18 7h24v3H18zM18 15h24v3H18zM18 23h24v3H18z"/><circle class="dv-led" cx="40" cy="38" r="2"/></g>`,
    router: (x, y) => `<g transform="translate(${x} ${y})"><path class="dv-detail" d="M14 22V4h3v18zM43 22V4h3v18z"/><rect class="dv-body" x="4" y="20" width="52" height="18" rx="5"/><circle class="dv-led" cx="14" cy="29" r="2"/><circle class="dv-led" cx="21" cy="29" r="2"/><circle class="dv-led" cx="28" cy="29" r="2"/></g>`,
    switch: (x, y) => `<g transform="translate(${x} ${y})"><rect class="dv-body" x="2" y="14" width="56" height="18" rx="3"/>${[0, 1, 2, 3, 4, 5].map((i) => `<rect class="dv-screen" x="${7 + i * 8}" y="19" width="5" height="5" rx="1"/>`).join('')}<circle class="dv-led" cx="52" cy="27" r="1.6"/></g>`,
    tv: (x, y) => `<g transform="translate(${x} ${y})"><rect class="dv-body" x="2" y="2" width="56" height="34" rx="3"/><rect class="dv-screen" x="6" y="6" width="48" height="26" rx="1"/><rect class="dv-body" x="22" y="36" width="16" height="4"/><rect class="dv-body" x="16" y="40" width="28" height="4" rx="2"/></g>`,
    ap: (x, y) => `<g transform="translate(${x} ${y})"><ellipse class="dv-body" cx="30" cy="30" rx="22" ry="9"/><ellipse class="dv-screen" cx="30" cy="27" rx="18" ry="5"/><circle class="dv-led" cx="30" cy="31" r="1.6"/><path class="dv-arc" d="M20 14a14 14 0 0 1 20 0M24 18a8 8 0 0 1 12 0"/></g>`,
    cloud: (x, y) => `<g transform="translate(${x} ${y})"><path class="dv-cloud" d="M16 40h30a10 10 0 0 0 1-20 14 14 0 0 0-27-3 11 11 0 0 0-4 23z"/></g>`,
  };

  return FD;
})();
