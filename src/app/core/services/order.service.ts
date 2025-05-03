// src/app/core/services/order.service.ts

import { Injectable } from '@angular/core';
import { 
  Firestore, 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  DocumentReference,
  collectionData
} from '@angular/fire/firestore';
import { Auth, user } from '@angular/fire/auth';
import { Observable, from, of, switchMap, map, take, BehaviorSubject, catchError, tap } from 'rxjs';
import { Order, OrderItem } from '../models/order.model';
import { LoyaltyService } from './loyalty.service';
import { NutritionService } from './nutrition.service';
import { AuthService } from './auth.service';
import { NotificationService } from './notification.service';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private readonly TAX_RATE = 0.0725; // 7.25% tax rate
  
  // Cart items observable
  private cartItemsSource: OrderItem[] = [];
  private cartItemsSubject = new BehaviorSubject<OrderItem[]>([]);
  public cartItems$ = this.cartItemsSubject.asObservable();

  constructor(
    private firestore: Firestore,
    private authService: AuthService,
    private auth: Auth,
    private loyaltyService: LoyaltyService,
    private nutritionService: NutritionService,
    private notificationService: NotificationService
  ) {
    // Initialize cart from localStorage
    this.getCartItems();
  }

  /**
   * Creates a new order in Firestore
   */
  createOrder(order: Order): Observable<string> {
    const ordersRef = collection(this.firestore, 'orders');
    
    // Set current timestamp for orderTime
    order.orderTime = new Date();
    
    // Calculate tax if not provided
    if (!order.tax) {
      order.tax = order.subtotal * this.TAX_RATE;
    }
    
    // Calculate total if not provided
    if (!order.total) {
      order.total = order.subtotal + order.tax + (order.tip || 0);
    }
    
    // Calculate loyalty points (1 point per $1 spent)
    order.loyaltyPointsEarned = Math.floor(order.total);
    
    // Return observable of the order ID
    return from(addDoc(ordersRef, this.prepareOrderForFirestore(order)))
      .pipe(
        map(docRef => {
          // Check if order contains coffee items to increment coffee count
          const hasCoffee = order.items.some(
            item => item.category && item.category.toLowerCase().includes('coffee')
          );
          
          if (hasCoffee) {
            this.loyaltyService.incrementMonthlyCoffeeCount().subscribe();
          }
          
          // Add loyalty points
          this.loyaltyService.addPoints(
            order.userId, 
            order.loyaltyPointsEarned, 
            docRef.id
          ).subscribe();
          
          // Update nutrition data
          this.updateNutritionData(order);
          
          // Send order confirmation notification
          this.notificationService.createOrderStatusNotification(
            order.userId,
            docRef.id,
            'pending'
          ).subscribe();
          
          // Clear the cart
          this.clearCart();
          
          return docRef.id;
        })
      );
  }

  /**
   * Gets an order by ID
   */
  getOrder(orderId: string): Observable<Order | null> {
    const orderRef = doc(this.firestore, `orders/${orderId}`);
    return from(getDoc(orderRef)).pipe(
      map(snapshot => {
        if (snapshot.exists()) {
          return this.convertFromFirestore(snapshot.data() as Order, snapshot.id);
        }
        return null;
      })
    );
  }

  /**
   * Gets all orders for the current user
   */
  getUserOrders(): Observable<Order[]> {
    return this.authService.user$.pipe(
      switchMap(user => {
        if (!user) {
          console.log('No authenticated user found');
          return of([]);
        }
        
        console.log('Getting orders for user:', user.uid);
        
        const ordersRef = collection(this.firestore, 'orders');
        const userOrdersQuery = query(
          ordersRef, 
          where('userId', '==', user.uid),
          orderBy('orderTime', 'desc')
        );
        
        return collectionData(userOrdersQuery, { idField: 'id' }).pipe(
          map(orders => {
            console.log('Orders found:', orders.length);
            return orders.map(order => {
              return this.convertFromFirestore(order as any, order['id'] as string);
            }) as Order[];
          }),
          catchError(error => {
            console.error('Error fetching user orders:', error);
            return of([]);
          })
        );
      })
    );
  }

  /**
   * Gets all active orders for the current user
   */
  getActiveOrders(): Observable<Order[]> {
    return this.authService.user$.pipe(
      switchMap(user => {
        if (!user) {
          console.log('No authenticated user found');
          return of([]);
        }
        
        console.log('Getting active orders for user:', user.uid);
        
        const ordersRef = collection(this.firestore, 'orders');
        const activeOrdersQuery = query(
          ordersRef, 
          where('userId', '==', user.uid),
          where('status', 'in', ['pending', 'processing']),
          orderBy('orderTime', 'desc')
        );
        
        return collectionData(activeOrdersQuery, { idField: 'id' }).pipe(
          map(orders => {
            console.log('Active orders found:', orders.length);
            return orders.map(order => 
              this.convertFromFirestore(order as Order, (order as any).id)
            );
          }),
          catchError(error => {
            console.error('Error fetching active orders:', error);
            return of([]);
          })
        );
      })
    );
  }

  /**
   * Updates an order's status
   */
 /**
 * Updates an order's status
 */


  /**
   * Cancels an order
   */
  cancelOrder(orderId: string): Observable<void> {
    return this.updateOrderStatus(orderId, 'cancelled');
  }

  /**
   * Calculates the total price for a single item based on customizations
   */
  calculateItemTotal(item: OrderItem): number {
    let total = item.basePrice * item.quantity;
    
    // Add customization price modifiers
    const customizations = item.customizations;
    
    // Add size modifier
    if (customizations.size) {
      total += customizations.size.priceModifier * item.quantity;
    }
    
    // Add milk modifier
    if (customizations.milk) {
      total += customizations.milk.priceModifier * item.quantity;
    }
    
    // Add shot modifiers
    if (customizations.shots && customizations.shots.length > 0) {
      customizations.shots.forEach(shot => {
        total += shot.priceModifier * item.quantity;
      });
    }
    
    // Add syrup modifiers
    if (customizations.syrups && customizations.syrups.length > 0) {
      customizations.syrups.forEach(syrup => {
        total += syrup.priceModifier * item.quantity;
      });
    }
    
    // Add topping modifiers
    if (customizations.toppings && customizations.toppings.length > 0) {
      customizations.toppings.forEach(topping => {
        total += topping.priceModifier * item.quantity;
      });
    }
    
    return total;
  }

  /**
   * Calculates the subtotal for all items in the order
   */
  calculateSubtotal(items: OrderItem[]): number {
    return items.reduce((sum, item) => {
      // Ensure each item has its itemTotal calculated
      if (!item.itemTotal) {
        item.itemTotal = this.calculateItemTotal(item);
      }
      return sum + item.itemTotal;
    }, 0);
  }

  /**
   * Convert dates to Firestore timestamps for storage
   */
  private prepareOrderForFirestore(order: Order): any {
    // Create a copy to avoid mutating the original
    const orderForFirestore = { ...order };
    
    // Remove id field if present (Firestore will generate one)
    if (orderForFirestore.id) {
      delete (orderForFirestore as any).id;
    }
    
    return orderForFirestore;
  }

  /**
   * Gets orders by status
   */
  getOrdersByStatus(status: string): Observable<Order[]> {
    const ordersRef = collection(this.firestore, 'orders');
    const statusQuery = query(
      ordersRef,
      where('status', '==', status),
      orderBy('orderTime', 'desc')
    );

    return collectionData(statusQuery, { idField: 'id' }).pipe(
      map(orders => {
        return orders.map(order => {
          return this.convertFromFirestore(order as any, order['id'] as string);
        });
      })
    );
  }

  /**
   * Convert Firestore data to our Order model
   */
  convertFromFirestore(order: any, id: string): Order {
    // Assign ID to the order
    order.id = id;
    
    // Convert Firestore timestamps to JS Date objects
    if (order.orderTime && (order.orderTime as any)?.toDate) {
      order.orderTime = (order.orderTime as any).toDate();
    }
    
    if (order.processTime && (order.processTime as any)?.toDate) {
      order.processTime = (order.processTime as any).toDate();
    }
    
    if (order.completionTime && (order.completionTime as any)?.toDate) {
      order.completionTime = (order.completionTime as any).toDate();
    }
    
    // Ensure order.items is an array
    if (!Array.isArray(order.items)) {
      console.warn('Order items is not an array:', order.id);
      order.items = [];
    }
    
    // Add default values for missing fields
    order.status = order.status || 'pending';
    order.paymentStatus = order.paymentStatus || 'pending';
    order.paymentMethod = order.paymentMethod || 'card';
    order.total = order.total || 0;
    order.subtotal = order.subtotal || 0;
    order.tax = order.tax || 0;
    order.tip = order.tip || 0;
    
    return order as Order;
  }

  /**
   * Updates user nutrition data from order
   */
  private updateNutritionData(order: Order): void {
    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];
    
    // Calculate total nutrition values for this order
    const nutritionTotals = {
      calories: 0,
      sugar: 0,
      caffeine: 0,
      fat: 0,
      protein: 0
    };
    
    // Sum up nutrition from all items
    order.items.forEach(item => {
      nutritionTotals.calories += item.nutritionInfo.calories;
      nutritionTotals.sugar += item.nutritionInfo.sugar;
      nutritionTotals.caffeine += item.nutritionInfo.caffeine;
      nutritionTotals.fat += item.nutritionInfo.fat;
      nutritionTotals.protein += item.nutritionInfo.protein;
    });
    
    // Send to nutrition service
    this.nutritionService.updateDailyIntake(order.userId, today, nutritionTotals);
  }

  /**
   * Gets cart items from localStorage
   */
  getCartItems(): OrderItem[] {
    // Keep existing functionality for backward compatibility
    const storedCart = localStorage.getItem('cartItems');
    if (storedCart) {
      try {
        const parsedCart = JSON.parse(storedCart);
        if (Array.isArray(parsedCart) && parsedCart.length > 0) {
          this.cartItemsSource = parsedCart;
          // Update the subject
          this.cartItemsSubject.next(parsedCart);
        }
      } catch (e) {
        console.error('Error parsing cart items from localStorage:', e);
      }
    }
    
    return this.cartItemsSource;
  }

  /**
   * Sets cart items
   */
  setCartItems(items: OrderItem[]): void {
    this.cartItemsSource = items;
    // Update the subject
    this.cartItemsSubject.next(items);
    
    // Save to localStorage for persistence
    try {
      localStorage.setItem('cartItems', JSON.stringify(items));
    } catch (e) {
      console.error('Error saving cart items to localStorage:', e);
    }
  }

  /**
   * Adds an item to the cart
   */
  addToCart(item: OrderItem): void {
    // Check if item already exists
    const existingItemIndex = this.cartItemsSource.findIndex(
      cartItem => cartItem.productId === item.productId &&
      JSON.stringify(cartItem.customizations) === JSON.stringify(item.customizations)
    );
    
    if (existingItemIndex !== -1) {
      // Update quantity if item exists
      this.cartItemsSource[existingItemIndex].quantity += item.quantity;
      // Update total
      this.cartItemsSource[existingItemIndex].itemTotal = 
        this.calculateItemTotal(this.cartItemsSource[existingItemIndex]);
    } else {
      // Add new item
      this.cartItemsSource.push(item);
    }
    
    // Update the subject
    this.cartItemsSubject.next(this.cartItemsSource);
    
    // Save to localStorage
    localStorage.setItem('cartItems', JSON.stringify(this.cartItemsSource));
  }

  /**
   * Clears the cart
   */
  clearCart(): void {
    this.cartItemsSource = [];
    
    // Update the BehaviorSubject
    this.cartItemsSubject.next([]);
    
    // Clear from localStorage
    localStorage.removeItem('cartItems');
  }

  /**
   * Removes an item from the cart
   */
  removeFromCart(index: number): void {
    if (index < 0 || index >= this.cartItemsSource.length) {
      return;
    }
    
    this.cartItemsSource.splice(index, 1);
    
    // Update the subject
    this.cartItemsSubject.next(this.cartItemsSource);
    
    // Save to localStorage
    localStorage.setItem('cartItems', JSON.stringify(this.cartItemsSource));
  }

  /**
   * Updates an item quantity in the cart
   */
  updateCartItemQuantity(index: number, quantity: number): void {
    if (index < 0 || index >= this.cartItemsSource.length || quantity < 1) {
      return;
    }
    
    this.cartItemsSource[index].quantity = quantity;
    this.cartItemsSource[index].itemTotal = this.calculateItemTotal(this.cartItemsSource[index]);
    
    // Update the subject
    this.cartItemsSubject.next(this.cartItemsSource);
    
    // Save to localStorage
    localStorage.setItem('cartItems', JSON.stringify(this.cartItemsSource));
  }

  /**
 * Updates an order's status and sends notification to the customer
 */
