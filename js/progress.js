// "My progress": what the student has done, a report to copy, and a progress code
// to carry on with another device. Nothing is sent to a server.
(() => {
  'use strict';
  const FD = window.FD;
  const $ = (s, r = document) => r.querySelector(s);

  // ---------- how to use this website (also shown on the Start page) ----------
  FD.HOWTO = `
    <ol class="howto">
      <li><span class="hw-ic">▶</span><div><b>Go step by step.</b> Press <b>Next</b> (→) to move on and <b>Back</b> (←) to go back. Each game tells you what to do on the right.</div></li>
      <li><span class="hw-ic mode-ic">👥</span><div><b>Together games</b> are played as a whole class on the projector. On your own, you simply make the choices yourself.</div></li>
      <li><span class="hw-ic mode-ic">👤</span><div><b>On your own games</b> are for your laptop or iPad. Your answers are <b>saved automatically</b> and marked straight away.</div></li>
      <li><span class="hw-ic">${FD.icon.final}</span><div><b>Exit ticket</b> at the end of the lesson. You can stop and finish it another day.</div></li>
      <li><span class="hw-ic">${FD.icon.progress}</span><div><b>My progress</b> (top right) shows what you have done. <b>Copy my progress</b> sends your teacher <b>all your answers</b>: your choices, scores, reasons and your debate.</div></li>
      <li><span class="hw-ic">${FD.icon.key}</span><div><b>Changing device?</b> Everything is saved in this browser. To carry on with another device, open <b>My progress</b>, copy your <b>progress code</b> (email it to yourself) and paste it on the other device.</div></li>
    </ol>`;

  // ---------- progress units ----------
  FD.hasCheck = (id) => FD.scenes.some((x) => x.id === 'check-' + id);
  const testRow = (id) => { const t = FD.state.tests[id]; return t && t.done ? `${t.score}/${t.total} (${t.pct}%) on ${t.date}` : t && Object.keys(t.picks || {}).length ? 'started, not finished' : 'not done'; };
  FD.units = () => {
    const S = FD.state, u = [];
    FD.SECTIONS.filter((s) => !s.bonus).forEach((s) => u.push(!!(S.games[s.id] && S.games[s.id].done)));
    Object.keys(FD.TESTS).forEach((id) => { const t = S.tests[id]; u.push(!!(t && t.done), !!(t && t.done)); });
    return u;
  };
  FD.percent = () => { const u = FD.units(); return Math.round((100 * u.filter(Boolean).length) / u.length); };

  // Is a tab "done"? Used by app.js.
  FD.isDone = (sc) => {
    if (sc.test) return !!(FD.state.tests[sc.id] && FD.state.tests[sc.id].done);
    if (sc.section) return !!(FD.state.games[sc.id] && FD.state.games[sc.id].done);
    return false;
  };

  // ---------- the report students copy ----------
  // Plain text that stays readable when pasted into an email or Google Classroom:
  // short labelled lines, one item per line, blank lines between blocks.
  const RULE = '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  const head = (t) => ['', RULE, t.toUpperCase(), RULE];
  const clean = (s) => String(s || '').trim().replace(/\s+/g, ' ');
  const gameRow = (s) => {
    const g = FD.state.games[s.id];
    if (!g || !g.done) return FD.state.seen[s.id] ? 'started, not finished' : 'not done';
    return g.score != null ? `${g.score}/${g.total}${g.tries > 1 ? ` (best ${g.best}, ${g.tries} tries)` : ''}` : 'done';
  };
  FD.report = () => {
    const S = FD.state;
    const core = FD.SECTIONS.filter((s) => !s.bonus);
    const L = [
      'RIGHT TO PRIVACY · MY PROGRESS',
      'Year 10 · Online Safety',
      RULE,
      `Name:      ${clean(S.name) || '–'}`,
      `Class:     ${clean(S.cls) || '–'}`,
      `Date:      ${FD.today()}`,
      `Completed: ${FD.percent()}% of the lesson`,
      ...head('Summary'),
      `Games done:     ${core.filter((s) => S.games[s.id] && S.games[s.id].done).length} of ${core.length}`,
      ...Object.keys(FD.TESTS).map((id) => `${(FD.TESTS[id].tab + ':').padEnd(16)}${testRow(id)}`),
    ];
    FD.SECTIONS.forEach((s, i) => {
      const g = S.games[s.id];
      if (s.bonus && !(g && g.done)) return;
      L.push(...head(`${i + 1}. ${s.name} · ${s.mode === 'together' ? 'together' : 'on my own'}`));
      L.push(`Result: ${gameRow(s)}`);
      if (g && g.lines && g.lines.length) L.push('', ...g.lines.map((x) => (x ? '   ' + x : '')));
    });
    Object.keys(FD.TESTS).forEach((id) => {
      const t = S.tests[id];
      if (t && t.done) L.push(...head(FD.TESTS[id].tab), ...FD.testLines(id));
    });
    L.push('', RULE);
    return L.join('\n').replace(/\n{3,}/g, '\n\n');
  };

  // ---------- progress code ----------
  const b64 = (bytes) => { let s = ''; bytes.forEach((b) => { s += String.fromCharCode(b); }); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); };
  const unb64 = (s) => { s = s.replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '='; return Uint8Array.from(atob(s), (c) => c.charCodeAt(0)); };
  const hash = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(16).padStart(8, '0').slice(0, 5).toUpperCase(); };
  const pipe = async (bytes, Stream, mode) => new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(new Stream(mode))).arrayBuffer());

  FD.makeCode = async () => {
    const bytes = new TextEncoder().encode(JSON.stringify(FD.state));
    let tag = 'RP1', data = bytes;
    if (window.CompressionStream) {
      try { data = await pipe(bytes, CompressionStream, 'deflate-raw'); tag = 'RP1Z'; } catch (e) { data = bytes; tag = 'RP1'; }
    }
    const body = b64(data);
    return `${tag}.${body}.${hash(body)}`;
  };
  FD.readCode = async (code) => {
    const clean = String(code || '').replace(/\s+/g, '');
    const m = clean.match(/^(RP1Z?)\.([A-Za-z0-9_-]+)\.([0-9A-F]{5})$/);
    if (!m) throw new Error('This does not look like a progress code. It should start with RP1.');
    if (hash(m[2]) !== m[3]) throw new Error('The code is incomplete or has a mistake. Copy the whole code again.');
    let bytes = unb64(m[2]);
    if (m[1] === 'RP1Z') {
      if (!window.DecompressionStream) throw new Error('This browser is too old to read this code. Try Chrome, Edge, Firefox or Safari.');
      bytes = await pipe(bytes, DecompressionStream, 'deflate-raw');
    }
    const s = JSON.parse(new TextDecoder().decode(bytes));
    if (!s || s.v !== 1) throw new Error('This code is from a different lesson.');
    return s;
  };

  // ---------- the dialog ----------
  const dlg = FD.h(`<dialog class="dlg" id="progDlg" aria-labelledby="progTitle">
    <form method="dialog" class="dlg-x"><button class="ib" aria-label="Close">${FD.icon.cross}</button></form>
    <div class="dlg-body" id="progBody"></div>
  </dialog>`);
  const help = FD.h(`<dialog class="dlg" id="helpDlg" aria-labelledby="helpTitle">
    <form method="dialog" class="dlg-x"><button class="ib" aria-label="Close">${FD.icon.cross}</button></form>
    <div class="dlg-body"><p class="kick">Working on your own</p><h2 id="helpTitle">How to use this website</h2>${FD.HOWTO}
    <p class="small muted">Keyboard: → next · ← back · Space play/pause · R restart scene · P projector mode · F full screen.</p>
    <form method="dialog"><button class="btn primary">Got it</button></form></div>
  </dialog>`);
  const welcome = FD.h(`<dialog class="dlg dlg-sm" id="welDlg" aria-labelledby="welTitle"><div class="dlg-body" id="welBody"></div></dialog>`);
  document.body.append(dlg, help, welcome);
  [dlg, help, welcome].forEach((d) => d.addEventListener('click', (e) => { if (e.target === d) d.close(); }));

  function row(s) {
    const g = FD.state.games[s.id], done = g && g.done;
    return `<li style="--c:var(${s.color})">
      <button class="link-btn pr-name" data-go="${s.id}">${FD.icon[s.id]} ${s.name}</button>
      <span class="pr-cells">
        <span class="pr mode-pill">${s.mode === 'together' ? '👥' : '👤'}</span>
        <span class="pr ${done ? (g.score == null || g.score === g.total ? 'ok' : 'part') : FD.state.seen[s.id] ? 'part' : ''}">${done ? (g.score != null ? `✓ ${g.score}/${g.total}` : '✓ done') : FD.state.seen[s.id] ? 'started' : 'not done'}</span>
      </span></li>`;
  }

  function render(msg) {
    const S = FD.state, pct = FD.percent();
    const tst = (id) => { const t = S.tests[id]; return `<li class="pr-test"><button class="link-btn pr-name" data-go="${id}">${FD.icon.final} ${FD.TESTS[id].tab}</button><span class="pr-cells"><span class="pr ${t && t.done ? 'ok' : ''}">${t && t.done ? `${t.score}/${t.total} · ${t.pct}%` : t && Object.keys(t.picks || {}).length ? 'started' : 'not done'}</span></span></li>`; };
    $('#progBody').innerHTML = `
      <p class="kick">Right to privacy · Year 10 Online Safety</p>
      <h2 id="progTitle">My progress</h2>
      <div class="who pr-who">
        <label>Your name<input id="pName" autocomplete="name" placeholder="First name and surname" value="${FD.esc(S.name)}"></label>
        <label>Class<input id="pClass" placeholder="e.g. 10A" value="${FD.esc(S.cls)}"></label>
      </div>
      <div class="pr-top"><span class="big-score">${pct}<small>%</small></span><span class="bar pr-bar"><i style="--v:${pct}%"></i></span></div>
      ${FD.canSave ? '' : '<p class="small bad"><b>This browser is not saving your progress</b> (private window or blocked storage). Copy your progress code before you close the page.</p>'}
      ${['A', 'B'].map((p) => `<h3 class="pr-part">Part ${p} · ${FD.PARTS[p].name}</h3><ul class="pr-list">${FD.SECTIONS.filter((s) => s.part === p).map(row).join('')}${p === 'B' ? Object.keys(FD.TESTS).map(tst).join('') : ''}</ul>`).join('')}

      <section class="pr-box">
        <h3>${FD.icon.copy} Send your progress to your teacher</h3>
        <p class="small muted">A report with every answer you gave: your choices, scores, reasons, your debate and the exit ticket.</p>
        <div class="chk-btns">
          <button class="btn primary" id="pCopy">${FD.icon.copy} Copy my progress</button>
          <button class="btn ghost" id="pTxt">${FD.icon.download} Download .txt</button>
          <button class="btn ghost" id="pShow">Show the report</button>
        </div>
        <pre class="res-text" id="pText" hidden></pre>
        <p class="small" id="pMsg">Then paste it (Ctrl+V / ⌘V) in an email or in Google Classroom.</p>
      </section>

      <section class="pr-box">
        <h3>${FD.icon.key} Carry on with another device</h3>
        <p class="small muted">Your progress is saved in <b>this browser</b> only. To move it, copy your progress code, send it to yourself, then paste it here on the other device.</p>
        <div class="chk-btns">
          <button class="btn" id="cCopy">${FD.icon.copy} Copy my progress code</button>
          <button class="btn ghost" id="cFile">${FD.icon.download} Save as a file</button>
        </div>
        <label class="pr-paste"><span>Paste a progress code</span><textarea id="cIn" rows="2" placeholder="RP1Z.…"></textarea></label>
        <div class="chk-btns">
          <button class="btn" id="cLoad">${FD.icon.upload} Load this code</button>
          <label class="btn ghost file-btn">${FD.icon.upload} Open a progress file<input type="file" id="cOpen" accept=".txt,.json,text/plain,application/json"></label>
        </div>
        <p class="small" id="cMsg">${msg || ''}</p>
      </section>
      <section class="pr-box pr-danger" id="resetBox">
        <h3>↺ Start again from zero</h3>
        <div id="rs0">
          <p class="small muted">Deletes everything saved on this device: your games, your answers and the exit ticket. Use it if you want to repeat the lesson, or if this is a shared computer.</p>
          <div class="chk-btns"><button class="btn danger-btn" id="rsGo">↺ Reset my progress</button></div>
        </div>
        <div id="rs1" class="rs-step" hidden>
          <p><b>1 of 2 · Are you sure?</b> You will lose your <b>${pct}%</b> progress. Copy your progress first if your teacher needs it.</p>
          <div class="chk-btns">
            <button class="btn" id="rsCopy">${FD.icon.copy} Copy my progress first</button>
            <button class="btn danger-btn" id="rsYes">Yes, continue</button>
            <button class="btn ghost" id="rsNo1">Cancel</button>
          </div>
        </div>
        <div id="rs2" class="rs-step" hidden>
          <p><b>2 of 2 · Last check.</b> This cannot be undone. Type <b>RESET</b> to confirm.</p>
          <div class="rs-row">
            <input id="rsIn" autocomplete="off" spellcheck="false" placeholder="RESET" aria-label="Type RESET to confirm">
            <button class="btn danger-btn" id="rsDo" disabled>Delete all my progress</button>
            <button class="btn ghost" id="rsNo2">Cancel</button>
          </div>
        </div>
        <p class="small" id="rsMsg"></p>
      </section>`;

    const B = $('#progBody');
    $('#pName', B).addEventListener('input', (e) => { FD.state.name = e.target.value; FD.save(); });
    $('#pClass', B).addEventListener('input', (e) => { FD.state.cls = e.target.value; FD.save(); });
    B.querySelectorAll('[data-go]').forEach((b) => b.addEventListener('click', () => { dlg.close(); FD.goto(b.dataset.go); }));
    const needName = () => { if (FD.state.name.trim()) return false; FD.shake($('#pName', B)); $('#pName', B).focus(); $('#pMsg', B).innerHTML = '<b class="bad">Write your name first.</b>'; return true; };
    $('#pCopy', B).addEventListener('click', async () => {
      if (needName()) return;
      const ok = await FD.copy(FD.report());
      $('#pMsg', B).innerHTML = ok ? '<b class="good">✓ Copied!</b> Now paste it (Ctrl+V / ⌘V) in an email or in Google Classroom.' : '<b class="bad">Could not copy automatically.</b> Press “Show the report”, select the text and copy it, or download the .txt file.';
    });
    $('#pTxt', B).addEventListener('click', () => { if (!needName()) FD.download(`right-to-privacy-progress-${FD.slug(FD.state.name)}.txt`, FD.report()); });
    $('#pShow', B).addEventListener('click', () => { const p = $('#pText', B); p.hidden = !p.hidden; p.textContent = FD.report(); });
    $('#cCopy', B).addEventListener('click', async () => {
      const code = await FD.makeCode();
      const ok = await FD.copy(code);
      $('#cMsg', B).innerHTML = ok ? `<b class="good">✓ Code copied</b> (${FD.fmt(code.length)} characters). Paste it in an email to yourself, then paste it here on the other device.` : '<b class="bad">Could not copy automatically.</b> Use “Save as a file” instead.';
    });
    $('#cFile', B).addEventListener('click', async () => FD.download(`right-to-privacy-progress-code-${FD.slug(FD.state.name)}.txt`, await FD.makeCode()));
    const load = async (code) => {
      try {
        const s = await FD.readCode(code);
        const who = s.name ? `${s.name}${s.cls ? ' (' + s.cls + ')' : ''}` : 'someone with no name';
        if (FD.hasProgress() && !confirm(`Load the progress of ${who}? It will replace the progress saved on this device.`)) return;
        FD.replaceState(s);
        if (FD.refresh) FD.refresh();
        render(`<b class="good">✓ Progress loaded for ${FD.esc(who)}.</b>`);
      } catch (e) {
        $('#cMsg', B).innerHTML = `<b class="bad">${FD.esc(e.message || 'That code did not work.')}</b>`;
      }
    };
    $('#cLoad', B).addEventListener('click', () => load($('#cIn', B).value));
    $('#cOpen', B).addEventListener('change', async (e) => { const f = e.target.files[0]; if (f) load(await f.text()); });
    // Reset: two confirmations (are you sure? → type RESET).
    const step = (n) => {
      ['#rs0', '#rs1', '#rs2'].forEach((s, k) => { $(s, B).hidden = k !== n; });
      $('#rsMsg', B).textContent = '';
      if (n === 2) { $('#rsIn', B).value = ''; $('#rsDo', B).disabled = true; $('#rsIn', B).focus(); }
      $('#resetBox', B).classList.toggle('on', n > 0);
    };
    $('#rsGo', B).addEventListener('click', () => step(1));
    $('#rsYes', B).addEventListener('click', () => step(2));
    $('#rsNo1', B).addEventListener('click', () => step(0));
    $('#rsNo2', B).addEventListener('click', () => step(0));
    $('#rsCopy', B).addEventListener('click', async () => {
      const ok = await FD.copy(FD.report());
      $('#rsMsg', B).innerHTML = ok ? '<b class="good">✓ Progress copied.</b> Paste it somewhere safe, then continue.' : '<b class="bad">Could not copy automatically.</b> Use “Download .txt” above first.';
    });
    $('#rsIn', B).addEventListener('input', (e) => { $('#rsDo', B).disabled = e.target.value.trim().toUpperCase() !== 'RESET'; });
    $('#rsIn', B).addEventListener('keydown', (e) => { if (e.key === 'Enter' && !$('#rsDo', B).disabled) $('#rsDo', B).click(); });
    $('#rsDo', B).addEventListener('click', () => {
      if ($('#rsIn', B).value.trim().toUpperCase() !== 'RESET') return;
      FD.resetState();
      try { sessionStorage.removeItem('rp-greeted'); } catch (e) { /* ignore */ }
      if (FD.refresh) FD.refresh();
      FD.goto('start');
      render();
      $('#rsMsg', $('#progBody')).innerHTML = '<b class="good">✓ All progress on this device has been deleted.</b> You can start the lesson again.';
      $('#resetBox', $('#progBody')).scrollIntoView({ block: 'nearest' });
    });
  }

  FD.openProgress = (where) => {
    render();
    dlg.showModal();
    if (where === 'reset') { $('#resetBox').scrollIntoView({ block: 'center' }); $('#rsGo').focus(); }
  };
  FD.openHelp = () => help.showModal();

  // header badge
  const badge = () => { const b = $('#progPct'); if (b) b.textContent = FD.percent() + '%'; };
  FD.onChange = badge;

  // ---------- welcome back ----------
  FD.welcome = () => {
    let greeted = false;
    try { greeted = sessionStorage.getItem('rp-greeted') === '1'; sessionStorage.setItem('rp-greeted', '1'); } catch (e) { /* ignore */ }
    if (greeted || !FD.hasProgress()) return false;
    const S = FD.state, sc = FD.scenes.find((x) => x.id === S.last);
    $('#welBody').innerHTML = `
      <p class="kick">Right to privacy · saved progress</p>
      <h2 id="welTitle">Welcome back${S.name ? ', ' + FD.esc(S.name.split(' ')[0]) : ''}! 👋</h2>
      <p>You have completed <b>${FD.percent()}%</b> of the lesson.${sc ? ` Last time you were on <b>${FD.esc(sc.tab || sc.title)}</b>.` : ''}</p>
      <div class="chk-btns">
        ${sc ? '<button class="btn primary" id="wGo">▶ Continue where I left off</button>' : ''}
        <button class="btn ghost" id="wProg">${FD.icon.progress} See my progress</button>
        <button class="btn ghost" id="wStart">Go to the start</button>
      </div>
      <p class="small muted">Not you, or want to start again? <button class="link-btn danger" id="wReset">Reset the progress on this device</button></p>`;
    welcome.showModal();
    const go = (f) => () => { welcome.close(); f(); };
    if (sc) $('#wGo').addEventListener('click', go(() => FD.goto(S.last, S.step || 0)));
    $('#wProg').addEventListener('click', go(FD.openProgress));
    $('#wStart').addEventListener('click', go(() => FD.goto(FD.scenes[0].id)));
    $('#wReset').addEventListener('click', go(() => FD.openProgress('reset')));
    return true;
  };

  document.addEventListener('DOMContentLoaded', badge);
})();
