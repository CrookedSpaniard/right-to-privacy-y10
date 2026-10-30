FD.add({
  id: 'rights',
  title: 'Bonus: claim your rights',
  tab: 'Bonus',
  icon: 'rights',
  color: '--c4',
  section: true,
  interactive: true,
  mount(el) {
    const ID = 'rights';
    const RIGHTS = [
      ['breach', '🚨 Right to be informed about data breaches'],
      ['consent', '✍️ Right to informed consent before data is collected'],
      ['surv', '🙈 Freedom from surveillance'],
      ['forget', '🗑️ Right to be forgotten'],
      ['access', '📂 Right to access the data held about you'],
      ['private', '🏠 Right to keep your private life private'],
    ];
    const CASES = [
      ['You want to know exactly what data a music app has collected about you.', 'access'],
      ['You closed your old gaming account and want the company to delete everything about you.', 'forget'],
      ['Your favourite shop was hacked last week, but nobody has told the customers.', 'breach'],
      ['A website starts tracking you before you have clicked “Accept” on anything.', 'consent'],
      ['A neighbour points a camera at your garden and records you all day.', 'surv'],
      ['A classmate posts details of your family’s health problems online.', 'private'],
    ];
    const d = FD.gameData(ID);
    d.claim = d.claim || {};
    d.real = d.real || {};
    d.note = d.note || {};
    el.innerHTML = `
      <div class="sim rg">
        <div class="ptabs"><button data-p="claim">🛡️ Claim your rights</button><button data-p="real">🤔 Reality check</button></div>
        <div data-panel="claim">
          <p class="note">For each problem, choose the right you would claim.</p>
          <ol class="rg-cases">${CASES.map(([t], i) => `
            <li class="card" data-i="${i}"><p>${t}</p>
              <select aria-label="Right for problem ${i + 1}"><option value="">Choose a right…</option>${RIGHTS.map(([v, l]) => `<option value="${v}">${l}</option>`).join('')}</select>
              <span class="rg-fb"></span></li>`).join('')}</ol>
          <div class="chk-btns"><button class="btn primary small-btn" id="mark">✓ Check my answers</button><span class="small" id="cmsg"></span></div>
        </div>
        <div data-panel="real" hidden>
          <p class="note">In practice, which of these rights do you think you <b>really</b> have, and which are you being denied? There is no wrong answer.</p>
          <div class="rg-real">${RIGHTS.map(([v, l]) => `
            <div class="rg-r" data-v="${v}"><p>${l}</p>
              <div class="seg">${[['yes', '✅ I have it'], ['part', '🤏 Partly'], ['no', '⛔ Denied']].map(([k, t]) => `<button data-k="${k}">${t}</button>`).join('')}</div>
              <input class="rg-note" placeholder="Why? (optional)" value="${FD.esc(d.note[v] || '')}" aria-label="Why, for ${l}"></div>`).join('')}</div>
          <div class="chk-btns"><button class="btn primary small-btn" id="saveR">✓ Save my reality check</button><span class="small" id="rmsg"></span></div>
        </div>
      </div>`;
    const root = el.querySelector('.rg'), $ = (s) => root.querySelector(s);
    FD.panels(root)('claim');
    root.querySelectorAll('.rg-cases li').forEach((li) => {
      const s = li.querySelector('select');
      s.value = d.claim[li.dataset.i] || '';
      s.addEventListener('change', () => { d.claim[li.dataset.i] = s.value; FD.save(); s.classList.remove('right', 'wrong'); li.querySelector('.rg-fb').textContent = ''; });
    });
    const lines = () => {
      const L = [];
      const n = CASES.filter(([, w], i) => d.claim[i] === w).length;
      if (Object.keys(d.claim).length) L.push(`Claim your rights: ${n} / ${CASES.length}`, ...CASES.map(([t, w], i) => `${d.claim[i] === w ? '✓' : '✗'} ${t} → ${d.claim[i] ? RIGHTS.find((r) => r[0] === d.claim[i])[1].replace(/^\S+\s/, '') : '–'}`));
      if (Object.keys(d.real).length) L.push('Reality check:', ...RIGHTS.map(([v, l]) => `${l.replace(/^\S+\s/, '')}: ${{ yes: 'I have it', part: 'partly', no: 'denied' }[d.real[v]] || '–'}${(d.note[v] || '').trim() ? ` (${d.note[v].trim()})` : ''}`));
      return { n, L };
    };
    $('#mark').addEventListener('click', () => {
      let n = 0;
      root.querySelectorAll('.rg-cases li').forEach((li) => {
        const s = li.querySelector('select'), ok = s.value === CASES[li.dataset.i][1];
        n += ok;
        s.classList.toggle('right', ok); s.classList.toggle('wrong', !ok);
        li.querySelector('.rg-fb').textContent = ok ? '✓' : `✗ → ${RIGHTS.find((r) => r[0] === CASES[li.dataset.i][1])[1]}`;
      });
      $('#cmsg').innerHTML = `<b class="${n === CASES.length ? 'good' : 'bad'}">${n} / ${CASES.length} correct.</b>`;
      FD.gameDone(ID, { score: n, total: CASES.length, lines: lines().L });
    });
    root.querySelectorAll('.rg-r').forEach((r) => {
      const seg = r.querySelector('.seg');
      FD.segSet(seg, d.real[r.dataset.v]);
      seg.addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; d.real[r.dataset.v] = b.dataset.k; FD.save(); FD.segSet(seg, b.dataset.k); });
      r.querySelector('input').addEventListener('input', (e) => { d.note[r.dataset.v] = e.target.value; FD.save(); });
    });
    $('#saveR').addEventListener('click', () => {
      if (Object.keys(d.real).length < RIGHTS.length) { $('#rmsg').innerHTML = '<b class="bad">Choose an answer for all six rights.</b>'; return; }
      const { n, L } = lines(), g = FD.game(ID);
      FD.gameDone(ID, g.score != null ? { score: n, total: CASES.length, lines: L } : { lines: L });
      $('#rmsg').innerHTML = '<b class="good">✓ Saved in your progress report.</b>';
    });
    return {};
  },
  steps: [
    {
      title: 'Bonus: claim your rights',
      text: `<p>Finished early, or working at home? Try this bonus game.</p>
             <p><strong>Claim your rights:</strong> six problems, six rights. <strong>Reality check:</strong> do you really have these rights in practice?</p>`,
      teach: 'Optional extension for fast finishers or homework.',
      solo: 'Do both tabs. Your answers are added to your progress report.',
    },
  ],
});
