// src/app/features/table-service/qr-scanner/qr-scanner.component.ts
import { Component, ViewChild, ElementRef, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BrowserMultiFormatReader } from '@zxing/library';
import { 
  IonButton, 
  IonIcon, 
  IonSpinner, 
  IonCard, 
  IonCardContent,
  ToastController 
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { scanOutline, stopCircleOutline, flashlightOutline } from 'ionicons/icons';
import { TableService } from '../core/services/table.service';
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
  @Output() tableScanComplete = new EventEmitter<any>();
  
  private codeReader: BrowserMultiFormatReader;
  isScanning = false;
  hasPermission = false;
  scanError = '';
  processingQR = false;
  
  constructor(
    private tableService: TableService,
    private toastController: ToastController
  ) {
    addIcons({ scanOutline, stopCircleOutline, flashlightOutline });
    this.codeReader = new BrowserMultiFormatReader();
  }

  ngOnInit() {
    // Check camera permissions
    this.checkPermissions();
  }

  ngOnDestroy() {
    this.stopScanner();
  }

  async checkPermissions() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      // Release the stream immediately
      stream.getTracks().forEach(track => track.stop());
      this.hasPermission = true;
    } catch (err) {
      this.hasPermission = false;
      this.scanError = 'Camera permission denied';
      console.error('Camera permission error:', err);
    }
  }

  startScanner() {
    if (!this.hasPermission) {
      this.checkPermissions();
      return;
    }

    this.isScanning = true;
    this.scanError = '';
    
    // Wait for the view to be fully initialized
    setTimeout(() => {
      if (!this.videoElement) {
        this.scanError = 'Video element not found';
        this.isScanning = false;
        return;
      }
      
      const videoElement = this.videoElement.nativeElement;
      
      this.codeReader.decodeFromVideoDevice(
        null, 
        videoElement, 
        (result, err) => {
          if (result && !this.processingQR) {
            this.processingQR = true;
            const qrData = result.getText();
            console.log('QR Code detected:', qrData);
            
            // Process the QR code
            this.processQrCode(qrData);
          }
          
          if (err && err.name !== 'NotFoundException') {
            console.error('QR scanning error:', err);
            this.scanError = `Scanning error: ${err.message}`;
          }
        }
      );
    }, 500);
  }

  stopScanner() {
    this.codeReader.reset();
    this.isScanning = false;
  }

  toggleScanner() {
    if (this.isScanning) {
      this.stopScanner();
    } else {
      this.startScanner();
    }
  }

  private processQrCode(qrData: string) {
    // Check if QR code matches our expected format
    if (qrData.startsWith('cafe-app://table/')) {
      this.tableService.getTableInfoFromQRCode(qrData).subscribe({
        next: (tableInfo) => {
          this.showToast('Table scanned successfully');
          this.stopScanner();
          this.tableScanComplete.emit(tableInfo);
        },
        error: (error) => {
          console.error('Error processing QR code:', error);
          this.showToast(`Invalid QR code: ${error.message}`);
          this.processingQR = false;
        }
      });
    } else {
      this.showToast('Invalid QR code format');
      this.processingQR = false;
    }
  }

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