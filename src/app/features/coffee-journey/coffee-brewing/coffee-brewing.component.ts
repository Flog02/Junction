
// src/app/features/coffee-journey/coffee-brewing/coffee-brewing.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
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
  cafeOutline, 
  waterOutline, 
  timerOutline, 
  thermometerOutline, 
  leafOutline, 
  hammerOutline 
} from 'ionicons/icons';

interface BrewingMethod {
  id: string;
  name: string;
  description: string;
  brewTime: string;
  grindSize: string;
  waterTemp: string;
  ratio: string;
  steps: string[];
  imageUrl: string;
}

@Component({
  selector: 'app-coffee-brewing',
  templateUrl: './coffee-brewing.component.html',
  styleUrls: ['./coffee-brewing.component.scss'],
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
export class CoffeeBrewingComponent implements OnInit {
  brewingMethods: BrewingMethod[] = [
    {
      id: 'espresso',
      name: 'Espresso',
      description: 'A concentrated coffee brewed by forcing hot water under pressure through finely-ground coffee beans.',
      brewTime: '25-30 seconds',
      grindSize: 'Fine',
      waterTemp: '90-96°C (195-205°F)',
      ratio: '1:2 (coffee to water)',
      steps: [
        'Finely grind 18-20g of coffee',
        'Distribute evenly in the portafilter and tamp firmly',
        'Lock portafilter into espresso machine',
        'Start extraction and aim for 25-30 seconds',
        'Look for honey-like flow with tiger striping',
        'Yield should be approximately 36-40g of liquid'
      ],
      imageUrl: 'assets/brewing/espresso.jpg'
    },
    {
      id: 'pour-over',
      name: 'Pour Over',
      description: 'A manual brewing method where hot water is poured over ground coffee in a filter, creating a clean and flavorful cup.',
      brewTime: '2-3 minutes',
      grindSize: 'Medium',
      waterTemp: '90-96°C (195-205°F)',
      ratio: '1:16 (coffee to water)',
      steps: [
        'Place filter in dripper and rinse with hot water',
        'Grind 22g of coffee to medium consistency',
        'Add coffee to filter and create a small well in the center',
        'Pour 50g of water for blooming and wait 30 seconds',
        'Slowly pour remaining water in circular motion',
        'Total brew time should be 2-3 minutes'
      ],
      imageUrl: 'assets/brewing/pour-over.jpg'
    },
    {
      id: 'french-press',
      name: 'French Press',
      description: 'An immersion brewing method that steeps coarsely ground coffee in hot water before pressing a metal filter to separate the grounds.',
      brewTime: '4 minutes',
      grindSize: 'Coarse',
      waterTemp: '93-96°C (200-205°F)',
      ratio: '1:15 (coffee to water)',
      steps: [
        'Grind 30g of coffee coarsely',
        'Add coffee to French press',
        'Pour 450g of hot water over the grounds',
        'Stir gently to ensure all grounds are saturated',
        'Place lid on top but don\'t press down, wait 4 minutes',
        'Press down slowly and pour immediately'
      ],
      imageUrl: 'assets/brewing/french-press.jpg'
    },
    {
      id: 'aeropress',
      name: 'AeroPress',
      description: 'A versatile brewing device that uses pressure to extract coffee, combining elements of immersion and pressure brewing.',
      brewTime: '1-2 minutes',
      grindSize: 'Medium-Fine',
      waterTemp: '80-85°C (175-185°F)',
      ratio: '1:12 (coffee to water)',
      steps: [
        'Place filter in cap and rinse with hot water',
        'Attach cap to AeroPress and place on cup',
        'Add 17g of medium-fine coffee',
        'Pour 200g of hot water and stir',
        'Wait 1 minute, then press down slowly',
        'Press until you hear a hissing sound'
      ],
      imageUrl: 'assets/brewing/aeropress.jpg'
    }
  ];
  
  selectedMethod?: BrewingMethod;
  
  constructor() {
    addIcons({
      cafeOutline, 
      waterOutline, 
      timerOutline, 
      thermometerOutline, 
      leafOutline,
      hammerOutline
    });
  }
  
  ngOnInit() {
    this.selectMethod('espresso');
  }
  
 // Update your selectMethod function in coffee-brewing.component.ts
selectMethod(methodId: string | number | undefined) {
  if (methodId === undefined) {
    methodId = 'espresso'; // Default to espresso if no method selected
  }
  
  // Convert to string if it's a number
  const id = methodId.toString();
  
  this.selectedMethod = this.brewingMethods.find(method => method.id === id) || this.brewingMethods[0];
}
}