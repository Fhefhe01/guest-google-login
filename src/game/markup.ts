// Static markup for the $TNB Clicker stage, kept as HTML so the original
// DOM-driven game runtime can attach to it unchanged.
export const stageHtml = String.raw`<div class="stage">
  <header class="topbar">
    <div class="brand">
      <div class="brand-mark"><svg viewBox="0 0 100 100" aria-hidden="true"><path d="M16 82 Q20 31 50 14 Q80 31 84 82 L68 70 Q62 58 50 56 Q38 58 32 70Z" fill="#09050f" stroke="#8b5cf6" stroke-width="4"/><path d="M26 48 Q50 29 74 48 Q50 67 26 48Z" fill="#12081f" stroke="#f5c35b" stroke-width="2.5"/><ellipse cx="50" cy="48" rx="8" ry="11" fill="#f4edff"/><ellipse cx="50" cy="48" rx="3.5" ry="8" fill="#8b5cf6"/></svg></div>
      <div><div class="brand-title">$TNB</div><div class="brand-sub">Trust Nobody Protocol</div></div>
    </div>
    <div class="sync-status" id="syncStatus"><span class="sync-dot"></span><span id="syncStatusText">connecting…</span></div>
  </header>

  <main>
    <section class="hero">
      <div class="score-label">👁️ YOUR $TNB BAG</div>
      <div class="score" id="score">—</div>
      <div class="balance-symbol" id="rankLabel">NEWBIE DEGEN · SUSPICION POINTS</div>
      <div class="stats">
        <div class="stat"><div class="stat-value" id="perClickStat">+1 / click</div><div class="stat-label">APE POWER</div></div>
        <div class="stat"><div class="stat-value" id="perSecStat">+0 / sec</div><div class="stat-label">BAG HOLDER INCOME</div></div>
      </div>
      <div class="milestone-wrap">
        <div class="milestone-meta"><span>🚀 NEXT PUMP LEVEL</span><span>100 / 500 / 1000</span></div>
        <div class="milestone-bar"><div class="milestone-bar-fill" id="milestoneBarFill"></div></div>
        <div class="milestone-label" id="milestoneLabel">connecting to server…</div>
      </div>
    </section>

    <section class="hype-panel" aria-live="polite">
      <div class="hype-top"><div><span class="hype-kicker">MARKET CHAOS</span><strong id="eventTitle">👁️ TRUST NOBODY</strong></div><span class="combo-pill" id="comboPill">COMBO x1</span></div>
      <div class="event-message" id="eventMessage">The market is watching. Ape carefully.</div>
      <div class="pump-meter"><div class="pump-meter-fill" id="pumpMeterFill"></div></div>
      <div class="hype-meta"><span id="pumpLabel">PUMP PRESSURE 0%</span><span id="rankXp">0 XP</span></div>
    </section>

    <section class="click-zone">
      <div class="clicker-wrap">
        <div class="clicker-ring"></div>
        <div class="clicker" id="clickBtn" role="button" aria-label="Tap to earn $TNB">
          <svg viewBox="0 0 100 100" aria-hidden="true"><path d="M18 82 Q22 34 50 18 Q78 34 82 82 L67 72 Q61 60 50 58 Q39 60 33 72Z" fill="#08050f" stroke="#8b5cf6" stroke-width="2.2"/><path d="M27 49 Q50 29 73 49 Q50 69 27 49Z" fill="#10081c" stroke="#f5c35b" stroke-width="1.8"/><ellipse cx="50" cy="49" rx="9" ry="12" fill="#f3eaff"/><ellipse cx="50" cy="49" rx="4" ry="9" fill="#8b5cf6"/><path d="M50 34 L50 28 M37 38 L32 33 M63 38 L68 33 M34 58 L28 62 M66 58 L72 62" stroke="#b85cff" stroke-width="1.6" stroke-linecap="round" opacity=".9"/></svg>
        </div>
      </div>
      <div class="clicker-hint">TAP THE EYE · APE IN · TRUST NOBODY</div>
    </section>

    <div class="section-head"><div class="section-title">🔥 DEGEN UPGRADES</div><div class="section-kicker">Buy harder. Ape harder.</div></div>
    <div class="panel" id="upgradePanel"></div>

    <div class="section-head"><div class="section-title">🏆 TOP DEGENS</div><div class="section-kicker">Most unhinged bags</div></div>
    <section class="leaderboard-panel" id="leaderboardPanel">
      <div class="lb-header">
        <div class="name">GLOBAL DEGEN LEADERBOARD</div>
        <div class="lb-you"><span>Alias</span><input id="nameInput" maxlength="16" placeholder="anonymous"><button id="nameSaveBtn">SAVE</button></div>
      </div>
      <ol class="lb-list" id="leaderboardList" hidden></ol>
    </section>


    <section class="reset-panel">
      <div class="reset-row"><div><div class="name">💀 GET RUGGED</div><div class="desc">Wipe the bag. Start the insanity again.</div></div><button id="resetBtn">RUG ME</button></div>
      <div class="reset-confirm" id="resetConfirm"><span>All your degen progress will be nuked.</span><button class="mini yes" id="resetYes">YES, RUG ME</button><button class="mini" id="resetNo">CANCEL</button></div>
    </section>
  </main>
  <section class="share-panel">
      <div class="share-title">📸 FLEX YOUR BAG</div>
      <div class="share-copy" id="shareCopy">I just survived the $TNB market. 👁️</div>
      <button class="share-btn" id="shareBtn">SHARE FLEX</button>
    </section>

    <footer class="footer">TRUST NOBODY · VERIFY EVERYTHING · $TNB</footer>
</div>`;
