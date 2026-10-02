# 0001 — Un seul utilisateur : données locales d'abord, Supabase personnel en option, sans cloisonnement

**Statut** : adopté (2026-10-02)

## Contexte

Le projet est repris d'un outil écrit pour un usage individuel : tout l'état
vit dans le `localStorage` du navigateur, et une synchronisation Supabase
optionnelle (v2.3.0) laisse l'utilisateur coller l'URL et la clé anonyme de
**son propre** projet Supabase, vers une table `app_data` unique, sans
authentification. Au moment de l'amorce, il fallait décider si l'outil
pourrait un jour servir plusieurs personnes isolées — ce qui impose une
colonne de cloisonnement dès le premier schéma — ou s'il reste personnel.

## Décision

L'outil sert **un seul utilisateur, Kevin, et ne servira jamais plusieurs
utilisateurs isolés**. Les données restent locales par défaut ; la
synchronisation Supabase reste optionnelle et pointe vers un projet Supabase
personnel. Aucune colonne de cloisonnement, aucune authentification
applicative n'est ajoutée.

## Pourquoi

- C'est l'usage réel, dit explicitement à l'amorce ; cloisonner « au cas où »
  coûte une couche d'auth et de politiques d'accès pour personne.
- Le projet Supabase personnel, protégé par sa propre clé, est le
  périmètre de sécurité : les données ne transitent par aucun serveur
  du projet.
- Si l'usage change un jour, ce sera un autre produit : nouvel ADR qui
  remplace celui-ci, et migration explicite.

## Conséquences

- Pas de table `users`, pas de session, pas de politique RLS à écrire.
- La sécurité repose sur deux règles : la clé Supabase ne quitte pas le
  `localStorage` de l'utilisateur, et aucune donnée réelle n'entre dans le
  dépôt (ADR 0002).
- Toute fonctionnalité « partage » ou « compte » est hors périmètre tant que
  cet ADR est en vigueur.
