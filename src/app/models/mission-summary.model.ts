// src/app/models/mission-summary.model.ts
import { MissionStatut, MissionCategorie, ModaliteTravail, TypeRemuneration, Gouvernorat, NiveauBrief, ClosurePolicy } from './mission.model';
import { ClientInfo } from './client-info.model';

export interface MissionSummary {
  id: number;
  titre: string;
  budget: number;
  devise?: string;
  categorie: MissionCategorie;
  statut: MissionStatut;
  modaliteTravail?: ModaliteTravail;
  datePublication: string;   // ISO datetime
  dureeEstimeeJours?: number;
  dateLimiteCandidature?: string; // ISO date
  urgent?: boolean;
  expired?: boolean;
  client?: ClientInfo;
  // AJOUTS backend
  typeRemuneration?: TypeRemuneration;
  budgetMin?: number;
  budgetMax?: number;
  tjmJournalier?: number;
  gouvernorat?: Gouvernorat;
  chargeHebdoJours?: number;
  dateDebutSouhaitee?: string; // ISO date
  qualiteBrief?: NiveauBrief;
  niveauExperienceMin?: 'DEBUTANT' | 'INTERMEDIAIRE' | 'EXPERT';
  derniereActiviteAt?: string; // ISO datetime
  candidatsCount?: number;
  badges?: string[];

  // Clôture / policy (léger)
  closurePolicy?: ClosurePolicy;
  pretACloturer?: boolean;
  contractTotalAmount?: number;
}
