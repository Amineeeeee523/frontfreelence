// src/app/models/freelancer-mission-detail.model.ts

import { MissionStatut, MissionCategorie, Gouvernorat, ModaliteTravail, TypeRemuneration, NiveauBrief } from './mission.model';

export interface ClientInfoDTO {
  id: number;
  nom: string;
  prenom: string;
  photoUrl?: string;
  ville?: string;
  typeClient?: string;
  timezone?: string;
  missionsPubliees?: number;
  noteDonneeMoy?: number;
  fiabilitePaiement?: number;
  delaiPaiementMoyenJours?: number;
  emailVerifie?: boolean;
  telephoneVerifie?: boolean;
  identiteVerifiee?: boolean;
  ribVerifie?: boolean;
  kycStatut?: string;
  nomEntreprise?: string;
  siteEntreprise?: string;
  descriptionEntreprise?: string;
  badges?: string[];
}

export interface PaymentMiniDTO {
  totalAmount?: number;
  paidAmount?: number;
  pendingAmount?: number;
  nextPaymentDue?: string;
  currency?: string;
}

export interface LivrableLiteDTO {
  id: number;
  titre: string;
  description?: string;
  dateEnvoi: string;
  status: 'EN_ATTENTE' | 'VALIDE' | 'REJETE';
  cheminsFichiers?: string[];
  liensExternes?: string[];
}

export interface FreelancerMissionDetailDTO {
  // Identité & base
  id: number;
  titre: string;
  description: string;
  categorie: MissionCategorie;
  statut: MissionStatut;

  // Exigences & matching
  competencesRequises: string[];
  competencesPriorisees?: Record<string, string>;
  languesRequises?: Record<string, string>;
  niveauExperienceMin?: 'DEBUTANT' | 'INTERMEDIAIRE' | 'EXPERT';
  scoreMatching?: number;
  raisonsMatching?: string[];

  // Budget & rémunération
  budget: number;
  devise?: string;
  typeRemuneration?: TypeRemuneration;
  budgetMin?: number;
  budgetMax?: number;
  tjmJournalier?: number;

  // Planning / charge
  delaiLivraison: string;
  dureeEstimeeJours?: number;
  dateLimiteCandidature?: string;
  dateDebutSouhaitee?: string;
  chargeHebdoJours?: number;

  // Localisation / modalité
  localisation?: string;
  gouvernorat?: Gouvernorat;
  modaliteTravail?: ModaliteTravail;

  // Qualité brief & activité
  urgent?: boolean;
  qualiteBrief?: NiveauBrief;
  derniereActiviteAt?: string;
  expired?: boolean;

  // Stats & badges
  candidatsCount?: number;
  swipesRecus?: number;
  likesRecus?: number;
  badges?: string[];

  // Médias
  mediaUrls?: string[];
  videoBriefUrl?: string;

  // Parties prenantes
  client?: ClientInfoDTO;

  // Contexte freelance
  selectionne?: boolean;     // le viewer est-il le freelance sélectionné ?
  canDeliver?: boolean;      // peut-il livrer maintenant ?

  // Paiements & livrables (visibles uniquement si sélectionné)
  paiements?: PaymentMiniDTO;
  livrables?: LivrableLiteDTO[];
}
