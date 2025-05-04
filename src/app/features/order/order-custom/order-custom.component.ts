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
    CommonModule,
    IonTextarea, IonToolbar, IonSpinner, IonHeader, IonButtons, IonBackButton, IonTitle,
    IonContent, IonButton,
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
    // Base fields for all products
    const baseForm: { [key: string]: any } = {
      quantity: [1, [Validators.required, Validators.min(1)]],
      specialInstructions: ['']
    };
  
    // Start with base form and add category-specific fields
    const formConfig: { [key: string]: any } = { ...baseForm };
  
    // If the product is loaded, customize the form based on the category
    if (this.product) {
      if (this.product.category === 'coffee' || this.product.category === 'tea') {
        // Full form for beverages
        formConfig['size'] = ['', Validators.required];
        formConfig['milk'] = [''];
        formConfig['sugarLevel'] = [3, [Validators.required, Validators.min(0), Validators.max(5)]];
        formConfig['caffeineLevel'] = [3, [Validators.required, Validators.min(0), Validators.max(5)]];
      } else if (this.product.category === 'dessert') {
        // For desserts, add sugar level
        formConfig['sugarLevel'] = [3, [Validators.required, Validators.min(0), Validators.max(5)]];
        
        // Only add size field if sizes are available and make it required only if sizes exist
        if (this.product.customizationOptions?.sizes?.length > 0) {
          formConfig['size'] = ['', Validators.required];
        }
      } else if (this.product.category === 'food') {
        // For food items, don't add sugar or caffeine
        
        // Only add size field if sizes are available and make it required only if sizes exist
        if (this.product.customizationOptions?.sizes?.length > 0) {
          formConfig['size'] = ['', Validators.required];
        }
      }
    } else {
      // Default form when product is not yet loaded
      formConfig['size'] = [''];
      formConfig['milk'] = [''];
      formConfig['sugarLevel'] = [3, [Validators.min(0), Validators.max(5)]];
      formConfig['caffeineLevel'] = [3, [Validators.min(0), Validators.max(5)]];
    }
  
    return this.formBuilder.group(formConfig);
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
    console.log('Updating available options for product category:', product.category);
    
    this.availableSizes = product.customizationOptions.sizes || [];
    
    // For beverages, show all customization options
    if (product.category === 'coffee' || product.category === 'tea') {
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
    } else {
      // For food and dessert, only show toppings
      this.availableMilk = [];
      this.availableShots = [];
      this.availableSyrups = [];
      
      // Convert toppings to selectable options
      this.availableToppings = (product.customizationOptions.toppings || [])
        .map(topping => ({...topping, selected: false}));
    }
    
    // Update the form controls based on available options
    this.updateFormControls(product);
  }

  /**
 * Update form controls based on product category
 */
 // In OrderCustomComponent (paste.txt), update the updateFormControls method:

updateFormControls(product: Product): void {
  // Reset the form with the right configuration for this product
  this.orderForm = this.createOrderForm();
  
  // If the product is a beverage
  if (product.category === 'coffee' || product.category === 'tea') {
    // For beverages, we need all standard controls
    // These should already be added by createOrderForm
    
  } 
  // If the product is a dessert
  else if (product.category === 'dessert') {
    // Desserts need sugar level but not caffeine
    // If sugar level isn't already there, add it
    if (!this.orderForm.get('sugarLevel')) {
      this.orderForm.addControl('sugarLevel', this.formBuilder.control(3, [
        Validators.required, Validators.min(0), Validators.max(5)
      ]));
    }
    
    // Remove caffeine control if it exists
    if (this.orderForm.get('caffeineLevel')) {
      this.orderForm.removeControl('caffeineLevel');
    }
    
    // Remove milk control if it exists
    if (this.orderForm.get('milk')) {
      this.orderForm.removeControl('milk');
    }
    
    // Add size control only if sizes are available
    if (this.availableSizes.length > 0 && !this.orderForm.get('size')) {
      this.orderForm.addControl('size', this.formBuilder.control('', Validators.required));
    } else if (this.availableSizes.length === 0 && this.orderForm.get('size')) {
      this.orderForm.removeControl('size');
    }
  }
  // If the product is food
  else if (product.category === 'food') {
    // Food doesn't need sugar, caffeine, or milk controls
    if (this.orderForm.get('sugarLevel')) {
      this.orderForm.removeControl('sugarLevel');
    }
    
    if (this.orderForm.get('caffeineLevel')) {
      this.orderForm.removeControl('caffeineLevel');
    }
    
    if (this.orderForm.get('milk')) {
      this.orderForm.removeControl('milk');
    }
    
    // Add size control only if sizes are available
    if (this.availableSizes.length > 0 && !this.orderForm.get('size')) {
      this.orderForm.addControl('size', this.formBuilder.control('', Validators.required));
    } else if (this.availableSizes.length === 0 && this.orderForm.get('size')) {
      this.orderForm.removeControl('size');
    }
  }
}

  
  /**
   * Set default values for the form based on the product
   */
 
  setDefaultValues(product: Product): void {
    // Set default size if available
    if (this.availableSizes.length > 0 && this.orderForm.get('size')) {
      this.orderForm.get('size')?.setValue(this.availableSizes[0].id);
    }
  
    // For beverages, set default milk
    if ((product.category === 'coffee' || product.category === 'tea') && 
        this.availableMilk.length > 0 && 
        this.orderForm.get('milk')) {
      this.orderForm.get('milk')?.setValue(this.availableMilk[0].id);
    }
  
    // Set default values for sugar and caffeine levels (already defaulted in form creation, but safe to reapply)
    if (this.orderForm.get('sugarLevel')) {
      this.orderForm.get('sugarLevel')?.setValue(3);
    }
  
    if (this.orderForm.get('caffeineLevel')) {
      this.orderForm.get('caffeineLevel')?.setValue(3);
    }
  
    // Optionally reset selectable checkboxes (shots, syrups, toppings)
    this.availableShots.forEach(option => option.selected = false);
    this.availableSyrups.forEach(option => option.selected = false);
    this.availableToppings.forEach(option => option.selected = false);
  }
  
  
  /**
   * Updates the nutrition information and price based on current selections
   */
 // In OrderCustomComponent (paste.txt), update the updateNutritionAndPrice method:

