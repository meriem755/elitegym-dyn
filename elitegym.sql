-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Hôte : 127.0.0.1:3306
-- Généré le : mar. 05 mai 2026 à 21:15
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
  `statut` enum('actif','expiré','resilié','en_attente') COLLATE utf8mb4_unicode_ci DEFAULT 'actif',
  `date_resil` date DEFAULT NULL,
  `motif_susp` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id_abonnement`),
  KEY `id_membre` (`id_membre`),
  KEY `id_formule` (`id_formule`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `abonnement`
--

INSERT INTO `abonnement` (`id_abonnement`, `id_membre`, `id_formule`, `date_debut`, `date_fin`, `statut`, `date_resil`, `motif_susp`) VALUES
(1, 1, 1, '2026-04-01', '2026-05-01', 'actif', NULL, NULL),
(2, 1, 2, '2026-02-01', '2026-05-01', 'actif', NULL, NULL),
(3, 2, 1, '2026-04-15', '2026-05-15', 'actif', NULL, NULL),
(4, 3, 3, '2026-01-01', '2027-01-01', 'actif', NULL, NULL),
(5, 4, 2, '2026-03-01', '2026-05-30', 'actif', NULL, NULL),
(6, 5, 1, '2026-04-20', '2026-05-20', 'actif', NULL, NULL),
(7, 6, 2, '2026-02-15', '2026-05-15', 'actif', NULL, NULL),
(8, 7, 1, '2026-04-10', '2026-05-10', 'actif', NULL, NULL),
(9, 8, 3, '2026-03-01', '2027-03-01', 'actif', NULL, NULL),
(10, 9, 1, '2026-04-25', '2026-05-25', 'actif', NULL, NULL),
(11, 10, 2, '2026-01-20', '2026-04-20', 'expiré', NULL, NULL),
(12, 10, 1, '2026-04-21', '2026-05-21', 'actif', NULL, NULL),
(13, 13, 1, '2026-05-04', '2026-06-03', 'actif', NULL, NULL);

-- --------------------------------------------------------

--
-- Structure de la table `avis`
--

DROP TABLE IF EXISTS `avis`;
CREATE TABLE IF NOT EXISTS `avis` (
  `id_avis` int NOT NULL AUTO_INCREMENT,
  `id_membre` int NOT NULL,
  `id_cours` int NOT NULL,
  `note` tinyint NOT NULL,
  `commentaire` text COLLATE utf8mb4_unicode_ci,
  `date_avis` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_avis`),
  UNIQUE KEY `uq_avis` (`id_membre`,`id_cours`),
  KEY `id_cours` (`id_cours`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
  `statut` enum('publie','annule','termine','en_attente') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'publie',
  PRIMARY KEY (`id_cours`),
  KEY `id_coach` (`id_coach`)
) ENGINE=InnoDB AUTO_INCREMENT=36 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
(34, 2, 'HIIT Intensif', '2026-04-22', '18:00:00', 45, 'Salle A', 20, 15, 'publie'),
(35, 2, 'Body pump', '2026-05-08', '09:00:00', 60, 'salle a', 20, 20, 'en_attente');

-- --------------------------------------------------------

--
-- Structure de la table `equipement`
--

