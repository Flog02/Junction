// src/app/features/order/order.page.ts

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { OrderService } from '../../core/services/order.service';
import { Order } from '../../core/models/order.model';

@Component({
  selector: 'app-order',
  template: 'hi',
//   styleUrls: ['./order.page.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule]
})
export class OrderPage implements OnInit, OnDestroy {
  activeOrders: Order[] = [];
  pastOrders: Order[] = [];
  isLoading = true;
  
  selectedSegment = 'active';
  
  private destroy$ = new Subject<void>();
  
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