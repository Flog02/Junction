// src/app/core/services/notification.service.ts
import { Router } from '@angular/router'; // Add this import

import { Injectable } from '@angular/core';
import { 
  Firestore, 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  query as firestoreQuery, // Rename to avoid conflicts
  where, 
  orderBy, 
  limit as firestoreLimit, // Rename to avoid conflicts
  collectionData,
  getDoc,
  setDoc,
  DocumentReference,
  limit,
  query,
  onSnapshot
} from '@angular/fire/firestore';
import { Auth, user } from '@angular/fire/auth';
import { Observable, from, of, BehaviorSubject } from 'rxjs';
import { map, switchMap, take, tap } from 'rxjs/operators';
import { ToastController, Platform } from '@ionic/angular/standalone';

// Create a notification model if you don't have one
export interface Notification {
  id?: string;
  userId: string;
  title: string;
  message: string;
  type: 'order' | 'loyalty' | 'promotion' | 'system';
  targetId?: string; // Order ID, reward ID, etc.
  createdDate: Date;
  readDate: Date | null;
  image?: string; // Optional icon/image URL
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private unreadCountSubject = new BehaviorSubject<number>(0);
  public unreadCount$ = this.unreadCountSubject.asObservable();
  private lastNotificationTime = new Date().getTime();

  constructor(
    private firestore: Firestore,
    private auth: Auth,
    private toastController: ToastController,
    private platform: Platform,
    private router: Router // Add router injection

  ) {
    // Initialize unread count when service is created
    this.updateUnreadCount();
    
    // Set up real-time listener for new notifications
    this.setupNotificationListener();
  }
  private setupNotificationListener() {
    user(this.auth).pipe(
      switchMap(user => {
        if (!user) return of(null);
        
        // Get reference to the notifications collection
        const notificationsRef = collection(this.firestore, 'notifications');
        
        // Query for new notifications for this user, ordered by creation time
        const userNotificationsQuery = query(
          notificationsRef,
          where('userId', '==', user.uid),
          orderBy('createdDate', 'desc'),
          limit(10)
        );
        
        // Set up the snapshot listener
        const unsubscribe = onSnapshot(
          userNotificationsQuery, 
          (snapshot) => {
            // Process any changes
            snapshot.docChanges().forEach((change) => {
              if (change.type === 'added') {
                const notification = change.doc.data() as any;
                
                // Convert timestamp if necessary
                let createdDate = notification.createdDate;
                if (createdDate && typeof createdDate.toDate === 'function') {
                  createdDate = createdDate.toDate();
                }
                
                // Check if this is a truly new notification (within last 10 seconds)
                const notificationTime = (createdDate instanceof Date) 
                  ? createdDate.getTime() 
                  : new Date(createdDate).getTime();
                  
                if (notificationTime > this.lastNotificationTime && 
                    notificationTime > Date.now() - 10000) {
                  // Show toast notification for this new notification
                  this.showToastNotification(notification);
                  this.lastNotificationTime = notificationTime;
                }
              }
            });
            
            // Update unread count
            this.updateUnreadCount();
          },
          (error) => {
            console.error('Error listening to notifications:', error);
          }
        );
        
        return of(unsubscribe);
      })
    ).subscribe();
  }
  
 /**
 * Show a toast notification for a new notification
 */
private async showToastNotification(notification: any) {
  // Only show if app is in foreground - using correct platform check
  // The platform.is('active') was incorrect, we need another approach
  if (document.hidden) {
    return; // Skip showing toast if browser/app tab is not visible
  }
  
  // Set color based on notification type
  let color = 'primary';
  let icon = 'notifications-outline';
  
  switch (notification.type) {
    case 'order':
      color = 'primary';
      icon = 'cafe-outline';
      break;
    case 'loyalty':
      color = 'success';
      icon = 'gift-outline';
      break;
    case 'promotion':
      color = 'warning';
      icon = 'megaphone-outline';
      break;
    case 'system':
      color = 'medium';
      icon = 'information-circle-outline';
      break;
  }
  
  const toast = await this.toastController.create({
    header: notification.title,
    message: notification.message,
    color: color,
    duration: 4000,
    position: 'top',
    buttons: [
      {
        side: 'start',
        icon: icon,
        role: 'info'
      },
      {
        text: 'View',
        role: 'cancel',
        handler: () => {
          // Navigate to notifications page or specific notification
          if (notification.targetId && notification.type === 'order') {
            // Navigate to the order detail page
            this.router.navigate(['/orders', notification.targetId]);
          } else {
            // Navigate to notifications page
            this.router.navigate(['/notifications']);
          }
          if (notification.id) {
            this.markAsRead(notification.id).subscribe();
          }
        }
      }
    ],
    cssClass: 'notification-toast'
  });
  
  await toast.present();
}

  
  
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
          }),
          tap(notifications => {
            // Update unread count whenever notifications are fetched
            this.unreadCountSubject.next(
              notifications.filter(notification => !notification.readDate).length
            );
          })
        );
      })
    );
  }
  
  /**
   * Gets a limited number of recent notifications
   */
  getRecentNotifications(limitCount: number = 5): Observable<Notification[]> {
    return user(this.auth).pipe(
      switchMap(user => {
        if (!user) return of([]);
        
        const notificationsRef = collection(this.firestore, 'notifications');
        const recentNotificationsQuery = query(
          notificationsRef,
          where('userId', '==', user.uid),
          orderBy('createdDate', 'desc'),
          limit(limitCount)
        );
        
        return collectionData(recentNotificationsQuery, { idField: 'id' }).pipe(
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
        const count = notifications.filter(notification => !notification.readDate).length;
        this.unreadCountSubject.next(count);
        return count;
      })
    );
  }
  
  /**
   * Updates the unread count for the badge
   */
  private updateUnreadCount(): void {
    this.getUnreadCount().pipe(take(1)).subscribe();
  }
  
  /**
   * Marks a notification as read
   */
  markAsRead(notificationId: string): Observable<void> {
    const notificationRef = doc(this.firestore, `notifications/${notificationId}`);
    return from(updateDoc(notificationRef, { readDate: new Date() })).pipe(
      tap(() => {
        // Update unread count after marking as read
        this.updateUnreadCount();
      })
    );
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
        
        return from(Promise.all(markPromises)).pipe(
          tap(() => {
            // Update unread count after marking all as read
            this.unreadCountSubject.next(0);
          })
        );
      })
    );
  }
  
 /**
 * Creates a notification for a specific user
 * This version ensures the notification goes to the specified userId, not the current auth user
 */