DROP TABLE IF EXISTS `equipement`;
CREATE TABLE IF NOT EXISTS `equipement` (
  `id_equipement` int NOT NULL AUTO_INCREMENT,
  `nom` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `categorie` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'Autre',
  `etat` enum('bon','usure','maintenance','hors_service') COLLATE utf8mb4_unicode_ci DEFAULT 'bon',
  `quantite` int DEFAULT '1',
  `date_acquisition` date DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `date_maj` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_equipement`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `exercice`
--

DROP TABLE IF EXISTS `exercice`;
CREATE TABLE IF NOT EXISTS `exercice` (
  `id_exercice` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `nom` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `categorie` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'Autre',
  `niveau` enum('debutant','intermediaire','avance') COLLATE utf8mb4_unicode_ci DEFAULT 'debutant',
  `image_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `video_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `duree_secondes` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_exercice`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `journal_audit`
--

INSERT INTO `journal_audit` (`id_journal`, `id_util`, `action`, `table_affectee`, `date_action`, `ip_adresse`) VALUES
(1, 1, 'Connexion administrateur', 'utilisateur', '2026-05-03 19:48:13', '192.168.1.100'),
(2, 1, 'Création membre', 'membre', '2026-05-03 19:48:13', '192.168.1.100'),
(3, 1, 'Modification abonnement', 'abonnement', '2026-05-03 19:48:13', '192.168.1.100'),
(4, 1, 'Suppression cours', 'cours', '2026-05-03 19:48:13', '192.168.1.100'),
(5, 4, 'Création cours', 'cours', '2026-05-03 19:48:13', '192.168.1.105'),
(6, 4, 'Marquage présence', 'reservation', '2026-05-03 19:48:13', '192.168.1.105'),
(7, 5, 'Modification programme', 'programme_entrainement', '2026-05-03 19:48:13', '192.168.1.106'),
(8, 5, 'Ajout suivi performance', 'suivi_performance', '2026-05-03 19:48:13', '192.168.1.106'),
(9, 3, 'Réservation cours', 'reservation', '2026-05-03 19:48:13', '192.168.1.150'),
(10, 3, 'Paiement abonnement', 'paiement', '2026-05-03 19:48:13', '192.168.1.150'),
(11, 11, 'Inscription membre', 'membre', '2026-05-03 19:48:13', '192.168.1.151'),
(12, 11, 'Première réservation', 'reservation', '2026-05-03 19:48:13', '192.168.1.151'),
(13, 1, 'Sauvegarde système', 'système', '2026-05-03 19:48:13', '192.168.1.100'),
(14, 1, 'Export rapports', 'paiement', '2026-05-03 19:48:13', '192.168.1.100'),
(15, 1, 'Consultation journal audit', 'journal_audit', '2026-05-03 19:48:13', '192.168.1.100'),
(16, 1, 'Sauvegarde système effectuée le 2026-05-04T10:17:03.420Z', 'systeme', '2026-05-04 11:17:03', NULL);

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
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `liste_attente`
--

INSERT INTO `liste_attente` (`id_attente`, `id_membre`, `id_cours`, `date_inscription`, `position`) VALUES
(1, 7, 3, '2026-05-03 19:48:13', 1),
(2, 8, 3, '2026-05-03 19:48:13', 2),
(3, 9, 3, '2026-05-03 19:48:13', 3),
(4, 1, 8, '2026-05-03 19:48:13', 1),
(5, 2, 8, '2026-05-03 19:48:13', 2),
(6, 5, 13, '2026-05-03 19:48:13', 1),
(7, 6, 13, '2026-05-03 19:48:13', 2),
(8, 7, 13, '2026-05-03 19:48:13', 3),
(9, 10, 21, '2026-05-03 19:48:13', 1),
(10, 1, 29, '2026-05-03 19:48:13', 1),
(11, 2, 29, '2026-05-03 19:48:13', 2);

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
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `membre`
--

INSERT INTO `membre` (`id_membre`, `id_util`, `chemin_photo`, `date_inscription`) VALUES
(1, 3, NULL, '2026-04-24'),
(2, 10, NULL, '2026-05-02'),
(3, 11, NULL, '2026-01-15'),
(4, 12, NULL, '2026-02-01'),
(5, 13, NULL, '2026-02-10'),
(6, 14, NULL, '2026-02-20'),
(7, 15, NULL, '2026-03-01'),
(8, 16, NULL, '2026-03-05'),
(9, 17, NULL, '2026-03-15'),
(10, 18, NULL, '2026-03-20'),
(11, 19, NULL, '2026-04-01'),
(12, 20, NULL, '2026-04-10'),
(13, 21, NULL, '2026-05-03');

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
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `notification`
--

INSERT INTO `notification` (`id_notification`, `id_util`, `type_notif`, `canal`, `contenu`, `date_envoi`, `statut`) VALUES
(1, 3, 'abonnement_expiration', 'email', 'Votre abonnement arrive à expiration dans 7 jours. Pensez à le renouveler !', '2026-05-03 19:48:13', 'envoye'),
(2, 3, 'reservation_confirmation', 'email', 'Votre réservation pour le cours Body Pump du 28/04 à 07:00 a été confirmée.', '2026-05-03 19:48:13', 'envoye'),
(3, 11, 'bienvenue', 'email', 'Bienvenue chez EliteGym ! Votre compte a été créé avec succès.', '2026-05-03 19:48:13', 'envoye'),
(4, 11, 'cours_annule', 'app', 'Le cours CrossFit Express du 28/04 a été annulé. Nous vous proposons un créneau alternatif.', '2026-05-03 19:48:13', 'envoye'),
(5, 12, 'paiement_valide', 'email', 'Votre paiement de 2500 DA a été enregistré. Reçu: REC-2026-003', '2026-05-03 19:48:13', 'envoye'),
(6, 13, 'nouveau_cours', 'app', 'Nouveau cours disponible: Yoga Flow le 30/04 à 10:00 avec Samia.', '2026-05-03 19:48:13', 'envoye'),
(7, 14, 'promotion', 'email', 'Offre spéciale: -20% sur l\'abonnement annuel ce mois-ci !', '2026-05-03 19:48:13', 'envoye'),
(8, 15, 'reservation_rappel', 'sms', 'Rappel: Votre cours Boxe Cardio commence dans 2h (19:00).', '2026-05-03 19:48:13', 'envoye'),
(9, 16, 'abonnement_actif', 'email', 'Votre abonnement trimestriel est maintenant actif. Profitez bien !', '2026-05-03 19:48:13', 'envoye'),
(10, 17, 'coach_message', 'app', 'Message de votre coach Karim: Bravo pour vos progrès cette semaine !', '2026-05-03 19:48:13', 'envoye');

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
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `paiement`
--

INSERT INTO `paiement` (`id_paiement`, `id_membre`, `id_abonnement`, `montant`, `date_heure`, `mode_paiement`, `motif`, `statut`, `ref_recu`) VALUES
(1, 1, 1, 2500.00, '2026-05-03 19:48:13', 'carte', 'Abonnement Mensuel', 'valide', 'REC-2026-001'),
(2, 1, 2, 6500.00, '2026-05-03 19:48:13', 'virement', 'Abonnement Trimestriel', 'valide', 'REC-2026-002'),
(3, 2, 3, 2500.00, '2026-05-03 19:48:13', 'especes', 'Abonnement Mensuel', 'valide', 'REC-2026-003'),
(4, 3, 4, 22000.00, '2026-05-03 19:48:13', 'carte', 'Abonnement Annuel', 'valide', 'REC-2026-004'),
(5, 4, 5, 6500.00, '2026-05-03 19:48:13', 'virement', 'Abonnement Trimestriel', 'valide', 'REC-2026-005'),
(6, 5, 6, 2500.00, '2026-05-03 19:48:13', 'especes', 'Abonnement Mensuel', 'valide', 'REC-2026-006'),
(7, 6, 7, 6500.00, '2026-05-03 19:48:13', 'carte', 'Abonnement Trimestriel', 'valide', 'REC-2026-007'),
(8, 7, 8, 2500.00, '2026-05-03 19:48:13', 'especes', 'Abonnement Mensuel', 'valide', 'REC-2026-008'),
(9, 8, 9, 22000.00, '2026-05-03 19:48:13', 'virement', 'Abonnement Annuel', 'valide', 'REC-2026-009'),
(10, 9, 10, 2500.00, '2026-05-03 19:48:13', 'carte', 'Abonnement Mensuel', 'valide', 'REC-2026-010'),
(11, 10, 11, 6500.00, '2026-05-03 19:48:13', 'especes', 'Abonnement Trimestriel', 'valide', 'REC-2026-011'),
(12, 10, 12, 2500.00, '2026-05-03 19:48:13', 'carte', 'Abonnement Mensuel', 'valide', 'REC-2026-012'),
(13, 13, 13, 2500.00, '2026-05-04 19:26:39', 'especes', 'Abonnement admin', 'valide', NULL),
(14, 2, NULL, 3000.00, '2026-05-05 22:03:38', '', 'Abonnement', 'valide', NULL);

-- --------------------------------------------------------

--
-- Structure de la table `presence`
--

DROP TABLE IF EXISTS `presence`;
CREATE TABLE IF NOT EXISTS `presence` (
  `id_presence` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `id_reservation` int UNSIGNED NOT NULL,
  `date_arrivee` datetime DEFAULT CURRENT_TIMESTAMP,
  `statut` enum('present','absent','retard') COLLATE utf8mb4_unicode_ci DEFAULT 'present',
  PRIMARY KEY (`id_presence`),
  KEY `id_reservation` (`id_reservation`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `programme_entrainement`
--

INSERT INTO `programme_entrainement` (`id_programme`, `id_coach`, `id_membre`, `titre`, `description`, `date_creation`) VALUES
(1, 1, 1, 'Perte de poids & Tonification', 'Programme de 12 semaines combinant cardio et renforcement musculaire. 3 séances/semaine.', '2026-05-03'),
(2, 1, 5, 'Prise de masse musculaire', 'Programme hypertrophie 4 séances/semaine. Focus pecs, dos, jambes.', '2026-05-03'),
(3, 2, 3, 'CrossFit Débutant', 'Initiation CrossFit sur 8 semaines. Techniques de base + WOD progressifs.', '2026-05-03'),
(4, 2, 8, 'HIIT & Endurance', 'Programme intensif 3x/semaine. Amélioration VO2 max et perte de gras.', '2026-05-03'),
(5, 3, 2, 'Yoga & Flexibilité', 'Programme complet yoga Hatha et Vinyasa. 2 séances/semaine + stretching.', '2026-05-03'),
(6, 3, 7, 'Pilates Core Strength', 'Renforcement musculaire profond. Focus abdominaux et posture.', '2026-05-03'),
(7, 4, 6, 'Zumba Fitness', 'Cours de danse latino pour cardio et coordination. Ambiance festive !', '2026-05-03'),
(8, 4, 9, 'Spinning & Cardio', 'Programme vélo indoor. Endurance fondamentale et intervals.', '2026-05-03'),
(9, 5, 4, 'Boxe Anglaise - Niveau 1', 'Apprentissage techniques de base: jab, cross, crochet, uppercut.', '2026-05-03'),
(10, 5, 10, 'Body Combat', 'Arts martiaux fitness. Combinaison boxe, kickboxing, tai-chi.', '2026-05-03');

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
  `present` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`id_reservation`),
  UNIQUE KEY `uq_res` (`id_membre`,`id_cours`),
  KEY `id_cours` (`id_cours`)
) ENGINE=InnoDB AUTO_INCREMENT=35 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `reservation`
--

INSERT INTO `reservation` (`id_reservation`, `id_membre`, `id_cours`, `date_reservation`, `statut`, `present`) VALUES
(1, 1, 26, '2026-05-03 10:19:00', 'annulee', NULL),
(2, 1, 27, '2026-05-03 18:41:59', 'annulee', NULL),
(3, 1, 28, '2026-05-03 18:42:11', 'annulee', NULL),
(4, 1, 30, '2026-05-03 18:42:20', 'annulee', NULL),
(5, 1, 1, '2026-05-03 19:48:13', 'confirmee', NULL),
(6, 1, 4, '2026-05-03 19:48:13', 'confirmee', NULL),
(7, 1, 9, '2026-05-03 19:48:13', 'confirmee', NULL),
(8, 2, 2, '2026-05-03 19:48:13', 'confirmee', NULL),
(9, 2, 6, '2026-05-03 19:48:13', 'confirmee', NULL),
(10, 2, 10, '2026-05-03 19:48:13', 'confirmee', NULL),
(11, 3, 3, '2026-05-03 19:48:13', 'confirmee', NULL),
(12, 3, 8, '2026-05-03 19:48:13', 'confirmee', NULL),
(13, 3, 11, '2026-05-03 19:48:13', 'confirmee', NULL),
(14, 4, 5, '2026-05-03 19:48:13', 'confirmee', NULL),
(15, 4, 13, '2026-05-03 19:48:13', 'confirmee', NULL),
(16, 4, 19, '2026-05-03 19:48:13', 'confirmee', NULL),
(17, 5, 7, '2026-05-03 19:48:13', 'confirmee', NULL),
(18, 5, 15, '2026-05-03 19:48:13', 'confirmee', NULL),
(19, 6, 1, '2026-05-03 19:48:13', 'confirmee', NULL),
(20, 6, 16, '2026-05-03 19:48:13', 'confirmee', NULL),
(21, 7, 2, '2026-05-03 19:48:13', 'confirmee', NULL),
(22, 7, 12, '2026-05-03 19:48:13', 'confirmee', NULL),
(23, 8, 4, '2026-05-03 19:48:13', 'confirmee', NULL),
(24, 8, 14, '2026-05-03 19:48:13', 'confirmee', NULL),
(25, 9, 9, '2026-05-03 19:48:13', 'confirmee', NULL),
(26, 9, 20, '2026-05-03 19:48:13', 'confirmee', NULL),
(27, 10, 5, '2026-05-03 19:48:13', 'confirmee', NULL),
(28, 10, 24, '2026-05-03 19:48:13', 'confirmee', NULL),
(29, 1, 21, '2026-05-03 19:48:13', 'confirmee', NULL),
(30, 2, 22, '2026-05-03 19:48:13', 'confirmee', NULL),
(31, 3, 23, '2026-05-03 19:48:13', 'confirmee', NULL),
(32, 4, 25, '2026-05-03 19:48:13', 'confirmee', NULL),
(33, 5, 26, '2026-05-03 19:48:13', 'confirmee', NULL),
(34, 6, 27, '2026-05-03 19:48:13', 'confirmee', NULL);

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
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `suivi_performance`
--

INSERT INTO `suivi_performance` (`id_suivi`, `id_membre`, `id_coach`, `date_mesure`, `poids_kg`, `imc`, `tour_taille`, `observations`) VALUES
(1, 1, 1, '2026-04-01', 75.50, 24.20, 85.00, 'Objectif: perte de 5kg'),
(2, 1, 1, '2026-04-15', 74.20, 23.80, 83.00, 'Bonne progression'),
(3, 1, 1, '2026-04-25', 73.00, 23.40, 82.00, 'Excellent travail !'),
(4, 2, 3, '2026-04-05', 68.00, 22.10, 78.00, 'Début programme yoga'),
(5, 2, 3, '2026-04-20', 67.50, 21.90, 77.00, 'Amélioration flexibilité'),
(6, 3, 2, '2026-04-10', 82.30, 26.50, 92.00, 'Programme CrossFit intensif'),
(7, 3, 2, '2026-04-24', 81.00, 26.00, 90.00, 'Progression musculaire'),
(8, 4, 5, '2026-04-08', 70.50, 23.00, 80.00, 'Boxe cardio - bon niveau'),
(9, 5, 1, '2026-04-12', 88.20, 28.10, 95.00, 'Objectif: musculation force'),
(10, 5, 1, '2026-04-26', 87.50, 27.80, 94.00, 'Gain de force visible'),
(11, 6, 4, '2026-04-15', 65.00, 21.50, 75.00, 'Zumba - excellent cardio'),
(12, 7, 3, '2026-04-18', 72.80, 23.50, 82.00, 'Pilates - posture améliorée'),
(13, 8, 2, '2026-04-20', 79.50, 25.20, 88.00, 'HIIT - bonne endurance'),
(14, 9, 5, '2026-04-22', 76.30, 24.80, 86.00, 'Boxe technique - progrès'),
(15, 10, 1, '2026-04-25', 85.00, 27.20, 93.00, 'Début programme complet');

-- --------------------------------------------------------

--
-- Structure de la table `utilisateur`
--

DROP TABLE IF EXISTS `utilisateur`;
CREATE TABLE IF NOT EXISTS `utilisateur` (
  `id_util` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `nom` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `prenom` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
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
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `utilisateur`
--

INSERT INTO `utilisateur` (`id_util`, `nom`, `prenom`, `email`, `mot_de_passe`, `telephone`, `date_naissance`, `role`, `statut`, `date_creation`, `last_login`, `reset_token`, `reset_expires`) VALUES
(1, 'Admin', 'Système', 'admin@elitegym.dz', '$2a$12$jhVqISw4aSvnwAW53KvQL.yHg35Ap8/v7tYrf.6ttry.TGq8.qME2', '0550000001', NULL, 'administrateur', 1, '2026-04-19 13:24:46', '2026-05-05 22:06:22', NULL, NULL),
(3, 'Test', 'Membre', 'membre@test.dz', '$2a$12$BdIS5QdJSXjamjcgH3iDNedWMJYBBQtQBYQEmqkI.7lOzcm6SF2lO', '+213600000000', NULL, 'membre', 1, '2026-04-24 18:19:12', '2026-05-05 22:07:01', NULL, NULL),
(4, 'Benali', 'Karim', 'karim@elitegym.dz', '$2a$12$4Qcbh/UO7BV6bMbasOGwN.tO/P1iNzqajE8x1V4/gh8NgvIcxumoe', '+213555111222', NULL, 'coach', 1, '2026-04-24 19:14:27', '2026-04-30 15:13:06', NULL, NULL),
(5, 'Amrani', 'Youcef', 'youcef@elitegym.dz', '$2a$12$igR9eL7pLwu2cDkumXvlluJIJND/bbWsgpwnQkgnS8mP5bD39z5gK', '+213555333444', NULL, 'coach', 1, '2026-04-24 19:14:27', '2026-05-05 22:08:01', NULL, NULL),
(6, 'Mansouri', 'Samia', 'samia@elitegym.dz', '$2a$12$/e5V20hDeVVlT2C/w2plWOzQrFE5pjNPJasyIn6IsJvGCMLsej55G', '+213555555666', NULL, 'coach', 1, '2026-04-24 19:14:27', NULL, NULL, NULL),
(7, 'Rahmani', 'Nadia', 'nadia@elitegym.dz', '$2a$12$2Go/tvD.xAHob3vVsTdUoeoWKFh4D5bWpouPfcTI.1Desan6tAOVu', '+213555777888', NULL, 'coach', 1, '2026-04-24 19:14:27', NULL, NULL, NULL),
(8, 'Djerbi', 'Amine', 'amine@elitegym.dz', '$2a$12$BKB3qg9K.KBeWK8WCQN0pe.DeQ3Qh5hyVfgoAhaEl8KHK/MJAqVMy', '+213555999000', NULL, 'coach', 1, '2026-04-24 19:14:27', NULL, NULL, NULL),
(10, 'bn', 'farah', '0777777777@elitegym.dz', '$2b$12$a3I8OixKJ/gr/ozM/IMl6ef7/ishe0YP9ima48SN1Nu/x9S6ZZFZe', '0777777777', NULL, 'membre', 1, '2026-05-02 01:03:36', NULL, NULL, NULL),
(11, 'Benali', 'Fatima', 'fatima.benali@email.dz', '$2b$12$5CKVh9OUBA7Y2lDGu1Ku.O2ucw4fTaBiugAY5w1nTydPMgrzaczOa', '+213661234567', '1995-03-15', 'membre', 1, '2026-05-03 19:48:12', NULL, NULL, NULL),
(12, 'Amrani', 'Karim', 'karim.amrani@email.dz', '$2b$12$5CKVh9OUBA7Y2lDGu1Ku.O2ucw4fTaBiugAY5w1nTydPMgrzaczOa', '+213662345678', '1990-07-22', 'membre', 1, '2026-05-03 19:48:12', NULL, NULL, NULL),
(13, 'Mansouri', 'Leila', 'leila.mansouri@email.dz', '$2b$12$5CKVh9OUBA7Y2lDGu1Ku.O2ucw4fTaBiugAY5w1nTydPMgrzaczOa', '+213663456789', '1998-11-08', 'membre', 1, '2026-05-03 19:48:12', NULL, NULL, NULL),
(14, 'Rahmani', 'Sofiane', 'sofiane.rahmani@email.dz', '$2b$12$5CKVh9OUBA7Y2lDGu1Ku.O2ucw4fTaBiugAY5w1nTydPMgrzaczOa', '+213664567890', '1992-01-30', 'membre', 1, '2026-05-03 19:48:12', NULL, NULL, NULL),
(15, 'Djouadi', 'Nabila', 'nabila.djouadi@email.dz', '$2b$12$5CKVh9OUBA7Y2lDGu1Ku.O2ucw4fTaBiugAY5w1nTydPMgrzaczOa', '+213665678901', '1988-05-14', 'membre', 1, '2026-05-03 19:48:12', NULL, NULL, NULL),
(16, 'Hamdi', 'Yacine', 'yacine.hamdi@email.dz', '$2b$12$5CKVh9OUBA7Y2lDGu1Ku.O2ucw4fTaBiugAY5w1nTydPMgrzaczOa', '+213666789012', '1996-09-25', 'membre', 1, '2026-05-03 19:48:12', NULL, NULL, NULL),
(17, 'Benali', 'Samira', 'samira.benali@email.dz', '$2b$12$5CKVh9OUBA7Y2lDGu1Ku.O2ucw4fTaBiugAY5w1nTydPMgrzaczOa', '+213667890123', '1993-12-03', 'membre', 1, '2026-05-03 19:48:12', NULL, NULL, NULL),
(18, 'Khaled', 'Mohamed', 'mohamed.khaled@email.dz', '$2b$12$5CKVh9OUBA7Y2lDGu1Ku.O2ucw4fTaBiugAY5w1nTydPMgrzaczOa', '+213668901234', '1991-04-18', 'membre', 1, '2026-05-03 19:48:12', NULL, NULL, NULL),
(19, 'Zerrouki', 'Amina', 'amina.zerrouki@email.dz', '$2b$12$5CKVh9OUBA7Y2lDGu1Ku.O2ucw4fTaBiugAY5w1nTydPMgrzaczOa', '+213669012345', '1997-08-27', 'membre', 1, '2026-05-03 19:48:12', NULL, NULL, NULL),
(20, 'Belkacem', 'Rachid', 'rachid.belkacem@email.dz', '$2b$12$5CKVh9OUBA7Y2lDGu1Ku.O2ucw4fTaBiugAY5w1nTydPMgrzaczOa', '+213670123456', '1989-02-11', 'membre', 1, '2026-05-03 19:48:12', NULL, NULL, NULL),
(21, 'pff', 'pff', '0555555555@elitegym.dz', '$2b$12$Xj3x85kafUM/.PWvYYilLeCMZtXLlqGE5Se8Hki9HKnbPhYY37uvi', '0555555555', NULL, 'membre', 1, '2026-05-03 19:52:34', NULL, NULL, NULL);

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
