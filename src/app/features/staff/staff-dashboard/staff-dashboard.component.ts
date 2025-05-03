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
  IonCol,
  IonBadge,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonRefresher,
  IonRefresherContent
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  cafeOutline, 
  logOutOutline, 
  qrCodeOutline,
  timeOutline,
  listOutline,
  documentTextOutline,
  refreshOutline,
  homeOutline,
  notificationsOutline,
  statsChartOutline,
  readerOutline,
  peopleOutline,
  settingsOutline
} from 'ionicons/icons';

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
      <ion-refresher slot="fixed" (ionRefresh)="refreshData($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>
    
      <div class="welcome-section">
        <h1>Welcome, {{ staffName }}</h1>
        <p class="role-badge">
          <ion-badge color="primary">{{ userRole }}</ion-badge>
          <span class="date-time">{{ currentDate | date:'EEEE, MMMM d, y' }}</span>
        </p>
      </div>
      
      <!-- Order Statistics Cards -->
      <ion-grid>
        <ion-row>
          <ion-col size="12" size-md="4">
            <ion-card class="stat-card" routerLink="/staff/orders/queue">
              <ion-card-content>
                <div class="stat-icon warning">
                  <ion-icon name="time-outline"></ion-icon>
                </div>
                <div class="stat-details">
                  <div class="stat-value">{{ pendingCount }}</div>
                  <div class="stat-label">Pending Orders</div>
                </div>
              </ion-card-content>
            </ion-card>
          </ion-col>
          
          <ion-col size="12" size-md="4">
            <ion-card class="stat-card" routerLink="/staff/orders/queue">
              <ion-card-content>
                <div class="stat-icon primary">
                  <ion-icon name="cafe-outline"></ion-icon>
                </div>
                <div class="stat-details">
                  <div class="stat-value">{{ processingCount }}</div>
                  <div class="stat-label">In Progress</div>
                </div>
              </ion-card-content>
            </ion-card>
          </ion-col>
          
          <ion-col size="12" size-md="4">
            <ion-card class="stat-card" routerLink="/staff/orders/history">
              <ion-card-content>
                <div class="stat-icon success">
                  <ion-icon name="checkmark-outline"></ion-icon>
                </div>
                <div class="stat-details">
                  <div class="stat-value">{{ completedCount }}</div>
                  <div class="stat-label">Completed Today</div>
                </div>
              </ion-card-content>
            </ion-card>
          </ion-col>
        </ion-row>
      </ion-grid>
      
      <!-- Action Cards -->
      <h2 class="section-title">Quick Actions</h2>
      <ion-grid>
        <ion-row>
          <ion-col size="6" size-md="3">
            <ion-card class="action-card" routerLink="/staff/orders/queue">
              <ion-card-content class="action-content">
                <ion-icon name="list-outline" class="action-icon"></ion-icon>
                <div class="action-label">Order Queue</div>
              </ion-card-content>
            </ion-card>
          </ion-col>
          
          <ion-col size="6" size-md="3">
            <ion-card class="action-card" routerLink="/staff/orders/history">
              <ion-card-content class="action-content">
                <ion-icon name="time-outline" class="action-icon"></ion-icon>
                <div class="action-label">Order History</div>
              </ion-card-content>
            </ion-card>
          </ion-col>
          
          <ion-col size="6" size-md="3">
            <ion-card class="action-card" routerLink="/staff/tables/qr-generator">
              <ion-card-content class="action-content">
                <ion-icon name="qr-code-outline" class="action-icon"></ion-icon>
                <div class="action-label">QR Codes</div>
              </ion-card-content>
            </ion-card>
          </ion-col>
          
          <ion-col size="6" size-md="3">
            <ion-card class="action-card" (click)="logout()">
              <ion-card-content class="action-content">
                <ion-icon name="log-out-outline" class="action-icon"></ion-icon>
                <div class="action-label">Logout</div>
              </ion-card-content>
            </ion-card>
          </ion-col>
        </ion-row>
      </ion-grid>
      
      <!-- Recent Orders -->
      <div class="recent-section">
        <h2 class="section-title">Recent Activity</h2>
        
        <ion-card *ngIf="recentOrders.length === 0" class="empty-card">
          <ion-card-content>
            No recent order activity to display.
          </ion-card-content>
        </ion-card>
        
        <ion-card *ngFor="let order of recentOrders" class="recent-card" [routerLink]="['/staff/orders/detail', order.id]">
          <ion-card-header>
            <ion-card-subtitle>
              {{ formatTime(order.orderTime) }}
            </ion-card-subtitle>
            <ion-card-title>
              Order #{{ order.id?.substring(0, 6) }}
              <ion-badge [color]="getStatusColor(order.status)">{{ getStatusLabel(order.status) }}</ion-badge>
            </ion-card-title>
          </ion-card-header>
          
          <ion-card-content>
            <div class="order-overview">
              <div class="order-items-count">
                <ion-icon name="cafe-outline"></ion-icon>
                <span>{{ order.items?.length || 0 }} items</span>
              </div>
              
              <div class="order-total" *ngIf="order.total">
                Total: {{ order.total | currency }}
              </div>
            </div>
          </ion-card-content>
        </ion-card>
      </div>
    </ion-content>
  `,
  styles: [`
    .welcome-section {
      margin-bottom: 24px;
    }
    
    .welcome-section h1 {
      margin-bottom: 8px;
      font-size: 1.8rem;
      font-weight: 600;
    }
    
    .role-badge {
      display: flex;
      align-items: center;
      margin-top: 8px;
    }
    
    .date-time {
      margin-left: 12px;
      color: var(--ion-color-medium);
    }
    
    .section-title {
      margin: 24px 0 16px;
      font-size: 1.2rem;
      font-weight: 600;
      color: var(--ion-color-dark);
    }
    
    .stat-card {
      margin: 0;
      height: 100%;
      border-radius: 12px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
      transition: transform 0.2s ease;
    }
    
    .stat-card:hover {
      transform: translateY(-5px);
    }
    
    .stat-card ion-card-content {
      display: flex;
      align-items: center;
      padding: 16px;
    }
    
    .stat-icon {
      width: 56px;
      height: 56px;
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 16px;
    }
    
    .stat-icon ion-icon {
      font-size: 28px;
      color: white;
    }
    
    .stat-icon.warning {
      background-color: var(--ion-color-warning);
    }
    
    .stat-icon.primary {
      background-color: var(--ion-color-primary);
    }
    
    .stat-icon.success {
      background-color: var(--ion-color-success);
    }
    
    .stat-details {
      flex: 1;
    }
    
    .stat-value {
      font-size: 1.8rem;
      font-weight: bold;
    }
    
    .stat-label {
      color: var(--ion-color-medium);
      font-size: 0.9rem;
    }
    
    .action-card {
      margin: 0;
      height: 100%;
      border-radius: 12px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
      transition: transform 0.2s ease;
    }
    
    .action-card:hover {
      transform: translateY(-5px);
    }
    
    .action-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 16px;
      height: 100%;
    }
    
    .action-icon {
      font-size: 32px;
      margin-bottom: 8px;
      color: var(--ion-color-primary);
    }
    
    .action-label {
      font-weight: 500;
    }
    
    .recent-section {
      margin-top: 24px;
    }
    
    .empty-card {
      text-align: center;
      color: var(--ion-color-medium);
    }
    
    .recent-card {
      margin-bottom: 12px;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    }
    
    .recent-card ion-card-header {
      padding-bottom: 8px;
    }
    
    .recent-card ion-card-title {
      font-size: 1.1rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .recent-card ion-card-subtitle {
      font-size: 0.8rem;
    }
    
    .order-overview {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .order-items-count {
      display: flex;
      align-items: center;
    }
    
    .order-items-count ion-icon {
      margin-right: 4px;
    }
    
    .order-total {
      font-weight: 500;
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
    IonCol,
    IonBadge,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonRefresher,
    IonRefresherContent
  ]
})
export class StaffDashboardComponent implements OnInit {
  staffName: string = 'Staff Member';
  userRole: string = 'staff';
  currentDate = new Date();
  pendingCount: number = 0;
  processingCount: number = 0;
  completedCount: number = 0;
  recentOrders: any[] = [];
  
