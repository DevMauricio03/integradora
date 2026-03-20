import { Injectable, computed, inject, signal } from '@angular/core';
import { ProfileService } from './profile.service';

@Injectable({ providedIn: 'root' })
export class AdminUsersStoreService {
    private readonly profileService = inject(ProfileService);

    // Estado interno
    private readonly _users = signal<any[]>([]);
    private readonly _totalCount = signal<number>(0);
    private readonly _isLoading = signal<boolean>(false);
    private readonly _currentPage = signal<number>(0);
    private readonly _filter = signal<string>('todos');
    private readonly _searchTerm = signal<string>('');
    private readonly _pageSize = signal<number>(5);

    // Selectores públicos
    users = this._users.asReadonly();
    totalCount = this._totalCount.asReadonly();
    isLoading = this._isLoading.asReadonly();
    currentPage = this._currentPage.asReadonly();
    filter = this._filter.asReadonly();
    searchTerm = this._searchTerm.asReadonly();
    pageSize = this._pageSize.asReadonly();

    hasMore = computed(() => {
        const loaded = (this._currentPage() + 1) * this._pageSize();
        return loaded < this._totalCount();
    });

    async loadUsers() {
        if (this._isLoading()) return;

        this._isLoading.set(true);
        const { data, count, error } = await this.profileService.getAllUsers({
            page: this._currentPage(),
            pageSize: this._pageSize(),
            filter: this._filter(),
            searchTerm: this._searchTerm()
        });

        if (!error && data) {
            this._users.set(data as any[]);
            this._totalCount.set(count || 0);
        } else {
            console.error('[AdminUsersStore] Error loading users:', error);
        }

        this._isLoading.set(false);
    }

    setFilter(newFilter: string) {
        if (this._filter() === newFilter) return;
        this._filter.set(newFilter);
        this._currentPage.set(0); // reset pagination
        this.loadUsers();
    }

    setSearchTerm(term: string) {
        if (this._searchTerm() === term) return;
        this._searchTerm.set(term);
        this._currentPage.set(0); // reset pagination
        this.loadUsers();
    }

    nextPage() {
        if (this.hasMore()) {
            this._currentPage.update(p => p + 1);
            this.loadUsers();
        }
    }

    prevPage() {
        if (this._currentPage() > 0) {
            this._currentPage.update(p => p - 1);
            this.loadUsers();
        }
    }

    refresh() {
        this.loadUsers();
    }

    invalidate() {
        this._users.set([]);
        this._totalCount.set(0);
        this._isLoading.set(false);
        this._currentPage.set(0);
        this._filter.set('todos');
        this._searchTerm.set('');
    }
}
