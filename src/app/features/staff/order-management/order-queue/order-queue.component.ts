// // src/app/features/staff/order-management/order-queue/order-queue.component.ts

// import { Component, OnInit, OnDestroy } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { RouterModule } from '@angular/router';
// import { 
//   IonHeader, 
//   IonToolbar, 
//   IonTitle, 
//   IonContent, 
//   IonCard, 
//   IonCardContent, 
//   IonCardHeader, 
//   IonCardTitle, 
//   IonButton, 
//   IonBadge, 
//   IonIcon, 
//   IonSpinner
// } from '@ionic/angular/standalone';
// import { Subject, interval } from 'rxjs';
// import { takeUntil, startWith, switchMap } from 'rxjs/operators';
// import { addIcons } from 'ionicons';
// import { 
//   cafeOutline,
//   timeOutline,
//   personOutline,
//   alertCircleOutline,
//   checkmarkCircleOutline
// } from 'ionicons/icons';

// import { StaffOrderService } from '../../../../core/services/staff-order.service';
// import { Order } from '../../../../core/models/order.model';

// @Component({
//   selector: 'app-order-queue',
//   template: `
//     <ion-header>
//       <ion-toolbar color="primary">
//         <ion-title>Order Queue</ion-title>
//       </ion-toolbar>
//     </ion-header>
    
//     <ion-content class="ion-padding">
//       <div class="orders-container">
//         <!-- Loading state -->
//         <div *ngIf="isLoading" class="loading-container">
//           <ion-spinner></ion-spinner>
//           <p>Loading orders...</p>
//         </div>
        
//         <!-- Pending orders -->
//         <div class="order-section">
//           <h2>Pending Orders ({{ pendingOrders.length }})</h2>
          
//           <div *ngIf="!isLoading && pendingOrders.length === 0" class="empty-state">
//             <p>No pending orders at this time.</p>
//           </div>
          
//           <div class="order-cards">
//             <ion-card *ngFor="let order of pendingOrders" class="order-card">
//               <ion-card-header>
//                 <ion-card-title>
//                   <div class="order-title">
//                     <span>Order #{{ order.id?.substring(0, 6) }}</span>
//                     <ion-badge color="warning">Pending</ion-badge>
//                   </div>
//                 </ion-card-title>
//               </ion-card-header>
              
//               <ion-card-content>
//                 <div class="order-details">
//                   <div class="detail-item">
//                     <ion-icon name="time-outline"></ion-icon>
//                     <span>{{ formatTime(order.orderTime) }}</span>
//                   </div>
                  
//                   <div class="detail-item">
//                     <ion-icon name="person-outline"></ion-icon>
//                     <span>{{ order.userId }}</span>
//                   </div>
//                 </div>
                
//                 <div class="order-items">
//                   <h3>Items ({{ order.items.length }})</h3>
//                   <div *ngFor="let item of order.items" class="order-item">
//                     <span class="item-quantity">{{ item.quantity }}x</span>
//                     <div class="item-details">
//                       <div class="item-name">{{ item.name }}</div>
//                       <div class="item-customizations" *ngIf="item.customizations">
//                         <span *ngIf="item.customizations.size">{{ item.customizations.size.name }}</span>
//                         <span *ngIf="item.customizations.milk">• {{ item.customizations.milk.name }}</span>
//                         <span *ngIf="hasShots(item)">• {{ getShotsText(item) }}</span>
//                         <span *ngIf="hasSyrups(item)">• {{ getSyrupsText(item) }}</span>
//                         <span *ngIf="hasToppings(item)">• {{ getToppingsText(item) }}</span>
//                       </div>
//                       <div class="item-special" *ngIf="item.specialInstructions">
//                         <span class="instructions-label">Note:</span> {{ item.specialInstructions }}
//                       </div>
//                     </div>
//                   </div>
//                 </div>
                
//                 <div class="order-actions">
//                   <ion-button expand="block" (click)="startProcessing(order.id || '')">
//                     Start Preparing
//                   </ion-button>
//                 </div>
//               </ion-card-content>
//             </ion-card>
//           </div>
//         </div>
        
//         <!-- Processing orders -->
//         <div class="order-section">
//           <h2>Currently Preparing ({{ processingOrders.length }})</h2>
          
