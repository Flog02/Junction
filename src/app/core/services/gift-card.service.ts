// src/app/core/services/gift-card.service.ts

import { Injectable } from '@angular/core';
import { 
  Firestore, 
  doc, 
  collection, 
  addDoc, 
  getDoc, 
  updateDoc, 
  query, 
  where, 
  getDocs, 
  limit, 
  orderBy, 
  collectionData
} from '@angular/fire/firestore';
import { Storage, ref, uploadString, getDownloadURL } from '@angular/fire/storage';
import { Auth, user } from '@angular/fire/auth';
import { Observable, from, of, throwError } from 'rxjs';
import { map, switchMap, catchError } from 'rxjs/operators';
import { GiftCard, GiftCardTemplate } from '../models/gift-card.model';

@Injectable({
  providedIn: 'root'
})
export class GiftCardService {
  private readonly GIFT_CARD_COLLECTION = 'giftCards';
  
  constructor(
    private firestore: Firestore,
    private auth: Auth,
    private storage: Storage
  ) {}
  
  /**
   * Gets a list of available gift card templates
   */
  getGiftCardTemplates(): Observable<GiftCardTemplate[]> {
    // In a real app, these would come from Firestore
    // We're hardcoding for simplicity
    const templates: GiftCardTemplate[] = [
      {
        id: 'birthday',
        name: 'Birthday Celebration',
        imageUrl: 'assets/gift-cards/birthday.jpg',
        category: 'occasion',
        occasions: ['birthday']
      },
      {
        id: 'thank-you',
        name: 'Thank You',
        imageUrl: 'assets/gift-cards/thank-you.jpg',
        category: 'occasion',
        occasions: ['thank you']
      },
      {
        id: 'congratulations',
        name: 'Congratulations',
        imageUrl: 'assets/gift-cards/congratulations.jpg',
        category: 'occasion',
        occasions: ['congratulations']
      },
      {
        id: 'coffee-lover',
        name: 'Coffee Lover',
        imageUrl: 'assets/gift-cards/coffee-lover.jpg',
        category: 'theme',
        occasions: ['any']
      },
      {
        id: 'holiday',
        name: 'Holiday Cheer',
        imageUrl: 'assets/gift-cards/holiday.jpg',
        category: 'seasonal',
        occasions: ['christmas', 'holidays']
      }
    ];
    
    return of(templates);
  }
  
  /**
   * Creates a new gift card
   */
  createGiftCard(giftCard: Omit<GiftCard, 'id' | 'code' | 'status' | 'orderIds'>): Observable<string> {
    return user(this.auth).pipe(
      switchMap(user => {
        if (!user) {
          return throwError(() => new Error('You must be logged in to create a gift card'));
        }
        
        // Generate a random code
        const code = this.generateRandomCode();
        
        // Set expiry date to one year from now if not provided
        const expiryDate = giftCard.expiryDate || this.getDefaultExpiryDate();
        
        // Create the gift card object
        const newGiftCard: GiftCard = {
          ...giftCard,
          code,
          senderId: user.uid,
          senderName: user.displayName || '',
          status: 'active',
          orderIds: [],
          createdDate: new Date(),
          expiryDate,
          redeemedDate: null,
          redeemedBy: null
        };
        
        // Add to Firestore
        const giftCardsRef = collection(this.firestore, this.GIFT_CARD_COLLECTION);
        return from(addDoc(giftCardsRef, this.prepareForFirestore(newGiftCard))).pipe(
          map(docRef => {
            // Send email notification (would be done via Cloud Functions in a real app)
            this.sendGiftCardEmailNotification(newGiftCard);
            
            return docRef.id;
          })
        );
      })
    );
  }
  
