import { G, setG } from '../engine/state.js';
import { NATIONS } from '../data/nations.js';
import { POSITIONS, ATTRS } from '../data/positions.js';
import { STYLES } from '../data/styles.js';
import { LIFESTYLES } from '../data/lifestyles.js';
import { LEAGUES } from '../data/leagues.js';
import { newPlayer, rollTalent, ovr, salaryFor, clubSalaryMod } from '../engine/player.js';
import { hofBest, hofAdd } from '../engine/hof.js';
import { applyChoice, postSeason, doMove, beginSeasonKeep, draftProjection, seasonVerdict, startCareer, nextEventOrSim, beginSeason, pushTL } from '../engine/season.js';
import { catTag } from '../engine/events.js';
import { pickClub, pickClubName, pickClubs, clubInfo } from '../engine/clubs.js';
import { renderHUD, animateStats } from './hud.js';
import { renderHallOfFame, renderCareerCard } from './card.js';
import { pick, clamp, money, ordinal, ri } from '../engine/utils.js';
import { stage } from './dom.js';

/* ============================================================
   ÉCRANS : TITRE + CRÉATION
============================================================ */
export function screenTitle(){
  const best=hofBest();
  stage.innerHTML = `<div class="title-screen">
    <div class="ball"></div>
    <div class="eyebrow">Carrière · saison après saison</div>
    <h1>HARD<span class="o">W</span>OOD</h1>
    <p class="tag">De 16 à 38 ans, écris ta légende du basket. Chaque choix pèse : le talent ouvre des portes, les décisions décident du reste. La NBA est le sommet — encore faut-il y arriver.</p>
    <div style="margin-top:28px;display:flex;gap:12px;justify-content:center;flex-wrap:wrap">
      <button class="btn" id="go">Commencer ma carrière</button>
      <button class="btn ghost" id="hof">🏆 Panthéon</button>
    </div>
    ${best?`<div class="best-chip">🏆 Meilleur score légende : <b>${best}</b></div>`:''}
    <div class="kbd">Écris ta légende, saison après saison</div>
  </div>`;
  document.getElementById('go').onclick=()=>{ setG(newPlayer()); screenCreate(); };
  document.getElementById('hof').onclick=()=>renderHallOfFame();
}

