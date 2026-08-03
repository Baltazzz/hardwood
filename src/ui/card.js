import { hofLoad, hofBest, hofClear } from '../engine/hof.js';
import { BADGES, TIER_RANK, badgesState, badgesClear } from '../engine/badges.js';
import { stage } from './dom.js';
import { screenTitle, sparkline } from './screens.js';
import { renderTrophyCabinet, crownIcon, medalIcon } from './trophies.js';
import { tagsByIds, renderTagChips } from '../engine/tags.js';
import { setInCareer } from './navbar.js';
import { trackEvent } from '../engine/analytics.js';
import { shareOrFallback, canvasToFile } from './share.js';
import { hexToRgba } from '../engine/accent.js';
import { equippedCardStyleId } from '../engine/cosmetics.js';
import { t } from '../engine/i18n.js';

// Totaux cumulés de carrière (points/passes/rebonds/contres/interceptions) : séparateur de
// milliers pour rester lisible sur des carrières longues (un total de 20 000+ points n'est pas
// valorisant à lire collé en un seul bloc de chiffres).
export function fmtNum(n){ return Math.round(n||0).toLocaleString('fr-FR'); }
// Le palier ("tier") d'un enregistrement de carrière (Panthéon, carte de fin) est stocké tel
// quel EN FRANÇAIS (voir endCareer() dans screens.js -- changer ça toucherait au format de
// sauvegarde) : traduit uniquement à l'affichage via son index dans TIER_RANK (voir i18n/fr.js/
// en.js tierRank), jamais en touchant la donnée stockée elle-même.
function tierIndex(tier){ const i = TIER_RANK.indexOf(tier); return i>=0 ? i : 0; }
// Même principe que tierIndex() ci-dessus, pour poste/style/nation d'un enregistrement de
// carrière : traduit via l'id quand il est disponible (voir rec dans endCareer(), screens.js),
// repli sur le libellé français déjà stocké pour un ancien enregistrement du Panthéon sans id.
function recPosName(r){ return r.pos ? t('positions.'+r.pos+'.name') : (r.posName||''); }
function recStyleName(r){ return r.style ? t('styles.'+r.style+'.name') : (r.styleName||''); }
function recNationName(r){ return r.nationId ? t('nations.'+r.nationId) : (r.nation||''); }

