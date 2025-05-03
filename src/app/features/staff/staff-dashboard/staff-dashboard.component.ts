// // src/app/features/staff/staff-dashboard/staff-dashboard.component.ts

// import { Component, OnInit } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { RouterModule } from '@angular/router';
// import { 
//   IonHeader, 
//   IonToolbar, 
//   IonTitle, 
//   IonContent, 
//   IonButtons, 
//   IonButton, 
//   IonIcon, 
//   IonCard, 
//   IonCardContent, 
//   IonCardHeader, 
//   IonCardTitle,
//   IonCardSubtitle,
//   IonGrid,
//   IonRow,
//   IonCol
// } from '@ionic/angular/standalone';
// import { addIcons } from 'ionicons';
// import { 
//   cafeOutline, 
//   timeOutline, 
//   statsChartOutline, 
//   peopleOutline, 
//   notificationsOutline, 
//   logOutOutline,
//   listOutline,
//   checkmarkDoneOutline,
//   constructOutline
// } from 'ionicons/icons';
// import { AuthService } from 'src/app/core/services/auth.service';
// import { StaffOrderService } from '../../../core/services/staff-order.service';

// @Component({
//   selector: 'app-staff-dashboard',
//   template: `
//     <ion-header>
//       <ion-toolbar color="primary">
//         <ion-title>Staff Dashboard</ion-title>
//         <ion-buttons slot="end">
//           <ion-button (click)="logout()">
//             <ion-icon name="log-out-outline" slot="icon-only"></ion-icon>
//           </ion-button>
//         </ion-buttons>
//       </ion-toolbar>
//     </ion-header>
    
//     <ion-content class="ion-padding">
//       <div class="welcome-section">
//         <h1>Welcome, {{ staffName }}</h1>
//         <p class="date-time">{{ currentDate | date:'EEEE, MMMM d, y' }} | {{ currentTime }}</p>
//       </div>
      
//       <div class="stats-section">
//         <ion-grid>
//           <ion-row>
//             <ion-col size="12" size-md="4">
//               <ion-card class="stat-card">
//                 <ion-card-content>
//                   <div class="stat-icon pending">
//                     <ion-icon name="time-outline"></ion-icon>
//                   </div>
//                   <div class="stat-details">
//                     <div class="stat-value">{{ pendingCount }}</div>
//                     <div class="stat-label">Pending Orders</div>
//                   </div>
//                 </ion-card-content>
//               </ion-card>
//             </ion-col>
            
//             <ion-col size="12" size-md="4">
//               <ion-card class="stat-card">
//                 <ion-card-content>
//                   <div class="stat-icon processing">
//                     <ion-icon name="cafe-outline"></ion-icon>
//                   </div>
//                   <div class="stat-details">
//                     <div class="stat-value">{{ processingCount }}</div>
//                     <div class="stat-label">In Progress</div>
//                   </div>
//                 </ion-card-content>
//               </ion-card>
//             </ion-col>
            
//             <ion-col size="12" size-md="4">
//               <ion-card class="stat-card">
//                 <ion-card-content>
//                   <div class="stat-icon completed">
//                     <ion-icon name="checkmark-done-outline"></ion-icon>
//                   </div>
//                   <div class="stat-details">
//                     <div class="stat-value">{{ completedTodayCount }}</div>
//                     <div class="stat-label">Completed Today</div>
//                   </div>
//                 </ion-card-content>
//               </ion-card>
//             </ion-col>
//           </ion-row>
//         </ion-grid>
//       </div>
      
//       <div class="actions-section">
//         <h2>Quick Actions</h2>
        
//         <ion-grid>
//           <ion-row>
//             <ion-col size="6" size-md="3">
//               <ion-card class="action-card" routerLink="/staff/orders/queue">
//                 <ion-card-content>
//                   <ion-icon name="list-outline"></ion-icon>
//                   <div class="action-label">Order Queue</div>
//                 </ion-card-content>
//               </ion-card>
//             </ion-col>
            
//             <ion-col size="6" size-md="3">
//               <ion-card class="action-card" routerLink="/staff/orders/history">
//                 <ion-card-content>
//                   <ion-icon name="time-outline"></ion-icon>
//                   <div class="action-label">Order History</div>
//                 </ion-card-content>
//               </ion-card>
//             </ion-col>
            
