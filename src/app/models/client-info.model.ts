import { TypeClient, StatutKyc } from './utilisateur.model';

export interface ClientInfo {
  id: number;
  nom: string;
  prenom: string;
  photoUrl?: string;
  ville?: string; // localisation

  // Métadonnées client
  typeClient?: TypeClient;
  timezone?: string;

  // Confiance / réputation
  missionsPubliees?: number;
  noteDonneeMoy?: number;
  fiabilitePaiement?: number;
  delaiPaiementMoyenJours?: number;

  // Vérifications / KYC
  emailVerifie?: boolean;
  telephoneVerifie?: boolean;
  identiteVerifiee?: boolean;
  ribVerifie?: boolean;
  kycStatut?: StatutKyc;

  // Entreprise
  nomEntreprise?: string;
  siteEntreprise?: string;
  descriptionEntreprise?: string;

  // Badges
  badges?: string[];
}