/* ============================================================
   PANTHÉON (rendu) — refonte (voir AGENDA.md "palmarès peu flatteur") :
   podium visuel (couronne/médailles SVG maison, ui/trophies.js) pour
   les 3 premières places plutôt qu'un simple numéro partout, rangée
   en vraie grille CSS pour un alignement garanti (voir .hof-row).
============================================================ */
// Glyphe de rang : couronne pour le n°1, médaille or/argent pour les 2e/3e (même langage SVG que
// l'armoire à trophées), chiffre net et centré au-delà -- jamais un simple numéro pour un podium.
export function rankGlyph(i){
  if(i===0) return `<span class="rk-medal" title="${t('hof.rank1')}">${crownIcon(30)}</span>`;
  if(i===1) return `<span class="rk-medal" title="${t('hof.rank2')}">${medalIcon('Argent',28)}</span>`;
  if(i===2) return `<span class="rk-medal" title="${t('hof.rank3')}">${medalIcon('Bronze',28)}</span>`;
  return `<span class="rk">${i+1}</span>`;
}
export function renderHallOfFame(){
  setInCareer(false);
  const list=hofLoad();
  const rows = list.length ? list.map((r,i)=>`
    <div class="hof-row ${i===0?'top':i<3?'podium':''}" data-i="${i}" style="cursor:pointer">
      ${rankGlyph(i)}
      <span class="hof-main">
        <span class="hof-name">${r.flag||'🏀'} ${r.name} ${r.posEmoji||''}</span>
        <span class="hof-sub">${t('tierRank.'+tierIndex(r.tier))} · ${r.seasons} ${t('hof.seasons')} · pic ${r.peak} OVR${r.nba?t('hof.nbaSuffix'):''}</span>
        <span class="hof-sub">🏆 ${r.champs} ${t('hof.titlesLabel')}${r.champs>1?'s':''} · ⭐ ${r.mvps} MVP · 🌟 ${r.allstars} All-Star · 🎯 record ${r.bestPts} pts</span>
      </span>
      <span class="hof-score"><b>${r.score}</b><small>${t('hof.score')}</small></span>
    </div>`).join('')
    : `<p class="body" style="text-align:center;color:var(--chalk-dim);margin:34px 0">${t('hof.empty')}</p>`;
  stage.innerHTML = `<div class="end" style="text-align:left">
    <div class="eyebrow" style="text-align:center">${t('hof.eyebrow')}</div>
    <h2 style="text-align:center;font-size:26px;margin:6px 0 4px">${t('hof.title')}</h2>
    <p class="body" style="text-align:center;color:var(--chalk-dim);margin-bottom:18px;font-size:13.5px">${t('hof.subtitle')}</p>
    <div class="hof-list" style="max-width:660px;margin:0 auto">${rows}</div>
    <div style="margin-top:26px;display:flex;gap:12px;justify-content:center;flex-wrap:wrap">
      <button class="btn" id="hofBack">${t('common.back')}</button>
      ${list.length?`<button class="btn ghost" id="hofClear">${t('hof.clear')}</button>`:''}
    </div>
  </div>`;
  document.getElementById('hofBack').onclick=()=>screenTitle();
  stage.querySelectorAll('.hof-row').forEach(el=>{ el.onclick=()=>renderCareerDetail(list[+el.dataset.i], +el.dataset.i); });
  const hc=document.getElementById('hofClear'); if(hc) hc.onclick=()=>{ if(confirm(t('hof.confirmClear'))){ hofClear(); renderHallOfFame(); } };
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
    <div class="bt-name">${t('badges.'+b.id+'.name')}</div>
    <div class="bt-desc">${t('badges.'+b.id+'.desc')}</div>
    <span class="bt-status">${unlocked?t('badgesScreen.unlocked'):t('badgesScreen.toUnlock')}</span>
  </div>`;
}
export function renderBadges(){
  setInCareer(false);
  const state = badgesState();
  const unlockedCount = Object.keys(state.unlocked).length;
  const pct = BADGES.length ? Math.round(unlockedCount/BADGES.length*100) : 0;
  // Débloqués d'abord (fierté, effet "vitrine de trophées"), à décrocher ensuite (objectif
  // suivant toujours visible) -- plutôt que l'ordre de définition, arbitraire pour le joueur.
  const unlocked = BADGES.filter(b=>state.unlocked[b.id]);
  const locked = BADGES.filter(b=>!state.unlocked[b.id]);
  const section = (list, label) => !list.length ? '' : `
    <div class="badge-section-h">${label}</div>
    <div class="badge-grid">${list.map(b=>badgeTile(b, state.unlocked[b.id])).join('')}</div>`;
  stage.innerHTML = `<div class="end" style="text-align:left">
    <div class="eyebrow" style="text-align:center">${t('badgesScreen.eyebrow')}</div>
    <h2 style="text-align:center;font-size:26px;margin:6px 0 4px">${t('badgesScreen.title')}</h2>
    <p class="body" style="text-align:center;color:var(--chalk-dim);margin-bottom:10px;font-size:13.5px">${t('badgesScreen.subtitle',{count:unlockedCount,total:BADGES.length})}</p>
    <div class="badge-progress" style="max-width:420px;margin:0 auto 22px">
      <div class="badge-progress-bar"><i style="width:${pct}%"></i></div>
    </div>
    ${section(unlocked, t('badgesScreen.unlockedSection',{count:unlocked.length}))}
    ${section(locked, t('badgesScreen.lockedSection',{count:locked.length}))}
    <div style="margin-top:26px;display:flex;gap:12px;justify-content:center;flex-wrap:wrap">
      <button class="btn" id="badgesBack">${t('common.back')}</button>
      ${unlockedCount?`<button class="btn ghost" id="badgesClear">${t('badgesScreen.reset')}</button>`:''}
    </div>
  </div>`;
  document.getElementById('badgesBack').onclick=()=>screenTitle();
  const bc=document.getElementById('badgesClear'); if(bc) bc.onclick=()=>{ if(confirm(t('badgesScreen.confirmReset'))){ badgesClear(); renderBadges(); } };
}

// rank : index dans le Panthéon (0-based, voir renderHallOfFame()) -- optionnel, absent quand la
// fiche est ouverte autrement qu'en cliquant une rangée du Panthéon (ex. depuis un lien de défi).
// Reprend le même glyphe (couronne/médaille) que la liste, pour relier visuellement les deux écrans.
export function renderCareerDetail(r, rank){
  if(!r){ renderHallOfFame(); return; }
  setInCareer(false);
  const rankFlag = rank===0 ? `<div class="hof-rank-flag">${crownIcon(20)} ${t('careerDetail.hofFlag1')}</div>`
    : rank===1 ? `<div class="hof-rank-flag">${medalIcon('Argent',18)} ${t('careerDetail.hofFlag2')}</div>`
    : rank===2 ? `<div class="hof-rank-flag">${medalIcon('Bronze',18)} ${t('careerDetail.hofFlag3')}</div>`
    : '';
  stage.innerHTML = `<div class="end">
    <div class="eyebrow">${t('careerDetail.eyebrow')}</div>
    ${rankFlag}
    <div class="legend-title" style="font-size:30px">${t('tierRank.'+tierIndex(r.tier))}</div>
    <p class="subline">${r.flag||'🏀'} ${r.posEmoji||''} ${recPosName(r)} · ${r.seasons} ${t('hof.seasons')} · pic ${r.peak} OVR${r.nba?t('hof.nbaSuffix'):''}</p>
    ${renderTagChips(tagsByIds(r.tags), 'center')}
    <div class="legend-grid">
      <div class="lg"><div class="v">${r.score}</div><div class="l">${t('stats.legendScore')}</div></div>
      <div class="lg"><div class="v">${r.champs}</div><div class="l">${t('stats.titles')}</div></div>
      <div class="lg"><div class="v">${r.mvps}</div><div class="l">${t('stats.mvp')}</div></div>
      <div class="lg"><div class="v">${r.allstars}</div><div class="l">${t('stats.allstar')}</div></div>
      <div class="lg"><div class="v">${r.clutch||0}</div><div class="l">${t('stats.clutch')}</div></div>
      ${r.tripleDoubles?`<div class="lg"><div class="v">${r.tripleDoubles}</div><div class="l">${t('stats.tripleDoubles')}</div></div>`:''}
    </div>
    ${r.headline?`<div class="recap-block"><div class="press"><div class="press-txt">${r.headline}</div></div></div>`:''}
    ${r.ovrSeries&&r.ovrSeries.length>1?`<div class="recap-block" style="text-align:center">${sparkline(r.ovrSeries)}</div>`:''}
    <div class="recap-block" style="text-align:center"><span class="hof-sub">${t('careerDetail.seasonBestPts',{pts:`<b style="color:var(--orange)">${r.bestPts}</b>`})}</span></div>
    ${r.totalPts!=null?`<div class="recap-block" style="max-width:640px">
      <div class="eyebrow" style="text-align:center;margin-bottom:14px">${t('stats.careerCumulated')}</div>
      <div class="legend-grid">
        <div class="lg"><div class="v">${fmtNum(r.totalPts)}</div><div class="l">${t('stats.points')}</div></div>
        <div class="lg"><div class="v">${fmtNum(r.totalAst)}</div><div class="l">${t('stats.assists')}</div></div>
        <div class="lg"><div class="v">${fmtNum(r.totalReb)}</div><div class="l">${t('stats.rebounds')}</div></div>
        <div class="lg"><div class="v">${fmtNum(r.totalBlk)}</div><div class="l">${t('stats.blocks')}</div></div>
        <div class="lg"><div class="v">${fmtNum(r.totalStl)}</div><div class="l">${t('stats.steals')}</div></div>
      </div>
    </div>`:''}
    <div class="recap-block" style="max-width:640px">
      <div class="eyebrow" style="text-align:center;margin-bottom:14px">${t('careerDetail.trophyCase')}</div>
      ${renderTrophyCabinet(r.accolades)}
    </div>
    <div style="margin-top:26px;text-align:center;display:flex;gap:12px;justify-content:center;flex-wrap:wrap">
      <button class="btn ghost" id="cardBtn2">${t('careerDetail.myCard')}</button>
      <button class="btn" id="detBack">${t('careerDetail.backToHof')}</button>
    </div>
  </div>`;
  document.getElementById('cardBtn2').onclick=()=>renderCareerCard(r, ()=>renderCareerDetail(r, rank));
  document.getElementById('detBack').onclick=()=>renderHallOfFame();
}

export function renderCareerCard(r, back){
  if(!r){ (back||screenTitle)(); return; }
  stage.innerHTML = `<div class="end" style="max-width:560px">
    <div class="eyebrow" style="text-align:center">${t('careerCard.eyebrow')}</div>
    <p class="body" style="text-align:center;color:var(--chalk-dim);font-size:13.5px;margin:6px 0 16px">${t('careerCard.subtitle')}</p>
    <div style="display:flex;justify-content:center"><canvas id="careerCard" style="width:100%;max-width:380px;border-radius:16px;box-shadow:var(--shadow)"></canvas></div>
    <div style="margin-top:22px;display:flex;gap:12px;justify-content:center;flex-wrap:wrap">
      <button class="btn" id="shareCard">${t('careerCard.share')}</button>
      <button class="btn ghost" id="dlCard">${t('careerCard.download')}</button>
      <button class="btn ghost" id="cardBack">${t('common.back')}</button>
    </div>
    <p class="body" id="dlHint" style="text-align:center;color:var(--chalk-dim);font-size:12px;margin-top:10px;display:none">${t('careerCard.shareUnavailable')}</p>
  </div>`;
  const canvas=document.getElementById('careerCard');
  const draw=()=>drawCard(canvas,r,equippedCardStyleId());
  if(document.fonts && document.fonts.ready){ document.fonts.ready.then(draw); setTimeout(draw,300); } else draw();
  document.getElementById('cardBack').onclick=()=>(back||screenTitle)();
  const filename='hardwood_'+(r.name||'carriere').replace(/\s+/g,'_')+'.png';
  function downloadCard(){
    try{ const a=document.createElement('a'); a.download=filename; a.href=canvas.toDataURL('image/png'); document.body.appendChild(a); a.click(); a.remove(); }
    catch(e){}
  }
  // Bouton "Partager" = le geste principal désormais (voir AGENDA.md) : ouvre la feuille de
  // partage native de l'appareil avec l'IMAGE de la carte quand c'est possible (Web Share Level
  // 2), texte seul sinon -- jamais de copie de lien SÉPARÉ pour une image (ça n'a pas de sens
  // ici, voir shareOrFallback() dans ui/share.js qui ignore `url` dès que des fichiers sont
  // partagés) : le repli propre sur un navigateur sans partage natif est le téléchargement déjà
  // en place. Le lien voyage donc DANS le texte lui-même (voir AGENDA.md AGD-53 -- "chaque
  // partage doit ramener des curieux") : c'est le seul moyen qui fonctionne identiquement sur
  // TOUS les chemins (partage de fichier, partage texte+URL de repli, et même la copie
  // presse-papiers de dernier recours, qui copierait sinon `text` sans aucun lien).
  document.getElementById('shareCard').onclick=async()=>{
    trackEvent('card_share');
    const file = await canvasToFile(canvas, filename);
    const result = await shareOrFallback({
      title: t('careerCard.shareTitle'),
      text: t('careerCard.shareText',{name:r.name||t('cardCanvas.defaultName'),tier:t('tierRank.'+tierIndex(r.tier)),score:r.score||0,url:window.location.origin}),
      files: file ? [file] : undefined,
    });
    if(result==='unsupported'){ downloadCard(); document.getElementById('dlHint').style.display='block'; }
  };
  document.getElementById('dlCard').onclick=downloadCard;
}

// Styles de carte de la boutique cosmétique (voir engine/cosmetics.js, AGENDA.md AGD-41) --
// STRICTEMENT décoratif : seules les couleurs/le décor du cadre changent d'un style à l'autre,
// jamais une position ou un contenu (le curseur Y ci-dessous reste identique quel que soit le
// style équipé). `classic` reproduit exactement les couleurs d'origine de la carte.
export const CARD_STYLES = {
  classic:{ name:'Classique', C:{chalk:'#241813',dim:'#5C4A3E',orange:'#E0562D',mint:'#A1821F',line:'#DCC9AF'},
    bg:['#FFFFFF','#F8F1E4','#EEE2CC'], frameWidth:3 },
  noir:{ name:'Carte Nuit', C:{chalk:'#F4EDE1',dim:'#C9B8A1',orange:'#F06A3E',mint:'#E3C15A',line:'#4A3A2E'},
    bg:['#2A211A','#1C1712','#100C09'], frameWidth:3 },
  parquet:{ name:'Fond Parquet', C:{chalk:'#241813',dim:'#5C4A3E',orange:'#E0562D',mint:'#A1821F',line:'#DCC9AF'},
    bg:['#FFFFFF','#F8F1E4','#EEE2CC'], frameWidth:3, pattern:'lattes' },
  vintage:{ name:'Bandeau Vintage', C:{chalk:'#241813',dim:'#6B5842',orange:'#B3541F',mint:'#8A731F',line:'#B8A583'},
    bg:['#F7EFDD','#F0E4C8','#E4D3A8'], frameWidth:3, doubleFrame:true },
  gold_frame:{ name:'Cadre Or', C:{chalk:'#241813',dim:'#5C4A3E',orange:'#E0562D',mint:'#A1821F',line:'#A1821F'},
    bg:['#FFFFFF','#F8F1E4','#EEE2CC'], frameWidth:7 },
  legend_foil:{ name:'Édition Légende', C:{chalk:'#2A1F12',dim:'#5C4A2E',orange:'#B8860B',mint:'#4A3F1C',line:'#B8860B'},
    bg:['#FFF8E1','#F3E2AE','#D9BD6E'], frameWidth:5, ornate:true },
};

// Carte de carrière (canvas) -- AUDIT COMPLET du positionnement (voir AGENDA.md) : l'ancienne
// version plaçait chaque élément à une coordonnée Y absolue et codée en dur, en supposant
// implicitement la hauteur de tout ce qui le précédait (notamment le bloc HOF, affiché
// SEULEMENT si r.hof, mais suivi d'une position fixe qui ne s'ajustait pas selon sa présence
// réelle) -- fragile par construction, un correctif ponctuel (le centrage du nom) ne pouvait pas
// empêcher un autre décalage d'apparaître ailleurs (le bloc profil ensuite). Réécrit avec un
// CURSEUR Y qui avance de la hauteur RÉELLEMENT dessinée à chaque étape : plus aucune position
// suivante ne peut se retrouver désynchronisée de ce qui la précède, quel que soit le contenu
// (nom court/long, carrière riche/pauvre en accomplissements, HOF ou non).
// Exportée uniquement pour le test dédié (tests/audit_cosmetics.mjs, styles de carte de la
// boutique) -- jamais utilisée ailleurs dans le jeu, toujours appelée via renderCareerCard().
export function drawCard(canvas, r, styleId){
  const W=1080, H=1350, x=canvas.getContext('2d');
  canvas.width=W; canvas.height=H;
  const S = CARD_STYLES[styleId] || CARD_STYLES.classic;
  const C = S.C;
  const CX=W/2, safeW=W-160; // marge sûre commune à tout le texte centré de la carte
  // fond dégradé -- couleurs propres au style équipé (voir engine/cosmetics.js "styles de carte",
  // AGENDA.md AGD-41) ; par défaut, exactement le dégradé crème chaud Terre battue d'origine.
  const g=x.createLinearGradient(0,0,0,H); g.addColorStop(0,S.bg[0]); g.addColorStop(0.55,S.bg[1]); g.addColorStop(1,S.bg[2]);
  x.fillStyle=g; x.fillRect(0,0,W,H);
  // Motif "parquet" optionnel (lattes diagonales, très discret) -- posé APRÈS le fond mais AVANT
  // le halo/la bande signature, jamais au-dessus du texte.
  if(S.pattern==='lattes'){
    x.save(); x.strokeStyle=hexToRgba(C.chalk,0.045); x.lineWidth=2;
    for(let lx=-H; lx<W+H; lx+=34){ x.beginPath(); x.moveTo(lx,0); x.lineTo(lx+H,H); x.stroke(); }
    x.restore();
  }
  // halo chaud en haut, très léger (un halo aussi marqué que sur fond sombre écraserait le fond) --
  // dérivé de la couleur d'accent du style, jamais une teinte terracotta fixe qui jurerait sur un
  // fond sombre ou doré.
  const rg=x.createRadialGradient(W/2,-120,60,W/2,-120,760); rg.addColorStop(0,hexToRgba(C.orange,0.10)); rg.addColorStop(1,hexToRgba(C.orange,0));
  x.fillStyle=rg; x.fillRect(0,0,W,700);
  // bande signature terracotta -> or
  x.fillStyle=x.createLinearGradient(0,0,W,0); x.fillStyle.addColorStop(0,C.orange); x.fillStyle.addColorStop(1,C.mint);
  x.fillRect(0,0,W,6);
  // cadre -- épaisseur propre au style (ex. "Cadre Or" plus épais), second liseré inséré pour le
  // style "vintage", ornements d'angle pour le style prestige "Édition Légende".
  x.strokeStyle=C.line; x.lineWidth=S.frameWidth; roundRect(x,28,34,W-56,H-62,26); x.stroke();
  if(S.doubleFrame){ x.lineWidth=1.5; roundRect(x,38,44,W-76,H-82,20); x.stroke(); }
  if(S.ornate){
    const fx=28, fy=34, fw=W-56, fh=H-62;
    [[fx+16,fy+16],[fx+fw-16,fy+16],[fx+16,fy+fh-16],[fx+fw-16,fy+fh-16]].forEach(([ox,oy])=>drawStar(x,ox,oy,8,C.mint));
  }
  x.textAlign='center'; x.textBaseline='alphabetic';

  let y=124; // baseline du titre -- seule coordonnée absolue de tout le dessin, tout le reste en découle

  // Titre HARDWOOD
  x.font='700 46px "Bricolage Grotesque", Arial, sans-serif'; x.fillStyle=C.chalk;
  spacedText(x,'HARDWOOD',CX,y,8);
  y+=20;
  x.fillStyle=C.orange; x.fillRect(CX-70,y,140,5);
  y+=40;

  // Drapeau et nom DISSOCIÉS, sur deux lignes -- bug de centrage corrigé pour de bon : les
  // concaténer dans une seule chaîne centrée fait dépendre le centrage du NOM de la largeur
  // RENDUE du drapeau, or les émojis drapeau (séquences d'indicateurs régionaux) ont une largeur
  // de rendu qui ne correspond pas toujours à celle que measureText() rapporte selon la police/
  // l'OS. Un simple emoji seul se centre toujours correctement sur lui-même (aucune chaîne
  // composite pour introduire un biais).
  x.font='700 30px "Bricolage Grotesque", Arial, sans-serif';
  x.fillText(r.flag||'🏀', CX, y);
  y+=74;
  x.font='700 76px "Bricolage Grotesque", Arial, sans-serif'; x.fillStyle=C.chalk;
  x.fillText(truncateToWidth(x, r.name||t('cardCanvas.defaultName'), safeW), CX, y);
  y+=44;

  // poste / style / nation -- taille de police réduite dynamiquement si la combinaison la plus
  // longue (ex. poste + style + "République dominicaine", 23 caractères) dépasserait la largeur
  // sûre de la carte.
  x.fillStyle=C.dim;
  const posLabel=recPosName(r), styleLabel=recStyleName(r), nationLabel=recNationName(r);
  const sub=[`${r.posEmoji||''} ${posLabel}`.trim(), styleLabel?`${r.styleEmoji||''} ${styleLabel}`.trim():'', nationLabel].filter(Boolean).join('   ·   ');
  let subSize=30;
  x.font=`600 ${subSize}px "Bricolage Grotesque", Arial, sans-serif`;
  while(subSize>18 && x.measureText(sub).width>safeW){ subSize-=2; x.font=`600 ${subSize}px "Bricolage Grotesque", Arial, sans-serif`; }
  x.fillText(sub, CX, y);
  y+=24;

  // Badge palier -- hauteur de boîte fixe (88px), mais sa position de départ (badgeTop) suit
  // désormais le curseur au lieu d'une constante absolue.
  const badgeTop=y, badgeH=88;
  const tierLabel=t('tierRank.'+tierIndex(r.tier));
  x.font='700 52px "Bricolage Grotesque", Arial, sans-serif';
  const tw=x.measureText(tierLabel).width; const bw=Math.min(Math.max(tw+90,360),W-140);
  x.fillStyle=hexToRgba(C.mint,0.10); x.strokeStyle=C.mint; x.lineWidth=2.5;
  roundRect(x,(W-bw)/2,badgeTop,bw,badgeH,44); x.fill(); x.stroke();
  x.fillStyle=C.mint; x.fillText(tierLabel, CX, badgeTop+60);
  y=badgeTop+badgeH;

  // HOF (optionnel) -- l'espace après le badge dépend maintenant de sa présence réelle, jamais
  // un gap fixe qui suppose son affichage (c'était l'exacte source du décalage signalé : la
  // grille de stats démarrait à une position fixe pensée pour le cas AVEC ligne HOF).
  if(r.hof){
    y+=30;
    x.font='700 24px "Bricolage Grotesque", Arial, sans-serif'; x.fillStyle=C.mint;
    const label=t('cardCanvas.hallOfFame'), lw=x.measureText(label).width;
    x.fillText(label, CX, y);
    drawStar(x, CX-lw/2-18, y-5, 9, C.mint); drawStar(x, CX+lw/2+18, y-5, 9, C.mint);
    y+=50;
  } else {
    y+=44; // même air qu'avec la ligne HOF (30+~14 de hauteur de ligne), pas de grille collée au badge
  }

  // Grille de stats 3x2
  const gx0=90, gw=(W-180), cwid=gw/3, chei=150, cgap=22;
  const gy0=y;
  const cells=[[t('cardCanvas.scoreShort'),r.score],[t('stats.titles'),r.champs],[t('stats.mvp'),r.mvps],[t('stats.allstar'),r.allstars],[t('stats.peakOvr'),r.peak],[t('stats.clutch'),r.clutch||0]];
  for(let i=0;i<cells.length;i++){ const cx=gx0+(i%3)*cwid, cy=gy0+Math.floor(i/3)*(chei+cgap);
    x.fillStyle=hexToRgba(C.chalk,0.035); x.strokeStyle=C.line; x.lineWidth=1.5; roundRect(x,cx+10,cy,cwid-20,chei,18); x.fill(); x.stroke();
    x.fillStyle=C.chalk; x.font='700 68px "Bricolage Grotesque", Arial, sans-serif'; x.fillText(String(cells[i][1]), cx+cwid/2, cy+82);
    x.fillStyle=C.dim; x.font='600 25px "Bricolage Grotesque", Arial, sans-serif'; spacedText(x,String(cells[i][0]).toUpperCase(),cx+cwid/2,cy+122,1.5);
  }
  y=gy0+2*(chei+cgap)+40;

  // Ligne saisons / âge de fin / record / nba -- taille de police réduite dynamiquement si la
  // combinaison complète (carrière longue + record élevé + NBA + âge de fin) dépasserait la
  // largeur sûre de la carte, plutôt qu'un débordement silencieux.
  x.fillStyle=C.mint;
  const endAgeLine = r.endAge!=null ? t('cardCanvas.retiredAt',{age:r.endAge}) : '';
  const statLine = `${r.seasons} ${t('hof.seasons')}${endAgeLine}   ·   ${t('cardCanvas.recordPtsPerGame',{pts:r.bestPts})}${r.nba?t('cardCanvas.nbaSuffix'):''}`;
  let statSize=30;
  x.font=`600 ${statSize}px "Bricolage Grotesque", Arial, sans-serif`;
  while(statSize>20 && x.measureText(statLine).width>safeW){ statSize-=2; x.font=`600 ${statSize}px "Bricolage Grotesque", Arial, sans-serif`; }
  x.fillText(statLine, CX, y);
  y+=34;

  // Totaux cumulés de carrière (optionnels -- absents sur d'anciens enregistrements du Panthéon
  // sauvegardés avant ce lot, voir AGENDA.md) : même réduction dynamique de police que la ligne
  // au-dessus, seule façon de garantir qu'une carrière longue (total à 5-6 chiffres sur les 5
  // statistiques) ne déborde jamais du cadre.
  if(r.totalPts!=null){
    x.fillStyle=C.dim;
    const totalsLine = `${fmtNum(r.totalPts)} ${t('cardCanvas.ptsAbbr')}   ·   ${fmtNum(r.totalAst)} ${t('cardCanvas.astAbbr')}   ·   ${fmtNum(r.totalReb)} ${t('cardCanvas.rebAbbr')}   ·   ${fmtNum(r.totalBlk)} ${t('cardCanvas.blkAbbr')}   ·   ${fmtNum(r.totalStl)} ${t('cardCanvas.stlAbbr')}`;
    let totSize=22;
    x.font=`600 ${totSize}px "Bricolage Grotesque", Arial, sans-serif`;
    while(totSize>13 && x.measureText(totalsLine).width>safeW){ totSize-=1; x.font=`600 ${totSize}px "Bricolage Grotesque", Arial, sans-serif`; }
    x.fillText(totalsLine, CX, y);
    y+=28;
  }

  // Sparkline OVR (optionnelle)
  if(r.ovrSeries && r.ovrSeries.length>1){ drawSpark(x, r.ovrSeries, CX-300, y, 600, 90, C); y+=90+40; }
  else y+=16;

  // Citation presse (optionnelle) -- hauteur RÉELLEMENT variable selon le nombre de lignes
  // enveloppées, jamais une estimation fixe. Espace restant avant le pied de carte calculé
  // explicitement : si une citation improbablement longue devait dépasser cette place, elle est
  // tronquée avec une ellipse plutôt que d'empiéter sur le pied de carte (voir wrapText()).
  if(r.headline){
    const footerTop=H-110; // marge de sécurité avant "🏀 HARDWOOD" (baseline H-70)
    const remaining=footerTop-y;
    const maxLines=Math.max(1,Math.min(4,Math.floor(remaining/42)));
    if(remaining>30){
      x.fillStyle=C.dim; x.font='italic 500 30px Georgia, serif';
      wrapText(x, r.headline, CX, y+34, W-200, 42, maxLines);
    }
  }

  // Pied de carte -- toujours ancré au bas du cadre, jamais dépendant du curseur (indépendant du
  // contenu au-dessus, qui ne peut plus jamais l'atteindre grâce au calcul de marge ci-dessus).
  // Porte à la fois le nom du jeu ET le lien (voir AGENDA.md AGD-53 -- "chaque partage doit
  // ramener des curieux") : la carte est partagée comme IMAGE (Web Share Level 2, voir
  // renderCareerCard() ci-dessous), jamais accompagnée d'un aperçu de lien -- si le domaine
  // n'est écrit NULLE PART dans les pixels eux-mêmes, un curieux qui voit l'image seule (repost,
  // capture d'écran, aperçu de conversation) n'a aucun moyen de retrouver le jeu. `window.location.host`
  // (jamais un domaine codé en dur, qui se périmerait au moindre changement d'hébergement) --
  // taille réduite dynamiquement comme le reste des lignes de la carte si la combinaison
  // "HARDWOOD + domaine" dépassait la largeur sûre.
  const domain=(typeof window!=='undefined' && window.location && window.location.host) ? window.location.host : '';
  const footerText = domain ? `🏀 HARDWOOD  ·  ${domain}` : '🏀 HARDWOOD';
  x.fillStyle=C.dim; let footSize=26;
  x.font=`600 ${footSize}px "Bricolage Grotesque", Arial, sans-serif`;
  while(footSize>15 && x.measureText(footerText).width>safeW){ footSize-=1; x.font=`600 ${footSize}px "Bricolage Grotesque", Arial, sans-serif`; }
  x.fillText(footerText, CX, H-70);
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
// Renvoie le nombre de lignes RÉELLEMENT dessinées (pour que l'appelant avance son curseur Y
// d'une hauteur exacte, jamais une estimation) -- borné à maxLines, la dernière ligne affichée
// tronquée avec une ellipse si le texte devait continuer au-delà (jamais un texte qui déborde
// silencieusement sur ce qui suit, ex. le pied de carte).
function wrapText(x,text,cx,cy,maxW,lh,maxLines=4){
  const words=String(text).split(' ');
  let line='',lines=[];
  words.forEach(w=>{ const t=line?line+' '+w:w; if(x.measureText(t).width>maxW && line){ lines.push(line); line=w; } else line=t; });
  if(line) lines.push(line);
  const truncated = lines.length>maxLines;
  const shown = lines.slice(0,maxLines);
  if(truncated){
    let last=shown[shown.length-1];
    while(last.length>1 && x.measureText(last+'…').width>maxW) last=last.slice(0,-1);
    shown[shown.length-1]=last+'…';
  }
  shown.forEach((ln,i)=>x.fillText(ln,cx,cy+i*lh));
  return shown.length;
}
function drawSpark(x,series,ox,oy,w,h,C){ const mn=Math.min(...series),mx=Math.max(...series),rng=Math.max(1,mx-mn); const n=series.length; const bw=Math.min(w/n*0.66,26); const gap=(w-bw*n)/(n+1); series.forEach((v,i)=>{ const bh=14+((v-mn)/rng)*(h-14); const bx=ox+gap+i*(bw+gap); const isPk=v===mx; x.fillStyle=isPk?C.mint:hexToRgba(C.orange,0.7); roundRect(x,bx,oy+h-bh,bw,bh,4); x.fill(); }); }
