import {
  Component,
  OnInit,
  AfterViewInit,
  ElementRef,
  ViewChild,
  OnDestroy,
} from '@angular/core';
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
  RangeCustomEvent,
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
  checkmarkCircleOutline,
} from 'ionicons/icons';

import { AuthService } from '../../core/services/auth.service';
import { LoyaltyService } from '../../core/services/loyalty.service';
import { LoadingController, ToastController } from '@ionic/angular/standalone';
declare global {
  interface WindowEventMap {
    'game-score-updated': CustomEvent<{ score: number }>;
    'game-completed': CustomEvent<{ score: number }>;
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
    IonRange,
  ],
})
export class CoffeeGamePage implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('gameContainer') gameContainer!: ElementRef;

  gameScore = 0;
  highScore = 0;
  completedGames = 0;
  lastAccuracy = 0;
  animatingResult = false;
  showingTutorial = true;

  isLoading = true;

  // Game control values
  grindLevel = 50;
  tempLevel = 85;
  milkLevel = 50;

  steamOffset = 0;
  autoServe = false;

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
      checkmarkCircleOutline,
    });
  }

  getAccuracyDisplay() {
    return `${Math.round(this.checkOrderAccuracy())}%`;
  }

  ngOnInit() {
    // Load player stats
    this.loadPlayerStats();
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.initializeGame();
    }, 1000);
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

  // Get appropriate message based on accuracy
  getResultMessage(accuracy: number): string {
    if (accuracy >= 95) return '🌟 Perfect! Amazing coffee skills!';
    if (accuracy >= 85) return '👍 Great job! Customer is happy!';
    if (accuracy >= 70) return '😊 Good effort! Decent coffee.';
    if (accuracy >= 50) return '😐 Acceptable, but needs improvement.';
    return '😬 Oops... better luck next time!';
  }

  // Draw animation based on result
  drawResultAnimation(accuracy: number) {
    if (!this.gameInstance?.ctx) return;

    const { ctx, canvas } = this.gameInstance;

    // Draw result overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw result text
    ctx.fillStyle = this.getAccuracyColor(accuracy);
    ctx.font = 'bold 30px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(
      `${Math.round(accuracy)}% Accuracy`,
      canvas.width / 2,
      canvas.height / 2 - 30
    );

    ctx.font = '24px Arial';
    ctx.fillText(
      this.getResultMessage(accuracy),
      canvas.width / 2,
      canvas.height / 2 + 20
    );

    const points = Math.round((accuracy * this.currentOrder.points) / 100);
    ctx.fillText(`+${points} points`, canvas.width / 2, canvas.height / 2 + 60);
  }

  // Get color based on accuracy
  getAccuracyColor(accuracy: number): string {
    if (accuracy >= 95) return '#4CAF50'; // Green
    if (accuracy >= 85) return '#8BC34A'; // Light green
    if (accuracy >= 70) return '#FFC107'; // Amber
    if (accuracy >= 50) return '#FF9800'; // Orange
    return '#F44336'; // Red
  }
  /**
   * Checks order accuracy percentage
   * @returns Accuracy percentage between 0-100
   */
  checkOrderAccuracy(): number {
    if (!this.currentOrder) return 0;

    // Calculate differences between player settings and target values
    const grindDiff = Math.abs(this.grindLevel - this.currentOrder.grind);
    const tempDiff = Math.abs(this.tempLevel - this.currentOrder.temp);
    const milkDiff = Math.abs(this.milkLevel - this.currentOrder.milk);

    // Calculate overall accuracy (100 - average difference)
    return 100 - (grindDiff + tempDiff + milkDiff) / 3;
  }

  /**
   * Initializes the coffee game
   */
  async initializeGame() {
    console.log('Starting game initialization');
    this.isLoading = true;

    const loading = await this.loadingController.create({
      message: 'Loading game...',
      duration: 2000,
    });

    await loading.present();

    try {
      console.log('Looking for canvas element');
      // Make sure canvas exists and set proper dimensions
      const canvas = document.getElementById(
        'coffee-game-canvas'
      ) as HTMLCanvasElement;

      console.log('Canvas found:', canvas);

      if (canvas) {
        // Set actual dimensions to match display size
        const container = this.gameContainer.nativeElement;
        canvas.width = container.clientWidth || 800;
        canvas.height = container.clientHeight || 400;
        console.log('Canvas dimensions set:', canvas.width, canvas.height);

        // Initialize game engine
        this.setupGameCanvas(canvas);

        // Start with a new order
        console.log('Generating new order');
        this.generateNewOrder();

        console.log('Current order:', this.currentOrder);
      } else {
        console.error('Canvas element not found');
      }
    } catch (err) {
      console.error('Error initializing game:', err);
    } finally {
      // Hide loading after a minimum time to prevent flashing
      setTimeout(() => {
        console.log('Setting isLoading to false');
        this.isLoading = false;
      }, 1000);
    }

    // Listen for game events
    window.addEventListener(
      'game-score-updated',
      this.handleScoreUpdate.bind(this)
    );
    window.addEventListener(
      'game-completed',
      this.handleGameCompleted.bind(this)
    );
  }

  /**
   * Sets up the game canvas with a basic game
   */
  setupGameCanvas(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('Could not get canvas context');
      return;
    }

    console.log('Canvas setup successful', {
      width: canvas.width,
      height: canvas.height,
    });

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
      animationFrameId: 0,
    };

    // Start game loop
    this.startGameLoop();
  }

  /**
   * Draws the coffee shop background
   */
  drawCoffeeShopBackground(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
  ) {
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

    // Text for current order
    ctx.fillStyle = '#ffffff';
    ctx.font = '24px Arial';
    ctx.textAlign = 'center';
    if (this.currentOrder) {
      ctx.fillText(`Current Order: ${this.currentOrder.name}`, width / 2, 50);
    } else {
      ctx.fillText('Welcome to Barista Challenge!', width / 2, 50);
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
    ctx.fillStyle = `rgb(${139 - this.grindLevel}, ${
      69 - this.grindLevel / 2
    }, ${19})`;
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
    if (!this.gameInstance) {
      console.error('Game instance not initialized');
      return;
    }

    console.log('Starting game loop');

    const tick = (time: number) => {
      if (!this.gameInstance) return;

      // Calculate delta time
      const deltaTime = time - (this.gameInstance.lastFrameTime || time);
      this.gameInstance.lastFrameTime = time;

      try {
        // Clear canvas
        this.gameInstance.ctx.clearRect(
          0,
          0,
          this.gameInstance.canvas.width,
          this.gameInstance.canvas.height
        );

        // Update game state
        this.updateGame(deltaTime);

        // Draw game
        this.drawGame();
      } catch (err) {
        console.error('Error in game loop:', err);
      }

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
    // Update game animation based on current controls
    if (this.currentOrder) {
      // Animate steam based on temperature
      // Animate coffee color based on grind
      // Animate milk froth based on milk level

      // Example: Add some simple animation to make the game feel alive
      const time = Date.now() / 1000;
      this.steamOffset = Math.sin(time * 2) * 5;

      // Check for auto-completion of orders (optional)
      if (this.autoServe && this.checkOrderAccuracy() > 90) {
        this.serveDrink();
      }
    }
  }

  /**
   * Draws the game
   */
  /**
   * Draws the game on the canvas
   */
  drawGame() {
    if (!this.gameInstance || !this.gameInstance.ctx) return;

    const { ctx, canvas } = this.gameInstance;

    // Draw background
    ctx.fillStyle = '#f5f0e8';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw coffee machine
    this.drawCoffeeMachine(ctx, canvas);

    // Draw current order
    if (this.currentOrder) {
      this.drawOrder(ctx);
    } else {
      // Draw instruction
      ctx.fillStyle = '#5d4037';
      ctx.font = '24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Select an order to begin', canvas.width / 2, 50);
    }

    // Draw debug info
    // ctx.fillStyle = '#333';
    // ctx.font = '16px Arial';
    // ctx.textAlign = 'left';
    // ctx.fillText(`Grind: ${this.grindLevel}`, 20, canvas.height - 60);
    // ctx.fillText(`Temp: ${this.tempLevel}°C`, 20, canvas.height - 40);
    // ctx.fillText(`Milk: ${this.milkLevel}%`, 20, canvas.height - 20);
  }

  /**
   * Draws the coffee machine
   */
  drawCoffeeMachine(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
    // Simple machine body
    ctx.fillStyle = '#795548';
    ctx.fillRect(canvas.width / 2 - 100, 100, 200, 200);

    // Machine top
    ctx.fillStyle = '#8D6E63';
    ctx.fillRect(canvas.width / 2 - 120, 80, 240, 30);

    // Coffee portafilter
    ctx.fillStyle = '#5D4037';
    ctx.beginPath();
    ctx.ellipse(canvas.width / 2, 180, 40, 20, 0, 0, Math.PI * 2);
    ctx.fill();

    // Coffee cup
    ctx.fillStyle = '#ECEFF1';
    ctx.beginPath();
    ctx.ellipse(canvas.width / 2, 280, 30, 15, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(canvas.width / 2, 300, 30, 15, 0, 0, Math.PI);
    ctx.fill();
  }

  /**
   * Draws the current order information
   */
  drawOrder(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = '#5D4037';
    ctx.font = '20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(
      `Order: ${this.currentOrder.name}`,
      this.gameInstance.canvas.width / 2,
      40
    );
  }
  /**
   * Awards loyalty points to the current user
   * @param points Number of points to award
   */
  async awardLoyaltyPoints(points: number) {
    if (points <= 0) return;

    try {
      const userId = await this.getCurrentUserId();
      if (userId) {
        this.loyaltyService
          .addPoints(userId, points, 'Coffee Game')
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              this.presentToast(`You earned ${points} loyalty points!`);
            },
            error: (err) => {
              console.error('Failed to award loyalty points:', err);
            },
          });
      } else {
        console.log('No user logged in, loyalty points not awarded');
      }
    } catch (err) {
      console.error('Error awarding loyalty points:', err);
    }
  }
  /**
   * Generates a new coffee order
   */
  generateNewOrder() {
    console.log('Generating new order...');

    // Define orders inline to ensure they exist
    const orders = [
      { name: 'Espresso', grind: 90, temp: 92, milk: 0, points: 50 },
      { name: 'Cappuccino', grind: 70, temp: 90, milk: 70, points: 60 },
      { name: 'Latte', grind: 65, temp: 85, milk: 85, points: 55 },
      { name: 'Americano', grind: 75, temp: 95, milk: 10, points: 45 },
      { name: 'Flat White', grind: 68, temp: 88, milk: 60, points: 65 },
    ];

    const randomIndex = Math.floor(Math.random() * orders.length);
    this.currentOrder = { ...orders[randomIndex] };
    console.log('New order generated:', this.currentOrder);
  }

  /**
   * Handles order serving
   */
  serveDrink() {
    if (!this.currentOrder || this.animatingResult) return;

    this.animatingResult = true;
    const accuracy = this.checkOrderAccuracy();
    this.lastAccuracy = accuracy;

    // Ensure currentOrder has a points property with default value
    const orderPoints = this.currentOrder.points || 50; // Default to 50 points if undefined

    // Calculate points based on accuracy (with safeguards against NaN)
    const points = Math.round((accuracy * orderPoints) / 100) || 0;
    this.gameScore += points;

    // Update high score if needed
    if (this.gameScore > this.highScore) {
      this.highScore = this.gameScore;
      // Save to localStorage
      localStorage.setItem('coffeeGameHighScore', this.highScore.toString());
    }

    // Show result
    const message = this.getResultMessage(accuracy);
    this.presentToast(message);

    // Add animation to show result
    this.drawResultAnimation(accuracy);

    // After delay, generate new order
    setTimeout(() => {
      this.completedGames++;
      this.animatingResult = false;
      this.generateNewOrder();

      // Award loyalty points if accuracy was good
      if (accuracy > 80) {
        this.awardLoyaltyPoints(Math.round(accuracy / 10));
      }
    }, 2000);
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
          this.loyaltyService
            .addPoints(userId, pointsToAward, undefined)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: () => {
                this.presentToast(
                  `You earned ${pointsToAward} loyalty points!`
                );
              },
              error: () => {
                console.error('Failed to award loyalty points');
              },
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
          },
        },
      ],
    });

    await toast.present();
  }

  /**
   * Saves player stats to local storage
   */
  savePlayerStats() {
    localStorage.setItem(
      'coffeeGameStats',
      JSON.stringify({
        highScore: this.highScore,
        completedGames: this.completedGames,
      })
    );
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
      position: 'top',
    });

    await toast.present();
  }

  /**
   * Resets the game
   */
  resetGame() {
    // Reset game score
    this.gameScore = 0;

    // Generate new order
    this.generateNewOrder();

    // Reset controls
    this.grindLevel = 50;
    this.tempLevel = 85;
    this.milkLevel = 50;

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
