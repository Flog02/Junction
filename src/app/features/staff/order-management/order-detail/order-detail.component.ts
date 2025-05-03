// src/app/features/staff/order-management/order-detail/order-detail.component.ts

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonContent, 
  IonButtons, 
  IonBackButton,
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonIcon,
  IonBadge,
  IonList,
  IonItem,
  IonLabel,
  IonSpinner,
  IonAlert,
  AlertController
} from '@ionic/angular/standalone';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { addIcons } from 'ionicons';
import { 
  timeOutline, 
  personOutline, 
  cafeOutline, 
  receiptOutline, 
  callOutline, 
  cashOutline, 
  cardOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
  printOutline,
  starOutline,
  chatbubblesOutline,
  documentTextOutline
} from 'ionicons/icons';

import { StaffOrderService } from '../../../../core/services/staff-order.service';
import { Order } from '../../../../core/models/order.model';

@Component({
  selector: 'app-order-detail',
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/staff/orders/history"></ion-back-button>
        </ion-buttons>
        <ion-title>Order Details</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="printOrder()">
            <ion-icon name="print-outline" slot="icon-only"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    
    <ion-content class="ion-padding">
      <!-- Loading State -->
      <div *ngIf="isLoading" class="loading-container">
        <ion-spinner></ion-spinner>
        <p>Loading order details...</p>
      </div>
      
      <!-- Error State -->
      <div *ngIf="!isLoading && !order" class="error-container">
        <ion-icon name="close-circle-outline" size="large"></ion-icon>
        <h2>Order Not Found</h2>
        <p>The order you're looking for doesn't exist or has been deleted.</p>
        <ion-button routerLink="/staff/orders/history" expand="block">
          View All Orders
        </ion-button>
      </div>
      
      <!-- Order Details -->
      <div *ngIf="!isLoading && order" class="order-container">
        <!-- Order Header -->
        <ion-card class="order-header-card">
          <ion-card-header>
            <ion-card-subtitle>
              {{ formatDate(order.orderTime) }}
            </ion-card-subtitle>
            <ion-card-title>
              <div class="order-title">
                <span>Order #{{ order.id?.substring(0, 6) }}</span>
                <ion-badge [color]="getStatusColor(order.status)">
                  {{ getStatusText(order.status) }}
                </ion-badge>
              </div>
            </ion-card-title>
          </ion-card-header>
          
          <ion-card-content>
            <div class="order-details">
              <div class="detail-item">
                <ion-icon name="person-outline"></ion-icon>
                <span>{{ order.userId }}</span>
              </div>
              
              <div class="detail-item" *ngIf="order.storeId">
                <ion-icon name="business-outline"></ion-icon>
                <span>Store: {{ order.storeId }}</span>
              </div>
              
              <div class="detail-item" *ngIf="order.tableNumber">
                <ion-icon name="restaurant-outline"></ion-icon>
                <span>Table: {{ order.tableNumber }}</span>
              </div>
            </div>
            
            <div class="order-status-timeline">
              <div class="timeline-step" [class.completed]="true">
                <div class="timeline-icon">
                  <ion-icon name="receipt-outline"></ion-icon>
                </div>
                <div class="timeline-content">
                  <div class="timeline-title">Ordered</div>
                  <div class="timeline-time">{{ formatTime(order.orderTime) }}</div>
                </div>
              </div>
              
              <div class="timeline-step" [class.completed]="order.processTime !== null || order.status === 'processing' || order.status === 'ready' || order.status === 'delivered'">
                <div class="timeline-icon">
                  <ion-icon name="cafe-outline"></ion-icon>
                </div>
                <div class="timeline-content">
                  <div class="timeline-title">Preparing</div>
                  <div class="timeline-time" *ngIf="order.processTime">{{ formatTime(order.processTime) }}</div>
                </div>
              </div>
              
              <div class="timeline-step" [class.completed]="order.completionTime !== null || order.status === 'ready' || order.status === 'delivered'">
                <div class="timeline-icon">
                  <ion-icon name="checkmark-circle-outline"></ion-icon>
                </div>
                <div class="timeline-content">
                  <div class="timeline-title">Ready</div>
                  <div class="timeline-time" *ngIf="order.completionTime">{{ formatTime(order.completionTime) }}</div>
                </div>
              </div>
              
              <div class="timeline-step" [class.completed]="order.status === 'delivered'">
                <div class="timeline-icon">
                  <ion-icon name="hand-left-outline"></ion-icon>
                </div>
                <div class="timeline-content">
                  <div class="timeline-title">Delivered</div>
                  <div class="timeline-time" *ngIf="order.deliveredBy">{{ order.deliveredBy }}</div>
                </div>
              </div>
            </div>
            
            <div class="action-buttons" *ngIf="order.status !== 'cancelled'">
              <ion-button 
                expand="block" 
                color="primary" 
                *ngIf="order.status === 'pending'"
                (click)="startProcessing()"
              >
                Start Preparing
              </ion-button>
              
              <ion-button 
                expand="block" 
                color="success" 
                *ngIf="order.status === 'processing'"
                (click)="markAsReady()"
              >
                Mark as Ready
              </ion-button>
              
              <ion-button 
                expand="block" 
                color="success" 
                *ngIf="order.status === 'ready'"
                (click)="markAsDelivered()"
              >
                Mark as Delivered
              </ion-button>
              
              <ion-button 
                expand="block" 
                color="danger" 
                fill="outline"
                *ngIf="order.status === 'pending' || order.status === 'processing'"
                (click)="confirmCancelOrder()"
              >
                Cancel Order
              </ion-button>
            </div>
          </ion-card-content>
        </ion-card>
        
        <!-- Order Items -->
        <ion-card>
          <ion-card-header>
            <ion-card-title>Order Items</ion-card-title>
          </ion-card-header>
          
          <ion-card-content>
            <div class="order-items">
              <div class="order-item" *ngFor="let item of order.items">
                <div class="item-quantity">{{ item.quantity }}x</div>
                <div class="item-details">
                  <div class="item-name">{{ item.name }}</div>
                  <div class="item-customizations" *ngIf="hasCustomizations(item)">
                    <span *ngIf="item.customizations.size">{{ item.customizations.size.name }}</span>
                    <span *ngIf="item.customizations.milk">• {{ item.customizations.milk.name }}</span>
                    <span *ngIf="hasShots(item)">• {{ getCustomizationText(item.customizations.shots) }}</span>
                    <span *ngIf="hasSyrups(item)">• {{ getCustomizationText(item.customizations.syrups) }}</span>
                    <span *ngIf="hasToppings(item)">• {{ getCustomizationText(item.customizations.toppings) }}</span>
                  </div>
                  <div class="item-levels" *ngIf="item.sugarLevel !== undefined || item.caffeineLevel !== undefined">
                    <span *ngIf="item.sugarLevel !== undefined">Sugar: {{ item.sugarLevel }}/5</span>
                    <span *ngIf="item.caffeineLevel !== undefined">• Caffeine: {{ item.caffeineLevel }}/5</span>
                  </div>
                  <div class="item-special" *ngIf="item.specialInstructions">
                    <div class="special-label">Special Instructions:</div>
                    <div class="special-text">{{ item.specialInstructions }}</div>
                  </div>
                </div>
                <div class="item-price">{{ item.itemTotal | currency }}</div>
              </div>
            </div>
          </ion-card-content>
        </ion-card>
        
        <!-- Payment Information -->
        <ion-card>
          <ion-card-header>
            <ion-card-title>Payment Details</ion-card-title>
          </ion-card-header>
          
          <ion-card-content>
            <div class="payment-summary">
              <div class="payment-row">
                <span>Subtotal</span>
                <span>{{ order.subtotal | currency }}</span>
              </div>
              
              <div class="payment-row" *ngIf="order.tax">
                <span>Tax</span>
                <span>{{ order.tax | currency }}</span>
              </div>
              
              <div class="payment-row" *ngIf="order.tip">
                <span>Tip</span>
                <span>{{ order.tip | currency }}</span>
              </div>
              
              <div class="payment-row total">
                <span>Total</span>
                <span>{{ order.total | currency }}</span>
              </div>
            </div>
            
            <div class="payment-method">
              <div class="method-icon">
                <ion-icon [name]="getPaymentMethodIcon(order.paymentMethod)"></ion-icon>
              </div>
              <div class="method-details">
                <div class="method-label">Payment Method</div>
                <div class="method-value">{{ getPaymentMethodText(order.paymentMethod) }}</div>
              </div>
              <div class="payment-status" [ngClass]="order.paymentStatus">
                {{ order.paymentStatus | titlecase }}
              </div>
            </div>
            
            <div class="gift-card" *ngIf="order.giftCardApplied">
              <div class="gift-card-icon">
                <ion-icon name="card-outline"></ion-icon>
              </div>
              <div class="gift-card-details">
                <div class="gift-card-label">Gift Card Applied</div>
                <div class="gift-card-value">{{ order.giftCardApplied.id }}</div>
              </div>
              <div class="gift-card-amount">
                -{{ order.giftCardApplied.amount | currency }}
              </div>
            </div>
            
            <div class="loyalty-points" *ngIf="order.loyaltyPointsEarned > 0">
              <div class="loyalty-icon">
                <ion-icon name="star-outline"></ion-icon>
              </div>
              <div class="loyalty-details">
                <div class="loyalty-label">Loyalty Points Earned</div>
                <div class="loyalty-value">{{ order.loyaltyPointsEarned }} pts</div>
              </div>
            </div>
          </ion-card-content>
        </ion-card>
        
        <!-- Order Notes -->
        <ion-card *ngIf="order.notes">
          <ion-card-header>
            <ion-card-title>Order Notes</ion-card-title>
          </ion-card-header>
          
          <ion-card-content>
            <div class="notes-content">
              {{ order.notes }}
            </div>
          </ion-card-content>
        </ion-card>
      </div>
    </ion-content>
  `,
  styles: [`
    .loading-container, .error-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px 16px;
      text-align: center;
    }
    
    .error-container ion-icon {
      font-size: 48px;
      margin-bottom: 16px;
      color: var(--ion-color-danger);
    }
    
    .order-container {
      padding: 8px;
    }
    
    .order-title {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .order-details {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-bottom: 16px;
    }
    
    .detail-item {
      display: flex;
      align-items: center;
    }
    
    .detail-item ion-icon {
      margin-right: 8px;
      color: var(--ion-color-medium);
    }
    
    .order-status-timeline {
      margin: 24px 0;
      display: flex;
      position: relative;
    }
    
    .order-status-timeline:before {
      content: '';
      position: absolute;
      top: 24px;
      left: 24px;
      right: 24px;
      height: 2px;
      background-color: var(--ion-color-light);
      z-index: 0;
    }
    
    .timeline-step {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      position: relative;
      z-index: 1;
    }
    
    .timeline-icon {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background-color: var(--ion-color-light);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 8px;
    }
    
    .timeline-step.completed .timeline-icon {
      background-color: var(--ion-color-success);
      color: var(--ion-color-success-contrast);
    }
    
    .timeline-content {
      text-align: center;
    }
    
    .timeline-title {
      font-weight: 500;
      font-size: 14px;
    }
    
    .timeline-time {
      font-size: 12px;
      color: var(--ion-color-medium);
    }
    
    .action-buttons {
      margin-top: 24px;
    }
    
    .order-items {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    
    .order-item {
      display: flex;
      position: relative;
      padding-bottom: 16px;
      border-bottom: 1px solid var(--ion-color-light);
    }
    
    .order-item:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }
    
    .item-quantity {
      font-weight: bold;
      font-size: 18px;
      margin-right: 12px;
      min-width: 40px;
    }
    
    .item-details {
      flex: 1;
    }
    
    .item-name {
      font-weight: 500;
      font-size: 16px;
      margin-bottom: 4px;
    }
    
    .item-customizations {
      font-size: 14px;
      color: var(--ion-color-medium);
      margin-bottom: 4px;
    }
    
    .item-levels {
      font-size: 14px;
      color: var(--ion-color-medium);
      margin-bottom: 4px;
    }
    
    .item-special {
      background-color: rgba(var(--ion-color-warning-rgb), 0.1);
      border-radius: 4px;
      padding: 8px;
      margin-top: 8px;
      font-size: 14px;
    }
    
    .special-label {
      font-weight: 500;
      color: var(--ion-color-warning-shade);
      margin-bottom: 4px;
    }
    
    .item-price {
      font-weight: 500;
      min-width: 60px;
      text-align: right;
    }
    
    .payment-summary {
      margin-bottom: 24px;
    }
    
    .payment-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid var(--ion-color-light);
    }
    
    .payment-row.total {
      font-weight: bold;
      font-size: 18px;
      border-top: 1px solid var(--ion-color-medium);
      border-bottom: none;
      padding-top: 16px;
    }
    
    .payment-method, .gift-card, .loyalty-points {
      display: flex;
      align-items: center;
      padding: 16px;
      background-color: var(--ion-color-light);
      border-radius: 8px;
      margin-bottom: 16px;
    }
    
    .method-icon, .gift-card-icon, .loyalty-icon {
      margin-right: 16px;
    }
    
    .method-icon ion-icon, .gift-card-icon ion-icon, .loyalty-icon ion-icon {
      font-size: 24px;
      color: var(--ion-color-medium);
    }
    
    .method-details, .gift-card-details, .loyalty-details {
      flex: 1;
    }
    
    .method-label, .gift-card-label, .loyalty-label {
      font-size: 12px;
      color: var(--ion-color-medium);
    }
    
    .method-value, .gift-card-value, .loyalty-value {
      font-weight: 500;
    }
    
    .payment-status {
      font-weight: 500;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      text-transform: uppercase;
    }
    
    .payment-status.paid {
      background-color: var(--ion-color-success);
      color: var(--ion-color-success-contrast);
    }
    
    .payment-status.pending {
      background-color: var(--ion-color-warning);
      color: var(--ion-color-warning-contrast);
    }
    
    .payment-status.refunded {
      background-color: var(--ion-color-danger);
      color: var(--ion-color-danger-contrast);
    }
    
    .gift-card-amount {
      font-weight: 500;
      color: var(--ion-color-success);
    }
    
    .notes-content {
      white-space: pre-wrap;
    }
  `],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonBackButton,
    IonButton,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonIcon,
    IonBadge,
    IonList,
    IonItem,
    IonLabel,
    IonSpinner,
    IonAlert
  ]
})
export class OrderDetailComponent implements OnInit, OnDestroy {
  orderId: string | null = null;
  order: Order | null = null;
  isLoading = true;
  
  private destroy$ = new Subject<void>();
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private staffOrderService: StaffOrderService,
    private alertController: AlertController
  ) {
    addIcons({
      timeOutline, 
      personOutline, 
      cafeOutline, 
      receiptOutline, 
      callOutline, 
      cashOutline, 
      cardOutline,
      checkmarkCircleOutline,
      closeCircleOutline,
      printOutline,
      starOutline,
      chatbubblesOutline,
      documentTextOutline
    });
  }
  
  ngOnInit() {
    this.orderId = this.route.snapshot.paramMap.get('id');
    
    if (this.orderId) {
      this.loadOrder();
    } else {
      this.isLoading = false;
    }
  }
  
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  ionViewWillEnter() {
    // Refresh data when view is entered
    if (this.orderId) {
      this.loadOrder();
    }
  }
  
  loadOrder() {
    this.isLoading = true;
    
    if (!this.orderId) {
      this.isLoading = false;
      return;
    }
    
    this.staffOrderService.getOrder(this.orderId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (order) => {
          this.order = order;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading order:', error);
          this.isLoading = false;
        }
      });
  }
  
  startProcessing() {
    if (!this.order || !this.order.id) return;
    
    this.isLoading = true;
    
    this.staffOrderService.startProcessingOrder(this.order.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          // Reload order after status update
          this.loadOrder();
        },
        error: (error) => {
          console.error('Error starting processing:', error);
          this.isLoading = false;
        }
      });
  }
  
  markAsReady() {
    if (!this.order || !this.order.id) return;
    
    this.isLoading = true;
    
    this.staffOrderService.completeOrder(this.order.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          // Reload order after status update
          this.loadOrder();
        },
        error: (error) => {
          console.error('Error marking as ready:', error);
          this.isLoading = false;
        }
      });
  }
  
  markAsDelivered() {
    if (!this.order || !this.order.id) return;
    
    this.isLoading = true;
    
    this.staffOrderService.deliverOrder(this.order.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          // Reload order after status update
          this.loadOrder();
        },
        error: (error) => {
          console.error('Error marking as delivered:', error);
          this.isLoading = false;
        }
      });
  }
  
  async confirmCancelOrder() {
    const alert = await this.alertController.create({
      header: 'Cancel Order',
      message: 'Are you sure you want to cancel this order? This action cannot be undone.',
      buttons: [
        {
          text: 'No',
          role: 'cancel'
        },
        {
          text: 'Yes, Cancel Order',
          role: 'destructive',
          handler: () => {
            this.cancelOrder();
          }
        }
      ]
    });
    
    await alert.present();
  }
  
  cancelOrder() {
    if (!this.order || !this.order.id) return;
    
    this.isLoading = true;
    
    this.staffOrderService.updateOrderStatus(this.order.id, 'cancelled')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          // Reload order after status update
          this.loadOrder();
        },
        error: (error) => {
          console.error('Error cancelling order:', error);
          this.isLoading = false;
        }
      });
  }
  
  printOrder() {
    window.print();
  }
  
  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  formatTime(date: Date): string {
    return new Date(date).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }
  
  getStatusColor(status: string): string {
    switch (status) {
      case 'pending': return 'warning';
      case 'processing': return 'primary';
      case 'ready': return 'success';
      case 'delivered': return 'success';
      case 'cancelled': return 'danger';
      default: return 'medium';
    }
  }
  
  getStatusText(status: string): string {
    switch (status) {
      case 'pending': return 'Pending';
      case 'processing': return 'Preparing';
      case 'ready': return 'Ready';
      case 'delivered': return 'Delivered';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  }
  
  getPaymentMethodIcon(method: string): string {
    switch (method?.toLowerCase()) {
      case 'card': return 'card-outline';
      case 'cash': return 'cash-outline';
      case 'wallet': return 'wallet-outline';
      default: return 'cash-outline';
    }
  }
  
  getPaymentMethodText(method: string): string {
    switch (method?.toLowerCase()) {
      case 'card': return 'Credit Card';
      case 'cash': return 'Cash';
      case 'wallet': return 'Digital Wallet';
      default: return method || 'Unknown';
    }
  }
  
  hasCustomizations(item: any): boolean {
    return item.customizations && (
      item.customizations.size ||
      item.customizations.milk ||
      this.hasShots(item) ||
      this.hasSyrups(item) ||
      this.hasToppings(item)
    );
  }
  
  hasShots(item: any): boolean {
    return item.customizations?.shots && item.customizations.shots.length > 0;
  }
  
  hasSyrups(item: any): boolean {
    return item.customizations?.syrups && item.customizations.syrups.length > 0;
  }
  
  hasToppings(item: any): boolean {
    return item.customizations?.toppings && item.customizations.toppings.length > 0;
  }
  
  getCustomizationText(customizations: any[]): string {
    if (!customizations || customizations.length === 0) return '';
    
    const count = customizations.length;
    const type = customizations[0].id.includes('shot') ? 'shot' :
                 customizations[0].id.includes('syrup') ? 'syrup' : 'topping';
    
    return `${count} ${type}${count > 1 ? 's' : ''}`;
  }
}