import { hofLoad, hofClear } from '../engine/hof.js';
import { BADGES, badgesState, badgesClear } from '../engine/badges.js';
import { stage } from './dom.js';
import { screenTitle, sparkline } from './screens.js';
import { renderTrophyCabinet } from './trophies.js';
import { tagsByIds, renderTagChips } from '../engine/tags.js';
import { setInCareer } from './navbar.js';
import { trackEvent } from '../engine/analytics.js';

/* ============================================================
   PANTHÉON (rendu)
============================================================ */
export function renderHallOfFame(){
  setInCareer(false);
  const list=hofLoad();
  const rows = list.length ? list.map((r,i)=>`
    <div class="hof-row ${i===0?'top':''}" data-i="${i}" style="cursor:pointer">
      <span class="rk">${i+1}</span>
      <span class="hof-main">
        <span class="hof-name">${r.flag||'🏀'} ${r.name} ${r.posEmoji||''}</span>
        <span class="hof-sub">${r.tier} · ${r.seasons} saisons · pic ${r.peak} OVR${r.nba?' · 🏀 passé par la NBA':''}</span>
        <span class="hof-sub">🏆 ${r.champs} titre${r.champs>1?'s':''} · ⭐ ${r.mvps} MVP · 🌟 ${r.allstars} All-Star · 🎯 record ${r.bestPts} pts</span>
      </span>
      <span class="hof-score"><b>${r.score}</b><small>score</small></span>
    </div>`).join('')
    : `<p class="body" style="text-align:center;color:var(--chalk-dim);margin:34px 0">🏀 Aucune carrière enregistrée pour l'instant.<br>Termine une carrière pour entrer au Panthéon.</p>`;
  stage.innerHTML = `<div class="end" style="text-align:left">
    <div class="eyebrow" style="text-align:center">🏆 Panthéon</div>
    <h2 style="text-align:center;font-size:26px;margin:6px 0 4px">Tes plus grandes carrières</h2>
    <p class="body" style="text-align:center;color:var(--chalk-dim);margin-bottom:18px;font-size:13.5px">Classées par score légende. Clique une carrière pour la revoir. Bats ton record.</p>
    <div class="hof-list" style="max-width:660px;margin:0 auto">${rows}</div>
    <div style="margin-top:26px;display:flex;gap:12px;justify-content:center;flex-wrap:wrap">
      <button class="btn" id="hofBack">Retour</button>
      ${list.length?`<button class="btn ghost" id="hofClear">Vider le Panthéon</button>`:''}
    </div>
  </div>`;
  document.getElementById('hofBack').onclick=()=>screenTitle();
  stage.querySelectorAll('.hof-row').forEach(el=>{ el.onclick=()=>renderCareerDetail(list[+el.dataset.i]); });
  const hc=document.getElementById('hofClear'); if(hc) hc.onclick=()=>{ if(confirm('Effacer toutes les carrières du Panthéon ?')){ hofClear(); renderHallOfFame(); } };
}

/* ============================================================
   BADGES (rendu) -- hauts faits transversaux (voir engine/badges.js),
   débloqués à travers toutes les carrières, pas remis à zéro à
   chaque partie. Même écran affiche obtenus et à décrocher.
============================================================ */
function badgeTile(b, entry){
  const unlocked = !!entry;
  return `<div class="badge-tile ${unlocked?'unlocked':'locked'}" style="--badge-color:${b.color}">
    <div class="bt-icon">${b.emoji}</div>
    <div class="bt-name">${b.name}</div>
    <div class="bt-desc">${b.desc}</div>
    <span class="bt-status">${unlocked?'Débloqué':'À décrocher'}</span>
  </div>`;
}
export function renderBadges(){
  setInCareer(false);
  const state = badgesState();
  const unlockedCount = Object.keys(state.unlocked).length;
  const tiles = BADGES.map(b=>badgeTile(b, state.unlocked[b.id])).join('');
  stage.innerHTML = `<div class="end" style="text-align:left">
    <div class="eyebrow" style="text-align:center">🎖️ Hauts faits</div>
    <h2 style="text-align:center;font-size:26px;margin:6px 0 4px">Badges</h2>
    <p class="body" style="text-align:center;color:var(--chalk-dim);margin-bottom:18px;font-size:13.5px">${unlockedCount}/${BADGES.length} débloqués, à travers toutes tes carrières.</p>
    <div class="badge-grid">${tiles}</div>
    <div style="margin-top:26px;display:flex;gap:12px;justify-content:center;flex-wrap:wrap">
      <button class="btn" id="badgesBack">Retour</button>
      ${unlockedCount?`<button class="btn ghost" id="badgesClear">Réinitialiser les badges</button>`:''}
    </div>
  </div>`;
  document.getElementById('badgesBack').onclick=()=>screenTitle();
  const bc=document.getElementById('badgesClear'); if(bc) bc.onclick=()=>{ if(confirm('Réinitialiser tous les badges débloqués ?')){ badgesClear(); renderBadges(); } };
}