//           <div *ngIf="!isLoading && processingOrders.length === 0" class="empty-state">
//             <p>No orders currently being prepared.</p>
//           </div>
          
//           <div class="order-cards">
//             <ion-card *ngFor="let order of processingOrders" class="order-card">
//               <ion-card-header>
//                 <ion-card-title>
//                   <div class="order-title">
//                     <span>Order #{{ order.id?.substring(0, 6) }}</span>
//                     <ion-badge color="primary">Preparing</ion-badge>
//                   </div>
//                 </ion-card-title>
//               </ion-card-header>
              
//               <ion-card-content>
//                 <div class="order-details">
//                   <div class="detail-item">
//                     <ion-icon name="time-outline"></ion-icon>
//                     <span>{{ formatTime(order.orderTime) }}</span>
//                   </div>
                  
//                   <div class="detail-item">
//                     <ion-icon name="person-outline"></ion-icon>
//                     <span>{{ order.userId }}</span>
//                   </div>
//                 </div>
                
//                 <div class="order-items">
//                   <h3>Items ({{ order.items.length }})</h3>
//                   <div *ngFor="let item of order.items" class="order-item">
//                     <span class="item-quantity">{{ item.quantity }}x</span>
//                     <div class="item-details">
//                       <div class="item-name">{{ item.name }}</div>
//                       <div class="item-customizations" *ngIf="item.customizations">
//                         <span *ngIf="item.customizations.size">{{ item.customizations.size.name }}</span>
//                         <span *ngIf="item.customizations.milk">• {{ item.customizations.milk.name }}</span>
//                         <span *ngIf="hasShots(item)">• {{ getShotsText(item) }}</span>
//                         <span *ngIf="hasSyrups(item)">• {{ getSyrupsText(item) }}</span>
//                         <span *ngIf="hasToppings(item)">• {{ getToppingsText(item) }}</span>
//                       </div>
//                       <div class="item-special" *ngIf="item.specialInstructions">
//                         <span class="instructions-label">Note:</span> {{ item.specialInstructions }}
//                       </div>
//                     </div>
//                   </div>
//                 </div>
                
//                 <div class="preparation-time" *ngIf="order.processTime">
//                   <div class="time-label">Started:</div>
//                   <div class="time-value">{{ formatTime(order.processTime) }}</div>
//                   <div class="elapsed-time">
//                     {{ getElapsedTime(order.processTime) }} elapsed
//                   </div>
//                 </div>
                
//                 <div class="order-actions">
//                   <ion-button expand="block" color="success" (click)="markAsReady(order.id || '')">
//                     Mark as Ready
//                   </ion-button>
//                 </div>
//               </ion-card-content>
//             </ion-card>
//           </div>
//         </div>
//       </div>
//     </ion-content>
//   `,
//   styles: [`
//     .orders-container {
//       display: flex;
//       flex-direction: column;
//       gap: 24px;
//     }
    
//     .order-section h2 {
//       margin-bottom: 16px;
//       font-size: 1.2rem;
//       font-weight: 600;
//     }
    
//     .order-cards {
//       display: grid;
//       grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
//       gap: 16px;
//     }
    
//     .order-card {
//       box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
//     }
    
//     .order-title {
//       display: flex;
//       justify-content: space-between;
//       align-items: center;
//     }
    
//     .order-details {
//       margin-bottom: 16px;
//     }
    
//     .detail-item {
//       display: flex;
//       align-items: center;
//       margin-bottom: 8px;
//     }
    
//     .detail-item ion-icon {
//       margin-right: 8px;
//       font-size: 18px;
//     }
    
//     .order-items {
//       margin-bottom: 16px;
//     }
    
//     .order-items h3 {
//       margin-bottom: 8px;
//       font-size: 1rem;
//       font-weight: 600;
//     }
    
//     .order-item {
//       display: flex;
//       margin-bottom: 8px;
//       padding-bottom: 8px;
//       border-bottom: 1px solid rgba(0, 0, 0, 0.1);
//     }
    
//     .order-item:last-child {
//       border-bottom: none;
//     }
    
//     .item-quantity {
//       font-weight: bold;
//       margin-right: 8px;
//     }
    
