// src/app/models/mission-recommendation.model.ts
import { MissionStatut, MissionCategorie, ModaliteTravail } from './mission.model';
import { ClientInfo } from './client-info.model';

export interface MissionRecommendation {
  id: number;
  titre: string;
  budget: number;
  devise?: string;
  categorie: MissionCategorie;
  statut: MissionStatut;
  modaliteTravail?: ModaliteTravail;
  datePublication: string;   // ISO datetime
  score: number;
  matchedSkills?: number;
  totalRequiredSkills?: number;
  matchRatio?: number;
  dureeEstimeeJours?: number;
  dateLimiteCandidature?: string; // ISO date
  urgent?: boolean;
  expired?: boolean;

  /* Swipe state */
  alreadySwiped?: boolean;
  likedByCurrentUser?: boolean;
  mutualMatch?: boolean;

  client?: ClientInfo;
}
