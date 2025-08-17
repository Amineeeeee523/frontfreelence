// src/app/models/mission-summary.model.ts
import { MissionStatut, MissionCategorie, ModaliteTravail } from './mission.model';
import { ClientInfo } from './client-info.model';

export interface MissionSummary {
  id: number;
  titre: string;
  budget: number;
  devise?: string;
  categorie: MissionCategorie;
  statut: MissionStatut;
  modaliteTravail?: ModaliteTravail;
  description?: string; // optionnel – certains écrans réutilisent la carte mission avec description
  datePublication: string;   // ISO datetime
  dureeEstimeeJours?: number;
  dateLimiteCandidature?: string; // ISO date
  urgent?: boolean;
  expired?: boolean;
  client?: ClientInfo;
}
