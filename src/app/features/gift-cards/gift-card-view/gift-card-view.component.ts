// Now, let's create the Gift Card View Component
// src/app/features/gift-cards/gift-card-view/gift-card-view.component.ts

import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { CommonModule } from '@angular/common';
import { GiftCardService, GiftCard } from '../../../core/services/gift-card.service';
import { ToastController, AlertController } from '@ionic/angular/standalone';
import { Clipboard } from '@capacitor/clipboard';
import {IonSpinner,IonToolbar,IonHeader,IonButtons,IonBackButton,IonTitle,IonContent,IonButton,IonIcon} from '@ionic/angular/standalone'
@Component({
  selector: 'app-gift-card-view',
  templateUrl:'./gift-card-view.component.html',
  styles:`.loading-container,
  .error-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 48px 0;
    text-align: center;
  }
  
  .loading-container ion-spinner,
  .error-container ion-icon {
    margin-bottom: 16px;
  }
  
  .error-container ion-icon {
    font-size: 48px;
    color: var(--ion-color-danger);
  }
  
  .error-container h2 {
    font-size: 24px;
    font-weight: bold;
    margin-bottom: 8px;
  }
  
  .error-container p {
    color: var(--ion-color-medium);
    margin-bottom: 24px;
  }
  
  .gift-card-container {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  
  .gift-card {
    position: relative;
    width: 100%;
    height: 200px;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    margin-bottom: 24px;
  }
  
  .gift-card.redeemed::before,
  .gift-card.expired::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: 1;
  }
  
  .gift-card-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  
  .gift-card-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.3);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding: 16px;
    color: white;
    text-align: center;
    z-index: 2;
  }
  
  .gift-card-amount {
    font-size: 36px;
    font-weight: bold;
    margin-bottom: 8px;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  }
  
  .gift-card-occasion {
    font-size: 20px;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  }
  
  .gift-card-status-badge {
    position: absolute;
    top: 16px;
    right: 16px;
    padding: 6px 12px;
    background-color: var(--ion-color-danger);
    color: white;
    font-weight: bold;
    font-size: 14px;
    border-radius: 16px;
    text-transform: uppercase;
  }
  
  .gift-card-details {
    width: 100%;
    margin-bottom: 24px;
  }
  
  .gift-card-code-container {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 24px;
    background-color: var(--ion-color-light);
    padding: 12px;
    border-radius: 8px;
  }
  
  .gift-card-code {
    font-size: 18px;
    font-family: monospace;
    letter-spacing: 1px;
    font-weight: bold;
  }
  
  .gift-card-info {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }
  
  .info-item {
    padding: 12px;
    background-color: var(--ion-color-light);
    border-radius: 8px;
  }
  
  .info-label {
    font-size: 14px;
    color: var(--ion-color-medium);
    margin-bottom: 4px;
  }
  
  .info-value {
    font-weight: bold;
    font-size: 16px;
  }
  
  .info-value.message {
    font-style: italic;
    font-weight: normal;
  }
  
  .action-buttons {
    width: 100%;
    margin-bottom: 32px;
  }
  
  .usage-instructions {
    width: 100%;
    margin-bottom: 24px;
  }
  
  .usage-instructions h2 {
    font-size: 18px;
    font-weight: bold;
    margin-bottom: 16px;
    color: var(--ion-color-primary);
  }
  
  .usage-instructions ol {
    padding-left: 24px;
  }
  
  .usage-instructions li {
    margin-bottom: 8px;
    color: var(--ion-color-medium);
  }`,
  standalone: true,
  imports: [IonSpinner,CommonModule, IonToolbar, IonHeader, IonButtons, IonBackButton, IonTitle, IonContent, IonButton, IonIcon]
})
export class GiftCardViewComponent implements OnInit, OnDestroy {
  giftCard: GiftCard | null = null;
  isLoading = true;
  error: string | null = null;
  
  private destroy$ = new Subject<void>();
  
  constructor(
    private route: ActivatedRoute,
    private giftCardService: GiftCardService,
    private toastController: ToastController,
    private alertController: AlertController
  ) {}
  
  ngOnInit() {
    const giftCardId = this.route.snapshot.paramMap.get('id');
    
    if (giftCardId) {
      this.loadGiftCard(giftCardId);
    } else {
      this.error = 'Gift card ID not provided';
      this.isLoading = false;
    }
  }
  
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  /**
   * Loads the gift card details
   */
  loadGiftCard(id: string) {
    this.isLoading = true;
    this.error = null;
    
    this.giftCardService.getGiftCardById(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (giftCard) => {
          this.giftCard = giftCard;
          this.isLoading = false;
          
          if (!giftCard) {
            this.error = 'Gift card not found';
          }
        },
        error: (error) => {
          this.error = `Failed to load gift card: ${error.message}`;
          this.isLoading = false;
        }
      });
  }
  
  /**
   * Formats a date for display
   */
  formatDate(date: Date | null): string {
    if (!date) return 'N/A';
    
    if (typeof date === 'string') {
      date = new Date(date);
    }
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
  
  /**
   * Copies the gift card code to clipboard
   */
  async copyCode() {
    if (!this.giftCard) return;
    
    try {
      await Clipboard.write({
        string: this.giftCard.code
      });
      
      const toast = await this.toastController.create({
        message: 'Gift card code copied to clipboard',
        duration: 2000,
        color: 'success'
      });
      
      await toast.present();
    } catch (error) {
      const toast = await this.toastController.create({
        message: 'Failed to copy code',
        duration: 2000,
        color: 'danger'
      });
      
      await toast.present();
    }
  }
  
  /**
   * Shows the redeem dialog
   */
  async showRedeemDialog() {
    if (!this.giftCard) return;
    
    const alert = await this.alertController.create({
      header: 'Redeem Gift Card',
      message: `Are you sure you want to redeem this ${this.giftCard.amount} gift card?`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Redeem',
          handler: () => {
            this.redeemGiftCard();
          }
        }
      ]
    });
    
    await alert.present();
  }
  
  /**
   * Redeems the gift card
   */
  redeemGiftCard() {
    if (!this.giftCard) return;
    
    this.giftCardService.redeemGiftCard(this.giftCard.code)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: async (redeemedCard) => {
          this.giftCard = redeemedCard;
          
          const toast = await this.toastController.create({
            message: 'Gift card redeemed successfully!',
            duration: 2000,
            color: 'success'
          });
          
          await toast.present();
        },
        error: async (error) => {
          const toast = await this.toastController.create({
            message: `Failed to redeem gift card: ${error.message}`,
            duration: 3000,
            color: 'danger'
          });
          
          await toast.present();
        }
      });
  }
  
  /**
   * Shares the gift card
   */
  async shareGiftCard() {
    if (!this.giftCard) return;
    
    // Check if the Web Share API is available
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Lazy Café Gift Card',
          text: `I've sent you a ${this.giftCard.amount} gift card for Lazy Café!`,
          url: window.location.href
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback for browsers that don't support the Web Share API
      await this.copyCode();
      
      const alert = await this.alertController.create({
        header: 'Share Gift Card',
        message: 'Gift card code has been copied to clipboard. You can now share it with the recipient.',
        buttons: ['OK']
      });
      
      await alert.present();
    }
  }
}