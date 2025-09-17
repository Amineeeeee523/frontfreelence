// src/app/utils/mission-mapper.ts
import { FreelancerMissionDetailDTO } from '../models/freelancer-mission-detail.model';
import { MissionViewModel } from '../freelencer/missionfreelencer/missionfreelencer.component';
import { Mission, MissionStatut, Importance } from '../models/mission.model';
import { Utilisateur } from '../models/utilisateur.model';

/**
 * Mapper utilitaire pour convertir FreelancerMissionDetailDTO vers MissionViewModel
 * Permet de maintenir la compatibilité avec l'interface existante sans modifier le DTO
 */
export function mapFreelancerDtoToViewModel(dto: FreelancerMissionDetailDTO): MissionViewModel {
  return {
    // Champs de base requis par MissionViewModel
    id: dto.id,
    titre: dto.titre,
    description: dto.description,
    competencesRequises: dto.competencesRequises,
    budget: dto.budget,
    devise: dto.devise,
    delaiLivraison: dto.delaiLivraison,
    statut: dto.statut,
    clientId: dto.client?.id ?? 0,
    datePublication: dto.derniereActiviteAt ?? new Date().toISOString(),
    categorie: dto.categorie,
    
    // Champs optionnels
    competencesPriorisees: dto.competencesPriorisees ? 
      Object.fromEntries(
        Object.entries(dto.competencesPriorisees).map(([key, value]) => [
          key, 
          value as Importance
        ])
      ) : undefined,
    languesRequises: dto.languesRequises,
    niveauExperienceMin: dto.niveauExperienceMin,
    typeRemuneration: dto.typeRemuneration,
    budgetMin: dto.budgetMin,
    budgetMax: dto.budgetMax,
    tjmJournalier: dto.tjmJournalier,
    dureeEstimeeJours: dto.dureeEstimeeJours,
    dateLimiteCandidature: dto.dateLimiteCandidature,
    dateDebutSouhaitee: dto.dateDebutSouhaitee,
    chargeHebdoJours: dto.chargeHebdoJours,
    localisation: dto.localisation,
    gouvernorat: dto.gouvernorat,
    modaliteTravail: dto.modaliteTravail,
    urgent: dto.urgent,
    qualiteBrief: dto.qualiteBrief,
    mediaUrls: dto.mediaUrls,
    videoBriefUrl: dto.videoBriefUrl,
    scoreMatching: dto.scoreMatching,
    raisonsMatching: dto.raisonsMatching,
    swipesRecus: dto.swipesRecus,
    likesRecus: dto.likesRecus,
    candidatsCount: dto.candidatsCount,
    badges: dto.badges,
    
    // Client mapping - conversion de ClientInfoDTO vers Utilisateur
    client: dto.client ? mapClientInfoToUtilisateur(dto.client) : undefined,
    
    // Progress calculation
    progress: calculateProgressFromStatut(dto.statut)
  };
}

/**
 * Mapper pour convertir ClientInfoDTO vers Utilisateur
 */
function mapClientInfoToUtilisateur(clientInfo: any): Utilisateur {
  return {
    id: clientInfo.id,
    nom: clientInfo.nom,
    prenom: clientInfo.prenom,
    email: '', // Non disponible dans le DTO
    typeUtilisateur: 'CLIENT' as any, // Valeur par défaut
    estActif: true, // Valeur par défaut
    dateCreation: new Date().toISOString(), // Valeur par défaut
    photoProfilUrl: clientInfo.photoUrl,
    localisation: clientInfo.ville,
    nomEntreprise: clientInfo.nomEntreprise,
    typeClient: clientInfo.typeClient as any,
    timezone: clientInfo.timezone,
    missionsPubliees: clientInfo.missionsPubliees,
    noteDonneeMoy: clientInfo.noteDonneeMoy,
    fiabilitePaiement: clientInfo.fiabilitePaiement,
    delaiPaiementMoyenJours: clientInfo.delaiPaiementMoyenJours,
    emailVerifie: clientInfo.emailVerifie,
    telephoneVerifie: clientInfo.telephoneVerifie,
    identiteVerifiee: clientInfo.identiteVerifiee,
    ribVerifie: clientInfo.ribVerifie,
    kycStatut: clientInfo.kycStatut as any,
    siteEntreprise: clientInfo.siteEntreprise,
    descriptionEntreprise: clientInfo.descriptionEntreprise,
    listeBadges: clientInfo.badges || [] // Mapping badges -> listeBadges
  };
}

/**
 * Calcule le pourcentage de progression basé sur le statut de la mission
 */
function calculateProgressFromStatut(statut: MissionStatut): number {
  switch (statut) {
    case MissionStatut.EN_ATTENTE: return 10;
    case MissionStatut.EN_COURS: return 50;
    case MissionStatut.EN_ATTENTE_VALIDATION: return 75;
    case MissionStatut.PRET_A_CLOTURER: return 90;
    case MissionStatut.TERMINEE: return 100;
    default: return 0;
  }
}
