// src/app/core/models/user.model.ts

export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  phoneNumber: string;
  registrationDate: Date;
  lastActive: Date;
  role?: 'customer' | 'staff' | 'admin'; // Added role field
  preferences: {
    favoriteOrder: string[];
    defaultStore: string;
    dietaryRestrictions: string[];
    sugarPreference: number;
    caffeinePreference: number;
  };
  marketingPrefs: {
    emailNotifications: boolean;
    pushNotifications: boolean;
    smsNotifications: boolean;
  };
}