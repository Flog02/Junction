// src/app/shared/components/coffee-customizer/coffee-customizer.component.ts

import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import {IonCheckbox,IonRadio,IonRadioGroup,IonList,IonItem,IonButton,IonIcon,IonSegmentButton,IonSegment,IonLabel  } from '@ionic/angular/standalone';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatSliderModule } from '@angular/material/slider';
import { FormsModule } from '@angular/forms';
import { Product, ProductCustomizationOption } from '../../../core/models/product.model';
import { OrderItem } from '../../../core/models/order.model';
import { ProductService } from '../../../core/services/product.service';
interface CustomizationOptionWithState extends ProductCustomizationOption {
    selected: boolean;
  }
@Component({
  selector: 'app-coffee-customizer',
  standalone: true,
  imports: [FormsModule,IonCheckbox,IonRadio,IonRadioGroup,IonList,IonItem,CommonModule, ReactiveFormsModule,IonButton,IonIcon,IonSegmentButton,IonSegment,IonLabel, MatSliderModule],
  template:`<!-- src/app/shared/components/coffee-customizer/coffee-customizer.component.html -->

  <div class="customizer-container" *ngIf="product">
    <form [formGroup]="customizerForm">
      <!-- Quantity -->
      <div class="customizer-section">
        <h3 class="section-title">Quantity</h3>
        <div class="quantity-controls">
          <ion-button 
            fill="clear" 
            [disabled]="customizerForm.get('quantity')?.value <= 1"
            (click)="customizerForm.get('quantity')?.setValue(customizerForm.get('quantity')?.value - 1)"
          >
            <ion-icon name="remove-outline"></ion-icon>
          </ion-button>
          <div class="quantity-display">{{ customizerForm.get('quantity')?.value }}</div>
          <ion-button 
            fill="clear" 
            (click)="customizerForm.get('quantity')?.setValue(customizerForm.get('quantity')?.value + 1)"
          >
            <ion-icon name="add-outline"></ion-icon>
          </ion-button>
        </div>
      </div>
      
      <!-- Size -->
      <div class="customizer-section" *ngIf="availableSizes.length > 0">
        <h3 class="section-title">Size</h3>
        <div class="size-options">
          <ion-segment formControlName="size">
            <ion-segment-button 
              *ngFor="let size of availableSizes" 
              [value]="size.id"
              class="size-segment-button"
            >
              <ion-label>{{ size.name }}</ion-label>
              <small *ngIf="size.priceModifier !== 0">
                {{ size.priceModifier > 0 ? '+' : '' }}{{ size.priceModifier | currency }}
              </small>
            </ion-segment-button>
          </ion-segment>
        </div>
      </div>
      
      <!-- Milk Options -->
      <div class="customizer-section" *ngIf="availableMilk.length > 0">
        <h3 class="section-title">Milk</h3>
        <ion-list>
          <ion-radio-group formControlName="milk">
            <ion-item *ngFor="let milk of availableMilk">
              <ion-label>
                {{ milk.name }}
                <span *ngIf="milk.priceModifier !== 0" class="option-price">
                  ({{ milk.priceModifier > 0 ? '+' : '' }}{{ milk.priceModifier | currency }})
                </span>
              </ion-label>
              <ion-radio [value]="milk.id" slot="start"></ion-radio>
            </ion-item>
          </ion-radio-group>
        </ion-list>
      </div>
      
      <!-- Shots -->
      <div class="customizer-section" *ngIf="availableShots.length > 0">
        <h3 class="section-title">Espresso Shots</h3>
        <ion-list>
          <ion-item *ngFor="let shot of availableShots">
            <ion-label>
              {{ shot.name }}
              <span *ngIf="shot.priceModifier !== 0" class="option-price">
                ({{ shot.priceModifier > 0 ? '+' : '' }}{{ shot.priceModifier | currency }})
              </span>
            </ion-label>
            <ion-checkbox 
              [(ngModel)]="shot.selected" 
              [ngModelOptions]="{standalone: true}"
              (ionChange)="updateShotSelection()"
            ></ion-checkbox>
          </ion-item>
        </ion-list>
      </div>
      
      <!-- Syrups -->
      <div class="customizer-section" *ngIf="availableSyrups.length > 0">
        <h3 class="section-title">Flavors & Syrups</h3>
        <ion-list>
          <ion-item *ngFor="let syrup of availableSyrups">
            <ion-label>
              {{ syrup.name }}
              <span *ngIf="syrup.priceModifier !== 0" class="option-price">
                ({{ syrup.priceModifier > 0 ? '+' : '' }}{{ syrup.priceModifier | currency }})
              </span>
            </ion-label>
            <ion-checkbox 
              [(ngModel)]="syrup.selected" 
              [ngModelOptions]="{standalone: true}"
              (ionChange)="updateSyrupSelection()"
            ></ion-checkbox>
          </ion-item>
        </ion-list>
      </div>
      
      <!-- Toppings -->
      <div class="customizer-section" *ngIf="availableToppings.length > 0">
        <h3 class="section-title">Toppings</h3>
        <ion-list>
          <ion-item *ngFor="let topping of availableToppings">
            <ion-label>
              {{ topping.name }}
              <span *ngIf="topping.priceModifier !== 0" class="option-price">
                ({{ topping.priceModifier > 0 ? '+' : '' }}{{ topping.priceModifier | currency }})
              </span>
            </ion-label>
            <ion-checkbox 
              [(ngModel)]="topping.selected" 
              [ngModelOptions]="{standalone: true}"
              (ionChange)="updateToppingSelection()"
            ></ion-checkbox>
          </ion-item>
        </ion-list>
      </div>
      
      <!-- Sugar Level -->
      <div class="customizer-section">
        <h3 class="section-title">Sugar Level</h3>
        <div class="level-controls">
          <ion-button 
            fill="clear" 
            [disabled]="customizerForm.get('sugarLevel')?.value <= 0"
            (click)="adjustSugarLevel(-1)"
          >
            <ion-icon name="remove-outline"></ion-icon>
          </ion-button>
          <div class="level-indicator">
            <div 
              *ngFor="let i of [0, 1, 2, 3, 4, 5]" 
              class="level-dot" 
              [ngClass]="{'active': customizerForm.get('sugarLevel')?.value >= i}"
            ></div>
            <div class="level-labels">
              <span>No Sugar</span>
              <span>Extra Sweet</span>
            </div>
          </div>
          <ion-button 
            fill="clear" 
            [disabled]="customizerForm.get('sugarLevel')?.value >= 5"
            (click)="adjustSugarLevel(1)"
          >
            <ion-icon name="add-outline"></ion-icon>
          </ion-button>
        </div>
      </div>
      
      <!-- Caffeine Level -->
      <div class="customizer-section">
        <h3 class="section-title">Caffeine Level</h3>
        <div class="level-controls">
          <ion-button 
            fill="clear" 
            [disabled]="customizerForm.get('caffeineLevel')?.value <= 0"
            (click)="adjustCaffeineLevel(-1)"
          >
            <ion-icon name="remove-outline"></ion-icon>
          </ion-button>
          <div class="level-indicator">
            <div 
              *ngFor="let i of [0, 1, 2, 3, 4, 5]" 
              class="level-dot" 
              [ngClass]="{'active': customizerForm.get('caffeineLevel')?.value >= i}"
            ></div>
            <div class="level-labels">
              <span>Decaf</span>
              <span>Extra Strong</span>
            </div>
          </div>
          <ion-button 
            fill="clear" 
            [disabled]="customizerForm.get('caffeineLevel')?.value >= 5"
            (click)="adjustCaffeineLevel(1)"
          >
            <ion-icon name="add-outline"></ion-icon>
          </ion-button>
        </div>
      </div>
      
      <!-- Special Instructions -->
      <div class="customizer-section">
        <h3 class="section-title">Special Instructions</h3>
        <ion-item>
          <ion-textarea 
            formControlName="specialInstructions"
            placeholder="Any special requests?"
            rows="2"
            maxlength="200"
          ></ion-textarea>
        </ion-item>
        <div class="char-count">
          {{ customizerForm.get('specialInstructions')?.value?.length || 0 }}/200
        </div>
      </div>
    </form>
    
    <!-- Nutrition Information -->
    <div class="nutrition-section">
      <h3 class="section-title">Nutrition Information</h3>
      <div class="nutrition-grid">
        <div class="nutrition-item">
          <div class="nutrition-value">{{ nutritionInfo.calories }}</div>
          <div class="nutrition-label">CALORIES</div>
        </div>
        <div class="nutrition-item">
          <div class="nutrition-value">{{ nutritionInfo.sugar }}g</div>
          <div class="nutrition-label">SUGAR</div>
        </div>
        <div class="nutrition-item">
          <div class="nutrition-value">{{ nutritionInfo.caffeine }}mg</div>
          <div class="nutrition-label">CAFFEINE</div>
        </div>
        <div class="nutrition-item">
          <div class="nutrition-value">{{ nutritionInfo.fat }}g</div>
          <div class="nutrition-label">FAT</div>
        </div>
        <div class="nutrition-item">
          <div class="nutrition-value">{{ nutritionInfo.protein }}g</div>
          <div class="nutrition-label">PROTEIN</div>
        </div>
      </div>
    </div>
    
    <!-- Price Summary -->
    <div class="price-summary">
      <div class="total-price">Total: {{ totalPrice | currency }}</div>
    </div>
  </div>`,
  styles:`/* src/app/shared/components/coffee-customizer/coffee-customizer.component.scss */

  .customizer-container {
    padding: 16px;
  }
  
  .customizer-section {
    margin-bottom: 24px;
  }
  
  .section-title {
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 12px;
    color: var(--ion-color-dark);
  }
  
  // Quantity controls
  .quantity-controls {
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .quantity-display {
    width: 40px;
    text-align: center;
    font-size: 18px;
    font-weight: bold;
  }
  
  // Size options
  .size-options {
    margin-bottom: 8px;
  }
  
  .size-segment-button {
    display: flex;
    flex-direction: column;
    
    small {
      margin-top: 4px;
      font-size: 10px;
      color: var(--ion-color-medium);
    }
  }
  
  // Customization options
  .option-price {
    font-size: 12px;
    color: var(--ion-color-medium);
  }
  
  // Level controls
  .level-controls {
    display: flex;
    align-items: center;
  }
  
  .level-indicator {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 0 16px;
  }
  
  .level-dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background-color: var(--ion-color-light);
    margin: 0 4px;
    display: inline-block;
    transition: background-color 0.2s ease;
  }
  
  .level-dot.active {
    background-color: var(--ion-color-primary);
  }
  
  .level-labels {
    display: flex;
    justify-content: space-between;
    width: 100%;
    margin-top: 8px;
    font-size: 12px;
    color: var(--ion-color-medium);
  }
  
  // Character count
  .char-count {
    text-align: right;
    font-size: 12px;
    color: var(--ion-color-medium);
    margin-top: 4px;
  }
  
  // Nutrition info
  .nutrition-section {
    background-color: var(--ion-color-light);
    padding: 16px;
    border-radius: 8px;
    margin-bottom: 24px;
  }
  
  .nutrition-grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 8px;
  }
  
  .nutrition-item {
    text-align: center;
  }
  
  .nutrition-value {
    font-weight: bold;
    font-size: 16px;
  }
  
  .nutrition-label {
    font-size: 10px;
    color: var(--ion-color-medium);
  }
  
  // Price summary
  .price-summary {
    padding: 16px 0;
    border-top: 1px solid var(--ion-color-light);
    margin-top: 16px;
  }
  
  .total-price {
    text-align: right;
    font-size: 18px;
    font-weight: bold;
    color: var(--ion-color-primary);
  }`
})
export class CoffeeCustomizerComponent implements OnInit { 
    @Input() product!: Product;
    @Output() customized = new EventEmitter<OrderItem>();
    
