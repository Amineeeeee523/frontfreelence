// src/app/core/models/withdrawal-request.model.ts
import { Devise } from './devise.enum.js';
import { WithdrawalMethod } from './withdrawal-method.model';

export enum WithdrawalRequestStatut {
  EN_ATTENTE = 'EN_ATTENTE',
  PAYE = 'PAYE',
  ERREUR = 'ERREUR',
}

export interface WithdrawalRequest {
  id: number;
  version?: number;
  montant: number;
  devise: Devise; // défaut TND
  statut: WithdrawalRequestStatut;
  dateDemande: string;   // ISO
  datePaiement?: string; // ISO
  paymeeReference?: string;
  freelanceId: number;
  methodId: number;
  // navigation optionnelle
  method?: WithdrawalMethod;
}


