import { Component, ViewChild, ElementRef, Output, EventEmitter, OnInit, OnDestroy, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { BrowserMultiFormatReader, BarcodeFormat, DecodeHintType, Result } from '@zxing/library';
import { 
  IonButton, 
  IonIcon, 
  IonSpinner, 
  IonCard, 
  IonCardContent,
  ToastController,
  Platform,
  LoadingController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { scanOutline, stopCircleOutline, flashlightOutline, alertCircleOutline } from 'ionicons/icons';
import { TableService,TableInfo } from '../core/services/table.service';

@Component({
  selector: 'app-qr-scanner',
  templateUrl: './qr-scanner.component.html',
  styleUrls: ['./qr-scanner.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonButton,
    IonIcon,
    IonSpinner,
    IonCard,
    IonCardContent
  ]
})
export class QrScannerComponent implements OnInit, OnDestroy {
  @ViewChild('videoElement', { static: false }) videoElement!: ElementRef;
  @Output() tableScanComplete = new EventEmitter<TableInfo>();
  
  private codeReader: BrowserMultiFormatReader;
  private videoStream: MediaStream | null = null;
  isScanning = false;
  hasPermission = false;
  scanError = '';
  processingQR = false;
  scanSuccess = false;
  
  constructor(
    private tableService: TableService,
    private toastController: ToastController,
    private platform: Platform,
    private router: Router,
    private ngZone: NgZone,
    private loadingController: LoadingController
  ) {
    addIcons({ scanOutline, stopCircleOutline, flashlightOutline, alertCircleOutline });
    
    // Configure the QR code reader with enhanced settings
    const hints = new Map();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.QR_CODE]);
    hints.set(DecodeHintType.TRY_HARDER, true);
    hints.set(DecodeHintType.CHARACTER_SET, 'UTF-8');
    this.codeReader = new BrowserMultiFormatReader(hints);
  }

  ngOnInit() {
    // Make sure we're using mock data for testing
    if (this.tableService.setUseMockData) {
      this.tableService.setUseMockData(true);
    }
    // Check camera permissions
    this.checkPermissions();
  }

  ngOnDestroy() {
    this.stopScanner();
    this.releaseVideoStream();
  }

  /**
   * Release video stream resources
   */
  private releaseVideoStream() {
    if (this.videoStream) {
      this.videoStream.getTracks().forEach(track => {
        try {
          track.stop();
        } catch (e) {
          console.error('Error stopping track:', e);
        }
      });
      this.videoStream = null;
    }
  }

  /**
   * Check camera permissions and capabilities
   */
  async checkPermissions() {
    try {
      // Request camera permissions with basic settings first
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      
      // Store the stream for later cleanup
      this.videoStream = stream;
      
      // Release the stream immediately for permission check
      this.releaseVideoStream();
      
      this.hasPermission = true;
      this.scanError = '';
    } catch (err) {
      this.hasPermission = false;
      this.scanError = 'Camera permission denied';
      console.error('Camera permission error:', err);
    }
  }

  /**
   * Start the QR code scanner with optimized settings
   */
  startScanner() {
    if (!this.hasPermission) {
      this.checkPermissions();
      return;
    }

    this.isScanning = true;
    this.scanError = '';
    this.processingQR = false;
    this.scanSuccess = false;
    
    // Wait for the view to be fully initialized
    setTimeout(() => {
      if (!this.videoElement) {
        this.scanError = 'Video element not found';
        this.isScanning = false;
        return;
      }
      
      const videoElement = this.videoElement.nativeElement;
      
      // First reset any existing scanner
      try {
        this.codeReader.reset();
      } catch (e) {
        console.log('Reset not needed', e);
      }
      
      // Minimal camera constraints to start with
      const constraints = {
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };
      
      // Handle successful scan
      const handleSuccess = (result: Result) => {
        this.ngZone.run(() => {
          if (result && !this.processingQR && !this.scanSuccess) {
            this.scanSuccess = true; // Prevent multiple scans
            this.processingQR = true;
            const qrData = result.getText();
            console.log('QR Code detected:', qrData);
            
            // Process the QR code
            this.processQrCode(qrData);
          }
        });
      };
      
      // Handle scanning errors
      const handleError = (error: any) => {
        if (error && error.name !== 'NotFoundException') {
          console.error('QR scanning error:', error);
        }
      };
      
      // Start scanning
      this.codeReader.decodeFromConstraints(constraints, videoElement, (result, error) => {
        if (result) {
          handleSuccess(result);
        }
        if (error && error.name !== 'NotFoundException') {
          handleError(error);
        }
      })
      .catch(err => {
        console.error('Error starting scanner:', err);
        this.scanError = 'Failed to initialize camera';
        this.isScanning = false;
      });
    }, 800); // Increased timeout for slower devices
  }

  /**
   * Stop the QR code scanner
   */
  stopScanner() {
    try {
      this.codeReader.reset();
    } catch (e) {
      console.log('Error resetting code reader', e);
    }
    this.releaseVideoStream();
    this.isScanning = false;
  }

  /**
   * Toggle the scanner on/off
   */
  toggleScanner() {
    if (this.isScanning) {
      this.stopScanner();
    } else {
      this.startScanner();
    }
  }

  /**
   * Process the scanned QR code
   */
  private async processQrCode(qrData: string) {
    console.log('Processing QR code:', qrData);
    
    // Show loading indicator
    const loading = await this.loadingController.create({
      message: 'Processing QR code...',
      duration: 5000
    });
    await loading.present();
    
    // First stop the scanner to release camera
    this.stopScanner();
    
    // Direct URL extraction for more reliable handling
    try {
      // Extract table info directly from URL pattern
      if (qrData.includes('/table/')) {
        const parts = qrData.split('/table/');
        if (parts.length > 1) {
          const tableParts = parts[1].split('/');
          if (tableParts.length === 2) {
            const storeId = tableParts[0];
            const tableNumber = parseInt(tableParts[1], 10);
            
            if (!isNaN(tableNumber)) {
              // Try to get table info from service
              this.tableService.getTableInfoFromQRCode(qrData).subscribe({
                next: (tableInfo) => {
                  loading.dismiss();
                  this.showToast('Table scanned successfully');
                  
                  // Emit the event for parent components
                  this.tableScanComplete.emit(tableInfo);
                  
                  // Also navigate directly to the order page
                  this.navigateToOrder(tableInfo);
                },
                error: (error) => {
                  console.error('Error processing table info:', error);
                  
                  // Fallback: create basic table info
                  const basicTableInfo: TableInfo = {
                    storeId: storeId,
                    tableNumber: tableNumber,
                    seats: 4, // Default
                    status: 'available', // Default
                    qrCodeUrl: ''
                  };
                  
                  loading.dismiss();
                  this.showToast('QR code recognized. Loading table info...');
                  
                  // Emit the event with basic info
                  this.tableScanComplete.emit(basicTableInfo);
                  
                  // Navigate with basic info
                  this.navigateToOrder(basicTableInfo);
                }
              });
              return; // Exit after handling
            }
          }
        }
      }
      
      // Fallback to regular processing if direct extraction fails
      this.tableService.getTableInfoFromQRCode(qrData).subscribe({
        next: (tableInfo) => {
          loading.dismiss();
          this.showToast('Table scanned successfully');
          
          // Emit the event for parent components
          this.tableScanComplete.emit(tableInfo);
          
          // Also navigate directly to the order page
          this.navigateToOrder(tableInfo);
        },
        error: (error) => {
          loading.dismiss();
          console.error('Error processing QR code:', error);
          this.showToast('Invalid QR code: Unable to recognize table information');
          this.processingQR = false;
          this.scanSuccess = false;
          // Restart scanner
          this.startScanner();
        }
      });
    } catch (error) {
      loading.dismiss();
      console.error('Exception processing QR code:', error);
      this.showToast('Error processing QR code');
      this.processingQR = false;
      this.scanSuccess = false;
      // Restart scanner
      this.startScanner();
    }
  }

  /**
   * Navigate to the order page with table info
   */
  private navigateToOrder(tableInfo: TableInfo) {
    this.router.navigate(['/table-service/order'], {
      state: { tableInfo }
    });
  }

  /**
   * Display a toast message
   */
  private async showToast(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      position: 'bottom',
      color: message.includes('success') ? 'success' : message.includes('Invalid') ? 'danger' : 'primary'
    });
    await toast.present();
  }
}