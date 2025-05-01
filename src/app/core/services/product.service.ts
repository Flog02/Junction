// src/app/core/services/product.service.ts

import { Injectable } from '@angular/core';
import { 
  Firestore, 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  collectionData,
  orderBy,
  limit
} from '@angular/fire/firestore';
import { Observable, from, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { Product, ProductCustomizationOption, ProductNutritionInfo } from '../models/product.model';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  
  constructor(private firestore: Firestore) {}
  
  /**
   * Gets a product by ID
   */
  getProduct(productId: string): Observable<Product | null> {
    const productRef = doc(this.firestore, `products/${productId}`);
    return from(getDoc(productRef)).pipe(
      map(snapshot => {
        if (snapshot.exists()) {
          return { ...snapshot.data(), id: snapshot.id } as Product;
        }
        return null;
      })
    );
  }
  
  /**
   * Gets all products
   */
  getAllProducts(): Observable<Product[]> {
    const productsRef = collection(this.firestore, 'products');
    return collectionData(productsRef, { idField: 'id' }).pipe(
      map(products => products as Product[])
    );
  }
  
  /**
   * Gets products by category
   */
  getProductsByCategory(category: string): Observable<Product[]> {
    const productsRef = collection(this.firestore, 'products');
    const categoryQuery = query(
      productsRef,
      where('category', '==', category),
      where('available', '==', true),
      orderBy('name')
    );
    
    return collectionData(categoryQuery, { idField: 'id' }).pipe(
      map(products => products as Product[])
    );
  }
  
  /**
   * Gets featured products
   */
  getFeaturedProducts(): Observable<Product[]> {
    const productsRef = collection(this.firestore, 'products');
    const featuredQuery = query(
      productsRef,
      where('featured', '==', true),
      where('available', '==', true),
      limit(8)
    );
    
    return collectionData(featuredQuery, { idField: 'id' }).pipe(
      map(products => products as Product[])
    );
  }
  
  /**
   * Calculates the nutrition information for a customized product
   */
  calculateNutrition(
    product: Product,
    size: ProductCustomizationOption,
    milk: ProductCustomizationOption,
    shots: ProductCustomizationOption[],
    syrups: ProductCustomizationOption[],
    sugarLevel: number,
    caffeineLevel: number
  ): ProductNutritionInfo {
    // Base nutrition from product
    const baseNutrition = { ...product.nutritionInfo };
    
    // Size modifiers (assuming baseNutrition is for the smallest size)
    const sizeIndex = product.customizationOptions.sizes.findIndex(s => s.id === size.id);
    const sizeMultiplier = 1 + (sizeIndex * 0.5); // Small = 1x, Medium = 1.5x, Large = 2x
    
    // Apply size scaling to base nutrition
    baseNutrition.calories *= sizeMultiplier;
    baseNutrition.sugar *= sizeMultiplier;
    baseNutrition.caffeine *= sizeMultiplier;
    baseNutrition.fat *= sizeMultiplier;
    baseNutrition.protein *= sizeMultiplier;
    
    // Sugar modifiers based on sugarLevel (0-5)
    // Base sugar is level 3, so adjust accordingly
    if (sugarLevel !== 3) {
      const sugarFactor = sugarLevel / 3;
      baseNutrition.sugar *= sugarFactor;
    }
    
    // Caffeine modifiers based on shots
    if (shots && shots.length > 0) {
      // Each shot adds about 80mg of caffeine
      baseNutrition.caffeine += shots.length * 80;
    }
    
    // Caffeine level modifier (0-5)
    // Base caffeine is level 3, so adjust accordingly
    if (caffeineLevel !== 3) {
      const caffeineFactor = caffeineLevel / 3;
      baseNutrition.caffeine *= caffeineFactor;
    }
    
    // Milk modifiers
    if (milk) {
      if (milk.name.includes('Whole')) {
        baseNutrition.fat += 3.5 * sizeMultiplier;
        baseNutrition.calories += 30 * sizeMultiplier;
        baseNutrition.protein += 3 * sizeMultiplier;
      } else if (milk.name.includes('2%')) {
        baseNutrition.fat += 2 * sizeMultiplier;
        baseNutrition.calories += 20 * sizeMultiplier;
        baseNutrition.protein += 3 * sizeMultiplier;
      } else if (milk.name.includes('Almond')) {
        baseNutrition.fat += 1 * sizeMultiplier;
        baseNutrition.calories += 15 * sizeMultiplier;
        baseNutrition.protein += 1 * sizeMultiplier;
      } else if (milk.name.includes('Oat')) {
        baseNutrition.fat += 1.5 * sizeMultiplier;
        baseNutrition.calories += 25 * sizeMultiplier;
        baseNutrition.protein += 2 * sizeMultiplier;
      }
    }
    
    // Syrup modifiers
    if (syrups && syrups.length > 0) {
      // Each syrup pump adds about 20 calories and 5g of sugar
      syrups.forEach(() => {
        baseNutrition.calories += 20;
        baseNutrition.sugar += 5;
      });
    }
    
    // Return the calculated nutrition info
    return {
      calories: Math.round(baseNutrition.calories),
      sugar: Math.round(baseNutrition.sugar),
      caffeine: Math.round(baseNutrition.caffeine),
      fat: Math.round(baseNutrition.fat),
      protein: Math.round(baseNutrition.protein),
      allergies: baseNutrition.allergies
    };
  }
}