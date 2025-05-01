// src/app/core/models/product.model.ts

export interface ProductCustomizationOption {
   id: string;
    name: string;
    priceModifier: number;
  }
  
  export interface ProductNutritionInfo {
    calories: number;
    sugar: number; // grams
    caffeine: number; // mg
    fat: number; // grams
    protein: number; // grams
    allergies: string[];
  }
  
  export interface Product {
    id: string;
    name: string;
    description: string;
    category: string;
    price: number;
    imageURL: string;
    available: boolean;
    featured: boolean;
    customizationOptions: {
      sizes: ProductCustomizationOption[];
      milk: ProductCustomizationOption[];
      shots: ProductCustomizationOption[];
      syrups: ProductCustomizationOption[];
      toppings: ProductCustomizationOption[];
    };
    nutritionInfo: ProductNutritionInfo;
    model3dURL: string;
    preparationTime: number;
  }