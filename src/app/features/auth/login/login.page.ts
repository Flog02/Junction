// src/app/features/auth/login/login.page.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
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
import { logoGoogle, mailOutline, lockClosedOutline, eyeOutline, eyeOffOutline } from 'ionicons/icons';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
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
export class LoginPage implements OnInit {
  loginForm: FormGroup;
  isLoading = false;
  showPassword = false;
  returnUrl: string = '/home';
  
  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    addIcons({ logoGoogle, mailOutline, lockClosedOutline, eyeOutline, eyeOffOutline });
    
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit() {
    // Get the return URL from route parameters or default to '/home'
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/home';
    
    // Check if user is already logged in
    this.authService.isLoggedIn().subscribe(loggedIn => {
      if (loggedIn) {
        this.router.navigateByUrl(this.returnUrl);
      }
    });
  }

  async onSubmit() {
    if (this.loginForm.valid) {
      this.isLoading = true;
      try {
        const { email, password } = this.loginForm.value;
        await this.authService.login(email, password);
        this.router.navigateByUrl(this.returnUrl);
      } catch (error) {
        console.error('Login error:', error);
      } finally {
        this.isLoading = false;
      }
    } else {
      this.loginForm.markAllAsTouched();
    }
  }

  async loginWithGoogle() {
    this.isLoading = true;
    try {
      await this.authService.loginWithGoogle();
      this.router.navigateByUrl(this.returnUrl);
    } catch (error) {
      console.error('Google login error:', error);
    } finally {
      this.isLoading = false;
    }
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  forgotPassword() {
    this.router.navigate(['/auth/forgot-password']);
  }
}