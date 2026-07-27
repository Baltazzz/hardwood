import { G } from '../engine/state.js';
import { ATTRS, POSITIONS } from '../data/positions.js';
import { LEAGUES } from '../data/leagues.js';
import { ovr, roleOf } from '../engine/player.js';
import { clamp, money, reducedMotion, easeOut, clubInitials } from '../engine/utils.js';
import { applyAccent, emblemColors, textColorOn, hexToRgba } from '../engine/accent.js';
import { activeTags, renderTagChips } from '../engine/tags.js';
import { statContextLine } from '../engine/vitals.js';
import { stage } from './dom.js';

/* ============================================================
   RENDU HUD
============================================================ */
function meter(label,val,color){
  return `<div class="meter"><div class="mrow"><span>${label}</span><span>${Math.round(val)}</span></div>
    <div class="bar"><i style="width:${clamp(val,0,100)}%;background:${color}"></i></div></div>`;
}

// Pastille d'identité de club : depuis que la tuile profil entière porte la couleur du club
// (voir .player-card dans styles.css), l'ancien écusson-bouclier fait double emploi et ne
// convainc pas. Remplacé par des initiales de club sobres sur fond primaire, avec un discret
// repli de coin en secondaire (écho du panneau latéral d'un maillot) -- redevient un simple
// accent maintenant que l'identité visuelle vit sur la tuile, pas sur la pastille.
function clubMarkSvg(primary, secondary, name){
  const initials = clubInitials(name);
  const ink = textColorOn(primary);
  const fontSize = initials.length>=3 ? 15 : 17;
  return `<svg viewBox="0 0 44 44" width="44" height="44" style="flex:none;filter:drop-shadow(0 2px 4px rgba(36,24,19,.16))">
    <rect x="0" y="0" width="44" height="44" rx="12" fill="${primary}"/>
    <path d="M44 44 L44 27 L27 44 Z" fill="${secondary}" opacity=".9"/>
    <text x="21" y="28" text-anchor="middle" font-family="'Big Shoulders Display',sans-serif" font-weight="800"
      font-size="${fontSize}" letter-spacing="0.5" fill="${ink}">${initials}</text>
  </svg>`;
}

// Tuile "Fiche technique" repliable : repliée par défaut, mémorise ensuite le dernier choix
// (survit aux re-rendus de renderHUD à chaque écran, et aux rechargements de page).
const FICHE_KEY = 'hw_fiche_open';
function getFicheOpen(){
  try { const v = localStorage.getItem(FICHE_KEY); return v === '1'; }
  catch(e){ return false; }
}
function setFicheOpen(v){
  try { localStorage.setItem(FICHE_KEY, v ? '1' : '0'); } catch(e){}
}
// Délégation sur #stage (nœud stable, jamais remplacé) : pas besoin de re-brancher l'écouteur
// à chaque appel de renderHUD() depuis les différents écrans qui l'incluent.
if(typeof stage !== 'undefined' && stage && !stage.__ficheWired){
  stage.__ficheWired = true;
  stage.addEventListener('click', (e)=>{
    const btn = e.target.closest && e.target.closest('#ficheToggle');
    if(!btn) return;
    const open = !getFicheOpen();
    setFicheOpen(open);
    const body = document.getElementById('ficheBody');
    const chevron = document.getElementById('ficheChevron');
    if(body) body.classList.toggle('open', open);
    if(chevron) chevron.classList.toggle('open', open);
    btn.setAttribute('aria-expanded', String(open));
  });
}

