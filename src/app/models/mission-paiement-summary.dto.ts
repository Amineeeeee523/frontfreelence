// src/app/core/dtos/mission-paiement-summary.dto.ts
import { TranchePaiementResponseDTO } from './tranche-paiement-response.dto';
import { ClosurePolicy } from './mission.model';

export interface MissionPaiementSummaryDTO {
  missionId: number;
  titreMission: string;
  totalBrut: number;
  totalCommission: number;
  totalNetFreelance: number;
  tranches: TranchePaiementResponseDTO[];
  // Enrichissements UI de clôture
  closurePolicy?: ClosurePolicy;
  contractTotalAmount?: number;
  paidTotal?: number;
  allRequiredPaidAndAccepted?: boolean;
  finalTranchePaidAndAccepted?: boolean;
  finalTrancheId?: number;
  closedByClient?: boolean;
  closedByFreelancer?: boolean;
}
