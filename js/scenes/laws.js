FD.add({
  id: 'laws',
  title: 'Four laws and a match-up',
  tab: 'The laws',
  icon: 'laws',
  color: '--c3',
  section: true,
  interactive: true,
  vocab: [
    ['data subject', 'the person the data is about'],
    ['consent', 'permission that you give freely, knowing what you are agreeing to'],
    ['data breach', 'when data is lost, stolen or seen by people who should not see it'],
  ],
  mount(el) {
    const ID = 'laws';
    const LAWS = [
      { id: 'hra', e: '🏠', name: 'Human Rights Act, Article 8', yr: '1998', tag: 'The right to privacy', body: `
        <p class="lw-quote">“Everyone has the right to respect for his private and family life, his home, and his correspondence.”</p>
        <p><b>You are protected from:</b></p>
        <ul><li>your communications being monitored (phone tapping, emails, internet use, CCTV)</li><li>your home being searched or put under surveillance</li><li>your personal information (such as your medical history) being disclosed without your consent</li></ul>
        <p class="lw-warn"><b>But…</b> you may lose some or all of these protections if it is a matter of <b>public safety</b>, or if you have <b>broken the law</b>.</p>` },
      { id: 'dpa', e: '🗄️', name: 'Data Protection Act', yr: '2018', tag: 'How UK data is handled', body: `
        <p>Governs how the data of UK citizens can be <b>collected, stored and shared</b>. Organisations must follow the <b>data protection principles</b>. Data must be:</p>
        <ul class="lw-ps"><li>⚖️ used fairly and lawfully</li><li>🎯 used for a specific and necessary purpose</li><li>✅ accurate and up to date</li><li>⏳ kept only for as long as it is needed</li><li>🔐 handled securely, protected against unauthorised access, destruction or damage</li></ul>` },
      { id: 'gdpr', e: '🇪🇺', name: 'General Data Protection Regulation (GDPR)', yr: '2018', tag: 'The EU rules', body: `
        <p>The EU equivalent of the Data Protection Act. Data collectors must:</p>
        <ul><li>get <b>consent</b> from the people they collect data from</li><li>report <b>data breaches within 72 hours</b></li><li>give people <b>access</b> to the data held about them, with a report on how it is used</li><li><b>delete</b> someone’s data if they ask</li><li><b>protect</b> the data and build data protection into their systems</li></ul>
        <p class="lw-es"><b>🇪🇸 What about Spain?</b> GDPR applies directly in Spain, together with Spain’s own data protection law (LOPDGDD, 2018). Since Brexit, the UK keeps its own version, the UK GDPR.</p>` },
      { id: 'ipa', e: '🕵️', name: 'Investigatory Powers Act', yr: '2016', tag: 'When privacy can be taken away', body: `
        <p>Nicknamed the <b>“Snooper’s Charter”</b>. It sets out the rules the police and security services must follow when they collect data on people suspected of a crime.</p>
        <p>They can intercept someone’s online communications if it is:</p>
        <ol><li>in the interests of <b>national security</b></li><li>in the interests of the <b>economic well-being</b> of the UK</li><li>to prevent or detect <b>serious crime</b></li></ol>
        <p>Communication companies must keep records of communications for <b>up to a year</b>, and can be ordered to help the authorities access them, even when tools such as encryption are used.</p>` },
    ];
    const PAIRS = [
      ['hra', '🏠 Human Rights Act, Article 8', 'protects your right to respect for private and family life'],
      ['dpa', '🗄️ Data Protection Act', 'governs how organisations handle personal data within the UK'],
      ['gdpr', '🇪🇺 GDPR', 'sets out EU-wide rules for processing personal data'],
      ['ipa', '🕵️ Investigatory Powers Act', 'rules for surveillance and access to communications by authorities'],
    ];
    const d = FD.gameData(ID);
    d.gaps = d.gaps || ['', ''];
    el.innerHTML = `
      <div class="sim lw">
        <div class="ptabs"><button data-p="learn">📜 Meet the laws</button><button data-p="game">🃏 Match-up game</button></div>
        <div data-panel="learn">
          <div class="lw-cards">${LAWS.map((l) => `
            <button class="lw-card" data-id="${l.id}" aria-expanded="false">
              <span class="lw-e">${l.e}</span><b>${l.name}</b><small>${l.yr} · ${l.tag}</small><span class="lw-open">Tap to open</span>
            </button>`).join('')}</div>
          <div class="card lw-body" id="body"><p class="muted">Tap a law to open it. Open all four, then play the match-up game.</p></div>
          <div class="card lw-gaps">
            <p><b>Fill the gaps:</b> the data protection principles say data should be kept accurate and
              <select data-g="0" aria-label="Gap 1"><option value="">…</option><option>up to date</option><option>public</option><option>encrypted forever</option></select>
              and for only as
              <select data-g="1" aria-label="Gap 2"><option value="">…</option><option>long as the company wants</option><option>long as it is needed</option><option>short as possible</option></select>.
            </p>
            <p class="small" id="gfb"></p>
          </div>
        </div>
        <div data-panel="game" hidden>
          <div class="mm-top"><span class="pill">Find the 4 pairs</span><span>Moves <b id="mv">0</b></span><span>Time <b id="tm">0</b> s</span><button class="btn ghost small-btn" id="shuf">↺ New game</button></div>
          <div class="mm-grid" id="grid"></div>
          <p class="sc-fb" id="mfb" hidden></p>
        </div>
      </div>`;
    const root = el.querySelector('.lw'), $ = (s) => root.querySelector(s);
    const showPanel = FD.panels(root);
    const opened = new Set(d.opened || []);

    function open(id) {
      const l = LAWS.find((x) => x.id === id);
      root.querySelectorAll('.lw-card').forEach((c) => { const on = c.dataset.id === id; c.classList.toggle('on', on); c.setAttribute('aria-expanded', on); });
      opened.add(id);
      d.opened = [...opened];
      FD.save();
      root.querySelectorAll('.lw-card').forEach((c) => c.classList.toggle('seen', opened.has(c.dataset.id)));
      $('#body').innerHTML = `<h4>${l.e} ${l.name} <small>(${l.yr})</small></h4>${l.body}`;
      FD.pulse($('#body'));
    }
    root.querySelectorAll('.lw-card').forEach((c) => c.addEventListener('click', () => open(c.dataset.id)));
    root.querySelectorAll('.lw-card').forEach((c) => c.classList.toggle('seen', opened.has(c.dataset.id)));

    const GAP = ['up to date', 'long as it is needed'];
    const drawGaps = () => {
      const sels = [...root.querySelectorAll('[data-g]')];
      sels.forEach((s, i) => { s.value = d.gaps[i]; s.classList.toggle('right', s.value === GAP[i]); s.classList.toggle('wrong', !!s.value && s.value !== GAP[i]); });
      const ok = sels.every((s, i) => s.value === GAP[i]);
      $('#gfb').innerHTML = ok ? '<b class="good">✓ Correct!</b> Data must be accurate and up to date, and kept only as long as it is needed.' : sels.some((s) => s.value) ? 'Keep trying: think about the five principles above.' : '';
    };
    root.querySelectorAll('[data-g]').forEach((s) => s.addEventListener('change', () => { d.gaps[+s.dataset.g] = s.value; FD.save(); drawGaps(); }));
    drawGaps();

    // ---------- memory match-up ----------
    let first = null, busy = false, moves = 0, found = 0, t0 = 0, tick = null;
    function deal() {
      clearInterval(tick);
      moves = 0; found = 0; first = null; busy = false; t0 = 0;
      $('#mv').textContent = 0; $('#tm').textContent = 0; $('#mfb').hidden = true;
      const cards = FD.shuffle(PAIRS.flatMap(([id, a, b]) => [[id, a, 'law'], [id, b, 'what']]));
      $('#grid').innerHTML = cards.map(([id, txt, kind], i) => `<button class="mm-card" data-id="${id}" data-i="${i}" aria-label="Hidden card"><span class="mm-back">?</span><span class="mm-face ${kind}">${txt}</span></button>`).join('');
    }
    $('#grid').addEventListener('click', (e) => {
      const c = e.target.closest('.mm-card');
      if (!c || busy || c.classList.contains('up') || c.classList.contains('got')) return;
      if (!t0) { t0 = Date.now(); tick = setInterval(() => { $('#tm').textContent = Math.round((Date.now() - t0) / 1000); }, 500); }
      c.classList.add('up');
      c.setAttribute('aria-label', c.querySelector('.mm-face').textContent);
      if (!first) { first = c; return; }
      moves++;
      $('#mv').textContent = moves;
      if (first.dataset.id === c.dataset.id) {
        [first, c].forEach((x) => x.classList.add('got'));
        first = null;
        found++;
        if (found === PAIRS.length) win();
      } else {
        busy = true;
        const a = first;
        first = null;
        setTimeout(() => { [a, c].forEach((x) => { x.classList.remove('up'); x.setAttribute('aria-label', 'Hidden card'); }); busy = false; }, 900);
      }
    });
    function win() {
      clearInterval(tick);
      const secs = Math.round((Date.now() - t0) / 1000);
      const stars = moves <= 6 ? 3 : moves <= 9 ? 2 : 1;
      const fb = $('#mfb');
      fb.hidden = false;
      fb.className = 'sc-fb good';
      fb.innerHTML = `<b>${'⭐'.repeat(stars)} All 4 pairs in ${moves} moves and ${secs} seconds!</b> ${stars === 3 ? 'Law expert!' : 'Play again to beat your score.'}`;
      const gapsOk = d.gaps.every((g, i) => g === GAP[i]);
      const prev = FD.game(ID);
      const best = prev.done && prev.data.bestMoves ? Math.min(prev.data.bestMoves, moves) : moves;
      d.bestMoves = best;
      FD.gameDone(ID, {
        score: stars, total: 3,
        lines: [`Match-up: 4 pairs in ${moves} moves, ${secs} s (${stars}/3 stars, best ${best} moves)`, `Laws opened: ${opened.size} of 4`, `Fill the gaps: “${d.gaps[0] || '–'}” / “${d.gaps[1] || '–'}” ${gapsOk ? '✓' : '✗'}`],
      });
    }
    $('#shuf').addEventListener('click', deal);
    deal();
    showPanel('learn');
    return {
      open: (id) => { showPanel('learn'); open(id); },
      game: () => showPanel('game'),
      destroy() { clearInterval(tick); },
    };
  },
  steps: [
    {
      title: 'Article 8: the right to privacy',
      text: `<p>Article 8 of the <strong>Human Rights Act (1998)</strong> gives everyone the right to respect for their private and family life, their home and their correspondence.</p>
             <p>But you can <strong>lose</strong> some of this protection for public safety, or if you break the law.</p>`,
      teach: 'Ask: “Do you think it is fair that you can lose these rights?” Take two quick opinions.',
      solo: 'Read the card. Is it fair that you can lose these rights? Think about it, then press Next.',
      on: (a) => a.open('hra'),
    },
    {
      title: 'The Data Protection Act',
      text: `<p>The <strong>Data Protection Act (2018)</strong> controls how organisations collect, store and share data about UK citizens.</p>
             <p>They must follow the <strong>five data protection principles</strong>. Can you fill the gaps below the card?</p>`,
      teach: 'Students fill the two gaps on their device. You will need the five principles in the Data Inspector game.',
      solo: 'Fill the two gaps under the card. They go into your report.',
      on: (a) => a.open('dpa'),
    },
    {
      title: 'GDPR',
      text: `<p><strong>GDPR (2018)</strong> is the EU’s version of the same idea. It gives you rights: consent, access to your data, deletion, and to be told about a data breach within <strong>72 hours</strong>.</p>
             <p>It is the law here in Spain too.</p>`,
      teach: 'Discuss: “Should everyone in the world have the same data protection rights? Could a worldwide law work?”',
      solo: 'Read the card, including the box about Spain.',
      on: (a) => a.open('gdpr'),
    },
    {
      title: 'The Investigatory Powers Act',
      text: `<p>The <strong>Investigatory Powers Act (2016)</strong> works the other way: it lets the authorities <strong>take away</strong> some privacy, for national security, the economy or serious crime.</p>
             <p>Is it compatible with the other three laws?</p>`,
      teach: 'Quick vote with thumbs up / down: “Is the IPA compatible with Article 8?” Ask one student from each side why.',
      solo: 'Read the card. Is it compatible with the other laws? Then press Next to play.',
      on: (a) => a.open('ipa'),
    },
    {
      title: 'Match-up game',
      text: `<p>Turn over two cards at a time. Match each <strong>law</strong> to <strong>what it does</strong>.</p>
             <p>Find all four pairs in as few moves as you can: <strong>6 moves or fewer = 3 stars</strong>.</p>`,
      teach: 'Students play on their own devices (1–2 min). Who got 3 stars?',
      solo: 'Your moves, time and stars are saved for your teacher.',
      on: (a) => a.game(),
    },
  ],
});
