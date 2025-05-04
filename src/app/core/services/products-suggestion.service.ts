import { Injectable } from '@angular/core';
import { 
  Firestore, 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs,
  collectionData,
  getDoc,
  doc
} from '@angular/fire/firestore';
import { AuthService } from './auth.service';
import { Observable, from, of, combineLatest } from 'rxjs';
import { map, switchMap, take, catchError, tap } from 'rxjs/operators';
import { Product } from '../models/product.model';
import { Order, OrderItem } from '../models/order.model';
import { ProductService } from './product.service';

@Injectable({
  providedIn: 'root'
})
export class SuggestionService {
  constructor(
    private firestore: Firestore,
    private authService: AuthService,
    private productService: ProductService // Inject your product service

  ) {}

  /**
   * Get personalized product suggestions
   * @returns Observable of suggested products
   */
  // In SuggestionService.getPersonalizedSuggestions

getPersonalizedSuggestions(limit: number = 4): Observable<Product[]> {
    console.log('Getting personalized suggestions...');
    
    return this.authService.user$.pipe(
      switchMap(user => {
        console.log('User auth state:', user ? 'Logged in' : 'Not logged in');
        if (!user) {
          return of([]);
        }
  
        // Get user's order history
        return this.getUserOrderHistory(user.uid).pipe(
          switchMap(orders => {
            console.log('User order history:', orders.length, 'orders found');
            if (orders.length === 0) {
              // If no order history, return popular products instead
              console.log('No orders found, falling back to popular products');
              return this.getPopularProducts(limit);
            }
  
            // Analyze order history to find patterns
            const suggestions = this.analyzePurchaseHistory(orders);
            console.log('Analyzed purchase history, suggested IDs:', suggestions);
            
            // Get product details for suggested product IDs
            return this.getProductsByIds(suggestions.slice(0, limit));
          })
        );
      }),
      catchError(error => {
        console.error('Error in suggestion pipeline:', error);
        return of([]);
      })
    );
  }

  /**
   * Get user's order history
   */
  private getUserOrderHistory(userId: string): Observable<Order[]> {
    const ordersRef = collection(this.firestore, 'orders');
    const userOrdersQuery = query(
      ordersRef,
      where('userId', '==', userId),
      orderBy('orderTime', 'desc'),
      limit(20) // Last 20 orders should be enough
    );

    return collectionData(userOrdersQuery, { idField: 'id' }).pipe(
      map(orders => orders as Order[])
    );
  }

  /**
   * Analyze purchase history to identify patterns and preferences
   * @returns Array of product IDs recommended for the user
   */
  private analyzePurchaseHistory(orders: Order[]): string[] {
    // Initialize data structures
    const productFrequency: { [productId: string]: number } = {};
    const productRecency: { [productId: string]: Date } = {};
    const categoryPreference: { [category: string]: number } = {};
    const timeOfDayPreference: { [hour: number]: number } = {};
    
    // Process each order
    orders.forEach(order => {
      // Process order date/time
      const orderDate = new Date(order.orderTime);
      const hour = orderDate.getHours();
      
      // Count orders by hour of day
      timeOfDayPreference[hour] = (timeOfDayPreference[hour] || 0) + 1;
      
      // Process each item in the order
      order.items.forEach(item => {
        // Count product frequency
        productFrequency[item.productId] = (productFrequency[item.productId] || 0) + item.quantity;
        
        // Track most recent purchase
        productRecency[item.productId] = orderDate;
        
        // Track category preferences
        if (item.category) {
          categoryPreference[item.category] = (categoryPreference[item.category] || 0) + item.quantity;
        }
      });
    });
    
    // Score products based on frequency, recency, and category preference
    const productScores: { productId: string, score: number }[] = [];
    const now = new Date();
    
    // Calculate scores for each product
    Object.keys(productFrequency).forEach(productId => {
      // Base score from frequency
      let score = productFrequency[productId];
      
      // Add recency bonus (higher for more recent purchases)
      const daysSinceLastPurchase = Math.floor((now.getTime() - productRecency[productId].getTime()) / (1000 * 60 * 60 * 24));
      score += Math.max(0, 10 - daysSinceLastPurchase); // Boost for recently purchased items
      
      productScores.push({ productId, score });
    });
    
    // Sort by score and extract product IDs
    return productScores
      .sort((a, b) => b.score - a.score)
      .map(item => item.productId);
  }

