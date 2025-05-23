import { Component, OnInit, AfterViewInit, ElementRef, ViewChild, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonContent, 
  IonButtons, 
  IonBackButton,
  IonButton,
  IonIcon,
  IonSpinner
} from '@ionic/angular/standalone';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { addIcons } from 'ionicons';
import { 
  cameraOutline, 
  cubeOutline, 
  cartOutline, 
  closeOutline,
  cafeOutline,
  cashOutline,
  flameOutline, arrowForward } from 'ionicons/icons';

import { ProductService } from '../../core/services/product.service';

@Component({
  selector: 'app-ar-experience',
  templateUrl: './ar-experience.page.html',
  styleUrls: ['./ar-experience.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    IonHeader, 
    IonToolbar, 
    IonTitle, 
    IonContent, 
    IonButtons, 
    IonBackButton,
    IonButton,
    IonIcon,
    IonSpinner
  ]
})
export class ArExperiencePage implements OnInit, AfterViewInit, OnDestroy {
  isLoading = true;
  showInstructions = true;
  cameraPermissionGranted = false;
  isScanning = false;
  coffeeInfoVisible = false;
  
  // Video stream elements
  @ViewChild('videoElement', { static: false }) videoElement: ElementRef | undefined;
  videoStream: MediaStream | null = null;
  
  // Coffee Options
  coffeeOptions = [
    { id: 'espresso', name: 'Espresso', thumbnail: 'assets/products/espresso.jpg' },
    { id: 'latte', name: 'Latte', thumbnail: 'assets/products/latte.jpg' },
    { id: 'cappuccino', name: 'Cappuccino', thumbnail: 'assets/products/cappuccino.jpg' },
    { id: 'mocha', name: 'Mocha', thumbnail: 'assets/products/mocha.jpg' },
    // { id: 'americano', name: 'Americano', thumbnail: 'assets/products/americano.jpg' }
  ];
  
  // Customization options
  cupSizes = [
    { id: 'small', name: 'Small' },
    { id: 'medium', name: 'Medium' },
    { id: 'large', name: 'Large' }
  ];
  
  cupColors = [
    { id: 'white', value: '#ffffff' },
    { id: 'black', value: '#333333' },
    { id: 'blue', value: '#4285f4' },
    { id: 'red', value: '#ea4335' },
    { id: 'green', value: '#34a853' },
    { id: 'yellow', value: '#fbbc05' }
  ];
  
  // Selected options
  selectedCoffee = 'latte';
  selectedSize = 'medium';
  selectedColor = 'white';
  
  // AR Canvas
  private arCanvas: HTMLCanvasElement | null = null;
  private arContext: WebGLRenderingContext | null = null;
  private arSession: any = null;
  
  private destroy$ = new Subject<void>();
  
  constructor(
    private productService: ProductService
  ) {
    addIcons({arrowForward,cameraOutline,cubeOutline,cartOutline,closeOutline,flameOutline,cafeOutline,cashOutline});
  }
  
  ngOnInit() {
    // Check for camera permissions
    this.checkCameraPermission();
  }
  
  ngAfterViewInit() {
    // Initialize AR canvas
    this.arCanvas = document.getElementById('ar-canvas') as HTMLCanvasElement;
    if (this.arCanvas) {
      this.initializeAR();
    }
  }
  
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    
    // Stop video stream
    this.stopVideoStream();
    
