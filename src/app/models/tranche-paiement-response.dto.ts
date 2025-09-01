// src/app/core/dtos/tranche-paiement-response.dto.ts
import { StatutTranche } from './tranche-paiement.model';
import { Devise } from './devise.enum.js';

export interface TranchePaiementResponseDTO {
  id: number;
  ordre: number;
  titre: string;
  montantBrut: number;
  commissionPlateforme: number;
  montantNetFreelance: number;
  devise: Devise;
  statut: StatutTranche;
  dateCreation: string;
  dateDepot?: string;
  dateValidation?: string;
  dateVersement?: string;
  paymeePaymentUrl?: string;
  // Nouveaux indicateurs
  required?: boolean;
  finale?: boolean;
  livrableAssocieId?: number;
}
