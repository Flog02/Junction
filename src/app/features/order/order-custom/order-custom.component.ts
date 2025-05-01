// Now let's create the Custom Order component
// src/app/features/order/order-custom/order-custom.component.ts

import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { takeUntil, Subject, switchMap, Observable, of, map, combineLatest, take } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import {IonSpinner,IonCard,IonCardContent,IonCardHeader,IonCardTitle,IonTextarea,IonToolbar,IonHeader,IonButtons,IonBackButton,IonTitle,IonContent,IonLabel,IonItem,IonInput,IonButton,IonSelect,IonSelectOption} from '@ionic/angular/standalone'
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatSliderModule } from '@angular/material/slider';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCardModule } from '@angular/material/card';

import { Order, OrderItem } from '../../../core/models/order.model';
import { Product, ProductCustomizationOption } from '../../../core/models/product.model';
import { OrderService } from '../../../core/services/order.service';
import { ProductService } from '../../../core/services/product.service';
import { AuthService } from '../../../core/services/auth.service';
import { LoadingController, ToastController } from '@ionic/angular/standalone';
interface SelectableCustomizationOption extends ProductCustomizationOption {
    selected?: boolean;
  }

@Component({
  selector: 'app-order-custom',
  template: `<ion-header>
  <ion-toolbar>
    <ion-buttons slot="start">
      <ion-back-button defaultHref="/menu"></ion-back-button>
    </ion-buttons>
    <ion-title>Customize Your Order</ion-title>
  </ion-toolbar>
</ion-header>

<ion-content class="ion-padding">
  <ng-container *ngIf="currentProduct$ | async as product; else loading">
    <div class="product-header">
      <img [src]="product.imageURL" [alt]="product.name" class="product-image">
      <div class="product-info">
        <h1>{{product.name}}</h1>
        <p class="description">{{product.description}}</p>
        <div class="price">{{product.price | currency}}</div>
      </div>
    </div>

    <form [formGroup]="orderForm" (ngSubmit)="addToCart()">
      <ion-card>
        <ion-card-header>
          <ion-card-title>Customize Your Order</ion-card-title>
        </ion-card-header>
        
        <ion-card-content>
          <!-- Quantity -->
          <ion-item>
            <ion-label position="stacked">Quantity</ion-label>
            <ion-input type="number" formControlName="quantity" min="1"></ion-input>
          </ion-item>
          
          <!-- Size Selection -->
          <ion-item>
            <ion-label position="stacked">Size</ion-label>
            <ion-select formControlName="size" interface="popover">
              <ion-select-option *ngFor="let size of availableSizes" [value]="size.id">
                {{size.name}} ({{size.priceModifier | currency}})
              </ion-select-option>
            </ion-select>
          </ion-item>
          
          <!-- Milk Options -->
          <ion-item *ngIf="availableMilk.length > 0">
            <ion-label position="stacked">Milk</ion-label>
            <ion-select formControlName="milk" interface="popover">
              <ion-select-option *ngFor="let milk of availableMilk" [value]="milk.id">
                {{milk.name}} ({{milk.priceModifier | currency}})
              </ion-select-option>
            </ion-select>
          </ion-item>
          
          <!-- Sugar Level -->
          <ion-item>
            <ion-label position="stacked">Sugar Level: {{orderForm.get('sugarLevel')?.value}}</ion-label>
            <ion-range formControlName="sugarLevel" min="0" max="5" step="1" snaps="true">
              <ion-label slot="start">None</ion-label>
              <ion-label slot="end">Extra</ion-label>
            </ion-range>
          </ion-item>
          
          <!-- Caffeine Level -->
          <ion-item>
            <ion-label position="stacked">Caffeine Level: {{orderForm.get('caffeineLevel')?.value}}</ion-label>
            <ion-range formControlName="caffeineLevel" min="0" max="5" step="1" snaps="true">
              <ion-label slot="start">Decaf</ion-label>
              <ion-label slot="end">Extra</ion-label>
            </ion-range>
          </ion-item>
          
          <!-- Special Instructions -->
          <ion-item>
            <ion-label position="stacked">Special Instructions</ion-label>
            <ion-textarea formControlName="specialInstructions" rows="2" placeholder="Any special requests?"></ion-textarea>
          </ion-item>
        </ion-card-content>
      </ion-card>
      
      <!-- Nutrition Information -->
      <ion-card>
        <ion-card-header>
          <ion-card-title>Nutrition Information</ion-card-title>
        </ion-card-header>
        
        <ion-card-content>
          <div class="nutrition-grid">
            <div class="nutrition-item">
              <div class="nutrition-value">{{nutritionInfo.calories}}</div>
              <div class="nutrition-label">Calories</div>
            </div>
            <div class="nutrition-item">
              <div class="nutrition-value">{{nutritionInfo.sugar}}g</div>
              <div class="nutrition-label">Sugar</div>
            </div>
            <div class="nutrition-item">
              <div class="nutrition-value">{{nutritionInfo.caffeine}}mg</div>
              <div class="nutrition-label">Caffeine</div>
            </div>
            <div class="nutrition-item">
              <div class="nutrition-value">{{nutritionInfo.fat}}g</div>
              <div class="nutrition-label">Fat</div>
            </div>
            <div class="nutrition-item">
              <div class="nutrition-value">{{nutritionInfo.protein}}g</div>
              <div class="nutrition-label">Protein</div>
            </div>
          </div>
        </ion-card-content>
      </ion-card>
      
      <!-- Order Summary -->
      <ion-card>
        <ion-card-header>
          <ion-card-title>Order Summary</ion-card-title>
        </ion-card-header>
        
        <ion-card-content>
          <div class="summary-item">
            <span>{{product.name}} x {{orderForm.get('quantity')?.value}}</span>
            <span>{{itemTotal | currency}}</span>
          </div>
          
          <div class="total">
            <strong>Total:</strong>
            <strong>{{itemTotal | currency}}</strong>
          </div>
          
          <ion-button expand="block" type="submit" [disabled]="orderForm.invalid">
            Add to Cart
          </ion-button>
        </ion-card-content>
      </ion-card>
    </form>
  </ng-container>
  
  <ng-template #loading>
    <div class="loading-container">
      <ion-spinner></ion-spinner>
      <p>Loading product...</p>
    </div>
  </ng-template>
</ion-content>`,
  styles : `.product-header {
    display: flex;
    margin-bottom: 20px;
  }
  
  .product-image {
    width: 100px;
    height: 100px;
    object-fit: cover;
    border-radius: 10px;
    margin-right: 15px;
  }
  
  .product-info h1 {
    margin: 0 0 5px 0;
    font-size: 24px;
    font-weight: bold;
  }
  
  .description {
    margin: 0 0 10px 0;
    color: var(--ion-color-medium);
  }
  
  .price {
    font-size: 18px;
    font-weight: bold;
    color: var(--ion-color-primary);
  }
  
  .nutrition-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
  }
  
  .nutrition-item {
    text-align: center;
    padding: 10px;
    border-radius: 8px;
    background-color: var(--ion-color-light);
  }
  
  .nutrition-value {
    font-weight: bold;
    font-size: 18px;
  }
  
  .nutrition-label {
    font-size: 12px;
    color: var(--ion-color-medium);
  }
  
  .summary-item {
    display: flex;
    justify-content: space-between;
    margin-bottom: 10px;
  }
  
  .total {
    display: flex;
    justify-content: space-between;
    padding-top: 10px;
    margin-top: 10px;
    border-top: 1px solid var(--ion-color-light);
    margin-bottom: 20px;
  }
  
  .loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 300px;
  }`,
  standalone: true,
  imports: [
    IonCard, IonCardContent, IonCardHeader, IonCardTitle,
    CommonModule,
    IonTextarea, IonToolbar, IonSpinner, IonHeader, IonButtons, IonBackButton, IonTitle, IonContent, IonLabel, IonItem, IonInput, IonButton, IonSelect, IonSelectOption,
    ReactiveFormsModule,
    MatSliderModule,
    MatSelectModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatCardModule
]
})
export class OrderCustomComponent implements OnInit, OnDestroy {
  orderForm: FormGroup;
  currentProduct$: Observable<Product | null>;
  productId: string | null = null;
  
