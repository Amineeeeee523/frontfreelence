import { MissionSummary } from './mission-summary.model';

/**
 * Modèle d'affichage utilisé pour le swipe des freelances.
 * Inclut les champs supplémentaires nécessaires à l'UI
 * par rapport au MissionSummary standard.
 */
export interface MissionViewModel extends MissionSummary {
  description: string;
  competencesRequises: string[];
  
  // Nouveaux champs pour la carte moderne
  clientNom?: string;
  clientAvatarUrl?: string;
  clientEstVerifie?: boolean;
  clientMissionsPostees?: number;
  localisation?: string;
  scoreCompatibilite?: number;
  videoBriefUrl?: string;
  resume?: string;
  
  /** Nouvel ajout : urls d’images/maquettes associées à la mission */
  mediaUrls?: string[];

  /** Hack: Avatar fallback needs id client */
  clientId?: number;

  /**
   * Décision prise par le freelance sur la mission (animation / UI).
   */
  decision?: 'like' | 'dislike';
} 