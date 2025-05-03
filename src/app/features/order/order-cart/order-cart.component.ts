import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonContent, 
  IonButtons, 
  IonBackButton,
  IonButton,
  IonIcon,
  IonInput,
  IonSelect,
  IonSelectOption,
  AlertController
} from '@ionic/angular/standalone';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { addIcons } from 'ionicons';
import { 
  trashOutline, 
  cafeOutline, 
  addOutline, 
  removeOutline, 
  cardOutline,
  createOutline,
  starOutline,
  chatbubbleOutline,
  timeOutline,
  restaurantOutline,
  walkOutline,
  cartOutline 
} from 'ionicons/icons';

import { OrderService } from '../../../core/services/order.service';
import { OrderItem } from '../../../core/models/order.model';
import { LoyaltyService } from '../../../core/services/loyalty.service';
import { GiftCardService } from '../../../core/services/gift-card.service';
import { LoyaltyReward } from '../../../core/models/loyalty.model';

// Updated interface to match LoyaltyReward
interface Reward {
  id: string;
  name: string;
  description: string;
  pointsCost: number; // Changed from discount to pointsCost
  status: string;
  expiryDate: Date | null;
  redeemedDate: Date | null;
}

interface ServiceOption {
  label: string;
  value: string;
  icon: string;
}

interface TimeOption {
  label: string;
  value: string;
}

@Component({
  selector: 'app-order-cart',
  templateUrl: './order-cart.component.html',
  styleUrls: ['./order-cart.component.scss'],
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
    IonInput,
    IonSelect,
    IonSelectOption
  ]
})
export class OrderCartComponent implements OnInit, OnDestroy {
  cartItems: OrderItem[] = [];
  cartSubtotal: number = 0;
  cartTax: number = 0;
  cartTotal: number = 0;
  
  // Service options
  serviceOptions: ServiceOption[] = [
    { label: 'Pickup', value: 'pickup', icon: 'walkOutline' },
    { label: 'Dine In', value: 'dine-in', icon: 'restaurantOutline' }
  ];
  
  selectedServiceType: string = 'pickup';
  
  // Pickup time options
  pickupTimes: TimeOption[] = [
    { label: 'As soon as possible', value: 'asap' },
    { label: 'In 15 minutes', value: '15min' },
    { label: 'In 30 minutes', value: '30min' },
    { label: 'In 1 hour', value: '60min' }
  ];
  
  selectedPickupTime: string = 'asap';
  tableNumber: number | null = null;
  
  // Rewards
  availableRewards: Reward[] = [];
  selectedReward: string | null = null;
  rewardDiscount: number = 0;
  
  // Gift Card
  giftCardCode: string = '';
  giftCardAmount: number = 0;
  giftCardApplied: boolean = false;
  
  // Animation flag
  animateItems: boolean = false;
  
  // Time calculation
  estimatedReadyTime: number = 10;
  
  // Math reference for template
  Math = Math;
  
  private destroy$ = new Subject<void>();
  
  constructor(
    private orderService: OrderService,
    private loyaltyService: LoyaltyService,
    private giftCardService: GiftCardService,
    private router: Router,
    private alertController: AlertController
  ) {
    addIcons({
      trashOutline, 
      cartOutline, 
      cafeOutline, 
      chatbubbleOutline, 
      addOutline, 
      removeOutline, 
      createOutline, 
      starOutline, 
      timeOutline, 
      cardOutline, 
      restaurantOutline, 
      walkOutline
    });
  }
  
  ngOnInit() {
    // Load cart items using the observable pattern
    this.orderService.cartItems$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(items => {
      this.cartItems = items;
      this.calculateCart();
    });
    
    // Load available rewards
    this.loadAvailableRewards();
    
    // Trigger animations after a short delay
    setTimeout(() => {
      this.animateItems = true;
    }, 100);
  }
  
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  /**
   * Load available rewards from loyalty service
   */
  loadAvailableRewards() {
    this.loyaltyService.getAvailableRewards()
      .pipe(takeUntil(this.destroy$))
      .subscribe(rewards => {
        // Convert LoyaltyReward[] to Reward[]
        this.availableRewards = rewards.map(reward => ({
          id: reward.id,
          name: reward.name,
          description: reward.description,
          pointsCost: reward.pointsCost,
          status: reward.status,
          expiryDate: reward.expiryDate,
          redeemedDate: reward.redeemedDate
        }));
      });
  }
  
