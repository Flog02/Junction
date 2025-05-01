// src/app/shared/components/qr-scanner/qr-scanner.component.ts

import { Component, OnInit, OnDestroy, Output, EventEmitter, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import{IonButton,IonIcon}from '@ionic/angular/standalone'
import { QrScannerService } from '../../../core/services/qr-scanner.service';

@Component({
  selector: 'app-qr-scanner',
  standalone: true,
  imports: [CommonModule,IonButton,IonIcon],
  template: `
    <div class="scanner-container" [ngClass]="{'active': isScanning}">
      <!-- Scanner GUI when active -->
      <div *ngIf="isScanning" class="scanner-active">
        <div class="scan-frame"></div>
        <div class="scan-instructions">Position the QR code in the frame</div>
        
        <div class="scanner-controls">
          <ion-button fill="clear" color="light" (click)="toggleFlashlight()">
            <ion-icon [name]="flashlightOn ? 'flash-off-outline' : 'flash-outline'"></ion-icon>
          </ion-button>
          
          <ion-button fill="clear" color="light" (click)="stopScanning()">
            <ion-icon name="close-circle-outline"></ion-icon>
          </ion-button>
        </div>
      </div>
      
      <!-- Start scanner button when inactive -->
      <div *ngIf="!isScanning" class="scanner-inactive">
        <ion-button (click)="startScanning()" [disabled]="!isSupported">
          <ion-icon name="scan-outline" slot="start"></ion-icon>
          {{ buttonText }}
        </ion-button>
        
        <p *ngIf="!isSupported" class="not-supported-message">
          QR scanning is not supported on this device or browser.
        </p>
      </div>
    </div>
    <style>
      .scanner-container {
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
        min-height: 200px;
      }
      
      .scanner-container.active {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0, 0, 0, 0.8);
        z-index: 9999;
      }
      
      .scanner-active {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
      }
      
      .scan-frame {
        width: 250px;
        height: 250px;
        border: 2px solid var(--ion-color-primary);
        border-radius: 12px;
        position: relative;
        margin-bottom: 20px;
      }
      
      .scan-frame::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 2px;
        background-color: var(--ion-color-primary);
        animation: scan 2s linear infinite;
      }
      
      @keyframes scan {
        0% { top: 0; }
        50% { top: calc(100% - 2px); }
        100% { top: 0; }
      }
      
      .scan-instructions {
        color: white;
        margin-bottom: 30px;
        text-align: center;
      }
      
      .scanner-controls {
        display: flex;
        gap: 20px;
      }
      
      .scanner-inactive {
        display: flex;
        flex-direction: column;
        align-items: center;
      }
      
      .not-supported-message {
        margin-top: 12px;
        color: var(--ion-color-danger);
        text-align: center;
        font-size: 14px;
      }
    </style>
  `,
})
export class QrScannerComponent implements OnInit, OnDestroy {
  @Input() buttonText: string = 'Scan QR Code';
  @Output() scanResult = new EventEmitter<string>();
  
  isScanning: boolean = false;
  isSupported: boolean = false;
  flashlightOn: boolean = false;
  
  private destroy$ = new Subject<void>();
  
  constructor(private qrScannerService: QrScannerService) {}
  
  ngOnInit() {
    this.isSupported = this.qrScannerService.isSupported;
  }
  
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.stopScanning();
  }
  
  startScanning() {
    if (!this.isSupported) return;
    
    this.isScanning = true;
    
    this.qrScannerService.startScan()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: result => {
          if (result && result.hasContent) {
            this.scanResult.emit(result.content);
            this.stopScanning();
          }
        },
        error: error => {
          console.error('Scan error:', error);
          this.stopScanning();
        }
      });
  }
  
  stopScanning() {
    if (this.isScanning) {
      this.qrScannerService.stopScan();
      this.isScanning = false;
      this.flashlightOn = false;
    }
  }
  
  async toggleFlashlight() {
    try {
      await this.qrScannerService.toggleFlashlight();
      this.flashlightOn = !this.flashlightOn;
    } catch (error) {
      console.error('Flashlight error:', error);
    }
  }
}