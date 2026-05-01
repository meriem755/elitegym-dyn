# Workspace — EliteGym

## Overview

Application de gestion de salle de sport EliteGym — React Native (Expo) pour web + mobile, avec backend Express + MySQL.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React Native (Expo), Expo Router, TanStack Query
- **Backend**: Express 5, TypeScript, mysql2, bcrypt, jsonwebtoken
- **Database**: MySQL (schéma dans `attached_assets/elitegym_1777650946184.sql`)
- **Auth**: JWT (connexion par numéro de téléphone + mot de passe)
- **Build**: esbuild (CJS bundle)

## Artifacts

- `artifacts/api-server` — Backend REST API (port 8080, chemin `/api`)
- `artifacts/elitegym` — Application Expo (React Native web + mobile)

## Key Commands

- `pnpm --filter @workspace/api-server run dev` — démarrer le backend
- `pnpm --filter @workspace/elitegym run dev` — démarrer le frontend Expo

## Variables d'environnement requises (backend)

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=...
DB_NAME=elitegym
JWT_SECRET=...
PORT=8080
```

## Rôles utilisateurs

- **membre** : accueil, planning, réservations, abonnements, IMC, messagerie, paramètres
- **coach** : planning de ses cours, liste membres, planifier un cours, messages
- **administrateur/gerant** : gestion membres/coachs, paiements, audit, planning

## Voir README.md pour l'architecture complète et les instructions d'installation
