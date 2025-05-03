// src/app/core/services/auth.service.ts
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { 
  Auth,
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  User,
  UserCredential,
  GoogleAuthProvider,
  signInWithPopup,
  getAdditionalUserInfo,
  updateEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  authState
} from '@angular/fire/auth';
import { 
  Firestore, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  getDocs
} from '@angular/fire/firestore';
import { BehaviorSubject, Observable, from, of, throwError } from 'rxjs';
import { map, switchMap, catchError, tap, shareReplay } from 'rxjs/operators';
import { ToastController } from '@ionic/angular/standalone';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private user = new BehaviorSubject<User | null>(null);
  user$ = this.user.asObservable();
  
  // Add a public currentUser property that provides easy access to the current user
  public currentUser: User | null = null;
  
  private userProfile = new BehaviorSubject<any>(null);
  userProfile$ = this.userProfile.asObservable();
  
  // Cache the auth state to avoid multiple subscriptions
  private authState$ = authState(this.auth).pipe(
    shareReplay(1)
  );
  
  constructor(
    public auth: Auth,
    private firestore: Firestore,
    private router: Router,
    private toastController: ToastController
  ) {
    // Initialize auth state listener
    this.authState$.subscribe((user) => {
      this.user.next(user);
      // Update the currentUser property
      this.currentUser = user;
      
      if (user) {
        this.getUserProfile(user.uid).then(profile => {
          this.userProfile.next(profile);
        });
      } else {
        this.userProfile.next(null);
      }
    });
  }

  // Register with email/password
 // In auth.service.ts, update the register method
async register(email: string, password: string, displayName: string, role: string = 'customer'): Promise<any> {
  try {
    const credential = await createUserWithEmailAndPassword(this.auth, email, password);
    
    // Update display name
    if (credential.user) {
      await updateProfile(credential.user, { displayName });
      await sendEmailVerification(credential.user);
      
      // Create user profile in Firestore with role
      await this.createUserProfile(credential.user, displayName, role);
      
      // Initialize loyalty program
      await this.initializeLoyaltyProgram(credential.user.uid);
      
      // Initialize nutrition tracking
      await this.initializeNutritionTracking(credential.user.uid);
      
      this.showToast('Registration successful! Please verify your email.');
      return credential.user;
    }
  } catch (error: any) {
    this.showToast(`Registration failed: ${error.message}`);
    throw error;
  }
}

  // Login with email/password
  async login(email: string, password: string): Promise<any> {
    try {
      const credential = await signInWithEmailAndPassword(this.auth, email, password);
      if (credential.user) {
        this.showToast('Login successful!');
        this.router.navigate(['/home']);
        return credential.user;
      }
    } catch (error: any) {
      this.showToast(`Login failed: ${error.message}`);
      throw error;
    }
  }

  // Login with Google
  // In auth.service.ts, update the loginWithGoogle method
