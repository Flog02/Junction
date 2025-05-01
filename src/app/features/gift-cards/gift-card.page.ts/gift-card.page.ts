
// src/app/features/gift-cards/gift-cards.page.ts

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {IonLabel,IonSegment,IonSegmentButton,IonSpinner,IonToolbar,IonHeader,IonButtons,IonBackButton,IonTitle,IonContent,IonButton,IonIcon} from '@ionic/angular/standalone'
import { RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { GiftCard } from 'src/app/core/models/gift-card.model';
import { GiftCardService } from 'src/app/core/services/gift-card.service';
import { FormsModule } from '@angular/forms';
@Component({
  selector: 'app-gift-cards',
  templateUrl: './gift-cards.page.html',
  styleUrls: ['./gift-cards.page.scss'],
  standalone: true,
  imports: [FormsModule,CommonModule, IonLabel,IonSegment,IonSegmentButton,IonSpinner,IonToolbar,IonHeader,IonButtons,IonBackButton,IonTitle,IonContent,IonButton,IonIcon, RouterModule]
})
export class GiftCardsPage implements OnInit, OnDestroy {
  sentGiftCards: GiftCard[] = [];
  receivedGiftCards: GiftCard[] = [];
  activeGiftCards: GiftCard[] = [];
  
  selectedSegment = 'active';
  
  isLoading = true;
  
  private destroy$ = new Subject<void>();
  
  constructor(private giftCardService: GiftCardService) {}
  
  ngOnInit() {
    this.loadGiftCards();
  }
  
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  /**
   * Loads all gift cards
   */
  loadGiftCards() {
    this.isLoading = true;
    
    // Load active gift cards
    this.giftCardService.getActiveGiftCards()
      .pipe(takeUntil(this.destroy$))
      .subscribe(giftCards => {
        this.activeGiftCards = giftCards;
        this.isLoading = false;
      });
    
    // Load sent gift cards
    this.giftCardService.getSentGiftCards()
      .pipe(takeUntil(this.destroy$))
      .subscribe(giftCards => {
        this.sentGiftCards = giftCards;
      });
    
    // Load received gift cards
    this.giftCardService.getReceivedGiftCards()
      .pipe(takeUntil(this.destroy$))
      .subscribe(giftCards => {
        this.receivedGiftCards = giftCards;
      });
  }
  
  /**
   * Handles segment change
   */
  segmentChanged(event: any) {
    this.selectedSegment = event.detail.value;
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
      month: 'short',
      day: 'numeric'
    });
  }
}