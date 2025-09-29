// src/app/models/notification.model.ts
import { NotificationCategory } from './notification-category.enum';
import { NotificationType } from './notification-type.enum';
import { NotificationPriority } from './notification-priority.enum';
import { NotificationStatus } from './notification-status.enum';

export interface NotificationEntity {
  id: number;
  version?: number;
  userId: number;
  category: NotificationCategory;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  body?: string;
  /** JSON string payload as stored server-side */
  data?: string;
  actionUrl?: string;
  createdAt: string; // ISO string from Instant
  seenAt?: string;
  readAt?: string;
  status: NotificationStatus;
  sourceEventId?: string;
  idempotencyKey?: string;
}


