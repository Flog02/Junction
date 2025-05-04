import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { 
  IonContent, 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonButton, 
  IonItem, 
  IonInput, 
  IonLabel, 
  IonIcon, 
  IonList, 
  IonAvatar, 
  IonSpinner,
  IonCard, 
  IonCardContent, 
  IonCardHeader, 
  IonCardTitle, 
  IonToggle, 
  IonSelect, 
  IonSelectOption,
  IonButtons,
  IonBackButton,
  IonBadge,
  AlertController,
  ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  personOutline, 
  mailOutline, 
  cameraOutline, 
  lockClosedOutline, 
  logOutOutline,
  calendarOutline,
  ribbonOutline,
  settingsOutline,
  notificationsOutline,
  heartOutline,
  imageOutline,
  keyOutline, pencilOutline, closeOutline, checkmarkOutline, diamondOutline, giftOutline, shieldCheckmarkOutline, shieldOutline, checkmarkCircleOutline, phonePortraitOutline, chatboxOutline, cafeOutline, nutritionOutline, flashOutline, saveOutline } from 'ionicons/icons';
import { User } from '@angular/fire/auth';
import { take } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { RoleManagementComponent } from './role-management/role-management.component';
@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: true,
  imports: [
    RoleManagementComponent,
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButton,
    IonItem,
    IonInput,
    IonLabel,
    IonIcon,
    IonList,
    IonAvatar,
    IonSpinner,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    IonToggle,
    IonSelect,
    IonSelectOption,
    IonButtons,
    IonBackButton
]
})
export class ProfilePage implements OnInit {
  profileForm: FormGroup;
  securityForm: FormGroup;
  preferencesForm: FormGroup;
  
  user: User | null = null;
  userProfile: any = null;
  isAdmin = false;

  isLoading = true;
  isEditing = false;
  activeTab = 'profile'; // 'profile', 'security', 'preferences'
  
  constructor(
    public authService: AuthService, // Changed from private to public
    private formBuilder: FormBuilder,
    private router: Router,
    private alertController: AlertController,
    private toastController: ToastController
  ) {
    addIcons({logOutOutline,ribbonOutline,personOutline,lockClosedOutline,settingsOutline,pencilOutline,imageOutline,closeOutline,checkmarkOutline,mailOutline,calendarOutline,diamondOutline,giftOutline,shieldCheckmarkOutline,keyOutline,shieldOutline,checkmarkCircleOutline,notificationsOutline,phonePortraitOutline,chatboxOutline,cafeOutline,nutritionOutline,flashOutline,saveOutline,cameraOutline,heartOutline});
    
    // Initialize forms
    this.profileForm = this.formBuilder.group({
      displayName: ['', Validators.required],
      photoURL: ['']
    });
    
    this.securityForm = this.formBuilder.group({
      email: [{ value: '', disabled: true }],
      currentPassword: ['', [Validators.required, Validators.minLength(6)]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]]
    });
    
