import { Component, OnInit, AfterViewInit, ElementRef, ViewChild, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonContent, 
  IonButtons, 
  IonBackButton,
  IonButton,
  IonIcon,
  IonSpinner,
  IonRange,
  RangeCustomEvent
} from '@ionic/angular/standalone';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { addIcons } from 'ionicons';
import { 
  refreshOutline, 
  cafeOutline, 
  cafe, 
  thermometerOutline, 
  thermometer, 
  waterOutline, 
  water,
  checkmarkCircleOutline
} from 'ionicons/icons';

import { AuthService } from '../../core/services/auth.service';
import { LoyaltyService } from '../../core/services/loyalty.service';
import { LoadingController, ToastController } from '@ionic/angular/standalone';
declare global {
  interface WindowEventMap {
    'game-score-updated': CustomEvent<{score: number}>;
    'game-completed': CustomEvent<{score: number}>;
    'reset-coffee-game': CustomEvent<any>;
  }
}
@Component({
  selector: 'app-coffee-game',
  templateUrl: './coffee-game.page.html',
  styleUrls: ['./coffee-game.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader, 
    IonToolbar, 
    IonTitle, 
    IonContent, 
    IonButtons, 
    IonBackButton,
    IonButton,
    IonIcon,
    IonSpinner,
    IonRange
  ]
})

