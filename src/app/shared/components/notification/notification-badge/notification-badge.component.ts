import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonBadge, IonIcon, IonButton } from '@ionic/angular/standalone';
import { RouterModule } from '@angular/router';
import { NotificationService } from 'src/app/core/services/notification.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { addIcons } from 'ionicons';
import { notificationsOutline } from 'ionicons/icons';

@Component({
  selector: 'app-notification-badge',
  template: `
    <ion-button [routerLink]="['/notifications']" fill="clear" size="small">
      <ion-icon name="notifications-outline" [color]="iconColor"></ion-icon>
      <ion-badge *ngIf="unreadCount > 0" color="danger">{{ unreadCount }}</ion-badge>
    </ion-button>
  `,
  styles: [`
    :host {
      display: inline-block;
    }
    
    ion-button {
      position: relative;
      --padding-start: 4px;
      --padding-end: 4px;
      height: 40px;
    }
    
    ion-icon {
      font-size: 24px;
    }
    
    ion-badge {
      position: absolute;
      top: 3px;
      right: 3px;
      border-radius: 50%;
      padding: 3px 6px;
      min-width: 16px;
      font-size: 10px;
      font-weight: bold;
    }
    
    @keyframes pulse {
      0% {
        transform: scale(1);
      }
      50% {
        transform: scale(1.2);
      }
      100% {
        transform: scale(1);
      }
    }
    
    ion-badge.animate {
      animation: pulse 1.5s infinite;
    }
  `],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    IonBadge,
    IonIcon,
    IonButton
  ]
})
export class NotificationBadgeComponent implements OnInit, OnDestroy {
  @Input() iconColor: string = 'medium';
  
  unreadCount: number = 0;
  private destroy$ = new Subject<void>();

  constructor(private notificationService: NotificationService) {
    addIcons({ notificationsOutline });
  }

  ngOnInit() {
    // Subscribe to unread count
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
}