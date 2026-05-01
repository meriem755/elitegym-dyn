# EliteGym — Application de Gestion de Salle de Sport

Application web et mobile (React Native / Expo) avec backend Node.js (Express) connecté à MySQL.

---

## Architecture

```
workspace/
├── artifacts/
│   ├── api-server/          # Backend Node.js / Express (TypeScript)
│   │   └── src/
│   │       ├── routes/      # Toutes les routes API REST
│   │       └── lib/         # db.ts (MySQL), auth.ts (JWT)
│   └── elitegym/            # Application mobile/web (Expo / React Native)
│       ├── app/             # Écrans (Expo Router)
│   │   │   ├── login.tsx        # Page de connexion
│   │   │   ├── coach.tsx        # Espace coach
│   │   │   ├── admin.tsx        # Espace admin
│   │   │   └── (tabs)/          # Onglets membre
│   │   │       ├── index.tsx        # Accueil
│   │   │       ├── planning.tsx     # Planning de la semaine
│   │   │       ├── abonnements.tsx  # Types d'abonnements
│   │   │       ├── coachs.tsx       # Équipe de coachs
│   │   │       ├── boutique.tsx     # Boutique
│   │   │       ├── contact.tsx      # Contact
│   │   │       ├── messages.tsx     # Messagerie / Notifications
│   │   │       └── profil.tsx       # Paramètres + BMI
│   │       ├── components/      # Composants réutilisables
│   │       ├── context/         # AuthContext (gestion connexion)
│   │       └── lib/             # api.ts (appels HTTP vers backend)
└── lib/                     # Bibliothèques partagées (codegen API)
```

---

## Prérequis

| Outil | Version |
|-------|---------|
| Node.js | 20+ |
| pnpm | 9+ |
| MySQL | 9.x |

---

## Installation

### 1. Installer Node.js et pnpm

```bash
# Installer Node.js (via nvm)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
nvm install 20
nvm use 20

# Installer pnpm
npm install -g pnpm
```

### 2. Cloner et installer les dépendances

```bash
git clone <votre-repo>
cd workspace
pnpm install
```

### 3. Créer la base de données MySQL

```bash
# Connectez-vous à MySQL
mysql -u root -p

# Dans MySQL
CREATE DATABASE elitegym CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE elitegym;

# Importez le schéma SQL fourni
source attached_assets/elitegym_1777650946184.sql;
```

### 4. Variables d'environnement du backend

Créez le fichier `artifacts/api-server/.env` :

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=votre_mot_de_passe
DB_NAME=elitegym
JWT_SECRET=une_cle_secrete_longue
PORT=8080
```

### 5. Variables d'environnement du frontend

Créez le fichier `artifacts/elitegym/.env` :

```env
EXPO_PUBLIC_DOMAIN=localhost:8080
```

---

## Démarrage

### Backend (Terminal 1)

```bash
pnpm --filter @workspace/api-server run dev
```

Le serveur démarre sur `http://localhost:8080/api`

### Frontend mobile/web (Terminal 2)

```bash
pnpm --filter @workspace/elitegym run dev
```

- **Web** : Ouvrez `http://localhost:3000` dans votre navigateur
- **Mobile** : Scannez le QR code avec l'application **Expo Go**

---

## Comptes de test

| Rôle | Téléphone | Mot de passe |
|------|-----------|--------------|
| Admin | (non défini dans les données) | — |
| Membre | +213600000000 | test |

> ⚠️ Les mots de passe dans la base de données sont hashés avec bcrypt. Pour créer un compte admin avec un numéro, utilisez ce script :

```bash
node -e "
const bcrypt = require('bcrypt');
bcrypt.hash('votre_mdp', 12).then(h => console.log(h));
"
# Puis : UPDATE utilisateur SET telephone = '+213xxxxxxxxx', mot_de_passe = 'hash_ci_dessus' WHERE id_util = 1;
```

---

## Fonctionnalités

### Connexion
- Authentification par numéro de téléphone + mot de passe
- Redirection automatique selon le rôle (membre / coach / admin)

### Espace Membre
- **Accueil** : cours de la semaine, réservations actives
- **Planning** : filtrer par jour, réserver ou annuler un cours (règle 48h)
- **Abonnements** : voir les formules, souscrire/renouveler en ligne
- **Équipe** : liste des coachs avec spécialités
- **Boutique** : catalogue de produits
- **Contact** : coordonnées de la salle
- **Messages** : notifications et messagerie
- **Profil** : calcul IMC, changement de mot de passe et numéro, déconnexion

### Espace Coach
- Planning de ses cours
- Liste de ses membres
- Planifier un nouveau cours
- Messages/notifications

### Espace Admin
- Tableau de bord : statistiques membres/coachs/paiements
- Gestion des membres (ajout)
- Gestion des coachs (ajout)
- Vérification des paiements
- Journal d'audit

---

## API Endpoints

| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/api/auth/login` | Connexion |
| POST | `/api/auth/change-password` | Changer mot de passe |
| POST | `/api/auth/change-phone` | Changer téléphone |
| GET | `/api/cours` | Tous les cours |
| GET | `/api/cours/week` | Cours de la semaine |
| GET | `/api/cours/coach/:id` | Cours d'un coach |
| POST | `/api/cours` | Créer un cours |
| GET | `/api/reservations/membre/:id` | Réservations d'un membre |
| POST | `/api/reservations` | Créer une réservation |
| PUT | `/api/reservations/:id/annuler` | Annuler une réservation |
| GET | `/api/abonnements/formules` | Formules disponibles |
| GET | `/api/abonnements/membre/:id` | Abonnements d'un membre |
| POST | `/api/abonnements` | Souscrire |
| GET | `/api/coachs` | Liste des coachs |
| GET | `/api/coachs/:id/membres` | Membres d'un coach |
| GET | `/api/messages/:id_util` | Messages d'un utilisateur |
| POST | `/api/messages` | Envoyer un message |
| GET | `/api/admin/membres` | Tous les membres |
| GET | `/api/admin/coachs` | Tous les coachs |
| GET | `/api/admin/paiements` | Historique paiements |
| GET | `/api/admin/audit` | Journal d'audit |
| POST | `/api/admin/membres` | Ajouter un membre |
| POST | `/api/admin/coachs` | Ajouter un coach |

---

## Technologies utilisées

- **Frontend** : React Native (Expo), Expo Router, TanStack Query
- **Backend** : Node.js, Express 5, TypeScript
- **Base de données** : MySQL (mysql2)
- **Auth** : JWT (jsonwebtoken) + bcrypt
- **Monorepo** : pnpm workspaces