async loginWithGoogle(role: string = 'customer'): Promise<any> {
  try {
    const provider = new GoogleAuthProvider();
    const credential = await signInWithPopup(this.auth, provider);
    
    // Check if this is a new user
    const isNewUser = getAdditionalUserInfo(credential)?.isNewUser;
    
    if (isNewUser && credential.user) {
      // Create user profile with role
      await this.createUserProfile(credential.user, credential.user.displayName || 'User', role);
      
      // Initialize loyalty program
      await this.initializeLoyaltyProgram(credential.user.uid);
      
      // Initialize nutrition tracking
      await this.initializeNutritionTracking(credential.user.uid);
    }
    
    this.showToast('Google login successful!');
    this.router.navigate(['/home']);
    return credential.user;
  } catch (error: any) {
    this.showToast(`Google login failed: ${error.message}`);
    throw error;
  }
}

  // Logout
  async logout(): Promise<void> {
    try {
      await signOut(this.auth);
      this.router.navigate(['/auth/login']);
      this.showToast('Logged out successfully');
    } catch (error: any) {
      this.showToast(`Logout failed: ${error.message}`);
      throw error;
    }
  }

  // Password reset
  async forgotPassword(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(this.auth, email);
      this.showToast('Password reset email sent. Check your inbox.');
    } catch (error: any) {
      this.showToast(`Password reset failed: ${error.message}`);
      throw error;
    }
  }

  // Send email verification
  async sendEmailVerification(user: User): Promise<void> {
    try {
      await sendEmailVerification(user);
      this.showToast('Verification email sent successfully!');
    } catch (error: any) {
      this.showToast(`Failed to send verification email: ${error.message}`);
      throw error;
    }
  }
  
  // Get current user
  getCurrentUser(): Promise<User | null> {
    return new Promise((resolve) => {
      const unsubscribe = this.auth.onAuthStateChanged((user) => {
        unsubscribe();
        resolve(user);
      });
    });
  }
  
  // Update profile
  async updateProfile(user: User, profileData: Partial<{ displayName: string; photoURL: string }>): Promise<void> {
    try {
      await updateProfile(user, profileData);
      this.showToast('Profile updated successfully!');
    } catch (error: any) {
      this.showToast(`Failed to update profile: ${error.message}`);
      throw error;
    }
  }
  
  // Update email
  async updateEmail(user: User, newEmail: string, password: string): Promise<void> {
    try {
      // Reauthenticate user
      const credential = EmailAuthProvider.credential(user.email!, password);
      await reauthenticateWithCredential(user, credential);
      
      // Update email
      await updateEmail(user, newEmail);
      
      // Send verification email
      await sendEmailVerification(user);
      
      this.showToast('Email updated. Please verify your new email address.');
    } catch (error: any) {
      if (error.code === 'auth/wrong-password') {
        this.showToast('Incorrect password. Please try again.');
      } else {
        this.showToast(`Failed to update email: ${error.message}`);
      }
      throw error;
    }
  }
  
  // Update password
  async updatePassword(user: User, currentPassword: string, newPassword: string): Promise<void> {
    try {
      // Reauthenticate user
      const credential = EmailAuthProvider.credential(user.email!, currentPassword);
      await reauthenticateWithCredential(user, credential);
      
      // Update password
      await updatePassword(user, newPassword);
      
      this.showToast('Password updated successfully!');
    } catch (error: any) {
      if (error.code === 'auth/wrong-password') {
        this.showToast('Current password is incorrect. Please try again.');
      } else {
        this.showToast(`Failed to update password: ${error.message}`);
      }
      throw error;
    }
  }

  // Create user profile in Firestore
 // In auth.service.ts, update the createUserProfile method
