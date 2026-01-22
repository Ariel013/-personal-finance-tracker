# Pilotage Financier Personnel

Une application web professionnelle de gestion financière personnelle, conçue pour un usage quotidien sérieux et orientée vers la prise de décision.

## 🎯 Caractéristiques principales

### Interface sobre et professionnelle
- Design minimaliste et épuré
- Icônes Lucide React
- Thème clair/sombre
- UX orientée décision

### Architecture technique
- **Framework**: Next.js 16 + React 19
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **UI Components**: Radix UI + shadcn/ui
- **Charts**: Recharts
- **Stockage**: localStorage (offline-first)
- **Data versioning**: v2.0.0

## 📊 Fonctionnalités

### 1. Budgets par catégorie
- Définition de budgets mensuels par catégorie
- Affichage du montant consommé, restant et pourcentage utilisé
- Alertes visuelles :
  - ✅ OK (< 80%)
  - ⚠️ Warning (80-100%)
  - ❌ Dépassement (> 100%)
- Soft constraint : les budgets n'empêchent pas les dépenses

### 2. Dépenses récurrentes intelligentes
- Gestion des charges fixes et variables
- Fréquence mensuelle avec jour de prélèvement
- Création automatique en début de mois
- Suspension temporaire possible
- Modification sans casser l'historique
- Vue distincte charges fixes/variables

### 3. Vue "Argent réellement disponible"
```
Argent disponible = Revenus - Charges fixes restantes - Budget minimum vital
```
- Visible sur le dashboard
- Évite toute illusion de solde
- Aide à la décision (sortie, achat, report)

### 4. Analyse temporelle
- Comparaison mois en cours vs mois précédent
- Moyenne sur 3 mois
- Évolution par catégorie
- Visualisations sobres (bar charts, line charts)

### 5. Dépenses avec items détaillés
- Une dépense peut contenir 0 à N items
- Chaque item : nom, quantité, prix unitaire, total, catégorie fine
- Montant total : saisi manuellement ou calculé automatiquement
- Items exploitables dans les analyses

### 6. Tags transversaux
- Tags libres indépendants des catégories
- Tags suggérés : #travail, #famille, #plaisir, #stress, #exceptionnel, etc.
- Filtrage des analyses par tags

### 7. Mode "Mois sous contrôle"
- Activable/désactivable dans les paramètres
- UX plus stricte (à implémenter selon besoins)
- Obligation de catégorisation
- Justification minimale

### 8. Notes de décision
- Champ dédié sur chaque dépense
- Contexte et arbitrage
- Consultable dans l'historique
- Visible dans les détails de la dépense

### 9. Snapshot mensuel
- Résumé automatique de fin de mois :
  - Dépenses totales
  - Budgets respectés/dépassés
  - Charges fixes vs variables
  - Décisions clés
- Export JSON
- Historique des snapshots

### 10. Mode simulation
- Ajout de dépenses/revenus fictifs
- Impact sur 1, 3 et 6 mois
- Aucune pollution des données réelles
- Aide à la projection financière

### 11. Gestion des revenus
- Revenus ponctuels ou récurrents
- Sources personnalisables
- Suivi mensuel
- Intégration dans les calculs

### 12. Activation budgétaire des abonnements 📅
- **Séparation date de création / date d'impact** :
  - Date de création : quand j'ajoute l'abonnement
  - Date d'impact : quand il commence à impacter le budget
- **Statuts intelligents** :
  - **À VENIR** : visible, non déduit du budget, anticipation
  - **ACTIF** : impacte le budget
  - **SUSPENDU** : temporairement inactif
- **Fréquences multiples** : mensuelle, trimestrielle, annuelle
- **Dashboard - Charges futures** :
  - Section dédiée aux abonnements à venir
  - Total mensuel futur estimé
  - Groupement par mois d'activation
  - Ne pénalise pas le mois courant
- **Anticipation claire** :
  - "À partir de quand cette charge va m'impacter ?"
  - "Quel sera mon budget une fois tous mes abonnements actifs ?"
  - Aucune approximation comptable

### 13. Mois de transition 🔄
- **Marquage explicite** des mois non représentatifs
- **Raisons** : changement de pays, fin de contrat, nouvelle source de revenu
- **Effets** :
  - Désactivation des alertes budgétaires inappropriées
  - Note explicative visible
  - Évite les graphiques trompeurs
- **Contexte financier** :
  - Zone/pays associé aux dépenses
  - Mois comptable explicite
  - Source de revenu optionnelle

