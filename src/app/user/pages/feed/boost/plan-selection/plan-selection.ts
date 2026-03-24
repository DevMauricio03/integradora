import { Component, inject } from '@angular/core';

import { IconComponent } from '../../../../../shared/components/icon/icon.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-plan-selection',
  standalone: true,
  imports: [IconComponent],
  templateUrl: './plan-selection.html',
  styleUrl: './plan-selection.css'
})
export class PlanSelectionComponent {
  private readonly router = inject(Router);

  goToPayment() {
    this.router.navigate(['/user/feed/boost/payment']);
  }
}
