/* ============================================================
   PANTHÉON (score + sauvegarde des carrières)
   localStorage quand le jeu tourne dans un vrai navigateur ; repli mémoire sinon.
============================================================ */
const HOF_KEY='hardwood_hof_v1';
let hofMem=null;
export function hofLoad(){ if(hofMem!==null) return hofMem; try{ const r=localStorage.getItem(HOF_KEY); hofMem=r?JSON.parse(r):[]; }catch(e){ hofMem=[]; } return hofMem; }
export function hofSave(list){ hofMem=list; try{ localStorage.setItem(HOF_KEY, JSON.stringify(list)); }catch(e){} }
export function hofAdd(rec){ const list=hofLoad().slice(); list.push(rec); list.sort((a,b)=>b.score-a.score); if(list.length>12) list.length=12; hofSave(list); return list; }
export function hofClear(){ hofMem=[]; try{ localStorage.removeItem(HOF_KEY); }catch(e){} }
export function hofBest(){ const l=hofLoad(); return l.length?l[0].score:0; }
