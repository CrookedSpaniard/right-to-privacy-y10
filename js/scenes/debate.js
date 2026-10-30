FD.add({
  id: 'debate',
  title: 'Debate builder',
  tab: 'Debate',
  icon: 'debate',
  color: '--c8',
  section: true,
  interactive: true,
  mount(el) {
    const ID = 'debate';
    const MEASURES = [
      ['📹', 'There are CCTV cameras in everyone’s home.'],
      ['🏢', 'Companies can collect data on citizens without their consent.'],
      ['👮', 'The police monitor all citizens (have access to all their communications, etc.) regardless of whether they have broken the law or not.'],
    ];
    const SIDES = [['for', '👍 The measure is necessary'], ['against', '✋ The measure compromises an individual’s right to privacy']];
    const PARTS = [
      ['claim', '1 · My claim', 'I believe that this measure is… / is not…'],
      ['reason', '2 · My reason', 'This is because…'],
      ['example', '3 · Evidence or an example (a law, a case, a game from today)', 'For example, … / Article 8 of the Human Rights Act says…'],
      ['counter', '4 · The other side says… and my answer is…', 'Some people argue that… However, …'],
    ];
    const d = FD.gameData(ID);
    d.f = d.f || {};
    el.innerHTML = `
      <div class="sim db">
        <div class="class-only" id="tmr"></div>
        <p class="db-l"><span class="qn">1</span> Pick one measure</p>
        <div class="db-ms">${MEASURES.map(([e, t], k) => `<button class="db-m" data-k="${k}"><span>${e}</span>${t}</button>`).join('')}</div>
        <p class="db-l"><span class="qn">2</span> Pick your side</p>
        <div class="seg db-side">${SIDES.map(([v, l]) => `<button data-v="${v}">${l}</button>`).join('')}</div>
        <p class="db-l"><span class="qn">3</span> Build your argument</p>
        <div class="db-f">${PARTS.map(([k, l, ph]) => `<label><span>${l}</span><textarea rows="2" data-k="${k}" placeholder="${ph}">${FD.esc(d.f[k] || '')}</textarea></label>`).join('')}</div>
        <div class="db-meter"><span>💪 Argument strength</span><span class="bar"><i id="str"></i></span><b id="strL"></b></div>
        <ul class="db-tips" id="tips"></ul>
        <div class="chk-btns"><button class="btn primary small-btn" id="save">✓ Save my argument</button><button class="btn ghost small-btn" id="model">👀 See an example</button><span class="small" id="msg"></span></div>
        <div class="card db-model" id="mdl" hidden>
          <p><b>Sam chose:</b> 👮 the police monitor all citizens · ✋ compromises privacy</p>
          <p><i>“I don’t think that the police should have the right to monitor all citizens regardless of whether they have broken the law or not. I think this level of monitoring compromises an individual’s right to privacy. You should not be monitored unless you have done something wrong or the police suspect that you may have broken the law.”</i></p>
          <p class="small muted">How could Sam make this stronger? (Hint: name a law, give an example, answer the other side.)</p>
        </div>
      </div>`;
    const root = el.querySelector('.db'), $ = (s) => root.querySelector(s);
    FD.timer($('#tmr'), '⏱ Think · pair · share');

    function drawPick() {
      root.querySelectorAll('.db-m').forEach((b) => { const on = +b.dataset.k === d.m; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
      FD.segSet(root.querySelector('.db-side'), d.side);
    }
    function strength() {
      const all = PARTS.map(([k]) => (d.f[k] || '').trim()).join(' ').toLowerCase();
      const tips = [];
      let s = 0;
      PARTS.forEach(([k, l]) => { if ((d.f[k] || '').trim().length >= 20) s += 15; else tips.push(`Complete part ${l.split(' · ')[0]}.`); });
      if (/article 8|human rights|data protection|gdpr|investigatory|snooper/.test(all)) s += 15; else tips.push('Name a law (Article 8, DPA, GDPR or the IPA).');
      if (/because|so that|this means|therefore/.test(all)) s += 10; else tips.push('Use “because” or “this means” to explain.');
      if (/however|on the other hand|although|but /.test(all)) s += 15; else tips.push('Answer the other side with “however”.');
      s = Math.min(100, s);
      $('#str').style.width = s + '%';
      $('#strL').textContent = s >= 85 ? 'Very strong' : s >= 60 ? 'Strong' : s >= 30 ? 'Getting there' : 'Weak';
      $('#tips').innerHTML = tips.slice(0, 3).map((t) => `<li>💡 ${t}</li>`).join('');
      return s;
    }
    root.querySelectorAll('.db-m').forEach((b) => b.addEventListener('click', () => { d.m = +b.dataset.k; FD.save(); drawPick(); }));
    root.querySelectorAll('.db-side button').forEach((b) => b.addEventListener('click', () => { d.side = b.dataset.v; FD.save(); drawPick(); }));
    root.querySelectorAll('.db-f textarea').forEach((t) => t.addEventListener('input', () => { d.f[t.dataset.k] = t.value; FD.save(); strength(); }));
    $('#model').addEventListener('click', () => { $('#mdl').hidden = !$('#mdl').hidden; });
    $('#save').addEventListener('click', () => {
      if (d.m == null || !d.side) { $('#msg').innerHTML = '<b class="bad">Pick a measure and a side first.</b>'; FD.shake(root.querySelector(d.m == null ? '.db-ms' : '.db-side')); return; }
      if (!(d.f.claim || '').trim() || !(d.f.reason || '').trim()) { $('#msg').innerHTML = '<b class="bad">Write at least your claim and your reason.</b>'; FD.shake($('.db-f')); return; }
      const s = strength();
      FD.gameDone(ID, {
        score: s, total: 100,
        lines: [
          `Measure: ${MEASURES[d.m][1]}`,
          `My side: ${SIDES.find((x) => x[0] === d.side)[1].replace(/^\S+\s/, '')}`,
          ...PARTS.map(([k, l]) => `${l.replace(/^\d · /, '')}: ${(d.f[k] || '').trim().replace(/\s+/g, ' ') || '–'}`),
        ],
      });
      $('#msg').innerHTML = `<b class="good">✓ Saved (strength ${s}/100).</b> It is in your progress report.`;
    });
    drawPick();
    strength();
    return {};
  },
  steps: [
    {
      title: 'Build your argument',
      text: `<p>Pick <strong>one</strong> of the three extreme measures. Then argue either that it is <strong>necessary</strong>, or that it <strong>compromises</strong> an individual’s right to privacy.</p>
             <p>Build your argument in four parts. The meter shows how strong it is.</p>`,
      teach: 'Think (1 min, on their own) · pair (1 min, compare with a partner who picked the other side) · share (two pairs present). Use the timer at the top.',
      solo: 'Fill in the four parts and press “Save my argument”. Compare with Sam’s example afterwards.',
    },
  ],
});
