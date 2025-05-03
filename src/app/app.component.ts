import { Component, OnInit, OnDestroy } from '@angular/core';
import { Platform } from '@ionic/angular';
import { Router, NavigationEnd, NavigationStart } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter, distinctUntilChanged, map } from 'rxjs/operators';
import { AuthService } from './core/services/auth.service';
import { IonApp, IonRouterOutlet,ModalController, IonToolbar, IonTitle, IonButtons } from "@ionic/angular/standalone";
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { NotificationDrawerComponent } from './shared/components/notification/notification-drawer/notification-drawer.component';
import { NotificationBadgeComponent } from "./shared/components/notification/notification-badge/notification-badge.component";

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: true,
  imports: [IonButtons, IonTitle, IonToolbar,
    CommonModule,
    RouterOutlet,
    IonApp,
    IonRouterOutlet, NotificationBadgeComponent]
})
export class AppComponent implements OnInit, OnDestroy {
  private routerSubscription: Subscription | undefined;
  private authSubscription: Subscription | undefined;
  private profileSubscription: Subscription | undefined;
  public isAuthenticated = false;
  public userProfile: any = null;
  public initialNavigationDone = false;
  
  constructor(
    private platform: Platform,
    private router: Router,
    private authService: AuthService,
    private modalController: ModalController
  ) {
    this.initializeApp();
    console.log('App Component initialized');
  }
  
  initializeApp() {
    this.platform.ready().then(() => {
      // Subscribe to auth state changes
      this.authSubscription = this.authService.isLoggedIn().pipe(
        distinctUntilChanged() // Only trigger when the value actually changes
      ).subscribe(isLoggedIn => {
        console.log('Authentication state changed:', isLoggedIn ? 'Logged In' : 'Logged Out');
        this.isAuthenticated = isLoggedIn;
        
        if (!isLoggedIn) {
          // User logged out, navigate to login
          const currentUrl = this.router.url;
          if (!currentUrl.startsWith('/auth')) {
            this.router.navigate(['/auth/login']);
          }
        }
      });
      
      // Get user profile if authenticated
      this.profileSubscription = this.authService.userProfile$.pipe(
        distinctUntilChanged((prev, curr) => 
          prev?.role === curr?.role && prev?.uid === curr?.uid
        )
      ).subscribe(profile => {
        console.log('User profile updated:', profile?.role || 'No role');
        this.userProfile = profile;
        
        // Only perform initial navigation once upon profile load
        if (profile && !this.initialNavigationDone) {
          this.initialNavigationDone = true;
          this.initialNavigation();
        }
      });
    });
  }
  
  initialNavigation() {
    if (!this.userProfile) return;
    
    const role = this.userProfile.role || 'customer';
    const currentUrl = this.router.url;
    
    console.log('Initial navigation for role:', role, 'current path:', currentUrl);
    
    // Only redirect if on auth path or at root
    if (currentUrl === '/' || currentUrl.startsWith('/auth')) {
      if (role === 'staff' || role === 'admin') {
        console.log('Redirecting staff to dashboard');
        this.router.navigate(['/staff/dashboard']);
      } else {
        console.log('Redirecting customer to home');
        this.router.navigate(['/home']);
      }
    } 
    // Check for role-specific invalid paths
    else if ((role === 'staff' || role === 'admin') && 
             !currentUrl.startsWith('/staff') && 
             !currentUrl.startsWith('/auth')) {
      console.log('Staff accessing customer page, redirecting to dashboard');
      this.router.navigate(['/staff/dashboard']);
    } 
    else if (role === 'customer' && currentUrl.startsWith('/staff')) {
      console.log('Customer accessing staff page, redirecting to home');
      this.router.navigate(['/home']);
    }
  }
  
  ngOnInit() {
    console.log('Application started');
    
    // Track router navigation events
    this.routerSubscription = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      map(event => event as NavigationEnd),
      distinctUntilChanged((prev, curr) => prev.url === curr.url) // Only process unique URL changes
    ).subscribe((event: NavigationEnd) => {
      // Scroll to top on page change
      window.scrollTo(0, 0);
      
      // Only check for redirects if we're authenticated and have a profile
      if (this.isAuthenticated && this.userProfile) {
        const role = this.userProfile.role || 'customer';
        const currentUrl = event.url;
        
        // Check for role-specific invalid paths
        if ((role === 'staff' || role === 'admin') && 
            !currentUrl.startsWith('/staff') && 
            !currentUrl.startsWith('/auth')) {
          console.log('Staff accessing customer page, redirecting to dashboard');
          this.router.navigate(['/staff/dashboard']);
        } 
        else if (role === 'customer' && currentUrl.startsWith('/staff')) {
          console.log('Customer accessing staff page, redirecting to home');
          this.router.navigate(['/home']);
        }
      }
    });
  }
  async openNotificationDrawer() {
    const modal = await this.modalController.create({
      component: NotificationDrawerComponent,
      cssClass: 'notification-drawer-modal'
    });
    
    await modal.present();
  }

  
  ngOnDestroy() {
    // Clean up subscriptions
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
    if (this.profileSubscription) {
      this.profileSubscription.unsubscribe();
    }
  }
}