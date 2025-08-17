// src/app/models/swipe-dto.model.ts

import { Decision } from './swipe.model';

/** Interface correspondant au DTO SwipeDTO */
export interface SwipeDTO {
  id: number;
  missionId: number;
  freelanceId: number;
  clientId: number;
  decision: Decision;
  dateSwipe: string; // ISO datetime
  generatedMatch?: boolean;
  dwellTimeMs?: number;
}
