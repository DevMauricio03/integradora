import { Injectable, inject } from '@angular/core';
import { PublicationService } from '../../core/services/publication.service';

/**
 * Layer 3 – Feature Service: Publicaciones (Admin).
 * Ya no accede al cliente raw de Supabase.
 * Delega a PublicationService del core.
 */
@Injectable({ providedIn: 'root' })
export class AdminPublicationService {
    private readonly publicationService = inject(PublicationService);

    async getPublications(filters?: { type?: string; status?: string; search?: string }) {
        return this.publicationService.getPublications(filters);
    }

    async updatePublicationStatus(id: string, status: string) {
        return this.publicationService.updatePostStatus(id, status);
    }
}
