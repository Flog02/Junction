// src/main.ts
import { bootstrapApplication } from '@angular/platform-browser';
import {
  RouteReuseStrategy,
  provideRouter,
  withPreloading,
  PreloadAllModules,
} from '@angular/router';
import {
  IonicRouteStrategy,
  provideIonicAngular,
} from '@ionic/angular/standalone';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient } from '@angular/common/http';

// Firebase imports
import { initializeApp } from 'firebase/app';
import { provideFirebaseApp, getApp } from '@angular/fire/app';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { provideStorage, getStorage } from '@angular/fire/storage';
import { provideAnalytics, getAnalytics } from '@angular/fire/analytics';

import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';
import { environment } from './environments/environment';

bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular(),
    provideRouter(routes, withPreloading(PreloadAllModules)),
    provideHttpClient(),
    provideAnimationsAsync(),
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore()),
    provideStorage(() => getStorage()),
    provideAnalytics(() => getAnalytics()),
  ],
});

import { addIcons } from 'ionicons';
import {
  home,
  location,
  addCircleOutline,
  cardOutline,
  addOutline,
  arrowForward,
  barChartOutline,
  cafeOutline,
  calendarOutline,
  cartOutline,
  chatbubbleOutline,
  checkmarkCircle,
  checkmarkCircleOutline,
  chevronForward,
  cubeOutline,
  fastFoodOutline,
  flame,
  flameOutline,
  giftOutline,
  iceCreamOutline,
  leafOutline,
  locationOutline,
  logoInstagram,
  mapOutline,
  notificationsOutline,
  optionsOutline,
  personCircleOutline,
  refreshOutline,
  restaurantOutline,
  star,
  starOutline,
  add,
  alertCircleOutline,
  barbellOutline,
  timeOutline,
  walkOutline,
  timerOutline,
  colorWandOutline,
  fingerPrintOutline,
  flaskOutline,
  gitMergeOutline,
  hammerOutline,
  scanOutline,
  snowOutline,
  thermometerOutline,
  waterOutline,
  mailOutline,
  paperPlaneOutline,
} from 'ionicons/icons';
addIcons({
  walkoutline: walkOutline,
  'gift-outline': giftOutline,
  'checkmark-circle-outline': checkmarkCircleOutline,
  'add-circle-outline': addCircleOutline,
  'checkmark-circle': checkmarkCircle,
  'person-circle-outline': personCircleOutline,
  'notifications-outline': notificationsOutline,
  'arrow-forward': arrowForward,
  'chevron-forward': chevronForward,
  'cafe-outline': cafeOutline,
  'bar-chart-outline': barChartOutline,
  'cube-outline': cubeOutline,
  star: star,
  flame: flame,
  'refresh-outline': refreshOutline,
  cafeOutline: cafeOutline,
  leafOutline: leafOutline,
  fastFoodOutline: fastFoodOutline,
  iceCreamOutline: iceCreamOutline,
  cartOutline: cartOutline,
  addOutline: addOutline,
  optionsOutline: optionsOutline,
  flameOutline: flameOutline,
  restaurantOutline: restaurantOutline,
  'location-outline': locationOutline,
  'logo-instagram': logoInstagram,
  'map-outline': mapOutline,
  'calendar-outline': calendarOutline,
  'chatbubble-outline': chatbubbleOutline,
  'star-outline': starOutline,
  'card-outline': cardOutline,
  add: add,
  'time-outline': timeOutline,
  'barbell-outline': barbellOutline,
  'alert-circle-outline': alertCircleOutline,
  restaurantoutline: restaurantOutline,
  location: location,
  home: home,
  'timer-outline': timerOutline,
  'finger-print-outline': fingerPrintOutline,
  'scan-outline': scanOutline,
  'water-outline': waterOutline,
  'flask-outline': flaskOutline,
  'snow-outline': snowOutline,
  'color-wand-outline': colorWandOutline,
  'hammer-outline': hammerOutline,
  'thermometer-outline': thermometerOutline,
  'git-merge-outline': gitMergeOutline,
  'mail-outline': mailOutline,
  'paper-plane-outline': paperPlaneOutline,
});
