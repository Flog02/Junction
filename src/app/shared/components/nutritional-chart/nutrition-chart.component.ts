// src/app/shared/components/nutritional-chart/nutritional-chart.component.ts

import { Component, OnInit, AfterViewInit, Input, ElementRef, ViewChild, OnChanges, SimpleChanges, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import Chart from 'chart.js/auto';
import{IonSpinner,IonIcon}from '@ionic/angular/standalone'

@Component({
  selector: 'app-nutritional-chart',
  standalone: true,
  imports: [CommonModule,IonSpinner,IonIcon],
  template: `
    <div class="chart-container" [style.height]="height">
      <canvas #chartCanvas></canvas>
      <div *ngIf="isLoading" class="loading-overlay">
        <ion-spinner></ion-spinner>
      </div>
      <div *ngIf="noData" class="no-data-overlay">
        <ion-icon name="analytics-outline"></ion-icon>
        <p>No data available</p>
      </div>
    </div>
    <style>
      .chart-container {
        position: relative;
        width: 100%;
      }
      
      .loading-overlay,
      .no-data-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        background-color: rgba(255, 255, 255, 0.8);
      }
      
      .no-data-overlay ion-icon {
        font-size: 32px;
        color: var(--ion-color-medium);
        margin-bottom: 8px;
      }
      
      .no-data-overlay p {
        color: var(--ion-color-medium);
        margin: 0;
      }
    </style>
  `,
})
export class NutritionalChartComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('chartCanvas') chartCanvas!: ElementRef;
  
  @Input() chartType: 'bar' | 'line' | 'doughnut' | 'radar' = 'bar';
  @Input() data: any;
  @Input() options: any = {};
  @Input() height: string = '300px';
  @Input() isLoading: boolean = false;
  
  chart!: Chart;
  noData: boolean = false;
  
  constructor() {}
  
  ngOnInit() {
    this.checkForNoData();
  }
  
  ngAfterViewInit() {
    if (!this.isLoading && !this.noData) {
      this.createChart();
    }
  }
  
  ngOnChanges(changes: SimpleChanges) {
    if (changes['data'] && !changes['data'].firstChange) {
      this.checkForNoData();
      this.updateChart();
    }
    
    if (changes['isLoading'] && !changes['isLoading'].firstChange) {
      if (!this.isLoading && !this.noData && !this.chart) {
        setTimeout(() => this.createChart(), 0);
      }
    }
  }
  
  ngOnDestroy() {
    if (this.chart) {
      this.chart.destroy();
    }
  }
  
  private checkForNoData() {
    // Check if data is empty
    if (!this.data) {
      this.noData = true;
      return;
    }
    
    if (this.data.datasets && this.data.datasets.length === 0) {
      this.noData = true;
      return;
    }
    
    if (this.data.datasets && this.data.datasets.length > 0) {
      const hasData = this.data.datasets.some((dataset:any) => 
        dataset.data && dataset.data.length > 0 && dataset.data.some((value:any) => value !== 0)
      );
      this.noData = !hasData;
      return;
    }
    
    this.noData = false;
  }
  
  private createChart() {
    if (!this.chartCanvas || this.noData) return;
    
    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    
    // Set default options based on chart type
    const defaultOptions = this.getDefaultOptions();
    
    // Merge default options with user options
    const chartOptions = {
      ...defaultOptions,
      ...this.options
    };
    
    this.chart = new Chart(ctx, {
      type: this.chartType,
      data: this.data,
      options: chartOptions
    });
  }
  
  private updateChart() {
    if (!this.chart) {
      if (!this.isLoading && !this.noData) {
        setTimeout(() => this.createChart(), 0);
      }
      return;
    }
    
    this.chart.data = this.data;
    this.chart.update();
  }
  
  private getDefaultOptions() {
    const baseOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top' as const,
        },
        tooltip: {
          mode: 'index' as const,
          intersect: false,
        },
      },
    };
    
    switch (this.chartType) {
      case 'bar':
        return {
          ...baseOptions,
          scales: {
            y: {
              beginAtZero: true
            }
          }
        };
      case 'line':
        return {
          ...baseOptions,
          scales: {
            y: {
              beginAtZero: true
            }
          },
          elements: {
            line: {
              tension: 0.4
            }
          }
        };
      case 'doughnut':
        return {
          ...baseOptions,
          cutout: '70%'
        };
      case 'radar':
        return {
          ...baseOptions,
          elements: {
            line: {
              tension: 0.4
            }
          }
        };
      default:
        return baseOptions;
    }
  }
}