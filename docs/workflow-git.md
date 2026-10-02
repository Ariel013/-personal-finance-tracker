# Workflow git — Pilotage financier personnel

Dérivé de la méthode du coffre (`~/PROJETS/brain/00-methode/workflow-git.md`).
Ce qui est propre à ce projet est marqué **[projet]**.

## La règle absolue

**Jamais de `git push` sans confirmation explicite, à chaque fois.** Le reste
des commandes git — branche, `add`, `commit`, fusion locale, tag — l'agent les
exécute lui-même et annonce ce qu'il fait.

## Branches

```
main       ← PRODUCTION (Vercel). Reçoit uniquement staging.
 └ staging  ← RECETTE. Candidat stable.
    └ dev    ← INTÉGRATION. Tests et vérifications.
       └ <type>/<slug>  ← une branche par tâche, issue de dev.
```

- Jamais de commit direct sur `main`, `staging`, `dev`.
- Une tâche = une branche = un sujet.
- Remontée un niveau à la fois, `merge --no-ff`, tag `vX.Y.Z` sur `main`.
- **[projet]** Les deux commits d'origine (v2.2.0, v2.3.0) sont de Yemalin
  Agbangla et restent à son nom : on ne réécrit pas l'historique hérité.

## Commits

```
<type>: <résumé court à l'impératif, en français>

<corps optionnel : le POURQUOI, si le diff ne suffit pas>
```

`type` ∈ `feat`, `fix`, `refactor`, `docs`, `chore`, `test`, `style`.

- **[projet]** Aucun trailer `Co-Authored-By` ni signature d'agent.
- Ne jamais affirmer dans un message une propriété non mesurée (« les tests
  passent » suppose qu'on les a lancés).
- `git add <chemins nommés>`, jamais `git add .` ni `-A`.

## Séquence d'une tâche

1. Lire `JOURNAL.md`, `CLAUDE.md`, puis les docs du sujet.
2. Brancher `<type>/<slug>` depuis un `dev` à jour.
3. Coder ; typecheck, tests, **et regarder l'application** (`pnpm dev`).
4. Rapport de tâche (format dans `CLAUDE.md`), commit après validation.
5. Remontée `dev → staging → main`, confirmation avant chaque push.
6. `A-FAIRE.md` et `JOURNAL.md` à jour dans la même tâche.

## Garde-fous en place

- Hook local `.git/hooks/pre-push` : refuse force-push et suppression sur
  `main`, `staging`, `dev` (à réinstaller sur un nouveau clone, voir
  `docs/commandes.md`).
- CI GitHub Actions : typecheck + build sur `dev`, `staging`, `main` et les
  PR.
