// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'home',
    loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
  },
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
  
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES)
  },
  {
    path: 'menu',
    loadComponent: () => import('./features/menu/menu.page').then(m => m.MenuPage),
    // Menu should be publicly accessible
  },
  {
    path: 'order',
    loadChildren: () => import('./features/order/order.routes').then(m => m.ORDER_ROUTES),
    canActivate: [authGuard] // Protected - requires authentication
  },
  {
    path: 'loyalty',
    loadComponent: () => import('./features/loyalty/loyalty.page').then(m => m.LoyaltyPage),
    canActivate: [authGuard] // Protected - requires authentication
  },
  {
    path: 'nutrition',
    loadComponent: () => import('./features/nutrition/nutrition.page').then(m => m.NutritionPage),
    canActivate: [authGuard] // Protected - requires authentication
  },
  {
    path: 'gift-cards',
    loadChildren: () => import('./features/gift-cards/gift-cards.routes').then(m => m.GIFT_CARD_ROUTES),
    canActivate: [authGuard] // Protected - requires authentication
  },
  {
    path: 'table-service',
    loadChildren: () => import('./features/table-service/table-service.routes').then(m => m.TABLE_SERVICE_ROUTES),
    // Main page is public, but scanning and ordering require auth (defined in child routes)
  },
  {
    path: 'coffee-journey',
    loadComponent: () => import('./features/coffee-journey/coffee-journey.page').then(m => m.CoffeeJourneyPage),
    canActivate: [authGuard] // Protected - requires authentication
  },
  // {
  //   path: 'ar-experience',
  //   loadComponent: () => import('./features/ar-experience/ar-experience.page').then(m => m.ArExperiencePage),
  //   canActivate: [authGuard]
  // },
  {
    path: 'coffee-game',
    loadComponent: () => import('./features/coffee-game/coffee-game.page').then(m => m.CoffeeGamePage),
    // Games could be public to attract users
  },
  {
    path: 'profile',
    loadComponent: () => import('./features/profile/profile.page').then(m => m.ProfilePage),
    canActivate: [authGuard] // Protected - requires authentication
  },
  {
    path: '**',
    redirectTo: 'home'
  }
];