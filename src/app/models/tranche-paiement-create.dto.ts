// src/app/core/dtos/tranche-paiement-create.dto.ts
import { Devise } from './devise.enum.js';

export interface TranchePaiementCreateDTO {
    ordre: number;
    titre: string;
    montantBrut: number;          // aligné backend
    /** Compatibilité descendante: le backend accepte aussi 'montant' via JsonAlias */
    montant?: number;
    devise?: Devise;              // défaut : TND
    missionId: number;
  }
  