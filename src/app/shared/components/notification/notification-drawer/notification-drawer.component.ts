import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  IonList, 
  IonItem, 
  IonLabel, 
  IonIcon, 
  IonButton, 
  IonNote,
  IonBadge,
  IonSkeletonText,
  ModalController,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonFooter,
  NavController
} from '@ionic/angular/standalone';
import { RouterModule } from '@angular/router';
import { NotificationService } from 'src/app/core/services/notification.service';
import { Notification } from 'src/app/core/models/notification.model';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { addIcons } from 'ionicons';
import { 
  notificationsOutline, 
  closeOutline, 
  timeOutline, 
  chevronForwardOutline,
  checkmarkDoneOutline,
  arrowForwardOutline,
  cafeOutline,
  giftOutline,
  megaphoneOutline,
  informationCircleOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-notification-drawer',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>
          <div class="notification-title">
            <ion-icon name="notifications-outline"></ion-icon>
            <span>Notifications</span>
            <ion-badge *ngIf="unreadCount > 0" color="danger">{{ unreadCount }}</ion-badge>
          </div>
        </ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="dismissModal()">
            <ion-icon name="close-outline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <!-- Loading skeleton -->
      <div *ngIf="loading">
        <ion-list>
          <ion-item *ngFor="let i of [1,2,3]">
            <ion-icon name="notifications-outline" slot="start"></ion-icon>
            <ion-label>
              <h2><ion-skeleton-text [animated]="true" style="width: 50%"></ion-skeleton-text></h2>
              <p><ion-skeleton-text [animated]="true" style="width: 80%"></ion-skeleton-text></p>
            </ion-label>
            <ion-note slot="end">
              <ion-skeleton-text [animated]="true" style="width: 20px"></ion-skeleton-text>
            </ion-note>
          </ion-item>
        </ion-list>
      </div>

      <!-- Empty state -->
      <div *ngIf="!loading && notifications.length === 0" class="empty-state">
        <ion-icon name="notifications-outline"></ion-icon>
        <h2>No Notifications</h2>
        <p>You don't have any notifications yet.</p>
      </div>

      <!-- Notifications list -->
      <ion-list *ngIf="!loading && notifications.length > 0">
        <ion-item 
          *ngFor="let notification of notifications"
          [ngClass]="{'unread': !notification.readDate}" 
          (click)="handleNotificationClick(notification)"
          button
        >
          <ion-icon 
            [name]="getNotificationIcon(notification)" 
            slot="start" 
            [color]="getNotificationColor(notification)"
          ></ion-icon>
          <ion-label>
            <h2>{{ notification.title }}</h2>
            <p>{{ notification.message }}</p>
            <p class="notification-time">
              <ion-icon name="time-outline"></ion-icon>
              {{ formatRelativeTime(notification.createdDate) }}
            </p>
          </ion-label>
          <ion-badge 
            *ngIf="!notification.readDate" 
            color="danger" 
            slot="end"
          >
            New
          </ion-badge>
          <ion-icon
            *ngIf="notification.readDate"
            name="chevron-forward-outline"
            slot="end"
            color="medium"
          ></ion-icon>
        </ion-item>
      </ion-list>
    </ion-content>

    <ion-footer>
      <ion-toolbar>
        <ion-button expand="block" fill="clear" (click)="markAllAsRead()" [disabled]="unreadCount === 0">
          <ion-icon name="checkmark-done-outline" slot="start"></ion-icon>
          Mark All as Read
        </ion-button>
        <ion-button expand="block" (click)="viewAllNotifications()">
          <ion-icon name="arrow-forward-outline" slot="end"></ion-icon>
          View All Notifications
        </ion-button>
      </ion-toolbar>
    </ion-footer>
  `,
  styles: [`
    :host {
      display: block;
    }
    
    .notification-title {
      display: flex;
      align-items: center;
      
      ion-icon {
        margin-right: 8px;
        font-size: 20px;
      }
      
      ion-badge {
        margin-left: 8px;
        border-radius: 12px;
        padding: 4px 8px;
      }
    }
    
    ion-item.unread {
      --background: var(--ion-color-light-tint);
      border-left: 3px solid var(--ion-color-primary);
      font-weight: 500;
      
      ion-icon {
        font-size: 22px;
      }
      
      h2 {
        font-weight: 600;
      }
    }
    
    .notification-time {
      display: flex;
      align-items: center;
      color: var(--ion-color-medium);
      font-size: 12px;
      margin-top: 6px;
      
      ion-icon {
        margin-right: 4px;
        font-size: 14px;
      }
    }
    
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      height: 50vh;
      padding: 0 20px;
      
      ion-icon {
        font-size: 48px;
        color: var(--ion-color-medium);
        margin-bottom: 16px;
      }
      
      h2 {
        font-size: 18px;
        margin-bottom: 8px;
        color: var(--ion-color-dark);
      }
      
      p {
        font-size: 14px;
        color: var(--ion-color-medium);
        max-width: 260px;
        margin: 0 auto;
      }
    }
    
    ion-footer ion-toolbar {
      padding: 8px 12px;
    }
  `],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    IonList, 
    IonItem, 
    IonLabel, 
    IonIcon, 
    IonButton, 
    IonNote,
    IonBadge,
    IonSkeletonText,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonFooter
  ]
})
export class NotificationDrawerComponent implements OnInit, OnDestroy {
  notifications: Notification[] = [];
  loading = true;
  unreadCount = 0;
  private destroy$ = new Subject<void>();

  constructor(
    private notificationService: NotificationService,
    private modalController: ModalController,
    private navController: NavController
  ) {
    addIcons({
      notificationsOutline, 
      closeOutline, 
      timeOutline, 
      chevronForwardOutline,
      checkmarkDoneOutline,
      arrowForwardOutline,
      cafeOutline,
      giftOutline,
      megaphoneOutline,
      informationCircleOutline
    });
  }

  ngOnInit() {
    this.loadRecentNotifications();
    
    // Get unread count
    this.notificationService.unreadCount$
      .pipe(takeUntil(this.destroy$))
      .subscribe(count => {
        this.unreadCount = count;
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load recent notifications
   */
  loadRecentNotifications() {
    this.loading = true;
    this.notificationService.getRecentNotifications(5)
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
   * Dismiss the modal
   */
  dismissModal() {
    this.modalController.dismiss();
  }

  /**
   * View all notifications
   */
  viewAllNotifications() {
    this.modalController.dismiss();
    this.navController.navigateForward('/notifications');
  }

  /**
   * Mark all notifications as read
   */
  markAllAsRead() {
    if (this.unreadCount === 0) return;
    
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
          this.unreadCount = 0;
        },
        error: (error) => {
          console.error('Error marking all as read:', error);
        }
      });
  }

  /**
   * Handle notification click
   */
  handleNotificationClick(notification: Notification) {
    // Mark as read
    if (!notification.readDate) {
      this.notificationService.markAsRead(notification.id!)
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => {
          // Update locally
          const index = this.notifications.findIndex(n => n.id === notification.id);
          if (index !== -1) {
            this.notifications[index].readDate = new Date();
          }
          this.unreadCount = Math.max(0, this.unreadCount - 1);
        });
    }
    
    // Handle action URL if present
    if (notification.actionUrl) {
      this.dismissModal();
      this.navController.navigateForward(notification.actionUrl);
    }
    
    // Handle target ID
    if (notification.targetId) {
      if (notification.type === 'order') {
        this.dismissModal();
        this.navController.navigateForward(`/orders/${notification.targetId}`);
      }
    }
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
}