// src/app/core/models/sustainability.model.ts

export interface SustainabilityPoints {
    userId: string;
    points: number;
    totalSaved: {
      waterLitersSaved: number;
      co2KgReduced: number;
      plasticPiecesSaved: number;
    };
    actions: {
      id: string;
      date: Date;
      type: string;
      points: number;
      impact: {
        waterLitersSaved: number;
        co2KgReduced: number;
        plasticPiecesSaved: number;
      };
    }[];
    streak: number;
    achievements: string[];
  }