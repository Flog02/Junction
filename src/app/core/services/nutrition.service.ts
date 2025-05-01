// src/app/core/services/nutrition.service.ts

import { Injectable } from '@angular/core';
import { 
  Firestore, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs
} from '@angular/fire/firestore';
import { Auth, user } from '@angular/fire/auth';
import { Observable, from, of, map, switchMap, combineLatest } from 'rxjs';
import { NutritionData, UserNutrition } from '../models/nutrition.model';

@Injectable({
  providedIn: 'root'
})
export class NutritionService {
  
  constructor(
    private firestore: Firestore,
    private auth: Auth
  ) {}
  
  /**
   * Updates the user's daily nutrition intake
   */
  updateDailyIntake(userId: string, date: string, nutritionData: NutritionData): Observable<void> {
    const userNutritionRef = doc(this.firestore, `userNutrition/${userId}`);
    
    // First check if the user's nutrition document exists
    return from(getDoc(userNutritionRef)).pipe(
      switchMap(docSnap => {
        if (docSnap.exists()) {
          // Document exists, update it
          const data = docSnap.data() as UserNutrition;
          
          // If the date already exists, add to the existing values
          if (data.dailyIntake && data.dailyIntake[date]) {
            const existingData = data.dailyIntake[date];
            
            // Add the new values to the existing ones
            nutritionData = {
              calories: (existingData.calories || 0) + nutritionData.calories,
              sugar: (existingData.sugar || 0) + nutritionData.sugar,
              caffeine: (existingData.caffeine || 0) + nutritionData.caffeine,
              fat: (existingData.fat || 0) + nutritionData.fat,
              protein: (existingData.protein || 0) + nutritionData.protein,
              waterIntake: existingData.waterIntake || 0 // Keep existing water intake
            };
          }
          
          // Update the daily intake for this date
          return from(updateDoc(userNutritionRef, {
            [`dailyIntake.${date}`]: nutritionData
          }));
        } else {
          // Document doesn't exist, create it
          const defaultUserNutrition: UserNutrition = {
            userId,
            dailyIntake: {
              [date]: nutritionData
            },
            nutritionGoals: {
              maxDailyCaffeine: 400, // Default 400mg (FDA recommendation)
              maxDailySugar: 50,     // Default 50g
              maxDailyCalories: 2000 // Default 2000 calories
            },
            allergies: [],
            preferredAlternatives: {
              milk: '',
              sweetener: ''
            }
          };
          
          return from(setDoc(userNutritionRef, defaultUserNutrition));
        }
      })
    );
  }
  
  /**
   * Gets the user's nutrition profile
   */
  getUserNutrition(): Observable<UserNutrition | null> {
    return user(this.auth).pipe(
      switchMap(user => {
        if (!user) return of(null);
        
        const userNutritionRef = doc(this.firestore, `userNutrition/${user.uid}`);
        return from(getDoc(userNutritionRef)).pipe(
          map(docSnap => {
            if (docSnap.exists()) {
              return docSnap.data() as UserNutrition;
            }
            return null;
          })
        );
      })
    );
  }
  
  /**
   * Updates the user's nutrition goals
   */
  updateNutritionGoals(goals: UserNutrition['nutritionGoals']): Observable<void> {
    return user(this.auth).pipe(
      switchMap(user => {
        if (!user) throw new Error('User not authenticated');
        
        const userNutritionRef = doc(this.firestore, `userNutrition/${user.uid}`);
        return from(updateDoc(userNutritionRef, { nutritionGoals: goals }));
      })
    );
  }
  
  /**
   * Updates the user's allergies
   */
  updateAllergies(allergies: string[]): Observable<void> {
    return user(this.auth).pipe(
      switchMap(user => {
        if (!user) throw new Error('User not authenticated');
        
        const userNutritionRef = doc(this.firestore, `userNutrition/${user.uid}`);
        return from(updateDoc(userNutritionRef, { allergies }));
      })
    );
  }
  
  /**
   * Updates the user's preferred alternatives
   */
  updatePreferredAlternatives(preferences: UserNutrition['preferredAlternatives']): Observable<void> {
    return user(this.auth).pipe(
      switchMap(user => {
        if (!user) throw new Error('User not authenticated');
        
        const userNutritionRef = doc(this.firestore, `userNutrition/${user.uid}`);
        return from(updateDoc(userNutritionRef, { preferredAlternatives: preferences }));
      })
    );
  }
  
  /**
   * Gets the user's daily intake for a specific date
   */
  getDailyIntake(date: string): Observable<NutritionData | null> {
    return this.getUserNutrition().pipe(
      map(userNutrition => {
        if (!userNutrition || !userNutrition.dailyIntake || !userNutrition.dailyIntake[date]) {
          return null;
        }
        return userNutrition.dailyIntake[date];
      })
    );
  }
  
