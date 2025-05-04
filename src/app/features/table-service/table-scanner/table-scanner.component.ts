import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationExtras } from '@angular/router';
import { Subject, takeUntil, from } from 'rxjs';
import { BrowserMultiFormatReader, BarcodeFormat, DecodeHintType } from '@zxing/library';

import {  
  ToastController, 
  AlertController, 
  LoadingController,
  Platform
} from '@ionic/angular/standalone';
import { 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonButtons, 
  IonButton, 
  IonIcon,
  IonContent,
  IonBackButton,
  IonCard,
  IonCardContent,
  IonSpinner
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  qrCodeOutline, 
  flashOutline, 
  flashOffOutline, 
  alertCircleOutline,
  scanOutline,
  stopCircleOutline,
  arrowBackOutline,
  cafeOutline
} from 'ionicons/icons';

import { TableService, TableInfo } from '../../../core/services/table.service';
import { AuthService } from '../../../core/services/auth.service';
import { OrderService } from '../../../core/services/order.service';

@Component({
  selector: 'app-table-scanner',
  templateUrl: './table-scanner.component.html',
  styleUrls: ['./table-scanner.component.scss'],
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
    IonBackButton,
    IonCard,
    IonCardContent,
    IonSpinner
  ]
})
export class TableScannerComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('videoElement', { static: false }) videoElement!: ElementRef<HTMLVideoElement>;
  
  hasPermission = false;
  isScanning = false;
  processingQR = false;
  scanError: string | null = null;
  scanResult: string | null = null;
  tableInfo: TableInfo | null = null;
  
  private mediaStream: MediaStream | null = null;
  private codeReader: BrowserMultiFormatReader;
  private destroy$ = new Subject<void>();
  
  constructor(
    private platform: Platform,
    private tableService: TableService,
    private authService: AuthService,
    private orderService: OrderService,
    private router: Router,
    private toastController: ToastController,
    private alertController: AlertController,
    private loadingController: LoadingController
  ) {
    addIcons({ 
      qrCodeOutline, 
      flashOutline, 
      flashOffOutline, 
      alertCircleOutline,
      scanOutline,
      stopCircleOutline,
      arrowBackOutline,
      cafeOutline
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
    this.checkPermissions();
  }
  
  ngAfterViewInit() {
    // If the user has already granted permission, start scanning automatically
    if (this.hasPermission) {
      this.startScanner();
    }
  }
  
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.stopScanner();
  }
  
  /**
   * Check camera permissions
   */
  async checkPermissions() {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        // Request camera permission
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: 'environment', // Use back camera on mobile
            width: { ideal: 1280 },
            height: { ideal: 720 }
          } 
        });
        
        // Release camera immediately after checking
        stream.getTracks().forEach(track => track.stop());
        this.hasPermission = true;
        this.scanError = null;
      } else {
        this.hasPermission = false;
        this.scanError = 'Camera API not supported in this browser';
      }
    } catch (error) {
      this.hasPermission = false;
      this.scanError = 'Camera permission denied';
      console.error('Camera permission error:', error);
    }
  }
  
  /**
   * Toggle scanner on/off
   */
  toggleScanner() {
    if (this.isScanning) {
      this.stopScanner();
    } else {
      this.startScanner();
    }
  }
  
  /**
   * Start the QR scanner
   */
  async startScanner() {
    if (!this.hasPermission || !this.videoElement) {
      return;
    }
    
    this.scanError = null;
    this.scanResult = null;
    this.isScanning = true;
    
    try {
      const videoElement = this.videoElement.nativeElement;
      
      // Optimize for back camera on mobile devices
      const constraints = {
        video: {
          facingMode: this.platform.is('mobile') ? 'environment' : 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };
      
      // Start decoding from video feed
      this.codeReader.decodeFromConstraints(constraints, videoElement, (result, error) => {
        if (result) {
          // Only process if we're not already processing
          if (!this.processingQR) {
            this.scanResult = result.getText();
            this.processingQR = true;
            this.processQRCode(this.scanResult);
          }
        }
        
        if (error && error.name !== 'NotFoundException') {
          // Only handle non-"not found" errors
          if (error.name === 'NotAllowedError') {
            this.hasPermission = false;
            this.isScanning = false;
            this.scanError = 'Camera permission denied';
            this.stopScanner();
          } else if (error.name !== 'NotFoundException') {
            console.error('QR scanning error:', error);
            this.scanError = `Error: ${error.message}`;
          }
        }
      });
    } catch (error) {
      console.error('Error starting scanner:', error);
      this.scanError = 'Failed to start scanner';
      this.isScanning = false;
    }
  }
  
  /**
   * Stop the QR scanner
   */
  stopScanner() {
    this.isScanning = false;
    this.codeReader.reset();
    
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
  }
  
  /**
   * Process the scanned QR code
   */
  async processQRCode(qrCode: string) {
    if (!qrCode) {
      this.processingQR = false;
      return;
    }
    
    const loading = await this.loadingController.create({
      message: 'Processing table information...',
      duration: 5000 // Maximum 5 seconds
    });
    await loading.present();
    
    console.log('Processing QR code:', qrCode);
    
    this.tableService.getTableInfoFromQRCode(qrCode)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: async (tableInfo) => {
          loading.dismiss();
          this.tableInfo = tableInfo;
          
          // Stop scanner as we have a valid result
          this.stopScanner();
          
          // Display success message
          const toast = await this.toastController.create({
            message: `Successfully connected to Table ${tableInfo.tableNumber}`,
            duration: 2000,
            position: 'bottom',
            color: 'success'
          });
          await toast.present();
          
          // Navigate to menu for ordering with table info
          this.navigateToMenu(tableInfo);
          
          // Reset processing flag
          this.processingQR = false;
        },
        error: async (error) => {
          loading.dismiss();
          this.processingQR = false;
          this.scanError = error.message || 'Invalid QR code';
          
          const alert = await this.alertController.create({
            header: 'QR Code Error',
            message: `Could not process QR code: ${error.message}`,
            buttons: ['OK']
          });
          await alert.present();
          
          // Restart scanner after error
          setTimeout(() => {
            this.scanError = null;
            if (this.isScanning) {
              this.startScanner();
            }
          }, 3000);
        }
      });
  }
  
  /**
   * Navigate to the menu with table information
   */
  navigateToMenu(tableInfo: TableInfo) {
    // Get current user
    this.authService.getCurrentUser().then(user => {
      if (!user) {
        // If no user, navigate to login first
        this.router.navigate(['/auth/login'], {
          queryParams: {
            returnUrl: '/menu',
            tableOrder: 'true',
            storeId: tableInfo.storeId,
            tableNumber: tableInfo.tableNumber
          }
        });
        return;
      }
      
      // Navigate to menu with table info
      this.router.navigate(['/menu'], {
        queryParams: {
          tableOrder: 'true',
          storeId: tableInfo.storeId,
          tableNumber: tableInfo.tableNumber
        }
      });
    });
  }
}