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
  }
  