# Architecture — Pilotage financier personnel

Repris du `CLAUDE.md` d'origine (v2.3.0), vérifié contre le code le 2026-10-02.

## Vue d'ensemble

Application Next.js 16 (App Router) **entièrement côté client** : une seule
page, `app/page.tsx`, à onglets (tableau de bord, dépenses, revenus, budgets,
analyse, simulation, prêts et dettes, abonnements, rapport mensuel, actions
financières, paramètres). Pas d'API, pas de serveur applicatif : le build est
statique et s'héberge sur Vercel.

## Où vit l'état

- `hooks/use-expense-data.ts` est **le** point d'entrée de toute écriture :
  les composants appellent ses méthodes (`addExpense`, `updateExpense`, …),
  qui mettent l'état à jour puis l'écrivent dans `localStorage`.
- Le modèle (`lib/types.ts`, type `AppData`) est **versionné** ; les migrations
  s'appliquent à la lecture (v1 → v2.0 → v2.2 → v2.3), ce qui garde les exports
  JSON anciens importables.
- `hooks/use-auto-recurrences.ts` génère les dépenses des abonnements actifs
  en début de mois, en vérifiant une fois par jour via un horodatage local.
- `hooks/use-financial-analysis.ts` calcule : argent disponible = revenus −
  dépenses − charges fixes restantes − budget minimum vital ; comparaison des
  mois ; moyennes glissantes sur 3 mois ; état de chaque budget.

## Synchronisation distante (optionnelle)

`lib/supabase.ts` et `hooks/use-supabase-sync.ts` : l'utilisateur saisit dans
Paramètres l'URL et la clé anonyme de **son** projet Supabase (stockées dans
`localStorage`, jamais dans le code). Une table `app_data` reçoit le document
entier (push / pull / sauvegarde avant pull). Pas d'auth, pas de
cloisonnement : [ADR 0001](decisions/0001-un-seul-utilisateur-donnees-locales-supabase-personnel-en-option.md).

## Modèle de données

- **Dépenses** : montant, catégorie, lignes détaillées optionnelles, tags,
  note de décision, mois comptable, zone/pays.
- **Abonnements** : statut `A_VENIR` | `ACTIF` | `SUSPENDU`, fréquence
  mensuelle / trimestrielle / annuelle, date d'impact budgétaire distincte de
  la date de création (`startMonth`).
- **Prêts** : type `PRETE` | `EMPRUNTE`, remboursements partiels avec
  historique ; hors statistiques de dépenses et revenus.
- **Revenus, budgets, catégories, instantanés mensuels, actions financières**.
- **Réglages** : devise (XOF par défaut), locale (`fr-FR`), budget minimum
  vital, mois de transition (mois non représentatifs, alertes désactivées).

## Interface

Tailwind CSS 4, shadcn/ui (`components/ui/`, géré par la CLI shadcn, ne pas
éditer à la main), icônes Lucide, Recharts, react-hook-form + Zod. Thème
clair/sombre via `next-themes`. Libellés en français, moyens de paiement
régionaux (Wave, Djamo, mobile money).

## Ce qui manque, connu à l'amorce

- Aucun test automatisé.
- `pnpm lint` déclaré sans ESLint installé.
- Pas de jeu de données fictif versionné (requis par l'ADR 0002).
