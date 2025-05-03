// src/app/features/menu/menu.page.ts - Updated logic

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { Subject, takeUntil, of } from 'rxjs';

import { ProductService } from 'src/app/core/services/product.service';
import { OrderService } from 'src/app/core/services/order.service';
import { Product } from 'src/app/core/models/product.model';
import { ToastController, IonIcon, IonFab, IonFabButton, IonButton, IonCardContent, IonCardSubtitle, IonCardTitle, IonCardHeader, IonCard, IonSpinner, IonContent, IonBadge, IonButtons, IonBackButton, IonToolbar, IonHeader, IonTitle } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  cafeOutline, 
  leafOutline, 
  fastFoodOutline, 
  iceCreamOutline, 
  cartOutline,
  optionsOutline,
  addOutline,
  timeOutline,
  restaurantOutline,
  alertCircleOutline,
  flameOutline,
  barbellOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.page.html',
  styleUrls: ['./menu.page.scss'],
  standalone: true,
  imports: [IonTitle, IonHeader, IonToolbar, IonBackButton, IonButtons, IonBadge, IonContent, IonSpinner, IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent, IonButton, IonFabButton, IonFab, IonIcon, CommonModule, RouterModule]
})
export class MenuPage implements OnInit, OnDestroy {
  categories = [
    { id: 'coffee', name: 'Coffee', icon: 'cafe-outline' },
    { id: 'tea', name: 'Tea', icon: 'leaf-outline' },
    { id: 'food', name: 'Food', icon: 'fast-food-outline' },
    { id: 'dessert', name: 'Desserts', icon: 'ice-cream-outline' }
  ];
  
  selectedCategory = 'coffee';
  products: Product[] = [];
  featuredProducts: Product[] = [];
  isLoading = true;
  
  // Table ordering parameters
  isTableOrder = false;
  storeId: string | null = null;
  tableNumber: number | null = null;
  
  private destroy$ = new Subject<void>();
  
  constructor(
    private productService: ProductService,
    public orderService: OrderService,
    private router: Router,
    private route: ActivatedRoute,
    private toastController: ToastController
  ) {
    addIcons({
      cafeOutline, 
      leafOutline, 
      fastFoodOutline, 
      iceCreamOutline, 
      cartOutline,
      optionsOutline,
      addOutline,
      timeOutline,
      restaurantOutline,
      alertCircleOutline,
      flameOutline,
      barbellOutline
    });
  }
  
