import { G, setG } from '../engine/state.js';
import { NATIONS } from '../data/nations.js';
import { POSITIONS, ATTRS } from '../data/positions.js';
import { STYLES } from '../data/styles.js';
import { LIFESTYLES } from '../data/lifestyles.js';
import { LEAGUES } from '../data/leagues.js';
import { newPlayer, rollTalent, ovr, salaryFor, clubSalaryMod, playCountry } from '../engine/player.js';
import { hofBest, hofAdd } from '../engine/hof.js';
import { evaluateBadges, BADGES } from '../engine/badges.js';
import { applyChoice, postSeason, doMove, beginSeasonKeep, draftProjection, seasonVerdict, startCareer, chooseAcademy, nextEventOrSim, beginSeason, pushTL, pickExpatNation } from '../engine/season.js';
import { catTag } from '../engine/events.js';
import { pickClub, pickClubName, pickClubs, clubInfo } from '../engine/clubs.js';
import { renderHUD, animateStats } from './hud.js';
import { resetAccent } from '../engine/accent.js';
import { renderHallOfFame, renderCareerCard, renderBadges } from './card.js';
import { renderTrophyCabinet, medalIcon } from './trophies.js';
import { activeTags, renderTagChips, renderTraitUnlockCard } from '../engine/tags.js';
import { pick, clamp, money, ordinal, ri } from '../engine/utils.js';
import { stage } from './dom.js';
import { saveGame, loadGame, hasSavedGame, clearSavedGame } from '../engine/savegame.js';
import { setInCareer } from './navbar.js';

/* ============================================================
   ÉCRANS : TITRE + CRÉATION
============================================================ */
const WELCOME_KEY = 'hw_welcome_seen';
function welcomeSeen(){ try{ return localStorage.getItem(WELCOME_KEY)==='1'; } catch(e){ return true; } }
function setWelcomeSeen(){ try{ localStorage.setItem(WELCOME_KEY,'1'); }catch(e){} }

