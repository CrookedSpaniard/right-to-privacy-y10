FD.add({
  id: 'court',
  title: 'The Privacy Court',
  tab: 'Court',
  icon: 'court',
  color: '--c9',
  section: true,
  interactive: true,
  mount(el) {
    const ID = 'court';
    const LAWS = [
      { v: 'hra', label: '🏠 Human Rights Act, Art. 8', short: 'Art. 8' },
      { v: 'dpa', label: '🗄️ Data Protection Act', short: 'DPA' },
      { v: 'gdpr', label: '🇪🇺 GDPR', short: 'GDPR' },
      { v: 'ipa', label: '🕵️ Investigatory Powers Act', short: 'IPA' },
    ];
    const VERD = [{ v: 'ok', label: '✅ Allowed', short: 'Allowed' }, { v: 'no', label: '⛔ Breaks the law', short: 'Breaks' }];
    // [emoji, case, law, verdict, why]
    const CASES = [
      ['👕', 'A clothes shop keeps your old address and card details for <b>10 years</b> after you closed your account, “just in case”.', 'dpa', 'no', 'The DPA says data must be kept <b>only for as long as it is needed</b>.'],
      ['🎮', 'A gaming company is hacked. It tells its players about the data breach <b>three weeks later</b>.', 'gdpr', 'no', 'GDPR says data breaches must be reported <b>within 72 hours</b>.'],
      ['🕵️', 'With the correct permission, the security services intercept the messages of a suspect who is planning a terrorist attack.', 'ipa', 'ok', 'The IPA allows interception in the interests of <b>national security</b>.'],
      ['📰', 'A newspaper publishes the medical history of a private citizen without their consent.', 'hra', 'no', 'Article 8 protects you from personal information such as your <b>medical history</b> being disclosed without consent.'],
      ['📱', 'You ask a social media app for a copy of the data it holds about you. The app <b>refuses</b>.', 'gdpr', 'no', 'GDPR gives you the <b>right to access</b> the data an organisation holds on you.'],
      ['📞', 'A phone company keeps records of who its customers contacted for <b>12 months</b>, so the police can ask for them.', 'ipa', 'ok', 'The IPA requires communication companies to keep records for <b>up to a year</b>.'],
    ];
    el.innerHTML = `
      <div class="sim ct">
        <div class="ct-top"><span class="pill" id="pos"></span><div class="ct-dots" id="dots">${CASES.map(() => '<i></i>').join('')}</div><span class="ct-sc">Score <b id="sc">0</b> / ${CASES.length * 2}</span></div>
        <div class="ct-bench">
          <div class="card ct-case" id="case"></div>
          <div class="ct-gavel" id="gavel" aria-hidden="true">🔨</div>
        </div>
        <div class="ct-q"><p class="ct-ql" id="ql"></p><div id="vh"></div></div>
        <div class="ct-verdict" id="ver" hidden></div>
        <div class="ctrls">
          <button class="btn primary small-btn" id="go">⚖️ Open the court</button>
          <button class="btn primary small-btn" id="lock" hidden>Lock in ▶</button>
          <button class="btn primary small-btn" id="nx" hidden>Next case ▶</button>
          <button class="btn ghost small-btn" id="again" hidden>↺ New session</button>
        </div>
      </div>`;
    const root = el.querySelector('.ct'), $ = (s) => root.querySelector(s);
    const dots = [...root.querySelectorAll('#dots i')];
    let i = 0, stage = 0, score = 0, vote = null, law = null, lawT = null;
    const log = [];

    function intro() {
      $('#case').innerHTML = `<p class="ct-e">⚖️</p><p><b>Order in court!</b> Six privacy cases need a judgement.</p><p class="muted">For each case: first choose <b>which law</b> applies, then decide: <b>allowed</b>, or does it <b>break the law</b>?</p>`;
      $('#pos').textContent = `${CASES.length} cases`;
      $('#ql').textContent = '';
      $('#vh').innerHTML = '';
    }
    function ask() {
      $('#vh').innerHTML = '';
      $('#ql').innerHTML = stage === 0 ? '<span class="qn">1</span> Which law applies?' : '<span class="qn">2</span> What is your verdict?';
      vote = FD.vote($('#vh'), stage === 0 ? LAWS : VERD, () => { $('#lock').disabled = false; });
      vote.el.classList.toggle('two', stage === 1);
      $('#lock').hidden = false;
      $('#lock').disabled = FD.mode() !== 'class';
      $('#lock').textContent = stage === 0 ? 'Lock in the law ▶' : '🔨 Give the verdict';
    }
    function show() {
      const [e, txt] = CASES[i];
      stage = 0;
      $('#pos').textContent = `Case ${i + 1} of ${CASES.length}`;
      $('#case').innerHTML = `<p class="ct-e">${e}</p><p>${txt}</p>`;
      $('#ver').hidden = true; $('#nx').hidden = true; $('#go').hidden = true;
      dots.forEach((dd, k) => dd.classList.toggle('cur', k === i));
      ask();
    }
    async function lock() {
      if (!vote.pick() && !vote.hasTally()) { FD.shake(vote.el); return; }
      const [, txt, wantLaw, wantV, why] = CASES[i];
      if (stage === 0) {
        law = vote.pick(); lawT = vote.hasTally() ? FD.tallyText(LAWS, vote.tallies()) : '';
        vote.lock(wantLaw);
        if (law === wantLaw) score++;
        $('#sc').textContent = score;
        $('#lock').hidden = true;
        await FD.wait(1100);
        stage = 1;
        ask();
        return;
      }
      const v = vote.pick(), vT = vote.hasTally() ? FD.tallyText(VERD, vote.tallies()) : '';
      vote.lock(wantV);
      if (v === wantV) score++;
      $('#sc').textContent = score;
      $('#lock').hidden = true;
      const g = $('#gavel');
      g.classList.remove('bang'); void g.offsetWidth; g.classList.add('bang');
      await FD.wait(450);
      const okAll = law === wantLaw && v === wantV;
      dots[i].classList.add(okAll ? 'ok' : law || v ? 'no' : 'nd');
      const lawName = LAWS.find((x) => x.v === wantLaw).label;
      const ver = $('#ver');
      ver.hidden = false;
      ver.className = 'ct-verdict ' + (wantV === 'ok' ? 'good' : 'bad');
      ver.innerHTML = `<p class="ct-stamp">${wantV === 'ok' ? 'ALLOWED' : 'BREAKS THE LAW'}</p><p><b>${lawName}.</b> ${why}</p>`;
      FD.shake(root.querySelector('.ct-bench'));
      log.push(`Case ${i + 1}: ${txt.replace(/<[^>]+>/g, '')}`, `     My law: ${law ? LAWS.find((x) => x.v === law).short : '–'}${law ? (law === wantLaw ? ' ✓' : ' ✗') : ''} · my verdict: ${v ? VERD.find((x) => x.v === v).short : '–'}${v ? (v === wantV ? ' ✓' : ' ✗') : ''}${lawT || vT ? ` · Class: ${[lawT, vT].filter(Boolean).join(' | ')}` : ''}`);
      if (i < CASES.length - 1) $('#nx').hidden = false;
      else {
        $('#again').hidden = false;
        ver.innerHTML += `<p class="ct-end"><b>Court closed: ${score} / ${CASES.length * 2}.</b> ${score >= 11 ? '🏆 Supreme judge!' : score >= 8 ? '👍 A fair judge.' : '📖 Look back at the four laws.'}</p>`;
        FD.gameDone(ID, { score, total: CASES.length * 2, lines: log.slice() });
      }
    }
    function start() { i = 0; score = 0; log.length = 0; $('#sc').textContent = 0; dots.forEach((dd) => dd.classList.remove('ok', 'no', 'nd')); $('#again').hidden = true; show(); }
    $('#go').addEventListener('click', start);
    $('#again').addEventListener('click', start);
    $('#lock').addEventListener('click', lock);
    $('#nx').addEventListener('click', () => { i++; show(); });
    intro();
    return {};
  },
  steps: [
    {
      title: 'You are the jury',
      text: `<p>Six real-life privacy cases. For each one:</p>
             <ol><li>choose <strong>which law</strong> applies</li><li>decide: is it <strong>allowed</strong>, or does it <strong>break the law</strong>?</li></ol>
             <p>Each correct choice scores 1 point (12 in total).</p>`,
      teach: 'Read the case aloud. Students vote with fingers 1–4 for the law, count hands with + / −, then “Lock in”. Then thumbs up (allowed) or down (breaks the law). Ask one student to justify before you bang the gavel.',
      solo: 'Press “Open the court”. Pick a law, lock it in, then pick a verdict.',
    },
  ],
});