  constructor(
    private authService: AuthService,
    private orderService: OrderService,
    private router: Router
  ) {
    // Add icons that are used in the template
    addIcons({
      cafeOutline,
      logOutOutline,
      qrCodeOutline,
      timeOutline,
      listOutline,
      documentTextOutline,
      refreshOutline,
      homeOutline,
      notificationsOutline,
      statsChartOutline,
      readerOutline,
      peopleOutline,
      settingsOutline
    });
    
    console.log('🏢 StaffDashboardComponent constructed');
  }
  
  ngOnInit() {
    console.log('🏢 StaffDashboardComponent initialized');
    
    // Get user profile
    this.authService.userProfile$.subscribe(profile => {
      console.log('👤 User profile received in dashboard:', profile);
      if (profile) {
        this.staffName = profile.displayName || 'Staff Member';
        this.userRole = profile.role || 'staff';
        console.log('🔑 User role in dashboard:', this.userRole);
      }
    });
    
    // Load data
    this.loadData();
  }
  
  loadData() {
    console.log('📊 Loading dashboard data');
    this.loadOrderCounts();
    this.loadRecentOrders();
  }
  
  refreshData(event: any) {
    console.log('🔄 Refreshing dashboard data');
    this.loadData();
    
    // Complete the refresh event
    setTimeout(() => {
      event.target.complete();
    }, 1000);
  }
  
