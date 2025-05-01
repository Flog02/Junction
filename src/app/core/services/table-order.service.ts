// src/app/core/services/table-order.service.ts

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
  collectionData
} from '@angular/fire/firestore';
import { Auth, user } from '@angular/fire/auth';
import { Observable, from, of, throwError } from 'rxjs';
import { map, switchMap, catchError } from 'rxjs/operators';

import { Order } from '../models/order.model';
import { OrderService } from './order.service';
import { TableService } from './table.service';

@Injectable({
  providedIn: 'root'
})
export class TableOrderService {
  
  constructor(
    private firestore: Firestore,
    private auth: Auth,
    private orderService: OrderService,
    private tableService: TableService
  ) {}
  
// Continuing Table Order Service

  /**
   * Creates a new order from a table
   */
  createTableOrder(storeId: string, tableNumber: number, order: Order): Observable<string> {
    // Verify that the store exists and is open
    return this.tableService.isStoreOpen(storeId).pipe(
      switchMap(isOpen => {
        if (!isOpen) {
          return throwError(() => new Error('Store is currently closed'));
        }
        
        // Set table number in order
        order.tableNumber = tableNumber;
        order.storeId = storeId;
        
        // Create the order
        return this.orderService.createOrder(order);
      })
    );
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
    
    return collectionData(tableOrdersQuery).pipe(
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
        
        return { id: (order as any).id, ...(order as any) } as Order;
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
    
    return collectionData(tableOrdersQuery).pipe(
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
        
        return { id: (order as any).id, ...(order as any) } as Order;
      }))
    );
  }
}