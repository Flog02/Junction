// src/app/features/table-service/table-order/table-order.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { 
  IonContent, 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonButton, 
  IonIcon, 
  IonCard, 
  IonCardHeader, 
  IonCardTitle, 
  IonCardContent,
  IonList,
  IonItem,
  IonLabel,
  IonBackButton,
  IonButtons,
  IonSpinner,
  AlertController,
  ToastController,
  LoadingController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  cafeOutline, 
  restaurantOutline,
  timeOutline,
  cartOutline,
  addCircleOutline,
  removeCircleOutline,
  checkmarkCircleOutline,
  peopleOutline,
  cashOutline
} from 'ionicons/icons';

import { TableService, TableInfo } from '../../../core/services/table.service';
import { TableOrderService } from '../../../core/services/table-order.service';
import { ProductService } from '../../../core/services/product.service';
import { AuthService } from '../../../core/services/auth.service';
import { Product } from '../../../core/models/product.model';
import { OrderItem, Order } from '../../../core/models/order.model';

@Component({
  selector: 'app-table-order',
  templateUrl: './table-order.component.html',
  styleUrls: ['./table-order.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButton,
    IonIcon,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonList,
    IonItem,
    IonLabel,
    IonBackButton,
    IonButtons,
    IonSpinner
]
})
export class TableOrderComponent implements OnInit {
  tableInfo: TableInfo | null = null;
  featuredProducts: Product[] = [];
  cartItems: OrderItem[] = [];
  isLoading = true;
  isPlacingOrder = false;
  
  constructor(
    private router: Router,
    private formBuilder: FormBuilder,
    private tableService: TableService,
    private tableOrderService: TableOrderService,
    private productService: ProductService,
    private authService: AuthService,
    private alertController: AlertController,
    private toastController: ToastController,
    private loadingController: LoadingController
  ) {
    addIcons({ 
      cafeOutline, 
      restaurantOutline,
      timeOutline,
      cartOutline,
      addCircleOutline,
      removeCircleOutline,
      checkmarkCircleOutline,
      peopleOutline,
      cashOutline
    });
    
    // Get table info from router state
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras.state) {
      this.tableInfo = navigation.extras.state['tableInfo'];
    }
  }
  /**
 * Increases the quantity of an item in the cart
 */
