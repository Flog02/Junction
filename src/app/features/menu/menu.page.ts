import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { ProductService } from '../../core/services/product.service';
import { OrderService } from '../../core/services/order.service';
import { Product } from '../../core/models/product.model';
import { ToastController, IonIcon, IonFab, IonButton, IonCardContent, IonCardSubtitle, IonCardTitle, IonCardHeader, IonCard, IonSpinner, IonContent, IonBadge, IonButtons, IonBackButton, IonToolbar, IonHeader, IonTitle } from '@ionic/angular/standalone';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.page.html',
  styleUrls: ['./menu.page.scss'],
  standalone: true,
  imports: [IonTitle, IonHeader, IonToolbar, IonBackButton, IonButtons, IonBadge, IonContent, IonSpinner, IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent, IonButton, IonFab, IonIcon, CommonModule, RouterModule]
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
    public orderService: OrderService, // Changed to public for template access
    private router: Router,
    private route: ActivatedRoute,
    private toastController: ToastController
  ) {}
  
  
  ngOnInit() {
    // Check for table order parameters
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        this.isTableOrder = params['tableOrder'] === 'true';
        this.storeId = params['storeId'] || null;
        this.tableNumber = params['tableNumber'] ? parseInt(params['tableNumber'], 10) : null;
      });
    
    this.loadProducts();
    this.loadFeaturedProducts();
  }
  
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  loadProducts(category: string = this.selectedCategory) {
    this.isLoading = true;
    this.selectedCategory = category;
    
    this.productService.getProductsByCategory(category)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (products) => {
          this.products = products;
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Failed to load products:', err);
          this.isLoading = false;
        }
      });
  }
  
  loadFeaturedProducts() {
    this.productService.getFeaturedProducts()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (products) => {
          this.featuredProducts = products;
        },
        error: (err) => {
          console.error('Failed to load featured products:', err);
        }
      });
  }
  
  onCategorySelect(category: string) {
    this.loadProducts(category);
  }
  
  async onAddToCart(product: Product) {
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
    // Navigate to order customization
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
  
}