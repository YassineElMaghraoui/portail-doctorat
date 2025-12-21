# 🅰️ PORTAIL DOCTORAT - FRONTEND ANGULAR

## 📋 PRÉREQUIS

- Node.js 18+ 
- npm 9+
- Angular CLI 17+

## 🚀 INSTALLATION

```bash
# 1. Aller dans le dossier frontend
cd portail-doctorat-frontend

# 2. Installer les dépendances
npm install

# 3. Démarrer le serveur de développement
ng serve
# ou
npm start
```

L'application sera accessible sur **http://localhost:4200**

---

## 📁 STRUCTURE DU PROJET

```
src/app/
├── core/                         # Services, guards, interceptors
│   ├── guards/
│   │   ├── auth.guard.ts
│   │   └── role.guard.ts
│   ├── interceptors/
│   │   └── auth.interceptor.ts
│   ├── models/
│   │   ├── user.model.ts
│   │   ├── inscription.model.ts
│   │   ├── soutenance.model.ts
│   │   └── derogation.model.ts
│   └── services/
│       ├── auth.service.ts
│       ├── inscription.service.ts
│       └── derogation.service.ts
│
├── features/                     # Modules fonctionnels
│   ├── auth/                     # Login, Register
│   ├── dashboard/                # Tableau de bord
│   ├── inscriptions/             # Gestion inscriptions
│   ├── soutenances/              # Gestion soutenances
│   ├── derogations/              # Gestion dérogations
│   ├── campagnes/                # Gestion campagnes (admin)
│   ├── admin/                    # Administration
│   └── profil/                   # Profil utilisateur
│
├── shared/                       # Composants partagés
│   └── components/
│       ├── main-layout/          # Layout avec sidebar
│       └── not-found/            # Page 404
│
├── app.component.ts
├── app.config.ts
└── app.routes.ts
```

---

## 🔐 AUTHENTIFICATION

L'application utilise JWT pour l'authentification :

1. **Login** : `/auth/login` → récupère le token
2. **Token stocké** dans localStorage
3. **Interceptor** ajoute automatiquement le token aux requêtes
4. **Guards** protègent les routes

---

## 🛣️ ROUTES

| Route | Description | Rôle |
|-------|-------------|------|
| `/auth/login` | Connexion | Public |
| `/auth/register` | Inscription | Public |
| `/dashboard` | Tableau de bord | Tous |
| `/inscriptions` | Liste inscriptions | Doctorant |
| `/inscriptions/nouvelle` | Nouvelle inscription | Doctorant |
| `/soutenances` | Ma soutenance | Doctorant |
| `/derogations` | Mes dérogations | Doctorant |
| `/campagnes` | Gestion campagnes | Admin |
| `/admin/users` | Gestion utilisateurs | Admin |
| `/admin/derogations` | Traitement dérogations | Admin |
| `/profil` | Mon profil | Tous |

---

## 🔧 CONFIGURATION

### Environment (src/environments/environment.ts)

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api'  // API Gateway
};
```

### Proxy (pour dev, optionnel)

Créer `proxy.conf.json` :
```json
{
  "/api": {
    "target": "http://localhost:8080",
    "secure": false
  }
}
```

Puis lancer avec : `ng serve --proxy-config proxy.conf.json`

---

## 🎨 DESIGN

- **Styles** : SCSS avec variables CSS
- **Icons** : Bootstrap Icons
- **Font** : Inter (Google Fonts)
- **Responsive** : Grid CSS

---

## 📦 BUILD PRODUCTION

```bash
ng build --configuration production
```

Les fichiers seront dans `dist/portail-doctorat-frontend/`

---

## 🧪 TESTS

```bash
# Tests unitaires
ng test

# Tests e2e
ng e2e
```

---

## 📝 NOTES

- Angular 17 avec **Standalone Components**
- Utilisation des **Signals** pour la réactivité
- **Lazy loading** des modules
- Architecture **Feature-based**