/**
 * Updates an order's status and ensures notification goes to the customer
 */
// updateOrderStatus(orderId: string, status: Order['status']): Observable<void> {
//   console.log('Updating order status:', orderId, status);
//   const orderRef = doc(this.firestore, `orders/${orderId}`);
  
//   // First get the order to check the userId for notifications
//   return from(getDoc(orderRef)).pipe(
//     switchMap(docSnap => {
//       if (!docSnap.exists()) {
//         console.error('Order not found:', orderId);
//         throw new Error('Order not found');
//       }
      
//       const orderData = docSnap.data() as Order;
//       const customerId = orderData.userId; // Get the customer's user ID
      
//       console.log('Order belongs to customer:', customerId);
      
//       let update: Partial<Order> = { status };
      
//       // Update timestamps based on status
//       if (status === 'processing') {
//         update.processTime = new Date();
//       } else if (status === 'ready' || status === 'delivered') {
//         update.completionTime = new Date();
//       }
      
//       return from(updateDoc(orderRef, update)).pipe(
//         tap(() => {
//           // IMPORTANT: Force-set the userId to the customer's ID, not the current logged-in user
//           // This is to ensure notification goes to customer even when staff is logged in
//           const notificationData = {
//             userId: customerId, // This is the customer's ID, not the staff member's
//             title: this.getStatusTitle(status),
//             message: this.getStatusMessage(status, orderId),
//             type: 'order' as 'order' | 'loyalty' | 'promotion' | 'system',
//             targetId: orderId
//           };
          
