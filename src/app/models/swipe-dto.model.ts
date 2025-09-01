// src/app/models/swipe-dto.model.ts

import { Decision, Source } from './swipe.model';

/** Interface correspondant au DTO SwipeDTO */
export interface SwipeDTO {
  id: number;
  missionId: number;
  freelanceId: number;
  decision: Decision;
  dateSwipe: string; // ISO datetime
  // Analytics optionnelles
  generatedMatch: boolean;
  dwellTimeMs?: number;

  // AJOUTS backend
  dateAffichage?: string; // ISO datetime
  latenceAffichageMs?: number;
  positionDansPile?: number;
  sessionId?: string;
  source?: Source;                   // WEB/ANDROID/IOS
  langueUi?: 'FR' | 'AR' | 'EN';     // FR/AR/EN
  gouvernoratFreelance?:
    | 'TUNIS' | 'ARIANA' | 'BEN_AROUS' | 'MANOUBA' | 'NABEUL' | 'BIZERTE' | 'BEJA' | 'JENDOUBA' | 'ZAGHOUAN'
    | 'SILIANA' | 'KEF' | 'SOUSSE' | 'MONASTIR' | 'MAHDIA' | 'KAIROUAN' | 'KASSERINE' | 'SIDI_BOUZID'
    | 'SFAX' | 'GABES' | 'MEDENINE' | 'TATAOUINE' | 'GAFSA' | 'TOZEUR' | 'KEBILI';
  superLike?: boolean;               // true si super-like
  raisonRejet?: 'BUDGET' | 'COMPETENCES' | 'DISPONIBILITE' | 'LOCALISATION' | 'LANGUE' | 'QUALITE_BRIEF' | 'AUTRE';
  raisonRejetDetails?: string;
  messageIntroAuto?: string;
  algoVersion?: string;
  estUndo?: boolean;                 // undo du swipe
  annuleSwipeId?: number;
  ipHash?: string;
  campagneAb?: string;
}
