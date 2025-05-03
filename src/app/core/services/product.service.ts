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
import { map, catchError, tap } from 'rxjs/operators';
import { Product, ProductCustomizationOption, ProductNutritionInfo } from '../models/product.model';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  
  private localProducts: Product[];
  
  constructor(private firestore: Firestore) {
    // Initialize with sample products
    this.localProducts = this.getSampleProducts();
    console.log('ProductService initialized with sample products:', this.localProducts.length);
    
    // Enhance the products with more customization options
    this.enhanceProductCustomizations();
  }
  
  /**
   * Enhance product customization options with more detailed options
   */
  private enhanceProductCustomizations() {
    this.localProducts.forEach(product => {
      if (product.category === 'coffee' || product.category === 'tea') {
        // Add more detailed caffeine options
        if (!product.customizationOptions.shots.some(shot => shot.id === 'decaf')) {
          product.customizationOptions.shots.push({
            id: 'decaf',
            name: 'Decaf Option',
            priceModifier: 0
          });
        }
        
        // Add more milk options
        const extraMilkOptions = [
          { id: 'coconut', name: 'Coconut Milk', priceModifier: 0.75 },
          { id: 'soy', name: 'Soy Milk', priceModifier: 0.75 },
          { id: 'half-and-half', name: 'Half & Half', priceModifier: 0.50 }
        ];
        
        extraMilkOptions.forEach(option => {
          if (!product.customizationOptions.milk.some(milk => milk.id === option.id)) {
            product.customizationOptions.milk.push(option);
          }
        });
        
        // Add more syrup options
        const extraSyrups = [
          { id: 'mocha', name: 'Mocha', priceModifier: 0.75 },
          { id: 'peppermint', name: 'Peppermint', priceModifier: 0.75 },
          { id: 'toffee-nut', name: 'Toffee Nut', priceModifier: 0.75 },
          { id: 'sugar-free-vanilla', name: 'Sugar-Free Vanilla', priceModifier: 0.75 }
        ];
        
        extraSyrups.forEach(option => {
          if (!product.customizationOptions.syrups.some(syrup => syrup.id === option.id)) {
            product.customizationOptions.syrups.push(option);
          }
        });
      }
    });
  }
  
  /**
   * Gets a product by ID
   */
  getProduct(productId: string): Observable<Product | null> {
    console.log('Getting product with ID:', productId);
    
    // First check if the product is in local products
    const localProduct = this.localProducts.find(p => p.id === productId);
    if (localProduct) {
      console.log('Product found in local products');
      return of(localProduct);
    }
    
    // If not found locally, try Firestore
    console.log('Product not found locally, trying Firestore');
    const productRef = doc(this.firestore, `products/${productId}`);
    return from(getDoc(productRef)).pipe(
      map(snapshot => {
        if (snapshot.exists()) {
          console.log('Product found in Firestore');
          return { ...snapshot.data(), id: snapshot.id } as Product;
        }
        console.log('Product not found in Firestore either');
        return null;
      }),
      catchError(error => {
        console.error('Error fetching from Firestore:', error);
        // Return null if there's an error
        return of(null);
      })
    );
  }
  
  /**
   * Gets all products
   */
  getAllProducts(): Observable<Product[]> {
    console.log('Getting all products');
    // Return local products first
    if (this.localProducts.length > 0) {
      console.log('Returning from local products');
      return of(this.localProducts);
    }
    
    // Try Firestore if no local products
    console.log('No local products, trying Firestore');
    const productsRef = collection(this.firestore, 'products');
    return collectionData(productsRef, { idField: 'id' }).pipe(
      map(products => products as Product[]),
      catchError(error => {
        console.error('Error fetching from Firestore:', error);
        // Return empty array if there's an error
        return of([]);
      })
    );
  }
  
  /**
   * Gets products by category
   */
  getProductsByCategory(category: string): Observable<Product[]> {
    console.log('Getting products by category:', category);
    
    // Filter local products
    const filteredProducts = this.localProducts.filter(
      p => p.category === category
    );
    
    if (filteredProducts.length > 0) {
      console.log('Found products in local cache:', filteredProducts.length);
      return of(filteredProducts);
    }
    
    // If no local products match, try Firestore
    console.log('No local products match, trying Firestore');
    const productsRef = collection(this.firestore, 'products');
    const categoryQuery = query(
      productsRef,
      where('category', '==', category),
      where('available', '==', true),
      orderBy('name')
    );
    
    return collectionData(categoryQuery, { idField: 'id' }).pipe(
      map(products => products as Product[]),
      catchError(error => {
        console.error('Error fetching from Firestore:', error);
        // Return empty array if there's an error
        return of([]);
      })
    );
  }
  
  /**
   * Gets featured products
   */
  getFeaturedProducts(): Observable<Product[]> {
    console.log('Getting featured products');
    
    // Filter local products
    const featuredProducts = this.localProducts
      .filter(p => p.featured)
      .slice(0, 8);
    
    if (featuredProducts.length > 0) {
      console.log('Found featured products in local cache:', featuredProducts.length);
      return of(featuredProducts);
    }
    
    // If no local featured products, try Firestore
    console.log('No local featured products, trying Firestore');
    const productsRef = collection(this.firestore, 'products');
    const featuredQuery = query(
      productsRef,
      where('featured', '==', true),
      where('available', '==', true),
      limit(8)
    );
    
    return collectionData(featuredQuery, { idField: 'id' }).pipe(
      map(products => products as Product[]),
      catchError(error => {
        console.error('Error fetching from Firestore:', error);
        // Return empty array if there's an error
        return of([]);
      })
    );
  }
  
  /**
   * Calculates the nutrition information for a customized product
   * Improved and more accurate calculation
   */
  // Improved nutrition calculation method for ProductService

