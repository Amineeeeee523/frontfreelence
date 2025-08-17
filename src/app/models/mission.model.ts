// src/app/models/mission.model.ts

// (en haut du fichier)
import { TranchePaiement } from './tranche-paiement.model';
import { Livrable } from './livrable.model';


export enum MissionStatut {
    EN_ATTENTE   = 'EN_ATTENTE',
    EN_COURS     = 'EN_COURS',
    EN_ATTENTE_VALIDATION = 'EN_ATTENTE_VALIDATION', // nouveau statut
    TERMINEE     = 'TERMINEE',
    ANNULEE      = 'ANNULEE',
    EXPIREE      = 'EXPIREE', // nouvel état
  }
  
  export enum MissionCategorie {
    DEVELOPPEMENT_WEB      = 'DEVELOPPEMENT_WEB',
    DEVELOPPEMENT_MOBILE   = 'DEVELOPPEMENT_MOBILE',
    DESIGN_GRAPHIQUE       = 'DESIGN_GRAPHIQUE',
    REDACTION_CONTENU      = 'REDACTION_CONTENU',
    MARKETING_DIGITAL      = 'MARKETING_DIGITAL',
    VIDEO_MONTAGE          = 'VIDEO_MONTAGE',
    TRADUCTION             = 'TRADUCTION',
    SUPPORT_TECHNIQUE      = 'SUPPORT_TECHNIQUE',
    CONSULTING             = 'CONSULTING',
    AUTRE                  = 'AUTRE',
  }
  
  // Nouvelle énumération pour la modalité de travail
  export enum ModaliteTravail {
    DISTANCIEL    = 'DISTANCIEL',
    PRESENTIEL    = 'PRESENTIEL',
    HYBRIDE       = 'HYBRIDE',
    NON_SPECIFIE  = 'NON_SPECIFIE',
  }
  
  export interface Mission {
    id: number;
    titre: string;
    description: string;
    competencesRequises: string[];
    budget: number;
    devise?: string;                 // ex: "TND", "EUR"
    delaiLivraison: string;      // format ISO (YYYY-MM-DD)
    dureeEstimeeJours?: number;
    dateLimiteCandidature?: string; // ISO date
    localisation?: string;
    modaliteTravail?: ModaliteTravail; // nouvelle info
    statut: MissionStatut;
    clientId: number;
    freelanceSelectionneId?: number;
    datePublication: string;     // format ISO (YYYY-MM-DDTHH:mm:ss)
    categorie: MissionCategorie;
    transactionId?: number;
    mediaUrls?: string[];
    videoBriefUrl?: string;
    scoreMatching?: number; // Transient, from DTOs
    
    // Nouveaux champs ajoutés pour synchroniser avec le backend
    swipesRecus?: number;
    likesRecus?: number;
    verrouillee?: boolean;
    dateAffectation?: string; // format ISO (YYYY-MM-DDTHH:mm:ss)
    dateDerniereMiseAJour?: string; // format ISO (YYYY-MM-DDTHH:mm:ss)
    version?: number;


     /** Milestones de paiement attachés à la mission */
  tranches?: TranchePaiement[];

  /** Livrables associés */
  livrables?: Livrable[];
  }
  