import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonContent, 
  IonButtons, 
  IonBackButton,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonButton,
  IonIcon,
  IonList,
  IonItem,
  IonLabel,
  IonBadge,
  ToastController,
  AlertController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  restaurantOutline, 
  cartOutline, 
  personOutline, 
  timeOutline,
  callOutline,
  locationOutline, cafeOutline, removeCircleOutline, addCircleOutline, checkmarkCircleOutline } from 'ionicons/icons';

import { TableInfo, StoreInfo } from '../../../core/models/table.model';
import { TableService } from '../../../core/services/table.service';

@Component({
  selector: 'app-table-order',
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/table-service"></ion-back-button>
        </ion-buttons>
        <ion-title>Place Order</ion-title>
      </ion-toolbar>
    </ion-header>
    
    <ion-content class="ion-padding">
      <!-- Table Information Card -->
      <ion-card *ngIf="tableInfo">
        <ion-card-header>
          <ion-card-title>
            <ion-icon name="restaurant-outline"></ion-icon>
            Table {{ tableInfo.tableNumber }}
          </ion-card-title>
        </ion-card-header>
        
        <ion-card-content>
          <div class="table-details">
            <p><strong>Store:</strong> {{ storeName }}</p>
            <p><strong>Seats:</strong> {{ tableInfo.seats }}</p>
            <p><strong>Status:</strong> 
              <ion-badge [color]="getStatusColor(tableInfo.status)">
                {{ tableInfo.status }}
              </ion-badge>
            </p>
          </div>
        </ion-card-content>
      </ion-card>
      
      <!-- Store Information Card -->
      <ion-card *ngIf="storeInfo">
        <ion-card-header>
          <ion-card-title>
            <ion-icon name="location-outline"></ion-icon>
            {{ storeInfo.name }}
          </ion-card-title>
        </ion-card-header>
        
        <ion-card-content>
          <div class="store-details">
            <p>
              <ion-icon name="location-outline"></ion-icon>
              {{ storeInfo.address.street }}, {{ storeInfo.address.city }}, {{ storeInfo.address.zipCode }}
            </p>
            <p>
              <ion-icon name="call-outline"></ion-icon>
              {{ storeInfo.contactInfo.phoneNumber }}
            </p>
            <p>
              <ion-icon name="time-outline"></ion-icon>
              {{ isStoreOpen ? 'Open Now' : 'Closed' }}
              <span *ngIf="isStoreOpen && currentBusinessHours">
                (Until {{ currentBusinessHours.close }})
              </span>
            </p>
            <p *ngIf="storeInfo.currentWaitTime">
              <ion-icon name="time-outline"></ion-icon>
              Current Wait Time: {{ storeInfo.currentWaitTime }} min
            </p>
          </div>
        </ion-card-content>
      </ion-card>
      
      <!-- Menu Placeholder - In a real app, this would show the actual menu -->
      <ion-card>
        <ion-card-header>
          <ion-card-title>
            <ion-icon name="restaurant-outline"></ion-icon>
            Menu
          </ion-card-title>
        </ion-card-header>
        
        <ion-card-content>
          <ion-list>
            <ion-item button (click)="showMenuCategory('starters')">
              <ion-label>Starters</ion-label>
            </ion-item>
            <ion-item button (click)="showMenuCategory('mains')">
              <ion-label>Main Courses</ion-label>
            </ion-item>
            <ion-item button (click)="showMenuCategory('desserts')">
              <ion-label>Desserts</ion-label>
            </ion-item>
            <ion-item button (click)="showMenuCategory('drinks')">
              <ion-label>Drinks</ion-label>
            </ion-item>
          </ion-list>
          
          <div class="order-actions">
            <ion-button expand="block" color="primary" (click)="startOrder()">
              <ion-icon name="cart-outline" slot="start"></ion-icon>
              Start Order
            </ion-button>
          </div>
        </ion-card-content>
      </ion-card>
    </ion-content>
  `,
  styles: `
    .table-details, .store-details {
      margin-bottom: 16px;
    }
    
    .table-details p, .store-details p {
      margin: 8px 0;
      display: flex;
      align-items: center;
    }
    
    .store-details ion-icon {
      margin-right: 8px;
      color: var(--ion-color-medium);
    }
    
    ion-card-title {
      display: flex;
      align-items: center;
    }
    
    ion-card-title ion-icon {
      margin-right: 8px;
    }
    
    .order-actions {
      margin-top: 20px;
    }
  `,
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonBackButton,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonButton,
    IonIcon,
    IonList,
    IonItem,
    IonLabel,
    IonBadge
  ]
})
export class TableOrderComponent implements OnInit {
  tableInfo: TableInfo | null = null;
  storeInfo: StoreInfo | null = null;
  storeName: string = '';
  isStoreOpen: boolean = false;
  currentBusinessHours: { open: string; close: string } | null = null;
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private tableService: TableService,
    private toastController: ToastController,
    private alertController: AlertController
  ) {
    addIcons({cartOutline,restaurantOutline,cafeOutline,removeCircleOutline,addCircleOutline,checkmarkCircleOutline,personOutline,timeOutline,callOutline,locationOutline});
    
    // Get navigation state
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras.state) {
      this.tableInfo = navigation.extras.state['tableInfo'] as TableInfo;
      
      if (this.tableInfo) {
        this.loadStoreInfo(this.tableInfo.storeId);
      }
    }
  }
  
  ngOnInit() {
    // If no tableInfo from navigation state, check for query params
    if (!this.tableInfo) {
      this.route.queryParams.subscribe(params => {
        const storeId = params['storeId'];
        const tableNumber = parseInt(params['tableNumber'], 10);
        
        if (storeId && !isNaN(tableNumber)) {
          // Create a QR code URL and process it
          const qrCode = `${window.location.origin}/table/${storeId}/${tableNumber}`;
          this.processQRCode(qrCode);
        } else {
          // No table info available, redirect to scanner
          this.showNoTableAlert();
        }
      });
    }
  }
  
  /**
   * Process a QR code to get table information
   */
  private processQRCode(qrCode: string) {
    this.tableService.getTableInfoFromQRCode(qrCode).subscribe({
      next: tableInfo => {
        this.tableInfo = tableInfo;
        this.loadStoreInfo(tableInfo.storeId);
      },
      error: error => {
        console.error('Error processing QR code:', error);
        this.showNoTableAlert();
      }
    });
  }
  
  /**
   * Load store information based on storeId
   */
  private loadStoreInfo(storeId: string) {
    this.tableService.getStoreInfo(storeId).subscribe({
      next: store => {
        if (store) {
          this.storeInfo = store;
          this.storeName = store.name;
          
          // Check if store is open
          this.checkStoreOpen();
        } else {
          this.presentToast('Store information not found');
        }
      },
      error: error => {
        console.error('Error loading store info:', error);
        this.presentToast('Could not load store information');
      }
    });
  }
  
  /**
   * Check if the store is currently open
   */
  private checkStoreOpen() {
    if (!this.storeInfo) return;
    
    // If store has isOpen flag, use that
    if (typeof this.storeInfo.isOpen === 'boolean') {
      this.isStoreOpen = this.storeInfo.isOpen;
    } else {
      // Otherwise, check business hours
      const now = new Date();
      const day = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      
      if (this.storeInfo.businessHours && this.storeInfo.businessHours[day]) {
        this.currentBusinessHours = this.storeInfo.businessHours[day];
        
        // Parse opening and closing times
        const openTime = this.parseTime(this.currentBusinessHours.open);
        const closeTime = this.parseTime(this.currentBusinessHours.close);
        
        // Get current time
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const currentTotalMinutes = currentHour * 60 + currentMinute;
        
        // Check if current time is within business hours
        this.isStoreOpen = currentTotalMinutes >= openTime && currentTotalMinutes <= closeTime;
      } else {
        this.isStoreOpen = false;
      }
    }
  }
  
  /**
   * Helper method to parse time string (format: "HH:MM") to total minutes
   */
  private parseTime(timeString: string): number {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  }
  
  /**
   * Get color for table status badge
   */
  getStatusColor(status: string): string {
    switch (status) {
      case 'available':
        return 'success';
      case 'occupied':
        return 'danger';
      case 'reserved':
        return 'warning';
      default:
        return 'medium';
    }
  }
  
  /**
   * Show menu category (placeholder for actual menu implementation)
   */
  showMenuCategory(category: string) {
    this.presentToast(`${category} category selected`);
    // In a real app, this would navigate to the menu category or load it
  }
  
  /**
   * Start the ordering process
   */
  startOrder() {
    if (!this.isStoreOpen) {
      this.presentAlert('Store Closed', 'Sorry, this store is currently closed. Please try again during business hours.');
      return;
    }

    this.router.navigateByUrl('/menu')
    
    // this.presentAlert('Order Started', 'This is a demo. In a real app, you would now be able to select items from the menu.');
    // In a real app, this would start the ordering process
  }
  
  /**
   * Show an alert when no table information is available
   */
  private async showNoTableAlert() {
    const alert = await this.alertController.create({
      header: 'No Table Information',
      message: 'No table information was found. Please scan a valid table QR code.',
      buttons: [
        {
          text: 'Go to Scanner',
          handler: () => {
            this.router.navigate(['/table-service/scan']);
          }
        }
      ]
    });
    
    await alert.present();
  }
  
  /**
   * Present a toast message
   */
  private async presentToast(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      position: 'bottom'
    });
    
    await toast.present();
  }
  
  /**
   * Present an alert message
   */
  private async presentAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['OK']
    });
    
    await alert.present();
  }
}