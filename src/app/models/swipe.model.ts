// src/app/models/swipe.model.ts

/** Enum correspondant à Swipe.Decision */
export enum Decision {
    LIKE    = 'LIKE',
    DISLIKE = 'DISLIKE',
}

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
}
  