import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { environment } from '../../environments/environment';
import { Livrable, StatusLivrable, CreateLivrableRequest } from '../models/livrable.model';
import { FileStorageService } from './file-storage.service';

@Injectable({
  providedIn: 'root'
})
export class LivrableService {
  private readonly api = `${environment.apiUrl}/livrables`;

  constructor(
    private http: HttpClient,
    private fileStorageService: FileStorageService
  ) {}

  uploadLivrable(meta: CreateLivrableRequest, fichiers: File[], freelancerId: number): Observable<Livrable> {
    const formData = new FormData();
    formData.append('meta', new Blob([JSON.stringify(meta)], { type: 'application/json' }));
    fichiers.forEach(file => formData.append('fichiers', file));

    const headers = new HttpHeaders().set('X-Freelancer-Id', freelancerId.toString());

    return this.http.post<Livrable>(`${this.api}/upload`, formData, {
      headers,
      withCredentials: true
    });
  }

  getLivrablesForMission(missionId: number, status?: StatusLivrable): Observable<Livrable[]> {
    let params = new HttpParams();
    if (status) {
      params = params.set('status', status);
    }
    return this.http.get<Livrable[]>(`${this.api}/mission/${missionId}`, { params, withCredentials: true })
      .pipe(
        map(livrables => livrables.map(livrable => ({
          ...livrable,
          cheminsFichiers: livrable.cheminsFichiers?.map(path => this.fileStorageService.makeAbsolute(path))
        })))
      );
  }

  getLivrablesForFreelancer(freelancerId: number): Observable<Livrable[]> {
    return this.http.get<Livrable[]>(`${this.api}/freelancer/${freelancerId}`, { withCredentials: true })
      .pipe(
        map(livrables => livrables.map(livrable => ({
          ...livrable,
          cheminsFichiers: livrable.cheminsFichiers?.map(path => this.fileStorageService.makeAbsolute(path))
        })))
      );
  }

  validateLivrable(livrableId: number, clientId: number): Observable<void> {
    const headers = new HttpHeaders().set('X-Client-Id', clientId.toString());
    return this.http.put<void>(`${this.api}/${livrableId}/valider`, {}, { headers, withCredentials: true });
  }

  rejectLivrable(livrableId: number, clientId: number, raison?: string): Observable<void> {
    const headers = new HttpHeaders().set('X-Client-Id', clientId.toString());
    return this.http.put<void>(`${this.api}/${livrableId}/rejeter`, raison || '', { headers, withCredentials: true });
  }
}
