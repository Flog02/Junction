// src/app/core/services/role-tab.service.ts

import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { map } from 'rxjs/operators';

export interface TabConfig {
  path: string;
  label: string;
  icon: string;
  roles: string[];
}

@Injectable({
  providedIn: 'root'
})
export class RoleTabService {
  
  // Default tabs configuration - customize this based on your app's needs
  private tabsConfig: TabConfig[] = [
    { path: '/home', label: 'Home', icon: 'home-outline', roles: ['customer'] },
    { path: '/menu', label: 'Menu', icon: 'restaurant-outline', roles: ['customer'] },
    { path: '/order', label: 'Order', icon: 'cart-outline', roles: ['customer'] },
    { path: '/profile', label: 'Profile', icon: 'person-outline', roles: ['customer'] },
    { path: '/staff/dashboard', label: 'Dashboard', icon: 'grid-outline', roles: ['staff', 'admin'] },
    { path: '/staff/orders/queue', label: 'Orders', icon: 'cafe-outline', roles: ['staff', 'admin'] },
    { path: '/staff/orders/history', label: 'History', icon: 'time-outline', roles: ['staff', 'admin'] },
    { path: '/staff/tables/qr-generator', label: 'QR Codes', icon: 'qr-code-outline', roles: ['staff', 'admin'] }
  ];
  
  private visibleTabs = new BehaviorSubject<TabConfig[]>([]);
  visibleTabs$ = this.visibleTabs.asObservable();
  
  constructor(private authService: AuthService) {
    // Update tabs whenever the user's role changes
    this.authService.userProfile$.subscribe(profile => {
      if (profile) {
        this.updateVisibleTabs(profile.role || 'customer');
      } else {
        this.visibleTabs.next([]);
      }
    });
  }
  
  /**
   * Updates visible tabs based on user role
   */
  private updateVisibleTabs(role: string): void {
    const filteredTabs = this.tabsConfig.filter(tab => 
      tab.roles.includes(role)
    );
    
    console.log('Tabs for role', role, ':', filteredTabs);
    this.visibleTabs.next(filteredTabs);
  }
  
  /**
   * Gets tabs that are visible for a specific role
   */
  getTabsForRole(role: string): TabConfig[] {
    return this.tabsConfig.filter(tab => tab.roles.includes(role));
  }
  
  /**
   * Checks if a specific path is allowed for the current user's role
   */
  isPathAllowedForCurrentUser(path: string): Observable<boolean> {
    return this.authService.getUserRole().pipe(
      map(role => {
        const tabs = this.getTabsForRole(role);
        return tabs.some(tab => path.startsWith(tab.path));
      })
    );
  }
  
  /**
   * Gets the appropriate redirect path for a user based on their role
   */
  getHomePathForRole(role: string): string {
    const tabs = this.getTabsForRole(role);
    if (tabs.length > 0) {
      return tabs[0].path;
    }
    
    // Fallback paths
    switch (role) {
      case 'staff':
        return '/staff/dashboard';
      case 'admin':
        return '/staff/dashboard';
      case 'customer':
      default:
        return '/home';
    }
  }
}