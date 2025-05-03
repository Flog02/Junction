// src/app/features/order/order-checkout/order-checkout.component.ts

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonContent, 
  IonButtons, 
  IonBackButton,
  IonButton,
  IonIcon,
  IonSpinner,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonItem,
  IonLabel,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonList,
  IonListHeader,
  AlertController,
  LoadingController
} from '@ionic/angular/standalone';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { addIcons } from 'ionicons';
import { 
  cardOutline, 
  cashOutline, 
  walletOutline, 
  checkmarkCircleOutline, 
  cafeOutline, 
  locationOutline,
  timeOutline,
  peopleOutline,
  receiptOutline
} from 'ionicons/icons';

import { OrderService } from '../../../core/services/order.service';
import { AuthService } from '../../../core/services/auth.service';
import { LoyaltyService } from '../../../core/services/loyalty.service';
import { GiftCardService } from '../../../core/services/gift-card.service';
import { Order, OrderItem } from '../../../core/models/order.model';

@Component({
  selector: 'app-order-checkout',
  templateUrl: './order-checkout.component.html',
  styleUrls: ['./order-checkout.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    IonHeader, 
    IonToolbar, 
    IonTitle, 
    IonContent, 
    IonButtons, 
    IonBackButton,
    IonButton,
    IonIcon,
    IonSpinner,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    IonItem,
    IonLabel,
    IonInput,
    IonSelect,
    IonSelectOption,
    IonList,
    IonListHeader
  ]
})
export class OrderCheckoutComponent implements OnInit, OnDestroy {
  // Order details
  cartItems: OrderItem[] = [];
  subtotal: number = 0;
  tax: number = 0;
  total: number = 0;
  
  // Service details
  serviceType: string = 'pickup';
  pickupTime: string = 'asap';
  tableNumber: number | null = null;
  
  // Payment details
  paymentMethod: string = 'card';
  tipPercentage: number = 15;
  tipAmount: number = 0;
  
  // Discounts and rewards
  rewardId: string | null = null;
  rewardDiscount: number = 0;
  giftCardCode: string | null = null;
  giftCardAmount: number = 0;
  
  // States
  isLoading: boolean = false;
  
  private destroy$ = new Subject<void>();
  
  constructor(
    private orderService: OrderService,
    private authService: AuthService,
    private loyaltyService: LoyaltyService,
    private giftCardService: GiftCardService,
    private router: Router,
    private route: ActivatedRoute,
    private alertController: AlertController,
    private loadingController: LoadingController
  ) {
    addIcons({
      cardOutline, 
      cashOutline, 
      walletOutline, 
      checkmarkCircleOutline, 
      cafeOutline, 
      locationOutline,
      timeOutline,
      peopleOutline,
      receiptOutline
    });
  }
  
  ngOnInit() {
    // Load cart items
    this.cartItems = this.orderService.getCartItems();
    
    if (this.cartItems.length === 0) {
      // No items in cart, redirect to cart page
      this.router.navigate(['/order/cart']);
      return;
    }
    
    // Get query parameters
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        this.serviceType = params['serviceType'] || 'pickup';
        this.pickupTime = params['pickupTime'] || 'asap';
        this.tableNumber = params['tableNumber'] ? parseInt(params['tableNumber'], 10) : null;
        this.rewardId = params['reward'] || null;
        this.giftCardCode = params['giftCard'] || null;
        
        // Load reward and gift card details
        this.loadDiscounts();
      });
    
    // Calculate order totals
    this.calculateOrderTotals();
  }
  
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  /**
   * Loads discount information from rewards and gift cards
   */
  loadDiscounts() {
    // Load reward discount if a reward was selected
    if (this.rewardId) {
      this.loyaltyService.getAvailableRewards()
        .pipe(takeUntil(this.destroy$))
        .subscribe(rewards => {
          const selectedReward = rewards.find(r => r.id === this.rewardId);
          if (selectedReward) {
            // Calculate reward discount (e.g., $1 per 10 points)
            this.rewardDiscount = selectedReward.pointsCost / 10;
            this.calculateOrderTotals();
          }
        });
    }
    
    // Load gift card amount if a gift card was provided
    if (this.giftCardCode) {
      this.giftCardService.getGiftCardByCode(this.giftCardCode)
        .pipe(takeUntil(this.destroy$))
        .subscribe(giftCard => {
          if (giftCard && giftCard.status === 'active') {
            this.giftCardAmount = giftCard.amount;
            this.calculateOrderTotals();
          }
        });
    }
  }
  
  /**
   * Calculates order totals
   */
  calculateOrderTotals() {
    // Calculate subtotal
    this.subtotal = this.cartItems.reduce((sum, item) => sum + item.itemTotal, 0);
    
    // Calculate tax (7.25%)
    this.tax = this.subtotal * 0.0725;
    
    // Calculate tip
    this.tipAmount = this.subtotal * (this.tipPercentage / 100);
    
    // Calculate total before discounts
    this.total = this.subtotal + this.tax + this.tipAmount;
    
    // Apply reward discount
    if (this.rewardDiscount > 0) {
      this.total -= this.rewardDiscount;
    }
    
    // Apply gift card amount
    if (this.giftCardAmount > 0) {
      this.total = Math.max(0, this.total - this.giftCardAmount);
    }
  }
  
  /**
   * Updates tip amount when tip percentage changes
   */
  updateTip() {
    this.calculateOrderTotals();
  }
  
  /**
   * Handles custom tip amount input
   */
  handleCustomTip(event: CustomEvent) {
    const customAmount = parseFloat(event.detail.value);
    if (!isNaN(customAmount)) {
      this.tipAmount = customAmount;
      this.tipPercentage = Math.round((customAmount / this.subtotal) * 100);
      this.calculateOrderTotals();
    }
  }
  
  /**
   * Places the order
   */
  // Fix for AuthService usage
