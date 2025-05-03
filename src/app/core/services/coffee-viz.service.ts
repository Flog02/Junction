// src/app/core/services/coffee-viz.service.ts

import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { OrderItem } from '../models/order.model';

@Injectable({
  providedIn: 'root'
})
export class CoffeeVizService {
  private renderer: THREE.WebGLRenderer | null = null;
  private camera: THREE.PerspectiveCamera | null = null;
  private controls: OrbitControls | null = null;
  private animationFrameId: number | null = null;

  constructor() {}

  /**
   * Creates a 3D visualization of a coffee drink based on the order item
   * @param containerId The ID of the HTML element to render the visualization in
   * @param orderItem The order item containing coffee details
   * @returns An observable that emits the THREE.Scene when ready
   */
  createCoffeeVisualization(containerId: string, orderItem: OrderItem): Observable<THREE.Scene> {
    const container = document.getElementById(containerId);
    if (!container) {
      return new Observable(observer => {
        observer.error(new Error(`Container with ID ${containerId} not found`));
      });
    }

    try {
      // Initialize scene
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0xf5f5f5);

      // Create camera
      this.camera = this.createCamera();
      
      // Create renderer
      this.renderer = this.createRenderer(container);
      
      // Add orbit controls
      this.controls = this.createControls();
      
      // Add lighting
      this.addLighting(scene);
      
      // Create coffee model based on order item
      this.createCoffeeModel(scene, orderItem);
      
      // Start animation loop
      this.startAnimationLoop(scene);
      
      return of(scene);
    } catch (error) {
      return new Observable(observer => {
        observer.error(error);
      });
    }
  }

  /**
   * Cleans up the scene and stops animation
   * @param scene The THREE.Scene to clean up
   */
  cleanupScene(scene: THREE.Scene): void {
    // Stop animation loop
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    
    // Dispose of orbit controls
    if (this.controls) {
      this.controls.dispose();
      this.controls = null;
    }
    
    // Dispose of renderer
    if (this.renderer) {
      this.renderer.dispose();
      this.renderer = null;
    }
    
    // Dispose of all objects in the scene
    this.disposeScene(scene);
  }

  /**
   * Creates a camera for the scene
   * @returns A THREE.PerspectiveCamera
   */
  private createCamera(): THREE.PerspectiveCamera {
    const camera = new THREE.PerspectiveCamera(
      75, // Field of view
      window.innerWidth / window.innerHeight, // Aspect ratio
      0.1, // Near clipping plane
      1000 // Far clipping plane
    );
    
    camera.position.set(0, 5, 10);
    return camera;
  }

  /**
   * Creates a renderer for the scene
   * @param container The HTML element to render in
   * @returns A THREE.WebGLRenderer
   */
  private createRenderer(container: HTMLElement): THREE.WebGLRenderer {
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    
    // Clear the container and add the renderer
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    container.appendChild(renderer.domElement);
    
    // Handle window resize
    window.addEventListener('resize', () => {
      if (this.camera && this.renderer) {
        this.camera.aspect = container.clientWidth / container.clientHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(container.clientWidth, container.clientHeight);
      }
    });
    
    return renderer;
  }

  /**
   * Creates orbit controls for the camera
   * @returns OrbitControls
   */
  private createControls(): OrbitControls {
    if (!this.camera || !this.renderer) {
      throw new Error('Camera and renderer must be initialized before creating controls');
    }
    
    const controls = new OrbitControls(this.camera, this.renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 5;
    controls.maxDistance = 20;
    controls.maxPolarAngle = Math.PI / 2;
    
    return controls;
  }

  /**
   * Adds lighting to the scene
   * @param scene The THREE.Scene to add lighting to
   */
  private addLighting(scene: THREE.Scene): void {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    
    // Directional light (sunlight)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);
    
    // Add spotlight from above
    const spotLight = new THREE.SpotLight(0xffffff, 0.5);
    spotLight.position.set(0, 10, 0);
    spotLight.angle = Math.PI / 6;
    spotLight.penumbra = 0.2;
    spotLight.decay = 2;
    spotLight.distance = 50;
    spotLight.castShadow = true;
    scene.add(spotLight);
  }

  /**
   * Creates a 3D model of a coffee based on the order item
   * @param scene The THREE.Scene to add the model to
   * @param orderItem The order item containing coffee details
   */
  private createCoffeeModel(scene: THREE.Scene, orderItem: OrderItem): void {
    // Create a cup
    const cupGeometry = new THREE.CylinderGeometry(2, 1.7, 4, 32);
    const cupMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff });
    const cup = new THREE.Mesh(cupGeometry, cupMaterial);
    scene.add(cup);
    
    // Create coffee liquid
    const liquidGeometry = new THREE.CylinderGeometry(1.9, 1.6, 3.5, 32);
    
    // Determine coffee color based on type and customizations
    let coffeeColor = 0x6F4E37; // Default brown color
    
    if (orderItem.name.toLowerCase().includes('latte')) {
      coffeeColor = 0xC4A484; // Lighter color for latte
    } else if (orderItem.name.toLowerCase().includes('espresso')) {
      coffeeColor = 0x3D2314; // Dark color for espresso
    }
    
    // Adjust color based on milk type
    if (orderItem.customizations.milk) {
      if (orderItem.customizations.milk.id === 'oat') {
        coffeeColor = 0xD2B48C; // Slightly beige for oat milk
      } else if (orderItem.customizations.milk.id === 'almond') {
        coffeeColor = 0xDEB887; // Light beige for almond milk
      }
    }
    
    const liquidMaterial = new THREE.MeshPhongMaterial({ 
      color: coffeeColor,
      transparent: true,
      opacity: 0.9,
      shininess: 30
    });
    
    const liquid = new THREE.Mesh(liquidGeometry, liquidMaterial);
    liquid.position.y = -0.2; // Position slightly below top of cup
    scene.add(liquid);
    
    // Add toppings if any
    if (orderItem.customizations.toppings && orderItem.customizations.toppings.length > 0) {
      // Check for whipped cream
      const hasWhippedCream = orderItem.customizations.toppings.some(
        topping => topping.id === 'whipped-cream'
      );
      
      if (hasWhippedCream) {
        const creamGeometry = new THREE.SphereGeometry(1.9, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
        const creamMaterial = new THREE.MeshPhongMaterial({ 
          color: 0xFFFFF0,
          shininess: 100
        });
        const cream = new THREE.Mesh(creamGeometry, creamMaterial);
        cream.rotation.x = Math.PI; // Flip the half-sphere
        cream.position.y = 1.8; // Position on top of the liquid
        scene.add(cream);
        
        // Add caramel drizzle if mentioned in special instructions
        if (orderItem.specialInstructions && 
            orderItem.specialInstructions.toLowerCase().includes('caramel')) {
          // Create caramel drizzle pattern
          const drizzleGeometry = new THREE.TorusGeometry(1, 0.05, 16, 100, Math.PI);
          const drizzleMaterial = new THREE.MeshPhongMaterial({ color: 0xC65102 });
          
          for (let i = 0; i < 3; i++) {
            const drizzle = new THREE.Mesh(drizzleGeometry, drizzleMaterial);
            drizzle.position.y = 1.9;
            drizzle.rotation.x = Math.PI / 2;
            drizzle.rotation.z = i * Math.PI / 3;
            scene.add(drizzle);
          }
        }
      }
    }
    
    // Add sugar level visualization if specified
    if (orderItem.sugarLevel !== undefined) {
      // Add sugar crystals based on sugar level (1-5)
      const sugarLevel = Math.min(Math.max(orderItem.sugarLevel, 0), 5);
      
      if (sugarLevel > 0) {
        // Create a group to hold all sugar crystals
        const sugarGroup = new THREE.Group();
        
        // Number of sugar crystals based on sugar level
        const numCrystals = sugarLevel * 5;
        
        for (let i = 0; i < numCrystals; i++) {
          // Create a small cube for each sugar crystal
          const crystalGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
          const crystalMaterial = new THREE.MeshPhongMaterial({ color: 0xFFFFFF });
          const crystal = new THREE.Mesh(crystalGeometry, crystalMaterial);
          
          // Randomly position crystals on top of the liquid or cream
          const angle = Math.random() * Math.PI * 2;
          const radius = Math.random() * 1.5;
          const x = Math.cos(angle) * radius;
          const z = Math.sin(angle) * radius;
          
          // If there's whipped cream, place crystals on top of it
          const hasWhippedCream = orderItem.customizations.toppings?.some(
            topping => topping.id === 'whipped-cream'
          );
          
          const y = hasWhippedCream ? 2.0 : 1.6;
          
          crystal.position.set(x, y, z);
          
          // Add a slight random rotation to each crystal
          crystal.rotation.set(
            Math.random() * Math.PI,
            Math.random() * Math.PI,
            Math.random() * Math.PI
          );
          
          sugarGroup.add(crystal);
        }
        
        scene.add(sugarGroup);
      }
    }
    
    // Add shots visualization if specified
    if (orderItem.customizations.shots && orderItem.customizations.shots.length > 0) {
      // Create a darker layer at the bottom for espresso shots
      const shotGeometry = new THREE.CylinderGeometry(1.55, 1.5, 0.4, 32);
      const shotMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x3D2314,
        transparent: false,
        shininess: 10
      });
      
      const shotLayer = new THREE.Mesh(shotGeometry, shotMaterial);
      shotLayer.position.y = -1.7; // Position at the bottom of the cup
      scene.add(shotLayer);
    }
    
    // Add a saucer underneath the cup
    const saucerGeometry = new THREE.CylinderGeometry(3, 3, 0.2, 32);
    const saucerMaterial = new THREE.MeshPhongMaterial({ color: 0xFFFFFF });
    const saucer = new THREE.Mesh(saucerGeometry, saucerMaterial);
    saucer.position.y = -2.5; // Position below the cup
    scene.add(saucer);
    
    // Add a handle to the cup
    const handleCurve = new THREE.CubicBezierCurve3(
      new THREE.Vector3(2, 0, 0),
      new THREE.Vector3(3, 0, 0),
      new THREE.Vector3(3, -1, 0),
      new THREE.Vector3(2, -1, 0)
    );
    
    const handleGeometry = new THREE.TubeGeometry(handleCurve, 20, 0.2, 8, false);
    const handleMaterial = new THREE.MeshPhongMaterial({ color: 0xFFFFFF });
    const handle = new THREE.Mesh(handleGeometry, handleMaterial);
    scene.add(handle);
  }
  
  /**
   * Starts the animation loop
   * @param scene The THREE.Scene to animate
   */
  private startAnimationLoop(scene: THREE.Scene): void {
    if (!this.renderer || !this.camera || !this.controls) {
      return;
    }
    
    const animate = () => {
      this.animationFrameId = requestAnimationFrame(animate);
      
      // Update controls
      if (this.controls) {
        this.controls.update();
      }
      
      // Render scene
      if (this.renderer && this.camera) {
        this.renderer.render(scene, this.camera);
      }
    };
    
    animate();
  }

  /**
   * Disposes of all objects in the scene
   * @param scene The THREE.Scene to clean up
   */
  private disposeScene(scene: THREE.Scene): void {
    scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        if (object.geometry) {
          object.geometry.dispose();
        }
        
        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach(material => material.dispose());
          } else {
            object.material.dispose();
          }
        }
      }
    });
  }
}