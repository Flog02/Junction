// src/app/features/table-service/table-service.routes.ts

import { Routes } from '@angular/router';
import { TableServicePage } from './table-service.page';
import { TableScannerComponent } from './table-scanner/table-scanner.component';
import { TableOrderComponent } from './table-order/table-order.component';
import { authGuard } from '../../core/guards/auth.guard';
import { QrScannerComponent } from 'src/app/app-qr-scanner/app-qr-scnner.component';

export const TABLE_SERVICE_ROUTES: Routes = [
  {
    path: '',
    component: TableServicePage
  },
  {
    path: 'scanner',
    component: QrScannerComponent,
    canActivate: [authGuard]
  },
  {
    path: 'order',
    component: TableOrderComponent,
    canActivate: [authGuard]
  }
];