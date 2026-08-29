// Gameplay feel / FX / social layers, extracted from the original single file.
// Each block was an independent IIFE; they stay independent here and are
// started once by initLayers() after the stage markup is mounted.
export function initLayers() {
  /* ---- tnb-v1-runtime ---- */
(()=>{const q=s=>document.querySelector(s),c=q('.clicker');if(!document.querySelector('.tnb-scanline')){const x=document.createElement('div');x.className='tnb-scanline';document.body.appendChild(x)}if(c)c.addEventListener('pointerdown',()=>{c.classList.remove('tnb-hit');void c.offsetWidth;c.classList.add('tnb-hit')},{passive:true});let s=null;for(const x of ['#score','#points','#balance','#scoreEl','[id*="score" i]','[class*="score" i]']){s=q(x);if(s)break}if(s&&window.MutationObserver){new MutationObserver(()=>{s.classList.remove('score-flash');void s.offsetWidth;s.classList.add('score-flash')}).observe(s,{childList:true,subtree:true,characterData:true})}window.tnbV1BreakthroughFX=e=>{const t=e||c||document.body;t.classList.remove('tnb-breakthrough');void t.offsetWidth;t.classList.add('tnb-breakthrough')}})();
  /* ---- tnb-v2-chaos-runtime ---- */
(() => {
  const originalMega = window.tnbV1BreakthroughFX;
  const chaosPhrases = [
    '🚀 FULL SEND','🔥 APE IN','💀 NO EXIT','🐋 WHALE MODE',
    '👁️ TRUST NOBODY','💎 DIAMOND HANDS','⚡ MARKET BROKE','🟣 $TNB',
    '🦍 DEGEN OVERDRIVE','🚨 PAPER HAND ALERT'
  ];

  function pieceCount(mega){ return mega ? 96 : 58; }

  window.tnbV2Breakthrough = function(milestone, mega){
    document.body.classList.add('tnb-v2-chaos');

    const overlay = document.createElement('div');
    overlay.className = 'tnb-v2-overlay on';
    const card = document.createElement('div');
    card.className = 'tnb-v2-card on';
    card.innerHTML =
      '<div class="tnb-v2-kicker">' + (mega ? '🚨 MEGA BREAKTHROUGH 🚨' : '⚡ BREAKTHROUGH') + '</div>' +
      '<div class="tnb-v2-title">' + (mega ? 'FULL SEND' : 'JEBOL!') + '</div>' +
      '<div class="tnb-v2-score">' + Number(milestone).toLocaleString() + ' $TNB</div>' +
      '<div class="tnb-v2-sub">TRUST NOBODY · THE MARKET HAS SPOKEN</div>';
    overlay.appendChild(card);
    document.body.appendChild(overlay);

    for(let r=0;r<6;r++){
      const ring=document.createElement('div');
      ring.className='tnb-v2-ring go';
      ring.style.animationDelay=(r*65)+'ms';
      ring.style.width=(mega?48:38)+'px';
      ring.style.height=(mega?48:38)+'px';
      document.body.appendChild(ring);
      setTimeout(()=>ring.remove(),1500);
    }

    for(let i=0;i<(mega?10:6);i++){
      const bolt=document.createElement('div');
      bolt.className='tnb-v2-bolt go';
      bolt.style.setProperty('--r',(i*(360/(mega?10:6)))+'deg');
      bolt.style.animationDelay=(i*25)+'ms';
      document.body.appendChild(bolt);
      setTimeout(()=>bolt.remove(),800);
    }

    const colors = mega
      ? ['#f5c35b','#ffd86b','#b85cff','#d8a5ff','#ffffff']
      : ['#b85cff','#d8a5ff','#f5c35b','#ffffff'];

    for(let i=0;i<pieceCount(mega);i++){
      const p=document.createElement('div');
      p.className='tnb-v2-piece go';
      const a=Math.random()*Math.PI*2;
      const d=(mega?260:190)+Math.random()*(mega?420:300);
      p.style.setProperty('--x',(Math.cos(a)*d)+'px');
      p.style.setProperty('--y',(Math.sin(a)*d)+'px');
      p.style.setProperty('--rot',((Math.random()*1100)-550)+'deg');
      p.style.color=colors[Math.floor(Math.random()*colors.length)];
      p.style.background=p.style.color;
      p.style.animationDelay=(Math.random()*130)+'ms';
      document.body.appendChild(p);
      setTimeout(()=>p.remove(),1550);
    }

    const tagCount = mega ? 10 : 6;
    for(let i=0;i<tagCount;i++){
      const tag=document.createElement('div');
      tag.className='tnb-v2-tag go';
      tag.textContent=chaosPhrases[(i + Math.floor(Math.random()*chaosPhrases.length)) % chaosPhrases.length];
      tag.style.left=(10+Math.random()*80)+'vw';
      tag.style.top=(22+Math.random()*58)+'vh';
      tag.style.color=colors[i%colors.length];
      tag.style.animationDelay=(i*80)+'ms';
      document.body.appendChild(tag);
      setTimeout(()=>tag.remove(),1550);
    }

    if(typeof originalMega === 'function'){
      try{ originalMega(document.body); }catch(e){}
    }

    setTimeout(()=>{
      overlay.remove();
      document.body.classList.remove('tnb-v2-chaos');
    },1750);
  };

  // Hook the existing milestone functions without changing the server economy.
  const oldFestive = window.triggerFestive;
  const oldMega = window.triggerMega;
  window.triggerFestive = function(m){ if(typeof oldFestive==='function') oldFestive(m); window.tnbV2Breakthrough(m,false); };
  window.triggerMega = function(m){ if(typeof oldMega==='function') oldMega(m); window.tnbV2Breakthrough(m,true); };
})();
  /* ---- tnb-v3-combo-runtime ---- */
(() => {
  let combo = 0;
  let lastTap = 0;
  let decayTimer = null;
  let bestCombo = Number(localStorage.getItem('tnb_best_combo') || 0);

  const WINDOW = 1450;
  const MAX_MULT = 25;

  function multiplier(c){
    if(c >= 25) return 5;
    if(c >= 20) return 4;
    if(c >= 12) return 3;
    if(c >= 7) return 2;
    if(c >= 3) return 1.5;
    return 1;
  }

  function label(c){
    if(c >= 25) return '⚡ OVERDRIVE';
    if(c >= 20) return '🔥 DEGEN MODE';
    if(c >= 12) return '🚀 SEND IT';
    if(c >= 7) return '👁️ APE MODE';
    if(c >= 3) return 'KEEP APEING';
    return 'COMBO START';
  }

  function showCombo(c){
    document.querySelectorAll('.tnb-combo-hud,.tnb-combo-flash').forEach(x=>x.remove());
    const hud=document.createElement('div');
    hud.className='tnb-combo-hud on';
    hud.innerHTML='<div class="tnb-combo-main">COMBO ×'+c+'</div><div class="tnb-combo-sub">'+label(c)+(multiplier(c)>1?' · '+multiplier(c)+'× POWER':'')+'</div>';
    document.body.appendChild(hud);

    const flash=document.createElement('div');
    flash.className='tnb-combo-flash on';
    document.body.appendChild(flash);

    setTimeout(()=>{hud.remove();flash.remove()},600);
  }

  function showBreak(){
    const el=document.createElement('div');
    el.className='tnb-combo-break on';
    el.textContent='💀 JEETED';
    document.body.appendChild(el);
    setTimeout(()=>el.remove(),850);
  }

  function setActive(on){
    document.body.classList.toggle('tnb-combo-active',on);
  }

  function registerTap(){
    const now=performance.now();
    if(now-lastTap <= WINDOW) combo++;
    else combo=1;
    lastTap=now;

    if(combo>bestCombo){
      bestCombo=combo;
      localStorage.setItem('tnb_best_combo',String(bestCombo));
    }

    setActive(combo>=3);
    if(combo>=2) showCombo(combo);

    clearTimeout(decayTimer);
    decayTimer=setTimeout(()=>{
      if(performance.now()-lastTap >= WINDOW){
        if(combo>=3) showBreak();
        combo=0;
        setActive(false);
      }
    },WINDOW+40);
  }

  // Expose a safe hook for the existing click handler.
  window.tnbRegisterTap = registerTap;
  window.tnbGetComboMultiplier = () => multiplier(combo);
  window.tnbGetCombo = () => combo;
  window.tnbGetBestCombo = () => bestCombo;

  // Hook common click/tap entry points without replacing game/server logic.
  document.addEventListener('pointerdown', (e)=>{
    const target=e.target.closest && e.target.closest('.clicker,#clickBtn,[data-clicker]');
    if(target) registerTap();
  }, {passive:true});
})();
  /* ---- tnb-v4-perfect-critical-runtime ---- */
(() => {
  // Timing-based skill layer. It does not modify server score/economy.
  let lastTap = 0;
  let streak = 0;
  let lastQuality = 'normal';
  let bestPerfect = Number(localStorage.getItem('tnb_best_perfect') || 0);
  let bestCritical = Number(localStorage.getItem('tnb_best_critical') || 0);

  // A tap near the user's previous tap rhythm is "Perfect".
  // A slightly wider rhythm window is "Critical".
  const PERFECT_MIN = 115;
  const PERFECT_MAX = 330;
  const CRITICAL_MIN = 70;
  const CRITICAL_MAX = 520;

  function spawn(cls, text){
    const el=document.createElement('div');
    el.className='tnb-hit-label '+cls+' on';
    el.textContent=text;
    el.style.left=(50+(Math.random()*18-9))+'%';
    el.style.top=(44+(Math.random()*14-7))+'%';
    document.body.appendChild(el);
    setTimeout(()=>el.remove(),780);
  }

  function pulse(type){
    const flash=document.createElement('div');
    flash.className=type==='critical'?'tnb-critical-flash on':'tnb-perfect-flash on';
    document.body.appendChild(flash);

    const ring=document.createElement('div');
    ring.className='tnb-timing-ring on';
    document.body.appendChild(ring);

    document.body.classList.remove('tnb-critical-hit','tnb-perfect-hit');
    void document.body.offsetWidth;
    document.body.classList.add(type==='critical'?'tnb-critical-hit':'tnb-perfect-hit');

    setTimeout(()=>{flash.remove();ring.remove();document.body.classList.remove('tnb-critical-hit','tnb-perfect-hit')},650);
  }

  function registerSkillTap(){
    const now=performance.now();
    const delta=lastTap ? now-lastTap : 0;
    lastTap=now;

    if(!delta || delta>CRITICAL_MAX){
      streak=0;
      lastQuality='normal';
      return {quality:'normal', bonus:1};
    }

    let quality='normal';
    if(delta>=PERFECT_MIN && delta<=PERFECT_MAX){
      quality='perfect';
      streak++;
    }else if(delta>=CRITICAL_MIN && delta<=CRITICAL_MAX){
      quality='critical';
      streak++;
    }else{
      streak=0;
    }
    lastQuality=quality;

    if(quality==='perfect'){
      bestPerfect++;
      localStorage.setItem('tnb_best_perfect',String(bestPerfect));
      spawn('perfect', streak>=5 ? '✨ PERFECT ×'+streak : '✨ PERFECT TAP');
      pulse('perfect');
    }else if(quality==='critical'){
      bestCritical++;
      localStorage.setItem('tnb_best_critical',String(bestCritical));
      spawn('critical', streak>=3 ? '🔥 CRITICAL ×'+streak : '🔥 CRITICAL TAP');
      pulse('critical');
    }

    return {
      quality,
      bonus: quality==='perfect' ? 1.5 : quality==='critical' ? 1.25 : 1
    };
  }

  window.tnbSkillTap=registerSkillTap;
  window.tnbGetSkillState=()=>({lastQuality,streak,bestPerfect,bestCritical});

  document.addEventListener('pointerdown',(e)=>{
    const target=e.target.closest && e.target.closest('.clicker,#clickBtn,[data-clicker]');
    if(target) registerSkillTap();
  },{passive:true});
})();
  /* ---- tnb-v5-share-card-runtime ---- */
(() => {
  const MILESTONES = [500,1000,10000,100000];
  let lastScore = 0;
  let bestScore = Number(localStorage.getItem('tnb_best_score') || 0);

  function getText(selectors, fallback=''){
    for(const s of selectors){
      const el=document.querySelector(s);
      if(el && el.textContent.trim()) return el.textContent.trim();
    }
    return fallback;
  }

  function parseNumber(text){
    const n=Number(String(text).replace(/[^0-9.-]/g,''));
    return Number.isFinite(n)?n:0;
  }

  function currentScore(){
    const candidates=[
      '#score','.score','.score-value','.balance','.points',
      '[data-score]','[data-balance]','[data-points]'
    ];
    return parseNumber(getText(candidates,String(lastScore)));
  }

  function playerName(){
    return getText(['#alias','#username','.alias','.username','[data-alias]','[data-username]'],'DEGEN');
  }

  function rankFor(score){
    if(score>=100000) return 'SOLANA DEMON';
    if(score>=10000) return 'MARKET MENACE';
    if(score>=1000) return 'CERTIFIED DEGEN';
    if(score>=500) return 'EARLY APE';
    return 'PAPER HAND IN TRAINING';
  }

  function nearestMilestone(score){
    let m=500;
    for(const x of MILESTONES) if(score>=x) m=x;
    return m;
  }

  function openShare(score){
    score=score||currentScore();
    if(score>bestScore){
      bestScore=score;
      localStorage.setItem('tnb_best_score',String(bestScore));
    }
    drawCard(score);
    document.querySelector('.tnb-share-modal')?.classList.add('on');
  }

  function drawCard(score){
    const canvas=document.getElementById('tnbShareCanvas');
    if(!canvas) return;
    const ctx=canvas.getContext('2d');
    const W=1200,H=1500;
    canvas.width=W;canvas.height=H;

    // Background
    const bg=ctx.createLinearGradient(0,0,W,H);
    bg.addColorStop(0,'#07050b');bg.addColorStop(.55,'#130a20');bg.addColorStop(1,'#050308');
    ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);

    // Atmospheric glow
    const g=ctx.createRadialGradient(W*.5,H*.38,20,W*.5,H*.38,570);
    g.addColorStop(0,'rgba(184,92,255,.28)');
    g.addColorStop(.42,'rgba(184,92,255,.09)');
    g.addColorStop(1,'rgba(184,92,255,0)');
    ctx.fillStyle=g;ctx.fillRect(0,0,W,H);

    // Grid / HUD lines
    ctx.globalAlpha=.16;ctx.strokeStyle='#b85cff';ctx.lineWidth=2;
    for(let y=80;y<H;y+=70){ctx.beginPath();ctx.moveTo(50,y);ctx.lineTo(W-50,y);ctx.stroke()}
    for(let x=60;x<W;x+=120){ctx.beginPath();ctx.moveTo(x,70);ctx.lineTo(x,H-70);ctx.stroke()}
    ctx.globalAlpha=1;

    // Eye mascot
    ctx.save();ctx.translate(W/2,390);
    ctx.shadowColor='#b85cff';ctx.shadowBlur=40;
    ctx.strokeStyle='#b85cff';ctx.lineWidth=12;
    ctx.beginPath();ctx.moveTo(-270,0);ctx.quadraticCurveTo(0,-190,270,0);ctx.quadraticCurveTo(0,190,-270,0);ctx.stroke();
    ctx.shadowBlur=25;ctx.strokeStyle='#f5c35b';ctx.lineWidth=6;
    ctx.beginPath();ctx.ellipse(0,0,100,135,0,0,Math.PI*2);ctx.stroke();
    ctx.fillStyle='#f5c35b';ctx.beginPath();ctx.arc(0,0,24,0,Math.PI*2);ctx.fill();
    ctx.restore();

    ctx.textAlign='center';
    ctx.fillStyle='#f5c35b';ctx.font='900 34px Arial';ctx.letterSpacing='8px';
    ctx.fillText('TRUST NOBODY',W/2,170);

    ctx.fillStyle='#fff';ctx.font='900 78px Arial';
    ctx.fillText('I JUST HIT',W/2,690);

    ctx.shadowColor='#b85cff';ctx.shadowBlur=35;
    ctx.fillStyle='#fff';ctx.font='1000 132px Arial';
    ctx.fillText(Number(score).toLocaleString()+' $TNB',W/2,840);
    ctx.shadowBlur=0;

    ctx.fillStyle='#f5c35b';ctx.font='900 38px Arial';
    ctx.fillText(rankFor(score),W/2,925);

    ctx.fillStyle='#d8a5ff';ctx.font='700 26px Arial';
    ctx.fillText(playerName().slice(0,28),W/2,1000);

    // Footer
    ctx.fillStyle='rgba(255,255,255,.72)';ctx.font='700 25px Arial';
    ctx.fillText('THEY SAID I WAS A DEGEN.',W/2,1165);
    ctx.fillStyle='#fff';ctx.font='1000 32px Arial';
    ctx.fillText('THEY WERE RIGHT.',W/2,1215);

    ctx.fillStyle='#b85cff';ctx.font='900 28px Arial';
    ctx.fillText('#TNB  #SOLANA',W/2,1335);
    ctx.fillStyle='rgba(255,255,255,.45)';ctx.font='600 20px Arial';
    ctx.fillText('TRUST NOBODY · PLAY THE CHAOS',W/2,1400);
  }

  function buildModal(){
    if(document.querySelector('.tnb-share-modal')) return;
    const modal=document.createElement('div');
    modal.className='tnb-share-modal';
    modal.innerHTML=`
      <div class="tnb-share-box" role="dialog" aria-modal="true" aria-label="TNB share flex">
        <div class="tnb-share-head">
          <strong>FLEX YOUR BAG</strong>
          <button class="tnb-share-close" aria-label="Close">×</button>
        </div>
        <div class="tnb-share-canvas-wrap"><canvas id="tnbShareCanvas"></canvas></div>
        <div class="tnb-share-actions">
          <button class="primary" data-share="x">𝕏 SHARE ON X</button>
          <button data-share="download">SAVE IMAGE</button>
          <button data-share="copy">COPY FLEX TEXT</button>
          <button data-share="native">SHARE</button>
        </div>
        <div class="tnb-share-status" aria-live="polite"></div>
      </div>`;
    document.body.appendChild(modal);

    modal.querySelector('.tnb-share-close').onclick=()=>modal.classList.remove('on');
    modal.addEventListener('click',e=>{if(e.target===modal) modal.classList.remove('on')});

    modal.querySelector('[data-share="download"]').onclick=()=>{
      const a=document.createElement('a');
      a.download='tnb-flex-'+currentScore()+'.png';
      a.href=document.getElementById('tnbShareCanvas').toDataURL('image/png');
      a.click();
      status('IMAGE SAVED');
    };

    modal.querySelector('[data-share="copy"]').onclick=async()=>{
      const score=currentScore();
      const text=`👁️ I just hit ${Number(score).toLocaleString()} $TNB\\nThey said I was a degen.\\nThey were right.\\n\\n#TNB #Solana`;
      try{await navigator.clipboard.writeText(text);status('FLEX TEXT COPIED')}
      catch(e){status('COPY NOT AVAILABLE — SELECT TEXT MANUALLY')}
    };

    modal.querySelector('[data-share="x"]').onclick=()=>{
      const score=currentScore();
      const text=encodeURIComponent(`👁️ I just hit ${Number(score).toLocaleString()} $TNB\\nThey said I was a degen. They were right.\\n#TNB #Solana`);
      window.open('https://twitter.com/intent/tweet?text='+text,'_blank','noopener,noreferrer');
      status('OPENING X');
    };

    modal.querySelector('[data-share="native"]').onclick=async()=>{
      const canvas=document.getElementById('tnbShareCanvas');
      try{
        const blob=await new Promise(r=>canvas.toBlob(r,'image/png'));
        const file=new File([blob],'tnb-flex.png',{type:'image/png'});
        if(navigator.share){
          await navigator.share({title:'TNB Flex',text:`I just hit ${Number(currentScore()).toLocaleString()} $TNB 👁️`,files:[file]});
          status('FLEX SHARED');
        }else status('NATIVE SHARE NOT AVAILABLE');
      }catch(e){status('SHARE CANCELLED')}
    };
  }

  function status(t){
    const el=document.querySelector('.tnb-share-status');
    if(el) el.textContent=t;
  }

  function addTrigger(){
    if(document.querySelector('.tnb-share-trigger')) return;
    // Put the trigger near the existing share area if one exists; otherwise append to the main game container.
    const anchor=document.querySelector('.share-panel,.share-section,[data-share-panel]') || document.querySelector('main') || document.body;
    const b=document.createElement('button');
    b.className='tnb-share-trigger';
    b.textContent='👁️ SHARE YOUR FLEX';
    b.onclick=()=>openShare(currentScore());
    anchor.appendChild(b);
  }

  buildModal();
  addTrigger();

  window.tnbOpenShareCard=openShare;
  window.tnbRenderShareCard=drawCard;

  // Expose milestone helper; existing game can call this when a milestone is reached.
  window.tnbShareMilestone=(score)=>{
    if(MILESTONES.includes(Number(score))){
      addTrigger();
      const b=document.querySelector('.tnb-share-trigger');
      if(b){b.classList.add('on');b.textContent='👁️ FLEX '+Number(score).toLocaleString()+' $TNB';}
    }
  };

  // Passive observation of score text for milestone-triggered share CTA.
  const obs=new MutationObserver(()=>{
    const s=currentScore();
    if(s>lastScore){
      const crossed=MILESTONES.some(m=>lastScore<m && s>=m);
      if(crossed){
        addTrigger();
        const b=document.querySelector('.tnb-share-trigger');
        if(b){b.classList.add('on');b.textContent='👁️ SHARE YOUR '+Number(nearestMilestone(s)).toLocaleString()+' $TNB FLEX';}
      }
      lastScore=s;
    }
  });
  obs.observe(document.body,{subtree:true,childList:true,characterData:true});

  // If the existing app exposes score as a global, we can update the share card without replacing it.
  setInterval(()=>{
    const s=currentScore();
    if(s>bestScore) bestScore=s;
    lastScore=s;
  },1000);
})();
  /* ---- tnb-v6-degen-share-runtime ---- */
