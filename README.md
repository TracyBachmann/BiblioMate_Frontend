# BiblioMate – Frontend (Angular)

Ce dépôt contient le **frontend** de BiblioMate, réalisé avec **Angular 19**. L’application consomme l’API REST du backend .NET et offre une interface moderne pour membres, bibliothécaires et administrateurs.


## ✨ Fonctionnalités (visibles côté UI)

- Parcours catalogue : recherche par titre/auteur/genre, détail livre.
- Espace membre : réservations et emprunts (via API).
- Back‑office (rôles élevés) : gestion des livres & inventaire.
- Intégration Swagger (tests d’API) côté backend ; ce front s’y connecte.


## 🧰 Pile technique

- **Angular 19**, **TypeScript**
- **Router**, **Forms**
- **RxJS**
- **SCSS** (pas de framework CSS imposé)
- (Optionnel) **Tailwind** si activé dans le projet
- **Build** : Angular CLI
- **CI/CD** : GitHub Actions (build image Docker de prod)
- **Runtime** : NGINX (image finale)


## 🗂️ Organisation (extrait)

```
src/
├── app/
│   ├── core/       # services transverses, guards, interceptors
│   ├── shared/     # composants/pipes/directives réutilisables
│   └── features/   # domaines fonctionnels (catalogue, profil, admin, ...)
├── assets/
├── environments/   # variables d'env Angular (dev/prod)
└── styles.scss
```

> La configuration d’API est centralisée dans les environnements (`environment.*`), par ex. :
```ts
export const environment = {
  production: false,
  apiBase: '/api'
};
```


## ▶️ Démarrage local

### Prérequis
- Node.js ≥ 18
- Angular CLI

### Installation
```bash
npm install
```

### Lancement dev
```bash
npm start         # alias: ng serve
```
Front : `http://localhost:4200`

> Assurez‑vous que l’API backend est disponible (ex. `http://localhost:5001/swagger`).


## 🐳 Build & déploiement (Docker)

**Dockerfile (build Angular puis NGINX)**
```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci --no-audit --no-fund
COPY . .
RUN npm run build -- --configuration production

FROM nginx:alpine AS runtime
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/frontend/browser /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "daemon off;"]
```

**nginx.conf (proxy vers l’API)**
```nginx
location /api/ {
  proxy_pass http://backend:5000/;
  proxy_http_version 1.1;
  proxy_set_header Upgrade $http_upgrade;
  proxy_set_header Connection keep-alive;
  proxy_set_header Host $host;
}
```

**Extrait workflow GitHub Actions**
```yaml
- uses: docker/setup-buildx-action@v3
- uses: docker/login-action@v3
- uses: docker/build-push-action@v6
  with:
    file: ./Dockerfile
    push: true
```


## 🔐 Rôles & accès (côté UX)

| Rôle           | Capacités principales                               |
|----------------|------------------------------------------------------|
| Visiteur       | Consultation du catalogue                           |
| Membre         | Réservations, vue de mes emprunts                   |
| Bibliothécaire | CRUD livres/stock, retours, gestion des réservations|
| Administrateur | Gestion des utilisateurs, supervision               |

> L’authentification (JWT) et l’autorisation sont gérées par le backend.


## 🔗 Points utiles

- Backend Swagger : `http://localhost:5001/swagger`
- Base URL front (docker) : `http://localhost:8080` (selon compose)
- Base URL front (dev) : `http://localhost:4200`


## 📝 Licence

Projet académique. Voir le dépôt pour les mentions complémentaires.
