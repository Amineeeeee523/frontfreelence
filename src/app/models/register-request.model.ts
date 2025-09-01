// src/app/models/register-request.model.ts
import {
    Disponibilite,
    Langue,
    NiveauExperience,
    TypeUtilisateur,
    TypeClient,
    Mobilite,
    NiveauLangue,
    NiveauMaitrise,
    EngagementModel
} from './utilisateur.model';
import { MissionCategorie, Gouvernorat } from './mission.model';

/**
 * DTO d’inscription enrichi : permet de créer un utili­sateur
 * (freelance ou client) avec la plupart des attributs de profil.
 */
export interface RegisterRequestDto {
    // --- Champs communs ---
    nom: string;
    prenom: string;
    email: string;
    password: string;
    typeUtilisateur: TypeUtilisateur;

    // Sous-type client (optionnel, requis si typeUtilisateur === CLIENT)
    typeClient?: TypeClient;

    // --- Contact & profil ---
    numeroTelephone?: string;
    photoProfilUrl?: string;
    languePref?: Langue;
    // Nouveaux champs communs
    gouvernorat?: Gouvernorat;
    linkedinUrl?: string;
    githubUrl?: string;

    // --- Attributs Freelance ---
    competences?: string[];
    tarifHoraire?: number;
    tarifJournalier?: number;
    disponibilite?: Disponibilite;
    bio?: string;
    niveauExperience?: NiveauExperience;
    localisation?: string;
    categories?: MissionCategorie[];
    portfolioUrls?: string[];
    pushTokens?: string[];

    // ======== AJOUTS FREELANCE ========
    titreProfil?: string;
    anneesExperience?: number;
    timezone?: string; // ex. Africa/Tunis
    mobilite?: Mobilite;
    dateDisponibilite?: string;        // ISO string (YYYY-MM-DD)
    chargeHebdoSouhaiteeJours?: number;

    modelesEngagementPreferes?: EngagementModel[];
    preferenceDuree?: import('./utilisateur.model').PreferenceDuree;
    flexibiliteTarifairePourcent?: number;

    langues?: Partial<Record<Langue, NiveauLangue>>;                // FR/AR/EN + niveau
    competencesNiveaux?: Record<string, NiveauMaitrise>;            // skill -> niveau
    certifications?: string[];
    nombreAvis?: number;

    // --- Attributs Client ---
    nomEntreprise?: string;
    siteEntreprise?: string;
    descriptionEntreprise?: string;
}
