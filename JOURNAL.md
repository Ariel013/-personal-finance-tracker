# 🧭 Journal de bord — Pilotage financier personnel

> **Nouvelle session : LIS CE FICHIER EN PREMIER**, puis `CLAUDE.md`. Tu sauras
> où on en est, quoi faire ensuite et quoi éviter — sans relire tout le code.
>
> **Discipline** :
> 1. Au **démarrage** : lire les trois sections ci-dessous, puis agir / proposer.
> 2. En **fin de session** : mettre à jour « État & prochaine action », ajouter
>    une entrée au journal des sessions, consigner toute erreur en « Leçons ».
> 3. Convertir les dates relatives en absolues. Rester concis.

Carte des documents :
- `CLAUDE.md` : règles et carte des docs. `A-FAIRE.md` : actions hors code.
- `docs/architecture.md` : comment c'est fait. `docs/decisions/` : pourquoi.
- `docs/workflow-git.md` : branches et commits. `docs/commandes.md` : quoi lancer.
- `README.md` : ce que l'outil fait. `DEPLOY.md` : déploiement Vercel (hérité).

---

## 📍 État actuel & prochaine action

*(Mis à jour le 2026-10-02.)*

- **Origine** : projet de Yemalin Agbangla (`Pikatchu99/personal-finance-tracker`),
  deux commits (v2.2.0 le 2026-01-22, v2.3.0 le 2026-03-02), repris avec son
  accord dans `Ariel013/-personal-finance-tracker`. Historique conservé, ses
  commits restent à son nom.
- **Code** : Next.js 16 côté client, `localStorage`, sync Supabase optionnelle.
  **Aucun test.** Typecheck et build **verts** sur le poste local le
  2026-10-02 ; l'application n'a pas encore été regardée dans un navigateur.
- **Version en prod** : aucune vérifiée. Le projet Vercel reste à créer sur le
  compte de Kevin (`A-FAIRE.md`).
- **État des branches** : `main` poussée sur `origin` (2 commits de Yemalin) ;
  `staging` et `dev` créées en local à l'amorce, pas encore poussées.
- **Prochaine action** : relire `hooks/use-financial-analysis.ts` et poser le
  premier jeu de tests sur les calculs (argent disponible, charges fixes selon
  `startMonth`, moyennes 3 mois) avec un jeu de données fictif. **Critère de
  fin** : `pnpm test` existe et exerce ces trois calculs.

## 📓 Journal des sessions

### 2026-10-02 — Amorce du projet

Dépôt publié sous le compte de Kevin, option « historique conservé » choisie
plutôt qu'un historique neuf. Amorce selon le coffre de méthode :
`CLAUDE.md` réécrit en français (l'ancien, écrit par un autre agent, décrivait
l'architecture ; cette matière est passée dans `docs/architecture.md`),
`JOURNAL.md`, `A-FAIRE.md`, `docs/workflow-git.md`, `docs/commandes.md`,
ADR 0001 (un seul utilisateur, données locales, Supabase personnel en option)
et ADR 0002 (aucune donnée réelle dans le dépôt), sous-agents de revue,
hook `pre-push`, CI typecheck + build.

Décisions de Kevin à l'amorce : outil personnel, jamais multi-utilisateur ;
données sensibles → règle d'or n° 2 ; hors périmètre : IA et conseils
automatiques. Idée ouverte, non tranchée : capter automatiquement les
paiements de sa carte virtuelle depuis le téléphone (voir `A-FAIRE.md` § 4).

Mesures de la session : voir la ligne « Vérifications » ci-dessous, remplie
après l'exécution de `pnpm install`, `tsc --noEmit` et `pnpm build`.

- **Vérifications** (2026-10-02, poste local, Node 20, pnpm 11.3) :
  `pnpm install --frozen-lockfile` → 0 après `pnpm approve-builds sharp`
  (sans cette approbation, pnpm 11 refuse l'installation **et** le build :
  c'est pour ça que `pnpm-workspace.yaml` est versionné) ; `npx tsc --noEmit`
  → 0 erreur ; `pnpm build` → 0, deux routes statiques (`/`, `/_not-found`).
  **Non fait** : regarder l'application dans un navigateur.

## 🎓 Leçons apprises

*Une entrée dès qu'une erreur est commise et corrigée. Format : symptôme →
cause → règle. Ce qui vaut au-delà de ce projet monte dans le brain.*
