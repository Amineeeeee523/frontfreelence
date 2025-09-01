// src/app/services/missions.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import { Mission } from '../models/mission.model';
import { MissionCard } from '../models/mission-card.model';
import { MissionSummary } from '../models/mission-summary.model';
import { MissionRecommendation } from '../models/mission-recommendation.model';
import { Swipe, Decision as SwipeDecision } from '../models/swipe.model';
import { ClientSwipe } from '../models/client-swipe.model';
import { MissionDetailView } from '../models/mission-detail-view.model';

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
  getMissionsForSwipe(freelanceId: number, categorie?: string): Observable<MissionSummary[]> {
    let params = new HttpParams().set('freelanceId', freelanceId.toString());

    if (categorie) {
      params = params.append('categorie', categorie);
    }

    return this.http.get<MissionSummary[]>(`${this.swipeApi}/available`, { params, withCredentials: true });
  }

  /** 7. Enregistrement d’un swipe freelance */
  swipeMission(missionId: number, freelanceId: number, decision: SwipeDecision, dwellTimeMs?: number): Observable<Swipe> {
    let params = new HttpParams().set('decision', decision);
    if (typeof dwellTimeMs === 'number') params = params.set('dwellTimeMs', dwellTimeMs.toString());
    return this.http.post<Swipe>(`${this.swipeApi}/mission/${missionId}/freelance/${freelanceId}`,
      {}, { params, withCredentials: true });
  }

  /** 8. Affectation manuelle d’un freelance (missions controller) */
  assignFreelanceToMission(missionId: number, freelanceId: number): Observable<Mission> {
    return this.http.put<Mission>(`${this.missionsApi}/${missionId}/assign/${freelanceId}`, {}, { withCredentials: true });
  }

  /** 9. Liste des missions d’un client → MissionCard[] */
  getMissionsByClient(clientId: number): Observable<MissionCard[]> {
    return this.http.get<MissionCard[]>(`${this.missionsApi}/client/${clientId}`, { withCredentials: true });
  }

  /** 9-bis. Liste des missions du client authentifié (header X-User-Id côté backend en local) */
  getMyMissions(): Observable<MissionCard[]> {
    return this.http.get<MissionCard[]>(`${this.missionsApi}/client/me`, { withCredentials: true });
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
    decision: SwipeDecision,
    dwellTimeMs?: number
  ): Observable<ClientSwipe> {
    let params = new HttpParams().set('decision', decision);
    if (typeof dwellTimeMs === 'number') params = params.set('dwellTimeMs', dwellTimeMs.toString());
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

  /** Verrouiller / déverrouiller / expirer si deadline dépassée */
  lockMission(missionId: number): Observable<Mission> {
    return this.http.post<Mission>(`${this.missionsApi}/${missionId}/lock`, null, { withCredentials: true });
  }

  unlockMission(missionId: number): Observable<Mission> {
    return this.http.post<Mission>(`${this.missionsApi}/${missionId}/unlock`, null, { withCredentials: true });
  }

  expireIfDeadlinePassed(missionId: number): Observable<Mission> {
    return this.http.post<Mission>(`${this.missionsApi}/${missionId}/expire-if-deadline-passed`, null, { withCredentials: true });
  }

  /** Patch localisation / modalité / skills / media */
  updateLocalisation(missionId: number, value: string): Observable<Mission> {
    return this.http.patch<Mission>(`${this.missionsApi}/${missionId}/localisation`, null, {
      params: { value },
      withCredentials: true
    });
  }

  addRequiredSkill(missionId: number, skill: string): Observable<Mission> {
    return this.http.post<Mission>(`${this.missionsApi}/${missionId}/skills`, null, {
      params: { skill },
      withCredentials: true
    });
  }

  removeRequiredSkill(missionId: number, skill: string): Observable<Mission> {
    return this.http.delete<Mission>(`${this.missionsApi}/${missionId}/skills`, {
      params: { skill },
      withCredentials: true
    });
  }

  addMediaUrl(missionId: number, url: string): Observable<Mission> {
    return this.http.post<Mission>(`${this.missionsApi}/${missionId}/media`, null, {
      params: { url },
      withCredentials: true
    });
  }

  removeMediaUrl(missionId: number, url: string): Observable<Mission> {
    return this.http.delete<Mission>(`${this.missionsApi}/${missionId}/media`, {
      params: { url },
      withCredentials: true
    });
  }

  changeModalite(missionId: number, value: string): Observable<Mission> {
    return this.http.patch<Mission>(`${this.missionsApi}/${missionId}/modalite`, null, {
      params: { value },
      withCredentials: true
    });
  }

  /** Politique de clôture et confirmations */
  updateClosurePolicy(missionId: number, value: string): Observable<Mission> {
    return this.http.patch<Mission>(`${this.missionsApi}/${missionId}/closure-policy`, null, {
      params: { value },
      withCredentials: true
    });
  }

  updateContractTotal(missionId: number, amount: number): Observable<Mission> {
    return this.http.patch<Mission>(`${this.missionsApi}/${missionId}/contract-total`, null, {
      params: { amount: amount.toString() },
      withCredentials: true
    });
  }

  confirmCloseByClient(missionId: number): Observable<Mission> {
    return this.http.post<Mission>(`${this.missionsApi}/${missionId}/confirm-close/client`, null, { withCredentials: true });
  }

  confirmCloseByFreelancer(missionId: number, freelancerId: number): Observable<Mission> {
    // Backend expects header X-Freelancer-Id; we can pass via params or separate http options
    return this.http.post<Mission>(`${this.missionsApi}/${missionId}/confirm-close/freelancer`, null, {
      headers: { 'X-Freelancer-Id': String(freelancerId) },
      withCredentials: true
    });
  }

  /** Recommandations */
  getRecommandations(freelanceId: number): Observable<MissionRecommendation[]> {
    const params = new HttpParams().set('freelanceId', freelanceId.toString());
    return this.http.get<MissionRecommendation[]>(`${this.swipeApi}/recommandations`, { params, withCredentials: true });
  }

  /** Détails d'une mission avec vue agrégée (pour overlay client) */
  getMissionDetailView(id: number, userId: number): Observable<MissionDetailView> {
    return this.http.get<MissionDetailView>(`${this.missionsApi}/${id}/detail-view`, {
      headers: { 'X-User-Id': String(userId) },
      withCredentials: true
    });
  }
}