//           console.log('Creating notification for customer:', notificationData);
          
//           // Create notification directly to avoid using the current auth context
//           this.notificationService.createNotification(notificationData)
//             .subscribe({
//               next: (notificationId) => {
//                 console.log('Notification created successfully:', notificationId);
//               },
//               error: (error) => {
//                 console.error('Error creating notification:', error);
//               }
//             });
          
//           // Add reward for first completed order if this is a completed order
//           if ((status === 'delivered' || status === 'ready') && customerId) {
//             // Get user's orders to check if this is their first completed order
//             const ordersRef = collection(this.firestore, 'orders');
//             const userOrdersQuery = query(
//               ordersRef, 
//               where('userId', '==', customerId),
//               where('status', 'in', ['delivered', 'ready'])
//             );
            
//             from(getDocs(userOrdersQuery)).pipe(
//               take(1),
//               map(snapshot => {
//                 // If this is the first completed order (or we have exactly 1 which is this one)
//                 if (snapshot.size === 1) {
//                   console.log('First completed order for customer:', customerId);
                  
//                   // Add a reward - using the customer ID directly
//                   this.loyaltyService.addReward('Free Coffee', customerId).subscribe();
                  
//                   // Send a notification about the reward - force using customer ID
//                   const rewardNotificationData = {
//                     userId: customerId, // Force customer ID here too
//                     title: 'First Order Completed!',
//                     message: 'Thanks for your first order! We\'ve added a free coffee reward to your account.',
//                     type: 'loyalty' as 'order' | 'loyalty' | 'promotion' | 'system',
//                     targetId: orderId
//                   };
                  
