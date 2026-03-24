import { Component, inject, signal } from '@angular/core';

import { IconComponent } from '../../../../../shared/components/icon/icon.component';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { BoostStoreService } from '../../../../../core/services/boost-store.service';
import { ModalBase } from '../../../../../shared/components/modalBase/modalBase';
import { PostCardComponent } from '../../../../../shared/components/Post-card/post-card/post-card';

@Component({
  selector: 'app-success',
  standalone: true,
  imports: [IconComponent, CommonModule, ModalBase, PostCardComponent],
  templateUrl: './success.html',
  styleUrl: './success.css'
})
export class SuccessComponent {
  private readonly router = inject(Router);
  public readonly boostStore = inject(BoostStoreService);

  showPreview = signal(false);

  openPreview() {
    console.log('[Boost Success] selectedPost at modal open:', this.boostStore.selectedPost());
    this.showPreview.set(true);
  }

  goToFeed() {
    this.boostStore.reset();
    this.router.navigate(['/user/feed']);
  }
}
