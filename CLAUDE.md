# CLAUDE.md

Instructions pour Claude Code sur ce dépôt (HARDWOOD — simulation de carrière basket, Vite + JS
vanilla, sans framework).

## Garde-fou permanent : AGENDA.md avant tout `npm run ship`

`AGENDA.md` (racine du dépôt) est le registre des fonctionnalités demandées par l'utilisateur
mais pas encore livrées. Il existe pour qu'aucune demande ne se perde d'une session à l'autre.

**Avant chaque `npm run ship`, sans exception :**

1. Relire `AGENDA.md` en entier.
2. Pour toute ligne travaillée dans la session en cours : ne la cocher `[x]` **que si** son
   critère de validation observable est réellement confirmé — par un audit (`npm run audit`,
   `scripts/deep-audit.mjs`), un test, ou une vérification directe équivalente. Ne jamais
   cocher sur la base d'une simple impression que « ça devrait marcher ». En cas de doute,
   la ligne reste non cochée.
3. Si une demande nouvelle apparaît dans la session (feature mentionnée par l'utilisateur mais
   pas traitée immédiatement), l'ajouter à `AGENDA.md` avec un identifiant, une description et
   un critère observable, avant de conclure.
4. Lister explicitement à l'utilisateur, en clair dans la réponse finale, ce qui reste ouvert
   dans `AGENDA.md` après la session — pas seulement ce qui a été fait.
5. Seulement après ces étapes : lancer `npm run ship`.

Cette règle s'applique à toute session qui modifie du code, qu'elle réponde ou non à un item
d'`AGENDA.md` en particulier — l'objectif est qu'aucune fonctionnalité demandée ne soit
silencieusement oubliée.
