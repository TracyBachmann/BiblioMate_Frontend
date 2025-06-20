# BiblioMate – Frontend

BiblioMate est une application web de gestion de bibliothèque destinée aux utilisateurs, bibliothécaires et administrateurs. Ce dépôt contient le **frontend** de l’application, développé avec **Angular** et **Tailwind CSS**, et destiné à interagir avec l’API REST du backend .NET Core.

---

## 🎯 Objectifs

Offrir une interface intuitive, responsive et moderne permettant :

- la consultation et la recherche d’ouvrages
- l’emprunt et la réservation de livres pour les membres
- la gestion du stock et des utilisateurs pour les bibliothécaires et administrateurs
- un système de notifications intelligentes et de recommandations personnalisées

---

## ⚙️ Technologies utilisées

| Technologie         | Rôle                                      |
|---------------------|-------------------------------------------|
| Angular             | Framework principal côté client           |
| Tailwind CSS        | Framework CSS utilitaire                  |
| TypeScript          | Langage principal                         |
| RxJS                | Programmation réactive                    |
| JWT (via API)       | Authentification sécurisée                |
| SignalR             | Notifications temps réel                  |
| Angular Router      | Routage des vues                          |
| FormBuilder / Forms | Gestion des formulaires utilisateurs      |
| Azure DevOps        | CI/CD & déploiement                       |

---

## 📁 Arborescence (extrait)

```
src/
├── app/
│   ├── core/             # Services, guards, interceptors
│   ├── shared/           # Composants et modules réutilisables
│   ├── features/         # Modules fonctionnels : catalogue, profil, admin
│   └── app-routing.module.ts
├── assets/               # Logos, polices, images
├── environments/         # Environnements dev/prod
```

---

## 🚀 Lancement du projet

### Pré-requis

- Node.js ≥ 18
- Angular CLI ≥ 16
- Accès à l’API backend (voir dépôt associé)

### Installation

```bash
npm install
```

### Lancement en développement

```bash
ng serve
```

L’application sera accessible sur `http://localhost:4200/`

---

## 🔐 Authentification & rôles

| Rôle           | Accès                                                      |
|----------------|------------------------------------------------------------|
| Visiteur       | Consultation du catalogue uniquement                       |
| Membre         | Emprunts, réservations, espace personnel                   |
| Bibliothécaire | Gestion des livres, emprunts, réservations                 |
| Administrateur | Gestion des utilisateurs, statistiques, configuration      |

---

## 📦 Déploiement (Azure)

La CI/CD est gérée via **Azure DevOps**. Le frontend est automatiquement déployé via des pipelines après chaque push sur la branche `main`.

---

## 📄 Licence

Projet réalisé dans le cadre du **TP CDA**. Licence académique.
