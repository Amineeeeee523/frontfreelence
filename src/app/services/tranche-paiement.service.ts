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
    // 👉 Force la conversion en Number pour Jackson
    const body = {
      ...dto,
      montant: (+dto.montant).toFixed(2), // envoyé comme string décimal "2000.00"
      ordre: Number(dto.ordre),
      missionId: Number(dto.missionId)
    };
    
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
    );
  }

  /** Valider le livrable (client) */
  validateDeliverable(
    trancheId: number,
  ): Observable<TranchePaiementResponseDTO> {
    return this.http.post<TranchePaiementResponseDTO>(
      `${this.url}/tranches/${trancheId}/valider`,
      null,
    );
  }

  /** Récapitulatif complet d’une mission */
  missionSummary(
    missionId: number,
  ): Observable<MissionPaiementSummaryDTO> {
    return this.http.get<MissionPaiementSummaryDTO>(
      `${this.url}/missions/${missionId}/summary`,
    );
  }

  /** Ouvre la page de paiement Paymee */
  openPaymeeUrl(dto: TranchePaiementResponseDTO): void {
    if (dto.paymeePaymentUrl) {
      window.open(dto.paymeePaymentUrl, '_blank', 'noopener');
    }
  }
}