// Icônes SVG faites maison (même logique que le reste de l'appli : pas de glyphe unicode,
// couleur fixée dans le path plutôt qu'héritée d'une police).
const WELCOME_ICONS = {
  rep:'M12 2 14.9 8.6 22 9.3 16.8 14.1 18.2 21.2 12 17.6 5.8 21.2 7.2 14.1 2 9.3 9.1 8.6Z',
  morale:'M12 21s-7.5-4.6-10-9.3C.4 8.1 2.4 4 6.4 4c2 0 3.6 1.1 4.6 2.7C12 5.1 13.6 4 15.6 4c4 0 6 4.1 4.4 7.7C19.5 16.4 12 21 12 21Z',
  fitness:'M4 12h3l2-6 4 12 2-6h5',
  coach:'M12 3 3 7l9 4 9-4-9-4Z M3 7v6l9 4 9-4V7 M12 11v9',
};
function welcomeIcon(key){
  return `<svg viewBox="0 0 24 24" width="18" height="18" style="flex:none">
    <path d="${WELCOME_ICONS[key]}" fill="none" stroke="var(--mint)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}
function welcomeStatRow(iconKey,label,text){
  return `<div class="ws-stat">${welcomeIcon(iconKey)}
    <div><div class="ws-stat-l">${label}</div><div class="ws-stat-t">${text}</div></div></div>`;
}
const TRAJ_STEPS = [
  ['Parcours de combattant','Le sommet t\'échappe, mais tu as vécu du basket : ce que peu réussissent.'],
  ['Joueur de rotation','Un vrai pro respecté, sans jamais percer tout en haut.'],
  ['All-Star','Tu brilles parmi l\'élite, une vraie carrière de haut niveau.'],
  ['Superstar','Des sommets touchés, un nom qui compte au plus haut niveau.'],
  ['Légende · Hall of Fame','Ton maillot est retiré, ton héritage est écrit.'],
];
function trajectoryStrip(){
  return `<div class="ws-traj">${TRAJ_STEPS.map((t,i)=>`
    <div class="ws-traj-step"><div class="ws-traj-n">${i+1}</div>
      <div><div class="ws-traj-l">${t[0]}</div><div class="ws-traj-d">${t[1]}</div></div></div>`).join('')}</div>`;
}

// Étapes génériques (le libellé exact du menu de partage diffère selon iOS/Android/navigateur,
// mais les trois gestes sont les mêmes partout) pour installer le lien comme une app sur l'écran
// d'accueil du téléphone -- pas de PWA/manifest, juste un raccourci vers cette page.
const HOME_SCREEN_STEPS = [
  ['Partager', 'Dans ton navigateur, ouvre le menu de partage (l\'icône carrée avec une flèche, ou les trois points en haut/en bas selon le téléphone).'],
  ['Ajouter à l\'écran d\'accueil', 'Cherche l\'option "Ajouter à l\'écran d\'accueil" (parfois nommée "Installer l\'application") dans la liste.'],
  ['Lancer comme une app', 'Une icône HARDWOOD apparaît sur ton écran d\'accueil : elle rouvre directement ta carrière, plein écran, comme une vraie application.'],
];
function homeScreenStrip(){
  return `<div class="ws-traj">${HOME_SCREEN_STEPS.map((t,i)=>`
    <div class="ws-traj-step"><div class="ws-traj-n">${i+1}</div>
      <div><div class="ws-traj-l">${t[0]}</div><div class="ws-traj-d">${t[1]}</div></div></div>`).join('')}</div>`;
}

// Écran de bienvenue plein écran (1re carrière uniquement, rouvrable depuis le titre) :
// un vrai écran (comme screenTitle/screenCreate), pas une tuile, pour pouvoir structurer le
// propos en sections qu'on parcourt plutôt qu'un pavé de texte compressé dans un coin.
export function screenWelcome(){
  setInCareer(false);
  stage.innerHTML = `<div class="welcome-screen">
    <button class="welcome-skip" id="wSkip">Passer →</button>
    <div class="eyebrow" style="text-align:left">Avant de te lancer</div>
    <h2 class="ws-h1">Ta carrière commence maintenant.<br>Voici ce qui va vraiment compter.</h2>

    <section class="ws-section">
      <div class="ws-kicker">01 · Ta fiche</div>
      <p class="ws-lead">Sous l'OVR, une poignée de jauges pilotent tout : minutes accordées, contrats, sélection nationale. Elles bougent à chaque saison, à chaque choix.</p>
      <div class="ws-grid">
        ${welcomeStatRow('rep','Réputation','Ta cote aux yeux de la ligue : ouvre les gros clubs, la sélection nationale, les MVP.')}
        ${welcomeStatRow('morale','Moral','Un joueur heureux progresse mieux. Un joueur cassé s\'effondre en silence.')}
        ${welcomeStatRow('fitness','Forme','Ton capital physique. Le fatiguer sans compter, c\'est emprunter sur les saisons d\'après.')}
        ${welcomeStatRow('coach','Confiance du coach','Elle décide qui reste sur le banc et qui joue le money-time. Elle se regagne plus vite qu\'elle ne se perd, mais pas d\'un coup.')}
      </div>
    </section>

    <section class="ws-section">
      <div class="ws-kicker">02 · Les choix</div>
      <p class="ws-lead">Deux décisions par saison, jamais neutres. Un tir tenté dans le money-time, une interview trop franche, une nuit de trop avant un match clé : certaines conséquences se voient tout de suite, d'autres se referment sur toi bien plus tard dans la carrière, sans prévenir.</p>
    </section>

    <section class="ws-section">
      <div class="ws-kicker">03 · Ta trajectoire</div>
      <p class="ws-lead">De 16 à 38 ans. Personne ne connaît la sienne à l'avance.</p>
      ${trajectoryStrip()}
    </section>

    <section class="ws-section">
      <div class="ws-kicker">04 · Sur ton téléphone</div>
      <p class="ws-lead">HARDWOOD est un lien, pas une appli du store -- mais tu peux l'installer comme une, en trois gestes :</p>
      ${homeScreenStrip()}
    </section>

    <div style="margin-top:8px;text-align:center">
      <button class="btn" id="wGo">Compris, on commence</button>
    </div>
  </div>`;
  const skip=document.getElementById('wSkip'); if(skip) skip.onclick=()=>{ setWelcomeSeen(); screenTitle(); };
  document.getElementById('wGo').onclick=()=>{ setWelcomeSeen(); screenTitle(); };
}

export function screenTitle(){
  resetAccent(); // pas d'accent de club/nation hérité de la carrière précédente sur le titre
  setInCareer(false);
  if(!welcomeSeen()){ screenWelcome(); return; }
  const best=hofBest();
  // Reprise de partie (voir engine/savegame.js) : bouton principal quand une carrière est en
  // pause, "Commencer" repasse alors en secondaire -- reprendre est l'intention la plus probable.
  const resumable = hasSavedGame();
  stage.innerHTML = `<div class="title-screen">
    <div class="eyebrow">Carrière · saison après saison</div>
    <h1>HARD<span class="o">W</span>OOD</h1>
    <p class="tag">De 16 à 38 ans, écris ta légende du basket. Chaque choix pèse : le talent ouvre des portes, les décisions décident du reste. La NBA est le sommet, encore faut-il y arriver.</p>
    <div style="margin-top:28px;display:flex;gap:12px;justify-content:center;flex-wrap:wrap">
      ${resumable?`<button class="btn" id="resumeGo">▶️ Reprendre ma carrière</button>`:''}
      <button class="btn ${resumable?'ghost':''}" id="go">Commencer ${resumable?'une nouvelle':'ma'} carrière</button>
      <button class="btn ghost" id="hof">🏆 Panthéon</button>
      <button class="btn ghost" id="badges">🎖️ Badges</button>
    </div>
    ${best?`<div class="best-chip">🏆 Meilleur score légende : <b>${best}</b></div>`:''}
    <div class="kbd"><img class="brand-mark-mini" src="/logo-mark.png" alt="" width="18" height="18">Écris ta légende, saison après saison · <a href="#" id="welcomeReopen" class="welcome-link">comment jouer ?</a></div>
  </div>`;
  document.getElementById('go').onclick=()=>{
    // Garde-fou : commencer une nouvelle carrière écraserait la sauvegarde en cours -- confirmation
    // explicite avant de perdre cette reprise possible (jamais silencieux).
    if(hasSavedGame() && !confirm('Une carrière est en cours et sera définitivement écrasée si tu en commences une nouvelle. Continuer ?')) return;
    clearSavedGame();
    setWelcomeSeen(); setG(newPlayer()); screenCreate();
  };
  const resumeBtn=document.getElementById('resumeGo');
  if(resumeBtn) resumeBtn.onclick=()=>resumeCareer();
  document.getElementById('hof').onclick=()=>renderHallOfFame();
  document.getElementById('badges').onclick=()=>renderBadges();
  document.getElementById('welcomeReopen').onclick=(e)=>{ e.preventDefault(); screenWelcome(); };
}

// Reprise de partie (voir engine/savegame.js) : recharge l'état complet, puis ré-affiche EXACTEMENT
// l'écran où la carrière était en pause -- décision de mouvement/académie en attente en priorité
// (mémorisées telles quelles, voir renderMoveScreen()/renderAcademyChoice() ci-dessous), sinon
// l'événement courant, sinon le bilan de la dernière saison jouée (seul point d'arrêt "stable"
// entre deux saisons). Repli sur l'écran de création si la partie a été interrompue avant même
// d'avoir un club (p.club encore vide).
export function resumeCareer(){
  const loaded = loadGame();
  if(!loaded){ screenTitle(); return; }
  setG(loaded);
  const p = G;
  resetAccent();
  if(p.pendingAcademyOffers){ renderAcademyChoice(p.pendingAcademyOffers); return; }
  if(p.pendingMove){ renderMoveScreen(p.pendingMove); return; }
  if(!p.club){ screenCreate(); return; }
  if(p.curEvents && p.evIndex < p.curEvents.length){ renderEvent(p.curEvents[p.evIndex]); return; }
  const lastSeason = p.seasons.length ? p.seasons[p.seasons.length-1] : null;
  if(lastSeason){ renderSeasonResult(lastSeason, !!lastSeason.champion); return; }
  screenCreate();
}

export function screenCreate(){
  const p=G;
  setInCareer(true);
  if(p.step===0){ // nation
    // Grille compacte dédiée (voir .nation-grid/.nation-opt dans styles.css) : à la différence
    // des autres étapes (4-8 choix), les nations sont ~35 -- la carte pleine taille générique
    // (.opt) forçait un long défilement. Tuile réduite au flag + nom + force en coin (réutilise
    // .abbr, déjà utilisé pour l'abréviation de poste), toutes visibles sans scroll pénible.
    stage.innerHTML = wrapCreate(1,'Ton pays','Ton identité et ton éligibilité en sélection nationale -- ton point de départ sportif se décidera plus tard, indépendamment.',
      NATIONS.map((n,i)=>`<button class="opt nation-opt ${p.nation&&p.nation.id===n.id?'pick':''}" data-i="${i}">
        <span class="abbr">${n.strength}</span>
        <div class="flag">${n.flag}</div><div class="ttl">${n.name}</div></button>`).join(''),
      false, !!p.nation, 'nation-grid');
    bindOpts(NATIONS,(n)=>{p.nation=n;});
  }
  else if(p.step===1){ // position
    stage.innerHTML = wrapCreate(2,'Ton poste','Il décide de ton rôle sur le terrain et de ce qui te fera briller.',
      POSITIONS.map((pos,i)=>`<button class="opt ${p.pos===pos.id?'pick':''}" data-i="${i}">
        <div class="abbr">${pos.emoji} ${pos.abbr}</div><div class="ttl">${pos.name}</div>
        <div class="desc">${pos.desc}</div></button>`).join(''), false, !!p.pos);
    bindOpts(POSITIONS,(pos)=>{p.pos=pos.id;});
  }
  else if(p.step===2){ // style de jeu
    stage.innerHTML = wrapCreate(3,'Ton style de jeu','Très tôt, tu te forges une identité. Elle oriente tes stats de départ et ta façon de progresser.',
      STYLES.map((st,i)=>`<button class="opt ${p.style===st.id?'pick':''}" data-i="${i}">
        <div class="ttl">${st.emoji} ${st.name}</div><div class="desc">${st.desc}</div></button>`).join(''), false, !!p.style);
    bindOpts(STYLES,(st)=>{p.style=st.id;});
  }
  else if(p.step===3){ // lifestyle
    stage.innerHTML = wrapCreate(4,'Ton mode de vie','La discipline forge ta progression… et ta réputation.',
      LIFESTYLES.map((l,i)=>`<button class="opt ${p.life===l.id?'pick':''}" data-i="${i}">
        <div class="ttl">${l.emoji} ${l.name}</div><div class="desc">${l.desc}</div></button>`).join(''), false, !!p.life);
    bindOpts(LIFESTYLES,(l)=>{p.life=l.id;});
  }
  else if(p.step===4){ // scouting reveal + name
    rollTalent(p);
    const hypeStars = starStr(p.hype);
    const st=STYLES.find(x=>x.id===p.style);
    stage.innerHTML = wrapCreate(5,'Rapport de détection','Les recruteurs ont observé ton profil. Voici ce qu\'ils voient.',
      `<div class="scout">
        <div class="hype"><span class="stars">${hypeStars}</span>
          <span style="color:var(--chalk-dim);font-size:13px">Potentiel évalué par les scouts · ${st?st.emoji+' '+st.name:''}</span></div>
        <div class="attrs">${ATTRS.map(a=>`<div class="attr"><div class="arow"><span class="an">${a.name}</span>
          <span class="av">${p.attrs[a.id]}</span></div><div class="abar"><i style="width:${p.attrs[a.id]}%"></i></div></div>`).join('')}</div>
        <div class="field" style="margin-top:20px"><label>Ton nom de joueur</label>
          <input id="pname" value="${p.name}" maxlength="22" autocomplete="off"></div>
      </div>`, true, true);
    document.getElementById('nextC').textContent='Signer ma première licence';
  }
  wireNav();
}
function wrapCreate(num,title,sub,inner,isLast,canNext,gridClass=''){
  return `<div class="create">
    <div class="step-h"><span class="num">${num} / 5</span></div>
    <h2>${title}</h2><p class="sub">${sub}</p>
    <div class="opt-grid ${gridClass}">${isLast?'':inner}</div>${isLast?inner:''}
    <div class="nav-row">
      <button class="btn ghost sm" id="backC">${num===1?'Annuler':'Retour'}</button>
      <button class="btn" id="nextC" ${canNext?'':'disabled style="opacity:.4;pointer-events:none"'}>Continuer</button>
    </div></div>`;
}
function bindOpts(list,setter){
  stage.querySelectorAll('.opt').forEach(el=>{
    el.onclick=()=>{ setter(list[+el.dataset.i]);
      stage.querySelectorAll('.opt').forEach(o=>o.classList.remove('pick'));
      el.classList.add('pick');
      const nx=document.getElementById('nextC'); nx.disabled=false; nx.style.opacity=1; nx.style.pointerEvents='auto';
    };
  });
}
function wireNav(){
  const back=document.getElementById('backC'), next=document.getElementById('nextC');
  if(back) back.onclick=()=>{ if(G.step===0){screenTitle();return;} G.step--; screenCreate(); };
  if(next) next.onclick=()=>{
    if(G.step===4){ const inp=document.getElementById('pname'); G.name=(inp.value.trim()||G.name); startCareer(); return; }
    G.step++; screenCreate();
  };
}
// Choix d'académie de départ (voir engine/academies.js pour la génération des offres) :
// remplace l'ancien point de départ automatique déduit de la nationalité. Chaque offre porte
// l'identité d'un pays réel (avec ses propres données de club, voir ACADEMY_NATION_IDS) et un
// vrai club d'académie tiré de ce pays -- choisir, c'est décider à la fois du pays de jeu ET de
// la voie de développement (US/Europe/Australie), indépendamment de la nationalité du joueur.
const ACADEMY_PATH_LABEL = { us:'Voie US · lycée → université → draft', eu:'Voie Europe · académie → clubs pro', au:'Voie Australie · académie → NBL1 → NBL' };
export function renderAcademyChoice(offers){
  const p = G;
  setInCareer(true);
  // Mémorisé pour la reprise de partie (voir engine/savegame.js) : reflété à chaque appel, y
  // compris un éventuel second appel -- toujours la dernière liste réellement affichée.
  p.pendingAcademyOffers = offers;
  const cards = offers.map((n,i)=>{
    // Le club affiché ici EST le club de départ réel si cette offre est retenue (voir
    // generateAcademyOffers() dans engine/academies.js -- tiré une seule fois, attaché à
    // l'offre, jamais re-tiré au clic).
    const club = n.club;
    const fl = academyFlavor(club);
    const abroad = n.id !== p.nation.id;
    return `<button class="opt academy-opt" data-i="${i}">
      <div class="flag">${n.flag}</div><div class="ttl">${club.name}</div>
      <div class="desc">${n.name} · ${ACADEMY_PATH_LABEL[n.path]}</div>
      <div class="desc academy-sub">${fl?fl+' · ':''}${abroad?'À l\'étranger, loin des tiens':'Dans ton pays natal'}</div>
    </button>`;
  }).join('');
  stage.innerHTML = `<div class="create academy-choice">
    <div class="step-h"><span class="num">Nouveau chapitre</span></div>
    <h2>Les académies s'intéressent à toi</h2>
    <p class="sub">Ton profil a circulé. Plusieurs centres de formation, dans des pays différents, veulent te faire confiance. Ce choix décide de ton pays d'évolution et de ta voie de départ pour les prochaines années -- indépendamment de ta nationalité.</p>
    <div class="opt-grid academy-grid">${cards}</div>
  </div>`;
  stage.querySelectorAll('.academy-opt').forEach(el=>{
    el.onclick=()=>{ chooseAcademy(offers[+el.dataset.i]); };
  });
}

// Étoile en SVG fait maison plutôt qu'un glyphe unicode ★ : Bricolage Grotesque ne couvre pas
// ce caractère, qui basculait silencieusement sur une police système différente (incohérence
// visuelle) en plus d'hériter d'une couleur mal choisie. Ici la couleur est fixée dans le SVG,
// indépendante de toute police.
const STAR_PATH = 'M12 2 14.9 8.6 22 9.3 16.8 14.1 18.2 21.2 12 17.6 5.8 21.2 7.2 14.1 2 9.3 9.1 8.6Z';
function starSvg(filled){
  return `<svg viewBox="0 0 24 24" width="22" height="22" style="margin:0 1px">
    <path d="${STAR_PATH}" fill="${filled?'var(--star-gold)':'rgba(36,24,19,.16)'}"/></svg>`;
}
function starStr(n){ // n 1..5
  let s=''; for(let i=1;i<=5;i++){ s+= starSvg(i<=n); } return s;
}

// Indice discret de stat molle affectée par un choix (voir demande "rendre les stats vivantes
// lisibles") : n'introspecte que les effets en objet PLAIN (la majorité des choix) -- les effets
// en fonction (résolution aléatoire/actionRoll) restent silencieux ici, ce indice est du "best
// effort", pas une garantie universelle. Au plus 2 puces, pour rester discret.
const STAT_HINT_META = {
  fitness: { label:'Forme', color:'var(--chalk-dim)' },
  morale: { label:'Moral', color:'var(--mint)' },
  popularity: { label:'Popularité', color:'var(--orange)' },
  media: { label:'Médias', color:'var(--plum)' },
};
function statHintDots(effect){
  if(typeof effect !== 'object' || effect===null) return '';
  const keys = Object.keys(STAT_HINT_META).filter(k=>k in effect);
  if(!keys.length) return '';
  return `<span class="stat-hints">${keys.slice(0,2).map(k=>
    `<span class="stat-hint" style="--dot-color:${STAT_HINT_META[k].color}" title="Affecte : ${STAT_HINT_META[k].label}"></span>`).join('')}</span>`;
}

/* ---- Rendu d'un événement ---- */
export function renderEvent(ev){
  const p=G, lg=LEAGUES[p.league];
  setInCareer(true);
  const ctx={p,lg};
  const body = typeof ev.body==='function'?ev.body(ctx):ev.body;
  const title= typeof ev.title==='function'?ev.title(ctx):ev.title;
  const choices = ev.choices(ctx);
  // Fenêtre de sélection nationale (p.seasonMods.natWindow, fixée en tête de saison) : bascule
  // COMPLÈTE de thème (accent couleurs du pays) pour toute la saison, pas seulement l'événement
  // "nation" lui-même -- une vraie parenthèse à part. En plus de ça, l'événement nation
  // spécifique reçoit sa propre petite animation d'annonce (.nation-announce) au moment où il
  // survient, distincte de l'ambiance de fond déjà posée par la fenêtre.
  // "Grand moment" (jet réel à la clé, cf. CAT_ICON dans events.js) : cartouche dédiée pour que
  // ces événements se distinguent visuellement avant même la lecture du titre, plus une entrée
  // animée (.grand-moment-announce, même mise en scène que .nation-announce ci-dessous -- voir
  // styles.css) pour que le money-time/duel/finale se sente arriver, pas juste s'afficher.
  const grandMoment = ['clutch','defense','duel','finals'].includes(ev.cat);
  const natWindow = !!p.seasonMods.natWindow;
  const isNatAnnounce = ev.cat==='nation';
  const cardClass = ['event', grandMoment?'grand-moment grand-moment-announce':'', natWindow?'nation-window':'', isNatAnnounce?'nation-announce':''].filter(Boolean).join(' ');
  stage.innerHTML = renderHUD(natWindow||isNatAnnounce?'nation':'club') + `<div class="card ${cardClass}" style="margin-top:2px">
    <div class="season-tag">
      <span class="chip">📅 Saison ${p.year} · ${p.age} ans</span>
      <span class="chip n">${LEAGUES[p.league].emoji||'🏀'} ${lg.short} · ${p.club}</span>
      <span class="chip n">${catTag(ev)}</span>
      ${natWindow?`<span class="chip n nat-window-chip">${p.nation.flag} Fenêtre sélection</span>`:''}
    </div>
    <h2>${title}</h2>
    <div class="body">${body}</div>
    <div class="choices">${choices.map((c,i)=>`
      <button class="choice" data-i="${i}"><span class="pip"></span>
        <span><span class="ct">${c.label}${statHintDots(c.effect)}</span>${c.hint?`<span class="cd">${c.hint}</span>`:''}</span></button>`).join('')}
    </div></div>`;
  stage.querySelectorAll('.choice').forEach(el=>{
    el.onclick=()=>{ const c=choices[+el.dataset.i]; applyChoice(c,ctx); };
  });
}
export function showDeltaFlash(outcome, deltas, newTraits){
  const mini = deltas.filter(d=>d.v!==0).map(d=>{
    if(d.money) return `<span>${d.k} <b class="${d.v<0?'dn':''}">${d.v>0?'+':''}${money(Math.abs(d.v)).replace(' €','')}</b></span>`;
    const cls = d.v<0?'dn':''; const sign=d.v>0?'+':'';
    return `<span>${d.k} <b class="${cls}">${sign}${d.v}</b></span>`;
  }).join('');
  // Traits nouvellement débloqués par CE choix (voir checkTraitUnlocks() dans engine/tags.js) :
  // mis en avant AVANT le reste du bandeau, mise en scène marquante (icône, couple avantage/
  // inconvénient, entrée animée -- voir .trait-unlock dans styles.css), mais toujours dans le
  // même bandeau/même clic "Suite" que d'habitude pour ne jamais casser le rythme.
  const traitsHtml = (newTraits && newTraits.length) ? newTraits.map(renderTraitUnlockCard).join('') : '';
  const card=document.createElement('div');
  card.className='card'; card.style.marginTop='12px'; card.style.borderLeft='3px solid var(--orange)';
  card.innerHTML = `${traitsHtml}
    ${outcome?`<div class="body" style="font-size:14.5px">${outcome}</div>`:''}
    ${mini?`<div class="inline-mini">${mini}</div>`:''}
    <div style="text-align:right;margin-top:14px"><button class="btn sm" id="contBtn">Suite</button></div>`;
  stage.querySelector('.event').replaceWith(card);
  document.getElementById('contBtn').onclick=()=>nextEventOrSim();
}

export function renderSeasonResult(s, champion){
  const p=G, lg=LEAGUES[p.league];
  setInCareer(true);
  const gpLabel = (s.leagueGames!=null) ? `${s.gamesPlayed}/${s.leagueGames}` : '·';
  // Stats de jeu (perf, la vraie ligne de score) vs contexte de saison (MIN/MJ/VIC, un cadre
  // d'information, pas une performance) : deux blocs distincts côté rendu (voir .statline vs
  // .statline-ctx dans styles.css), demandé pour hiérarchiser visuellement les deux familles.
  const perfCells=[['PTS',s.pts],['REB',s.reb],['PAS',s.ast],['CTR',s.blk??0],['INT',s.stl??0]];
  // Le total de victoires n'est vraiment crédible/attendu qu'en NBA (82 matchs, référence connue
  // de tous) -- ailleurs, il n'apporte que de la confusion (formats de saison très variables,
  // aucun repère réel pour juger si "22 victoires" est bon ou mauvais dans telle ligue).
  const ctxCells=[['MIN',s.minutes],['MJ',gpLabel]];
  if(p.league==='nba') ctxCells.push(['VIC',s.wins]);
  let verdict = seasonVerdict(p,s,lg);
  const prev = p.seasons.length>=2 ? p.seasons[p.seasons.length-2].ovr : null;
  const delta = prev!==null ? s.ovr - prev : null;
  const deltaTri = delta>0
    ? `<svg viewBox="0 0 24 24" width="9" height="9" style="vertical-align:1px"><path d="M12 5L20 18H4Z" fill="currentColor"/></svg>`
    : `<svg viewBox="0 0 24 24" width="9" height="9" style="vertical-align:1px"><path d="M12 19L4 6H20Z" fill="currentColor"/></svg>`;
  // Vert/rouge classiques (voir --up/--down dans styles.css) pour une lecture immédiate bon/mauvais.
  const deltaHtml = delta!==null && delta!==0
    ? `<span class="chip" style="background:${delta>0?'rgba(43,110,61,.12)':'rgba(186,51,39,.10)'};border-color:${delta>0?'var(--up)':'var(--down)'};color:${delta>0?'var(--up)':'var(--down)'}">${deltaTri} ${Math.abs(delta)} OVR vs saison passée</span>`
    : '';
  const accList = s.acc.slice();
  if(s.td) accList.push(`🎯 ${s.td} triple-double${s.td>1?'s':''}`);
  const accHtml = accList.length? `<div class="accolades">${accList.map(a=>`<span class="badge ${a.includes('MVP')||a.includes('Champion')?'title':''}">${a}</span>`).join('')}</div>`:'';
  const compHtml = renderCompetitionContext(s, lg, p);
  // La sélection nationale a désormais son propre écran dédié (voir renderNationalResult()) --
  // ce bilan reste un bilan de CLUB, thème club, même les saisons de tournoi.
  stage.innerHTML = renderHUD('club') + `<div class="card scoreboard">
    <div class="sb-head"><h2>Saison ${p.year} · bilan</h2>
      <div style="display:flex;gap:6px;flex-wrap:wrap">${deltaHtml}<span class="chip n">${lg.short} · ${p.club}</span></div></div>
    <div class="statline">${perfCells.map((c,i)=>`<div class="stat-cell${i===0?' hot':''}"><div class="sv">${c[1]}</div><div class="sl">${c[0]}</div></div>`).join('')}</div>
    <div class="statline-ctx">${ctxCells.map(c=>`<div class="ctx-cell"><span class="ctx-v">${c[1]}</span><span class="ctx-l">${c[0]}</span></div>`).join('')}</div>
    <div class="verdict">${verdict}</div>
    ${compHtml}${accHtml}
    <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;margin-top:18px">
      <div>${p.age>=33?`<button class="btn ghost sm" id="retireBtn">Raccrocher les baskets</button>`:''}</div>
      <button class="btn" id="afterSeason">Intersaison →</button>
    </div>
  </div>`;
  document.getElementById('afterSeason').onclick=()=>postSeason();
  const rb=document.getElementById('retireBtn'); if(rb) rb.onclick=()=>endCareer('choice');
  animateStats();
}

// Résultat de tournoi national : un écran à part entière (thème "nation" complet, pas une
// simple ligne noyée dans le bilan de club), volontairement TRÈS différent selon l'issue --
// rapide et sobre en cas d'élimination, une vraie séquence de célébration (médaille agrandie,
// texte dédié par métal) en cas de podium. onContinue ramène vers le bilan de saison du club.
const NAT_MEDAL_COPY = {
  Or: (nat)=>`Sommet du basket mondial : ${nat} monte sur la plus haute marche du podium, et toi avec elle.`,
  Argent: (nat)=>`Une finale perdue la tête haute : ${nat} termine sur le podium, tout près du sommet.`,
  Bronze: (nat)=>`Arrachée dans la douleur : ${nat} termine sur le podium.`,
};
export function renderNationalResult(natLine, onContinue){
  const p = G;
  setInCareer(true);
  const won = !!natLine.medal;
  stage.innerHTML = renderHUD('nation') + `<div class="card nat-result ${won?'celebrate':'quick'}">
    <div class="nat-result-flag">${p.nation.flag}</div>
    <div class="nat-result-eyebrow">${natLine.tourn} · Sélection ${p.nation.name}</div>
    ${won ? `
      <div class="nat-result-medal-wrap">${medalIcon(natLine.medal,108)}</div>
      <h2 class="nat-result-title">Médaille ${natLine.medal.toLowerCase()} !</h2>
      <p class="nat-result-sub">${NAT_MEDAL_COPY[natLine.medal](p.nation.name)}</p>
    ` : `
      <h2 class="nat-result-title">Éliminé</h2>
      <p class="nat-result-sub">Le tournoi s'arrête là pour ${p.nation.name}. Retour au club.</p>
    `}
    ${natLine.mvp?`<div class="nat-result-mvp">🏅 Élu MVP du tournoi</div>`:''}
    <button class="btn" id="natContinue">${won?'Savourer, puis reprendre la saison':'Reprendre la saison'}</button>
  </div>`;
  document.getElementById('natContinue').onclick=()=>onContinue();
}

// Zone de qualification NBA associée à un rang de conférence (voir simulateNbaStandings/
// simulateNbaPlayoffs dans engine/competition.js) : affichée à part du classement pour que la
// frontière qualification directe / Play-In / élimination se lise d'un coup d'œil, sans avoir à
// déduire le seuil du rang brut.
function nbaSeedZone(rank){
  if(rank<=6) return { label:'Qualification directe en playoffs', cls:'good' };
  if(rank<=10) return { label:'Zone de Play-In', cls:'warn' };
  return { label:'Hors playoffs', cls:'bad' };
}
// Résumé du parcours de playoffs NBA : mentionne d'abord le Play-In s'il a été traversé (seule
// façon d'atteindre une 7e/8e tête de série), puis le parcours de tours classique -- jamais les
// deux tirages en contradiction puisque tout vient du même appel à simulateNbaPlayoffs().
function nbaPlayoffLine(po){
  const playInNote = !po.playIn ? '' : po.playIn.result==='eliminated'
    ? 'Play-In : éliminé, saison terminée.'
    : `Play-In validé (${po.seed}e tête de série).`;
  if(!po.qualified) return playInNote || `Playoffs : hors zone qualificative cette saison.`;
  const path = po.rounds.map(r=>r.label).join(' → ');
  const tail = po.champion
    ? `${path} · <b style="color:var(--mint)">Champion NBA</b> !`
    : po.reachedFinals
      ? `${path} · Finale NBA perdue.`
      : `Élimination en ${po.rounds[po.rounds.length-1].label.toLowerCase()}.`;
  return playInNote ? `${playInNote} Playoffs : ${tail}` : `Playoffs : ${tail}`;
}
// Contexte de compétition condensé : classement (leader + voisins directs + le joueur) et
// parcours de phase finale résumé en quelques mots. Données déjà calculées dans
// simulateSeason() (voir engine/competition.js) — ici uniquement de la mise en forme. La NBA a
// un affichage dédié (conférence explicite + zone de qualification + Play-In), les autres ligues
// gardent le format générique existant.
function renderCompetitionContext(s, lg, p){
  const st = s.standings, po = s.playoffs;
  if(!st) return '';
  const isNba = p.league==='nba';
  const row=(rank,name,me)=>`<div class="standings-row${me?' me':''}"><span class="sr-rk">#${rank}</span><span class="sr-nm">${me?`<b>${name}</b>`:name}</span></div>`;
  const rows = [
    st.playerRank>1 ? row(1, st.leader.name, false) : null,
    (st.playerRank>2 && st.above) ? row(st.playerRank-1, st.above.name, false) : null,
    row(st.playerRank, p.club, true),
    st.below ? row(st.playerRank+1, st.below.name, false) : null,
  ].filter(Boolean).join('');
  const title = isNba
    ? `NBA · Conférence ${st.conference} (${st.poolSize} clubs)`
    : `${lg.short} · classement (${st.poolSize} clubs)`;
  const zoneHtml = isNba ? (()=>{ const z=nbaSeedZone(st.playerRank); return `<div class="standings-zone standings-zone-${z.cls}">${z.label}</div>`; })() : '';
  const playoffLine = !po ? '' : isNba ? nbaPlayoffLine(po) : (!po.qualified
    ? `Playoffs : pas de qualification cette saison.`
    : po.champion
      ? `Playoffs : ${po.rounds.map(r=>r.label).join(' → ')} · <b style="color:var(--mint)">titre remporté</b> !`
      : po.reachedFinals
        ? `Playoffs : finale perdue, après ${po.rounds.length-1} tour${po.rounds.length-1>1?'s':''} franchi${po.rounds.length-1>1?'s':''}.`
        : `Playoffs : élimination en ${po.rounds[po.rounds.length-1].label.toLowerCase()}.`);
  return `<div class="verdict standings-box">
    <div class="standings-title">${title}</div>
    ${zoneHtml}
    <div class="standings-rows">${rows}</div>
    ${playoffLine?`<div class="standings-playoff">${playoffLine}</div>`:''}
  </div>`;
}

