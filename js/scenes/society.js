FD.add({
  id: 'society',
  title: 'Design your society',
  tab: 'Society',
  icon: 'society',
  color: '--c7',
  section: true,
  interactive: true,
  mount(el) {
    const ID = 'society';
    // Each measure: three positions from no privacy (0) to complete privacy (2): [text, safety, freedom, what happens]
    const M = [
      { id: 'cctv', e: '📹', name: 'CCTV', s: [
        ['There are CCTV cameras in everyone’s home.', 3, 0, 'Almost every crime is caught on camera… but you are filmed in your own bedroom.'],
        ['There are CCTV cameras in all public places.', 2, 2, 'Streets feel safer and crimes are solved faster, but you are watched whenever you go out.'],
        ['There are CCTV cameras in areas of high crime.', 1, 3, 'You are rarely filmed, but some crimes in other areas are never solved.'],
      ] },
      { id: 'media', e: '📸', name: 'Media', s: [
        ['The media can take photos of and publish private information about any citizen without their consent.', 1, 0, 'Anyone could end up on the front page tomorrow, including you.'],
        ['The media can do this without consent, if it is in the public interest.', 2, 2, 'Journalists can expose wrongdoing by powerful people, but someone must decide what “public interest” means.'],
        ['The media can only take photos of and publish private information with informed consent.', 0, 3, 'Your private life is safe, but a dishonest politician could hide a scandal.'],
      ] },
      { id: 'companies', e: '🏢', name: 'Companies', s: [
        ['Companies can collect data on citizens without their consent.', 1, 0, 'Adverts follow you everywhere and you never know who holds your data.'],
        ['Companies must get informed consent, but most people give up their data without reading the terms.', 1, 1, 'This is close to today: consent is asked for, but rarely really given.'],
        ['Companies must get informed consent, and most citizens know their rights and are sceptical about giving up data.', 1, 3, 'People choose carefully what they share; services are less personalised.'],
      ] },
      { id: 'police', e: '👮', name: 'Police', s: [
        ['The police monitor all citizens’ communications, whether or not they have broken the law.', 3, 0, 'Criminals are caught quickly, but innocent people are watched all the time.'],
        ['It is against the law to read someone’s communications or enter their home without their consent.', 2, 2, 'Privacy is protected, with legal exceptions for serious crime and national security.'],
        ['The police cannot infringe your privacy without your consent, even if you have broken the law.', 0, 3, 'Total privacy, even for criminals: some dangerous crimes cannot be investigated.'],
      ] },
    ];
    const d = FD.gameData(ID);
    d.pos = d.pos || { cctv: 1, media: 1, companies: 1, police: 1 };
    d.why = d.why || '';
    el.innerHTML = `
      <div class="sim so">
        <div class="so-grid">
          <div class="so-rows">${M.map((m) => `
            <div class="so-row" data-zone="${m.id}">
              <p class="so-h"><span>${m.e}</span>${m.name}</p>
              <div class="so-track" data-m="${m.id}">${m.s.map((x, k) => `<button data-k="${k}" title="${FD.esc(x[0])}"><i></i></button>`).join('')}</div>
              <div class="so-ends"><small>no privacy</small><small>complete privacy</small></div>
              <p class="so-txt" id="t-${m.id}"></p>
            </div>`).join('')}</div>
          <div class="so-view">
            <svg viewBox="0 0 300 190" class="so-city" role="img" aria-label="A town that changes with your choices">
              <rect x="0" y="150" width="300" height="40" class="so-ground"/>
              <g class="so-bld"><rect x="16" y="88" width="56" height="62"/><path d="M10 90l34-28 34 28z"/><rect x="36" y="118" width="16" height="32" class="so-door"/></g>
              <g class="so-bld"><rect x="112" y="60" width="70" height="90"/><rect x="124" y="74" width="14" height="14" class="so-win"/><rect x="156" y="74" width="14" height="14" class="so-win"/><rect x="124" y="104" width="14" height="14" class="so-win"/><rect x="156" y="104" width="14" height="14" class="so-win"/><text x="147" y="140" class="so-lbl">SHOP</text></g>
              <g class="so-bld"><rect x="220" y="96" width="64" height="54"/><path d="M214 98l38-26 38 26z"/></g>
              <g data-l="cctv"><text x="44" y="108" class="so-e c0">📹</text><text x="147" y="54" class="so-e c01">📹</text><text x="252" y="64" class="so-e c01">📹</text><text x="96" y="146" class="so-e c012">📹</text></g>
              <g data-l="media"><text x="200" y="146" class="so-e c0">📸</text><text x="84" y="80" class="so-e c01">📸</text></g>
              <g data-l="companies"><text x="190" y="40" class="so-e c0">📡</text><text x="120" y="30" class="so-e c01">📊</text><text x="70" y="40" class="so-e c0">📢</text></g>
              <g data-l="police"><text x="262" y="30" class="so-e c0">🛸</text><text x="270" y="146" class="so-e c01">👮</text></g>
              <text x="46" y="80" class="so-e">🙂</text>
            </svg>
            <div class="so-meters">
              <div class="meter"><span class="meter-l">🛡️ Safety and security</span><span class="bar"><i id="mS"></i></span></div>
              <div class="meter"><span class="meter-l">🕊️ Freedom and privacy</span><span class="bar"><i id="mF"></i></span></div>
            </div>
            <p class="so-label" id="lbl"></p>
          </div>
        </div>
        <div class="card so-why" data-zone="why">
          <label><b>Which level of privacy rights is right for society, and why?</b>
            <textarea id="why" rows="3" placeholder="I think society should… because…">${FD.esc(d.why)}</textarea></label>
          <div class="chk-btns"><button class="btn primary small-btn" id="save">✓ Save my society</button><span class="small" id="msg"></span></div>
        </div>
      </div>`;
    const root = el.querySelector('.so'), $ = (s) => root.querySelector(s);

    function draw() {
      let sa = 0, fr = 0;
      M.forEach((m) => {
        const k = d.pos[m.id], st = m.s[k];
        sa += st[1]; fr += st[2];
        root.querySelectorAll(`.so-track[data-m="${m.id}"] button`).forEach((b) => { const on = +b.dataset.k === k; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
        root.querySelector(`.so-track[data-m="${m.id}"]`).style.setProperty('--k', k);
        $('#t-' + m.id).innerHTML = `${st[0]} <span class="so-cons">→ ${st[3]}</span>`;
        // class "c01" = visible at positions 0 and 1
        root.querySelectorAll(`[data-l="${m.id}"] .so-e`).forEach((t) => {
          const c = [...t.classList].find((x) => /^c\d+$/.test(x));
          t.classList.toggle('show', !!c && c.slice(1).includes(String(k)));
        });
      });
      const S = Math.round((100 * sa) / 12), F = Math.round((100 * fr) / 12);
      $('#mS').style.width = S + '%';
      $('#mF').style.width = F + '%';
      $('#lbl').innerHTML = fr <= 3 ? '🚨 <b>Surveillance society</b>: very safe, very little freedom.' : sa <= 3 ? '🔓 <b>Total privacy society</b>: lots of freedom, harder to keep people safe.' : '⚖️ <b>Balanced society</b>: a compromise between safety and privacy.';
      return { S, F };
    }
    root.querySelectorAll('.so-track').forEach((t) => t.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      d.pos[t.dataset.m] = +b.dataset.k;
      FD.save();
      draw();
      FD.pulse($('#t-' + t.dataset.m));
    }));
    $('#why').addEventListener('input', (e) => { d.why = e.target.value; FD.save(); });
    $('#save').addEventListener('click', () => {
      if (d.why.trim().length < 15) { FD.shake($('#why')); $('#msg').innerHTML = '<b class="bad">Write a sentence explaining your choice first.</b>'; return; }
      const { S, F } = draw();
      FD.gameDone(ID, {
        lines: [
          ...M.map((m) => `${m.name}: position ${d.pos[m.id] + 1} of 3 (${['no privacy end', 'middle', 'complete privacy end'][d.pos[m.id]]}) · “${m.s[d.pos[m.id]][0]}”`),
          `Safety ${S}% · freedom ${F}% · ${$('#lbl').textContent.replace(/^\S+\s/, '')}`,
          `Why: ${d.why.trim().replace(/\s+/g, ' ')}`,
        ],
      });
      $('#msg').innerHTML = '<b class="good">✓ Saved in your progress report.</b>';
    });
    draw();
    return { focus: (z) => FD.focus(root, z) };
  },
  steps: [
    {
      title: 'The privacy spectrum',
      text: `<p>A society can give its citizens <strong>no privacy</strong>, <strong>complete privacy</strong>, or anything in between.</p>
             <p>Move each of the four measures along the spectrum and watch what happens to the town and to the two meters.</p>`,
      teach: 'Whole class. For each measure, read the three options and take a hands-up vote, then set the class choice.',
      solo: 'Try the extremes first: everything at “no privacy”, then everything at “complete privacy”.',
      on: (a) => a.focus(null),
    },
    {
      title: 'CCTV',
      text: '<p>Cameras in every home, in all public places, or only in areas of high crime?</p>',
      teach: 'Vote: hands up for each of the three positions. Set the majority. Ask one student who disagrees why.',
      solo: 'Choose the position you think is right and read what happens.',
      on: (a) => a.focus('cctv'),
    },
    {
      title: 'The media',
      text: '<p>Should newspapers be able to publish private information about people without their consent? What about if it is in the <strong>public interest</strong>?</p>',
      teach: 'Vote and set. Ask: “Who decides what the public interest is?”',
      solo: 'Choose the position you think is right.',
      on: (a) => a.focus('media'),
    },
    {
      title: 'Companies',
      text: '<p>Think back to SnapVibe. Which of these is closest to the world today? Which would you like?</p>',
      teach: 'Vote and set. Link back to the SnapVibe game.',
      solo: 'Choose the position you think is right.',
      on: (a) => a.focus('companies'),
    },
    {
      title: 'The police',
      text: '<p>Should the police be able to monitor everyone, only people with a legal reason, or nobody at all?</p>',
      teach: 'Vote and set. Ask: “Who might really need privacy, and what happens if they can’t protect it?”',
      solo: 'Choose the position you think is right.',
      on: (a) => a.focus('police'),
    },
    {
      title: 'Your society',
      text: `<p>Look at your meters. You cannot have <strong>maximum safety and maximum privacy</strong> at the same time.</p>
             <p>Write <strong>which level of privacy rights</strong> you think is right for society, and why. Then save.</p>`,
      teach: 'Each student sets their own version on their device and writes one sentence. Take two contrasting answers.',
      solo: 'Your positions and your reason go into your progress report.',
      on: (a) => a.focus('why'),
    },
  ],
});
