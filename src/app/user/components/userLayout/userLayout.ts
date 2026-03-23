import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
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

@Component({
  selector: 'app-user-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, RouterModule, Navbar, IconComponent],
  templateUrl: './userLayout.html',
  styleUrl: './userLayout.css',
  changeDetection: ChangeDetectionStrategy.OnPush,

})
export class UserLayoutComponent {

  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly notificationStore = inject(NotificationStoreService);

  title = signal('');
  showCreateButton = signal(false);
  showSearch = signal(true);
  centerTitle = signal(false);
  isMenuOpen = signal(false);

  // ── Notificaciones ────────────────────────────────────────────
  readonly notificationCount = this.notificationStore.unreadCount;
  readonly hasNotifications = this.notificationStore.hasNotifications;

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
        this.isMenuOpen.set(false); // Cierra el menú al navegar
      });

    // Cargar notificaciones al inicializar
    this.notificationStore.loadNotificaciones().catch(err =>
      console.error('[UserLayout] Error cargando notificaciones:', err)
    );
  }

  toggleMenu() {
    this.isMenuOpen.update(open => !open);
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
}