  /**
 * Calculate cart totals
 */
calculateCart() {
    // Calculate subtotal
    this.cartSubtotal = this.cartItems.reduce((sum, item) => sum + item.itemTotal, 0);
    
    // Calculate tax (7.25%)
    this.cartTax = this.cartSubtotal * 0.0725;
    
    // Calculate total
    this.cartTotal = this.cartSubtotal + this.cartTax;
    
    // Adjust for reward discount if any
    if (this.rewardDiscount > 0) {
      this.cartTotal -= this.rewardDiscount;
      // Ensure total doesn't go below zero
      if (this.cartTotal < 0) this.cartTotal = 0;
    }
    
    // Apply gift card amount if any
    if (this.giftCardApplied && this.giftCardAmount > 0) {
      this.cartTotal -= this.giftCardAmount;
      // Ensure total doesn't go below zero
      if (this.cartTotal < 0) this.cartTotal = 0;
    }
    
    // Calculate estimated ready time based on items
    // Default to 10 minutes if no preparation times are available
    if (this.cartItems.length > 0) {
      // Use a default preparation time of 5 minutes for items without a specified time
      const prepTimes = this.cartItems.map(item => 
        (item.preparationTime || 5) * item.quantity
      );
      this.estimatedReadyTime = Math.max(10, ...prepTimes);
    } else {
      this.estimatedReadyTime = 10;
    }
  }
  
  /**
   * Get image for a cart item
   */
  getItemImage(item: OrderItem): string {
    // In a real app, you'd get this from a product service
    return `/assets/products/${item.productId}.jpg`;
  }
  
  /**
   * Increment item quantity
   */
  incrementQuantity(index: number) {
    if (index >= 0 && index < this.cartItems.length) {
      this.cartItems[index].quantity++;
      this.cartItems[index].itemTotal = this.orderService.calculateItemTotal(this.cartItems[index]);
      this.saveCartAndRecalculate();
    }
  }
  
  /**
   * Decrement item quantity
   */
  decrementQuantity(index: number) {
    if (index >= 0 && index < this.cartItems.length) {
      if (this.cartItems[index].quantity > 1) {
        this.cartItems[index].quantity--;
        this.cartItems[index].itemTotal = this.orderService.calculateItemTotal(this.cartItems[index]);
        this.saveCartAndRecalculate();
      } else {
        this.removeItem(index);
      }
    }
  }
  
  /**
   * Remove item from cart
   */
  async removeItem(index: number) {
    const alert = await this.alertController.create({
      header: 'Remove Item',
      message: 'Are you sure you want to remove this item?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Remove',
          role: 'destructive',
          handler: () => {
            if (index >= 0 && index < this.cartItems.length) {
              this.cartItems.splice(index, 1);
              this.saveCartAndRecalculate();
            }
          }
        }
      ]
    });
    
    await alert.present();
  }
  
  /**
   * Save cart items and recalculate totals
   */
  saveCartAndRecalculate() {
    // Save updated cart items
    this.orderService.setCartItems(this.cartItems);
    
    // Recalculate cart totals
    this.calculateCart();
  }
  
  /**
   * Apply reward to order
   */
  applyReward() {
    if (!this.selectedReward) return;
    
    const reward = this.availableRewards.find(r => r.id === this.selectedReward);
    if (reward) {
      // You can customize how the reward discount is calculated
      // For now, let's give a fixed discount based on points cost
      this.rewardDiscount = reward.pointsCost / 10; // $1 discount per 10 points
      this.calculateCart();
    }
  }
  
  /**
   * Apply gift card to order
   */
  applyGiftCard() {
    if (!this.giftCardCode) return;
    
    // In a real app, you would validate the gift card code with the GiftCardService
    // For demo purposes, let's simulate a gift card with $10
    this.giftCardAmount = 10.00;
    this.giftCardApplied = true;
    this.calculateCart();
  }
  
  /**
   * Proceed to checkout
   */
  proceedToCheckout() {
    // You can add validation here to ensure cart is not empty
    if (this.cartItems.length === 0) {
      this.showEmptyCartAlert();
      return;
    }
    
    // Navigate to checkout page
    this.router.navigate(['/order/checkout'], {
      queryParams: {
        serviceType: this.selectedServiceType,
        pickupTime: this.selectedPickupTime,
        tableNumber: this.tableNumber,
        reward: this.selectedReward,
        giftCard: this.giftCardApplied ? this.giftCardCode : null
      }
    });
  }
  
  /**
   * Show empty cart alert
   */
  async showEmptyCartAlert() {
    const alert = await this.alertController.create({
      header: 'Empty Cart',
      message: 'Your cart is empty. Please add items to your cart before proceeding to checkout.',
      buttons: ['OK']
    });
    
    await alert.present();
  }
  
  /**
   * Continue shopping (go back to menu)
   */
  continueShopping() {
    this.router.navigate(['/menu']);
  }
  
  /**
   * Get formatted price
   */
  getFormattedPrice(price: number): string {
    return price.toFixed(2);
  }
}