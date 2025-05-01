// src/app/shared/components/loading-spinner/loading-spinner.component.ts

import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import {IonSpinner} from '@ionic/angular/standalone';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [CommonModule,IonSpinner],
  template: `
    <div class="loading-container" [ngClass]="{ 'transparent': transparent }">
      <ion-spinner [name]="spinnerType"></ion-spinner>
      <p *ngIf="message">{{ message }}</p>
    </div>
    <style>
      .loading-container {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        height: 100%;
        min-height: 100px;
        text-align: center;
        padding: 20px;
      }
      
      .loading-container.transparent {
        background-color: rgba(255, 255, 255, 0.7);
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 9999;
      }
      
      .loading-container p {
        margin-top: 10px;
        color: var(--ion-color-medium);
      }
      
      ion-spinner {
        transform: scale(1.5);
      }
    </style>
  `,
})
export class LoadingSpinnerComponent {
  @Input() message: string = 'Loading...';
  @Input() spinnerType: string = 'circular';
  @Input() transparent: boolean = false;
}