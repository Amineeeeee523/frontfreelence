// src/app/core/models/devise.enum.ts
export enum Devise {
  TND = 'TND',
  EUR = 'EUR',
  USD = 'USD',
}

export function deviseFrom(value?: string | null): Devise {
  if (!value) return Devise.TND;
  const upper = value.trim().toUpperCase();
  switch (upper) {
    case 'EUR':
      return Devise.EUR;
    case 'USD':
      return Devise.USD;
    default:
      return Devise.TND;
  }
}