### 14. Prêts et dettes 💰
- **Gestion séparée** des créances (argent prêté) et dettes (argent emprunté)
- **Remboursements partiels** avec historique complet
- **Statuts automatiques** : En cours, Partiellement remboursé, Remboursé
- **Échéances** avec alertes visuelles pour dates proches ou dépassées
- **Impact sur la trésorerie** :
  - Argent prêté : diminue la trésorerie (pas une dépense)
  - Argent emprunté : augmente la trésorerie (pas un revenu)
  - Remboursements suivis séparément
- **Vue synthétique** :
  - Total argent prêté (exposition)
  - Total argent emprunté (dettes)
  - Impact net sur la trésorerie
- **Exclus des statistiques** de dépenses/revenus classiques
- **Notes et contexte** pour chaque prêt/dette

## 📱 Organisation de l'application

### Onglets principaux
1. **Tableau de bord** : Vue synthétique + argent disponible + exposition prêts/dettes
2. **Dépenses** : Liste et ajout de dépenses
3. **Revenus** : Gestion des revenus
4. **Budgets** : Configuration et suivi des budgets
5. **Analyse** : Comparaisons temporelles
6. **Simulation** : Projections financières
7. **Prêts & Dettes** : Gestion des créances et dettes
8. **Récurrences** : Gestion des charges fixes/variables
9. **Paramètres** : Configuration + snapshots

## 🔧 Architecture des données

### Modèle de données versionné (v2.2.0)
```typescript
AppData {
  expenses: Expense[]
  categories: Category[]
  subscriptions: Subscription[]
  incomes: Income[]
  budgets: Budget[]
  snapshots: MonthlySnapshot[]
  loans: Loan[]
  settings: AppSettings
  version: string
}
```

### Séparation claire
- Dépenses
- Items (détails de dépenses)
- Récurrences (charges fixes/variables)
- Budgets
- Revenus
- **Prêts & Dettes** (créances et obligations)
- Tags
- Snapshots

### Prêt pour l'évolution
- Synchronisation multi-device (architecture préparée)
- Backend optionnel (hooks `getRawData`/`setRawData`)

## 🚀 Installation et démarrage

```bash
# Installation des dépendances
pnpm install

# Lancement en développement
pnpm run dev

# Build pour production
pnpm run build

# Démarrage de la production
pnpm start
```

## 📦 Export / Import

### Export
- **JSON** : Sauvegarde complète versionée (synchronisation multi-device)
- **CSV Dépenses** : Export tabulaire des dépenses
- **CSV Items** : Export détaillé des items

### Import
- **JSON** : Restauration complète avec migration automatique
- Validation et warnings
- Compatibilité ascendante

## 🎨 Principes de design

- **Sobre** : Pas de dégradés flashy, pas d'emojis
- **Professionnel** : Icônes réelles (Lucide)
- **Minimaliste** : UX claire et rapide
- **Orienté décision** : Chaque vue aide à décider
- **Responsive** : Mobile-first avec navigation par scroll

## 🔒 Données et confidentialité

- Stockage 100% local (localStorage)
- Aucune connexion serveur
- Fonctionnement offline
- Vos données restent sur votre appareil

## 🎯 Objectif

Construire un outil :
- Sérieux
- Fiable
- Orienté prise de décision
- Utilisé comme outil de pilotage, pas un gadget

---

**Version** : 2.2.0  
**Date de mise à jour** : Janvier 2026

## Changelog

### v2.2.0 - Activation budgétaire et périodes financières
- **Abonnements avec activation budgétaire** :
  - Statuts : À VENIR, ACTIF, SUSPENDU
  - Date de début d'impact budgétaire distinct de la date de création
  - Fréquences : mensuelle, trimestrielle, annuelle
  - Charges futures visibles mais non déduites du budget
- **Mois de transition** :
  - Marquage des mois non représentatifs
  - Désactivation des alertes inappropriées
  - Contexte explicatif
- **Contexte financier** :
  - Rattachement des dépenses à un mois comptable explicite
  - Zone/pays associé aux dépenses
  - Source de revenu optionnelle
- **Dashboard amélioré** :
  - Section "Charges futures" séparée
  - Indicateur de mois de transition
  - Séparation stricte budget consommé / budget futur

### v2.1.0 - Gestion des prêts et dettes
- Ajout de la gestion complète des prêts et dettes
- Séparation créances (argent prêté) / dettes (argent emprunté)
- Remboursements partiels avec historique
- Impact sur la trésorerie (hors dépenses/revenus)
- Alertes pour échéances

### v2.0.0 - Pilotage financier
- Budgets par catégorie avec alertes
- Revenus et analyse de trésorerie
- Vue "argent réellement disponible"
- Analyse temporelle (mois vs mois, moyenne 3 mois)
- Tags transversaux
- Mode "mois sous contrôle"
- Notes de décision
- Snapshots mensuels
- Mode simulation
