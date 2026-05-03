# EliteGym — Application de Gestion de Salle de Sport

Application mobile complète pour la salle **EliteGym** de Béjaïa, Algérie.  
Stack : **Expo / React Native** (mobile) · **Node.js / Express** (API) · **MySQL via WAMP Server** (base de données).

---

## Table des matières

1. [Présentation](#présentation)
2. [Architecture technique](#architecture-technique)
3. [Rôles utilisateurs](#rôles-utilisateurs)
4. [Fonctionnalités par rôle](#fonctionnalités-par-rôle)
5. [Structure du projet](#structure-du-projet)
6. [Base de données MySQL](#base-de-données-mysql)
7. [Installation et démarrage](#installation-et-démarrage)
8. [Variables d'environnement](#variables-denvironnement)
9. [Routes API](#routes-api)
10. [Écrans mobiles](#écrans-mobiles)
11. [Sécurité](#sécurité)
12. [Problèmes fréquents](#problèmes-fréquents)

---

## Présentation

**EliteGym** est une application mobile de gestion de salle de sport couvrant l'ensemble du cycle de vie :  
inscription des membres, planification des cours, réservations, paiements, suivi physique, gestion des équipements, programmes d'entraînement et audit complet.

---

## Architecture technique

| Couche | Technologie |
|--------|-------------|
| Mobile | Expo SDK 52, React Native 0.81, Expo Router ~6.0 |
| API | Node.js 20, Express 5, TypeScript |
| Base de données | MySQL 8.x via **WAMP Server** |
| Driver MySQL | **mysql2** ^3.22.3 (pool de connexions) |
| Authentification | JWT (jsonwebtoken), bcrypt (hash mots de passe, coût 12) |
| Monorepo | pnpm workspaces |

---

## Rôles utilisateurs

| Rôle | Description |
|------|-------------|
| `membre` | Client inscrit à la salle |
| `coach` | Encadrant sportif |
| `admin` | Gestionnaire de la salle (accès total) |

La connexion se fait par **numéro de téléphone** ou **email** + mot de passe.  
Mot de passe par défaut pour les nouveaux comptes créés par l'admin : `elitegym2026`

---

## Fonctionnalités par rôle

### Membre
- Consultation et modification du profil (nom, email, téléphone, mot de passe)
- Visualisation des cours disponibles de la semaine
- Réservation et annulation de cours (annulation impossible à moins de 48h du cours)
- Historique des présences avec statistiques (séances totales, heures, cours favori, graphique activité hebdomadaire)
- Suivi de progression physique (poids, IMC, tour de taille)
- Historique des paiements et abonnements
- Notation et commentaire des cours suivis (1 à 5 étoiles)

### Coach
- Tableau de bord des cours planifiés (statut : en attente, approuvé, refusé, terminé)
- Soumission de nouveaux cours → validation par l'admin requise avant publication
- Marquage des présences membre par cours
- Consultation des avis et notes reçus par cours avec moyennes
- Visualisation des membres inscrits à ses cours
- Suivi de performance des membres (poids, IMC, observations)
- Création de programmes d'entraînement personnalisés
- Modification du profil et des identifiants de connexion

### Administrateur
- **Tableau de bord** : KPIs temps réel (membres, coachs, réservations, cours en attente, revenus mensuel/total, abonnements actifs, graphique revenus 6 mois)
- **Membres** : liste, ajout rapide, modification, désactivation (soft delete)
- **Coachs** : liste, ajout avec spécialité, modification, désactivation
- **Planning** : visualisation et validation/rejet des cours soumis par les coachs
- **Paiements** : historique des 100 derniers paiements, enregistrement manuel
- **Abonnements** : liste des abonnements, affectation d'une formule à un membre
- **Formules** : création, modification et désactivation des formules d'abonnement
- **Équipements** : inventaire CRUD (nom, catégorie, état, quantité, date d'acquisition, notes)
- **Audit** : journal des 200 dernières actions horodatées
- **Paramètres** : sauvegarde base de données, modification des identifiants admin

---

## Structure du projet

```
elitegym-monorepo/
├── artifacts/
│   ├── api-server/                    # Backend Express + MySQL
│   │   ├── src/
│   │   │   ├── index.ts               # Point d'entrée, écoute PORT
│   │   │   ├── app.ts                 # Express app, CORS, middlewares, routes
│   │   │   ├── lib/
│   │   │   │   ├── db.ts              # Pool mysql2 (DATABASE_URL)
│   │   │   │   ├── auth.ts            # signToken(), authMiddleware JWT
│   │   │   │   ├── logger.ts          # Pino logger
│   │   │   │   └── ws.ts              # WebSocket (réservé usage futur)
│   │   │   └── routes/
│   │   │       ├── auth.ts            # login, change-password/phone/email, profil
│   │   │       ├── admin.ts           # membres, coachs, paiements, formules,
│   │   │       │                      # abonnements, équipements, planning, audit,
│   │   │       │                      # stats tableau de bord, sauvegarde
│   │   │       ├── cours.ts           # CRUD cours, liste semaine, cours par coach
│   │   │       ├── reservations.ts    # réservation, annulation, historique présence
│   │   │       ├── presences.ts       # marquage présences, historique paiements membre
│   │   │       ├── abonnements.ts     # formules publiques, abonnements membre
│   │   │       ├── coachs.ts          # liste coachs, membres d'un coach
│   │   │       ├── stats.ts           # statistiques globales publiques
│   │   │       ├── progress.ts        # suivi performance membre/coach
│   │   │       ├── exercices.ts       # programmes d'entraînement (CRUD)
│   │   │       └── avis.ts            # notation cours, avis par membre/cours/coach
│   │   ├── build.mjs                  # Build esbuild (mysql2 externalisé)
│   │   └── package.json
│   │
│   └── elitegym/                      # Application mobile Expo
│       ├── app/
│       │   ├── (tabs)/
│       │   │   ├── index.tsx          # Planning semaine + réservations membre
│       │   │   └── profil.tsx         # Profil, paramètres, présences, progrès, paiements
│       │   ├── admin.tsx              # Interface admin (9 onglets)
│       │   ├── coach.tsx              # Interface coach (7 onglets)
│       │   └── login.tsx              # Écran de connexion
│       ├── components/
│       │   ├── EliteButton.tsx        # Bouton (primary/secondary/outline/danger, prop small)
│       │   └── EliteInput.tsx         # Champ de saisie stylisé
│       ├── context/
│       │   └── AuthContext.tsx        # useAuth() → { user, logout, updateUser }
│       ├── hooks/
│       │   └── useColors.ts           # useColors() → palette claire/sombre
│       └── lib/
│           └── api.ts                 # Wrapper fetch avec baseURL + token JWT auto
```

---

## Base de données MySQL

### Prérequis
- **WAMP Server** installé et démarré
- MySQL 8.x accessible sur `localhost:3306`
- Base de données créée : `elitegym_db`

### Schéma SQL complet

```sql
-- Créer et sélectionner la base
CREATE DATABASE IF NOT EXISTS elitegym_db
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE elitegym_db;

-- ── Utilisateurs (tous rôles) ──────────────────────────────────────────────
CREATE TABLE utilisateur (
  id_util       INT AUTO_INCREMENT PRIMARY KEY,
  nom           VARCHAR(50)  NOT NULL,
  prenom        VARCHAR(50)  NOT NULL,
  email         VARCHAR(100) UNIQUE,
  mot_de_passe  VARCHAR(255) NOT NULL,
  telephone     VARCHAR(20)  UNIQUE,
  role          ENUM('membre','coach','admin') DEFAULT 'membre',
  statut        TINYINT DEFAULT 1,          -- 1 = actif, 0 = désactivé
  last_login    DATETIME,
  date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ── Membres ────────────────────────────────────────────────────────────────
CREATE TABLE membre (
  id_membre        INT AUTO_INCREMENT PRIMARY KEY,
  id_util          INT NOT NULL UNIQUE,
  date_inscription DATE,
  FOREIGN KEY (id_util) REFERENCES utilisateur(id_util) ON DELETE CASCADE
);

-- ── Coachs ─────────────────────────────────────────────────────────────────
CREATE TABLE coach (
  id_coach      INT AUTO_INCREMENT PRIMARY KEY,
  id_util       INT NOT NULL UNIQUE,
  specialite    VARCHAR(100),
  date_embauche DATE,
  FOREIGN KEY (id_util) REFERENCES utilisateur(id_util) ON DELETE CASCADE
);

-- ── Formules d'abonnement ──────────────────────────────────────────────────
CREATE TABLE formule_abonnement (
  id_formule  INT AUTO_INCREMENT PRIMARY KEY,
  nom         VARCHAR(100)  NOT NULL,
  description TEXT,
  tarif       DECIMAL(10,2) NOT NULL,
  duree_jours INT           NOT NULL,
  actif       TINYINT DEFAULT 1
);

-- ── Abonnements ────────────────────────────────────────────────────────────
CREATE TABLE abonnement (
  id_abonnement INT AUTO_INCREMENT PRIMARY KEY,
  id_membre     INT NOT NULL,
  id_formule    INT NOT NULL,
  date_debut    DATE NOT NULL,
  date_fin      DATE NOT NULL,
  statut        ENUM('actif','expire','suspendu') DEFAULT 'actif',
  FOREIGN KEY (id_membre)  REFERENCES membre(id_membre),
  FOREIGN KEY (id_formule) REFERENCES formule_abonnement(id_formule)
);

-- ── Paiements ──────────────────────────────────────────────────────────────
CREATE TABLE paiement (
  id_paiement   INT AUTO_INCREMENT PRIMARY KEY,
  id_membre     INT NOT NULL,
  id_abonnement INT,
  montant       DECIMAL(10,2) NOT NULL,
  mode_paiement ENUM('espèces','CIB','BaridiMob','virement','chèque','carte') DEFAULT 'espèces',
  motif         VARCHAR(200),
  statut        ENUM('valide','en_attente','rembourse') DEFAULT 'valide',
  date_heure    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_membre)     REFERENCES membre(id_membre),
  FOREIGN KEY (id_abonnement) REFERENCES abonnement(id_abonnement)
);

-- ── Cours ──────────────────────────────────────────────────────────────────
CREATE TABLE cours (
  id_cours         INT AUTO_INCREMENT PRIMARY KEY,
  id_coach         INT NOT NULL,
  type_cours       VARCHAR(100) NOT NULL,
  date_cours       DATE         NOT NULL,
  heure_debut      TIME         NOT NULL,
  duree_minutes    INT  DEFAULT 60,
  salle            VARCHAR(50),
  capacite_max     INT  DEFAULT 20,
  places_restantes INT  DEFAULT 20,
  statut           ENUM('en_attente','publie','annule','termine') DEFAULT 'en_attente',
  FOREIGN KEY (id_coach) REFERENCES coach(id_coach)
);

-- ── Réservations ───────────────────────────────────────────────────────────
CREATE TABLE reservation (
  id_reservation   INT AUTO_INCREMENT PRIMARY KEY,
  id_membre        INT NOT NULL,
  id_cours         INT NOT NULL,
  statut           ENUM('confirmee','annulee','liste_attente') DEFAULT 'confirmee',
  date_reservation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_membre) REFERENCES membre(id_membre),
  FOREIGN KEY (id_cours)  REFERENCES cours(id_cours)
);

-- ── Suivi de performance ───────────────────────────────────────────────────
CREATE TABLE suivi_performance (
  id_suivi     INT AUTO_INCREMENT PRIMARY KEY,
  id_membre    INT NOT NULL,
  id_coach     INT NOT NULL,
  date_mesure  DATE NOT NULL,
  poids_kg     DECIMAL(5,2),
  imc          DECIMAL(5,2),
  tour_taille  DECIMAL(5,2),
  observations TEXT,
  FOREIGN KEY (id_membre) REFERENCES membre(id_membre),
  FOREIGN KEY (id_coach)  REFERENCES coach(id_coach)
);

-- ── Programmes d'entraînement ──────────────────────────────────────────────
CREATE TABLE programme_entrainement (
  id_programme  INT AUTO_INCREMENT PRIMARY KEY,
  id_coach      INT NOT NULL,
  id_membre     INT NOT NULL,
  titre         VARCHAR(200) NOT NULL,
  description   TEXT,
  date_creation DATE NOT NULL,
  FOREIGN KEY (id_coach)  REFERENCES coach(id_coach),
  FOREIGN KEY (id_membre) REFERENCES membre(id_membre)
);

-- ── Avis et notes (créée auto si absente) ─────────────────────────────────
CREATE TABLE avis (
  id_avis     INT AUTO_INCREMENT PRIMARY KEY,
  id_membre   INT NOT NULL,
  id_cours    INT NOT NULL,
  note        TINYINT NOT NULL,               -- 1 à 5
  commentaire TEXT,
  date_avis   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_membre) REFERENCES membre(id_membre) ON DELETE CASCADE,
  FOREIGN KEY (id_cours)  REFERENCES cours(id_cours)   ON DELETE CASCADE,
  UNIQUE KEY uq_avis (id_membre, id_cours)
);

-- ── Équipements (créée auto si absente) ───────────────────────────────────
CREATE TABLE equipement (
  id_equipement    INT AUTO_INCREMENT PRIMARY KEY,
  nom              VARCHAR(100) NOT NULL,
  categorie        VARCHAR(50)  DEFAULT 'Autre',
  etat             ENUM('bon','usure','maintenance','hors_service') DEFAULT 'bon',
  quantite         INT DEFAULT 1,
  date_acquisition DATE,
  notes            TEXT,
  date_maj         TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ── Journal d'audit ────────────────────────────────────────────────────────
CREATE TABLE journal_audit (
  id_journal        INT AUTO_INCREMENT PRIMARY KEY,
  id_util           INT NOT NULL,
  action            TEXT NOT NULL,
  table_affectee    VARCHAR(50),
  enregistrement_id INT,
  date_action       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_util) REFERENCES utilisateur(id_util)
);

-- ── Compte administrateur par défaut ──────────────────────────────────────
-- Mot de passe à hasher avec bcrypt avant insertion (voir section Installation)
INSERT INTO utilisateur (nom, prenom, email, mot_de_passe, telephone, role)
VALUES ('Admin', 'EliteGym', 'admin@elitegym.dz', 'REMPLACER_PAR_HASH', '0550000000', 'admin');
```

> **Générer le hash bcrypt du mot de passe admin :**
> ```bash
> node -e "const b=require('bcrypt'); b.hash('elitegym2026',12).then(console.log)"
> ```
> Puis remplacez `REMPLACER_PAR_HASH` par le résultat dans la requête INSERT.

---

## Installation et démarrage

### Prérequis
- Node.js >= 20 LTS
- pnpm >= 9 — `npm install -g pnpm`
- WAMP Server démarré avec MySQL 8.x
- Base `elitegym_db` créée et schéma importé

### 1. Cloner et installer les dépendances

```bash
git clone <url-du-repo>
cd elitegym-monorepo
pnpm install
```

### 2. Configurer les variables d'environnement

Créer `artifacts/api-server/.env` :

```env
DATABASE_URL=mysql://root:@localhost:3306/elitegym_db
SESSION_SECRET=elitegym_secret_tres_long_et_aleatoire_2026
PORT=8080
```

> Si votre MySQL WAMP a un mot de passe root, remplacez `root:@` par `root:VOTRE_MOT_DE_PASSE@`

Créer `artifacts/elitegym/.env` :

```env
# IP locale de votre PC sur le réseau (pas localhost !)
# Windows : ipconfig | Mac/Linux : ifconfig
EXPO_PUBLIC_DOMAIN=192.168.1.X:8080
```

> Votre téléphone et votre PC doivent être sur le **même réseau WiFi**.

### 3. Démarrer le backend

```bash
pnpm --filter @workspace/api-server run dev
```

L'API écoute sur `http://localhost:8080/api`  
Test : `http://localhost:8080/api/healthz` doit retourner `{"status":"ok"}`

### 4. Démarrer l'application mobile

```bash
pnpm --filter @workspace/elitegym run dev
```

Scannez le QR code avec **Expo Go** (iOS / Android).

---

## Variables d'environnement

| Variable | Description | Exemple |
|----------|-------------|---------|
| `DATABASE_URL` | URL de connexion MySQL | `mysql://root:@localhost:3306/elitegym_db` |
| `SESSION_SECRET` | Clé secrète JWT (min. 32 caractères) | `elitegym_secret_2026_bejaia` |
| `PORT` | Port d'écoute de l'API | `8080` |
| `DATABASE_SSL` | Activer SSL MySQL | `false` |
| `EXPO_PUBLIC_DOMAIN` | Adresse IP:port de l'API | `192.168.1.42:8080` |

---

## Routes API

Toutes les routes protégées nécessitent le header HTTP :
```
Authorization: Bearer <token_jwt>
```

### Authentification — `/api/auth`

| Méthode | Route | Auth | Description |
|---------|-------|:----:|-------------|
| POST | `/api/auth/login` | Non | Connexion (téléphone ou email + mot de passe) |
| POST | `/api/auth/change-password` | Oui | Modifier le mot de passe |
| POST | `/api/auth/change-phone` | Oui | Modifier le numéro de téléphone |
| POST | `/api/auth/change-email` | Oui | Modifier l'adresse email |
| GET | `/api/auth/profil/:id_util` | Oui | Profil complet d'un utilisateur |

### Cours — `/api/cours`

| Méthode | Route | Auth | Description |
|---------|-------|:----:|-------------|
| GET | `/api/cours` | Non | Tous les cours publiés |
| GET | `/api/cours/week` | Non | Cours de la semaine (aujourd'hui + 6 jours) |
| GET | `/api/cours/coach/:id_coach` | Oui | Cours d'un coach |
| POST | `/api/cours` | Oui | Soumettre un cours (statut initial : en_attente) |
| PUT | `/api/cours/:id/annuler` | Oui | Annuler un cours |

### Réservations — `/api/reservations`

| Méthode | Route | Auth | Description |
|---------|-------|:----:|-------------|
| GET | `/api/reservations/membre/:id_membre` | Oui | Réservations d'un membre |
| GET | `/api/reservations/presence/:id_membre` | Oui | Historique présences + stats + graphique |
| POST | `/api/reservations` | Oui | Réserver un cours |
| PUT | `/api/reservations/:id/annuler` | Oui | Annuler une réservation (délai 48h minimum) |

### Présences — `/api/presences`

| Méthode | Route | Auth | Description |
|---------|-------|:----:|-------------|
| GET | `/api/presences/cours/:id_cours` | Oui | Liste des membres inscrits au cours |
| POST | `/api/presences/marquer` | Oui | Marquer les présences d'un cours |
| GET | `/api/presences/membre/:id_membre` | Oui | Historique des paiements d'un membre |

### Abonnements — `/api/abonnements`

| Méthode | Route | Auth | Description |
|---------|-------|:----:|-------------|
| GET | `/api/abonnements/formules` | Non | Formules actives (publiques) |
| GET | `/api/abonnements/membre/:id_membre` | Oui | Abonnements d'un membre |
| POST | `/api/abonnements` | Oui | Souscrire à une formule |

### Coachs — `/api/coachs`

| Méthode | Route | Auth | Description |
|---------|-------|:----:|-------------|
| GET | `/api/coachs` | Non | Liste des coachs actifs |
| GET | `/api/coachs/:id/membres` | Oui | Membres inscrits aux cours d'un coach |

### Statistiques — `/api/stats`

| Méthode | Route | Auth | Description |
|---------|-------|:----:|-------------|
| GET | `/api/stats` | Non | Stats globales (membres, coachs, cours, abonnements) |

### Progrès — `/api/progress`

| Méthode | Route | Auth | Description |
|---------|-------|:----:|-------------|
| GET | `/api/progress/membre/:id_membre` | Oui | Suivi physique d'un membre |
| GET | `/api/progress/coach/:id_coach` | Oui | Suivis gérés par un coach |
| POST | `/api/progress` | Oui | Ajouter une mesure physique |

### Exercices / Programmes — `/api/exercices`

| Méthode | Route | Auth | Description |
|---------|-------|:----:|-------------|
| GET | `/api/exercices/membre/:id_membre` | Oui | Programmes d'un membre |
| GET | `/api/exercices/coach/:id_coach` | Oui | Programmes créés par un coach |
| POST | `/api/exercices` | Oui | Créer un programme d'entraînement |
| DELETE | `/api/exercices/:id` | Oui | Supprimer un programme |

### Avis — `/api/avis`

| Méthode | Route | Auth | Description |
|---------|-------|:----:|-------------|
| POST | `/api/avis` | Oui | Déposer ou mettre à jour un avis (upsert) |
| GET | `/api/avis/membre/:id_membre` | Oui | Avis déposés par un membre |
| GET | `/api/avis/cours/:id_cours` | Oui | Avis pour un cours |
| GET | `/api/avis/coach/:id_coach` | Oui | Avis + moyennes par cours d'un coach |
| GET | `/api/avis/admin` | Oui | Tous les avis (vue admin) |

### Administration — `/api/admin`

| Méthode | Route | Auth | Description |
|---------|-------|:----:|-------------|
| GET | `/api/admin/stats` | Oui | Tableau de bord complet avec revenus |
| GET | `/api/admin/membres` | Oui | Liste des membres actifs |
| POST | `/api/admin/membres` | Oui | Ajouter un membre |
| PUT | `/api/admin/membres/:id` | Oui | Modifier un membre |
| DELETE | `/api/admin/membres/:id` | Oui | Désactiver un membre (soft delete) |
| GET | `/api/admin/coachs` | Oui | Liste des coachs actifs |
| POST | `/api/admin/coachs` | Oui | Ajouter un coach |
| PUT | `/api/admin/coachs/:id` | Oui | Modifier un coach |
| DELETE | `/api/admin/coachs/:id` | Oui | Désactiver un coach (soft delete) |
| GET | `/api/admin/paiements` | Oui | 100 derniers paiements |
| POST | `/api/admin/paiements` | Oui | Enregistrer un paiement manuellement |
| GET | `/api/admin/formules` | Oui | Toutes les formules d'abonnement |
| POST | `/api/admin/formules` | Oui | Créer une formule |
| PUT | `/api/admin/formules/:id` | Oui | Modifier une formule |
| DELETE | `/api/admin/formules/:id` | Oui | Désactiver une formule |
| GET | `/api/admin/abonnements` | Oui | Tous les abonnements |
| POST | `/api/admin/abonnements` | Oui | Affecter un abonnement à un membre |
| PUT | `/api/admin/abonnements/:id` | Oui | Modifier le statut d'un abonnement |
| GET | `/api/admin/equipements` | Oui | Inventaire des équipements |
| POST | `/api/admin/equipements` | Oui | Ajouter un équipement |
| PUT | `/api/admin/equipements/:id` | Oui | Modifier un équipement |
| DELETE | `/api/admin/equipements/:id` | Oui | Supprimer un équipement |
| GET | `/api/admin/cours-en-attente` | Oui | Cours soumis en attente de validation |
| PUT | `/api/admin/cours/:id/approuver` | Oui | Approuver un cours (statut → publie) |
| PUT | `/api/admin/cours/:id/rejeter` | Oui | Rejeter un cours (statut → annule) |
| GET | `/api/admin/audit` | Oui | Journal d'audit (200 dernières actions) |
| POST | `/api/admin/backup` | Oui | Lancer une sauvegarde (journalisée) |

---

## Écrans mobiles

### Écran de connexion (`/login`)
- Connexion par téléphone ou email + mot de passe
- Redirection automatique selon le rôle : `/` (membre), `/coach`, `/admin`

### Interface Membre (`/(tabs)/`)

| Onglet | Contenu |
|--------|---------|
| Accueil | Cours de la semaine, bouton réserver par cours |
| Profil → Profil | Informations personnelles |
| Profil → Paramètres | Modifier mot de passe, téléphone, email |
| Profil → Présences | Historique des présences + graphique activité hebdomadaire (8 semaines) + stats |
| Profil → Progrès | Courbe poids, IMC, tour de taille dans le temps |
| Profil → Paiements | Historique chronologique des paiements |

### Interface Coach (`/coach`)

| Onglet | Contenu |
|--------|---------|
| Planning | Cours soumis avec statut coloré, formulaire ajout de cours |
| Présences | Sélection d'un cours → liste membres → marquer présents |
| Avis | Notes et commentaires reçus par cours, moyennes |
| Membres | Liste des membres inscrits à ses cours |
| Suivi | Tableau de suivi physique, ajout d'une mesure |
| Programmes | Programmes d'entraînement créés pour les membres |
| Paramètres | Modifier mot de passe, téléphone, email |

### Interface Admin (`/admin`)

| Onglet | Contenu |
|--------|---------|
| Dashboard | KPIs, graphique en barres revenus 6 mois |
| Membres | Liste complète, modal ajout/modification, désactivation |
| Coachs | Liste complète, modal ajout avec spécialité, modification |
| Planning | Cours en attente d'approbation, boutons Approuver / Rejeter |
| Paiements | 100 derniers paiements, enregistrement manuel |
| Abonnements | Liste abonnements, affectation formule + gestion des formules |
| Équipements | Inventaire avec indicateurs d'état colorés, CRUD complet |
| Audit | Journal chronologique des 200 dernières actions |
| Paramètres | Sauvegarde BDD journalisée, modifier identifiants admin |

---

## Sécurité

| Mesure | Détail |
|--------|--------|
| Hash des mots de passe | bcrypt, coût 12 |
| Tokens JWT | Signés avec `SESSION_SECRET`, durée 7 jours |
| Middleware auth | Vérifie le token sur toutes les routes protégées |
| Soft delete | Membres/coachs désactivés (`statut = 0`), données conservées |
| Délai annulation | Réservation annulable uniquement à 48h+ avant le cours |
| Validation avis | Un avis ne peut être déposé que pour un cours effectivement suivi |
| CORS | Configuré pour accepter les requêtes de l'application mobile |

---

## Problèmes fréquents

| Problème | Solution |
|----------|----------|
| `Cannot find package 'mysql2'` | `pnpm --filter @workspace/api-server add mysql2` |
| `Network request failed` sur mobile | Utilisez l'IP locale du PC dans `EXPO_PUBLIC_DOMAIN`, pas `localhost` |
| `Identifiants incorrects` | Vérifiez que le mot de passe est hashé avec bcrypt dans la BDD |
| `ECONNREFUSED` sur l'API | Vérifiez que WAMP est démarré et `DATABASE_URL` est correct |
| `Table doesn't exist` | Importez le schéma SQL complet dans phpMyAdmin |
| Cours non visibles | Vérifiez que le statut des cours est `publie` dans la table `cours` |

---

## Technologies

| Composant | Technologie |
|-----------|-------------|
| Frontend | React Native + Expo Router ~6.0 |
| Backend | Node.js 20 + Express 5 + TypeScript |
| Base de données | MySQL 8.x via WAMP Server |
| Driver BDD | mysql2 ^3.22.3 (pool) |
| Authentification | JWT (jsonwebtoken) + bcrypt |
| Monorepo | pnpm workspaces |
| Build API | esbuild (mysql2 externalisé) |

---

*EliteGym — Projet de Fin de Cycle (PFC) · Béjaïa, Algérie · 2026*
