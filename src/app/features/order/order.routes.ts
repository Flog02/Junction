// src/app/features/order/order.routes.ts
import { Routes } from '@angular/router';
import { OrderPage } from './order.page';
import { OrderCustomComponent } from './order-custom/order-custom.component';
import { OrderCartComponent } from './order-cart/order-cart.component';
import { OrderConfirmationComponent } from './order-confirmation/order-confirmation.component';
import { OrderHistoryComponent } from './order-history/order-history.component';

export const ORDER_ROUTES: Routes = [
  {
    path: '',
    component: OrderPage
  },
  {
    path: 'custom/:id',
    component: OrderCustomComponent
  },
  {
    path: 'cart',
    component: OrderCartComponent
  },
  {
    path: 'confirmation/:id',
    component: OrderConfirmationComponent
  },
  {
    path: 'history',
    component: OrderHistoryComponent
  }
];