// src/app/models/payment-audit.model.ts
export interface PaymentAudit {
    id: number;
    trancheId: number;
    missionId: number;
    withdrawalRequestId?: number;
    event: string;
    details?: string;
    timestamp: string; // ISO datetime (LocalDateTime from Java)
}
  