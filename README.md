# EliteGym — Application de Gestion de Salle de Sport

Application mobile React Native (Expo) + API backend Node.js/Express + MySQL.  
Développée pour EliteGym, Béjaïa, Algérie.

---

## 📱 Fonctionnalités

### Membres
- Connexion par numéro de téléphone **OU** email (un seul suffit)
- Tableau de bord : cours de la semaine + réservations
- Planning : calendrier avec filtres par jour + réservations
- **Calculateur** : IMC, besoins caloriques, répartition PFC (Protéines/Glucides/Lipides)
- **Messagerie bidirectionnelle** : coach ↔ membre, admin ↔ membre
- **Progrès** : historique des mesures (poids, IMC, tour de taille)
- **Programmes d'entraînement** assignés par le coach
- Profil : modifier email / téléphone / mot de passe

### Coachs
- Tableau de bord dédié avec 4 onglets
- **Soumettre des cours** → approbation admin requise avant publication
- Voir le statut de ses cours (En attente / Approuvé / Refusé)
- **Suivi des membres** : enregistrer des mesures (poids, IMC, tour de taille)
- **Créer des programmes d'exercices** pour les membres
- Messagerie avec membres et admin

### Administrateurs
- Gestion des membres et coachs (ajout rapide)
- **Approbation du planning** soumis par les coachs (approuver / rejeter)
- Badge rouge sur l'onglet Planning si des cours attendent l'approbation
- Paiements et journal d'audit
- Messagerie avec tous les utilisateurs

---

## 🗄️ Base de données

### Prérequis
- MySQL 8.0+ (ou 9.x)
- phpMyAdmin ou MySQL Workbench

### Installation

**Étape 1** — Créez la base de données :
```sql
CREATE DATABASE elitegym CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

**Étape 2** — Importez le fichier SQL fourni dans phpMyAdmin (le fichier `elitegym.sql`)

**Étape 3 — IMPORTANT** — Appliquez cette migration pour le système d'approbation des cours :
```sql
ALTER TABLE cours
  MODIFY COLUMN statut ENUM('publie','annule','termine','en_attente')
  NOT NULL DEFAULT 'publie';
```

---

## ⚙️ Installation

### Prérequis
- Node.js 18+ (recommandé : 20 LTS)
- pnpm 9+ → `npm install -g pnpm`
- MySQL 8+
- Expo Go sur votre téléphone (App Store / Play Store)

### 1. Cloner le projet

```bash
git clone <url-du-repo>
cd elitegym-app
```

### 2. Installer les dépendances

```bash
pnpm install
```

### 3. Variables d'environnement

Créez `artifacts/api-server/.env` :

```env
# Base de données MySQL
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=votre_mot_de_passe_mysql
DB_NAME=elitegym

# JWT (changez cette clé !)
JWT_SECRET=elitegym_secret_tres_long_et_aleatoire_2026

# Port serveur
PORT=8080
```

Créez `artifacts/elitegym/.env` :

```env
# Adresse IP de votre PC sur le réseau local (pas localhost !)
# Trouvez-la avec : ipconfig (Windows) ou ifconfig (Mac/Linux)
EXPO_PUBLIC_DOMAIN=192.168.1.X:8080
```

> ⚠️ **Windows** : Utilisez l'IP locale de votre PC (ex: `192.168.1.42:8080`), pas `localhost`.  
> Votre téléphone et votre PC doivent être sur le **même réseau WiFi**.

### 4. Démarrer le backend

```bash
pnpm --filter @workspace/api-server run dev
```

Le serveur démarre sur `http://localhost:8080/api`  
Test : `http://localhost:8080/api/healthz` doit retourner `{"status":"ok"}`

### 5. Démarrer l'application mobile

```bash
pnpm --filter @workspace/elitegym run dev
```

Scanner le QR code avec **Expo Go** sur votre téléphone.

---

## 🔐 Comptes de test

| Rôle | Identifiant | Mot de passe |
|------|-------------|--------------|
| Administrateur | `admin@elitegym.dz` | `Admin@2026` |
| Membre | `+213600000000` ou `membre@test.dz` | `membre2026` |
| Coach Karim | `karim@elitegym.dz` | *(voir ci-dessous)* |

### Mot de passe par défaut pour les nouveaux comptes

Tout nouveau membre ou coach créé par l'admin a comme mot de passe :
```
elitegym2026
```
L'utilisateur doit le changer depuis **Profil → Paramètres**.

### Réinitialiser le mot de passe d'un coach (les coachs de test ont des hash factices)

```bash
# Générer un hash bcrypt
node -e "const b=require('bcrypt');b.hash('elitegym2026',12).then(console.log)"
```

Puis dans MySQL :
```sql
UPDATE utilisateur
SET mot_de_passe = 'HASH_GENERE_CI_DESSUS'
WHERE email = 'karim@elitegym.dz';
```

---

## 🏗️ Architecture du projet

