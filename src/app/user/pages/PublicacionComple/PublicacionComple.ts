import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { BoostStoreService } from '../../../core/services/boost-store.service';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-publicacion-comple',
  standalone: true,
  imports: [IconComponent, CommonModule],
  templateUrl: './PublicacionComple.html',
  styleUrls: ['./PublicacionComple.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublicacionComple implements OnInit {
  private readonly router = inject(Router);
  private readonly boostStore = inject(BoostStoreService);
  post = signal<any>(null);

  ngOnInit() {
    const state = globalThis.history.state;
    if (state?.post) {
      this.post.set(state.post);
    }
  }

  irAlInicio() {
    this.router.navigate(['/user/feed']);
  }

  irAImpulso() {
    const postData = this.post();
    if (postData) {
      const mapped = {
        id: postData.id ?? crypto.randomUUID(),

        title: postData.title ?? '',
        content: postData.description ?? '',

        badge: postData.type ?? '',
        type: postData.type ?? '',

        image: postData.image ?? '',
        images: postData.images ?? [],

        category: postData.category ?? '',

        author: 'Tú',
        role: '',
        time: '',

        avatar: '',
        expirationDate: '',
        details: {}
      };

      console.log('[Boost] setPost mapped:', mapped);
      this.boostStore.setPost(mapped);
      console.log('[Boost] selectedPost after set:', this.boostStore.selectedPost());

      this.boostStore.setStep('plan');
      this.router.navigate(['/user/feed/boost/plan-selection']);
    }
  }
}