(() => {
  const moods={
    degen:{title:'I APED IN',sub:'NO PLAN. NO EXIT.',footer:'THEY CALLED IT STUPID. I CALLED IT $TNB.'},
    diamond:{title:'PAPER HANDS LEFT',sub:'I DID NOT.',footer:'DIAMOND HANDS. QUESTIONABLE DECISIONS.'},
    rug:{title:'I SURVIVED THE RUG',sub:'STILL HOLDING $TNB.',footer:'TRUST NOBODY. CHECK YOUR BAG.'},
    chaos:{title:'THE MARKET BROKE',sub:'SO I BROKE IT BACK.',footer:'ABSOLUTE DEGEN BEHAVIOR.'},
    whale:{title:'WHALE ALERT',sub:'SMALL BRAIN. BIG BAG.',footer:'DO NOT COPY MY FINANCIAL DECISIONS.'},
    cooked:{title:'I AM COOKED',sub:'BUT THE BAG IS NOT.',footer:'SEND HELP. OR SEND $TNB.'}
  };
  let mood='degen';

  function findCanvas(){return document.getElementById('tnbShareCanvas')}
  function score(){
    const sels=['#score','.score','.score-value','.balance','.points','[data-score]','[data-balance]','[data-points]'];
    for(const s of sels){const e=document.querySelector(s);if(e&&e.textContent.trim()){const n=Number(e.textContent.replace(/[^0-9.-]/g,''));if(Number.isFinite(n))return n}}
    return Number(localStorage.getItem('tnb_best_score')||0);
  }
  function alias(){
    const sels=['#alias','#username','.alias','.username','[data-alias]','[data-username]'];
    for(const s of sels){const e=document.querySelector(s);if(e&&e.textContent.trim())return e.textContent.trim().slice(0,24)}
    return 'ANONYMOUS DEGEN';
  }
  function rank(s){
    if(s>=100000)return 'SOLANA DEMON';
    if(s>=10000)return 'MARKET MENACE';
    if(s>=1000)return 'CERTIFIED DEGEN';
    if(s>=500)return 'EARLY APE';
    return 'PAPER HAND IN TRAINING';
  }
  function draw(){
    const c=findCanvas(); if(!c)return;
    const ctx=c.getContext('2d'),W=1200,H=1500;
    c.width=W;c.height=H;
    const m=moods[mood],s=score();
    const bg=ctx.createLinearGradient(0,0,W,H);
    bg.addColorStop(0,'#050308');bg.addColorStop(.5,'#160a22');bg.addColorStop(1,'#08050d');
    ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);
    const glow=ctx.createRadialGradient(W*.5,390,15,W*.5,390,590);
    glow.addColorStop(0,'rgba(184,92,255,.34)');glow.addColorStop(.45,'rgba(184,92,255,.08)');glow.addColorStop(1,'rgba(184,92,255,0)');
    ctx.fillStyle=glow;ctx.fillRect(0,0,W,H);

    // meme-style stickers
    ctx.globalAlpha=.18;ctx.strokeStyle='#b85cff';ctx.lineWidth=2;
    for(let y=70;y<H;y+=70){ctx.beginPath();ctx.moveTo(40,y);ctx.lineTo(W-40,y);ctx.stroke()}
    ctx.globalAlpha=1;

    // eye
    ctx.save();ctx.translate(W/2,360);ctx.shadowColor='#b85cff';ctx.shadowBlur=45;
    ctx.strokeStyle='#b85cff';ctx.lineWidth=13;
    ctx.beginPath();ctx.moveTo(-270,0);ctx.quadraticCurveTo(0,-190,270,0);ctx.quadraticCurveTo(0,190,-270,0);ctx.stroke();
    ctx.shadowColor='#f5c35b';ctx.shadowBlur=22;ctx.strokeStyle='#f5c35b';ctx.lineWidth=7;
    ctx.beginPath();ctx.ellipse(0,0,98,132,0,0,Math.PI*2);ctx.stroke();
    ctx.fillStyle='#f5c35b';ctx.beginPath();ctx.arc(0,0,23,0,Math.PI*2);ctx.fill();ctx.restore();

    ctx.textAlign='center';
    ctx.fillStyle='#f5c35b';ctx.font='900 34px Arial';ctx.fillText('TRUST NOBODY',W/2,130);
    ctx.fillStyle='#fff';ctx.font='1000 84px Arial';ctx.fillText(m.title,W/2,650);
    ctx.fillStyle='#d8a5ff';ctx.font='900 34px Arial';ctx.fillText(m.sub,W/2,710);

    ctx.shadowColor='#b85cff';ctx.shadowBlur=40;ctx.fillStyle='#fff';ctx.font='1000 128px Arial';
    ctx.fillText(Number(s).toLocaleString()+' $TNB',W/2,850);ctx.shadowBlur=0;

    ctx.fillStyle='#f5c35b';ctx.font='1000 38px Arial';ctx.fillText(rank(s),W/2,925);
    ctx.fillStyle='#fff';ctx.font='800 27px Arial';ctx.fillText(alias(),W/2,990);

    // meme footer
    ctx.fillStyle='rgba(255,255,255,.84)';ctx.font='800 29px Arial';ctx.fillText(m.footer,W/2,1150);
    ctx.fillStyle='#d8a5ff';ctx.font='900 25px Arial';ctx.fillText('NFA · DYOR · PROBABLY A TERRIBLE IDEA',W/2,1210);
    ctx.fillStyle='#f5c35b';ctx.font='1000 32px Arial';ctx.fillText('#TNB  #SOLANA  #DEGEN',W/2,1330);
    ctx.fillStyle='rgba(255,255,255,.4)';ctx.font='700 19px Arial';ctx.fillText('TRUST NOBODY · PLAY THE CHAOS',W/2,1400);
  }

  function addPresets(){
    const box=document.querySelector('.tnb-share-box');
    if(!box || document.querySelector('.tnb-degen-presets'))return;
    const ref=box.querySelector('.tnb-share-actions');
    const p=document.createElement('div');p.className='tnb-degen-presets';
    Object.keys(moods).forEach(k=>{
      const b=document.createElement('button');b.dataset.mood=k;b.textContent=moods[k].title;
      if(k===mood)b.classList.add('active');
      b.onclick=()=>{mood=k;p.querySelectorAll('button').forEach(x=>x.classList.remove('active'));b.classList.add('active');draw()};
      p.appendChild(b);
    });
    ref.parentNode.insertBefore(p,ref);
  }

  const oldOpen=window.tnbOpenShareCard;
  window.tnbOpenShareCard=function(s){
    addPresets();
    if(typeof oldOpen==='function')oldOpen(s);
    setTimeout(draw,30);
  };

  // Existing V5 modal may be built asynchronously; observe once.
  const observer=new MutationObserver(()=>{addPresets()});
  observer.observe(document.body,{childList:true,subtree:true});
  setTimeout(()=>{addPresets()},1000);

  // Make generated share text match selected meme.
  document.addEventListener('click',e=>{
    const b=e.target.closest && e.target.closest('[data-share="x"],[data-share="copy"]');
    if(!b)return;
    const s=score(),m=moods[mood];
    if(b.dataset.share==='x'){
      e.preventDefault();e.stopImmediatePropagation();
      const text=encodeURIComponent(`👁️ ${m.title} ${Number(s).toLocaleString()} $TNB\\n${m.sub}\\n${m.footer}\\n\\n#TNB #Solana`);
      window.open('https://twitter.com/intent/tweet?text='+text,'_blank','noopener,noreferrer');
    }
  },true);

  window.tnbSetShareMood=(m)=>{if(moods[m]){mood=m;draw()}};
})();
  /* ---- tnb-v7-personality-leaderboard-runtime ---- */
