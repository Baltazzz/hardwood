// Couleur d'accent dynamique par carrière : indexée sur le club actuel (ou la nation, pendant
// une fenêtre de sélection nationale), avec garde-fou de contraste automatique. L'objectif est
// que deux carrières se ressentent visuellement différentes, jamais qu'une couleur de club
// improbable rende l'interface illisible sur le fond crème Terre battue.

// Vraies couleurs de marque, réservées aux clubs globaux de src/data/leagues.js (NBA/EuroLeague :
// noms de vrais clubs, peu nombreux, faciles à vérifier). Les centaines de clubs de
// src/data/clubData.js (générés depuis les fichiers Excel source) n'ont pas de couleur officielle
// en base : ils reçoivent une teinte stable dérivée de leur nom (voir hashHue) plutôt qu'une
// couleur inventée présentée comme authentique.
const CLUB_ACCENT = {
  'Boston':'#007A33', 'L.A. Lakers':'#552583', 'Golden State':'#1D428A', 'Denver':'#FEC524',
  'Milwaukee':'#00471B', 'Miami':'#98002E', 'New York':'#F58426', 'Dallas':'#00538C',
  'Phoenix':'#E56020', 'OKC':'#EF3B24', 'Philadelphie':'#006BB6', 'Memphis':'#5D76A9',
  'Real Madrid':'#FEBE10', 'FC Barcelone':'#004D98', 'Panathinaïkos':'#046A38',
  'Olympiakos':'#D91A21', 'Fenerbahçe':'#0A3F7F', 'Monaco':'#DA1F26', 'Baskonia':'#00A54F',
  'Maccabi':'#FFCD00', 'Žalgiris':'#01A64F',
};

// Couleur "sélection nationale", dérivée de l'identité fédérale/drapeau réelle de chaque nation
// jouable (src/data/nations.js).
const NATION_ACCENT = {
  US:'#B31942', FR:'#0055A4', RS:'#C6363C', ES:'#AA151B', DE:'#FFCE00',
  GR:'#0D5EAF', AU:'#00843D', CA:'#FF0000', SI:'#0057B7',
};

const FALLBACK_ACCENT = '#E0562D'; // = --orange : repli si aucune donnée de club/nation exploitable
const BG = '#F4EDE1'; // = --court : fond clair sur lequel le contraste est garanti

function hashHue(str){
  let h = 0;
  for(let i=0;i<str.length;i++){ h = (h*31 + str.charCodeAt(i)) >>> 0; }
  return h % 360;
}
function clamp01(v){ return Math.max(0, Math.min(1, v)); }
function hslToHex(h,s,l){
  s=clamp01(s); l=clamp01(l);
  const c=(1-Math.abs(2*l-1))*s, x=c*(1-Math.abs((h/60)%2-1)), m=l-c/2;
  let r,g,b;
  if(h<60){[r,g,b]=[c,x,0];} else if(h<120){[r,g,b]=[x,c,0];} else if(h<180){[r,g,b]=[0,c,x];}
  else if(h<240){[r,g,b]=[0,x,c];} else if(h<300){[r,g,b]=[x,0,c];} else {[r,g,b]=[c,0,x];}
  const to255=v=>Math.round((v+m)*255);
  return '#'+[to255(r),to255(g),to255(b)].map(v=>v.toString(16).padStart(2,'0')).join('');
}
function hexToRgb(hex){
  const h=hex.replace('#','');
  return [0,2,4].map(i=>parseInt(h.slice(i,i+2),16));
}
function rgbToHsl(r,g,b){
  r/=255; g/=255; b/=255;
  const mx=Math.max(r,g,b), mn=Math.min(r,g,b), l=(mx+mn)/2;
  if(mx===mn) return [0,0,l];
  const d=mx-mn;
  const s = l>0.5 ? d/(2-mx-mn) : d/(mx+mn);
  let h;
  if(mx===r) h=((g-b)/d + (g<b?6:0));
  else if(mx===g) h=(b-r)/d+2;
  else h=(r-g)/d+4;
  h*=60;
  return [h,s,l];
}
function relLuminance(hex){
  const [r,g,b]=hexToRgb(hex).map(v=>{ v/=255; return v<=0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055,2.4); });
  return 0.2126*r+0.7152*g+0.0722*b;
}
function contrastRatio(hexA,hexB){
  const a=relLuminance(hexA)+0.05, b=relLuminance(hexB)+0.05;
  return a>b ? a/b : b/a;
}

