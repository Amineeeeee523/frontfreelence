/**
 * Résumé des informations d'un freelance à afficher dans la carte côté client.
 * Correspond au FreelanceSummaryDTO Java.
 */
import { EngagementModel, Langue, Mobilite, NiveauLangue, NiveauMaitrise, StatutKyc, PreferenceDuree } from './utilisateur.model';
import { Gouvernorat } from './mission.model';

export interface FreelanceSummary {
  id: number;
  nom: string;
  prenom: string;
  photoUrl?: string;
  // Compatibilité avec anciens templates
  photoProfilUrl?: string;
  typeUtilisateur?: string;
  localisation?: string;
  gouvernorat?: Gouvernorat;
  niveauExperience?: string;
  disponibilite?: string;
  tarifHoraire?: number;
  noteMoyenne?: number;
  nombreAvis?: number;
  competences?: string[];
  badgePrincipal?: string; // ex. Top Talent, Expert…

  // AJOUTS backend
  titreProfil?: string;
  anneesExperience?: number;
  mobilite?: Mobilite;
  timezone?: string;

  tarifJournalier?: number;
  modelesEngagementPreferes?: EngagementModel[];
  preferenceDuree?: PreferenceDuree;

  dateDisponibilite?: string; // ISO date
  chargeHebdoSouhaiteeJours?: number;

  langues?: Partial<Record<Langue, NiveauLangue>>;
  competencesNiveaux?: Record<string, NiveauMaitrise>;
  portfolioUrls?: string[];

  tauxReussite?: number;
  tauxRespectDelais?: number;
  tauxReembauche?: number;
  delaiReponseHeures?: number;
  delaiReponseMedianMinutes?: number;

  certifications?: string[];
  linkedinUrl?: string;
  githubUrl?: string;

  // Vérifications & KYC
  emailVerifie?: boolean;
  telephoneVerifie?: boolean;
  identiteVerifiee?: boolean;
  ribVerifie?: boolean;
  kycStatut?: StatutKyc;

  // Matching par rapport à la mission courante
  matchScore?: number;
  matchReasons?: string[];
}