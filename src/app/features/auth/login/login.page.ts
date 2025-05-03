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

// Updated login.page.ts with enhanced logging

async onSubmit() {
  if (this.loginForm.valid) {
    this.isLoading = true;
    try {
      const { email, password } = this.loginForm.value;
      
      console.log('🔐 Login attempt:', email);
      console.log('🔄 Is Staff Mode:', this.isStaffMode);
      
      // Log in the user
      const user = await this.authService.login(email, password);
      console.log('👤 User logged in successfully:', user.uid);
      
      if (this.isStaffMode) {
        console.log('🔍 Checking staff privileges for user:', user.uid);
        
        // Get the user profile to check role
        // Add a retry mechanism with delay to ensure Firestore data is loaded
        let attempts = 0;
        let userProfile = null;
        
        while (attempts < 3 && !userProfile) {
          try {
            console.log(`🔄 Profile fetch attempt ${attempts + 1}`);
            userProfile = await this.authService.getUserProfile(user.uid);
            console.log('📋 Profile data:', userProfile);
            
            if (!userProfile) {
              console.log('⏳ Profile not found, waiting before retry...');
              // Wait 500ms before trying again
              await new Promise(resolve => setTimeout(resolve, 500));
            }
          } catch (error) {
            console.error('❌ Error fetching profile:', error);
          }
          attempts++;
        }
        
        // Now check if the profile exists and has a staff role
        if (userProfile) {
          console.log('🔑 User role:', userProfile.role);
          
          if (userProfile.role === 'staff' || userProfile.role === 'admin') {
            console.log('✅ Staff privileges confirmed, redirecting to staff dashboard');
            // Navigate directly to staff dashboard
            this.router.navigate(['/staff/dashboard']);
          } else {
            console.log('⛔ Not a staff account. Current role:', userProfile.role);
            // User doesn't have staff role
            this.showError('Access denied: You do not have staff privileges');
            await this.authService.logout(); // Log them out
          }
        } else {
          console.error('❌ Failed to fetch user profile after multiple attempts');
          this.showError('Could not verify staff privileges. Please try again.');
          await this.authService.logout();
        }
      } else {
        console.log('🏠 Regular customer login, redirecting to:', this.returnUrl);
        // Regular customer login - go to home or return URL
        this.router.navigateByUrl(this.returnUrl);
      }
    } catch (error:any) {
      console.error('❌ Login error:', error);
      this.showError('Login failed: ' + (error.message || 'Please check your credentials'));
    } finally {
      this.isLoading = false;
    }
  } else {
    console.log('📝 Form validation failed');
    this.loginForm.markAllAsTouched();
  }
}

async loginWithGoogle() {
  this.isLoading = true;
  try {
    console.log('🔐 Google login attempt');
    console.log('🔄 Is Staff Mode:', this.isStaffMode);
    
    const result = await this.authService.loginWithGoogle();
    console.log('👤 Google login successful for user:', result.uid);
    
    if (this.isStaffMode) {
      console.log('🔍 Checking staff privileges for Google user:', result.uid);
      
      // Add retry mechanism for Google login too
      let attempts = 0;
      let userProfile = null;
      
      while (attempts < 3 && !userProfile) {
        try {
          console.log(`🔄 Profile fetch attempt ${attempts + 1} for Google user`);
          userProfile = await this.authService.getUserProfile(result.uid);
          console.log('📋 Google user profile data:', userProfile);
          
          if (!userProfile) {
            console.log('⏳ Profile not found, waiting before retry...');
            // Wait 500ms before trying again
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        } catch (error) {
          console.error('❌ Error fetching profile after Google login:', error);
        }
        attempts++;
      }
      
      // Check if user has staff or admin role
      if (userProfile) {
        console.log('🔑 Google user role:', userProfile.role);
        
        if (userProfile.role === 'staff' || userProfile.role === 'admin') {
          console.log('✅ Staff privileges confirmed for Google user, redirecting to staff dashboard');
          // Navigate directly to staff dashboard
          this.router.navigate(['/staff/dashboard']);
        } else {
          console.log('⛔ Not a staff account. Current role:', userProfile.role);
          // User doesn't have staff role
          this.showError('Access denied: You do not have staff privileges');
          await this.authService.logout(); // Log them out
        }
      } else {
        console.error('❌ Failed to fetch Google user profile after multiple attempts');
        this.showError('Could not verify staff privileges. Please try again.');
        await this.authService.logout();
      }
    } else {
      console.log('🏠 Regular Google user login, redirecting to:', this.returnUrl);
      // Regular customer login - go to home or return URL
      this.router.navigateByUrl(this.returnUrl);
    }
  } catch (error:any) {
    console.error('❌ Google login error:', error);
    this.showError('Google login failed: ' + (error.message || 'Authentication error'));
  } finally {
    this.isLoading = false;
  }
}

private showError(message: string) {
  console.error(message);
  
  // Use the toast controller for a better UX
  this.authService.showToast(message);
}
// src/app/features/auth/login/login.page.ts





  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  forgotPassword() {
    this.router.navigate(['/auth/forgot-password']);
  }
}