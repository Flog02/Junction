// src/app/core/services/coffee-viz.service.ts

import { Injectable } from '@angular/core';
import { getStorage, ref, getDownloadURL } from '@angular/fire/storage';
import { Observable, from, forkJoin, of } from 'rxjs';
import { map, switchMap, catchError } from 'rxjs/operators';
import { OrderItem } from '../models/order.model';

// Declare THREE namespace to avoid import errors
declare const THREE: any;
declare const GLTFLoader: any;
declare const OrbitControls: any;

@Injectable({
  providedIn: 'root'
})
export class CoffeeVizService {
  private storage = getStorage();
  private modelCache = new Map<string, any>(); // Cache for loaded models
  
  constructor() {}
  
  /**
   * Creates a 3D visualization of a coffee based on order details
   * Note: Requires THREE.js to be loaded globally
   */
  createCoffeeVisualization(
    containerId: string,
    orderItem: OrderItem
  ): Observable<any> {
    // Ensure THREE.js is available
    if (typeof THREE === 'undefined') {
      console.error('THREE.js is not available. Make sure it is loaded before using this service.');
      return of(null);
    }
    
    // Create scene, camera, renderer
    const { scene, camera, renderer, controls } = this.setupScene(containerId);
    
    // Add lighting
    this.addLighting(scene);
    
    // Create the model paths to load based on the order
    const modelPaths = this.getModelPathsFromOrder(orderItem);
    
    // Load the models
    return this.loadModels(modelPaths).pipe(
      map(models => {
        // Add models to the scene
        models.forEach(model => {
          if (model) {
            scene.add(model);
          }
        });
        
        // Set camera position based on the models
        this.positionCamera(camera, scene, controls);
        
        // Start animation loop
        this.animate(scene, camera, renderer, controls);
        
        return scene;
      })
    );
  }
  
  /**
   * Sets up the 3D scene with renderer and camera
   */
  private setupScene(containerId: string): { 
    scene: any; 
    camera: any; 
    renderer: any;
    controls: any;
  } {
    // Get the container element
    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(`Container with ID "${containerId}" not found`);
    }
    
    // Get container dimensions
    const width = container.clientWidth;
    const height = container.clientHeight;
    
    // Create scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0); // Light gray background
    
    // Create camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 5, 10);
    
    // Create renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    
    // Clear container and add renderer
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    
    // Add orbit controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 3;
    controls.maxDistance = 20;
    
    // Handle window resize
    window.addEventListener('resize', () => {
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      
      renderer.setSize(newWidth, newHeight);
    });
    
