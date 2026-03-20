import { Injectable, computed, inject, signal } from '@angular/core';
import { PublicationService } from './publication.service';

@Injectable({ providedIn: 'root' })
export class AdminPublicationsStoreService {
    private readonly pubService = inject(PublicationService);

    private readonly _items = signal<any[]>([]);
    private readonly _totalCount = signal<number>(0);
    private readonly _isLoading = signal<boolean>(false);
    private readonly _currentPage = signal<number>(0);
    private readonly _typeFilter = signal<string>('todos');
    private readonly _statusFilter = signal<string>('todos');
    private readonly _searchTerm = signal<string>('');
    private readonly _pageSize = signal<number>(5);

    items = this._items.asReadonly();
    totalCount = this._totalCount.asReadonly();
    isLoading = this._isLoading.asReadonly();
    currentPage = this._currentPage.asReadonly();
    typeFilter = this._typeFilter.asReadonly();
    statusFilter = this._statusFilter.asReadonly();
    searchTerm = this._searchTerm.asReadonly();
    pageSize = this._pageSize.asReadonly();

    hasMore = computed(() => {
        const loaded = (this._currentPage() + 1) * this._pageSize();
        return loaded < this._totalCount();
    });

    async loadPublications() {
        if (this._isLoading()) return;

        this._isLoading.set(true);
        const { data, count, error } = await this.pubService.getPublications({
            page: this._currentPage(),
            pageSize: this._pageSize(),
            type: this._typeFilter(),
            status: this._statusFilter(),
            searchTerm: this._searchTerm()
        });

        if (!error && data) {
            this._items.set(data);
            this._totalCount.set(count || 0);
        } else {
            console.error('[AdminPublicationsStore] Error:', error);
        }

        this._isLoading.set(false);
    }

    setTypeFilter(newType: string) {
        if (this._typeFilter() === newType) return;
        this._typeFilter.set(newType);
        this._currentPage.set(0);
        this.loadPublications();
    }

    setStatusFilter(newStatus: string) {
        if (this._statusFilter() === newStatus) return;
        this._statusFilter.set(newStatus);
        this._currentPage.set(0);
        this.loadPublications();
    }

    setSearchTerm(term: string) {
        if (this._searchTerm() === term) return;
        this._searchTerm.set(term);
        this._currentPage.set(0);
        this.loadPublications();
    }

    nextPage() {
        if (this.hasMore()) {
            this._currentPage.update(p => p + 1);
            this.loadPublications();
        }
    }

    prevPage() {
        if (this._currentPage() > 0) {
            this._currentPage.update(p => p - 1);
            this.loadPublications();
        }
    }

    refresh() {
        this.loadPublications();
    }

    invalidate() {
        this._items.set([]);
        this._totalCount.set(0);
        this._isLoading.set(false);
        this._currentPage.set(0);
        this._typeFilter.set('todos');
        this._statusFilter.set('todos');
        this._searchTerm.set('');
    }
}
