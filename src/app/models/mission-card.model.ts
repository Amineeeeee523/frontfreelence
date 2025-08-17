import { MissionStatut } from './mission.model';
import { FreelanceSummary } from './freelance-summary.model';

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
}