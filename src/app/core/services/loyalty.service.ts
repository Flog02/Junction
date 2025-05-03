// src/app/core/services/loyalty.service.ts

import { Injectable } from '@angular/core';
import { 
  Firestore, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  arrayUnion,
  increment,
  collection,
  query,
  where,
  orderBy,
  limit,
  DocumentReference
} from '@angular/fire/firestore';
import { Auth, user } from '@angular/fire/auth';
import { Observable, from, of, map, switchMap, tap } from 'rxjs';
import { UserLoyalty, LoyaltyHistory, LoyaltyReward } from '../models/loyalty.model';
import { NotificationService } from './notification.service';

// Define tier thresholds and benefits
interface LoyaltyTier {
  name: 'bronze' | 'silver' | 'gold' | 'platinum';
  threshold: number; // Points required
  pointsMultiplier: number; // Points multiplier for orders
  benefits: string[]; // Tier benefits
}

@Injectable({
  providedIn: 'root'
})
export class LoyaltyService {
  // Define loyalty tiers
  private readonly loyaltyTiers: LoyaltyTier[] = [
    {
      name: 'bronze',
      threshold: 0,
      pointsMultiplier: 1.0,
      benefits: [
        'Earn 1 point for every $1 spent',
        'Birthday reward'
      ]
    },
    {
      name: 'silver',
      threshold: 200,
      pointsMultiplier: 1.25,
      benefits: [
        'Earn 1.25x points',
        'Free drink size upgrade',
        'Birthday reward'
      ]
    },
    {
      name: 'gold',
      threshold: 500,
      pointsMultiplier: 1.5,
      benefits: [
        'Earn 1.5x points',
        'Free drink size upgrade',
        'Extra shot free',
        'Birthday reward'
      ]
    },
    {
      name: 'platinum',
      threshold: 1000,
      pointsMultiplier: 2.0,
      benefits: [
        'Earn 2x points',
        'Free drink size upgrade',
        'Extra shot free',
        'Free alternative milk',
        'Birthday reward',
        'Priority service'
      ]
    }
  ];
  
  // Define available rewards
  private readonly availableRewards: Omit<LoyaltyReward, 'id' | 'expiryDate' | 'status' | 'redeemedDate'>[] = [
    {
      name: 'Free Coffee',
      description: 'Redeem for any small coffee',
      pointsCost: 100
    },
    {
      name: 'Free Specialty Drink',
      description: 'Redeem for any specialty drink',
      pointsCost: 150
    },
    {
      name: 'Free Breakfast Item',
      description: 'Redeem for any breakfast item',
      pointsCost: 200
    },
    {
      name: 'Skip the Line',
      description: 'Priority service for your next order',
      pointsCost: 50
    },
    {
      name: 'Free Add-ons',
      description: 'Free syrups, toppings for your next order',
      pointsCost: 75
    }
  ];
  
  constructor(
    private firestore: Firestore,
    private auth: Auth,
    private notificationService: NotificationService
  ) {}
  
  /**
   * Gets the user's loyalty profile
   */
  getUserLoyalty(): Observable<UserLoyalty | null> {
    return user(this.auth).pipe(
      switchMap(user => {
        if (!user) return of(null);
        
        const userLoyaltyRef = doc(this.firestore, `userLoyalty/${user.uid}`);
        return from(getDoc(userLoyaltyRef)).pipe(
          map(docSnap => {
            if (docSnap.exists()) {
              return this.convertFromFirestore(docSnap.data() as UserLoyalty);
            }
            return null;
          })
        );
      })
    );
  }
  
