import { ChangeDetectionStrategy, Component, OnInit, inject, signal, ViewChild, ElementRef } from '@angular/core';
import { Navbar } from '../../../shared/components/navbar/navbar';
import {
  ActivatedRoute,
  NavigationEnd,
  Router,
  RouterLink,
  RouterLinkActive,
  RouterModule,
  RouterOutlet
} from '@angular/router';

import { filter } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { NotificationStoreService } from '../../../core/services/notification-store.service';
import { PostStoreService } from '../../../core/services/post-store.service';

@Component({
  selector: 'app-user-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, RouterModule, Navbar, IconComponent],
  templateUrl: './userLayout.html',
  styleUrl: './userLayout.css',
  changeDetection: ChangeDetectionStrategy.OnPush,

})
export class UserLayoutComponent implements OnInit {

  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly notificationStore = inject(NotificationStoreService);
  readonly postStore = inject(PostStoreService);

  title = signal('');
  showCreateButton = signal(false);
  showSearch = signal(true);
  centerTitle = signal(false);
  isMenuOpen = signal(false);
  mobileSearchOpen = signal(false);

  // ── Notificaciones ────────────────────────────────────────────
  // Reactive signal - OnPush detects changes automatically
  readonly notificationCount = this.notificationStore.unreadCount;

  constructor() {
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        takeUntilDestroyed()
      )
      .subscribe(() => {
        const route = this.getDeepestChild(this.route);
        const data = route.snapshot.data;

        this.title.set(data['title'] || '');
        this.showCreateButton.set(data['showCreateButton'] || false);
        this.showSearch.set(data['hideSearch'] !== true);
        this.centerTitle.set(data['centerTitle'] === true);
        this.isMenuOpen.set(false);
        this.mobileSearchOpen.set(false);
      });
  }

  ngOnInit() {
    // ── Cargar notificaciones al inicializar el componente ────────
    this.notificationStore.loadNotificaciones().catch(err =>
      console.error('[UserLayout] Error cargando notificaciones:', err)
    );
  }

  toggleMenu() {
    this.isMenuOpen.update(open => !open);
  }

  toggleMobileSearch() {
    const opening = !this.mobileSearchOpen();
    this.mobileSearchOpen.set(opening);
    if (!opening) {
      this.postStore.searchQuery.set('');
    }
  }

  onSearch(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.postStore.searchQuery.set(value);
  }

  private getDeepestChild(route: ActivatedRoute): ActivatedRoute {
    while (route.firstChild) {
      route = route.firstChild;
    }
    return route;
  }

  goToCreate() {
    this.router.navigate(['/user/crear']);
  }

  async onInicioClick(event: Event) {
    if (this.router.url === '/user/feed') {
      event.preventDefault();
      
      // Close mobile menu if it is open
      this.isMenuOpen.set(false);

      // Wait for feed data to finish loading
      await this.postStore.loadFeed(true);

      // Wait for Angular to complete DOM re-render the new data using double rAF
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          // The window is the real scroll container, not the <main> element
          window.scrollTo({ top: 0, behavior: 'smooth' });
        });
      });
    }
  }
}
