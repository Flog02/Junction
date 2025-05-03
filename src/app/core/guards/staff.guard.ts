// src/app/core/guards/staff.guard.ts

import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable, of, from } from 'rxjs';
import { map, switchMap, catchError, tap, concatMap, delay, retry } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class StaffGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    console.log('🛡️ StaffGuard: Checking if user can access staff route:', state.url);
    
    // First check if user is authenticated
    return from(this.authService.getCurrentUser()).pipe(
      tap(user => console.log('👤 StaffGuard: Current user:', user?.uid || 'null')),
      switchMap(user => {
        if (!user) {
          console.log('⛔ StaffGuard: No user found, redirecting to login');
          this.router.navigate(['/auth/login'], { 
            queryParams: { returnUrl: state.url } 
          });
          return of(false);
        }
        
        console.log('🔍 StaffGuard: User found, getting profile with retries');
        // Try to get user profile with retries
        return this.getProfileWithRetries(user.uid).pipe(
          tap(profile => console.log('📋 StaffGuard: Profile after retries:', profile)),
          map(profile => {
            console.log('🔑 StaffGuard: User role:', profile?.role || 'undefined');
            
            if (profile && (profile.role === 'staff' || profile.role === 'admin')) {
              console.log('✅ StaffGuard: User has staff privileges, allowing access');
              return true;
            } else {
              console.log('⛔ StaffGuard: User lacks staff privileges, redirecting to home');
              this.authService.showToast('Access denied: Staff privileges required');
              this.router.navigate(['/home']);
              return false;
            }
          })
        );
      }),
      catchError(error => {
        console.error('❌ StaffGuard: Error in guard:', error);
        this.router.navigate(['/home']);
        return of(false);
      })
    );
  }
  
  // Helper method to retry profile fetch with delay
  private getProfileWithRetries(uid: string): Observable<any> {
    console.log('🔄 StaffGuard: Getting profile with retries for user:', uid);
    
    return from(this.authService.getUserProfile(uid)).pipe(
      tap(profile => console.log('📋 StaffGuard: Initial profile fetch result:', profile)),
      concatMap(profile => {
        if (profile) {
          console.log('✅ StaffGuard: Profile found on first attempt');
          return of(profile);
        } else {
          console.log('⏳ StaffGuard: Profile not found, will retry');
          // Return null and let retry handle it
          throw new Error('Profile not loaded yet');
        }
      }),
      retry({
        count: 3,
        delay: (error, retryCount) => {
          console.log(`🔄 StaffGuard: Retrying profile fetch, attempt ${retryCount}`);
          // Exponential backoff
          return of(0).pipe(delay(500 * retryCount));
        }
      }),
      catchError(error => {
        console.error('❌ StaffGuard: Failed to load profile after retries:', error);
        return of(null);
      })
    );
  }
}