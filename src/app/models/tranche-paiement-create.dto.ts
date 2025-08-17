// src/app/core/dtos/tranche-paiement-create.dto.ts
export interface TranchePaiementCreateDTO {
    ordre: number;
    titre: string;
    montant: number;
    devise?: string;      // défaut : "TND"
    missionId: number;
  }
  