//     .item-details {
//       flex: 1;
//     }
    
//     .item-name {
//       font-weight: 500;
//     }
    
//     .item-customizations {
//       font-size: 0.8rem;
//       color: var(--ion-color-medium);
//       margin-top: 4px;
//     }
    
//     .item-special {
//       font-size: 0.8rem;
//       margin-top: 4px;
//       padding: 4px;
//       background-color: rgba(var(--ion-color-warning-rgb), 0.2);
//       border-radius: 4px;
//     }
    
//     .instructions-label {
//       font-weight: bold;
//     }
    
//     .preparation-time {
//       margin-bottom: 16px;
//       padding: 8px;
//       background-color: rgba(var(--ion-color-primary-rgb), 0.1);
//       border-radius: 4px;
//       display: flex;
//       flex-wrap: wrap;
//       gap: 8px;
//       align-items: center;
//     }
    
//     .time-label {
//       font-weight: 500;
//     }
    
//     .time-value {
//       font-weight: bold;
//     }
    
//     .elapsed-time {
//       margin-left: auto;
//       font-weight: bold;
//       color: var(--ion-color-primary);
//     }
    
//     .loading-container {
//       display: flex;
//       flex-direction: column;
//       align-items: center;
//       padding: 32px;
//     }
    
//     .empty-state {
//       text-align: center;
//       padding: 24px;
//       background-color: var(--ion-color-light);
//       border-radius: 8px;
//       color: var(--ion-color-medium);
//     }
//   `],
//   standalone: true,
//   imports: [
//     CommonModule,
//     RouterModule,
//     IonHeader,
//     IonToolbar,
//     IonTitle,
//     IonContent,
//     IonCard,
//     IonCardContent,
//     IonCardHeader,
//     IonCardTitle,
//     IonButton,
//     IonBadge,
//     IonIcon,
//     IonSpinner
//   ]
// })
// export class OrderQueueComponent implements OnInit, OnDestroy {
//   pendingOrders: Order[] = [];
//   processingOrders: Order[] = [];
//   isLoading = true;
  
//   private destroy$ = new Subject<void>();
  
//   constructor(private staffOrderService: StaffOrderService) {
//     addIcons({
//       cafeOutline,
//       timeOutline,
//       personOutline,
//       alertCircleOutline,
//       checkmarkCircleOutline
//     });
//   }
  
//   ngOnInit() {
//     // Poll for order updates every 15 seconds
//     interval(15000).pipe(
//       startWith(0),
//       takeUntil(this.destroy$)
//     ).subscribe(() => {
//       this.loadOrders();
//     });
//   }
  
//   ngOnDestroy() {
//     this.destroy$.next();
//     this.destroy$.complete();
//   }
  
//   loadOrders() {
//     this.isLoading = true;
    
//     // Load pending orders
//     this.staffOrderService.getPendingOrders()
//       .pipe(takeUntil(this.destroy$))
//       .subscribe(orders => {
//         this.pendingOrders = orders;
//         this.isLoading = false;
//       });
    
//     // Load processing orders
//     this.staffOrderService.getProcessingOrders()
//       .pipe(takeUntil(this.destroy$))
//       .subscribe(orders => {
//         this.processingOrders = orders;
//       });
//   }
  
//   startProcessing(orderId: string) {
//     this.staffOrderService.startProcessingOrder(orderId)
//       .pipe(takeUntil(this.destroy$))
//       .subscribe(() => {
//         // Refresh orders after status update
//         this.loadOrders();
//       });
//   }
  
//   markAsReady(orderId: string) {
//     this.staffOrderService.completeOrder(orderId)
//       .pipe(takeUntil(this.destroy$))
//       .subscribe(() => {
//         // Refresh orders after status update
//         this.loadOrders();
//       });
//   }
  
//   formatTime(date: Date): string {
//     return new Date(date).toLocaleTimeString([], { 
//       hour: '2-digit', 
//       minute: '2-digit' 
//     });
//   }
  
//   getElapsedTime(startTime: Date): string {
//     const start = new Date(startTime).getTime();
//     const now = new Date().getTime();
    
//     const elapsedMinutes = Math.floor((now - start) / (1000 * 60));
    
