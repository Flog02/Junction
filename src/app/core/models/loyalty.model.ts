// src/app/core/models/loyalty.model.ts

export interface LoyaltyHistory {
    id: string;
    date: Date;
    orderId: string | null;
    points: number;
    type: 'earned' | 'redeemed' | 'expired' | 'adjustment';
    description: string;
  }
  
  export interface LoyaltyReward {
    id: string;
    name: string;
    description: string;
    pointsCost: number;
    expiryDate: Date | null;
    status: 'available' | 'redeemed';
    redeemedDate: Date | null;
  }
  
  export interface UserLoyalty {
    userId: string;
    points: number;
    totalPointsEarned: number;
    tier: 'bronze' | 'silver' | 'gold' | 'platinum';
    tierExpiryDate: Date;
    nextTierProgress: number;
    lastPointsEarnedDate: Date;
    history: LoyaltyHistory[];
    rewards: LoyaltyReward[];
    monthlyCoffeeCount: number;
    streakDays: number;
    lastStreakDate: Date;
  }