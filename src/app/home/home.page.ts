import { Component, OnInit, ViewChild, ElementRef, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule ,Router} from '@angular/router';
import { RouterLink } from '@angular/router';
import { 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonContent, 
  IonButtons, 
  IonButton, 
  IonIcon,
  IonCard,
  IonCardContent,
  IonBadge,
  IonProgressBar
} from '@ionic/angular/standalone';
import { Subject, takeUntil } from 'rxjs';
import { trigger, state, style, animate, transition } from '@angular/animations';
import { AuthService } from '../core/services/auth.service';
import { LoyaltyService } from '../core/services/loyalty.service';
import { OrderService } from '../core/services/order.service';
import { ProductService } from '../core/services/product.service';
import { Order } from '../core/models/order.model';
import { UserLoyalty } from '../core/models/loyalty.model';
import { Product } from '../core/models/product.model';
import { ProductSuggestionsComponent } from "../shared/components/scheduler.component/scheduler.component";

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [
    RouterLink,
    CommonModule,
    RouterModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonButton,
    IonIcon,
    IonCard,
    IonCardContent,
    IonBadge,
    IonProgressBar,
    ProductSuggestionsComponent
],
  animations: [
    trigger('fadeInOut', [
      state('in', style({ opacity: 1 })),
      transition(':enter', [
        style({ opacity: 0 }),
        animate('600ms ease-out')
      ])
    ]),
    trigger('slideInUp', [
      state('in', style({ opacity: 1, transform: 'translateY(0)' })),
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(30px)' }),
        animate('500ms ease-out')
      ])
    ]),
    trigger('slideInRight', [
      state('in', style({ opacity: 1, transform: 'translateX(0)' })),
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(-30px)' }),
        animate('500ms ease-out')
      ])
    ])
  ]
})
export class HomePage implements OnInit, OnDestroy {
  @ViewChild('heroImage') heroImage!: ElementRef;
  
  userName: string | null = null;
  greeting: string = 'Welcome';
  timeOfDay: string = 'afternoon';
  isLoggedIn: boolean = false;
  userLoyalty: UserLoyalty | null = null;
  recentOrders: Order[] = [];
  featuredProducts: Product[] = [];
  
  animateHero: string = 'in';
  animateCards: string = 'in';
  quickActions = [
    { title: 'Order Ahead', icon: 'cafe-outline', route: '/menu', color: 'primary' },
    { title: 'Track Order', icon: 'location-outline', route: '/order', color: 'secondary' },
    { title: 'Rewards', icon: 'star-outline', route: '/loyalty', color: 'tertiary' },
    { title: 'Gift Cards', icon: 'gift-outline', route: '/gift-cards', color: 'success' }
  ];
  
  private destroy$ = new Subject<void>();
  private animationObserver: IntersectionObserver | null = null;
  
  constructor(
    private authService: AuthService,
    private loyaltyService: LoyaltyService,
    private orderService: OrderService,
    private productService: ProductService,
    private router: Router
  ) {}
  
