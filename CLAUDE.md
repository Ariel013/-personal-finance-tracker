# Pilotage financier personnel — contexte projet pour Claude Code

Lis ce fichier en entier avant toute tâche. Il pointe vers les docs de
référence — lis aussi celles qui concernent ta tâche avant de coder.

> **⚡ EN TOUT PREMIER, à chaque nouvelle session : lis `JOURNAL.md`.**
> C'est le fil de continuité (où on en est, la prochaine action, les leçons
> apprises). Tu le **mets à jour en fin de session**.

## Le projet en une phrase

Outil **personnel** de pilotage financier de Kevin : dépenses, revenus,
budgets, abonnements, prêts et dettes, rapport mensuel. Un seul utilisateur,
jamais plusieurs. Repris le 2026-10-02 depuis le projet de Yemalin Agbangla
(deux commits, avec son accord) pour l'adapter à sa vie en France.

## Où en est le projet — LIS CECI AVANT TOUTE CHOSE

- **Phase actuelle : reprise.** Le code hérité fonctionne (v2.3.0) mais n'a
  **aucun test** et n'a pas encore été relu par nous. Ne pas supposer qu'une
  fonctionnalité décrite dans `README.md` est vérifiée.
- Les données vivent dans `localStorage` ; la synchronisation Supabase est
  **optionnelle**, l'utilisateur colle sa propre URL et sa clé anonyme dans
  les paramètres. Pas d'authentification, pas de cloisonnement : décidé en
  [ADR 0001](docs/decisions/0001-un-seul-utilisateur-donnees-locales-supabase-personnel-en-option.md).
- Pas de déploiement vérifié à ce jour (voir `JOURNAL.md`).

## Stack technique

- **Frontend** : Next.js 16 (App Router, une seule page à onglets), React 19,
  TypeScript, Tailwind CSS 4, shadcn/ui (Radix), Recharts, react-hook-form + Zod.
- **État** : le hook `hooks/use-expense-data.ts` tient tout l'état et
  l'écrit dans `localStorage` (modèle versionné, migrations à la lecture).
- **Persistance distante (option)** : Supabase, table `app_data`, via
  `lib/supabase.ts` et `hooks/use-supabase-sync.ts`.
- **Hébergement** : Vercel (`vercel.json`, région `cdg1`). Pas de variable
  d'environnement nécessaire.
- **Gestionnaire de paquets** : pnpm, jamais npm ni yarn.

## Documents de référence — à consulter selon la tâche

| Doc | Quand le lire |
|---|---|
| `JOURNAL.md` | **En tout premier, à chaque session.** |
| `A-FAIRE.md` | Pour les actions manuelles/externes en attente |
| `docs/architecture.md` | Avant toute décision structurante |
| `docs/workflow-git.md` | Avant tout commit |
| `docs/commandes.md` | Aide-mémoire des commandes — et de celles à ne jamais lancer |
| `docs/decisions/` | Avant de remettre en cause un choix déjà fait |
| `README.md` | Ce que l'outil fait, pour un humain qui arrive |
| `DEPLOY.md` | Déploiement Vercel, hérité du projet d'origine |

## Règles d'or, non négociables

1. **Ne jamais faire `git push` sans confirmation explicite, à chaque fois.**
2. **Aucune donnée financière réelle dans le dépôt, les tests, les captures
   d'écran ou le journal.** Le développement se fait sur un jeu de données
   fictif ; les exports JSON et `.env*` restent hors git
   ([ADR 0002](docs/decisions/0002-aucune-donnee-financiere-reelle-dans-le-depot.md)).
3. **Sur une décision d'architecture ambiguë, s'arrêter et demander** plutôt
   que d'improviser silencieusement.
4. **Un calcul financier ne change pas sans test.** Toute modification de
   `use-financial-analysis.ts`, des migrations de données ou des totaux
   s'accompagne d'un test qui l'exerce : le code hérité n'en a aucun, on ne
   l'aggrave pas.
5. **Le modèle de données est versionné** (`lib/types.ts`, champ `version`) :
   tout changement de schéma s'accompagne d'une migration à la lecture,
   compatible avec les exports JSON existants.
6. **Interface en français**, sobre, sans emoji ; devise et locale sont des
   réglages, pas des constantes.
7. **Hors périmètre** : aucune IA ni conseil automatique. L'outil mesure et
   présente, il ne recommande pas.

## Après chaque tâche — format de rapport attendu

```
## Tâche : <résumé en une ligne>
### Nature : feature | fix | refactor | doc | chore
### Fichiers modifiés : <liste>
### Ce qui a changé et pourquoi : <2-4 lignes>
### Décision(s) prise(s) qui mériterait(nt) un ADR : <oui/non, laquelle>
### Commit proposé : <message exact, non encore exécuté>
```

Kevin valide le commit avant qu'il ne soit fait. Pas de trailer de co-auteur
dans les messages de commit.

## Continuité entre sessions

1. **Reprise sans relecture du code** : `JOURNAL.md` + ce fichier suffisent.
2. **Apprendre des erreurs** : toute erreur corrigée est consignée dans
   « Leçons apprises » de `JOURNAL.md`.
3. **Être force de proposition** : après avoir pris l'état, recommander la
   suite — ne pas lister des options.

En fin de session, mettre à jour `JOURNAL.md`. C'est la condition de la reprise.