  /**
   * Gets a gift card by ID
   */
  getGiftCardById(id: string): Observable<GiftCard | null> {
    const giftCardRef = doc(this.firestore, `${this.GIFT_CARD_COLLECTION}/${id}`);
    
    return from(getDoc(giftCardRef)).pipe(
      map(docSnap => {
        if (docSnap.exists()) {
          const data = docSnap.data() as any;
          return {
            id: docSnap.id,
            ...this.convertFromFirestore(data)
          };
        }
        return null;
      })
    );
  }
  
  /**
   * Gets a gift card by code
   */
  getGiftCardByCode(code: string): Observable<GiftCard | null> {
    const giftCardsRef = collection(this.firestore, this.GIFT_CARD_COLLECTION);
    const q = query(giftCardsRef, where('code', '==', code), limit(1));
    
    return from(getDocs(q)).pipe(
      map(querySnapshot => {
        if (!querySnapshot.empty) {
          const doc = querySnapshot.docs[0];
          const data = doc.data() as any;
          return {
            id: doc.id,
            ...this.convertFromFirestore(data)
          };
        }
        return null;
      })
    );
  }
  
  /**
   * Gets all gift cards sent by the current user
   */
  getSentGiftCards(): Observable<GiftCard[]> {
    return user(this.auth).pipe(
      switchMap(user => {
        if (!user) {
          return of([]);
        }
        
        const giftCardsRef = collection(this.firestore, this.GIFT_CARD_COLLECTION);
        const q = query(
          giftCardsRef, 
          where('senderId', '==', user.uid),
          orderBy('createdDate', 'desc')
        );
        
        return collectionData(q, { idField: 'id' }).pipe(
          map(giftCards => giftCards.map(giftCard => this.convertFromFirestore(giftCard as GiftCard)))
        );
      })
    );
  }
  
  /**
   * Gets all gift cards received by the current user
   */
  getReceivedGiftCards(): Observable<GiftCard[]> {
    return user(this.auth).pipe(
      switchMap(user => {
        if (!user) {
          return of([]);
        }
        
        const giftCardsRef = collection(this.firestore, this.GIFT_CARD_COLLECTION);
        const q = query(
          giftCardsRef, 
          where('recipientEmail', '==', user.email),
          orderBy('createdDate', 'desc')
        );
        
        return collectionData(q, { idField: 'id' }).pipe(
          map(giftCards => giftCards.map(giftCard => this.convertFromFirestore(giftCard as GiftCard)))
        );
      })
    );
  }
  
  /**
   * Gets all active gift cards owned by the current user
   */
  getActiveGiftCards(): Observable<GiftCard[]> {
    return user(this.auth).pipe(
      switchMap(user => {
        if (!user) {
          return of([]);
        }
        
        const giftCardsRef = collection(this.firestore, this.GIFT_CARD_COLLECTION);
        const q = query(
          giftCardsRef, 
          where('redeemedBy', '==', user.uid),
          where('status', '==', 'active'),
          orderBy('createdDate', 'desc')
        );
        
        return collectionData(q, { idField: 'id' }).pipe(
          map(giftCards => giftCards.map(giftCard => this.convertFromFirestore(giftCard as GiftCard)))
        );
      })
    );
  }
  
  /**
   * Redeems a gift card
   */
  redeemGiftCard(code: string): Observable<GiftCard> {
    return user(this.auth).pipe(
      switchMap(user => {
        if (!user) {
          return throwError(() => new Error('You must be logged in to redeem a gift card'));
        }
        
        return this.getGiftCardByCode(code).pipe(
          switchMap(giftCard => {
            if (!giftCard) {
              return throwError(() => new Error('Gift card not found'));
            }
            
            if (giftCard.status !== 'active') {
              return throwError(() => new Error(`Gift card is ${giftCard.status}`));
            }
            
            // Check if expired
            const now = new Date();
            if (giftCard.expiryDate) {
              if (now > new Date(giftCard.expiryDate)) {
                return throwError(() => new Error('Gift card has expired'));
              }
            } else {
              // If there's no expiry date, consider the gift card as not expired
              // If you want different behavior, you can return an error instead:
              // return throwError(() => new Error('Gift card has no expiry date'));
            }
            
            // Update the gift card
            const giftCardRef = doc(this.firestore, `${this.GIFT_CARD_COLLECTION}/${giftCard.id}`);
            
            return from(updateDoc(giftCardRef, {
              redeemedBy: user.uid,
              redeemedDate: new Date(),
              status: 'redeemed'
            })).pipe(
              map(() => {
                // Return the updated gift card
                return {
                  ...giftCard,
                  redeemedBy: user.uid,
                  redeemedDate: new Date(),
                  status: 'redeemed' as const
                };
              })
            );
          })
        );
      })
    );
  }
  
