// src/app/core/models/withdrawal-method.model.ts
export enum WithdrawalMethodType {
  RIB = 'RIB',
  D17 = 'D17',
}

export interface WithdrawalMethod {
  id: number;
  version?: number;
  type: WithdrawalMethodType;
  rib?: string;
  walletNumber?: string;
  principal: boolean;
  dateAjout: string; // ISO datetime
}


