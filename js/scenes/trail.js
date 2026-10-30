FD.add({
  id: 'trail',
  title: 'Follow the data trail',
  tab: 'Data trail',
  icon: 'trail',
  color: '--c2',
  section: true,
  interactive: true,
  vocab: [
    ['privacy', 'the protection of an individual’s personal information and the control over how it is used'],
    ['data protection', 'ensuring data is used, collected, shared and stored legally and fairly'],
    ['privacy policy', 'a document that details how organisations use, collect, share and store people’s data'],
  ],
  mount(el) {
    const ID = 'trail';
    // [time, emoji, what Alex does, leaves data?, who collects it, data chips, data points]
    const DAY = [
      ['07:00', '⏰', 'Alex’s sleep-tracking app wakes them up and shows how well they slept.', true, 'The sleep app company now knows when Alex goes to bed and wakes up.', ['😴 sleep pattern', '📱 phone model'], 480],
      ['07:40', '📖', 'Alex reads a paper book at breakfast. The phone stays in their bag.', false, 'A paper book collects nothing! Not everything leaves a trail.', [], 0],
      ['08:15', '🚌', 'Alex taps a bus card and keeps location turned on.', true, 'The bus company and several apps record where Alex goes, and when.', ['📍 home area', '🏫 school', '🕗 daily route'], 2300],
      ['11:00', '🔎', 'At break, Alex searches “how to revise for a maths test”.', true, 'The search engine adds this to Alex’s search history.', ['🔎 search history', '📚 worried about maths'], 950],
      ['13:30', '🛒', 'Alex buys crisps and a drink with a supermarket loyalty app.', true, 'The supermarket logs every purchase, the time and the shop.', ['🛒 purchases', '💷 spending habits'], 610],
      ['17:00', '🎬', 'Alex watches videos and clicks an advert for football trainers.', true, 'The video platform records what Alex watched and which adverts they clicked.', ['🎬 content streamed', '👟 clicked: trainers ad'], 3100],
      ['21:00', '💬', 'Alex chats with friends in a messaging app until late.', true, 'The app can see who Alex talks to, how often, and when.', ['👥 best friends', '💬 conversations', '🌙 online late'], 1800],
    ];
    const OPTS = [{ v: 'yes', label: '✅ Yes, it leaves data', short: 'Yes' }, { v: 'no', label: '🚫 No data', short: 'No' }];
    el.innerHTML = `
      <div class="sim tr">
        <ol class="tr-day" id="day">${DAY.map(([t, e], k) => `<li data-k="${k}"><b>${e}</b><small>${t}</small></li>`).join('')}</ol>
        <div class="tr-main">
          <div class="card tr-moment" id="moment"></div>
          <div class="card tr-prof" data-zone="prof">
            <div class="tr-prof-h"><span class="tr-av">🧑</span><div><b>Alex’s data profile</b><small>What companies have collected today</small></div></div>
            <p class="tr-count"><b id="count">0</b> data points</p>
            <div class="tr-chips" id="chips"></div>
            <div class="tr-guess" id="guess" hidden></div>
          </div>
        </div>
        <div class="ctrls">
          <button class="btn primary small-btn" id="go">▶ Start Alex’s day</button>
          <button class="btn primary small-btn" id="reveal" hidden>👀 Reveal</button>
          <button class="btn primary small-btn" id="nx" hidden>Next moment ▶</button>
          <button class="btn small-btn" id="prof" hidden>🧠 What do they know about Alex?</button>
          <button class="btn ghost small-btn" id="reset">↺ Reset</button>
        </div>
      </div>`;
    const root = el.querySelector('.tr'), $ = (s) => root.querySelector(s);
    let k = -1, count = 0, vote = null, right = 0, dead = false;
    const log = [];

    function setCount(to) {
      const from = count;
      count = to;
      FD.tween(900, (t) => { if (!dead) $('#count').textContent = FD.fmt(from + (to - from) * t); });
    }
    function reset() {
      k = -1; count = 0; right = 0; log.length = 0;
      $('#count').textContent = '0';
      $('#chips').innerHTML = '';
      $('#guess').hidden = true;
      root.querySelectorAll('#day li').forEach((li) => li.classList.remove('cur', 'done'));
      $('#moment').innerHTML = `<p class="tr-intro">Meet <b>Alex</b>, 15. Follow one ordinary school day.</p><p class="muted">At each moment, decide: <b>does this leave a data trail?</b></p>`;
      $('#go').hidden = false; ['#reveal', '#nx', '#prof'].forEach((s) => { $(s).hidden = true; });
    }
    function show() {
      const [t, e, what] = DAY[k];
      root.querySelectorAll('#day li').forEach((li, n) => { li.classList.toggle('cur', n === k); li.classList.toggle('done', n < k); });
      $('#moment').innerHTML = `<p class="tr-time"><span>${e}</span>${t}</p><p class="tr-what">${what}</p><p class="tr-q">Does this leave a data trail?</p><div id="vh"></div><p class="tr-out" id="out" hidden></p>`;
      vote = FD.vote($('#moment').querySelector('#vh'), OPTS, () => { $('#reveal').disabled = false; });
      $('#go').hidden = true; $('#nx').hidden = true;
      $('#reveal').hidden = false;
      $('#reveal').disabled = FD.mode() !== 'class';
    }
    function reveal() {
      const [t, , what, yes, who, chips, n] = DAY[k];
      if (!vote.pick() && !vote.hasTally()) { FD.shake(vote.el); return; }
      const want = yes ? 'yes' : 'no', mine = vote.pick();
      vote.lock(want);
      if (mine === want) right++;
      log.push(`${t} ${what.replace(/<[^>]+>/g, '')}`, `     My answer: ${mine ? (mine === 'yes' ? 'leaves data' : 'no data') : '–'}${mine ? (mine === want ? ' ✓' : ' ✗') : ''}${vote.hasTally() ? ` · Class: ${FD.tallyText(OPTS, vote.tallies())}` : ''}`);
      const out = $('#out');
      out.hidden = false;
      out.className = 'tr-out ' + (yes ? 'bad' : 'good');
      out.innerHTML = `<b>${yes ? '📡 Yes!' : '🙂 No!'}</b> ${who}`;
      chips.forEach((c, j) => setTimeout(() => { if (!dead) $('#chips').insertAdjacentHTML('beforeend', `<span class="tr-chip">${c}</span>`); }, FD.dur(250 * j)));
      if (n) setCount(count + n);
      $('#reveal').hidden = true;
      if (k < DAY.length - 1) $('#nx').hidden = false;
      else { $('#prof').hidden = false; root.querySelector('#day li:last-child').classList.add('done'); }
    }
    function profile() {
      const g = $('#guess');
      g.hidden = false;
      g.innerHTML = `<p><b>From today alone, a company could guess that Alex…</b></p>
        <ul><li>is a teenager who goes to school near home</li><li>sleeps only about 6 hours</li><li>is worried about a maths test</li><li>likes football and wants new trainers</li><li>has two best friends and is online late</li></ul>
        <p class="tr-ad">📢 <b>Advert for Alex tomorrow:</b> “Football trainers, 20% off at a shop near your school!”</p>`;
      FD.pulse(g);
      $('#prof').hidden = true;
      FD.gameDone(ID, { score: right, total: DAY.length, lines: [`Correct predictions: ${right} of ${DAY.length} · data points collected: ${FD.fmt(count)}`, ...log] });
    }
    $('#go').addEventListener('click', () => { k = 0; show(); });
    $('#reveal').addEventListener('click', reveal);
    $('#nx').addEventListener('click', () => { k++; show(); });
    $('#prof').addEventListener('click', profile);
    $('#reset').addEventListener('click', reset);
    reset();
    return {
      reset,
      focus: (z) => FD.focus(root, z),
      destroy() { dead = true; },
    };
  },
  steps: [
    {
      title: 'An ordinary day',
      text: `<p>This is <strong>Alex</strong>. Follow seven moments of Alex’s school day.</p>
             <p>At each moment, decide together: <strong>does this leave a data trail?</strong> Then press <strong>Reveal</strong>.</p>`,
      teach: 'Read each moment aloud. Hands up for “Yes” and “No”, count them with + / −, then press Reveal. Ask: “Who collects this data?”',
      solo: 'Press “Start Alex’s day”, choose Yes or No for each moment, then press Reveal.',
      on: (a) => a.focus(null),
    },
    {
      title: 'Watch the profile grow',
      text: `<p>Every time Alex uses a phone, an app or a card, someone <strong>collects data</strong>.</p>
             <p>Look at the <strong>data profile</strong> on the right. It grows all day, and Alex has not done anything unusual.</p>`,
      teach: 'When the day ends, press “What do they know about Alex?”. Ask: “Is anything in this profile something Alex would want to keep private?”',
      solo: 'After the last moment, press “What do they know about Alex?”.',
      on: (a) => a.focus('prof'),
    },
    {
      title: 'Three key words',
      text: `<p><strong>Privacy</strong> is the protection of your personal information and your <em>control</em> over how it is used.</p>
             <p><strong>Data protection</strong> means making sure data is used, collected, shared and stored <em>legally and fairly</em>.</p>
             <p>A <strong>privacy policy</strong> is the document where an organisation explains how it uses, collects, shares and stores your data.</p>`,
      teach: 'Ask: “Did Alex ever read a privacy policy today?” Lead into the next game: who would YOU share your data with?',
      solo: 'Read the three key words (they are also in the Key words box). Then press Next.',
      on: (a) => a.focus(null),
    },
  ],
});