  /**
   * Applies a gift card to an order
   */
  applyGiftCardToOrder(giftCardId: string, orderId: string, amount: number): Observable<void> {
    return user(this.auth).pipe(
      switchMap(user => {
        if (!user) {
          return throwError(() => new Error('You must be logged in to apply a gift card'));
        }
        
        return this.getGiftCardById(giftCardId).pipe(
          switchMap(giftCard => {
            if (!giftCard) {
              return throwError(() => new Error('Gift card not found'));
            }
            
            if (giftCard.status !== 'active') {
              return throwError(() => new Error(`Gift card is ${giftCard.status}`));
            }
            
            if (giftCard.redeemedBy !== user.uid) {
              return throwError(() => new Error('You do not own this gift card'));
            }
            
            // Check if balance is sufficient
            if (giftCard.amount < amount) {
              return throwError(() => new Error('Insufficient gift card balance'));
            }
            
            // Update the gift card
            const giftCardRef = doc(this.firestore, `${this.GIFT_CARD_COLLECTION}/${giftCardId}`);
            
            const updatedAmount = giftCard.amount - amount;
            const updatedStatus = updatedAmount === 0 ? 'redeemed' : 'active';
            
            return from(updateDoc(giftCardRef, {
              amount: updatedAmount,
              status: updatedStatus,
              orderIds: [...giftCard.orderIds, orderId]
            }));
          })
        );
      })
    );
  }
  
  /**
   * Sends an email notification about the gift card
   * In a real app, this would be handled by a Cloud Function
   */
  private sendGiftCardEmailNotification(giftCard: GiftCard): void {
    console.log(`Email notification sent to ${giftCard.recipientEmail}`);
    // In a real app, implement email sending logic
  }
  
  /**
   * Generates a random gift card code
   */
  private generateRandomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    
    // Generate a 16-character code in format XXXX-XXXX-XXXX-XXXX
    for (let i = 0; i < 16; i++) {
      if (i > 0 && i % 4 === 0) {
        code += '-';
      }
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return code;
  }
  
  /**
   * Gets a default expiry date (1 year from now)
   */
  private getDefaultExpiryDate(): Date {
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    return expiryDate;
  }
  
  /**
   * Prepares a gift card object for Firestore
   */
  private prepareForFirestore(giftCard: GiftCard): any {
    // Create a copy to avoid modifying the original
    const giftCardForFirestore = { ...giftCard };
    
    // Remove id field if present (Firestore will generate one)
    if (giftCardForFirestore.id) {
      delete (giftCardForFirestore as any).id;
    }
    
    return giftCardForFirestore;
  }
  
  /**
   * Converts a Firestore gift card to our model
   */
  private convertFromFirestore(data: any): GiftCard {
    // Convert Firestore timestamps to Date objects
    if (data.createdDate && typeof data.createdDate.toDate === 'function') {
      data.createdDate = data.createdDate.toDate();
    }
    
    if (data.expiryDate && typeof data.expiryDate.toDate === 'function') {
      data.expiryDate = data.expiryDate.toDate();
    }
    
    if (data.redeemedDate && typeof data.redeemedDate.toDate === 'function') {
      data.redeemedDate = data.redeemedDate.toDate();
    }
    
    return data as GiftCard;
  }
}

export { GiftCardTemplate, GiftCard };