//     if (elapsedMinutes < 1) {
//       return 'Just started';
//     } else if (elapsedMinutes === 1) {
//       return '1 minute';
//     } else {
//       return `${elapsedMinutes} minutes`;
//     }
//   }
  
//   // Utility methods for item customizations
//   hasShots(item: any): boolean {
//     return item.customizations?.shots && item.customizations.shots.length > 0;
//   }
  
//   getShotsText(item: any): string {
//     const count = item.customizations.shots.length;
//     return `${count} shot${count > 1 ? 's' : ''}`;
//   }
  
//   hasSyrups(item: any): boolean {
//     return item.customizations?.syrups && item.customizations.syrups.length > 0;
//   }
  
//   getSyrupsText(item: any): string {
//     const count = item.customizations.syrups.length;
//     return `${count} syrup${count > 1 ? 's' : ''}`;
//   }
  
//   hasToppings(item: any): boolean {
//     return item.customizations?.toppings && item.customizations.toppings.length > 0;
//   }
  
//   getToppingsText(item: any): string {
//     const count = item.customizations.toppings.length;
//     return `${count} topping${count > 1 ? 's' : ''}`;
//   }
// }

// src/app/features/staff/orders/order-queue.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { 
  IonHeader, 
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonBackButton,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonButton,
  IonBadge
} from '@ionic/angular/standalone';

