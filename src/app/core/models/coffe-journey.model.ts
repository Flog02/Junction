// src/app/core/models/coffee-journey.model.ts

export interface CoffeeJourney {
    userId: string;
    level: number;
    experience: number;
    achievements: {
      id: string;
      name: string;
      description: string;
      unlockedDate: Date;
      iconURL: string;
      pointsAwarded: number;
    }[];
    discoveredOrigins: string[];
    completedTastings: {
      id: string;
      date: Date;
      productId: string;
      notes: string;
      rating: number;
    }[];
    unlockedRecipes: string[];
    baristaSkills: {
      brewing: number;
      latte_art: number;
      tasting: number;
      bean_knowledge: number;
    };
  }