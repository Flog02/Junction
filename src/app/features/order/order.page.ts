import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { OrderService } from '../../core/services/order.service';
import { Order } from '../../core/models/order.model';
import { IonIcon, IonFab, IonList, IonItemGroup, IonItemDivider, IonLabel, IonBadge, IonSpinner, IonContent, IonToolbar, IonSegment, IonSegmentButton, IonTitle, IonButtons, IonHeader, IonBackButton, IonButton } from "@ionic/angular/standalone";
import { FormsModule } from '@angular/forms';
interface OrderMonth {
  month: string;
  orders: Order[];
}
@Component({
  selector: 'app-order',
  templateUrl:'./order.page.html',
  styleUrls: ['./order.page.scss'],
  standalone: true,
  imports: [IonButton, FormsModule,IonBackButton, IonHeader, IonButtons, IonTitle, IonSegmentButton, IonSegment, IonToolbar, IonContent, IonSpinner, IonBadge, IonLabel, IonItemDivider, IonItemGroup, IonList, IonFab, IonIcon, CommonModule, RouterModule]
})
export class OrderPage implements OnInit, OnDestroy {
  activeOrders: Order[] = [];
  pastOrders: Order[] = [];
  isLoading = true;
  
  selectedSegment = 'active';
  
  private destroy$ = new Subject<void>();
  
  pastOrdersByMonth: OrderMonth[] = [];

  constructor(private orderService: OrderService) {}
  
  ngOnInit() {
    this.loadOrders();
  }
  
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  loadOrders() {
    this.isLoading = true;
    
    // Load active orders
    this.orderService.getActiveOrders()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (orders) => {
          this.activeOrders = orders;
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Failed to load active orders:', err);
          this.isLoading = false;
        }
      });
    
    // Load all orders
    this.orderService.getUserOrders()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (orders) => {
          // Filter out active orders to get past orders
          this.pastOrders = orders.filter(order => 
            order.status === 'delivered' || 
            order.status === 'cancelled' || 
            order.status === 'ready'
          );
        },
        error: (err) => {
          console.error('Failed to load past orders:', err);
        }
      });
  }

  groupOrdersByMonth() {
    const monthMap = new Map<string, Order[]>();
    
    this.pastOrders.forEach(order => {
      const date = new Date(order.orderTime);
      const monthYear = date.toLocaleString('en-US', { month: 'long', year: 'numeric' });
      
      if (!monthMap.has(monthYear)) {
        monthMap.set(monthYear, []);
      }
      
      monthMap.get(monthYear)?.push(order);
    });
    
    // Convert map to array
    this.pastOrdersByMonth = [];
    monthMap.forEach((orders, month) => {
      this.pastOrdersByMonth.push({ month, orders });
    });
    
    // Sort groups by date (most recent first)
    this.pastOrdersByMonth.sort((a, b) => {
      const dateA = new Date(a.orders[0].orderTime);
      const dateB = new Date(b.orders[0].orderTime);
      return dateB.getTime() - dateA.getTime();
    });
  }
  
  segmentChanged(event: any) {
    this.selectedSegment = event.detail.value;
  }
  
  formatDate(date: Date): string {
    if (!date) return '';
    
    if (typeof date === 'string') {
      date = new Date(date);
    }
    
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  getStatusColor(status: string): string {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'processing':
        return 'primary';
      case 'ready':
        return 'success';
      case 'delivered':
        return 'success';
      case 'cancelled':
        return 'danger';
      default:
        return 'medium';
    }
  }
}