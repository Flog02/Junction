// src/app/features/order/order-tracker/order-tracker.page.ts

import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
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
import { addIcons } from 'ionicons';
import { 
  receiptOutline, 
  cafeOutline, 
  checkmarkCircleOutline, 
  handLeftOutline,
  alertCircleOutline,
  timeOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-order-tracker',
  templateUrl: './order-tracker.page.html',
  styleUrls: ['./order-tracker.page.scss'],
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
    private router: Router,
    private orderService: OrderService,
    private notificationService: NotificationService
  ) {
    addIcons({
      receiptOutline, 
      cafeOutline, 
      checkmarkCircleOutline, 
      handLeftOutline,
      alertCircleOutline,
      timeOutline
    });
  }
  
  ngOnInit() {
    console.log('OrderTracker initialized');
    this.orderId = this.route.snapshot.paramMap.get('id');
    console.log('Order ID from route:', this.orderId);
    
    if (this.orderId) {
      // Poll for order updates every 30 seconds
      interval(30000).pipe(
        startWith(0), // Start immediately
        switchMap(() => this.orderService.getOrder(this.orderId!)),
        takeUntil(this.destroy$)
      ).subscribe({
        next: (order) => {
          console.log('Order data received:', order);
          this.order = order;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading order:', error);
          this.isLoading = false;
        }
      });
    } else {
      console.error('No order ID provided in the route');
      this.isLoading = false;
      
      // Navigate back to orders page if no ID
      setTimeout(() => {
        this.router.navigate(['/order']);
      }, 2000);
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
  
  /**
   * Safely converts Firebase Timestamp or Date object to JavaScript Date
   */
  private convertToDate(dateInput: any): Date {
    if (!dateInput) return new Date();
    
    // Check if it's a Firebase Timestamp (has toDate method)
    if (dateInput && typeof dateInput === 'object' && 'toDate' in dateInput && typeof dateInput.toDate === 'function') {
      return dateInput.toDate();
    }
    
    // If it's already a Date object or a string/number, create a new Date
    return new Date(dateInput);
  }
  
  formatTime(dateInput: any): string {
    if (!dateInput) return '--:--';
    
    const date = this.convertToDate(dateInput);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  
  getEstimatedReadyTime(): string {
    if (!this.order || !this.order.orderTime) return '--:--';
    
    const orderTime = this.convertToDate(this.order.orderTime);
    
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