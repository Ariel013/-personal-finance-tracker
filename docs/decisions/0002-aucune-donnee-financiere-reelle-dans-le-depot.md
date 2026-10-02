# 0002 — Aucune donnée financière réelle dans le dépôt, les tests ni les captures

**Statut** : adopté (2026-10-02)

## Contexte

L'outil manipule les finances personnelles de Kevin : montants, créanciers,
prêts entre proches, notes de décision. Le dépôt est public. Le projet
d'origine avait un jeu de données de démonstration injecté par import JSON ;
rien n'empêchait de committer un export réel par mégarde.

## Décision

Aucune donnée réelle n'entre dans le dépôt, sous aucune forme : ni export
JSON, ni capture d'écran, ni extrait dans le journal, ni valeur dans un test.
Le développement et les tests utilisent un **jeu de données fictif**,
versionné, aux montants et libellés manifestement inventés.

## Pourquoi

- Dépôt public : une donnée committée est publiée pour toujours, même
  supprimée ensuite.
- Un jeu fictif versionné rend les tests reproductibles et lisibles par
  quelqu'un qui n'a pas accès aux vraies données.

## Conséquences

- `.gitignore` exclut `*.json` d'export (`exports/`, `*-export*.json`,
  `.env*`) ; un export réel se range **hors** du dépôt.
- Toute capture d'écran pour la doc ou le portfolio se fait sur le jeu fictif.
- Le contrôle final avant commit se fait sur `git diff --cached`, pas sur
  l'intention.
