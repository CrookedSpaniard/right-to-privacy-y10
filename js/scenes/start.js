FD.add({
  id: 'start',
  title: 'Start here',
  tab: 'Start',
  icon: 'start',
  color: '--accent',
  page: true,
  mount(el) {
    const S = FD.state;
    const nodes = [[60, 45, '📍'], [160, 25, '🔎'], [265, 30, '🛒'], [360, 55, '💬'], [55, 180, '📷'], [150, 205, '🎵'], [265, 205, '📇'], [360, 175, '🎂']];
    const done = (s) => !!(S.games[s.id] && S.games[s.id].done);
    const part = (p) => `
      <section class="card st-part">
        <h3>Part ${p} · ${FD.PARTS[p].name} <small>${FD.PARTS[p].pages}</small></h3>
        <ul class="st-list">${FD.SECTIONS.filter((s) => s.part === p).map((s) => `
          <li><button data-go="${s.id}" style="--c:var(${s.color})">${FD.icon[s.id]}<span><b>${s.bonus ? '★' : FD.SECTIONS.indexOf(s) + 1 + '.'} ${s.name} <i class="st-mode">${s.mode === 'together' ? '👥 together' : '👤 on your own'}</i></b><small>${s.line}</small></span>${done(s) ? '<span class="st-done" title="Done">✓</span>' : ''}</button></li>`).join('')}
          ${p === 'B' ? `<li><button data-go="quiz" style="--c:var(--red-ui)">${FD.icon.final}<span><b>Exit ticket <i class="st-mode">👤 on your own</i></b><small>7 quick questions + 1 written answer</small></span>${S.tests.quiz && S.tests.quiz.done ? '<span class="st-done">✓</span>' : ''}</button></li>` : ''}
        </ul>
      </section>`;
    el.innerHTML = `
      <section class="card st-hero">
        <div>
          <p class="kick">Year 10 · Online Safety</p>
          <h2>Right to privacy</h2>
          <p>Every day you leave a trail of data behind you. Who is allowed to collect it, keep it and look at it? In this lesson you will <b>play your way through the laws that protect your privacy</b> in the UK and decide <b>how much privacy a society should have</b>.</p>
          <div class="who">
            <label>Your name<input id="sName" autocomplete="name" placeholder="First name and surname" value="${FD.esc(S.name)}"></label>
            <label>Class<input id="sClass" placeholder="e.g. 10A" value="${FD.esc(S.cls)}"></label>
          </div>
          <p class="small" id="sMsg">Your name goes on the answers you send to your teacher.</p>
          <div class="chk-btns">
            <button class="btn primary" id="sGo">${S.last && S.last !== 'start' ? '▶ Continue where I left off' : '▶ Start the lesson'}</button>
            <button class="btn ghost" id="sProg" style="color:#fff;border-color:rgb(255 255 255 / .4)">${FD.icon.progress} My progress</button>
          </div>
        </div>
        <svg class="st-net" viewBox="0 0 420 230" role="img" aria-label="Different kinds of personal data around one person">
          ${nodes.map(([x, y]) => `<line x1="${x}" y1="${y}" x2="210" y2="115"/>`).join('')}
          <rect class="nd" x="182" y="88" width="56" height="54" rx="8"/><text x="210" y="124" style="font-size:26px">🧑</text>
          ${nodes.map(([x, y, e]) => `<circle class="nd" cx="${x}" cy="${y}" r="25"/><text x="${x}" y="${y + 8}" style="font-size:23px">${e}</text>`).join('')}
        </svg>
      </section>

      <section class="card st-modes">
        <h3>How are you using this lesson?</h3>
        <div class="st-mode-cards">
          <button class="st-mc" data-m="class"><span class="st-mc-e">👥</span><b>Class mode</b><small>The teacher leads on the projector. Together games show hands-up counters, a timer and teacher notes.</small></button>
          <button class="st-mc" data-m="solo"><span class="st-mc-e">👤</span><b>Solo mode</b><small>You work on your own laptop or iPad. You make every choice yourself and get instructions on the right.</small></button>
        </div>
        <p class="small muted">You can change mode at any time with the button at the top of the page. Your answers are saved in both modes.</p>
      </section>

      <section class="card">
        <h3>In this lesson, you will</h3>
        <ol class="st-goals">
          <li><span class="qn">1</span>Investigate the legal rights to privacy within the UK</li>
          <li><span class="qn">2</span>Recognise the UK laws that protect privacy and what each one does</li>
          <li><span class="qn">3</span>Debate the importance of the right to privacy</li>
        </ol>
      </section>

      <div class="st-cols">${part('A')}${part('B')}</div>

      <section class="card">
        <h3>How to use this website</h3>
        ${FD.HOWTO}
      </section>
      <p class="small muted">Want to repeat the lesson from zero? <button class="link-btn danger" id="sReset">↺ Reset my progress</button></p>
      <p class="small muted">Your progress is saved in this browser only. Nothing is sent to the internet. Every app, company, person and case here is made up for the lesson. Never type real passwords or personal details into this website.</p>
      <p class="small muted">Based on Oak National Academy, KS4 Computing, Online safety, “Right to privacy” (© Oak National Academy 2025, produced in partnership with the Raspberry Pi Foundation), licensed under the Open Government Licence v3.0. Adapted and turned into games for the British School Alzira · Xàtiva · Gandia Group.</p>`;
    const $ = (s) => el.querySelector(s);
    const drawModes = () => el.querySelectorAll('.st-mc').forEach((b) => { const on = b.dataset.m === FD.mode(); b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
    el.querySelectorAll('.st-mc').forEach((b) => b.addEventListener('click', () => { FD.setMode(b.dataset.m); drawModes(); }));
    drawModes();
    $('#sName').addEventListener('input', (e) => { FD.state.name = e.target.value; FD.save(); });
    $('#sClass').addEventListener('input', (e) => { FD.state.cls = e.target.value; FD.save(); });
    $('#sGo').addEventListener('click', () => {
      if (FD.state.last && FD.state.last !== 'start') FD.goto(FD.state.last, FD.state.step || 0);
      else FD.goto('recap');
    });
    $('#sProg').addEventListener('click', FD.openProgress);
    $('#sReset').addEventListener('click', () => FD.openProgress('reset'));
    el.querySelectorAll('[data-go]').forEach((b) => b.addEventListener('click', () => FD.goto(b.dataset.go)));
  },
});
