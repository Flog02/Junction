import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  IonNote, 
  IonList, 
  IonItem,
  IonSpinner, 
  IonProgressBar, 
  IonButton, 
  IonSegment, 
  IonSegmentButton, 
  IonLabel, 
  IonHeader, 
  IonIcon, 
  IonToolbar, 
  IonTitle, 
  IonContent, 
  IonCard, 
  IonCardHeader, 
  IonCardTitle, 
  IonCardSubtitle, 
  IonCardContent,
  IonBadge,
  IonRippleEffect,
  IonItemDivider,
  IonAvatar,
  ModalController ,
  NavController, IonButtons, IonBackButton } from '@ionic/angular/standalone';
import { RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { LoyaltyService } from 'src/app/core/services/loyalty.service';
import { UserLoyalty, LoyaltyReward, LoyaltyHistory } from 'src/app/core/models/loyalty.model';
import { AlertController, ToastController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  
  giftOutline, 
  timeOutline, 
  addCircleOutline, 
  removeCircleOutline, 
  checkmarkCircleOutline,
  checkmarkCircle,
  alertCircleOutline,
  trophyOutline,
  calendarOutline,
  flameOutline,
  starOutline,
  ribbonOutline,
  pulseOutline, refreshOutline, cafeOutline } from 'ionicons/icons';

@Component({
  selector: 'app-loyalty',
  templateUrl: './loyalty.page.html',
  styleUrls: ['./loyalty.page.scss'],
  standalone: true,
  imports: [IonBackButton, IonButtons, 
    CommonModule,
    IonNote, 
    IonList, 
    IonItem,
    IonSpinner, 
    IonProgressBar, 
    IonButton, 
    IonSegment, 
    IonSegmentButton, 
    IonLabel, 
    IonHeader, 
    IonIcon, 
    IonToolbar, 
    IonTitle, 
    IonContent, 
    IonCard, 
    IonCardHeader, 
    IonCardTitle, 
    IonCardSubtitle, 
    IonCardContent,
    IonBadge,
    IonRippleEffect,
    IonItemDivider,
    IonAvatar,
    RouterModule,
    FormsModule
  ]
})
export class LoyaltyPage implements OnInit, OnDestroy {
  // User loyalty data
  userLoyalty: UserLoyalty | null = null;
  
  // Loyalty tiers
  loyaltyTiers: any[] = [];
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
  
  // Animation flags
  animateCard = false;
  animateRewards = false;
  
  // For cleanup
  private destroy$ = new Subject<void>();
  
  constructor(
    private loyaltyService: LoyaltyService,
    private alertController: AlertController,
    private toastController: ToastController,
    private navController: NavController,
    private modalController:ModalController 
  ) {
    addIcons({starOutline,refreshOutline,trophyOutline,giftOutline,timeOutline,checkmarkCircleOutline,checkmarkCircle,cafeOutline,addCircleOutline,removeCircleOutline,alertCircleOutline,calendarOutline,flameOutline,ribbonOutline,pulseOutline});
  }
  
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
    
    // Trigger animations after data is loaded
    setTimeout(() => {
      this.animateCard = true;
      
      setTimeout(() => {
        this.animateRewards = true;
      }, 300);
    }, 500);
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
        next: (data) => {
          this.userLoyalty = data;
          this.isLoading = false;
          
          // Get current tier info
          this.loadTierInfo();
        },
        error: (error) => {
          console.error('Error loading loyalty data:', error);
          this.isLoading = false;
          this.presentToast('Unable to load loyalty data', 'danger');
        }
      });
  }
  
  /**
   * Loads tier information
   */
  loadTierInfo() {
    if (!this.userLoyalty) return;
    
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
    if (!this.userLoyalty || this.userLoyalty.points < reward.pointsCost) {
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
                  // Show success animation 
                  this.presentSuccessAnimation(reward.name);
                  
                  // Update loyalty data
                  this.loadUserLoyalty();
                  
                  // Update rewards
                  this.loadRewards();
                }
              });
          }
        }
      ]
    });
    
    await alert.present();
  }
  
  /**
   * Shows a success animation for reward redemption
   */
  async presentSuccessAnimation(rewardName: string) {
    const alert = await this.alertController.create({
      header: 'Reward Redeemed!',
      subHeader: rewardName,
      message: '<div class="success-animation"><ion-icon name="checkmark-circle"></ion-icon></div>',
      cssClass: 'reward-success-alert',
      buttons: ['OK']
    });
    
    await alert.present();
    
    // Auto-dismiss after 2 seconds
    setTimeout(() => {
      alert.dismiss();
      this.presentToast(`${rewardName} redeemed successfully!`);
    }, 2000);
  }
  
  /**
   * Formats a date for display
   */
  formatDate(date: Date): string {
    if (!date) return '';
    
    if (typeof date === 'string') {
      date = new Date(date);
    } else if (!(date instanceof Date)) {
      date = new Date();
    }
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
  
  /**
   * Formats a date relative to today
   */
  formatRelativeDate(date: Date): string {
    if (!date) return '';
    
    if (typeof date === 'string') {
      date = new Date(date);
    } else if (!(date instanceof Date)) {
      date = new Date();
    }
    
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
    } else {
      return this.formatDate(date);
    }
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
 /**
 * Shows tier benefits
 */
/**
 * Shows tier benefits
 */
/**
 * Shows tier benefits
 */
async showTierBenefits(tier: any) {
  if (!tier) return;
  
  // Import the modal dynamically to prevent circular dependencies
  const { TierBenefitsModalComponent } = await import('./tier-benefits-modal/tier-benefits-modal.modal');
  
  const modal = await this.modalController.create({
    component: TierBenefitsModalComponent,
    componentProps: {
      tier: tier
    },
    cssClass: 'tier-benefits-modal'
  });
  
  await modal.present();
}
  
  /**
   * Gets tier icon based on tier name
   */
  getTierIcon(tierName: string): string {
    switch (tierName) {
      case 'bronze': return 'ribbon-outline';
      case 'silver': return 'star-outline';
      case 'gold': return 'trophy-outline';
      case 'platinum': return 'flame-outline';
      default: return 'ribbon-outline';
    }
  }
  
  /**
   * Gets tier color based on tier name
   */
  getTierColor(tierName: string): string {
    switch (tierName) {
      case 'bronze': return '#cd7f32';
      case 'silver': return '#c0c0c0';
      case 'gold': return '#ffd700';
      case 'platinum': return '#b9f2ff';
      default: return '#cd7f32';
    }
  }
  
  /**
   * Gets tier color class based on tier name
   */
  getTierColorClass(tierName: string): string {
    return `tier-${tierName}`;
  }
  
  /**
   * Helper to capitalize first letter
   */
  capitalizeFirstLetter(string: string): string {
    if (!string) return '';
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
  
  /**
   * Refreshes loyalty data
   */
  refreshData() {
    this.isLoading = true;
    this.loadUserLoyalty();
    this.loadRewards();
    this.loadLoyaltyHistory();
    this.updateStreak();
  }
  
  /**
   * Gets the background gradient for the current tier
   */
  getTierGradient(): string {
    if (!this.userLoyalty) return '';
    
    switch (this.userLoyalty.tier) {
      case 'bronze':
        return 'linear-gradient(135deg, #cd7f32, #e8b27d)';
      case 'silver':
        return 'linear-gradient(135deg, #c0c0c0, #e6e6e6)';
      case 'gold':
        return 'linear-gradient(135deg, #ffd700, #ffecb3)';
      case 'platinum':
        return 'linear-gradient(135deg, #8e8e8e, #e5e5e5)';
      default:
        return 'linear-gradient(135deg, #cd7f32, #e8b27d)';
    }
  }
  
  /**
   * Gets history icon based on type
   */
  getHistoryIcon(type: string): string {
    switch (type) {
      case 'earned': return 'add-circle-outline';
      case 'redeemed': return 'remove-circle-outline';
      case 'adjustment': return 'pulse-outline';
      default: return 'time-outline';
    }
  }
  
  /**
   * Gets history icon color based on type
   */
  getHistoryIconColor(points: number): string {
    return points > 0 ? 'success' : 'danger';
  }
}