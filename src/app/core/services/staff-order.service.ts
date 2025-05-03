// src/app/core/services/staff-order.service.ts

import { Injectable } from '@angular/core';
import { 
  Firestore, 
  collection, 
  doc, 
  updateDoc, 
  getDoc, 
  collectionData, 
  query, 
  where, 
  orderBy
} from '@angular/fire/firestore';
import { Observable, from } from 'rxjs';
import { map } from 'rxjs/operators';

import { Order } from '../models/order.model';
import { OrderService } from './order.service';

@Injectable({
  providedIn: 'root'
})
export class StaffOrderService {
  constructor(
    private firestore: Firestore,
    private orderService: OrderService
  ) {}

  /**
   * Gets pending orders
   */
  getPendingOrders(): Observable<Order[]> {
    const ordersRef = collection(this.firestore, 'orders');
    const pendingOrdersQuery = query(
      ordersRef,
      where('status', '==', 'pending'),
      orderBy('orderTime', 'desc')
    );
    
    return collectionData(pendingOrdersQuery, { idField: 'id' }).pipe(
      map(orders => {
        return orders.map(order => this.orderService.convertFromFirestore(order as any, order['id'] as string));
      })
    );
  }

  /**
   * Gets processing orders
   */
  getProcessingOrders(): Observable<Order[]> {
    const ordersRef = collection(this.firestore, 'orders');
    const processingOrdersQuery = query(
      ordersRef,
      where('status', '==', 'processing'),
      orderBy('orderTime', 'desc')
    );
    
    return collectionData(processingOrdersQuery, { idField: 'id' }).pipe(
      map(orders => {
        return orders.map(order => this.orderService.convertFromFirestore(order as any, order['id'] as string));
      })
    );
  }

  /**
   * Gets completed orders (ready + delivered)
   */
  getCompletedOrders(): Observable<Order[]> {
    const ordersRef = collection(this.firestore, 'orders');
    const completedOrdersQuery = query(
      ordersRef,
      where('status', 'in', ['ready', 'delivered']),
      orderBy('orderTime', 'desc')
    );
    
    return collectionData(completedOrdersQuery, { idField: 'id' }).pipe(
      map(orders => {
        return orders.map(order => this.orderService.convertFromFirestore(order as any, order['id'] as string));
      })
    );
  }

  /**
   * Updates an order's status
   */
  updateOrderStatus(orderId: string, status: Order['status']): Observable<void> {
    return this.orderService.updateOrderStatus(orderId, status);
  }

  /**
   * Marks an order as being processed
   */
  startProcessingOrder(orderId: string): Observable<void> {
    return this.updateOrderStatus(orderId, 'processing');
  }

  /**
   * Marks an order as ready
   */
  completeOrder(orderId: string): Observable<void> {
    return this.updateOrderStatus(orderId, 'ready');
  }

  /**
   * Marks an order as delivered
   */
  deliverOrder(orderId: string): Observable<void> {
    return this.updateOrderStatus(orderId, 'delivered');
  }

  /**
   * Gets a specific order
   */
  getOrder(orderId: string): Observable<Order | null> {
    return this.orderService.getOrder(orderId);
  }
}