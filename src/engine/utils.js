export function rnd(a,b){return a+Math.random()*(b-a);}
export function ri(a,b){return Math.floor(rnd(a,b+1));}
export function pick(arr){return arr[Math.floor(Math.random()*arr.length)];}
export function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
export function round(v,d=0){const p=Math.pow(10,d);return Math.round(v*p)/p;}
// Jet d'action : la réussite dépend de l'attribut concerné vs une difficulté. Toujours une part d'aléatoire.
export function actionRoll(attr, diff){ return Math.random() < clamp(0.12 + (attr - diff)*0.011, 0.06, 0.9); }
// Variance : on fait légèrement fluctuer un delta pour que le même choix ne donne jamais exactement la même chose
export function jit(v){ if(!v) return 0; const f=0.72+Math.random()*0.56; const r=Math.round(v*f); return v>0?Math.max(1,r):Math.min(-1,r); }
export function capitalize(s){const map={reputation:'Réputation',morale:'Moral',coach:'Coach',media:'Médias',popularity:'Popularité',fitness:'Forme'};return map[s]||s;}
export function medalEmoji(m){return m==='Or'?'🥇':m==='Argent'?'🥈':'🥉';}
export function ordinal(n){ return n===1?'1er':n+'e'; }
export function money(m){ if(m>=1000) return (m/1000).toFixed(1).replace('.0','')+' M€'; return Math.round(m)+' k€'; }
export function reducedMotion(){ try{return !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);}catch(e){return false;} }
export function easeOut(x){return 1-Math.pow(1-x,3);}

// Initiales de club (2-3 lettres) pour la pastille d'identité (voir ui/hud.js) : sobre et lisible
// plutôt qu'un écusson générique. Les mots tout en majuscules (sigles/abréviations réels comme
// "LA", "OKC") sont toujours gardés même s'ils recoupent un article filtré ailleurs ("La", "Le").
const CLUB_INITIALS_STOP = new Set(['de','du','di','da','el','la','le','les','and','et','of','the']);
export function clubInitials(name){
  if(!name) return '?';
  const clean = name.replace(/\(.*?\)/g,'').trim();
  const words = clean.split(/[\s/’'.,-]+/).filter(Boolean);
  const significant = words.filter(w => w===w.toUpperCase() || !CLUB_INITIALS_STOP.has(w.toLowerCase()));
  const pool = significant.length ? significant : words;
  if(pool.length===1){
    const w = pool[0].replace(/[^\p{L}\p{N}]/gu,'');
    return (w.slice(0,3) || '?').toUpperCase();
  }
  const letters = pool.slice(0,3).map(w => (w.match(/[\p{L}\p{N}]/u) || ['?'])[0]);
  return letters.join('').toUpperCase();
}