    customizerForm: FormGroup;
    
    // These will store the options for the current product
    availableSizes: ProductCustomizationOption[] = [];
    availableMilk: ProductCustomizationOption[] = [];
    availableShots: CustomizationOptionWithState[] = [];
    availableSyrups: CustomizationOptionWithState[] = [];
    availableToppings: CustomizationOptionWithState[] = [];
    
    // Nutritional info
    nutritionInfo: any = {
      calories: 0,
      sugar: 0,
      caffeine: 0,
      fat: 0,
      protein: 0
    };
    
    // Price calculation
    basePrice: number = 0;
    totalPrice: number = 0;
    
    constructor(
      private formBuilder: FormBuilder,
      private productService: ProductService
    ) {
      this.customizerForm = this.createForm();
    }
    
    ngOnInit() {
      if (this.product) {
        this.initializeForm();
      }
    }
    
    /**
     * Creates the customizer form
     */
    createForm(): FormGroup {
      return this.formBuilder.group({
        quantity: [1, [Validators.required, Validators.min(1)]],
        size: ['', Validators.required],
        milk: [''],
        shots: [[]],  // Array of selected shot IDs
        syrups: [[]], // Array of selected syrup IDs
        toppings: [[]],  // Array of selected topping IDs
        sugarLevel: [3, [Validators.required, Validators.min(0), Validators.max(5)]],
        caffeineLevel: [3, [Validators.required, Validators.min(0), Validators.max(5)]],
        specialInstructions: ['', Validators.maxLength(200)]
      });
    }
    
