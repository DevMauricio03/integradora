import { ChangeDetectionStrategy, Component, inject, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PostStoreService } from '../../../core/services/post-store.service';
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

    // Filtramos los posts para mostrar solo los de tipo aviso oficial
    posts = computed(() =>
        this.postStore.posts().filter(post =>
            post.type.toLowerCase() === 'aviso oficial'
        )
    );

    ngOnInit() {
        this.postStore.loadFeed();
    }
}
