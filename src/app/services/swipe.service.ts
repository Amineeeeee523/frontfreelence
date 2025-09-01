import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import { MissionRecommendation } from '../models/mission-recommendation.model';
import { MissionSummary } from '../models/mission-summary.model';
import { Swipe, Decision as SwipeDecision } from '../models/swipe.model';
import { ClientSwipe } from '../models/client-swipe.model';
import { Mission } from '../models/mission.model';
import { FreelanceSummary } from '../models/freelance-summary.model';

@Injectable({ providedIn: 'root' })
export class SwipeService {
  private readonly api = `${environment.apiUrl}/swipes`;

  constructor(private http: HttpClient) {}

  /** 1. Missions disponibles pour swipe */
  getMissionsForSwipe(freelanceId: number, categorie?: string): Observable<MissionSummary[]> {
    let params = new HttpParams().set('freelanceId', freelanceId.toString());
    if (categorie) {
      params = params.append('categorie', categorie);
    }
    // Backend renvoie MissionSummaryDTO
    return this.http.get<MissionSummary[]>(`${this.api}/available`, { params, withCredentials: true });
  }

  /** 2. Swipe FREELANCE → mission */
  swipeMission(missionId: number, freelanceId: number, decision: SwipeDecision, dwellTimeMs?: number): Observable<Swipe> {
    let params = new HttpParams().set('decision', decision);
    if (typeof dwellTimeMs === 'number') params = params.set('dwellTimeMs', dwellTimeMs.toString());
    return this.http.post<Swipe>(`${this.api}/mission/${missionId}/freelance/${freelanceId}`, {}, { params, withCredentials: true });
  }

  /** 3. Swipe CLIENT → freelance */
  clientSwipeFreelance(missionId: number, clientId: number, freelanceId: number, decision: SwipeDecision, dwellTimeMs?: number): Observable<ClientSwipe> {
    let params = new HttpParams().set('decision', decision);
    if (typeof dwellTimeMs === 'number') params = params.set('dwellTimeMs', dwellTimeMs.toString());
    return this.http.post<ClientSwipe>(`${this.api}/mission/${missionId}/client/${clientId}/freelance/${freelanceId}`, {}, { params, withCredentials: true });
  }

  /** 4. Annuler swipe FREELANCE */
  removeSwipeFreelance(missionId: number, freelanceId: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/mission/${missionId}/freelance/${freelanceId}`, { withCredentials: true });
  }

  /** 5. Annuler swipe CLIENT */
  removeSwipeClient(missionId: number, clientId: number, freelanceId: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/mission/${missionId}/client/${clientId}/freelance/${freelanceId}`, { withCredentials: true });
  }

  /** 6. Affectation manuelle d’un freelance */
  assignFreelanceToMission(missionId: number, freelanceId: number): Observable<void> {
    const params = new HttpParams().set('freelanceId', freelanceId.toString());
    return this.http.post<void>(`${this.api}/mission/${missionId}/assign`, {}, { params, withCredentials: true });
  }

  /** 7. Recommandations */
  getRecommandations(freelanceId: number): Observable<MissionRecommendation[]> {
    const params = new HttpParams().set('freelanceId', freelanceId.toString());
    return this.http.get<MissionRecommendation[]>(`${this.api}/recommandations`, { params, withCredentials: true });
  }



  /** 8. Récupérer les freelances qui ont liké une mission (vue client) */
getFreelancersWhoLikedMission(missionId: number, clientId: number): Observable<FreelanceSummary[]> {
  const params = new HttpParams().set('clientId', clientId.toString());
  return this.http.get<FreelanceSummary[]>(`${this.api}/mission/${missionId}/likes`, { params, withCredentials: true });
}








/** 9. Explorer les freelances compatibles avec une mission (matching compétences) */
exploreFreelancers(missionId: number, clientId: number): Observable<FreelanceSummary[]> {
  const params = new HttpParams().set('clientId', clientId.toString());
  return this.http.get<FreelanceSummary[]>(
    `${this.api}/mission/${missionId}/explore`,
    { params, withCredentials: true }
  );
}

} 