import { MissionCategorie } from './mission.model';

export interface MatchNotification {
    conversationId: number;
    missionId: number;
    clientId: number;
    freelanceId: number;
    missionTitre: string;
    clientNom: string;
    freelanceNom: string;
    clientPhotoUrl?: string;
    freelancePhotoUrl?: string;
    sentAt: string; // ISO date string
    // AJOUTS backend
    superLike?: boolean;
    superInvite?: boolean;
    missionGouvernorat?:
      | 'TUNIS' | 'ARIANA' | 'BEN_AROUS' | 'MANOUBA' | 'NABEUL' | 'BIZERTE' | 'BEJA' | 'JENDOUBA' | 'ZAGHOUAN'
      | 'SILIANA' | 'KEF' | 'SOUSSE' | 'MONASTIR' | 'MAHDIA' | 'KAIROUAN' | 'KASSERINE' | 'SIDI_BOUZID'
      | 'SFAX' | 'GABES' | 'MEDENINE' | 'TATAOUINE' | 'GAFSA' | 'TOZEUR' | 'KEBILI';
    missionCategorie?: MissionCategorie;
}
  