async placeOrder() {
    // Show loading indicator
    const loading = await this.loadingController.create({
      message: 'Processing your order...'
    });
    await loading.present();
    
    try {
      // Get current user ID - fixed to use getCurrentUser() method
      const user = await this.authService.getCurrentUser();
      const userId = user?.uid || 'guest';
      
      // Create order object
      const order: Partial<Order> = {
        userId: userId,
        storeId: 'main-store', // This would normally come from store selection
        tableNumber: this.serviceType === 'dine-in' ? this.tableNumber : null,
        orderTime: new Date(),
        processTime: null,
        completionTime: null,
        status: 'pending',
        paymentStatus: 'paid', // Assume payment is successful
        paymentMethod: this.paymentMethod,
        items: this.cartItems,
        subtotal: this.subtotal,
        tax: this.tax,
        tip: this.tipAmount,
        total: this.total,
        loyaltyPointsEarned: Math.floor(this.subtotal), // 1 point per dollar
        giftCardApplied: this.giftCardCode ? {
          id: this.giftCardCode,
          amount: this.giftCardAmount
        } : null,
        deliveredBy: null,
        notes: ''
      };
      
      // Create the order
      this.orderService.createOrder(order as Order)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: async (orderId) => {
            // Apply the reward if one was selected
            if (this.rewardId) {
              await this.applyReward();
            }
            
            // Apply the gift card if one was provided
            if (this.giftCardCode && this.giftCardAmount > 0) {
              await this.applyGiftCard(orderId);
            }
            
            // Clear the cart
            this.orderService.clearCart();
            
            // Dismiss loading indicator
            await loading.dismiss();
            
            // Navigate to confirmation page
            this.router.navigate(['/order/confirmation', orderId]);
          },
          error: async (error) => {
            console.error('Error creating order:', error);
            
            // Dismiss loading indicator
            await loading.dismiss();
            
            // Show error alert
            const alert = await this.alertController.create({
              header: 'Order Failed',
              message: 'There was an error processing your order. Please try again.',
              buttons: ['OK']
            });
            await alert.present();
          }
        });
    } catch (error) {
      // Dismiss loading indicator
      await loading.dismiss();
      
      // Show error alert
      const alert = await this.alertController.create({
        header: 'Order Failed',
        message: 'There was an error processing your order. Please try again.',
        buttons: ['OK']
      });
      await alert.present();
    }
  }
  
  // Fix for using nullable string in redeemReward
  private async applyReward(): Promise<void> {
    if (!this.rewardId) return;
    
    return new Promise<void>((resolve, reject) => {
      // Type safety fix: We already checked that rewardId is not null above
      const rewardId = this.rewardId as string;
      
      this.loyaltyService.redeemReward(rewardId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => resolve(),
          error: (error) => {
            console.error('Error redeeming reward:', error);
            resolve(); // Still resolve to continue with order
          }
        });
    });
  }
  
  // Fix for using nullable string in applyGiftCardToOrder
  private async applyGiftCard(orderId: string): Promise<void> {
    if (!this.giftCardCode || this.giftCardAmount <= 0) return;
    
    return new Promise<void>((resolve, reject) => {
      // The amount to apply from the gift card (up to the order total)
      const appliedAmount = Math.min(this.giftCardAmount, this.total);
      
      // Type safety fix: We already checked that giftCardCode is not null above
      const giftCardCode = this.giftCardCode as string;
      
      this.giftCardService.applyGiftCardToOrder(giftCardCode, orderId, appliedAmount)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => resolve(),
          error: (error) => {
            console.error('Error applying gift card:', error);
            resolve(); // Still resolve to continue with order
          }
        });
    });
  }
  
 
  
 
  
  /**
   * Cancels checkout and returns to cart
   */
  cancelCheckout() {
    this.router.navigate(['/order/cart']);
  }
}