// src/app/core/dtos/withdrawal-request.dto.ts
import { Devise } from './devise.enum.js';

export interface WithdrawalRequestDTO {
  methodId: number;
  montant: number;
  devise?: Devise; // défaut TND
}


