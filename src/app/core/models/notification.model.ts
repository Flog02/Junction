export interface Notification {
  id?: string;
  userId: string;
  title: string;
  message: string;
  type: 'order' | 'loyalty' | 'promotion' | 'system';
  targetId?: string; // Order ID, reward ID, etc.
  createdDate: Date;
  readDate: Date | null;
  image?: string; // Optional icon/image URL
  actionUrl?: any; // Add this line to fix the error
  deleted?: boolean; // You might already have this
}