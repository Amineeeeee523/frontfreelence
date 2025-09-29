// src/app/services/notification.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

import { environment } from '../../environments/environment';
import { Page } from '../models/pagination.model';
import { NotificationEntity } from '../models/notification.model';
import { NotificationStatus } from '../models/notification-status.enum';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly api = `${environment.apiUrl}/notifications`;

  constructor(private http: HttpClient) {}

  list(page = 0, size = 20, status?: NotificationStatus): Observable<Page<NotificationEntity>> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (status) params = params.set('status', status);
    console.log('[NotificationService] GET /notifications', { page, size, status });
    return this.http.get<Page<NotificationEntity>>(this.api, { params, withCredentials: true })
      .pipe(tap(res => console.log('[NotificationService] -> reçu', { totalElements: res.totalElements, page: res.number, size: res.size })));
  }

  markSeen(id: number): Observable<void> {
    console.log('[NotificationService] PATCH /notifications/{id}/seen', { id });
    return this.http.patch<void>(`${this.api}/${id}/seen`, {}, { withCredentials: true })
      .pipe(tap(() => console.log('[NotificationService] -> seen OK', { id })));
  }

  markRead(ids: number[]): Observable<void> {
    console.log('[NotificationService] PATCH /notifications/mark-read', { ids });
    return this.http.patch<void>(`${this.api}/mark-read`, ids, { withCredentials: true })
      .pipe(tap(() => console.log('[NotificationService] -> mark-read OK', { count: ids.length })));
  }

  click(id: number): Observable<void> {
    console.log('[NotificationService] POST /notifications/{id}/click', { id });
    return this.http.post<void>(`${this.api}/${id}/click`, {}, { withCredentials: true })
      .pipe(tap(() => console.log('[NotificationService] -> click OK', { id })));
  }
}


