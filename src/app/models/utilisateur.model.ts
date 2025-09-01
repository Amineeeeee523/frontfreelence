// src/app/core/models/utilisateur.model.ts
import { MissionCategorie, Gouvernorat } from './mission.model';
// (en haut du fichier)
import { TranchePaiement } from './tranche-paiement.model';
export interface Utilisateur {
  id: number | null;
  version?: number;
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
  likesRecus?: number;
  matchesObtenus?: number;
  dernierSwipeAt?: string; // ISO datetime
  pushTokens?: string[];

  // --- Champs Freelance ---
  competences?: string[];
  tarifHoraire?: number;
  tarifJournalier?: number;
  niveauExperience?: NiveauExperience;
  disponibilite?: Disponibilite;
  localisation?: string;
  /** Gouvernorat rattaché à l'utilisateur */
  gouvernorat?: Gouvernorat;
  categories?: MissionCategorie[];
  bio?: string;
  portfolioUrls?: string[];
  listeBadges?: string[];
  noteMoyenne?: number;
  /** Nombre d'avis accompagnant la note moyenne */
  nombreAvis?: number;
  projetsTermines?: number;

  // Profil / headline / seniorité (ajouts backend)
  titreProfil?: string;
  anneesExperience?: number;
  timezone?: string; // ex. "Africa/Tunis"
  mobilite?: Mobilite;
  dateDisponibilite?: string; // ISO date (YYYY-MM-DD)
  chargeHebdoSouhaiteeJours?: number; // 0..7
  langues?: Partial<Record<Langue, NiveauLangue>>; // Map Langue -> NiveauLangue
  competencesNiveaux?: Record<string, NiveauMaitrise>; // Map skill -> niveau
  modelesEngagementPreferes?: EngagementModel[];
  flexibiliteTarifairePourcent?: number; // 0..100
  /** Préférence de durée des missions */
  preferenceDuree?: PreferenceDuree;

  // Vérifications / conformité
  emailVerifie?: boolean;
  telephoneVerifie?: boolean;
  identiteVerifiee?: boolean;
  ribVerifie?: boolean;
  kycStatut?: StatutKyc;

  // Indicateurs qualité/réputation (client)
  tauxReussite?: number; // %
  tauxRespectDelais?: number; // %
  tauxReembauche?: number; // %
  delaiReponseHeures?: number;
  delaiReponseMedianMinutes?: number;
  certifications?: string[];
  /** Réseaux professionnels */
  linkedinUrl?: string;
  githubUrl?: string;

  // Préférences & limites
  autoriseContactAvantMatch?: boolean;
  quotaSwipesQuotidien?: number;
  quotaSwipesDernierReset?: string; // ISO datetime
  superLikesRestantsDuJour?: number;
  dernierSuperLikeAt?: string; // ISO datetime

  // Santé/modération
  signalementsRecus?: number;
  suspicionFraudeScore?: number; // 0..1

  // Fiabilité paiement côté client
  delaiPaiementMoyenJours?: number;
  fiabilitePaiement?: number; // %
  prestataireEscrowFavori?: string;
  exigeDepotAvantChat?: boolean;


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

// Ajouts complémentaires backend
export enum Mobilite        { REMOTE = 'REMOTE', ONSITE = 'ONSITE', BOTH = 'BOTH' }
export enum NiveauLangue    { A1 = 'A1', A2 = 'A2', B1 = 'B1', B2 = 'B2', C1 = 'C1', C2 = 'C2', NATIF = 'NATIF' }
export enum NiveauMaitrise  { DEBUTANT = 'DEBUTANT', INTERMEDIAIRE = 'INTERMEDIAIRE', AVANCE = 'AVANCE', EXPERT = 'EXPERT' }
export enum EngagementModel { FORFAIT = 'FORFAIT', TJM = 'TJM', REGIE = 'REGIE' }
export enum PreferenceDuree { COURT_TERME = 'COURT_TERME', LONG_TERME = 'LONG_TERME', INDIFFERENT = 'INDIFFERENT' }
export enum StatutKyc       { NON_DEMARRE = 'NON_DEMARRE', EN_COURS = 'EN_COURS', VERIFIE = 'VERIFIE', REJETE = 'REJETE' }
