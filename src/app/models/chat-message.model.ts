export enum ChatMessageType {
  TEXT = 'TEXT',
  LINK = 'LINK',
  FILE = 'FILE',
}

export enum MessageStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  FAILED = 'FAILED'
}

export interface ChatMessage {
  id?: number;
  tempId?: string;
  conversationId: number;
  senderId: number;
  receiverId: number;
  content: string;
  type: ChatMessageType;
  fileUrl?: string | null;
  fileType?: string | null;
  timestamp: string; // ISO datetime sentAt
  seen: boolean;
  status?: MessageStatus;
}
