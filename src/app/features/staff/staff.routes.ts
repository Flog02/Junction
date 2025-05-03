// src/app/features/staff/staff.routes.ts

import { Routes } from '@angular/router';
import { StaffGuard } from 'src/app/core/guards/staff.guard';
import { StaffDashboardComponent } from './staff-dashboard/staff-dashboard.component';
import { OrderQueueComponent } from './order-management/order-queue/order-queue.component';
import { OrderHistoryComponent } from './order-management/order-history/order-history.component';
import { OrderDetailComponent } from './order-management/order-detail/order-detail.component';
import { QrCodeGeneratorComponent } from './table-management/qr-code-generator/qr-code-generator.component';

export const STAFF_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'dashboard',
    component: StaffDashboardComponent,
    // Temporarily comment out the guard for testing
    // canActivate: [StaffGuard]
  },
  {
    path: 'orders/queue',
    component: OrderQueueComponent,
    // canActivate: [StaffGuard]
  },
  {
    path: 'orders/history',
    component: OrderHistoryComponent,
    // canActivate: [StaffGuard]
  },
  {
    path: 'orders/detail/:id',
    component: OrderDetailComponent,
    // canActivate: [StaffGuard]
  },
  {
    path: 'tables/qr-generator',
    component: QrCodeGeneratorComponent,
    // canActivate: [StaffGuard]
  }
];