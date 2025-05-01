// src/app/core/models/nutrition.model.ts

export interface NutritionData {
    calories: number;
    sugar: number;
    caffeine: number;
    fat: number;
    protein: number;
    waterIntake?: number;
  }
  
  export interface UserNutrition {
    userId: string;
    dailyIntake: {
      [date: string]: NutritionData;
    };
    nutritionGoals: {
      maxDailyCaffeine: number;
      maxDailySugar: number;
      maxDailyCalories: number;
    };
    allergies: string[];
    preferredAlternatives: {
      milk: string;
      sweetener: string;
    };
  }