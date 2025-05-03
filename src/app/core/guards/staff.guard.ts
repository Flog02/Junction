// src/app/core/guards/staff.guard.ts

import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { map, take, tap } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class StaffGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(): Observable<boolean> {
    return this.authService.isStaff().pipe(
      take(1),
      map(isStaff => !!isStaff),
      tap(isStaff => {
        if (!isStaff) {
          this.router.navigate(['/home']);
        }
      })
    );
  }
}