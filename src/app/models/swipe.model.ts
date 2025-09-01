// src/app/models/swipe.model.ts

/** Enum correspondant à Swipe.Decision */
export enum Decision {
    LIKE    = 'LIKE',
    DISLIKE = 'DISLIKE',
    SUPERLIKE = 'SUPERLIKE',
}

export enum Source { WEB = 'WEB', ANDROID = 'ANDROID', IOS = 'IOS' }

// Aligner avec Mission.Gouvernorat sans importer pour éviter cycles
export type Gouvernorat =
  | 'TUNIS' | 'ARIANA' | 'BEN_AROUS' | 'MANOUBA' | 'NABEUL' | 'BIZERTE' | 'BEJA' | 'JENDOUBA' | 'ZAGHOUAN'
  | 'SILIANA' | 'KEF' | 'SOUSSE' | 'MONASTIR' | 'MAHDIA' | 'KAIROUAN' | 'KASSERINE' | 'SIDI_BOUZID'
  | 'SFAX' | 'GABES' | 'MEDENINE' | 'TATAOUINE' | 'GAFSA' | 'TOZEUR' | 'KEBILI';

// Aligner avec Utilisateur.Langue
export type Langue = 'FR' | 'AR' | 'EN';

/** Interface représentant l'entité Swipe */
export interface Swipe {
    id: number;
    version: number; // Optimistic locking
    freelanceId: number;
    missionId: number;
    decision: Decision;
    dateSwipe: string; // ISO datetime, ex: "2025-07-16T14:30:00"
    dwellTimeMs?: number; // Temps de consultation en millisecondes (optionnel)
    aGenereMatch: boolean; // Indique si ce swipe a généré un match
    // AJOUTS backend
    dateAffichage?: string; // ISO datetime
    latenceAffichageMs?: number;
    positionDansPile?: number;
    sessionId?: string;
    source?: Source;
    langueUi?: Langue;
    gouvernoratFreelance?: Gouvernorat;
    superLike?: boolean;
    raisonRejet?: 'BUDGET' | 'COMPETENCES' | 'DISPONIBILITE' | 'LOCALISATION' | 'LANGUE' | 'QUALITE_BRIEF' | 'AUTRE';
    raisonRejetDetails?: string;
    messageIntroAuto?: string;
    algoVersion?: string;
    estUndo?: boolean;
    annuleSwipeId?: number;
    ipHash?: string;
    campagneAb?: string;
}
  