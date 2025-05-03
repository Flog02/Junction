// src/app/shared/components/wildcard-redirect/wildcard-redirect.component.ts

import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-wildcard-redirect',
  template: `<div>Redirecting...</div>`,
  standalone: true
})
export class WildcardRedirectComponent implements OnInit {
  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit() {
    // Check if user is authenticated
    this.authService.isLoggedIn().subscribe(isLoggedIn => {
      if (isLoggedIn) {
        // Redirect based on role
        this.redirectBasedOnRole();
      } else {
        // Not logged in, redirect to login
        this.router.navigate(['/auth/login']);
      }
    });
  }

  private redirectBasedOnRole() {
    this.authService.userProfile$.subscribe(profile => {
      if (profile) {
        const role = profile.role || 'customer';
        
        // Redirect based on role
        if (role === 'staff' || role === 'admin') {
          console.log('404 page: Redirecting staff to dashboard');
          this.router.navigate(['/staff/dashboard']);
        } else {
          console.log('404 page: Redirecting customer to home');
          this.router.navigate(['/home']);
        }
      } else {
        // No profile, redirect to login
        this.router.navigate(['/auth/login']);
      }
    });
  }
}