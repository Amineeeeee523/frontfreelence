// src/app/models/utilisateur-summary.model.ts

export interface UtilisateurSummaryModel {
    id: number;
    nom: string;
    prenom: string;
    photoUrl?: string;
    localisation?: string;
    niveauExperience?: string;
    disponibilite?: string;
    tarifHoraire?: number;
    noteMoyenne?: number;
    competences: string[];
    badgePrincipal?: string;
  }
  