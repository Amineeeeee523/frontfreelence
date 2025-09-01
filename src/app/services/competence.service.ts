// src/app/services/competence.service.ts
import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../core/tokens';
import { Competence } from '../models/competence.model';
import { MissionCategorie } from '../models/mission.model';

@Injectable({ providedIn: 'root' })
export class CompetenceService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  /** GET /api/competences → string[] or Competence[] depending on backend */
  getAll(): Observable<string[]> {
    return this.http.get<string[]>(`${this.baseUrl}/competences`);
  }

  /** GET /api/competences/by-categories?cat=A&cat=B → comp list for selected categories */
  getByCategories(categories: MissionCategorie[]): Observable<string[]> {
    let params = new HttpParams();
    (categories ?? []).forEach(cat => {
      if (cat) params = params.append('cat', String(cat));
    });
    return this.http.get<string[]>(`${this.baseUrl}/competences/by-categories`, { params });
  }

  /** GET /api/competences/search?q=...&categories=cat1,cat2 */
  search(query: string, categories?: MissionCategorie[]): Observable<string[]> {
    let params = new HttpParams().set('q', query ?? '');
    if (categories && categories.length) {
      params = params.set('categories', categories.join(','));
    }
    return this.http.get<string[]>(`${this.baseUrl}/competences/search`, { params });
  }
}


