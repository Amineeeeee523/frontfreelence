// src/app/core/dtos/withdrawal-method-response.dto.ts
import { WithdrawalMethodType } from './withdrawal-method.model';

export interface WithdrawalMethodResponseDTO {
  id: number;
  type: WithdrawalMethodType;
  rib?: string;
  walletNumber?: string;
  principal: boolean;
  dateAjout: string; // ISO
}


