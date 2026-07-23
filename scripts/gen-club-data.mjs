#!/usr/bin/env node
// Convertit data-source/*.xlsx (données réelles de clubs par nation) en
// src/data/clubData.js, un module statique commité et consommé par le jeu.
// Relancer après mise à jour des fichiers Excel source : npm run gen:data

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

function rowsToObjects(data) {
  const [header, ...rows] = data;
  return rows.map(row => Object.fromEntries(header.map((h, i) => [h, row[i]])));
}

function normalizeClub(row) {
  return {
    name: row.Club,
    strength: row.Strength,
    potential: row.Potential,
    prestige: row.Prestige,
    category: row.Category || null,
    comment: row.Comment || null,
  };
}

function normalizeAcademy(row) {
  return {
    name: row.Academy,
    linkedClub: row['Linked Club'] || null,
    rating: row['Academy Rating'],
    prestige: row.Prestige,
    category: null,
    comment: row.Comment || null,
  };
}

async function main() {
  const CLUB_DATA = {};

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
      (buckets[tier] ??= []).push(normalizeClub(row));
    }
    buckets.academy = [...(buckets.academy || []), ...rowsToObjects(academiesSheet.data).map(normalizeAcademy)];

    CLUB_DATA[nation] = buckets;

    const expected = EXPECTED_COUNTS[nation] || {};
    const summary = Object.entries(buckets).map(([tier, clubs]) => {
      const exp = expected[tier];
      const flag = exp != null && exp !== clubs.length ? ` (attendu ${exp} !)` : '';
      return `${tier}=${clubs.length}${flag}`;
    }).join(', ');
    console.log(`${nation.padEnd(3)} (${file}) -> ${summary}`);
  }

  const body = `// AUTO-GÉNÉRÉ par scripts/gen-club-data.mjs à partir de data-source/*.xlsx — NE PAS ÉDITER À LA MAIN.
// Après mise à jour des fichiers Excel source : npm run gen:data
export const CLUB_DATA = ${JSON.stringify(CLUB_DATA, null, 2)};
`;
  fs.writeFileSync(outFile, body);
  console.log(`\nÉcrit : ${path.relative(root, outFile)}`);
}

main().catch(err => {
  console.error('gen-club-data a échoué :', err);
  process.exitCode = 1;
});
