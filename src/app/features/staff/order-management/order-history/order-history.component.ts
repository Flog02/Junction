// src/app/features/staff/order-management/order-history/order-history.component.ts

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { 
    IonList,IonItem,
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonContent, 
  IonButtons, 
  IonBackButton,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonSearchbar,
  IonCard,
  IonCardHeader,
  IonCardContent,
  IonCardTitle,
  IonBadge,
  IonIcon,
  IonButton,
  IonDatetime,
  IonPopover,
  IonSelect,
  IonSelectOption,
  IonSkeletonText
} from '@ionic/angular/standalone';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { addIcons } from 'ionicons';
import { 
  calendarOutline, 
  timeOutline, 
  cafeOutline, 
  personOutline, 
  filterOutline, 
  searchOutline,
  arrowDownOutline,
  arrowUpOutline
} from 'ionicons/icons';

import { StaffOrderService } from '../../../../core/services/staff-order.service';
import { Order } from '../../../../core/models/order.model';

@Component({
  selector: 'app-order-history',
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/staff/dashboard"></ion-back-button>
        </ion-buttons>
        <ion-title>Order History</ion-title>
      </ion-toolbar>
      
      <ion-toolbar>
        <ion-searchbar 
          [(ngModel)]="searchTerm" 
          (ionInput)="handleSearch($event)"
          placeholder="Search by order ID or customer"
        ></ion-searchbar>
      </ion-toolbar>
      
      <ion-toolbar>
        <div class="filter-toolbar">
          <ion-segment [(ngModel)]="selectedSegment" (ionChange)="segmentChanged()">
            <ion-segment-button value="all">
              <ion-label>All</ion-label>
            </ion-segment-button>
            <ion-segment-button value="today">
              <ion-label>Today</ion-label>
            </ion-segment-button>
            <ion-segment-button value="week">
              <ion-label>This Week</ion-label>
            </ion-segment-button>
          </ion-segment>
          
          <ion-button fill="clear" id="date-filter-trigger">
            <ion-icon name="calendar-outline" slot="icon-only"></ion-icon>
          </ion-button>
          
          <ion-popover trigger="date-filter-trigger">
            <ng-template>
              <ion-datetime 
                presentation="date" 
                [(ngModel)]="selectedDate"
                (ionChange)="dateChanged()"
              ></ion-datetime>
            </ng-template>
          </ion-popover>
          
          <ion-button fill="clear" id="status-filter-trigger">
            <ion-icon name="filter-outline" slot="icon-only"></ion-icon>
          </ion-button>
          
          <ion-popover trigger="status-filter-trigger">
            <ng-template>
              <ion-list>
                <ion-item>
                  <ion-select 
                    [(ngModel)]="selectedStatus"
                    (ionChange)="statusChanged()"
                    placeholder="Filter by status"
                  >
                    <ion-select-option value="">All Statuses</ion-select-option>
                    <ion-select-option value="pending">Pending</ion-select-option>
                    <ion-select-option value="processing">Processing</ion-select-option>
                    <ion-select-option value="ready">Ready</ion-select-option>
                    <ion-select-option value="delivered">Delivered</ion-select-option>
                    <ion-select-option value="cancelled">Cancelled</ion-select-option>
                  </ion-select>
                </ion-item>
              </ion-list>
            </ng-template>
          </ion-popover>
        </div>
      </ion-toolbar>
    </ion-header>
    
    <ion-content class="ion-padding">
      <!-- Loading state -->
      <div *ngIf="isLoading" class="loading-container">
        <ion-card *ngFor="let i of [1, 2, 3]">
          <ion-card-header>
            <ion-skeleton-text [animated]="true" style="width: 50%"></ion-skeleton-text>
          </ion-card-header>
          <ion-card-content>
            <ion-skeleton-text [animated]="true" style="width: 70%"></ion-skeleton-text>
            <ion-skeleton-text [animated]="true" style="width: 60%"></ion-skeleton-text>
            <ion-skeleton-text [animated]="true" style="width: 80%"></ion-skeleton-text>
          </ion-card-content>
        </ion-card>
      </div>
      
      <!-- Empty state -->
      <div *ngIf="!isLoading && filteredOrders.length === 0" class="empty-state">
        <ion-icon name="cafe-outline" size="large"></ion-icon>
        <h2>No Orders Found</h2>
        <p>Try changing your filters or search term</p>
      </div>
      
      <!-- Orders list -->
      <div *ngIf="!isLoading && filteredOrders.length > 0" class="orders-container">
        <div class="order-count">
          Showing {{ filteredOrders.length }} {{ filteredOrders.length === 1 ? 'order' : 'orders' }}
        </div>
        
        <div class="sort-controls">
          <span>Sort by:</span>
          <ion-button fill="clear" size="small" (click)="toggleSort('date')">
            Date
            <ion-icon 
              *ngIf="sortField === 'date'" 
              [name]="sortDirection === 'asc' ? 'arrow-up-outline' : 'arrow-down-outline'"
            ></ion-icon>
          </ion-button>
          <ion-button fill="clear" size="small" (click)="toggleSort('status')">
            Status
            <ion-icon 
              *ngIf="sortField === 'status'" 
              [name]="sortDirection === 'asc' ? 'arrow-up-outline' : 'arrow-down-outline'"
            ></ion-icon>
          </ion-button>
          <ion-button fill="clear" size="small" (click)="toggleSort('total')">
            Total
            <ion-icon 
              *ngIf="sortField === 'total'" 
              [name]="sortDirection === 'asc' ? 'arrow-up-outline' : 'arrow-down-outline'"
            ></ion-icon>
          </ion-button>
        </div>
        
        <ion-card 
          *ngFor="let order of filteredOrders" 
          class="order-card"
          [routerLink]="['/staff/orders/detail', order.id]"
        >
          <ion-card-header>
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
                <ion-icon name="time-outline"></ion-icon>
                <span>{{ formatDate(order.orderTime) }}</span>
              </div>
              
              <div class="detail-item">
                <ion-icon name="person-outline"></ion-icon>
                <span>{{ order.userId }}</span>
              </div>
              
              <div class="detail-item">
                <ion-icon name="cafe-outline"></ion-icon>
                <span>{{ order.items.length }} items</span>
              </div>
            </div>
            
            <div class="order-summary">
              <div class="order-total">
                Total: {{ order.total | currency }}
              </div>
              
              <div class="order-items">
                {{ summarizeOrderItems(order) }}
              </div>
            </div>
            
            <div class="timeline" *ngIf="order.status !== 'cancelled'">
              <div class="event" [class.completed]="isEventCompleted(order, 'ordered')">
                <div class="event-dot"></div>
                <div class="event-time" *ngIf="order.orderTime">
                  {{ formatTimeOnly(order.orderTime) }}
                </div>
                <div class="event-label">Ordered</div>
              </div>
              
              <div class="event" [class.completed]="isEventCompleted(order, 'processing')">
                <div class="event-dot"></div>
                <div class="event-time" *ngIf="order.processTime">
                  {{ formatTimeOnly(order.processTime) }}
                </div>
                <div class="event-label">Started</div>
              </div>
              
              <div class="event" [class.completed]="isEventCompleted(order, 'ready')">
                <div class="event-dot"></div>
                <div class="event-time" *ngIf="order.completionTime">
                  {{ formatTimeOnly(order.completionTime) }}
                </div>
                <div class="event-label">Ready</div>
              </div>
              
              <div class="event" [class.completed]="isEventCompleted(order, 'delivered')">
                <div class="event-dot"></div>
                <div class="event-time" *ngIf="order.deliveredBy">
                  {{ order.deliveredBy }}
                </div>
                <div class="event-label">Delivered</div>
              </div>
            </div>
          </ion-card-content>
        </ion-card>
      </div>
    </ion-content>
  `,
  styles: [`
    .filter-toolbar {
      display: flex;
      align-items: center;
      padding: 0 8px;
    }
    
    ion-segment {
      flex: 1;
    }
    
    .loading-container {
      padding: 16px;
    }
    
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px 16px;
      text-align: center;
    }
    
    .empty-state ion-icon {
      font-size: 48px;
      margin-bottom: 16px;
      color: var(--ion-color-medium);
    }
    
    .empty-state h2 {
      margin: 0 0 8px;
      font-size: 20px;
    }
    
    .empty-state p {
      margin: 0;
      color: var(--ion-color-medium);
    }
    
    .orders-container {
      padding: 8px;
    }
    
    .order-count {
      margin-bottom: 16px;
      font-size: 14px;
      color: var(--ion-color-medium);
    }
    
    .sort-controls {
      display: flex;
      align-items: center;
      margin-bottom: 16px;
      font-size: 14px;
    }
    
    .sort-controls span {
      margin-right: 8px;
      color: var(--ion-color-medium);
    }
    
    .order-card {
      margin-bottom: 16px;
      cursor: pointer;
    }
    
    .order-title {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .order-details {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      margin-bottom: 16px;
    }
    
    .detail-item {
      display: flex;
      align-items: center;
    }
    
    .detail-item ion-icon {
      margin-right: 4px;
      font-size: 16px;
      color: var(--ion-color-medium);
    }
    
    .order-summary {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 16px;
    }
    
    .order-total {
      font-weight: bold;
    }
    
    .order-items {
      color: var(--ion-color-medium);
      font-size: 14px;
      flex: 1;
      margin-left: 16px;
    }
    
    .timeline {
      display: flex;
      justify-content: space-between;
      position: relative;
      padding-top: 8px;
    }
    
    .timeline::before {
      content: '';
      position: absolute;
      top: 16px;
      left: 0;
      right: 0;
      height: 2px;
      background-color: var(--ion-color-light);
      z-index: 0;
    }
    
    .event {
      display: flex;
      flex-direction: column;
      align-items: center;
      position: relative;
      z-index: 1;
      opacity: 0.5;
    }
    
    .event.completed {
      opacity: 1;
    }
    
    .event-dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background-color: var(--ion-color-medium);
      margin-bottom: 4px;
    }
    
    .event.completed .event-dot {
      background-color: var(--ion-color-success);
    }
    
    .event-time {
      font-size: 10px;
      margin-bottom: 2px;
    }
    
    .event-label {
      font-size: 10px;
      text-align: center;
    }
  `],
  standalone: true,
  imports: [
    IonList,IonItem,
    CommonModule,
    RouterModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonBackButton,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    IonSearchbar,
    IonCard,
    IonCardHeader,
    IonCardContent,
    IonCardTitle,
    IonBadge,
    IonIcon,
    IonButton,
    IonDatetime,
    IonPopover,
    IonSelect,
    IonSelectOption,
    IonSkeletonText
  ]
})
export class OrderHistoryComponent implements OnInit, OnDestroy {
  allOrders: Order[] = [];
  filteredOrders: Order[] = [];
  isLoading = true;
  
  // Search and filter
  searchTerm = '';
  selectedSegment = 'all';
  selectedDate: string | null = null;
  selectedStatus = '';
  
  // Sorting
  sortField = 'date';
  sortDirection: 'asc' | 'desc' = 'desc';
  
  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();
  
  constructor(private staffOrderService: StaffOrderService) {
    addIcons({
      calendarOutline, 
      timeOutline, 
      cafeOutline, 
      personOutline, 
      filterOutline, 
      searchOutline,
      arrowDownOutline,
      arrowUpOutline
    });
  }
  
  ngOnInit() {
    // Set up search debounce
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(searchTerm => {
      this.searchTerm = searchTerm;
      this.applyFilters();
    });
    
    // Load orders
    this.loadOrders();
  }
  
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  ionViewWillEnter() {
    // Refresh data when view is entered
    this.loadOrders();
  }
  
  loadOrders() {
    this.isLoading = true;
    
    // Load completed orders (ready + delivered)
    this.staffOrderService.getCompletedOrders()
      .pipe(takeUntil(this.destroy$))
      .subscribe(completedOrders => {
        // Also get pending and processing orders to show all history
        this.staffOrderService.getPendingOrders()
          .pipe(takeUntil(this.destroy$))
          .subscribe(pendingOrders => {
            this.staffOrderService.getProcessingOrders()
              .pipe(takeUntil(this.destroy$))
              .subscribe(processingOrders => {
                // Combine all orders
                this.allOrders = [...completedOrders, ...pendingOrders, ...processingOrders];
                
                // Apply filters
                this.applyFilters();
                
                this.isLoading = false;
              });
          });
      });
  }
  
  handleSearch(event: any) {
    this.searchSubject.next(event.target.value);
  }
  
  segmentChanged() {
    this.applyFilters();
  }
  
  dateChanged() {
    this.selectedSegment = 'all'; // Reset segment when date is selected
    this.applyFilters();
  }
  
  statusChanged() {
    this.applyFilters();
  }
  
  applyFilters() {
    // Start with all orders
    let orders = [...this.allOrders];
    
    // Apply search filter
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      orders = orders.filter(order => 
        order.id?.toLowerCase().includes(term) || 
        order.userId.toLowerCase().includes(term)
      );
    }
    
    // Apply segment filter
    if (this.selectedSegment === 'today') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      orders = orders.filter(order => {
        const orderDate = new Date(order.orderTime);
        orderDate.setHours(0, 0, 0, 0);
        return orderDate.getTime() === today.getTime();
      });
    } else if (this.selectedSegment === 'week') {
      const today = new Date();
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)
      weekStart.setHours(0, 0, 0, 0);
      
      orders = orders.filter(order => {
        const orderDate = new Date(order.orderTime);
        return orderDate >= weekStart;
      });
    }
    
    // Apply date filter
    if (this.selectedDate) {
      const filterDate = new Date(this.selectedDate);
      filterDate.setHours(0, 0, 0, 0);
      
      orders = orders.filter(order => {
        const orderDate = new Date(order.orderTime);
        orderDate.setHours(0, 0, 0, 0);
        return orderDate.getTime() === filterDate.getTime();
      });
    }
    
    // Apply status filter
    if (this.selectedStatus) {
      orders = orders.filter(order => order.status === this.selectedStatus);
    }
    
    // Apply sorting
    orders.sort((a, b) => {
      if (this.sortField === 'date') {
        const dateA = new Date(a.orderTime).getTime();
        const dateB = new Date(b.orderTime).getTime();
        return this.sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
      } else if (this.sortField === 'status') {
        return this.sortDirection === 'asc' 
          ? a.status.localeCompare(b.status)
          : b.status.localeCompare(a.status);
      } else if (this.sortField === 'total') {
        return this.sortDirection === 'asc' 
          ? a.total - b.total
          : b.total - a.total;
      }
      return 0;
    });
    
    this.filteredOrders = orders;
  }
  
  toggleSort(field: string) {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'desc';
    }
    this.applyFilters();
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
  
  formatDate(date: Date): string {
    const dateObj = new Date(date);
    const now = new Date();
    
    // Today
    if (dateObj.toDateString() === now.toDateString()) {
      return `Today, ${this.formatTimeOnly(dateObj)}`;
    }
    
    // Yesterday
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (dateObj.toDateString() === yesterday.toDateString()) {
      return `Yesterday, ${this.formatTimeOnly(dateObj)}`;
    }
    
    // This week
    return dateObj.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  formatTimeOnly(date: Date): string {
    return new Date(date).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }
  
  summarizeOrderItems(order: Order): string {
    if (!order.items || order.items.length === 0) {
      return 'No items';
    }
    
    const items = order.items.map(item => `${item.quantity}x ${item.name}`);
    if (items.length <= 2) {
      return items.join(', ');
    }
    
    return `${items[0]}, ${items[1]}, +${items.length - 2} more`;
  }
  
  isEventCompleted(order: Order, event: string): boolean {
    switch (event) {
      case 'ordered':
        return true; // Always completed
      case 'processing':
        return !!order.processTime || order.status === 'processing' || 
               order.status === 'ready' || order.status === 'delivered';
      case 'ready':
        return !!order.completionTime || order.status === 'ready' || 
               order.status === 'delivered';
      case 'delivered':
        return order.status === 'delivered';
      default:
        return false;
    }
  }
}