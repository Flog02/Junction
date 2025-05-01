// src/app/shared/components/order-summary/order-summary.component.ts

import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import{IonButton,IonIcon,IonBadge}from '@ionic/angular/standalone'

import { Order, OrderItem } from '../../../core/models/order.model';

@Component({
  selector: 'app-order-summary',
  standalone: true,
  imports: [CommonModule,IonButton,IonIcon,IonBadge],
  template: `
    <div class="order-summary">
      <h3 class="summary-title" *ngIf="title">{{ title }}</h3>
      
      <!-- Order Items -->
      <div class="order-items">
        <div *ngFor="let item of order?.items; let i = index" class="order-item">
          <div class="item-quantity">{{ item.quantity }}x</div>
          <div class="item-details">
            <div class="item-name">{{ item.name }}</div>
            <div class="item-customizations" *ngIf="showCustomizations">
              <span *ngIf="item.customizations?.size">{{ item.customizations.size.name }}</span>
              <span *ngIf="item.customizations?.milk">, {{ item.customizations.milk?.name }}</span>
              <span *ngIf="item.customizations?.shots && item.customizations.shots.length > 0">
                , {{ item.customizations.shots.length }} extra shot{{ item.customizations.shots.length > 1 ? 's' : '' }}
              </span>
              <span *ngIf="item.customizations?.syrups && item.customizations.syrups.length > 0">
                , {{ joinCustomizationNames(item.customizations.syrups) }}
              </span>
              <span *ngIf="item.customizations?.toppings && item.customizations.toppings.length > 0">
                , {{ joinCustomizationNames(item.customizations.toppings) }}
              </span>
            </div>
            <div class="item-instructions" *ngIf="showInstructions && item.specialInstructions">
              <strong>Note:</strong> {{ item.specialInstructions }}
            </div>
          </div>
          <div class="item-price">{{ item.itemTotal | currency }}</div>
          
          <div *ngIf="editable" class="item-actions">
            <ion-button fill="clear" color="danger" size="small" (click)="onRemoveItem(i)">
              <ion-icon name="trash-outline" slot="icon-only"></ion-icon>
            </ion-button>
          </div>
        </div>
      </div>
      
      <!-- Price Summary -->
      <div class="price-summary">
        <div class="price-row">
          <span>Subtotal</span>
          <span>{{ order?.subtotal | currency }}</span>
        </div>
        <div class="price-row">
          <span>Tax</span>
          <span>{{ order?.tax | currency }}</span>
        </div>
        <div class="price-row" *ngIf="order?.tip">
          <span>Tip</span>
          <span>{{ order?.tip | currency }}</span>
        </div>
        <div class="price-row total">
          <span>Total</span>
          <span>{{ order?.total | currency }}</span>
        </div>
      </div>
      
      <!-- Gift Card Applied -->
      <div class="gift-card-applied" *ngIf="order?.giftCardApplied">
        <ion-icon name="gift-outline"></ion-icon>
        <span>Gift Card Applied: {{ order.giftCardApplied?.amount | currency }}</span>
      </div>
      
      <!-- Loyalty Points -->
      <div class="loyalty-points" *ngIf="showLoyaltyPoints && order?.loyaltyPointsEarned">
        <ion-icon name="star-outline"></ion-icon>
        <span>You'll earn {{ order.loyaltyPointsEarned }} loyalty points with this order</span>
      </div>
      
      <!-- Actions -->
      <div class="order-actions" *ngIf="showActions">
        <slot></slot>
      </div>
    </div>
    <style>
      .order-summary {
        padding: 16px;
        background-color: white;
        border-radius: 12px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }
      
      .summary-title {
        font-size: 18px;
        font-weight: bold;
        margin-top: 0;
        margin-bottom: 16px;
        color: var(--ion-color-dark);
      }
      
      .order-items {
        margin-bottom: 24px;
      }
      
      .order-item {
        display: flex;
        margin-bottom: 16px;
        position: relative;
      }
      
      .item-quantity {
        font-weight: bold;
        margin-right: 12px;
        min-width: 24px;
      }
      
      .item-details {
        flex: 1;
      }
      
      .item-name {
        font-weight: 500;
        margin-bottom: 4px;
      }
      
      .item-customizations,
      .item-instructions {
        font-size: 12px;
        color: var(--ion-color-medium);
        margin-bottom: 4px;
      }
      
      .item-price {
        font-weight: bold;
        min-width: 60px;
        text-align: right;
      }
      
      .item-actions {
        position: absolute;
        right: 0;
        top: -8px;
      }
      
      .price-summary {
        margin-bottom: 16px;
      }
      
      .price-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 8px;
        font-size: 14px;
      }
      
      .price-row.total {
        font-weight: bold;
        font-size: 16px;
        border-top: 1px solid var(--ion-color-light);
        padding-top: 8px;
        margin-top: 8px;
      }
      
      .gift-card-applied,
      .loyalty-points {
        display: flex;
        align-items: center;
        font-size: 14px;
        color: var(--ion-color-medium);
        margin-bottom: 12px;
      }
      
      .gift-card-applied ion-icon,
      .loyalty-points ion-icon {
        margin-right: 8px;
      }
      
      .order-actions {
        margin-top: 24px;
      }
    </style>
  `,
})
export class OrderSummaryComponent implements OnInit {
  @Input() order!: Order;
  @Input() title: string = 'Order Summary';
  @Input() showCustomizations: boolean = true;
  @Input() showInstructions: boolean = true;
  @Input() showLoyaltyPoints: boolean = true;
  @Input() showActions: boolean = true;
  @Input() editable: boolean = false;
  
  @Output() removeItem = new EventEmitter<number>();
  
  constructor() {}
  
  ngOnInit() {}
  
  joinCustomizationNames(customizations: { name: string }[]): string {
    return customizations.map(c => c.name).join(', ');
  }
  
  onRemoveItem(index: number) {
    this.removeItem.emit(index);
  }
}