//             <ion-col size="6" size-md="3">
//               <ion-card class="action-card" routerLink="/staff/inventory">
//                 <ion-card-content>
//                   <ion-icon name="cafe-outline"></ion-icon>
//                   <div class="action-label">Inventory</div>
//                 </ion-card-content>
//               </ion-card>
//             </ion-col>
            
//             <ion-col size="6" size-md="3">
//               <ion-card class="action-card" routerLink="/staff/settings">
//                 <ion-card-content>
//                   <ion-icon name="construct-outline"></ion-icon>
//                   <div class="action-label">Settings</div>
//                 </ion-card-content>
//               </ion-card>
//             </ion-col>
//           </ion-row>
//         </ion-grid>
//       </div>
      
//       <div class="recent-section">
//         <h2>Recent Activity</h2>
        
//         <ion-card *ngIf="recentOrders.length === 0" class="empty-card">
//           <ion-card-content>
//             <p>No recent order activity to display.</p>
//           </ion-card-content>
//         </ion-card>
        
//         <ion-card *ngFor="let order of recentOrders" class="recent-card" [routerLink]="['/staff/orders/detail', order.id]">
//           <ion-card-header>
//             <ion-card-subtitle>
//               {{ order.orderTime | date:'shortTime' }}
//             </ion-card-subtitle>
//             <ion-card-title>
//               Order #{{ order.id?.substring(0, 6) }}
//             </ion-card-title>
//           </ion-card-header>
          
//           <ion-card-content>
//             <div class="order-overview">
//               <div class="order-items-count">
//                 <ion-icon name="cafe-outline"></ion-icon>
//                 <span>{{ order.items.length }} items</span>
//               </div>
              
//               <div class="order-status">
//                 <ion-icon [name]="getStatusIcon(order.status)"></ion-icon>
//                 <span>{{ getStatusLabel(order.status) }}</span>
//               </div>
//             </div>
//           </ion-card-content>
//         </ion-card>
//       </div>
//     </ion-content>
//   `,
//   styles: [`
//     .welcome-section {
//       margin-bottom: 24px;
//     }
    
//     .welcome-section h1 {
//       margin-bottom: 8px;
//       font-size: 1.5rem;
//     }
    
//     .date-time {
//       color: var(--ion-color-medium);
//     }
    
//     .stats-section {
//       margin-bottom: 24px;
//     }
    
//     .stat-card {
//       margin: 0;
//     }
    
//     .stat-card ion-card-content {
//       display: flex;
//       align-items: center;
//       padding: 16px;
//     }
    
//     .stat-icon {
//       width: 48px;
//       height: 48px;
//       border-radius: 50%;
//       display: flex;
//       align-items: center;
//       justify-content: center;
//       margin-right: 16px;
//     }
    
//     .stat-icon ion-icon {
//       font-size: 24px;
//       color: white;
//     }
    
//     .stat-icon.pending {
//       background-color: var(--ion-color-warning);
//     }
    
//     .stat-icon.processing {
//       background-color: var(--ion-color-primary);
//     }
    
//     .stat-icon.completed {
//       background-color: var(--ion-color-success);
//     }
    
//     .stat-details {
//       flex: 1;
//     }
    
//     .stat-value {
//       font-size: 1.5rem;
//       font-weight: bold;
//     }
    
//     .stat-label {
//       color: var(--ion-color-medium);
//       font-size: 0.9rem;
//     }
    
//     .actions-section {
//       margin-bottom: 24px;
//     }
    
//     .actions-section h2 {
//       margin-bottom: 16px;
//       font-size: 1.2rem;
//       font-weight: 600;
//     }
    
//     .action-card {
//       margin: 0;
//       height: 100%;
//     }
    
//     .action-card ion-card-content {
//       display: flex;
//       flex-direction: column;
//       align-items: center;
//       justify-content: center;
//       text-align: center;
//       padding: 16px;
//       height: 100%;
//     }
    
//     .action-card ion-icon {
//       font-size: 32px;
//       margin-bottom: 8px;
//       color: var(--ion-color-primary);
//     }
    
