import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationExtras } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { BrowserMultiFormatReader, BarcodeFormat, DecodeHintType } from '@zxing/library';

import {  
  ToastController, 
  AlertController, 
  LoadingController 
} from '@ionic/angular/standalone';
import { 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonButtons, 
  IonButton, 
  IonIcon,
  IonContent,
  IonBackButton
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  qrCodeOutline, 
  flashOutline, 
  flashOffOutline, 
  alertCircleOutline 
} from 'ionicons/icons';

import { TableService, TableInfo } from '../../../core/services/table.service';

@Component({
  selector: 'app-table-scanner',
  template: `
  <ion-header>
    <ion-toolbar>
      <ion-buttons slot="start">
        <ion-back-button defaultHref="/table-service"></ion-back-button>
      </ion-buttons>
      <ion-title>Scan Table QR Code</ion-title>
    </ion-toolbar>
  </ion-header>
  
  <ion-content class="ion-padding">
    <div *ngIf="!isSupported" class="scanner-not-supported">
      <ion-icon name="alert-circle-outline"></ion-icon>
      <h2>QR Scanner Not Supported</h2>
      <p>QR scanning is not available on this device or browser.</p>
      <p>Please try using a native mobile app or a supported browser.</p>
    </div>
    
    <div *ngIf="isSupported">
      <div *ngIf="!scanActive" class="scanner-inactive">
        <ion-icon name="qr-code-outline"></ion-icon>
        <h2>Scan Table QR Code</h2>
        <p>Scan the QR code on your table to place an order directly from your device.</p>
        <ion-button expand="block" (click)="startScan()">
          Start Scanning
        </ion-button>
      </div>
      
      <div *ngIf="scanActive" class="scanner-active">
        <div class="video-container">
          <video #videoElement width="100%" height="100%"></video>
          <div class="scan-box"></div>
        </div>
        <p class="scan-instructions">Position the QR code within the frame</p>
        <ion-button expand="block" (click)="stopScan()" color="danger">
          Cancel Scan
        </ion-button>
      </div>
    </div>
  </ion-content>
  `,
  styles: `
  .scanner-not-supported,
  .scanner-inactive {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 32px 16px;
  }
  
  .scanner-not-supported ion-icon,
  .scanner-inactive ion-icon {
    font-size: 64px;
    margin-bottom: 16px;
    color: var(--ion-color-primary);
  }
  
  .scanner-not-supported h2,
  .scanner-inactive h2 {
    font-size: 24px;
    margin-bottom: 16px;
  }
  
  .scanner-not-supported p,
  .scanner-inactive p {
    font-size: 16px;
    margin-bottom: 24px;
    color: var(--ion-color-medium);
  }
  
  .scanner-active {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
  }
  
  .video-container {
    position: relative;
    width: 100%;
    height: 0;
    padding-bottom: 100%;
    overflow: hidden;
    border-radius: 16px;
    background-color: #000;
    margin-bottom: 20px;
  }
  
  video {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  
  .scan-box {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    border: 2px solid var(--ion-color-primary);
    border-radius: 10px;
    width: 70%;
    height: 70%;
    box-shadow: 0 0 0 100vmax rgba(0, 0, 0, 0.5);
  }
  
  .scan-box::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background-color: var(--ion-color-primary);
    animation: scan-animation 2s linear infinite;
  }
  
  @keyframes scan-animation {
    0% {
      top: 0;
    }
    50% {
      top: calc(100% - 2px);
    }
    100% {
      top: 0;
    }
  }
  
  .scan-instructions {
    font-size: 16px;
    margin-bottom: 24px;
    color: var(--ion-color-medium);
  }
  `,
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    IonHeader, 
    IonToolbar, 
    IonTitle, 
    IonButtons, 
    IonButton, 
    IonIcon,
    IonContent,
    IonBackButton
  ]
})
export class TableScannerComponent implements OnInit, OnDestroy {
  @ViewChild('videoElement', { static: false }) videoElement!: ElementRef;
  
  scanActive = false;
  isSupported = false;
  scanResult: string | null = null;
  tableInfo: TableInfo | null = null;
  
  private codeReader: BrowserMultiFormatReader;
  private destroy$ = new Subject<void>();
  
