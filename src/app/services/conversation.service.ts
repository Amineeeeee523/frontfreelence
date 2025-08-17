import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import { ConversationSummary } from '../models/conversation-summary.model';
import { Conversation } from '../models/conversation.model';

@Injectable({ providedIn: 'root' })
export class ConversationService {
  private readonly api = `${environment.apiUrl}/conversations`;

  constructor(private http: HttpClient) {}

  /** Liste paginée des conversations de l’utilisateur courant */
  list(page = 0, size = 20): Observable<ConversationSummary[]> {
    const params = new HttpParams().set('page', page.toString()).set('size', size.toString());
    return this.http.get<ConversationSummary[]>(this.api, {
      params,
      withCredentials: true,
    });
  }

  /** Crée (ou récupère) une conversation pour une mission et un utilisateur donné */
  createOrGet(missionId: number, otherUserId: number): Observable<Conversation> {
    const params = new HttpParams()
      .set('missionId', missionId.toString())
      .set('otherUserId', otherUserId.toString());
    return this.http.post<Conversation>(`${this.api}/init`, {}, {
      params,
      withCredentials: true,
    });
  }
} 