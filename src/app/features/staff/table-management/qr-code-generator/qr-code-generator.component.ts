// src/app/features/staff/table-management/qr-code-generator/qr-code-generator.component.ts

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
  AlertController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { printOutline, downloadOutline, qrCodeOutline, refreshOutline } from 'ionicons/icons';
import * as QRCode from 'qrcode';

import { TableService } from '../../../../core/services/table.service';

@Component({
  selector: 'app-qr-code-generator',
  template: `
    <ion-header>
      <ion-toolbar color="primary">
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
                  <ion-label position="floating">Store ID</ion-label>
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
                    <ion-input type="number" [(ngModel)]="qrSize" min="128" max="512" step="32"></ion-input>
                  </ion-item>
                  
                  <ion-item>
                    <ion-label position="floating">Error Correction Level</ion-label>
                    <ion-select [(ngModel)]="errorCorrection">
                      <ion-select-option value="L">Low (7%)</ion-select-option>
                      <ion-select-option value="M">Medium (15%)</ion-select-option>
                      <ion-select-option value="Q">Quartile (25%)</ion-select-option>
                      <ion-select-option value="H">High (30%)</ion-select-option>
                    </ion-select>
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
    IonIcon
  ]
})
export class QrCodeGeneratorComponent implements OnInit {
  storeId: string = '';
  storeName: string = '';
  tableNumber: number = 1;
  qrSize: number = 256;
  errorCorrection: 'L' | 'M' | 'Q' | 'H' = 'M';
  
  qrData: string = '';
  qrDataUrl: string = '';
  
  availableStores: any[] = [];
  maxTableNumber: number = 50;
  
  bulkQrCodes: { tableNumber: number, dataUrl: string }[] = [];
  
  constructor(
    private tableService: TableService,
    private alertController: AlertController
  ) {
    addIcons({ printOutline, downloadOutline, qrCodeOutline, refreshOutline });
  }
  
  ngOnInit() {
    this.loadAvailableStores();
  }
  
  loadAvailableStores() {
    // In a real app, this would fetch from your database
    // For now, we'll use mock data
    this.availableStores = [
      { id: 'main-store', name: 'Main Store' },
      { id: 'downtown', name: 'Downtown Branch' },
      { id: 'campus', name: 'University Campus' }
    ];
  }
  
  loadStoreInfo() {
    if (!this.storeId) return;
    
    this.tableService.getStoreInfo(this.storeId).subscribe(
      store => {
        if (store) {
          this.storeName = store.name;
          this.maxTableNumber = store.tableCount || 50;
        }
      },
      error => {
        console.error('Error loading store info:', error);
      }
    );
  }
  
  generateQR() {
    if (!this.storeId || !this.tableNumber) return;
    
    // Create QR code data in the specified format
    this.qrData = `cafe-app://table/${this.storeId}/${this.tableNumber}`;
    
    // Generate QR code
    QRCode.toDataURL(this.qrData, {
      width: this.qrSize,
      margin: 1,
      errorCorrectionLevel: this.errorCorrection,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    }).then((url:any) => {
      this.qrDataUrl = url;
    }).catch((err:any) => {
      console.error('Error generating QR code:', err);
    });
  }
  
  async generateBulkQR() {
    if (!this.storeId) return;
    
    // Confirm with the user
    const alert = await this.alertController.create({
      header: 'Generate Multiple QR Codes',
      message: `This will generate QR codes for all tables (1-${this.maxTableNumber}). Continue?`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Generate',
          handler: () => {
            this.bulkQrCodes = [];
            
            // Generate QR codes for each table
            const promises = [];
            for (let i = 1; i <= this.maxTableNumber; i++) {
              const qrData = `cafe-app://table/${this.storeId}/${i}`;
              
              const promise = QRCode.toDataURL(qrData, {
                width: 200, // Smaller size for bulk
                margin: 1,
                errorCorrectionLevel: this.errorCorrection,
                color: {
                  dark: '#000000',
                  light: '#FFFFFF'
                }
              }).then((url:any) => {
                this.bulkQrCodes.push({
                  tableNumber: i,
                  dataUrl: url
                });
              });
              
              promises.push(promise);
            }
            
            // Sort by table number once all are generated
            Promise.all(promises).then(() => {
              this.bulkQrCodes.sort((a, b) => a.tableNumber - b.tableNumber);
            });
          }
        }
      ]
    });
    
    await alert.present();
  }
  
  downloadQR() {
    if (!this.qrDataUrl) return;
    
    const link = document.createElement('a');
    link.href = this.qrDataUrl;
    link.download = `table-${this.tableNumber}-qr.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
  
  printQR() {
    window.print();
  }
  
  downloadAllQR() {
    // Create a zip file with all QR codes
    // For simplicity, we'll just download the first one as an example
    if (this.bulkQrCodes.length > 0) {
      const link = document.createElement('a');
      link.href = this.bulkQrCodes[0].dataUrl;
      link.download = `table-all-qr.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // In a real app, you would use a library like JSZip to create a zip file
      // with all the QR codes and then download that file
    }
  }
  
  printAllQR() {
    window.print();
  }
}