/**
 * Calculates the nutrition information for a customized product
 * With special handling for food and dessert categories
 */
// In the ProductService class (paste-4.txt), 
// replace the calculateNutrition method with this corrected version:

calculateNutrition(
  product: Product,
  size: ProductCustomizationOption,
  milk: ProductCustomizationOption | null,
  shots: ProductCustomizationOption[],
  syrups: ProductCustomizationOption[],
  sugarLevel: number,
  caffeineLevel: number
): ProductNutritionInfo {
  console.log('Calculating nutrition for product:', product.name);
  console.log('Product category:', product.category);
  
  // Create a fresh copy of the base nutrition to avoid mutating original
  const baseNutrition = { ...product.nutritionInfo };
  
  // Special handling for food and dessert categories
  if (product.category === 'food' || product.category === 'dessert') {
    // For food and dessert, we don't apply the same customizations as beverages
    // Just use the base nutrition values with minor modifications for toppings
    
    // Add nutrition from toppings if applicable
    if (shots && shots.length > 0) {
      // For food and dessert, toppings are passed in the shots parameter
      shots.forEach(topping => {
        // Add approximate nutrition values based on topping type
        switch (topping.id) {
          case 'butter':
            baseNutrition.calories += 35;
            baseNutrition.fat += 4;
            break;
          case 'egg':
            baseNutrition.calories += 70;
            baseNutrition.protein += 6;
            baseNutrition.fat += 5;
            break;
          case 'feta':
          case 'cheese':
            baseNutrition.calories += 50;
            baseNutrition.fat += 4;
            baseNutrition.protein += 3;
            break;
          case 'avocado':
            baseNutrition.calories += 60;
            baseNutrition.fat += 6;
            baseNutrition.protein += 1;
            break;
          case 'bacon':
            baseNutrition.calories += 45;
            baseNutrition.fat += 3.5;
            baseNutrition.protein += 3;
            break;
          case 'sausage':
            baseNutrition.calories += 75;
            baseNutrition.fat += 6;
            baseNutrition.protein += 4;
            break;
          case 'whipped-cream':
            baseNutrition.calories += 40;
            baseNutrition.fat += 3.5;
            baseNutrition.sugar += 2;
            break;
          case 'chocolate':
          case 'chocolate-chips':
          case 'chocolate-sauce':
            baseNutrition.calories += 50;
            baseNutrition.sugar += 8;
            baseNutrition.fat += 2;
            break;
          case 'caramel':
          case 'caramel-sauce':
            baseNutrition.calories += 45;
            baseNutrition.sugar += 10;
            break;
          case 'berry':
          case 'berry-compote':
            baseNutrition.calories += 30;
            baseNutrition.sugar += 7;
            break;
          case 'warm':
            // Warming doesn't affect nutrition
            break;
          default:
            // For other toppings add a small amount
            baseNutrition.calories += 20;
            break;
        }
      });
    }
    
    // Handle sugar level for desserts only
    if (product.category === 'dessert' && sugarLevel !== 3) {
      // Calculate sugar adjustment factor (level 3 is standard)
      const sugarAdjustment = sugarLevel / 3;
      
      // Adjust sugar content based on level
      baseNutrition.sugar = Math.round(baseNutrition.sugar * sugarAdjustment);
      
      // Also adjust calories from sugar
      // Rough approximation: 4 calories per gram of sugar
      const originalSugarCalories = product.nutritionInfo.sugar * 4;
      const newSugarCalories = baseNutrition.sugar * 4;
      const calorieDifference = newSugarCalories - originalSugarCalories;
      
      baseNutrition.calories += calorieDifference;
    }
    
    // Return rounded nutrition values for food/dessert
    return {
      calories: Math.max(0, Math.round(baseNutrition.calories)),
      sugar: Math.max(0, Math.round(baseNutrition.sugar)),
      caffeine: Math.max(0, Math.round(baseNutrition.caffeine)),
      fat: Math.max(0, Math.round(baseNutrition.fat)),
      protein: Math.max(0, Math.round(baseNutrition.protein)),
      allergies: baseNutrition.allergies
    };
  }
  
  // Rest of the method for coffee and tea remains unchanged
  // Size modifiers (assuming baseNutrition is for the smallest size)
  const sizeIndex = product.customizationOptions.sizes.findIndex(s => s.id === size.id);
  let sizeMultiplier = 1;
  
  // Size multiplier calculation
  if (sizeIndex === 0) {
    sizeMultiplier = 1; // Small
  } else if (sizeIndex === 1) {
    sizeMultiplier = 1.5; // Medium
  } else if (sizeIndex === 2) {
    sizeMultiplier = 2; // Large
  }
  
  console.log('Size multiplier:', sizeMultiplier);
  
  // Apply size scaling to base nutrition
  baseNutrition.calories = Math.round(baseNutrition.calories * sizeMultiplier);
  baseNutrition.sugar = Math.round(baseNutrition.sugar * sizeMultiplier);
  baseNutrition.fat = Math.round(baseNutrition.fat * sizeMultiplier);
  baseNutrition.protein = Math.round(baseNutrition.protein * sizeMultiplier);
  
  // Handle caffeine level
  let caffeineMultiplier = 1;
  
  if (caffeineLevel === 0) {
    caffeineMultiplier = 0.05; // 5% for decaf
  } else if (caffeineLevel === 1) {
    caffeineMultiplier = 0.25; // 25% for very low caffeine
  } else if (caffeineLevel === 2) {
    caffeineMultiplier = 0.5; // 50% for low caffeine
  } else if (caffeineLevel === 3) {
    caffeineMultiplier = 1.0; // 100% for regular
  } else if (caffeineLevel === 4) {
    caffeineMultiplier = 1.25; // 125% for high caffeine
  } else if (caffeineLevel === 5) {
    caffeineMultiplier = 1.5; // 150% for very high caffeine
  }
  
  // Check for decaf shot
  const hasDecafShot = shots.some(shot => shot.id === 'decaf');
  if (hasDecafShot) {
    caffeineMultiplier = 0.05; // 5% for decaf
  }
  
  // Apply caffeine multiplier
  baseNutrition.caffeine = Math.round(baseNutrition.caffeine * sizeMultiplier * caffeineMultiplier);
  
  // Add caffeine for extra shots (80mg per shot)
  if (!hasDecafShot) {
    const extraShotCount = shots.filter(shot => shot.id !== 'decaf').length;
    if (extraShotCount > 0) {
      baseNutrition.caffeine += extraShotCount * 80;
      baseNutrition.calories += extraShotCount * 5;
      baseNutrition.protein += extraShotCount * 0.5;
    }
  }
  
  // Sugar modifiers based on sugarLevel (0-5)
  let sugarMultiplier = 1;
  
  if (sugarLevel === 0) {
    sugarMultiplier = 0; // No sugar
  } else if (sugarLevel === 1) {
    sugarMultiplier = 0.33; // 1/3 sugar
  } else if (sugarLevel === 2) {
    sugarMultiplier = 0.67; // 2/3 sugar
  } else if (sugarLevel === 3) {
    sugarMultiplier = 1.0; // Regular sugar
  } else if (sugarLevel === 4) {
    sugarMultiplier = 1.33; // Extra sugar
  } else if (sugarLevel === 5) {
    sugarMultiplier = 1.67; // Very sweet
  }
  
  baseNutrition.sugar = Math.round(baseNutrition.sugar * sugarMultiplier);
  
  // Milk modifiers
  if (milk) {
    // Calculate milk nutrition based on milk type
    let milkFat = 0;
    let milkProtein = 0;
    let milkSugar = 0;
    let milkCalories = 0;
    
    // Calculate milk volume based on size
    const milkVolumeMl = sizeIndex === 0 ? 120 : sizeIndex === 1 ? 180 : 240;
    
    // Milk type specific calculations per 100ml
    if (milk.id === 'whole') {
      milkFat = 3.25 * (milkVolumeMl / 100);
      milkProtein = 3.2 * (milkVolumeMl / 100);
      milkSugar = 4.8 * (milkVolumeMl / 100);
      milkCalories = 61 * (milkVolumeMl / 100);
    } else if (milk.id === 'skim' || milk.id === '2%') {
      milkFat = 2.0 * (milkVolumeMl / 100);
      milkProtein = 3.2 * (milkVolumeMl / 100);
      milkSugar = 4.8 * (milkVolumeMl / 100);
      milkCalories = 50 * (milkVolumeMl / 100);
    } else if (milk.id === 'almond') {
      milkFat = 1.1 * (milkVolumeMl / 100);
      milkProtein = 0.5 * (milkVolumeMl / 100);
      milkSugar = 0.3 * (milkVolumeMl / 100);
      milkCalories = 13 * (milkVolumeMl / 100);
    } else if (milk.id === 'oat') {
      milkFat = 1.5 * (milkVolumeMl / 100);
      milkProtein = 1.0 * (milkVolumeMl / 100);
      milkSugar = 2.5 * (milkVolumeMl / 100);
      milkCalories = 40 * (milkVolumeMl / 100);
    } else if (milk.id === 'coconut') {
      milkFat = 2.2 * (milkVolumeMl / 100);
      milkProtein = 0.2 * (milkVolumeMl / 100);
      milkSugar = 1.0 * (milkVolumeMl / 100);
      milkCalories = 31 * (milkVolumeMl / 100);
    } else if (milk.id === 'soy') {
      milkFat = 1.8 * (milkVolumeMl / 100);
      milkProtein = 3.0 * (milkVolumeMl / 100);
      milkSugar = 1.0 * (milkVolumeMl / 100);
      milkCalories = 33 * (milkVolumeMl / 100);
    } else if (milk.id === 'half-and-half') {
      milkFat = 11.5 * (milkVolumeMl / 100);
      milkProtein = 3.0 * (milkVolumeMl / 100);
      milkSugar = 4.3 * (milkVolumeMl / 100);
      milkCalories = 130 * (milkVolumeMl / 100);
    }
    
    // Add milk nutrition to the base
    baseNutrition.fat += Math.round(milkFat);
    baseNutrition.protein += Math.round(milkProtein);
    baseNutrition.sugar += Math.round(milkSugar * sugarMultiplier);
    baseNutrition.calories += Math.round(milkCalories);
    
    // Add allergies
    if (milk.id === 'whole' || milk.id === 'skim' || milk.id === '2%' || milk.id === 'half-and-half') {
      if (!baseNutrition.allergies.includes('milk')) {
        baseNutrition.allergies.push('milk');
      }
    }
    
    if (milk.id === 'almond') {
      if (!baseNutrition.allergies.includes('nuts')) {
        baseNutrition.allergies.push('nuts');
      }
    }
  }
  
  // Syrup modifiers
  if (syrups && syrups.length > 0) {
    let syrupCalories = 0;
    let syrupSugar = 0;
    
    syrups.forEach(syrup => {
      if (syrup.id.includes('sugar-free')) {
        syrupCalories += 2;
        syrupSugar += 0;
      } else {
        syrupCalories += 20;
        syrupSugar += 5;
      }
    });
    
    baseNutrition.calories += syrupCalories;
    baseNutrition.sugar += Math.round(syrupSugar * sugarMultiplier);
  }
  
  // Return rounded values
  return {
    calories: Math.max(0, Math.round(baseNutrition.calories)),
    sugar: Math.max(0, Math.round(baseNutrition.sugar)),
    caffeine: Math.max(0, Math.round(baseNutrition.caffeine)),
    fat: Math.max(0, Math.round(baseNutrition.fat)),
    protein: Math.max(0, Math.round(baseNutrition.protein)),
    allergies: baseNutrition.allergies
  };
}
  
   /**
   * Get sample products for testing or when Firestore is not available
   */
   private getSampleProducts(): Product[] {
    // Coffee products
    const coffeeProducts: Product[] = [
      {
        id: 'espresso',
        name: 'Espresso',
        description: 'A concentrated form of coffee served in small, strong shots. Bold and intense flavor with a rich crema on top.',
        category: 'coffee',
        price: 2.75,
        imageURL: '/assets/products/espresso.jpg',
        available: true,
        featured: true,
        customizationOptions: {
          sizes: [
            { id: 'single', name: 'Single', priceModifier: 0 },
            { id: 'double', name: 'Double', priceModifier: 1.25 },
            { id: 'triple', name: 'Triple', priceModifier: 2.50 }
          ],
          milk: [],
          shots: [
            { id: 'ristretto', name: 'Ristretto', priceModifier: 0.50 },
            { id: 'lungo', name: 'Lungo', priceModifier: 0.50 }
          ],
          syrups: [
            { id: 'vanilla', name: 'Vanilla', priceModifier: 0.75 },
            { id: 'caramel', name: 'Caramel', priceModifier: 0.75 },
            { id: 'hazelnut', name: 'Hazelnut', priceModifier: 0.75 }
          ],
          toppings: [
            { id: 'cocoa', name: 'Cocoa Powder', priceModifier: 0.25 },
            { id: 'cinnamon', name: 'Cinnamon', priceModifier: 0.25 }
          ]
        },
        nutritionInfo: {
          calories: 5,
          sugar: 0,
          caffeine: 63,
          fat: 0,
          protein: 0.5,
          allergies: []
        },
        model3dURL: 'assets/models/espresso.glb',
        preparationTime: 2
      },
      {
        id: 'cappuccino',
        name: 'Cappuccino',
        description: 'Equal parts espresso, steamed milk, and milk foam. A perfect balance of rich espresso and creamy texture.',
        category: 'coffee',
        price: 4.50,
        imageURL: '/assets/products/cappuccino.jpg',
        available: true,
        featured: true,
        customizationOptions: {
          sizes: [
            { id: 'small', name: 'Small (8oz)', priceModifier: 0 },
            { id: 'medium', name: 'Medium (12oz)', priceModifier: 0.75 },
            { id: 'large', name: 'Large (16oz)', priceModifier: 1.50 }
          ],
          milk: [
            { id: 'whole', name: 'Whole Milk', priceModifier: 0 },
            { id: 'skim', name: 'Skim Milk', priceModifier: 0 },
            { id: 'almond', name: 'Almond Milk', priceModifier: 0.75 },
            { id: 'oat', name: 'Oat Milk', priceModifier: 0.75 }
          ],
          shots: [
            { id: 'extra', name: 'Extra Shot', priceModifier: 1.00 }
          ],
          syrups: [
            { id: 'vanilla', name: 'Vanilla', priceModifier: 0.75 },
            { id: 'caramel', name: 'Caramel', priceModifier: 0.75 },
            { id: 'hazelnut', name: 'Hazelnut', priceModifier: 0.75 }
          ],
          toppings: [
            { id: 'cocoa', name: 'Cocoa Powder', priceModifier: 0.25 },
            { id: 'cinnamon', name: 'Cinnamon', priceModifier: 0.25 },
            { id: 'chocolate', name: 'Chocolate Shavings', priceModifier: 0.50 }
          ]
        },
        nutritionInfo: {
          calories: 120,
          sugar: 6,
          caffeine: 63,
          fat: 4,
          protein: 6,
          allergies: ['milk']
        },
        model3dURL: 'assets/models/cappuccino.glb',
        preparationTime: 4
      },
      {
        id: 'latte',
        name: 'Caffè Latte',
        description: 'Espresso with steamed milk and a light layer of foam. Smooth and creamy with a balanced coffee flavor.',
        category: 'coffee',
        price: 4.25,
        imageURL: '/assets/products/latte.jpg',
        available: true,
        featured: false,
        customizationOptions: {
          sizes: [
            { id: 'small', name: 'Small (8oz)', priceModifier: 0 },
            { id: 'medium', name: 'Medium (12oz)', priceModifier: 0.75 },
            { id: 'large', name: 'Large (16oz)', priceModifier: 1.50 }
          ],
          milk: [
            { id: 'whole', name: 'Whole Milk', priceModifier: 0 },
            { id: 'skim', name: 'Skim Milk', priceModifier: 0 },
            { id: 'almond', name: 'Almond Milk', priceModifier: 0.75 },
            { id: 'oat', name: 'Oat Milk', priceModifier: 0.75 }
          ],
          shots: [
            { id: 'extra', name: 'Extra Shot', priceModifier: 1.00 }
          ],
          syrups: [
            { id: 'vanilla', name: 'Vanilla', priceModifier: 0.75 },
            { id: 'caramel', name: 'Caramel', priceModifier: 0.75 },
            { id: 'hazelnut', name: 'Hazelnut', priceModifier: 0.75 }
          ],
          toppings: [
            { id: 'cinnamon', name: 'Cinnamon', priceModifier: 0.25 },
            { id: 'caramel-drizzle', name: 'Caramel Drizzle', priceModifier: 0.50 }
          ]
        },
        nutritionInfo: {
          calories: 150,
          sugar: 8,
          caffeine: 63,
          fat: 6,
          protein: 8,
          allergies: ['milk']
        },
        model3dURL: 'assets/models/latte.glb',
        preparationTime: 3
      },
      {
        id: 'mocha',
        name: 'Caffè Mocha',
        description: 'Espresso with chocolate syrup, steamed milk, and whipped cream. A sweet and indulgent coffee experience.',
        category: 'coffee',
        price: 4.75,
        imageURL: '/assets/products/mocha.jpg',
        available: true,
        featured: true,
        customizationOptions: {
          sizes: [
            { id: 'small', name: 'Small (8oz)', priceModifier: 0 },
            { id: 'medium', name: 'Medium (12oz)', priceModifier: 0.75 },
            { id: 'large', name: 'Large (16oz)', priceModifier: 1.50 }
          ],
          milk: [
            { id: 'whole', name: 'Whole Milk', priceModifier: 0 },
            { id: 'skim', name: 'Skim Milk', priceModifier: 0 },
            { id: 'almond', name: 'Almond Milk', priceModifier: 0.75 },
            { id: 'oat', name: 'Oat Milk', priceModifier: 0.75 }
          ],
          shots: [
            { id: 'extra', name: 'Extra Shot', priceModifier: 1.00 }
          ],
          syrups: [
            { id: 'vanilla', name: 'Vanilla', priceModifier: 0.75 },
            { id: 'caramel', name: 'Caramel', priceModifier: 0.75 }
          ],
          toppings: [
            { id: 'whipped-cream', name: 'Whipped Cream', priceModifier: 0.50 },
            { id: 'chocolate-shavings', name: 'Chocolate Shavings', priceModifier: 0.50 },
            { id: 'marshmallows', name: 'Mini Marshmallows', priceModifier: 0.75 }
          ]
        },
        nutritionInfo: {
          calories: 230,
          sugar: 22,
          caffeine: 63,
          fat: 8,
          protein: 7,
          allergies: ['milk']
        },
        model3dURL: 'assets/models/mocha.glb',
        preparationTime: 4
      },
      {
        id: 'cold-brew',
        name: 'Cold Brew',
        description: 'Coffee grounds steeped in cold water for 12+ hours. Smooth, less acidic flavor with natural sweetness.',
        category: 'coffee',
        price: 4.00,
        imageURL: '/assets/products/cold-brew.jpg',
        available: true,
        featured: false,
        customizationOptions: {
          sizes: [
            { id: 'small', name: 'Small (12oz)', priceModifier: 0 },
            { id: 'medium', name: 'Medium (16oz)', priceModifier: 0.75 },
            { id: 'large', name: 'Large (20oz)', priceModifier: 1.50 }
          ],
          milk: [
            { id: 'none', name: 'No Milk', priceModifier: 0 },
            { id: 'splash', name: 'Splash of Milk', priceModifier: 0 },
            { id: 'almond', name: 'Almond Milk', priceModifier: 0.75 },
            { id: 'oat', name: 'Oat Milk', priceModifier: 0.75 }
          ],
          shots: [],
          syrups: [
            { id: 'vanilla', name: 'Vanilla', priceModifier: 0.75 },
            { id: 'caramel', name: 'Caramel', priceModifier: 0.75 },
            { id: 'hazelnut', name: 'Hazelnut', priceModifier: 0.75 }
          ],
          toppings: [
            { id: 'cold-foam', name: 'Cold Foam', priceModifier: 0.75 },
            { id: 'sweet-cream', name: 'Sweet Cream', priceModifier: 0.75 }
          ]
        },
        nutritionInfo: {
          calories: 15,
          sugar: 0,
          caffeine: 155,
          fat: 0,
          protein: 0.5,
          allergies: []
        },
        model3dURL: 'assets/models/cold-brew.glb',
        preparationTime: 1
      }
    ];

    // Tea products
    const teaProducts: Product[] = [
      {
        id: 'green-tea',
        name: 'Green Tea',
        description: 'Delicate tea with fresh, grassy flavor and light body. Contains antioxidants and less caffeine than coffee.',
        category: 'tea',
        price: 3.25,
        imageURL: '/assets/products/green-tea.jpg',
        available: true,
        featured: true,
        customizationOptions: {
          sizes: [
            { id: 'small', name: 'Small (8oz)', priceModifier: 0 },
            { id: 'medium', name: 'Medium (12oz)', priceModifier: 0.50 },
            { id: 'large', name: 'Large (16oz)', priceModifier: 1.00 }
          ],
          milk: [
            { id: 'none', name: 'No Milk', priceModifier: 0 },
            { id: 'splash', name: 'Splash of Milk', priceModifier: 0 },
            { id: 'almond', name: 'Almond Milk', priceModifier: 0.75 }
          ],
          shots: [],
          syrups: [
            { id: 'honey', name: 'Honey', priceModifier: 0.50 },
            { id: 'lemon', name: 'Lemon', priceModifier: 0.25 }
          ],
          toppings: []
        },
        nutritionInfo: {
          calories: 5,
          sugar: 0,
          caffeine: 28,
          fat: 0,
          protein: 0,
          allergies: []
        },
        model3dURL: 'assets/models/green-tea.glb',
        preparationTime: 3
      },
      {
        id: 'chai-latte',
        name: 'Chai Latte',
        description: 'Black tea infused with cinnamon, cloves, and other warming spices. Mixed with steamed milk for a cozy drink.',
        category: 'tea',
        price: 4.50,
        imageURL: '/assets/products/chai-latte.jpg',
        available: true,
        featured: true,
        customizationOptions: {
          sizes: [
            { id: 'small', name: 'Small (8oz)', priceModifier: 0 },
            { id: 'medium', name: 'Medium (12oz)', priceModifier: 0.75 },
            { id: 'large', name: 'Large (16oz)', priceModifier: 1.50 }
          ],
          milk: [
            { id: 'whole', name: 'Whole Milk', priceModifier: 0 },
            { id: 'skim', name: 'Skim Milk', priceModifier: 0 },
            { id: 'almond', name: 'Almond Milk', priceModifier: 0.75 },
            { id: 'oat', name: 'Oat Milk', priceModifier: 0.75 }
          ],
          shots: [],
          syrups: [
            { id: 'vanilla', name: 'Vanilla', priceModifier: 0.75 },
            { id: 'caramel', name: 'Caramel', priceModifier: 0.75 }
          ],
          toppings: [
            { id: 'cinnamon', name: 'Cinnamon', priceModifier: 0.25 },
            { id: 'whipped-cream', name: 'Whipped Cream', priceModifier: 0.50 }
          ]
        },
        nutritionInfo: {
          calories: 200,
          sugar: 18,
          caffeine: 40,
          fat: 6,
          protein: 6,
          allergies: ['milk']
        },
        model3dURL: 'assets/models/chai-latte.glb',
        preparationTime: 4
      },
      {
        id: 'earl-grey',
        name: 'Earl Grey',
        description: 'Black tea flavored with oil of bergamot, giving it a distinctive citrusy flavor and aroma.',
        category: 'tea',
        price: 3.25,
        imageURL: '/assets/products/earl-grey.jpg',
        available: true,
        featured: false,
        customizationOptions: {
          sizes: [
            { id: 'small', name: 'Small (8oz)', priceModifier: 0 },
            { id: 'medium', name: 'Medium (12oz)', priceModifier: 0.50 },
            { id: 'large', name: 'Large (16oz)', priceModifier: 1.00 }
          ],
          milk: [
            { id: 'none', name: 'No Milk', priceModifier: 0 },
            { id: 'splash', name: 'Splash of Milk', priceModifier: 0 },
            { id: 'lemon', name: 'Lemon', priceModifier: 0 }
          ],
          shots: [],
          syrups: [
            { id: 'honey', name: 'Honey', priceModifier: 0.50 }
          ],
          toppings: []
        },
        nutritionInfo: {
          calories: 5,
          sugar: 0,
          caffeine: 40,
          fat: 0,
          protein: 0,
          allergies: []
        },
        model3dURL: 'assets/models/earl-grey.glb',
        preparationTime: 3
      },
      {
        id: 'matcha-latte',
        name: 'Matcha Latte',
        description: 'Finely ground green tea powder whisked with steamed milk. Rich in antioxidants with a unique taste.',
        category: 'tea',
        price: 4.75,
        imageURL: '/assets/products/matcha-latte.jpg',
        available: true,
        featured: true,
        customizationOptions: {
          sizes: [
            { id: 'small', name: 'Small (8oz)', priceModifier: 0 },
            { id: 'medium', name: 'Medium (12oz)', priceModifier: 0.75 },
            { id: 'large', name: 'Large (16oz)', priceModifier: 1.50 }
          ],
          milk: [
            { id: 'whole', name: 'Whole Milk', priceModifier: 0 },
            { id: 'skim', name: 'Skim Milk', priceModifier: 0 },
            { id: 'almond', name: 'Almond Milk', priceModifier: 0.75 },
            { id: 'oat', name: 'Oat Milk', priceModifier: 0.75 }
          ],
          shots: [],
          syrups: [
            { id: 'vanilla', name: 'Vanilla', priceModifier: 0.75 },
            { id: 'honey', name: 'Honey', priceModifier: 0.50 }
          ],
          toppings: [
            { id: 'whipped-cream', name: 'Whipped Cream', priceModifier: 0.50 }
          ]
        },
        nutritionInfo: {
          calories: 180,
          sugar: 12,
          caffeine: 65,
          fat: 6,
          protein: 6,
          allergies: ['milk']
        },
        model3dURL: 'assets/models/matcha-latte.glb',
        preparationTime: 4
      }
    ];

  // Food products
  const foodProducts: Product[] = [
    {
      id: 'avocado-toast',
      name: 'Avocado Toast',
      description: 'Toasted artisan bread topped with fresh avocado, cherry tomatoes, microgreens, and a sprinkle of sea salt.',
      category: 'food',
      price: 8.50,
      imageURL: '/assets/products/avocado-toast.jpg',
      available: true,
      featured: true,
      customizationOptions: {
        sizes: [],
        milk: [],
        shots: [],
        syrups: [],
        toppings: [
          { id: 'egg', name: 'Poached Egg', priceModifier: 1.50 },
          { id: 'feta', name: 'Feta Cheese', priceModifier: 1.00 },
          { id: 'sriracha', name: 'Sriracha', priceModifier: 0.50 }
        ]
      },
      nutritionInfo: {
        calories: 320,
        sugar: 2,
        caffeine: 0,
        fat: 18,
        protein: 8,
        allergies: ['gluten']
      },
      model3dURL: 'assets/models/avocado-toast.glb',
      preparationTime: 5
    },
    {
      id: 'breakfast-sandwich',
      name: 'Breakfast Sandwich',
      description: 'Cage-free egg with cheddar cheese and your choice of bacon or sausage on a toasted brioche bun.',
      category: 'food',
      price: 7.95,
      imageURL: '/assets/products/breakfast-sandwich.jpg',
      available: true,
      featured: true,
      customizationOptions: {
        sizes: [],
        milk: [],
        shots: [],
        syrups: [],
        toppings: [
          { id: 'bacon', name: 'Bacon', priceModifier: 0 },
          { id: 'sausage', name: 'Sausage', priceModifier: 0 },
          { id: 'avocado', name: 'Avocado', priceModifier: 1.50 },
          { id: 'spinach', name: 'Spinach', priceModifier: 0.75 }
        ]
      },
      nutritionInfo: {
        calories: 450,
        sugar: 3,
        caffeine: 0,
        fat: 24,
        protein: 25,
        allergies: ['milk', 'eggs', 'gluten']
      },
      model3dURL: 'assets/models/breakfast-sandwich.glb',
      preparationTime: 7
    },
    {
      id: 'yogurt-parfait',
      name: 'Yogurt Parfait',
      description: 'Layers of Greek yogurt, fresh berries, and house-made granola with a drizzle of honey.',
      category: 'food',
      price: 6.25,
      imageURL: '/assets/products/yogurt-parfait.jpg',
      available: true,
      featured: false,
      customizationOptions: {
        sizes: [],
        milk: [],
        shots: [],
        syrups: [],
        toppings: [
          { id: 'chia', name: 'Chia Seeds', priceModifier: 0.75 },
          { id: 'almond', name: 'Sliced Almonds', priceModifier: 0.75 },
          { id: 'chocolate', name: 'Chocolate Chips', priceModifier: 0.75 }
        ]
      },
      nutritionInfo: {
        calories: 290,
        sugar: 18,
        caffeine: 0,
        fat: 9,
        protein: 15,
        allergies: ['milk', 'nuts', 'gluten']
      },
      model3dURL: 'assets/models/yogurt-parfait.glb',
      preparationTime: 3
    },
    {
      id: 'chicken-wrap',
      name: 'Chicken Caesar Wrap',
      description: 'Grilled chicken, romaine lettuce, parmesan cheese, and caesar dressing wrapped in a flour tortilla.',
      category: 'food',
      price: 9.95,
      imageURL: '/assets/products/chicken-wrap.jpg',
      available: true,
      featured: false,
      customizationOptions: {
        sizes: [],
        milk: [],
        shots: [],
        syrups: [],
        toppings: [
          { id: 'avocado', name: 'Avocado', priceModifier: 1.50 },
          { id: 'bacon', name: 'Bacon', priceModifier: 1.00 },
          { id: 'tomato', name: 'Tomato', priceModifier: 0.50 }
        ]
      },
      nutritionInfo: {
        calories: 520,
        sugar: 4,
        caffeine: 0,
        fat: 22,
        protein: 35,
        allergies: ['milk', 'gluten', 'eggs']
      },
      model3dURL: 'assets/models/chicken-wrap.glb',
      preparationTime: 6
    }
  ];

  // Dessert products
  const dessertProducts: Product[] = [
    {
      id: 'chocolate-croissant',
      name: 'Chocolate Croissant',
      description: 'Buttery, flaky croissant filled with rich chocolate. Freshly baked throughout the day.',
      category: 'dessert',
      price: 3.95,
      imageURL: '/assets/products/chocolate-croissant.jpg',
      available: true,
      featured: true,
      customizationOptions: {
        sizes: [],
        milk: [],
        shots: [],
        syrups: [],
        toppings: [
          { id: 'warm', name: 'Warmed Up', priceModifier: 0 }
        ]
      },
      nutritionInfo: {
        calories: 340,
        sugar: 16,
        caffeine: 0,
        fat: 18,
        protein: 6,
        allergies: ['milk', 'gluten', 'eggs']
      },
      model3dURL: 'assets/models/chocolate-croissant.glb',
      preparationTime: 1
    },
    {
      id: 'blueberry-muffin',
      name: 'Blueberry Muffin',
      description: 'Moist muffin packed with juicy blueberries and topped with a crunchy streusel topping.',
      category: 'dessert',
      price: 3.50,
      imageURL: '/assets/products/blueberry-muffin.jpg',
      available: true,
      featured: false,
      customizationOptions: {
        sizes: [],
        milk: [],
        shots: [],
        syrups: [],
        toppings: [
          { id: 'warm', name: 'Warmed Up', priceModifier: 0 },
          { id: 'butter', name: 'Side of Butter', priceModifier: 0.50 }
        ]
      },
      nutritionInfo: {
        calories: 380,
        sugar: 22,
        caffeine: 0,
        fat: 16,
        protein: 5,
        allergies: ['milk', 'gluten', 'eggs']
      },
      model3dURL: 'assets/models/blueberry-muffin.glb',
      preparationTime: 1
    },
    {
      id: 'chocolate-chip-cookie',
      name: 'Chocolate Chip Cookie',
      description: 'Freshly baked cookie with a perfect balance of chewy center, crisp edges, and chocolate chunks.',
      category: 'dessert',
      price: 2.75,
      imageURL: '/assets/products/chocolate-chip-cookie.jpg',
      available: true,
      featured: true,
      customizationOptions: {
        sizes: [],
        milk: [],
        shots: [],
        syrups: [],
        toppings: [
          { id: 'warm', name: 'Warmed Up', priceModifier: 0 }
        ]
      },
      nutritionInfo: {
        calories: 310,
        sugar: 18,
        caffeine: 0,
        fat: 15,
        protein: 3,
        allergies: ['milk', 'gluten', 'eggs']
      },
      model3dURL: 'assets/models/chocolate-chip-cookie.glb',
      preparationTime: 1
    },
    {
      id: 'cheesecake',
      name: 'New York Cheesecake',
      description: 'Creamy cheesecake with a graham cracker crust, topped with seasonal berry compote.',
      category: 'dessert',
      price: 5.95,
      imageURL: '/assets/products/cheesecake.jpg',
      available: true,
      featured: true,
      customizationOptions: {
        sizes: [],
        milk: [],
        shots: [],
        syrups: [],
        toppings: [
          { id: 'berry', name: 'Berry Compote', priceModifier: 0 },
          { id: 'caramel', name: 'Caramel Sauce', priceModifier: 0.75 },
          { id: 'chocolate', name: 'Chocolate Sauce', priceModifier: 0.75 }
        ]
      },
      nutritionInfo: {
        calories: 450,
        sugar: 28,
        caffeine: 0,
        fat: 32,
        protein: 8,
        allergies: ['milk', 'gluten', 'eggs']
      },
      model3dURL: 'assets/models/cheesecake.glb',
      preparationTime: 2
    },
    {
      id: 'carrot-cake',
      name: 'Carrot Cake',
      description: 'Spiced cake with freshly grated carrots and walnuts, topped with cream cheese frosting.',
      category: 'dessert',
      price: 5.50,
      imageURL: '/assets/products/carrot-cake.jpg',
      available: true,
      featured: false,
      customizationOptions: {
        sizes: [],
        milk: [],
        shots: [],
        syrups: [],
        toppings: []
      },
      nutritionInfo: {
        calories: 420,
        sugar: 32,
        caffeine: 0,
        fat: 22,
        protein: 5,
        allergies: ['milk', 'gluten', 'eggs', 'nuts']
      },
      model3dURL: 'assets/models/carrot-cake.glb',
      preparationTime: 2
    }
  ];

  // Combine all products
  return [
    ...coffeeProducts,
    ...teaProducts,
    ...foodProducts,
    ...dessertProducts
  ];
}
}
  