    // Clean up AR session
    if (this.arSession) {
      this.arSession.end();
    }
  }
  
  /**
   * Stop the video stream
   */
  stopVideoStream() {
    if (this.videoStream) {
      this.videoStream.getTracks().forEach(track => track.stop());
      this.videoStream = null;
    }
  }
  
  /**
   * Check if camera permission is granted
   */
  async checkCameraPermission() {
    try {
      const result = await navigator.permissions.query({ name: 'camera' as PermissionName });
      this.cameraPermissionGranted = result.state === 'granted';
      
      // If already granted, hide loading after a delay
      if (this.cameraPermissionGranted) {
        setTimeout(() => {
          this.isLoading = false;
          // If permission is already granted, start the camera
          if (!this.showInstructions) {
            this.startCamera();
          }
        }, 1500);
      } else {
        this.isLoading = false;
      }
    } catch (error) {
      console.error('Error checking camera permission:', error);
      this.isLoading = false;
    }
  }
  
  /**
   * Request camera permission
   */
  async requestCameraPermission() {
    try {
      // Request camera access and keep the stream
      this.videoStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment', // Prefer back camera
          width: { ideal: 1280 },
          height: { ideal: 720 } 
        } 
      });
      
      // Update permission state
      this.cameraPermissionGranted = true;
      
      // Initialize AR session with the video stream
      this.initializeAR();
      
      // Connect the video stream to the video element in the DOM
      this.startCamera();
    } catch (error) {
      console.error('Error requesting camera permission:', error);
    }
  }
  
  /**
   * Start camera feed
   */
  async startCamera() {
    if (!this.videoElement || this.cameraPermissionGranted === false) return;
    
    try {
      // If we don't have a stream yet, get one
      if (!this.videoStream) {
        this.videoStream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: 'environment', // Prefer back camera
            width: { ideal: 1280 },
            height: { ideal: 720 } 
          } 
        });
      }
      
      // Connect stream to video element
      const videoEl = this.videoElement.nativeElement as HTMLVideoElement;
      videoEl.srcObject = this.videoStream;
      videoEl.play();
      
      // Start scanning when the video is playing
      videoEl.onplaying = () => {
        if (!this.showInstructions) {
          this.startScanning();
        }
      };
    } catch (error) {
      console.error('Error starting camera:', error);
    }
  }
  
  /**
   * Initialize AR session
   */
  async initializeAR() {
    if (!this.arCanvas) return;
    
    // Simulate AR initialization
    this.isLoading = true;
    
    // Simulate loading time
    setTimeout(() => {
      this.isLoading = false;
      
      // Start camera and surface scanning when ready
      if (this.cameraPermissionGranted && !this.showInstructions) {
        this.startCamera();
      }
    }, 2000);
    
    // In a real implementation, we would initialize WebXR or AR.js here
    // For now, we'll simulate the AR experience with canvas
    this.arContext = this.arCanvas.getContext('webgl') || null;
    
    // Set up listener to window resize to adjust canvas
    window.addEventListener('resize', this.resizeCanvas.bind(this));
    this.resizeCanvas();
  }
  
  /**
   * Resize canvas to match viewport
   */
  resizeCanvas() {
    if (!this.arCanvas) return;
    
    const displayWidth = this.arCanvas.clientWidth;
    const displayHeight = this.arCanvas.clientHeight;
    
    if (this.arCanvas.width !== displayWidth || this.arCanvas.height !== displayHeight) {
      this.arCanvas.width = displayWidth;
      this.arCanvas.height = displayHeight;
      
      if (this.arContext) {
        this.arContext.viewport(0, 0, displayWidth, displayHeight);
      }
    }
  }
  
  /**
   * Hide instructions and start AR experience
   */
  hideInstructions() {
    this.showInstructions = false;
    
    if (this.cameraPermissionGranted) {
      this.startCamera();
    } else {
      this.requestCameraPermission();
    }
  }
  
  /**
   * Start scanning for surfaces
   */
  startScanning() {
    this.isScanning = true;
    
    // Simulate finding a surface after a delay
    setTimeout(() => {
      this.isScanning = false;
    }, 3000);
  }
  
  /**
   * Select a coffee option
   */
  selectCoffee(coffeeId: string) {
    this.selectedCoffee = coffeeId;
  }
  
  /**
   * Select cup size
   */
  selectSize(sizeId: string) {
    this.selectedSize = sizeId;
  }
  
  /**
   * Select cup color
   */
  selectColor(colorId: string) {
    this.selectedColor = colorId;
  }
  
  /**
   * Place coffee in AR
   */
  placeCoffee() {
    // Simulate placing coffee in AR view
    console.log('Placing coffee:', this.selectedCoffee, this.selectedSize, this.selectedColor);
    
    // Show coffee info panel
    this.coffeeInfoVisible = true;
  }
  
  /**
   * Hide coffee info panel
   */
  hideCoffeeInfo() {
    this.coffeeInfoVisible = false;
  }
  
  /**
   * Add selected coffee to cart
   */
  addToCart() {
    // Get the selected coffee details
    const coffeeDetails = {
      type: this.getSelectedCoffeeName(),
      size: this.selectedSize,
      color: this.selectedColor,
      price: this.getSelectedCoffeePrice()
    };
    
    // Add to cart through the product service
    this.productService.addToCart(coffeeDetails).subscribe(
      (response) => {
        console.log('Added to cart successfully:', response);
        // Show success message or navigate to cart
        alert('Coffee added to cart successfully!');
        this.hideCoffeeInfo();
      },
      (error) => {
        console.error('Error adding to cart:', error);
        // Show error message
        alert('Failed to add to cart. Please try again.');
      }
    );
  }
  
  /**
   * Get selected coffee name
   */
  getSelectedCoffeeName(): string {
    const coffee = this.coffeeOptions.find(c => c.id === this.selectedCoffee);
    return coffee ? coffee.name : '';
  }
  
  /**
   * Get selected coffee image
   */
  getSelectedCoffeeImage(): string {
    // First try to find the coffee in our options to get the exact thumbnail path
    const coffee = this.coffeeOptions.find(c => c.id === this.selectedCoffee);
    if (coffee && coffee.thumbnail) {
      return coffee.thumbnail;
    }
    // Fallback to constructed path
    return `assets/products/${this.selectedCoffee}.jpg`;
  }
  
  /**
   * Get coffee description
   */
  getSelectedCoffeeDescription(): string {
    const descriptions: {[key: string]: string} = {
      'espresso': 'A concentrated form of coffee served in small, strong shots. Bold and intense flavor with a rich crema on top.',
      'latte': 'Espresso with steamed milk and a light layer of foam. Smooth and creamy with a balanced coffee flavor.',
      'cappuccino': 'Equal parts espresso, steamed milk, and milk foam. A perfect balance of rich espresso and creamy texture.',
      'mocha': 'Espresso with chocolate syrup, steamed milk, and whipped cream. A sweet and indulgent coffee experience.',
      'americano': 'Espresso diluted with hot water. Similar strength to drip coffee but with the distinct flavor of espresso.'
    };
    
    return descriptions[this.selectedCoffee] || '';
  }
  
  /**
   * Get coffee calories
   */
  getSelectedCoffeeCalories(): number {
    const baseCalories: {[key: string]: number} = {
      'espresso': 5,
      'latte': 120,
      'cappuccino': 80,
      'mocha': 230,
      'americano': 15
    };
    
    // Adjust for size
    const sizeMultipliers: {[key: string]: number} = {
      'small': 0.8,
      'medium': 1,
      'large': 1.3
    };
    
    const baseCalorie = baseCalories[this.selectedCoffee] || 0;
    const multiplier = sizeMultipliers[this.selectedSize] || 1;
    
    return Math.round(baseCalorie * multiplier);
  }
  
  /**
   * Get coffee caffeine content
   */
  getSelectedCoffeeCaffeine(): number {
    const baseCaffeine: {[key: string]: number} = {
      'espresso': 64,
      'latte': 64,
      'cappuccino': 64,
      'mocha': 70,
      'americano': 77
    };
    
    // Adjust for size
    const sizeMultipliers: {[key: string]: number} = {
      'small': 1,
      'medium': 1.5,
      'large': 2
    };
    
    const baseCaffeineAmount = baseCaffeine[this.selectedCoffee] || 0;
    const multiplier = sizeMultipliers[this.selectedSize] || 1;
    
    return Math.round(baseCaffeineAmount * multiplier);
  }
  
  /**
   * Get coffee price
   */
  getSelectedCoffeePrice(): number {
    const basePrices: {[key: string]: number} = {
      'espresso': 2.50,
      'latte': 3.75,
      'cappuccino': 3.95,
      'mocha': 4.25,
      'americano': 2.95
    };
    
    // Adjust for size
    const sizeMultipliers: {[key: string]: number} = {
      'small': 0.85,
      'medium': 1,
      'large': 1.25
    };
    
    const basePrice = basePrices[this.selectedCoffee] || 0;
    const multiplier = sizeMultipliers[this.selectedSize] || 1;
    
    return parseFloat((basePrice * multiplier).toFixed(2));
  }
}