// src/app/features/gift-cards/gift-card-redeemer/gift-card-redeemer.component.ts

import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { CommonModule } from '@angular/common';
import { IonNote,IonList,IonItem,IonBackButton,IonButtons,IonSpinner,IonProgressBar,IonButton,IonSegment,IonSegmentButton,IonLabel,IonHeader,IonIcon,IonToolbar,IonTitle,IonContent,IonCard,IonCardHeader,IonCardTitle,IonCardSubtitle,IonCardContent } from '@ionic/angular/standalone';

import { GiftCardService } from '../../../core/services/gift-card.service';
import { LoadingController, ToastController } from '@ionic/angular/standalone';

@Component({
  selector: 'app-gift-card-redeemer',
  template: `<ion-header>
  <ion-toolbar>
    <ion-buttons slot="start">
      <ion-back-button defaultHref="/gift-cards"></ion-back-button>
    </ion-buttons>
    <ion-title>Redeem Gift Card</ion-title>
  </ion-toolbar>
</ion-header>

<ion-content class="ion-padding">
  <form [formGroup]="redeemForm" (ngSubmit)="onSubmit()">
    <h2 class="step-title">Enter Your Gift Card Code</h2>
    <p class="step-description">
      Type in your 19-character gift card code to redeem it.
    </p>

    <ion-item>
      <ion-label position="stacked">Gift Card Code</ion-label>
      <ion-input
        formControlName="code"
        placeholder="XXXX-XXXX-XXXX-XXXX-XXX"
        (ionInput)="formatCode($event)"
        maxlength="23"
      >
      </ion-input>
      <ion-note
        slot="error"
        *ngIf="
          redeemForm.get('code')?.touched && redeemForm.get('code')?.invalid
        "
      >
        Code must be exactly 19 characters.
      </ion-note>
    </ion-item>

    <ion-button
      type="submit"
      expand="block"
      class="ion-margin-top"
      [disabled]="redeemForm.invalid || isSubmitting"
    >
      Redeem Now
      <ion-icon name="card" slot="end"></ion-icon>
    </ion-button>
  </form>
</ion-content>
`,
//   styleUrls: ['./gift-card-redeemer.component.scss'],
  standalone: true,
  imports: [CommonModule,IonItem,IonBackButton,IonButtons, ReactiveFormsModule,IonNote,IonList,IonSpinner,IonProgressBar,IonButton,IonSegment,IonSegmentButton,IonLabel,IonHeader,IonIcon,IonToolbar,IonTitle,IonContent,IonCard,IonCardHeader,IonCardTitle,IonCardSubtitle,IonCardContent]
})
export class GiftCardRedeemerComponent implements OnInit, OnDestroy {
  redeemForm: FormGroup;
  isSubmitting = false;
  
  private destroy$ = new Subject<void>();
  
  constructor(
    private formBuilder: FormBuilder,
    private giftCardService: GiftCardService,
    private router: Router,
    private loadingController: LoadingController,
    private toastController: ToastController
  ) {
    this.redeemForm = this.createRedeemForm();
  }
  
  ngOnInit() {}
  
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  /**
   * Creates the redeem form
   */
  createRedeemForm(): FormGroup {
    return this.formBuilder.group({
      code: ['', [Validators.required, Validators.minLength(19), Validators.maxLength(19)]]
    });
  }
  
  /**
   * Formats the gift card code as it's typed
   */
  formatCode(event: any) {
    let code = event.target.value.toUpperCase();
    
    // Remove all non-alphanumeric characters
    code = code.replace(/[^A-Z0-9]/g, '');
    
    // Add dashes after every 4 characters
    let formattedCode = '';
    for (let i = 0; i < code.length; i++) {
      if (i > 0 && i % 4 === 0) {
        formattedCode += '-';
      }
      formattedCode += code[i];
    }
    
    // Update the form value without triggering another change event
    this.redeemForm.get('code')?.setValue(formattedCode, { emitEvent: false });
  }
  
  /**
   * Handles form submission
   */
  async onSubmit() {
    if (this.redeemForm.invalid) {
      // Mark all fields as touched to show validation errors
      Object.keys(this.redeemForm.controls).forEach(key => {
        const control = this.redeemForm.get(key);
        control?.markAsTouched();
      });
      
      return;
    }
    
    const loading = await this.loadingController.create({
      message: 'Redeeming gift card...'
    });
    await loading.present();
    
    this.isSubmitting = true;
    
    // Get form values
    const code = this.redeemForm.value.code;
    
    // Redeem gift card
    this.giftCardService.redeemGiftCard(code)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: async (giftCard) => {
          this.isSubmitting = false;
          loading.dismiss();
          
          const toast = await this.toastController.create({
            message: `Successfully redeemed $${giftCard.amount} gift card!`,
            duration: 3000,
            color: 'success'
          });
          
          await toast.present();
          
          // Navigate to the gift card details
          this.router.navigate(['/gift-cards', giftCard.id]);
        },
        error: async (error) => {
          this.isSubmitting = false;
          loading.dismiss();
          
          const toast = await this.toastController.create({
            message: `Failed to redeem gift card: ${error.message}`,
            duration: 3000,
            color: 'danger'
          });
          
          await toast.present();
        }
      });
  }
}