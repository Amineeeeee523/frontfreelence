// src/app/core/dtos/mission-paiement-summary.dto.ts
import { TranchePaiementResponseDTO } from './tranche-paiement-response.dto';

export interface MissionPaiementSummaryDTO {
  missionId: number;
  titreMission: string;
  totalBrut: number;
  totalCommission: number;
  totalNetFreelance: number;
  tranches: TranchePaiementResponseDTO[];
}
