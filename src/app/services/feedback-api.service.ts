// src/app/services/feedback-api.service.ts
/**
 * Service Angular pour les appels API de feedback.
 * 
 * Aligné sur le FeedbackController.java :
 * - @RestController @RequestMapping("/api/feedback")
 * - Hérite de BaseSecuredController (authentification via cookies)
 * - Utilise HttpServletRequest pour IP/User-Agent automatiquement
 * 
 * Endpoints mappés :
 * - GET  /eligibility?missionId={id} → FeedbackEligibilityDTO
 * - GET  /window?missionId={id} → FeedbackWindowDTO  
 * - POST /submit → FeedbackResponseDTO (avec HttpServletRequest)
 * - GET  /public?{query} → Page<FeedbackResponseDTO>
 * - GET  /summary?targetId={id}&audience={audience}&windowDays={days} → FeedbackSummaryDTO
 * - GET  /{feedbackId} → FeedbackResponseDTO (getOwnFeedback)
 * - PUT  /{feedbackId} → FeedbackResponseDTO (updateFeedback)
 * - DELETE /{feedbackId} → void (deleteFeedback)
 */
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../core/tokens/api-base-url.token';
import { Audience } from '../models/feedback.enums';
import {
  FeedbackCreateRequest,
  FeedbackEligibility,
  FeedbackListQuery,
  FeedbackResponse,
  FeedbackSummary,
  FeedbackWindow
} from '../models/feedback.models';
import { FeedbackUpdateRequest } from '../models/feedback.models';
import { Page } from '../models/pagination.model';
import { toHttpParams } from '../utils/http-params.util';

