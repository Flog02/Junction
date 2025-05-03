// This component will allow users to track their orders in real-time

import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable, interval, Subject } from 'rxjs';
import { takeUntil, switchMap, startWith } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { 
    IonSpinner,
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonContent, 
  IonBackButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonProgressBar,
  IonIcon,
  IonButton,
  IonCardHeader,
  IonCardTitle
} from '@ionic/angular/standalone';
import { OrderService } from '../../../core/services/order.service';
import { Order } from '../../../core/models/order.model';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-order-tracker',
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/order"></ion-back-button>
        </ion-buttons>
        <ion-title>Order Tracker</ion-title>
      </ion-toolbar>
    </ion-header>
    
    <ion-content class="ion-padding">
      <div *ngIf="isLoading" class="loading-container">
        <ion-spinner></ion-spinner>
        <p>Loading order details...</p>
      </div>
      
      <div *ngIf="!isLoading && !order" class="error-container">
        <ion-icon name="alert-circle-outline" size="large"></ion-icon>
        <h2>Order Not Found</h2>
        <p>We couldn't find the order you're looking for.</p>
        <ion-button routerLink="/order" expand="block">
          View My Orders
        </ion-button>
      </div>
      
      <div *ngIf="!isLoading && order" class="order-tracker">
        <ion-card>
          <ion-card-header>
            <ion-card-title>
              Order #{{ order.id?.substring(0, 8) }}
            </ion-card-title>
          </ion-card-header>
          
          <ion-card-content>
            <div class="order-status">
              <div class="status-badge" [ngClass]="order.status">
                {{ getStatusText(order.status) }}
              </div>
              <p *ngIf="order.status === 'pending'">Your order has been received and will be prepared soon.</p>
              <p *ngIf="order.status === 'processing'">Baristas are preparing your order now.</p>
              <p *ngIf="order.status === 'ready'">Your order is ready for pickup!</p>
              <p *ngIf="order.status === 'delivered'">Your order has been delivered. Enjoy!</p>
              <p *ngIf="order.status === 'cancelled'">This order has been cancelled.</p>
            </div>
            
            <div class="progress-tracker" *ngIf="order.status !== 'cancelled'">
              <div class="progress-steps">
                <div class="step" [class.active]="isStepActive('pending')">
                  <div class="step-icon">
                    <ion-icon name="receipt-outline"></ion-icon>
                  </div>
                  <div class="step-label">Ordered</div>
                  <div class="step-time" *ngIf="order.orderTime">{{ formatTime(order.orderTime) }}</div>
                </div>
                
                <div class="step" [class.active]="isStepActive('processing')">
                  <div class="step-icon">
                    <ion-icon name="cafe-outline"></ion-icon>
                  </div>
                  <div class="step-label">Preparing</div>
                  <div class="step-time" *ngIf="order.processTime">{{ formatTime(order.processTime) }}</div>
                </div>
                
                <div class="step" [class.active]="isStepActive('ready')">
                  <div class="step-icon">
                    <ion-icon name="checkmark-circle-outline"></ion-icon>
                  </div>
                  <div class="step-label">Ready</div>
                  <div class="step-time" *ngIf="order.completionTime">{{ formatTime(order.completionTime) }}</div>
                </div>
                
                <div class="step" [class.active]="isStepActive('delivered')">
                  <div class="step-icon">
                    <ion-icon name="hand-left-outline"></ion-icon>
                  </div>
                  <div class="step-label">Delivered</div>
                  <div class="step-time" *ngIf="order.deliveredBy">{{ order.deliveredBy }}</div>
                </div>
              </div>
              
              <ion-progress-bar [value]="getProgressValue()"></ion-progress-bar>
            </div>
            
            <div class="estimated-time" *ngIf="order.status === 'pending' || order.status === 'processing'">
              <h3>Estimated Ready Time</h3>
              <div class="time-display">{{ getEstimatedReadyTime() }}</div>
            </div>
            
            <div class="order-details">
              <h3>Order Details</h3>
              <div class="item-list">
                <div class="order-item" *ngFor="let item of order.items">
                  <div class="item-quantity">{{ item.quantity }}x</div>
                  <div class="item-details">
                    <div class="item-name">{{ item.name }}</div>
                    <div class="item-customizations" *ngIf="item.customizations">
                      <span *ngIf="item.customizations.size">{{ item.customizations.size.name }}</span>
                      <span *ngIf="item.customizations.milk">• {{ item.customizations.milk.name }}</span>
                    </div>
                  </div>
                  <div class="item-price">{{ item.itemTotal | currency }}</div>
                </div>
              </div>
            </div>
            
            <div class="actions" *ngIf="order.status === 'pending'">
              <ion-button color="danger" expand="block" (click)="cancelOrder()">
                Cancel Order
              </ion-button>
            </div>
          </ion-card-content>
        </ion-card>
      </div>
    </ion-content>
  `,
  styles: [`
    .order-tracker {
      padding: 16px 0;
    }
    
    .status-badge {
      display: inline-block;
      padding: 6px 12px;
      border-radius: 16px;
      font-weight: bold;
      margin-bottom: 12px;
    }
    
    .status-badge.pending {
      background-color: var(--ion-color-warning);
      color: var(--ion-color-warning-contrast);
    }
    
    .status-badge.processing {
      background-color: var(--ion-color-primary);
      color: var(--ion-color-primary-contrast);
    }
    
    .status-badge.ready {
      background-color: var(--ion-color-success);
      color: var(--ion-color-success-contrast);
    }
    
    .status-badge.delivered {
      background-color: var(--ion-color-success);
      color: var(--ion-color-success-contrast);
    }
    
    .status-badge.cancelled {
      background-color: var(--ion-color-danger);
      color: var(--ion-color-danger-contrast);
    }
    
    .progress-tracker {
      margin: 24px 0;
    }
    
    .progress-steps {
      display: flex;
      justify-content: space-between;
      margin-bottom: 16px;
    }
    
    .step {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      opacity: 0.5;
      transition: opacity 0.3s ease;
    }
    
    .step.active {
      opacity: 1;
    }
    
    .step-icon {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background-color: var(--ion-color-light);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 8px;
    }
    
    .step.active .step-icon {
      background-color: var(--ion-color-primary);
      color: var(--ion-color-primary-contrast);
    }
    
    .step-label {
      font-weight: bold;
      font-size: 12px;
      margin-bottom: 4px;
    }
    
    .step-time {
      font-size: 10px;
      color: var(--ion-color-medium);
    }
    
    .estimated-time {
      text-align: center;
      margin: 24px 0;
      padding: 16px;
      background-color: var(--ion-color-light);
      border-radius: 8px;
    }
    
    .estimated-time h3 {
      margin-top: 0;
    }
    
    .time-display {
      font-size: 24px;
      font-weight: bold;
    }
    
    .order-details {
      margin-top: 24px;
    }
    
    .item-list {
      margin-top: 16px;
    }
    
    .order-item {
      display: flex;
      padding: 8px 0;
      border-bottom: 1px solid var(--ion-color-light);
    }
    
    .item-quantity {
      margin-right: 12px;
      font-weight: bold;
    }
    
    .item-details {
      flex: 1;
    }
    
    .item-name {
      font-weight: bold;
    }
    
    .item-customizations {
      font-size: 12px;
      color: var(--ion-color-medium);
      margin-top: 4px;
    }
    
    .item-price {
      font-weight: bold;
    }
    
    .actions {
      margin-top: 24px;
    }
  `],
  standalone: true,
  imports: [
    IonSpinner,
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonBackButton,
    IonButtons,
    IonCard,
    IonCardContent,
    IonProgressBar,
    IonIcon,
    IonButton,
    IonCardHeader,
    IonCardTitle
  ]
})
export class OrderTrackerComponent implements OnInit, OnDestroy {
  orderId: string | null = null;
  order: Order | null = null;
  isLoading = true;
  
  private destroy$ = new Subject<void>();
  
  constructor(
    private route: ActivatedRoute,
    private orderService: OrderService,
    private notificationService: NotificationService
  ) {}
  
  ngOnInit() {
    this.orderId = this.route.snapshot.paramMap.get('id');
    
    if (this.orderId) {
      // Poll for order updates every 30 seconds
      interval(30000).pipe(
        startWith(0), // Start immediately
        switchMap(() => this.orderService.getOrder(this.orderId!)),
        takeUntil(this.destroy$)
      ).subscribe({
        next: (order) => {
          this.order = order;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading order:', error);
          this.isLoading = false;
        }
      });
    } else {
      this.isLoading = false;
    }
  }
  
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  getStatusText(status: string): string {
    switch (status) {
      case 'pending': return 'Order Received';
      case 'processing': return 'Preparing';
      case 'ready': return 'Ready for Pickup';
      case 'delivered': return 'Delivered';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  }
  
  isStepActive(step: string): boolean {
    if (!this.order) return false;
    
    const statusOrder = ['pending', 'processing', 'ready', 'delivered'];
    const currentIndex = statusOrder.indexOf(this.order.status);
    const stepIndex = statusOrder.indexOf(step);
    
    return currentIndex >= stepIndex;
  }
  
  getProgressValue(): number {
    if (!this.order) return 0;
    
    const statusOrder = ['pending', 'processing', 'ready', 'delivered'];
    const currentIndex = statusOrder.indexOf(this.order.status);
    
    return (currentIndex + 1) / statusOrder.length;
  }
  
  formatTime(date: Date): string {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  
  getEstimatedReadyTime(): string {
    if (!this.order || !this.order.orderTime) return '--:--';
    
    const orderTime = new Date(this.order.orderTime);
    
    // Calculate based on items and quantity
    let totalPrepTime = 0;
    
    this.order.items.forEach(item => {
      totalPrepTime += (item.preparationTime || 5) * item.quantity;
    });
    
    // Minimum 10 minutes
    totalPrepTime = Math.max(10, totalPrepTime);
    
    // Add preparation time to order time
    const readyTime = new Date(orderTime);
    readyTime.setMinutes(readyTime.getMinutes() + totalPrepTime);
    
    return readyTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  
  cancelOrder() {
    if (!this.order || !this.order.id) return;
    
    this.orderService.cancelOrder(this.order.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          // Create a notification
          this.notificationService.createNotification({
            userId: this.order!.userId,
            title: 'Order Cancelled',
            body: `Your order #${this.order!.id!.substring(0, 8)} has been cancelled.`,
            type: 'order',
            data: {
              orderId: this.order!.id
            },
            priority: 'high'
          }).subscribe();
          
          // Refresh order data
          this.orderService.getOrder(this.order!.id!)
            .pipe(takeUntil(this.destroy$))
            .subscribe(order => {
              this.order = order;
            });
        },
        error: (error) => {
          console.error('Error cancelling order:', error);
        }
      });
  }
}