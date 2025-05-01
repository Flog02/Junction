// src/app/features/order/order-history/order-history.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { 
  IonContent, 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonButtons, 
  IonBackButton,
  IonBadge,
  IonIcon,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonSkeletonText,
  IonButton
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  cafeOutline, 
  timeOutline, 
  checkmarkCircleOutline, 
  hourglassOutline, 
  alertCircleOutline, 
  cartOutline, 
  receiptOutline,
  arrowForwardOutline
} from 'ionicons/icons';
import { Observable } from 'rxjs';

import { OrderService } from '../../../core/services/order.service';
import { AuthService } from '../../../core/services/auth.service';
import { Order } from '../../../core/models/order.model';

@Component({
  selector: 'app-order-history',
  templateUrl: './order-history.component.html',
  styleUrls: ['./order-history.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    IonBadge,
    IonIcon,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonSkeletonText,
    IonButton
]
})
export class OrderHistoryComponent implements OnInit {
  orders$: Observable<Order[]>;
  isLoading = true;
  activeOrders: Order[] = [];
  pastOrders: Order[] = [];
  
  constructor(
    private orderService: OrderService,
    private authService: AuthService,
    private router: Router
  ) {
    addIcons({ 
      cafeOutline, 
      timeOutline, 
      checkmarkCircleOutline, 
      hourglassOutline, 
      alertCircleOutline, 
      cartOutline, 
      receiptOutline,
      arrowForwardOutline
    });
    
    // Initialize the orders observable
    this.orders$ = this.orderService.getUserOrders();
  }

  ngOnInit() {
    this.loadOrders();
  }
  
  loadOrders() {
    this.isLoading = true;
    
    this.orders$.subscribe({
      next: (orders) => {
        // Separate active and past orders
        this.activeOrders = orders.filter(order => 
          order.status === 'pending' || order.status === 'processing'
        );
        
        this.pastOrders = orders.filter(order => 
          order.status !== 'pending' && order.status !== 'processing'
        );
        
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error fetching orders:', error);
        this.isLoading = false;
      }
    });
  }
  
  trackOrder(orderId: string) {
    this.router.navigate(['/order/confirmation', orderId]);
  }
  
  reorder(order: Order) {
    // Clone the order items to a new cart
    const items = [...order.items];
    
    // Store items in service or local storage
    this.orderService.setCartItems(items);
    
    // Navigate to cart
    this.router.navigate(['/order/cart']);
  }
  
  getStatusIcon(status: string): string {
    switch (status) {
      case 'pending': return 'hourglass-outline';
      case 'processing': return 'hourglass-outline';
      case 'ready': return 'checkmark-circle-outline';
      case 'delivered': return 'checkmark-circle-outline';
      case 'cancelled': return 'alert-circle-outline';
      default: return 'hourglass-outline';
    }
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
      case 'ready': return 'Ready for Pickup';
      case 'delivered': return 'Delivered';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  }
  
 /**
 * Gets a formatted date string for displaying order dates
 */
getFormattedDate(date: any): string {
    let orderDate: Date;
    
    // Handle different date formats
    if (date && typeof date === 'object' && 'toDate' in date && typeof date.toDate === 'function') {
      // Handle Firebase Timestamp objects
      orderDate = date.toDate();
    } else if (date instanceof Date) {
      // Regular JavaScript Date object
      orderDate = date;
    } else {
      // String or other format - try to convert to Date
      try {
        orderDate = new Date(date);
      } catch (e) {
        console.error('Invalid date format:', date);
        return 'Unknown date';
      }
    }
    
    // For orders from today, just show the time
    const today = new Date();
    
    if (
      orderDate.getDate() === today.getDate() &&
      orderDate.getMonth() === today.getMonth() &&
      orderDate.getFullYear() === today.getFullYear()
    ) {
      return orderDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // For orders from yesterday, show "Yesterday" and time
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (
      orderDate.getDate() === yesterday.getDate() &&
      orderDate.getMonth() === yesterday.getMonth() &&
      orderDate.getFullYear() === yesterday.getFullYear()
    ) {
      return `Yesterday, ${orderDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    // For older orders, show full date
    return orderDate.toLocaleDateString([], { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric',
      hour: '2-digit', 
      minute: '2-digit'
    });
  }
}