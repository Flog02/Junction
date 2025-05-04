export interface TableInfo {
  storeId: string;
  tableNumber: number;
  seats: number;
  status: 'available' | 'occupied' | 'reserved';
  qrCodeUrl: string;
  section?: string;
  lastUpdated?: Date;
  orderInProgress?: boolean;
  storeName?: string; // Added for convenience when returning from QR scan
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
  sections?: string[]; // Optional sections for organizing tables
  defaultSeats?: number; // Default number of seats per table
}

/**
 * QR Code Generation Settings
 */
export interface QRCodeSettings {
  size: number;
  margin: number;
  errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H';
  dark: string;
  light: string;
}

/**
 * QR Code Scan Result
 */
export interface QRScanResult {
  format: string;
  text: string;
  timestamp: Date;
}