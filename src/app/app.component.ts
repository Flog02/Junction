import { Component, OnInit, OnDestroy } from '@angular/core';
import { Platform } from '@ionic/angular';
import { Router, NavigationEnd } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { AuthService } from './core/services/auth.service';
import { IonApp ,IonRouterOutlet} from "@ionic/angular/standalone";

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  imports:[IonApp,IonRouterOutlet]
})
export class AppComponent implements OnInit, OnDestroy {
  private routerSubscription: Subscription | undefined;
  public isAuthenticated = false;
  public userProfile: any = null;
  
  constructor(
    private platform: Platform,
    private router: Router,
    private authService: AuthService
  ) {
    this.initializeApp();
  }

  initializeApp() {
    this.platform.ready().then(() => {
      // Subscribe to auth state changes
      this.authService.isLoggedIn().subscribe(isLoggedIn => {
        this.isAuthenticated = isLoggedIn;
      });
      
      // Get user profile if authenticated
      this.authService.userProfile$.subscribe(profile => {
        this.userProfile = profile;
      });
    });
  }

  ngOnInit() {
    // Track router navigation events
    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        // Scroll to top on page change
        window.scrollTo(0, 0);
      });
  }
  
  ngOnDestroy() {
    // Clean up subscriptions
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }
}