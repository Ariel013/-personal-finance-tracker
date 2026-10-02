# Commandes — Pilotage financier personnel

Gestionnaire de paquets : **pnpm** (jamais npm ni yarn).

`pnpm-workspace.yaml` autorise le script d'installation de `sharp`
(`allowBuilds`) : sans lui, pnpm 11 refuse `pnpm install` et `pnpm build`.
Si une nouvelle dépendance à script natif apparaît : `pnpm approve-builds <paquet>`,
et committer le fichier.

## Développement

```bash
pnpm install              # dépendances (lockfile respecté)
pnpm dev                  # serveur Next.js sur http://localhost:3000
npx tsc --noEmit          # typecheck
pnpm build                # build de production
pnpm start                # servir le build
```

`pnpm lint` est déclaré mais ESLint n'est pas installé dans le projet hérité :
la commande échoue. À installer ou retirer (backlog).

## Tests

Aucun test dans le projet hérité. Le premier jeu de tests est la prochaine
action du `JOURNAL.md` ; cette section se remplira avec lui.

## Déploiement

Vercel, relié au dépôt GitHub : un push sur `main` déploie en production.
Détail dans `DEPLOY.md`. Pas de variable d'environnement.

## Garde-fou local à réinstaller sur un nouveau clone

```bash
cat > .git/hooks/pre-push <<'HOOK'
#!/bin/sh
# Refuse force-push et suppression sur les branches longues.
protegees="main staging dev"
while read local_ref local_sha remote_ref remote_sha; do
  branche=${remote_ref#refs/heads/}
  for p in $protegees; do
    if [ "$branche" = "$p" ]; then
      if [ "$local_sha" = "0000000000000000000000000000000000000000" ]; then
        echo "pre-push : suppression de $p refusée" >&2; exit 1
      fi
      if [ "$remote_sha" != "0000000000000000000000000000000000000000" ] && ! git merge-base --is-ancestor "$remote_sha" "$local_sha"; then
        echo "pre-push : push non fast-forward sur $p refusé" >&2; exit 1
      fi
    fi
  done
done
exit 0
HOOK
chmod +x .git/hooks/pre-push
```

## À ne jamais lancer

- `git push --force` sur `main`, `staging` ou `dev` (le hook le refuse).
- `git add .` / `git add -A` : un export JSON réel partirait avec.
- Un import JSON de données réelles sur un navigateur utilisé pour les
  captures d'écran ou la démo.
