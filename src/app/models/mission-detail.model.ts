// src/app/models/mission-detail.model.ts
import { MissionStatut, MissionCategorie, ModaliteTravail } from './mission.model';
import { ClientInfo } from './client-info.model';

export interface MissionDetail {
  id: number;
  titre: string;
  description: string;
  competencesRequises: string[];
  budget: number;
  devise?: string;
  delaiLivraison: string;      // ISO date
  localisation?: string;
  modaliteTravail?: ModaliteTravail;
  categorie: MissionCategorie;
  statut: MissionStatut;
  datePublication: string;     // ISO datetime
  clientId: number;
  clientNomComplet: string;
  freelanceId?: number;
  freelanceNomComplet?: string;

  totalRequiredSkills?: number;
  matchedSkills?: number;
  matchRatio?: number;

  // Nouveaux champs
  dureeEstimeeJours?: number;
  dateLimiteCandidature?: string; // ISO date
  mediaUrls?: string[];
  videoBriefUrl?: string;
  scoreMatching?: number;
  urgent?: boolean;
  expired?: boolean;

  /* Swipe / matching dynamique */
  alreadySwiped?: boolean;
  likedByCurrentUser?: boolean;
  mutualMatch?: boolean;
  missionLocked?: boolean;
  swipesRecus?: number;
  likesRecus?: number;
  canSwipe?: boolean;
  canApply?: boolean;
  selectionFaite?: boolean;
  resumeCourt?: string;

  client?: ClientInfo; // Infos client enrichies
}