  /**
   * Initializes a new loyalty account for a user
   */
  initializeLoyaltyAccount(userId: string): Observable<void> {
    const userLoyaltyRef = doc(this.firestore, `userLoyalty/${userId}`);
    
    // Set tier expiry date to one year from now
    const tierExpiryDate = new Date();
    tierExpiryDate.setFullYear(tierExpiryDate.getFullYear() + 1);
    
    const initialLoyalty: UserLoyalty = {
      userId,
      points: 0,
      totalPointsEarned: 0,
      tier: 'bronze',
      tierExpiryDate,
      nextTierProgress: 0,
      lastPointsEarnedDate: new Date(),
      history: [],
      rewards: [],
      monthlyCoffeeCount: 0,
      streakDays: 0,
      lastStreakDate: new Date()
    };

    // Add the welcome notification
    this.notificationService.createNotification({
      userId,
      title: 'Welcome to our Loyalty Program!',
      message: 'Start earning points with every purchase and unlock exciting rewards.',
      type: 'loyalty'
    }).subscribe();
    
    return from(setDoc(userLoyaltyRef, this.prepareForFirestore(initialLoyalty)));
  }
  
  /**
   * Adds points to the user's loyalty account
   */
  addPoints(userId: string, basePoints: number, orderId?: string): Observable<number> {
    const userLoyaltyRef = doc(this.firestore, `userLoyalty/${userId}`);
    
    return from(getDoc(userLoyaltyRef)).pipe(
      switchMap(docSnap => {
        if (!docSnap.exists()) {
          // Initialize account if it doesn't exist
          return this.initializeLoyaltyAccount(userId).pipe(
            switchMap(() => this.addPointsToExistingAccount(userLoyaltyRef, userId, basePoints, 1.0, orderId))
          );
        } else {
          const userData = docSnap.data() as UserLoyalty;
          
          // Get tier multiplier
          const tier = this.loyaltyTiers.find(t => t.name === userData.tier);
          const multiplier = tier ? tier.pointsMultiplier : 1.0;
          
          return this.addPointsToExistingAccount(userLoyaltyRef, userId, basePoints, multiplier, orderId);
        }
      })
    );
  }
  
  /**
   * Helper method to add points to an existing account
   */
  private addPointsToExistingAccount(
    userLoyaltyRef: DocumentReference, 
    userId: string, 
    basePoints: number, 
    multiplier: number, 
    orderId?: string
  ): Observable<number> {
    // Calculate points with multiplier and round to nearest integer
    const pointsToAdd = Math.round(basePoints * multiplier);
    
    // Create history entry
    const historyEntry: LoyaltyHistory = {
      id: this.generateId(),
      date: new Date(),
      orderId: orderId || null,
      points: pointsToAdd,
      type: 'earned',
      description: orderId 
        ? `Earned ${pointsToAdd} points from order` 
        : `Earned ${pointsToAdd} points`
    };
    
    // Update the user's loyalty document
    return from(updateDoc(userLoyaltyRef, {
      points: increment(pointsToAdd),
      totalPointsEarned: increment(pointsToAdd),
      lastPointsEarnedDate: new Date(),
      history: arrayUnion(historyEntry)
    })).pipe(
      tap(() => {
        // Send notification about earned points
        this.notificationService.createNotification({
          userId,
          title: 'Points Earned',
          message: `You've earned ${pointsToAdd} loyalty points${orderId ? ' from your order' : ''}!`,
          type: 'loyalty',
          targetId: orderId
        }).subscribe();
        
        // Check if the user has enough points for any rewards
        return from(getDoc(userLoyaltyRef)).pipe(
          switchMap(docSnap => {
            if (!docSnap.exists()) return of(null);
            const userData = docSnap.data() as UserLoyalty;
            
            // Check automatic reward thresholds
            if (userData.points >= 100 && !this.hasRewardOfType(userData, 'Free Coffee')) {
              this.addReward('Free Coffee', userId).subscribe();
            }
            
            if (userData.points >= 150 && !this.hasRewardOfType(userData, 'Free Specialty Drink')) {
              this.addReward('Free Specialty Drink', userId).subscribe();
            }
            
            if (userData.points >= 200 && !this.hasRewardOfType(userData, 'Free Breakfast Item')) {
              this.addReward('Free Breakfast Item', userId).subscribe();
            }
            
            return of(null);
          })
        ).subscribe();
      }),
      switchMap(() => {
        // Check if tier upgrade is needed
        return this.checkAndUpdateTier(userId);
      }),
      map(() => pointsToAdd)
    );
  }
  
  /**
   * Checks if user already has a specific reward
   */
  private hasRewardOfType(userData: UserLoyalty, rewardName: string): boolean {
    return userData.rewards.some(
      reward => reward.name === rewardName && reward.status === 'available'
    );
  }
  
