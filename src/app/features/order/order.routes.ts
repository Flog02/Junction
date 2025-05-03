// src/app/features/order/order.routes.ts

import { Routes } from '@angular/router';
import { OrderPage } from './order.page';
import { OrderCustomComponent } from './order-custom/order-custom.component';
import { OrderCartComponent } from './order-cart/order-cart.component';
import { OrderCheckoutComponent } from './order-checkout/order-checkout.component';
import { OrderConfirmationComponent } from './order-confirmation/order-confirmation.component';
import { OrderHistoryComponent } from './order-history/order-history.component';
import { OrderTrackerComponent } from './order-tracker/order-tracker.page';
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
    path: 'checkout',
    component: OrderCheckoutComponent
  },
  {
    path: 'confirmation/:id',
    component: OrderConfirmationComponent
  },
  {
    path: 'history',
    component: OrderHistoryComponent
  },
  {
    path: 'tracker/:id',
    component: OrderTrackerComponent
  }
];