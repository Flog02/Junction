// // src/app/app.routes.ts

// import { Routes } from '@angular/router';
// import { authGuard } from './core/guards/auth.guard';
// import { RoleNavigationGuard } from './core/guards/role-navigation.guard';
// import { STAFF_ROUTES } from './features/staff/staff.routes';
// import { WildcardRedirectComponent } from './shared/components/wildcard-redirect/wildcard-redirect.component';

// export const routes: Routes = [
//   // Staff routes should be placed before other routes for proper priority
//   {
//     path: 'staff',
//     children: STAFF_ROUTES,
//     canActivate: [authGuard, RoleNavigationGuard]
//   },

//   {
//     path: 'home',
//     loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
//     canActivate: [RoleNavigationGuard]
//   },
//   {
//     path: '',
//     redirectTo: 'home',
//     pathMatch: 'full',
//   },

//   {
//     path: 'auth',
//     loadChildren: () => import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES)
//   },
//   {
//     path: 'menu',
//     loadComponent: () => import('./features/menu/menu.page').then(m => m.MenuPage),
//     canActivate: [RoleNavigationGuard]
//   },
//   {
//     path: 'order',
//     loadChildren: () => import('./features/order/order.routes').then(m => m.ORDER_ROUTES),
//     canActivate: [authGuard, RoleNavigationGuard]
//   },
//   {
//     path: 'loyalty',
//     loadComponent: () => import('./features/loyalty/loyalty.page').then(m => m.LoyaltyPage),
//     canActivate: [authGuard, RoleNavigationGuard]
//   },
//   {
//     path: 'nutrition',
//     loadComponent: () => import('./features/nutrition/nutrition.page').then(m => m.NutritionPage),
//     canActivate: [authGuard, RoleNavigationGuard]
//   },
//   {
//     path: 'gift-cards',
//     loadChildren: () => import('./features/gift-cards/gift-cards.routes').then(m => m.GIFT_CARD_ROUTES),
//     canActivate: [authGuard, RoleNavigationGuard]
//   },
//   {
//     path: 'table-service',
//     loadChildren: () => import('./features/table-service/table-service.routes').then(m => m.TABLE_SERVICE_ROUTES),
//     canActivate: [RoleNavigationGuard]
//   },
//   {
//     path: 'coffee-journey',
//     loadComponent: () => import('./features/coffee-journey/coffee-journey.page').then(m => m.CoffeeJourneyPage),
//     canActivate: [authGuard, RoleNavigationGuard]
//   },
//   {
//     path: 'profile',
//     loadComponent: () => import('./features/profile/profile.page').then(m => m.ProfilePage),
//     canActivate: [authGuard, RoleNavigationGuard]
//   },
//   // This should be the LAST route

//   {
//     path: '**',
//     component: WildcardRedirectComponent
//   }
// ];
// src/app/app.routes.ts

import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { STAFF_ROUTES } from './features/staff/staff.routes';

export const routes: Routes = [
  // Staff routes
  {
    path: 'staff',
    children: STAFF_ROUTES,
    canActivate: [authGuard], // Only check if authenticated, role check is in app component
  },

  // Customer routes
  {
    path: 'home',
    loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
    canActivate: [authGuard], // Only check if authenticated
  },
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },

  // Auth routes (no guard needed)
  {
    path: 'auth',
    loadChildren: () =>
      import('./features/auth/auth.routes').then((m) => m.AUTH_ROUTES),
  },

  // Other routes
  {
    path: 'menu',
    loadComponent: () =>
      import('./features/menu/menu.page').then((m) => m.MenuPage),
    canActivate: [authGuard],
  },
  {
    path: 'order',
    loadChildren: () =>
      import('./features/order/order.routes').then((m) => m.ORDER_ROUTES),
    canActivate: [authGuard],
  },
  {
    path: 'loyalty',
    loadComponent: () =>
      import('./features/loyalty/loyalty.page').then((m) => m.LoyaltyPage),
    canActivate: [authGuard],
  },
  {
    path: 'nutrition',
    loadComponent: () =>
      import('./features/nutrition/nutrition.page').then(
        (m) => m.NutritionPage
      ),
    canActivate: [authGuard],
  },
  {
    path: 'gift-cards',
    loadChildren: () =>
      import('./features/gift-cards/gift-cards.routes').then(
        (m) => m.GIFT_CARD_ROUTES
      ),
    canActivate: [authGuard],
  },
  {
    path: 'table-service',
    loadChildren: () =>
      import('./features/table-service/table-service.routes').then(
        (m) => m.TABLE_SERVICE_ROUTES
      ),
    canActivate: [authGuard],
  },
  {
    path: 'coffee-journey',
    loadComponent: () =>
      import('./features/coffee-journey/coffee-journey.page').then(
        (m) => m.CoffeeJourneyPage
      ),
    canActivate: [authGuard],
  },
  {
    path: 'profile',
    loadComponent: () =>
      import('./features/profile/profile.page').then((m) => m.ProfilePage),
    canActivate: [authGuard],
  },
  {
    path: 'coffee-game',
    loadComponent: () =>
      import('./features/coffee-game/coffee-game.page').then(
        (m) => m.CoffeeGamePage
      ),
    canActivate: [authGuard],
  },

  // Catch-all route - redirects handled in app component
  {
    path: '**',
    redirectTo: 'home',
  },
];