  loadOrderCounts() {
    // Get pending orders
    this.orderService.getOrdersByStatus('pending').subscribe(orders => {
      console.log('📋 Pending orders:', orders);
      this.pendingCount = orders?.length || 0;
    });
    
    // Get processing orders
    this.orderService.getOrdersByStatus('processing').subscribe(orders => {
      console.log('📋 Processing orders:', orders);
      this.processingCount = orders?.length || 0;
    });
    
    // Get completed orders for today
    this.orderService.getOrdersByStatus('delivered').subscribe(orders => {
      console.log('📋 Completed orders:', orders);
      
      // Filter for today only
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todayOrders = orders.filter(order => {
        const orderDate = new Date(order.orderTime);
        orderDate.setHours(0, 0, 0, 0);
        return orderDate.getTime() === today.getTime();
      });
      
      this.completedCount = todayOrders.length;
    });
  }
  
  loadRecentOrders() {
    // Combine pending and processing orders for recent activity
    this.orderService.getOrdersByStatus('pending').subscribe(pendingOrders => {
      this.orderService.getOrdersByStatus('processing').subscribe(processingOrders => {
        // Combine and sort by most recent
        const combined = [...pendingOrders, ...processingOrders];
        combined.sort((a, b) => {
          return new Date(b.orderTime).getTime() - new Date(a.orderTime).getTime();
        });
        
        // Take just the 5 most recent
        this.recentOrders = combined.slice(0, 5);
      });
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
  
  getStatusLabel(status: string): string {
    switch (status) {
      case 'pending': return 'Pending';
      case 'processing': return 'Processing';
      case 'ready': return 'Ready';
      case 'delivered': return 'Delivered';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  }
  
  formatTime(date: any): string {
    if (!date) return '';
    
    // Handle Firebase Timestamp
    if (typeof date === 'object' && date.toDate) {
      date = date.toDate();
    }
    
    return new Date(date).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  goToOrderQueue() {
    console.log('🔄 Navigating to order queue');
    this.router.navigate(['/staff/orders/queue']);
  }
  
  logout() {
    console.log('🚪 Logging out from staff dashboard');
    this.authService.logout().then(() => {
      this.router.navigate(['/auth/login']);
    });
  }
}