  /**
   * Gets the user's daily intake for the last N days
   */
  getIntakeHistory(days: number): Observable<{ date: string; data: NutritionData }[]> {
    return this.getUserNutrition().pipe(
      map(userNutrition => {
        if (!userNutrition || !userNutrition.dailyIntake) {
          return [];
        }
        
        // Convert dailyIntake object to array of [date, data] entries
        const entries = Object.entries(userNutrition.dailyIntake)
          // Sort by date descending
          .sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime())
          // Take only the last N days
          .slice(0, days)
          // Map to the required format
          .map(([date, data]) => ({ date, data }));
        
        return entries;
      })
    );
  }
  
  /**
   * Updates the user's water intake for today
   */
  updateWaterIntake(milliliters: number): Observable<void> {
    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];
    
    return user(this.auth).pipe(
      switchMap(user => {
        if (!user) throw new Error('User not authenticated');
        
        const userNutritionRef = doc(this.firestore, `userNutrition/${user.uid}`);
        
        return from(getDoc(userNutritionRef)).pipe(
          switchMap(docSnap => {
            if (docSnap.exists()) {
              const data = docSnap.data() as UserNutrition;
              
              let currentWaterIntake = 0;
              
              // If today's entry exists, get the current water intake
              if (data.dailyIntake && data.dailyIntake[today]) {
                currentWaterIntake = data.dailyIntake[today].waterIntake || 0;
              }
              
              // Add the new water intake to the current value
              const newWaterIntake = currentWaterIntake + milliliters;
              
              // Update the water intake for today
              return from(updateDoc(userNutritionRef, {
                [`dailyIntake.${today}.waterIntake`]: newWaterIntake
              }));
            } else {
              // Create a new document with default values and the water intake
              const defaultUserNutrition: UserNutrition = {
                userId: user.uid,
                dailyIntake: {
                  [today]: {
                    calories: 0,
                    sugar: 0,
                    caffeine: 0,
                    fat: 0,
                    protein: 0,
                    waterIntake: milliliters
                  }
                },
                nutritionGoals: {
                  maxDailyCaffeine: 400,
                  maxDailySugar: 50,
                  maxDailyCalories: 2000
                },
                allergies: [],
                preferredAlternatives: {
                  milk: '',
                  sweetener: ''
                }
              };
              
              return from(setDoc(userNutritionRef, defaultUserNutrition));
            }
          })
        );
      })
    );
  }
  
  /**
   * Gets the user's average daily nutrition over the last N days
   */
  getAverageNutrition(days: number): Observable<NutritionData> {
    return this.getIntakeHistory(days).pipe(
      map(history => {
        // If no history, return zeros
        if (history.length === 0) {
          return {
            calories: 0,
            sugar: 0,
            caffeine: 0,
            fat: 0,
            protein: 0,
            waterIntake: 0
          };
        }
        
        // Calculate totals
        const totals = history.reduce((acc, { data }) => {
          return {
            calories: acc.calories + (data.calories || 0),
            sugar: acc.sugar + (data.sugar || 0),
            caffeine: acc.caffeine + (data.caffeine || 0),
            fat: acc.fat + (data.fat || 0),
            protein: acc.protein + (data.protein || 0),
            waterIntake: acc.waterIntake + (data.waterIntake || 0)
          };
        }, {
          calories: 0,
          sugar: 0,
          caffeine: 0,
          fat: 0,
          protein: 0,
          waterIntake: 0
        });
        
        // Calculate averages
        const count = history.length;
        return {
          calories: Math.round(totals.calories / count),
          sugar: Math.round(totals.sugar / count),
          caffeine: Math.round(totals.caffeine / count),
          fat: Math.round(totals.fat / count),
          protein: Math.round(totals.protein / count),
          waterIntake: Math.round(totals.waterIntake / count)
        };
      })
    );
  }
  
  /**
   * Gets the total daily nutrition for the current week
   */
  getWeeklyNutrition(): Observable<{ labels: string[]; datasets: any[] }> {
    // Get dates for the last 7 days
    const dates: any[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      dates.push(date.toISOString().split('T')[0]);
    }
    
    return this.getUserNutrition().pipe(
      map(userNutrition => {
        if (!userNutrition || !userNutrition.dailyIntake) {
          // Return empty data
          return {
            labels: dates.map(date => new Date(date).toLocaleDateString('en-US', { weekday: 'short' })),
            datasets: [
              {
                label: 'Calories',
                data: dates.map(() => 0),
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                borderColor: 'rgba(255, 99, 132, 1)',
                borderWidth: 1
              },
              {
                label: 'Sugar (g)',
                data: dates.map(() => 0),
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
              },
              {
                label: 'Caffeine (mg)',
                data: dates.map(() => 0),
                backgroundColor: 'rgba(255, 206, 86, 0.2)',
                borderColor: 'rgba(255, 206, 86, 1)',
                borderWidth: 1
              }
            ]
          };
        }
        
        // Extract data for each date
        const caloriesData = dates.map(date => 
          userNutrition.dailyIntake[date]?.calories || 0
        );
        
        const sugarData = dates.map(date => 
          userNutrition.dailyIntake[date]?.sugar || 0
        );
        
        const caffeineData = dates.map(date => 
          userNutrition.dailyIntake[date]?.caffeine || 0
        );
        
        // Format the dates as short weekday names (e.g., "Mon", "Tue")
        const labels = dates.map(date => 
          new Date(date).toLocaleDateString('en-US', { weekday: 'short' })
        );
        
        return {
          labels,
          datasets: [
            {
              label: 'Calories',
              data: caloriesData,
              backgroundColor: 'rgba(255, 99, 132, 0.2)',
              borderColor: 'rgba(255, 99, 132, 1)',
              borderWidth: 1
            },
            {
              label: 'Sugar (g)',
              data: sugarData,
              backgroundColor: 'rgba(54, 162, 235, 0.2)',
              borderColor: 'rgba(54, 162, 235, 1)',
              borderWidth: 1
            },
            {
              label: 'Caffeine (mg)',
              data: caffeineData,
              backgroundColor: 'rgba(255, 206, 86, 0.2)',
              borderColor: 'rgba(255, 206, 86, 1)',
              borderWidth: 1
            }
          ]
        };
      })
    );
  }
}

export { NutritionData, UserNutrition };