  /**
   * Redeems points for a reward
   */
  redeemReward(rewardId: string): Observable<void> {
    return user(this.auth).pipe(
      switchMap(user => {
        if (!user) throw new Error('User not authenticated');
        
        const userLoyaltyRef = doc(this.firestore, `userLoyalty/${user.uid}`);
        
        return from(getDoc(userLoyaltyRef)).pipe(
          switchMap(docSnap => {
            if (!docSnap.exists()) {
              throw new Error('Loyalty account not found');
            }
            
            const userData = docSnap.data() as UserLoyalty;
            
            // Find the reward
            const rewardIndex = userData.rewards.findIndex(r => r.id === rewardId);
            
            if (rewardIndex === -1) {
              throw new Error('Reward not found');
            }
            
            const reward = userData.rewards[rewardIndex];
            
            if (reward.status !== 'available') {
              throw new Error('Reward is not available');
            }
            
            if (userData.points < reward.pointsCost) {
              throw new Error('Not enough points to redeem reward');
            }
            
            // Create history entry
            const historyEntry: LoyaltyHistory = {
              id: this.generateId(),
              date: new Date(),
              orderId: null,
              points: -reward.pointsCost,
              type: 'redeemed',
              description: `Redeemed ${reward.name}`
            };
            
            // Update reward status
            const updatedRewards = [...userData.rewards];
            updatedRewards[rewardIndex] = {
              ...reward,
              status: 'redeemed',
              redeemedDate: new Date()
            };
            
            // Update loyalty document
            return from(updateDoc(userLoyaltyRef, {
              points: increment(-reward.pointsCost),
              rewards: updatedRewards,
              history: arrayUnion(historyEntry)
            })).pipe(
              tap(() => {
                // Send notification for redeemed reward
                this.notificationService.createNotification({
                  userId: user.uid,
                  title: 'Reward Redeemed',
                  message: `You've successfully redeemed your ${reward.name} reward.`,
                  type: 'loyalty'
                }).subscribe();
              })
            );
          })
        );
      })
    );
  }
  
  /**
   * Checks and updates the user's loyalty tier if needed
   */
  private checkAndUpdateTier(userId: string): Observable<void> {
    const userLoyaltyRef = doc(this.firestore, `userLoyalty/${userId}`);
    
    return from(getDoc(userLoyaltyRef)).pipe(
      switchMap(docSnap => {
        if (!docSnap.exists()) {
          return of(undefined);
        }
        
        const userData = docSnap.data() as UserLoyalty;
        
        // Get current tier
        const currentTierIndex = this.loyaltyTiers.findIndex(t => t.name === userData.tier);
        
        // Check if eligible for next tier
        for (let i = currentTierIndex + 1; i < this.loyaltyTiers.length; i++) {
          if (userData.totalPointsEarned >= this.loyaltyTiers[i].threshold) {
            // Upgrade to new tier
            const newTier = this.loyaltyTiers[i];
            
            // Set tier expiry date to one year from now
            const tierExpiryDate = new Date();
            tierExpiryDate.setFullYear(tierExpiryDate.getFullYear() + 1);
            
            // Create history entry for tier upgrade
            const historyEntry: LoyaltyHistory = {
              id: this.generateId(),
              date: new Date(),
              orderId: null,
              points: 0,
              type: 'adjustment',
              description: `Upgraded to ${newTier.name} tier`
            };
            
            // Update the tier
            return from(updateDoc(userLoyaltyRef, {
              tier: newTier.name,
              tierExpiryDate,
              nextTierProgress: i < this.loyaltyTiers.length - 1 
                ? (userData.totalPointsEarned / this.loyaltyTiers[i + 1].threshold) * 100
                : 100,
              history: arrayUnion(historyEntry)
            })).pipe(
              tap(() => {
                // Send notification for tier upgrade
                this.notificationService.createLoyaltyTierNotification(
                  userId, 
                  this.capitalizeFirstLetter(newTier.name)
                ).subscribe();
                
                // Add special tier reward if applicable
                if (newTier.name === 'silver') {
                  this.addReward('Free Add-ons', userId).subscribe();
                } else if (newTier.name === 'gold') {
                  this.addReward('Skip the Line', userId).subscribe();
                } else if (newTier.name === 'platinum') {
                  this.addReward('Free Specialty Drink', userId).subscribe();
                }
              })
            );
          }
        }
        
        // Update next tier progress if no tier upgrade
        if (currentTierIndex < this.loyaltyTiers.length - 1) {
          const nextTierThreshold = this.loyaltyTiers[currentTierIndex + 1].threshold;
          const progress = (userData.totalPointsEarned / nextTierThreshold) * 100;
          
          return from(updateDoc(userLoyaltyRef, {
            nextTierProgress: progress
          }));
        }
        
        return of(undefined);
      })
    );
  }
  
