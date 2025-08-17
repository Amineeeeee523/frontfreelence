import { ChatMessageType } from './chat-message.model';

export interface ConversationSummary {
  conversationId: number;
  missionId: number;
  missionTitre: string;

  otherUserId: number;
  otherUserNomComplet: string;
  otherUserPhotoUrl: string | null;

  lastMessagePreview: string | null;
  lastMessageType: ChatMessageType | null;
  lastMessageAt: string | null; // ISO datetime
  /**
   * ID of the sender of the last message.
   * This field is only populated client-side when new messages arrive via socket.
   * It is not provided by the backend ConversationSummaryDto anymore, so keep it optional.
   */
  lastMessageSenderId?: number | null;
  unreadCount: number;
} 