  ngOnInit() {
    // Check for table order parameters
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        this.isTableOrder = params['tableOrder'] === 'true';
        this.storeId = params['storeId'] || null;
        this.tableNumber = params['tableNumber'] ? parseInt(params['tableNumber'], 10) : null;
      });
    
    // Load initial products for the default category
    this.loadProducts();
    
    // Load featured products
    this.loadFeaturedProducts();
  }
  
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  loadProducts(category: string = this.selectedCategory) {
    this.isLoading = true;
    this.selectedCategory = category;
    
    // Using the ProductService to get products by category
    this.productService.getProductsByCategory(category)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (products:any) => {
          this.products = products;
          this.isLoading = false;
        },
        error: (err:any) => {
          console.error('Failed to load products:', err);
          this.isLoading = false;
          this.products = []; // Make sure products is empty on error
        }
      });
  }
  
  loadFeaturedProducts() {
    this.productService.getFeaturedProducts()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (products:any) => {
          this.featuredProducts = products;
        },
        error: (err:any) => {
          console.error('Failed to load featured products:', err);
          this.featuredProducts = []; // Make sure featuredProducts is empty on error
        }
      });
  }
  
  onCategorySelect(category: string) {
    this.loadProducts(category);
  }
  
  onAddToCart(product: Product) {
    // Navigate to order customization
    this.router.navigate(['/order/custom', product.id], {
      queryParams: {
        tableOrder: this.isTableOrder ? 'true' : 'false',
        storeId: this.storeId,
        tableNumber: this.tableNumber
      }
    });
  }
  
  onCustomize(product: Product) {
    // Navigate to order customization (same as onAddToCart in this implementation)
    this.router.navigate(['/order/custom', product.id], {
      queryParams: {
        tableOrder: this.isTableOrder ? 'true' : 'false',
        storeId: this.storeId,
        tableNumber: this.tableNumber
      }
    });
  }
  
  getCategoryIcon(categoryId: string): string {
    const category = this.categories.find(c => c.id === categoryId);
    return category ? category.icon : 'cafe-outline';
  }
  
  async presentToast(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      position: 'bottom'
    });
    
    await toast.present();
  }
  
  // Add SCSS to the component
  ngAfterViewInit() {
    // Add custom styles for the menu page
    const style = document.createElement('style');
    style.textContent = `
      /* Menu Page Styles */
      .category-nav {
        display: flex;
        overflow-x: auto;
        background-color: var(--ion-background-color);
        border-bottom: 1px solid var(--ion-color-light);
        height: 70px;
        position: sticky;
        top: 0;
        z-index: 999;
        scrollbar-width: none;
      }
      
      .category-nav::-webkit-scrollbar {
        display: none;
      }
      
      .category-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-width: 80px;
        height: 100%;
        padding: 0 16px;
        transition: all 0.2s ease;
        cursor: pointer;
      }
      
      .category-item ion-icon {
        font-size: 24px;
        margin-bottom: 4px;
        color: var(--ion-color-medium);
      }
      
      .category-item span {
        font-size: 12px;
        color: var(--ion-color-medium);
      }
      
      .category-item.active {
        position: relative;
      }
      
      .category-item.active ion-icon,
      .category-item.active span {
        color: var(--ion-color-primary);
        font-weight: 500;
      }
      
      .category-item.active::after {
        content: '';
        position: absolute;
        bottom: -1px;
        left: 25%;
        width: 50%;
        height: 3px;
        border-radius: 3px 3px 0 0;
        background-color: var(--ion-color-primary);
      }
      
      /* Additional styles */
      .section-header {
        display: flex;
        flex-direction: column;
        padding: 16px 16px 8px;
      }
      
      .section-title {
        font-size: 20px;
        font-weight: 700;
        margin: 0;
        color: var(--ion-color-dark);
      }
      
      .section-line {
        width: 40px;
        height: 3px;
        background-color: var(--ion-color-primary);
        margin-top: 8px;
        border-radius: 3px;
      }
      
      .product-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 16px;
        padding: 0 16px 24px;
      }
      
      .product-card {
        margin: 0;
        border-radius: 16px;
        overflow: hidden;
        transition: transform 0.3s ease, box-shadow 0.3s ease;
      }
      
      .product-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
      }
      
      .product-image-container {
        position: relative;
        height: 160px;
        overflow: hidden;
      }
      
      .product-image {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 0.5s ease;
      }
      
      .product-image:hover {
        transform: scale(1.05);
      }
      
      .product-badge {
        position: absolute;
        top: 12px;
        right: 12px;
        background-color: var(--ion-color-primary);
        color: white;
        padding: 4px 10px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 500;
        z-index: 1;
      }
      
      .product-badge.featured {
        background-color: var(--ion-color-primary);
      }
      
      .product-badge.out-of-stock {
        background-color: var(--ion-color-danger);
      }
      
      .preparation-time {
        position: absolute;
        bottom: 12px;
        left: 12px;
        background-color: rgba(0, 0, 0, 0.7);
        color: white;
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 12px;
        display: flex;
        align-items: center;
        z-index: 1;
      }
      
      .preparation-time ion-icon {
        margin-right: 4px;
        font-size: 14px;
      }
      
      .card-header-content {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
      }
      
      .allergens {
        position: relative;
        display: inline-block;
      }
      
      .allergen-icon {
        color: var(--ion-color-warning);
        font-size: 18px;
      }
      
      .allergen-tooltip {
        position: absolute;
        top: -40px;
        right: 0;
        background-color: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 6px 10px;
        border-radius: 6px;
        font-size: 12px;
        white-space: nowrap;
        opacity: 0;
        visibility: hidden;
        transition: opacity 0.3s ease;
        z-index: 100;
      }
      
      .allergens:hover .allergen-tooltip {
        opacity: 1;
        visibility: visible;
      }
      
      .nutrition-info {
        display: flex;
        gap: 12px;
        margin-bottom: 12px;
      }
      
      .nutrition-item {
        display: flex;
        align-items: center;
        font-size: 12px;
        color: var(--ion-color-medium);
      }
      
      .nutrition-item ion-icon {
        margin-right: 4px;
        font-size: 14px;
      }
      
      .customization-preview {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        margin-bottom: 12px;
        font-size: 12px;
      }
      
      .size-option {
        background-color: var(--ion-color-light);
        padding: 3px 8px;
        border-radius: 12px;
      }
      
      .product-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .product-price {
        font-weight: 700;
        color: var(--ion-color-primary);
        font-size: 16px;
      }
      
      .product-actions {
        display: flex;
        align-items: center;
      }
      
      .customize-btn {
        margin-right: 4px;
      }
      
      .add-btn {
        --padding-start: 10px;
        --padding-end: 10px;
        --border-radius: 50%;
        height: 36px;
        width: 36px;
      }
      
      .featured-section {
        padding: 16px 0;
        margin-bottom: 16px;
      }
      
      .featured-scroll {
        display: flex;
        overflow-x: auto;
        gap: 16px;
        padding: 0 16px 16px;
        scroll-snap-type: x mandatory;
        scrollbar-width: none;
      }
      
      .featured-scroll::-webkit-scrollbar {
        display: none;
      }
      
      .featured-item {
        min-width: 280px;
        width: 280px;
        background-color: var(--ion-card-background);
        border-radius: 16px;
        overflow: hidden;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        transition: transform 0.3s ease, box-shadow 0.3s ease;
        scroll-snap-align: start;
        cursor: pointer;
      }
      
      .featured-item:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 16px rgba(0, 0, 0, 0.12);
      }
      
      .featured-badge {
        position: absolute;
        top: 12px;
        right: 12px;
        background-color: var(--ion-color-primary);
        color: white;
        padding: 4px 10px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 500;
        z-index: 1;
      }
      
      .featured-content {
        padding: 16px;
      }
      
      .featured-content h3 {
        font-size: 18px;
        font-weight: 700;
        margin: 0 0 8px;
        color: var(--ion-color-dark);
      }
      
      .featured-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 16px;
      }
      
      .loading-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 48px 0;
      }
      
      .loader-animation {
        margin-bottom: 16px;
      }
      
      .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 48px 0;
        text-align: center;
      }
      
      .empty-state ion-icon {
        font-size: 48px;
        color: var(--ion-color-medium);
        margin-bottom: 16px;
      }
      
      .empty-state p {
        color: var(--ion-color-medium);
        margin-bottom: 24px;
        max-width: 280px;
      }
      
      .cart-fab {
        position: relative;
      }
      
      .fab-badge {
        position: absolute;
        top: 0;
        right: 0;
        background-color: var(--ion-color-danger);
        color: white;
        border-radius: 50%;
        width: 20px;
        height: 20px;
        font-size: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .table-order-banner {
        background-color: var(--ion-color-warning);
        color: var(--ion-color-warning-contrast);
        padding: 8px 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 500;
      }
      
      .table-order-banner ion-icon {
        margin-right: 8px;
      }
      
      /* Animation for featured badge */
      .pulse-animation {
        animation: pulse 2s infinite;
      }
      
      @keyframes pulse {
        0% {
          transform: scale(1);
        }
        50% {
          transform: scale(1.05);
        }
        100% {
          transform: scale(1);
        }
      }
      
      /* Dark mode adjustments */
      // @media (prefers-color-scheme: dark) {
      //   .category-nav {
      //     border-bottom-color: rgba(255, 255, 255, 0.1);
      //   }
        
      //   .size-option {
      //     background-color: rgba(255, 255, 255, 0.1);
      //   }
      // }
    `;
    document.head.appendChild(style);
  }
}