  /**
   * Gets available rewards that the user can claim
   */
  getAvailableRewards(): Observable<LoyaltyReward[]> {
    return user(this.auth).pipe(
      switchMap(user => {
        if (!user) return of([]);
        
        return this.getUserLoyalty().pipe(
          map(userLoyalty => {
            if (!userLoyalty) return [];
            
            // Filter rewards that are available
            return userLoyalty.rewards.filter(reward => reward.status === 'available');
          })
        );
      })
    );
  }
  
  /**
   * Gets all rewards the user has redeemed
   */
  getRedeemedRewards(): Observable<LoyaltyReward[]> {
    return user(this.auth).pipe(
      switchMap(user => {
        if (!user) return of([]);
        
        return this.getUserLoyalty().pipe(
          map(userLoyalty => {
            if (!userLoyalty) return [];
            
            // Filter rewards that have been redeemed
            return userLoyalty.rewards.filter(reward => reward.status === 'redeemed');
          })
        );
      })
    );
  }
  
  /**
   * Adds an available reward to the user's account
   */
  addReward(rewardName: string, userId?: string): Observable<void> {
    return user(this.auth).pipe(
      switchMap(currentUser => {
        const uid = userId || (currentUser ? currentUser.uid : null);
        
        if (!uid) throw new Error('User not authenticated');
        
        // Find reward template
        const rewardTemplate = this.availableRewards.find(r => r.name === rewardName);
        
        if (!rewardTemplate) {
          throw new Error('Reward template not found');
        }
        
        // Create new reward
        const reward: LoyaltyReward = {
          id: this.generateId(),
          name: rewardTemplate.name,
          description: rewardTemplate.description,
          pointsCost: rewardTemplate.pointsCost,
          expiryDate: null, // No expiration
          status: 'available',
          redeemedDate: null
        };
        
        // Add to user's rewards
        const userLoyaltyRef = doc(this.firestore, `userLoyalty/${uid}`);
        return from(updateDoc(userLoyaltyRef, {
          rewards: arrayUnion(reward)
        })).pipe(
          tap(() => {
            // Send notification for new reward
            this.notificationService.createLoyaltyRewardNotification(
              uid,
              reward.name,
              reward.pointsCost
            ).subscribe();
          })
        );
      })
    );
  }
  
  /**
   * Gets loyalty tiers information
   */
  getLoyaltyTiers(): LoyaltyTier[] {
    return this.loyaltyTiers;
  }
  
  /**
   * Gets user's current tier information
   */
  getCurrentTierInfo(): Observable<LoyaltyTier | null> {
    return this.getUserLoyalty().pipe(
      map(userLoyalty => {
        if (!userLoyalty) return null;
        
        return this.loyaltyTiers.find(tier => tier.name === userLoyalty.tier) || null;
      })
    );
  }
  
  /**
   * Gets the next tier information
   */
  getNextTierInfo(): Observable<LoyaltyTier | null> {
    return this.getUserLoyalty().pipe(
      map(userLoyalty => {
        if (!userLoyalty) return null;
        
        const currentTierIndex = this.loyaltyTiers.findIndex(tier => tier.name === userLoyalty.tier);
        
        if (currentTierIndex < this.loyaltyTiers.length - 1) {
          return this.loyaltyTiers[currentTierIndex + 1];
        }
        
        return null; // Already at highest tier
      })
    );
  }
  