    this.preferencesForm = this.formBuilder.group({
      emailNotifications: [true],
      pushNotifications: [true],
      smsNotifications: [false],
      dietaryRestrictions: [[]],
      sugarPreference: [3],
      caffeinePreference: [3]
    });
  }

  ngOnInit() {
    // Load user data
    this.authService.isAdmin().subscribe(isAdmin => {
      this.isAdmin = isAdmin;
    });
  
    this.loadUserData();
  }
  
  loadUserData() {
    this.isLoading = true;
    
    this.authService.getAuthState().pipe(take(1)).subscribe(user => {
      this.user = user;
      if (user) {
        this.securityForm.patchValue({
          email: user.email
        });
      }
    });
    
    this.authService.userProfile$.pipe(take(1)).subscribe(profile => {
      this.userProfile = profile;
      
      if (profile) {
        // Patch profile form values
        this.profileForm.patchValue({
          displayName: profile.displayName,
          photoURL: profile.photoURL || ''
        });
        
        // Patch preferences form
        if (profile.marketingPrefs) {
          this.preferencesForm.patchValue({
            emailNotifications: profile.marketingPrefs.emailNotifications,
            pushNotifications: profile.marketingPrefs.pushNotifications,
            smsNotifications: profile.marketingPrefs.smsNotifications
          });
        }
        
        if (profile.preferences) {
          this.preferencesForm.patchValue({
            dietaryRestrictions: profile.preferences.dietaryRestrictions || [],
            sugarPreference: profile.preferences.sugarPreference || 3,
            caffeinePreference: profile.preferences.caffeinePreference || 3
          });
        }
      }
      
      this.isLoading = false;
    });
  }

  toggleEdit() {
    this.isEditing = !this.isEditing;
    if (!this.isEditing) {
      // Reset form if canceling edit
      this.profileForm.patchValue({
        displayName: this.userProfile.displayName,
        photoURL: this.userProfile.photoURL || ''
      });
    }
  }

  async saveProfile() {
    if (this.profileForm.valid && this.user) {
      this.isLoading = true;
      try {
        const { displayName, photoURL } = this.profileForm.value;
        
        // Update auth profile
        await this.authService.updateProfile(this.user, { displayName, photoURL });
        
        // Update Firestore profile
        await this.authService.updateUserProfile(this.user.uid, { displayName, photoURL });
        
        this.isEditing = false;
        this.showToast('Profile updated successfully!');
      } catch (error: any) {
        this.showToast(`Failed to update profile: ${error.message}`);
      } finally {
        this.isLoading = false;
      }
    }
  }
  
  async changeEmail() {
    const alert = await this.alertController.create({
      header: 'Change Email',
      inputs: [
        {
          name: 'email',
          type: 'email',
          placeholder: 'New email address'
        },
        {
          name: 'password',
          type: 'password',
          placeholder: 'Current password'
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Update',
          handler: async (data) => {
            if (!data.email || !data.password) {
              this.showToast('Please fill in all fields');
              return false; // prevent alert from closing
            }
          
            try {
              this.isLoading = true;
          
              if (this.user) {
                await this.authService.updateEmail(this.user, data.email, data.password);
                await this.authService.updateUserProfile(this.user.uid, { email: data.email });
          
                this.showToast('Email updated. Please verify your new email address.');
                return true; // close alert
              }
            } catch (error) {
              // Handle or log error if needed
              return false; // prevent alert from closing
            } finally {
              this.isLoading = false;
            }
          
            return false; // fallback if this.user is null
          }
          
        }
      ]
    });
    
    await alert.present();
  }
  
  async changePassword() {
    if (this.securityForm.valid && this.user) {
      this.isLoading = true;
      try {
        const { currentPassword, newPassword } = this.securityForm.value;
        
        await this.authService.updatePassword(this.user, currentPassword, newPassword);
        
        // Reset password fields
        this.securityForm.patchValue({
          currentPassword: '',
          newPassword: ''
        });
        
        this.showToast('Password updated successfully!');
      } catch (error) {
        // Error is handled in authService
      } finally {
        this.isLoading = false;
      }
    } else {
      this.showToast('Please fill in all required fields');
    }
  }
  
  async savePreferences() {
    if (this.preferencesForm.valid && this.user) {
      this.isLoading = true;
      try {
        const { 
          emailNotifications, 
          pushNotifications, 
          smsNotifications,
          dietaryRestrictions,
          sugarPreference,
          caffeinePreference
        } = this.preferencesForm.value;
        
        // Update Firestore profile
        await this.authService.updateUserProfile(this.user.uid, {
          marketingPrefs: {
            emailNotifications,
            pushNotifications,
            smsNotifications
          },
          preferences: {
            ...this.userProfile.preferences,
            dietaryRestrictions,
            sugarPreference,
            caffeinePreference
          }
        });
        
        this.showToast('Preferences updated successfully!');
      } catch (error: any) {
        this.showToast(`Failed to update preferences: ${error.message}`);
      } finally {
        this.isLoading = false;
      }
    }
  }

  async logout() {
    const alert = await this.alertController.create({
      header: 'Logout',
      message: 'Are you sure you want to logout?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Logout',
          handler: async () => {
            try {
              await this.authService.logout();
              this.router.navigate(['/home']);
            } catch (error) {
              console.error('Logout failed:', error);
            }
          }
        }
      ]
    });
    
    await alert.present();
  }
  
  setActiveTab(tab: string) {
    this.activeTab = tab;
  }
  // Add this method to the ProfilePage class

async resendVerificationEmail() {
    if (this.user) {
      try {
        this.isLoading = true;
        await this.authService.sendEmailVerification(this.user);
        this.showToast('Verification email sent. Please check your inbox.');
      } catch (error: any) {
        this.showToast(`Failed to send verification email: ${error.message}`);
      } finally {
        this.isLoading = false;
      }
    }
  }
  private async showToast(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      position: 'bottom',
      color: 'dark'
    });
    await toast.present();
  }
}