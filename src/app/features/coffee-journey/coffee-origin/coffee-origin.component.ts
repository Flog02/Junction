
 // src/app/features/coffee-journey/coffee-origin/coffee-origin.component.ts
import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AfterViewChecked } from '@angular/core';
import { RouterModule } from '@angular/router';
import { 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonContent, 
  IonButtons, 
  IonBackButton,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonImg,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonIcon,
  IonList,
  IonItem
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  mapOutline, 
  leafOutline, 
  globeOutline, 
  waterOutline, 
  thermometerOutline 
} from 'ionicons/icons';

interface CoffeeOrigin {
  country: string;
  region: string;
  elevation: string;
  process: string;
  flavor: string[];
  description: string;
  imageUrl: string;
}

@Component({
  selector: 'app-coffee-origin',
  templateUrl: './coffee-origin.component.html',
  styleUrls: ['./coffee-origin.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    IonHeader, 
    IonToolbar, 
    IonTitle, 
    IonContent, 
    IonButtons, 
    IonBackButton,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    IonImg,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    IonIcon,
    IonList,
    IonItem
  ]
})
export class CoffeeOriginComponent implements OnInit {
  @Input() originId!: string;

  
  origins: { [key: string]: CoffeeOrigin } = {
    'ethiopia': {
      country: 'Ethiopia',
      region: 'Yirgacheffe',
      elevation: '1,750 - 2,200 meters',
      process: 'Washed',
      flavor: ['Floral', 'Citrus', 'Bergamot', 'Jasmine'],
      description: 'Ethiopia is the birthplace of coffee, with a rich history dating back to the 9th century. The Yirgacheffe region produces some of the world\'s most distinct coffees with bright acidity, floral aromatics, and exceptional clarity.',
      imageUrl: 'assets/origins/ethiopia.jpg'
    },
    'colombia': {
      country: 'Colombia',
      region: 'Huila',
      elevation: '1,500 - 1,800 meters',
      process: 'Washed',
      flavor: ['Chocolate', 'Caramel', 'Red Fruits', 'Citrus'],
      description: 'Colombia is known for producing consistently excellent coffee. The Huila region\'s rich volcanic soil, high altitude, and ideal climate create beans with a perfect balance of sweetness, acidity, and body.',
      imageUrl: 'assets/origins/colombia.jpg'
    },
    'guatemala': {
      country: 'Guatemala',
      region: 'Antigua',
      elevation: '1,500 - 1,700 meters',
      process: 'Washed',
      flavor: ['Chocolate', 'Spice', 'Apple', 'Caramel'],
      description: 'Guatemala\'s Antigua region is surrounded by three volcanoes that create a unique microclimate. The mineral-rich soil produces coffees with complex flavor profiles and a full body with elegant acidity.',
      imageUrl: 'assets/origins/guatemala.jpg'
    },
    'kenya': {
      country: 'Kenya',
      region: 'Nyeri',
      elevation: '1,700 - 1,950 meters',
      process: 'Washed',
      flavor: ['Blackcurrant', 'Blackberry', 'Tomato', 'Winey'],
      description: 'Kenya is famous for its distinctive, bright, and fruit-forward coffees. The SL28 and SL34 varietals grown in the nutrient-rich volcanic soil of Nyeri produce incredibly complex and vibrant flavor profiles.',
      imageUrl: 'assets/origins/kenya.jpg'
    }
  };
  
  selectedOrigin?: CoffeeOrigin;
  
  constructor() {
    addIcons({
      mapOutline, 
      leafOutline, 
      globeOutline, 
      waterOutline, 
      thermometerOutline
    });
  }
  
  ngOnInit() {
    this.selectOrigin(this.originId || 'ethiopia');
  }
  
  selectOrigin(originId: any) {
    this.selectedOrigin = this.origins[originId] || this.origins['ethiopia'];
  }
 

}