async createUserProfile(user: User, displayName: string, role: string = 'customer'): Promise<void> {
  const userRef = doc(this.firestore, `users/${user.uid}`);
  const userData = {
    uid: user.uid,
    email: user.email,
    displayName: displayName,
    photoURL: user.photoURL,
    createdAt: new Date(),
    lastLogin: new Date(),
    role: role, // Add this line to set the role
    preferences: {
      favoriteOrder: [],
      defaultStore: '',
      dietaryRestrictions: [],
      sugarPreference: 3, // Default value (0-5)
      caffeinePreference: 3 // Default value (0-5)
    },
    marketingPrefs: {
      emailNotifications: true,
      pushNotifications: true,
      smsNotifications: false
    }
  };
  
  await setDoc(userRef, userData);
}

  // Get user profile from Firestore
  async getUserProfile(uid: string): Promise<any> {
    const userRef = doc(this.firestore, `users/${uid}`);
    const docSnap = await getDoc(userRef);
    
    if (docSnap.exists()) {
      // Update last login time
      await updateDoc(userRef, { lastLogin: new Date() });
      return docSnap.data();
    } else {
      console.log('No user profile found!');
      return null;
    }
  }
  
  // Update user profile in Firestore
  async updateUserProfile(uid: string, data: any): Promise<void> {
    try {
      const userRef = doc(this.firestore, `users/${uid}`);
      await updateDoc(userRef, {
        ...data,
        updatedAt: new Date()
      });
    } catch (error: any) {
      this.showToast(`Failed to update profile data: ${error.message}`);
      throw error;
    }
  }

  // Initialize loyalty program
  private async initializeLoyaltyProgram(uid: string): Promise<void> {
    const loyaltyRef = doc(this.firestore, `userLoyalty/${uid}`);
    
    // Set tier expiry date to one year from now
    const tierExpiryDate = new Date();
    tierExpiryDate.setFullYear(tierExpiryDate.getFullYear() + 1);
    
    await setDoc(loyaltyRef, {
      userId: uid,
      points: 50, // Welcome bonus
      totalPointsEarned: 50,
      tier: 'bronze',
      tierExpiryDate,
      nextTierProgress: 0, // Progress to next tier (percentage)
      lastPointsEarnedDate: new Date(),
      history: [{
        id: this.generateId(),
        date: new Date(),
        orderId: null,
        points: 50,
        type: 'earned',
        description: 'Sign Up Bonus'
      }],
      rewards: [],
      monthlyCoffeeCount: 0,
      streakDays: 0,
      lastStreakDate: new Date()
    });
  }

  // Initialize nutrition tracking
  private async initializeNutritionTracking(uid: string): Promise<void> {
    const nutritionRef = doc(this.firestore, `userNutrition/${uid}`);
    
    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];
    
    await setDoc(nutritionRef, {
      userId: uid,
      dailyIntake: {
        [today]: {
          calories: 0,
          sugar: 0,
          caffeine: 0,
          fat: 0,
          protein: 0,
          waterIntake: 0
        }
      },
      nutritionGoals: {
        maxDailyCaffeine: 400, // Default 400mg (FDA recommendation)
        maxDailySugar: 50,     // Default 50g
        maxDailyCalories: 2000 // Default 2000 calories
      },
      allergies: [],
      preferredAlternatives: {
        milk: '',
        sweetener: ''
      }
    });
  }
  // src/app/core/services/auth.service.ts

// Add to the existing AuthService class
  
// Check user role
getUserRole(): Observable<string> {
  return this.userProfile$.pipe(
    map(profile => profile?.role || 'customer')
  );
}

// Check if user is staff
isStaff(): Observable<boolean> {
  return this.getUserRole().pipe(
    map(role => role === 'staff' || role === 'admin')
  );
}

// Check if user is admin
isAdmin(): Observable<boolean> {
  return this.getUserRole().pipe(
    map(role => role === 'admin')
  );
}

// Redirect based on role
async redirectBasedOnRole() {
  const user = await this.getCurrentUser();
  if (!user) {
    this.router.navigate(['/auth/login']);
    return;
  }

  const profile = await this.getUserProfile(user.uid);
  const role = profile?.role || 'customer';

  if (role === 'staff' || role === 'admin') {
    this.router.navigate(['/staff/dashboard']);
  } else {
    this.router.navigate(['/home']);
  }
}

  // Get current auth state
  getAuthState(): Observable<User | null> {
    return this.authState$;
  }

  // Check if user is logged in
  isLoggedIn(): Observable<boolean> {
    return this.authState$.pipe(
      map(user => !!user)
    );
  }

  // Check if email is verified
  isEmailVerified(): Observable<boolean> {
    return this.authState$.pipe(
      map(user => !!user?.emailVerified)
    );
  }
  
  // Generate a unique ID
  private generateId(): string {
    return Math.random().toString(36).substring(2, 15) + 
      Math.random().toString(36).substring(2, 15);
  }

  // Helper to show toast messages
  private async showToast(message: string): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      position: 'bottom',
      color: 'dark'
    });
    await toast.present();
  }
  
}