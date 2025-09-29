// src/app/services/notification-preferences.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import { NotificationPreference } from '../models/notification-preference.model';

@Injectable({ providedIn: 'root' })
export class NotificationPreferencesService {
  private readonly api = `${environment.apiUrl}/notifications/preferences`;

  constructor(private http: HttpClient) {}

  list(): Observable<NotificationPreference[]> {
    return this.http.get<NotificationPreference[]>(this.api, { withCredentials: true });
  }

  upsert(prefs: NotificationPreference[]): Observable<void> {
    return this.http.put<void>(this.api, prefs, { withCredentials: true });
  }
}