updateNutritionAndPrice(): void {
  if (!this.product) return;
  
  const formValue = this.orderForm.value;
  
  // Find the selected size
  const selectedSize = this.availableSizes.find(s => s.id === formValue.size);
  
  // For products with no size options, use a default size
  const sizeToUse = selectedSize || 
    (this.availableSizes.length > 0 ? this.availableSizes[0] : 
    { id: 'default', name: 'Default', priceModifier: 0 });
  
  // Find the selected milk
  const selectedMilk = this.availableMilk.find(m => m.id === formValue.milk);
  
  // Get selected shots or toppings based on product category
  let selectedShotsOrToppings = [];
  if (this.product.category === 'food' || this.product.category === 'dessert') {
    // For food and dessert, use toppings as "shots" parameter in calculation
    selectedShotsOrToppings = this.availableToppings.filter(t => t.selected);
  } else {
    // For beverages, use shots as normal
    selectedShotsOrToppings = this.availableShots.filter(s => s.selected);
  }
  
  // Get selected syrups
  const selectedSyrups = this.availableSyrups.filter(s => s.selected);
  
  // Get selected toppings for beverages
  const selectedToppings = this.product.category === 'food' || this.product.category === 'dessert' 
    ? [] 
    : this.availableToppings.filter(t => t.selected);
  
  // Calculate nutrition info - for food/dessert, pass toppings as "shots" parameter
  this.nutritionInfo = this.productService.calculateNutrition(
    this.product,
    sizeToUse,
    selectedMilk || null,
    selectedShotsOrToppings,
    selectedSyrups,
    formValue.sugarLevel || 3,
    formValue.caffeineLevel || 3
  );
  
  // Create an order item to calculate price
  const orderItem: OrderItem = {
    productId: this.product.id,
    quantity: formValue.quantity || 1,
    name: this.product.name,
    basePrice: this.product.price,
    customizations: {
      size: sizeToUse,
      milk: selectedMilk,
      shots: this.product.category === 'coffee' || this.product.category === 'tea' 
        ? selectedShotsOrToppings 
        : [],
      syrups: selectedSyrups,
      toppings: this.product.category === 'food' || this.product.category === 'dessert' 
        ? selectedShotsOrToppings 
        : selectedToppings
    },
    sugarLevel: formValue.sugarLevel || 3,
    caffeineLevel: formValue.caffeineLevel || 3,
    specialInstructions: formValue.specialInstructions || '',
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
  // In OrderCustomComponent (paste.txt), update the addToCart method:

async addToCart(): Promise<void> {
  // Check form validity but make sure we don't validate controls that don't exist
  let formIsValid = this.orderForm.valid;
  
  // Check if the form has proper controls based on product category
  if (!this.product) {
    return;
  }
  
  const loading = await this.loadingController.create({
    message: 'Adding to cart...'
  });
  
  await loading.present();
  
  try {
    const formValue = this.orderForm.value;
    
    // Find selected options
    const selectedSize = this.availableSizes.length > 0 ? 
      this.availableSizes.find(s => s.id === formValue.size) || this.availableSizes[0] :
      { id: 'default', name: 'Default', priceModifier: 0 };
    
    const selectedMilk = this.availableMilk.length > 0 ? 
      this.availableMilk.find(m => m.id === formValue.milk) : 
      null;
    
    const selectedShots = this.availableShots.filter(s => s.selected);
    const selectedSyrups = this.availableSyrups.filter(s => s.selected);
    const selectedToppings = this.availableToppings.filter(t => t.selected);
    
    // Set default values for controls that might not exist
    const sugarLevel = this.orderForm.get('sugarLevel') ? 
      formValue.sugarLevel : 
      (this.product.category === 'dessert' ? 3 : 0);
    
    const caffeineLevel = this.orderForm.get('caffeineLevel') ? 
      formValue.caffeineLevel : 
      (this.product.category === 'coffee' || this.product.category === 'tea' ? 3 : 0);
    
    // Create order item
    const orderItem: OrderItem = {
      productId: this.product.id,
      quantity: formValue.quantity,
      name: this.product.name,
      basePrice: this.product.price,
      customizations: {
        size: selectedSize,
        milk: selectedMilk ?? undefined,
        shots: this.product.category === 'coffee' || this.product.category === 'tea' ? 
          selectedShots : 
          [],
        syrups: selectedSyrups,
        toppings: this.product.category === 'food' || this.product.category === 'dessert' ? 
          selectedToppings : 
          selectedToppings
      },
      sugarLevel: sugarLevel,
      caffeineLevel: caffeineLevel,
      specialInstructions: formValue.specialInstructions || '',
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