  /**
   * Gets the user's loyalty history
   */
  getLoyaltyHistory(): Observable<LoyaltyHistory[]> {
    return this.getUserLoyalty().pipe(
      map(userLoyalty => {
        if (!userLoyalty) return [];
        
        // Sort history by date (newest first)
        return userLoyalty.history.sort((a, b) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        );
      })
    );
  }
  
  // Continuing from the previous Loyalty Service code

  /**
   * Updates the user's streak
   */
  updateStreak(): Observable<number> {
    return user(this.auth).pipe(
      switchMap(user => {
        if (!user) throw new Error('User not authenticated');
        
        const userLoyaltyRef = doc(this.firestore, `userLoyalty/${user.uid}`);
        
        return from(getDoc(userLoyaltyRef)).pipe(
          switchMap(docSnap => {
            if (!docSnap.exists()) {
              return this.initializeLoyaltyAccount(user.uid).pipe(
                map(() => 1) // New account starts with streak of 1
              );
            }
            
            const userData = docSnap.data() as UserLoyalty;
            const now = new Date();
            const lastStreakDate = userData.lastStreakDate instanceof Date 
              ? userData.lastStreakDate 
              : (userData.lastStreakDate as any).toDate();
            
            // Check if last streak was yesterday or today
            const dayDifference = this.getDayDifference(lastStreakDate, now);
            
            if (dayDifference === 0) {
              // Already visited today, no streak update
              return of(userData.streakDays);
            } else if (dayDifference === 1) {
              // Visited yesterday, increment streak
              const newStreak = userData.streakDays + 1;
              
              // Give bonus points for milestone streaks
              let bonusPoints = 0;
              let bonusDescription = '';
              
              if (newStreak === 7) {
                bonusPoints = 10;
                bonusDescription = '7 day streak bonus';
              } else if (newStreak === 30) {
                bonusPoints = 50;
                bonusDescription = '30 day streak bonus';
              } else if (newStreak % 100 === 0) {
                bonusPoints = 100;
                bonusDescription = `${newStreak} day streak bonus`;
              }
              
              // Create history entry for bonus if applicable
              const updates: any = {
                streakDays: newStreak,
                lastStreakDate: now
              };
              
              if (bonusPoints > 0) {
                const historyEntry: LoyaltyHistory = {
                  id: this.generateId(),
                  date: now,
                  orderId: null,
                  points: bonusPoints,
                  type: 'adjustment',
                  description: bonusDescription
                };
                
                updates.points = increment(bonusPoints);
                updates.totalPointsEarned = increment(bonusPoints);
                updates.history = arrayUnion(historyEntry);
              }
              
              return from(updateDoc(userLoyaltyRef, updates)).pipe(
                tap(() => {
                  // Notify user of streak milestone if applicable
                  if (bonusPoints > 0) {
                    this.notificationService.createStreakBonusNotification(
                      user.uid,
                      newStreak,
                      bonusPoints
                    ).subscribe();
                  }
                }),
                map(() => newStreak)
              );
            } else {
              // Streak broken, reset to 1
              return from(updateDoc(userLoyaltyRef, {
                streakDays: 1,
                lastStreakDate: now
              })).pipe(
                map(() => 1)
              );
            }
          })
        );
      })
    );
  }
  