    /**
     * Initialize form with product data
     */
    initializeForm() {
      // Set base price
      this.basePrice = this.product.price;
      
      // Update available options
      this.availableSizes = this.product.customizationOptions.sizes || [];
      this.availableMilk = this.product.customizationOptions.milk || [];
      
      // Add selection state to multi-select options
      this.availableShots = (this.product.customizationOptions.shots || [])
        .map(shot => ({ ...shot, selected: false }));
      
      this.availableSyrups = (this.product.customizationOptions.syrups || [])
        .map(syrup => ({ ...syrup, selected: false }));
      
      this.availableToppings = (this.product.customizationOptions.toppings || [])
        .map(topping => ({ ...topping, selected: false }));
      
      // Set default values
      if (this.availableSizes.length > 0) {
        this.customizerForm.get('size')?.setValue(this.availableSizes[0].id);
      }
      
      if (this.availableMilk.length > 0) {
        this.customizerForm.get('milk')?.setValue(this.availableMilk[0].id);
      }
      
      // React to form changes
      this.customizerForm.valueChanges.subscribe(() => {
        this.updateOrderItem();
      });
      
      // Initialize with default values
      this.updateOrderItem();
    }
    
    /**
     * Updates the order item based on current selections
     */
    updateOrderItem() {
      // Get form values
      const formValues = this.customizerForm.value;
      
      // Get selected customizations
      const selectedSize = this.availableSizes.find(s => s.id === formValues.size);
      const selectedMilk = this.availableMilk.find(m => m.id === formValues.milk);
      
      // Get selected shots
      const selectedShots = this.availableShots
        .filter(shot => formValues.shots.includes(shot.id));
      
      // Get selected syrups
      const selectedSyrups = this.availableSyrups
        .filter(syrup => formValues.syrups.includes(syrup.id));
      
      // Get selected toppings
      const selectedToppings = this.availableToppings
        .filter(topping => formValues.toppings.includes(topping.id));
      
      if (!selectedSize) return;
      
      // Calculate nutrition
      // Check if milk option is selected before passing to calculateNutrition
      if (selectedSize) {
        // If selectedMilk is undefined, we need a different approach based on how calculateNutrition is implemented
        // Option 1: Only call with milk if it's available
        if (selectedMilk) {
          this.nutritionInfo = this.productService.calculateNutrition(
            this.product,
            selectedSize,
            selectedMilk,
            selectedShots,
            selectedSyrups,
            formValues.sugarLevel,
            formValues.caffeineLevel
          );
        } else {
          // Option 2: If milk is required, use a default empty milk option or the first available milk
          const defaultMilk = this.availableMilk.length > 0 ? this.availableMilk[0] : null;
          
          // Only proceed if we have a valid milk option
          if (defaultMilk) {
            this.nutritionInfo = this.productService.calculateNutrition(
              this.product,
              selectedSize,
              defaultMilk,
              selectedShots,
              selectedSyrups,
              formValues.sugarLevel,
              formValues.caffeineLevel
            );
          }
        }
      }
      
      // Create order item
      const orderItem: OrderItem = {
        productId: this.product.id,
        quantity: formValues.quantity,
        name: this.product.name,
        basePrice: this.product.price,
        customizations: {
          size: selectedSize,
          milk: selectedMilk ?? undefined, // Convert null to undefined
          shots: selectedShots,
          syrups: selectedSyrups,
          toppings: selectedToppings
        },
        sugarLevel: formValues.sugarLevel,
        caffeineLevel: formValues.caffeineLevel,
        specialInstructions: formValues.specialInstructions,
        itemTotal: 0, // Will be calculated
        nutritionInfo: this.nutritionInfo
      };
      
      // Calculate total price
      this.calculateTotalPrice(orderItem);
      
      // Emit the customized order item
      this.customized.emit(orderItem);
    }
    