```
elitegym-app/
├── artifacts/
│   ├── api-server/              # Backend Node.js / Express / TypeScript
│   │   └── src/
│   │       ├── lib/
│   │       │   ├── db.ts        # Pool de connexions MySQL
│   │       │   ├── auth.ts      # JWT middleware
│   │       │   └── ws.ts        # WebSocket (notifications temps réel)
│   │       └── routes/
│   │           ├── auth.ts      # Login, changement mdp/email/tel, profil public
│   │           ├── admin.ts     # Gestion membres/coachs, approbation cours
│   │           ├── cours.ts     # Planning des cours (soumission → en_attente)
│   │           ├── chat.ts      # Messagerie bidirectionnelle
│   │           ├── progress.ts  # Suivi des performances (poids, IMC...)
│   │           ├── exercices.ts # Programmes d'entraînement
│   │           ├── coachs.ts    # Profils et membres des coachs
│   │           ├── reservations.ts
│   │           ├── abonnements.ts
│   │           └── messages.ts  # Notifications système
│   └── elitegym/                # Application mobile Expo
│       ├── app/
│       │   ├── index.tsx        # Landing page publique
│       │   ├── login.tsx        # Page de connexion (email OU téléphone)
│       │   ├── admin.tsx        # Dashboard administrateur
│       │   ├── coach.tsx        # Dashboard coach
│       │   └── (tabs)/          # Onglets membre
│       │       ├── index.tsx        # Accueil
│       │       ├── planning.tsx     # Calendrier des cours + réservations
│       │       ├── calculateur.tsx  # IMC + calories + PFC
│       │       ├── messages.tsx     # Messagerie bidirectionnelle
│       │       ├── abonnements.tsx  # Abonnements
│       │       └── profil.tsx       # Profil + paramètres + progrès
│       ├── context/
│       │   └── AuthContext.tsx  # Session utilisateur (AsyncStorage)
│       ├── lib/
│       │   ├── api.ts           # Client HTTP (Bearer token auto)
│       │   └── notifications.tsx # WebSocket notifications
│       └── components/
│           ├── EliteButton.tsx
│           ├── EliteInput.tsx
│           └── CoursCard.tsx
```

---

## 🔌 Nouvelles routes API

| Méthode | Route | Description |
|---------|-------|-------------|
| `POST` | `/api/auth/login` | Connexion (email **OU** téléphone) → retourne `id_membre`/`id_coach` |
| `POST` | `/api/auth/change-password` | Changer mot de passe |
| `POST` | `/api/auth/change-email` | Changer email |
| `POST` | `/api/auth/change-phone` | Changer téléphone |
| `GET` | `/api/auth/profil/:id` | Profil public d'un utilisateur |
| `GET` | `/api/admin/cours-en-attente` | Cours soumis par les coachs |
| `PUT` | `/api/admin/cours/:id/approuver` | Approuver → statut 'publie' |
| `PUT` | `/api/admin/cours/:id/rejeter` | Rejeter → statut 'annule' |
| `GET` | `/api/admin/stats` | Statistiques dashboard |
| `GET` | `/api/chat/contacts/:id` | Contacts disponibles selon le rôle |
| `GET` | `/api/chat/:id_a/:id_b` | Historique conversation entre 2 utilisateurs |
| `POST` | `/api/chat` | Envoyer un message |
| `GET` | `/api/progress/membre/:id` | Mesures d'un membre |
| `GET` | `/api/progress/coach/:id` | Toutes les mesures d'un coach |
| `POST` | `/api/progress` | Enregistrer une mesure |
| `GET` | `/api/exercices/membre/:id` | Programmes d'un membre |
| `GET` | `/api/exercices/coach/:id` | Programmes créés par un coach |
| `POST` | `/api/exercices` | Créer un programme |
| `DELETE` | `/api/exercices/:id` | Supprimer un programme |

---

## 📊 Calculateur Nutrition (formules)

- **IMC** = poids(kg) / taille(m)²
  - < 18.5 : Insuffisance pondérale
  - 18.5 – 24.9 : Poids normal
  - 25 – 29.9 : Surpoids
  - ≥ 30 : Obésité

- **Métabolisme de base (Mifflin-St Jeor)** :
  - Homme : `10 × poids + 6.25 × taille(cm) - 5 × âge + 5`
  - Femme : `10 × poids + 6.25 × taille(cm) - 5 × âge - 161`

- **TDEE** = BMR × facteur activité (1.2 à 1.9)

- **Objectif** : TDEE × (0.80 perte / 1.00 maintien / 1.15 prise de masse)

- **Répartition PFC** :
  - Protéines : 30% → diviser par 4 kcal/g
  - Glucides : 45% → diviser par 4 kcal/g
  - Lipides : 25% → diviser par 9 kcal/g

---

## 🚀 Déploiement sur Windows

1. Installez [Node.js 20 LTS](https://nodejs.org/)
2. Installez pnpm : `npm install -g pnpm`
3. Installez [MySQL 8](https://dev.mysql.com/downloads/installer/) + phpMyAdmin
4. Importez `elitegym.sql` dans phpMyAdmin
5. Appliquez la migration SQL (ALTER TABLE cours...)
6. Créez les fichiers `.env` comme indiqué ci-dessus
7. Terminal 1 : `pnpm install && pnpm --filter @workspace/api-server run dev`
8. Terminal 2 : `pnpm --filter @workspace/elitegym run dev`
9. Scannez le QR code avec Expo Go

### Problèmes fréquents

| Problème | Solution |
|----------|----------|
| "Network request failed" | Vérifiez que `EXPO_PUBLIC_DOMAIN` contient l'IP locale, pas `localhost` |
| "Identifiants incorrects" | Réinitialisez les mots de passe des coachs (hash factices) |
| "Erreur serveur" au login | Vérifiez les variables `.env` de l'API |
| L'app ne voit pas les cours | Appliquez la migration SQL ALTER TABLE |
| Badge Planning admin = 0 | Normal, il s'affiche quand un coach soumet un cours |

---

## 🛠️ Technologies

| Composant | Technologie |
|-----------|-------------|
| Frontend | React Native + Expo Router 6 |
| Backend | Node.js 20 + Express 5 + TypeScript |
| Base de données | MySQL 8/9 via mysql2 |
| Authentification | JWT + bcrypt |
| Temps réel | WebSocket (ws) |
| Monorepo | pnpm workspaces |