//                   this.notificationService.createNotification(rewardNotificationData).subscribe();
//                 }
//               })
//             ).subscribe();
//           }
//         })
//       );
//     })
//   );
// }
// In OrderService, the updateOrderStatus method needs to be properly implemented

updateOrderStatus(orderId: string, status: Order['status']): Observable<void> {
  console.log('Updating order status:', orderId, status);
  const orderRef = doc(this.firestore, `orders/${orderId}`);
  
  // First get the order to check the userId for notifications
  return from(getDoc(orderRef)).pipe(
    switchMap(docSnap => {
      if (!docSnap.exists()) {
        console.error('Order not found:', orderId);
        throw new Error('Order not found');
      }
      
      const orderData = docSnap.data() as Order;
      const customerId = orderData.userId; // Get the customer's user ID
      
      console.log('Order belongs to customer:', customerId);
      
      let update: Partial<Order> = { status };
      
      // Update timestamps based on status
      if (status === 'processing') {
        update.processTime = new Date();
      } else if (status === 'ready' || status === 'delivered') {
        update.completionTime = new Date();
      }
      
      return from(updateDoc(orderRef, update)).pipe(
        tap(() => {
          // Create notification directly to customer regardless of who is logged in
          this.notificationService.createOrderStatusNotification(
            customerId, 
            orderId, 
            status
          ).subscribe();
        })
      );
    })
  );
}
/**
 * Gets the title for a status notification
 */
private getStatusTitle(status: string): string {
  switch (status) {
    case 'pending': return 'Order Received';
    case 'processing': return 'Order In Progress';
    case 'ready': return 'Order Ready';
    case 'delivered': return 'Order Delivered';
    case 'cancelled': return 'Order Cancelled';
    default: return 'Order Update';
  }
}

/**
 * Gets the message for a status notification
 */
private getStatusMessage(status: string, orderId: string): string {
  const orderNumber = orderId.substring(0, 6);
  
  switch (status) {
    case 'pending': 
      return `Your order #${orderNumber} has been received and is being processed.`;
    case 'processing': 
      return `Your order #${orderNumber} is now being prepared.`;
    case 'ready': 
      return `Great news! Your order #${orderNumber} is ready for pickup.`;
    case 'delivered': 
      return `Your order #${orderNumber} has been delivered. Enjoy!`;
    case 'cancelled': 
      return `Your order #${orderNumber} has been cancelled.`;
    default: 
      return `Your order #${orderNumber} status has been updated to ${status}.`;
  }
}
}