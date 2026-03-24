import { Component, inject } from '@angular/core';

import { IconComponent } from '../../../../../shared/components/icon/icon.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [IconComponent],
  templateUrl: './payment.html',
  styleUrl: './payment.css'
})
export class PaymentComponent {
  private readonly router = inject(Router);

  confirmPayment() {
    this.router.navigate(['/user/feed/boost/success']);
  }

  goBack() {
    this.router.navigate(['/user/feed/boost/plan-selection']);
  }
}
