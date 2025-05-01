// src/app/core/models/gift-card.model.ts

// src/app/core/models/gift-card.model.ts

export interface GiftCard {
    // Core Identity Properties
    id?: string;                   // Optional as Firestore generates this
    code: string;                  // Unique redemption code
    
    // Sender Information
    senderId: string;              // User ID of the sender
    senderName?: string;           // Display name of the sender (optional)
    
    // Recipient Information
    recipientEmail: string;        // Email of the recipient
    recipientName: string;         // Name of the recipient
    
    // Financial Information
    amount: number;                // Current balance
    initialAmount: number;         // Original gift card amount
    
    // Date Information
    createdDate: Date;             // When the gift card was created
    expiryDate: Date | null;       // When the gift card expires (nullable)
    redeemedDate: Date | null;     // When the gift card was redeemed
    
    // Status Information
    redeemedBy: string | null;     // User ID of who redeemed the card
    status: 'active' | 'redeemed' | 'expired'; // Current status
    
    // Customization Information
    message: string;               // Personal message
    occasion: string;              // Occasion (birthday, thank you, etc.)
    design: string;                // Design template ID
    
    // Additional Properties
    orderIds: string[];            // Orders this card was used for
    imageUrl?: string;             // Optional custom image URL
  }
  
  export interface GiftCardTemplate {
    id: string;
    name: string;
    imageUrl: string;
    category: string;
    occasions: string[];
  }