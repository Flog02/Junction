// src/app/core/guards/role-navigation.guard.ts

import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, catchError, take } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class RoleNavigationGuard implements CanActivate {
  
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}
  
  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    return this.authService.userProfile$.pipe(
      take(1),
      map(profile => {
        // If no profile, let authGuard handle it
        if (!profile) return true;
        
        const role = profile.role || 'customer';
        const url = state.url;
        
        // Rules for staff users
        if (role === 'staff' || role === 'admin') {
          // Staff can access staff routes
          if (url.startsWith('/staff')) {
            return true;
          } 
          // Staff can access auth routes
          else if (url.startsWith('/auth')) {
            return true;
          } 
          // Staff cannot access customer routes
          else {
            console.log('Staff cannot access customer route:', url);
            this.router.navigate(['/staff/dashboard']);
            return false;
          }
        } 
        // Rules for customer users
        else if (role === 'customer') {
          // Customers cannot access staff routes
          if (url.startsWith('/staff')) {
            console.log('Customer cannot access staff route:', url);
            this.router.navigate(['/home']);
            return false;
          }
          // Customers can access all other routes
          return true;
        }
        
        // Default allow
        return true;
      }),
      catchError(error => {
        console.error('Error in role navigation guard:', error);
        return of(true);
      })
    );
  }
}