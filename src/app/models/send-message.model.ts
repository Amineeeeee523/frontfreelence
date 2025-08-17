import { ChatMessageType } from './chat-message.model';

export interface SendMessageRequest {
  conversationId: number;
  content: string;
  type: ChatMessageType;
  fileUrl?: string | null;
  fileType?: string | null;
} 