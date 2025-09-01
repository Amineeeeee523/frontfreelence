// src/app/models/competence.model.ts
import { MissionCategorie } from './mission.model';

export interface Competence {
  key: string; // canonical skill name (e.g., "JavaScript")
  labels?: Record<string, string>; // optional i18n labels, e.g., { fr: 'JavaScript', ar: 'جافاسكريبت' }
  categories?: MissionCategorie[]; // optional categories associated
}