  /**
   * Increments the user's monthly coffee count
   */
  incrementMonthlyCoffeeCount(): Observable<number> {
    return user(this.auth).pipe(
      switchMap(user => {
        if (!user) throw new Error('User not authenticated');
        
        const userLoyaltyRef = doc(this.firestore, `userLoyalty/${user.uid}`);
        
        return from(getDoc(userLoyaltyRef)).pipe(
          switchMap(docSnap => {
            if (!docSnap.exists()) {
              return this.initializeLoyaltyAccount(user.uid).pipe(
                switchMap(() => {
                  return from(updateDoc(userLoyaltyRef, {
                    monthlyCoffeeCount: 1
                  })).pipe(map(() => 1));
                })
              );
            }
            
            const userData = docSnap.data() as UserLoyalty;
            const newCount = userData.monthlyCoffeeCount + 1;
            
            // Check if reached reward threshold
            let bonusPoints = 0;
            let bonusDescription = '';
            
            if (newCount === 10) {
              bonusPoints = 20;
              bonusDescription = '10 coffees this month bonus';
            } else if (newCount === 20) {
              bonusPoints = 40;
              bonusDescription = '20 coffees this month bonus';
            } else if (newCount === 30) {
              bonusPoints = 60;
              bonusDescription = '30 coffees this month bonus';
            }
            
            // Create history entry for bonus if applicable
            const updates: any = {
              monthlyCoffeeCount: newCount
            };
            
            if (bonusPoints > 0) {
              const historyEntry: LoyaltyHistory = {
                id: this.generateId(),
                date: new Date(),
                orderId: null,
                points: bonusPoints,
                type: 'adjustment',
                description: bonusDescription
              };
              
              updates.points = increment(bonusPoints);
              updates.totalPointsEarned = increment(bonusPoints);
              updates.history = arrayUnion(historyEntry);
            }
            
            return from(updateDoc(userLoyaltyRef, updates)).pipe(
              tap(() => {
                // Notify user of coffee count milestone if applicable
                if (bonusPoints > 0) {
                  this.notificationService.createNotification({
                    userId: user.uid,
                    title: 'Coffee Milestone Reached!',
                    message: `You've ordered ${newCount} coffees this month and earned ${bonusPoints} bonus points!`,
                    type: 'loyalty'
                  }).subscribe();
                }
              }),
              map(() => newCount)
            );
          })
        );
      })
    );
  }
  
  /**
   * Helper method to calculate days between two dates
   */
  private getDayDifference(date1: Date, date2: Date): number {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    
    // Reset time part for accurate day difference
    d1.setHours(0, 0, 0, 0);
    d2.setHours(0, 0, 0, 0);
    
    // Calculate difference in days
    const diffTime = Math.abs(d2.getTime() - d1.getTime());
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }
  
  /**
   * Helper method to convert Firestore data to our model
   */
  private convertFromFirestore(data: any): UserLoyalty {
    // Convert Timestamp objects to Date
    if (data.tierExpiryDate && typeof data.tierExpiryDate.toDate === 'function') {
      data.tierExpiryDate = data.tierExpiryDate.toDate();
    }
    
    if (data.lastPointsEarnedDate && typeof data.lastPointsEarnedDate.toDate === 'function') {
      data.lastPointsEarnedDate = data.lastPointsEarnedDate.toDate();
    }
    
    if (data.lastStreakDate && typeof data.lastStreakDate.toDate === 'function') {
      data.lastStreakDate = data.lastStreakDate.toDate();
    }
    
    // Convert dates in history array
    if (data.history && Array.isArray(data.history)) {
      data.history = data.history.map((item:any) => ({
        ...item,
        date: item.date && typeof item.date.toDate === 'function' ? item.date.toDate() : item.date
      }));
    }
    
    // Convert dates in rewards array
    if (data.rewards && Array.isArray(data.rewards)) {
      data.rewards = data.rewards.map((reward:any) => ({
        ...reward,
        expiryDate: reward.expiryDate && typeof reward.expiryDate.toDate === 'function' 
          ? reward.expiryDate.toDate() 
          : reward.expiryDate,
        redeemedDate: reward.redeemedDate && typeof reward.redeemedDate.toDate === 'function' 
          ? reward.redeemedDate.toDate() 
          : reward.redeemedDate
      }));
    }
    
    return data as UserLoyalty;
  }
  
  /**
   * Helper method to prepare data for Firestore
   */
  private prepareForFirestore(data: UserLoyalty): any {
    // Create a deep clone to avoid modifying the original
    return JSON.parse(JSON.stringify(data));
  }
  
  /**
   * Helper method to generate a unique ID
   */
  private generateId(): string {
    return Math.random().toString(36).substring(2, 15) + 
      Math.random().toString(36).substring(2, 15);
  }
  
  /**
   * Helper to capitalize first letter
   */
  private capitalizeFirstLetter(string: string): string {
    if (!string) return '';
    return string.charAt(0).toUpperCase() + string.slice(1);
  }
}