import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { LoadingController, ToastController } from '@ionic/angular/standalone';
import { OrderService } from '../../core/services/order.service';
import { Order } from '../../core/models/order.model';
import { Router } from '@angular/router';
import { 
  IonIcon, 
  IonFab, 
  IonFabButton,
  IonList,
  IonItem, 
  IonItemGroup, 
  IonItemDivider, 
  IonLabel, 
  IonBadge, 
  IonSpinner, 
  IonContent, 
  IonToolbar, 
  IonSegment, 
  IonSegmentButton, 
  IonTitle, 
  IonButtons, 
  IonHeader, 
  IonBackButton, 
  IonButton 
} from "@ionic/angular/standalone";
import { FormsModule } from '@angular/forms';
import { addIcons } from 'ionicons';
import { 
  addOutline, 
  cafeOutline, 
  alertCircleOutline, 
  timerOutline, 
  bicycleOutline, 
  starOutline,
  checkmarkCircleOutline, 
  documentTextOutline, helpCircleOutline, arrowForward, closeCircleOutline, timeOutline, calendarOutline, repeatOutline,add,star} from 'ionicons/icons';

interface OrderMonth {
  month: string;
  orders: Order[];
}

@Component({
  selector: 'app-order',
  templateUrl: './order.page.html',
  styleUrls: ['./order.page.scss'],
  standalone: true,
  imports: [
    IonFabButton,
    IonButton, 
    FormsModule,
    IonBackButton, 
    IonHeader, 
    IonButtons, 
    IonTitle, 
    IonSegmentButton, 
    IonSegment, 
    IonToolbar, 
    IonContent, 
    IonSpinner, 
    IonBadge, 
    IonLabel, 
    IonItemDivider, 
    IonItemGroup, 
    IonItem,
    IonList, 
    IonFab, 
    IonIcon, 
    CommonModule, 
    RouterModule
  ]
})
export class OrderPage implements OnInit, OnDestroy {
  activeOrders: Order[] = [];
  pastOrders: Order[] = [];
  isLoading = true;
  
  selectedSegment = 'active';
  
  private destroy$ = new Subject<void>();
  
  pastOrdersByMonth: OrderMonth[] = [];

  constructor(private route :Router , private orderService: OrderService, private loadingController :LoadingController , private toastController:ToastController) {
    // Add icons
    addIcons({helpCircleOutline,cafeOutline,arrowForward,closeCircleOutline,timeOutline,documentTextOutline,calendarOutline,timerOutline,star,checkmarkCircleOutline,bicycleOutline,repeatOutline,add,addOutline,alertCircleOutline,starOutline});
  }
  
  ngOnInit() {
    console.log('OrderPage initialized');
    this.loadOrders();
  }
  
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ionViewWillEnter() {
    // Refresh data each time the page is entered
    console.log('OrderPage view entered, refreshing data');
    this.loadOrders();
  }
  
  loadOrders() {
    this.isLoading = true;
    
    // Load active orders
    this.orderService.getActiveOrders()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (orders) => {
          console.log('Active orders loaded:', orders.length);
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
          console.log('All orders loaded:', orders.length);
          
          // Filter out active orders to get past orders
          this.pastOrders = orders.filter(order => 
            order.status === 'delivered' || 
            order.status === 'cancelled' || 
            order.status === 'ready'
          );
          
          console.log('Past orders filtered:', this.pastOrders.length);
          
          // Group past orders by month
          this.groupOrdersByMonth();
        },
        error: (err) => {
          console.error('Failed to load past orders:', err);
        }
      });
  }

  groupOrdersByMonth() {
    const monthMap = new Map<string, Order[]>();
    
    this.pastOrders.forEach(order => {
      if (!order.orderTime) {
        console.warn('Order missing orderTime:', order.id);
        return;
      }
      
      const date = this.convertToDate(order.orderTime);
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
      if (!a.orders.length || !b.orders.length) return 0;
      
      const getTime = (order: Order) => {
        if (!order.orderTime) return 0;
        return this.convertToDate(order.orderTime).getTime();
      };
      
      return getTime(b.orders[0]) - getTime(a.orders[0]);
    });
    
    console.log('Orders grouped by month:', this.pastOrdersByMonth.length, 'groups');
  }
  
  segmentChanged(event: any) {
    this.selectedSegment = event.detail.value;
    console.log('Segment changed to:', this.selectedSegment);
  }
  
  private convertToDate(dateInput: any): Date {
    if (!dateInput) return new Date();
    
    // Check if it's a Firebase Timestamp (has toDate method)
    if (dateInput && typeof dateInput === 'object' && 'toDate' in dateInput && typeof dateInput.toDate === 'function') {
      return dateInput.toDate();
    }
    
    // If it's already a Date object or a string/number, create a new Date
    return new Date(dateInput);
  }
  
  formatDate(dateInput: any): string {
    if (!dateInput) return '';
    
    try {
      const date = this.convertToDate(dateInput);
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Error formatting date:', error, dateInput);
      return 'Invalid date';
    }
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
  
  cancelOrder(orderId: string) {
    if (!orderId) return;
    
    console.log('Cancelling order:', orderId);
    this.orderService.cancelOrder(orderId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          console.log('Order cancelled successfully');
          // Refresh orders
          this.loadOrders();
        },
        error: (error) => {
          console.error('Error cancelling order:', error);
        }
      });
  }

  // Add these methods to your OrderPage class

