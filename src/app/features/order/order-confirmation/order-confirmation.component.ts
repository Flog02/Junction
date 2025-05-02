import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonButton, IonIcon, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonCardSubtitle, IonSpinner, IonContent, IonTitle, IonToolbar, IonHeader } from '@ionic/angular/standalone';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { OrderService } from '../../../core/services/order.service';
import { Order } from '../../../core/models/order.model';
import { LoyaltyService } from '../../../core/services/loyalty.service';

@Component({
  selector: 'app-order-confirmation',
  templateUrl: './order-confirmation.component.html',
  styleUrls: ['./order-confirmation.component.scss'],
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonSpinner, IonCardSubtitle, IonCardTitle, IonCardHeader, IonCardContent, IonCard, IonIcon, IonButton, CommonModule, RouterModule]
})
export class OrderConfirmationComponent implements OnInit, OnDestroy {
  order: Order | null = null;
  isLoading = true;
  error: string | null = null;
  loyaltyPoints = 0;
  
  private destroy$ = new Subject<void>();
  
  constructor(
    private orderService: OrderService,
    private loyaltyService: LoyaltyService,
    private route: ActivatedRoute,
    private router: Router
  ) {}
  
  ngOnInit() {
    const orderId = this.route.snapshot.paramMap.get('id');
    
    if (orderId) {
      this.loadOrder(orderId);
    } else {
      this.error = 'No order ID provided';
      this.isLoading = false;
    }
  }
  
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  loadOrder(orderId: string) {
    this.orderService.getOrder(orderId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (order) => {
          this.order = order;
          this.isLoading = false;
          
          // Update loyalty streak
          this.loyaltyService.updateStreak()
            .pipe(takeUntil(this.destroy$))
            .subscribe();
            
          // Get loyalty points
          if (order) {
            this.loyaltyPoints = order.loyaltyPointsEarned;
          }
        },
        error: (err) => {
          this.error = `Failed to load order: ${err.message}`;
          this.isLoading = false;
        }
      });
  }
  
  goToHome() {
    this.router.navigate(['/home']);
  }
  
  trackOrder() {
    if (this.order) {
      this.router.navigate(['/orders', this.order.id]);
    }
  }
  
  formatDate(date: Date | null): string {
    if (!date) return '';
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  getEstimatedPickupTime(): string {
    if (!this.order || !this.order.orderTime) return '';
    
    const pickupTime = new Date(this.order.orderTime);
    pickupTime.setMinutes(pickupTime.getMinutes() + 10); // Estimate 10 minutes
    
    return this.formatDate(pickupTime);
  }
}