// Texte de couleur (category/comment) d'un vrai club, pour enrichir le hint d'un choix.
function flavor(clubInfoObj){
  if(!clubInfoObj || !clubInfoObj.category) return null;
  return `${clubInfoObj.category}${clubInfoObj.comment ? ' · '+clubInfoObj.comment : ''}`;
}
// Variante pour les académies : deux formats coexistent dans clubData.js selon la source Excel
// d'origine -- FR/DE/GR/RS/SI/US portent `linkedClub` (club pro affilié) + `category:null`,
// AU porte un `category` classique (ex. "Talent Factory") sans `linkedClub`. On assemble tout
// ce qui est disponible plutôt que de supposer un seul format.
function academyFlavor(clubInfoObj){
  if(!clubInfoObj) return null;
  const bits = [];
  if(clubInfoObj.linkedClub) bits.push(`Filière ${clubInfoObj.linkedClub}`);
  if(clubInfoObj.category) bits.push(clubInfoObj.category);
  if(clubInfoObj.comment) bits.push(clubInfoObj.comment);
  return bits.length ? bits.join(' · ') : null;
}

/* Écran de transfert / promotion / draft avec choix */
export function renderMoveScreen(move){
  const p=G, o=ovr(p);
  setInCareer(true);
  // Mémorisé pour la reprise de partie (voir engine/savegame.js) : ce même appel se ré-exécute
  // parfois en cascade (ex. draftDecl -> draft/undrafted) -- toujours le dernier move réellement
  // affiché, effacé au prochain beginSeason() (voir season.js), quel que soit le chemin de sortie.
  p.pendingMove = move;
  let title,body,choices;
  const toLg = move.to?LEAGUES[move.to]:null;
  // dernier rung avant la NBA selon le chemin du joueur (miroir de season.js)
  const continental = p.startPath==='au' ? 'nbl' : 'euro';

  if(move.type==='draftDecl'){
    const intl = move.origin==='intl';
    const declare = ()=>{
      p.draftEntered = true; // la vraie entrée à la draft, une seule fois par carrière
      const pos=draftProjection(o,p.reputation);
      if(pos<=60) renderMoveScreen({type:'draft', pos, to:'nba', club:pickClubName('nba', playCountry(p)), origin:move.origin});
      else renderMoveScreen({type:'undrafted', origin:move.origin});
    };
    if(move.forced){
      title = `Éligibilité automatique à la draft`;
      body = `Tu as 22 ans : c'est la limite d'âge, la draft t'intègre automatiquement cette année. Dernière chance de te faire appeler.`;
      choices=[{label:`Me présenter à la draft`, hint:'Dernière chance', apply:declare}];
    } else {
      title = intl ? `Te déclarer à la draft NBA ?` : `L'heure de la draft`;
      body = intl
        ? `Tu perces vite à l'international et les recruteurs NBA rôdent. Tu peux te déclarer à la draft dès maintenant (un pari sur ton potentiel, une seule vraie tentative dans ta carrière), ou continuer à bâtir ton nom avant de tenter le grand saut.`
        : `Ta carrière universitaire t'ouvre les portes de la draft. Te déclarer maintenant, c'est saisir ta chance mais aussi la jouer d'un coup : tu n'auras qu'une vraie entrée dans ta carrière. D'autres attendent une saison de plus pour grimper dans les projections.`;
      choices=[
        {label:`Me déclarer à la draft`, hint:'Tenter la NBA (une seule vraie entrée possible)', apply:declare},
        intl
          ? {label:`Continuer à progresser à l'international`, hint:'Bâtir avant de sauter', apply:()=>{ p.morale=clamp(p.morale+2,0,100); beginSeasonKeep(); }}
          : {label:`Rester une saison de plus à la fac`, hint:'Grimper dans les projections', apply:()=>{ beginSeasonKeep(); }}
      ];
    }
  }
  else if(move.type==='draft'){
    const rnd1 = move.pos<=30;
    const late = move.pos>30; // fin de 1er tour / 2e tour : peu d'attentes, temps de jeu à mériter
    title = `Draft NBA · appelé en position ${move.pos}`;
    body = `Ton nom résonne dans la salle. <b>${move.club}</b> te sélectionne au ${ordinal(move.pos)} rang${rnd1?' du premier tour':' (second tour)'}. Le rêve devient contrat${late?', mais rien n\'est garanti : à toi de forcer la main du coach.':'.'}`;
    choices=[
      {label:`Signer avec ${move.club}`, hint: late?'Direction la NBA, un rôle à conquérir':'Direction la NBA',
        apply:()=>{ p.draftPos=move.pos; doMove(move, late?{reputation:+2,morale:+4,popularity:+2}:{reputation:+8,morale:+10,popularity:+10}, 'draft'); }},
      {label:'Refuser et rester une saison de plus', hint: move.origin==='college'?'Prendre le temps de mûrir à la fac':'Prendre le temps de progresser',
        apply:()=>{ p.morale=clamp(p.morale-3,0,100); beginSeasonKeep(); }}
    ];
  }
  else if(move.type==='undrafted'){
    const intl = move.origin==='intl';
    title = `Non drafté`;
    body = intl
      ? `Ton nom n'est pas appelé à la draft. C'était ta seule vraie tentative : désormais agent libre, c'est par le circuit international ou la G League que tu devras te faire remarquer pour espérer un jour rejoindre la NBA.`
      : `Aucune équipe n'appelle ton nom. C'était ta seule vraie tentative : la porte de la draft est refermée pour de bon. Agent libre, tu devras te frayer un chemin par la G League ou l'international.`;
    choices = intl ? [
      {label:`Continuer à t'imposer à l'international`, hint:'Ta chance NBA viendra par un autre chemin', apply:()=>{ p.morale=clamp(p.morale-2,0,100); beginSeasonKeep(); }},
      {label:`Rejoindre la G League pour viser un call-up`, hint:'La petite porte US', apply:()=>doMove({type:'promo',to:'gleague',club:pickClubName('gleague', playCountry(p))},{morale:-3,salary:ri(40,90)},'promo')}
    ] : [
      {label:'Rejoindre la G League et se battre pour un call-up', hint:'La voie difficile vers la NBA', apply:()=>doMove({type:'promo',to:'gleague',club:pickClubName('gleague', playCountry(p))},{morale:-4,salary:ri(40,90)},'promo')},
      {label:`Signer un gros contrat en ${LEAGUES[continental].name}`, hint:'Devenir une star à l\'international', apply:()=>doMove({type:'promo',to:continental,club:pickClubName(continental, playCountry(p))},{morale:+3,salary:ri(300,900),reputation:+4},'promo')}
    ];
  }
  else if(move.type==='nbaJump'){
    title = `La NBA t'appelle`;
    body = `Après avoir marqué l'EuroLeague, une franchise NBA, <b>${move.club}</b>, pose une offre sur la table. Le grand saut, avec tout ce qu'il implique : plus d'argent, plus de lumière, mais un rôle à reconquérir.`;
    choices=[
      {label:`Tenter l'aventure NBA à ${move.club}`, hint:'Le sommet mondial', apply:()=>doMove(move,{morale:+6,popularity:+12,reputation:+5,salary:ri(500,2500)},'nbaWindow')},
      {label:'Rester roi en Europe', hint:'Statut de franchise player garanti', apply:()=>{ p.morale=clamp(p.morale+4,0,100); p.reputation=clamp(p.reputation+3,0,100); beginSeasonKeep(); }}
    ];
  }
  else if(move.type==='nbaWindow'){
    title = `Une fenêtre s'ouvre en NBA`;
    body = `Après tes performances en ${LEAGUES[p.league].name}, <b>${move.club}</b> te propose un contrat NBA. Le grand saut : plus d'argent et la lumière mondiale, mais un rôle à conquérir, et rien ne garantit que ça marche.`;
    choices=[
      {label:`Tenter la NBA à ${move.club}`, hint:'Le pari du sommet', apply:()=>doMove(move,{morale:+5,popularity:+10,reputation:+4},'nbaWindow')},
      {label:`Rester une référence en ${LEAGUES[p.league].short}`, hint:'Franchise player garanti', apply:()=>{ p.declined.nbaYear=p.year; p.morale=clamp(p.morale+4,0,100); p.reputation=clamp(p.reputation+3,0,100); beginSeasonKeep(); }}
    ];
  }
  else if(move.type==='nbaReturn'){
    title = `Le pari NBA tourne court`;
    body = `Le temps de jeu ne vient pas, tu t'enlises au bout du banc. <b>${move.club}</b> (${LEAGUES[move.to].short}) t'offre un rôle majeur et la lumière que la NBA t'a refusée. Revenir, c'est rebondir la tête haute.`;
    choices=[
      {label:`Rebondir en ${LEAGUES[move.to].short} à ${move.club}`, hint:'Redevenir une star', apply:()=>{ p.nbaStruggle=0; doMove(move,{morale:+4,reputation:+1},'nbaReturn'); }},
      {label:`S'accrocher en NBA une saison de plus`, hint:'Refuser d\'abandonner (risqué)', apply:()=>{ p.nbaStruggle=0; p.morale=clamp(p.morale-3,0,100); beginSeasonKeep(); }}
    ];
  }
  else if(move.type==='freeAgency'){
    const rivals = pickClubs(p.league, playCountry(p), 2, {exclude:p.club, popularity:p.popularity});
    const upMap = { academy: p.startPath==='au'?'nbl1':'third', third:'second', second:'national', national:'euro',
                    nbl1:'nbl', nbl:'nba', gleague:'nba', euro:'nba' };
    const upKey=upMap[p.league];
    const canUp = upKey && o>=LEAGUES[upKey].starter-2 && p.age<=30;
    const curInfo = clubInfo(p.league, playCountry(p), p.club);
    const salStay=Math.round(salaryFor(p.league,o,p.reputation)*1.05*clubSalaryMod(curInfo?.prestige));
    title = `🖊️ Free agency ouverte`;
    body = `Tu as refusé de prolonger : te voilà libre sur le marché. Plusieurs offres concrètes sont sur la table : à toi de choisir ton avenir.`;
    choices=[
      {label:`Re-signer à ${p.club}`, hint:`Stabilité, tu connais la maison · 💰 ${money(salStay)}/an`,
        apply:()=>{ p.contractY=ri(2,4); p.salary=salStay; p.morale=clamp(p.morale+4,0,100); p.coach=clamp(p.coach+3,0,100); pushTL(`Prolonge à <b>${p.club}</b> · 💰 ${money(salStay)}/an.`); beginSeason(); }}
    ];
    rivals.forEach((rc,i)=>{ const sal=Math.round(salaryFor(p.league,o,p.reputation)*1.1*clubSalaryMod(rc.prestige));
      choices.push({label:`Signer à ${rc.name}`, hint:`${flavor(rc)||(i===0?'Projet ambitieux':'Gros chèque, nouveau vestiaire')} · 💰 ${money(sal)}/an`,
        apply:()=>doMove({type:'transfer',to:p.league,club:rc.name},{morale:+2,reputation:+2,salary:sal},'freeAgent')}); });
    if(canUp){ const uc=pickClub(upKey, playCountry(p), {popularity:p.popularity}); const sal=Math.round(salaryFor(upKey,o,p.reputation)*clubSalaryMod(uc.prestige));
      choices.push({label:`Viser plus haut : ${uc.name} (${LEAGUES[upKey].short})`, hint:`${flavor(uc)||'Monter d\'un cran, tout à prouver'} · 💰 ${money(sal)}/an`,
        apply:()=>doMove({type:'promo',to:upKey,club:uc.name},{morale:+4,reputation:+3,salary:sal},'promo')}); }
    // Marché ouvert = aussi l'occasion d'une offre venue de l'étranger, une fois le premier
    // contrat pro déjà signé (donc hors formation) : une vraie option d'expatriation, pas
    // seulement un changement de club dans le même pays.
    if(p.startPath==='eu' && ['third','second','national'].includes(p.league)){
      const expatId = pickExpatNation(p);
      if(expatId){
        const destName = NATIONS.find(n=>n.id===expatId)?.name || '';
        const ec = pickClub(p.league, expatId, {popularity:p.popularity});
        const esal = Math.round(salaryFor(p.league,o,p.reputation)*1.08*clubSalaryMod(ec.prestige));
        choices.push({label:`✈️ Tenter l'étranger : ${ec.name} (${destName})`, hint:`${flavor(ec)||'Découvrir un nouveau championnat'} · 💰 ${money(esal)}/an`,
          apply:()=>doMove({type:'expatriate',to:p.league,club:ec.name,destNation:expatId,fromNation:playCountry(p)},{morale:+3,reputation:+3,salary:esal},'expatriate')});
      }
    }
  }
  else if(move.type==='nbaSwan'){
    title = `🌟 La NBA t'appelle, pour l'histoire`;
    body = `Tu as tout gagné en ${LEAGUES[p.league].name}. Sur le tard, <b>${move.club}</b> t'offre un contrat court (un an ou deux) pour vivre enfin le rêve NBA et finir en beauté. Un dernier grand frisson.`;
    choices=[
      {label:`Vivre le rêve à ${move.club}`, hint:'Baroud d\'honneur au sommet',
        apply:()=>doMove(move,{morale:+8,popularity:+12,reputation:+3},'nbaSwan')},
      {label:`Rester une légende de ${LEAGUES[p.league].short}`, hint:'Fidèle jusqu\'au bout',
        apply:()=>{ p.morale=clamp(p.morale+5,0,100); p.reputation=clamp(p.reputation+2,0,100); beginSeasonKeep(); }}
    ];
  }
  else if(move.type==='callup'){
    title = `Call-up en NBA !`;
    body = `Ton travail en G League a payé : <b>${move.club}</b> te signe un contrat NBA. À toi de saisir ta chance sous les projecteurs.`;
    choices=[{label:`Signer avec ${move.club}`, hint:'Enfin la NBA', apply:()=>doMove(move,{morale:+9,popularity:+8,reputation:+5},'callup')}];
  }
  else if(move.type==='promo'){
    title = `Palier franchi · ${toLg.name}`;
    body = `Ton niveau ne passe plus inaperçu. <b>${move.club}</b> (${toLg.short}) t'offre un contrat pour monter d'un cran. Plus fort, plus exposé.`;
    choices=[
      {label:`Signer à ${move.club}`, hint:`Monter en ${toLg.short}`, apply:()=>doMove(move,{morale:+5,reputation:+3},'promo')},
      {label:'Rester encore un an pour dominer', hint:'Consolider avant de monter', apply:()=>{ p.morale=clamp(p.morale-2,0,100); beginSeasonKeep(); }}
    ];
  }
  else if(move.type==='transfer'){
    const tl=LEAGUES[move.to];
    const offered = move.club && move.club!==p.club ? [clubInfo(move.to, playCountry(p), move.club)].filter(Boolean) : [];
    const extra = pickClubs(move.to, playCountry(p), 2-offered.length, {exclude:[p.club, ...offered.map(c=>c.name)], popularity:p.popularity});
    const opts = [...offered, ...extra];
    title = `Le marché s'agite autour de toi`;
    body = `Ta cote grimpe : plusieurs clubs de ${tl.short} veulent te recruter. Changer de maillot, c'est de l'ambition, et la pression qui va avec.`;
    choices = opts.map((c,i)=>{ const sal=Math.round(salaryFor(move.to,o,p.reputation)*1.1*clubSalaryMod(c.prestige));
      return {label:`Rejoindre ${c.name}`, hint:`${flavor(c)||(i===0?'Le favori pour ta signature':'Offre alléchante')} · 💰 ${money(sal)}/an`,
        apply:()=>doMove({type:'transfer',to:move.to,club:c.name},{morale:+3,reputation:+2,salary:sal},'freeAgent')}; });
    choices.push({label:`Rester fidèle à ${p.club}`, hint:'La loyauté paie aussi (+moral, +vestiaire)',
      apply:()=>{ p.morale=clamp(p.morale+4,0,100); p.reputation=clamp(p.reputation+2,0,100); p.coach=clamp(p.coach+3,0,100); beginSeasonKeep(); }});
  }
  else if(move.type==='expatriate'){
    const fromName = NATIONS.find(n=>n.id===move.fromNation)?.name || p.nation.name;
    const destName = NATIONS.find(n=>n.id===move.destNation)?.name || '';
    title = `✈️ Une offre venue d'ailleurs`;
    body = `<b>${move.club}</b> (${toLg.short}, ${destName}) veut t'arracher à ${fromName}. Nouveau championnat, nouvelle langue, nouveau vestiaire à conquérir loin de chez toi : une expatriation, un vrai tournant de carrière — pas un simple changement de maillot.`;
    choices=[
      {label:`Partir à ${move.club}`, hint:`Direction ${destName}`, apply:()=>doMove(move,{morale:+4,reputation:+4},'expatriate')},
      {label:`Rester fidèle à ${fromName}`, hint:'Le confort du pays connu', apply:()=>{ p.morale=clamp(p.morale+3,0,100); p.coach=clamp(p.coach+2,0,100); beginSeasonKeep(); }}
    ];
  }
  else if(move.type==='demote'){
    title = `Rétrogradé en ${toLg.short}`;
    body = `Le niveau ne suit plus. Faute de temps de jeu, tu redescends à <b>${move.club}</b> pour te relancer. Le basket ne pardonne pas, mais les retours existent.`;
    choices=[{label:'Rebondir plus bas', hint:'Se relancer', apply:()=>doMove(move,{morale:-8,reputation:-4},'demote')}];
  }
  // Montée/descente du CLUB (distincte de move.type==='demote' ci-dessus, qui concerne le
  // niveau du JOUEUR) : le club garde son nom et son ancienneté, seul le palier change — pas de
  // "nouveau club" au sens de doMove(), donc pas de reset de confiance du coach ni d'ancienneté.
  else if(move.type==='clubRelegated'){
    title = `Relégation`;
    body = `Une saison compliquée pour l'équipe : <b>${move.club}</b> termine dans la zone rouge du classement et redescend en ${toLg.name}. Le club garde son identité, mais le niveau de la compétition change du tout au tout.`;
    choices=[{label:`Continuer avec ${move.club}`, hint:'Rebondir un cran plus bas', apply:()=>{
      p.league=move.to; p.morale=clamp(p.morale-4,0,100); p.coach=clamp(p.coach-2,0,100);
      p.salary=salaryFor(p.league,o,p.reputation);
      pushTL(`📉 <b>${move.club}</b> relégué en ${toLg.short}.`);
      beginSeason();
    }}];
  }
  else if(move.type==='clubPromoted'){
    title = `Promotion !`;
    body = `Grâce à une saison pleine, <b>${move.club}</b> termine en tête de son groupe et monte en ${toLg.name}. Un vrai bond pour le club, et pour toi.`;
    choices=[{label:`Continuer avec ${move.club}`, hint:'Découvrir un cran plus haut', apply:()=>{
      p.league=move.to; p.morale=clamp(p.morale+5,0,100); p.popularity=clamp(p.popularity+3,0,100);
      p.salary=salaryFor(p.league,o,p.reputation);
      pushTL(`📈 <b>${move.club}</b> promu en ${toLg.short} !`);
      beginSeason();
    }}];
  }

  const singleDest = move.to && !['freeAgency','transfer','draftDecl'].includes(move.type);
  const salaryLine = singleDest ? `<div class="body" style="margin-top:2px;color:var(--up);font-family:'Bricolage Grotesque';font-weight:600;letter-spacing:.03em">💰 Salaire annuel estimé : <b>${money(salaryFor(move.to,o,p.reputation))}</b></div>` : '';
  stage.innerHTML = renderHUD() + `<div class="card event">
    <div class="season-tag"><span class="chip">📅 Intersaison · ${p.age} ans</span>
      <span class="chip n">💼 Marché des transferts</span></div>
    <h2>${title}</h2><div class="body">${body}</div>${salaryLine}
    <div class="choices">${choices.map((c,i)=>`<button class="choice" data-i="${i}"><span class="pip"></span>
      <span><span class="ct">${c.label}</span>${c.hint?`<span class="cd">${c.hint}</span>`:''}</span></button>`).join('')}</div>
  </div>`;
  stage.querySelectorAll('.choice').forEach(el=>{ el.onclick=()=>choices[+el.dataset.i].apply(); });
}

