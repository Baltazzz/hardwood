// Environnement DOM headless (jsdom) pour piloter le jeu sans navigateur.
// jsdom n'implémente ni document.fonts ni le rendu canvas 2D (features réelles
// du navigateur) : on les simule ici a minima pour que la carte de carrière
// (rendue en <canvas>) ne fasse pas planter le pilotage automatique.
import { JSDOM } from 'jsdom';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

export function setupEnvironment() {
  const dom = new JSDOM(indexHtml, { url: 'http://localhost/', pretendToBeVisual: true });
  const { window } = dom;

  global.window = window;
  global.document = window.document;
  global.localStorage = window.localStorage;
  global.requestAnimationFrame = (cb) => setTimeout(cb, 0);
  Object.defineProperty(global, 'navigator', { value: window.navigator, configurable: true });

  for (const key of [
    'MutationObserver', 'CustomEvent', 'Event', 'Node', 'Element',
    'HTMLElement', 'DocumentFragment', 'Text', 'Comment', 'NodeList',
  ]) {
    if (window[key]) global[key] = window[key];
  }
  global.matchMedia = window.matchMedia || (() => ({ matches: false }));
  // jsdom n'implémente pas window.confirm/alert (dialogues natifs) : par défaut on accepte,
  // cohérent avec un pilotage automatique qui doit pouvoir traverser les garde-fous de
  // confirmation (nouvelle carrière qui écraserait une sauvegarde, vidage du Panthéon/des
  // badges) sans lever d'erreur ni bloquer la conduite de carrières.
  global.confirm = window.confirm = () => true;
  global.alert = window.alert = () => {};

  // Stubs navigateur absents de jsdom : document.fonts + contexte canvas 2D.
  window.document.fonts = { ready: Promise.resolve() };
  // Propriétés (pas des méthodes) réellement mémorisées entre set/get -- nécessaire depuis que
  // card.js affecte un objet dégradé à x.fillStyle puis relit x.fillStyle.addColorStop(...) juste
  // après (avant : toute lecture d'une prop string renvoyait une fonction vide, donc
  // `.addColorStop` plantait sur cette fonction au lieu de retrouver le dégradé posé).
  const fakeCtxProps = {};
  const fakeCtx = new Proxy({}, {
    get(_t, prop) {
      if (prop === 'measureText') return () => ({ width: 40 });
      if (prop === 'createLinearGradient' || prop === 'createRadialGradient') {
        return () => ({ addColorStop() {} });
      }
      if (prop in fakeCtxProps) return fakeCtxProps[prop];
      if (typeof prop === 'string') return () => {};
      return undefined;
    },
    set(_t, prop, value) { fakeCtxProps[prop] = value; return true; },
  });
  window.HTMLCanvasElement.prototype.getContext = () => fakeCtx;
  window.HTMLCanvasElement.prototype.toDataURL = () => 'data:image/png;base64,';
  // toBlob (voir ui/share.js canvasToFile(), partage natif de la carte) : jsdom ne rend rien
  // réellement, un Blob minimal suffit pour piloter le flux de partage sans erreur.
  window.HTMLCanvasElement.prototype.toBlob = function (cb) { cb(new window.Blob(['x'], { type: 'image/png' })); };

  const errors = [];
  window.addEventListener('error', (e) => errors.push(e.error || e.message));
  process.on('unhandledRejection', (err) => errors.push(err));

  return { window, document: window.document, errors };
}
