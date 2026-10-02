# À FAIRE — actions manuelles, opérationnelles et externes en attente

Ce fichier recense tout ce qui doit être fait **hors code** : comptes à créer,
secrets à renseigner, migrations à appliquer, décisions produit à trancher,
prérequis externes.

> **Règle de tenue :** dès qu'une tâche fait apparaître une action manuelle ou
> externe, elle est ajoutée ici **dans la même tâche**, avec la date. On ne
> laisse aucun prérequis implicite.

Dernière mise à jour : 2026-10-02.

> 📎 Les **commandes** elles-mêmes sont dans `docs/commandes.md`. Ce fichier-ci
> dit *ce qui reste à faire et pourquoi* ; l'autre dit *comment le lancer*.

---

## 1. Variables d'environnement / secrets

Aucune variable d'environnement n'est requise : l'application tourne sans
serveur. La configuration Supabase (URL + clé anonyme) se saisit dans
l'écran Paramètres et reste dans le `localStorage` du navigateur.

- ⚠️ Ne jamais committer un export JSON de données réelles ni un `.env*`.

## 2. Comptes / services externes

| Service | Usage | Statut |
|---|---|---|
| GitHub `Ariel013/-personal-finance-tracker` | dépôt | en place (2026-10-02) ; le tiret en tête du nom est à corriger dans Settings → Rename, puis `git remote set-url` |
| Vercel | hébergement | **à créer** sur le compte de Kevin, relié au dépôt GitHub, branche `main` |
| Supabase (projet personnel) | sync entre appareils, optionnelle | à décider : voir § 4 |

## 3. Migrations à appliquer

| Migration | Environnement | Statut |
|---|---|---|
| Table `app_data` (SQL fourni dans l'écran Paramètres de l'app) | projet Supabase personnel | seulement si la sync est activée |

## 4. Décisions en attente

| Question | Qui tranche | Échéance | Impact si non tranché |
|---|---|---|---|
| Activer la sync Supabase pour un usage entre téléphone et ordinateur, ou rester en `localStorage` + export JSON ? | Kevin | avant le premier usage réel en France | sans décision, les données restent sur un seul appareil |
| Capter automatiquement les paiements de la carte virtuelle depuis le téléphone (idée du 2026-10-02 : lire la notification de paiement et créer la dépense) — faisable ? par quel canal (notification Android, e-mail de la banque, export) ? | Kevin, après une étude courte | aucune | idée seulement ; ne pas coder avant d'avoir vérifié qu'un canal fiable existe |
| Devise de travail : passer la devise par défaut de XOF à EUR, et garder l'historique XOF comme mois de transition ? | Kevin | avant la première saisie | l'analyse mélangerait deux devises sans conversion |

## 5. Ops et sauvegardes

- Les données vivent dans le navigateur : **vider le site ou changer de
  navigateur les perd**. La sauvegarde est l'export JSON depuis Paramètres,
  à faire à la main ; sa restauration se vérifie par un import sur un
  navigateur vierge (profil privé), pas par la taille du fichier.
- Non couvert : aucune sauvegarde automatique tant que la sync Supabase n'est
  pas activée.
