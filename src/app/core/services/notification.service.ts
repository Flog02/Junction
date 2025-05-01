// src/app/core/services/notification.service.ts

import { Injectable } from '@angular/core';
import { 
  Firestore, 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  collectionData 
} from '@angular/fire/firestore';
import { Auth, user } from '@angular/fire/auth';
import { Observable, from, of } from 'rxjs';
import { Notification } from '../models/notification.model';
import { map, switchMap } from 'rxjs/operators';


@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  
  constructor(
    private firestore: Firestore,
    private auth: Auth
  ) {}
  
  /**
   * Gets all notifications for the current user
   */
  getUserNotifications(): Observable<Notification[]> {
    return user(this.auth).pipe(
      switchMap(user => {
        if (!user) return of([]);
        
        const notificationsRef = collection(this.firestore, 'notifications');
        const userNotificationsQuery = query(
          notificationsRef,
          where('userId', '==', user.uid),
          orderBy('createdDate', 'desc')
        );
        
        return collectionData(userNotificationsQuery, { idField: 'id' }).pipe(
          map(notifications => {
            return notifications.map(notification => {
              // Convert timestamps to dates
              const notif = notification as any;
              
              if (notif.createdDate && typeof notif.createdDate.toDate === 'function') {
                notif.createdDate = notif.createdDate.toDate();
              }
              
              if (notif.readDate && typeof notif.readDate.toDate === 'function') {
                notif.readDate = notif.readDate.toDate();
              }
              
              return notif as Notification;
            });
          })
        );
      })
    );
  }
  
  /**
   * Gets unread notifications count
   */
  getUnreadCount(): Observable<number> {
    return this.getUserNotifications().pipe(
      map(notifications => {
        return notifications.filter(notification => !notification.readDate).length;
      })
    );
  }
  
  /**
   * Marks a notification as read
   */
  markAsRead(notificationId: string): Observable<void> {
    const notificationRef = doc(this.firestore, `notifications/${notificationId}`);
    return from(updateDoc(notificationRef, { readDate: new Date() }));
  }
  
  /**
   * Marks all notifications as read
   */
  markAllAsRead(): Observable<void[]> {
    return this.getUserNotifications().pipe(
      switchMap(notifications => {
        const unreadNotifications = notifications.filter(notification => !notification.readDate);
        
        if (unreadNotifications.length === 0) {
          return of([]);
        }
        
        const markPromises = unreadNotifications.map(notification => {
          const notificationRef = doc(this.firestore, `notifications/${notification.id}`);
          return updateDoc(notificationRef, { readDate: new Date() });
        });
        
        return from(Promise.all(markPromises));
      })
    );
  }
  
  /**
   * Creates a notification
   * This would typically be called from a Cloud Function when an event occurs
   */
  createNotification(notification: Omit<Notification, 'id' | 'createdDate' | 'readDate'>): Observable<string> {
    const notificationsRef = collection(this.firestore, 'notifications');
    
    const newNotification: Omit<Notification, 'id'> = {
      ...notification,
      createdDate: new Date(),
      readDate: null
    };
    
    return from(addDoc(notificationsRef, newNotification)).pipe(
      map(docRef => docRef.id)
    );
  }
}