// src/app/services/missions.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import { Mission } from '../models/mission.model';
import { MissionSummary } from '../models/mission-summary.model';
import { MissionRecommendation } from '../models/mission-recommendation.model';
import { Swipe, Decision as SwipeDecision } from '../models/swipe.model';
import { ClientSwipe } from '../models/client-swipe.model';

@Injectable({
  providedIn: 'root'
})
export class MissionsService {
  private readonly missionsApi = `${environment.apiUrl}/missions`;
  private readonly swipeApi    = `${environment.apiUrl}/swipes`;

  constructor(private http: HttpClient) {}

  /** 1. Création d’une mission */
  createMission(mission: Mission): Observable<Mission> {
    return this.http.post<Mission>(this.missionsApi, mission, { withCredentials: true });
  }

  /** 2. Récupérer toutes les missions */
  getAllMissions(): Observable<Mission[]> {
    return this.http.get<Mission[]>(this.missionsApi, { withCredentials: true });
  }

  /** 3. Détails d’une mission */
  getMissionById(id: number): Observable<Mission> {
    return this.http.get<Mission>(`${this.missionsApi}/${id}`, { withCredentials: true });
  }

  /** 4. Mise à jour d’une mission */
  updateMission(id: number, mission: Mission): Observable<Mission> {
    return this.http.put<Mission>(`${this.missionsApi}/${id}`, mission, { withCredentials: true });
  }

  /** 5. Suppression d’une mission */
  deleteMission(id: number): Observable<void> {
    return this.http.delete<void>(`${this.missionsApi}/${id}`, { withCredentials: true });
  }

  /** 6. Missions disponibles pour swipe (Tinder-style) */
  getMissionsForSwipe(freelanceId: number, categorie?: string): Observable<Mission[]> {
    let params = new HttpParams().set('freelanceId', freelanceId.toString());

    if (categorie) {
      params = params.append('categorie', categorie);
    }

    return this.http.get<Mission[]>(`${this.swipeApi}/available`, { params, withCredentials: true });
  }

  /** 7. Enregistrement d’un swipe freelance */
  swipeMission(missionId: number, freelanceId: number, decision: SwipeDecision): Observable<Swipe> {
    const params = new HttpParams().set('decision', decision);
    return this.http.post<Swipe>(`${this.swipeApi}/mission/${missionId}/freelance/${freelanceId}`,
      {}, { params, withCredentials: true });
  }

  /** 8. Affectation manuelle d’un freelance */
  assignFreelanceToMission(missionId: number, freelanceId: number): Observable<void> {
    const params = new HttpParams().set('freelanceId', freelanceId.toString());
    return this.http.post<void>(`${this.swipeApi}/mission/${missionId}/assign`, {}, { params, withCredentials: true });
  }

  /** 9. Liste des missions d’un client */
  getMissionsByClient(clientId: number): Observable<Mission[]> {
    return this.http.get<Mission[]>(`${this.missionsApi}/client/${clientId}`, { withCredentials: true });
  }

  /** 10. Liste des missions d’un freelance */
  getMissionsByFreelance(freelanceId: number): Observable<Mission[]> {
    return this.http.get<Mission[]>(`${this.missionsApi}/freelance/${freelanceId}`, { withCredentials: true });
  }

  /** 7-bis. Swipe du client vers un freelance */
  clientSwipeFreelance(
    missionId: number,
    clientId: number,
    freelanceId: number,
    decision: SwipeDecision
  ): Observable<ClientSwipe> {
    const params = new HttpParams().set('decision', decision);
    return this.http.post<ClientSwipe>(`${this.swipeApi}/mission/${missionId}/client/${clientId}/freelance/${freelanceId}`,
      {}, { params, withCredentials: true });
  }

  /** Annuler un swipe freelance */
  removeSwipeFreelance(missionId: number, freelanceId: number): Observable<void> {
    return this.http.delete<void>(`${this.swipeApi}/mission/${missionId}/freelance/${freelanceId}`,
      { withCredentials: true });
  }

  /** Annuler un swipe client → freelance */
  removeSwipeClient(
    missionId: number,
    clientId: number,
    freelanceId: number
  ): Observable<void> {
    return this.http.delete<void>(`${this.swipeApi}/mission/${missionId}/client/${clientId}/freelance/${freelanceId}`,
      { withCredentials: true });
  }

  /** Recommandations */
  getRecommandations(freelanceId: number): Observable<MissionRecommendation[]> {
    const params = new HttpParams().set('freelanceId', freelanceId.toString());
    return this.http.get<MissionRecommendation[]>(`${this.swipeApi}/recommandations`, { params, withCredentials: true });
  }
}
