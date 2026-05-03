# EliteGym — Application de Gestion de Salle de Sport

Application mobile complète pour la salle **EliteGym** de Béjaïa, Algérie.  
Stack : **Expo / React Native** · **Node.js / Express** · **MySQL via WAMP Server**.

---

## Configuration simple

Tu n’as plus besoin de changer l’IP dans le code.

Il suffit de créer **un seul fichier** dans `artifacts/elitegym/.env` :

```env
EXPO_PUBLIC_API_URL=http://192.168.1.42:8080/api
```

- En local Replit, le projet utilise une valeur par défaut.
- Sur le téléphone d’un ami, il suffit de mettre l’IP de son PC une seule fois dans ce fichier.
- Le code mobile lit cette variable automatiquement pour l’API et le WebSocket.

---

## Ce que tu dois écrire dans les `.env`

### `artifacts/api-server/.env`
```env
DATABASE_URL=mysql://root:@localhost:3306/elitegym_db
SESSION_SECRET=elitegym_secret_tres_long_et_aleatoire_2026
PORT=8080
```

### `artifacts/elitegym/.env`
```env
EXPO_PUBLIC_API_URL=http://192.168.1.42:8080/api
```

> Si MySQL WAMP a un mot de passe root, remplace `root:@` par `root:TON_MOT_DE_PASSE@`.

---

## Architecture du projet

### Backend
- Node.js + Express
- Authentification JWT
- MySQL via `mysql2`
- Routes : auth, admin, cours, réservations, présences, abonnements, coachs, progrès, exercices, avis, stats

### Mobile
- Expo Router
- React Native
- Context pour la session utilisateur
- Un seul point de config : `EXPO_PUBLIC_API_URL`

### Base de données
- MySQL sur WAMP Server
- Tables principales : utilisateur, membre, coach, cours, réservation, paiement, abonnement, formule_abonnement, suivi_performance, programme_entrainement, avis, equipement, journal_audit

### Structure des dossiers
```text
artifacts/
├── api-server/
│   ├── src/
│   │   ├── lib/
│   │   │   ├── db.ts
│   │   │   ├── auth.ts
│   │   │   └── logger.ts
│   │   └── routes/
│   │       ├── auth.ts
│   │       ├── admin.ts
│   │       ├── cours.ts
│   │       ├── reservations.ts
│   │       ├── presences.ts
│   │       ├── abonnements.ts
│   │       ├── coachs.ts
│   │       ├── progress.ts
│   │       ├── exercices.ts
│   │       ├── avis.ts
│   │       └── stats.ts
│   └── build.mjs
└── elitegym/
    ├── app/
    │   ├── admin.tsx
    │   ├── coach.tsx
    │   ├── login.tsx
    │   └── (tabs)/profil.tsx
    ├── lib/
    │   ├── api.ts
    │   ├── config.ts
    │   └── notifications.tsx
    └── components/
```

---

## Fonctionnalités

### Membre
- Connexion par téléphone ou email
- Réservation de cours
- Historique des paiements
- Historique des présences
- Suivi de progression
- Avis sur les cours
- Paramètres du profil

### Coach
- Création de cours
- Gestion des présences
- Suivi des membres
- Programmes d’entraînement
- Avis reçus
- Paramètres

### Admin
- Gestion membres
- Gestion coachs
- Validation des cours
- Paiements
- Formules d’abonnement
- Équipements
- Audit
- Sauvegarde
- Paramètres

---

## Installation et configuration

### 1. Base de données
- Installer WAMP Server
- Démarrer MySQL
- Créer la base `elitegym_db`
- Importer le schéma SQL

### 2. Configurer l’API
Créer `artifacts/api-server/.env` avec :
```env
DATABASE_URL=mysql://root:@localhost:3306/elitegym_db
SESSION_SECRET=elitegym_secret_tres_long_et_aleatoire_2026
PORT=8080
```

### 3. Configurer le mobile
Créer `artifacts/elitegym/.env` avec :
```env
EXPO_PUBLIC_API_URL=http://192.168.1.42:8080/api
```

### 4. Lancer l’API
```bash
pnpm --filter @workspace/api-server run dev
```

### 5. Lancer le mobile
```bash
pnpm --filter @workspace/elitegym run dev
```

---

## Comment ça fonctionne

- Le mobile lit `EXPO_PUBLIC_API_URL`
- L’API appelle MySQL via `DATABASE_URL`
- Les amis changent seulement la valeur de `EXPO_PUBLIC_API_URL` dans leur fichier `.env`
- Aucun changement dans le code n’est nécessaire

---

## Base de données

- MySQL
- WAMP Server
- Mot de passe par défaut des nouveaux comptes : `elitegym2026`

---

## Notes

- Le backend écoute sur le port `8080`.
- L’app mobile utilise `EXPO_PUBLIC_API_URL`.
- Si l’ami lance son app chez lui, il change seulement cette valeur dans le fichier `.env`.
