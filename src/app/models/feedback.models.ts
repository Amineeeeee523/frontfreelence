// src/app/models/feedback.models.ts
import { Audience, CriterionType, FeedbackRole } from './feedback.enums';

export type Distribution = { [key: number]: number };

export interface ScoreItem {
  criterion: CriterionType;
  score: number;
}

export interface FeedbackCreateRequest {
  missionId: number;
  targetId: number;
  role: FeedbackRole;
  scores: ScoreItem[];
  comment: string;
  idempotencyKey: string;
}

export interface FeedbackUpdateRequest {
  comment: string;
  scores: ScoreItem[];
  idempotencyKey: string;
}

export interface FeedbackResponse {
  id: number;
  missionId: number;
  issuerId: number;
  targetId: number;
  role: FeedbackRole;
  overallRating: number;
  comment: string;
  language: string;
  submittedAt: string; // ISO Instant
  publishedAt: string; // ISO Instant
}

export interface FeedbackListQuery {
  targetId: number;
  audience: Audience;
  periodStart: string; // ISO Instant
  periodEnd: string;   // ISO Instant
  minRating: number | null | undefined;
  hasText: boolean | null | undefined;
  page: number;   // default backend 0
  size: number;   // default backend 10
  sort: string;   // ex: "publishedAt,DESC"
}

export interface FeedbackSummary {
  targetId: number;
  avg: number;          // BigDecimal → number
  count: number;
  decayedAvg: number;   // BigDecimal → number
  distribution: Distribution; // Map<Integer,Integer>
  topKeywords: string[];
}

export interface FeedbackWindow {
  openedAt: string; // ISO Instant
  expiresAt: string; // ISO Instant
  clientSubmitted: boolean;
  freelancerSubmitted: boolean;
  doubleBlind: boolean;
  autoPublishedAt: string; // ISO Instant
}

export interface FeedbackEligibility {
  eligible: boolean;
  reason: string;
  deadline: string; // ISO Instant
}

export interface SubmittedPayload { missionId: number; id: number }
export interface PublishedPayload { missionId: number; ids: number[] }
export interface UpdatedPayload { missionId: number; id: number }
export interface DeletedPayload { missionId: number; id: number }