    /**
     * Calculates the total price for the order item
     */
    calculateTotalPrice(orderItem: OrderItem) {
      let total = this.basePrice;
      
      // Add size price
      if (orderItem.customizations.size) {
        total += orderItem.customizations.size.priceModifier;
      }
      
      // Add milk price
      if (orderItem.customizations.milk) {
        total += orderItem.customizations.milk.priceModifier;
      }
      
      // Add shots price
      if (orderItem.customizations.shots && orderItem.customizations.shots.length > 0) {
        orderItem.customizations.shots.forEach(shot => {
          total += shot.priceModifier;
        });
      }
      
      // Add syrups price
      if (orderItem.customizations.syrups && orderItem.customizations.syrups.length > 0) {
        orderItem.customizations.syrups.forEach(syrup => {
          total += syrup.priceModifier;
        });
      }
      
      // Add toppings price
      if (orderItem.customizations.toppings && orderItem.customizations.toppings.length > 0) {
        orderItem.customizations.toppings.forEach(topping => {
          total += topping.priceModifier;
        });
      }
      
      // Multiply by quantity
      total *= orderItem.quantity;
      
      // Update the order item's total
      orderItem.itemTotal = total;
      this.totalPrice = total;
    }
    
    // Other methods unchanged...
    
    /**
     * Updates the shot selection based on checkbox changes
     */
    updateShotSelection() {
      const selectedShotIds = this.availableShots
        .filter(shot => shot.selected)
        .map(shot => shot.id);
      
      this.customizerForm.get('shots')?.setValue(selectedShotIds);
    }
    
