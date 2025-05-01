// src/app/shared/components/loyalty-badge/loyalty-badge.component.ts

import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import{IonIcon}from '@ionic/angular/standalone'

@Component({
  selector: 'app-loyalty-badge',
  standalone: true,
  imports: [CommonModule,IonIcon],
  template: `
    <div class="loyalty-badge" [ngClass]="'tier-' + tier">
      <div class="badge-icon">
        <ion-icon [name]="getIconForTier()"></ion-icon>
      </div>
      <div class="badge-content">
        <div class="badge-title">{{ getTierName() }}</div>
        <div class="badge-subtitle" *ngIf="showPoints">{{ points }} Points</div>
      </div>
    </div>
    <style>
      .loyalty-badge {
        display: flex;
        align-items: center;
        padding: 8px 12px;
        border-radius: 16px;
        max-width: fit-content;
      }
      
      .badge-icon {
        background-color: rgba(255, 255, 255, 0.2);
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 8px;
      }
      
      .badge-icon ion-icon {
        font-size: 18px;
        color: white;
      }
      
      .badge-content {
        display: flex;
        flex-direction: column;
      }
      
      .badge-title {
        font-weight: bold;
        font-size: 14px;
        color: white;
      }
      
      .badge-subtitle {
        font-size: 12px;
        color: rgba(255, 255, 255, 0.8);
      }
      
      .tier-bronze {
        background: linear-gradient(135deg, #cd7f32, #e8b27d);
      }
      
      .tier-silver {
        background: linear-gradient(135deg, #c0c0c0, #e6e6e6);
      }
      
      .tier-gold {
        background: linear-gradient(135deg, #ffd700, #ffecb3);
      }
      
      .tier-platinum {
        background: linear-gradient(135deg, #8e8e8e, #e5e5e5);
      }
    </style>
  `,
})
export class LoyaltyBadgeComponent implements OnInit {
  @Input() tier: 'bronze' | 'silver' | 'gold' | 'platinum' = 'bronze';
  @Input() points: number = 0;
  @Input() showPoints: boolean = true;
  
  constructor() {}
  
  ngOnInit() {}
  
  getTierName(): string {
    return this.tier.charAt(0).toUpperCase() + this.tier.slice(1);
  }
  
  getIconForTier(): string {
    switch (this.tier) {
      case 'bronze':
        return 'cafe-outline';
      case 'silver':
        return 'ribbon-outline';
      case 'gold':
        return 'trophy-outline';
      case 'platinum':
        return 'diamond-outline';
      default:
        return 'cafe-outline';
    }
  }
}