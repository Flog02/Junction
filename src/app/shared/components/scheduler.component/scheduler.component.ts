import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  IonCard, 
  IonCardHeader, 
  IonCardTitle, 
  IonCardContent,
  IonButton,
  IonImg,
  IonLabel,
  IonSkeletonText,
  IonIcon,
  IonRow,
  IonCol,
  IonGrid
} from '@ionic/angular/standalone';
import { RouterModule } from '@angular/router';
import { SuggestionService } from 'src/app/core/services/products-suggestion.service';
import { addIcons } from 'ionicons';
import { sparklesOutline, thumbsUpOutline, cafeOutline } from 'ionicons/icons';

@Component({
  selector: 'app-product-suggestions',
  template: `
    <ion-card class="suggestion-card">
      <ion-card-header>
        <ion-card-title>
          <ion-icon name="sparkles-outline"></ion-icon>
          Just For You
        </ion-card-title>
      </ion-card-header>
      
      <ion-card-content>
        <p class="suggestion-subtitle">Based on your order history</p>
        
        <!-- Loading state -->
        <div *ngIf="loading" class="suggestion-loading">
          <ion-grid>
            <ion-row>
              <ion-col size="6" *ngFor="let i of [1,2,3,4]">
                <div class="product-card">
                  <ion-skeleton-text [animated]="true" style="width: 100%; height: 100px;"></ion-skeleton-text>
                  <ion-skeleton-text [animated]="true" style="width: 70%; height: 20px; margin-top: 8px;"></ion-skeleton-text>
                  <ion-skeleton-text [animated]="true" style="width: 40%; height: 15px; margin-top: 8px;"></ion-skeleton-text>
                </div>
              </ion-col>
            </ion-row>
          </ion-grid>
        </div>
        
        <!-- Suggestions list -->
        <div *ngIf="!loading && suggestions.length > 0" class="suggestions-grid">
          <ion-grid>
            <ion-row>
              <ion-col size="6" *ngFor="let product of suggestions">
              <div class="product-card" *ngIf="product && product.id" [routerLink]="['/order/custom', product.id]">
              <div class="product-image">
                    <img [src]="product.imageURL || 'assets/placeholder.jpg'" [alt]="product.name">
                  </div>
                  <div class="product-info">
                    <h3>{{ product.name }}</h3>
                    <div class="product-price">{{ product.price | currency }}</div>
                  </div>
                </div>
              </ion-col>
            </ion-row>
          </ion-grid>
        </div>
        
        <!-- Empty state -->
        <div *ngIf="!loading && suggestions.length === 0" class="empty-suggestions">
          <ion-icon name="cafe-outline"></ion-icon>
          <p>We're getting to know your taste! Order more to get personalized suggestions.</p>
        </div>
      </ion-card-content>
    </ion-card>
  `,
  styles: [`
    .suggestion-card {
      margin: 16px;
      border-radius: 16px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
    }
    
    ion-card-title {
      display: flex;
      align-items: center;
      font-size: 18px;
      
      ion-icon {
        margin-right: 8px;
        color: var(--ion-color-primary);
      }
    }
    
    .suggestion-subtitle {
      color: var(--ion-color-medium);
      font-size: 14px;
      margin-top: 0;
      margin-bottom: 16px;
    }
    
    .product-card {
      background: var(--ion-color-light);
      border-radius: 12px;
      overflow: hidden;
      height: 100%;
      display: flex;
      flex-direction: column;
      cursor: pointer;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      transition: transform 0.2s ease, box-shadow 0.2s ease;
      
      &:active {
        transform: scale(0.98);
      }
    }
    
    .product-image {
      height: 120px;
      overflow: hidden;
      
      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
    }
    
    .product-info {
      padding: 12px;
      
      h3 {
        margin: 0 0 4px 0;
        font-size: 14px;
        font-weight: 600;
      }
      
      .product-price {
        color: var(--ion-color-primary);
        font-weight: 700;
        font-size: 14px;
      }
    }
    
    .empty-suggestions {
      text-align: center;
      padding: 24px 16px;
      
      ion-icon {
        font-size: 48px;
        color: var(--ion-color-medium);
        margin-bottom: 16px;
      }
      
      p {
        color: var(--ion-color-medium);
        max-width: 260px;
        margin: 0 auto;
      }
    }
  `],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonButton,
    IonImg,
    IonLabel,
    IonSkeletonText,
    IonIcon,
    IonRow,
    IonCol,
    IonGrid
  ]
})
export class ProductSuggestionsComponent implements OnInit {
  suggestions: any[] = [];
  loading = true;
  
  constructor(private suggestionService: SuggestionService) {
    addIcons({
      sparklesOutline,
      thumbsUpOutline,
      cafeOutline
    });
  }
  
  ngOnInit() {
    this.loadSuggestions();
    console.log('ProductSuggestionsComponent: Initializing');
    console.log('ProductSuggestionsComponent: SuggestionService initialized =', !!this.suggestionService);
    this.loadSuggestions();
  }
  
  /**
   * Load personalized suggestions
   */
  // In your ProductSuggestionsComponent

  loadSuggestions() {
    console.log('ProductSuggestionsComponent: Loading suggestions');
    this.loading = true;
    
    this.suggestionService.getPersonalizedSuggestions(4)
      .subscribe({
        next: (products) => {
          console.log('ProductSuggestionsComponent: Received products =', products);
          console.log('ProductSuggestionsComponent: Products is array =', Array.isArray(products));
          console.log('ProductSuggestionsComponent: Products type =', typeof products);
          
          // Handle nullish or undefined products
          if (!products) {
            console.error('ProductSuggestionsComponent: Products is null or undefined');
            this.suggestions = [];
          } else {
            this.suggestions = products;
          }
          
          this.loading = false;
        },
        error: (error) => {
          console.error('ProductSuggestionsComponent: Error loading suggestions:', error);
          this.loading = false;
          this.suggestions = []; // Ensure suggestions is initialized
        },
        complete: () => {
          console.log('ProductSuggestionsComponent: Subscription completed');
        }
      });
  }
}