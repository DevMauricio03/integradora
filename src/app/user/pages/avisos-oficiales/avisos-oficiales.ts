import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PostStoreService, Post } from '../../../core/services/post-store.service';
import { PostCardComponent } from "../../../shared/components/Post-card/post-card/post-card";
import { IconComponent } from '../../../shared/components/icon/icon.component';

@Component({
    selector: 'app-avisos-oficiales',
    standalone: true,
    imports: [CommonModule, PostCardComponent, IconComponent],
    templateUrl: './avisos-oficiales.html',
    styleUrls: ['./avisos-oficiales.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AvisosOficiales implements OnInit {
    private readonly postStore = inject(PostStoreService);

    readonly posts = signal<Post[]>([]);
    readonly isLoading = signal(true);

    async ngOnInit() {
        this.isLoading.set(true);
        try {
            const result = await this.postStore.getAvisosOficiales();
            this.posts.set(result);
        } finally {
            this.isLoading.set(false);
        }
    }
}
