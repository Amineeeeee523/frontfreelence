// src/app/core/dtos/withdrawal-method-create.dto.ts
import { WithdrawalMethodType } from './withdrawal-method.model';

export interface WithdrawalMethodCreateDTO {
  type: WithdrawalMethodType; // RIB or D17
  rib?: string;
  walletNumber?: string;
  principal?: boolean;
}


