// src/app/models/notification-dto.model.ts
import { NotificationType } from './notification-type.enum';

export interface NotificationDto {
  id: number;
  type: NotificationType;
  title: string;
  data: Record<string, unknown> | null;
  createdAt: string; // ISO timestamp (Instant)
}