export class CoffeeGamePage implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('gameContainer') gameContainer!: ElementRef;
  
  isLoading = true;
  gameScore = 0;
  highScore = 0;
  completedGames = 0;
  
  // Game control values
  grindLevel = 50;
  tempLevel = 85;
  milkLevel = 50;
  
  // Current game state
  currentOrder: any = null;
  
  private destroy$ = new Subject<void>();
  private gameInstance: any = null;
  
  constructor(
    private authService: AuthService,
    private loyaltyService: LoyaltyService,
    private router: Router,
    private loadingController: LoadingController,
    private toastController: ToastController
  ) {
    addIcons({
      refreshOutline, 
      cafeOutline, 
      cafe, 
      thermometerOutline, 
      thermometer, 
      waterOutline, 
      water,
      checkmarkCircleOutline
    });
  }
  
  ngOnInit() {
    // Load player stats
    this.loadPlayerStats();
    
    // Generate initial order - Added this to ensure we have an order from the start
    this.createInitialOrder();
    
    console.log('Initial order created:', this.currentOrder);
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
   * Creates an initial order before game initialization
   */
  createInitialOrder() {
    const orders = [
      { name: 'Espresso', grind: 90, temp: 92, milk: 0 },
      { name: 'Cappuccino', grind: 70, temp: 90, milk: 70 },
      { name: 'Latte', grind: 65, temp: 85, milk: 85 },
      { name: 'Americano', grind: 75, temp: 95, milk: 10 },
      { name: 'Flat White', grind: 68, temp: 88, milk: 60 }
    ];
    
    // Set a default order
    this.currentOrder = orders[0]; // Always start with Espresso for debugging
    console.log('Initial order created directly:', this.currentOrder);
    
    // Store in localStorage as backup
    localStorage.setItem('currentCoffeeOrder', JSON.stringify(this.currentOrder));
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
    
    try {
      // Force order creation if not exist
      if (!this.currentOrder) {
        console.log('No order found in initializeGame, creating one');
        this.createInitialOrder();
      }
      
      console.log('Current order before canvas setup:', this.currentOrder);
      
      // Initialize game canvas
      const canvas = document.getElementById('coffee-game-canvas') as HTMLCanvasElement;
      if (canvas) {
        // Initialize game engine
        this.setupGameCanvas(canvas);
        
        console.log('After canvas setup, current order:', this.currentOrder);
        
        // Ensure we have an order and announce it
        setTimeout(() => {
          if (this.currentOrder) {
            // Display the order in a more prominent way
            this.presentOrderToast(this.currentOrder.name);
          } else {
            console.log('Still no order after delay, generating new one');
            this.generateNewOrder();
          }
          
          // Force update the game display
          this.drawGame();
        }, 1000);
      }
    } catch (err) {
      console.error('Error initializing game:', err);
    } finally {
      // Hide loading after a minimum time to prevent flashing
      setTimeout(() => {
        this.isLoading = false;
      }, 1000);
    }
    
    // Listen for game events
    window.addEventListener('game-score-updated', this.handleScoreUpdate.bind(this));
    window.addEventListener('game-completed', this.handleGameCompleted.bind(this));
  }
  
  /**
   * Sets up the game canvas with a basic game
   */
  setupGameCanvas(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set up the game background
    ctx.fillStyle = '#f8f3e9';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw coffee shop environment
    this.drawCoffeeShopBackground(ctx, canvas.width, canvas.height);
    
    // Store game instance for future reference
    this.gameInstance = {
      canvas,
      ctx,
      lastFrameTime: 0,
      animationFrameId: 0
    };
    
    // Start game loop
    this.startGameLoop();
  }
  
  /**
   * Draws the coffee shop background
   */
  drawCoffeeShopBackground(ctx: CanvasRenderingContext2D, width: number, height: number) {
    // Counter background
    ctx.fillStyle = '#8d6e63';
    ctx.fillRect(0, height - 150, width, 150);
    
    // Counter top
    ctx.fillStyle = '#d7ccc8';
    ctx.fillRect(0, height - 150, width, 20);
    
    // Coffee machine
    ctx.fillStyle = '#5d4037';
    ctx.fillRect(width / 2 - 100, height - 300, 200, 150);
    
    // Machine details
    ctx.fillStyle = '#3e2723';
    ctx.fillRect(width / 2 - 80, height - 280, 160, 80);
    
    // Steam wand
    ctx.fillStyle = '#9e9e9e';
    ctx.beginPath();
    ctx.moveTo(width / 2 + 80, height - 240);
    ctx.lineTo(width / 2 + 120, height - 180);
    ctx.lineTo(width / 2 + 110, height - 180);
    ctx.lineTo(width / 2 + 70, height - 240);
    ctx.closePath();
    ctx.fill();
    
    // Draw coffee cup
    this.drawCoffeeCup(ctx, width / 2, height - 120);
    
    // DEBUGGING - log if we have an order when drawing
    console.log('Drawing background with order:', this.currentOrder);
    
    // Text for current order
    ctx.fillStyle = '#ffffff';
    ctx.font = '24px Arial';
    ctx.textAlign = 'center';
    if (this.currentOrder) {
      // Draw order with prominent background
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(width / 2 - 200, 30, 400, 70);
      
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 24px Arial';
      ctx.fillText(`Current Order: ${this.currentOrder.name}`, width / 2, 60);
      
      // Display targets for current order
      ctx.font = '18px Arial';
      ctx.fillText(`Target: Grind ${this.currentOrder.grind}, Temp ${this.currentOrder.temp}°C, Milk ${this.currentOrder.milk}%`, width / 2, 90);
    } else {
      // No order - display warning
      ctx.fillStyle = 'rgba(255, 0, 0, 0.7)';
      ctx.fillRect(width / 2 - 200, 30, 400, 40);
      
      ctx.fillStyle = '#ffffff';
      ctx.fillText('No order available - please reset game', width / 2, 60);
    }
  }
  
  /**
   * Draws a coffee cup
   */
  drawCoffeeCup(ctx: CanvasRenderingContext2D, x: number, y: number) {
    // Cup
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(x, y, 40, 20, 0, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.beginPath();
    ctx.ellipse(x, y - 60, 40, 20, 0, Math.PI, Math.PI * 2);
    ctx.fill();
    
    ctx.fillRect(x - 40, y - 60, 80, 60);
    
    // Handle
    ctx.beginPath();
    ctx.ellipse(x + 50, y - 30, 10, 20, 0, -Math.PI / 2, Math.PI / 2);
    ctx.fill();
    
    // Coffee liquid - level based on preparation
    const fillHeight = 50 * (this.milkLevel / 100);
    ctx.fillStyle = `rgb(${139 - this.grindLevel}, ${69 - this.grindLevel / 2}, ${19})`;
    ctx.beginPath();
    ctx.ellipse(x, y - 55 + fillHeight, 35, 18, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Steam - varies with temperature
    if (this.tempLevel > 80) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      for (let i = 0; i < 3; i++) {
        const steamIntensity = (this.tempLevel - 80) / 20;
        const offset = Math.sin(Date.now() / 200 + i) * 5;
        ctx.beginPath();
        ctx.moveTo(x - 10 + i * 10, y - 60);
        ctx.quadraticCurveTo(
          x - 20 + i * 10 + offset, 
          y - 90 - 10 * steamIntensity, 
          x - 15 + i * 10, 
          y - 110 - 20 * steamIntensity
        );
        ctx.quadraticCurveTo(
          x - 10 + i * 10, 
          y - 100 - 10 * steamIntensity, 
          x - 10 + i * 10, 
          y - 60
        );
        ctx.fill();
      }
    }
  }
  
  /**
   * Starts the game loop
   */
  startGameLoop() {
    if (!this.gameInstance) return;
    
    const tick = (time: number) => {
      // Calculate delta time
      const deltaTime = time - (this.gameInstance.lastFrameTime || 0);
      this.gameInstance.lastFrameTime = time;
      
      // Clear canvas
      this.gameInstance.ctx.clearRect(0, 0, this.gameInstance.canvas.width, this.gameInstance.canvas.height);
      
      // Update game state
      this.updateGame(deltaTime);
      
      // Draw game
      this.drawGame();
      
      // Schedule next frame
      this.gameInstance.animationFrameId = requestAnimationFrame(tick);
    };
    
    // Start animation loop
    this.gameInstance.animationFrameId = requestAnimationFrame(tick);
  }
  
  /**
   * Updates game state
   */
  updateGame(deltaTime: number) {
    // Update game logic here
    // Make sure we always have an order
    if (!this.currentOrder) {
      this.generateNewOrder();
    }
  }
  
  /**
   * Draws the game
   */
  drawGame() {
    if (!this.gameInstance) {
      console.warn('Attempted to draw game but no game instance exists');
      return;
    }
    
    // Check if we have an order, if not try to recover from localStorage
    if (!this.currentOrder) {
      console.warn('No current order when drawing game, attempting recovery');
      const savedOrder = localStorage.getItem('currentCoffeeOrder');
      if (savedOrder) {
        this.currentOrder = JSON.parse(savedOrder);
        console.log('Recovered order from localStorage:', this.currentOrder);
      } else {
        console.error('Could not recover order, creating new one');
        this.createInitialOrder();
      }
    }
    
    const { ctx, canvas } = this.gameInstance;
    
    // Draw background
    this.drawCoffeeShopBackground(ctx, canvas.width, canvas.height);
  }
  
  /**
   * Generates a new coffee order
   */
  generateNewOrder() {
    const orders = [
      { name: 'Espresso', grind: 90, temp: 92, milk: 0 },
      { name: 'Cappuccino', grind: 70, temp: 90, milk: 70 },
      { name: 'Latte', grind: 65, temp: 85, milk: 85 },
      { name: 'Americano', grind: 75, temp: 95, milk: 10 },
      { name: 'Flat White', grind: 68, temp: 88, milk: 60 }
    ];
    
    // Get random order but ensure it's different from current order
    let newOrder;
    do {
      newOrder = orders[Math.floor(Math.random() * orders.length)];
    } while (this.currentOrder && newOrder.name === this.currentOrder.name);
    
    console.log('Generating new order:', newOrder);
    
    this.currentOrder = newOrder;
    
    // Store in localStorage as backup
    localStorage.setItem('currentCoffeeOrder', JSON.stringify(this.currentOrder));
    
    // Show toast with new order
    this.presentOrderToast(this.currentOrder.name);
    
    // Force a redraw
    if (this.gameInstance) {
      this.drawGame();
    } else {
      console.warn('No game instance available for redraw');
    }
  }
  
  /**
   * Handles order serving
   */
  serveDrink() {
    if (!this.currentOrder) {
      this.presentToast('No current order to serve!');
      return;
    }
    
    // Calculate score based on how close the player got to the target values
    const grindDiff = Math.abs(this.grindLevel - this.currentOrder.grind);
    const tempDiff = Math.abs(this.tempLevel - this.currentOrder.temp);
    const milkDiff = Math.abs(this.milkLevel - this.currentOrder.milk);
    
    // Score formula - higher is better
    const accuracy = 100 - ((grindDiff + tempDiff + milkDiff) / 3);
    const points = Math.floor(accuracy * 10);
    
    // Update score
    this.gameScore += points;
    
    // Show result
    if (accuracy > 90) {
      this.presentToast(`Perfect ${this.currentOrder.name}! +${points} points`);
    } else if (accuracy > 70) {
      this.presentToast(`Good ${this.currentOrder.name}. +${points} points`);
    } else if (accuracy > 50) {
      this.presentToast(`Acceptable ${this.currentOrder.name}. +${points} points`);
    } else {
      this.presentToast(`The customer looks disappointed... +${points} points`);
    }
    
    // Generate new order
    this.generateNewOrder();
    
    // Update high score if needed
    if (this.gameScore > this.highScore) {
      this.highScore = this.gameScore;
      this.savePlayerStats();
    }
  }
  
  /**
   * Handles input changes
   */
  onGrindChange(event: Event) {
    // Update game state
    const value = (event as RangeCustomEvent).detail.value as number;
    this.grindLevel = value;
  }
  
  onTempChange(event: Event) {
    const value = (event as RangeCustomEvent).detail.value as number;
    this.tempLevel = value;
  }
  
  onMilkChange(event: Event) {
    const value = (event as RangeCustomEvent).detail.value as number;
    this.milkLevel = value;
  }
  
  /**
   * Handles score updates from the game
   */
  handleScoreUpdate(event: CustomEvent) {
    this.gameScore = event.detail.score;
  }
  
  /**
   * Handles game completion
   */
  async handleGameCompleted(event: CustomEvent) {
    const finalScore = event.detail.score;
    
    // Update high score if needed
    if (finalScore > this.highScore) {
      this.highScore = finalScore;
    }
    
    // Increment completed games
    this.completedGames++;
    
    // Save stats
    this.savePlayerStats();
    
    // Award loyalty points based on score
    const pointsToAward = Math.floor(finalScore / 10);
    
    if (pointsToAward > 0) {
      try {
        const userId = await this.getCurrentUserId();
        if (userId) {
          this.loyaltyService.addPoints(userId, pointsToAward, undefined)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: () => {
                this.presentToast(`You earned ${pointsToAward} loyalty points!`);
              },
              error: () => {
                console.error('Failed to award loyalty points');
              }
            });
        }
      } catch (err) {
        console.error('Error awarding points:', err);
      }
    }
    
    // Show game results
    const toast = await this.toastController.create({
      message: `Game Over! Final Score: ${finalScore}`,
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
   * Saves player stats to local storage
   */
  savePlayerStats() {
    localStorage.setItem('coffeeGameStats', JSON.stringify({
      highScore: this.highScore,
      completedGames: this.completedGames
    }));
  }
  
  /**
   * Gets the current user ID
   */
  async getCurrentUserId(): Promise<string | null> {
    try {
      const user = await this.authService.getCurrentUser();
      return user?.uid || null;
    } catch (err) {
      console.error('Error getting current user:', err);
      return null;
    }
  }
  
  /**
   * Presents a toast message
   */
  async presentToast(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      position: 'top'
    });
    
    await toast.present();
  }
  
  /**
   * Presents a more prominent toast for orders
   */
  async presentOrderToast(orderName: string) {
    const toast = await this.toastController.create({
      message: `<strong>New Order: ${orderName}</strong>`,
      duration: 3000,
      position: 'middle',
      color: 'primary',
      buttons: [
        {
          text: 'OK',
          role: 'cancel'
        }
      ]
    });
    
    await toast.present();
    console.log('Order toast presented for:', orderName);
  }
  
  /**
   * Resets the game
   */
  resetGame() {
    console.log('Resetting game');
    
    // Reset game score
    this.gameScore = 0;
    
    // Reset controls
    this.grindLevel = 50;
    this.tempLevel = 85;
    this.milkLevel = 50;
    
    // Force creation of a new order
    this.currentOrder = null;
    localStorage.removeItem('currentCoffeeOrder');
    this.createInitialOrder();
    
    // Generate new order
    setTimeout(() => {
      this.generateNewOrder();
      
      // Force a redraw after reset
      if (this.gameInstance) {
        this.drawGame();
      }
    }, 300);
    
    // Trigger game reset through window event
    window.dispatchEvent(new CustomEvent('reset-coffee-game'));
    
    // Show toast
    this.presentToast('Game Reset!');
  }
  
  /**
   * Cleans up game resources
   */
  cleanupGame() {
    // Cancel animation frame
    if (this.gameInstance && this.gameInstance.animationFrameId) {
      cancelAnimationFrame(this.gameInstance.animationFrameId);
    }
    
    // Remove event listeners
    window.removeEventListener('game-score-updated', this.handleScoreUpdate);
    window.removeEventListener('game-completed', this.handleGameCompleted);
  }
}