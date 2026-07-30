// Couleur d'accent dynamique par carrière : indexée sur le club actuel (ou la nation, pendant
// une fenêtre de sélection nationale), avec garde-fou de contraste automatique. L'objectif est
// que deux carrières se ressentent visuellement différentes, jamais qu'une couleur de club
// improbable rende l'interface illisible sur le fond crème Terre battue.
import { CLUB_DATA, GLOBAL_CLUB_COLORS } from '../data/clubData.js';

// Vraies couleurs de marque (primaire + secondaire), ingérées depuis data-source/clubcolor.xlsx
// via scripts/gen-club-data.mjs : couvrent la quasi-totalité des clubs/académies de
// src/data/clubData.js (nation par nation) + les paliers globaux NBA/EuroLeague
// (GLOBAL_CLUB_COLORS, non nation-aware). Un club peut apparaître sous le même nom dans
// plusieurs nations/paliers ; en cas de collision, le premier rencontré gagne (sans conséquence
// pratique, les noms de clubs réels ne se recoupent quasiment jamais entre nations). Les rares
// clubs sans couleur officielle en base (nations sans fichier source dédié, ex. Turquie/Italie/
// Lituanie/Israël pour les paliers globaux) reçoivent toujours une teinte stable dérivée de leur
// nom (voir hashHue) plutôt qu'une couleur inventée présentée comme authentique.
const REAL_CLUB_COLORS = new Map();
for (const nation of Object.keys(CLUB_DATA)) {
  for (const tier of Object.keys(CLUB_DATA[nation])) {
    for (const c of CLUB_DATA[nation][tier]) {
      if (c.primary && !REAL_CLUB_COLORS.has(c.name)) {
        REAL_CLUB_COLORS.set(c.name, { primary: c.primary, secondary: c.secondary });
      }
    }
  }
}
for (const [name, colors] of Object.entries(GLOBAL_CLUB_COLORS)) {
  if (!REAL_CLUB_COLORS.has(name)) REAL_CLUB_COLORS.set(name, colors);
}
// Choix de la couleur DOMINANTE entre primaire/secondaire pour l'identité de club (tuile
// "maillot" + pastille, voir hud.js). Essayé puis abandonné : un choix AUTOMATIQUE basé sur la
// saturation ("la couleur la plus vive gagne") -- vérifié case par case sur des clubs connus,
// il bascule systématiquement vers un jaune/or secondaire dès qu'il y en a un (L.A. Lakers,
// Denver, ...), car un or est presque toujours plus saturé qu'un bleu/violet marine, alors que
// c'est justement CE bleu/violet qui est la couleur reconnaissable de ces clubs. La saturation
// brute n'est pas un bon indicateur de "quelle couleur porte l'identité de la marque" -- c'est
// une question de connaissance du club, pas de colorimétrie. On garde donc la primaire comme
// dominante par défaut (le cas très largement correct), et on corrige au cas par cas les
// exceptions connues via la table ci-dessous plutôt que de risquer une bascule automatique fausse
// sur des centaines de clubs jamais vérifiés un par un.
//
// Correction manuelle, en dur et EXTENSIBLE (ajouter une entrée {primary,secondary} suffit) :
// identité reconnaissable qui diffère de la primaire officielle telle qu'ingérée -- une décision
// éditoriale (quelle couleur "fait" le club aux yeux des gens), pas quelque chose de dérivable
// automatiquement des données sources. Ajuster une entrée ici n'affecte jamais le reste du
// catalogue : chaque club en dehors de cette table garde sa vraie primaire officielle.
//  - Charlotte : le bleu clair/sarcelle (teal) domine, plutôt que le violet -- c'est la couleur
//    de marque la plus reconnaissable des Hornets (violet gardé en secondaire).
//  - Utah : le violet emblématique (identité "montagnes" des années 90, celle que la plupart des
//    gens associent encore au Jazz) domine, plutôt que le bleu marine officiel actuel -- ce
//    violet ne fait pas partie des deux couleurs ingérées depuis l'Excel (marine/or), c'est donc
//    une teinte choisie à la main, pas dérivée d'une couleur source. Or gardé en secondaire
//    (l'autre couleur historique de ce même maillot).
const CLUB_DOMINANT_OVERRIDE = {
  'Charlotte': { primary: '#00788C', secondary: '#1D1160' },
  'Utah': { primary: '#4B2E83', secondary: '#F9A01B' },
};