// Garde-fou de sécurité : le fond est désormais clair (crème), donc c'est l'inverse de l'ancienne
// City Edition -- on ASSOMBRIT la couleur source (et on relève un peu la saturation si elle est
// trop fade, pour rester vivant sur la palette Terre battue) jusqu'à un contraste suffisant sur
// --court. Ne redescend jamais sous minRatio : c'est la seule garantie de lisibilité, pas une
// simple recommandation.
export function ensureContrast(hex, minRatio=3.5){
  let [h,s,l] = rgbToHsl(...hexToRgb(hex));
  s = Math.max(s, 0.45);
  let candidate = hslToHex(h,s,l);
  let iter=0;
  while(contrastRatio(candidate,BG) < minRatio && l>0.06 && iter<40){
    l = Math.max(0, l-0.025);
    candidate = hslToHex(h,s,l);
    iter++;
  }
  return candidate;
}

function clubAccentRaw(clubName){
  if(!clubName) return null;
  if(CLUB_ACCENT[clubName]) return CLUB_ACCENT[clubName];
  return hslToHex(hashHue(clubName), 0.62, 0.5);
}
function nationAccentRaw(nationId){
  return (nationId && NATION_ACCENT[nationId]) || null;
}

// Couleur "secondaire" pour la pastille bicolore (voir emblemColors ci-dessous) : dérivée
// algorithmiquement de la primaire plutôt que curatée, pour ne jamais présenter une seconde
// couleur de marque inventée comme authentique. Teinte voisine (+32°), plus claire et un peu
// moins saturée : lit comme un vrai "second ton" d'écusson plutôt qu'une couleur au hasard.
function deriveSecondary(primaryHex){
  let [h,s,l] = rgbToHsl(...hexToRgb(primaryHex));
  const h2 = (h+32) % 360;
  return hslToHex(h2, Math.max(0.35, s*0.7), Math.min(0.84, l+0.22));
}
// La secondaire n'est qu'un aplat décoratif (jamais du texte) : contraste minimal juste pour
// qu'elle reste visible sur crème, bien moins strict que pour l'accent principal.
function ensureVisible(hex, minRatio=1.6){
  let [h,s,l] = rgbToHsl(...hexToRgb(hex));
  let candidate = hslToHex(h,s,l);
  let iter=0;
  while(contrastRatio(candidate,BG) < minRatio && l>0.06 && iter<40){
    l = Math.max(0, l-0.03);
    candidate = hslToHex(h,s,l);
    iter++;
  }
  return candidate;
}

// Couleurs primaire + secondaire de l'écusson de club, toutes deux garanties lisibles/visibles
// sur --court. Même mode 'club'/'nation' que getAccent().
export function emblemColors(p, mode='club'){
  const primary = getAccent(p, mode);
  const secondary = ensureVisible(deriveSecondary(primary));
  return { primary, secondary };
}

// mode 'club' (défaut, indexé sur p.club) ou 'nation' (fenêtre sélection nationale : événements
// cat:'nation', bilan de saison incluant un tournoi national).
export function getAccent(p, mode='club'){
  const raw = mode==='nation'
    ? (nationAccentRaw(p.nation && p.nation.id) || FALLBACK_ACCENT)
    : (clubAccentRaw(p.club) || FALLBACK_ACCENT);
  return ensureContrast(raw);
}

export function applyAccent(p, mode='club'){
  const hex = getAccent(p, mode);
  if(typeof document !== 'undefined' && document.documentElement){
    document.documentElement.style.setProperty('--accent', hex);
  }
  return hex;
}

export function resetAccent(){
  if(typeof document !== 'undefined' && document.documentElement){
    document.documentElement.style.removeProperty('--accent');
  }
}