  /**
   * Get products by IDs
   */
  // Modify your getProductsByIds method
private getProductsByIds(productIds: string[]): Observable<any[]> {
    console.log('SuggestionService: Getting products for IDs:', productIds);
    
    if (!productIds || productIds.length === 0) {
      console.log('SuggestionService: No product IDs to retrieve');
      return of([]);
    }
  
    // Get all products from your local service
    const allProducts = this.productService.getSampleProducts();
    
    // Filter to match our suggested product IDs
    const matchingProducts = allProducts.filter(product => 
      productIds.includes(product.id)
    );
    
    console.log('SuggestionService: Matching products found:', matchingProducts.length);
    return of(matchingProducts);
  }

  /**
   * Get popular products (fallback if user has no order history)
   */
  private getPopularProducts(maxItems: number): Observable<Product[]> {
    const productsRef = collection(this.firestore, 'products');
    const popularProductsQuery = query(
      productsRef,
      orderBy('popularity', 'desc'),
      limit(maxItems)
    );

    return collectionData(popularProductsQuery, { idField: 'id' }).pipe(
      map(products => products as Product[])
    );
  }

  /**
   * Check if it's time to remind user about regular orders
   * @returns Observable with products to remind about and their typical order time
   */
  getTimeBasedReminders(): Observable<{product: Product, typicalTime: string}[]> {
    return this.authService.user$.pipe(
      switchMap(user => {
        if (!user) {
          return of([]);
        }

        return this.analyzeOrderPatterns(user.uid);
      })
    );
  }

  /**
   * Analyze order patterns to identify regular purchase times
   */
  private analyzeOrderPatterns(userId: string): Observable<{product: Product, typicalTime: string}[]> {
    return this.getUserOrderHistory(userId).pipe(
      map(orders => {
        // Group orders by day of week and time
        const patterns: {
          [productId: string]: {
            dayOfWeek: { [day: number]: number },
            timeOfDay: { [hour: number]: number },
            lastOrdered: Date,
            count: number,
            product?: Product
          }
        } = {};

        // Process orders to identify patterns
        orders.forEach(order => {
          const orderDate = new Date(order.orderTime);
          const dayOfWeek = orderDate.getDay();
          const hour = orderDate.getHours();

          order.items.forEach(item => {
            if (!patterns[item.productId]) {
              patterns[item.productId] = {
                dayOfWeek: {},
                timeOfDay: {},
                lastOrdered: orderDate,
                count: 0
              };
            }

            // Count day of week frequency
            patterns[item.productId].dayOfWeek[dayOfWeek] = 
              (patterns[item.productId].dayOfWeek[dayOfWeek] || 0) + 1;
            
            // Count time of day frequency
            patterns[item.productId].timeOfDay[hour] = 
              (patterns[item.productId].timeOfDay[hour] || 0) + 1;
            
            // Update count and last ordered date
            patterns[item.productId].count += item.quantity;
            
            if (orderDate > patterns[item.productId].lastOrdered) {
              patterns[item.productId].lastOrdered = orderDate;
            }
          });
        });

        // Find products with strong patterns (ordered 3+ times)
        const predictableProducts = Object.keys(patterns)
          .filter(productId => patterns[productId].count >= 3)
          .map(productId => productId);

        // Get product details and typical order times
        return this.getProductsByIds(predictableProducts).pipe(
          map(products => {
            const reminders: {product: Product, typicalTime: string}[] = [];
            
            products.forEach(product => {
              if (!product) return;
              
              const pattern = patterns[product.id];
              
              // Find most common day and time
              let mostCommonDay = 0;
              let mostCommonDayCount = 0;
              
              Object.entries(pattern.dayOfWeek).forEach(([day, count]) => {
                if (count > mostCommonDayCount) {
                  mostCommonDay = parseInt(day);
                  mostCommonDayCount = count;
                }
              });
              
              let mostCommonHour = 0;
              let mostCommonHourCount = 0;
              
              Object.entries(pattern.timeOfDay).forEach(([hour, count]) => {
                if (count > mostCommonHourCount) {
                  mostCommonHour = parseInt(hour);
                  mostCommonHourCount = count;
                }
              });
              
              // Format typical order time
              const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
              const formattedHour = mostCommonHour > 12 ? `${mostCommonHour - 12} PM` : `${mostCommonHour} AM`;
              const typicalTime = `${days[mostCommonDay]} around ${formattedHour}`;
              
              reminders.push({ product, typicalTime });
            });
            
            return reminders;
          })
        );
      }),
      switchMap(reminderObservable => reminderObservable),
      catchError(error => {
        console.error('Error analyzing order patterns:', error);
        return of([]);
      })
    );
  }
}