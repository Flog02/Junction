// src/app/features/gift-cards/gift-cards.routes.ts

import { Routes } from '@angular/router';
import { GiftCardsPage } from './gift-card.page.ts/gift-card.page';
import { GiftCardCreatorComponent } from './gift-card-creator/gift-card-creator.component';
import { GiftCardViewComponent } from './gift-card-view/gift-card-view.component';
// import { GiftCardRedeemerComponent } from './gift-card-redeemer/gift-card-redeemer.component';
import { authGuard } from '../../core/guards/auth.guard';
import { GiftCardRedeemerComponent } from './gift-card-redeemer/gift-card-redeemer.component';

export const GIFT_CARD_ROUTES: Routes = [
  {
    path: '',
    component: GiftCardsPage,
    canActivate: [authGuard]
  },
  {
    path: 'create',
    component: GiftCardCreatorComponent,
    canActivate: [authGuard]
  },
  {
    path: 'redeem',
    component: GiftCardRedeemerComponent,
    canActivate: [authGuard]
  },
  {
    path: ':id',
    component: GiftCardViewComponent,
    canActivate: [authGuard]
  }
];