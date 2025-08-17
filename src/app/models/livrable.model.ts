import { Mission } from './mission.model';
import { Utilisateur } from './utilisateur.model';

export enum StatusLivrable {
  EN_ATTENTE = 'EN_ATTENTE',
  VALIDE     = 'VALIDE',
  REJETE     = 'REJETE'
}

export interface Livrable {
  id: number;
  titre: string;
  description?: string;
  dateEnvoi: string;
  status: StatusLivrable;
  liensExternes?: string[];
  cheminsFichiers?: string[];
  missionId: number;
  freelancerId: number;
  mission?: Mission;
  freelancer?: Utilisateur;
}

export interface CreateLivrableRequest {
  missionId: number;
  titre: string;
  description?: string;
  liensExternes?: string[];
} 