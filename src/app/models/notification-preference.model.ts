// src/app/models/notification-preference.model.ts
import { NotificationCategory } from './notification-category.enum';

export interface NotificationPreference {
  id?: number;
  userId?: number;
  category: NotificationCategory;
  wsEnabled: boolean;
  pushEnabled: boolean;
  emailEnabled: boolean;
  muteUntil?: string; // ISO Instant
  rateLimitPerHour?: number;
}