/**
 * Checks if an order was placed recently (within the last 5 minutes)
 */
isNewOrder(order: Order): boolean {
  if (!order.orderTime) return false;
  
  const orderTime = typeof order.orderTime === 'string' 
    ? new Date(order.orderTime) 
    : order.orderTime;
    
  const currentTime = new Date();
  const timeDiff = currentTime.getTime() - orderTime.getTime();
  
  // Return true if order was placed within the last 5 minutes
  return timeDiff < 5 * 60 * 1000;
}

/**
 * Gets the estimated time until the order is ready
 */
getEstimatedReadyTime(order: Order): string {
  if (!order.processTime || order.status !== 'processing') return '';
  
  const processTime = typeof order.processTime === 'string' 
    ? new Date(order.processTime) 
    : order.processTime;
    
  // Calculate estimated preparation time based on items
  let totalPrepTime = 0;
  order.items.forEach(item => {
    // You can implement more sophisticated logic here based on your data model
    // For now, we'll use a default value
    totalPrepTime += 5; // 5 minutes per item
  });
  
  // Minimum prep time of 5 minutes
  totalPrepTime = Math.max(5, totalPrepTime);
  
  // Calculate estimated completion time
  const estimatedCompletionTime = new Date(processTime.getTime() + totalPrepTime * 60 * 1000);
  const currentTime = new Date();
  
  // If the estimated time has passed, show "Any moment now"
  if (estimatedCompletionTime <= currentTime) {
    return "Any moment now";
  }
  
  // Calculate minutes remaining
  const minutesRemaining = Math.round((estimatedCompletionTime.getTime() - currentTime.getTime()) / (60 * 1000));
  
  if (minutesRemaining < 1) {
    return "Less than a minute";
  } else if (minutesRemaining === 1) {
    return "1 minute";
  } else {
    return `${minutesRemaining} minutes`;
  }
}

/**
 * Checks if an order can be reordered
 */
canReorder(order: Order): boolean {
  // Only delivered or ready orders can be reordered
  // Change 'completed' to 'delivered' or 'ready' to match your Order model's status type
  return order.status === 'delivered' || order.status === 'ready';
}

/**
 * Reorders items from a previous order
 */
reorderItems(order: Order, event: Event): void {
  // Stop propagation to prevent navigation
  event.stopPropagation();
  
  // Show loading indicator
  this.presentLoading('Adding items to cart...');
  
  // You would implement the actual reordering logic here
  // For example:
  // this.orderService.reorderItems(order.items).then(() => {
  //   this.dismissLoading();
  //   this.presentToast('Items added to cart!', 'success');
  //   this.router.navigate(['/cart']);
  // }).catch(error => {
  //   this.dismissLoading();
  //   this.presentToast(`Error: ${error.message}`, 'danger');
  // });
  
  // For this demo, we'll just simulate the reordering
  setTimeout(() => {
    this.presentToast('Items added to cart!', 'success');
    // Navigate to cart page
    this.route.navigate(['/cart']);
  }, 1500);
}

/**
 * Presents a loading indicator
 */
async presentLoading(message: string): Promise<void> {
  const loading = await this.loadingController.create({
    message,
    spinner: 'crescent'
  });
  await loading.present();
}

/**
 * Dismisses the loading indicator
 */
async dismissLoading(): Promise<void> {
  await this.loadingController.dismiss();
}

/**
 * Presents a toast message
 */
async presentToast(message: string, color: 'success' | 'danger' | 'warning' = 'success'): Promise<void> {
  const toast = await this.toastController.create({
    message,
    duration: 2000,
    position: 'bottom',
    color,
    buttons: [
      {
        icon: 'close-outline',
        role: 'cancel'
      }
    ]
  });
  await toast.present();
}
}