export function screenCreate(){
  const p=G;
  if(p.step===0){ // nation
    stage.innerHTML = wrapCreate(1,'Ton pays','Il façonne ton parcours, tes stats de départ et ta sélection nationale.',
      NATIONS.map((n,i)=>`<button class="opt ${p.nation&&p.nation.id===n.id?'pick':''}" data-i="${i}">
        <div class="flag">${n.flag}</div><div class="ttl">${n.name}</div>
        <div class="desc">${n.path==='us'?'Voie US : université → draft':n.path==='au'?'Voie Australie : formation → NBL1 → NBL':'Voie Europe : formation → clubs'} · Sélection ${n.strength}</div></button>`).join(''),
      false, !!p.nation);
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
function wrapCreate(num,title,sub,inner,isLast,canNext){
  return `<div class="create">
    <div class="step-h"><span class="num">${num} / 5</span></div>
    <h2>${title}</h2><p class="sub">${sub}</p>
    <div class="opt-grid">${isLast?'':inner}</div>${isLast?inner:''}
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
function starStr(n){ // n 1..5
  let s=''; for(let i=1;i<=5;i++){ s+= i<=n?'★':'<span class="off">★</span>'; } return s;
}

/* ---- Rendu d'un événement ---- */
export function renderEvent(ev){
  const p=G, lg=LEAGUES[p.league];
  const ctx={p,lg};
  const body = typeof ev.body==='function'?ev.body(ctx):ev.body;
  const title= typeof ev.title==='function'?ev.title(ctx):ev.title;
  const choices = ev.choices(ctx);
  stage.innerHTML = renderHUD() + `<div class="card event" style="margin-top:2px">
    <div class="season-tag">
      <span class="chip">📅 Saison ${p.year} · ${p.age} ans</span>
      <span class="chip n">${LEAGUES[p.league].emoji||'🏀'} ${lg.short} — ${p.club}</span>
      <span class="chip n">${catTag(ev)}</span>
    </div>
    <h2>${title}</h2>
    <div class="body">${body}</div>
    <div class="choices">${choices.map((c,i)=>`
      <button class="choice" data-i="${i}"><span class="pip"></span>
        <span><span class="ct">${c.label}</span>${c.hint?`<span class="cd">${c.hint}</span>`:''}</span></button>`).join('')}
    </div></div>`;
  stage.querySelectorAll('.choice').forEach(el=>{
    el.onclick=()=>{ const c=choices[+el.dataset.i]; applyChoice(c,ctx); };
  });
}
export function showDeltaFlash(outcome, deltas){
  const mini = deltas.filter(d=>d.v!==0).map(d=>{
    if(d.money) return `<span>${d.k} <b class="${d.v<0?'dn':''}">${d.v>0?'+':''}${money(Math.abs(d.v)).replace(' €','')}</b></span>`;
    const cls = d.v<0?'dn':''; const sign=d.v>0?'+':'';
    return `<span>${d.k} <b class="${cls}">${sign}${d.v}</b></span>`;
  }).join('');
  const card=document.createElement('div');
  card.className='card'; card.style.marginTop='12px'; card.style.borderLeft='3px solid var(--orange)';
  card.innerHTML = `${outcome?`<div class="body" style="font-size:14.5px">${outcome}</div>`:''}
    ${mini?`<div class="inline-mini">${mini}</div>`:''}
    <div style="text-align:right;margin-top:14px"><button class="btn sm" id="contBtn">Suite</button></div>`;
  stage.querySelector('.event').replaceWith(card);
  document.getElementById('contBtn').onclick=()=>nextEventOrSim();
}

export function renderSeasonResult(s, natLine, champion){
  const p=G, lg=LEAGUES[p.league];
  const cells=[
    ['PTS',s.pts],['REB',s.reb],['PAS',s.ast],['MIN',s.minutes],['VIC',s.wins],['OVR',s.ovr]
  ];
  let verdict = seasonVerdict(s,lg);
  const prev = p.seasons.length>=2 ? p.seasons[p.seasons.length-2].ovr : null;
  const delta = prev!==null ? s.ovr - prev : null;
  const deltaHtml = delta!==null && delta!==0
    ? `<span class="chip" style="background:${delta>0?'rgba(63,208,122,.14)':'rgba(255,82,98,.14)'};border-color:${delta>0?'var(--up)':'var(--down)'};color:${delta>0?'var(--up)':'var(--down)'}">${delta>0?'▲':'▼'} ${Math.abs(delta)} OVR vs saison passée</span>`
    : '';
  const accHtml = s.acc.length? `<div class="accolades">${s.acc.map(a=>`<span class="badge ${a.includes('MVP')||a.includes('Champion')?'title':''}">${a}</span>`).join('')}</div>`:'';
  const natHtml = natLine? `<div class="verdict" style="border-left-color:var(--gold)">Sélection ${p.nation.flag} — ${natLine.tourn}${natLine.medal?` : <b style="color:var(--gold)">${natLine.medal}</b>`:' : éliminé en phase finale'}${natLine.mvp?' · <b>MVP du tournoi</b>':''}.</div>`:'';
  stage.innerHTML = renderHUD() + `<div class="card scoreboard">
    <div class="sb-head"><h2>Saison ${p.year} — bilan</h2>
      <div style="display:flex;gap:6px;flex-wrap:wrap">${deltaHtml}<span class="chip n">${lg.short} · ${p.club}</span></div></div>
    <div class="statline">${cells.map((c,i)=>`<div class="stat-cell${i===0?' hot':''}"><div class="sv">${c[1]}</div><div class="sl">${c[0]}</div></div>`).join('')}</div>
    <div class="verdict">${verdict}</div>
    ${natHtml}${accHtml}
    <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;margin-top:18px">
      <div>${p.age>=33?`<button class="btn ghost sm" id="retireBtn">Raccrocher les crampons</button>`:''}</div>
      <button class="btn" id="afterSeason">Intersaison →</button>
    </div>
  </div>`;
  document.getElementById('afterSeason').onclick=()=>postSeason();
  const rb=document.getElementById('retireBtn'); if(rb) rb.onclick=()=>endCareer('choice');
  animateStats();
}

// Texte de couleur (category/comment) d'un vrai club, pour enrichir le hint d'un choix.
function flavor(clubInfoObj){
  if(!clubInfoObj || !clubInfoObj.category) return null;
  return `${clubInfoObj.category}${clubInfoObj.comment ? ' — '+clubInfoObj.comment : ''}`;
}

/* Écran de transfert / promotion / draft avec choix */
export function renderMoveScreen(move){
  const p=G, o=ovr(p);
  let title,body,choices;
  const toLg = move.to?LEAGUES[move.to]:null;
  // dernier rung avant la NBA selon le chemin du joueur (miroir de season.js)
  const continental = p.nation.path==='au' ? 'nbl' : 'euro';

  if(move.type==='draftDecl'){
    const intl = move.origin==='intl';
    title = intl ? `Te déclarer à la draft NBA ?` : `L'heure de la draft`;
    body = intl
      ? `Tu perces vite à l'international et les recruteurs NBA rôdent. Tu peux te déclarer à la draft dès maintenant — un pari sur ton potentiel — ou continuer à bâtir ton nom avant de tenter le grand saut.`
      : `Ta carrière universitaire t'ouvre les portes de la draft. Te déclarer, c'est saisir ta chance maintenant ; d'autres attendent une saison de plus pour grimper dans les projections.`;
    choices=[
      {label:`Me déclarer à la draft`, hint:'Tenter la NBA', apply:()=>{ const pos=draftProjection(o,p.reputation);
        if(pos<=60) renderMoveScreen({type:'draft', pos, to:'nba', club:pickClubName('nba', p.nation.id), origin:move.origin});
        else renderMoveScreen({type:'undrafted', origin:move.origin}); }},
      intl
        ? {label:`Continuer à progresser à l'international`, hint:'Bâtir avant de sauter', apply:()=>{ p.morale=clamp(p.morale+2,0,100); beginSeasonKeep(); }}
        : {label:`Rester une saison de plus à la fac`, hint:'Grimper dans les projections', apply:()=>{ beginSeasonKeep(); }}
    ];
  }
  else if(move.type==='draft'){
    const rnd1 = move.pos<=30;
    const late = move.pos>30; // fin de 1er tour / 2e tour : peu d'attentes, temps de jeu à mériter
    title = `Draft NBA — appelé en position ${move.pos}`;
    body = `Ton nom résonne dans la salle. <b>${move.club}</b> te sélectionne au ${ordinal(move.pos)} rang${rnd1?' du premier tour':' (second tour)'}. Le rêve devient contrat${late?', mais rien n\'est garanti : à toi de forcer la main du coach.':'.'}`;
    choices=[
      {label:`Signer avec ${move.club}`, hint: late?'Direction la NBA — un rôle à conquérir':'Direction la NBA',
        apply:()=>{ p.draftPos=move.pos; doMove(move, late?{reputation:+2,morale:+4,popularity:+2}:{reputation:+8,morale:+10,popularity:+10}); }},
      {label:'Refuser et rester une saison de plus', hint: move.origin==='college'?'Prendre le temps de mûrir à la fac':'Prendre le temps de progresser',
        apply:()=>{ p.morale=clamp(p.morale-3,0,100); beginSeasonKeep(); }}
    ];
  }
  else if(move.type==='undrafted'){
    const intl = move.origin==='intl';
    title = `Non drafté`;
    body = intl
      ? `Ton nom n'est pas appelé à la draft. Pas de drame : tu es déjà une valeur montante à l'international, et d'autres portes s'ouvriront plus tard.`
      : `Aucune équipe n'appelle ton nom. La porte principale se ferme — mais les acharnés trouvent toujours un chemin.`;
    choices = intl ? [
      {label:`Continuer à t'imposer à l'international`, hint:'Ta chance NBA reviendra', apply:()=>{ p.morale=clamp(p.morale-2,0,100); beginSeasonKeep(); }},
      {label:`Rejoindre la G League pour viser un call-up`, hint:'La petite porte US', apply:()=>doMove({type:'promo',to:'gleague',club:pickClubName('gleague', p.nation.id)},{morale:-3,salary:ri(40,90)})}
    ] : [
      {label:'Rejoindre la G League et se battre pour un call-up', hint:'La voie difficile vers la NBA', apply:()=>doMove({type:'promo',to:'gleague',club:pickClubName('gleague', p.nation.id)},{morale:-4,salary:ri(40,90)})},
      {label:`Signer un gros contrat en ${LEAGUES[continental].name}`, hint:'Devenir une star à l\'international', apply:()=>doMove({type:'promo',to:continental,club:pickClubName(continental, p.nation.id)},{morale:+3,salary:ri(300,900),reputation:+4})}
    ];
  }
  else if(move.type==='nbaJump'){
    title = `La NBA t'appelle`;
    body = `Après avoir marqué l'EuroLeague, une franchise NBA — <b>${move.club}</b> — pose une offre sur la table. Le grand saut, avec tout ce qu'il implique : plus d'argent, plus de lumière, mais un rôle à reconquérir.`;
    choices=[
      {label:`Tenter l'aventure NBA à ${move.club}`, hint:'Le sommet mondial', apply:()=>doMove(move,{morale:+6,popularity:+12,reputation:+5,salary:ri(500,2500)})},
      {label:'Rester roi en Europe', hint:'Statut de franchise player garanti', apply:()=>{ p.morale=clamp(p.morale+4,0,100); p.reputation=clamp(p.reputation+3,0,100); beginSeasonKeep(); }}
    ];
  }
  else if(move.type==='nbaWindow'){
    title = `Une fenêtre s'ouvre en NBA`;
    body = `Après tes performances en ${LEAGUES[p.league].name}, <b>${move.club}</b> te propose un contrat NBA. Le grand saut : plus d'argent et la lumière mondiale, mais un rôle à conquérir — et rien ne garantit que ça marche.`;
    choices=[
      {label:`Tenter la NBA à ${move.club}`, hint:'Le pari du sommet', apply:()=>doMove(move,{morale:+5,popularity:+10,reputation:+4})},
      {label:`Rester une référence en ${LEAGUES[p.league].short}`, hint:'Franchise player garanti', apply:()=>{ p.declined.nbaYear=p.year; p.morale=clamp(p.morale+4,0,100); p.reputation=clamp(p.reputation+3,0,100); beginSeasonKeep(); }}
    ];
  }
  else if(move.type==='nbaReturn'){
    title = `Le pari NBA tourne court`;
    body = `Le temps de jeu ne vient pas, tu t'enlises au bout du banc. <b>${move.club}</b> (${LEAGUES[move.to].short}) t'offre un rôle majeur et la lumière que la NBA t'a refusée. Revenir, c'est rebondir la tête haute.`;
    choices=[
      {label:`Rebondir en ${LEAGUES[move.to].short} à ${move.club}`, hint:'Redevenir une star', apply:()=>{ p.nbaStruggle=0; doMove(move,{morale:+4,reputation:+1}); }},
      {label:`S'accrocher en NBA une saison de plus`, hint:'Refuser d\'abandonner (risqué)', apply:()=>{ p.nbaStruggle=0; p.morale=clamp(p.morale-3,0,100); beginSeasonKeep(); }}
    ];
  }
  else if(move.type==='freeAgency'){
    const rivals = pickClubs(p.league, p.nation.id, 2, {exclude:p.club});
    const upMap = { academy: p.nation.path==='au'?'nbl1':'third', third:'second', second:'national', national:'euro',
                    nbl1:'nbl', nbl:'nba', gleague:'nba', euro:'nba' };
    const upKey=upMap[p.league];
    const canUp = upKey && o>=LEAGUES[upKey].starter-2 && p.age<=30;
    const curInfo = clubInfo(p.league, p.nation.id, p.club);
    const salStay=Math.round(salaryFor(p.league,o,p.reputation)*1.05*clubSalaryMod(curInfo?.prestige));
    title = `🖊️ Free agency ouverte`;
    body = `Tu as refusé de prolonger : te voilà libre sur le marché. Plusieurs offres concrètes sont sur la table — à toi de choisir ton avenir.`;
    choices=[
      {label:`Re-signer à ${p.club}`, hint:`Stabilité, tu connais la maison · 💰 ${money(salStay)}/an`,
        apply:()=>{ p.contractY=ri(2,4); p.salary=salStay; p.morale=clamp(p.morale+4,0,100); p.coach=clamp(p.coach+3,0,100); pushTL(`Prolonge à <b>${p.club}</b> · 💰 ${money(salStay)}/an.`); beginSeason(); }}
    ];
    rivals.forEach((rc,i)=>{ const sal=Math.round(salaryFor(p.league,o,p.reputation)*1.1*clubSalaryMod(rc.prestige));
      choices.push({label:`Signer à ${rc.name}`, hint:`${flavor(rc)||(i===0?'Projet ambitieux':'Gros chèque, nouveau vestiaire')} · 💰 ${money(sal)}/an`,
        apply:()=>doMove({type:'transfer',to:p.league,club:rc.name},{morale:+2,reputation:+2,salary:sal})}); });
    if(canUp){ const uc=pickClub(upKey, p.nation.id); const sal=Math.round(salaryFor(upKey,o,p.reputation)*clubSalaryMod(uc.prestige));
      choices.push({label:`Viser plus haut : ${uc.name} (${LEAGUES[upKey].short})`, hint:`${flavor(uc)||'Monter d\'un cran, tout à prouver'} · 💰 ${money(sal)}/an`,
        apply:()=>doMove({type:'promo',to:upKey,club:uc.name},{morale:+4,reputation:+3,salary:sal})}); }
  }
  else if(move.type==='nbaSwan'){
    title = `🌟 La NBA t'appelle, pour l'histoire`;
    body = `Tu as tout gagné en ${LEAGUES[p.league].name}. Sur le tard, <b>${move.club}</b> t'offre un contrat court — un an ou deux — pour vivre enfin le rêve NBA et finir en beauté. Un dernier grand frisson.`;
    choices=[
      {label:`Vivre le rêve à ${move.club}`, hint:'Baroud d\'honneur au sommet',
        apply:()=>doMove(move,{morale:+8,popularity:+12,reputation:+3})},
      {label:`Rester une légende de ${LEAGUES[p.league].short}`, hint:'Fidèle jusqu\'au bout',
        apply:()=>{ p.morale=clamp(p.morale+5,0,100); p.reputation=clamp(p.reputation+2,0,100); beginSeasonKeep(); }}
    ];
  }
  else if(move.type==='callup'){
    title = `Call-up en NBA !`;
    body = `Ton travail en G League a payé : <b>${move.club}</b> te signe un contrat NBA. À toi de saisir ta chance sous les projecteurs.`;
    choices=[{label:`Signer avec ${move.club}`, hint:'Enfin la NBA', apply:()=>doMove(move,{morale:+9,popularity:+8,reputation:+5})}];
  }
  else if(move.type==='promo'){
    title = `Palier franchi — ${toLg.name}`;
    body = `Ton niveau ne passe plus inaperçu. <b>${move.club}</b> (${toLg.short}) t'offre un contrat pour monter d'un cran. Plus fort, plus exposé.`;
    choices=[
      {label:`Signer à ${move.club}`, hint:`Monter en ${toLg.short}`, apply:()=>doMove(move,{morale:+5,reputation:+3})},
      {label:'Rester encore un an pour dominer', hint:'Consolider avant de monter', apply:()=>{ p.morale=clamp(p.morale-2,0,100); beginSeasonKeep(); }}
    ];
  }
  else if(move.type==='transfer'){
    const tl=LEAGUES[move.to];
    const offered = move.club && move.club!==p.club ? [clubInfo(move.to, p.nation.id, move.club)].filter(Boolean) : [];
    const extra = pickClubs(move.to, p.nation.id, 2-offered.length, {exclude:[p.club, ...offered.map(c=>c.name)]});
    const opts = [...offered, ...extra];
    title = `Le marché s'agite autour de toi`;
    body = `Ta cote grimpe : plusieurs clubs de ${tl.short} veulent te recruter. Changer de maillot, c'est de l'ambition — et la pression qui va avec.`;
    choices = opts.map((c,i)=>{ const sal=Math.round(salaryFor(move.to,o,p.reputation)*1.1*clubSalaryMod(c.prestige));
      return {label:`Rejoindre ${c.name}`, hint:`${flavor(c)||(i===0?'Le favori pour ta signature':'Offre alléchante')} · 💰 ${money(sal)}/an`,
        apply:()=>doMove({type:'transfer',to:move.to,club:c.name},{morale:+3,reputation:+2,salary:sal})}; });
    choices.push({label:`Rester fidèle à ${p.club}`, hint:'La loyauté paie aussi (+moral, +vestiaire)',
      apply:()=>{ p.morale=clamp(p.morale+4,0,100); p.reputation=clamp(p.reputation+2,0,100); p.coach=clamp(p.coach+3,0,100); beginSeasonKeep(); }});
  }
  else if(move.type==='demote'){
    title = `Rétrogradé en ${toLg.short}`;
    body = `Le niveau ne suit plus. Faute de temps de jeu, tu redescends à <b>${move.club}</b> pour te relancer. Le basket ne pardonne pas — mais les retours existent.`;
    choices=[{label:'Rebondir plus bas', hint:'Se relancer', apply:()=>doMove(move,{morale:-8,reputation:-4})}];
  }

  const singleDest = move.to && !['freeAgency','transfer','draftDecl'].includes(move.type);
  const salaryLine = singleDest ? `<div class="body" style="margin-top:2px;color:var(--up);font-family:'Barlow Semi Condensed';letter-spacing:.03em">💰 Salaire annuel estimé : <b>${money(salaryFor(move.to,o,p.reputation))}</b></div>` : '';
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
export function endCareer(reason){
  const p=G; p.retired=true;
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
  p.hof = legend>=250 || (champsElite>=1 && p.peakOvr>=91) || mvps>=1;

  let tier, blurb;
  if(legend>=340){ tier='G.O.A.T.'; blurb='On ne parlera plus du basket sans prononcer ton nom. Une ère porte ta signature.'; }
  else if(legend>=260){ tier='Légende — Hall of Fame'; blurb='Tu entres au Panthéon. Ton maillot est retiré, ton héritage est écrit.'; }
  else if(legend>=200){ tier='Superstar'; blurb='Une carrière énorme, des sommets touchés, un nom qui a compté au plus haut niveau.'; }
  else if(legend>=145){ tier='All-Star'; blurb='Tu as brillé parmi l\'élite. Une belle et solide carrière de haut niveau.'; }
  else if(legend>=90){ tier='Joueur de rotation'; blurb='Un vrai pro, respecté dans les vestiaires. Tu as vécu du basket, ce que peu réussissent.'; }
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
      headline:(quotes[0]?quotes[0][1]:''), nation:p.nation.name, hof:p.hof, date:Date.now() };
  p.cardRec=rec; p.endReason=reason;
  if(!p.savedHOF){ p.savedHOF=true; hofAdd(rec); }

  const allAcc = Object.entries(A).sort((a,b)=>b[1]-a[1]);
  const tl = p.timeline.slice(-14);

  p.endSummary =
    `🏀 HARDWOOD — ${p.name} ${p.nation.flag}\n`+
    `${tier} · ${p.seasons.length} saisons · pic ${p.peakOvr} OVR\n`+
    `Titres ${champs} · MVP ${mvps} · All-Star ${allstars} · Score légende ${legend}\n`+
    `À toi de faire mieux.`;

  stage.innerHTML = `<div class="end">
    <div class="eyebrow">Fin de carrière · ${p.name}</div>
    <div class="legend-title">${tier}</div>
    <p class="subline">${p.nation.flag} ${POSITIONS.find(x=>x.id===p.pos).emoji} ${POSITIONS.find(x=>x.id===p.pos).name} · ${p.seasons.length} saisons · pic à ${p.peakOvr} OVR${p.hof?' · <b style="color:var(--gold)">Hall of Fame</b>':''}</p>
    <p class="body" style="max-width:520px;margin:14px auto 0;text-align:center">${blurb}</p>

    <div class="legend-grid">
      <div class="lg"><div class="v">${legend}</div><div class="l">Score légende</div></div>
      <div class="lg"><div class="v">${champs}</div><div class="l">Titres</div></div>
      <div class="lg"><div class="v">${mvps}</div><div class="l">MVP</div></div>
      <div class="lg"><div class="v">${allstars}</div><div class="l">All-Star</div></div>
      <div class="lg"><div class="v">${p.clutch||0}</div><div class="l">Moments clutch</div></div>
    </div>

    <div class="recap-block">
      <div class="eyebrow" style="text-align:center;margin-bottom:10px">🗞️ Ce que la presse retient</div>
      ${quotes.map(q=>`<div class="press"><div class="press-txt">${q[1]}</div><div class="press-src">— ${q[0]}</div></div>`).join('')}
    </div>

    ${ovrSeries.length>1?`<div class="recap-block" style="text-align:center">${sparkline(ovrSeries)}</div>`:''}

    ${bestSeason?`<div class="recap-block best-season">
      <div class="eyebrow" style="margin-bottom:6px">🌟 Meilleure saison</div>
      <div class="bs-line"><b>${bestSeason.club}</b> <span style="color:var(--chalk-dim)">(${LEAGUES[bestSeason.league].short}, ${bestSeason.age} ans)</span></div>
      <div class="bs-stats"><span>🏀 ${bestSeason.pts} pts</span><span>💪 ${bestSeason.reb} reb</span><span>🎯 ${bestSeason.ast} pas</span><span>📊 OVR ${bestSeason.ovr}</span></div>
    </div>`:''}

    ${allAcc.length?`<div class="accolades" style="justify-content:center;max-width:640px;margin:14px auto 6px">
      ${allAcc.map(([k,v])=>`<span class="badge ${k.includes('MVP')||k.includes('Champion')||k.includes('🥇')?'title':''}">${k}${v>1?` ×${v}`:''}</span>`).join('')}</div>`:''}

    <div class="timeline">
      <div class="eyebrow" style="margin:24px 0 8px">Moments de carrière</div>
      ${tl.map(t=>`<div class="tl-row"><span class="yr">${t.age} ans</span><span class="ev">${t.html}</span></div>`).join('')}
    </div>

    <div style="margin-top:28px;display:flex;gap:12px;justify-content:center;flex-wrap:wrap">
      <button class="btn" id="again">Nouvelle carrière</button>
      <button class="btn ghost" id="cardBtn">🖼️ Ma carte</button>
      <button class="btn ghost" id="hofView">🏆 Panthéon</button>
      <button class="btn ghost" id="copyBtn">Copier mon résumé</button>
      <button class="btn ghost" id="share">Voir la fiche complète</button>
    </div>
  </div>`;
  document.getElementById('again').onclick=()=>{ setG(newPlayer()); screenCreate(); };
  document.getElementById('cardBtn').onclick=()=>renderCareerCard(p.cardRec, ()=>endCareer(p.endReason));
  document.getElementById('hofView').onclick=()=>renderHallOfFame();
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
    <span class="ev"><b>${s.club}</b> <span style="color:var(--chalk-dim)">(${LEAGUES[s.league].short})</span> — ${s.pts} pts, ${s.reb} reb, ${s.ast} pas · OVR ${s.ovr}${s.acc.length?` · <span style="color:var(--gold)">${s.acc.join(', ')}</span>`:''}</span></div>`).join('');
  stage.innerHTML = `<div class="end" style="text-align:left">
    <div class="eyebrow" style="text-align:center">Feuille de match — carrière complète</div>
    <h2 style="text-align:center;font-size:28px;margin:6px 0 18px">${p.name}</h2>
    <div class="timeline" style="max-width:640px">${rows}</div>
    <div style="margin-top:26px;text-align:center"><button class="btn" id="back2">Retour au bilan</button></div>
  </div>`;
  document.getElementById('back2').onclick=()=>endCareer('review');
}
