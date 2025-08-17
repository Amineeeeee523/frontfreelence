// src/app/models/client-swipe.model.ts

import { Decision } from './swipe.model';

/** Interface représentant l'entité ClientSwipe */
export interface ClientSwipe {
    id: number;
    version: number; // Optimistic locking
    clientId: number;
    missionId: number;
    freelanceId: number;
    decision: Decision;
    dateSwipe: string; // ISO datetime
    dwellTimeMs?: number; // Temps de consultation en millisecondes (optionnel)
    aGenereMatch: boolean; // Indique si ce swipe a généré un match
}