addItemQuantity(index: number): void {
  if (index >= 0 && index < this.cartItems.length) {
    // Increment quantity
    this.cartItems[index].quantity += 1;
    
    // Recalculate total
    this.cartItems[index].itemTotal = 
      this.cartItems[index].quantity * this.cartItems[index].basePrice;
      
    this.showToast(`Added another ${this.cartItems[index].name}`);
  }
}

  ngOnInit() {
    if (!this.tableInfo) {
      // If no table info is available, redirect back to table service page
      this.showError('No table information available. Please scan a table QR code.');
      this.router.navigate(['/table-service']);
      return;
    }
    
    // Check if the store is open
    this.tableService.isStoreOpen(this.tableInfo.storeId).subscribe({
      next: isOpen => {
        if (!isOpen) {
          this.showError('This café location is currently closed. Please try again during business hours.');
          this.router.navigate(['/table-service']);
          return;
        }
        
        // Load featured products
        this.loadFeaturedProducts();
      },
      error: error => {
        this.showError('Error checking store status: ' + error.message);
        this.router.navigate(['/table-service']);
      }
    });
  }
  
  loadFeaturedProducts() {
    this.isLoading = true;
    this.productService.getFeaturedProducts().subscribe({
      next: products => {
        this.featuredProducts = products;
        this.isLoading = false;
      },
      error: error => {
        this.showError('Error loading products: ' + error.message);
        this.isLoading = false;
      }
    });
  }
  
  addToCart(product: Product) {
    // Check if product is already in cart
    const existingItemIndex = this.cartItems.findIndex(item => item.productId === product.id);
    
    if (existingItemIndex !== -1) {
      // Increment quantity
      this.cartItems[existingItemIndex].quantity += 1;
      // Recalculate total
      this.cartItems[existingItemIndex].itemTotal = 
        this.cartItems[existingItemIndex].quantity * product.price;
    } else {
      // Add new item to cart
      const newItem: OrderItem = {
        productId: product.id,
        name: product.name,
        quantity: 1,
        basePrice: product.price,
        customizations: {
          size: product.customizationOptions.sizes[0], // Default to first size
          milk: product.customizationOptions.milk[0], // Default to first milk option
          shots: [],
          syrups: [],
          toppings: []
        },
        sugarLevel: 3, // Default sugar level (0-5)
        caffeineLevel: 3, // Default caffeine level (0-5)
        specialInstructions: '',
        itemTotal: product.price,
        nutritionInfo: product.nutritionInfo
      };
      
      this.cartItems.push(newItem);
    }
    
    this.showToast(`${product.name} added to cart`);
  }
  
  removeFromCart(index: number) {
    if (this.cartItems[index].quantity > 1) {
      // Decrement quantity
      this.cartItems[index].quantity -= 1;
      // Recalculate total
      this.cartItems[index].itemTotal = 
        this.cartItems[index].quantity * this.cartItems[index].basePrice;
    } else {
      // Remove item completely
      this.cartItems.splice(index, 1);
    }
  }
  
  getCartTotal(): number {
    return this.cartItems.reduce((total, item) => total + item.itemTotal, 0);
  }
  
  getCartItemCount(): number {
    return this.cartItems.reduce((count, item) => count + item.quantity, 0);
  }
  
  async placeOrder() {
    if (this.cartItems.length === 0) {
      this.showToast('Your cart is empty');
      return;
    }
    
    // Confirm order
    const alert = await this.alertController.create({
      header: 'Confirm Order',
      message: `Place order for table ${this.tableInfo?.tableNumber}?`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Place Order',
          handler: () => {
            this.submitOrder();
          }
        }
      ]
    });
    
    await alert.present();
  }
  
  async submitOrder() {
    this.isPlacingOrder = true;
    
    const loading = await this.loadingController.create({
      message: 'Placing your order...'
    });
    await loading.present();
    
    // Get current user
    const user = await this.authService.getCurrentUser();
    
    if (!user) {
      loading.dismiss();
      this.showError('You must be logged in to place an order');
      this.router.navigate(['/auth/login']);
      return;
    }
    
    if (!this.tableInfo) {
      loading.dismiss();
      this.showError('Table information is missing');
      return;
    }
    
    // Create order object
    const order: Order = {
      userId: user.uid,
      storeId: this.tableInfo.storeId,
      tableNumber: this.tableInfo.tableNumber,
      orderTime: new Date(),
      processTime: null,
      completionTime: null,
      status: 'pending',
      paymentStatus: 'pending',
      paymentMethod: 'app', // Default payment method
      total: 0, // Will be calculated in the service
      subtotal: this.getCartTotal(),
      tax: 0, // Will be calculated in the service
      tip: 0,
      items: this.cartItems,
      loyaltyPointsEarned: 0, // Will be calculated in the service
      giftCardApplied: null,
      deliveredBy: null,
      notes: ''
    };
    
    // Submit the order
    this.tableOrderService.createTableOrder(
      this.tableInfo.storeId,
      this.tableInfo.tableNumber,
      order
    ).subscribe({
      next: orderId => {
        loading.dismiss();
        this.isPlacingOrder = false;
        this.showOrderSuccess(orderId);
      },
      error: error => {
        loading.dismiss();
        this.isPlacingOrder = false;
        this.showError('Failed to place order: ' + error.message);
      }
    });
  }
  
  async showOrderSuccess(orderId: string) {
    const alert = await this.alertController.create({
      header: 'Order Placed!',
      message: `Your order has been placed successfully. Order #${orderId.substring(0, 6).toUpperCase()}`,
      buttons: [
        {
          text: 'OK',
          handler: () => {
            // Clear cart
            this.cartItems = [];
            // Redirect to home
            this.router.navigate(['/home']);
          }
        }
      ]
    });
    
    await alert.present();
  }
  
  async showError(message: string) {
    const alert = await this.alertController.create({
      header: 'Error',
      message,
      buttons: ['OK']
    });
    
    await alert.present();
  }
  
  async showToast(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      position: 'bottom'
    });
    
    await toast.present();
  }
}