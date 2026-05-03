-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Hôte : 127.0.0.1:3306
-- Généré le : lun. 27 avr. 2026 à 08:50
-- Version du serveur : 9.1.0
-- Version de PHP : 8.3.14

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de données : `elitegym`
--

-- --------------------------------------------------------

--
-- Structure de la table `abonnement`
--

DROP TABLE IF EXISTS `abonnement`;
CREATE TABLE IF NOT EXISTS `abonnement` (
  `id_abonnement` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `id_membre` int UNSIGNED NOT NULL,
  `id_formule` int UNSIGNED NOT NULL,
  `date_debut` date NOT NULL,
  `date_fin` date NOT NULL,
  `statut` enum('actif','suspendu','expire','resilie') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'actif',
  `date_resil` date DEFAULT NULL,
  `motif_susp` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id_abonnement`),
  KEY `id_membre` (`id_membre`),
  KEY `id_formule` (`id_formule`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `coach`
--

DROP TABLE IF EXISTS `coach`;
CREATE TABLE IF NOT EXISTS `coach` (
  `id_coach` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `id_util` int UNSIGNED NOT NULL,
  `specialite` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `date_embauche` date NOT NULL,
  PRIMARY KEY (`id_coach`),
  UNIQUE KEY `id_util` (`id_util`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `coach`
--

INSERT INTO `coach` (`id_coach`, `id_util`, `specialite`, `date_embauche`) VALUES
(1, 4, 'Musculation & Force', '2023-01-15'),
(2, 5, 'CrossFit & HIIT', '2023-03-20'),
(3, 6, 'Yoga & Bien-être', '2023-02-10'),
(4, 7, 'Cardio & Zumba', '2023-04-05'),
(5, 8, 'Boxe & Arts Martiaux', '2023-05-12');

-- --------------------------------------------------------

--
-- Structure de la table `cours`
--

DROP TABLE IF EXISTS `cours`;
CREATE TABLE IF NOT EXISTS `cours` (
  `id_cours` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `id_coach` int UNSIGNED NOT NULL,
  `type_cours` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `date_cours` date NOT NULL,
  `heure_debut` time NOT NULL,
  `duree_minutes` int UNSIGNED NOT NULL DEFAULT '60',
  `salle` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `capacite_max` int UNSIGNED NOT NULL,
  `places_restantes` int UNSIGNED NOT NULL DEFAULT '0',
  `statut` enum('publie','annule','termine') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'publie',
  PRIMARY KEY (`id_cours`),
  KEY `id_coach` (`id_coach`)
) ENGINE=InnoDB AUTO_INCREMENT=35 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `cours`
--

INSERT INTO `cours` (`id_cours`, `id_coach`, `type_cours`, `date_cours`, `heure_debut`, `duree_minutes`, `salle`, `capacite_max`, `places_restantes`, `statut`) VALUES
(1, 1, 'Body Pump', '2026-04-28', '07:00:00', 45, 'Salle A', 20, 12, 'publie'),
(2, 3, 'Yoga Matinal', '2026-04-28', '09:30:00', 60, 'Salle B', 15, 8, 'publie'),
(3, 2, 'CrossFit Express', '2026-04-28', '12:00:00', 30, 'Zone CrossFit', 12, 0, 'publie'),
(4, 4, 'Spinning', '2026-04-28', '17:00:00', 45, 'Salle Cardio', 25, 18, 'publie'),
(5, 5, 'Boxe Cardio', '2026-04-28', '19:00:00', 45, 'Salle Combat', 18, 10, 'publie'),
(6, 3, 'Pilates', '2026-04-29', '07:00:00', 45, 'Salle B', 15, 9, 'publie'),
(7, 1, 'Musculation Guidée', '2026-04-29', '10:00:00', 60, 'Salle Force', 10, 4, 'publie'),
(8, 2, 'HIIT Intensif', '2026-04-29', '12:30:00', 30, 'Zone CrossFit', 15, 0, 'publie'),
(9, 4, 'Zumba Fun', '2026-04-29', '18:00:00', 45, 'Salle A', 30, 22, 'publie'),
(10, 3, 'Stretching Détente', '2026-04-29', '20:00:00', 30, 'Salle B', 20, 15, 'publie'),
(11, 2, 'CrossFit Advanced', '2026-04-30', '07:00:00', 60, 'Zone CrossFit', 12, 5, 'publie'),
(12, 3, 'Yoga Flow', '2026-04-30', '10:00:00', 60, 'Salle B', 15, 3, 'publie'),
(13, 5, 'Body Combat', '2026-04-30', '12:00:00', 45, 'Salle Combat', 20, 0, 'publie'),
(14, 4, 'Spinning Endurance', '2026-04-30', '17:00:00', 50, 'Salle Cardio', 25, 14, 'publie'),
(15, 1, 'Musculation Hypertrophie', '2026-04-30', '19:30:00', 60, 'Salle Force', 12, 8, 'publie'),
(16, 1, 'Body Pump Power', '2026-05-01', '07:30:00', 45, 'Salle A', 20, 11, 'publie'),
(17, 3, 'Pilates Core', '2026-05-01', '09:00:00', 45, 'Salle B', 15, 7, 'publie'),
(18, 2, 'HIIT Tabata', '2026-05-01', '12:00:00', 30, 'Zone CrossFit', 15, 2, 'publie'),
(19, 5, 'Boxe Technique', '2026-05-01', '17:30:00', 60, 'Salle Combat', 16, 9, 'publie'),
(20, 4, 'Zumba Latin', '2026-05-01', '19:00:00', 45, 'Salle A', 30, 20, 'publie'),
(21, 2, 'CrossFit Friday', '2026-05-02', '07:00:00', 60, 'Zone CrossFit', 12, 0, 'publie'),
(22, 3, 'Yoga Relax', '2026-05-02', '10:00:00', 60, 'Salle B', 15, 6, 'publie'),
(23, 4, 'Spinning Sprint', '2026-05-02', '12:30:00', 40, 'Salle Cardio', 25, 13, 'publie'),
(24, 5, 'Body Combat Intense', '2026-05-02', '17:00:00', 45, 'Salle Combat', 18, 5, 'publie'),
(25, 3, 'Stretching Récupération', '2026-05-02', '20:00:00', 30, 'Salle B', 20, 16, 'publie'),
(26, 2, 'CrossFit Weekend', '2026-05-03', '08:00:00', 60, 'Zone CrossFit', 15, 7, 'publie'),
(27, 4, 'Zumba Party', '2026-05-03', '10:00:00', 60, 'Salle A', 40, 28, 'publie'),
(28, 3, 'Yoga Détente', '2026-05-03', '11:30:00', 45, 'Salle B', 15, 10, 'publie'),
(29, 5, 'Boxing Club', '2026-05-03', '14:00:00', 60, 'Salle Combat', 16, 0, 'publie'),
(30, 1, 'Musculation Libre', '2026-05-03', '16:00:00', 90, 'Salle Force', 30, 22, 'publie'),
(31, 1, 'Body Pump', '2026-04-20', '07:00:00', 45, 'Salle A', 20, 12, 'publie'),
(32, 2, 'CrossFit Express', '2026-04-20', '12:00:00', 30, 'Zone CF', 15, 0, 'publie'),
(33, 1, 'Yoga Matinal', '2026-04-21', '09:30:00', 60, 'Salle B', 15, 8, 'publie'),
(34, 2, 'HIIT Intensif', '2026-04-22', '18:00:00', 45, 'Salle A', 20, 15, 'publie');

-- --------------------------------------------------------

--
-- Structure de la table `formule_abonnement`
--

DROP TABLE IF EXISTS `formule_abonnement`;
CREATE TABLE IF NOT EXISTS `formule_abonnement` (
  `id_formule` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `nom` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `duree_jours` int UNSIGNED NOT NULL,
  `tarif` decimal(10,2) NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `actif` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id_formule`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `formule_abonnement`
--

INSERT INTO `formule_abonnement` (`id_formule`, `nom`, `duree_jours`, `tarif`, `description`, `actif`) VALUES
(1, 'Mensuel', 30, 2500.00, 'Accès salle + 5 cours collectifs par mois', 1),
(2, 'Trimestriel', 90, 6500.00, 'Accès illimité + cours illimités + 2 séances coaching', 1),
(3, 'Annuel', 365, 22000.00, 'Accès illimité + tout inclus : coaching + nutrition', 1);

-- --------------------------------------------------------

--
-- Structure de la table `journal_audit`
--

DROP TABLE IF EXISTS `journal_audit`;
CREATE TABLE IF NOT EXISTS `journal_audit` (
  `id_journal` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `id_util` int UNSIGNED NOT NULL,
  `action` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `table_affectee` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `date_action` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `ip_adresse` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id_journal`),
  KEY `id_util` (`id_util`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `liste_attente`
--

DROP TABLE IF EXISTS `liste_attente`;
CREATE TABLE IF NOT EXISTS `liste_attente` (
  `id_attente` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `id_membre` int UNSIGNED NOT NULL,
  `id_cours` int UNSIGNED NOT NULL,
  `date_inscription` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `position` int UNSIGNED NOT NULL,
  PRIMARY KEY (`id_attente`),
  KEY `id_membre` (`id_membre`),
  KEY `id_cours` (`id_cours`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `membre`
--

DROP TABLE IF EXISTS `membre`;
CREATE TABLE IF NOT EXISTS `membre` (
  `id_membre` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `id_util` int UNSIGNED NOT NULL,
  `chemin_photo` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `date_inscription` date NOT NULL,
  PRIMARY KEY (`id_membre`),
  UNIQUE KEY `id_util` (`id_util`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `membre`
--

INSERT INTO `membre` (`id_membre`, `id_util`, `chemin_photo`, `date_inscription`) VALUES
(1, 3, NULL, '2026-04-24');

-- --------------------------------------------------------

--
-- Structure de la table `notification`
--

DROP TABLE IF EXISTS `notification`;
CREATE TABLE IF NOT EXISTS `notification` (
  `id_notification` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `id_util` int UNSIGNED NOT NULL,
  `type_notif` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `canal` enum('email','sms','app') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'email',
  `contenu` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `date_envoi` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `statut` enum('en_attente','envoye','echec') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'en_attente',
  PRIMARY KEY (`id_notification`),
  KEY `id_util` (`id_util`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `paiement`
--

DROP TABLE IF EXISTS `paiement`;
CREATE TABLE IF NOT EXISTS `paiement` (
  `id_paiement` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `id_membre` int UNSIGNED NOT NULL,
  `id_abonnement` int UNSIGNED DEFAULT NULL,
  `montant` decimal(10,2) NOT NULL,
  `date_heure` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `mode_paiement` enum('especes','carte','virement') COLLATE utf8mb4_unicode_ci NOT NULL,
  `motif` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `statut` enum('en_attente','valide','refuse') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'valide',
  `ref_recu` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id_paiement`),
  UNIQUE KEY `ref_recu` (`ref_recu`),
  KEY `id_membre` (`id_membre`),
  KEY `id_abonnement` (`id_abonnement`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `programme_entrainement`
--

DROP TABLE IF EXISTS `programme_entrainement`;
CREATE TABLE IF NOT EXISTS `programme_entrainement` (
  `id_programme` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `id_coach` int UNSIGNED NOT NULL,
  `id_membre` int UNSIGNED NOT NULL,
  `titre` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `date_creation` date NOT NULL DEFAULT (curdate()),
  PRIMARY KEY (`id_programme`),
  KEY `id_coach` (`id_coach`),
  KEY `id_membre` (`id_membre`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `reservation`
--

DROP TABLE IF EXISTS `reservation`;
CREATE TABLE IF NOT EXISTS `reservation` (
  `id_reservation` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `id_membre` int UNSIGNED NOT NULL,
  `id_cours` int UNSIGNED NOT NULL,
  `date_reservation` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `statut` enum('confirmee','annulee','liste_attente') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'confirmee',
  PRIMARY KEY (`id_reservation`),
  UNIQUE KEY `uq_res` (`id_membre`,`id_cours`),
  KEY `id_cours` (`id_cours`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `suivi_performance`
--

DROP TABLE IF EXISTS `suivi_performance`;
CREATE TABLE IF NOT EXISTS `suivi_performance` (
  `id_suivi` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `id_membre` int UNSIGNED NOT NULL,
  `id_coach` int UNSIGNED NOT NULL,
  `date_mesure` date NOT NULL,
  `poids_kg` decimal(5,2) DEFAULT NULL,
  `imc` decimal(5,2) DEFAULT NULL,
  `tour_taille` decimal(5,2) DEFAULT NULL,
  `observations` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id_suivi`),
  KEY `id_membre` (`id_membre`),
  KEY `id_coach` (`id_coach`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `utilisateur`
--

DROP TABLE IF EXISTS `utilisateur`;
CREATE TABLE IF NOT EXISTS `utilisateur` (
  `id_util` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `nom` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `prenom` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `mot_de_passe` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `telephone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `date_naissance` date DEFAULT NULL,
  `role` enum('administrateur','gerant','receptionniste','coach','membre') COLLATE utf8mb4_unicode_ci NOT NULL,
  `statut` tinyint(1) NOT NULL DEFAULT '1',
  `date_creation` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `last_login` datetime DEFAULT NULL,
  `reset_token` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reset_expires` datetime DEFAULT NULL,
  PRIMARY KEY (`id_util`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `telephone` (`telephone`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `utilisateur`
--

INSERT INTO `utilisateur` (`id_util`, `nom`, `prenom`, `email`, `mot_de_passe`, `telephone`, `date_naissance`, `role`, `statut`, `date_creation`, `last_login`, `reset_token`, `reset_expires`) VALUES
(1, 'Admin', 'Système', 'admin@elitegym.dz', '$2b$12$5CKVh9OUBA7Y2lDGu1Ku.O2ucw4fTaBiugAY5w1nTydPMgrzaczOa', NULL, NULL, 'administrateur', 1, '2026-04-19 13:24:46', NULL, NULL, NULL),
(3, 'Test', 'Membre', 'membre@test.dz', '$2b$12$cdbJxUnyByDUEkijQJ1eK.2./3AB/Irn2CuvxCQhQJvMLRyE8pCga', '+213600000000', NULL, 'membre', 1, '2026-04-24 18:19:12', '2026-04-26 11:36:44', NULL, NULL),
(4, 'Benali', 'Karim', 'karim@elitegym.dz', '$2b$12$dummyhashfortestingonly123456789012345678901234567890', '+213555111222', NULL, 'coach', 1, '2026-04-24 19:14:27', NULL, NULL, NULL),
(5, 'Amrani', 'Youcef', 'youcef@elitegym.dz', '$2b$12$dummyhashfortestingonly123456789012345678901234567890', '+213555333444', NULL, 'coach', 1, '2026-04-24 19:14:27', NULL, NULL, NULL),
(6, 'Mansouri', 'Samia', 'samia@elitegym.dz', '$2b$12$dummyhashfortestingonly123456789012345678901234567890', '+213555555666', NULL, 'coach', 1, '2026-04-24 19:14:27', NULL, NULL, NULL),
(7, 'Rahmani', 'Nadia', 'nadia@elitegym.dz', '$2b$12$dummyhashfortestingonly123456789012345678901234567890', '+213555777888', NULL, 'coach', 1, '2026-04-24 19:14:27', NULL, NULL, NULL),
(8, 'Djerbi', 'Amine', 'amine@elitegym.dz', '$2b$12$dummyhashfortestingonly123456789012345678901234567890', '+213555999000', NULL, 'coach', 1, '2026-04-24 19:14:27', NULL, NULL, NULL);

--
-- Contraintes pour les tables déchargées
--

--
-- Contraintes pour la table `abonnement`
--
ALTER TABLE `abonnement`
  ADD CONSTRAINT `abonnement_ibfk_1` FOREIGN KEY (`id_membre`) REFERENCES `membre` (`id_membre`),
  ADD CONSTRAINT `abonnement_ibfk_2` FOREIGN KEY (`id_formule`) REFERENCES `formule_abonnement` (`id_formule`);

--
-- Contraintes pour la table `coach`
--
ALTER TABLE `coach`
  ADD CONSTRAINT `coach_ibfk_1` FOREIGN KEY (`id_util`) REFERENCES `utilisateur` (`id_util`) ON DELETE CASCADE;

--
-- Contraintes pour la table `cours`
--
ALTER TABLE `cours`
  ADD CONSTRAINT `cours_ibfk_1` FOREIGN KEY (`id_coach`) REFERENCES `coach` (`id_coach`);

--
-- Contraintes pour la table `journal_audit`
--
ALTER TABLE `journal_audit`
  ADD CONSTRAINT `journal_audit_ibfk_1` FOREIGN KEY (`id_util`) REFERENCES `utilisateur` (`id_util`);

--
-- Contraintes pour la table `liste_attente`
--
ALTER TABLE `liste_attente`
  ADD CONSTRAINT `liste_attente_ibfk_1` FOREIGN KEY (`id_membre`) REFERENCES `membre` (`id_membre`),
  ADD CONSTRAINT `liste_attente_ibfk_2` FOREIGN KEY (`id_cours`) REFERENCES `cours` (`id_cours`);

--
-- Contraintes pour la table `membre`
--
ALTER TABLE `membre`
  ADD CONSTRAINT `membre_ibfk_1` FOREIGN KEY (`id_util`) REFERENCES `utilisateur` (`id_util`) ON DELETE CASCADE;

--
-- Contraintes pour la table `notification`
--
ALTER TABLE `notification`
  ADD CONSTRAINT `notification_ibfk_1` FOREIGN KEY (`id_util`) REFERENCES `utilisateur` (`id_util`);

--
-- Contraintes pour la table `paiement`
--
ALTER TABLE `paiement`
  ADD CONSTRAINT `paiement_ibfk_1` FOREIGN KEY (`id_membre`) REFERENCES `membre` (`id_membre`),
  ADD CONSTRAINT `paiement_ibfk_2` FOREIGN KEY (`id_abonnement`) REFERENCES `abonnement` (`id_abonnement`);

--
-- Contraintes pour la table `programme_entrainement`
--
ALTER TABLE `programme_entrainement`
  ADD CONSTRAINT `programme_entrainement_ibfk_1` FOREIGN KEY (`id_coach`) REFERENCES `coach` (`id_coach`),
  ADD CONSTRAINT `programme_entrainement_ibfk_2` FOREIGN KEY (`id_membre`) REFERENCES `membre` (`id_membre`);

--
-- Contraintes pour la table `reservation`
--
ALTER TABLE `reservation`
  ADD CONSTRAINT `reservation_ibfk_1` FOREIGN KEY (`id_membre`) REFERENCES `membre` (`id_membre`),
  ADD CONSTRAINT `reservation_ibfk_2` FOREIGN KEY (`id_cours`) REFERENCES `cours` (`id_cours`);

--
-- Contraintes pour la table `suivi_performance`
--
ALTER TABLE `suivi_performance`
  ADD CONSTRAINT `suivi_performance_ibfk_1` FOREIGN KEY (`id_membre`) REFERENCES `membre` (`id_membre`),
  ADD CONSTRAINT `suivi_performance_ibfk_2` FOREIGN KEY (`id_coach`) REFERENCES `coach` (`id_coach`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