import { OrderService } from 'src/app/core/services/order.service';
import { Order } from 'src/app/core/models/order.model';
@Component({
  selector: 'app-order-queue',
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/staff/dashboard"></ion-back-button>
        </ion-buttons>
        <ion-title>Order Queue</ion-title>
      </ion-toolbar>
    </ion-header>
    
    <ion-content class="ion-padding">
      <div class="segment-container">
        <div class="segment-button" 
             [class.active]="activeSegment === 'pending'"
             (click)="activeSegment = 'pending'">
          Pending ({{ pendingOrders.length }})
        </div>
        <div class="segment-button" 
             [class.active]="activeSegment === 'processing'"
             (click)="activeSegment = 'processing'">
          Processing ({{ processingOrders.length }})
        </div>
        <div class="segment-button" 
             [class.active]="activeSegment === 'ready'"
             (click)="activeSegment = 'ready'">
          Ready ({{ readyOrders.length }})
        </div>
      </div>
      
      <!-- Pending Orders -->
      <div *ngIf="activeSegment === 'pending'" class="orders-container">
        <h2>Pending Orders</h2>
        
        <div *ngIf="pendingOrders.length === 0" class="empty-message">
          No pending orders at this time.
        </div>
        
        <ion-card *ngFor="let order of pendingOrders" class="order-card">
          <ion-card-header>
            <ion-card-title>Order #{{ order.id?.substring(0, 6) }}</ion-card-title>
          </ion-card-header>
          
          <ion-card-content>
            <div class="order-time">
              Ordered: {{ formatTime(order.orderTime) }}
            </div>
            
            <div class="order-items">
              <h3>Items</h3>
              <div *ngFor="let item of order.items" class="order-item">
                <span class="quantity">{{ item.quantity }}x</span>
                <span class="name">{{ item.name }}</span>
              </div>
            </div>
            
            <ion-button expand="block" (click)="startProcessing(order)">
              Start Processing
            </ion-button>
          </ion-card-content>
        </ion-card>
      </div>
      
      <!-- Processing Orders -->
      <div *ngIf="activeSegment === 'processing'" class="orders-container">
        <h2>Processing Orders</h2>
        
        <div *ngIf="processingOrders.length === 0" class="empty-message">
          No orders being processed at this time.
        </div>
        
        <ion-card *ngFor="let order of processingOrders" class="order-card">
          <ion-card-header>
            <ion-card-title>Order #{{ order.id?.substring(0, 6) }}</ion-card-title>
          </ion-card-header>
          
          <ion-card-content>
            <div class="order-time">
              Started: {{ formatTime(order.processTime) }}
            </div>
            
            <div class="order-items">
              <h3>Items</h3>
              <div *ngFor="let item of order.items" class="order-item">
                <span class="quantity">{{ item.quantity }}x</span>
                <span class="name">{{ item.name }}</span>
              </div>
            </div>
            
            <ion-button expand="block" color="success" (click)="markAsReady(order)">
              Mark as Ready
            </ion-button>
          </ion-card-content>
        </ion-card>
      </div>
      
      <!-- Ready Orders -->
      <div *ngIf="activeSegment === 'ready'" class="orders-container">
        <h2>Ready Orders</h2>
        
        <div *ngIf="readyOrders.length === 0" class="empty-message">
          No orders ready for pickup at this time.
        </div>
        
        <ion-card *ngFor="let order of readyOrders" class="order-card">
          <ion-card-header>
            <ion-card-title>Order #{{ order.id?.substring(0, 6) }}</ion-card-title>
          </ion-card-header>
          
          <ion-card-content>
            <div class="order-time">
              Ready since: {{ formatTime(order.completionTime) }}
            </div>
            
            <div class="order-items">
              <h3>Items</h3>
              <div *ngFor="let item of order.items" class="order-item">
                <span class="quantity">{{ item.quantity }}x</span>
                <span class="name">{{ item.name }}</span>
              </div>
            </div>
            
            <ion-button expand="block" (click)="markAsDelivered(order)">
              Mark as Delivered
            </ion-button>
          </ion-card-content>
        </ion-card>
      </div>
    </ion-content>
  `,
  styles: [`
    .segment-container {
      display: flex;
      background: #f4f5f8;
      border-radius: 16px;
      padding: 4px;
      margin-bottom: 20px;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
    }
    
    .segment-button {
      flex: 1;
      text-align: center;
      padding: 12px;
      cursor: pointer;
      border-radius: 12px;
      transition: all 0.3s ease;
    }
    
    .segment-button.active {
      background: white;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      color: var(--ion-color-primary);
      font-weight: 600;
    }
    
    .orders-container {
      margin-top: 20px;
    }
    
    .order-card {
      margin-bottom: 16px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
    
    .order-time {
      margin-bottom: 12px;
      color: var(--ion-color-medium);
      font-size: 14px;
    }
    
    .order-items h3 {
      margin-top: 0;
      font-size: 16px;
      font-weight: 600;
    }
    
    .order-item {
      padding: 6px 0;
      border-bottom: 1px solid rgba(0, 0, 0, 0.05);
    }
    
    .order-item:last-child {
      border-bottom: none;
    }
    
    .quantity {
      font-weight: bold;
      margin-right: 8px;
    }
    
    .empty-message {
      text-align: center;
      padding: 24px;
      background-color: var(--ion-color-light);
      border-radius: 8px;
      color: var(--ion-color-medium);
    }
  `],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonBackButton,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonButton,
    IonBadge
  ]
})
export class OrderQueueComponent implements OnInit {
  pendingOrders: Order[] = [];
  processingOrders: Order[] = [];
  readyOrders: Order[] = [];
  activeSegment: 'pending' | 'processing' | 'ready' = 'pending';
  
  constructor(private orderService: OrderService) {}
  
  ngOnInit() {
    this.loadOrders();
  }
  
  loadOrders() {
    // Load pending orders
    this.orderService.getOrdersByStatus('pending').subscribe(orders => {
      this.pendingOrders = orders;
    });
    
    // Load processing orders
    this.orderService.getOrdersByStatus('processing').subscribe(orders => {
      this.processingOrders = orders;
    });
    
    // Load ready orders
    this.orderService.getOrdersByStatus('ready').subscribe(orders => {
      this.readyOrders = orders;
    });
  }
  
  startProcessing(order: Order) {
    if (!order.id) return;
    
    this.orderService.updateOrderStatus(order.id, 'processing').subscribe(() => {
      this.loadOrders();
    });
  }
  
  markAsReady(order: Order) {
    if (!order.id) return;
    
    this.orderService.updateOrderStatus(order.id, 'ready').subscribe(() => {
      this.loadOrders();
    });
  }
  
  markAsDelivered(order: Order) {
    if (!order.id) return;
    
    this.orderService.updateOrderStatus(order.id, 'delivered').subscribe(() => {
      this.loadOrders();
    });
  }
  
  formatTime(date: any): string {
    if (!date) return '';
    
    if (typeof date === 'object' && date.toDate) {
      date = date.toDate();
    }
    
    return new Date(date).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}