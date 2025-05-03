// src/app/features/staff/staff.routes.ts

import { Routes } from '@angular/router';
import { StaffGuard } from 'src/app/core/guards/staff.guard';
import { StaffDashboardComponent } from './staff-dashboard/staff-dashboard.component';
import { OrderQueueComponent } from './order-management/order-queue/order-queue.component';
import { OrderHistoryComponent } from './order-management/order-history/order-history.component';
import { OrderDetailComponent } from './order-management/order-detail/order-detail.component';

export const STAFF_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },

  {
    path: 'dashboard',
    component: StaffDashboardComponent,
    canActivate: [StaffGuard]
  },
  {
    path: 'orders/queue',
    component: OrderQueueComponent,
    canActivate: [StaffGuard]
  },
  {
    path: 'orders/history',
    component: OrderHistoryComponent,
    canActivate: [StaffGuard]
  },
  {
    path: 'orders/detail/:id',
    component: OrderDetailComponent,
    canActivate: [StaffGuard]
  }
];