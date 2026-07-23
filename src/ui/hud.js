import { G } from '../engine/state.js';
import { ATTRS, POSITIONS } from '../data/positions.js';
import { LEAGUES, clubColor } from '../data/leagues.js';
import { ovr, roleOf } from '../engine/player.js';
import { clamp, money, reducedMotion, easeOut } from '../engine/utils.js';
import { stage } from './dom.js';

/* ============================================================
   RENDU HUD
============================================================ */
function meter(label,val,color){
  return `<div class="meter"><div class="mrow"><span>${label}</span><span>${Math.round(val)}</span></div>
    <div class="bar"><i style="width:${clamp(val,0,100)}%;background:${color}"></i></div></div>`;
}
export function renderHUD(){
  const p=G, o=ovr(p), pos=POSITIONS.find(x=>x.id===p.pos), lg=LEAGUES[p.league];
  const cc=clubColor(p.league);
  const attrsHtml = ATTRS.map(a=>`
    <div class="attr"><div class="arow"><span class="an">${a.name}</span>
      <span class="av" id="av-${a.id}">${p.attrs[a.id]}</span></div>
      <div class="abar"><i style="width:${p.attrs[a.id]}%"></i></div></div>`).join('');
  return `<div class="hud">
    <div class="card player-card">
      <div class="club-stripe" style="background:${cc}"></div>
      <div class="pc-top">
        <div><div class="pc-name">${p.name}</div>
          <div class="pc-meta">${p.nation.flag} ${pos.emoji} ${pos.name} · ${p.age} ans</div></div>
        <div class="ovr-badge" style="--pct:${o}"><div class="n" id="ovrN">${o}</div><div class="l">OVR</div></div>
      </div>
      <div class="pc-club">
        <div class="club-dot" style="background:${cc}">${(p.club||'?').slice(0,2).toUpperCase()}</div>
        <div><div class="cn">${p.club||'Sans club'}</div>
          <div class="cl">${lg?lg.short:''}${p.club&&p.seasons.length?` · <span style="color:var(--sky)">${roleOf(p).label}</span>`:''}</div></div>
      </div>
      <div class="meters">
        ${meter('Réputation',p.reputation,'linear-gradient(90deg,#a86a2e,#ec6a43)')}
        ${meter('Moral',p.morale,'linear-gradient(90deg,#3a7a58,#5ec98a)')}
        ${meter('Forme',p.fitness,'linear-gradient(90deg,#3f6f86,#6fa8bf)')}
      </div>
    </div>
    <div class="card">
      <div class="eyebrow" style="margin-bottom:12px">Fiche technique</div>
      <div class="attrs">${attrsHtml}</div>
      <div style="display:flex;gap:18px;margin-top:16px;flex-wrap:wrap">
        ${miniStat('Coach',p.coach)} ${miniStat('Médias',p.media)} ${miniStat('Popularité',p.popularity)}
        <div><div class="an" style="font-size:11px;color:var(--chalk-dim);text-transform:uppercase;letter-spacing:.06em;font-family:'Barlow Semi Condensed'">Salaire/an</div>
          <div class="av" style="font-family:'Oswald';font-weight:600;font-size:15px;color:var(--up)">${p.salary?money(p.salary):'—'}</div></div>
        <div style="margin-left:auto"><div class="an" style="font-size:11px;color:var(--chalk-dim);text-transform:uppercase;letter-spacing:.06em;font-family:'Barlow Semi Condensed'">Fortune</div>
          <div class="av" style="font-family:'Oswald';font-weight:600;font-size:15px;color:var(--gold)">${money(p.money)}</div></div>
      </div>
    </div>
  </div>`;
}
function miniStat(l,v){return `<div><div style="font-size:11px;color:var(--chalk-dim);text-transform:uppercase;letter-spacing:.06em;font-family:'Barlow Semi Condensed'">${l}</div>
  <div style="font-family:'Oswald';font-weight:600;font-size:15px">${Math.round(v)}</div></div>`;}

export function animateStats(){
  if(reducedMotion() || !window.requestAnimationFrame) return;
  stage.querySelectorAll('.stat-cell .sv').forEach(el=>{
    const target=parseFloat(el.textContent); if(isNaN(target)) return;
    const dec = el.textContent.indexOf('.')>=0 ? 1 : 0;
    const now=()=> (window.performance&&performance.now)?performance.now():Date.now();
    const dur=520, t0=now();
    el.textContent=(target*0.15).toFixed(dec);
    function frame(){ const k=Math.min(1,(now()-t0)/dur);
      el.textContent=(target*(0.15+0.85*easeOut(k))).toFixed(dec);
      if(k<1) requestAnimationFrame(frame); else el.textContent=target.toFixed(dec); }
    requestAnimationFrame(frame);
  });
}