  constructor(
    private tableService: TableService,
    private router: Router,
    private toastController: ToastController,
    private alertController: AlertController,
    private loadingController: LoadingController
  ) {
    addIcons({ 
      qrCodeOutline, 
      flashOutline, 
      flashOffOutline, 
      alertCircleOutline 
    });
    
    // Configure the QR code reader with optimized settings for mobile scanning
    const hints = new Map();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.QR_CODE]);
    hints.set(DecodeHintType.TRY_HARDER, true);
    this.codeReader = new BrowserMultiFormatReader(hints);
  }
  
  ngOnInit() {
    // Make sure we're using mock data to support test QR codes
    this.tableService.setUseMockData(true);
    
    // Check if camera is supported
    this.checkCameraSupport();
  }
  
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.stopScan();
  }
  
  /**
   * Check if camera is supported
   */
  async checkCameraSupport() {
    try {
      // Check if mediaDevices is supported
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        // Request camera permission to test support
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: 'environment', // Use back camera on mobile
            width: { ideal: 1280 },
            height: { ideal: 720 }
          } 
        });
        
        // Release camera immediately after checking
        stream.getTracks().forEach(track => track.stop());
        this.isSupported = true;
      } else {
        this.isSupported = false;
      }
    } catch (error) {
      this.isSupported = false;
      console.error('Camera permission denied or not available:', error);
    }
  }
  
  /**
   * Starts the QR code scanning
   */
  async startScan() {
    if (!this.isSupported) {
      this.presentAlert('QR Scanner Not Supported', 'QR scanning is not supported on this device or browser.');
      return;
    }
    
    this.scanActive = true;
    this.scanResult = null;
    this.tableInfo = null;
    
    // Wait for the video element to be available in the DOM
    setTimeout(() => {
      if (!this.videoElement) {
        this.scanActive = false;
        this.presentToast('Video element not found');
        return;
      }
      
      const videoElement = this.videoElement.nativeElement;
      
      // Optimize for back camera on mobile devices
      const constraints = {
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 },
          aspectRatio: { ideal: 1 }
        }
      };
      
      this.codeReader.decodeFromConstraints(
        constraints, 
        videoElement, 
        (result, err) => {
          if (result) {
            this.scanResult = result.getText();
            this.scanActive = false;
            this.stopScan();
            
            console.log('QR Code detected:', this.scanResult);
            this.processQRCode(this.scanResult);
          }
          
          if (err && err.name !== 'NotFoundException') {
            console.error('QR scanning error:', err);
          }
        }
      );
    }, 500);
  }
  
  /**
   * Stops the QR code scanning
   */
  stopScan() {
    if (this.scanActive) {
      this.scanActive = false;
      this.codeReader.reset();
    }
  }
  
  /**
   * Processes a QR code result
   */
  async processQRCode(qrCode: string) {
    const loading = await this.loadingController.create({
      message: 'Processing table information...',
      duration: 5000 // Maximum 5 seconds
    });
    await loading.present();
    
    console.log('Processing QR code:', qrCode);
    
    this.tableService.getTableInfoFromQRCode(qrCode)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: tableInfo => {
          loading.dismiss();
          this.tableInfo = tableInfo;
          
          // Navigate to table order page with the table info
          this.navigateToOrderPage(tableInfo);
        },
        error: error => {
          loading.dismiss();
          console.error('Error processing QR code:', error);
          this.presentToast(`Error: ${error.message}`);
        }
      });
  }
  
  /**
   * Navigate to the order page with table information
   */
  navigateToOrderPage(tableInfo: TableInfo) {
    // First show a success message
    this.presentToast(`Successfully connected to Table ${tableInfo.tableNumber}`);
    
    // Create navigation extras to pass the table info
    const navigationExtras: NavigationExtras = {
      state: { tableInfo }
    };
    
    // Navigate to the order page
    this.router.navigate(['/table-service/order'], navigationExtras);
  }
  
  /**
   * Helper to present toast messages
   */
  async presentToast(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      position: 'bottom'
    });
    
    await toast.present();
  }
  
  /**
   * Helper to present alert messages
   */
  async presentAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['OK']
    });
    
    await alert.present();
  }
}