export function renderCareerDetail(r){
  if(!r){ renderHallOfFame(); return; }
  setInCareer(false);
  stage.innerHTML = `<div class="end">
    <div class="eyebrow">Carrière au Panthéon</div>
    <div class="legend-title" style="font-size:30px">${r.tier}</div>
    <p class="subline">${r.flag||'🏀'} ${r.posEmoji||''} ${r.posName||''} · ${r.seasons} saisons · pic ${r.peak} OVR${r.nba?' · 🏀 passé par la NBA':''}</p>
    ${renderTagChips(tagsByIds(r.tags), 'center')}
    <div class="legend-grid">
      <div class="lg"><div class="v">${r.score}</div><div class="l">Score légende</div></div>
      <div class="lg"><div class="v">${r.champs}</div><div class="l">Titres</div></div>
      <div class="lg"><div class="v">${r.mvps}</div><div class="l">MVP</div></div>
      <div class="lg"><div class="v">${r.allstars}</div><div class="l">All-Star</div></div>
      <div class="lg"><div class="v">${r.clutch||0}</div><div class="l">Clutch</div></div>
      ${r.tripleDoubles?`<div class="lg"><div class="v">${r.tripleDoubles}</div><div class="l">Triple-doubles</div></div>`:''}
    </div>
    ${r.headline?`<div class="recap-block"><div class="press"><div class="press-txt">${r.headline}</div></div></div>`:''}
    ${r.ovrSeries&&r.ovrSeries.length>1?`<div class="recap-block" style="text-align:center">${sparkline(r.ovrSeries)}</div>`:''}
    <div class="recap-block" style="text-align:center"><span class="hof-sub">🎯 Record de points sur une saison : <b style="color:var(--orange)">${r.bestPts}</b></span></div>
    <div class="recap-block" style="max-width:640px">
      <div class="eyebrow" style="text-align:center;margin-bottom:14px">🏆 Armoire à trophées</div>
      ${renderTrophyCabinet(r.accolades)}
    </div>
    <div style="margin-top:26px;text-align:center;display:flex;gap:12px;justify-content:center;flex-wrap:wrap">
      <button class="btn ghost" id="cardBtn2">🖼️ Ma carte</button>
      <button class="btn" id="detBack">Retour au Panthéon</button>
    </div>
  </div>`;
  document.getElementById('cardBtn2').onclick=()=>renderCareerCard(r, ()=>renderCareerDetail(r));
  document.getElementById('detBack').onclick=()=>renderHallOfFame();
}

export function renderCareerCard(r, back){
  if(!r){ (back||screenTitle)(); return; }
  stage.innerHTML = `<div class="end" style="max-width:560px">
    <div class="eyebrow" style="text-align:center">🖼️ Ta carte de carrière</div>
    <p class="body" style="text-align:center;color:var(--chalk-dim);font-size:13.5px;margin:6px 0 16px">Screenshote-la ou télécharge-la pour la partager avec tes potes.</p>
    <div style="display:flex;justify-content:center"><canvas id="careerCard" style="width:100%;max-width:380px;border-radius:16px;box-shadow:var(--shadow)"></canvas></div>
    <div style="margin-top:22px;display:flex;gap:12px;justify-content:center;flex-wrap:wrap">
      <button class="btn" id="dlCard">⬇️ Télécharger l'image</button>
      <button class="btn ghost" id="cardBack">Retour</button>
    </div>
    <p class="body" id="dlHint" style="text-align:center;color:var(--chalk-dim);font-size:12px;margin-top:10px;display:none">Si le téléchargement ne se lance pas, fais simplement une capture d'écran.</p>
  </div>`;
  const canvas=document.getElementById('careerCard');
  const draw=()=>drawCard(canvas,r);
  if(document.fonts && document.fonts.ready){ document.fonts.ready.then(draw); setTimeout(draw,300); } else draw();
  document.getElementById('cardBack').onclick=()=>(back||screenTitle)();
  document.getElementById('dlCard').onclick=()=>{
    trackEvent('card_share');
    try{ const a=document.createElement('a'); a.download='hardwood_'+(r.name||'carriere').replace(/\s+/g,'_')+'.png'; a.href=canvas.toDataURL('image/png'); document.body.appendChild(a); a.click(); a.remove(); }
    catch(e){ document.getElementById('dlHint').style.display='block'; }
  };
}