(() => {
  const titles=[
    {min:100000,title:'👁️ SOLANA DEMON'},
    {min:50000,title:'🐋 EXIT LIQUIDITY WHALE'},
    {min:10000,title:'🔥 MARKET MENACE'},
    {min:5000,title:'💀 RUG SURVIVOR'},
    {min:1000,title:'🧠 CERTIFIED DEGEN'},
    {min:500,title:'🚀 EARLY APE'},
    {min:100,title:'🦍 PROFESSIONAL APE'},
    {min:0,title:'🥲 PAPER HAND IN TRAINING'}
  ];

  const demo=[
    ['0xDEAD...69','100000'],
    ['APE_LORD','42000'],
    ['RUG_SURVIVOR','12500'],
    ['NO_EXIT_LIQ','6900'],
    ['FOMO.exe','1337'],
    ['paperhands','420']
  ];

  function titleFor(score){
    score=Number(score)||0;
    return titles.find(x=>score>=x.min).title;
  }

  function scoreFromText(el){
    if(!el)return 0;
    const n=Number(el.textContent.replace(/[^0-9.-]/g,''));
    return Number.isFinite(n)?n:0;
  }

  function currentScore(){
    const sels=['#score','.score','.score-value','.balance','.points','[data-score]','[data-balance]','[data-points]'];
    for(const s of sels){const e=document.querySelector(s);const n=scoreFromText(e);if(n)return n}
    return Number(localStorage.getItem('tnb_best_score')||0);
  }

  function currentName(){
    const sels=['#alias','#username','.alias','.username','[data-alias]','[data-username]'];
    for(const s of sels){const e=document.querySelector(s);if(e&&e.textContent.trim())return e.textContent.trim().slice(0,20)}
    return 'YOU';
  }

  function sortRows(rows){return rows.sort((a,b)=>Number(b[1])-Number(a[1]))}

  function render(){
    const existing=document.querySelector('.tnb-personality-wrap');
    if(existing)existing.remove();

    const anchor=document.querySelector('.leaderboard,[data-leaderboard],#leaderboard') ||
      document.querySelector('main') || document.body;

    const wrap=document.createElement('section');
    wrap.className='tnb-personality-wrap';
    wrap.innerHTML=`
      <div class="tnb-personality-head">
        <strong>LEADERBOARD // PERSONALITY MODE</strong>
        <span>TOP DEGENS</span>
      </div>
      <div class="tnb-personality-list"></div>`;
    anchor.appendChild(wrap);

    const list=wrap.querySelector('.tnb-personality-list');
    const own=[currentName(),String(currentScore())];
    const rows=sortRows(demo.concat([own]));
    const seen=new Set();

    rows.slice(0,8).forEach((r)=>{
      const key=r[0]+'|'+r[1]; if(seen.has(key))return; seen.add(key);
      const score=Number(r[1])||0;
      const row=document.createElement('div');
      row.className='tnb-personality-row'+(r[0]===own[0]?' tnb-personality-you':'');
      row.innerHTML=`
        <div class="tnb-personality-rank">#${list.children.length+1}</div>
        <div><div class="tnb-personality-name"></div><div class="tnb-personality-title"></div></div>
        <div class="tnb-personality-score">${score.toLocaleString()} $TNB</div>`;
      row.querySelector('.tnb-personality-name').textContent=r[0];
      row.querySelector('.tnb-personality-title').textContent=titleFor(score)+(r[0]===own[0]?' · YOU':'');
      list.appendChild(row);
    });
  }

  // If a real leaderboard already exists, enrich its rows instead of changing its score source.
  function enrichExisting(){
    const rows=document.querySelectorAll('.leaderboard-row,[data-leaderboard-row],.leaderboard li');
    if(!rows.length)return false;
    rows.forEach(row=>{
      if(row.querySelector('.tnb-personality-title'))return;
      const n=scoreFromText(row.querySelector('.score,[data-score],.points,.amount')) || scoreFromText(row);
      const badge=document.createElement('div');
      badge.className='tnb-personality-title';
      badge.textContent=titleFor(n);
      row.appendChild(badge);
    });
    return true;
  }

  window.tnbPersonalityTitle=titleFor;
  window.tnbRenderPersonalityLeaderboard=render;

  // Prefer enriching a server-backed leaderboard. If none is present, provide a visual personality board.
  setTimeout(()=>{
    if(!enrichExisting()) render();
  },350);

  // Refresh when the app's visible score changes.
  let last=0;
  setInterval(()=>{
    const s=currentScore();
    if(s!==last){last=s;const real=enrichExisting();if(!real)render();}
  },1500);
})();
  /* ---- tnb-v8-mobile-teaser-runtime ---- */
