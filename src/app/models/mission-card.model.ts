import { MissionStatut, MissionCategorie, ModaliteTravail, TypeRemuneration, Gouvernorat, ClosurePolicy } from './mission.model';
import { FreelanceSummary } from './freelance-summary.model';
import { ClientInfo } from './client-info.model';

export enum NextAction { VALIDER_LIVRABLE = 'VALIDER_LIVRABLE', PAYER_TRANCHE = 'PAYER_TRANCHE', BOOSTER = 'BOOSTER', DETAILS = 'DETAILS' }

/**
 * DTO pour l'affichage des cartes de mission côté client.
 * Correspond au MissionCardDto Java.
 */
export interface MissionCard {
  id: number;
  titre: string;
  description: string;
  budget: number;
  devise?: string;
  statut: MissionStatut;
  freelance?: FreelanceSummary;
  // AJOUTS backend
  categorie?: MissionCategorie;
  modaliteTravail?: ModaliteTravail;
  typeRemuneration?: TypeRemuneration;
  budgetMin?: number;
  budgetMax?: number;
  tjmJournalier?: number;
  gouvernorat?: Gouvernorat;
  // Champs utiles pour compatibilité templates
  datePublication?: string; // ISO datetime
  delaiLivraison?: string;  // ISO date
  clientId?: number;
  competencesRequises?: string[];
  dureeEstimeeJours?: number;
  localisation?: string;
  mediaUrls?: string[];
  videoBriefUrl?: string;
  dateLimiteCandidature?: string; // ISO date
  dateDebutSouhaitee?: string; // ISO date
  chargeHebdoJours?: number;
  urgent?: boolean;
  qualiteBrief?: 'COMPLET' | 'MOYEN' | 'LACUNAIRE';
  niveauExperienceMin?: 'DEBUTANT' | 'INTERMEDIAIRE' | 'EXPERT';
  scoreMatching?: number;
  matchReasons?: string[];
  candidatsCount?: number;
  badges?: string[];
  derniereActiviteAt?: string; // ISO datetime
  client?: ClientInfo; // ClientInfoDTO

  // ======== Enrichissements opérationnels pour la carte ========

  livrablesTotal?: number;
  livrablesValides?: number;
  livrablesEnAttente?: number;
  progressPct?: number;           // 0..100
  livrableIdEnAttente?: number;   // id to open directly

  trancheDue?: boolean;
  trancheIdDue?: number;

  nextAction?: NextAction;

  // ======== Clôture / policy ========
  closurePolicy?: ClosurePolicy;
  pretACloturer?: boolean;
  closedByClient?: boolean;
  closedByFreelancer?: boolean;
  contractTotalAmount?: number;
}