/* ============================================================
   FIN DE CARRIÈRE
============================================================ */
function pressReview(p, s){
  const outlets=['L\'Équipe','ESPN','The Athletic','Gazzetta','Marca','BasketNews','SLAM'];
  const O=()=>pick(outlets);
  const nm=p.name, nat=p.nation.name, q=[];
  if(s.legend>=300) q.push([O(),`« ${nm}, tout simplement l'un des plus grands de l'histoire. On racontera le jeu avant et après lui. »`]);
  else if(s.legend>=230) q.push([O(),`« Une carrière de légende. ${nm} entre au panthéon du basket, et la place est mille fois méritée. »`]);
  else if(s.legend>=180) q.push([O(),`« ${nm} aura été une superstar de son époque, un nom qui a compté au tout premier plan. »`]);
  else if(s.legend>=130) q.push([O(),`« Un très grand joueur, régulièrement All-Star. ${nm} laisse une trace durable. »`]);
  else if(s.legend>=85) q.push([O(),`« ${nm}, un pro respecté de tous, une belle carrière au meilleur niveau qu'il a pu atteindre. »`]);
  else q.push([O(),`« Le sommet lui a échappé, mais ${nm} n'a jamais rien lâché. Un vrai combattant du parquet. »`]);
  if(s.champs>=3) q.push([O(),`« ${s.champs} titres au palmarès : ${nm} est un serial winner, un compétiteur dans l'âme. »`]);
  else if(s.champs>=1) q.push([O(),`« Champion : ${nm} aura connu la consécration collective. Le graal touché du doigt. »`]);
  else q.push([O(),`« Le titre lui aura manqué, mais son niveau de jeu ne s'est jamais discuté. »`]);
  const nba=p.seasons.some(x=>x.league==='nba');
  if(nba && s.peakOvr>=90) q.push([O(),`« Du talent brut détecté tôt jusqu'au sommet NBA : la trajectoire d'un joueur d'exception. »`]);
  else if(nba) q.push([O(),`« Il aura vécu son rêve NBA et porté haut les couleurs de ${nat}. »`]);
  else q.push([O(),`« Une carrière européenne pleine, référence de son championnat et fierté de ${nat}. »`]);
  if((p.clutch||0)>=4) q.push([O(),`« Un sang-froid glacial dans les money-times : ${nm} vivait pour les moments qui comptent. »`]);
  if(s.mvps>=1) q.push([O(),`« Élu MVP, ${nm} a régné sur sa ligue. La marque des tout meilleurs. »`]);
  for(let i=q.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [q[i],q[j]]=[q[j],q[i]]; }
  return q.slice(0,3);
}
export function sparkline(series){
  if(!series||series.length<2) return '';
  const mn=Math.min(...series), mx=Math.max(...series), rng=Math.max(1,mx-mn), peak=mx;
  const bars=series.map(v=>{ const h=8+Math.round((v-mn)/rng*40); const isPeak=v===peak;
    return `<span class="spark-bar ${isPeak?'pk':''}" style="height:${h}px" title="OVR ${v}"></span>`; }).join('');
  return `<div class="spark">${bars}</div><div class="spark-cap">Évolution OVR · pic ${mx}</div>`;
}
// Fin de carrière SUBIE (blessure grave, voir le jet dans postSeason()) : mise en scène dédiée,
// un vrai moment narratif marquant plutôt qu'une ligne noyée dans le bilan habituel -- jamais sur
// un jeune (le jet ne s'exécute qu'à partir du seuil où la retraite volontaire est déjà
// disponible), rare mais réelle. Un seul bouton, puis retour vers le récap normal de fin de
// carrière (endCareer('injury')) une fois le moment digéré -- pas un écran qu'on peut relire.
export function renderForcedRetirement(onContinue){
  stage.innerHTML = `<div class="card forced-end">
    <div class="forced-end-icon">
      <svg viewBox="0 0 24 24" width="42" height="42"><path d="M12 21C7 17 3 13.5 3 9.5A4.5 4.5 0 0 1 12 8a4.5 4.5 0 0 1 9 1.5C21 13.5 17 17 12 21ZM9 12h2l1-2 2 4 1-2h2" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </div>
    <div class="eyebrow" style="text-align:center">Fin de carrière</div>
    <h2 style="text-align:center;margin:8px 0 4px">Le corps a dit stop</h2>
    <p class="body" style="max-width:480px;margin:0 auto;text-align:center">Une blessure grave, le genre qui ne pardonne pas à cet âge, referme la porte du terrain pour de bon. Pas de dernier match choisi, pas de tournée d'adieux préparée à l'avance -- juste ce diagnostic, un soir, qui met un point final à tout.</p>
    <div style="text-align:center;margin-top:26px">
      <button class="btn" id="forcedEndContinue">Découvrir le bilan de ta carrière</button>
    </div>
  </div>`;
  document.getElementById('forcedEndContinue').onclick=()=>onContinue();
}
export function endCareer(reason){
  const p=G; p.retired=true;
  setInCareer(false);
  // La carrière est terminée : plus rien à reprendre (elle est déjà préservée à part, dans le
  // Panthéon -- voir hofAdd() plus bas). Efface la sauvegarde plutôt que de la laisser pointer
  // vers une carrière désormais close.
  clearSavedGame();
  const A=p.accolades;
  const cnt=(k)=>A[k]||0;
  // les titres au sommet (NBA/EuroLeague/NBL) comptent nettement plus que les titres de paliers
  // mineurs (formation, 2e/3e division...) : gagner en académie ne devrait pas peser comme un titre NBA
  const champTitles = Object.keys(A).filter(k=>k.startsWith('Champion'));
  const champsElite = (A['Champion NBA']||0) + (A['Champion EuroLeague']||0) + (A['Champion NBL']||0);
  const champs = champTitles.reduce((s,k)=>s+A[k],0); // total, gardé pour l'affichage/la presse
  const champsMinor = champs - champsElite;
  const mvps = cnt('MVP');
  const allstars = cnt('All-Star')+cnt('All-EuroLeague');
  const medalsG = Object.keys(A).filter(k=>k.startsWith('🥇')).reduce((s,k)=>s+A[k],0);
  const scoringT = cnt('Meilleur marqueur');

  // score légende : le trophée rare (MVP, titre au sommet) pèse largement plus que la longévité
  // ou le statut de star répété (le clutch compte aussi : les moments décisifs marquent une carrière)
  let legend = p.peakOvr*0.75 + champsElite*22 + champsMinor*5 + mvps*20 + allstars*4 + medalsG*10 + scoringT*8
             + cnt('MVP EuroLeague')*12 + cnt('Rookie de l\'année')*6 + cnt('Meilleur défenseur')*6
             + Math.min(p.seasons.length,20)*1.2 + p.reputation*0.22 + (p.clutch||0)*3;
  legend=Math.round(legend);
  p.hof = legend>=270 || (champsElite>=1 && p.peakOvr>=91) || mvps>=1;

  let tier, blurb;
  if(legend>=365){ tier='G.O.A.T.'; blurb='On ne parlera plus du basket sans prononcer ton nom. Une ère porte ta signature.'; }
  else if(legend>=280){ tier='Légende · Hall of Fame'; blurb='Tu entres au Panthéon. Ton maillot est retiré, ton héritage est écrit.'; }
  else if(legend>=215){ tier='Superstar'; blurb='Une carrière énorme, des sommets touchés, un nom qui a compté au plus haut niveau.'; }
  else if(legend>=155){ tier='All-Star'; blurb='Tu as brillé parmi l\'élite. Une belle et solide carrière de haut niveau.'; }
  else if(legend>=92){ tier='Joueur de rotation'; blurb='Un vrai pro, respecté dans les vestiaires. Tu as vécu du basket, ce que peu réussissent.'; }
  else { tier='Parcours de combattant'; blurb='Le sommet t\'a échappé, mais tu as tout donné. Le basket garde une place pour les acharnés.'; }

  const sceneStats={legend, champs, mvps, allstars, peakOvr:p.peakOvr};
  const quotes = pressReview(p, sceneStats);
  const ovrSeries = p.seasons.map(s=>s.ovr);
  const bestSeason = p.seasons.length ? p.seasons.reduce((b,s)=> (s.pts*1.0+s.reb*0.6+s.ast*0.7)>(b.pts*1.0+b.reb*0.6+b.ast*0.7)?s:b, p.seasons[0]) : null;
  const bestPts = p.seasons.reduce((m,s)=>Math.max(m,s.pts),0);
  const reachedNBA = p.seasons.some(s=>s.league==='nba');

  // --- Données de carrière (carte partageable + Panthéon) ---
  const rec={ name:p.name, flag:p.nation.flag, posEmoji:POSITIONS.find(x=>x.id===p.pos).emoji, pos:p.pos, posName:POSITIONS.find(x=>x.id===p.pos).name,
      styleName:(STYLES.find(x=>x.id===p.style)||{}).name||'', styleEmoji:(STYLES.find(x=>x.id===p.style)||{}).emoji||'',
      tier, score:legend, champs, mvps, allstars, peak:p.peakOvr, seasons:p.seasons.length,
      bestPts:Math.round(bestPts*10)/10, nba:reachedNBA, clutch:p.clutch||0, ovrSeries,
      tripleDoubles:p.tripleDoubles||0, accolades:{...A}, tags:activeTags(p).map(t=>t.id),
      headline:(quotes[0]?quotes[0][1]:''), nation:p.nation.name, hof:p.hof, date:Date.now() };
  p.cardRec=rec; p.endReason=reason;
  if(!p.savedHOF){ p.savedHOF=true; hofAdd(rec); }
  // Badges transversaux (voir engine/badges.js) : évalués une seule fois, à la toute fin de la
  // carrière (p.cardRec/p.hof déjà posés juste au-dessus, dont certains badges dépendent).
  // p.newBadges mémorisé sur le joueur pour survivre à un éventuel re-rendu de cet écran (retour
  // depuis la carte de carrière, par exemple) sans re-déclencher l'évaluation.
  if(!p.newBadges) p.newBadges = evaluateBadges(p);
  const newBadgeDefs = p.newBadges.map(id=>BADGES.find(b=>b.id===id)).filter(Boolean);

  const tl = p.timeline.slice(-14);

  p.endSummary =
    `🏀 HARDWOOD · ${p.name} ${p.nation.flag}\n`+
    `${tier} · ${p.seasons.length} saisons · pic ${p.peakOvr} OVR\n`+
    `Titres ${champs} · MVP ${mvps} · All-Star ${allstars} · Score légende ${legend}\n`+
    `À toi de faire mieux.`;

  stage.innerHTML = `<div class="end">
    <div class="eyebrow">Fin de carrière · ${p.name}</div>
    ${reason==='injury'?`<div class="forced-end-tag">Retraite forcée sur blessure</div>`:''}
    <div class="legend-title">${tier}</div>
    <p class="subline">${p.nation.flag} ${POSITIONS.find(x=>x.id===p.pos).emoji} ${POSITIONS.find(x=>x.id===p.pos).name} · ${p.seasons.length} saisons · pic à ${p.peakOvr} OVR${p.hof?' · <b style="color:var(--mint)">Hall of Fame</b>':''}</p>
    <p class="body" style="max-width:520px;margin:14px auto 0;text-align:center">${blurb}</p>
    ${renderTagChips(activeTags(p), 'center')}
    ${newBadgeDefs.length?`<div class="recap-block new-badges-block">
      <div class="eyebrow" style="text-align:center;margin-bottom:10px">🎖️ Nouveau${newBadgeDefs.length>1?'x':''} badge${newBadgeDefs.length>1?'s':''} débloqué${newBadgeDefs.length>1?'s':''}</div>
      <div class="badge-grid compact">${newBadgeDefs.map(b=>`<div class="badge-tile unlocked" style="--badge-color:${b.color}">
        <div class="bt-icon">${b.emoji}</div><div class="bt-name">${b.name}</div><div class="bt-desc">${b.desc}</div></div>`).join('')}</div>
    </div>`:''}

    <div class="legend-grid">
      <div class="lg"><div class="v">${legend}</div><div class="l">Score légende</div></div>
      <div class="lg"><div class="v">${champs}</div><div class="l">Titres</div></div>
      <div class="lg"><div class="v">${mvps}</div><div class="l">MVP</div></div>
      <div class="lg"><div class="v">${allstars}</div><div class="l">All-Star</div></div>
      <div class="lg"><div class="v">${p.clutch||0}</div><div class="l">Moments clutch</div></div>
      ${p.tripleDoubles?`<div class="lg"><div class="v">${p.tripleDoubles}</div><div class="l">Triple-doubles</div></div>`:''}
    </div>

    <div class="recap-block">
      <div class="eyebrow" style="text-align:center;margin-bottom:10px">🗞️ Ce que la presse retient</div>
      ${quotes.map(q=>`<div class="press"><div class="press-txt">${q[1]}</div><div class="press-src">${q[0]}</div></div>`).join('')}
    </div>

    ${ovrSeries.length>1?`<div class="recap-block" style="text-align:center">${sparkline(ovrSeries)}</div>`:''}

    ${bestSeason?`<div class="recap-block best-season">
      <div class="eyebrow" style="margin-bottom:6px">🌟 Meilleure saison</div>
      <div class="bs-line"><b>${bestSeason.club}</b> <span style="color:var(--chalk-dim)">(${LEAGUES[bestSeason.league].short}, ${bestSeason.age} ans)</span></div>
      <div class="bs-stats"><span>🏀 ${bestSeason.pts} pts</span><span>💪 ${bestSeason.reb} reb</span><span>🎯 ${bestSeason.ast} pas</span><span>📊 OVR ${bestSeason.ovr}</span></div>
    </div>`:''}

    <div class="recap-block" style="max-width:640px">
      <div class="eyebrow" style="text-align:center;margin-bottom:14px">🏆 Armoire à trophées</div>
      ${renderTrophyCabinet(A)}
    </div>

    <div class="timeline">
      <div class="eyebrow" style="margin:24px 0 8px">Moments de carrière</div>
      ${tl.map(t=>`<div class="tl-row"><span class="yr">${t.age} ans</span><span class="ev">${t.html}</span></div>`).join('')}
    </div>

    <div style="margin-top:28px;display:flex;gap:12px;justify-content:center;flex-wrap:wrap">
      <button class="btn" id="again">Nouvelle carrière</button>
      <button class="btn ghost" id="cardBtn">🖼️ Ma carte</button>
      <button class="btn ghost" id="hofView">🏆 Panthéon</button>
      <button class="btn ghost" id="badgesView">🎖️ Badges</button>
      <button class="btn ghost" id="copyBtn">Copier mon résumé</button>
      <button class="btn ghost" id="share">Voir la fiche complète</button>
    </div>
  </div>`;
  document.getElementById('again').onclick=()=>{ setG(newPlayer()); screenCreate(); };
  document.getElementById('cardBtn').onclick=()=>renderCareerCard(p.cardRec, ()=>endCareer(p.endReason));
  document.getElementById('hofView').onclick=()=>renderHallOfFame();
  document.getElementById('badgesView').onclick=()=>renderBadges();
  document.getElementById('share').onclick=()=>renderFullSheet();
  document.getElementById('copyBtn').onclick=()=>copyShare(p.endSummary);
}
function copyShare(text){
  const done=()=>{ const b=document.getElementById('copyBtn'); if(b){ const old=b.textContent; b.textContent='Copié !'; setTimeout(()=>{b.textContent=old;},1600);} };
  if(navigator.clipboard && navigator.clipboard.writeText){
    navigator.clipboard.writeText(text).then(done).catch(()=>fallbackCopy(text,done));
  } else fallbackCopy(text,done);
}
function fallbackCopy(text,done){
  try{
    const ta=document.createElement('textarea'); ta.value=text;
    ta.style.position='fixed'; ta.style.top='0'; ta.style.opacity='0';
    document.body.appendChild(ta); ta.focus(); ta.select();
    document.execCommand('copy'); document.body.removeChild(ta); done();
  }catch(e){ /* silencieux : copie non supportée */ }
}

