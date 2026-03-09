import { Injectable, computed, inject, signal } from '@angular/core';
import { ReportService } from './report.service';

@Injectable({ providedIn: 'root' })
export class AdminReportsStoreService {
    private readonly reportService = inject(ReportService);

    private readonly _items = signal<any[]>([]);
    private readonly _totalCount = signal<number>(0);
    private readonly _isLoading = signal<boolean>(false);
    private readonly _currentPage = signal<number>(0);
    private readonly _filter = signal<string>('todas');
    private readonly _searchTerm = signal<string>('');
    private readonly _pageSize = signal<number>(5);

    items = this._items.asReadonly();
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

    async loadReports() {
        if (this._isLoading()) return;

        this._isLoading.set(true);
        const { data, count, error } = await this.reportService.getReportsList({
            page: this._currentPage(),
            pageSize: this._pageSize(),
            filter: this._filter(),
            searchTerm: this._searchTerm()
        });

        if (!error && data) {
            this._items.set(data);
            this._totalCount.set(count || 0);
        } else {
            console.error('[AdminReportsStore] Error:', error);
        }

        this._isLoading.set(false);
    }

    setFilter(newFilter: string) {
        if (this._filter() === newFilter) return;
        this._filter.set(newFilter);
        this._currentPage.set(0);
        this.loadReports();
    }

    setSearchTerm(term: string) {
        if (this._searchTerm() === term) return;
        this._searchTerm.set(term);
        this._currentPage.set(0);
        this.loadReports();
    }

    nextPage() {
        if (this.hasMore()) {
            this._currentPage.update(p => p + 1);
            this.loadReports();
        }
    }

    prevPage() {
        if (this._currentPage() > 0) {
            this._currentPage.update(p => p - 1);
            this.loadReports();
        }
    }

    refresh() {
        this.loadReports();
    }
}
