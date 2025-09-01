// models/mission-detail-view.model.ts
import { MissionStatut, MissionCategorie, ModaliteTravail, Gouvernorat, NiveauBrief, ClosurePolicy } from './mission.model';

export interface TrancheMini {
  id: number; 
  ordre: number; 
  titre: string;
  statut: string; // StatutTranche
  montantBrut: number; 
  required: boolean; 
  finale: boolean;
  paymentUrl?: string;
}

export interface PaymentMini {
  totalBrut: number;
  totalNetFreelance: number;
  paidTotal: number;
  progressionPct: number;   // 0..100
  tranches: TrancheMini[];
}

export interface LivrableLite {
  id: number; 
  titre: string; 
  description?: string;
  status: 'EN_ATTENTE' | 'VALIDE' | 'REJETE';
  dateEnvoi: string;
  cheminsFichiers: string[];
  liensExternes: string[];
  canValidate: boolean;
  canReject: boolean;
}

export interface MissionDetailView {
  // Header
  id: number;
  titre: string;
  categorie: MissionCategorie;
  statut: MissionStatut;
  budget: number;
  devise?: string;
  delaiLivraison: string;
  localisation?: string;
  urgent?: boolean;

  // Aperçu
  modaliteTravail?: ModaliteTravail;
  gouvernorat?: Gouvernorat;
  dateDebutSouhaitee?: string;
  chargeHebdoJours?: number;
  dureeEstimeeJours?: number;
  qualiteBrief?: NiveauBrief;
  niveauExperienceMin?: 'DEBUTANT' | 'INTERMEDIAIRE' | 'EXPERT';
  badges?: string[];
  freelanceNomComplet?: string;
  clientNomComplet?: string;

  // Policy
  closurePolicy?: ClosurePolicy;
  closedByClient?: boolean;
  closedByFreelancer?: boolean;
  contractTotalAmount?: number;

  // Paiements & livrables
  paiements: PaymentMini;
  livrables: LivrableLite[];

  // Fichiers
  mediaUrls: string[];
  videoBriefUrl?: string;
}
