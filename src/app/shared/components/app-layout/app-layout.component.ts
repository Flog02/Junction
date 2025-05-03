// src/app/shared/components/app-layout/app-layout.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { 
  IonTabs, 
  IonTabBar, 
  IonTabButton, 
  IonIcon, 
  IonLabel,
  IonRouterOutlet,
  IonMenu,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonMenuButton,
  IonButtons,
  IonSplitPane
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  homeOutline, 
  restaurantOutline, 
  cartOutline, 
  personOutline,
  gridOutline,
  cafeOutline,
  qrCodeOutline,
  menuOutline,
  exitOutline,
  settingsOutline,
  timeOutline
} from 'ionicons/icons';
import { RoleTabService, TabConfig } from '../../../core/services/role-tab.service';
import { AuthService } from '../../../core/services/auth.service';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-layout',
  template: `
    <ion-split-pane contentId="main-content">
      <!-- Side menu - visible only for staff/admin on larger screens -->
      <ion-menu contentId="main-content" type="overlay" *ngIf="currentRole === 'staff' || currentRole === 'admin'">
        <ion-header>
          <ion-toolbar color="primary">
            <ion-title>Lazy Café</ion-title>
          </ion-toolbar>
        </ion-header>
        <ion-content>
          <div class="user-info">
            <h2>{{ userName }}</h2>
            <p>{{ currentRole | titlecase }}</p>
          </div>
          
          <ion-list lines="none">
            <ion-item 
              *ngFor="let tab of visibleTabs" 
              [routerLink]="tab.path" 
              routerLinkActive="selected-item"
              detail="false"
            >
              <ion-icon slot="start" [name]="tab.icon"></ion-icon>
              <ion-label>{{ tab.label }}</ion-label>
            </ion-item>
            
            <ion-item button (click)="logout()" lines="none">
              <ion-icon slot="start" name="exit-outline"></ion-icon>
              <ion-label>Logout</ion-label>
            </ion-item>
          </ion-list>
        </ion-content>
      </ion-menu>
      
      <!-- Main content area -->
      <div class="ion-page" id="main-content">
        <!-- Router outlet for page content -->
        <ion-router-outlet></ion-router-outlet>
        
        <!-- Bottom tabs - for customer role only -->
        <ion-tabs *ngIf="currentRole === 'customer'">
          <ion-tab-bar slot="bottom">
            <ion-tab-button 
              *ngFor="let tab of visibleTabs" 
              [tab]="tab.path" 
              [routerLink]="tab.path"
            >
              <ion-icon [name]="tab.icon"></ion-icon>
              <ion-label>{{ tab.label }}</ion-label>
            </ion-tab-button>
          </ion-tab-bar>
        </ion-tabs>
      </div>
    </ion-split-pane>
  `,
  styles: [`
    .user-info {
      padding: 16px;
      background-color: var(--ion-color-light);
      margin-bottom: 16px;
    }
    
    .user-info h2 {
      margin: 0 0 4px 0;
      font-size: 18px;
      font-weight: 600;
    }
    
    .user-info p {
      margin: 0;
      color: var(--ion-color-medium);
    }
    
    .selected-item {
      --background: var(--ion-color-light);
      --color: var(--ion-color-primary);
      font-weight: 500;
    }
    
    ion-list {
      padding: 0;
    }
    
    ion-item {
      --padding-start: 16px;
      --inner-padding-end: 16px;
      --min-height: 48px;
    }
  `],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    IonTabs, 
    IonTabBar, 
    IonTabButton, 
    IonIcon, 
    IonLabel,
    IonRouterOutlet,
    IonMenu,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonList,
    IonItem,
    IonMenuButton,
    IonButtons,
    IonSplitPane
  ]
})
export class AppLayoutComponent implements OnInit {
  appTitle: string = 'Lazy Café';
  userName: string = 'User';
  currentRole: string = 'customer';
  visibleTabs: TabConfig[] = [];
  
  constructor(
    private roleTabService: RoleTabService,
    private authService: AuthService,
    private router: Router
  ) {
    // Add all icons needed
    addIcons({
      homeOutline, 
      restaurantOutline, 
      cartOutline, 
      personOutline,
      gridOutline,
      cafeOutline,
      qrCodeOutline,
      menuOutline,
      exitOutline,
      settingsOutline,
      timeOutline
    });
  }
  
  ngOnInit() {
    // Subscribe to user profile changes
    this.authService.userProfile$.subscribe(profile => {
      if (profile) {
        this.userName = profile.displayName || 'User';
        this.currentRole = profile.role || 'customer';
        
        // Update tabs based on role
        this.visibleTabs = this.roleTabService.getTabsForRole(this.currentRole);
        console.log('Visible tabs updated for role:', this.currentRole, this.visibleTabs);
      }
    });
    
    // Listen to route changes to update active tab
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.checkIfPathAllowed();
    });
  }
  
  checkIfPathAllowed() {
    const currentUrl = this.router.url;
    this.roleTabService.isPathAllowedForCurrentUser(currentUrl).subscribe(allowed => {
      if (!allowed) {
        // Redirect to appropriate home page for role
        this.authService.getUserRole().subscribe(role => {
          const homePath = this.roleTabService.getHomePathForRole(role);
          this.router.navigate([homePath]);
        });
      }
    });
  }
  
  logout() {
    this.authService.logout().then(() => {
      this.router.navigate(['/auth/login']);
    });
  }
}