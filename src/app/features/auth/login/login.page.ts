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
  IonBackButton, IonSegmentButton } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { logoGoogle, mailOutline, lockClosedOutline, eyeOutline, eyeOffOutline } from 'ionicons/icons';
import { AuthService } from '../../../core/services/auth.service';
import { FormsModule } from '@angular/forms';
import { NgModel } from '@angular/forms';
@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [IonSegmentButton, FormsModule,
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
  toggleStaffMode(isStaff: boolean) {
    this.isStaffMode = isStaff;
    document.documentElement.style.setProperty('--staff-mode', isStaff ? '1' : '0');
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

// src/app/features/auth/login/login.page.ts

// Add this property to your LoginPage class
isStaffMode = false;

// src/app/features/auth/login/login.page.ts

// Update the onSubmit method
async onSubmit() {
  if (this.loginForm.valid) {
    this.isLoading = true;
    try {
      const { email, password } = this.loginForm.value;
      
      // Log in the user
      const user = await this.authService.login(email, password);
      
      if (this.isStaffMode) {
        // Get the user profile to check role
        const userProfile = await this.authService.getUserProfile(user.uid);
        
        // Check if user has staff or admin role
        if (userProfile && (userProfile.role === 'staff' || userProfile.role === 'admin')) {
          // Navigate directly to staff dashboard
          this.router.navigate(['/staff/dashboard']);
        } else {
          // User doesn't have staff role
          this.showError('Access denied: You do not have staff privileges');
          this.authService.logout(); // Log them out
        }
      } else {
        // Regular customer login - go to home or return URL
        this.router.navigateByUrl(this.returnUrl);
      }
    } catch (error:any) {
      console.error('Login error:', error);
      this.showError('Login failed: ' + (error.message || 'Please check your credentials'));
    } finally {
      this.isLoading = false;
    }
  } else {
    this.loginForm.markAllAsTouched();
  }
}

// Add this helper method
private showError(message: string) {
  // You can implement this with a toast or alert
  console.error(message);
  // Example with alert:
  alert(message);
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