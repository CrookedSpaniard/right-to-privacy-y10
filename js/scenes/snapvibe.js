FD.add({
  id: 'snapvibe',
  title: 'Install SnapVibe',
  tab: 'SnapVibe',
  icon: 'snapvibe',
  color: '--c6',
  section: true,
  interactive: true,
  vocab: [
    ['terms and conditions', 'the rules you agree to when you sign up; they include the privacy policy'],
    ['permission', 'access you give an app to part of your device, such as the camera or contacts'],
    ['forfeit', 'to give up a right, often without realising it'],
  ],
  mount(el) {
    const ID = 'snapvibe';
    // [id, emoji, name, why the app says it needs it, cost in privacy points, needed for a photo app?]
    const PERMS = [
      ['contacts', '📇', 'your contacts', 'to help you find your friends', 15, false],
      ['camera', '📷', 'your camera', 'to take photos and videos', 8, true],
      ['mic', '🎙️', 'your microphone', 'to add sound to your videos', 12, false],
      ['location', '📍', 'your location, all the time', 'to show you local vibes', 20, false],
      ['apps', '📲', 'the other apps on your phone', 'to improve your experience', 12, false],
      ['device', '🔋', 'your device: make, model and battery', 'to make SnapVibe run smoothly', 8, false],
    ];
    const d = FD.gameData(ID);
    d.rounds = d.rounds || [];
    el.innerHTML = `
      <div class="sim sv">
        <div class="sv-phone"><div class="sv-notch"></div><div class="sv-scr" id="scr"></div></div>
        <div class="sv-side">
          <div class="card sv-knows">
            <h4>👁️ What SnapVibe can now get</h4>
            <ul id="knows">${PERMS.map(([id, e, n]) => `<li data-id="${id}"><span>${e}</span>${n}</li>`).join('')}
              <li data-id="partners"><span>🤝</span>shared with 312 “partners”</li></ul>
            <div class="sv-score"><span>Privacy score</span><b id="score">100</b><span class="bar"><i id="sbar" style="--v:100%"></i></span></div>
          </div>
          <div class="card sv-cmp" id="cmp" hidden></div>
        </div>
        <div class="ctrls"><button class="btn ghost small-btn" id="restart">↺ Start again from zero</button></div>
      </div>`;
    const root = el.querySelector('.sv'), $ = (s) => root.querySelector(s);
    let R = null, pi = 0;

    function round() { return { read: false, readSecs: 0, partners: true, allowed: [], score: 100 }; }
    function calc() {
      let s = 100;
      R.allowed.forEach((id) => { s -= PERMS.find((p) => p[0] === id)[4]; });
      if (R.partners) s -= 25;
      R.score = Math.max(0, s);
      $('#score').textContent = R.score;
      $('#sbar').style.setProperty('--v', R.score + '%');
      $('#sbar').parentElement.classList.toggle('low', R.score < 50);
      root.querySelectorAll('#knows li').forEach((li) => li.classList.toggle('on', li.dataset.id === 'partners' ? R.partners && R.signed : R.allowed.includes(li.dataset.id)));
    }
    const scr = (html) => { $('#scr').innerHTML = html; $('#scr').scrollTop = 0; };

    function welcome() {
      R = round();
      pi = 0;
      calc();
      const n = d.rounds.length + 1;
      scr(`<div class="sv-hero"><p class="sv-logo">🎵 SnapVibe</p><p>Share your vibe with friends!</p></div>
        <div class="sv-form">
          ${n > 1 ? '<p class="sv-r2">Round 2: this time, try to protect your privacy.</p>' : ''}
          <label>Username<input value="${FD.esc((FD.state.name || 'you').split(' ')[0].toLowerCase())}_vibes" aria-label="Username"></label>
          <label class="sv-tick"><input type="checkbox" id="agree"> I agree to the <button class="link-btn" id="terms">Terms &amp; Conditions</button> and Privacy Policy</label>
          <label class="sv-tick sv-tiny"><input type="checkbox" id="partners" checked> Share my data with our trusted partners to personalise my experience</label>
          <button class="btn primary sv-go" id="create">Create account</button>
        </div>`);
      $('#terms').addEventListener('click', (e) => { e.preventDefault(); terms(); });
      $('#partners').addEventListener('change', (e) => { R.partners = e.target.checked; });
      $('#create').addEventListener('click', () => {
        if (!$('#agree').checked) { FD.shake($('#agree').parentElement); return; }
        R.signed = true;
        calc();
        perm();
      });
    }
    function terms() {
      const t0 = Date.now(), keep = { agree: $('#agree').checked, partners: $('#partners').checked };
      scr(`<div class="sv-terms">
          <p class="sv-th">Terms &amp; Conditions · 14,382 words</p>
          <p>1.1 By using SnapVibe you agree to these terms. 1.2 SnapVibe may update these terms at any time without notice…</p>
          <p class="sv-hl"><b>4.2 What we collect.</b> Your contacts, photos, camera, microphone, precise location, the list of apps installed on your device, your device make and model and its battery level.</p>
          <p>4.3 We may also collect information about you from your friends, even if you do not have an account.</p>
          <p class="sv-hl"><b>5.1 How we use it.</b> To show you personalised adverts and to improve our services.</p>
          <p class="sv-hl"><b>6.4 Who we share it with.</b> We may share or sell your data to our advertising and analytics partners (currently 312 companies).</p>
          <p>7.9 Data shared with partners is covered by their own privacy policies.</p>
          <p class="sv-hl"><b>9.3 Withdrawing consent.</b> If you delete your account, data already shared with partners cannot be recalled.</p>
          <p>12.8 These terms are governed by the laws of a country you have never visited…</p>
          <p class="sv-th">Reading every word would take about <b>60 minutes</b>.</p>
          <button class="btn sv-go" id="back">I have read it: go back</button>
        </div>`);
      $('#back').addEventListener('click', () => {
        R.read = true;
        R.readSecs = Math.round((Date.now() - t0) / 1000);
        const r = R;
        welcome();
        R = r;
        $('#agree').checked = keep.agree;
        $('#partners').checked = keep.partners;
        R.partners = keep.partners;
        calc();
      });
    }
    function perm() {
      if (pi >= PERMS.length) return done();
      const [id, e, n, why] = PERMS[pi];
      scr(`<div class="sv-feed-bg">🎵 SnapVibe</div>
        <div class="sv-ask"><p class="sv-ask-e">${e}</p><p><b>Allow “SnapVibe” to access ${n}?</b></p><p class="sv-why">SnapVibe uses this ${why}.</p>
          <div class="sv-btns"><button class="sv-b" data-a="no">Don’t allow</button><button class="sv-b sv-ok" data-a="yes">Allow</button></div></div>
        <p class="sv-step">${pi + 1} / ${PERMS.length}</p>`);
      $('#scr').querySelectorAll('.sv-b').forEach((b) => b.addEventListener('click', () => {
        if (b.dataset.a === 'yes') R.allowed.push(id);
        calc();
        pi++;
        perm();
      }));
    }
    function done() {
      d.rounds.push({ ...R });
      FD.save();
      const facts = [];
      if (R.allowed.includes('contacts')) facts.push('📇 Your friends’ numbers are now uploaded too, and they never agreed!');
      if (R.allowed.includes('location')) facts.push('📍 SnapVibe knows where you live, where you go to school and where you are right now.');
      if (R.allowed.includes('mic')) facts.push('🎙️ The app can use the microphone whenever it is open.');
      if (R.allowed.includes('apps')) facts.push('📲 Some apps know every other app you have installed.');
      if (R.allowed.includes('device')) facts.push('🔋 Some apps know your phone model and how much battery you have left.');
      if (R.partners) facts.push('🤝 Your data now goes to 312 companies you have never heard of. Deleting your account will not get it back.');
      if (!facts.length) facts.push('🛡️ Excellent: you gave away very little. SnapVibe still works for photos!');
      scr(`<div class="sv-end"><p class="sv-logo">🎵 Welcome!</p><p>Your privacy score: <b class="sv-big">${R.score}</b>/100</p>
        <ul class="sv-facts">${facts.map((f) => `<li>${f}</li>`).join('')}</ul>
        ${d.rounds.length === 1 ? '<button class="btn primary sv-go" id="again">↺ Play again and protect yourself</button>' : '<button class="btn sv-go" id="again">↺ Try another round</button>'}</div>`);
      $('#again').addEventListener('click', welcome);
      compare();
      const r = d.rounds, last = r[r.length - 1], first = r[0];
      const line = (x, k) => `Round ${k + 1}: score ${x.score}/100 · terms ${x.read ? `read (${x.readSecs} s)` : 'not read'} · partners box ${x.partners ? 'left ticked' : 'unticked'} · allowed: ${x.allowed.length ? x.allowed.map((id) => PERMS.find((p) => p[0] === id)[2]).join(', ') : 'nothing'}`;
      FD.gameDone(ID, { score: Math.max(...r.map((x) => x.score)), total: 100, lines: [...r.map(line), r.length > 1 ? `Improvement from round 1 to round ${r.length}: ${last.score - first.score >= 0 ? '+' : ''}${last.score - first.score} points` : 'Played one round only.'] });
    }
    function compare() {
      const r = d.rounds;
      if (!r.length) { $('#cmp').hidden = true; return; }
      $('#cmp').hidden = false;
      const shown = r.slice(-2), off = r.length - shown.length;
      $('#cmp').innerHTML = `<h4>📊 Compare your rounds</h4><table class="tbl sv-tbl"><thead><tr><th></th>${shown.map((x, k) => `<th>Round ${off + k + 1}</th>`).join('')}</tr></thead><tbody>
        <tr><th>Read the terms</th>${shown.map((x) => `<td>${x.read ? '✅' : '❌'}</td>`).join('')}</tr>
        <tr><th>Partners box</th>${shown.map((x) => `<td>${x.partners ? '☑️ ticked' : '⬜ unticked'}</td>`).join('')}</tr>
        <tr><th>Permissions given</th>${shown.map((x) => `<td>${x.allowed.length} / ${PERMS.length}</td>`).join('')}</tr>
        <tr><th>Privacy score</th>${shown.map((x) => `<td><b>${x.score}</b></td>`).join('')}</tr></tbody></table>`;
    }
    $('#restart').addEventListener('click', () => { d.rounds = []; FD.save(); compare(); welcome(); });
    welcome();
    compare();
    return {};
  },
  steps: [
    {
      title: 'Sign up for SnapVibe',
      text: `<p>SnapVibe is a new (made-up) app for sharing photos and music with friends. Everybody is using it!</p>
             <p>Create an account and answer the permission questions <strong>as you normally would</strong>. Watch the panel on the right.</p>`,
      teach: 'Students play round 1 on their own, quickly, as they really would. Don’t give hints yet!',
      solo: 'Sign up as you normally would. Be honest: nobody is judging you.',
    },
    {
      title: 'What did you give away?',
      text: `<p>When you agree to the <strong>terms and conditions</strong>, you accept the <strong>privacy policy</strong>: what data the company collects, how it uses it and who it sells it to.</p>
             <p>You may <strong>forfeit</strong> some of your privacy rights, and it gets hard to keep track of who knows what about you.</p>`,
      teach: 'Ask: “Who read the terms? Who noticed the tiny partners box?” Then everyone plays round 2 and tries to beat their score.',
      solo: 'Now play round 2: read the terms, look at every box, and only allow what a photo app really needs.',
    },
    {
      title: 'Did you know…',
      text: `<ul><li>Some social media apps can access your <strong>contacts, camera and microphone</strong>.</li>
             <li>Some apps know <strong>all the other apps</strong> on your phone, its make and model, and its battery level.</li>
             <li>Some platforms share your data with other companies, and some collect data on you <strong>even if you do not have an account</strong>.</li></ul>
             <p>Every app has its own terms. Reading them helps you make an <strong>educated decision</strong>.</p>`,
      teach: 'True or false, hands up: “All apps collect the same data from their users.” (False: each app has its own terms.)',
      solo: 'Compare your two rounds in the table. Your rounds are saved in your report.',
    },
  ],
});
