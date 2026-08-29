import * as api from "./api";

// Core game runtime, extracted from the original single-file build.
// Scores, upgrades and idle income are computed by the database
// (see the tnb_* functions); this module renders and animates them.
export function initGame() {
  window.tnbLoadLeaderboard = (limit) => api.leaderboard(limit);

  /* ============================================================
     BACKEND-BACKED GAME STATE
     ------------------------------------------------------------
     `points`, `perClick`, `perSec` and `upgrades` below are a LOCAL
     MIRROR of what the server says is true. The server (see the
     tnb-clicker-backend project) is the actual source of truth:
     - every click sends a request to /api/players/:id/click
     - every purchase sends a request to /api/players/:id/buy
     - the server decides the real score; this page just displays it
       and adds optimistic animation so clicking still feels instant.
     If this page is opened without the backend running alongside it,
     the game still "works" visually but nothing will be saved.
     ============================================================ */

  let points = 0;
  let perClick = 1;
  let perSec = 0;
  let lastMilestone = 0;
  let playerId = window.tnbPlayerId || null;
  let nameLoadedOnce = false;
  let combo = 0;
  let comboTimer = null;
  let xp = 0;
  let pumpPressure = 0;

  const upgrades = []; // populated from the server's response, not hardcoded

  const scoreEl = document.getElementById('score');
  const clickBtn = document.getElementById('clickBtn');
  const panel = document.getElementById('upgradePanel');
  const resetBtn = document.getElementById('resetBtn');
  const resetConfirm = document.getElementById('resetConfirm');
  const resetYes = document.getElementById('resetYes');
  const resetNo = document.getElementById('resetNo');
  const milestoneBarFill = document.getElementById('milestoneBarFill');
  const milestoneLabel = document.getElementById('milestoneLabel');
  const syncStatus = document.getElementById('syncStatus');
  const syncStatusText = document.getElementById('syncStatusText');
  const leaderboardList = document.getElementById('leaderboardList');
  const nameInput = document.getElementById('nameInput');
  const nameSaveBtn = document.getElementById('nameSaveBtn');
  const eventTitle = document.getElementById('eventTitle');
  const eventMessage = document.getElementById('eventMessage');
  const comboPill = document.getElementById('comboPill');
  const pumpMeterFill = document.getElementById('pumpMeterFill');
  const pumpLabel = document.getElementById('pumpLabel');
  const rankXp = document.getElementById('rankXp');
  const rankLabel = document.getElementById('rankLabel');
  const shareCopy = document.getElementById('shareCopy');
  const shareBtn = document.getElementById('shareBtn');

  const buySounds = {
    informant: ()=> playTone(440, 0.12, 'sine', 0.12),
    eyes: ()=> playTone(560, 0.12, 'triangle', 0.12),
    intern: ()=> playSequence([440, 660], 'sine', 60, 0.1),
    redact: ()=> playSequence([500, 750], 'triangle', 60, 0.1),
    bunker: ()=> playSequence([330, 440, 660], 'sine', 70, 0.1)
  };

  function renderPanel(){
    panel.innerHTML = '';
    const icons = { informant:'◉', eyes:'◎', intern:'✦', redact:'▱', bunker:'⬡' };
    upgrades.forEach(u=>{
      const row = document.createElement('div');
      row.className = 'upgrade-card';
      const unit = u.kind === 'sec' ? '/sec' : '/click';
      const canBuy = points >= u.cost;
      const icon = icons[u.id] || '✦';
      row.innerHTML =
        '<div class="upgrade-icon">' + icon + '</div>' +
        '<div class="upgrade-main"><div class="upgrade-top"><span class="upgrade-name">' + escapeHtml(u.name) + '</span><span class="owned">LVL ' + u.owned + '</span></div>' +
        '<div class="upgrade-desc">+' + u.amount + ' $TNB ' + unit + '</div></div>' +
        '<button class="buy-btn" data-id="' + u.id + '" ' + (canBuy ? '' : 'disabled') + '>' +
        '<span>' + u.cost + '</span><small>BUY</small></button>';
      panel.appendChild(row);
    });
    panel.querySelectorAll('.buy-btn').forEach(btn=>{
      btn.addEventListener('click', ()=> buyUpgrade(btn.dataset.id));
    });
  }

  function updateScore(){
    scoreEl.textContent = Math.floor(points).toLocaleString();
    const clickStat = document.getElementById('perClickStat');
    const secStat = document.getElementById('perSecStat');
    if(clickStat) clickStat.textContent = '+' + perClick.toLocaleString() + ' / click';
    if(secStat) secStat.textContent = '+' + perSec.toLocaleString() + ' / sec';
    panel.querySelectorAll('button[data-id]').forEach(btn=>{
      const u = upgrades.find(x=> x.id === btn.dataset.id);
      if(!u) return;
      btn.disabled = points < u.cost;
    });
    updateMilestoneBar();
    updateDegenRank();
    checkMilestone();
  }

  // Slim progress bar showing how close the current score is to the next
  // milestone tier, and which tier (crack / breakthrough / mega) is coming up.
  function updateMilestoneBar(){
    const current = Math.floor(points);
    const base = Math.floor(current / 100) * 100;
    const next = base + 100;
    const pct = ((current - base) / 100) * 100;
    const isMegaNext = next % 1000 === 0;
    const isFestiveNext = next % 500 === 0 && !isMegaNext;
    milestoneBarFill.style.width = pct + '%';
    milestoneBarFill.style.background = isMegaNext ? 'var(--gold)' : isFestiveNext ? 'var(--cyan)' : 'var(--amber)';
    const tierLabel = isMegaNext ? 'MEGA BREAKTHROUGH' : isFestiveNext ? 'BREAKTHROUGH' : 'next CRACK';
    milestoneLabel.textContent = current + ' / ' + next + ' — ' + tierLabel;
  }

  /* === Milestone system ===
     Every 100:  "crack"     — punchy impact + small shake + score flash
     Every 500:  "breakthrough" — fanfare + light burst + particles + medium shake + eye glow
     Every 1000: "mega"      — epic chord + golden explosion + more particles + mega shake
  */
  function checkMilestone(){
    const current = Math.floor(points);
    if(current <= lastMilestone) return;

    const next100 = Math.ceil((lastMilestone + 1) / 100) * 100;
    if(current >= next100){
      lastMilestone = next100;
      const isMega = next100 % 1000 === 0;
      const isFestive = next100 % 500 === 0 && !isMega;

      if(isMega){
        triggerMega(next100);
      } else if(isFestive){
        triggerFestive(next100);
      } else {
        triggerCrack(next100);
      }
    }
  }

  function triggerCrack(milestone){
    playCrackSound();
    screenShake('small');
    scoreEl.classList.add('flash-amber');
    floatText('CRACK! +' + milestone, false);
    burstHype('CRACK', milestone, 'gold', 10, false);
    setTimeout(()=> scoreEl.classList.remove('flash-amber'), 400);
  }

  function triggerFestive(milestone){
    playFanfare();
    screenShake('medium');
    scoreEl.classList.add('flash-cyan');
    clickBtn.classList.add('glow-cyan');
    lightBurst('cyan');
    screenFlash('cyan');
    spawnParticles('cyan', 42);
    burstHype('BREAKTHROUGH', milestone, 'purple', 24, false);
    setTimeout(()=> scoreEl.classList.remove('flash-cyan'), 800);
    setTimeout(()=> clickBtn.classList.remove('glow-cyan'), 1200);
  }

  function triggerMega(milestone){
    playEpic();
    screenShake('mega');
    scoreEl.classList.add('flash-gold');
    clickBtn.classList.add('glow-gold');
    lightBurst('gold');
    screenFlash('gold');
    spawnParticles('gold', 80);
    burstHype('MEGA BREAKTHROUGH', milestone, 'gold', 44, true);
    setTimeout(()=> scoreEl.classList.remove('flash-gold'), 1200);
    setTimeout(()=> clickBtn.classList.remove('glow-gold'), 2000);
  }

  function burstHype(title, milestone, tone, count, mega){
    const overlay=document.createElement('div');
    overlay.className='tnb-fx-overlay show';
    overlay.innerHTML='<div><div class="tnb-fx-title">'+title+'</div><div class="tnb-fx-sub">'+milestone.toLocaleString()+' $TNB · TRUST NOBODY</div></div>';
    document.body.appendChild(overlay);
    const shock=document.createElement('div'); shock.className='tnb-shock show'; document.body.appendChild(shock);
    const ring=document.createElement('div'); ring.className='tnb-ring'; document.body.appendChild(ring);
    document.body.classList.add('tnb-mega-hit');

    const words=mega
      ? ['🚀 SEND IT','🔥 APE IN','💀 NO EXIT','🐋 WHALE MODE','👁️ TRUST NOBODY','💎 DIAMOND HANDS','⚡ FULL SEND','🟣 $TNB']
      : ['🔥 APE IN','👁️ TRUST NOBODY','🚀 SEND IT','⚡ +XP','🦍 DEGEN','💜 $TNB'];
    for(let i=0;i<(mega?words.length:4);i++){
      setTimeout(()=>{
        const w=document.createElement('div');
        w.className='tnb-word '+(i%3===0?'gold':i%3===1?'purple':'white');
        w.textContent=words[i%words.length];
        w.style.left=(20+Math.random()*60)+'vw';
        w.style.top=(35+Math.random()*35)+'vh';
        w.style.fontSize=(12+Math.random()*(mega?18:11))+'px';
        document.body.appendChild(w); setTimeout(()=>w.remove(),1100);
      },i*70);
    }
    for(let i=0;i<count;i++){
      const sp=document.createElement('div'); sp.className='tnb-spark '+tone;
      const angle=Math.random()*Math.PI*2, dist=180+Math.random()*(mega?360:220);
      sp.style.left='50%'; sp.style.top='50%';
      sp.style.color=mega ? (Math.random()>.45?'#f5c35b':'#b85cff') : '#b85cff';
      sp.style.setProperty('--dx',(Math.cos(angle)*dist)+'px');
      sp.style.setProperty('--dy',(Math.sin(angle)*dist)+'px');
      sp.style.width=(3+Math.random()*7)+'px'; sp.style.height=(3+Math.random()*7)+'px';
      document.body.appendChild(sp); setTimeout(()=>sp.remove(),1200);
    }
    setTimeout(()=>{overlay.remove();shock.remove();ring.remove();document.body.classList.remove('tnb-mega-hit')},1300);
  }

  /* === Visual effects === */

  function screenShake(tier){
    const cls = 'shake-' + tier;
    document.body.classList.add(cls);
    const duration = tier === 'mega' ? 800 : tier === 'medium' ? 500 : 300;
    setTimeout(()=> document.body.classList.remove(cls), duration);
  }

  function lightBurst(color){
    const burst = document.createElement('div');
    burst.className = 'light-burst ' + color;
    document.body.appendChild(burst);
    setTimeout(()=> burst.remove(), 1200);
  }

  function screenFlash(color){
    const flash = document.createElement('div');
    flash.className = 'screen-flash ' + color;
    document.body.appendChild(flash);
    setTimeout(()=> flash.remove(), 1000);
  }

  function spawnParticles(color, count){
    const rect = clickBtn.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const colors = color === 'gold'
      ? ['#f5c35b', '#ffd86b', '#b85cff', '#ffffff']
      : ['#b85cff', '#d8a5ff', '#67e8f9', '#ffffff'];
    for(let i = 0; i < count; i++){
      const p = document.createElement('div');
      p.className = 'particle';
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const distance = 120 + Math.random() * 180;
      const size = 4 + Math.random() * 8;
      const dx = Math.cos(angle) * distance;
      const dy = Math.sin(angle) * distance;
      const c = colors[Math.floor(Math.random() * colors.length)];
      p.style.cssText =
        'left:' + cx + 'px;top:' + cy + 'px;' +
        'width:' + size + 'px;height:' + size + 'px;' +
        'background:' + c + ';' +
        'box-shadow:0 0 ' + (size * 2) + 'px ' + c + ';' +
        'transform:translate(-50%,-50%);' +
        'transition:transform 1s cubic-bezier(0.15,0.85,0.25,1),opacity 1s ease-out;';
      document.body.appendChild(p);
      requestAnimationFrame(()=>{
        p.style.transform = 'translate(calc(-50% + ' + dx + 'px), calc(-50% + ' + dy + 'px)) scale(0.2)';
        p.style.opacity = '0';
      });
      setTimeout(()=> p.remove(), 1100);
    }
  }

  // Buying an upgrade is a request to the server, not a local mutation.
  // The server checks affordability itself — even if someone tampered with
  // `points` in the browser console, the purchase would just get rejected
  // because the server's own copy of the score wouldn't have moved.
  async function buyUpgrade(id){
    const u = upgrades.find(x=> x.id === id);
    if(!u || points < u.cost) return;
    try{
      const data = await api.buy(id);
      applyServerState(data);
      if(buySounds[id]) buySounds[id]();
      fetchLeaderboard();
      setSyncStatus(true);
    }catch(e){
      floatText('offline — try again', 'warn');
      setSyncStatus(false);
    }
  }

  function floatText(text, mode){
    const f = document.createElement('div');
    f.className = 'floater';
    if(mode === 'warn') f.classList.add('warn');
    else if(mode === 'festive') f.classList.add('festive');
    else if(mode === 'mega') f.classList.add('mega');
    f.textContent = text;
    const rect = clickBtn.getBoundingClientRect();
    f.style.left = (rect.left + rect.width/2 + (Math.random()*40-20)) + 'px';
    f.style.top = (rect.top + rect.height/2 - 30) + 'px';
    document.body.appendChild(f);
    setTimeout(()=> f.remove(), 800);
  }

  const chaosEvents = [
    ['🐋 WHALE DETECTED','A suspicious wallet just entered the room. Do NOT panic.'],
    ['🚀 PUMP INCOMING','Someone yelled SEND IT. The chart started sweating.'],
    ['💀 RUG ALERT','Trust nobody. Especially that guy promising 100x.'],
    ['🦍 APE MODE','Reason has left the chat. +COMBO energy activated.'],
    ['🧻 PAPER HANDS','Weak hands detected. Diamond hands are watching.'],
    ['👀 DEV WALLET MOVED','You saw nothing. Keep clicking.'],
    ['🔥 SEND IT','The timeline is bullish for absolutely no reason.'],
    ['☠️ JEET WARNING','Somebody sold the bottom. Classic.']
  ];

  function updateDegenRank(){
    const ranks=[['NEWBIE DEGEN',0],['JEET',100],['DEGEN',500],['APE',1000],['CHAD',5000],['WHALE',10000],['SOLANA DEMON',50000]];
    let r=ranks[0][0];
    for(const item of ranks) if(points>=item[1]) r=item[0];
    rankLabel.textContent=r+' · SUSPICION POINTS';
    rankXp.textContent=Math.floor(xp).toLocaleString()+' XP';
  }

  function triggerChaos(){
    const ev=chaosEvents[Math.floor(Math.random()*chaosEvents.length)];
    eventTitle.textContent=ev[0];
    eventMessage.textContent=ev[1];
    pumpPressure=Math.min(100,pumpPressure+Math.floor(5+Math.random()*16));
    pumpMeterFill.style.width=pumpPressure+'%';
    pumpLabel.textContent='PUMP PRESSURE '+pumpPressure+'%';
    if(pumpPressure>=100){
      eventTitle.textContent='🚀🚀 FULL SEND';
      eventMessage.textContent='THE MARKET HAS SPOKEN. $TNB IS COOKING.';
      floatText('🚀 FULL SEND', 'mega');
      screenFlash('gold');
      lightBurst('gold');
      pumpPressure=0;
      pumpMeterFill.style.width='0%';
      pumpLabel.textContent='PUMP PRESSURE 0%';
    }
  }

  function registerCombo(){
    combo=Math.min(999,combo+1);
    clearTimeout(comboTimer);
    comboTimer=setTimeout(()=>{combo=0;comboPill.textContent='COMBO x1';},1400);
    comboPill.textContent='🔥 COMBO x'+combo;
    xp+=Math.max(1,Math.floor(perClick/2));
    if(combo>0 && combo%10===0){
      floatText('🔥 '+combo+' COMBO','festive');
      screenShake('small');
    }
    updateDegenRank();
  }

  function updateShareText(){
    const alias=(nameInput.value.trim()||'Anonymous');
    shareCopy.textContent=alias+' just reached '+Math.floor(points).toLocaleString()+' $TNB with a x'+Math.max(1,combo)+' combo. 👁️ TRUST NOBODY.';
  }

  // Click handler: update the UI immediately (optimistic) so clicking still
  // feels instant, then confirm with the server and snap to its answer.
  // If the request fails (offline, server down), the optimistic local value
  // just stays until the next successful sync — nothing is lost, but nothing
  // is trusted permanently either.
  clickBtn.addEventListener('click', async ()=>{
    points += perClick;
    registerCombo();
    if(Math.random() < 0.12) triggerChaos();
    floatText('+' + perClick);
    playClickSound();
    updateScore();
    updateShareText();

    if(!playerId) return; // not signed in yet

    try{
      const data = await api.click();
      points = data.score; // reconcile with the authoritative server value
      updateScore();
      setSyncStatus(true);
    }catch(e){
      setSyncStatus(false);
    }
  });

  async function resetGame(){
    try{
      const data = await api.reset();
      lastMilestone = 0;
      applyServerState(data);
      playResetSound();
      floatText('reset', 'warn');
      fetchLeaderboard();
    }catch(e){
      floatText('offline — try again', 'warn');
    }
  }

  resetBtn.addEventListener('click', ()=>{
    resetConfirm.classList.add('show');
  });

  resetYes.addEventListener('click', ()=>{
    resetConfirm.classList.remove('show');
    resetGame();
  });

  resetNo.addEventListener('click', ()=>{
    resetConfirm.classList.remove('show');
  });

  // Smooth idle-income ticking between server syncs (purely visual — the
  // server computes the real idle income precisely based on elapsed time,
  // so this local ticking is corrected every few seconds by syncState()).
  setInterval(()=>{
    if(perSec > 0){
      points += perSec / 10;
      updateScore();
    }
  }, 100);

  /* ============================================================
     BACKEND WIRING: player bootstrap, state sync, leaderboard
     ============================================================ */

  function setSyncStatus(online){
    syncStatus.classList.toggle('online', online);
    syncStatus.classList.toggle('offline', !online);
    syncStatusText.textContent = online ? 'synced' : 'offline — retrying…';
  }

  // Turn the server's response shape into the local `upgrades` array shape
  // that renderPanel()/buyUpgrade() already know how to work with.
  function applyServerState(state){
    points = state.score;
    perClick = state.perClick;
    perSec = state.perSec;

    upgrades.length = 0;
    Object.entries(state.upgrades).forEach(([id, def])=>{
      upgrades.push({
        id,
        name: def.name,
        kind: def.perSec > 0 ? 'sec' : 'click',
        amount: def.perSec > 0 ? def.perSec : def.perClick,
        cost: def.nextCost,
        owned: state.owned[id] || 0
      });
    });

    upgrades.sort((a,b)=> a.cost - b.cost);

    if(!nameLoadedOnce){
      nameInput.value = (state.name && state.name !== 'Anonymous') ? state.name : '';
      nameLoadedOnce = true;
    }

    renderPanel();
    updateScore();
  }

  // Create a new anonymous player on first visit, or reuse the one saved
  // in this browser's localStorage. The token is the only "password" —
  // whoever has it can update this player's score, so it's never shown
  // on the leaderboard (only the public id, name and score are).
  // The signed-in user (guest session or Google account) IS the player.
  // All score math happens in the database, so there is nothing secret to
  // keep in localStorage anymore.
  async function syncState(){
    try{
      const state = await api.state();
      if(!state || typeof state.score !== 'number' || !Number.isFinite(state.score) || !state.upgrades){
        throw new Error('invalid player state from server');
      }
      state.score = Math.max(state.score, Number.isFinite(points) ? points : 0);
      applyServerState(state);
      setSyncStatus(true);
    }catch(e){
      setSyncStatus(false);
    }
  }

  function escapeHtml(s){
    return s.replace(/[&<>"']/g, c=> ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  async function fetchLeaderboard(){
    try{
      renderLeaderboard(await api.leaderboard(10));
    }catch(e){ /* leave whatever was last rendered */ }
  }

  function renderLeaderboard(list){
    leaderboardList.innerHTML = '';
    if(!list.length){
      leaderboardList.innerHTML = '<li class="lb-empty">No scores yet — be the first.</li>';
      return;
    }
    list.forEach((p, i)=>{
      const li = document.createElement('li');
      if(p.id === playerId) li.classList.add('you');
      li.innerHTML =
        '<span><span class="lb-rank">#' + (i+1) + '</span>' + escapeHtml(p.name || 'anonymous') + '</span>' +
        '<span>' + p.score + '</span>';
      leaderboardList.appendChild(li);
    });
  }

  nameSaveBtn.addEventListener('click', async ()=>{
    const name = nameInput.value.trim().slice(0, 16) || 'Anonymous';
    try{
      applyServerState(await api.setAlias(name));
      fetchLeaderboard();
    }catch(e){ /* silently ignore — not critical */ }
  });

  shareBtn.addEventListener('click', async ()=>{
    updateShareText();
    const text=shareCopy.textContent+' #TNB #Solana';
    if(navigator.share){
      try{ await navigator.share({title:'$TNB — Trust Nobody',text}); }catch(e){}
    }else{
      try{ await navigator.clipboard.writeText(text); floatText('COPIED 👁️','festive'); }catch(e){ floatText('FLEX IT','festive'); }
    }
  });

  /* === Audio engine === */

  let audioCtx;
  function ctx(){
    if(!audioCtx){ audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
    if(audioCtx.state === 'suspended'){ audioCtx.resume(); }
    return audioCtx;
  }

  function playTone(freq, duration, type, startGain, startTime){
    const ac = ctx();
    const t = startTime || ac.currentTime;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(startGain || 0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start(t);
    osc.stop(t + duration + 0.05);
    return { osc, gain };
  }

  function playSequence(notes, type, gap, gainVal){
    const ac = ctx();
    notes.forEach((freq, i)=>{
      playTone(freq, 0.15, type, gainVal, ac.currentTime + i * (gap || 60) / 1000);
    });
  }

  function playClickSound(){
    playTone(700, 0.05, 'square', 0.06);
  }

  function playResetSound(){
    const ac = ctx();
    playTone(660, 0.15, 'sawtooth', 0.12, ac.currentTime);
    playTone(440, 0.15, 'sawtooth', 0.12, ac.currentTime + 0.08);
    playTone(220, 0.2, 'sawtooth', 0.12, ac.currentTime + 0.16);
  }

  /* Noise helper — generates a filtered noise buffer source */
  function createNoise(durationSec, filterType, filterFreq, filterRampTo){
    const ac = ctx();
    const len = Math.floor(ac.sampleRate * durationSec);
    const buffer = ac.createBuffer(1, len, ac.sampleRate);
    const data = buffer.getChannelData(0);
    for(let i = 0; i < len; i++){
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 1.5);
    }
    const src = ac.createBufferSource();
    src.buffer = buffer;
    const filter = ac.createBiquadFilter();
    filter.type = filterType || 'lowpass';
    filter.frequency.setValueAtTime(filterFreq || 2000, ac.currentTime);
    if(filterRampTo){
      filter.frequency.exponentialRampToValueAtTime(filterRampTo, ac.currentTime + durationSec);
    }
    src.connect(filter);
    return { src, filter, ac };
  }

  /* Tier 1: Crack — short punchy impact at every 100 */
  function playCrackSound(){
    const ac = ctx();
    const now = ac.currentTime;

    // Punchy mid-frequency thump
    const thump = ac.createOscillator();
    const thumpGain = ac.createGain();
    thump.type = 'square';
    thump.frequency.setValueAtTime(200, now);
    thump.frequency.exponentialRampToValueAtTime(60, now + 0.15);
    thumpGain.gain.setValueAtTime(0.25, now);
    thumpGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);
    thump.connect(thumpGain);
    thumpGain.connect(ac.destination);
    thump.start(now);
    thump.stop(now + 0.25);

    // Sharp crack noise
    const n = createNoise(0.15, 'highpass', 3000);
    const nGain = ac.createGain();
    nGain.gain.setValueAtTime(0.2, now);
    nGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
    n.filter.connect(nGain);
    nGain.connect(ac.destination);
    n.src.start(now);
    n.src.stop(now + 0.15);
  }

  /* Tier 2: Fanfare — triumphant ascending arpeggio at every 500 */
  function playFanfare(){
    const ac = ctx();
    const now = ac.currentTime;

    // Ascending major arpeggio: C5, E5, G5, C6
    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((freq, i)=>{
      const t = now + i * 0.08;
      // Main note
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.2, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);
      osc.connect(gain);
      gain.connect(ac.destination);
      osc.start(t);
      osc.stop(t + 0.45);

      // Harmony octave above, softer
      const osc2 = ac.createOscillator();
      const gain2 = ac.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(freq * 2, t);
      gain2.gain.setValueAtTime(0, t);
      gain2.gain.linearRampToValueAtTime(0.08, t + 0.02);
      gain2.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
      osc2.connect(gain2);
      gain2.connect(ac.destination);
      osc2.start(t);
      osc2.stop(t + 0.35);
    });

    // Cymbal-like crash at the start
    const n = createNoise(0.5, 'highpass', 5000);
    const nGain = ac.createGain();
    nGain.gain.setValueAtTime(0.15, now);
    nGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);
    n.filter.connect(nGain);
    nGain.connect(ac.destination);
    n.src.start(now);
    n.src.stop(now + 0.5);

    // Final sustained chord
    const finalT = now + 0.35;
    [523.25, 659.25, 783.99].forEach(freq=>{
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, finalT);
      gain.gain.setValueAtTime(0, finalT);
      gain.gain.linearRampToValueAtTime(0.12, finalT + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, finalT + 0.8);
      osc.connect(gain);
      gain.connect(ac.destination);
      osc.start(finalT);
      osc.stop(finalT + 0.85);
    });
  }

  /* Tier 3: Epic — full cinematic chord progression at every 1000 */
  function playEpic(){
    const ac = ctx();
    const now = ac.currentTime;

    // Deep boom
    const boom = ac.createOscillator();
    const boomGain = ac.createGain();
    boom.type = 'sine';
    boom.frequency.setValueAtTime(80, now);
    boom.frequency.exponentialRampToValueAtTime(30, now + 0.8);
    boomGain.gain.setValueAtTime(0.4, now);
    boomGain.gain.exponentialRampToValueAtTime(0.0001, now + 1);
    boom.connect(boomGain);
    boomGain.connect(ac.destination);
    boom.start(now);
    boom.stop(now + 1.05);

    // Ascending epic brass-like arpeggio: C4, E4, G4, C5, E5, G5, C6
    const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50];
    notes.forEach((freq, i)=>{
      const t = now + i * 0.06;
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.12, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
      // Lowpass to soften the sawtooth into a brass-like tone
      const lp = ac.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = freq * 4;
      osc.connect(lp);
      lp.connect(gain);
      gain.connect(ac.destination);
      osc.start(t);
      osc.stop(t + 0.55);
    });

    // Cymbal crash
    const n = createNoise(0.8, 'highpass', 6000);
    const nGain = ac.createGain();
    nGain.gain.setValueAtTime(0.2, now);
    nGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.7);
    n.filter.connect(nGain);
    nGain.connect(ac.destination);
    n.src.start(now);
    n.src.stop(now + 0.8);

    // Grand final chord — C major across two octaves
    const finalT = now + 0.5;
    [261.63, 329.63, 392.00, 523.25, 659.25, 783.99].forEach(freq=>{
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, finalT);
      gain.gain.setValueAtTime(0, finalT);
      gain.gain.linearRampToValueAtTime(0.1, finalT + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.0001, finalT + 1.5);
      osc.connect(gain);
      gain.connect(ac.destination);
      osc.start(finalT);
      osc.stop(finalT + 1.55);
    });

    // High shimmer bell
    const bellT = now + 0.5;
    [1567.98, 2093.00].forEach(freq=>{
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, bellT);
      gain.gain.setValueAtTime(0, bellT);
      gain.gain.linearRampToValueAtTime(0.08, bellT + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, bellT + 1.2);
      osc.connect(gain);
      gain.connect(ac.destination);
      osc.start(bellT);
      osc.stop(bellT + 1.25);
    });
  }

  /* === Boot sequence === */
  (async function init(){
    setSyncStatus(false);
    try{
      await syncState();
      fetchLeaderboard();
      setSyncStatus(true);
    }catch(e){
      milestoneLabel.textContent = 'could not reach the cloud — retrying…';
      setSyncStatus(false);
    }
    // Correct any idle-income drift every few seconds, and refresh the
    // leaderboard periodically so other players' progress shows up too.
    setInterval(syncState, 5000);
    setInterval(fetchLeaderboard, 15000);
  })();
}
