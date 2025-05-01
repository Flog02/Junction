// src/app/shared/components/empty-state/empty-state.component.ts

import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonIcon,IonButton } from '@ionic/angular/standalone';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule,IonIcon,IonButton],
  template: `
    <div class="empty-state">
      <ion-icon [name]="icon" *ngIf="icon"></ion-icon>
      <h2 *ngIf="title">{{ title }}</h2>
      <p *ngIf="message">{{ message }}</p>
      <ion-button *ngIf="buttonText" [fill]="buttonFill" (click)="buttonClick.emit()">
        {{ buttonText }}
      </ion-button>
    </div>
    <style>
      .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
        padding: 2rem;
        min-height: 200px;
      }
      
      .empty-state ion-icon {
        font-size: 4rem;
        color: var(--ion-color-medium);
        margin-bottom: 1rem;
      }
      
      .empty-state h2 {
        font-size: 1.2rem;
        font-weight: bold;
        margin-bottom: 0.5rem;
        color: var(--ion-color-dark);
      }
      
      .empty-state p {
        font-size: 1rem;
        color: var(--ion-color-medium);
        max-width: 300px;
        margin-bottom: 1.5rem;
      }
    </style>
  `,
})
export class EmptyStateComponent {
  @Input() icon: string = 'alert-circle-outline';
  @Input() title: string = 'No Data';
  @Input() message: string = 'There\'s nothing here yet.';
  @Input() buttonText: string = '';
  @Input() buttonFill: 'clear' | 'outline' | 'solid' = 'outline';
  @Output() buttonClick = new EventEmitter<void>();
}