@Injectable({ providedIn: 'root' })
export class FeedbackApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${inject(API_BASE_URL)}/feedback`;

  constructor() {
    // Log de configuration au démarrage
    console.group('[FeedbackApiService] Configuration');
    console.log('🔧 API_BASE_URL:', inject(API_BASE_URL));
    console.log('🔧 Base URL complète:', this.baseUrl);
    console.log('🔧 Endpoints disponibles (alignés sur FeedbackController.java):');
    console.log('  - GET  /eligibility?missionId={id} → FeedbackEligibilityDTO');
    console.log('  - GET  /window?missionId={id} → FeedbackWindowDTO');
    console.log('  - POST /submit → FeedbackResponseDTO (avec HttpServletRequest)');
    console.log('  - GET  /public?{query} → Page<FeedbackResponseDTO>');
    console.log('  - GET  /summary?targetId={id}&audience={audience}&windowDays={days} → FeedbackSummaryDTO');
    console.log('  - GET  /{feedbackId} → FeedbackResponseDTO (getOwnFeedback)');
    console.log('  - PUT  /{feedbackId} → FeedbackResponseDTO (updateFeedback)');
    console.log('  - DELETE /{feedbackId} → void (deleteFeedback)');
    console.log('🔧 Authentification: BaseSecuredController (getCurrentUserId())');
    console.log('🔧 Headers: WithCredentials (cookies), User-Agent (automatique)');
    console.groupEnd();
  }

  /** 
   * Check feedback eligibility for a mission.
   * Maps to: GET /api/feedback/eligibility?missionId={id}
   * Backend: FeedbackController.eligibility(@RequestParam Long missionId)
   * Returns: FeedbackEligibilityDTO
   */
  eligibility(missionId: number): Observable<FeedbackEligibility> {
    const url = `${this.baseUrl}/eligibility`;
    const params = toHttpParams({ missionId });
    
    console.group(`[FeedbackApiService] Eligibility check for mission ${missionId}`);
    console.log('🌐 URL complète:', url);
    console.log('📋 Params:', { missionId });
    console.log('🔗 URL avec params:', `${url}?missionId=${missionId}`);
    console.log('🍪 WithCredentials: true (pour getCurrentUserId())');
    console.log('🔧 Backend: BaseSecuredController.getCurrentUserId()');
    console.groupEnd();
    
    return this.http.get<FeedbackEligibility>(url, {
      params,
      withCredentials: true
    });
  }

  /** 
   * Get the feedback window for a mission.
   * Maps to: GET /api/feedback/window?missionId={id}
   * Backend: FeedbackController.window(@RequestParam Long missionId)
   * Returns: FeedbackWindowDTO
   */
  window(missionId: number): Observable<FeedbackWindow> {
    const url = `${this.baseUrl}/window`;
    const params = toHttpParams({ missionId });
    
    console.group(`[FeedbackApiService] Window check for mission ${missionId}`);
    console.log('🌐 URL complète:', url);
    console.log('📋 Params:', { missionId });
    console.log('🔗 URL avec params:', `${url}?missionId=${missionId}`);
    console.log('🍪 WithCredentials: true');
    console.groupEnd();
    
    return this.http.get<FeedbackWindow>(url, {
      params,
      withCredentials: true
    });
  }

  /** 
   * Submit a feedback.
   * Maps to: POST /api/feedback/submit
   * Backend: FeedbackController.submit(@RequestBody FeedbackCreateRequestDTO body, HttpServletRequest request)
   * Returns: FeedbackResponseDTO
   * Note: Backend automatically extracts IP and User-Agent from HttpServletRequest
   */
  submit(body: FeedbackCreateRequest, opts?: { idempotencyKey?: string }): Observable<FeedbackResponse> {
    const url = `${this.baseUrl}/submit`;
    let headers = new HttpHeaders();
    
    // Note: Le backend Java n'utilise pas X-Idempotency-Key mais récupère IP/UA automatiquement
    // On garde l'option pour compatibilité future
    if (opts?.idempotencyKey) {
      headers = headers.set('X-Idempotency-Key', opts.idempotencyKey);
    }

    // === LOGS DEBUG SERVICE ===
    console.group('[FeedbackApiService] Submit');
    console.log('🌐 URL complète:', url);
    console.log('📤 Body (JSON):', JSON.stringify(body, null, 2));
    console.log('📤 Body (objet):', body);
    console.log('🔑 Headers:', headers.keys().map(key => `${key}: ${headers.get(key)}`));
    console.log('🔑 Headers complets:', headers);
    console.log('🍪 WithCredentials: true (pour getCurrentUserId())');
    console.log('📡 Méthode: POST');
    console.log('📋 Content-Type: application/json (automatique)');
    console.log('🔧 Backend: HttpServletRequest.getRemoteAddr() + User-Agent');
    console.log('🔧 Backend: BaseSecuredController.getCurrentUserId()');
    console.groupEnd();

    return this.http.post<FeedbackResponse>(url, body, {
      headers,
      withCredentials: true
    });
  }

  /** 
   * List public feedbacks using server-side paging.
   * Maps to: GET /api/feedback/public?{query}
   * Backend: FeedbackController.list(FeedbackListQueryDTO q)
   * Returns: Page<FeedbackResponseDTO>
   */
  listPublic(query: FeedbackListQuery): Observable<Page<FeedbackResponse>> {
    const url = `${this.baseUrl}/public`;
    const params = toHttpParams(query as unknown as Record<string, unknown>);
    
    console.group('[FeedbackApiService] List Public');
    console.log('🌐 URL complète:', url);
    console.log('📋 Query params:', query);
    console.log('🔗 URL avec params:', `${url}?${params.toString()}`);
    console.log('🍪 WithCredentials: true');
    console.groupEnd();
    
    return this.http.get<Page<FeedbackResponse>>(url, {
      params,
      withCredentials: true
    });
  }

  /** 
   * Summary stats for a target within a window.
   * Maps to: GET /api/feedback/summary?targetId={id}&audience={audience}&windowDays={days}
   * Backend: FeedbackController.summary(@RequestParam Long targetId, @RequestParam Audience audience, @RequestParam(defaultValue = "90") int windowDays)
   * Returns: FeedbackSummaryDTO
   */
  summary(params: { targetId: number; audience: Audience; windowDays?: number }): Observable<FeedbackSummary> {
    const { targetId, audience, windowDays = 90 } = params;
    const url = `${this.baseUrl}/summary`;
    const queryParams = toHttpParams({ targetId, audience, windowDays });
    
    console.group('[FeedbackApiService] Summary');
    console.log('🌐 URL complète:', url);
    console.log('📋 Params:', { targetId, audience, windowDays });
    console.log('🔗 URL avec params:', `${url}?${queryParams.toString()}`);
    console.log('🍪 WithCredentials: true');
    console.groupEnd();
    
    return this.http.get<FeedbackSummary>(url, {
      params: queryParams,
      withCredentials: true
    });
  }

  /**
   * Get a specific feedback by ID (own feedback only).
   * Maps to: GET /api/feedback/{feedbackId}
   * Backend: FeedbackController.getFeedback(@PathVariable Long feedbackId)
   * Returns: FeedbackResponseDTO
   */
  getFeedback(feedbackId: number): Observable<FeedbackResponse> {
    const url = `${this.baseUrl}/${feedbackId}`;

    console.group(`[FeedbackApiService] Get Feedback ${feedbackId}`);
    console.log('🌐 URL complète:', url);
    console.log('🍪 WithCredentials: true (pour getCurrentUserId())');
    console.log('🔧 Backend: BaseSecuredController.getCurrentUserId()');
    console.groupEnd();

    return this.http.get<FeedbackResponse>(url, {
      withCredentials: true
    });
  }

  /**
   * Get feedback by mission ID (own feedback only).
   * Maps to: GET /api/feedback/by-mission/{missionId}
   * Backend: FeedbackController.getFeedbackByMission(@PathVariable Long missionId)
   * Returns: FeedbackResponseDTO
   */
  getFeedbackByMission(missionId: number): Observable<FeedbackResponse> {
    const url = `${this.baseUrl}/by-mission/${missionId}`;

    console.group(`[FeedbackApiService] Get Feedback by Mission ${missionId}`);
    console.log('🌐 URL complète:', url);
    console.log('🍪 WithCredentials: true (pour getCurrentUserId())');
    console.log('🔧 Backend: BaseSecuredController.getCurrentUserId()');
    console.groupEnd();

    return this.http.get<FeedbackResponse>(url, {
      withCredentials: true
    });
  }

  /** 
   * Update a feedback.
   * Maps to: PUT /api/feedback/{feedbackId}
   * Backend: FeedbackController.updateFeedback(@PathVariable Long feedbackId, @RequestBody FeedbackUpdateRequestDTO body, HttpServletRequest request)
   * Returns: FeedbackResponseDTO
   * Note: Backend automatically extracts IP and User-Agent from HttpServletRequest
   */
  updateFeedback(feedbackId: number, body: FeedbackUpdateRequest, opts?: { idempotencyKey?: string }): Observable<FeedbackResponse> {
    const url = `${this.baseUrl}/${feedbackId}`;
    let headers = new HttpHeaders();
    
    // Note: Le backend Java n'utilise pas X-Idempotency-Key mais récupère IP/UA automatiquement
    // On garde l'option pour compatibilité future
    if (opts?.idempotencyKey) {
      headers = headers.set('X-Idempotency-Key', opts.idempotencyKey);
    }

    console.group(`[FeedbackApiService] Update Feedback ${feedbackId}`);
    console.log('🌐 URL complète:', url);
    console.log('📤 Body (JSON):', JSON.stringify(body, null, 2));
    console.log('📤 Body (objet):', body);
    console.log('🔑 Headers:', headers.keys().map(key => `${key}: ${headers.get(key)}`));
    console.log('🍪 WithCredentials: true (pour getCurrentUserId())');
    console.log('📡 Méthode: PUT');
    console.log('📋 Content-Type: application/json (automatique)');
    console.log('🔧 Backend: HttpServletRequest.getRemoteAddr() + User-Agent');
    console.log('🔧 Backend: BaseSecuredController.getCurrentUserId()');
    console.groupEnd();

    return this.http.put<FeedbackResponse>(url, body, {
      headers,
      withCredentials: true
    });
  }

  /** 
   * Delete a feedback.
   * Maps to: DELETE /api/feedback/{feedbackId}
   * Backend: FeedbackController.deleteFeedback(@PathVariable Long feedbackId)
   * Returns: void (204 No Content)
   */
  deleteFeedback(feedbackId: number): Observable<void> {
    const url = `${this.baseUrl}/${feedbackId}`;
    
    console.group(`[FeedbackApiService] Delete Feedback ${feedbackId}`);
    console.log('🌐 URL complète:', url);
    console.log('🍪 WithCredentials: true (pour getCurrentUserId())');
    console.log('🔧 Backend: BaseSecuredController.getCurrentUserId()');
    console.log('📡 Méthode: DELETE');
    console.log('📋 Retour attendu: 204 No Content');
    console.groupEnd();
    
    return this.http.delete<void>(url, {
      withCredentials: true
    });
  }
}