    /**
     * Updates the syrup selection based on checkbox changes
     */
    updateSyrupSelection() {
      const selectedSyrupIds = this.availableSyrups
        .filter(syrup => syrup.selected)
        .map(syrup => syrup.id);
      
      this.customizerForm.get('syrups')?.setValue(selectedSyrupIds);
    }
    
    /**
     * Updates the topping selection based on checkbox changes
     */
    updateToppingSelection() {
      const selectedToppingIds = this.availableToppings
        .filter(topping => topping.selected)
        .map(topping => topping.id);
      
      this.customizerForm.get('toppings')?.setValue(selectedToppingIds);
    }
    
    /**
     * Adjusts the sugar level
     */
    adjustSugarLevel(value: number) {
      const currentValue = this.customizerForm.get('sugarLevel')?.value;
      const newValue = Math.max(0, Math.min(5, currentValue + value));
      this.customizerForm.get('sugarLevel')?.setValue(newValue);
    }
    
    /**
     * Adjusts the caffeine level
     */
    adjustCaffeineLevel(value: number) {
      const currentValue = this.customizerForm.get('caffeineLevel')?.value;
      const newValue = Math.max(0, Math.min(5, currentValue + value));
      this.customizerForm.get('caffeineLevel')?.setValue(newValue);
    }
    
    /**
     * Gets the display name for a customization option
     */
    getOptionName(optionId: string, options: ProductCustomizationOption[]): string {
      const option = options.find(o => o.id === optionId);
      return option ? option.name : '';
    }
  }