//     .action-label {
//       font-weight: 500;
//     }
    
//     .recent-section h2 {
//       margin-bottom: 16px;
//       font-size: 1.2rem;
//       font-weight: 600;
//     }
    
//     .recent-card {
//       margin-bottom: 12px;
//     }
    
//     .order-overview {
//       display: flex;
//       justify-content: space-between;
//     }
    
//     .order-items-count, .order-status {
//       display: flex;
//       align-items: center;
//     }
    
//     .order-items-count ion-icon, .order-status ion-icon {
//       margin-right: 4px;
//     }
    
//     .empty-card {
//       text-align: center;
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
//     IonButtons, 
//     IonButton, 
//     IonIcon, 
//     IonCard, 
//     IonCardContent, 
//     IonCardHeader, 
//     IonCardTitle,
//     IonCardSubtitle,
//     IonGrid,
//     IonRow,
//     IonCol
//   ]
// })
// export class StaffDashboardComponent implements OnInit {
//   staffName: string = 'Staff Member';
//   currentDate = new Date();
//   currentTime: string = this.formatTime(new Date());
  
//   pendingCount: number = 0;
//   processingCount: number = 0;
//   completedTodayCount: number = 0;
  
//   recentOrders: any[] = [];
  
//   private clockInterval: any;
  
//   constructor(
//     private authService: AuthService,
//     private staffOrderService: StaffOrderService
//   ) {
//     addIcons({
//       cafeOutline, 
//       timeOutline, 
//       statsChartOutline, 
//       peopleOutline, 
//       notificationsOutline, 
//       logOutOutline,
//       listOutline,
//       checkmarkDoneOutline,
//       constructOutline
//     });
//   }
  
//   ngOnInit() {
//     // Get staff name from userProfile$ instead of currentStaff
//     this.authService.userProfile$.subscribe(profile => {
//       if (profile) {
//         this.staffName = profile.displayName || 'Staff Member';
//       }
//     });
    
//     // Start clock
//     this.clockInterval = setInterval(() => {
//       this.currentTime = this.formatTime(new Date());
//     }, 1000);
    
//     // Load order counts
//     this.loadOrderCounts();
    
//     // Load recent orders
//     this.loadRecentOrders();
//   }
  
//   ngOnDestroy() {
//     if (this.clockInterval) {
//       clearInterval(this.clockInterval);
//     }
//   }
  
//   formatTime(date: Date): string {
//     return date.toLocaleTimeString([], { 
//       hour: '2-digit', 
//       minute: '2-digit', 
//       second: '2-digit' 
//     });
//   }
  
//   loadOrderCounts() {
//     // Get pending orders count
//     this.staffOrderService.getPendingOrders().subscribe(orders => {
//       this.pendingCount = orders.length;
//     });
    
//     // Get processing orders count
//     this.staffOrderService.getProcessingOrders().subscribe(orders => {
//       this.processingCount = orders.length;
//     });
    
//     // Get completed orders count for today
//     this.staffOrderService.getCompletedOrders().subscribe(orders => {
//       // Filter for today
//       const today = new Date();
//       today.setHours(0, 0, 0, 0);
      
//       this.completedTodayCount = orders.filter(order => {
//         const orderDate = new Date(order.orderTime);
//         orderDate.setHours(0, 0, 0, 0);
//         return orderDate.getTime() === today.getTime();
//       }).length;
//     });
//   }
  
//   loadRecentOrders() {
//     // A combination of recent pending, processing, and completed orders
//     this.staffOrderService.getPendingOrders().subscribe(pendingOrders => {
//       this.staffOrderService.getProcessingOrders().subscribe(processingOrders => {
        
//         // Combine orders
//         const combinedOrders = [...pendingOrders, ...processingOrders];
        
//         // Sort by most recent
//         combinedOrders.sort((a, b) => {
//           return new Date(b.orderTime).getTime() - new Date(a.orderTime).getTime();
//         });
        
//         // Take only the 5 most recent
//         this.recentOrders = combinedOrders.slice(0, 5);
//       });
//     });
//   }
  
