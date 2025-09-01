// src/app/services/payout.service.ts
import { Injectable, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import {
  WithdrawalMethodCreateDTO,
  WithdrawalMethodResponseDTO,
  WithdrawalRequestDTO,
  WithdrawalRequestResponseDTO,
} from '../models';
import { API_BASE_URL } from '../core/tokens';

@Injectable({ providedIn: 'root' })
export class PayoutService {
  private readonly url: string;

  constructor(
    private http: HttpClient,
    @Inject(API_BASE_URL) private api: string,
  ) {
    this.url = `${this.api}/v1/payout`;
  }

  /** Ajouter une méthode de retrait (RIB / D17) */
  addMethod(dto: WithdrawalMethodCreateDTO): Observable<WithdrawalMethodResponseDTO> {
    return this.http.post<WithdrawalMethodResponseDTO>(
      `${this.url}/methods`,
      dto,
      { withCredentials: true },
    );
  }

  /** Lister les méthodes de retrait */
  listMethods(): Observable<WithdrawalMethodResponseDTO[]> {
    return this.http.get<WithdrawalMethodResponseDTO[]>(
      `${this.url}/methods`,
      { withCredentials: true },
    );
  }

  /** Demander un retrait */
  requestWithdrawal(dto: WithdrawalRequestDTO): Observable<WithdrawalRequestResponseDTO> {
    return this.http.post<WithdrawalRequestResponseDTO>(
      `${this.url}/withdrawals`,
      {
        ...dto,
        montant: (+dto.montant).toFixed(2), // décimal string
      },
      { withCredentials: true },
    );
  }

  /** Lister les demandes de retrait */
  listWithdrawals(): Observable<WithdrawalRequestResponseDTO[]> {
    return this.http.get<WithdrawalRequestResponseDTO[]>(
      `${this.url}/withdrawals`,
      { withCredentials: true },
    );
  }
}


