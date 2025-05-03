// src/app/core/models/notification.model.ts

/**
 * Notification model
 */
export interface Notification {
  /**
   * Unique identifier
   */
  id?: string;
  
  /**
   * User ID that this notification belongs to
   */
  userId: string;
  
  /**
   * Notification title
   */
  title: string;
  
  /**
   * Notification message
   */
  message: string;
  
  /**
   * Type of notification
   * - order: Related to an order's status
   * - loyalty: Related to loyalty points and rewards
   * - promotion: Marketing promotions
   * - system: System notifications
   */
  type: 'order' | 'loyalty' | 'promotion' | 'system';
  
  /**
   * Optional ID reference to related entity (order ID, reward ID, etc.)
   */
  targetId?: string;
  
  /**
   * Timestamp when notification was created
   */
  createdDate: Date;
  
  /**
   * Timestamp when notification was read by user (null if unread)
   */
  readDate: Date | null;
  
  /**
   * Optional icon or image URL for the notification
   */
  image?: string;
  
  /**
   * Optional flag to indicate if notification has been deleted
   */
  deleted?: boolean;
  
  /**
   * Optional action URL or route to navigate to when notification is clicked
   */
  actionUrl?: string;
  
  /**
   * Optional data payload for the notification
   */
  data?: any;
}