function realColorsFor(clubName) {
  if (!clubName) return null;
  if (CLUB_DOMINANT_OVERRIDE[clubName]) return CLUB_DOMINANT_OVERRIDE[clubName];
  return REAL_CLUB_COLORS.get(clubName) || null;
}

// Couleur "sélection nationale", dérivée de l'identité fédérale/drapeau réelle de chaque nation
// jouable (src/data/nations.js).
const NATION_ACCENT = {
  US:'#B31942', FR:'#0055A4', RS:'#C6363C', ES:'#AA151B', DE:'#FFCE00',
  GR:'#0D5EAF', AU:'#00843D', CA:'#FF0000', SI:'#0057B7',
};

const FALLBACK_ACCENT = '#E0562D'; // = --orange : repli si aucune donnée de club/nation exploitable
const BG = '#F4EDE1'; // = --court : fond clair sur lequel le contraste est garanti

// Exportées pour engine/cosmetics.js (thèmes de couleur de la boutique) : mêmes primitives
// colorimétriques que l'accent dynamique de carrière, pour générer une palette accessible à
// partir d'une simple couleur de marque (club NBA ou teinte originale) sans dupliquer cette
// logique de conversion/contraste ailleurs.
function hashHue(str){
  let h = 0;
  for(let i=0;i<str.length;i++){ h = (h*31 + str.charCodeAt(i)) >>> 0; }
  return h % 360;
}
function clamp01(v){ return Math.max(0, Math.min(1, v)); }
export function hslToHex(h,s,l){
  s=clamp01(s); l=clamp01(l);
  const c=(1-Math.abs(2*l-1))*s, x=c*(1-Math.abs((h/60)%2-1)), m=l-c/2;
  let r,g,b;
  if(h<60){[r,g,b]=[c,x,0];} else if(h<120){[r,g,b]=[x,c,0];} else if(h<180){[r,g,b]=[0,c,x];}
  else if(h<240){[r,g,b]=[0,x,c];} else if(h<300){[r,g,b]=[x,0,c];} else {[r,g,b]=[c,0,x];}
  const to255=v=>Math.round((v+m)*255);
  return '#'+[to255(r),to255(g),to255(b)].map(v=>v.toString(16).padStart(2,'0')).join('');
}
export function hexToRgb(hex){
  const h=hex.replace('#','');
  return [0,2,4].map(i=>parseInt(h.slice(i,i+2),16));
}
// rgba() prêt à l'emploi pour un lavis dynamique (posé en variable CSS depuis hud.js) : une
// couleur de club quelconque, même très sombre ou très saturée, reste un lavis sûr pour le
// texte une fois mélangée à faible opacité avec le fond crème -- garde-fou par construction
// (voir .player-card dans styles.css), en plus du garde-fou de contraste déjà appliqué en amont
// aux couleurs pleines (--accent, secondaire de emblemColors).
export function hexToRgba(hex, alpha){
  const [r,g,b] = hexToRgb(hex);
  return `rgba(${r},${g},${b},${alpha})`;
}
export function rgbToHsl(r,g,b){
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
export function contrastRatio(hexA,hexB){
  const a=relLuminance(hexA)+0.05, b=relLuminance(hexB)+0.05;
  return a>b ? a/b : b/a;
}

// Garde-fou de sécurité : le fond est désormais clair (crème), donc c'est l'inverse de l'ancienne
// City Edition -- on ASSOMBRIT la couleur source (et on relève un peu la saturation si elle est
// trop fade, pour rester vivant sur la palette Terre battue) jusqu'à un contraste suffisant sur
// --court. Ne redescend jamais sous minRatio : c'est la seule garantie de lisibilité, pas une
// simple recommandation.
//
// BUG corrigé (voir AGENDA.md, "San Antonio ressort en bleu") : le plancher de saturation
// s'appliquait à TOUTE couleur, y compris les gris/argent/noir/blanc officiels d'un club (ex.
// San Antonio #C4CED4, un argent réel et vérifié -- voir data/clubData.js GLOBAL_CLUB_COLORS,
// la donnée source était déjà correcte). Un gris a une teinte RGB quasi arbitraire (un artefact
// d'arrondi, pas une couleur de marque) ; forcer 45% de saturation dessus invente une couleur qui
// n'existe pas -- pour l'argent des Spurs, un bleu franc, alors qu'aucune trace de bleu n'existe
// dans leur identité (argent/noir). Sous ce seuil de saturation, la couleur est considérée
// neutre : on ne touche plus qu'à la luminosité pour le contraste, jamais à la teinte/saturation.
// Seuil calibré sur la distribution RÉELLE des 30 primaires NBA (voir AGENDA.md) : San Antonio
// est un cas isolé à 15.7% de saturation (le seul gris/argent officiel du lot), la couleur
// "colorée" la plus proche ensuite est Memphis à 30.6% (un vrai bleu, juste discret) -- 0.22 sépare
// proprement les deux sans jamais neutraliser une couleur de marque authentique.
const NEUTRAL_SAT_THRESHOLD = 0.22;
export function ensureContrast(hex, minRatio=3.5){
  let [h,s,l] = rgbToHsl(...hexToRgb(hex));
  if (s >= NEUTRAL_SAT_THRESHOLD) s = Math.max(s, 0.45);
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
  const real = realColorsFor(clubName);
  if(real) return real.primary;
  return hslToHex(hashHue(clubName), 0.62, 0.5);
}
function nationAccentRaw(nationId){
  return (nationId && NATION_ACCENT[nationId]) || null;
}

// Couleur "secondaire" pour la pastille bicolore (voir emblemColors ci-dessous) : dérivée
// algorithmiquement de la primaire plutôt que curatée, pour ne jamais présenter une seconde
// couleur de marque inventée comme authentique. Teinte voisine (+32°), plus claire et un peu
// moins saturée : lit comme un vrai "second ton" d'écusson plutôt qu'une couleur au hasard.
export function deriveSecondary(primaryHex){
  let [h,s,l] = rgbToHsl(...hexToRgb(primaryHex));
  const h2 = (h+32) % 360;
  return hslToHex(h2, Math.max(0.35, s*0.7), Math.min(0.84, l+0.22));
}
// La secondaire n'est qu'un aplat décoratif (jamais du texte) : contraste minimal juste pour
// qu'elle reste visible sur crème, bien moins strict que pour l'accent principal.
export function ensureVisible(hex, minRatio=1.6){
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

// Couleurs primaire + secondaire de l'identité de club (tuile profil + pastille d'initiales),
// toutes deux garanties lisibles/visibles sur --court. Utilise la vraie secondaire officielle
// quand elle est connue (mode 'club' avec couleur réelle en base) plutôt qu'une dérivation
// algorithmique, réservée aux clubs sans donnée officielle et au mode 'nation' (pas de
// secondaire curatée par nation).
export function emblemColors(p, mode='club'){
  const real = mode==='club' ? realColorsFor(p.club) : null;
  if(real && real.secondary){
    return { primary: ensureContrast(real.primary), secondary: ensureVisible(real.secondary) };
  }
  const primary = getAccent(p, mode);
  const secondary = ensureVisible(deriveSecondary(primary));
  return { primary, secondary };
}

// Choisit une couleur d'encre (chalk sombre ou crème) lisible par-dessus un fond saturé donné
// (ex. la pastille d'initiales, dont le fond est la couleur primaire du club, potentiellement
// très claire ou très sombre selon le club) -- bascule simplement sur la luminance relative du
// fond, à l'inverse de ensureContrast/ensureVisible qui eux assombrissent/éclaircissent une
// couleur DESTINÉE à --court.
export function textColorOn(bgHex){
  return relLuminance(bgHex) > 0.42 ? '#241813' /* --chalk */ : '#FFF8EE' /* --on-accent */;
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
