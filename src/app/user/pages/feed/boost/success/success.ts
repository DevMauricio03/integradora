import { Component, inject } from '@angular/core';

import { IconComponent } from '../../../../../shared/components/icon/icon.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-success',
  standalone: true,
  imports: [IconComponent],
  templateUrl: './success.html',
  styleUrl: './success.css'
})
export class SuccessComponent {
  private readonly router = inject(Router);

  goToFeed() {
    this.router.navigate(['/user/feed']);
  }
}