export function renderHUD(mode='club'){
  const p=G, o=ovr(p), pos=POSITIONS.find(x=>x.id===p.pos), lg=LEAGUES[p.league];
  // Couleur d'accent dynamique : indexée sur le club (ou la nation en fenêtre de sélection),
  // ajustée pour rester lisible sur --court quelle que soit la couleur source. Posée sur
  // documentElement (--accent) : la stripe et l'anneau OVR ci-dessous la consomment via CSS.
  const accentHex = applyAccent(p, mode);
  const { primary: emblemPrimary, secondary: emblemSecondary } = emblemColors(p, mode);
  const ficheOpen = getFicheOpen();
  // Ligne de contexte (voir statContextLine() dans engine/vitals.js) : commente la stat molle
  // la plus notable du moment (une seule, pour rester lisible), rien si tout reste dans la norme.
  const statCtx = statContextLine(p);
  const attrsHtml = ATTRS.map(a=>`
    <div class="attr"><div class="arow"><span class="an">${a.name}</span>
      <span class="av" id="av-${a.id}">${p.attrs[a.id]}</span></div>
      <div class="abar"><i style="width:${p.attrs[a.id]}%"></i></div></div>`).join('');
  // Lavis dynamique de la tuile profil (voir .player-card dans styles.css) : rgba() pré-calculés
  // à faible opacité, sûrs pour le texte quelle que soit la couleur de club (voir hexToRgba()).
  // La bande latérale et le repli de coin utilisent les teintes pleines, sans risque puisque
  // aucun texte ne les recouvre.
  const jerseyWash = `--club-primary:${accentHex};--club-secondary:${emblemSecondary};--club-primary-wash:${hexToRgba(accentHex,.22)};--club-secondary-wash:${hexToRgba(emblemSecondary,.16)}`;
  return `<div class="hud">
    <div class="card player-card" style="${jerseyWash}">
      <div class="club-stripe"></div>
      <div class="pc-top">
        <div><div class="pc-name">${p.name}</div>
          <div class="pc-meta">${p.nation.flag} ${pos.emoji} ${pos.name} · ${p.age} ans</div></div>
        <div class="ovr-badge" style="--pct:${o}"><div class="n" id="ovrN">${o}</div><div class="l">OVR</div></div>
      </div>
      <div class="pc-club">
        ${clubMarkSvg(emblemPrimary, emblemSecondary, p.club)}
        <div><div class="cn">${p.club||'Sans club'}</div>
          <div class="cl">${lg?lg.short:''}${p.club&&p.seasons.length?` · <span style="color:var(--mint)">${roleOf(p).label}</span>`:''}</div></div>
      </div>
      ${renderTagChips(activeTags(p))}
      <div class="meters">
        ${meter('Réputation',p.reputation,'linear-gradient(90deg,var(--orange-soft),var(--orange))')}
        ${meter('Moral',p.morale,'linear-gradient(90deg,var(--mint-soft),var(--mint))')}
        ${meter('Forme',p.fitness,'linear-gradient(90deg,var(--chalk-dim),var(--chalk))')}
      </div>
      ${statCtx?`<div class="stat-context">${statCtx}</div>`:''}
    </div>
    <div class="card">
      <button type="button" id="ficheToggle" class="eyebrow fiche-toggle" aria-expanded="${ficheOpen}" aria-controls="ficheBody">
        <span>Fiche technique</span><span class="fiche-chevron${ficheOpen?' open':''}" id="ficheChevron">
          <svg viewBox="0 0 24 24" width="12" height="12"><path d="M5 9L12 16L19 9" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </span>
      </button>
      <div class="fiche-body${ficheOpen?' open':''}" id="ficheBody">
        <div class="fiche-inner">
          <div class="attrs" style="margin-top:12px">${attrsHtml}</div>
          <div style="display:flex;gap:18px;margin-top:16px;flex-wrap:wrap">
            ${miniStat('Coach',p.coach)} ${miniStat('Médias',p.media)} ${miniStat('Popularité',p.popularity)}
            <div><div class="an" style="font-size:11px;color:var(--chalk-dim);text-transform:uppercase;letter-spacing:.06em;font-family:'Bricolage Grotesque'">Salaire/an</div>
              <div class="av" style="font-family:'Bricolage Grotesque';font-weight:700;font-size:15px;color:var(--up)">${p.salary?money(p.salary):'·'}</div></div>
            <div style="margin-left:auto"><div class="an" style="font-size:11px;color:var(--chalk-dim);text-transform:uppercase;letter-spacing:.06em;font-family:'Bricolage Grotesque'">Fortune</div>
              <div class="av" style="font-family:'Bricolage Grotesque';font-weight:700;font-size:15px;color:var(--mint)">${money(p.money)}</div></div>
          </div>
        </div>
      </div>
    </div>
  </div>`;
}
function miniStat(l,v){return `<div><div style="font-size:11px;color:var(--chalk-dim);text-transform:uppercase;letter-spacing:.06em;font-family:'Bricolage Grotesque'">${l}</div>
  <div style="font-family:'Bricolage Grotesque';font-weight:700;font-size:15px">${Math.round(v)}</div></div>`;}

export function animateStats(){
  if(reducedMotion() || !window.requestAnimationFrame) return;
  stage.querySelectorAll('.stat-cell .sv').forEach(el=>{
    // Cellules composées (ex. "27/82" pour les matchs joués) : pas un nombre pur, on ne les
    // anime pas — sinon parseFloat ne garde que la partie avant "/" et l'écrase.
    if(!/^-?\d+(\.\d+)?$/.test(el.textContent.trim())) return;
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
