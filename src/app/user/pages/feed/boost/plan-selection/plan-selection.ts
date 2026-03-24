import { Component, inject } from '@angular/core';

import { IconComponent } from '../../../../../shared/components/icon/icon.component';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { BoostStoreService, BoostPlanType } from '../../../../../core/services/boost-store.service';

@Component({
  selector: 'app-plan-selection',
  standalone: true,
  imports: [IconComponent, CommonModule],
  templateUrl: './plan-selection.html',
  styleUrl: './plan-selection.css'
})
export class PlanSelectionComponent {
  private readonly router = inject(Router);
  public readonly boostStore = inject(BoostStoreService);

  selectPlan(plan: BoostPlanType) {
    this.boostStore.setPlan(plan);
  }

  goToPayment() {
    if (this.boostStore.isReadyForPayment()) {
      this.boostStore.setStep('payment');
      this.router.navigate(['/user/feed/boost/payment']);
    }
  }

  cancel() {
    this.router.navigate(['/user/feed']);
  }
}
