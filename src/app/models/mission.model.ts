// src/app/models/mission.model.ts

// (en haut du fichier)
import { TranchePaiement } from './tranche-paiement.model';
import { Livrable } from './livrable.model';


export enum MissionStatut {
    EN_ATTENTE   = 'EN_ATTENTE',
    EN_COURS     = 'EN_COURS',
    EN_ATTENTE_VALIDATION = 'EN_ATTENTE_VALIDATION', // nouveau statut
    PRET_A_CLOTURER = 'PRET_A_CLOTURER',
    TERMINEE     = 'TERMINEE',
    ANNULEE      = 'ANNULEE',
    EXPIREE      = 'EXPIREE', // nouvel état
  }
  
  export enum MissionCategorie {
    DEVELOPPEMENT_WEB      = 'DEVELOPPEMENT_WEB',
    DEVELOPPEMENT_MOBILE   = 'DEVELOPPEMENT_MOBILE',
    DESIGN_GRAPHIQUE       = 'DESIGN_GRAPHIQUE',
    REDACTION_CONTENU      = 'REDACTION_CONTENU',
    MARKETING_DIGITAL      = 'MARKETING_DIGITAL',
    VIDEO_MONTAGE          = 'VIDEO_MONTAGE',
    TRADUCTION             = 'TRADUCTION',
    SUPPORT_TECHNIQUE      = 'SUPPORT_TECHNIQUE',
    CONSULTING             = 'CONSULTING',
    AUTRE                  = 'AUTRE',
  }
  
  // Nouvelle énumération pour la modalité de travail
  export enum ModaliteTravail {
    DISTANCIEL    = 'DISTANCIEL',
    PRESENTIEL    = 'PRESENTIEL',
    HYBRIDE       = 'HYBRIDE',
    NON_SPECIFIE  = 'NON_SPECIFIE',
  }
  
  // AJOUTS backend
  export enum TypeRemuneration { FORFAIT = 'FORFAIT', TJM = 'TJM' }
  export enum Importance { MUST = 'MUST', NICE = 'NICE' }
  export enum NiveauBrief { COMPLET = 'COMPLET', MOYEN = 'MOYEN', LACUNAIRE = 'LACUNAIRE' }
  export enum Gouvernorat {
    TUNIS = 'TUNIS', ARIANA = 'ARIANA', BEN_AROUS = 'BEN_AROUS', MANOUBA = 'MANOUBA',
    NABEUL = 'NABEUL', BIZERTE = 'BIZERTE', BEJA = 'BEJA', JENDOUBA = 'JENDOUBA', ZAGHOUAN = 'ZAGHOUAN',
    SILIANA = 'SILIANA', KEF = 'KEF', SOUSSE = 'SOUSSE', MONASTIR = 'MONASTIR', MAHDIA = 'MAHDIA',
    KAIROUAN = 'KAIROUAN', KASSERINE = 'KASSERINE', SIDI_BOUZID = 'SIDI_BOUZID', SFAX = 'SFAX',
    GABES = 'GABES', MEDENINE = 'MEDENINE', TATAOUINE = 'TATAOUINE', GAFSA = 'GAFSA', TOZEUR = 'TOZEUR', KEBILI = 'KEBILI'
  }

  export enum ClosurePolicy {
    FINAL_MILESTONE_REQUIRED = 'FINAL_MILESTONE_REQUIRED',
    MANUAL_DUAL_CONFIRM = 'MANUAL_DUAL_CONFIRM',
    CONTRACT_TOTAL_AMOUNT = 'CONTRACT_TOTAL_AMOUNT'
  }
  
  export interface Mission {
    id: number;
    version?: number;
    titre: string;
    description: string;
    competencesRequises: string[];
    // Ajouts backend
    competencesPriorisees?: Record<string, Importance>;
    languesRequises?: Partial<Record<'FR' | 'AR' | 'EN', 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2' | 'NATIF'>>;
    niveauExperienceMin?: 'DEBUTANT' | 'INTERMEDIAIRE' | 'EXPERT';
    budget: number;
    devise?: string;                 // ex: "TND", "EUR"
    typeRemuneration?: TypeRemuneration;
    budgetMin?: number;
    budgetMax?: number;
    tjmJournalier?: number;
    delaiLivraison: string;      // format ISO (YYYY-MM-DD)
    dureeEstimeeJours?: number;
    dateLimiteCandidature?: string; // ISO date
    dateDebutSouhaitee?: string; // ISO date
    chargeHebdoJours?: number;
    localisation?: string;
    gouvernorat?: Gouvernorat;
    modaliteTravail?: ModaliteTravail; // nouvelle info
    urgent?: boolean;
    qualiteBrief?: NiveauBrief;
    statut: MissionStatut;
    clientId: number;
    freelanceSelectionneId?: number;
    datePublication: string;     // format ISO (YYYY-MM-DDTHH:mm:ss)
    categorie: MissionCategorie;
    transactionId?: number;
    mediaUrls?: string[];
    videoBriefUrl?: string;
    scoreMatching?: number; // Transient, from DTOs
    raisonsMatching?: string[];
    
    // Nouveaux champs ajoutés pour synchroniser avec le backend
    swipesRecus?: number;
    likesRecus?: number;
    verrouillee?: boolean;
    dateAffectation?: string; // format ISO (YYYY-MM-DDTHH:mm:ss)
    dateDerniereMiseAJour?: string; // format ISO (YYYY-MM-DDTHH:mm:ss)
    derniereActiviteAt?: string; // format ISO (YYYY-MM-DDTHH:mm:ss)
    candidatsCount?: number;
    badges?: string[];
    tailleEquipeClient?: number;
    presenceTechLead?: boolean;


     /** Milestones de paiement attachés à la mission */
  tranches?: TranchePaiement[];

  /** Livrables associés */
  livrables?: Livrable[];

  /** Politique et clôture contrat */
  closurePolicy?: ClosurePolicy;
  closedByClient?: boolean;
  closedByFreelancer?: boolean;
  contractTotalAmount?: number;
  }
  