// src/app/core/models/notification.model.ts

export interface Notification {
    id: string;
    userId: string;
    title: string;
    body: string;
    createdDate: Date;
    readDate: Date | null;
    type: 'order' | 'loyalty' | 'promo' | 'gift' | 'system';
    data: {
      orderId?: string;
      giftCardId?: string;
      promoId?: string;
      action?: string;
    };
    priority: 'high' | 'normal' | 'low';
  }