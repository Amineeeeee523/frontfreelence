import { ChatMessageType } from './chat-message.model';

export interface Conversation {
  id: number;
  version?: number;
  missionId?: number;
  clientId?: number;
  freelanceId?: number;
  createdAt?: string;
  lastMessageAt?: string;
  lastMessageContent?: string;
  lastMessageType?: ChatMessageType;
} 