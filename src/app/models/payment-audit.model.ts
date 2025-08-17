// src/app/core/models/payment-audit.model.ts
export interface PaymentAudit {
    id: number;
    trancheId: number;
    event: string;
    details?: string;
    timestamp: string; // ISO datetime
  }
  