// src/app/core/models/tranche-paiement.model.ts
import { Mission } from './mission.model';
import { Utilisateur } from './utilisateur.model';
import { Devise } from './devise.enum.js';
import { Livrable } from './livrable.model';

export enum StatutTranche {
  EN_ATTENTE_DEPOT       = 'EN_ATTENTE_DEPOT',
  EN_ATTENTE_PAIEMENT    = 'EN_ATTENTE_PAIEMENT',
  FONDS_BLOQUES          = 'FONDS_BLOQUES',
  EN_ATTENTE_VALIDATION  = 'EN_ATTENTE_VALIDATION',
  VALIDEE                = 'VALIDEE',
  VERSEE_FREELANCE       = 'VERSEE_FREELANCE',
  REJETEE                = 'REJETEE',
  ERREUR_CAPTURE         = 'ERREUR_CAPTURE',
}

export interface TranchePaiement {
  /* Identité */
  id: number;
  version?: number;

  /* Métadonnées */
  ordre: number;
  titre: string;
  montantBrut: number;
  commissionPlateforme: number;
  montantNetFreelance: number;
  // Backend uses string (e.g., "TND"); keep compatibility while allowing enum usage elsewhere
  devise: string;
  statut: StatutTranche;

  /* Dates (ISO) */
  dateCreation: string;
  dateDepot?: string;
  dateValidation?: string;
  dateVersement?: string;

  /* Paymee */
  paymeeCheckoutId?: string;
  paymeePaymentUrl?: string;

  /* Relations */
  missionId?: number;
  clientId?: number;
  freelanceId?: number;

  /* (Facultatif : navigation) */
  mission?: Mission;
  client?: Utilisateur;
  freelance?: Utilisateur;
  livrableAssocie?: Livrable;

  /* Indicateurs alignés backend */
  required?: boolean;
  finale?: boolean;
}
