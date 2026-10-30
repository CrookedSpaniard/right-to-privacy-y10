FD.add({
  id: 'inspector',
  title: 'Data Inspector',
  tab: 'Inspector',
  icon: 'inspector',
  color: '--c5',
  section: true,
  interactive: true,
  mount(el) {
    const ID = 'inspector';
    const P = [
      ['fair', '⚖️ Not fair and lawful'],
      ['purpose', '🎯 Not for a specific, necessary purpose'],
      ['accurate', '✅ Not accurate or up to date'],
      ['long', '⏳ Kept for longer than needed'],
      ['secure', '🔐 Not handled securely'],
      ['fine', '👍 This is fine'],
    ];
    // Every clickable item: id → [right answer, explanation]
    const SPOTS = {
      rel: ['purpose', 'A step-counting app does not need to know your religion. Data must be collected for a specific, necessary purpose.'],
      dob: ['accurate', '31/02/2009 is not a real date! Data must be accurate and up to date.'],
      addr: ['accurate', 'Jo told FitTrack they moved in 2022, but the address was never updated.'],
      old: ['long', 'This account was closed in 2014, but the card details are still stored. Data must be kept only as long as it is needed.'],
      pw: ['secure', 'Passwords in plain text, in a spreadsheet anyone with the link can open? Data must be protected against unauthorised access.'],
      sold: ['fair', 'Selling customers’ emails without telling them is not fair or lawful.'],
      steps: ['fine', 'Daily steps are exactly what a step-counting app needs.'],
      email: ['fine', 'An email address is needed to log in and send receipts.'],
      backup: ['fine', 'Encrypted backups are good practice: they keep the data safe.'],
      del: ['fine', 'Deleting data when people ask is what the law expects.'],
    };
    const PROBLEMS = Object.keys(SPOTS).filter((k) => SPOTS[k][0] !== 'fine').length;
    const s = (id, html) => `<span class="ins-s" data-spot="${id}" tabindex="0" role="button">${html}</span>`;
    el.innerHTML = `
      <div class="sim ins">
        <div class="ins-top"><span class="pill">🕵️ Inspecting: FitTrack Ltd (step-counting app)</span><span>Problems found <b id="found">0</b> / ${PROBLEMS}</span><span>Mistakes <b id="miss">0</b></span></div>
        <div class="win">
          <div class="win-bar">FitTrack · customers database</div>
          <div class="win-body">
            <div class="tbl-wrap"><table class="tbl ins-tbl">
              <thead><tr><th>Name</th><th>Date of birth</th><th>Email</th><th>Address</th><th>Religion</th><th>Daily steps</th><th>Account</th></tr></thead>
              <tbody>
                <tr><td>Sam Patel</td><td>14/06/2009</td><td>${s('email', 'sam.p@mail.uk')}</td><td>12 Hill Rd, Leeds</td><td>${s('rel', 'Hindu')}</td><td>${s('steps', '9,812')}</td><td>active</td></tr>
                <tr><td>Jo Smith</td><td>${s('dob', '31/02/2009')}</td><td>jo.s@mail.uk</td><td>${s('addr', '4 Old Lane, York <i class="ins-n">(moved 2022)</i>')}</td><td>Christian</td><td>6,450</td><td>active</td></tr>
                <tr><td>Leo Grant</td><td>02/11/1990</td><td>leo.g@mail.uk</td><td>8 Bay St, Hull</td><td>–</td><td>–</td><td>${s('old', 'closed 2014 · card 4921 •••• 7781 stored')}</td></tr>
              </tbody>
            </table></div>
            <div class="ins-notes">
              <p class="ins-nh">📝 Company notes</p>
              <p>${s('pw', 'Customer passwords are saved in plain text in <b>customers.xlsx</b> (shared: anyone with the link).')}</p>
              <p>${s('sold', 'Sold 40,000 customer emails to BestDeals Marketing. Customers were not told.')}</p>
              <p>${s('backup', 'Backups are encrypted and made every night.')}</p>
              <p>${s('del', 'When a customer asks, we delete their data within one month.')}</p>
            </div>
          </div>
        </div>
        <div class="card ins-pick" id="pick" hidden>
          <p id="pq"><b>What is wrong here?</b></p>
          <div class="ins-opts">${P.map(([v, l]) => `<button class="opt" data-v="${v}">${l}</button>`).join('')}</div>
        </div>
        <p class="sc-fb" id="fb" hidden></p>
        <div class="ctrls">
          <button class="btn primary small-btn" id="end">🏁 Finish the inspection</button>
          <button class="btn ghost small-btn" id="reset">↺ Start again</button>
          <p class="note">Click anything that looks suspicious. Careful: some things are fine!</p>
        </div>
      </div>`;
    const root = el.querySelector('.ins'), $ = (q) => root.querySelector(q);
    let cur = null, found = 0, miss = 0, over = false;
    const log = {};

    function open(sp) {
      if (over || sp.classList.contains('right') || sp.classList.contains('wrong') || sp.classList.contains('okay')) return;
      root.querySelectorAll('.ins-s').forEach((x) => x.classList.toggle('picked', x === sp));
      cur = sp;
      $('#pick').hidden = false;
      $('#pq').innerHTML = `<b>What is wrong here?</b> <span class="muted">“${sp.textContent.trim()}”</span>`;
      $('#fb').hidden = true;
    }
    function answer(v) {
      if (!cur) return;
      const id = cur.dataset.spot, [want, why] = SPOTS[id], ok = v === want;
      cur.classList.remove('picked');
      if (want === 'fine') cur.classList.add(ok ? 'okay' : 'wrong');
      else cur.classList.add(ok ? 'right' : 'wrong');
      if (ok && want !== 'fine') found++;
      if (!ok) miss++;
      log[id] = ok;
      $('#found').textContent = found; $('#miss').textContent = miss;
      const fb = $('#fb');
      fb.hidden = false;
      fb.className = 'sc-fb ' + (ok ? 'good' : 'bad');
      fb.innerHTML = `<b>${ok ? '✓ Well spotted!' : '✗ Not quite.'}</b> ${why}`;
      $('#pick').hidden = true;
      cur = null;
      if (found === PROBLEMS) finish();
    }
    function finish() {
      if (over) return;
      over = true;
      $('#pick').hidden = true;
      root.querySelectorAll('.ins-s').forEach((x) => { const w = SPOTS[x.dataset.spot][0]; if (w !== 'fine' && !x.classList.contains('right')) x.classList.add('missed'); });
      const pts = Math.max(0, found - Math.floor(miss / 2));
      const rank = pts >= 6 ? '🏅 Chief Inspector' : pts >= 4 ? '🥈 Senior Inspector' : pts >= 2 ? '🥉 Junior Inspector' : '📋 Trainee Inspector';
      const fb = $('#fb');
      fb.hidden = false;
      fb.className = 'sc-fb ' + (found === PROBLEMS ? 'good' : 'bad');
      fb.innerHTML = `<b>Inspection complete: ${found} of ${PROBLEMS} problems found, ${miss} mistake${miss === 1 ? '' : 's'}.</b> Rank: <b>${rank}</b>. ${found < PROBLEMS ? 'The problems you missed are now marked with a dashed outline: click one to see why.' : ''}`;
      const lines = [`Problems found: ${found} of ${PROBLEMS} · mistakes: ${miss} · rank: ${rank.replace(/^\S+\s/, '')}`];
      Object.keys(SPOTS).forEach((k) => {
        const [w] = SPOTS[k];
        if (log[k] == null && w === 'fine') return;
        lines.push(`${log[k] ? '✓' : log[k] === false ? '✗' : '○ missed'} ${root.querySelector(`[data-spot="${k}"]`).textContent.trim()} → ${P.find((x) => x[0] === w)[1].replace(/^\S+\s/, '')}`);
      });
      FD.gameDone(ID, { score: found, total: PROBLEMS, lines });
    }
    root.addEventListener('click', (e) => {
      const sp = e.target.closest('.ins-s');
      if (sp && over && sp.classList.contains('missed')) {
        const fb = $('#fb');
        fb.hidden = false; fb.className = 'sc-fb bad';
        fb.innerHTML = `<b>Missed:</b> ${SPOTS[sp.dataset.spot][1]}`;
        return;
      }
      if (sp) open(sp);
      const o = e.target.closest('.ins-opts .opt');
      if (o) answer(o.dataset.v);
    });
    root.addEventListener('keydown', (e) => { const sp = e.target.closest('.ins-s'); if (sp && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); open(sp); } });
    $('#end').addEventListener('click', finish);
    $('#reset').addEventListener('click', () => {
      over = false; found = 0; miss = 0; cur = null;
      Object.keys(log).forEach((k) => delete log[k]);
      root.querySelectorAll('.ins-s').forEach((x) => x.classList.remove('right', 'wrong', 'okay', 'missed', 'picked'));
      $('#found').textContent = 0; $('#miss').textContent = 0; $('#fb').hidden = true; $('#pick').hidden = true;
    });
    return {};
  },
  steps: [
    {
      title: 'You are the Data Inspector',
      text: `<p>FitTrack, a step-counting app, has been reported. Inspect its customer database and its notes.</p>
             <p>Click anything suspicious and say <strong>which data protection principle</strong> it breaks. Six problems are hidden here, and some things are perfectly fine.</p>`,
      teach: 'Students inspect on their own devices (3 min). Then ask: “Which problem would worry you most if it were your data?”',
      solo: 'Find all six problems with as few mistakes as possible. Press “Finish the inspection” if you get stuck.',
    },
  ],
});
