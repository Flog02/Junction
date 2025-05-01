// src/app/features/auth/verify-email/verify-email.page.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { 
  IonContent, 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonButton, 
  IonIcon, 
  IonGrid, 
  IonRow, 
  IonCol,
  IonCard,
  IonCardContent,
  IonButtons,
  IonBackButton
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { mailOutline, checkmarkCircleOutline, homeOutline } from 'ionicons/icons';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-verify-email',
  templateUrl: './verify-email.page.html',
  styleUrls: ['./verify-email.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButton,
    IonIcon,
    IonGrid,
    IonRow,
    IonCol,
    IonCard,
    IonCardContent,
    IonButtons,
    IonBackButton
  ]
})
export class VerifyEmailPage implements OnInit {
  email: string | null = null;
  
  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    addIcons({ mailOutline, checkmarkCircleOutline, homeOutline });
  }

  ngOnInit() {
    this.authService.getAuthState().subscribe(user => {
      if (user) {
        this.email = user.email;
      } else {
        this.router.navigate(['/auth/login']);
      }
    });
  }

  goHome() {
    this.router.navigate(['/home']);
  }

  async resendVerificationEmail() {
    try {
      const user = await this.authService.getCurrentUser();
      if (user) {
        await this.authService.sendEmailVerification(user);
        this.showToast('Verification email sent. Please check your inbox.');
      }
    } catch (error: any) {
      this.showToast(`Failed to send verification email: ${error.message}`);
    }
  }

  private async showToast(message: string) {
    // Implementation to show a toast message
    console.log(message);
  }
}