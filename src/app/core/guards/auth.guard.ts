// src/app/core/guards/auth.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Auth, authState } from '@angular/fire/auth';
import { map, take } from 'rxjs/operators';

export const authGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot, 
  state: RouterStateSnapshot
) => {
  const auth = inject(Auth);
  const router = inject(Router);
  
  return authState(auth).pipe(
    take(1),
    map(user => {
      const isLoggedIn = !!user;
      
      if (isLoggedIn) {
        // Check if email is verified (optional)
        // if (route.data['requiresEmailVerification'] && !user.emailVerified) {
        //   router.navigate(['/auth/verify-email']);
        //   return false;
        // }
        
        return true;
      }
      
      // Store the attempted URL for redirecting after login
      const returnUrl = state.url;
      
      // Redirect to login page with return URL
      router.navigate(['/auth/login'], { 
        queryParams: { returnUrl } 
      });
      
      return false;
    })
  );
};