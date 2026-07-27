/* ============================================================
   PARTAGE NATIF (Web Share API) — un seul point d'entrée réutilisé
   partout où le jeu propose de partager quelque chose (carte de
   carrière, lien de défi, score du jour) : ouvre la feuille de
   partage native de l'appareil quand elle existe, repli propre
   (copie dans le presse-papiers) UNIQUEMENT si le navigateur ne la
   supporte pas -- jamais les deux proposés en même temps.
============================================================ */

// true si le navigateur peut réellement partager CES fichiers précis (pas juste s'il connaît
// navigator.share -- Web Share Level 2/fichiers n'est pas universellement supporté même quand le
// partage texte/URL simple l'est).
function canShareFiles(files) {
  return !!(files && files.length && navigator.canShare && navigator.canShare({ files }));
}

// Tente le partage natif (fichiers d'abord si fournis et supportés, sinon titre/texte/URL),
// sinon un repli propre (copie presse-papiers de l'URL, ou du texte à défaut). `onCopied` est
// appelé UNIQUEMENT si le repli copie a réellement eu lieu (pour que l'appelant affiche son
// propre indice "Copié !" -- chaque écran a le sien). Ne lève jamais : une annulation volontaire
// de l'utilisateur (fermer la feuille de partage) n'est pas une erreur à signaler.
export async function shareOrFallback({ title, text, url, files }, onCopied) {
  if (navigator.share) {
    const useFiles = canShareFiles(files);
    try {
      if (useFiles) await navigator.share({ title, text, files });
      else await navigator.share({ title, text, url });
      return 'shared';
    } catch (e) {
      if (e && e.name === 'AbortError') return 'cancelled'; // fermé volontairement, rien d'autre à faire
      // autre échec (rare) : on tente le repli ci-dessous plutôt que de laisser une erreur muette
    }
  }
  const copyText = url || text || '';
  if (copyText && navigator.clipboard && navigator.clipboard.writeText) {
    try { await navigator.clipboard.writeText(copyText); if (onCopied) onCopied(); return 'copied'; } catch (e) {}
  }
  return 'unsupported';
}

// Convertit un canvas en File image/png (Promise) -- utilisé pour proposer l'image de la carte
// directement dans la feuille de partage native (Web Share Level 2), pas seulement son lien.
export function canvasToFile(canvas, filename) {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (!blob) { resolve(null); return; }
      resolve(new File([blob], filename, { type: 'image/png' }));
    }, 'image/png');
  });
}
