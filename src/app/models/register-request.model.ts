// src/app/models/register-request.model.ts
import {
    Disponibilite,
    Langue,
    NiveauExperience,
    TypeUtilisateur,
    TypeClient
} from './utilisateur.model';
import { MissionCategorie } from './mission.model';

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

    // --- Attributs Client ---
    nomEntreprise?: string;
    siteEntreprise?: string;
    descriptionEntreprise?: string;
}
