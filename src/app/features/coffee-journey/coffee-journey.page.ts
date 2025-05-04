// Now, let's create a Coffee Journey page to showcase the 3D visualization
// src/app/features/coffee-journey/coffee-journey.page.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonButtons,IonBackButton,IonHeader,IonIcon,IonToolbar,IonTitle,IonContent,IonCard,IonCardHeader,IonCardTitle,IonCardSubtitle,IonCardContent } from '@ionic/angular/standalone';
import { CoffeeVisualizationComponent } from './coffe-visualization.component';
import { OrderItem } from '../../core/models/order.model';

@Component({
  selector: 'app-coffee-journey',
  template:`<ion-header>
  <ion-toolbar>
  <ion-buttons slot="start">
        <ion-back-button defaultHref="/home"></ion-back-button>
      </ion-buttons>
    <ion-title>Coffee Journey</ion-title>
  </ion-toolbar>
</ion-header>

<ion-content class="ion-padding">
  <h1 class="main-title">Your Coffee Experience</h1>
  
  <p class="intro-text">
    Ever wondered how your favorite coffee is made? Explore the journey from beans to cup and discover the art behind your perfect brew.
  </p>
  
  <!-- 3D Coffee Visualization -->
  <ion-card>
    <ion-card-header>
      <ion-card-title>3D Coffee Visualization</ion-card-title>
      <ion-card-subtitle>Interact with your custom coffee in 3D</ion-card-subtitle>
    </ion-card-header>
    
    <ion-card-content>
      <app-coffee-visualization 
        [orderItem]="sampleOrderItem" 
        height="350px">
      </app-coffee-visualization>
      
      <div class="visualization-help">
        <p><ion-icon name="finger-print-outline"></ion-icon> Rotate: Click and drag</p>
        <p><ion-icon name="scan-outline"></ion-icon> Zoom: Scroll or pinch</p>
      </div>
    </ion-card-content>
  </ion-card>
  
  <!-- Coffee Brewing Process -->
  <ion-card>
    <ion-card-header>
      <ion-card-title>The Brewing Process</ion-card-title>
      <ion-card-subtitle>Discover how your Caramel Latte is crafted</ion-card-subtitle>
    </ion-card-header>
    
    <ion-card-content>
      <div class="brewing-process">
        <div class="step" *ngFor="let step of brewingSteps; let i = index">
          <div class="step-number">{{ i + 1 }}</div>
          <div class="step-content">
            <div class="step-icon">
              <ion-icon [name]="step.icon"></ion-icon>
            </div>
            <h3 class="step-title">{{ step.title }}</h3>
            <p class="step-description">{{ step.description }}</p>
          </div>
        </div>
      </div>
    </ion-card-content>
  </ion-card>
  
  <!-- Coffee Details -->
  <ion-card>
    <ion-card-header>
      <ion-card-title>Your Caramel Latte</ion-card-title>
      <ion-card-subtitle>Detailed information about your coffee</ion-card-subtitle>
    </ion-card-header>
    
    <ion-card-content>
      <div class="coffee-details">
        <div class="detail-section">
          <h3>Ingredients</h3>
          <ul class="detail-list">
            <li>
              <ion-icon name="cafe-outline"></ion-icon>
              <span>Double Shot Espresso</span>
            </li>
            <li>
              <ion-icon name="water-outline"></ion-icon>
              <span>Oat Milk</span>
            </li>
            <li>
              <ion-icon name="flask-outline"></ion-icon>
              <span>Caramel Syrup</span>
            </li>
            <li>
              <ion-icon name="snow-outline"></ion-icon>
              <span>Whipped Cream</span>
            </li>
            <li>
              <ion-icon name="color-wand-outline"></ion-icon>
              <span>Caramel Drizzle</span>
            </li>
          </ul>
        </div>
        
        <div class="detail-section">
          <h3>Flavor Profile</h3>
          <div class="flavor-bars">
            <div class="flavor-bar">
              <span class="flavor-label">Sweetness</span>
              <div class="bar-container">
                <div class="bar-fill" style="width: 80%"></div>
              </div>
            </div>
            <div class="flavor-bar">
              <span class="flavor-label">Acidity</span>
              <div class="bar-container">
                <div class="bar-fill" style="width: 30%"></div>
              </div>
            </div>
            <div class="flavor-bar">
              <span class="flavor-label">Body</span>
              <div class="bar-container">
                <div class="bar-fill" style="width: 65%"></div>
              </div>
            </div>
            <div class="flavor-bar">
              <span class="flavor-label">Bitterness</span>
              <div class="bar-container">
                <div class="bar-fill" style="width: 45%"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ion-card-content>
  </ion-card>
  
  <!-- Coffee Origin Story -->
  <ion-card>
    <ion-card-header>
      <ion-card-title>Bean Origin Story</ion-card-title>
    </ion-card-header>
    
    <ion-card-content>
      <div class="origin-story">
        <p>
          The espresso in your Caramel Latte comes from beans grown in the highlands of Ethiopia, where coffee was first discovered. These beans are grown at high altitude, allowing them to develop complex flavors and sweetness.
        </p>
        <p>
          Our farmers use sustainable practices to ensure the health of both the land and the communities who tend the coffee plants. The beans are handpicked when perfectly ripe, and carefully processed to preserve their unique flavor characteristics.
        </p>
        <p>
          After harvesting, the beans are roasted to a medium-dark profile, bringing out notes of chocolate, caramel, and subtle fruit flavors that complement the added caramel perfectly.
        </p>
      </div>
    </ion-card-content>
  </ion-card>
</ion-content>`,
  styles:`.main-title {
    font-size: 28px;
    font-weight: bold;
    margin-bottom: 8px;
    color: var(--ion-color-primary);
  }
  
  .intro-text {
    font-size: 16px;
    line-height: 1.5;
    margin-bottom: 24px;
    color: var(--ion-color-medium);
  }
  
  .visualization-help {
    margin-top: 16px;
    display: flex;
    justify-content: space-around;
  }
  
  .visualization-help p {
    display: flex;
    align-items: center;
    font-size: 14px;
    color: var(--ion-color-medium);
  }
  
  .visualization-help ion-icon {
    margin-right: 8px;
  }
  
  .brewing-process {
    padding: 16px 0;
  }
  
  .step {
    display: flex;
    margin-bottom: 24px;
  }
  
  .step:last-child {
    margin-bottom: 0;
  }
  
  .step-number {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background-color: var(--ion-color-primary);
    color: white;
    font-weight: bold;
    margin-right: 16px;
  }
  
  .step-content {
    flex: 1;
  }
  
  .step-icon {
    font-size: 24px;
    color: var(--ion-color-primary);
    margin-bottom: 8px;
  }
  
  .step-title {
    font-size: 18px;
    font-weight: bold;
    margin: 0 0 8px 0;
  }
  
  .step-description {
    font-size: 14px;
    color: var(--ion-color-medium);
    margin: 0;
  }
  
  .coffee-details {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }
  
  .detail-section h3 {
    font-size: 18px;
    font-weight: bold;
    margin: 0 0 16px 0;
    color: var(--ion-color-primary);
  }
  
  .detail-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  
  .detail-list li {
    display: flex;
    align-items: center;
    margin-bottom: 12px;
  }
  
  .detail-list li ion-icon {
    margin-right: 12px;
    font-size: 20px;
    color: var(--ion-color-primary);
  }
  
  .flavor-bars {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  
  .flavor-bar {
    display: flex;
    align-items: center;
  }
  
  .flavor-label {
    width: 100px;
    font-size: 14px;
  }
  
  .bar-container {
    flex: 1;
    height: 8px;
    background-color: var(--ion-color-light);
    border-radius: 4px;
    overflow: hidden;
  }
  
  .bar-fill {
    height: 100%;
    background-color: var(--ion-color-primary);
  }
  
  .origin-story p {
    margin-bottom: 16px;
    line-height: 1.6;
  }`,
  standalone: true,
  imports: [IonButtons,IonBackButton,CommonModule, IonHeader,IonIcon,IonToolbar,IonTitle,IonContent,IonCard,IonCardHeader,IonCardTitle,IonCardSubtitle,IonCardContent,CoffeeVisualizationComponent]
})
export class CoffeeJourneyPage implements OnInit {
  // Sample order item for visualization
  sampleOrderItem: OrderItem = {
    productId: 'sample-latte',
    quantity: 1,
    name: 'Caramel Latte',
    basePrice: 4.99,
    customizations: {
      size: { id: 'medium', name: 'Medium', priceModifier: 0.50 },
      milk: { id: 'oat', name: 'Oat Milk', priceModifier: 0.75 },
      shots: [],
      syrups: [{ id: 'caramel', name: 'Caramel Syrup', priceModifier: 0.50 }],
      toppings: [{ id: 'whipped-cream', name: 'Whipped Cream', priceModifier: 0.50 }]
    },
    sugarLevel: 3,
    caffeineLevel: 3,
    specialInstructions: 'Extra caramel drizzle',
    itemTotal: 7.24,
    nutritionInfo: {
      calories: 380,
      sugar: 42,
      caffeine: 150,
      fat: 14,
      protein: 8
    }
  };
  
  // Coffee brewing steps
  brewingSteps = [
    {
      title: 'Grinding the Beans',
      description: 'Fresh coffee beans are ground to the perfect consistency for optimal flavor extraction.',
      icon: 'cafe-outline'
    },
    {
      title: 'Tamping',
      description: 'Ground coffee is compressed with precisely the right amount of pressure.',
      icon: 'hammer-outline'
    },
    {
      title: 'Extraction',
      description: 'Hot water is forced through the coffee grounds to extract the rich flavors and oils.',
      icon: 'water-outline'
    },
    {
      title: 'Steaming Milk',
      description: 'Your choice of milk is steamed to create a silky microfoam.',
      icon: 'thermometer-outline'
    },
    {
      title: 'Combining',
      description: 'The espresso and steamed milk are combined in just the right proportions.',
      icon: 'git-merge-outline'
    },
    {
      title: 'Finishing Touches',
      description: 'Your drink is topped with whipped cream and caramel drizzle.',
      icon: 'color-wand-outline'
    }
  ];
  
  constructor() {}
  
  ngOnInit() {}
}