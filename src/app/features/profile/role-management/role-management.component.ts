// src/app/features/profile/role-management/role-management.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonCard, 
  IonCardHeader, 
  IonCardTitle, 
  IonCardContent,
  IonItem,
  IonLabel,
  IonSelect,
  IonSelectOption,
  IonButton,
  IonSpinner
} from '@ionic/angular/standalone';
import { AuthService } from '../../../core/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-role-management',
  template: `
    <ion-card>
      <ion-card-header>
        <ion-card-title>Manage Role</ion-card-title>
      </ion-card-header>
      <ion-card-content>
        <div *ngIf="currentRole" class="current-role">
          <p>Current role: <strong>{{ currentRole }}</strong></p>
        </div>
        
        <ion-item>
          <ion-label>Select New Role</ion-label>
          <ion-select [(ngModel)]="selectedRole" interface="action-sheet">
            <ion-select-option value="customer">Customer</ion-select-option>
            <ion-select-option value="staff">Staff</ion-select-option>
            <ion-select-option value="admin">Admin</ion-select-option>
          </ion-select>
        </ion-item>
        
        <ion-button 
          expand="block" 
          (click)="updateRole()" 
          [disabled]="isUpdating || selectedRole === currentRole || !selectedRole">
          <ion-spinner *ngIf="isUpdating"></ion-spinner>
          <span *ngIf="!isUpdating">Update Role</span>
        </ion-button>
      </ion-card-content>
    </ion-card>
  `,
  styles: [`
    .current-role {
      margin-bottom: 16px;
    }
  `],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonItem,
    IonLabel,
    IonSelect,
    IonSelectOption,
    IonButton,
    IonSpinner
  ]
})
export class RoleManagementComponent implements OnInit {
  currentRole: string | null = null;
  selectedRole: string | null = null;
  isUpdating = false;
  
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}
  
  ngOnInit() {
    this.authService.userProfile$.subscribe(profile => {
      if (profile) {
        this.currentRole = profile.role || 'customer';
        this.selectedRole = this.currentRole;
      }
    });
  }
  
  async updateRole() {
    if (!this.selectedRole || this.selectedRole === this.currentRole || !this.authService.currentUser) {
      return;
    }
    
    this.isUpdating = true;
    
    try {
      await this.authService.updateUserRole(this.authService.currentUser.uid, this.selectedRole);
      
      // Role updated successfully
      this.currentRole = this.selectedRole;
      
      // Redirect based on new role
      if (this.selectedRole === 'staff' || this.selectedRole === 'admin') {
        this.router.navigate(['/staff/dashboard']);
      } else {
        this.router.navigate(['/home']);
      }
    } catch (error) {
      console.error('Error updating role:', error);
    } finally {
      this.isUpdating = false;
    }
  }
}

