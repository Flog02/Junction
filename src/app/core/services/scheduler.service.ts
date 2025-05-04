import { Injectable } from '@angular/core';
import { 
  Firestore, 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  updateDoc, 
  doc 
} from '@angular/fire/firestore';
import { AuthService } from './auth.service';
import { NotificationService } from './notification.service';
import { SuggestionService } from './products-suggestion.service';
import { combineLatest, from, interval, of } from 'rxjs';
import { switchMap, takeUntil, filter, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ReminderSchedulerService {
  private readonly CHECK_INTERVAL = 1000 * 60 * 60; // Check every hour
  
  constructor(
    private firestore: Firestore,
    private authService: AuthService,
    private notificationService: NotificationService,
    private suggestionService: SuggestionService
  ) {}

  /**
   * Start the reminder scheduler
   */
  startScheduler() {
    // Only run when app is in foreground
    if (typeof document !== 'undefined' && !document.hidden) {
      // Check reminders every hour
      interval(this.CHECK_INTERVAL)
        .pipe(
          switchMap(() => this.checkAndSendReminders())
        )
        .subscribe();
    }
  }

  /**
   * Check for due reminders and send notifications
   */
  private checkAndSendReminders() {
    return this.authService.user$.pipe(
      filter(user => !!user),
      switchMap(user => {
        return this.suggestionService.getTimeBasedReminders();
      }),
      switchMap(reminders => {
        const now = new Date();
        const currentDay = now.getDay();
        const currentHour = now.getHours();
        
        // Find reminders that match the current day and time
        const dueReminders = reminders.filter(reminder => {
          const typicalDay = reminder.typicalTime.split(' ')[0];
          const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
          const matchesDay = days.indexOf(typicalDay) === currentDay;
          
          // Check if we're within an hour of typical order time
          const timeStr = reminder.typicalTime.split('around ')[1];
          let typicalHour = parseInt(timeStr.split(' ')[0]);
          if (timeStr.includes('PM') && typicalHour < 12) {
            typicalHour += 12;
          }
          
          const matchesHour = Math.abs(typicalHour - currentHour) <= 1;
          
          return matchesDay && matchesHour;
        });
        
        // Send notifications for due reminders
        return this.sendReminderNotifications(dueReminders);
      })
    );
  }

  /**
   * Send notifications for reminders
   */
 // In your ReminderSchedulerService.ts

private sendReminderNotifications(reminders: {product: any, typicalTime: string}[]) {
    // Check if we have any reminders to send
    if (reminders.length === 0) {
      return of(null);
    }
    
    return this.authService.user$.pipe(
      filter(user => !!user),
      switchMap(user => {
        // Check if we've already sent reminders recently
        return this.checkRecentReminders(user!.uid).pipe(
          switchMap(alreadySent => {
            if (alreadySent) {
              return of(null);
            }
            
            // Send a notification for each reminder
            const notificationObservables = reminders.map(reminder => {
              // Create a notification object that matches your interface
              const notificationData = {
                userId: user!.uid,
                title: 'Time for your usual order?',
                message: `It's about time for your ${reminder.product.name}! Would you like to order it again?`,
                type: 'promotion' as 'order' | 'loyalty' | 'promotion' | 'system',
                targetId: reminder.product.id,
                image: reminder.product.image
                // Remove the actionUrl property to match your interface
              };
              
              return this.notificationService.createNotification(notificationData);
            });
            
            // Combine all notification observables
            return combineLatest(notificationObservables).pipe(
              switchMap(() => {
                return this.recordReminderSent(user!.uid);
              })
            );
          })
        );
      })
    );
  }

  /**
   * Check if we've sent reminders recently
   */
  private checkRecentReminders(userId: string) {
    const remindersRef = collection(this.firestore, 'reminderHistory');
    const userRemindersQuery = query(
      remindersRef,
      where('userId', '==', userId),
      where('timestamp', '>', new Date(Date.now() - 24 * 60 * 60 * 1000)) // Last 24 hours
    );
    
    return from(getDocs(userRemindersQuery)).pipe(
      map(snapshot => !snapshot.empty)
    );
  }

  /**
   * Record that we've sent a reminder
   */
  private recordReminderSent(userId: string) {
    const remindersRef = collection(this.firestore, 'reminderHistory');
    return from(addDoc(remindersRef, {
      userId,
      timestamp: new Date()
    }));
  }
}