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
import { Observable, from, of, switchMap, map, take } from 'rxjs';
import { Order, OrderItem } from '../models/order.model';
import { LoyaltyService } from './loyalty.service';
import { NutritionService } from './nutrition.service';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private readonly TAX_RATE = 0.0725; // 7.25% tax rate

  constructor(
    private firestore: Firestore,
    private auth: Auth,
    private loyaltyService: LoyaltyService,
    private nutritionService: NutritionService
  ) {}

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
          // Add loyalty points
          this.loyaltyService.addPoints(order.userId, order.loyaltyPointsEarned);
          
          // Update nutrition data
          this.updateNutritionData(order);
          
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
    return user(this.auth).pipe(
      switchMap(user => {
        if (!user) return of([]);
        
        const ordersRef = collection(this.firestore, 'orders');
        const userOrdersQuery = query(
          ordersRef, 
          where('userId', '==', user.uid),
          orderBy('orderTime', 'desc')
        );
        
        return collectionData(userOrdersQuery).pipe(
          map(orders => orders.map(order => 
            this.convertFromFirestore(order as Order, (order as any).id)
          ))
        );
      })
    );
  }

  /**
   * Gets all active orders for the current user
   */
  getActiveOrders(): Observable<Order[]> {
    return user(this.auth).pipe(
      switchMap(user => {
        if (!user) return of([]);
        
        const ordersRef = collection(this.firestore, 'orders');
        const activeOrdersQuery = query(
          ordersRef, 
          where('userId', '==', user.uid),
          where('status', 'in', ['pending', 'processing']),
          orderBy('orderTime', 'desc')
        );
        
        return collectionData(activeOrdersQuery).pipe(
          map(orders => orders.map(order => 
            this.convertFromFirestore(order as Order, (order as any).id)
          ))
        );
      })
    );
  }

  /**
   * Updates an order's status
   */
  updateOrderStatus(orderId: string, status: Order['status']): Observable<void> {
    const orderRef = doc(this.firestore, `orders/${orderId}`);
    
    let update: Partial<Order> = { status };
    
    // Update timestamps based on status
    if (status === 'processing') {
      update.processTime = new Date();
    } else if (status === 'ready' || status === 'delivered') {
      update.completionTime = new Date();
    }
    
    return from(updateDoc(orderRef, update));
  }

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
   * Convert Firestore data to our Order model
   */
  private convertFromFirestore(order: Order, id: string): Order {
    // Assign ID to the order
    order.id = id;
    
    // Convert Firestore timestamps to JS Date objects
    if ((order.orderTime as any)?.toDate) {
      order.orderTime = (order.orderTime as any).toDate();
    }
    
    if ((order.processTime as any)?.toDate) {
      order.processTime = (order.processTime as any).toDate();
    }
    
    if ((order.completionTime as any)?.toDate) {
      order.completionTime = (order.completionTime as any).toDate();
    }
    
    return order;
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

  // Add these methods to your OrderService class

private cartItemsSource: OrderItem[] = [];

/**
 * Gets the current cart items
 */
getCartItems(): OrderItem[] {
  // Try to get cart items from localStorage first
  const storedCart = localStorage.getItem('cartItems');
  if (storedCart) {
    try {
      const parsedCart = JSON.parse(storedCart);
      if (Array.isArray(parsedCart) && parsedCart.length > 0) {
        this.cartItemsSource = parsedCart;
      }
    } catch (e) {
      console.error('Error parsing cart items from localStorage:', e);
    }
  }
  
  return this.cartItemsSource;
}

/**
 * Sets the cart items
 */
setCartItems(items: OrderItem[]): void {
  this.cartItemsSource = items;
  
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
  
  // Save to localStorage
  localStorage.setItem('cartItems', JSON.stringify(this.cartItemsSource));
}

/**
 * Clears the cart
 */
clearCart(): void {
  this.cartItemsSource = [];
  localStorage.removeItem('cartItems');
}
}