// src/app/services/tranche-paiement.service.ts
import { Injectable, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import {
  TranchePaiementCreateDTO,
  TranchePaiementResponseDTO,
  MissionPaiementSummaryDTO,
} from '../models/index';   // <- tout vient désormais du même dossier

import { API_BASE_URL } from '../core/tokens';

@Injectable({ providedIn: 'root' })
export class TranchePaiementService {
  private readonly url: string;

  constructor(
    private http: HttpClient,
    @Inject(API_BASE_URL) private api: string,
  ) {
    // LʼURL du backend contient déjà le préfixe /api, on évite donc le doublon
    this.url = `${this.api}/v1/paiement`;
  }

  /** Créer une tranche (milestone) */
  create(dto: TranchePaiementCreateDTO): Observable<TranchePaiementResponseDTO> {
    // 👉 Aligne sur backend: montantBrut (JsonAlias montant accepté)
    const montantValue = (dto as any).montantBrut ?? (dto as any).montant;
    const body: any = {
      ...dto,
      montantBrut: montantValue != null ? (+montantValue).toFixed(2) : undefined,
      montant: undefined,
      ordre: Number(dto.ordre),
      missionId: Number(dto.missionId)
    };
    if (montantValue != null) {
      body.montant = (+montantValue).toFixed(2);
    }
    
    return this.http.post<TranchePaiementResponseDTO>(
      `${this.url}/tranches`,
      body,
      {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }

  /** Générer le checkout Paymee */
  checkout(trancheId: number): Observable<TranchePaiementResponseDTO> {
    return this.http.post<TranchePaiementResponseDTO>(
      `${this.url}/tranches/${trancheId}/checkout`,
      null,
      { withCredentials: true }
    );
  }

  /** Valider le livrable (client) */
  validateDeliverable(
    trancheId: number,
  ): Observable<TranchePaiementResponseDTO> {
    return this.http.post<TranchePaiementResponseDTO>(
      `${this.url}/tranches/${trancheId}/valider`,
      null,
      { withCredentials: true }
    );
  }

  /** Paiement direct (Flouci - simulation supportée côté backend) */
  payerDirect(
    trancheId: number,
    xUserId?: number,
  ): Observable<TranchePaiementResponseDTO> {
    const headers: any = {};
    if (xUserId) headers['X-User-Id'] = String(xUserId);
    return this.http.post<TranchePaiementResponseDTO>(
      `${this.api}/v1/tranches/${trancheId}/payer-direct`,
      null,
      { headers, withCredentials: true }
    );
  }

  /** Récapitulatif complet d’une mission */
  missionSummary(
    missionId: number,
  ): Observable<MissionPaiementSummaryDTO> {
    return this.http.get<MissionPaiementSummaryDTO>(
      `${this.url}/missions/${missionId}/summary`,
      { withCredentials: true }
    );
  }

  /** Ouvre l'URL de paiement (Flouci simulation en direct) */
  openPaymentUrl(dto: TranchePaiementResponseDTO): void {
    if (dto.paymeePaymentUrl) {
      window.open(dto.paymeePaymentUrl, '_blank', 'noopener');
    }
  }

  /** Compat: alias vers openPaymentUrl */
  openPaymeeUrl(dto: TranchePaiementResponseDTO): void {
    this.openPaymentUrl(dto);
  }

  /** Marque une tranche comme finale */
  setFinale(trancheId: number, value: boolean): Observable<TranchePaiementResponseDTO> {
    return this.http.patch<TranchePaiementResponseDTO>(
      `${this.url}/tranches/${trancheId}/finale`,
      null,
      { params: { value: String(value) }, withCredentials: true }
    );
  }

  /** Marque une tranche comme requise */
  setRequired(trancheId: number, value: boolean): Observable<TranchePaiementResponseDTO> {
    return this.http.patch<TranchePaiementResponseDTO>(
      `${this.url}/tranches/${trancheId}/required`,
      null,
      { params: { value: String(value) }, withCredentials: true }
    );
  }
}
