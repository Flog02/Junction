// src/app/core/models/order.model.ts

export interface CustomizationOption {
    id: string;
    name: string;
    priceModifier: number;
  }
  
  export interface OrderItem {
    productId: string;
    quantity: number;
    name: string;
    basePrice: number;
    customizations: {
      size: CustomizationOption;
      milk?: CustomizationOption;
      shots: CustomizationOption[];
      syrups: CustomizationOption[];
      toppings: CustomizationOption[];
    };
    sugarLevel: number; // 0-5
    caffeineLevel: number; // 0-5
    specialInstructions: string;
    itemTotal: number;
    nutritionInfo: {
      calories: number;
      sugar: number;
      caffeine: number;
      fat: number;
      protein: number;
    };
  }
  
  export interface Order {
    id?: string;
    userId: string;
    storeId: string;
    tableNumber: number | null;
    orderTime: Date;
    processTime: Date | null;
    completionTime: Date | null;
    status: 'pending' | 'processing' | 'ready' | 'delivered' | 'cancelled';
    paymentStatus: 'pending' | 'paid' | 'refunded';
    paymentMethod: string;
    total: number;
    subtotal: number;
    tax: number;
    tip: number;
    items: OrderItem[];
    loyaltyPointsEarned: number;
    giftCardApplied: {
      id: string;
      amount: number;
    } | null;
    deliveredBy: string | null;
    notes: string;
  }