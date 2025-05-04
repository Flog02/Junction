import { Injectable } from '@angular/core';
import { 
  Firestore, 
  doc, 
  collection, 
  addDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  collectionData,
  getDocs
} from '@angular/fire/firestore';
import { Auth, user } from '@angular/fire/auth';
import { Observable, from, of, throwError, BehaviorSubject } from 'rxjs';
import { map, switchMap, catchError, take, tap } from 'rxjs/operators';

import { Order, OrderItem } from '../models/order.model';
import { OrderService } from './order.service';
import { TableService } from './table.service';
import { TableInfo, StoreInfo } from '../models/table.model';
import { NotificationService } from './notification.service';

@Injectable({
  providedIn: 'root'
})
export class TableOrderService {
  // Track the current table information
  private currentTableSubject = new BehaviorSubject<{
    tableInfo: TableInfo | null;
    storeInfo: StoreInfo | null;
  }>({
    tableInfo: null, 
    storeInfo: null
  });
  
  public currentTable$ = this.currentTableSubject.asObservable();
  
  constructor(
    private firestore: Firestore,
    private auth: Auth,
    private orderService: OrderService,
    private tableService: TableService,
    private notificationService: NotificationService
  ) {
    // Check if there's stored table info in localStorage
    this.loadStoredTableInfo();
  }
  
  /**
   * Load stored table info from localStorage if available
   */
  private loadStoredTableInfo() {
    try {
      const storedTableInfo = localStorage.getItem('currentTableInfo');
      const storedStoreInfo = localStorage.getItem('currentStoreInfo');
      
      if (storedTableInfo && storedStoreInfo) {
        const tableInfo = JSON.parse(storedTableInfo) as TableInfo;
        const storeInfo = JSON.parse(storedStoreInfo) as StoreInfo;
        
        this.currentTableSubject.next({ tableInfo, storeInfo });
      }
    } catch (error) {
      console.error('Error loading stored table info:', error);
    }
  }
  
  /**
   * Set current table information
   */
  setCurrentTable(tableInfo: TableInfo): Observable<StoreInfo | null> {
    return this.tableService.getStoreInfo(tableInfo.storeId).pipe(
      tap(storeInfo => {
        if (storeInfo) {
          // Store in BehaviorSubject
          this.currentTableSubject.next({ tableInfo, storeInfo });
          
          // Store in localStorage for persistence
          localStorage.setItem('currentTableInfo', JSON.stringify(tableInfo));
          localStorage.setItem('currentStoreInfo', JSON.stringify(storeInfo));
        } else {
          console.error('Store not found for table:', tableInfo.tableNumber);
        }
      })
    );
  }
  
  /**
   * Clear current table information
   */
  clearCurrentTable() {
    this.currentTableSubject.next({ tableInfo: null, storeInfo: null });
    localStorage.removeItem('currentTableInfo');
    localStorage.removeItem('currentStoreInfo');
  }
  
  /**
   * Get current table information
   */
  getCurrentTable() {
    return this.currentTableSubject.value;
  }
  
  /**
   * Check if there is a current table set
   */
  hasCurrentTable(): boolean {
    return !!this.currentTableSubject.value.tableInfo;
  }

