// src/app/core/services/table.service.ts

import { Injectable } from '@angular/core';
import { 
  Firestore, 
  doc, 
  getDoc, 
  collection,
  query,
  where
} from '@angular/fire/firestore';
import { Observable, from, of, throwError } from 'rxjs';
import { map, switchMap, catchError } from 'rxjs/operators';
import { TableInfo, StoreInfo } from '../models/table.model';

@Injectable({
  providedIn: 'root'
})
export class TableService {
  
  constructor(private firestore: Firestore) {}
  
  /**
   * Gets table information from a QR code
   * QR code format: cafe-app://table/storeId/tableNumber
   */
  getTableInfoFromQRCode(qrCodeData: string): Observable<TableInfo> {
    try {
      // Parse QR code data
      const regex = /cafe-app:\/\/table\/([^\/]+)\/(\d+)/;
      const match = qrCodeData.match(regex);
      
      if (!match) {
        return throwError(() => new Error('Invalid QR code format'));
      }
      
      const storeId = match[1];
      const tableNumber = parseInt(match[2], 10);
      
      // Get store information
      return this.getStoreInfo(storeId).pipe(
        map(store => {
          if (!store) {
            throw new Error('Store not found');
          }
          
          if (tableNumber > store.tableCount) {
            throw new Error('Table number not valid for this store');
          }
          
          // Create table info
          const tableInfo: TableInfo = {
            storeId,
            tableNumber,
            seats: 4, // Default value
            status: 'available', // Default value
            qrCodeUrl: store.qrCodes[tableNumber] || ''
          };
          
          return tableInfo;
        }),
        catchError(error => {
          return throwError(() => error);
        })
      );
    } catch (error) {
      return throwError(() => new Error('Failed to parse QR code data'));
    }
  }
  
  /**
   * Gets store information
   */
  getStoreInfo(storeId: string): Observable<StoreInfo | null> {
    const storeRef = doc(this.firestore, `stores/${storeId}`);
    
    return from(getDoc(storeRef)).pipe(
      map(docSnap => {
        if (docSnap.exists()) {
          return { id: docSnap.id, ...docSnap.data() } as StoreInfo;
        }
        return null;
      })
    );
  }
  
  /**
   * Checks if the store is currently open
   */
  isStoreOpen(storeId: string): Observable<boolean> {
    return this.getStoreInfo(storeId).pipe(
      map(store => {
        if (!store) {
          return false;
        }
        
        // If store has isOpen flag, use that
        if (typeof store.isOpen === 'boolean') {
          return store.isOpen;
        }
        
        // Otherwise, check business hours
        const now = new Date();
        const day = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
        
        if (!store.businessHours || !store.businessHours[day]) {
          return false;
        }
        
        const hours = store.businessHours[day];
        
        // Parse opening and closing times
        const openTime = this.parseTime(hours.open);
        const closeTime = this.parseTime(hours.close);
        
        // Get current time
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const currentTotalMinutes = currentHour * 60 + currentMinute;
        
        // Check if current time is within business hours
        return currentTotalMinutes >= openTime && currentTotalMinutes <= closeTime;
      }),
      catchError(() => of(false))
    );
  }
  
  /**
   * Helper method to parse time string (format: "HH:MM") to total minutes
   */
  private parseTime(timeString: string): number {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  }
}

export { TableInfo };