//   getStatusIcon(status: string): string {
//     switch (status) {
//       case 'pending': return 'time-outline';
//       case 'processing': return 'cafe-outline';
//       case 'ready': return 'checkmark-done-outline';
//       case 'delivered': return 'checkmark-done-outline';
//       case 'cancelled': return 'close-circle-outline';
//       default: return 'time-outline';
//     }
//   }
  
//   getStatusLabel(status: string): string {
//     switch (status) {
//       case 'pending': return 'Pending';
//       case 'processing': return 'Preparing';
//       case 'ready': return 'Ready';
//       case 'delivered': return 'Delivered';
//       case 'cancelled': return 'Cancelled';
//       default: return status;
//     }
//   }
  
//   logout() {
//     this.authService.logout();
//   }
// }

// src/app/features/staff/staff-dashboard/staff-dashboard.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonContent, 
  IonButtons, 
  IonButton, 
  IonIcon, 
  IonCard, 
  IonCardContent, 
  IonGrid, 
  IonRow, 
  IonCol
} from '@ionic/angular/standalone';

import { AuthService } from '../../../core/services/auth.service';
import { OrderService } from '../../../core/services/order.service';

@Component({
  selector: 'app-staff-dashboard',
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>Staff Dashboard</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="logout()">
            <ion-icon name="log-out-outline" slot="icon-only"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    
    <ion-content class="ion-padding">
      <h1>Welcome, {{ staffName }}</h1>
      
      <ion-grid>
        <ion-row>
          <ion-col size="12" size-md="6">
            <ion-card (click)="goToOrderQueue()">
              <ion-card-content class="card-content">
                <ion-icon name="cafe-outline" class="card-icon"></ion-icon>
                <h2>Manage Orders</h2>
                <p>View and process customer orders</p>
              </ion-card-content>
            </ion-card>
          </ion-col>
          
          <ion-col size="12" size-md="6">
            <ion-card (click)="logout()">
              <ion-card-content class="card-content">
                <ion-icon name="log-out-outline" class="card-icon"></ion-icon>
                <h2>Logout</h2>
                <p>Exit staff dashboard</p>
              </ion-card-content>
            </ion-card>
          </ion-col>
        </ion-row>
      </ion-grid>
      
      <div class="order-stats">
        <h2>Order Statistics</h2>
        <p>Pending Orders: {{ pendingCount }}</p>
        <p>Processing Orders: {{ processingCount }}</p>
      </div>
    </ion-content>
  `,
  styles: [`
    h1 {
      margin-bottom: 24px;
    }
    
    .card-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      padding: 24px;
    }
    
    .card-icon {
      font-size: 48px;
      margin-bottom: 16px;
      color: var(--ion-color-primary);
    }
    
    ion-card {
      cursor: pointer;
      transition: transform 0.2s ease;
    }
    
    ion-card:hover {
      transform: translateY(-5px);
    }
    
    .order-stats {
      margin-top: 32px;
      padding: 16px;
      background-color: var(--ion-color-light);
      border-radius: 8px;
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
    IonButton,
    IonIcon,
    IonCard,
    IonCardContent,
    IonGrid,
    IonRow,
    IonCol
  ]
})
export class StaffDashboardComponent implements OnInit {
  staffName: string = 'Staff Member';
  pendingCount: number = 0;
  processingCount: number = 0;
  
  constructor(
    private authService: AuthService,
    private orderService: OrderService,
    private router: Router
  ) {}
  
  ngOnInit() {
    // Get user profile
    this.authService.userProfile$.subscribe(profile => {
      if (profile) {
        this.staffName = profile.displayName || 'Staff Member';
      }
    });
    
    // Load order counts
    this.loadOrderCounts();
  }
  
  loadOrderCounts() {
    // Get pending orders
    this.orderService.getOrdersByStatus('pending').subscribe(orders => {
      this.pendingCount = orders.length;
    });
    
    // Get processing orders
    this.orderService.getOrdersByStatus('processing').subscribe(orders => {
      this.processingCount = orders.length;
    });
  }
  
  goToOrderQueue() {
    this.router.navigate(['/staff/orders']);
  }
  
  logout() {
    this.authService.logout().then(() => {
      this.router.navigate(['/auth/login']);
    });
  }
}