FD.add({
  id: 'recap',
  title: 'Quick-fire recap',
  tab: 'Recap',
  icon: 'recap',
  color: '--c4',
  section: true,
  interactive: true,
  vocab: [
    ['big data', 'data sets that are too large and complex for traditional processing methods'],
    ['ethical', 'morally right'],
  ],
  mount(el) {
    const ID = 'recap', SECS = 20;
    // mc: [question, [correct, ...wrong]] · order: steps in the right order · match: [[item, answer], …]
    const Q = [
      { t: 'mc', q: 'What do we call data sets that are too large and complex for traditional processing methods?', o: ['big data', 'simple data', 'complex data', 'small data'] },
      { t: 'mc', q: 'Which of these is an example of big data being used?', o: ['analysing social media trends', 'writing a letter', 'making a phone call', 'sending an email'] },
      { t: 'mc', q: 'What does “ethical” mean?', o: ['morally right', 'legally binding', 'financially beneficial', 'statistically accurate'] },
      { t: 'mc', q: 'Why do organisations collect data about users?', o: ['to streamline services and target advertisements', 'to delete user accounts', 'to avoid using technology', 'to increase hardware sales'] },
      { t: 'order', q: 'Tap the steps for analysing big data in the right order.', o: ['collect data', 'process data', 'analyse data', 'draw insights'] },
      { t: 'match', q: 'Match each use of data to its benefit.', o: [['tailoring products to user needs', 'improved services'], ['targeted advertisements', 'showing relevant ads'], ['analysing patterns in data', 'identifying trends']] },
    ];
    el.innerHTML = `
      <div class="sim qf">
        <div class="qf-top">
          <span class="pill" id="pos"></span>
          <span class="qf-streak" id="streak" hidden>🔥 <b>0</b> in a row</span>
          <span class="qf-pts">Points <b id="pts">0</b></span>
        </div>
        <div class="qf-time"><i id="bar"></i></div>
        <div class="card qf-card" id="card"></div>
        <p class="sc-fb" id="fb" hidden></p>
        <div class="ctrls">
          <button class="btn primary small-btn" id="go">▶ Start the quick-fire</button>
          <button class="btn primary small-btn" id="nx" hidden>Next ▶</button>
          <button class="btn ghost small-btn" id="again" hidden>↺ Play again</button>
          <p class="note">${SECS} seconds per question. Faster answers score more points.</p>
        </div>
      </div>`;
    const root = el.querySelector('.qf'), $ = (s) => root.querySelector(s);
    let i = 0, right = 0, pts = 0, streak = 0, best = 0, t0 = 0, tick = null, answered = false, dead = false;
    const log = [];

    function stopClock() { clearInterval(tick); }
    function clock() {
      stopClock();
      t0 = Date.now();
      tick = setInterval(() => {
        const left = Math.max(0, 1 - (Date.now() - t0) / (SECS * 1000));
        $('#bar').style.width = (left * 100) + '%';
        $('#bar').classList.toggle('low', left < 0.3);
        if (!left) finishQ(false, 'Time is up!');
      }, 100);
    }
    function show() {
      answered = false;
      const q = Q[i];
      $('#pos').textContent = `Question ${i + 1} of ${Q.length}`;
      $('#fb').hidden = true; $('#nx').hidden = true;
      const card = $('#card');
      if (q.t === 'mc') {
        card.innerHTML = `<p class="qf-q">${q.q}</p><div class="qf-opts">${FD.shuffle(q.o.map((o, k) => [o, k])).map(([o, k]) => `<button class="opt" data-k="${k}">${o}</button>`).join('')}</div>`;
        card.querySelectorAll('.opt').forEach((b) => b.addEventListener('click', () => {
          if (answered) return;
          const ok = b.dataset.k === '0';
          card.querySelectorAll('.opt').forEach((x) => { x.disabled = true; if (x.dataset.k === '0') x.classList.add('right'); });
          if (!ok) b.classList.add('wrong');
          finishQ(ok, ok ? '' : `The answer is “${q.o[0]}”.`, b.textContent);
        }));
      } else if (q.t === 'order') {
        const picked = [];
        card.innerHTML = `<p class="qf-q">${q.q}</p><ol class="qf-order" id="ord"></ol><div class="qf-opts">${FD.shuffle(q.o.map((o, k) => [o, k])).map(([o, k]) => `<button class="opt" data-k="${k}">${o}</button>`).join('')}</div>`;
        card.querySelectorAll('.opt').forEach((b) => b.addEventListener('click', () => {
          if (answered) return;
          b.disabled = true;
          picked.push(+b.dataset.k);
          card.querySelector('#ord').insertAdjacentHTML('beforeend', `<li>${b.textContent}</li>`);
          if (picked.length === q.o.length) {
            const ok = picked.every((k, n) => k === n);
            card.querySelectorAll('#ord li').forEach((li, n) => li.classList.add(picked[n] === n ? 'ok' : 'no'));
            finishQ(ok, ok ? '' : `The right order is: ${q.o.join(' → ')}.`, picked.map((k) => q.o[k]).join(' → '));
          }
        }));
      } else {
        const answers = FD.shuffle(q.o.map((p) => p[1]));
        card.innerHTML = `<p class="qf-q">${q.q}</p><div class="qf-match">${q.o.map(([a], n) => `
          <div class="qf-m" data-n="${n}"><span>${a}</span><select aria-label="Benefit of ${a}"><option value="">choose…</option>${answers.map((x) => `<option>${x}</option>`).join('')}</select></div>`).join('')}</div>
          <button class="btn small-btn" id="chk">Check my matches</button>`;
        card.querySelector('#chk').addEventListener('click', () => {
          if (answered) return;
          const sels = [...card.querySelectorAll('select')];
          if (sels.some((s) => !s.value)) { FD.shake(card.querySelector('.qf-match')); return; }
          let all = true;
          sels.forEach((s, n) => { const ok = s.value === q.o[n][1]; all = all && ok; s.classList.add(ok ? 'right' : 'wrong'); s.disabled = true; });
          finishQ(all, all ? '' : q.o.map(([a, b]) => `${a} → ${b}`).join(' · '), sels.map((s, n) => `${q.o[n][0]} → ${s.value}`).join('; '));
        });
      }
      clock();
    }
    function finishQ(ok, why, given) {
      if (answered) return;
      answered = true;
      stopClock();
      const secs = (Date.now() - t0) / 1000;
      if (ok) {
        right++; streak++; best = Math.max(best, streak);
        pts += 100 + Math.round(Math.max(0, SECS - secs) * 5) + (streak > 1 ? 25 * (streak - 1) : 0);
      } else streak = 0;
      log[i] = `${ok ? '✓' : '✗'} Q${i + 1}. ${Q[i].q} → ${given || '(no answer, time ran out)'}`;
      $('#pts').textContent = pts;
      $('#streak').hidden = streak < 2;
      $('#streak').querySelector('b').textContent = streak;
      if (streak >= 2) FD.pulse($('#streak'));
      const fb = $('#fb');
      fb.hidden = false;
      fb.className = 'sc-fb ' + (ok ? 'good' : 'bad');
      fb.innerHTML = ok ? `<b>✓ Correct!</b> ${secs < 6 ? 'Lightning fast ⚡' : ''}` : `<b>✗ ${why === 'Time is up!' ? 'Time is up!' : 'Not quite.'}</b> ${why === 'Time is up!' ? '' : why}`;
      if (i < Q.length - 1) { $('#nx').hidden = false; return; }
      fb.innerHTML += `<br><b>Finished: ${right} / ${Q.length} correct · ${pts} points · best streak ${best}.</b> ${right === Q.length ? '🎉 Perfect recall!' : right >= 4 ? '👍 Good memory.' : '📖 Keep these ideas in mind: you will need them today.'}`;
      $('#again').hidden = false;
      FD.gameDone(ID, { score: right, total: Q.length, lines: [`Points: ${pts} · best streak: ${best}`, ...log] });
    }
    function start() {
      i = 0; right = 0; pts = 0; streak = 0; best = 0; log.length = 0;
      $('#pts').textContent = 0; $('#streak').hidden = true;
      $('#go').hidden = true; $('#again').hidden = true;
      show();
    }
    $('#go').addEventListener('click', start);
    $('#again').addEventListener('click', start);
    $('#nx').addEventListener('click', () => { i++; show(); });
    $('#card').innerHTML = '<p class="qf-q">Six questions about the last lesson: big data, ethics and why organisations collect data.</p><p class="muted">Ready? Press <b>Start the quick-fire</b>.</p>';
    $('#pos').textContent = `${Q.length} questions`;
    return { destroy() { dead = true; stopClock(); } };
  },
  steps: [
    {
      title: 'Warm up your brain',
      text: `<p>Last lesson you learnt about <strong>big data</strong> and why organisations collect it.</p>
             <p>Answer six quick-fire questions. Each one has a <strong>20-second</strong> timer. Fast answers and streaks score extra points.</p>`,
      teach: 'Students play on their own devices (2 min). Then ask: “Who got 6/6? Who had a streak of 3 or more?”',
      solo: 'Press “Start the quick-fire”. Your score is saved for your teacher.',
    },
  ],
});
