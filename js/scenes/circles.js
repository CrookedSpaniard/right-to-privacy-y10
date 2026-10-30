FD.add({
  id: 'circles',
  title: 'Privacy circles',
  tab: 'Circles',
  icon: 'circles',
  color: '--c1',
  section: true,
  interactive: true,
  mount(el) {
    const ID = 'circles';
    const DATA = [
      ['purchases', '🛒'], ['location', '📍'], ['mouse movements', '🖱️'], ['search history', '🔎'], ['content you’ve streamed or downloaded', '🎬'],
      ['which adverts you have watched or clicked', '📢'], ['demographic information (age, gender, job)', '🎂'], ['computer characteristics (browser, battery, screen size)', '💻'], ['conversations', '💬'], ['contact details', '📇'],
    ];
    const ZONES = [
      ['private', '🔒', 'Completely private'], ['family', '👨‍👩‍👧', 'Family'], ['friends', '🤝', 'Close friends'], ['companies', '🏢', 'Companies'], ['public', '🌍', 'Completely public'],
    ];
    // What could happen if this data reaches this circle.
    const RISK = {
      public: {
        location: '📍 Anyone, including strangers, can see where you are and where you live.',
        'contact details': '📞 Scam calls, spam and phishing messages start arriving.',
        conversations: '💬 Private messages can be screenshotted, shared and used against you.',
        'search history': '🔎 Everyone can see what worries you, what you like and what you plan.',
        'demographic information (age, gender, job)': '🎭 Criminals can use these details to pretend to be you.',
        purchases: '🛒 People can see what you buy, when and where.',
      },
      companies: {
        conversations: '🏢 A company could scan your chats to target adverts at you.',
        location: '🏢 Location data is often sold on to advertisers and data brokers.',
        'contact details': '🏢 Your details can be shared with “partners” who send you marketing.',
      },
    };
    const MODEL = {
      private: ['mouse movements', 'I think I’d keep my mouse movements private. I’m not really sure anyone I know would want or need this data.'],
      family: ['location, search history, computer characteristics', 'It’s helpful for me to share my location so my family can keep an eye on me. They also check my search history to make sure I’m using the internet safely.'],
      friends: ['contact details, conversations, demographic information', 'I’d be happy to share this data with my close friends. Some conversations I’d want to keep more private.'],
      companies: ['purchases, adverts watched or clicked, content streamed or downloaded', 'Sometimes it’s helpful for companies to know what I’ve watched or purchased to give recommendations.'],
      public: ['(nothing)', 'I’m quite a private person so I wouldn’t really want to share anything publicly.'],
    };
    const d = FD.gameData(ID);
    d.place = d.place || {};
    d.why = d.why || {};

    el.innerHTML = `
      <div class="sim ci">
        <div class="ci-pool" id="pool" data-z="">${DATA.map(([n, e], k) => `<button class="ci-chip" draggable="true" data-k="${k}"><b>${e}</b><span>${n}</span></button>`).join('')}</div>
        <p class="note ci-help" id="help">Tap a piece of data, then tap a circle. (Or drag it.)</p>
        <div class="ci-zones">${ZONES.map(([z, e, n], i) => `
          <div class="ci-zone" data-z="${z}" style="--i:${i}">
            <p class="ci-zh"><span>${e}</span>${n} <small class="ci-n">0</small></p>
            <div class="ci-drop"></div>
          </div>`).join('')}</div>
        <div class="ci-risk" id="risk" aria-live="polite"></div>
        <div class="card ci-reasons" id="reasons" hidden>
          <h4>Why? Give a reason for each circle you used</h4>
          <div id="rs"></div>
          <div class="chk-btns">
            <button class="btn primary small-btn" id="save">✓ Save my circles</button>
            <button class="btn ghost small-btn" id="model">👀 Compare with an example</button>
          </div>
          <p class="small" id="msg"></p>
          <div class="ci-model" id="mdl" hidden>${ZONES.map(([z, e, n]) => `<p><b>${e} ${n}:</b> ${MODEL[z][0]}<br><i>“${MODEL[z][1]}”</i></p>`).join('')}</div>
        </div>
        <div class="ctrls"><button class="btn ghost small-btn" id="reset">↺ Start again</button></div>
      </div>`;
    const root = el.querySelector('.ci'), $ = (s) => root.querySelector(s);
    let sel = null;

    function draw() {
      root.querySelectorAll('.ci-chip').forEach((c) => {
        const z = d.place[c.dataset.k];
        const host = z ? root.querySelector(`.ci-zone[data-z="${z}"] .ci-drop`) : $('#pool');
        if (c.parentElement !== host) host.appendChild(c);
        c.classList.toggle('sel', sel === c.dataset.k);
      });
      root.querySelectorAll('.ci-zone').forEach((zn) => { zn.querySelector('.ci-n').textContent = zn.querySelectorAll('.ci-chip').length; });
      const left = DATA.length - Object.keys(d.place).length;
      $('#help').textContent = left ? `Tap a piece of data, then tap a circle (or drag it). ${left} left to place.` : 'All placed! You can still move them. Now explain your choices below.';
      $('#pool').hidden = !left;
      $('#reasons').hidden = !!left;
      if (!left) drawReasons();
    }
    function drawReasons() {
      const used = ZONES.filter(([z]) => Object.values(d.place).includes(z));
      const have = [...$('#rs').querySelectorAll('textarea')].map((t) => t.dataset.z).join();
      if (have === used.map(([z]) => z).join()) return;
      $('#rs').innerHTML = used.map(([z, e, n]) => `<label class="ci-why"><span>${e} ${n}</span><textarea rows="2" data-z="${z}" placeholder="I would share this with ${n.toLowerCase()} because…">${FD.esc(d.why[z] || '')}</textarea></label>`).join('');
      $('#rs').querySelectorAll('textarea').forEach((t) => t.addEventListener('input', () => { d.why[t.dataset.z] = t.value; FD.save(); }));
    }
    function place(k, z) {
      if (z) d.place[k] = z; else delete d.place[k];
      sel = null;
      FD.save();
      draw();
      const name = DATA[k][0], r = z && RISK[z] && RISK[z][name];
      const box = $('#risk');
      if (r) {
        box.innerHTML = `<div class="ci-alert ${z}"><b>What could happen?</b> ${r}</div>`;
        FD.pulse(box.firstElementChild);
      } else if (z) box.innerHTML = '';
    }
    root.addEventListener('click', (e) => {
      const chip = e.target.closest('.ci-chip');
      if (chip) { sel = sel === chip.dataset.k ? null : chip.dataset.k; draw(); return; }
      const zone = e.target.closest('.ci-zone, .ci-pool');
      if (zone && sel != null) place(sel, zone.dataset.z);
    });
    root.addEventListener('dragstart', (e) => { const c = e.target.closest('.ci-chip'); if (c) { e.dataTransfer.setData('text/plain', c.dataset.k); sel = c.dataset.k; } });
    root.querySelectorAll('.ci-zone, .ci-pool').forEach((z) => {
      z.addEventListener('dragover', (e) => { e.preventDefault(); z.classList.add('over'); });
      z.addEventListener('dragleave', () => z.classList.remove('over'));
      z.addEventListener('drop', (e) => { e.preventDefault(); z.classList.remove('over'); const k = e.dataTransfer.getData('text/plain'); if (k !== '') place(k, z.dataset.z); });
    });
    $('#save').addEventListener('click', () => {
      const used = ZONES.filter(([z]) => Object.values(d.place).includes(z));
      const filled = used.filter(([z]) => (d.why[z] || '').trim().length > 8);
      if (filled.length < Math.min(3, used.length)) {
        $('#msg').innerHTML = `<b class="bad">Write a reason for at least ${Math.min(3, used.length)} circles.</b>`;
        FD.shake($('#rs'));
        return;
      }
      const lines = used.map(([z, e, n]) => [`${n}: ${DATA.filter((x, k) => d.place[k] === z).map((x) => x[0]).join(', ')}`, `     Why: ${(d.why[z] || '').trim().replace(/\s+/g, ' ') || '–'}`]).flat();
      const risky = Object.entries(d.place).filter(([k, z]) => RISK[z] && RISK[z][DATA[k][0]]).length;
      lines.push(`Risky choices (data that could be misused where I put it): ${risky}`);
      FD.gameDone(ID, { lines });
      $('#msg').innerHTML = '<b class="good">✓ Saved!</b> Your circles and reasons are in your progress report.';
    });
    $('#model').addEventListener('click', () => { $('#mdl').hidden = !$('#mdl').hidden; });
    $('#reset').addEventListener('click', () => { d.place = {}; d.why = {}; FD.save(); $('#rs').innerHTML = ''; $('#risk').innerHTML = ''; draw(); });
    draw();
    return {};
  },
  steps: [
    {
      title: 'Who would you share it with?',
      text: `<p>Here are ten kinds of data that you create when you use technology.</p>
             <p>Put each one in a circle: <strong>completely private</strong>, <strong>family</strong>, <strong>close friends</strong>, <strong>companies</strong> or <strong>completely public</strong>.</p>
             <p>There is no single right answer, but watch out: some choices have <strong>consequences</strong>.</p>`,
      teach: 'Students do this on their own devices (3 min). Walk round and ask: “Why did you put location there?” Then compare two students with different answers.',
      solo: 'Place all ten, then write a reason for each circle and press “Save my circles”.',
    },
    {
      title: 'Explain your choices',
      text: `<p>When everything is placed, write <strong>why</strong> you chose each circle.</p>
             <p>Then press <strong>Compare with an example</strong> to see how another student sorted the same data.</p>`,
      teach: 'Ask: “Did anybody put something in “completely public”? Would you still do it after seeing what could happen?”',
      solo: 'Your circles and reasons go into your progress report for your teacher.',
    },
  ],
});
