import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { takeUntil, Subject, switchMap, Observable, of, map, combineLatest, take, tap } from 'rxjs';
import {
  IonSpinner, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonTextarea,
  IonToolbar, IonHeader, IonButtons, IonBackButton, IonTitle, IonContent,
  IonLabel, IonItem, IonInput, IonButton, IonSelect, IonSelectOption, IonIcon
} from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { MatSliderModule } from '@angular/material/slider';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCardModule } from '@angular/material/card';
import { addIcons } from 'ionicons';
import { 
  removeCircleOutline, 
  addCircleOutline, 
  cafeOutline,
  waterOutline,
  flashOutline,
  colorFillOutline,
  iceCreamOutline,
  flameOutline,
  barbellOutline,
  restaurantOutline,
  cartOutline,
  timeOutline 
} from 'ionicons/icons';

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
  templateUrl: './order-custom.component.html',
  styleUrls: ['./order-custom.component.scss'],
  standalone: true,
  imports: [
    IonIcon, 
    IonCard, IonCardContent, IonCardHeader, IonCardTitle,
    CommonModule,
    IonTextarea, IonToolbar, IonSpinner, IonHeader, IonButtons, IonBackButton, IonTitle, 
    IonContent, IonLabel, IonItem, IonInput, IonButton, IonSelect, IonSelectOption,
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
  product: Product | null = null;
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
  isLoading = true;
  
  // Table ordering parameters
  isTableOrder = false;
  storeId: string | null = null;
  tableNumber: number | null = null;
  
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
    // Initialize icons
    addIcons({
      removeCircleOutline, 
      addCircleOutline, 
      cafeOutline,
      waterOutline,
      flashOutline,
      colorFillOutline,
      iceCreamOutline,
      flameOutline,
      barbellOutline,
      restaurantOutline,
      cartOutline,
      timeOutline
    });
    
    // Initialize form
    this.orderForm = this.createOrderForm();
  }
  
  ngOnInit(): void {
    // Get product ID from route params
    this.route.paramMap.pipe(
      takeUntil(this.destroy$)
    ).subscribe(params => {
      this.productId = params.get('id');
      
      if (this.productId) {
        this.loadProduct();
      } else {
        this.handleError('Product ID not found in route params');
      }
    });
    
    // Check for table order params
    this.route.queryParams.pipe(
      takeUntil(this.destroy$)
    ).subscribe(params => {
      this.isTableOrder = params['tableOrder'] === 'true';
      this.storeId = params['storeId'] || null;
      this.tableNumber = params['tableNumber'] ? parseInt(params['tableNumber'], 10) : null;
    });
    
    // Subscribe to form changes to update nutrition and price
    this.orderForm.valueChanges.pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
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
      sugarLevel: [3, [Validators.required, Validators.min(0), Validators.max(5)]],
      caffeineLevel: [3, [Validators.required, Validators.min(0), Validators.max(5)]],
      specialInstructions: ['']
    });
  }
  
  /**
   * Loads the product details
   */
  loadProduct(): void {
    this.isLoading = true;
    
    if (!this.productId) {
      this.handleError('Product ID is not available');
      return;
    }
    
    // Try to get product from service, with fallback to local products
    this.productService.getProduct(this.productId).pipe(
      switchMap((product:any) => {
        if (product) return of(product);
        // If not found, try getAllProducts as fallback
        return this.productService.getAllProducts().pipe(
          map(products => products.find(p => p.id === this.productId)),
          tap(product => {
            if (!product) throw new Error(`Product not found with ID: ${this.productId}`);
          })
        );
      }),
      takeUntil(this.destroy$)
    ).subscribe({
      next: (product) => {
        this.product = product;
        this.updateAvailableOptions(product);
        this.setDefaultValues(product);
        this.updateNutritionAndPrice();
        this.isLoading = false;
      },
      error: (error) => {
        this.handleError(`Failed to load product: ${error.message}`);
      }
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
    if (!this.product) return;
    
    const formValue = this.orderForm.value;
    
    // Find the selected size
    const selectedSize = this.availableSizes.find(s => s.id === formValue.size);
    if (!selectedSize) return;
    
    // Find the selected milk
    const selectedMilk = this.availableMilk.find(m => m.id === formValue.milk);
    
    // Get selected shots
    const selectedShots = this.availableShots.filter(s => s.selected);
    
    // Get selected syrups
    const selectedSyrups = this.availableSyrups.filter(s => s.selected);
    
    // Calculate nutrition info
    this.nutritionInfo = this.productService.calculateNutrition(
      this.product,
      selectedSize,
      selectedMilk || this.availableMilk[0] || null,
      selectedShots,
      selectedSyrups,
      formValue.sugarLevel,
      formValue.caffeineLevel
    );
    
    // Create an order item to calculate price
    const orderItem: OrderItem = {
      productId: this.product.id,
      quantity: formValue.quantity,
      name: this.product.name,
      basePrice: this.product.price,
      customizations: {
        size: selectedSize,
        milk: selectedMilk,
        shots: selectedShots,
        syrups: selectedSyrups,
        toppings: this.availableToppings.filter(t => t.selected)
      },
      sugarLevel: formValue.sugarLevel,
      caffeineLevel: formValue.caffeineLevel,
      specialInstructions: formValue.specialInstructions,
      itemTotal: 0,
      nutritionInfo: this.nutritionInfo
    };
    
    // Calculate item total
    this.itemTotal = this.orderService.calculateItemTotal(orderItem);
  }
  
  /**
   * Increments the quantity value
   */
  incrementQuantity(): void {
    const quantityControl = this.orderForm.get('quantity');
    if (quantityControl) {
      const currentValue = quantityControl.value || 1;
      quantityControl.setValue(currentValue + 1);
    }
  }
  
  /**
   * Decrements the quantity value
   */
  decrementQuantity(): void {
    const quantityControl = this.orderForm.get('quantity');
    if (quantityControl) {
      const currentValue = quantityControl.value || 1;
      if (currentValue > 1) {
        quantityControl.setValue(currentValue - 1);
      }
    }
  }
  
  /**
   * Toggles a shot selection
   */
  toggleShot(index: number): void {
    if (index >= 0 && index < this.availableShots.length) {
      this.availableShots[index].selected = !this.availableShots[index].selected;
      this.updateNutritionAndPrice();
    }
  }
  
  /**
   * Toggles a syrup selection
   */
  toggleSyrup(index: number): void {
    if (index >= 0 && index < this.availableSyrups.length) {
      this.availableSyrups[index].selected = !this.availableSyrups[index].selected;
      this.updateNutritionAndPrice();
    }
  }
  
  /**
   * Toggles a topping selection
   */
  toggleTopping(index: number): void {
    if (index >= 0 && index < this.availableToppings.length) {
      this.availableToppings[index].selected = !this.availableToppings[index].selected;
      this.updateNutritionAndPrice();
    }
  }
  
  /**
   * Handles error scenarios
   */
  async handleError(message: string): Promise<void> {
    this.isLoading = false;
    console.error(message);
    
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      position: 'bottom',
      color: 'danger'
    });
    
    await toast.present();
    
    // Navigate back to the menu
    this.router.navigate(['/menu']);
  }
  
  /**
   * Adds the customized item to the cart
   */
  async addToCart(): Promise<void> {
    if (this.orderForm.invalid || !this.product) {
      return;
    }
    
    const loading = await this.loadingController.create({
      message: 'Adding to cart...'
    });
    
    await loading.present();
    
    try {
      const formValue = this.orderForm.value;
      
      // Find selected options
      const selectedSize = this.availableSizes.find(s => s.id === formValue.size);
      const selectedMilk = this.availableMilk.find(m => m.id === formValue.milk);
      const selectedShots = this.availableShots.filter(s => s.selected);
      const selectedSyrups = this.availableSyrups.filter(s => s.selected);
      const selectedToppings = this.availableToppings.filter(t => t.selected);
      
      if (!selectedSize) {
        throw new Error('Please select a size');
      }
      
      // Create order item
      const orderItem: OrderItem = {
        productId: this.product.id,
        quantity: formValue.quantity,
        name: this.product.name,
        basePrice: this.product.price,
        customizations: {
          size: selectedSize,
          milk: selectedMilk,
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
      
      // Add to cart
      this.orderService.addToCart(orderItem);
      
      await loading.dismiss();
      
      const toast = await this.toastController.create({
        message: 'Added to cart successfully!',
        duration: 2000,
        position: 'bottom',
        color: 'success'
      });
      
      await toast.present();
      
      // Navigate back to menu or to cart
      if (this.isTableOrder) {
        this.router.navigate(['/menu'], {
          queryParams: {
            tableOrder: 'true',
            storeId: this.storeId,
            tableNumber: this.tableNumber
          }
        });
      } else {
        this.router.navigate(['/menu']);
      }
      
    } catch (error: any) {
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