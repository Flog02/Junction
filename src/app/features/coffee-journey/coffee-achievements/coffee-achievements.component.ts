
// src/app/features/coffee-journey/coffee-achievements/coffee-achievements.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { RouterModule } from '@angular/router';
import { 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonContent, 
  IonButtons, 
  IonBackButton,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonSpinner,
  IonIcon,
  IonBadge
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  trophyOutline, 
  lockClosedOutline, 
  medalOutline, 
  starOutline, 
  ribbonOutline 
} from 'ionicons/icons';

import { CoffeeJourney } from 'src/app/core/models/coffe-journey.model';
import { AuthService } from '../../../core/services/auth.service';

interface Achievement {
  id: string;
  name: string;
  description: string;
  iconURL: string;
  pointsAwarded: number;
  unlocked: boolean;
  unlockedDate?: Date;
}

@Component({
  selector: 'app-coffee-achievements',
  templateUrl: './coffee-achievements.component.html',
  styleUrls: ['./coffee-achievements.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonBackButton,
    IonCard,
    IonCardContent,
    IonSpinner,
    IonIcon
]
})
export class CoffeeAchievementsComponent implements OnInit, OnDestroy {
  achievements: Achievement[] = [
    {
      id: 'first-order',
      name: 'First Order',
      description: 'Placed your first order at Digital Café',
      iconURL: '/assets/achievements/first-order.png',
      pointsAwarded: 10,
      unlocked: false
    },
    {
      id: 'coffee-explorer',
      name: 'Coffee Explorer',
      description: 'Tried 5 different coffee drinks',
      iconURL: '/assets/achievements/coffee-explorer.png',
      pointsAwarded: 25,
      unlocked: false
    },
    {
      id: 'early-bird',
      name: 'Early Bird',
      description: 'Ordered coffee before 7 AM',
      iconURL: '/assets/achievements/early-bird.png',
      pointsAwarded: 15,
      unlocked: false
    },
    {
      id: 'loyal-customer',
      name: 'Loyal Customer',
      description: 'Placed orders on 10 different days',
      iconURL: '/assets/achievements/loyal-customer.png',
      pointsAwarded: 50,
      unlocked: false
    },
    {
      id: 'customization-king',
      name: 'Customization King',
      description: 'Created a drink with at least 5 customizations',
      iconURL: '/assets/achievements/customization-king.png',
      pointsAwarded: 20,
      unlocked: false
    },
    {
      id: 'origin-master',
      name: 'Origin Master',
      description: 'Learned about all coffee origins',
      iconURL: '/assets/achievements/origin-master.png',
      pointsAwarded: 30,
      unlocked: false
    },
    {
      id: 'social-butterfly',
      name: 'Social Butterfly',
      description: 'Shared the app with a friend',
      iconURL: '/assets/achievements/social-butterfly.png',
      pointsAwarded: 15,
      unlocked: false
    },
    {
      id: 'perfect-barista',
      name: 'Perfect Barista',
      description: 'Got 100% accuracy in the Coffee Game',
      iconURL: '/assets/achievements/perfect-barista.png',
      pointsAwarded: 40,
      unlocked: false
    }
  ];
  
  userJourney: CoffeeJourney | null = null;
  isLoading = true;
  
  private destroy$ = new Subject<void>();
  
  constructor(private authService: AuthService) {
    addIcons({
      trophyOutline, 
      lockClosedOutline, 
      medalOutline, 
      starOutline,
      ribbonOutline
    });
  }
  
  ngOnInit() {
    // In a real app, we would load the user's journey from a service
    // For now, we'll simulate it with some random unlocked achievements
    setTimeout(() => {
      // Simulate some unlocked achievements
      const unlockedIds = ['first-order', 'early-bird', 'social-butterfly'];
      
      this.achievements = this.achievements.map(achievement => ({
        ...achievement,
        unlocked: unlockedIds.includes(achievement.id),
        unlockedDate: unlockedIds.includes(achievement.id) ? new Date() : undefined
      }));
      
      this.isLoading = false;
    }, 1000);
  }
  
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  getTotalPoints(): number {
    return this.achievements
      .filter(a => a.unlocked)
      .reduce((sum, a) => sum + a.pointsAwarded, 0);
  }
  
  getUnlockedCount(): number {
    return this.achievements.filter(a => a.unlocked).length;
  }
  
  getProgressPercentage(): number {
    return (this.getUnlockedCount() / this.achievements.length) * 100;
  }
}