  ngOnInit() {
    this.setTimeOfDay();
    this.setGreeting();
    this.checkAuthStatus();
    this.loadFeaturedProducts();
    this.setupAnimations();
  }
  
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    
    if (this.animationObserver) {
      this.animationObserver.disconnect();
    }
  }
  
  private checkAuthStatus() {
    this.authService.user$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.isLoggedIn = !!user;
        
        if (user) {
          this.userName = user.displayName;
          this.loadUserData();
        }
      });
  }
  
  private loadUserData() {
    // Load user loyalty info
    this.loyaltyService.getUserLoyalty()
      .pipe(takeUntil(this.destroy$))
      .subscribe(loyalty => {
        this.userLoyalty = loyalty;
        
        // Update streak if user is visiting today
        if (loyalty) {
          this.loyaltyService.updateStreak()
            .pipe(takeUntil(this.destroy$))
            .subscribe();
        }
      });
    
    // Load recent orders
    this.orderService.getUserOrders()
      .pipe(takeUntil(this.destroy$))
      .subscribe(orders => {
        this.recentOrders = orders.slice(0, 3);
      });
  }
  
  private loadFeaturedProducts() {
    this.productService.getFeaturedProducts()
      .pipe(takeUntil(this.destroy$))
      .subscribe(products => {
        this.featuredProducts = products.slice(0, 5);
      });
  }
  
  private setTimeOfDay() {
    const hour = new Date().getHours();
    
    if (hour >= 5 && hour < 12) {
      this.timeOfDay = 'morning';
    } else if (hour >= 12 && hour < 18) {
      this.timeOfDay = 'afternoon';
    } else {
      this.timeOfDay = 'evening';
    }
  }
  
  private setGreeting() {
    const hour = new Date().getHours();
    
    if (hour >= 5 && hour < 12) {
      this.greeting = 'Good Morning';
    } else if (hour >= 12 && hour < 18) {
      this.greeting = 'Good Afternoon';
    } else {
      this.greeting = 'Good Evening';
    }
  }
  
  getLoyaltyPercentage(): number {
    if (!this.userLoyalty) return 0;
    
    const { tier, points } = this.userLoyalty;
    
    // Tier thresholds
    const thresholds = {
      bronze: { min: 0, max: 100 },
      silver: { min: 100, max: 300 },
      gold: { min: 300, max: 600 },
      platinum: { min: 600, max: 1000 }
    };
    
    const currentTier = thresholds[tier as keyof typeof thresholds];
    const nextTierPoints = currentTier.max;
    const currentTierMinPoints = currentTier.min;
    
    const pointsInCurrentTier = points - currentTierMinPoints;
    const pointsRequiredForNextTier = nextTierPoints - currentTierMinPoints;
    
    // Calculate percentage (capped at 100%)
    return Math.min(Math.floor((pointsInCurrentTier / pointsRequiredForNextTier) * 100), 100);
  }
  
  getNextTier(): string {
    if (!this.userLoyalty) return 'Silver';
    
    const tierProgression = ['bronze', 'silver', 'gold', 'platinum'];
    const currentTierIndex = tierProgression.indexOf(this.userLoyalty.tier.toLowerCase());
    
    if (currentTierIndex === tierProgression.length - 1) {
      return 'Platinum Max'; // Already at highest tier
    }
    
    return tierProgression[currentTierIndex + 1].charAt(0).toUpperCase() + 
           tierProgression[currentTierIndex + 1].slice(1);
  }
  
  formatDate(date: Date): string {
    if (!date) return '';
    
    if (typeof date === 'string') {
      date = new Date(date);
    }
    
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  getStatusColor(status: string): string {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'processing':
        return 'primary';
      case 'ready':
        return 'success';
      case 'delivered':
        return 'success';
      case 'cancelled':
        return 'danger';
      default:
        return 'medium';
    }
  }
  
  getOrderStatusDisplay(status: string): string {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'processing':
        return 'Preparing';
      case 'ready':
        return 'Ready';
      case 'delivered':
        return 'Delivered';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  }
  
  private setupAnimations() {
    // Use Intersection Observer to trigger animations when elements come into view
    this.animationObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // Add animation class when element enters viewport
          if (entry.target.classList.contains('hero-section')) {
            this.animateHero = 'in';
          } else {
            this.animateCards = 'in';
          }
        }
      });
    }, { threshold: 0.2 });
    
    // Start observing elements
    setTimeout(() => {
      const heroSection = document.querySelector('.hero-section');
      const sections = document.querySelectorAll('.quick-actions-section, .loyalty-section, .recent-orders-section, .guest-section, .featured-products-section, .promo-section, .features-section');
      
      if (heroSection) {
        this.animationObserver?.observe(heroSection);
      }
      
      sections.forEach(section => {
        this.animationObserver?.observe(section);
      });
    }, 100);
  }
  
  // Optional: Add a parallax effect to the hero image when scrolling
  @HostListener('ionScroll', ['$event'])
  onScroll(event: CustomEvent) {
    if (this.heroImage && this.heroImage.nativeElement) {
      const scrollPos = event.detail.scrollTop;
      const translateY = scrollPos * 0.2; // Adjust parallax speed
      this.heroImage.nativeElement.style.transform = `translateY(${translateY}px)`;
    }
  }

linkmenu(){
this.router.navigateByUrl('/menu')
}

}