#!/usr/bin/env node
// Convertit data-source/*.xlsx (données réelles de clubs par nation) en
// src/data/clubData.js, un module statique commité et consommé par le jeu.
// Relancer après mise à jour des fichiers Excel source : npm run gen:data
//
// Enrichit aussi chaque club/académie avec ses vraies couleurs (primaire/secondaire), ingérées
// depuis data-source/clubcolor.xlsx (voir loadClubColors() plus bas).

import readXlsxFile from 'read-excel-file/node';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const dataSourceDir = path.join(root, 'data-source');
const outFile = path.join(root, 'src', 'data', 'clubData.js');

// Un fichier par nation. `divisionToTier` mappe le libellé réel de la colonne
// "Division" vers la clé de palier utilisée par le moteur (src/data/leagues.js).
// Les divisions absentes de la table (ex. les lignes "NBA" du fichier USA) sont
// volontairement ignorées : ces paliers restent statiques/globaux, non liés à
// une nation (voir clubs.js).
const FILES = [
  { file: 'France_ligue.xlsx', nation: 'FR', divisionToTier: {
    'Betclic Elite': 'national', 'Elite 2': 'second', 'Nationale 1': 'third' } },
  { file: 'Germany_ligue.xlsx', nation: 'DE', divisionToTier: {
    'easyCredit BBL': 'national', 'ProA': 'second', 'ProB': 'third' } },
  { file: 'Greece_ligue.xlsx', nation: 'GR', divisionToTier: {
    'Greek Basket League': 'national', 'Elite League': 'second', 'National League 1': 'third' } },
  { file: 'Serbia_ligue.xlsx', nation: 'RS', divisionToTier: {
    'ABA / KLS SuperLeague': 'national', 'KLS First League': 'second', 'Second League': 'third' } },
  { file: 'Slovenia_ligue.xlsx', nation: 'SI', divisionToTier: {
    'Liga OTP Banka': 'national', '2 SKL': 'second', 'Development / Reserve': 'third' } },
  { file: 'Spain_ligue.xlsx', nation: 'ES', divisionToTier: {
    'Liga Endesa': 'national', 'Primera FEB': 'second', 'Segunda FEB': 'third' } },
  { file: 'USA_ligue.xlsx', nation: 'US', divisionToTier: {
    'NCAA Division I': 'college', 'NBA G League': 'gleague' } },
  { file: 'Australia_ligue.xlsx', nation: 'AU', divisionToTier: {
    'NBL': 'nbl',
    'NBL1 South': 'nbl1', 'NBL1 East': 'nbl1', 'NBL1 North': 'nbl1', 'NBL1 West': 'nbl1', 'NBL1 Central': 'nbl1',
    'Development / Academy': 'academy' } },
];

// Comptes attendus (par nation/tier), vérifiés manuellement contre les fichiers
// source — sert juste d'avertissement si les fichiers source changent de forme.
const EXPECTED_COUNTS = {
  FR: { national: 16, second: 16, third: 10, academy: 15 },
  DE: { national: 18, second: 18, third: 12, academy: 10 },
  GR: { national: 13, second: 16, third: 12, academy: 12 },
  RS: { national: 6, second: 16, third: 16, academy: 12 },
  SI: { national: 11, second: 14, third: 5, academy: 10 },
  ES: { national: 18, second: 17, third: 6, academy: 10 },
  US: { college: 30, gleague: 31 },
  AU: { nbl: 10, nbl1: 23, academy: 16 },
};

// ============================================================
// Couleurs de club (data-source/clubcolor.xlsx)
// ============================================================
// Section (colonne Division en majuscules, ligne sans Club) -> code nation, pour retrouver le
// bon fichier/mapping de palier au fil de la lecture séquentielle du classeur.
const COLOR_SECTION_TO_NATION = {
  AUSTRALIE: 'AU', FRANCE: 'FR', GERMANY: 'DE', GREECE: 'GR',
  SERBIA: 'RS', SLOVENIA: 'SI', SPAIN: 'ES', USA: 'US',
};

