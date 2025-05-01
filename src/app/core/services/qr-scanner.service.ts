// // src/app/core/services/qr-scanner.service.ts

// import { Injectable } from '@angular/core';
// import { BarcodeScanner, ScanResult } from '@capacitor-community/barcode-scanner';
// import { Platform } from '@ionic/angular/standalone';
// import { Observable, from, throwError } from 'rxjs';
// import { catchError } from 'rxjs/operators';

// export interface QRScannerOptions {
//   format?: string[];
//   scanMode?: 'CONTINUOUS' | 'SINGLE';
// }

// @Injectable({
//   providedIn: 'root'
// })
// export class QrScannerService {
//   isSupported = false;

//   constructor(private platform: Platform) {
//     // Check if QR scanning is supported on this device
//     if (this.platform.is('capacitor')) {
//       this.isSupported = true;
//     }
//   }

//   /**
//    * Starts the QR scanner
//    */
//   startScan(options?: QRScannerOptions): Observable<ScanResult> {
//     if (!this.isSupported) {
//       return throwError(() => new Error('QR scanning is not supported on this device or browser'));
//     }

//     return from(this.prepareScan().then(() => {
//       // Set scanner options if provided
//       if (options) {
//         if (options.format) {
//           BarcodeScanner.enableTorch();
//         }
//         if (options.scanMode && options.scanMode === 'CONTINUOUS') {
//           BarcodeScanner.enableTorch();
//         }
//       }

//       // Start the scanner
//       return BarcodeScanner.startScan();
//     })).pipe(
//       catchError(error => {
//         this.stopScan();
//         return throwError(() => error);
//       })
//     );
//   }

//   /**
//    * Prepares the device for scanning
//    */
//   async prepareScan(): Promise<void> {
//     // Check camera permission
//     const status = await BarcodeScanner.checkPermission({ force: true });

//     if (!status.granted) {
//       throw new Error('Permission denied');
//     }

//     // Make background transparent
//     BarcodeScanner.hideBackground();

//     // Add body class to modify styling
//     document.body.classList.add('qr-scanner-open');

//     // Hide elements that might interfere with the scan
//     const elements = document.querySelectorAll('.hide-on-scan');
//     elements.forEach(el => {
//       (el as HTMLElement).style.display = 'none';
//     });
//   }

//   /**
//    * Stops the scanner
//    */
//   stopScan(): void {
//     if (!this.isSupported) {
//       return;
//     }

//     // Stop the scanner
//     BarcodeScanner.stopScan();

//     // Restore background
//     BarcodeScanner.showBackground();

//     // Remove body class
//     document.body.classList.remove('qr-scanner-open');

//     // Restore hidden elements
//     const elements = document.querySelectorAll('.hide-on-scan');
//     elements.forEach(el => {
//       (el as HTMLElement).style.display = '';
//     });

//     // Turn off the flashlight if it was on
//     BarcodeScanner.disableTorch();
//   }

//   /**
//    * Toggles the flashlight
//    */
//   toggleFlashlight(): Promise<void> {
//     if (!this.isSupported) {
//       return Promise.reject('QR scanning is not supported on this device');
//     }

//     return BarcodeScanner.toggleTorch();
//   }
// }