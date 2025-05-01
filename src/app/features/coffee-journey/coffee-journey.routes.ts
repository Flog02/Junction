// src/app/features/coffee-journey/coffee-journey.routes.ts

import { Routes } from '@angular/router';
import { CoffeeJourneyPage } from './coffee-journey.page';
import { CoffeeOriginComponent } from './coffee-origin/coffee-origin.component';
import { CoffeeBrewingComponent } from './coffee-brewing/coffee-brewing.component';
import { CoffeeAchievementsComponent } from './coffee-achievements/coffee-achievements.component';
import { authGuard } from '../../core/guards/auth.guard';

export const COFFEE_JOURNEY_ROUTES: Routes = [
  {
    path: '',
    component: CoffeeJourneyPage
  },
  {
    path: 'origin/:id',
    component: CoffeeOriginComponent,
    canActivate: [authGuard]
  },
  {
    path: 'brewing',
    component: CoffeeBrewingComponent,
    canActivate: [authGuard]
  },
  {
    path: 'achievements',
    component: CoffeeAchievementsComponent,
    canActivate: [authGuard]
  }
];