// Écarts de nommage connus entre les noms utilisés dans le jeu (src/data/leagues.js pour les
// paliers globaux NBA/EuroLeague, dont beaucoup de noms courts/informels) et les noms complets
// du fichier couleurs. Étblis en comparant les deux jeux de noms lors de l'intégration -- la
// génération signale plus bas tout nom qui resterait non couvert malgré cette liste.
const COLOR_NAME_ALIASES = {
  'Boston': 'Boston Celtics', 'L.A. Lakers': 'Los Angeles Lakers', 'Golden State': 'Golden State Warriors',
  'Denver': 'Denver Nuggets', 'Milwaukee': 'Milwaukee Bucks', 'Miami': 'Miami Heat', 'New York': 'New York Knicks',
  'Dallas': 'Dallas Mavericks', 'Phoenix': 'Phoenix Suns', 'OKC': 'Oklahoma City Thunder',
  'Philadelphie': 'Philadelphia 76ers', 'Memphis': 'Memphis Grizzlies', 'Atlanta': 'Atlanta Hawks',
  'Brooklyn': 'Brooklyn Nets', 'Charlotte': 'Charlotte Hornets', 'Chicago': 'Chicago Bulls',
  'Cleveland': 'Cleveland Cavaliers', 'Detroit': 'Detroit Pistons', 'Houston': 'Houston Rockets',
  'Indiana': 'Indiana Pacers', 'New Orleans': 'New Orleans Pelicans', 'Minnesota': 'Minnesota Timberwolves',
  'Orlando': 'Orlando Magic', 'Portland': 'Portland Trail Blazers', 'Sacramento': 'Sacramento Kings',
  'San Antonio': 'San Antonio Spurs', 'Toronto': 'Toronto Raptors', 'Utah': 'Utah Jazz',
  'Washington': 'Washington Wizards',
  'FC Barcelone': 'FC Barcelona', 'Olympiakos': 'Olympiacos', 'Bayern Munich': 'FC Bayern Munich',
  'Crvena Zvezda': 'Crvena zvezda Meridianbet', 'Partizan': 'Partizan Mozzart Bet',
};

// Repli manuel, en dur : clubs réels du jeu pour lesquels clubcolor.xlsx ne contient aucune
// couleur, ni directement ni via une ligne d'académie liée (vérifié explicitement, pas une
// simple absence de correspondance de nom) -- évite un repli par teinte dérivée du nom pour un
// club qu'on sait pertinemment réel. À retirer dès que l'Excel est complété pour ce club (la
// vraie donnée prime alors automatiquement, voir findColor()).
const MANUAL_COLOR_FALLBACK = {
  'South East Melbourne Phoenix': { primary: '#00A9E0', secondary: '#000000' }, // bleu cyan/noir du maillot réel, NBL australien
};