(() => {
  function add(){
    if(document.querySelector('.tnb-mobile-teaser')) return;
    const anchor=document.querySelector('footer,.footer,[data-footer]') || document.querySelector('main') || document.body;
    const section=document.createElement('section');
    section.className='tnb-mobile-teaser';
    section.setAttribute('aria-label','TNB mobile apps coming soon');
    section.innerHTML=`
      <div class="tnb-mobile-kicker">THE CHAOS IS GOING MOBILE</div>
      <div class="tnb-mobile-title">TNB MOBILE</div>
      <div class="tnb-mobile-sub">PLAY ANYWHERE. TRUST NOBODY.</div>
      <div class="tnb-mobile-platforms">
        <div class="tnb-mobile-platform">
          <div class="icon"></div>
          <div><strong>APP STORE</strong><span>COMING SOON</span></div>
        </div>
        <div class="tnb-mobile-platform">
          <div class="icon">▶</div>
          <div><strong>GOOGLE PLAY</strong><span>COMING SOON</span></div>
        </div>
      </div>
      <div class="tnb-mobile-soon">NO FAKE DOWNLOAD BUTTONS. JUST THE TEASER.</div>
      <div class="tnb-mobile-note">MOBILE VERSION IN DEVELOPMENT · TNB</div>`;
    anchor.appendChild(section);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',add);
  else add();
  window.tnbAddMobileTeaser=add;
})();
  /* ---- v9-live-leaderboard ---- */
(() => {
  const API_BASE = window.TNB_API_BASE || '/api';
  const titleFor = window.tnbPersonalityTitle || ((s)=>s>=100000?'👁️ SOLANA DEMON':s>=50000?'🐋 EXIT LIQUIDITY WHALE':s>=10000?'🔥 MARKET MENACE':s>=5000?'💀 RUG SURVIVOR':s>=1000?'🧠 CERTIFIED DEGEN':s>=500?'🚀 EARLY APE':s>=100?'🦍 PROFESSIONAL APE':'🥲 PAPER HAND IN TRAINING');
  let playerId=window.tnbPlayerId||'';
  let source=null, poll=null, lastPayload='';

  function ownId(){return window.tnbPlayerId || playerId || ''}
  function scoreFromText(el){if(!el)return 0;const n=Number(el.textContent.replace(/[^0-9.-]/g,''));return Number.isFinite(n)?n:0}
  function ownName(){for(const s of ['#alias','#username','.alias','.username','[data-alias]','[data-username]']){const e=document.querySelector(s);if(e&&e.textContent.trim())return e.textContent.trim().slice(0,20)}return ''}

  function mount(){
    document.querySelector('.tnb-personality-wrap')?.remove();
    document.querySelector('.tnb-live-lb')?.remove();
    const anchor=document.querySelector('.leaderboard-panel') || document.querySelector('main') || document.body;
    const wrap=document.createElement('section');wrap.className='tnb-live-lb';
    wrap.innerHTML='<div class="tnb-live-lb-head"><div class="tnb-live-lb-title">LIVE LEADERBOARD</div><div class="tnb-live-state" data-live-state><i class="tnb-live-dot"></i><span>CONNECTING</span></div></div><ol class="tnb-live-list" data-live-list><li class="lb-empty">SYNCING GLOBAL DEGENS...</li></ol><div class="tnb-live-foot">SERVER-SIDE SCORE · REAL-TIME STREAM</div>';
    anchor.appendChild(wrap);return wrap;
  }
  const wrap=mount();
  const list=wrap.querySelector('[data-live-list]'), state=wrap.querySelector('[data-live-state]');
  function setState(mode,text){state.className='tnb-live-state '+mode;state.querySelector('span').textContent=text}
  function render(players){
    if(!Array.isArray(players))return;
    const me=ownId();const name=ownName();
    const rows=players.slice(0,50);
    list.innerHTML='';
    if(!rows.length){list.innerHTML='<li class="lb-empty">NO DEGENS YET. BE THE FIRST.</li>';return}
    rows.forEach((p,i)=>{
      const li=document.createElement('li');li.className='tnb-live-row'+(p.id===me?' tnb-live-you':'');
      const r=document.createElement('span');r.className='tnb-live-rank';r.textContent='#'+(i+1);
      const mid=document.createElement('div');const n=document.createElement('div');n.className='tnb-live-name';n.textContent=p.name||'Anonymous';const t=document.createElement('div');t.className='tnb-live-title';t.textContent=titleFor(p.score)+(p.id===me?' · YOU':'');mid.append(n,t);
      const sc=document.createElement('span');sc.className='tnb-live-score';sc.textContent=Number(p.score||0).toLocaleString()+' $TNB';
      li.append(r,mid,sc);list.appendChild(li);
    });
  }
  async function fetchBoard(){
    try{const data=await window.tnbLoadLeaderboard(50);render(data);setState('live','LIVE · '+new Date().toLocaleTimeString());return true}catch(e){setState('warn','RECONNECTING');return false}
  }
  function startPolling(){if(poll)return;fetchBoard();poll=setInterval(fetchBoard,3000)}
  function connect(){
    startPolling();return;
    /* eslint-disable no-unreachable */
    if(!window.EventSource){startPolling();return}
    try{
      source=new EventSource(API_BASE+'/leaderboard/stream');
      source.onopen=()=>{if(poll){clearInterval(poll);poll=null}setState('live','LIVE · STREAM')};
      source.onmessage=(ev)=>{try{const payload=JSON.parse(ev.data);const key=JSON.stringify(payload.players);if(key!==lastPayload){lastPayload=key;render(payload.players)}setState('live','LIVE · STREAM')}catch{}};
      source.onerror=()=>{setState('warn','RECONNECTING');if(source){source.close();source=null}startPolling();setTimeout(()=>{if(poll){clearInterval(poll);poll=null}connect()},5000)};
    }catch{startPolling()}
  }
  fetchBoard().finally(connect);
  window.tnbRefreshLiveLeaderboard=fetchBoard;
})();
  /* ---- v10-security ---- */
(() => {
  /*
   * V10 client-side anti-bot signals.
   * IMPORTANT: client signals are advisory only. The server must validate
   * the signed challenge, rate limits and score deltas.
   */
  const state={
    challenge:null,
    issuedAt:0,
    clicks:0,
    lastClick:0,
    intervals:[],
    blockedUntil:0
  };

  function warn(msg){
    let el=document.querySelector('.tnb-security-warning');
    if(!el){
      el=document.createElement('div');el.className='tnb-security-warning';
      document.body.appendChild(el);
    }
    el.textContent=msg;el.classList.add('on');
    clearTimeout(el._t);el._t=setTimeout(()=>el.classList.remove('on'),1800);
  }

  async function challenge(){
    try{
      // Score integrity is enforced by the database functions, so no
      // separate client challenge endpoint is needed anymore.
      state.challenge=null;state.issuedAt=Date.now();
    }catch(e){}
    // No local fallback token: without a server challenge the server should reject
    // score-mutating requests rather than trusting a client-generated value.
    return null;
  }

  function recordClick(){
    const now=performance.now();
    if(state.lastClick){
      const dt=now-state.lastClick;
      state.intervals.push(dt);
      if(state.intervals.length>40)state.intervals.shift();
    }
    state.lastClick=now;state.clicks++;
  }

  function behavior(){
    const a=state.intervals.slice(-20);
    if(a.length<8)return {samples:a.length,regularity:null};
    const mean=a.reduce((x,y)=>x+y,0)/a.length;
    const variance=a.reduce((x,y)=>x+(y-mean)**2,0)/a.length;
    const cv=Math.sqrt(variance)/Math.max(mean,1);
    return {samples:a.length,regularity:cv};
  }

  function allowed(){
    if(Date.now()<state.blockedUntil){warn('ANTI-BOT: SLOW DOWN');return false}
    // Human-friendly client throttle only; server remains authoritative.
    const recent=state.intervals.slice(-10).filter(x=>x<45).length;
    if(recent>=6){
      state.blockedUntil=Date.now()+1500;
      warn('ANTI-BOT: INPUT TOO FAST');
      return false;
    }
    return true;
  }

  async function securePayload(payload){
    if(!state.challenge || Date.now()-state.issuedAt>60000) await challenge();
    if(!state.challenge)return null;
    return {
      ...payload,
      security:{
        challenge_id:state.challenge.challenge_id,
        challenge_nonce:state.challenge.nonce,
        issued_at:state.challenge.issued_at,
        client_ts:Date.now(),
        behavior:behavior()
      }
    };
  }

  // Expose hooks for the existing click request implementation.
  window.tnbSecurity={
    challenge,
    recordClick,
    allowed,
    securePayload,
    behavior,
    state
  };

  // Add a quiet status marker.
  const addStatus=()=>{
    if(document.querySelector('.tnb-security-status'))return;
    const anchor=document.querySelector('.tnb-mobile-teaser,.tnb-personality-wrap,footer,.footer')||document.body;
    const s=document.createElement('div');s.className='tnb-security-status';
    s.innerHTML='<span class="tnb-security-dot"></span> ANTI-BOT ACTIVE';
    anchor.appendChild(s);
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',addStatus);else addStatus();

  // Capture click rhythm before app handlers run.
  document.addEventListener('pointerdown',e=>{
    const target=e.target.closest && e.target.closest('.clicker,#clickBtn,[data-clicker]');
    if(target){recordClick();allowed();}
  },true);

  // Prime a server challenge.
  challenge();
})();
  /* ---- v11-db-status ---- */
(()=>{const add=()=>{if(document.querySelector('.tnb-db-status'))return;
const a=document.querySelector('.tnb-personality-wrap,.tnb-mobile-teaser,footer,.footer')||document.body;
const e=document.createElement('div');e.className='tnb-db-status';
e.textContent='LEADERBOARD SOURCE · PRODUCTION DATABASE';a.appendChild(e)};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',add);else add()})();
  /* ---- v12-pwa-haptic ---- */
(()=>{
  // PWA registration: shell only. API/score traffic is never cached.
  if('serviceWorker' in navigator){
    window.addEventListener('load',()=>navigator.serviceWorker.register('./pwa/sw.js').catch(()=>{}));
  }

  let deferredPrompt=null;
  window.addEventListener('beforeinstallprompt',e=>{
    e.preventDefault(); deferredPrompt=e;
    const b=document.querySelector('.tnb-install-btn'); if(b)b.classList.add('show');
  });

  const haptic={
    enabled:localStorage.getItem('tnb_haptics')!=='off',
    intensity:localStorage.getItem('tnb_haptic_intensity')||'medium',
    pulse(kind='tap'){
      if(!this.enabled || !navigator.vibrate) return;
      const map={
        tap:{low:8,medium:12,high:18},
        combo:{low:12,medium:22,high:34},
        perfect:{low:[14,22],medium:[18,28],high:[24,40]},
        critical:{low:[18,28,18],medium:[24,36,24],high:[32,48,32]},
        milestone:{low:[25,35,25],medium:[35,55,35],high:[45,70,45]},
        break:{low:[45],medium:[65],high:[90]}
      };
      navigator.vibrate(map[kind]?.[this.intensity] ?? map.tap[this.intensity]);
    }
  };
  window.tnbHaptic=haptic;

  const addUI=()=>{
    if(document.querySelector('.tnb-install-btn'))return;
    const anchor=document.querySelector('.tnb-mobile-teaser,.tnb-personality-wrap,footer,.footer')||document.body;
    const b=document.createElement('button'); b.className='tnb-install-btn'; b.textContent='INSTALL TNB';
    b.onclick=async()=>{if(deferredPrompt){deferredPrompt.prompt();await deferredPrompt.userChoice;deferredPrompt=null;b.classList.remove('show')}};
    anchor.appendChild(b);

    const panel=document.createElement('div');panel.className='tnb-haptic-panel';
    panel.innerHTML='<span>HAPTICS</span><button class="tnb-haptic-toggle"></button>';
    const t=panel.querySelector('button');t.classList.toggle('on',haptic.enabled);
    t.onclick=()=>{haptic.enabled=!haptic.enabled;localStorage.setItem('tnb_haptics',haptic.enabled?'on':'off');t.classList.toggle('on',haptic.enabled);if(haptic.enabled)haptic.pulse('tap')};
    anchor.appendChild(panel);
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',addUI);else addUI();

  // Generic game-event bridge. Existing gameplay can call these explicitly.
  window.tnbTriggerHaptic=(event)=>{
    const map={tap:'tap',combo:'combo',perfect:'perfect',critical:'critical',milestone:'milestone',break:'break'};
    haptic.pulse(map[event]||'tap');
  };
})();
}
