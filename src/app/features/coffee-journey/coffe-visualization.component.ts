// Now, let's create the Coffee Visualization Component
// src/app/features/coffee-journey/coffee-visualization/coffee-visualization.component.ts

import { Component, OnInit, Input, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import {IonSpinner,IonIcon  } from '@ionic/angular/standalone';
import { Subject, takeUntil } from 'rxjs';
import { OrderItem } from 'src/app/core/models/order.model';
// import { CoffeeVizService } from 'src/app/core/services/coffee-viz.service';
import { Scene } from 'three';

@Component({
  selector: 'app-coffee-visualization',
  template:`<div class="visualization-container" [style.height]="height">
  <div id="coffee-canvas" class="canvas-container" #coffeeCanvas></div>
  
  <div class="loading-overlay" *ngIf="isLoading">
    <ion-spinner></ion-spinner>
    <p>Brewing your 3D coffee...</p>
  </div>
  
  <div class="error-overlay" *ngIf="errorMessage">
    <ion-icon name="warning-outline" size="large"></ion-icon>
    <p>{{ errorMessage }}</p>
    <!-- <ion-button size="small" (click)="loadVisualization()">Try Again</ion-button> -->
  </div>
</div>`,
  styles:`.visualization-container {
    position: relative;
    width: 100%;
    background-color: #f5f5f5;
    border-radius: 8px;
    overflow: hidden;
  }
  
  .canvas-container {
    width: 100%;
    height: 100%;
  }
  
  .loading-overlay, .error-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background-color: rgba(255, 255, 255, 0.8);
    z-index: 10;
  }
  
  .loading-overlay p, .error-overlay p {
    margin-top: 10px;
    color: var(--ion-color-medium);
  }
  
  .error-overlay ion-icon {
    color: var(--ion-color-danger);
    font-size: 48px;
  }`,
  standalone: true,
  imports: [CommonModule, IonSpinner,IonIcon]
})
export class CoffeeVisualizationComponent implements OnInit, OnDestroy {
  @ViewChild('coffeeCanvas', { static: true }) coffeeCanvas!: ElementRef;
  
  @Input() orderItem!: OrderItem;
  @Input() height: string = '300px';
  
  isLoading = true;
  errorMessage:any = null;
  
  private destroy$ = new Subject<void>();
//   private scene: THREE.Scene;
  
  constructor( private scene : Scene) {}
  // private coffeeVizService: CoffeeVizService
  ngOnInit(): void {
    if (!this.orderItem) {
      this.errorMessage = 'No order details provided';
      this.isLoading = false;
      return;
    }
    
    // this.loadVisualization();
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    
    // Cleanup scene
    // if (this.scene) {
    //   this.coffeeVizService.cleanupScene(this.scene);
    // }
  }
  
  /**
   * Loads the 3D visualization
   */
  // loadVisualization(): void {
  //   this.isLoading = true;
  //   this.errorMessage = null;
    
  //   this.coffeeVizService.createCoffeeVisualization('coffee-canvas', this.orderItem)
  //     .pipe(takeUntil(this.destroy$))
  //     .subscribe({
  //       next: (scene:any) => {
  //         this.scene = scene;
  //         this.isLoading = false;
  //       },
  //       error: (error:any) => {
  //         console.error('Failed to load coffee visualization:', error);
  //         this.errorMessage = 'Failed to load visualization';
  //         this.isLoading = false;
  //       }
  //     });
  // }
}