function normName(s) {
  return String(s ?? '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '') // accents
    .toLowerCase()
    .replace(/[’']/g, "'")
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

// Lit clubcolor.xlsx et construit un index nom-normalisé -> {name, primary, secondary},
// générique et tolérant à deux formes de lignes rencontrées dans le fichier :
//  - ligne de "vraie division" (Betclic Elite, NBA, NBL...) : Club porte le nom du club/collège,
//    on l'utilise directement. Reconnu simplement par le fait que ce libellé de Division revient
//    sur PLUSIEURS lignes (une vraie division regroupe toujours plusieurs clubs) -- règle
//    générique qui couvre aussi bien les vraies divisions que le seul autre cas répété rencontré
//    (le classeur australien range plusieurs académies sous l'étiquette générique
//    "Development / Academy", avec le vrai nom dans Club, même logique).
//  - ligne d'"académie nommément dédiée" (une seule occurrence de ce libellé de Division, ex.
//    "Cholet Formation", "Sydney Kings Youth Pathway") : Division porte le nom réel de
//    l'académie, Club porte l'organisation liée (le club professionnel associé) -- ce nom de
//    club est gardé en repli (fallback), utilisé seulement si ce club n'a pas déjà sa couleur
//    directement ailleurs (utile par ex. pour des clubs NBL australiens dont la seule trace de
//    couleur dans le fichier est la ligne de leur académie).
async function loadClubColors() {
  const filePath = path.join(dataSourceDir, 'clubcolor.xlsx');
  const sheets = await readXlsxFile(filePath);
  const sheet = sheets[0];
  const rows = sheet.data.slice(1).filter(r => r.some(v => v !== null));

  const divisionCounts = {};
  for (const row of rows) { if (row[1] !== null) divisionCounts[row[0]] = (divisionCounts[row[0]] || 0) + 1; }

  // Dédoublonnage à l'ingestion : la première occurrence d'un nom gagne (déterministe, ordre du
  // fichier), toute occurrence suivante est ignorée -- mais signalée dès qu'elle porte des
  // couleurs DIFFÉRENTES de la première (une vraie incohérence à corriger dans l'Excel), jamais
  // pour un doublon inoffensif (même club listé deux fois avec les mêmes couleurs, ex. club NBA +
  // sa franchise G League affiliée qui partage le même nom de marque).
  const direct = new Map();
  const fallback = new Map();
  const duplicates = [];
  let sawNation = false;

  for (const row of rows) {
    const [division, club, primary, secondary] = row;
    if (club === null) { sawNation = sawNation || COLOR_SECTION_TO_NATION[division] != null; continue; }
    const isGenericOrRealDivision = divisionCounts[division] > 1;
    if (isGenericOrRealDivision) {
      const key = normName(club);
      const existing = direct.get(key);
      if (!existing) direct.set(key, { name: club, primary, secondary });
      else if (existing.primary !== primary || existing.secondary !== secondary) {
        duplicates.push({ name: club, kept: existing, ignored: { primary, secondary } });
      }
    } else {
      const key = normName(division);
      if (!direct.has(key)) direct.set(key, { name: division, primary, secondary });
      const parentKey = normName(club);
      if (!fallback.has(parentKey)) fallback.set(parentKey, { name: club, primary, secondary });
    }
  }
  if (!sawNation) throw new Error('clubcolor.xlsx : aucune section de nation reconnue (en-têtes attendus : ' + Object.keys(COLOR_SECTION_TO_NATION).join(', ') + ')');
  if (duplicates.length) {
    console.log(`\n=== Doublons détectés dans clubcolor.xlsx (couleurs conflictuelles, 1re occurrence conservée) : ${duplicates.length} ===`);
    duplicates.forEach(d => console.log(`  ${d.name} : gardé ${d.kept.primary}/${d.kept.secondary}, ignoré ${d.ignored.primary}/${d.ignored.secondary}`));
  }

  const byName = new Map([...fallback, ...direct]); // direct l'emporte sur fallback
  return { byName, rowCount: rows.filter(r => r[1] !== null).length };
}

function findColor(colorByName, name) {
  if (!name) return null;
  const aliased = COLOR_NAME_ALIASES[name] || name;
  return colorByName.get(normName(aliased)) || MANUAL_COLOR_FALLBACK[name] || null;
}

function rowsToObjects(data) {
  const [header, ...rows] = data;
  return rows.map(row => Object.fromEntries(header.map((h, i) => [h, row[i]])));
}

function normalizeClub(row, colorByName) {
  const c = findColor(colorByName, row.Club);
  return {
    name: row.Club,
    strength: row.Strength,
    potential: row.Potential,
    prestige: row.Prestige,
    category: row.Category || null,
    comment: row.Comment || null,
    primary: c ? c.primary : null,
    secondary: c ? c.secondary : null,
  };
}

function normalizeAcademy(row, colorByName) {
  const c = findColor(colorByName, row.Academy);
  return {
    name: row.Academy,
    linkedClub: row['Linked Club'] || null,
    rating: row['Academy Rating'],
    prestige: row.Prestige,
    category: null,
    comment: row.Comment || null,
    primary: c ? c.primary : null,
    secondary: c ? c.secondary : null,
  };
}

async function main() {
  const CLUB_DATA = {};
  const { byName: colorByName, rowCount: colorRowCount } = await loadClubColors();
  console.log(`clubcolor.xlsx -> ${colorRowCount} lignes club/académie lues, ${colorByName.size} noms distincts indexés\n`);

  for (const { file, nation, divisionToTier } of FILES) {
    const filePath = path.join(dataSourceDir, file);
    const sheets = await readXlsxFile(filePath);
    const clubsSheet = sheets.find(s => s.sheet.endsWith('_Clubs_V2'));
    const academiesSheet = sheets.find(s => s.sheet === 'Academies');
    if (!clubsSheet || !academiesSheet) {
      throw new Error(`${file} : feuilles attendues introuvables (trouvé : ${sheets.map(s => s.sheet).join(', ')})`);
    }

    const buckets = {};
    for (const row of rowsToObjects(clubsSheet.data)) {
      const tier = divisionToTier[row.Division];
      if (!tier) continue; // division volontairement hors périmètre (ex. lignes "NBA")
      (buckets[tier] ??= []).push(normalizeClub(row, colorByName));
    }
    buckets.academy = [...(buckets.academy || []), ...rowsToObjects(academiesSheet.data).map(row => normalizeAcademy(row, colorByName))];

    CLUB_DATA[nation] = buckets;

    const expected = EXPECTED_COUNTS[nation] || {};
    const summary = Object.entries(buckets).map(([tier, clubs]) => {
      const exp = expected[tier];
      const flag = exp != null && exp !== clubs.length ? ` (attendu ${exp} !)` : '';
      const withColor = clubs.filter(c => c.primary).length;
      return `${tier}=${clubs.length}${flag} (${withColor} coloré${withColor>1?'s':''})`;
    }).join(', ');
    console.log(`${nation.padEnd(3)} (${file}) -> ${summary}`);
  }

  // Paliers globaux (NBA/EuroLeague, src/data/leagues.js) : pas dans clubData.js (nation-aware
  // par construction), mais leurs vrais clubs bénéficient des mêmes couleurs -- exportées à part.
  const { LEAGUES } = await import('../src/data/leagues.js');
  const GLOBAL_CLUB_COLORS = {};
  for (const tier of ['nba', 'euro']) {
    for (const name of (LEAGUES[tier]?.clubs || [])) {
      const c = findColor(colorByName, name);
      if (c) GLOBAL_CLUB_COLORS[name] = { primary: c.primary, secondary: c.secondary };
    }
  }

  // ---- Rapport d'écarts de nommage (demandé explicitement : deux sens) ----
  const allGameNames = [];
  for (const nation of Object.keys(CLUB_DATA)) {
    for (const tier of Object.keys(CLUB_DATA[nation])) {
      for (const c of CLUB_DATA[nation][tier]) allGameNames.push({ name: c.name, where: `${nation}/${tier}` });
    }
  }
  for (const tier of ['nba', 'euro']) {
    for (const name of (LEAGUES[tier]?.clubs || [])) allGameNames.push({ name, where: `global/${tier}` });
  }
  const matchedColorKeys = new Set(); // noms (normalisés) de clubcolor.xlsx effectivement consommés
  const unmatchedGame = [];
  const manuallyFilled = [];
  for (const g of allGameNames) {
    const c = findColor(colorByName, g.name);
    if (c) {
      matchedColorKeys.add(normName(c.name));
      if (MANUAL_COLOR_FALLBACK[g.name]) manuallyFilled.push(g);
    } else unmatchedGame.push(g);
  }
  if (manuallyFilled.length) {
    console.log(`\n=== Couleur de repli manuelle (MANUAL_COLOR_FALLBACK, en attendant l'Excel) : ${manuallyFilled.length} ===`);
    manuallyFilled.forEach(g => console.log(`  [${g.where}] ${g.name}`));
  }
  const unmatchedColors = [...colorByName.values()].filter(c => !matchedColorKeys.has(normName(c.name)));

  console.log(`\n=== Clubs/académies du jeu sans couleur trouvée : ${unmatchedGame.length} ===`);
  unmatchedGame.forEach(g => console.log(`  [${g.where}] ${g.name}`));
  console.log(`\n=== Entrées de clubcolor.xlsx sans club/académie correspondant dans le jeu : ${unmatchedColors.length} ===`);
  unmatchedColors.forEach(c => console.log(`  ${c.name}`));

  const body = `// AUTO-GÉNÉRÉ par scripts/gen-club-data.mjs à partir de data-source/*.xlsx — NE PAS ÉDITER À LA MAIN.
// Après mise à jour des fichiers Excel source : npm run gen:data
// primary/secondary (par club/académie) et GLOBAL_CLUB_COLORS (paliers NBA/EuroLeague, non
// nation-aware) viennent de data-source/clubcolor.xlsx ; null quand aucune couleur officielle
// n'a été trouvée pour ce nom (voir le rapport d'écarts affiché par npm run gen:data).
export const CLUB_DATA = ${JSON.stringify(CLUB_DATA, null, 2)};
export const GLOBAL_CLUB_COLORS = ${JSON.stringify(GLOBAL_CLUB_COLORS, null, 2)};
`;
  fs.writeFileSync(outFile, body);
  console.log(`\nÉcrit : ${path.relative(root, outFile)}`);
}

main().catch(err => {
  console.error('gen-club-data a échoué :', err);
  process.exitCode = 1;
});
