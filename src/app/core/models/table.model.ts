// src/app/core/models/table.model.ts

export interface TableInfo {
    storeId: string;
    tableNumber: number;
    seats: number;
    status: 'available' | 'occupied' | 'reserved';
    qrCodeUrl: string;
  }
  
  export interface StoreInfo {
    id: string;
    name: string;
    address: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
    };
    location: {
      latitude: number;
      longitude: number;
    };
    contactInfo: {
      phoneNumber: string;
      email: string;
    };
    businessHours: {
      [day: string]: { open: string; close: string };
    };
    features: string[];
    currentWaitTime: number;
    isOpen: boolean;
    tableCount: number;
    qrCodes: {
      [tableNumber: number]: string;
    };
  }