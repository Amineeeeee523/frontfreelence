// src/app/core/dtos/paymee-webhook.dto.ts
export interface PaymeeWebhookDTO {
    token: string;
    status: string; // PAID | FAILED | CANCELLED
}

// Flouci webhook a la même forme (token/status)
export type FlouciWebhookDTO = PaymeeWebhookDTO;
  