  /**
   * Creates a new order from a table
   */
  createTableOrder(order: Partial<Order>): Observable<string> {
    const { tableInfo, storeInfo } = this.currentTableSubject.value;
    
    if (!tableInfo || !storeInfo) {
      return throwError(() => new Error('No table selected. Please scan a table QR code first.'));
    }
    
    // Verify that the store exists and is open
    return this.tableService.isStoreOpen(tableInfo.storeId).pipe(
      switchMap(isOpen => {
        if (!isOpen) {
          return throwError(() => new Error(`${storeInfo.name} is currently closed.`));
        }
        
        // Set table-specific information
        order.tableNumber = tableInfo.tableNumber;
        order.storeId = tableInfo.storeId;
        order.isTableOrder = true;
        
        // Return user ID or create a guest ID
        return from(this.auth.currentUser 
          ? Promise.resolve(this.auth.currentUser.uid) 
          : Promise.resolve(`guest-${Date.now()}`)
        );
      }),
      switchMap(userId => {
        // Complete order object
        const completeOrder: Partial<Order> = {
          ...order,
          userId,
          orderTime: new Date(),
          status: 'pending',
          paymentStatus: order.paymentStatus || 'pending',
          // Set other defaults
          processTime: null,
          completionTime: null,
          deliveredBy: null,
          notes: order.notes || `Table ${tableInfo.tableNumber} order`
        };
        
        // Create the order using OrderService
        return this.orderService.createOrder(completeOrder as Order);
      }),
      tap(orderId => {
        // Clear cart after successful order
        this.orderService.clearCart();
        
        // Create a notification for staff
        this.notificationService.createNotification({
          userId: 'staff', // Special userId for staff notifications
          title: `New Table Order: #${tableInfo.tableNumber}`,
          message: `New order received for Table ${tableInfo.tableNumber}`,
          type: 'order',
          targetId: orderId,
        }).subscribe();
      })
    );
  }
  
  /**
   * Gets active orders for the current table
   */
  getCurrentTableOrders(): Observable<Order[]> {
    const { tableInfo } = this.currentTableSubject.value;
    
    if (!tableInfo) {
      return of([]);
    }
    
    return this.getActiveTableOrders(tableInfo.storeId, tableInfo.tableNumber);
  }
  
  /**
   * Gets active orders for a specific table
   */
  getActiveTableOrders(storeId: string, tableNumber: number): Observable<Order[]> {
    const ordersRef = collection(this.firestore, 'orders');
    const tableOrdersQuery = query(
      ordersRef,
      where('storeId', '==', storeId),
      where('tableNumber', '==', tableNumber),
      where('status', 'in', ['pending', 'processing']),
      orderBy('orderTime', 'desc')
    );
    
    return collectionData(tableOrdersQuery, { idField: 'id' }).pipe(
      map(orders => orders.map(order => {
        // Convert Firestore timestamps to JS Date objects
        if ((order as any).orderTime?.toDate) {
          (order as any).orderTime = (order as any).orderTime.toDate();
        }
        
        if ((order as any).processTime?.toDate) {
          (order as any).processTime = (order as any).processTime.toDate();
        }
        
        if ((order as any).completionTime?.toDate) {
          (order as any).completionTime = (order as any).completionTime.toDate();
        }
        
        return order as Order;
      }))
    );
  }
  
  /**
   * Gets all orders for a specific table
   */
  getTableOrderHistory(storeId: string, tableNumber: number): Observable<Order[]> {
    const ordersRef = collection(this.firestore, 'orders');
    const tableOrdersQuery = query(
      ordersRef,
      where('storeId', '==', storeId),
      where('tableNumber', '==', tableNumber),
      orderBy('orderTime', 'desc')
    );
    
    return collectionData(tableOrdersQuery, { idField: 'id' }).pipe(
      map(orders => orders.map(order => {
        // Convert Firestore timestamps to JS Date objects
        if ((order as any).orderTime?.toDate) {
          (order as any).orderTime = (order as any).orderTime.toDate();
        }
        
        if ((order as any).processTime?.toDate) {
          (order as any).processTime = (order as any).processTime.toDate();
        }
        
        if ((order as any).completionTime?.toDate) {
          (order as any).completionTime = (order as any).completionTime.toDate();
        }
        
        return order as Order;
      }))
    );
  }
  
  /**
   * Gets the estimated wait time for the current store
   */
  getEstimatedWaitTime(): Observable<number> {
    const { storeInfo } = this.currentTableSubject.value;
    
    if (!storeInfo) {
      return of(15); // Default 15 minutes if no store info
    }
    
    return of(storeInfo.currentWaitTime || 10);
  }
}