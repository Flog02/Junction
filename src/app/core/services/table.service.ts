import { Injectable } from '@angular/core';
import { 
  Firestore, 
  doc, 
  getDoc, 
  collection,
  query,
  where,
  getDocs
} from '@angular/fire/firestore';
import { Observable, from, of, throwError } from 'rxjs';
import { map, switchMap, catchError } from 'rxjs/operators';
import { Platform } from '@ionic/angular';
import { TableInfo, StoreInfo } from '../models/table.model';

@Injectable({
  providedIn: 'root'
})
export class TableService {
  // Mock stores for testing
  private mockStores: StoreInfo[] = [
    {
      id: 'cafe-downtown',
      name: 'Downtown Cafe',
      tableCount: 20,
      isOpen: true,
      address: {
        street: '123 Main Street',
        city: 'Downtown',
        state: 'CA',
        zipCode: '90001',
        country: 'USA'
      },
      location: {
        latitude: 34.0522,
        longitude: -118.2437
      },
      contactInfo: {
        phoneNumber: '(213) 555-1234',
        email: 'info@downtowncafe.com'
      },
      businessHours: {
        monday: { open: '08:00', close: '20:00' },
        tuesday: { open: '08:00', close: '20:00' },
        wednesday: { open: '08:00', close: '20:00' },
        thursday: { open: '08:00', close: '20:00' },
        friday: { open: '08:00', close: '22:00' },
        saturday: { open: '09:00', close: '22:00' },
        sunday: { open: '10:00', close: '18:00' }
      },
      features: ['Wi-Fi', 'Outdoor Seating', 'Wheelchair Accessible'],
      currentWaitTime: 15,
      qrCodes: {}
    },
    {
      id: 'cafe-uptown',
      name: 'Uptown Bistro',
      tableCount: 15,
      isOpen: true,
      address: {
        street: '456 Park Avenue',
        city: 'Uptown',
        state: 'CA',
        zipCode: '90002',
        country: 'USA'
      },
      location: {
        latitude: 34.0624,
        longitude: -118.3008
      },
      contactInfo: {
        phoneNumber: '(213) 555-5678',
        email: 'info@uptownbistro.com'
      },
      businessHours: {
        monday: { open: '09:00', close: '21:00' },
        tuesday: { open: '09:00', close: '21:00' },
        wednesday: { open: '09:00', close: '21:00' },
        thursday: { open: '09:00', close: '21:00' },
        friday: { open: '09:00', close: '23:00' },
        saturday: { open: '10:00', close: '23:00' },
        sunday: { open: '10:00', close: '19:00' }
      },
      features: ['Live Music', 'Craft Cocktails', 'Vegan Options'],
      currentWaitTime: 25,
      qrCodes: {}
    },
    {
      id: 'cafe-beachside',
      name: 'Beachside Coffee',
      tableCount: 10,
      isOpen: true,
      address: {
        street: '789 Ocean Drive',
        city: 'Beachside',
        state: 'CA',
        zipCode: '90003',
        country: 'USA'
      },
      location: {
        latitude: 33.9850,
        longitude: -118.4695
      },
      contactInfo: {
        phoneNumber: '(310) 555-9012',
        email: 'info@beachsidecoffee.com'
      },
      businessHours: {
        monday: { open: '07:00', close: '19:00' },
        tuesday: { open: '07:00', close: '19:00' },
        wednesday: { open: '07:00', close: '19:00' },
        thursday: { open: '07:00', close: '19:00' },
        friday: { open: '07:00', close: '20:00' },
        saturday: { open: '08:00', close: '20:00' },
        sunday: { open: '08:00', close: '18:00' }
      },
      features: ['Ocean View', 'Specialty Coffee', 'Breakfast All Day'],
      currentWaitTime: 10,
      qrCodes: {}
    }
  ];
  
  // Flag to use mock data instead of Firestore
  private useMockData = true;
  
  constructor(
    private firestore: Firestore,
    private platform: Platform
  ) {}
  
