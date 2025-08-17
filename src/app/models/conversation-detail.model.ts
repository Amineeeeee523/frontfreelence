import { ChatMessage } from './chat-message.model';

export interface ConversationDetail {
  conversationId: number;
  missionId: number;
  missionTitre: string;

  otherUserId: number;
  otherUserNomComplet: string;
  otherUserPhotoUrl?: string;

  messages: ChatMessage[];
} 