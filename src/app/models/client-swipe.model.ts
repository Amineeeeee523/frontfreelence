// src/app/models/client-swipe.model.ts

import { Decision, Source } from './swipe.model';

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
    // AJOUTS backend
    dateAffichage?: string; // ISO datetime
    latenceAffichageMs?: number;
    positionDansPile?: number;
    sessionId?: string;
    source?: Source;
    langueUi?: 'FR' | 'AR' | 'EN';
    gouvernoratClient?:
      | 'TUNIS' | 'ARIANA' | 'BEN_AROUS' | 'MANOUBA' | 'NABEUL' | 'BIZERTE' | 'BEJA' | 'JENDOUBA' | 'ZAGHOUAN'
      | 'SILIANA' | 'KEF' | 'SOUSSE' | 'MONASTIR' | 'MAHDIA' | 'KAIROUAN' | 'KASSERINE' | 'SIDI_BOUZID'
      | 'SFAX' | 'GABES' | 'MEDENINE' | 'TATAOUINE' | 'GAFSA' | 'TOZEUR' | 'KEBILI';
    superInvite?: boolean;
    raisonRejet?: 'COUT_ELEVE' | 'EXPERIENCE_INSUFFISANTE' | 'DISPONIBILITE' | 'LOCALISATION' | 'LANGUE' | 'ADEQUATION_CULTURE' | 'QUALITE_PORTFOLIO' | 'AUTRE';
    raisonRejetDetails?: string;
    messageInviteAuto?: string;
    algoVersion?: string;
    estUndo?: boolean;
    annuleSwipeId?: number;
    ipHash?: string;
    campagneAb?: string;
}
