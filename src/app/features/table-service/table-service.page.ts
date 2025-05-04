import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { 
  IonContent, 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonButton, 
  IonIcon, 
  IonCard, 
  IonCardHeader, 
  IonCardTitle, 
  IonCardContent,
  IonGrid,
  IonRow,
  IonCol, IonBackButton, IonButtons } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  qrCodeOutline, 
  cafeOutline, 
  peopleOutline, 
  timeOutline, 
  restaurantOutline,
  walkOutline,
  arrowForwardOutline
} from 'ionicons/icons';
import { AuthService } from '../../core/services/auth.service';
import { TableService } from '../../core/services/table.service';
import { TableOrderService } from '../../core/services/table-order.service';

@Component({
  selector: 'app-table-service',
  templateUrl: './table-service.page.html',
  styleUrls: ['./table-service.page.scss'],
  standalone: true,
  imports: [IonButtons, IonBackButton, 
    CommonModule,
    RouterModule,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButton,
    IonIcon,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonGrid,
    IonRow,
    IonCol
]
})
export class TableServicePage implements OnInit {
  featuredStores = [
    {
      id: 'store1',
      name: 'Downtown Café',
      address: '123 Main St, City Center',
      waitTime: 5,
      isOpen: true,
      tableCount: 18
    },
    {
      id: 'store2',
      name: 'Riverside Café',
      address: '45 River Road, Waterfront',
      waitTime: 15,
      isOpen: true,
      tableCount: 24
    },
    {
      id: 'store3',
      name: 'Parkside Café',
      address: '78 Park Avenue, Central Park',
      waitTime: 0,
      isOpen: true,
      tableCount: 12
    }
  ];
  
  isLoggedIn = false;
  
  constructor(
    private router: Router,
    private authService: AuthService,
    private tableService: TableService,
    private tableOrderService: TableOrderService
  ) {
    addIcons({ 
      qrCodeOutline, 
      cafeOutline, 
      peopleOutline, 
      timeOutline, 
      restaurantOutline,
      walkOutline,
      arrowForwardOutline
    });
  }

  ngOnInit() {
    // Check if user is logged in
    this.authService.isLoggedIn().subscribe(loggedIn => {
      this.isLoggedIn = loggedIn;
    });
  }
  
  navigateToScanner() {
    this.router.navigate(['/table-service/scanner']);
  }
  
  navigateToLogin() {
    this.router.navigate(['/auth/login'], {
      queryParams: { returnUrl: '/table-service/scanner' }
    });
  }
  
  getWaitTimeClass(minutes: number): string {
    if (minutes === 0) return 'no-wait';
    if (minutes < 10) return 'short-wait';
    if (minutes < 20) return 'medium-wait';
    return 'long-wait';
  }
}