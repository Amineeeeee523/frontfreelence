// src/app/core/dtos/withdrawal-request-response.dto.ts
import { Devise } from './devise.enum.js';
import { WithdrawalRequestStatut } from './withdrawal-request.model';

export interface WithdrawalRequestResponseDTO {
  id: number;
  montant: number;
  devise: Devise;
  statut: WithdrawalRequestStatut | string; // string pour robustesse si backend renvoie string
  dateDemande: string;   // ISO
  datePaiement?: string; // ISO
  paymeeReference?: string;
}


