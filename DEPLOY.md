# 🚀 Guide de déploiement sur Vercel

Ce guide vous explique comment déployer votre application de pilotage financier sur Vercel.

## ⚡ Déploiement rapide (Recommandé)

### Option 1 : Via l'interface Vercel

1. **Créer un compte Vercel**
   - Allez sur [vercel.com](https://vercel.com)
   - Inscrivez-vous avec GitHub, GitLab ou Bitbucket

2. **Importer le projet**
   - Cliquez sur "Add New..." → "Project"
   - Importez votre repository Git
   - Ou uploadez directement le dossier

3. **Configuration automatique**
   - Vercel détecte automatiquement Next.js
   - Framework Preset: **Next.js**
   - Build Command: `pnpm build` (ou `npm run build`)
   - Output Directory: `.next`

4. **Déployer**
   - Cliquez sur **"Deploy"**
   - Attendez 2-3 minutes ⏱️
   - Votre app est en ligne ! 🎉

### Option 2 : Via la CLI Vercel

```bash
# Installer Vercel CLI
npm i -g vercel

# Se connecter
vercel login

# Déployer (depuis le dossier du projet)
vercel

# Suivre les instructions
# - Set up and deploy? Yes
# - Which scope? Your account
# - Link to existing project? No
# - Project name? personal-finance-tracker
# - Directory? ./
# - Override settings? No

# Déploiement en production
vercel --prod
```

## 🔧 Configuration

### Variables d'environnement

Cette application fonctionne 100% offline avec `localStorage`, donc **aucune variable d'environnement n'est nécessaire**.

### Région recommandée

L'app est configurée pour la région **CDG1** (Paris) dans `vercel.json`. Vous pouvez modifier selon votre localisation :

- `cdg1` : Paris (Europe)
- `iad1` : Washington DC (US East)
- `sfo1` : San Francisco (US West)
- `sin1` : Singapore (Asia)

## 📦 Build

Le build Next.js est optimisé automatiquement :

- ✅ **Static Generation** pour les pages
- ✅ **Tree-shaking** automatique
- ✅ **Code splitting** par route
- ✅ **Image optimization**
- ✅ **Font optimization**

## 🌐 Après le déploiement

### 1. Tester l'application

Vercel vous donne une URL : `https://your-project.vercel.app`

Testez :
- ✅ Ajout de dépenses
- ✅ Création d'abonnements
- ✅ Export CSV/JSON
- ✅ Mode simulation
- ✅ Prêts & Dettes

### 2. Domaine personnalisé (optionnel)

Dans les settings Vercel :
1. **Domains** → Add Domain
2. Entrez votre domaine : `finance.votredomaine.com`
3. Configurez les DNS selon les instructions
4. Certificat SSL automatique 🔒

### 3. Analytiques (déjà intégré)

L'app inclut `@vercel/analytics`. Activez dans Vercel Dashboard :
- **Analytics** → Enable
- Voir les visites, pages vues, performances

## 🔄 Mises à jour continues

### Déploiement automatique

Si vous utilisez Git :

1. **Push vers GitHub/GitLab**
   ```bash
   git add .
   git commit -m "Update: nouvelle fonctionnalité"
   git push
   ```

2. **Vercel déploie automatiquement** 🚀
   - Branche `main` → Production
   - Autres branches → Preview

### Déploiement manuel

```bash
# Mise à jour
vercel --prod
```

## 🛡️ Sécurité

Configuration déjà incluse dans `vercel.json` :

- ✅ **X-Content-Type-Options**: Protection contre MIME sniffing
- ✅ **X-Frame-Options**: Protection contre clickjacking
- ✅ **X-XSS-Protection**: Protection XSS
- ✅ **HTTPS** forcé automatiquement

## 📱 Performance

Optimisations automatiques Vercel :

- ⚡ **Edge Network** global (latence ~50ms)
- 🗜️ **Compression Brotli/Gzip**
- 🎯 **Smart CDN caching**
- 📊 **Core Web Vitals** optimisés

## 🐛 Résolution de problèmes

### Erreur de build

```bash
# Tester le build localement
pnpm build

# Vérifier les logs
vercel logs
```

### Données ne persistent pas

**Normal** : Les données sont en `localStorage` (côté client).
- Chaque utilisateur a ses propres données
- Pas de synchronisation entre appareils (par design)
- Utiliser Export/Import JSON pour transfert

### Performance lente

- Vérifier la région Vercel (choisir la plus proche)
- Analyser avec Vercel Speed Insights
- Optimiser les images si nécessaire

## 📞 Support

- **Documentation Vercel** : [vercel.com/docs](https://vercel.com/docs)
- **Status** : [vercel-status.com](https://vercel-status.com)

## 🎯 Checklist finale

Avant de déployer :

- [ ] Tests locaux OK (`pnpm dev`)
- [ ] Build réussi (`pnpm build`)
- [ ] Pas d'erreurs de lint (`pnpm lint`)
- [ ] README.md à jour
- [ ] Données sensibles hors du code

Après déploiement :

- [ ] URL accessible
- [ ] Toutes les fonctionnalités marchent
- [ ] Export/Import JSON fonctionne
- [ ] Version affichée : 2.2.0

---

**Bon déploiement ! 🚀**

Votre outil de pilotage financier sera accessible 24/7 partout dans le monde.