  /**
   * Gets table information from a QR code
   * QR code format: cafe-app://table/storeId/tableNumber
   * Also supports URL format: https://your-domain.com/table/storeId/tableNumber
   */
  getTableInfoFromQRCode(qrCodeData: string): Observable<TableInfo> {
    try {
      // Handle different QR code formats
      let storeId: string;
      let tableNumber: number;
      
      // Format 1: Custom URI scheme (cafe-app://table/storeId/tableNumber)
      const uriRegex = /cafe-app:\/\/table\/([^\/]+)\/(\d+)/;
      let match = qrCodeData.match(uriRegex);
      
      if (match) {
        storeId = match[1];
        tableNumber = parseInt(match[2], 10);
      } else {
        // Format 2: URL format (https://domain.com/table/storeId/tableNumber)
        const urlRegex = /\/table\/([^\/]+)\/(\d+)/;
        match = qrCodeData.match(urlRegex);
        
        if (match) {
          storeId = match[1];
          tableNumber = parseInt(match[2], 10);
        } else {
          return throwError(() => new Error('Invalid QR code format'));
        }
      }
      
      if (isNaN(tableNumber) || tableNumber <= 0) {
        return throwError(() => new Error('Invalid table number'));
      }
      
      console.log(`Parsed QR code: Store ID = ${storeId}, Table Number = ${tableNumber}`);
      
      // Get store information
      return this.getStoreInfo(storeId).pipe(
        switchMap(store => {
          if (!store) {
            return throwError(() => new Error('Store not found'));
          }
          
          if (tableNumber > store.tableCount) {
            return throwError(() => new Error('Table number not valid for this store'));
          }
          
          // Check if store is open
          return this.isStoreOpen(storeId).pipe(
            map(isOpen => {
              // Create table info
              const tableInfo: TableInfo = {
                storeId,
                tableNumber,
                seats: 4, // Default value
                status: isOpen ? 'available' : 'reserved', // Default based on store status
                qrCodeUrl: store.qrCodes?.[tableNumber] || ''
              };
              
              return tableInfo;
            })
          );
        }),
        catchError(error => {
          console.error('Error processing QR code:', error);
          return throwError(() => error);
        })
      );
    } catch (error) {
      console.error('Exception processing QR code:', error);
      return throwError(() => new Error('Failed to process QR code'));
    }
  }
  
  /**
   * Gets store information - either from mock data or Firestore
   */
  getStoreInfo(storeId: string): Observable<StoreInfo | null> {
    if (this.useMockData) {
      // Use mock data
      const store = this.mockStores.find(s => s.id === storeId);
      return store ? of(store) : of(null);
    } else {
      // Use Firestore
      const storeRef = doc(this.firestore, `stores/${storeId}`);
      
      return from(getDoc(storeRef)).pipe(
        map(docSnap => {
          if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() } as StoreInfo;
          }
          return null;
        }),
        catchError(error => {
          console.error(`Error fetching store ${storeId}:`, error);
          return throwError(() => new Error('Failed to fetch store information'));
        })
      );
    }
  }
  
  /**
   * Gets all available stores - either from mock data or Firestore
   */
  getStores(): Observable<StoreInfo[]> {
    if (this.useMockData) {
      // Return mock stores
      return of(this.mockStores);
    } else {
      // Use Firestore
      const storesRef = collection(this.firestore, 'stores');
      
      return from(getDocs(storesRef)).pipe(
        map(querySnapshot => {
          const stores: StoreInfo[] = [];
          querySnapshot.forEach(doc => {
            stores.push({ id: doc.id, ...doc.data() } as StoreInfo);
          });
          return stores;
        }),
        catchError(error => {
          console.error('Error fetching stores:', error);
          return throwError(() => new Error('Failed to fetch stores'));
        })
      );
    }
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
  
  /**
   * Generates a QR code URL for a table
   * This is used for generating QR codes that work across platforms
   */
  generateTableQRData(storeId: string, tableNumber: number): string {
    // For mobile apps, use the custom URI scheme
    if (this.platform.is('cordova') || this.platform.is('capacitor')) {
      return `cafe-app://table/${storeId}/${tableNumber}`;
    } else {
      // For web, use a URL that will work in browsers
      const domain = window.location.origin;
      return `${domain}/table/${storeId}/${tableNumber}`;
    }
  }
  
  /**
   * Validates a QR code to ensure it can be properly processed
   */
  validateQRCode(qrData: string): Observable<boolean> {
    return this.getTableInfoFromQRCode(qrData).pipe(
      map(tableInfo => !!tableInfo),
      catchError(() => of(false))
    );
  }
  
  /**
   * Toggle between mock data and Firestore
   */
  setUseMockData(useMock: boolean): void {
    this.useMockData = useMock;
  }
}

export { TableInfo };
