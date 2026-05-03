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

## Installation rapide

### API
```bash
pnpm --filter @workspace/api-server run dev
```

### Mobile
```bash
pnpm --filter @workspace/elitegym run dev
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

## Base de données

- MySQL
- WAMP Server
- Mot de passe par défaut des nouveaux comptes : `elitegym2026`

---

## Notes

- Le backend écoute sur le port `8080`.
- L’app mobile utilise `EXPO_PUBLIC_API_URL`.
- Si l’ami lance son app chez lui, il change seulement cette valeur dans le fichier `.env`.
