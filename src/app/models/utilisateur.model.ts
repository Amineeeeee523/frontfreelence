// src/app/core/models/utilisateur.model.ts
import { MissionCategorie } from './mission.model';
// (en haut du fichier)
import { TranchePaiement } from './tranche-paiement.model';
export interface Utilisateur {
  id: number | null;
  nom: string;
  prenom: string;
  email: string;
  motDePasse?: string; // WRITE-ONLY

  typeUtilisateur: TypeUtilisateur;
  estActif: boolean;
  dateCreation: string;      // ISO datetime
  dateDerniereConnexion?: string | null; // ISO datetime
  derniereMiseAJour?: string; // ISO datetime

  // --- Champs communs ---
  numeroTelephone?: string;
  languePref?: Langue;
  photoProfilUrl?: string;
  soldeEscrow?: number;
  nombreSwipes?: number;
  pushTokens?: string[];

  // --- Champs Freelance ---
  competences?: string[];
  tarifHoraire?: number;
  tarifJournalier?: number;
  niveauExperience?: NiveauExperience;
  disponibilite?: Disponibilite;
  localisation?: string;
  categories?: MissionCategorie[];
  bio?: string;
  portfolioUrls?: string[];
  listeBadges?: string[];
  noteMoyenne?: number;
  projetsTermines?: number;


  // --- Champs Client ---
  nomEntreprise?: string;
  siteEntreprise?: string;
  descriptionEntreprise?: string;
  missionsPubliees?: number;
  historiqueMissions?: string[];
  noteDonneeMoy?: number;
  /* Sous-type du client (aligné sur backend) */
  typeClient?: TypeClient;



  /** Tranches où l’utilisateur est le client */
  tranchesClient?: TranchePaiement[];

  /** Tranches où l’utilisateur est le freelance */
  tranchesFreelance?: TranchePaiement[];

}

/* ---------- Enums alignés sur Java ---------- */
export enum TypeUtilisateur  { FREELANCE = 'FREELANCE', CLIENT = 'CLIENT', ADMIN = 'ADMIN' }
export enum Disponibilite    { TEMPS_PLEIN = 'TEMPS_PLEIN', TEMPS_PARTIEL = 'TEMPS_PARTIEL', PONCTUEL = 'PONCTUEL', INDISPONIBLE = 'INDISPONIBLE' }
export enum NiveauExperience { DEBUTANT = 'DEBUTANT', INTERMEDIAIRE = 'INTERMEDIAIRE', EXPERT = 'EXPERT' }
export enum Langue           { FR = 'FR', AR = 'AR', EN = 'EN' }
export enum TypeClient       { PME_STARTUP = 'PME_STARTUP', ENTREPRENEUR = 'ENTREPRENEUR', ETUDIANT_PARTICULIER = 'ETUDIANT_PARTICULIER', CLIENT_ETRANGER = 'CLIENT_ETRANGER' }
