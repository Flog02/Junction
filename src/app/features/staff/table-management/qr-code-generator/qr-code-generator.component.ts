import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonContent, 
  IonButton, 
  IonItem, 
  IonLabel, 
  IonInput, 
  IonSelect, 
  IonSelectOption,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonGrid,
  IonRow,
  IonCol,
  IonIcon,
  IonAlert,
  AlertController,
  IonButtons,
  IonBackButton,
  ToastController,
  LoadingController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  printOutline, 
  downloadOutline, 
  qrCodeOutline, 
  refreshOutline,
  shareOutline,
  gridOutline,
  scanOutline
} from 'ionicons/icons';
import * as QRCode from 'qrcode';

import { TableService } from '../../../../core/services/table.service';
import { StoreInfo, QRCodeSettings } from '../../../../core/models/table.model';

@Component({
  selector: 'app-qr-code-generator',
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/"></ion-back-button>
        </ion-buttons>
        <ion-title>Table QR Code Generator</ion-title>
      </ion-toolbar>
    </ion-header>
    
    <ion-content class="ion-padding">
      <ion-card>
        <ion-card-header>
          <ion-card-title>Generate Table QR Codes</ion-card-title>
        </ion-card-header>
        
        <ion-card-content>
          <ion-grid>
            <ion-row>
              <ion-col size="12" size-md="6">
                <ion-item>
                  <ion-label position="floating">Store</ion-label>
                  <ion-select [(ngModel)]="storeId" (ionChange)="loadStoreInfo()">
                    <ion-select-option *ngFor="let store of availableStores" [value]="store.id">
                      {{ store.name }}
                    </ion-select-option>
                  </ion-select>
                </ion-item>
                
                <ion-item>
                  <ion-label position="floating">Table Number</ion-label>
                  <ion-input type="number" [(ngModel)]="tableNumber" min="1" [max]="maxTableNumber"></ion-input>
                </ion-item>
                
                <div class="qr-options">
                  <ion-item>
                    <ion-label position="floating">QR Code Size (px)</ion-label>
                    <ion-input type="number" [(ngModel)]="qrSettings.size" min="128" max="512" step="32"></ion-input>
                  </ion-item>
                  
                  <ion-item>
                    <ion-label position="floating">Error Correction Level</ion-label>
                    <ion-select [(ngModel)]="qrSettings.errorCorrectionLevel">
                      <ion-select-option value="L">Low (7%)</ion-select-option>
                      <ion-select-option value="M">Medium (15%)</ion-select-option>
                      <ion-select-option value="Q">Quartile (25%)</ion-select-option>
                      <ion-select-option value="H">High (30%)</ion-select-option>
                    </ion-select>
                  </ion-item>
                  
                  <ion-item>
                    <ion-label position="floating">Margin (px)</ion-label>
                    <ion-input type="number" [(ngModel)]="qrSettings.margin" min="0" max="10"></ion-input>
                  </ion-item>
                </div>
                
                <ion-button expand="block" (click)="generateQR()" [disabled]="!storeId || !tableNumber || tableNumber < 1">
                  <ion-icon name="qr-code-outline" slot="start"></ion-icon>
                  Generate QR Code
                </ion-button>
                
                <ion-button expand="block" color="secondary" (click)="generateBulkQR()" [disabled]="!storeId">
                  <ion-icon name="grid-outline" slot="start"></ion-icon>
                  Generate All Tables
                </ion-button>
              </ion-col>
              
              <ion-col size="12" size-md="6" class="qr-output-col">
                <div class="qr-output" *ngIf="qrDataUrl">
                  <div class="qr-container">
                    <img [src]="qrDataUrl" [alt]="'QR Code for Table ' + tableNumber">
                    <div class="table-info">
                      <h2>Table {{ tableNumber }}</h2>
                      <p *ngIf="storeName">{{ storeName }}</p>
                      <p class="qr-data">{{ qrData }}</p>
                    </div>
                  </div>
                  
                  <div class="qr-actions">
                    <ion-button color="primary" (click)="downloadQR()">
                      <ion-icon name="download-outline" slot="start"></ion-icon>
                      Download
                    </ion-button>
                    
                    <ion-button color="secondary" (click)="printQR()">
                      <ion-icon name="print-outline" slot="start"></ion-icon>
                      Print
                    </ion-button>

                    <ion-button color="tertiary" (click)="shareQR()" *ngIf="canShare">
                      <ion-icon name="share-outline" slot="start"></ion-icon>
                      Share
                    </ion-button>
                    
                    <ion-button color="success" (click)="testQR()">
                      <ion-icon name="scan-outline" slot="start"></ion-icon>
                      Test
                    </ion-button>
                  </div>
                </div>
                
                <div class="empty-state" *ngIf="!qrDataUrl">
                  <ion-icon name="qr-code-outline"></ion-icon>
                  <p>Generate a QR code to see it here</p>
                </div>
              </ion-col>
            </ion-row>
          </ion-grid>
        </ion-card-content>
      </ion-card>
      
      <!-- Bulk QR Codes -->
      <ion-card *ngIf="bulkQrCodes.length > 0">
        <ion-card-header>
          <ion-card-title>All Table QR Codes</ion-card-title>
        </ion-card-header>
        
        <ion-card-content>
          <div class="bulk-qr-actions">
            <ion-button color="primary" (click)="downloadAllQR()">
              <ion-icon name="download-outline" slot="start"></ion-icon>
              Download All
            </ion-button>
            
            <ion-button color="secondary" (click)="printAllQR()">
              <ion-icon name="print-outline" slot="start"></ion-icon>
              Print All
            </ion-button>
          </div>
          
          <div class="bulk-qr-grid">
            <div class="qr-item" *ngFor="let qrCode of bulkQrCodes">
              <img [src]="qrCode.dataUrl" [alt]="'QR Code for Table ' + qrCode.tableNumber">
              <div class="table-number">Table {{ qrCode.tableNumber }}</div>
            </div>
          </div>
        </ion-card-content>
      </ion-card>
    </ion-content>
  `,
  styles: [`
    .qr-options {
      margin: 16px 0;
    }
    
    .qr-output-col {
      display: flex;
      flex-direction: column;
      justify-content: center;
    }
    
    .qr-output {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 16px;
    }
    
    .qr-container {
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      text-align: center;
      margin-bottom: 16px;
    }
    
    .qr-container img {
      display: block;
      margin: 0 auto 16px;
      max-width: 100%;
    }
    
    .table-info h2 {
      margin: 0;
      font-size: 1.5rem;
    }
    
    .table-info p {
      margin: 8px 0 0;
      color: var(--ion-color-medium);
    }
    
    .qr-data {
      font-size: 0.8rem;
      word-break: break-all;
      margin-top: 12px;
      padding: 8px;
      background: var(--ion-color-light);
      border-radius: 4px;
    }
    
    .qr-actions {
      display: flex;
      gap: 8px;
      margin-top: 16px;
      flex-wrap: wrap;
      justify-content: center;
    }
    
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px 16px;
      background: var(--ion-color-light);
      border-radius: 8px;
      color: var(--ion-color-medium);
    }
    
    .empty-state ion-icon {
      font-size: 48px;
      margin-bottom: 16px;
    }
    
    .bulk-qr-actions {
      display: flex;
      gap: 8px;
      margin-bottom: 16px;
    }
    
    .bulk-qr-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      gap: 16px;
    }
    
    .qr-item {
      background: white;
      padding: 12px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      text-align: center;
    }
    
    .qr-item img {
      display: block;
      max-width: 100%;
      margin-bottom: 8px;
    }
    
    .table-number {
      font-weight: bold;
    }
    
    @media print {
      ion-header, ion-card-header, .qr-actions, .bulk-qr-actions {
        display: none !important;
      }
      
      ion-content {
        --background: white !important;
      }
      
      ion-card {
        box-shadow: none !important;
        margin: 0 !important;
      }
      
      .bulk-qr-grid {
        grid-template-columns: repeat(3, 1fr) !important;
      }
    }
  `],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonItem,
    IonLabel,
    IonInput,
    IonSelect,
    IonSelectOption,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    IonGrid,
    IonRow,
    IonCol,
    IonIcon,
    IonButtons,
    IonBackButton
  ]
})
export class QrCodeGeneratorComponent implements OnInit {
  storeId: string = '';
  storeName: string = '';
  tableNumber: number = 1;
  
  // QR Code settings with optimized defaults for mobile scanning
  qrSettings: QRCodeSettings = {
    size: 256,
    margin: 2,
    errorCorrectionLevel: 'H', // High error correction for better scanning
    dark: '#000000',
    light: '#FFFFFF'
  };
  
  qrData: string = '';
  qrDataUrl: string = '';
  
  // Hard-coded list of 3 stores
  availableStores: StoreInfo[] = [
    {
      id: 'cafe-downtown',
      name: 'Downtown Cafe',
      tableCount: 20,
      isOpen: true,
      address: {
        street: '123 Main Street',
        city: 'Downtown',
        state: 'CA',
        zipCode: '90001',
        country: 'USA'
      },
      location: {
        latitude: 34.0522,
        longitude: -118.2437
      },
      contactInfo: {
        phoneNumber: '(213) 555-1234',
        email: 'info@downtowncafe.com'
      },
      businessHours: {
        monday: { open: '08:00', close: '20:00' },
        tuesday: { open: '08:00', close: '20:00' },
        wednesday: { open: '08:00', close: '20:00' },
        thursday: { open: '08:00', close: '20:00' },
        friday: { open: '08:00', close: '22:00' },
        saturday: { open: '09:00', close: '22:00' },
        sunday: { open: '10:00', close: '18:00' }
      },
      features: ['Wi-Fi', 'Outdoor Seating', 'Wheelchair Accessible'],
      currentWaitTime: 15,
      qrCodes: {}
    },
    {
      id: 'cafe-uptown',
      name: 'Uptown Bistro',
      tableCount: 15,
      isOpen: true,
      address: {
        street: '456 Park Avenue',
        city: 'Uptown',
        state: 'CA',
        zipCode: '90002',
        country: 'USA'
      },
      location: {
        latitude: 34.0624,
        longitude: -118.3008
      },
      contactInfo: {
        phoneNumber: '(213) 555-5678',
        email: 'info@uptownbistro.com'
      },
      businessHours: {
        monday: { open: '09:00', close: '21:00' },
        tuesday: { open: '09:00', close: '21:00' },
        wednesday: { open: '09:00', close: '21:00' },
        thursday: { open: '09:00', close: '21:00' },
        friday: { open: '09:00', close: '23:00' },
        saturday: { open: '10:00', close: '23:00' },
        sunday: { open: '10:00', close: '19:00' }
      },
      features: ['Live Music', 'Craft Cocktails', 'Vegan Options'],
      currentWaitTime: 25,
      qrCodes: {}
    },
    {
      id: 'cafe-beachside',
      name: 'Beachside Coffee',
      tableCount: 10,
      isOpen: true,
      address: {
        street: '789 Ocean Drive',
        city: 'Beachside',
        state: 'CA',
        zipCode: '90003',
        country: 'USA'
      },
      location: {
        latitude: 33.9850,
        longitude: -118.4695
      },
      contactInfo: {
        phoneNumber: '(310) 555-9012',
        email: 'info@beachsidecoffee.com'
      },
      businessHours: {
        monday: { open: '07:00', close: '19:00' },
        tuesday: { open: '07:00', close: '19:00' },
        wednesday: { open: '07:00', close: '19:00' },
        thursday: { open: '07:00', close: '19:00' },
        friday: { open: '07:00', close: '20:00' },
        saturday: { open: '08:00', close: '20:00' },
        sunday: { open: '08:00', close: '18:00' }
      },
      features: ['Ocean View', 'Specialty Coffee', 'Breakfast All Day'],
      currentWaitTime: 10,
      qrCodes: {}
    }
  ];
  
  maxTableNumber: number = 20;
  
  bulkQrCodes: { tableNumber: number, dataUrl: string }[] = [];
  canShare: boolean = false;
  
  constructor(
    private tableService: TableService,
    private alertController: AlertController,
    private toastController: ToastController,
    private loadingController: LoadingController
  ) {
    addIcons({ 
      printOutline, 
      downloadOutline, 
      qrCodeOutline, 
      refreshOutline,
      shareOutline,
      gridOutline,
      scanOutline
    });
    
    // Check if the Web Share API is available
    this.canShare = !!navigator.share;
  }
  
  ngOnInit() {
    // Set default store if none selected
    if (!this.storeId && this.availableStores.length > 0) {
      this.storeId = this.availableStores[0].id;
      this.loadStoreInfo();
    }
  }
  
  /**
   * Load store information for the selected store
   */
  loadStoreInfo() {
    if (!this.storeId) return;
    
    // Find the selected store from our hard-coded list
    const selectedStore = this.availableStores.find(store => store.id === this.storeId);
    
    if (selectedStore) {
      this.storeName = selectedStore.name;
      this.maxTableNumber = selectedStore.tableCount;
    }
  }
  
  /**
   * Generate a single QR code for the selected table
   */
  async generateQR() {
    if (!this.storeId || !this.tableNumber) return;
    
    const loading = await this.loadingController.create({
      message: 'Generating QR code...',
      duration: 5000 // Max 5 seconds
    });
    await loading.present();
    
    try {
      // Create QR code data using the service
      this.qrData = this.tableService.generateTableQRData(this.storeId, this.tableNumber);
      
      // Generate QR code with optimized settings for mobile scanning
      this.qrDataUrl = await QRCode.toDataURL(this.qrData, {
        width: this.qrSettings.size,
        margin: this.qrSettings.margin,
        errorCorrectionLevel: this.qrSettings.errorCorrectionLevel,
        color: {
          dark: this.qrSettings.dark,
          light: this.qrSettings.light
        }
      });
      
      loading.dismiss();
      this.showToast('QR code generated successfully');
    } catch (err) {
      loading.dismiss();
      console.error('Error generating QR code:', err);
      this.showToast('Error generating QR code');
    }
  }
  
  /**
   * Generate QR codes for all tables in the store
   */
  async generateBulkQR() {
    if (!this.storeId) return;
    
    // Find the selected store for table count
    const selectedStore = this.availableStores.find(store => store.id === this.storeId);
    if (!selectedStore) return;
    
    // Confirm with the user
    const alert = await this.alertController.create({
      header: 'Generate Multiple QR Codes',
      message: `This will generate QR codes for all tables (1-${selectedStore.tableCount}). Continue?`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Generate',
          handler: async () => {
            this.bulkQrCodes = [];
            
            const loading = await this.loadingController.create({
              message: `Generating QR codes for ${selectedStore.tableCount} tables...`,
              duration: 15000 // Max 15 seconds
            });
            await loading.present();
            
            try {
              // Generate QR codes for each table
              const promises = [];
              for (let i = 1; i <= selectedStore.tableCount; i++) {
                const qrData = this.tableService.generateTableQRData(this.storeId, i);
                
                const promise = QRCode.toDataURL(qrData, {
                  width: 200, // Smaller size for bulk
                  margin: this.qrSettings.margin,
                  errorCorrectionLevel: this.qrSettings.errorCorrectionLevel,
                  color: {
                    dark: this.qrSettings.dark,
                    light: this.qrSettings.light
                  }
                }).then((url: string) => {
                  this.bulkQrCodes.push({
                    tableNumber: i,
                    dataUrl: url
                  });
                });
                
                promises.push(promise);
              }
              
              // Sort by table number once all are generated
              await Promise.all(promises);
              this.bulkQrCodes.sort((a, b) => a.tableNumber - b.tableNumber);
              
              loading.dismiss();
              this.showToast(`Generated QR codes for ${selectedStore.tableCount} tables`);
            } catch (err) {
              loading.dismiss();
              console.error('Error generating bulk QR codes:', err);
              this.showToast('Error generating QR codes');
            }
          }
        }
      ]
    });
    
    await alert.present();
  }
  
  /**
   * Download the current QR code as an image
   */
  downloadQR() {
    if (!this.qrDataUrl) return;
    
    const link = document.createElement('a');
    link.href = this.qrDataUrl;
    link.download = `table-${this.storeId}-${this.tableNumber}-qr.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    this.showToast('QR code downloaded');
  }
  
  /**
   * Print the current QR code
   */
  printQR() {
    window.print();
  }
  
  /**
   * Share the QR code using the Web Share API (mobile only)
   */
  async shareQR() {
    if (!this.qrDataUrl || !navigator.share) return;
    
    try {
      // Convert the data URL to a blob
      const response = await fetch(this.qrDataUrl);
      const blob = await response.blob();
      
      // Create a file from the blob
      const file = new File([blob], `table-${this.storeId}-${this.tableNumber}-qr.png`, { type: 'image/png' });
      
      // Check if sharing files is supported
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        // Share the file
        await navigator.share({
          title: `Table ${this.tableNumber} QR Code`,
          text: `QR Code for Table ${this.tableNumber} at ${this.storeName}`,
          files: [file]
        });
      } else {
        // Fallback to sharing just the text
        await navigator.share({
          title: `Table ${this.tableNumber} QR Code`,
          text: `QR Code for Table ${this.tableNumber} at ${this.storeName}`,
          // Can't share the QR code as an image
        });
      }
    } catch (error) {
      console.error('Error sharing QR code:', error);
      this.showToast('Could not share QR code');
    }
  }
  
  /**
   * Test the QR code by using our service to parse it
   */
  async testQR() {
    if (!this.qrData) {
      this.showToast('Generate a QR code first');
      return;
    }
    
    const loading = await this.loadingController.create({
      message: 'Testing QR code...',
      duration: 3000
    });
    await loading.present();
    
    // Test the QR code by using our table service to parse it
    this.tableService.getTableInfoFromQRCode(this.qrData).subscribe({
      next: (tableInfo) => {
        loading.dismiss();
        // Show success alert with the table info
        this.presentTestResults(true, tableInfo);
      },
      error: (error) => {
        loading.dismiss();
        console.error('QR code test failed:', error);
        this.presentTestResults(false, null, error.message);
      }
    });
  }
  
  /**
   * Display the results of the QR code test
   */
  async presentTestResults(success: boolean, tableInfo?: any, errorMessage?: string) {
    let message = '';
    
    if (success && tableInfo) {
      message = `QR code is valid and contains the following information:<br><br>
                 <strong>Store ID:</strong> ${tableInfo.storeId}<br>
                 <strong>Table Number:</strong> ${tableInfo.tableNumber}<br><br>
                 This QR code should work with mobile scanners.`;
    } else {
      message = `QR code test failed: ${errorMessage || 'Unknown error'}`;
    }
    
    const alert = await this.alertController.create({
      header: success ? 'QR Code Valid' : 'QR Code Invalid',
      message,
      buttons: ['OK']
    });
    
    await alert.present();
  }
  
  /**
   * Download all QR codes as a ZIP file or PDF
   */
  downloadAllQR() {
    // Since we can't create a ZIP file easily in the browser,
    // we'll just notify the user about the limitation
    this.showToast('To download all QR codes, please use the print function and save as PDF');
    
    // In a real app, you would use JSZip or a similar library
    // to create a ZIP file with all QR codes
  }
  
  /**
   * Print all QR codes
   */
  printAllQR() {
    window.print();
  }
  
  /**
   * Show a toast message
   */
  async showToast(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      position: 'bottom'
    });
    
    await toast.present();
  }
}