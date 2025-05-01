// src/app/features/auth/forgot-password/forgot-password.page.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { 
  IonContent, 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonButton, 
  IonItem, 
  IonLabel, 
  IonInput, 
  IonIcon, 
  IonGrid, 
  IonRow, 
  IonCol,
  IonSpinner,
  IonCard,
  IonCardContent,
  IonButtons,
  IonBackButton
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { mailOutline, arrowBackOutline } from 'ionicons/icons';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.page.html',
  styleUrls: ['./forgot-password.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButton,
    IonItem,
    IonLabel,
    IonInput,
    IonIcon,
    IonGrid,
    IonRow,
    IonCol,
    IonSpinner,
    IonCard,
    IonCardContent,
    IonButtons,
    IonBackButton
  ]
})
export class ForgotPasswordPage {
  resetForm: FormGroup;
  isLoading = false;
  emailSent = false;
  
  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService
  ) {
    addIcons({ mailOutline, arrowBackOutline });
    
    this.resetForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  async onSubmit() {
    if (this.resetForm.valid) {
      this.isLoading = true;
      try {
        const { email } = this.resetForm.value;
        await this.authService.forgotPassword(email);
        this.emailSent = true;
      } catch (error) {
        console.error('Password reset error:', error);
      } finally {
        this.isLoading = false;
      }
    } else {
      this.resetForm.markAllAsTouched();
    }
  }
}