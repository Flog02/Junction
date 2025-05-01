// src/app/shared/components/product-card/product-card.component.ts

import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import{IonButton,IonIcon,IonBadge}from '@ionic/angular/standalone'

import { Product } from '../../../core/models/product.model';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule, RouterModule,IonButton,IonIcon,IonBadge],
  template: `
    <div class="product-card" [ngClass]="{'featured': featured, 'unavailable': !product.available}">
      <div class="product-image-container">
        <img [src]="product.imageURL" [alt]="product.name" class="product-image">
        <div *ngIf="!product.available" class="unavailable-overlay">
          <span>Unavailable</span>
        </div>
      </div>
      
      <div class="product-info">
        <h3 class="product-name">{{ product.name }}</h3>
        <p *ngIf="showDescription" class="product-description">{{ product.description }}</p>
        
        <div class="product-footer">
          <div class="product-price">{{ product.price | currency }}</div>
          
          <div class="product-actions">
            <ion-button 
              fill="clear" 
              size="small" 
              [disabled]="!product.available"
              (click)="onCustomize($event)"
              *ngIf="showCustomizeButton"
            >
              <ion-icon name="options-outline" slot="icon-only"></ion-icon>
            </ion-button>
            
            <ion-button 
              fill="clear" 
              size="small"
              [disabled]="!product.available"
              (click)="onAddToCart($event)"
            >
              <ion-icon name="add-circle-outline" slot="icon-only"></ion-icon>
            </ion-button>
          </div>
        </div>
      </div>
      
      <ion-badge 
        *ngIf="featured" 
        color="warning" 
        class="featured-badge"
      >
        Featured
      </ion-badge>
    </div>
    <style>
      .product-card {
        display: flex;
        flex-direction: column;
        border-radius: 12px;
        overflow: hidden;
        background-color: white;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        transition: transform 0.2s ease, box-shadow 0.2s ease;
        height: 100%;
        position: relative;
      }
      
      .product-card:active {
        transform: scale(0.98);
      }
      
      .product-card.featured {
        box-shadow: 0 4px 12px rgba(var(--ion-color-warning-rgb), 0.3);
      }
      
      .product-card.unavailable {
        opacity: 0.7;
      }
      
      .product-image-container {
        position: relative;
        height: 160px;
        overflow: hidden;
      }
      
      .product-image {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      
      .unavailable-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: rgba(0, 0, 0, 0.5);
        color: white;
        font-weight: bold;
      }
      
      .product-info {
        padding: 12px;
        display: flex;
        flex-direction: column;
        flex: 1;
      }
      
      .product-name {
        margin: 0 0 8px 0;
        font-size: 16px;
        font-weight: bold;
      }
      
      .product-description {
        margin: 0 0 12px 0;
        font-size: 14px;
        color: var(--ion-color-medium);
        overflow: hidden;
        text-overflow: ellipsis;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
      }
      
      .product-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: auto;
      }
      
      .product-price {
        font-weight: bold;
        color: var(--ion-color-primary);
      }
      
      .product-actions {
        display: flex;
      }
      
      .featured-badge {
        position: absolute;
        top: 12px;
        right: 12px;
        z-index: 1;
      }
    </style>
  `,
})
export class ProductCardComponent implements OnInit {
  @Input() product!: Product;
  @Input() featured: boolean = false;
  @Input() showDescription: boolean = true;
  @Input() showCustomizeButton: boolean = true;
  
  @Output() addToCart = new EventEmitter<Product>();
  @Output() customize = new EventEmitter<Product>();
  
  constructor() {}
  
  ngOnInit() {}
  
  onAddToCart(event: Event) {
    event.stopPropagation();
    this.addToCart.emit(this.product);
  }
  
  onCustomize(event: Event) {
    event.stopPropagation();
    this.customize.emit(this.product);
  }
}