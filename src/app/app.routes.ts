

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
    path: 'notifications',
loadComponent: () => import('./shared/components/notification/notification.page').then(m=>m.NotificationsPage)
  },
  {
    path: 'coffee-game',
    loadComponent: () =>
      import('./features/coffee-game/coffee-game.page').then(
        (m) => m.CoffeeGamePage
      ),
    canActivate: [authGuard],
  },
  {
    path:'ai-suggestions',
    loadComponent:()=>import('./shared/components/scheduler.component/scheduler.component').then(m=>m.ProductSuggestionsComponent)
  },
  {
    path: 'staff',
    children: [
      {
        path: '',
        loadComponent: () => import('./features/staff/staff-dashboard/staff-dashboard.component').then(m => m.StaffDashboardComponent)
      },
      {
        path: 'qr-generator',
        loadComponent: () => import('./features/staff/table-management/qr-code-generator/qr-code-generator.component').then(m => m.QrCodeGeneratorComponent)
      }
    ]
  },
  // Table service routes
  {
    path: 'table-service',
    children: [
      {
        path: '',
        loadComponent: () => import('./features/table-service/table-service.page').then(m => m.TableServicePage)
      },
      {
        path: 'scan',
        loadComponent: () => import('./features/table-service/table-scanner/table-scanner.component').then(m => m.TableScannerComponent)
      },
      {
        path: 'order',
        loadComponent: () => import('./features/table-service/table-order/table-order.component').then(m => m.TableOrderComponent)
      }
    ]
  },
  // Direct table routes for URL-based QR codes
  {
    path: 'table/:storeId/:tableNumber',
    redirectTo: 'table-service/order'
  },

  // Catch-all route - redirects handled in app component
  {
    path: '**',
    redirectTo: 'home',
  },
];