    return { scene, camera, renderer, controls };
  }
  
  /**
   * Adds lighting to the scene
   */
  private addLighting(scene: any): void {
    // Ambient light for overall illumination
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    
    // Directional light for shadows
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 7.5);
    directionalLight.castShadow = true;
    
    // Adjust shadow properties
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 50;
    directionalLight.shadow.camera.left = -10;
    directionalLight.shadow.camera.right = 10;
    directionalLight.shadow.camera.top = 10;
    directionalLight.shadow.camera.bottom = -10;
    
    scene.add(directionalLight);
    
    // Add a point light to simulate glow from inside the cup
    const pointLight = new THREE.PointLight(0xffa500, 0.5, 10);
    pointLight.position.set(0, 2, 0);
    scene.add(pointLight);
  }
  
  /**
   * Gets model paths based on order item details
   */
  private getModelPathsFromOrder(orderItem: OrderItem): string[] {
    const modelPaths = [];
    
    // Base cup model based on size
    const sizeId = orderItem.customizations.size.id;
    let cupSize = 'medium';
    
    if (sizeId.includes('small')) {
      cupSize = 'small';
    } else if (sizeId.includes('large')) {
      cupSize = 'large';
    }
    
    modelPaths.push(`3d-models/coffee-cups/${cupSize}.glb`);
    
    // Coffee type model
    let coffeeType = 'latte'; // Default
    
    // Map common coffee types to models
    if (orderItem.name.toLowerCase().includes('espresso')) {
      coffeeType = 'espresso';
    } else if (orderItem.name.toLowerCase().includes('cappuccino')) {
      coffeeType = 'cappuccino';
    } else if (orderItem.name.toLowerCase().includes('americano')) {
      coffeeType = 'americano';
    }
    
    modelPaths.push(`3d-models/coffee-types/${coffeeType}.glb`);
    
    // Add toppings if any
    if (orderItem.customizations.toppings && orderItem.customizations.toppings.length > 0) {
      orderItem.customizations.toppings.forEach(topping => {
        if (topping.name.toLowerCase().includes('whipped')) {
          modelPaths.push('3d-models/toppings/whipped-cream.glb');
        } else if (topping.name.toLowerCase().includes('chocolate')) {
          modelPaths.push('3d-models/toppings/chocolate.glb');
        }
        // Add more mappings as needed
      });
    }
    
    return modelPaths;
  }
  
  /**
   * Loads 3D models from Firebase Storage
   */
  private loadModels(modelPaths: string[]): Observable<any[]> {
    // Ensure GLTFLoader is available
    if (typeof GLTFLoader === 'undefined') {
      console.error('GLTFLoader is not available. Make sure THREE.js is properly loaded.');
      return of([]);
    }
    
    const loader = new GLTFLoader();
    
    // If no models to load, return an empty array
    if (modelPaths.length === 0) {
      return of([]);
    }
    
    // Load each model
    const modelObservables = modelPaths.map(path => {
      // Check cache first
      if (this.modelCache.has(path)) {
        // Return a clone of the cached model
        return of(this.modelCache.get(path)?.clone());
      }
      
      // Get download URL from Firebase Storage
      return from(getDownloadURL(ref(this.storage, path))).pipe(
        switchMap(url => {
          // Load the model
          return new Observable<any>(observer => {
            loader.load(
              url,
              (gltf:any) => {
                const model = gltf.scene;
                
                // Setup the model
                model.traverse((child:any) => {
                  if ((child as any).isMesh) {
                    const mesh = child as any;
                    mesh.castShadow = true;
                    mesh.receiveShadow = true;
                    
                    // Check if material needs transparency
                    if (
                      path.includes('whipped-cream') || 
                      path.includes('latte') ||
                      path.includes('cappuccino')
                    ) {
                      if (Array.isArray(mesh.material)) {
                        mesh.material.forEach((mat: any) => {
                          mat.transparent = true;
                          mat.opacity = 0.85;
                        });
                      } else if (mesh.material) {
                        mesh.material.transparent = true;
                        mesh.material.opacity = 0.85;
                      }
                    }
                  }
                });
                
                // Cache the original model
                this.modelCache.set(path, model.clone());
                
                observer.next(model);
                observer.complete();
              },
              undefined,
              (error:any) => {
                console.error(`Error loading model ${path}:`, error);
                observer.error(error);
              }
            );
          });
        }),
        catchError(error => {
          console.error(`Failed to load model ${path}:`, error);
          return of(null); // Return null for failed models
        })
      );
    });
    
    // Return all models loaded
    return forkJoin(modelObservables);
  }
  
  /**
   * Positions the camera to properly view all models in the scene
   */
  private positionCamera(
    camera: any,
    scene: any,
    controls: any
  ): void {
    // Create a bounding box for all objects in the scene
    const box = new THREE.Box3().setFromObject(scene);
    const center = new THREE.Vector3();
    const size = new THREE.Vector3();
    
    box.getCenter(center);
    box.getSize(size);
    
    // Calculate the distance based on the size of the objects
    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = camera.fov * (Math.PI / 180);
    const distance = (maxDim / 2) / Math.tan(fov / 2);
    
    // Set camera position and target
    camera.position.set(center.x, center.y + maxDim * 0.5, center.z + distance * 1.2);
    controls.target.copy(center);
    
    // Update camera and controls
    camera.updateProjectionMatrix();
    controls.update();
  }
  
  /**
   * Animation loop
   */
  private animate(
    scene: any,
    camera: any,
    renderer: any,
    controls: any
  ): void {
    // Start the animation loop
    const animationId = requestAnimationFrame(() => 
      this.animate(scene, camera, renderer, controls)
    );
    
    // Update controls
    controls.update();
    
    // Render the scene
    renderer.render(scene, camera);
    
    // Store the animation ID on the scene object for cleanup
    scene.animationId = animationId;
  }
  
  /**
   * Cleans up the scene and stops animation
   */
  cleanupScene(scene: any): void {
    // Cancel animation frame
    if (scene.animationId) {
      cancelAnimationFrame(scene.animationId);
    }
    
    // Dispose of objects in the scene
    scene.traverse((object: any) => {
      if (object.isMesh) {
        const mesh = object;
        if (mesh.geometry) {
          mesh.geometry.dispose();
        }
        
        if (mesh.material) {
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach((material: any) => material.dispose());
          } else {
            mesh.material.dispose();
          }
        }
      }
    });
    
    // Clear the scene
    while (scene.children.length > 0) {
      scene.remove(scene.children[0]);
    }
  }
}