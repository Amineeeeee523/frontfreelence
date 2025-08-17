// src/app/core/dtos/tranche-paiement-response.dto.ts
import { StatutTranche } from '../models/tranche-paiement.model';

export interface TranchePaiementResponseDTO {
  id: number;
  ordre: number;
  titre: string;
  montantBrut: number;
  commissionPlateforme: number;
  montantNetFreelance: number;
  devise: string;
  statut: StatutTranche;
  dateCreation: string;
  dateDepot?: string;
  dateValidation?: string;
  dateVersement?: string;
  paymeePaymentUrl?: string;
}
