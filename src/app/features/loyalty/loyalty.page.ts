// Now, let's create the Loyalty Page Component
// src/app/features/loyalty/loyalty.page.ts

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonNote,IonList,IonSpinner,IonBackButton,IonProgressBar,IonButton,IonSegment,IonSegmentButton,IonLabel,IonHeader,IonIcon,IonToolbar,IonTitle,IonContent,IonCard,IonCardHeader,IonCardTitle,IonCardSubtitle,IonCardContent } from '@ionic/angular/standalone';
import { RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { LoyaltyService,UserLoyalty,LoyaltyReward,LoyaltyHistory } from 'src/app/core/services/loyalty.service'; 
import { AlertController, ToastController } from '@ionic/angular/standalone';

@Component({
  selector: 'app-loyalty',
  template:`<ion-header>
  <ion-toolbar>
      <ion-back-button class="back-button" defaultHref="./gift-card-view.html"></ion-back-button>
    <ion-title>Loyalty Program</ion-title>
  </ion-toolbar>
</ion-header>

<ion-content class="ion-padding">
  <div *ngIf="isLoading" class="loading-container">
    <ion-spinner></ion-spinner>
    <p>Loading loyalty data...</p>
  </div>
  
  <div *ngIf="!isLoading && userLoyalty">
    <!-- Loyalty Card -->
    <ion-card class="loyalty-card" [ngClass]="'tier-' + userLoyalty.tier">
      <ion-card-header>
        <ion-card-subtitle>Your Loyalty Card</ion-card-subtitle>
        <ion-card-title>{{ capitalizeFirstLetter(userLoyalty.tier) }} Member</ion-card-title>
      </ion-card-header>
      
      <ion-card-content>
        <div class="points-container">
          <div class="points">
            <span class="points-value">{{ userLoyalty.points }}</span>
            <span class="points-label">Points</span>
          </div>
          
          <div class="streak">
            <span class="streak-value">{{ userLoyalty.streakDays }}</span>
            <span class="streak-label">Day Streak</span>
          </div>
        </div>
        
        <div *ngIf="nextTier" class="next-tier">
          <p class="next-tier-text">
            {{ userLoyalty.totalPointsEarned }}/{{ nextTier.threshold }} points to {{ capitalizeFirstLetter(nextTier.name) }}
          </p>
          <ion-progress-bar [value]="userLoyalty.nextTierProgress / 100"></ion-progress-bar>
        </div>
        
        <ion-button expand="block" (click)="showTierBenefits(currentTier)" class="view-benefits-btn">
          View {{ capitalizeFirstLetter(userLoyalty.tier) }} Benefits
        </ion-button>
      </ion-card-content>
    </ion-card>
    
    <!-- Segment for Rewards/History -->
    <ion-segment [(ngModel)]="selectedSegment" (ionChange)="segmentChanged($event)">
      <ion-segment-button value="rewards">
        <ion-label>Rewards</ion-label>
      </ion-segment-button>
      <ion-segment-button value="history">
        <ion-label>History</ion-label>
      </ion-segment-button>
    </ion-segment>
    
    <!-- Rewards Section -->
    <div *ngIf="selectedSegment === 'rewards'">
      <h2 class="section-title">Available Rewards</h2>
      
      <div *ngIf="availableRewards.length === 0" class="empty-state">
        <ion-icon name="gift-outline"></ion-icon>
        <p>No rewards available yet. Earn more points!</p>
      </div>
      
      <ion-card *ngFor="let reward of availableRewards" class="reward-card">
        <ion-card-header>
          <ion-card-subtitle>{{ reward.pointsCost }} Points</ion-card-subtitle>
          <ion-card-title>{{ reward.name }}</ion-card-title>
        </ion-card-header>
        
        <ion-card-content>
          <p>{{ reward.description }}</p>
          <ion-button 
            expand="block" 
            [disabled]="userLoyalty.points < reward.pointsCost"
            (click)="redeemReward(reward)">
            
            <span *ngIf="userLoyalty.points >= reward.pointsCost">Redeem Now</span>
            <span *ngIf="userLoyalty.points < reward.pointsCost">
              Need {{ reward.pointsCost - userLoyalty.points }} more points
            </span>
          </ion-button>
        </ion-card-content>
      </ion-card>
      
      <h2 class="section-title">Redeemed Rewards</h2>
      
      <div *ngIf="redeemedRewards.length === 0" class="empty-state">
        <ion-icon name="checkmark-circle-outline"></ion-icon>
        <p>No redeemed rewards yet.</p>
      </div>
      
      <ion-card *ngFor="let reward of redeemedRewards" class="reward-card redeemed">
        <ion-card-header>
          <ion-card-subtitle>
          Redeemed on {{ reward.redeemedDate ? formatDate(reward.redeemedDate) : 'N/A' }}          </ion-card-subtitle>
          <ion-card-title>{{ reward.name }}</ion-card-title>
        </ion-card-header>
        
        <ion-card-content>
          <p>{{ reward.description }}</p>
          <div class="redeemed-badge">
            <ion-icon name="checkmark-circle"></ion-icon>
            <span>Redeemed</span>
          </div>
        </ion-card-content>
      </ion-card>
    </div>
    
    <!-- History Section -->
    <div *ngIf="selectedSegment === 'history'">
      <h2 class="section-title">Points History</h2>
      
      <div *ngIf="loyaltyHistory.length === 0" class="empty-state">
        <ion-icon name="time-outline"></ion-icon>
        <p>No loyalty history yet.</p>
      </div>
      
      <ion-card class="history-card">
        <ion-list>
          <ion-item *ngFor="let item of loyaltyHistory" [ngClass]="{'positive': item.points > 0, 'negative': item.points < 0}">
            <ion-icon 
              [name]="item.points > 0 ? 'add-circle-outline' : 'remove-circle-outline'"
              slot="start" 
              [color]="item.points > 0 ? 'success' : 'danger'">
            </ion-icon>
            
            <ion-label>
              <h2>{{ item.description }}</h2>
              <p>{{ formatDate(item.date) }}</p>
            </ion-label>
            
            <ion-note slot="end" [color]="item.points > 0 ? 'success' : 'danger'">
              {{ item.points > 0 ? '+' : '' }}{{ item.points }}
            </ion-note>
          </ion-item>
        </ion-list>
      </ion-card>
    </div>
  </div>
  
  <div *ngIf="!isLoading && !userLoyalty" class="empty-state">
    <ion-icon name="alert-circle-outline"></ion-icon>
    <p>No loyalty account found. Make your first purchase to join!</p>
  </div>
</ion-content>`,
  styles:`  .loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 200px;
  }
  
  .loyalty-card {
    margin-bottom: 20px;
    border-radius: 16px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
  
  .tier-bronze {
    background: linear-gradient(135deg, #cd7f32, #e8b27d);
    color: white;
  }
  
  .tier-silver {
    background: linear-gradient(135deg, #c0c0c0, #e6e6e6);
    color: #333;
  }
  
  .tier-gold {
    background: linear-gradient(135deg, #ffd700, #ffecb3);
    color: #333;
  }
  
  .tier-platinum {
    background: linear-gradient(135deg, #8e8e8e, #e5e5e5);
    color: #333;
  }
  
  .loyalty-card ion-card-title, 
  .loyalty-card ion-card-subtitle {
    color: inherit;
  }
  
  .points-container {
    display: flex;
    justify-content: space-between;
    margin-bottom: 20px;
  }
  
  .points, .streak {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  
  .points-value, .streak-value {
    font-size: 36px;
    font-weight: bold;
  }
  
  .points-label, .streak-label {
    font-size: 14px;
    opacity: 0.8;
  }
  
  .next-tier {
    margin-bottom: 20px;
  }
  
  .next-tier-text {
    font-size: 14px;
    margin-bottom: 8px;
    text-align: center;
  }
  
  .view-benefits-btn {
    margin-top: 10px;
  }
  
  .section-title {
    font-size: 20px;
    font-weight: bold;
    margin: 24px 0 16px 0;
    color: var(--ion-color-primary);
  }

  .back-button{
    float: left;
  }
  
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 0;
    color: var(--ion-color-medium);
  }
  
  .empty-state ion-icon {
    font-size: 48px;
    margin-bottom: 16px;
  }
  
  .reward-card {
    margin-bottom: 16px;
    border-radius: 12px;
  }
  
  .reward-card.redeemed {
    opacity: 0.7;
  }
  
  .redeemed-badge {
    display: flex;
    align-items: center;
    color: var(--ion-color-success);
    margin-top: 10px;
  }
  
  .redeemed-badge ion-icon {
    margin-right: 8px;
  }
  
  .history-card {
    margin-bottom: 16px;
    border-radius: 12px;
  }
  
  ion-item.positive {
    --background: rgba(var(--ion-color-success-rgb), 0.1);
  }
  
  ion-item.negative {
    --background: rgba(var(--ion-color-danger-rgb), 0.1);
  }`,
  standalone: true,
  imports: [IonNote,IonList,IonSpinner,IonBackButton,IonProgressBar,IonButton,IonSegment,IonSegmentButton,IonLabel,CommonModule, IonHeader,IonIcon,IonToolbar,IonTitle,IonContent,IonCard,IonCardHeader,IonCardTitle,IonCardSubtitle,IonCardContent, RouterModule,FormsModule]
})
export class LoyaltyPage implements OnInit, OnDestroy {
  // User loyalty data
  userLoyalty!: UserLoyalty;
  
  // Loyalty tiers
  loyaltyTiers!: any[];
  currentTier: any;
  nextTier: any;
  
  // Rewards
  availableRewards: LoyaltyReward[] = [];
  redeemedRewards: LoyaltyReward[] = [];
  
  // Loyalty history
  loyaltyHistory: LoyaltyHistory[] = [];
  
  // Loading states
  isLoading = true;
  
  // Selected segment
  selectedSegment = 'rewards';
  
  // For cleanup
  private destroy$ = new Subject<void>();
  
  constructor(
    private loyaltyService: LoyaltyService,
    private alertController: AlertController,
    private toastController: ToastController
  ) {}
  
  ngOnInit() {
    // Get loyalty tiers
    this.loyaltyTiers = this.loyaltyService.getLoyaltyTiers();
    
    // Load user loyalty data
    this.loadUserLoyalty();
    
    // Load rewards
    this.loadRewards();
    
    // Load loyalty history
    this.loadLoyaltyHistory();
    
    // Update streak
    this.updateStreak();
  }
  
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  /**
   * Loads the user's loyalty data
   */
  loadUserLoyalty() {
    this.isLoading = true;
    
    this.loyaltyService.getUserLoyalty()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data:any) => {
          this.userLoyalty = data;
          this.isLoading = false;
          
          // Get current tier info
          this.loadTierInfo();
        },
        error: (error) => {
          console.error('Error loading loyalty data:', error);
          this.isLoading = false;
        }
      });
  }
  
  /**
   * Loads tier information
   */
  loadTierInfo() {
    // Get current tier
    this.loyaltyService.getCurrentTierInfo()
      .pipe(takeUntil(this.destroy$))
      .subscribe(tier => {
        this.currentTier = tier;
      });
    
    // Get next tier
    this.loyaltyService.getNextTierInfo()
      .pipe(takeUntil(this.destroy$))
      .subscribe(tier => {
        this.nextTier = tier;
      });
  }
  
  /**
   * Loads available and redeemed rewards
   */
  loadRewards() {
    // Load available rewards
    this.loyaltyService.getAvailableRewards()
      .pipe(takeUntil(this.destroy$))
      .subscribe(rewards => {
        this.availableRewards = rewards;
      });
    
    // Load redeemed rewards
    this.loyaltyService.getRedeemedRewards()
      .pipe(takeUntil(this.destroy$))
      .subscribe(rewards => {
        this.redeemedRewards = rewards;
      });
  }
  
  /**
   * Loads loyalty history
   */
  loadLoyaltyHistory() {
    this.loyaltyService.getLoyaltyHistory()
      .pipe(takeUntil(this.destroy$))
      .subscribe(history => {
        this.loyaltyHistory = history;
      });
  }
  
  /**
   * Updates the user's streak
   */
  updateStreak() {
    this.loyaltyService.updateStreak()
      .pipe(takeUntil(this.destroy$))
      .subscribe(streak => {
        if (this.userLoyalty) {
          this.userLoyalty.streakDays = streak;
        }
      });
  }
  
  /**
   * Redeems a reward
   */
  async redeemReward(reward: LoyaltyReward) {
    // Check if user has enough points
    if (this.userLoyalty.points < reward.pointsCost) {
      this.presentToast('Not enough points to redeem this reward', 'danger');
      return;
    }
    
    const alert = await this.alertController.create({
      header: 'Redeem Reward',
      message: `Are you sure you want to redeem ${reward.name} for ${reward.pointsCost} points?`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Redeem',
          handler: () => {
            this.loyaltyService.redeemReward(reward.id)
              .pipe(takeUntil(this.destroy$))
              .subscribe({
                next: () => {
                  // Update loyalty data
                  this.loadUserLoyalty();
                  
                  // Update rewards
                  this.loadRewards();
                  
                  // Show success message
                  this.presentToast(`${reward.name} redeemed successfully!`);
                },
                error: (error) => {
                  this.presentToast(`Failed to redeem reward: ${error.message}`, 'danger');
                }
              });
          }
        }
      ]
    });
    
    await alert.present();
  }
  
  /**
   * Formats a date for display
   */
  formatDate(date: Date): string {
    if (!date) return '';
    
    if (typeof date === 'string') {
      date = new Date(date);
    } else if (date instanceof Date === false) {
      date = new Date();
    }
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
  
  /**
   * Segment change handler
   */
  segmentChanged(event: any) {
    this.selectedSegment = event.detail.value;
  }
  
  /**
   * Shows tier benefits
   */
  async showTierBenefits(tier: any) {
    const alert = await this.alertController.create({
      header: `${this.capitalizeFirstLetter(tier.name)} Tier Benefits`,
      message: `
        <ul>
          ${tier.benefits.map((benefit:any) => `<li>${benefit}</li>`).join('')}
        </ul>
      `,
      buttons: ['OK']
    });
    
    await alert.present();
  }
  
  /**
   * Helper to capitalize first letter
   */
  capitalizeFirstLetter(string: string): string {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }
  
  /**
   * Helper to present toast messages
   */
  async presentToast(message: string, color: string = 'success') {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      color,
      position: 'bottom'
    });
    
    await toast.present();
  }
}
