import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonContent, 
  IonList, 
  IonItem, 
  IonLabel, 
  IonNote, 
  IonIcon, 
  IonBadge, 
  IonButton, 
  IonSkeletonText,
  IonButtons,
  IonBackButton,
  IonSegment,
  IonSegmentButton,
  IonItemSliding,
  IonItemOptions,
  IonItemOption,
  AlertController,
  IonSpinner,
  IonReorderGroup,
  IonReorder,
  IonInfiniteScroll,
  IonInfiniteScrollContent, IonRefresher, IonRefresherContent } from '@ionic/angular/standalone';
import { RouterModule } from '@angular/router';
import { NotificationService } from 'src/app/core/services/notification.service';
import { Notification } from 'src/app/core/models/notification.model';
import { addIcons } from 'ionicons';
import { 
  notificationsOutline, 
  timeOutline, 
  checkmarkCircleOutline, 
  checkmarkDoneOutline, 
  closeCircleOutline, 
  alertCircleOutline, 
  giftOutline, 
  cafeOutline, 
  megaphoneOutline, 
  informationCircleOutline,
  trashOutline,
  chevronForwardOutline
} from 'ionicons/icons';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { FormsModule } from '@angular/forms';
@Component({
  selector: 'app-notification',
  templateUrl: './notification.component.html',
  styleUrls: ['./notification.component.scss'],
  standalone: true,
  imports: [IonRefresherContent, IonRefresher, FormsModule,
    CommonModule,
    RouterModule,
    IonHeader, 
    IonToolbar, 
    IonTitle, 
    IonContent, 
    IonList, 
    IonItem, 
    IonLabel, 
    IonNote, 
    IonIcon, 
    IonBadge, 
    IonButton, 
    IonSkeletonText,
    IonButtons,
    IonBackButton,
    IonSegment,
    IonSegmentButton,
    IonItemSliding,
    IonItemOptions,
    IonItemOption,
    IonSpinner,
    IonReorderGroup,
    IonReorder,
    IonInfiniteScroll,
    IonInfiniteScrollContent
  ]
})
export class NotificationComponent implements OnInit, OnDestroy {
  notifications: Notification[] = [];
  loading = true;
  selectedSegment = 'all';
  private destroy$ = new Subject<void>();

  constructor(
    private notificationService: NotificationService,
    private alertController: AlertController
  ) {
    addIcons({
      notificationsOutline, 
      timeOutline, 
      checkmarkCircleOutline, 
      checkmarkDoneOutline, 
      closeCircleOutline, 
      alertCircleOutline, 
      giftOutline, 
      cafeOutline, 
      megaphoneOutline, 
      informationCircleOutline,
      trashOutline,
      chevronForwardOutline
    });
  }

  ngOnInit() {
    this.loadNotifications();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load all notifications
   */
  loadNotifications() {
    this.loading = true;
    this.notificationService.getUserNotifications()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (notifications) => {
          this.notifications = notifications;
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading notifications:', error);
          this.loading = false;
        }
      });
  }

  /**
   * Filter notifications based on selected segment
   */
  get filteredNotifications() {
    if (this.selectedSegment === 'all') {
      return this.notifications.filter(notification => !notification.deleted);
    } else if (this.selectedSegment === 'unread') {
      return this.notifications.filter(notification => !notification.readDate && !notification.deleted);
    } else {
      return this.notifications.filter(notification => 
        notification.type === this.selectedSegment && !notification.deleted
      );
    }
  }

  /**
   * Handle segment change
   */
  segmentChanged(event: any) {
    this.selectedSegment = event.detail.value;
  }

  /**
   * Mark a notification as read
   */
  markAsRead(notification: Notification) {
    if (notification.readDate) return;

    this.notificationService.markAsRead(notification.id!)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          // Update locally
          const index = this.notifications.findIndex(n => n.id === notification.id);
          if (index !== -1) {
            this.notifications[index].readDate = new Date();
          }
        },
        error: (error) => {
          console.error('Error marking notification as read:', error);
        }
      });
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead() {
    const unreadCount = this.notifications.filter(n => !n.readDate).length;
    
    if (unreadCount === 0) {
      return;
    }

    const alert = await this.alertController.create({
      header: 'Mark All as Read',
      message: `Are you sure you want to mark all ${unreadCount} unread notifications as read?`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Yes',
          handler: () => {
            this.notificationService.markAllAsRead()
              .pipe(takeUntil(this.destroy$))
              .subscribe({
                next: () => {
                  // Update locally
                  this.notifications.forEach(notification => {
                    if (!notification.readDate) {
                      notification.readDate = new Date();
                    }
                  });
                },
                error: (error) => {
                  console.error('Error marking all as read:', error);
                }
              });
          }
        }
      ]
    });

    await alert.present();
  }

  /**
   * Delete a notification
   */
  deleteNotification(notification: Notification) {
    this.notificationService.deleteNotification(notification.id!)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          // Update locally
          const index = this.notifications.findIndex(n => n.id === notification.id);
          if (index !== -1) {
            this.notifications[index].deleted = true;
          }
        },
        error: (error) => {
          console.error('Error deleting notification:', error);
        }
      });
  }

  /**
   * Get the icon for a notification based on its type
   */
  getNotificationIcon(notification: Notification): string {
    switch (notification.type) {
      case 'order':
        return 'cafe-outline';
      case 'loyalty':
        return 'gift-outline';
      case 'promotion':
        return 'megaphone-outline';
      case 'system':
        return 'information-circle-outline';
      default:
        return 'notifications-outline';
    }
  }

  /**
   * Get the color for a notification based on its type
   */
  getNotificationColor(notification: Notification): string {
    switch (notification.type) {
      case 'order':
        return 'primary';
      case 'loyalty':
        return 'success';
      case 'promotion':
        return 'warning';
      case 'system':
        return 'medium';
      default:
        return 'primary';
    }
  }

  /**
   * Format relative time
   */
  formatRelativeTime(date: Date): string {
    if (!date) return '';
    
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    
    if (diffSec < 60) {
      return 'Just now';
    } else if (diffMin < 60) {
      return `${diffMin} ${diffMin === 1 ? 'minute' : 'minutes'} ago`;
    } else if (diffHour < 24) {
      return `${diffHour} ${diffHour === 1 ? 'hour' : 'hours'} ago`;
    } else if (diffDay < 7) {
      return `${diffDay} ${diffDay === 1 ? 'day' : 'days'} ago`;
    } else {
      return this.formatDate(date);
    }
  }

  /**
   * Format date
   */
  formatDate(date: Date): string {
    if (!date) return '';
    
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  /**
   * Pull to refresh
   */
  doRefresh(event: any) {
    this.notificationService.getUserNotifications()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (notifications:any) => {
          this.notifications = notifications;
          event.target.complete();
        },
        error: (error) => {
          console.error('Error refreshing notifications:', error);
          event.target.complete();
        }
      });
  }

  /**
   * Handle notification click
   */
  handleNotificationClick(notification: Notification) {
    // Mark as read
    this.markAsRead(notification);
    
    // Handle action URL if present
    if (notification.actionUrl) {
      // Navigate to the URL (implement based on your routing)
    }
  }
}