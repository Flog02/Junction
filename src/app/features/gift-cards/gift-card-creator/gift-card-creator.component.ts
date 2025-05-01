// src/app/features/gift-cards/gift-card-creator/gift-card-creator.component.ts

import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { CommonModule } from '@angular/common';
import {IonTextarea,IonToolbar,IonHeader,IonButtons,IonBackButton,IonTitle,IonContent,IonLabel,IonItem,IonInput,IonNote,IonButton,IonIcon,IonSelect,IonSelectOption} from '@ionic/angular/standalone'

import { GiftCardService, GiftCardTemplate } from '../../../core/services/gift-card.service';
import { LoadingController, ToastController, AlertController } from '@ionic/angular/standalone';

@Component({
  selector: 'app-gift-card-creator',
  templateUrl: './gift-card-creator.component.html',
  styles:` .stepper-container {
    margin-bottom: 24px;
    overflow-x: auto;
    padding-bottom: 8px;
  }
  
  .stepper {
    display: flex;
    align-items: center;
    width: 100%;
    min-width: 500px;
  }
  
  .step {
    display: flex;
    flex-direction: column;
    align-items: center;
    position: relative;
    z-index: 2;
  }
  
  .step-number {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background-color: var(--ion-color-medium);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    margin-bottom: 8px;
    transition: all 0.3s ease;
  }
  
  .step.active .step-number,
  .step.completed .step-number {
    background-color: var(--ion-color-primary);
  }
  
  .step-label {
    font-size: 12px;
    color: var(--ion-color-medium);
    transition: all 0.3s ease;
  }
  
  .step.active .step-label,
  .step.completed .step-label {
    color: var(--ion-color-primary);
    font-weight: bold;
  }
  
  .step-line {
    flex: 1;
    height: 2px;
    background-color: var(--ion-color-medium);
    z-index: 1;
    transition: all 0.3s ease;
  }
  
  .step-line.active {
    background-color: var(--ion-color-primary);
  }
  
  .step-title {
    font-size: 24px;
    font-weight: bold;
    margin-bottom: 8px;
    color: var(--ion-color-primary);
  }
  
  .step-description {
    color: var(--ion-color-medium);
    margin-bottom: 24px;
  }
  
  .navigation-buttons {
    display: flex;
    justify-content: space-between;
    margin-top: 32px;
  }
  
  .amount-selector {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
    margin-bottom: 24px;
  }
  
  .amount-option {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
    border-radius: 8px;
    border: 2px solid var(--ion-color-light);
    font-weight: bold;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .amount-option:hover {
    border-color: var(--ion-color-primary-tint);
  }
  
  .amount-option.selected {
    border-color: var(--ion-color-primary);
    background-color: var(--ion-color-primary-tint);
    color: var(--ion-color-primary);
  }
  
  .custom-amount-container {
    margin-bottom: 24px;
  }
  
  .templates-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
    margin-bottom: 24px;
  }
  
  .template-card {
    position: relative;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    cursor: pointer;// First, let's create a Gift Card service
  }
  `,
  standalone: true,
  imports: [CommonModule, IonTextarea, IonToolbar, IonHeader, IonButtons, IonBackButton, IonTitle, IonContent, IonLabel, IonItem, IonInput, IonNote, IonButton, IonIcon, IonSelect, IonSelectOption, ReactiveFormsModule]
})
export class GiftCardCreatorComponent implements OnInit, OnDestroy {
  giftCardForm: FormGroup;
  giftCardTemplates: GiftCardTemplate[] = [];
  selectedTemplate: GiftCardTemplate | null = null;
  isSubmitting = false;
  
  // Standard amounts
  standardAmounts = [5, 10, 15, 20, 25, 50, 100];
  showCustomAmount = false;
  
  // Standard occasions
  standardOccasions = [
    'Birthday',
    'Thank You',
    'Congratulations',
    'Holidays',
    'Just Because'
  ];
  
  // Current step in the gift card creation process
  currentStep = 1;
  totalSteps = 4;
  
  private destroy$ = new Subject<void>();
  
  constructor(
    private formBuilder: FormBuilder,
    private giftCardService: GiftCardService,
    private router: Router,
    private loadingController: LoadingController,
    private toastController: ToastController,
    private alertController: AlertController
  ) {
    this.giftCardForm = this.createGiftCardForm();
  }
  
  ngOnInit() {
    // Load gift card templates
    this.giftCardService.getGiftCardTemplates()
      .pipe(takeUntil(this.destroy$))
      .subscribe(templates => {
        this.giftCardTemplates = templates;
      });
  }
  
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  /**
   * Creates the gift card form
   */
  createGiftCardForm(): FormGroup {
    return this.formBuilder.group({
      recipientName: ['', [Validators.required]],
      recipientEmail: ['', [Validators.required, Validators.email]],
      amount: [20, [Validators.required, Validators.min(5), Validators.max(500)]],
      customAmount: [null, [Validators.min(5), Validators.max(500)]],
      message: ['', [Validators.maxLength(200)]],
      occasion: ['Birthday', [Validators.required]],
      design: ['', [Validators.required]]
    });
  }
  
  /**
   * Selects a gift card amount
   */
  selectAmount(amount: number) {
    this.showCustomAmount = false;
    this.giftCardForm.get('amount')?.setValue(amount);
  }
  