  // These will store the options for the current product
  availableSizes: ProductCustomizationOption[] = [];
  availableMilk: ProductCustomizationOption[] = [];
  availableShots: SelectableCustomizationOption[] = [];
availableSyrups: SelectableCustomizationOption[] = [];
availableToppings: SelectableCustomizationOption[] = [];
  nutritionInfo: any = {
    calories: 0,
    sugar: 0,
    caffeine: 0,
    fat: 0,
    protein: 0
  };
  
  itemTotal = 0;
  
  private destroy$ = new Subject<void>();
  
  constructor(
    private formBuilder: FormBuilder,
    private orderService: OrderService,
    private productService: ProductService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private loadingController: LoadingController,
    private toastController: ToastController
  ) {
    this.orderForm = this.createOrderForm();
    
    // Initialize the current product observable
    this.currentProduct$ = this.route.paramMap.pipe(
      map(params => {
        this.productId = params.get('id');
        return this.productId;
      }),
      switchMap(id => {
        return id ? this.productService.getProduct(id) : of(null);
      })
    );
  }
  
  ngOnInit(): void {
    // Subscribe to product changes to update available customization options
    this.currentProduct$
      .pipe(takeUntil(this.destroy$))
      .subscribe(product => {
        if (product) {
          this.updateAvailableOptions(product);
          this.setDefaultValues(product);
          this.updateNutritionAndPrice();
        }
      });
    
    // Subscribe to form changes to update nutrition and price
    this.orderForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.updateNutritionAndPrice();
      });
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  /**
   * Creates the order form
   */
  createOrderForm(): FormGroup {
    return this.formBuilder.group({
      quantity: [1, [Validators.required, Validators.min(1)]],
      size: ['', Validators.required],
      milk: [''],
      shots: this.formBuilder.array([]),
      syrups: this.formBuilder.array([]),
      toppings: this.formBuilder.array([]),
      sugarLevel: [3, [Validators.required, Validators.min(0), Validators.max(5)]],
      caffeineLevel: [3, [Validators.required, Validators.min(0), Validators.max(5)]],
      specialInstructions: ['']
    });
  }
  
  /**
   * Updates the available customization options based on the current product
   */
  updateAvailableOptions(product: Product): void {
    this.availableSizes = product.customizationOptions.sizes || [];
    this.availableMilk = product.customizationOptions.milk || [];
    
    // Convert shots to selectable options
    this.availableShots = (product.customizationOptions.shots || [])
      .map(shot => ({...shot, selected: false}));
    
    // Convert syrups to selectable options
    this.availableSyrups = (product.customizationOptions.syrups || [])
      .map(syrup => ({...syrup, selected: false}));
    
    // Convert toppings to selectable options
    this.availableToppings = (product.customizationOptions.toppings || [])
      .map(topping => ({...topping, selected: false}));
  }
  
  /**
   * Set default values for the form based on the product
   */
  setDefaultValues(product: Product): void {
    if (this.availableSizes.length > 0) {
      this.orderForm.get('size')?.setValue(this.availableSizes[0].id);
    }
    
    if (this.availableMilk.length > 0) {
      this.orderForm.get('milk')?.setValue(this.availableMilk[0].id);
    }
  }
  
   /**
   * Updates the nutrition information and price based on current selections
   */
   updateNutritionAndPrice(): void {
    combineLatest([
      this.currentProduct$,
      of(this.orderForm.value)
    ]).pipe(
      takeUntil(this.destroy$)
    ).subscribe(([product, formValue]) => {
      if (!product) return;
      
      // Find the selected size
      const selectedSize = this.availableSizes.find(s => s.id === formValue.size);
      if (!selectedSize) return;
      
      // Find the selected milk
      const selectedMilk = this.availableMilk.find(m => m.id === formValue.milk);
      
      // Get selected shots (not implemented in this simplified version)
      const selectedShots: ProductCustomizationOption[] = [];
      
      // Get selected syrups (not implemented in this simplified version)
      const selectedSyrups: ProductCustomizationOption[] = [];
      
      // Calculate nutrition info - Handle the case when selectedMilk is undefined
      if (selectedMilk) {
        // If milk is selected, use it directly
        this.nutritionInfo = this.productService.calculateNutrition(
          product,
          selectedSize,
          selectedMilk,
          selectedShots,
          selectedSyrups,
          formValue.sugarLevel,
          formValue.caffeineLevel
        );
      } else if (this.availableMilk.length > 0) {
        // If no milk is selected but we have available milk options, use the first one
        this.nutritionInfo = this.productService.calculateNutrition(
          product,
          selectedSize,
          this.availableMilk[0],
          selectedShots,
          selectedSyrups,
          formValue.sugarLevel,
          formValue.caffeineLevel
        );
      } else {
        // If no milk options are available, we might need a different approach
        // This depends on how your ProductService.calculateNutrition is implemented
        // For now, we'll just use an empty object that matches the structure
        // You may need to adjust this based on your actual implementation
        console.warn('No milk options available for nutrition calculation');
        // Skip nutrition calculation if no valid milk option is available
      }
      
      // Create an order item to calculate price
      const orderItem: OrderItem = {
        productId: product.id,
        quantity: formValue.quantity,
        name: product.name,
        basePrice: product.price,
        customizations: {
          size: selectedSize,
          milk: selectedMilk ?? undefined, // Convert null to undefined
          shots: selectedShots,
          syrups: selectedSyrups,
          toppings: []
        },
        sugarLevel: formValue.sugarLevel,
        caffeineLevel: formValue.caffeineLevel,
        specialInstructions: formValue.specialInstructions,
        itemTotal: 0,
        nutritionInfo: this.nutritionInfo
      };
      
      // Calculate item total
      this.itemTotal = this.orderService.calculateItemTotal(orderItem);
    });
  }
  
  /**
   * Adds the customized item to the cart
   */
  async addToCart(): Promise<void> {
    if (this.orderForm.invalid || !this.productId) {
      return;
    }
    
    const loading = await this.loadingController.create({
      message: 'Adding to cart...'
    });
    await loading.present();
    
    try {
      const product = await this.currentProduct$.pipe(take(1)).toPromise();
      
      if (!product) {
        throw new Error('Product not found');
      }
      
      const formValue = this.orderForm.value;
      
      // Find selected options
      const selectedSize = this.availableSizes.find(s => s.id === formValue.size);
      const selectedMilk = this.availableMilk.find(m => m.id === formValue.milk);
      const selectedShots: ProductCustomizationOption[] = []; // Simplified
      const selectedSyrups: ProductCustomizationOption[] = []; // Simplified
      const selectedToppings: ProductCustomizationOption[] = []; // Simplified
      
      if (!selectedSize) {
        throw new Error('Please select a size');
      }
      
      // Create order item
      const orderItem: OrderItem = {
        productId: product.id,
        quantity: formValue.quantity,
        name: product.name,
        basePrice: product.price,
        customizations: {
          size: selectedSize,
          milk: selectedMilk ?? undefined, // Convert null to undefined
          shots: selectedShots,
          syrups: selectedSyrups,
          toppings: selectedToppings
        },
        sugarLevel: formValue.sugarLevel,
        caffeineLevel: formValue.caffeineLevel,
        specialInstructions: formValue.specialInstructions,
        itemTotal: this.itemTotal,
        nutritionInfo: this.nutritionInfo
      };
      
      // Get current user
      const user = await this.authService.getCurrentUser();
      
      if (!user) {
        throw new Error('Please sign in to add items to cart');
      }
      
      // TODO: In a real app, we would add this to a cart in local storage 
      // or user's Firestore cart collection. For simplicity, we'll create an order directly.
      
      const order: Order = {
        userId: user.uid,
        storeId: 'default-store', // For simplicity
        tableNumber: null, // Not ordering from table
        orderTime: new Date(),
        processTime: null,
        completionTime: null,
        status: 'pending',
        paymentStatus: 'pending',
        paymentMethod: 'card', // Default
        total: this.itemTotal,
        subtotal: this.itemTotal,
        tax: 0, // Will be calculated by service
        tip: 0,
        items: [orderItem],
        loyaltyPointsEarned: 0, // Will be calculated by service
        giftCardApplied: null,
        deliveredBy: null,
        notes: ''
      };
      
      // Create the order
      const orderId = await this.orderService.createOrder(order).toPromise();
      
      await loading.dismiss();
      
      const toast = await this.toastController.create({
        message: 'Added to cart successfully!',
        duration: 2000,
        position: 'bottom'
      });
      await toast.present();
      
      // Navigate to order confirmation
      this.router.navigate(['/order/confirmation', orderId]);
      
    } catch (error:any) {
      await loading.dismiss();
      
      const toast = await this.toastController.create({
        message: `Error: ${error.message}`,
        duration: 3000,
        position: 'bottom',
        color: 'danger'
      });
      await toast.present();
    }
  }
}