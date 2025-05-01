
// Now let's create the Nutrition Dashboard Component
// src/app/features/nutrition/nutrition.page.ts

import { Component, OnInit, AfterViewInit, ElementRef, ViewChild, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {IonCardHeader,IonCard,IonCardContent,IonCardSubtitle,IonCardTitle,IonToolbar,IonHeader,IonButtons,IonTitle,IonContent,IonLabel,IonItem,IonInput,IonButton,IonIcon} from '@ionic/angular/standalone'
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import Chart from 'chart.js/auto';

import { NutritionService, NutritionData, UserNutrition } from '../../core/services/nutrition.service';
import { AlertController, ToastController } from '@ionic/angular/standalone';

@Component({
  selector: 'app-nutrition',
  template: `<ion-header>
  <ion-toolbar>
    <ion-title>Nutrition Dashboard</ion-title>
    <ion-buttons slot="end">
      <ion-button (click)="showNutritionInfo()">
        <ion-icon name="information-circle-outline"></ion-icon>
      </ion-button>
    </ion-buttons>
  </ion-toolbar>
</ion-header>

<ion-content class="ion-padding">
  <!-- Today's Nutrition Card -->
  <ion-card>
    <ion-card-header>
      <ion-card-title>Today's Nutrition</ion-card-title>
      <ion-card-subtitle>{{ today | date:'fullDate' }}</ion-card-subtitle>
    </ion-card-header>
    
    <ion-card-content>
      <div class="nutrition-grid">
        <div class="nutrition-item" [ngClass]="{'warning': todayData.calories > nutritionGoals.maxDailyCalories}">
          <div class="nutrition-icon">
            <ion-icon name="flame-outline"></ion-icon>
          </div>
          <div class="nutrition-value">{{ todayData.calories || 0 }}</div>
          <div class="nutrition-label">Calories</div>
          <div class="nutrition-target">Goal: {{ nutritionGoals.maxDailyCalories }}</div>
        </div>
        
        <div class="nutrition-item" [ngClass]="{'warning': todayData.sugar > nutritionGoals.maxDailySugar}">
          <div class="nutrition-icon">
            <ion-icon name="ice-cream-outline"></ion-icon>
          </div>
          <div class="nutrition-value">{{ todayData.sugar || 0 }}g</div>
          <div class="nutrition-label">Sugar</div>
          <div class="nutrition-target">Goal: {{ nutritionGoals.maxDailySugar }}g</div>
        </div>
        
        <div class="nutrition-item" [ngClass]="{'warning': todayData.caffeine > nutritionGoals.maxDailyCaffeine}">
          <div class="nutrition-icon">
            <ion-icon name="cafe-outline"></ion-icon>
          </div>
          <div class="nutrition-value">{{ todayData.caffeine || 0 }}mg</div>
          <div class="nutrition-label">Caffeine</div>
          <div class="nutrition-target">Goal: {{ nutritionGoals.maxDailyCaffeine }}mg</div>
        </div>
        
        <div class="nutrition-item">
          <div class="nutrition-icon">
            <ion-icon name="water-outline"></ion-icon>
          </div>
          <div class="nutrition-value">{{ todayData.waterIntake || 0 }}ml</div>
          <div class="nutrition-label">Water</div>
          <div class="nutrition-target">Goal: 2000ml</div>
        </div>
      </div>
    </ion-card-content>
  </ion-card>
  
  <!-- Caffeine Gauge Chart -->
  <ion-card>
    <ion-card-header>
      <ion-card-title>Caffeine Intake</ion-card-title>
    </ion-card-header>
    
    <ion-card-content>
      <div class="gauge-chart-container">
        <canvas #caffeineChart></canvas>
        <div class="gauge-center-text">
          <div class="gauge-value">{{ todayData.caffeine || 0 }}</div>
          <div class="gauge-unit">mg</div>
        </div>
      </div>
      <div class="gauge-label">
        <span>0mg</span>
        <span>{{ nutritionGoals.maxDailyCaffeine }}mg</span>
      </div>
      <div class="gauge-description">
        {{ 
          todayData.caffeine > nutritionGoals.maxDailyCaffeine 
            ? "You've exceeded your daily caffeine limit!" 
            : 'You\'ve consumed ' + (todayData.caffeine / nutritionGoals.maxDailyCaffeine * 100).toFixed(0) + '% of your daily caffeine limit.'
        }}
      </div>
    </ion-card-content>
  </ion-card>
  
  <!-- Weekly Stats Chart -->
  <ion-card>
    <ion-card-header>
      <ion-card-title>Weekly Stats</ion-card-title>
    </ion-card-header>
    
    <ion-card-content>
      <div class="chart-container">
        <canvas #weeklyChart></canvas>
      </div>
    </ion-card-content>
  </ion-card>
  
  <!-- Log Water Intake -->
  <ion-card>
    <ion-card-header>
      <ion-card-title>Log Water Intake</ion-card-title>
    </ion-card-header>
    
    <ion-card-content>
      <form [formGroup]="waterIntakeForm" (ngSubmit)="logWaterIntake()">
        <ion-item>
          <ion-label position="stacked">Amount (ml)</ion-label>
          <ion-input type="number" formControlName="amount"></ion-input>
        </ion-item>
        
        <div class="quick-amounts">
          <ion-button size="small" fill="outline" (click)="waterIntakeForm.get('amount')?.setValue(150)">
            Small (150ml)
          </ion-button>
          <ion-button size="small" fill="outline" (click)="waterIntakeForm.get('amount')?.setValue(250)">
            Medium (250ml)
          </ion-button>
          <ion-button size="small" fill="outline" (click)="waterIntakeForm.get('amount')?.setValue(500)">
            Large (500ml)
          </ion-button>
        </div>
        
        <ion-button expand="block" type="submit" [disabled]="waterIntakeForm.invalid">
          Log Water Intake
        </ion-button>
      </form>
    </ion-card-content>
  </ion-card>
  
  <!-- Nutrition Goals -->
  <ion-card>
    <ion-card-header>
      <ion-card-title>Nutrition Goals</ion-card-title>
    </ion-card-header>
    
    <ion-card-content>
      <form [formGroup]="goalsForm" (ngSubmit)="updateGoals()">
        <ion-item>
          <ion-label position="stacked">Max Daily Caffeine (mg)</ion-label>
          <ion-input type="number" formControlName="maxDailyCaffeine"></ion-input>
        </ion-item>
        
        <ion-item>
          <ion-label position="stacked">Max Daily Sugar (g)</ion-label>
          <ion-input type="number" formControlName="maxDailySugar"></ion-input>
        </ion-item>
        
        <ion-item>
          <ion-label position="stacked">Max Daily Calories</ion-label>
          <ion-input type="number" formControlName="maxDailyCalories"></ion-input>
        </ion-item>
        
        <ion-button expand="block" type="submit" [disabled]="goalsForm.invalid" class="ion-margin-top">
          Update Goals
        </ion-button>
      </form>
    </ion-card-content>
  </ion-card>
</ion-content>`,
  styles:`.nutrition-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
    padding: 8px;
  }
  
  .nutrition-item {
    background-color: var(--ion-color-light);
    padding: 16px;
    border-radius: 12px;
    text-align: center;
    position: relative;
  }
  
  .nutrition-item.warning {
    background-color: rgba(var(--ion-color-warning-rgb), 0.3);
  }
  
  .nutrition-icon {
    font-size: 24px;
    margin-bottom: 8px;
  }
  
  .nutrition-value {
    font-size: 24px;
    font-weight: bold;
  }
  
  .nutrition-label {
    font-size: 14px;
    color: var(--ion-color-medium);
  }
  
  .nutrition-target {
    font-size: 12px;
    color: var(--ion-color-medium);
    margin-top: 4px;
  }
  
  .chart-container {
    height: 300px;
    margin: 0 auto;
  }
  
  .gauge-chart-container {
    position: relative;
    width: 200px;
    height: 200px;
    margin: 0 auto;
  }
  
  .gauge-center-text {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    text-align: center;
  }
  
  .gauge-value {
    font-size: 32px;
    font-weight: bold;
  }
  
  .gauge-unit {
    font-size: 16px;
    color: var(--ion-color-medium);
  }
  
  .gauge-label {
    display: flex;
    justify-content: space-between;
    margin-top: 8px;
    font-size: 12px;
    color: var(--ion-color-medium);
  }
  
  .gauge-description {
    text-align: center;
    margin-top: 16px;
    font-size: 14px;
    color: var(--ion-color-medium);
  }
  
  .quick-amounts {
    display: flex;
    gap: 8px;
    margin: 16px 0;
  }`,
  standalone: true,
  imports: [IonCardHeader, CommonModule, IonCard, IonCardContent, IonCardSubtitle, IonCardTitle, IonToolbar, IonHeader, IonButtons, IonTitle, IonContent, IonLabel, IonItem, IonInput, IonButton, IonIcon, ReactiveFormsModule, RouterModule]
})
export class NutritionPage implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('weeklyChart') weeklyChartCanvas!: ElementRef;
  @ViewChild('caffeineChart') caffeineChartCanvas!: ElementRef;
  
  // Charts
  weeklyChart!: Chart;
  caffeineChart!: Chart;
  
  // Today's nutrition data
  todayData: NutritionData = {
    calories: 0,
    sugar: 0,
    caffeine: 0,
    fat: 0,
    protein: 0,
    waterIntake: 0
  };
  
  // Nutrition goals
  nutritionGoals: UserNutrition['nutritionGoals'] = {
    maxDailyCaffeine: 400,
    maxDailySugar: 50,
    maxDailyCalories: 2000
  };
  
  // Weekly data
  weeklyData!: { labels: string[]; datasets: any[] };
  
  // Water intake form
  waterIntakeForm: FormGroup;
  
  // Nutrition goals form
  goalsForm: FormGroup;
  
  // Today's date
  today = new Date().toISOString().split('T')[0];
  
  // Recent orders
  recentOrders = [];
  
  // For cleanup
  private destroy$ = new Subject<void>();
  
  constructor(
    private nutritionService: NutritionService,
    private formBuilder: FormBuilder,
    private alertController: AlertController,
    private toastController: ToastController
  ) {
    this.waterIntakeForm = this.formBuilder.group({
      amount: [250, [Validators.required, Validators.min(1)]]
    });
    
    this.goalsForm = this.formBuilder.group({
      maxDailyCaffeine: [400, [Validators.required, Validators.min(0)]],
      maxDailySugar: [50, [Validators.required, Validators.min(0)]],
      maxDailyCalories: [2000, [Validators.required, Validators.min(0)]]
    });
  }
  
  ngOnInit() {
    // Load today's nutrition data
    this.nutritionService.getDailyIntake(this.today)
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        if (data) {
          this.todayData = data;
        }
      });
    
    // Load nutrition goals
    this.nutritionService.getUserNutrition()
      .pipe(takeUntil(this.destroy$))
      .subscribe(userNutrition => {
        if (userNutrition && userNutrition.nutritionGoals) {
          this.nutritionGoals = userNutrition.nutritionGoals;
          
          // Update the form values
          this.goalsForm.patchValue({
            maxDailyCaffeine: this.nutritionGoals.maxDailyCaffeine,
            maxDailySugar: this.nutritionGoals.maxDailySugar,
            maxDailyCalories: this.nutritionGoals.maxDailyCalories
          });
        }
      });
    
    // Load weekly data
    this.nutritionService.getWeeklyNutrition()
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        this.weeklyData = data;
        this.updateWeeklyChart();
      });
  }
  
  ngAfterViewInit() {
    // Initialize charts
    setTimeout(() => {
      this.initializeWeeklyChart();
      this.initializeCaffeineChart();
    }, 500);
  }
  
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    
    // Destroy charts to prevent memory leaks
    if (this.weeklyChart) {
      this.weeklyChart.destroy();
    }
    
    if (this.caffeineChart) {
      this.caffeineChart.destroy();
    }
  }
  
  /**
   * Initialize the weekly nutrition chart
   */
  initializeWeeklyChart() {
    if (!this.weeklyChartCanvas) return;
    
    const ctx = this.weeklyChartCanvas.nativeElement.getContext('2d');
    
    this.weeklyChart = new Chart(ctx, {
      type: 'bar',
      data: this.weeklyData || {
        labels: [],
        datasets: []
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });
  }
  
  /**
   * Initialize the caffeine chart
   */
  initializeCaffeineChart() {
    if (!this.caffeineChartCanvas) return;
    
    const ctx = this.caffeineChartCanvas.nativeElement.getContext('2d');
    
    // Create data for the gauge chart
    const caffeinePercentage = Math.min(100, (this.todayData.caffeine / this.nutritionGoals.maxDailyCaffeine) * 100);
    
    this.caffeineChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Caffeine', 'Remaining'],
        datasets: [{
          data: [caffeinePercentage, 100 - caffeinePercentage],
          backgroundColor: [
            'rgba(255, 206, 86, 0.8)',
            'rgba(220, 220, 220, 0.3)'
          ],
          borderWidth: 0
        }]
      },
      options: {
        cutout: '80%',
        responsive: true,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            enabled: false
          }
        }
      }
    });
  }
  
  /**
   * Update the weekly chart with new data
   */
  updateWeeklyChart() {
    if (!this.weeklyChart || !this.weeklyData) return;
    
    this.weeklyChart.data = this.weeklyData;
    this.weeklyChart.update();
  }
  
  /**
   * Update the caffeine chart with new data
   */
  updateCaffeineChart() {
    if (!this.caffeineChart) return;
    
    const caffeinePercentage = Math.min(100, (this.todayData.caffeine / this.nutritionGoals.maxDailyCaffeine) * 100);
    
    this.caffeineChart.data.datasets[0].data = [caffeinePercentage, 100 - caffeinePercentage];
    this.caffeineChart.update();
  }
  
  /**
   * Log water intake
   */
  logWaterIntake() {
    if (this.waterIntakeForm.invalid) return;
    
    const amount = this.waterIntakeForm.value.amount;
    
    this.nutritionService.updateWaterIntake(amount)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          // Update local data
          this.todayData.waterIntake = (this.todayData.waterIntake || 0) + amount;
          
          this.presentToast('Water intake updated successfully!');
          
          // Reset the form to default amount
          this.waterIntakeForm.patchValue({ amount: 250 });
        },
        error: (err) => {
          this.presentToast('Failed to update water intake: ' + err.message, 'danger');
        }
      });
  }
  
  /**
   * Update nutrition goals
   */
  updateGoals() {
    if (this.goalsForm.invalid) return;
    
    const goals = this.goalsForm.value;
    
    this.nutritionService.updateNutritionGoals(goals)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          // Update local data
          this.nutritionGoals = goals;
          
          // Update charts
          this.updateCaffeineChart();
          
          this.presentToast('Nutrition goals updated successfully!');
        },
        error: (err) => {
          this.presentToast('Failed to update goals: ' + err.message, 'danger');
        }
      });
  }
  
  /**
   * Helper to present toast messages
   */
  async presentToast(message: string, color: string = 'success') {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      color,
      position: 'bottom'
    });
    
    await toast.present();
  }
  
  /**
   * Show nutrition info modal
   */
  async showNutritionInfo() {
    const alert = await this.alertController.create({
      header: 'Nutrition Information',
      message: `
        <p>Daily Recommended Values:</p>
        <ul>
          <li><strong>Caffeine:</strong> Up to 400mg for most adults</li>
          <li><strong>Sugar:</strong> Less than 50g per day</li>
          <li><strong>Water:</strong> About 2,000-3,000ml per day</li>
        </ul>
        <p>These values are general guidelines and may vary based on individual needs.</p>
      `,
      buttons: ['OK']
    });
    
    await alert.present();
  }
}