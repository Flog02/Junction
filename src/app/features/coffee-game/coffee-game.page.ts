// src/app/features/coffee-game/coffee-game.page.ts

import { Component, OnInit, AfterViewInit, ElementRef, ViewChild, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonSpinner,IonButton,IonIcon,IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton } from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { AuthService } from '../../core/services/auth.service';
import { LoyaltyService } from '../../core/services/loyalty.service';
import { LoadingController, ToastController } from '@ionic/angular/standalone';

interface GameScoreEvent extends Event {
  detail: {
    score: number;
  };
}

interface GameCompletedEvent extends Event {
  detail: {
    score: number;
    level: number;
  };
}

@Component({
  selector: 'app-coffee-game',
  templateUrl: './coffee-game.page.html',
  styleUrls: ['./coffee-game.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonBackButton,
    IonSpinner,IonButton,IonIcon,
  ]
})
export class CoffeeGamePage implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('gameContainer') gameContainer!: ElementRef;
  
  isLoading = true;
  gameScore = 0;
  highScore = 0;
  completedGames = 0;
  
  private destroy$ = new Subject<void>();
  
  // Bound event handlers to ensure they can be properly removed
  private boundScoreUpdateHandler: (event: Event) => void;
  private boundGameCompletedHandler: (event: Event) => void;
  
  constructor(
    private authService: AuthService,
    private loyaltyService: LoyaltyService,
    private router: Router,
    private loadingController: LoadingController,
    private toastController: ToastController
  ) {
    // Initialize bound handlers
    this.boundScoreUpdateHandler = this.handleScoreUpdate.bind(this);
    this.boundGameCompletedHandler = this.handleGameCompleted.bind(this);
  }
  
  ngOnInit() {
    // Load player stats
    this.loadPlayerStats();
  }
  
  ngAfterViewInit() {
    // Initialize the game
    setTimeout(() => {
      this.initializeGame();
    }, 500);
  }
  
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    
    // Cleanup game
    this.cleanupGame();
  }
  
  /**
   * Loads player stats from local storage
   */
  loadPlayerStats() {
    // Load player statistics from local storage
    const savedStats = localStorage.getItem('coffeeGameStats');
    if (savedStats) {
      const stats = JSON.parse(savedStats);
      this.highScore = stats.highScore || 0;
      this.completedGames = stats.completedGames || 0;
    }
  }
  
  /**
   * Initializes the coffee game
   */
  async initializeGame() {
    const loading = await this.loadingController.create({
      message: 'Loading game...',
      duration: 2000
    });
    
    await loading.present();
    
    // Use the React-based CoffeeGame component
    // Note: In an actual implementation, this would use a more elegant
    // integration approach like a custom element or Angular component
    
    // Simplified integration for example purposes
    this.isLoading = false;
    
    // Listen for game events
    window.addEventListener('game-score-updated', this.boundScoreUpdateHandler);
    window.addEventListener('game-completed', this.boundGameCompletedHandler);
  }
  
  /**
   * Handles score updates from the game
   */
  handleScoreUpdate(event: Event) {
    const customEvent = event as GameScoreEvent;
    this.gameScore = customEvent.detail.score;
  }
  
  /**
   * Handles game completion
   */
  async handleGameCompleted(event: Event) {
    const customEvent = event as GameCompletedEvent;
    const finalScore = customEvent.detail.score;
    const level = customEvent.detail.level;
    
    // Update high score if needed
    if (finalScore > this.highScore) {
      this.highScore = finalScore;
    }
    
    // Increment completed games
    this.completedGames++;
    
    // Save stats to local storage
    localStorage.setItem('coffeeGameStats', JSON.stringify({
      highScore: this.highScore,
      completedGames: this.completedGames
    }));
    
    // Award loyalty points based on score
    const pointsToAward = Math.floor(finalScore / 10);
    
    if (pointsToAward > 0) {
      const userId = await this.getCurrentUserId();
      
      this.loyaltyService.addPoints(
        userId,
        pointsToAward,
        undefined  // Changed from null to undefined
      )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.presentToast(`You earned ${pointsToAward} loyalty points!`);
        },
        error: () => {
          // Silently fail - don't ruin the game experience
          console.error('Failed to award loyalty points');
        }
      });
    }
    
    // Show game results
    const toast = await this.toastController.create({
      message: `Game Over! Final Score: ${finalScore}, Level: ${level}`,
      duration: 3000,
      position: 'middle',
      buttons: [
        {
          text: 'Play Again',
          role: 'cancel',
          handler: () => {
            this.resetGame();
          }
        }
      ]
    });
    
    await toast.present();
  }
  
  /**
   * Gets the current user ID
   */
  async getCurrentUserId(): Promise<string> {
    const user = await this.authService.getCurrentUser();
    return user?.uid || '';
  }
  
  /**
   * Presents a toast message
   */
  async presentToast(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      position: 'bottom'
    });
    
    await toast.present();
  }
  
  /**
   * Resets the game
   */
  resetGame() {
    // Trigger game reset through window event
    window.dispatchEvent(new CustomEvent('reset-coffee-game'));
  }
  
  /**
   * Cleans up game resources
   */
  cleanupGame() {
    // Remove event listeners - using the bound handlers ensures proper cleanup
    window.removeEventListener('game-score-updated', this.boundScoreUpdateHandler);
    window.removeEventListener('game-completed', this.boundGameCompletedHandler);
  }
}