function drawCard(canvas, r){
  const W=1080, H=1350, x=canvas.getContext('2d');
  canvas.width=W; canvas.height=H;
  const C={chalk:'#241813',dim:'#5C4A3E',orange:'#E0562D',orangeSoft:'#B34524',mint:'#A1821F',mintSoft:'#836919',panel:'#FFFFFF',line:'#DCC9AF'};
  // fond dégradé — crème chaud Terre battue
  const g=x.createLinearGradient(0,0,0,H); g.addColorStop(0,'#FFFFFF'); g.addColorStop(0.55,'#F8F1E4'); g.addColorStop(1,'#EEE2CC');
  x.fillStyle=g; x.fillRect(0,0,W,H);
  // halo chaud en haut, très léger (un halo aussi marqué que sur fond sombre écraserait le blanc)
  const rg=x.createRadialGradient(W/2,-120,60,W/2,-120,760); rg.addColorStop(0,'rgba(224,86,45,0.10)'); rg.addColorStop(1,'rgba(224,86,45,0)');
  x.fillStyle=rg; x.fillRect(0,0,W,700);
  // bande signature terracotta -> or
  x.fillStyle=x.createLinearGradient(0,0,W,0); x.fillStyle.addColorStop(0,C.orange); x.fillStyle.addColorStop(1,C.mint);
  x.fillRect(0,0,W,6);
  // cadre
  x.strokeStyle=C.line; x.lineWidth=3; roundRect(x,28,34,W-56,H-62,26); x.stroke();
  x.textAlign='center'; x.textBaseline='alphabetic';
  // titre HARDWOOD
  x.font='700 46px "Bricolage Grotesque", Arial, sans-serif'; x.fillStyle=C.chalk;
  spacedText(x,'HARDWOOD',W/2,124,8);
  x.fillStyle=C.orange; x.fillRect(W/2-70,144,140,5);
  // nom + drapeau -- troncature par LARGEUR RÉELLE mesurée (measureText), pas un nombre de
  // caractères fixe : un nom de 16 caractères peut quand même déborder du cadre à cette taille de
  // police selon les lettres (majuscules larges type M/W vs étroites type I/L) -- l'ancienne
  // troncature fixe à 16 caractères ne le garantissait pas (bug de débordement signalé).
  x.font='700 76px "Bricolage Grotesque", Arial, sans-serif'; x.fillStyle=C.chalk;
  const flagPrefix=`${r.flag||'🏀'} `;
  const maxNameW=(W-160)-x.measureText(flagPrefix).width;
  x.fillText(`${flagPrefix}${truncateToWidth(x, r.name||'Joueur', maxNameW)}`, W/2, 238);
  // poste / style / nation
  x.font='600 30px "Bricolage Grotesque", Arial, sans-serif'; x.fillStyle=C.dim;
  const sub=[`${r.posEmoji||''} ${r.posName||''}`.trim(), r.styleName?`${r.styleEmoji||''} ${r.styleName}`.trim():'', r.nation||''].filter(Boolean).join('   ·   ');
  x.fillText(sub, W/2, 286);
  // badge tier
  x.font='700 52px "Bricolage Grotesque", Arial, sans-serif';
  const tw=x.measureText(r.tier||'').width; const bw=Math.min(Math.max(tw+90,360),W-140);
  x.fillStyle='rgba(161,130,31,0.10)'; x.strokeStyle=C.mint; x.lineWidth=2.5;
  roundRect(x,(W-bw)/2,326,bw,88,44); x.fill(); x.stroke();
  x.fillStyle=C.mint; x.fillText(r.tier||'', W/2, 386);
  if(r.hof){
    x.font='700 24px "Bricolage Grotesque", Arial, sans-serif'; x.fillStyle=C.mint;
    const label='HALL OF FAME', lw=x.measureText(label).width;
    x.fillText(label, W/2, 444);
    drawStar(x, W/2-lw/2-18, 439, 9, C.mint); drawStar(x, W/2+lw/2+18, 439, 9, C.mint);
  }
  // grille de stats 3x2
  const cells=[['Score',r.score],['Titres',r.champs],['MVP',r.mvps],['All-Star',r.allstars],['Pic OVR',r.peak],['Clutch',r.clutch||0]];
  const gx0=90, gy0=494, gw=(W-180), cwid=gw/3, chei=150;
  for(let i=0;i<cells.length;i++){ const cx=gx0+(i%3)*cwid, cy=gy0+Math.floor(i/3)*(chei+22);
    x.fillStyle='rgba(36,24,19,0.035)'; x.strokeStyle=C.line; x.lineWidth=1.5; roundRect(x,cx+10,cy,cwid-20,chei,18); x.fill(); x.stroke();
    x.fillStyle=C.chalk; x.font='700 68px "Bricolage Grotesque", Arial, sans-serif'; x.fillText(String(cells[i][1]), cx+cwid/2, cy+82);
    x.fillStyle=C.dim; x.font='600 25px "Bricolage Grotesque", Arial, sans-serif'; spacedText(x,String(cells[i][0]).toUpperCase(),cx+cwid/2,cy+122,1.5);
  }
  // ligne saisons / âge de fin / record / nba -- taille de police réduite dynamiquement si la
  // combinaison complète (carrière longue + record élevé + NBA + âge de fin) dépasserait la
  // largeur sûre de la carte, plutôt qu'un débordement silencieux (voir le même risque corrigé
  // sur le nom du joueur plus haut).
  let yy=gy0+2*(chei+22)+40;
  x.fillStyle=C.mint;
  const endAgeLine = r.endAge!=null ? `   ·   retraite à ${r.endAge} ans` : '';
  const statLine = `${r.seasons} saisons${endAgeLine}   ·   record ${r.bestPts} pts/match${r.nba?'   ·   🏀 NBA':''}`;
  const statMaxW = W-160;
  let statSize = 30;
  x.font=`600 ${statSize}px "Bricolage Grotesque", Arial, sans-serif`;
  while(statSize>20 && x.measureText(statLine).width>statMaxW){ statSize-=2; x.font=`600 ${statSize}px "Bricolage Grotesque", Arial, sans-serif`; }
  x.fillText(statLine, W/2, yy);
  // sparkline OVR
  if(r.ovrSeries && r.ovrSeries.length>1){ drawSpark(x, r.ovrSeries, W/2-300, yy+34, 600, 90, C); yy+=150; } else yy+=40;
  // citation presse
  if(r.headline){ x.fillStyle=C.dim; x.font='italic 500 30px Georgia, serif';
    wrapText(x, r.headline, W/2, yy+50, W-200, 42); }
  // footer
  x.fillStyle=C.dim; x.font='600 26px "Bricolage Grotesque", Arial, sans-serif';
  spacedText(x,'🏀 HARDWOOD',W/2,H-70,2);
}
// Étoile dessinée (pas le glyphe unicode ★, absent de Bricolage Grotesque et sujet à un
// repli de police imprévisible sur canvas selon le navigateur).
function drawStar(x,cx,cy,r,fill){
  x.save(); x.fillStyle=fill; x.beginPath();
  for(let i=0;i<10;i++){
    const rad = i%2===0 ? r : r*0.42;
    const ang = -Math.PI/2 + i*Math.PI/5;
    const px = cx+Math.cos(ang)*rad, py = cy+Math.sin(ang)*rad;
    i===0 ? x.moveTo(px,py) : x.lineTo(px,py);
  }
  x.closePath(); x.fill(); x.restore();
}
function roundRect(x,rx,ry,w,h,r){ x.beginPath(); x.moveTo(rx+r,ry); x.arcTo(rx+w,ry,rx+w,ry+h,r); x.arcTo(rx+w,ry+h,rx,ry+h,r); x.arcTo(rx,ry+h,rx,ry,r); x.arcTo(rx,ry,rx+w,ry,r); x.closePath(); }
function spacedText(x,str,cx,cy,sp){ x.save(); const chs=[...str]; let tot=0; const ws=chs.map(c=>{const w=x.measureText(c).width;tot+=w+sp;return w;}); tot-=sp; let px=cx-tot/2; x.textAlign='left'; chs.forEach((c,i)=>{ x.fillText(c,px,cy); px+=ws[i]+sp; }); x.restore(); }
// Troncature par largeur RÉELLE (measureText), pas un nombre de caractères fixe -- suppose que
// x.font est déjà celui utilisé pour le dessin final avant l'appel.
function truncateToWidth(x,s,maxW){
  s=String(s);
  if(x.measureText(s).width<=maxW) return s;
  while(s.length>1 && x.measureText(s+'…').width>maxW) s=s.slice(0,-1);
  return s+'…';
}
function wrapText(x,text,cx,cy,maxW,lh){ const words=String(text).split(' '); let line='',yy=cy,lines=[]; words.forEach(w=>{ const t=line?line+' '+w:w; if(x.measureText(t).width>maxW && line){ lines.push(line); line=w; } else line=t; }); if(line)lines.push(line); lines.slice(0,4).forEach((ln,i)=>x.fillText(ln,cx,yy+i*lh)); }
function drawSpark(x,series,ox,oy,w,h,C){ const mn=Math.min(...series),mx=Math.max(...series),rng=Math.max(1,mx-mn); const n=series.length; const bw=Math.min(w/n*0.66,26); const gap=(w-bw*n)/(n+1); series.forEach((v,i)=>{ const bh=14+((v-mn)/rng)*(h-14); const bx=ox+gap+i*(bw+gap); const isPk=v===mx; x.fillStyle=isPk?C.mint:'rgba(224,86,45,0.7)'; roundRect(x,bx,oy+h-bh,bw,bh,4); x.fill(); }); }