/**
 * Creates a notification for a specific user
 * This version ensures the notification goes to the specified userId, not the current auth user
 */

createNotification(notification: Omit<Notification, 'id' | 'createdDate' | 'readDate'>): Observable<string> {
  console.log('Creating notification for user:', notification.userId);
  const notificationsRef = collection(this.firestore, 'notifications');
  
  // Make sure we're using the provided userId, not the current authenticated user
  const newNotification: Omit<Notification, 'id'> = {
    ...notification,
    // Ensure we keep the explicitly provided userId
    userId: notification.userId,
    createdDate: new Date(),
    readDate: null
  };
  
  return from(addDoc(notificationsRef, newNotification)).pipe(
    tap(() => {
      // Show in-app toast notification if this user is the current user
      // This prevents staff from seeing customer notifications
      user(this.auth).pipe(take(1)).subscribe(currentUser => {
        if (currentUser && currentUser.uid === notification.userId) {
          // Only show toast to the intended recipient
          this.showToast(notification.title, notification.message, notification.type);
        } else {
          console.log('Not showing toast - notification is for a different user');
        }
      });
      
      // Update unread count if relevant for current user
      this.updateUnreadCount();
    }),
    map(docRef => docRef.id)
  );
}
  /**
   * Creates an order status notification
   */
  createOrderStatusNotification(userId: string, orderId: string, status: string): Observable<string> {
    let title = '';
    let message = '';
    
    switch (status) {
      case 'pending':
        title = 'Order Received';
        message = 'Your order has been received and is being processed.';
        break;
      case 'processing':
        title = 'Order In Progress';
        message = 'Your order is being prepared.';
        break;
      case 'ready':
        title = 'Order Ready';
        message = 'Your order is ready for pickup!';
        break;
      case 'delivered':
        title = 'Order Delivered';
        message = 'Your order has been delivered. Enjoy!';
        break;
      case 'cancelled':
        title = 'Order Cancelled';
        message = 'Your order has been cancelled.';
        break;
      default:
        title = 'Order Update';
        message = `Your order status has been updated to ${status}.`;
    }
    
    return this.createNotification({
      userId,
      title,
      message,
      type: 'order',
      targetId: orderId
    });
  }
  
  /**
   * Creates a loyalty reward notification
   */
  createLoyaltyRewardNotification(userId: string, rewardName: string, pointsCost: number): Observable<string> {
    return this.createNotification({
      userId,
      title: 'New Reward Available',
      message: `You've earned a ${rewardName} reward for ${pointsCost} points!`,
      type: 'loyalty'
    });
  }
  
  /**
   * Creates a loyalty tier upgrade notification
   */
  createLoyaltyTierNotification(userId: string, tierName: string): Observable<string> {
    return this.createNotification({
      userId,
      title: 'Tier Upgrade',
      message: `Congratulations! You've been upgraded to ${tierName} tier.`,
      type: 'loyalty',
      image: 'assets/icon/tiers/' + tierName.toLowerCase() + '.png'
    });
  }
  
  /**
   * Creates a streak bonus notification
   */
  createStreakBonusNotification(userId: string, streakDays: number, bonusPoints: number): Observable<string> {
    return this.createNotification({
      userId,
      title: 'Streak Bonus',
      message: `Congratulations on your ${streakDays}-day streak! You've earned ${bonusPoints} bonus points.`,
      type: 'loyalty'
    });
  }
  
  /**
   * Shows a toast notification
   */
  private async showToast(title: string, message: string, type: string): Promise<void> {
    // Only show toast if we can determine app is in foreground, or just show it anyway
    // and let the OS handle visibility
    
    // Set color based on notification type
    let color = 'primary';
    
    switch (type) {
      case 'order':
        color = 'primary';
        break;
      case 'loyalty':
        color = 'success';
        break;
      case 'promotion':
        color = 'warning';
        break;
      case 'system':
        color = 'medium';
        break;
    }
    
    const toast = await this.toastController.create({
      header: title,
      message: message,
      color: color,
      duration: 3000,
      position: 'top',
      buttons: [
        {
          text: 'Close',
          role: 'cancel'
        }
      ]
    });
    
    await toast.present();
  }
  
  /**
   * Deletes a notification
   */
  deleteNotification(notificationId: string): Observable<void> {
    const notificationRef = doc(this.firestore, `notifications/${notificationId}`);
    return from(updateDoc(notificationRef, { deleted: true })).pipe(
      tap(() => {
        // Update unread count after deleting
        this.updateUnreadCount();
      })
    );
  }
}