import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  IonHeader, 
  IonToolbar, 
  IonTitle,
  IonContent,
  IonButton,
  IonIcon,
  IonList,
  IonItem,
  IonLabel,
  IonBadge,
  ModalController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  trophyOutline, 
  checkmarkCircleOutline, 
  closeOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-tier-benefits-modal',
  templateUrl: './tier-benefits-modal.component.html',
  styleUrls: ['./tier-benefits-modal.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonIcon,
    IonList,
    IonItem,
    IonLabel,
    IonBadge
  ]
})
export class TierBenefitsModalComponent implements OnInit {
  @Input() tier: any;
  
  constructor(private modalController: ModalController) {
    addIcons({
      trophyOutline,
      checkmarkCircleOutline,
      closeOutline
    });
  }
  
  ngOnInit() {}
  
  /**
   * Close the modal
   */
  close() {
    this.modalController.dismiss();
  }
  
  /**
   * Helper to capitalize first letter
   */
  capitalizeFirstLetter(string: string): string {
    if (!string) return '';
    return string.charAt(0).toUpperCase() + string.slice(1);
  }
  
  /**
   * Get tier color class based on tier name
   */
  getTierColorClass(tierName: string): string {
    if (!tierName) return 'tier-bronze';
    return `tier-${tierName.toLowerCase()}`;
  }
}