function renderFullSheet(){
  const p=G;
  const rows = p.seasons.map(s=>`<div class="tl-row">
    <span class="yr">S${s.year} · ${s.age}a</span>
    <span class="ev"><b>${s.club}</b> <span style="color:var(--chalk-dim)">(${LEAGUES[s.league].short})</span> · ${s.pts} pts, ${s.reb} reb, ${s.ast} pas${s.blk?`, ${s.blk} ctr`:''}${s.stl?`, ${s.stl} int`:''} · OVR ${s.ovr}${s.gamesPlayed!=null?` · ${s.gamesPlayed}/${s.leagueGames} matchs`:''}${s.acc.length?` · <span style="color:var(--mint)">${s.acc.join(', ')}</span>`:''}</span></div>`).join('');
  stage.innerHTML = `<div class="end" style="text-align:left">
    <div class="eyebrow" style="text-align:center">Feuille de match · carrière complète</div>
    <h2 style="text-align:center;font-size:28px;margin:6px 0 18px">${p.name}</h2>
    <div class="timeline" style="max-width:640px">${rows}</div>
    <div style="margin-top:26px;text-align:center"><button class="btn" id="back2">Retour au bilan</button></div>
  </div>`;
  document.getElementById('back2').onclick=()=>endCareer('review');
}