  /**
   * Toggles custom amount input
   */
  toggleCustomAmount() {
    this.showCustomAmount = !this.showCustomAmount;
    
    if (this.showCustomAmount) {
      this.giftCardForm.get('customAmount')?.setValue(this.giftCardForm.get('amount')?.value);
    } else {
      this.giftCardForm.get('amount')?.setValue(20); // Default amount
    }
  }
  
  /**
   * Updates the amount when custom amount changes
   */
  onCustomAmountChange() {
    const customAmount = this.giftCardForm.get('customAmount')?.value;
    
    if (customAmount !== null && customAmount >= 5 && customAmount <= 500) {
      this.giftCardForm.get('amount')?.setValue(customAmount);
    }
  }
  
  /**
   * Selects a template design
   */
  selectTemplate(template: GiftCardTemplate) {
    this.selectedTemplate = template;
    this.giftCardForm.get('design')?.setValue(template.id);
    
    // If template has a specific occasion, auto-select it
    if (template.occasions && template.occasions.length === 1 && template.occasions[0] !== 'any') {
      const occasion = template.occasions[0];
      this.giftCardForm.get('occasion')?.setValue(
        occasion.charAt(0).toUpperCase() + occasion.slice(1)
      );
    }
  }
  
  /**
   * Handles form submission
   */
  async onSubmit() {
    if (this.giftCardForm.invalid) {
      // Mark all fields as touched to show validation errors
      Object.keys(this.giftCardForm.controls).forEach(key => {
        const control = this.giftCardForm.get(key);
        control?.markAsTouched();
      });
      
      return;
    }
    
    const loading = await this.loadingController.create({
      message: 'Creating gift card...'
    });
    await loading.present();
    
    this.isSubmitting = true;
    
    // Get form values
    const formValues = this.giftCardForm.value;
    
    // Use actual amount (either standard or custom)
    const amount = this.showCustomAmount ? formValues.customAmount : formValues.amount;
    
    // Create gift card
    this.giftCardService.createGiftCard({
      recipientName: formValues.recipientName,
      recipientEmail: formValues.recipientEmail,
      amount,
      initialAmount: amount,
      message: formValues.message,
      occasion: formValues.occasion,
      design: formValues.design,
      createdDate: new Date(),
      expiryDate: this.getDefaultExpiryDate(),
      // These fields will be set by the service but TypeScript requires them
      senderId: 'temp', // Will be replaced by service
      redeemedBy: null,
      redeemedDate: null
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: async (giftCardId) => {
          this.isSubmitting = false;
          loading.dismiss();
          
          const alert = await this.alertController.create({
            header: 'Gift Card Created!',
            message: `Your gift card has been created and sent to ${formValues.recipientName}.`,
            buttons: [{
              text: 'OK',
              handler: () => {
                this.router.navigate(['/gift-cards', giftCardId]);
              }
            }]
          });
          
          await alert.present();
        },
        error: async (error) => {
          this.isSubmitting = false;
          loading.dismiss();
          
          const toast = await this.toastController.create({
            message: `Failed to create gift card: ${error.message}`,
            duration: 3000,
            color: 'danger'
          });
          
          await toast.present();
        }
      });
  }
  
  /**
   * Moves to the next step in the gift card creation process
   */
  nextStep() {
    // Validate current step
    if (this.currentStep === 1) {
      // Validate recipient info
      const recipientName = this.giftCardForm.get('recipientName');
      const recipientEmail = this.giftCardForm.get('recipientEmail');
      
      recipientName!.markAsTouched();
      recipientEmail!.markAsTouched();
      
      if (recipientName?.invalid || recipientEmail?.invalid) {
        return;
      }
    } else if (this.currentStep === 2) {
      // Validate amount
      const amount = this.giftCardForm.get('amount');
      
      if (this.showCustomAmount) {
        const customAmount = this.giftCardForm.get('customAmount');
        customAmount?.markAsTouched();
        
        if (customAmount?.invalid) {
          return;
        }
      } else if (amount?.invalid) {
        amount?.markAsTouched();
        return;
      }
    } else if (this.currentStep === 3) {
      // Validate design
      const design = this.giftCardForm.get('design');
      
      if (design?.invalid) {
        design.markAsTouched();
        return;
      }
    }
    
    if (this.currentStep < this.totalSteps) {
      this.currentStep++;
    }
  }
  
  /**
   * Moves to the previous step in the gift card creation process
   */
  previousStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }
  
  /**
   * Gets validation error message for a form control
   */
  getErrorMessage(controlName: string): string {
    const control = this.giftCardForm.get(controlName);
    
    if (!control || !control.errors || !control.touched) {
      return '';
    }
    
    if (control.errors['required']) {
      return 'This field is required';
    }
    
    if (control.errors['email']) {
      return 'Please enter a valid email address';
    }
    
    if (control.errors['min']) {
      return `Minimum value is ${control.errors['min'].min}`;
    }
    
    if (control.errors['max']) {
      return `Maximum value is ${control.errors['max'].max}`;
    }
    
    if (control.errors['maxlength']) {
      return `Maximum length is ${control.errors['maxlength'].requiredLength} characters`;
    }
    
    return 'Invalid value';
  }
  
  /**
   * Gets a default expiry date (1 year from now)
   */
  private getDefaultExpiryDate(): Date {
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    return expiryDate;
  }
}